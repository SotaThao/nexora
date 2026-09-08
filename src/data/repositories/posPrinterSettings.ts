/**
 * posPrinterSettingsRepository — the device's printer profile, receipt options, and the print job
 * currently in flight.
 *
 * Unlike every other repository here, this one talks to `storage` rather than `httpClient`: there
 * is no printer endpoint, and the connection half genuinely should not have one — the printer is
 * attached to a single iPad, so a business-level setting would have the front desk printing to
 * whatever the back office paired last. No `businessId` param, for the same reason.
 *
 * It is deliberately synchronous. `posBookingSettings.ts` returns promises because HTTP is async;
 * device storage is not, and the print transport (not a React caller) needs the profile at the
 * moment it fires. Wrapping these in promises would be ceremony with no payoff.
 *
 * This is the only place that parses or clamps these values. Components read them through
 * `usePosPrinterSettings`, which keeps the "no storage access from components" boundary intact —
 * and keeps normalization in one testable place, since anything stored here may have been written
 * by an older build or hand-edited in devtools.
 *
 * Note it does NOT go through `data/adapters/storageAdapter.ts`: ARCHITECTURE.md marks that as a
 * legacy seam to be removed, not a boundary to extend.
 */
import {
  DEFAULT_POS_RECEIPT_SETTINGS,
  DEFAULT_RECEIPT_PAPER_WIDTH_DOTS,
  POS_PRINTER_PROFILE_STORAGE_KEY,
  POS_PRINT_JOB_STORAGE_KEY,
  POS_RECEIPT_SETTINGS_STORAGE_KEY,
  POS_TICKET_PRINT_HISTORY_STORAGE_KEY,
  PosPrintTransport,
  RECEIPT_COPIES_MAX,
  RECEIPT_COPIES_MIN,
  RECEIPT_PAPER_WIDTH_DOTS,
} from '../../constants/posPrinter'
import type { PosPrintTransportType } from '../../constants/posPrinter'
import type {
  PosPendingPrintJob,
  PosPrinterProfile,
  PosReceiptSettings,
} from '../../types/repositories'
import { storage } from '../../utils/storage'
import { logger } from '../../utils/logger'

/** The slice of `storage` this repository needs — injectable so tests do not lean on jsdom. */
export interface PosPrinterDeviceStore {
  getItem: (key: string) => string | null
  setItem: (key: string, value: string) => void
  removeItem: (key: string) => void
}

/** Must match PosReceiptDocument.version. A job stored by another build is discarded. */
const RECEIPT_DOCUMENT_VERSION = 1

const PAPER_WIDTH_VALUES: number[] = Object.values(RECEIPT_PAPER_WIDTH_DOTS)

export const DEFAULT_POS_PRINTER_PROFILE: PosPrinterProfile = {
  // Browser, not PassPRNT: the pre-existing print path stays the default, so nothing changes for
  // an existing device until someone deliberately pairs a Star printer on /pos/printer.
  transport: PosPrintTransport.Browser,
  paperWidthDots: DEFAULT_RECEIPT_PAPER_WIDTH_DOTS,
  lastTestAt: null,
  lastTestCode: null,
}

function readJson(store: PosPrinterDeviceStore, key: string): unknown {
  const raw = store.getItem(key)
  if (raw === null) return null
  try {
    return JSON.parse(raw)
  } catch (error) {
    logger.error('[posPrinterSettings] could not parse stored value, using defaults', key, error)
    return null
  }
}

function writeJson(store: PosPrinterDeviceStore, key: string, value: unknown): void {
  try {
    store.setItem(key, JSON.stringify(value))
  } catch (error) {
    // Private browsing and a full quota both throw here. Losing a preference is survivable;
    // taking the checkout screen down with it is not.
    logger.error('[posPrinterSettings] could not persist value', key, error)
  }
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {}
}

function normalizeTransport(value: unknown): PosPrintTransportType {
  return value === PosPrintTransport.PassPrnt || value === PosPrintTransport.Browser
    ? value
    : DEFAULT_POS_PRINTER_PROFILE.transport
}

function normalizePaperWidth(value: unknown): number {
  return typeof value === 'number' && PAPER_WIDTH_VALUES.includes(value)
    ? value
    : DEFAULT_RECEIPT_PAPER_WIDTH_DOTS
}

/** 0..3. Anything unparseable falls back rather than printing a surprising number of receipts. */
export function clampReceiptCopies(value: unknown, fallback: number): number {
  // Guard the type before coercing: Number(null), Number('') and Number([]) are all 0, so a
  // missing value would silently become "print no receipts" instead of falling back.
  const parsed =
    typeof value === 'number'
      ? value
      : typeof value === 'string' && value.trim() !== ''
        ? Number(value)
        : Number.NaN
  if (!Number.isFinite(parsed)) return fallback
  return Math.max(RECEIPT_COPIES_MIN, Math.min(RECEIPT_COPIES_MAX, Math.round(parsed)))
}

function normalizeBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback
}

function normalizeNullableString(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null
}

export function normalizePosPrinterProfile(value: unknown): PosPrinterProfile {
  const raw = asRecord(value)
  return {
    transport: normalizeTransport(raw.transport),
    paperWidthDots: normalizePaperWidth(raw.paperWidthDots),
    lastTestAt: normalizeNullableString(raw.lastTestAt),
    lastTestCode: normalizeNullableString(raw.lastTestCode),
  }
}

