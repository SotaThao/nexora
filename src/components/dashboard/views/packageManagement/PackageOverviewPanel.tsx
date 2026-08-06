import { useEffect, useState } from 'react'
import { Clock3 } from 'lucide-react'
import { useTranslation } from '../../../../contexts/LanguageContext'
import {
  formatBookingHubTimestampDate,
} from '../bookingHubFormatters'
import {
  formatPackageCountdownParts,
  getPackageOverviewStatus,
  PACKAGE_COUNTDOWN_UNITS,
  PACKAGE_MANAGEMENT_TK,
  PACKAGE_OVERVIEW_OWNED_MOCK,
  type PackageOverviewOwnedItem,
} from './constants'

const TK = PACKAGE_MANAGEMENT_TK

function pad2(value: number) {
  return String(value).padStart(2, '0')
}

function OwnedPackageCard({
  item,
  now,
  autoRenew,
  onAutoRenewChange,
}: {
  item: PackageOverviewOwnedItem
  now: number
  autoRenew: boolean
  onAutoRenewChange: (next: boolean) => void
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
              <label className="package-switch">
                <input
                  type="checkbox"
                  checked={autoRenew}
                  onChange={(event) => onAutoRenewChange(event.target.checked)}
                  aria-label={t(`${TK}.overview.autoRenewAria`, {
                    name: t(`${TK}.${item.nameKey}`),
                  })}
                />
                <span className="package-switch-track">
                  <span className="package-switch-thumb" />
                  <span className="package-autorenew-state">
                    {autoRenew ? t(`${TK}.overview.autoRenewOn`) : t(`${TK}.overview.autoRenewOff`)}
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

      <div className="package-countdown" data-countdown>
        <div className="package-countdown-heading">
          <span className="package-countdown-icon" aria-hidden="true">
            <Clock3 />
          </span>
          <span className="package-countdown-label">{t(`${TK}.overview.remaining`)}</span>
        </div>
        <div className="package-countdown-units" role="group" aria-label={t(`${TK}.overview.remaining`)}>
          {PACKAGE_COUNTDOWN_UNITS.map((unit) => (
            <div key={unit} className="package-countdown-unit">
              <strong>{pad2(countdown[unit])}</strong>
              <span>{t(`${TK}.overview.unit.${unit}`)}</span>
            </div>
          ))}
        </div>
      </div>
    </article>
  )
}

export default function PackageOverviewPanel() {
  const [now, setNow] = useState(() => Date.now())
  const [autoRenewById, setAutoRenewById] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(PACKAGE_OVERVIEW_OWNED_MOCK.map((item) => [item.id, item.autoRenew])),
  )

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [])

  return (
    <div className="package-overview-grid">
      {PACKAGE_OVERVIEW_OWNED_MOCK.map((item) => (
        <OwnedPackageCard
          key={item.id}
          item={item}
          now={now}
          autoRenew={autoRenewById[item.id] ?? item.autoRenew}
          onAutoRenewChange={(next) => {
            setAutoRenewById((prev) => ({ ...prev, [item.id]: next }))
          }}
        />
      ))}
    </div>
  )
}
