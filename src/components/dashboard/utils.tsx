// Dashboard helpers — formatting, slugs, payout-config mapping, count-up hook.
// Extracted from Dashboard.jsx (Group 1 refactor).
import { useEffect, useMemo, useState } from 'react'
import { isInitiatedLikeTipStatus, isTipStatus, TipStatus } from '../../constants/tipStatus'
import { isMasterTouchpoint } from '../../constants/touchpoints'
import { formatDatePart, formatTimePart } from '../../utils/localDate'

// Render text with styled star rating symbols (★) in luxuryGold with a 4px gap.
export function renderTextWithGoldStars(text) {
  if (!text) return null
  const parts = text.split('★')
  return parts.map((part, index) => {
    if (index === parts.length - 1) {
      return part
    }
    return (
      <span key={index}>
        {part}
        <span className="text-luxuryGold ml-flox-4 inline-block font-normal">★</span>
      </span>
    )
  })
}

export function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(value)
}

export function parseApiDateTime(value) {
  const raw = String(value).trim()
  if (!raw) return null

  if (/[zZ]$/.test(raw) || /[+-]\d{2}:\d{2}$/.test(raw)) {
    const date = new Date(raw)
    return Number.isNaN(date.getTime()) ? null : date
  }

  if (raw.includes(' ') && !raw.includes('T')) {
    const isoUtc = `${raw.replace(' ', 'T')}Z`
    const date = new Date(isoUtc)
    return Number.isNaN(date.getTime()) ? null : date
  }

  if (/^\d{4}-\d{2}-\d{2}T/.test(raw)) {
    const date = new Date(`${raw}Z`)
    if (!Number.isNaN(date.getTime())) return date
  }

  const date = new Date(raw)
  return Number.isNaN(date.getTime()) ? null : date
}

function localTimeZone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone
}

// Same output as formatTransactionDateTime, but date/time kept as separate strings —
// for list/table cells that render the time on its own line under the date.
export function formatTransactionDateTimeParts(value, locale = 'en') {
  const date = parseApiDateTime(value)
  if (!date) return null

  const isVietnamese = locale === 'vi'
  const timeZone = localTimeZone()

  return {
    date: formatDatePart(date, isVietnamese, { timeZone }),
    time: formatTimePart(date, isVietnamese, timeZone),
  }
}

export function formatTransactionDateTime(value, locale = 'en') {
  const parts = formatTransactionDateTimeParts(value, locale)
  if (!parts) return value ? String(value).trim() : '—'

  return `${parts.date} ${parts.time}`
}

export function DateTimeCell({ value, locale = 'en', timeClassName = '', className = '' }) {
  const parts = formatTransactionDateTimeParts(value, locale)
  if (!parts) return <span className={className}>{value ? String(value).trim() : '—'}</span>

  return (
    <span className={className}>
      {parts.date}
      <br />
      <span className={timeClassName}>{parts.time}</span>
    </span>
  )
}

export function formatNotificationDateTime(value, locale = 'en') {
  const date = parseApiDateTime(value)
  if (!date) return value ? String(value).trim() : ''

  const isVietnamese = locale === 'vi'
  const timeZone = localTimeZone()
  const datePart = formatDatePart(date, isVietnamese, { timeZone, withYear: false })
  const timePart = formatTimePart(date, isVietnamese, timeZone)

  return `${datePart} ${timePart}`
}

// US-025 — owner confirm receipt for shop-account / multi-staff tips.
//
// A tip is eligible for owner confirmation when the customer has confirmed the
// transfer (status `Confirmed`) into the shop account (multi-staff routing) and
// the owner has not yet confirmed receipt. Single-staff direct-to-staff tips are
// confirmed by the staff member (US-024) and never appear in the owner queue.
export function isAwaitingShopConfirmation(tx) {
  if (!tx?.isMultiStaff && !tx?.isLocalStaff) return false
  if (tx.merchantConfirmedAt) return false
  return isTipStatus(tx.status, TipStatus.Confirmed)
}

/** Staff profile IDs marked local-staff (Reports / overview resolve tip flags from this set). */
export function resolveLocalStaffIds(staff = []) {
  const localStaffIds = new Set()
  for (const member of staff) {
    if (!member?.staffProfileId) continue
    if (member.isLocalStaff) localStaffIds.add(String(member.staffProfileId))
  }
  return localStaffIds
}

