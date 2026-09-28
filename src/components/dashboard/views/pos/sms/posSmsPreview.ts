import { POS_SMS_PREVIEW_VALUES, PosSmsPlaceholder } from '../../../../../constants/posSmsSettings'

export function renderPosSmsPreview(body: string, salonName: string): string {
  return (Object.values(PosSmsPlaceholder) as PosSmsPlaceholder[]).reduce((text, token) => {
    const value = token === PosSmsPlaceholder.SalonName ? salonName : POS_SMS_PREVIEW_VALUES[token]
    return text.split(token).join(value)
  }, body)
}

export function renderPosSmsEstimateText(body: string, estimateValues: Record<string, string>): string {
  return Object.entries(estimateValues).reduce((text, [token, value]) => text.split(token).join(value), body)
}
