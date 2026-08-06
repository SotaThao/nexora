import ManagePlanView from '../ManagePlanView'
import type { SubscriptionPackage } from '../../../../data/repositories/subscriptionPayments'
import type { UserSubscription } from '../../../../types/domain'
import { useTranslation } from '../../../../contexts/LanguageContext'
import {
  formatCompareCellDisplay,
  PACKAGE_MANAGEMENT_TK,
  TIP_PLATFORM_COMPARE_PLAN_IDS,
  TIP_PLATFORM_COMPARE_ROWS,
  type TipPlatformComparePlanId,
  type TipPlatformUiPlanIdValue,
} from './constants'

type PackageSubscriptionsPanelProps = {
  currentSubscription?: UserSubscription | null
  packages?: SubscriptionPackage[]
  currentPlanId?: TipPlatformComparePlanId | null
  onSelectPlan?: (planId: TipPlatformUiPlanIdValue) => void
}

function PlanComparisonTable({
  currentPlanId,
}: {
  currentPlanId?: TipPlatformComparePlanId | null
}) {
  const { t } = useTranslation()
  const TK = PACKAGE_MANAGEMENT_TK

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

export default function PackageSubscriptionsPanel({
  currentSubscription = null,
  packages,
  currentPlanId = null,
  onSelectPlan,
}: PackageSubscriptionsPanelProps) {
  return (
    <div className="nexora-package-content package-plan-content">
      <ManagePlanView
        currentSubscription={currentSubscription}
        packages={packages}
        onSelectPlan={onSelectPlan}
        wide
      />
      <PlanComparisonTable currentPlanId={currentPlanId} />
    </div>
  )
}
