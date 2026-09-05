import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import ManagePlanView, { type ManagePlanBillingCycle } from '../ManagePlanView'
import { useTranslation } from '../../../../contexts/LanguageContext'
import type { SubscriptionPackage } from '../../../../data/repositories/subscriptionPayments'
import CompleteStoreSetupGateModal from '../../modals/CompleteStoreSetupGateModal'
import {
  CompareCellToken,
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

/** Live price for the compare table's price row — falls back to the static marketing copy
 * when the catalog hasn't loaded yet or this tier has no yearly price. */
function resolveComparePrice(
  packages: SubscriptionPackage[] | undefined,
  packageCode: string,
  isYearly: boolean,
  fallback: string,
): string {
  const pkg = packages?.find((p) => (p.packageCode ?? '').toLowerCase() === packageCode)
  const price = isYearly ? pkg?.yearlyPrice : pkg?.price
  return price != null ? `$${price}` : fallback
}

function PlanComparisonTable({
  currentPlanId,
  packages,
  isYearly,
}: {
  currentPlanId?: TipPlatformComparePlanId | null
  packages?: SubscriptionPackage[]
  isYearly: boolean
}) {
  const { t } = useTranslation()

  const rows = useMemo(() => {
    const [priceRow, ...restRows] = TIP_PLATFORM_COMPARE_ROWS
    const livePriceRow = {
      ...priceRow,
      featureKey: isYearly ? 'compare.yearlyPrice' : 'compare.monthlyPrice',
      starter: resolveComparePrice(packages, 'starter', isYearly, CompareCellToken.PriceStarter),
      pro: resolveComparePrice(packages, 'pro', isYearly, CompareCellToken.PricePro),
    }
    return [livePriceRow, ...restRows]
  }, [packages, isYearly])

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
            {rows.map((row) => (
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
  const [billingCycle, setBillingCycle] = useState<ManagePlanBillingCycle>('monthly')

  const {
    tipPlatformSubscription,
    currentPeriodInMonths,
    comparePlanId,
    packages,
    paymentPlan,
    selectedPackage,
    paymentPlanPrice,
    checkoutBillingCycle,
    clearCheckout,
    handleSelectPlan,
    storeSetupGateOpen,
    closeStoreSetupGate,
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
          currentPeriodInMonths={currentPeriodInMonths}
          packages={packages}
          onSelectPlan={handleSelectPlan}
          billingCycle={billingCycle}
          onBillingCycleChange={setBillingCycle}
          wide
        />
        <PlanComparisonTable
          currentPlanId={comparePlanId}
          packages={packages}
          isYearly={billingCycle === 'yearly'}
        />
      </div>

      <TipPlatformCheckoutModal
        paymentPlan={paymentPlan}
        selectedPackage={selectedPackage}
        paymentPlanPrice={paymentPlanPrice}
        billingCycle={checkoutBillingCycle}
        currentSubscription={tipPlatformSubscription}
        currentPeriodInMonths={currentPeriodInMonths}
        catalogPackages={packages}
        onClose={clearCheckout}
      />
      <CompleteStoreSetupGateModal
        open={storeSetupGateOpen}
        onClose={closeStoreSetupGate}
      />
    </>
  )
}
