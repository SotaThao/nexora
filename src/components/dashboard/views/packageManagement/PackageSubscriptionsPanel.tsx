import { useSearchParams } from 'react-router-dom'
import ManagePlanView from '../ManagePlanView'
import { useTranslation } from '../../../../contexts/LanguageContext'
import {
  formatCompareCellDisplay,
  PACKAGE_MANAGEMENT_TK,
  TIP_PLATFORM_COMPARE_PLAN_IDS,
  TIP_PLATFORM_COMPARE_ROWS,
  type TipPlatformComparePlanId,
} from './constants'
import TipPlatformCheckoutModal from './TipPlatformCheckoutModal'
import { useTipPlatformCheckoutFlow } from './useTipPlatformCheckoutFlow'

const TK = PACKAGE_MANAGEMENT_TK

type PackageSubscriptionsPanelProps = {
  profile: LooseObject | null | undefined
}

function PlanComparisonTable({
  currentPlanId,
}: {
  currentPlanId?: TipPlatformComparePlanId | null
}) {
  const { t } = useTranslation()

  return (
    <section className="nexora-compare-section" aria-labelledby="nexora-compare-title">
      <div className="nexora-compare-heading">
        <div>
          <span className="package-overview-kicker">{t(`${TK}.compare.kicker`)}</span>
          <h2 id="nexora-compare-title">{t(`${TK}.compare.title`)}</h2>
        </div>
        <span className="nexora-package-note">{t(`${TK}.compare.note`)}</span>
      </div>
      <div className="nexora-compare-table-wrap">
        <table className="nexora-compare-table">
          <caption className="sr-only">{t(`${TK}.compare.caption`)}</caption>
          <thead>
            <tr>
              <th scope="col">{t(`${TK}.compare.feature`)}</th>
              {TIP_PLATFORM_COMPARE_PLAN_IDS.map((planId) => (
                <th
                  key={planId}
                  scope="col"
                  className={currentPlanId === planId ? 'is-highlighted' : undefined}
                >
                  {t(`${TK}.compare.plans.${planId}`)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {TIP_PLATFORM_COMPARE_ROWS.map((row) => (
              <tr key={row.featureKey}>
                <th scope="row">{t(`${TK}.${row.featureKey}`)}</th>
                {TIP_PLATFORM_COMPARE_PLAN_IDS.map((planId) => {
                  const cell = row[planId]
                  return (
                    <td
                      key={planId}
                      className={[
                        currentPlanId === planId ? 'is-highlighted' : '',
                        cell === true ? 'is-supported' : '',
                      ]
                        .filter(Boolean)
                        .join(' ') || undefined}
                    >
                      {formatCompareCellDisplay(cell, t)}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

/** Subscriptions tab — TipPlatform catalog fetch runs only while this panel is mounted. */
export default function PackageSubscriptionsPanel({
  profile,
}: PackageSubscriptionsPanelProps) {
  const [searchParams, setSearchParams] = useSearchParams()

  const {
    tipPlatformSubscription,
    comparePlanId,
    packages,
    paymentPlan,
    selectedPackage,
    paymentPlanPrice,
    checkoutBillingCycle,
    clearCheckout,
    handleSelectPlan,
  } = useTipPlatformCheckoutFlow({
    profile,
    searchParams,
    setSearchParams,
    packagesEnabled: true,
    deepLinkEnabled: true,
  })

  return (
    <>
      <div className="nexora-package-content package-plan-content">
        <ManagePlanView
          currentSubscription={tipPlatformSubscription}
          packages={packages}
          onSelectPlan={handleSelectPlan}
          wide
        />
        <PlanComparisonTable currentPlanId={comparePlanId} />
      </div>

      <TipPlatformCheckoutModal
        paymentPlan={paymentPlan}
        selectedPackage={selectedPackage}
        paymentPlanPrice={paymentPlanPrice}
        billingCycle={checkoutBillingCycle}
        onClose={clearCheckout}
      />
    </>
  )
}
