import type { StaffBusinessLink } from '../../../types/domain'
import {
  getStaffBusinessLinkStatusPresentation,
  resolveStaffBusinessLinkStatusLabel,
} from '../../../utils/staffBusinessLinkStatus'

const AVATAR_CLASSES = [
  'bg-gradient-to-br from-[#1e2a5e] to-[#4648D8] text-amber-300',
  'bg-rose-50 text-rose-600',
  'bg-white text-rose-600 ring-1 ring-rose-200',
] as const

const STATUS_SORT_ORDER: Record<string, number> = {
  active: 0,
  pending: 1,
  inactive: 2,
  previous: 2,
  rejected: 3,
}

export function getSalonInitials(businessName: string) {
  const words = businessName.trim().split(/\s+/).filter(Boolean)
  if (words.length >= 2) {
    return `${words[0][0] ?? ''}${words[1][0] ?? ''}`.toUpperCase()
  }
  const compact = businessName.replace(/\s+/g, '')
  if (compact.length <= 4) return compact.toUpperCase()
  return compact.slice(0, 2).toUpperCase()
}

export function formatSalonLocation(business: StaffBusinessLink) {
  const cityState = [business.city, business.state].filter(Boolean).join(', ')
  if (cityState) return cityState
  return business.address?.trim() || '—'
}

export function formatSalonMonthYear(
  isoDate: string | null | undefined,
  currentLanguage: string,
) {
  if (!isoDate) return null
  const date = new Date(isoDate)
  if (Number.isNaN(date.getTime())) return null
  const locale = currentLanguage === 'vi' ? 'vi-VN' : 'en-US'
  return date.toLocaleDateString(locale, { month: 'short', year: 'numeric' })
}

export function formatSalonTimeline(
  business: StaffBusinessLink,
  statusLabel: string,
  t: (key: string, params?: Record<string, unknown>) => string,
  currentLanguage: string,
) {
  const formattedDate = formatSalonMonthYear(business.linkedAt, currentLanguage)
  if (!formattedDate) return null

  const normalized = statusLabel.trim().toLowerCase()
  if (normalized === 'active') {
    return t('staff_salons.since', { date: formattedDate })
  }
  if (normalized === 'pending' || normalized.includes('pending')) {
    return t('staff_salons.invited', { date: formattedDate })
  }
  if (normalized === 'inactive' || normalized === 'previous') {
    return t('staff_salons.worked_from', { date: formattedDate })
  }
  return t('staff_salons.since', { date: formattedDate })
}

export function getSalonAvatarClass(index: number) {
  return AVATAR_CLASSES[index % AVATAR_CLASSES.length]
}

export function getSalonDisplayStatus(
  business: StaffBusinessLink,
  t: (key: string, params?: Record<string, unknown>) => string,
) {
  const statusLabel = resolveStaffBusinessLinkStatusLabel(business)
  const normalized = statusLabel.trim().toLowerCase()

  if (normalized === 'inactive') {
    return {
      label: t('staff_salons.status_previous'),
      className: 'bg-slate-100 text-slate-600',
    }
  }

  const presentation = getStaffBusinessLinkStatusPresentation(statusLabel)
  return {
    label: presentation.translationKey ? t(presentation.translationKey) : statusLabel,
    className: presentation.className,
  }
}

export function sortSalonBusinesses(businesses: StaffBusinessLink[]) {
  return [...businesses].sort((a, b) => {
    const aStatus = resolveStaffBusinessLinkStatusLabel(a).toLowerCase()
    const bStatus = resolveStaffBusinessLinkStatusLabel(b).toLowerCase()
    const aOrder = STATUS_SORT_ORDER[aStatus] ?? 99
    const bOrder = STATUS_SORT_ORDER[bStatus] ?? 99
    if (aOrder !== bOrder) return aOrder - bOrder
    return (a.businessName || '').localeCompare(b.businessName || '')
  })
}
