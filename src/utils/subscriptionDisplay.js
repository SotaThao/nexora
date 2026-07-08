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
  const trialEnd = formatSubscriptionDate(subscription.trialEndsAt, locale, { sidebar: true })
  const periodEnd = formatSubscriptionDate(subscription.currentPeriodEnd, locale, { sidebar: true })

  if (subscription.status === 'Trialing' && trialEnd) {
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
