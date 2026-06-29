export const DIRECT_PAYMENT_MIN_AMOUNT = 1
export const DIRECT_PAYMENT_MAX_AMOUNT = 1_000_000

export function formatUsdAmount(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

function formatUsdInputInteger(value: string): string {
  const intValue = Number(value || 0)
  if (!Number.isFinite(intValue)) return ''
  return intValue.toLocaleString('en-US')
}

/** Format a numeric amount for the custom amount text input (no $ prefix). */
export function formatUsdInputAmount(amount: number): string {
  if (!Number.isFinite(amount) || amount <= 0) return ''
  return amount.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })
}

export function parseDirectPaymentAmountInput(display: string): number {
  const cleaned = display.replace(/,/g, '').trim()
  if (!cleaned || cleaned === '.') return 0
  const amount = Number(cleaned)
  return Number.isFinite(amount) ? amount : 0
}

/**
 * Sanitize free-typed currency input: commas, max 2 decimals, clamp to max.
 * Preserves a trailing "." while the user is still typing cents.
 */
export function sanitizeDirectPaymentAmountInput(
  raw: string,
  maxAmount = DIRECT_PAYMENT_MAX_AMOUNT,
): string {
  const stripped = raw.replace(/,/g, '').replace(/[^0-9.]/g, '')
  if (!stripped) return ''

  const dotIndex = stripped.indexOf('.')
  const intPart = dotIndex === -1 ? stripped : stripped.slice(0, dotIndex)
  const decPart = dotIndex === -1 ? '' : stripped.slice(dotIndex + 1).replace(/\./g, '').slice(0, 2)
  const endsWithDot = stripped.endsWith('.')

  if (!intPart && !decPart && endsWithDot) return '0.'

  const numericBase = decPart || endsWithDot ? `${intPart || '0'}.${decPart}` : intPart
  let amount = parseDirectPaymentAmountInput(numericBase)
  if (!Number.isFinite(amount)) return ''

  if (amount > maxAmount) {
    return formatUsdInputAmount(maxAmount)
  }

  if (endsWithDot && !decPart) {
    return `${formatUsdInputInteger(intPart || '0')}.`
  }

  if (decPart) {
    return `${formatUsdInputInteger(intPart || '0')}.${decPart}`
  }

  return formatUsdInputInteger(intPart)
}
