/**
 * taxiqTaxRemindersRepository — API implementation for US-08 (Tax Payment Reminders).
 * Mirrors taxiqOwnerAssets.ts. Backend (US-15, TaxPaymentReminderController) exposes
 * Create + List + MarkPaid + Snooze — no Update/Delete endpoints.
 */
import httpClient from '../../lib/httpClient'

type HttpClient = typeof httpClient

export const TAX_RELATED_TAX_TYPES = ['SalesTax', 'FranchiseTax', 'EstimatedTax', 'PayrollTax'] as const
export type TaxReminderTaxType = (typeof TAX_RELATED_TAX_TYPES)[number]

export interface TaxPaymentReminderApiDto {
  id: string
  ownerTaxYearId: string
  taxType: string
  dueDate: string
  status: string
  isOverdue: boolean
  snoozeCount: number
  snoozedUntil?: string | null
  paymentProofReceiptId?: string | null
  createdAt: string
  lastModified?: string | null
}

export interface TaxPaymentReminder {
  id: string
  ownerTaxYearId: string
  taxType: string
  dueDate: string
  status: string
  isOverdue: boolean
  snoozeCount: number
  snoozedUntil: string | null
  paymentProofReceiptId: string | null
  createdAt: string
  lastModified: string | null
}

export interface CreateTaxReminderParams {
  ownerTaxYearId: string
  taxType: TaxReminderTaxType
  dueDate: string
}

export interface MarkTaxReminderPaidParams {
  reminderId: string
  paymentProofReceiptId?: string | null
}

export interface SnoozeTaxReminderParams {
  reminderId: string
  snoozeDays: number
}

function normalizeTaxPaymentReminder(dto: TaxPaymentReminderApiDto): TaxPaymentReminder {
  return {
    id: dto.id,
    ownerTaxYearId: dto.ownerTaxYearId,
    taxType: dto.taxType,
    dueDate: dto.dueDate,
    status: dto.status,
    isOverdue: dto.isOverdue,
    snoozeCount: dto.snoozeCount,
    snoozedUntil: dto.snoozedUntil ?? null,
    paymentProofReceiptId: dto.paymentProofReceiptId ?? null,
    createdAt: dto.createdAt,
    lastModified: dto.lastModified ?? null,
  }
}

export function createTaxiqTaxRemindersRepository(client: HttpClient = httpClient) {
  return {
    async list(ownerTaxYearId: string): Promise<TaxPaymentReminder[]> {
      const data = await client.get<TaxPaymentReminderApiDto[]>(
        `/api/v1/taxiq/owner/tax-reminders?ownerTaxYearId=${encodeURIComponent(ownerTaxYearId)}`,
      )
      return (data ?? []).map(normalizeTaxPaymentReminder)
    },

    async create(params: CreateTaxReminderParams): Promise<string> {
      return await client.post<string>('/api/v1/taxiq/owner/tax-reminders', {
        ownerTaxYearId: params.ownerTaxYearId,
        taxType: params.taxType,
        dueDate: params.dueDate,
      })
    },

    async markPaid(params: MarkTaxReminderPaidParams): Promise<void> {
      await client.post<void>(`/api/v1/taxiq/owner/tax-reminders/${encodeURIComponent(params.reminderId)}/mark-paid`, {
        paymentProofReceiptId: params.paymentProofReceiptId ?? null,
      })
    },

    async snooze(params: SnoozeTaxReminderParams): Promise<void> {
      await client.post<void>(`/api/v1/taxiq/owner/tax-reminders/${encodeURIComponent(params.reminderId)}/snooze`, {
        snoozeDays: params.snoozeDays,
      })
    },
  }
}

export const taxiqTaxRemindersRepository = createTaxiqTaxRemindersRepository()
export default taxiqTaxRemindersRepository
