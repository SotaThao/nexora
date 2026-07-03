/** US-55 Payout Management — shared enums, error codes, and bitmask helpers. */

export const PayoutStatus = {
  Draft: 0,
  Pending: 1,
  Confirmed: 2,
  Cancelled: 3,
} as const

export type PayoutStatusValue = (typeof PayoutStatus)[keyof typeof PayoutStatus]

export const PayoutStatusLabel: Record<PayoutStatusValue, string> = {
  [PayoutStatus.Draft]: 'Draft',
  [PayoutStatus.Pending]: 'Pending',
  [PayoutStatus.Confirmed]: 'Confirmed',
  [PayoutStatus.Cancelled]: 'Cancelled',
}

export const PayoutType = {
  Tip: 1,
  Salary: 2,
  Bonus: 4,
  Other: 8,
} as const

export type PayoutTypeFlag = (typeof PayoutType)[keyof typeof PayoutType]

export const PayoutTypeLabel: Record<PayoutTypeFlag, string> = {
  [PayoutType.Tip]: 'Tip',
  [PayoutType.Salary]: 'Salary',
  [PayoutType.Bonus]: 'Bonus',
  [PayoutType.Other]: 'Other',
}

export const ALL_PAYOUT_TYPE_FLAGS = [
  PayoutType.Tip,
  PayoutType.Salary,
  PayoutType.Bonus,
  PayoutType.Other,
] as const

export const PayoutMethodType = {
  Cash: 'Cash',
  BankTransfer: 'BankTransfer',
  Zelle: 'Zelle',
  CashApp: 'CashApp',
  Venmo: 'Venmo',
  Other: 'Other',
} as const

export type PayoutMethodTypeValue = (typeof PayoutMethodType)[keyof typeof PayoutMethodType]

export const ALL_PAYOUT_METHOD_TYPES = Object.values(PayoutMethodType)

/** Merchant create-payout picker order — Cash last; `Other` is not shown (maps to Cash). */
export const MERCHANT_CREATE_PAYOUT_METHOD_TYPES: PayoutMethodTypeValue[] = [
  PayoutMethodType.Zelle,
  PayoutMethodType.BankTransfer,
  PayoutMethodType.CashApp,
  PayoutMethodType.Venmo,
  PayoutMethodType.Cash,
]

export const PayoutDebtTransactionType = {
  TipDebt: 1,
  PayoutSettlement: 2,
  PayoutReversal: 3,
} as const

export type PayoutDebtTransactionTypeValue =
  (typeof PayoutDebtTransactionType)[keyof typeof PayoutDebtTransactionType]

export const PayoutDebtTransactionTypeLabel: Record<PayoutDebtTransactionTypeValue, string> = {
  [PayoutDebtTransactionType.TipDebt]: 'TipDebt',
  [PayoutDebtTransactionType.PayoutSettlement]: 'PayoutSettlement',
  [PayoutDebtTransactionType.PayoutReversal]: 'PayoutReversal',
}

export const PayoutErrorCode = {
  AMOUNT_MUST_BE_POSITIVE: 'PAYOUT_AMOUNT_MUST_BE_POSITIVE',
  PERIOD_START_BEFORE_END: 'PAYOUT_PERIOD_START_BEFORE_END',
  EVIDENCE_URLS_MAX_10: 'PAYOUT_EVIDENCE_URLS_MAX_10',
  TYPES_REQUIRED: 'PAYOUT_TYPES_REQUIRED',
  UPDATE_NOT_ALLOWED: 'PAYOUT_UPDATE_NOT_ALLOWED',
  DELETE_NOT_ALLOWED: 'PAYOUT_DELETE_NOT_ALLOWED',
  CANCEL_NOT_ALLOWED: 'PAYOUT_CANCEL_NOT_ALLOWED',
  CONFIRM_NOT_ALLOWED: 'PAYOUT_CONFIRM_NOT_ALLOWED',
} as const

const PAYOUT_STATUS_BY_NAME: Record<string, PayoutStatusValue> = {
  Draft: PayoutStatus.Draft,
  Pending: PayoutStatus.Pending,
  Confirmed: PayoutStatus.Confirmed,
  Cancelled: PayoutStatus.Cancelled,
}

