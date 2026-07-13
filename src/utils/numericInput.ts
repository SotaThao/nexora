/** Parse integer input, stripping leading zeros (e.g. "010" -> 10). */
export function parseWholeNumberInput(raw: string): number {
  const digits = raw.replace(/\D/g, '')
  if (!digits) return 0
  const parsed = Number.parseInt(digits, 10)
  return Number.isFinite(parsed) ? parsed : 0
}

/** Display value for a whole-number controlled text input. */
export function formatWholeNumberInputValue(value: number): string {
  if (!Number.isFinite(value)) return ''
  return String(value)
}