/** Attach resolved `isLocalStaff` when the tips API omits / understates the flag. */
export function withResolvedLocalStaff(tx, localStaffIds) {
  if (!tx || tx.isLocalStaff === true) return tx
  const profileId = tx.staffProfileId != null ? String(tx.staffProfileId) : ''
  if (!profileId || !localStaffIds?.has(profileId)) return tx
  return { ...tx, isLocalStaff: true }
}

/**
 * Count tips awaiting owner shop confirmation — same predicate as Reports
 * `?status=AwaitingShopConfirmation` (after local-staff resolution).
 */
export function countAwaitingShopConfirmation(transactions = [], staff = []) {
  const localStaffIds = resolveLocalStaffIds(staff)
  let count = 0
  for (const tx of transactions) {
    if (isAwaitingShopConfirmation(withResolvedLocalStaff(tx, localStaffIds))) {
      count += 1
    }
  }
  return count
}

// A shop-account tip the owner has already confirmed received.
export function isShopConfirmed(tx) {
  return Boolean((tx?.isMultiStaff || tx?.isLocalStaff) && tx?.merchantConfirmedAt)
}

// US-024 — staff confirm receipt for direct-to-staff tips.
export function isAwaitingStaffConfirmation(tx) {
  if (tx?.isMultiStaff || tx?.isLocalStaff) return false
  if (tx?.staffConfirmedAt) return false
  return isTipStatus(tx.status, TipStatus.Confirmed)
}

export function isStaffReceiptConfirmed(tx) {
  return Boolean(!tx?.isMultiStaff && !tx?.isLocalStaff && tx?.staffConfirmedAt)
}

// Initiated/Pending tips may be force-confirmed before the customer self-confirm
// step, but ownership still follows US-024/US-025: staff owns direct-to-staff
// tips, owner owns shop-account / multi-staff tips.
export function isForceCompletableTip(tx, isStaffAudience = false) {
  if (!isInitiatedLikeTipStatus(tx?.status)) return false
  if (isStaffAudience) {
    return Boolean(!tx?.isMultiStaff && !tx?.isLocalStaff && !tx?.staffConfirmedAt)
  }
  return Boolean((tx?.isMultiStaff || tx?.isLocalStaff) && !tx?.merchantConfirmedAt)
}

export function isReceiptConfirmableTip(tx, isStaffAudience = false) {
  if (isStaffAudience) {
    return isAwaitingStaffConfirmation(tx) || isForceCompletableTip(tx, true)
  }
  return isAwaitingShopConfirmation(tx) || isForceCompletableTip(tx, false)
}

export function walletLabels(accounts) {
  return Object.entries(accounts)
    .filter(([, value]) => value)
    .map(([key]) => ({ venmo: 'Venmo', cashapp: 'Cash App', zelle: 'Zelle', vlinkpay: 'VLINKPAY' }[key]))
}

