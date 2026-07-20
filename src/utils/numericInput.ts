/** Parse integer input, stripping leading zeros (e.g. "010" -> 10). Empty → NaN so the field can clear. */
export function parseWholeNumberInput(raw: string): number {
  const digits = raw.replace(/\D/g, '')
  if (!digits) return Number.NaN
  const parsed = Number.parseInt(digits, 10)
  return Number.isFinite(parsed) ? parsed : Number.NaN
}

/** Display value for a whole-number controlled text input. Empty when value is not a finite number. */
export function formatWholeNumberInputValue(value: number): string {
  if (!Number.isFinite(value)) return ''
  return String(value)
}
