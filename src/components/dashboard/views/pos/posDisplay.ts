// Small display helpers shared by POS front-desk screens.

import { getPosCheckoutPaymentMethodLabel } from '../../../../constants/posCheckoutPaymentMethod'
import { formatUsdAmount } from '../../../../utils/currencyInput'
import type { TFunction } from '../../../../types/contexts'
import type { OrderPaymentAllocationApiDto } from '../../../../types/repositories'

/** Shown wherever a value is legitimately absent (no technician yet, no ticket in progress). */
export const EMPTY_VALUE = '—'

const MAX_INITIALS = 2

/** Avatar initials — the POS iPad standard uses initials, never a photo placeholder. */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, MAX_INITIALS)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}

/** Comma-joined list, or the empty placeholder when there is nothing to show. */
export function joinOrEmpty(values: string[] | null | undefined): string {
  return values && values.length > 0 ? values.join(', ') : EMPTY_VALUE
}

/** Formats the salon address for receipt headers without dropping locality fields. */
export function formatBusinessAddress(parts: {
  address?: string | null
  city?: string | null
  state?: string | null
  zipCode?: string | null
  country?: string | null
}): string {
  const clean = (value?: string | null) => value?.trim() || ''
  const street = clean(parts.address)
  const city = clean(parts.city)
  const state = clean(parts.state)
  const zipCode = clean(parts.zipCode)
  const country = clean(parts.country)
  const stateAndZip = [state, zipCode].filter(Boolean).join(' ')

  return [street, city, stateAndZip, country].filter(Boolean).join(', ')
}

/**
 * How a payment reads wherever one is shown as text — receipt, completed visit, success screen.
 * A split names every portion and what went through it, so the customer can check the receipt
 * against the card slip and the cash they handed over. Anything else reads exactly as it always
 * has, so a single-method receipt is unchanged.
 *
 * Fewer than two portions is treated as no split: one portion means the cashier settled on a
 * single method after all, and its own label already says everything.
 */
export function formatPaymentMethodDisplay(
  allocations: OrderPaymentAllocationApiDto[] | null | undefined,
  fallbackMethod: string | null | undefined,
  t: TFunction,
): string {
  if (allocations && allocations.length >= 2) {
    return allocations
      .slice()
      .sort((a, b) => a.displayOrder - b.displayOrder)
      .map((allocation) => `${getPosCheckoutPaymentMethodLabel(allocation.paymentMethodType, t)} ${formatUsdAmount(allocation.amount)}`)
      .join(' · ')
  }

  return getPosCheckoutPaymentMethodLabel(fallbackMethod, t)
}
