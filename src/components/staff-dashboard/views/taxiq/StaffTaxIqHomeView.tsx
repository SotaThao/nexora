import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertCircle, Settings2 } from 'lucide-react'
import { useTranslation } from '../../../../contexts/LanguageContext'
import EditStaffModuleConfigModal from './modals/EditStaffModuleConfigModal'
import StaffTaxProfileCard from './StaffTaxProfileCard'
import StaffW4FormCard from './StaffW4FormCard'
import TaxReadinessScoreWidget from '../../../dashboard/views/taxiq/shared/TaxReadinessScoreWidget'
import { useStaffTaxYearDashboard } from '../../../../data/hooks/useTaxiqStaffTaxYear'
import { SkeletonList } from '../../../ui/skeleton'
import Tooltip from '../../../ui/Tooltip'
import type { StaffTaxYear } from '../../../../data/repositories/taxiqStaffTaxYear'

// Values match backend/src/Domain/Enums/TaxIq/TaxIqModule.cs exactly.
const MODULE_LABEL_KEYS: Record<string, string> = {
  DeductionTracking: 'taxiq.onboarding.step3.deductionCenter',
  ReceiptManagement: 'taxiq.onboarding.step3.receiptManagement',
  MileageLog: 'taxiq.onboarding.step3.mileageLog',
  CPAExport: 'taxiq.onboarding.step3.cpaExport',
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)
}

export default function StaffTaxIqHomeView({ staffTaxYear }: { staffTaxYear: StaffTaxYear }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [isEditModulesOpen, setIsEditModulesOpen] = useState(false)
  const canEditModules = staffTaxYear.status === 'Active'

  const { data: dashboard, isLoading: isDashboardLoading } = useStaffTaxYearDashboard(staffTaxYear.id)

  return (
    <div className="space-y-5">
      <div className="nexora-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-lg font-extrabold text-nexoraText">{t('taxiq.staffHome.title')}</h1>
            <p className="mt-1 text-sm text-nexoraMuted">
              {t('taxiq.staffHome.taxYearLabel')} {staffTaxYear.taxYear}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsEditModulesOpen(true)}
            disabled={!canEditModules}
            title={canEditModules ? undefined : t('taxiq.staffHome.editModulesModal.lockedNotice')}
            className="inline-flex items-center gap-1.5 rounded-lg border border-nexoraBorder px-4 py-2 text-xs font-bold text-nexoraText disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Settings2 className="h-3.5 w-3.5" />
            {t('taxiq.staffHome.editModules')}
          </button>
        </div>

        <div className="mt-4">
          <div className="text-xs font-bold uppercase tracking-wider text-nexoraMuted">
            {t('taxiq.staffHome.enabledModulesLabel')}
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {staffTaxYear.enabledModules.length === 0 && (
              <span className="text-sm text-nexoraMuted">—</span>
            )}
            {staffTaxYear.enabledModules.map((mod) => (
              <span
                key={mod}
                className="rounded-full bg-nexoraBrandSoft px-3 py-1 text-xs font-bold text-nexoraBrand"
              >
                {t(MODULE_LABEL_KEYS[mod] ?? mod)}
              </span>
            ))}
          </div>
        </div>
      </div>

      {isDashboardLoading || !dashboard ? (
        <div className="nexora-card p-6">
          <SkeletonList count={3} lines={2} />
        </div>
      ) : (
        <div className="nexora-card p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-nexoraMuted">
                <span className="inline-flex items-center gap-1">
                  {t('taxiq.staffHome.ownerReportedIncomeLabel')}
                  <Tooltip content={t('taxiq.staffHome.tooltips.ownerReportedIncome')} />
                </span>
              </div>
              <div className="mt-1 text-lg font-extrabold text-nexoraText">
                {formatCurrency(dashboard.ownerReportedIncome)}
              </div>
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-nexoraMuted">
                <span className="inline-flex items-center gap-1">
                  {t('taxiq.staffHome.selfReportedIncomeLabel')}
                  <Tooltip content={t('taxiq.staffHome.tooltips.selfReportedIncome')} />
                </span>
              </div>
              <div className="mt-1 text-lg font-extrabold text-nexoraText">
                {formatCurrency(dashboard.selfReportedIncome)}
              </div>
              <button
                type="button"
                onClick={() => navigate('/staff/taxiq/income')}
                className="mt-1 text-[11px] font-bold text-nexoraBrand hover:underline"
              >
                {t('taxiq.selfReportedIncome.dashboard.viewDetails')}
              </button>
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-nexoraMuted">
                <span className="inline-flex items-center gap-1">
                  {t('taxiq.staffHome.grossIncomeLabel')}
                  <Tooltip content={t('taxiq.staffHome.tooltips.grossIncome')} />
                </span>
              </div>
              <div className="mt-1 text-lg font-extrabold text-nexoraText">
                {formatCurrency(dashboard.grossIncome)}
              </div>
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-nexoraMuted">
                {t('taxiq.staffHome.totalDeductionsLabel')}
              </div>
              <div className="mt-1 text-lg font-extrabold text-nexoraText">
                {formatCurrency(dashboard.totalDeductions)}
              </div>
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-nexoraMuted">
                <span className="inline-flex items-center gap-1">
                  {t('taxiq.staffHome.estimatedNetIncomeLabel')}
                  <Tooltip content={t('taxiq.staffHome.tooltips.estimatedNetIncome')} />
                </span>
              </div>
              <div className="mt-1 text-lg font-extrabold text-nexoraText">
                {formatCurrency(dashboard.estimatedNetIncome)}
              </div>
            </div>
          </div>

          {dashboard.pendingPayoutsCount > 0 && (
            <button
              type="button"
              onClick={() => navigate('/staff/taxiq/payouts')}
              className="mt-5 inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-400"
            >
              <AlertCircle className="h-3.5 w-3.5" />
              {t('taxiq.staffHome.pendingPayoutsBadge', { count: dashboard.pendingPayoutsCount })}
            </button>
          )}
        </div>
      )}

      <StaffTaxProfileCard />

      <StaffW4FormCard staffTaxYear={staffTaxYear} />

      <TaxReadinessScoreWidget scope="staff" taxYearId={staffTaxYear.id} />

      <EditStaffModuleConfigModal
        open={isEditModulesOpen}
        onClose={() => setIsEditModulesOpen(false)}
        staffTaxYear={staffTaxYear}
      />
    </div>
  )
}
