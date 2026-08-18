/**
 * Even tip split, done in whole cents so the parts always sum back to the
 * picked total (no float drift, no missing penny on the BE side).
 */

export interface TipSplitItem {
  staffProfileId: string
  amount: number
}

export function toCents(amount: number): number {
  if (!Number.isFinite(amount)) return 0
  return Math.round(amount * 100)
}

export function fromCents(cents: number): number {
  if (!Number.isFinite(cents)) return 0
  return Math.round(cents) / 100
}

/** Split a cent total into `count` parts; leftover cents go to the leading parts. */
export function splitTipEvenly(totalCents: number, count: number): number[] {
  if (!Number.isFinite(count) || count <= 0) return []
  const total = Math.round(Number.isFinite(totalCents) ? totalCents : 0)
  const base = Math.floor(total / count)
  const remainder = total - base * count
  return Array.from({ length: count }, (_, index) => base + (index < remainder ? 1 : 0))
}

/** Pair each staff id with its even share of `total` dollars. */
export function buildTipItems(staffIds: string[], total: number): TipSplitItem[] {
  const ids = (staffIds ?? []).filter((id) => typeof id === 'string' && id.trim())
  if (!ids.length) return []
  const parts = splitTipEvenly(toCents(total), ids.length)
  return ids.map((staffProfileId, index) => ({
    staffProfileId,
    amount: fromCents(parts[index]),
  }))
}
