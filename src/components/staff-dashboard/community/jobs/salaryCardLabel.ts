import { JobPayType, JobPayUnit } from '../../../../constants/posRecruitment'

interface CommunityPay {
  payType: JobPayType
  payAmount?: number | null
  payUnit?: JobPayUnit | null
}

/** Community job cards and details display only weekly salary or negotiable pay. */
export function getCommunitySalaryLabel(pay: CommunityPay, negotiableLabel: string): string | null {
  if (pay.payType === JobPayType.Negotiable) return negotiableLabel
  if (pay.payType !== JobPayType.Fixed || pay.payUnit !== JobPayUnit.Week) return null

  const amount = pay.payAmount
  if (amount == null || !Number.isFinite(amount) || amount <= 0) return null
  return `$${new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(amount)}`
}

/** Older Community demo posts store weekly pay as free text. */
export function getCommunityLegacySalaryLabel(raw: string | null | undefined): string | null {
  const text = raw?.trim()
  if (!text) return null

  const normalized = text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
  if (/\/\s*tuan\b|\bper\s+week\b|\bweekly\b/.test(normalized)) {
    const amount = text.match(/\$\s*([\d,]+)/)?.[1]
    if (amount) return `$${amount}`
  }
  return /thoa\s+thuan|thuong\s+luong|negotiable/.test(normalized) ? 'Thương lượng' : null
}
