import { POS_SMS_PREVIEW_VALUES, PosSmsPlaceholder } from '../../../../../constants/posSmsSettings'

// Same substitution the backend performs, with example values, so the phone preview and the
// length estimate describe what a guest would actually receive.
export function renderPosSmsPreview(body: string, salonName: string): string {
  return (Object.values(PosSmsPlaceholder) as PosSmsPlaceholder[]).reduce((text, token) => {
    const value = token === PosSmsPlaceholder.SalonName ? salonName : POS_SMS_PREVIEW_VALUES[token]
    return text.split(token).join(value)
  }, body)
}

// Text for the length estimate. The preview masks tokens with "••••", which is outside the GSM
// alphabet and would make every message count as UCS-2, so the estimate uses the server's samples.
export function renderPosSmsEstimateText(body: string, estimateValues: Record<string, string>): string {
  return Object.entries(estimateValues).reduce((text, [token, value]) => text.split(token).join(value), body)
}
