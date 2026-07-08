const DISMISSED_ACK_STORAGE_KEY = 'nexora_dismissed_direct_payment_ack'

export function readDismissedAckIds(): Set<string> {
  try {
    const raw = sessionStorage.getItem(DISMISSED_ACK_STORAGE_KEY)
    if (!raw) return new Set()
    const parsed = JSON.parse(raw)
    return new Set(Array.isArray(parsed) ? parsed.filter(Boolean) : [])
  } catch {
    return new Set()
  }
}

export function dismissAckPrompt(paymentId: string) {
  const next = readDismissedAckIds()
  next.add(paymentId)
  sessionStorage.setItem(DISMISSED_ACK_STORAGE_KEY, JSON.stringify([...next]))
}
