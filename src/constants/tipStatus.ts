/**
 * TipStatus — matches backend TipStatus enum.
 * String names are used in staff/merchant tip DTOs; numeric codes on some endpoints.
 */
export enum TipStatus {
  Initiated = 'Initiated',
  Confirmed = 'Confirmed',
  Skipped = 'Skipped',
  Completed = 'Completed',
}

export const TipStatusVariant = {
  Pending: 'Pending',
  Processing: 'Processing',
} as const

export const TIP_INITIATED_LIKE_STATUSES = [
  TipStatus.Initiated,
  TipStatusVariant.Pending,
  TipStatusVariant.Processing,
] as const

/** Numeric TipStatus values from legacy/API enum responses. */
export const TipStatusCode = {
  Initiated: 0,
  Confirmed: 1,
  Skipped: 2,
} as const

const TIP_STATUS_BY_CODE: Record<number, TipStatus> = {
  [TipStatusCode.Initiated]: TipStatus.Initiated,
  [TipStatusCode.Confirmed]: TipStatus.Confirmed,
  [TipStatusCode.Skipped]: TipStatus.Skipped,
}

export type TipStatusValue = `${TipStatus}`

export function isTipStatus(value: unknown, status: TipStatus): boolean {
  if (typeof value === 'number') {
    return TIP_STATUS_BY_CODE[value] === status
  }
  return String(value || '').toLowerCase() === status.toLowerCase()
}

export function isInitiatedLikeTipStatus(value: unknown): boolean {
  const normalized = String(value ?? '').trim().toLowerCase()
  return TIP_INITIATED_LIKE_STATUSES.some(
    (status) => status.toLowerCase() === normalized,
  )
}

export function normalizeTipStatus(
  value: unknown,
  fallback: TipStatus = TipStatus.Initiated,
): TipStatusValue {
  if (typeof value === 'number' && value in TIP_STATUS_BY_CODE) {
    return TIP_STATUS_BY_CODE[value]
  }

  const text = String(value ?? '').trim()
  if (!text) return fallback

  const match = Object.values(TipStatus).find((s) => s.toLowerCase() === text.toLowerCase())
  return (match ?? text) as TipStatusValue
}
