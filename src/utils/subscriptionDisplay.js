export function formatSubscriptionDate(iso, locale = 'en') {
  if (!iso) return null
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return null

  return date.toLocaleDateString(locale === 'vi' ? 'vi-VN' : 'en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function getSubscriptionSidebarCopy(subscription, t, locale = 'en') {
  if (!subscription?.plan) {
    return { planLabel: null, detailLabel: null }
  }

  const planLabel = subscription.plan
  const trialEnd = formatSubscriptionDate(subscription.trialEndsAt, locale)
  const periodEnd = formatSubscriptionDate(subscription.currentPeriodEnd, locale)

  if (subscription.status === 'Trialing' && trialEnd) {
    return {
      planLabel,
      detailLabel: t('dashboard.sidebar.trial_ends', { date: trialEnd }),
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
