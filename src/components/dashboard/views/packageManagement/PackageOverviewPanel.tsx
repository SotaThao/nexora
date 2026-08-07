import { useCallback, useEffect, useMemo, useState } from 'react'
import { Boxes, Clock3, TimerOff } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from '../../../../contexts/LanguageContext'
import { useNotification } from '../../../../contexts/NotificationContext'
import {
  useSubscriptionMyPackages,
  useUpdateSubscriptionAutoRenew,
} from '../../../../data/hooks/useSubscriptionPayments'
import { resolveTranslatedApiError } from '../../../../utils/resolveTranslatedApiError'
import {
  formatBookingHubTimestampDate,
} from '../bookingHubFormatters'
import {
  formatPackageCountdownParts,
  getPackageOverviewStatus,
  mapMyPackageToOwnedItem,
  PACKAGE_COUNTDOWN_UNITS,
  PACKAGE_OVERVIEW_AUTO_RENEW_TOAST_KEY,
  PACKAGE_OVERVIEW_RENEW_CTA_KEY,
  PACKAGE_OVERVIEW_SKELETON_CARD_COUNT,
  PACKAGE_MANAGEMENT_TK,
  PACKAGE_QUERY_PARAM,
  PackageManagementTab,
  resolveAutoRenewStateKey,
  resolveAutoRenewToastKey,
  resolvePackageRenewTab,
  type PackageOverviewOwnedItem,
  type PackageOverviewProductKey,
} from './constants'
import { stripPlanQueryParam } from './tipPlatformCheckout'
import OverviewEmptyState from '../../overview/OverviewEmptyState'
import Skeleton from '../../../ui/skeleton/Skeleton'

const TK = PACKAGE_MANAGEMENT_TK
const AUTO_RENEW_ERROR_KEY = `${TK}.overview.${PACKAGE_OVERVIEW_AUTO_RENEW_TOAST_KEY.error}`

function pad2(value: number) {
  return String(value).padStart(2, '0')
}