export function normalizePosReceiptSettings(value: unknown): PosReceiptSettings {
  const raw = asRecord(value)
  return {
    printProducts: normalizeBoolean(raw.printProducts, DEFAULT_POS_RECEIPT_SETTINGS.printProducts),
    sortServices: normalizeBoolean(raw.sortServices, DEFAULT_POS_RECEIPT_SETTINGS.sortServices),
    cardCopies: clampReceiptCopies(raw.cardCopies, DEFAULT_POS_RECEIPT_SETTINGS.cardCopies),
    otherCopies: clampReceiptCopies(raw.otherCopies, DEFAULT_POS_RECEIPT_SETTINGS.otherCopies),
  }
}

/**
 * A stored job is only usable if it still describes work to do and carries a document this build
 * understands. Anything else is treated as absent, so a half-written or stale-shaped job can never
 * make the app fire a print it cannot render.
 */
export function normalizePendingPrintJob(value: unknown): PosPendingPrintJob | null {
  const raw = asRecord(value)
  if (typeof raw.jobId !== 'string' || !raw.jobId) return null
  if (raw.kind !== 'receipt' && raw.kind !== 'testPrint') return null
  if (typeof raw.createdAt !== 'string' || !raw.createdAt) return null

  const copiesTotal = Number(raw.copiesTotal)
  const copiesDone = Number(raw.copiesDone)
  if (!Number.isFinite(copiesTotal) || !Number.isFinite(copiesDone)) return null
  if (copiesTotal < 1 || copiesDone < 0 || copiesDone > copiesTotal) return null

  const document = asRecord(raw.document)
  const hasDocument = Object.keys(document).length > 0
  if (hasDocument && document.version !== RECEIPT_DOCUMENT_VERSION) return null
  if (raw.kind === 'receipt' && !hasDocument) return null

  const firedAttempts = Number(raw.firedAttempts)
  const ticketPrint = asRecord(raw.ticketPrint)

  return {
    jobId: raw.jobId,
    kind: raw.kind,
    createdAt: raw.createdAt,
    copiesTotal: Math.round(copiesTotal),
    copiesDone: Math.round(copiesDone),
    firedAttempts: Number.isFinite(firedAttempts) ? Math.max(0, Math.round(firedAttempts)) : 0,
    document: hasDocument ? (raw.document as PosPendingPrintJob['document']) : null,
    restore: (raw.restore ?? null) as PosPendingPrintJob['restore'],
    ...(typeof ticketPrint.businessId === 'string' && ticketPrint.businessId
      && typeof ticketPrint.orderId === 'string' && ticketPrint.orderId
      ? { ticketPrint: { businessId: ticketPrint.businessId, orderId: ticketPrint.orderId } }
      : {}),
  }
}

export function createPosPrinterSettingsRepository(
  store: PosPrinterDeviceStore = storage,
) {
  return {
    wasTicketPrinted(ticket: NonNullable<PosPendingPrintJob['ticketPrint']>): boolean {
      const history = asRecord(readJson(store, POS_TICKET_PRINT_HISTORY_STORAGE_KEY))
      return history[JSON.stringify([ticket.businessId, ticket.orderId])] === true
    },

    markTicketPrinted(ticket: NonNullable<PosPendingPrintJob['ticketPrint']>): void {
      if (!ticket.businessId || !ticket.orderId) return
      const history = asRecord(readJson(store, POS_TICKET_PRINT_HISTORY_STORAGE_KEY))
      history[JSON.stringify([ticket.businessId, ticket.orderId])] = true
      writeJson(store, POS_TICKET_PRINT_HISTORY_STORAGE_KEY, history)
    },

    getPrinterProfile(): PosPrinterProfile {
      return normalizePosPrinterProfile(readJson(store, POS_PRINTER_PROFILE_STORAGE_KEY))
    },

    /** Merges into the stored profile — callers update one field (a test result) at a time. */
    savePrinterProfile(patch: Partial<PosPrinterProfile>): PosPrinterProfile {
      const current = normalizePosPrinterProfile(
        readJson(store, POS_PRINTER_PROFILE_STORAGE_KEY),
      )
      const next = normalizePosPrinterProfile({ ...current, ...patch })
      writeJson(store, POS_PRINTER_PROFILE_STORAGE_KEY, next)
      return next
    },

    getReceiptSettings(): PosReceiptSettings {
      return normalizePosReceiptSettings(readJson(store, POS_RECEIPT_SETTINGS_STORAGE_KEY))
    },

    saveReceiptSettings(next: PosReceiptSettings): PosReceiptSettings {
      const normalized = normalizePosReceiptSettings(next)
      writeJson(store, POS_RECEIPT_SETTINGS_STORAGE_KEY, normalized)
      return normalized
    },

    getPendingPrintJob(): PosPendingPrintJob | null {
      return normalizePendingPrintJob(readJson(store, POS_PRINT_JOB_STORAGE_KEY))
    },

    savePendingPrintJob(job: PosPendingPrintJob): void {
      writeJson(store, POS_PRINT_JOB_STORAGE_KEY, job)
    },

    clearPendingPrintJob(): void {
      try {
        store.removeItem(POS_PRINT_JOB_STORAGE_KEY)
      } catch (error) {
        logger.error('[posPrinterSettings] could not clear the pending print job', error)
      }
    },
  }
}

export const posPrinterSettingsRepository = createPosPrinterSettingsRepository()
export default posPrinterSettingsRepository
