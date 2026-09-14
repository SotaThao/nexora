// Shared by the Weighted Turn Settings editor and the Salon Information summary card so both
// describe the same bands from the same thresholds — no second copy of the range wording.
import type { PosTurnTierApiDto } from '../../../../types/repositories'

export const MAX_TURN_CREDIT = 100

const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
})

/**
 * Band label built from the thresholds themselves rather than hardcoded strings, so opening the
 * thresholds for editing later does not need the callers rewritten. The upper bound is the next
 * band's threshold minus a cent; the last band is open-ended.
 */
export function formatTurnTierRange(tiers: readonly PosTurnTierApiDto[], index: number) {
  const from = tiers[index].thresholdAmount
  const next = tiers[index + 1]?.thresholdAmount
  return next === undefined
    ? `${currency.format(from)}+`
    : `${currency.format(from)}–${currency.format(next - 0.01)}`
}
