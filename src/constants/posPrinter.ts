/**
 * POS receipt printing — transport, Star PassPRNT protocol values, and device-local storage keys.
 *
 * Two print paths exist and the operator picks one per device on /pos/printer:
 *
 * - `PassPrnt` hands the receipt to the Star PassPRNT companion app over a URL scheme. It is the
 *   only way to reach a thermal printer from a web app here: this repo has no native shell to host
 *   the Star SDK (`ios/`+`android/` are dead Capacitor leftovers), so a real one-tap print has to
 *   leave the browser and come back.
 * - `Browser` is `window.print()` — the pre-existing behaviour, kept as the fallback for desktops,
 *   non-Star printers, and any PassPRNT failure.
 *
 * Everything the scheme accepts is spelled out here rather than inline at the call site, because a
 * wrong value fails as blank paper rather than as an error: `size` is in printer DOTS (a plausible
 * `size=80` silently prints a 10mm-wide sliver), and the callback arrives as a bare numeric string
 * in the URL. Verified against the Star PassPRNT Users Manual (iOS, Data Specifications) and the
 * official `star-micronics/star-passprnt-sdk-web` sample.
 */

/** Which path a print takes. Chosen explicitly by the operator — iOS gives the web no way to
 *  detect whether the PassPRNT app is installed, so an auto-detect would be a guess. */
export const PosPrintTransport = {
  PassPrnt: 'passprnt',
  Browser: 'browser',
} as const

export type PosPrintTransportType =
  (typeof PosPrintTransport)[keyof typeof PosPrintTransport]

export const PASSPRNT_PRINT_PATH = 'starpassprnt://v1/print/nopreview'
export const PASSPRNT_APP_STORE_URL = 'https://apps.apple.com/us/app/star-passprnt/id979827520'

/** PassPRNT returns to the `back` URL with these two query params appended. */
export const PASSPRNT_CODE_PARAM = 'passprnt_code'
export const PASSPRNT_MESSAGE_PARAM = 'passprnt_message'

/**
 * Result codes PassPRNT reports on the callback. Strings, not numbers — they arrive as raw query
 * values. Only the codes reachable from this integration are listed; anything else falls back to a
 * generic message (see `getPassPrntErrorI18nKey`).
 */
export const PassPrntCode = {
  Success: '0',
  /** Print data exceeded the app's upper limit — pre-empted by the size gate below. */
  InvalidDataLength: '3',
  /** Could not open the printer port: powered off, out of range, or never chosen in PassPRNT. */
  GetPortFailure: '4',
  DeviceOfflineBeforePrint: '5',
  WriteFailure: '6',
  DeviceOfflineWhilePrinting: '7',
  PortException: '8',
  InvalidReceiptData: '9',
  NonSupportedFileFormat: '14',
  FailedToDownload: '16',
} as const

export type PassPrntCodeType = (typeof PassPrntCode)[keyof typeof PassPrntCode]

export const PassPrntCut = {
  Partial: 'partial',
  Full: 'full',
  TearBar: 'tearbar',
  NoCut: 'nocut',
} as const

export type PassPrntCutType = (typeof PassPrntCut)[keyof typeof PassPrntCut]

export const PassPrntDrawer = {
  Off: 'off',
  Ahead: 'ahead',
  After: 'after',
} as const

export type PassPrntDrawerType = (typeof PassPrntDrawer)[keyof typeof PassPrntDrawer]

/** PassPRNT's own error dialog. Disabled so it does not compete with our toast — we surface the
 *  returned code ourselves, in the app's language. */
export const PassPrntPopup = {
  Enable: 'enable',
  Disable: 'disable',
} as const

export type PassPrntPopupType = (typeof PassPrntPopup)[keyof typeof PassPrntPopup]

/**
 * Print width in printer DOTS, not millimetres — the manual's `size` range is 120..832.
 * At 203 dpi a printer lays down 8 dots per mm, so 576 dots is the 72mm printable area of an
 * 80mm roll, and 406 dots the 48mm area of a 58mm roll.
 */
export const RECEIPT_PAPER_WIDTH_DOTS = {
  Roll80mm: 576,
  Roll58mm: 406,
} as const

export type ReceiptPaperWidthDots =
  (typeof RECEIPT_PAPER_WIDTH_DOTS)[keyof typeof RECEIPT_PAPER_WIDTH_DOTS]

export const DEFAULT_RECEIPT_PAPER_WIDTH_DOTS = RECEIPT_PAPER_WIDTH_DOTS.Roll80mm

/** Dots per millimetre at 203 dpi — converts a dot width into the CSS width of the print page. */
export const RECEIPT_DOTS_PER_MM = 8

/** Seconds PassPRNT waits for the printer. The manual's mobile default. */
export const PASSPRNT_TIMEOUT_SECONDS = 20

export const RECEIPT_COPIES_MIN = 0
export const RECEIPT_COPIES_MAX = 3

/**
 * Guards applied before navigating to the scheme. PassPRNT caps print data at roughly 8,000 px
 * (about a metre of paper) and iOS silently truncates an over-long URL, so both failures would
 * otherwise surface as blank or half-printed paper with no error to trace.
 */
export const PASSPRNT_MAX_ENCODED_HTML_LENGTH = 8000
export const PASSPRNT_MAX_RECEIPT_HEIGHT_PX = 8000

/**
 * How long a pending job may sit without a callback before it is treated as never started.
 * This is the only signal available that the companion app is missing: iOS neither reports a
 * failed scheme launch nor allows probing for an installed app.
 */
export const PASSPRNT_JOB_STALE_MS = 90_000

/**
 * Device-local keys. `storage.ts` prefixes these with `nexora_v3_`.
 *
 * These are per-device on purpose: the printer is physically attached to one iPad, so a shared
 * business-level setting would mean the front desk printing to the back office. Naming follows the
 * repo's own `pos_order_list_view_mode` rather than the HTML mockup's dotted keys.
 */
export const POS_PRINTER_PROFILE_STORAGE_KEY = 'pos_printer_profile_v1'
export const POS_RECEIPT_SETTINGS_STORAGE_KEY = 'pos_receipt_settings_v1'
export const POS_PRINT_JOB_STORAGE_KEY = 'pos_print_job_v1'

/** Matches the HTML mockup's defaults: one receipt after a card payment, none for cash. */
export const DEFAULT_POS_RECEIPT_SETTINGS = {
  printProducts: false,
  sortServices: false,
  cardCopies: 1,
  otherCopies: 0,
} as const

export const POS_PRINTER_I18N_PREFIX = 'components.dashboard.views.pos.printer'
