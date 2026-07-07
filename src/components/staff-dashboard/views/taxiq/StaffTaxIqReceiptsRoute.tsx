import { useNavigate } from 'react-router-dom'
import { useTranslation } from '../../../../contexts/LanguageContext'
import { useStaffTaxYearByYear } from '../../../../data/hooks/useTaxiqStaffTaxYear'
import { SkeletonList } from '../../../ui/skeleton'
import ReceiptVaultView from '../../../dashboard/views/taxiq/ReceiptVaultView'

// Mirrors StaffTaxIqDeductionsRoute's gating: no StaffTaxYear yet → send the Staff back
// to onboarding instead of rendering a receipt vault with nothing to scope it to.
export default function StaffTaxIqReceiptsRoute() {
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
        <p className="text-sm font-semibold text-nexoraMuted">{t('taxiq.receiptVault.noStaffTaxYear')}</p>
        <button
          type="button"
          onClick={() => navigate('/staff/taxiq')}
          className="rounded-lg bg-nexoraBrand px-4 py-2 text-xs font-bold text-white"
        >
          {t('taxiq.receiptVault.goToSetup')}
        </button>
      </div>
    )
  }

  return <ReceiptVaultView scope="staff" staffTaxYearId={staffTaxYear.id} />
}
