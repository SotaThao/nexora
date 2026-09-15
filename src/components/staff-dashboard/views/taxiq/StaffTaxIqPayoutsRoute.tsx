import { useNavigate } from 'react-router-dom'
import { useTranslation } from '../../../../contexts/LanguageContext'
import { useStaffTaxYearByYear } from '../../../../data/hooks/useTaxiqStaffTaxYear'
import { SkeletonList } from '../../../ui/skeleton'
import PayoutConfirmationView from './PayoutConfirmationView'

// Mirrors StaffTaxIqDeductionsRoute/StaffTaxIqLogsRoute's gating: no StaffTaxYear yet →
// send the Staff back to onboarding instead of rendering payouts with nothing to scope
// them to. Note: GetPendingPayoutsQuery itself doesn't take a staffTaxYearId (scoped by
// JWT), but the gate keeps this route consistent with its siblings.
export default function StaffTaxIqPayoutsRoute() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const currentTaxYear = new Date().getFullYear()
  const { data: staffTaxYearPage, isLoading } = useStaffTaxYearByYear(currentTaxYear)

  if (isLoading) {
    return (
      <div className="nexora-card p-6">
        <SkeletonList count={3} lines={2} />
      </div>
    )
  }

  const staffTaxYear = staffTaxYearPage?.items?.[0] ?? null

  if (!staffTaxYear) {
    return (
      <div className="nexora-card flex flex-col items-start gap-3 p-6">
        <p className="text-sm font-semibold text-nexoraMuted">{t('taxiq.staffPayoutConfirmation.noStaffTaxYear')}</p>
        <button
          type="button"
          onClick={() => navigate('/staff/taxiq')}
          className="rounded-lg bg-nexoraBrand px-4 py-2 text-xs font-semibold text-white"
        >
          {t('taxiq.staffPayoutConfirmation.goToSetup')}
        </button>
      </div>
    )
  }

  return <PayoutConfirmationView staffTaxYearStatus={staffTaxYear.status} />
}
