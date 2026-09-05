/** Only the last four digits of a customer phone belong on a receipt. */
export function maskReceiptPhone(phone?: string | null): string {
  if (!phone?.trim()) return ''
  const digits = phone.replace(/\D/g, '')
  if (digits.length < 4 || (digits.length === 4 && !phone.includes('*'))) return '***'
  return `***-***-${digits.slice(-4)}`
}
