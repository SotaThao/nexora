import { useStaffTaxYearByYear } from '../../../../data/hooks/useTaxiqStaffTaxYear'
import { SkeletonList } from '../../../ui/skeleton'
import StaffTaxIqOnboardingWizard from './StaffTaxIqOnboardingWizard'
import StaffTaxIqHomeView from './StaffTaxIqHomeView'

// Gates the /staff/taxiq route between the onboarding wizard (no StaffTaxYear
// yet for the current calendar year) and Staff Tax IQ Home — mirrors the Owner
// side's TaxIqOverviewRoute (src/components/dashboard/routes/index.tsx) branch
// via the list-endpoint existence probe. No businessId needed: StaffTaxYear is
// scoped by the caller's JWT userId only.
export default function StaffTaxIqOverviewRoute() {
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
    return <StaffTaxIqOnboardingWizard taxYear={currentTaxYear} />
  }

  return <StaffTaxIqHomeView staffTaxYear={staffTaxYear} />
}