function OwnedPackageCard({
  item,
  now,
  autoRenew,
  isUpdating,
  onAutoRenewChange,
  onRenewPackage,
}: {
  item: PackageOverviewOwnedItem
  now: number
  autoRenew: boolean
  isUpdating: boolean
  onAutoRenewChange: (next: boolean) => void
  onRenewPackage: (productKey: PackageOverviewProductKey) => void
}) {
  const { t, currentLanguage } = useTranslation()
  const status = getPackageOverviewStatus(item.expiresAt, now)
  const countdown = formatPackageCountdownParts(item.expiresAt, now)
  const statusLabel = t(`${TK}.overview.status.${status}`)
  const productLabel = t(`${TK}.overview.product.${item.productKey}`)
  const activatedLabel = formatBookingHubTimestampDate(
    item.activatedAt,
    currentLanguage,
  )
  const expiresLabel = formatBookingHubTimestampDate(
    item.expiresAt,
    currentLanguage,
  )
  const needsManualRenew = countdown.expired && !autoRenew
  const renewCtaKey = PACKAGE_OVERVIEW_RENEW_CTA_KEY[item.productKey]
  const autoRenewStateKey = `${TK}.overview.${resolveAutoRenewStateKey(autoRenew)}`

  return (
    <article className="package-owned-card" data-owned-package={item.id}>
      <div className="package-owned-card-top">
        <span className="package-product-badge">{productLabel}</span>
        <span className={`package-status is-${status}`}>{statusLabel}</span>
      </div>

      <div className="package-owned-title-row">
        <div className="package-owned-info">
          <div className="package-owned-name-row">
            <h3>{t(`${TK}.${item.nameKey}`)}</h3>
            <div className="package-autorenew-row">
              <span className="package-autorenew-label">{t(`${TK}.overview.autoRenew`)}</span>
              <label className={`package-switch${isUpdating ? ' is-disabled' : ''}`}>
                <input
                  type="checkbox"
                  checked={autoRenew}
                  disabled={isUpdating}
                  onChange={(event) => onAutoRenewChange(event.target.checked)}
                  aria-label={t(`${TK}.overview.autoRenewAria`, {
                    name: t(`${TK}.${item.nameKey}`),
                  })}
                />
                <span className="package-switch-track">
                  <span className="package-switch-thumb" />
                  <span className="package-autorenew-state">
                    {t(autoRenewStateKey)}
                  </span>
                </span>
              </label>
            </div>
          </div>
          <p>{t(`${TK}.${item.descriptionKey}`)}</p>
        </div>
      </div>

      <div className="package-date-grid">
        <div>
          <span>{t(`${TK}.overview.activated`)}</span>
          <strong>{activatedLabel}</strong>
        </div>
        <div>
          <span>{t(`${TK}.overview.expires`)}</span>
          <strong>{expiresLabel}</strong>
        </div>
      </div>

      <div
        className={`package-countdown${needsManualRenew ? ' is-expired' : ''}`}
        data-countdown
      >
        <div className="package-countdown-heading">
          <span className="package-countdown-icon" aria-hidden="true">
            {needsManualRenew ? <TimerOff /> : <Clock3 />}
          </span>
          <span className="package-countdown-label">{t(`${TK}.overview.remaining`)}</span>
        </div>
        {needsManualRenew ? (
          <div className="package-countdown-expired" role="status">
            <p>{t(`${TK}.overview.remainingExpiredHint`)}</p>
            <button
              type="button"
              className="package-countdown-renew-button"
              onClick={() => onRenewPackage(item.productKey)}
            >
              {t(`${TK}.overview.${renewCtaKey}`)}
            </button>
          </div>
        ) : (
          <div className="package-countdown-units" role="group" aria-label={t(`${TK}.overview.remaining`)}>
            {PACKAGE_COUNTDOWN_UNITS.map((unit) => (
              <div key={unit} className="package-countdown-unit">
                <strong>{pad2(countdown[unit])}</strong>
                <span>{t(`${TK}.overview.unit.${unit}`)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </article>
  )
}

export default function PackageOverviewPanel() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [now, setNow] = useState(() => Date.now())
  const { t } = useTranslation()
  const { showToast } = useNotification()
  const { data: myPackages = [], isLoading } = useSubscriptionMyPackages()
  const updateAutoRenewMutation = useUpdateSubscriptionAutoRenew()

  const navigateToRenewTab = useCallback(
    (productKey: PackageOverviewProductKey) => {
      const tab = resolvePackageRenewTab(productKey)
      const next = new URLSearchParams(searchParams)
      next.set(PACKAGE_QUERY_PARAM.tab, tab)
      if (tab !== PackageManagementTab.Subscriptions) {
        const stripped = stripPlanQueryParam(next)
        setSearchParams(stripped ?? next)
        return
      }
      setSearchParams(next)
    },
    [searchParams, setSearchParams],
  )

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [])

  const ownedPackages = useMemo(
    () =>
      myPackages
        .map(mapMyPackageToOwnedItem)
        .filter((item): item is PackageOverviewOwnedItem => item != null),
    [myPackages],
  )

  const handleAutoRenewChange = useCallback(
    (subscriptionId: string, nextAutoRenew: boolean) => {
      updateAutoRenewMutation.mutate(
        { subscriptionId, autoRenew: nextAutoRenew },
        {
          onSuccess: (result) => {
            showToast(
              t(`${TK}.overview.${resolveAutoRenewToastKey(result.autoRenew)}`),
              'success',
            )
          },
          onError: (error) => {
            showToast(
              resolveTranslatedApiError(t, error, AUTO_RENEW_ERROR_KEY),
              'error',
            )
          },
        },
      )
    },
    [showToast, t, updateAutoRenewMutation],
  )

  const pendingSubscriptionId = updateAutoRenewMutation.isPending
    ? updateAutoRenewMutation.variables?.subscriptionId ?? null
    : null

  if (isLoading) {
    return (
      <div className="package-overview-grid" aria-busy="true" aria-live="polite">
        {Array.from({ length: PACKAGE_OVERVIEW_SKELETON_CARD_COUNT }, (_, idx) => (
          <article key={`package-skel-${idx}`} className="package-owned-card">
            <Skeleton width="100%" height={260} borderRadius={14} />
          </article>
        ))}
      </div>
    )
  }

  if (ownedPackages.length === 0) {
    return (
      <div className="package-overview-grid" style={{ gridTemplateColumns: '1fr' }}>
        <OverviewEmptyState
          icon={Boxes}
          title={t(`${TK}.overview.emptyTitle`)}
          description={t(`${TK}.overview.emptyDesc`)}
          className="min-h-[280px]"
        />
      </div>
    )
  }

  return (
    <div className="package-overview-grid">
      {ownedPackages.map((item) => (
        <OwnedPackageCard
          key={item.id}
          item={item}
          now={now}
          autoRenew={item.autoRenew}
          isUpdating={pendingSubscriptionId === item.id}
          onAutoRenewChange={(next) => handleAutoRenewChange(item.id, next)}
          onRenewPackage={navigateToRenewTab}
        />
      ))}
    </div>
  )
}