const PAYOUT_DEBT_TX_BY_NAME: Record<string, PayoutDebtTransactionTypeValue> = {
  TipDebt: PayoutDebtTransactionType.TipDebt,
  PayoutSettlement: PayoutDebtTransactionType.PayoutSettlement,
  PayoutReversal: PayoutDebtTransactionType.PayoutReversal,
}

const PAYOUT_METHOD_BY_NAME = new Set<string>(ALL_PAYOUT_METHOD_TYPES)

/** Live API `PayoutMethodType` → FE form values. */
const PAYOUT_METHOD_API_TO_FE: Record<string, PayoutMethodTypeValue> = {
  Zelle: PayoutMethodType.Zelle,
  BankWire: PayoutMethodType.BankTransfer,
  Venmo: PayoutMethodType.Venmo,
  CashApp: PayoutMethodType.CashApp,
  Other: PayoutMethodType.Cash,
  Cash: PayoutMethodType.Cash,
  BankTransfer: PayoutMethodType.BankTransfer,
}

/** FE form values → API `PayoutMethodType` for create/update. */
const PAYOUT_METHOD_FE_TO_API: Record<string, string> = {
  [PayoutMethodType.Zelle]: 'Zelle',
  [PayoutMethodType.BankTransfer]: 'BankWire',
  [PayoutMethodType.Venmo]: 'Venmo',
  [PayoutMethodType.CashApp]: 'CashApp',
  [PayoutMethodType.Cash]: 'Other',
  [PayoutMethodType.Other]: 'Other',
}

export function normalizePayoutDateOnly(value?: string | null): string {
  if (!value) return ''
  return value.split('T')[0]
}

export function normalizePayoutStatus(value: unknown): PayoutStatusValue {
  if (typeof value === 'string' && value in PAYOUT_STATUS_BY_NAME) {
    return PAYOUT_STATUS_BY_NAME[value]
  }
  const num = Number(value)
  if (
    num === PayoutStatus.Draft
    || num === PayoutStatus.Pending
    || num === PayoutStatus.Confirmed
    || num === PayoutStatus.Cancelled
  ) {
    return num as PayoutStatusValue
  }
  return PayoutStatus.Pending
}

export function normalizePayoutMethodType(value: unknown): PayoutMethodTypeValue {
  if (typeof value !== 'string' || !value.trim()) {
    return PayoutMethodType.Other
  }
  const trimmed = value.trim()
  if (trimmed in PAYOUT_METHOD_API_TO_FE) {
    return PAYOUT_METHOD_API_TO_FE[trimmed]
  }
  if (PAYOUT_METHOD_BY_NAME.has(trimmed)) {
    return trimmed as PayoutMethodTypeValue
  }
  return PayoutMethodType.Other
}

export function payoutMethodTypeToApi(value: string): string {
  return PAYOUT_METHOD_FE_TO_API[value] ?? value
}

export function normalizePayoutDebtTransactionType(value: unknown): PayoutDebtTransactionTypeValue {
  if (typeof value === 'string' && value in PAYOUT_DEBT_TX_BY_NAME) {
    return PAYOUT_DEBT_TX_BY_NAME[value]
  }
  const num = Number(value)
  if (
    num === PayoutDebtTransactionType.TipDebt
    || num === PayoutDebtTransactionType.PayoutSettlement
    || num === PayoutDebtTransactionType.PayoutReversal
  ) {
    return num as PayoutDebtTransactionTypeValue
  }
  return PayoutDebtTransactionType.TipDebt
}

export function hasPayoutType(mask: number, type: PayoutTypeFlag): boolean {
  return (mask & type) === type
}

export function togglePayoutType(mask: number, type: PayoutTypeFlag): number {
  return hasPayoutType(mask, type) ? mask & ~type : mask | type
}

export function payoutTypesFromMask(mask: number): PayoutTypeFlag[] {
  return ALL_PAYOUT_TYPE_FLAGS.filter((flag) => hasPayoutType(mask, flag))
}

export function payoutTypesToLabels(mask: number): string[] {
  return payoutTypesFromMask(mask).map((flag) => PayoutTypeLabel[flag])
}

export function combinePayoutTypes(types: PayoutTypeFlag[]): number {
  return types.reduce((acc, type) => acc | type, 0)
}

export function isPayoutTypesMaskValid(mask: number): boolean {
  return mask > 0
}

export const MAX_PAYOUT_EVIDENCE_URLS = 10
