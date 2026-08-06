import { formatDateOnly, formatJoinedDate } from './localDate'
import { SubscriptionPackageType } from '../data/repositories/subscriptionPayments'

/** Wire statuses that mean the merchant currently has this plan. */
const ACTIVE_SUBSCRIPTION_STATUSES = new Set(['active', 'trialing'])

export function formatSubscriptionDate(iso, locale = 'en', { sidebar = false } = {}) {
  if (!iso) return null
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return null

  if (sidebar && locale === 'vi') {
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  return formatDateOnly(iso, locale) || null
}

/** Full datetime for plan-card renew labels (e.g. "Jun 24, 2026, 08:31 AM"). */
export function formatSubscriptionRenewDate(iso) {
  if (!iso) return null
  return formatJoinedDate(iso) || null
}

export function isUserSubscriptionActive(subscription) {
  if (!subscription?.packageCode) return false
  const status = String(subscription.status ?? '').toLowerCase()
  if (!status) return true
  return ACTIVE_SUBSCRIPTION_STATUSES.has(status)
}

/**
 * Pick the active (or first) subscription for a packageType from
 * normalized `profile.subscriptions` / `business.subscriptions`.
 */
export function getUserSubscriptionByPackageType(subscriptions, packageType) {
  if (!Array.isArray(subscriptions) || !packageType) return null
  const type = String(packageType).toLowerCase()
  const matches = subscriptions.filter(
    (sub) => String(sub?.packageType ?? '').toLowerCase() === type,
  )
  if (matches.length === 0) return null
  return matches.find(isUserSubscriptionActive) ?? matches[0] ?? null
}

/** TipPlatform row — used by sidebar + /dashboard/subscriptions. */
export function getTipPlatformSubscription(profile) {
  const fromList = getUserSubscriptionByPackageType(
    profile?.subscriptions,
    SubscriptionPackageType.TipPlatform,
  )
  if (fromList) return fromList
  const legacy = profile?.subscription
  if (!legacy?.packageCode) return null
  const legacyType = String(legacy.packageType ?? '').toLowerCase()
  if (legacyType && legacyType !== SubscriptionPackageType.TipPlatform.toLowerCase()) {
    return null
  }
  return legacy
}

/** VoiceAI row — used by /dashboard/ai-hub?tab=plans. */
export function getVoiceAiSubscription(profile) {
  return getUserSubscriptionByPackageType(
    profile?.subscriptions,
    SubscriptionPackageType.VoiceAI,
  )
}

/**
 * Whether a TipPlatform catalog plan id (starter|pro|enterprise) matches
 * the merchant's active packageCode / name.
 */
export function isTipPlatformPlanCurrent(subscription, planId) {
  if (!subscription?.packageCode || !planId) return false
  if (!isUserSubscriptionActive(subscription)) return false
  const needle = String(planId).toLowerCase()
  const code = String(subscription.packageCode).toLowerCase()
  const name = String(subscription.name ?? '').toLowerCase()
  return code === needle || code.includes(needle) || name.includes(needle)
}

export function getSubscriptionSidebarCopy(subscription, t, locale = 'en') {
  if (!subscription?.packageCode) {
    return { planLabel: null, detailLabel: null }
  }

  // Prefer API display name; fall back to capitalizing packageCode.
  const planLabel = subscription.name?.trim()
    || (subscription.packageCode.charAt(0).toUpperCase() + subscription.packageCode.slice(1))
  const trialEnd = formatSubscriptionDate(subscription.trialEndsAt, locale, { sidebar: true })
  const periodEnd = formatSubscriptionDate(subscription.currentPeriodEnd, locale, { sidebar: true })

  if (String(subscription.status).toLowerCase() === 'trialing' && trialEnd) {
    return {
      planLabel,
      detailLabel: t('dashboard.sidebar.expires_on', { date: trialEnd }),
    }
  }

  if (periodEnd) {
    return {
      planLabel,
      detailLabel: t('dashboard.sidebar.renews_on', { date: periodEnd }),
    }
  }

  if (subscription.status) {
    return {
      planLabel,
      detailLabel: subscription.status,
    }
  }

  return { planLabel, detailLabel: null }
}

/** Renew / expire line under "Current Active Plan" CTAs. */
export function getSubscriptionPlanRenewLabel(subscription, t) {
  if (!subscription) return null
  const isTrialing = String(subscription.status ?? '').toLowerCase() === 'trialing'
  const iso = isTrialing
    ? (subscription.trialEndsAt || subscription.currentPeriodEnd)
    : (subscription.currentPeriodEnd || subscription.trialEndsAt)
  const date = formatSubscriptionRenewDate(iso)
  if (!date) return null
  return isTrialing
    ? t('dashboard.sidebar.expires_on', { date })
    : t('dashboard.sidebar.renews_on', { date })
}