export function slugify(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

export function resolveDashboardFooterVisibility(pathname) {
  const normalizedPathname = String(pathname ?? '').replace(/\/+$/, '')
  const isPosRoute =
    normalizedPathname === '/dashboard/pos' || normalizedPathname.startsWith('/dashboard/pos/')

  return isPosRoute ? 'hidden min-[1200px]:block' : ''
}

export function parseMetricValue(value) {
  const text = String(value)
  const number = Number(text.replace(/[^0-9.-]/g, ''))
  return Number.isFinite(number) ? number : 0
}

export function formatAnimatedValue(template, value) {
  const text = String(template)
  if (text.includes('$')) return formatCurrency(value)
  if (text.includes('%')) return `${value.toFixed(2)}%`
  if (text.includes('.')) return value.toFixed(2).replace(/\.00$/, '')
  return Math.round(value).toLocaleString()
}

export const getPayoutConfigsFromMember = (member) => {
  const configs = {
    zelle: { enabled: false, value: '', qrCode: '', accountName: '' },
    bankwire: { enabled: false, value: '', qrCode: '', accountName: '' },
    paypal: { enabled: false, value: '', qrCode: '', accountName: '' },
    venmo: { enabled: false, value: '', qrCode: '', accountName: '' },
    cashapp: { enabled: false, value: '', qrCode: '', accountName: '' },
    applecash: { enabled: false, value: '', qrCode: '', accountName: '' }
  }
  const accounts = member.paymentAccounts || {}
  const memberConfigs = member.payoutConfigs || {}

  if (accounts.zelle || memberConfigs.zelle?.value) {
    configs.zelle = {
      enabled: memberConfigs.zelle ? memberConfigs.zelle.enabled : true,
      value: accounts.zelle || memberConfigs.zelle?.value || '',
      qrCode: memberConfigs.zelle?.qrCode || '',
      accountName: memberConfigs.zelle?.accountName || member.fullName || ''
    }
  }
  if (accounts.bankwire || memberConfigs.bankwire?.value) {
    configs.bankwire = {
      enabled: memberConfigs.bankwire ? memberConfigs.bankwire.enabled : true,
      value: accounts.bankwire || memberConfigs.bankwire?.value || '',
      qrCode: memberConfigs.bankwire?.qrCode || '',
      accountName: memberConfigs.bankwire?.accountName || member.fullName || ''
    }
  }
  if (accounts.paypal || memberConfigs.paypal?.value) {
    configs.paypal = {
      enabled: memberConfigs.paypal ? memberConfigs.paypal.enabled : true,
      value: accounts.paypal || memberConfigs.paypal?.value || '',
      qrCode: memberConfigs.paypal?.qrCode || '',
      accountName: memberConfigs.paypal?.accountName || member.fullName || ''
    }
  }
  if (accounts.venmo || memberConfigs.venmo?.value) {
    configs.venmo = {
      enabled: memberConfigs.venmo ? memberConfigs.venmo.enabled : true,
      value: accounts.venmo || memberConfigs.venmo?.value || '',
      qrCode: memberConfigs.venmo?.qrCode || '',
      accountName: memberConfigs.venmo?.accountName || member.fullName || ''
    }
  }
  if (accounts.cashapp || memberConfigs.cashapp?.value) {
    configs.cashapp = {
      enabled: memberConfigs.cashapp ? memberConfigs.cashapp.enabled : true,
      value: accounts.cashapp || memberConfigs.cashapp?.value || '',
      qrCode: memberConfigs.cashapp?.qrCode || '',
      accountName: memberConfigs.cashapp?.accountName || member.fullName || ''
    }
  }
  if (accounts.applecash || memberConfigs.applecash?.value) {
    configs.applecash = {
      enabled: memberConfigs.applecash ? memberConfigs.applecash.enabled : true,
      value: accounts.applecash || memberConfigs.applecash?.value || '',
      qrCode: memberConfigs.applecash?.qrCode || '',
      accountName: memberConfigs.applecash?.accountName || member.fullName || ''
    }
  }

  return configs
}

export function useCountUp(target, duration = 900) {
  const numericTarget = useMemo(() => parseMetricValue(target), [target])
  const [value, setValue] = useState(0)

  useEffect(() => {
    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (reducedMotion) {
      setValue(numericTarget)
      return undefined
    }

    let frameId
    const start = performance.now()
    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(numericTarget * eased)
      if (progress < 1) frameId = requestAnimationFrame(tick)
    }

    frameId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frameId)
  }, [duration, numericTarget])

  return formatAnimatedValue(target, value)
}

export function resolveMasterTouchpoint(touchpoints = []) {
  return (
    touchpoints.find(isMasterTouchpoint) ||
    touchpoints[0] ||
    null
  )
}

export function buildMasterQrTarget(touchpoints = []) {
  const masterTouchpoint = resolveMasterTouchpoint(touchpoints)
  return {
    name: 'Master Welcome QR',
    subtitle: 'Store Main Portal',
    slug: masterTouchpoint?.slug || 'general',
    url: masterTouchpoint?.url || null,
    qrImageUrl: masterTouchpoint?.qrImageUrl || null,
    isActive: true,
    isGatewayQr: true,
  }
}

/** Leaderboard row label: full first name, or "First L." when surname exists. */
export function formatLeaderboardStaffName(fullName) {
  const full = String(fullName || '').trim()
  if (!full) return { display: '—', full: '' }

  const parts = full.split(/\s+/).filter(Boolean)
  if (parts.length === 1) {
    return { display: parts[0], full }
  }

  const firstName = parts[0]
  const lastInitial = parts[parts.length - 1].charAt(0).toUpperCase()
  return { display: `${firstName} ${lastInitial}.`, full }
}
