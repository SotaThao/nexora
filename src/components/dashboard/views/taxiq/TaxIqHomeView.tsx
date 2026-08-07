import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Settings2, UserPlus } from 'lucide-react'
import { useTranslation } from '../../../../contexts/LanguageContext'
import EditModuleConfigModal from './modals/EditModuleConfigModal'
import TaxReadinessScoreWidget from './shared/TaxReadinessScoreWidget'
import type { OwnerTaxYear } from '../../../../data/repositories/taxiqOwnerTaxYear'

// Values match backend/src/Domain/Enums/TaxIq/TaxIqModule.cs exactly.
const MODULE_LABEL_KEYS: Record<string, string> = {
  DeductionTracking: 'taxiq.onboarding.step3.deductionCenter',
  ReceiptManagement: 'taxiq.onboarding.step3.receiptManagement',
  PayoutTracking: 'taxiq.onboarding.step3.staffPayout',
  MileageLog: 'taxiq.onboarding.step3.mileageLog',
  TaxReminders: 'taxiq.onboarding.step3.taxPaymentReminder',
  CPAExport: 'taxiq.onboarding.step3.cpaExport',
}

export default function TaxIqHomeView({ ownerTaxYear }: { ownerTaxYear: OwnerTaxYear }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [isEditModulesOpen, setIsEditModulesOpen] = useState(false)
  const canEditModules = ownerTaxYear.status === 'Active'

  return (
    <div className="space-y-5">
      <div className="nexora-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-lg font-extrabold text-nexoraText">{t('taxiq.home.title')}</h1>
            <p className="mt-1 text-sm text-nexoraMuted">
              {ownerTaxYear.salonName || '—'} · {t('taxiq.home.taxYearLabel')} {ownerTaxYear.taxYear}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsEditModulesOpen(true)}
            disabled={!canEditModules}
            title={canEditModules ? undefined : t('taxiq.home.editModulesModal.lockedNotice')}
            className="inline-flex items-center gap-1.5 rounded-lg border border-nexoraBorder px-4 py-2 text-xs font-bold text-nexoraText disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Settings2 className="h-3.5 w-3.5" />
            {t('taxiq.home.editModules')}
          </button>
        </div>

        <div className="mt-4">
          <div className="text-xs font-bold uppercase tracking-wider text-nexoraMuted">
            {t('taxiq.home.enabledModulesLabel')}
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {ownerTaxYear.enabledModules.length === 0 && (
              <span className="text-sm text-nexoraMuted">—</span>
            )}
            {ownerTaxYear.enabledModules.map((mod) => (
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

      <TaxReadinessScoreWidget scope="owner" taxYearId={ownerTaxYear.id} />

      <button
        type="button"
        onClick={() => navigate('/dashboard/staff')}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-nexoraBrand hover:underline"
      >
        <UserPlus className="h-3.5 w-3.5" />
        {t('taxiq.home.inviteStaffCta')}
      </button>

      <EditModuleConfigModal
        open={isEditModulesOpen}
        onClose={() => setIsEditModulesOpen(false)}
        ownerTaxYear={ownerTaxYear}
      />
    </div>
  )
}
