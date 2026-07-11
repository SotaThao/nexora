import { useEffect, useState } from 'react'
import { X, Loader2 } from 'lucide-react'
import IconButton from '../../../../ui/IconButton'
import Tooltip from '../../../../ui/Tooltip'
import { useTranslation } from '../../../../../contexts/LanguageContext'
import { useNotification } from '../../../../../contexts/NotificationContext'
import { useUpdateOwnerTaxYearModules } from '../../../../../data/hooks/useTaxiqOwnerTaxYear'
import type { OwnerTaxYear, OwnerTaxYearEmployeeTypeConfig } from '../../../../../data/repositories/taxiqOwnerTaxYear'

// Values match backend/src/Domain/Enums/TaxIq/TaxIqModule.cs exactly.
const MODULE_OPTIONS = [
  { key: 'DeductionTracking', labelKey: 'taxiq.onboarding.step3.deductionCenter', tooltipKey: 'taxiq.onboarding.step3.tooltips.deductionCenter' },
  { key: 'ReceiptManagement', labelKey: 'taxiq.onboarding.step3.receiptManagement', tooltipKey: 'taxiq.onboarding.step3.tooltips.receiptManagement' },
  { key: 'PayoutTracking', labelKey: 'taxiq.onboarding.step3.staffPayout', tooltipKey: 'taxiq.onboarding.step3.tooltips.staffPayout' },
  { key: 'TaxReminders', labelKey: 'taxiq.onboarding.step3.taxPaymentReminder', tooltipKey: 'taxiq.onboarding.step3.tooltips.taxPaymentReminder' },
  { key: 'CPAExport', labelKey: 'taxiq.onboarding.step3.cpaExport', tooltipKey: 'taxiq.onboarding.step3.tooltips.cpaExport' },
]

export default function EditModuleConfigModal({
  open,
  onClose,
  ownerTaxYear,
}: {
  open: boolean
  onClose: () => void
  ownerTaxYear: OwnerTaxYear
}) {
  const { t } = useTranslation()
  const { showToast } = useNotification()
  const updateModules = useUpdateOwnerTaxYearModules()

  const [enabledModules, setEnabledModules] = useState<string[]>(ownerTaxYear.enabledModules)
  const [employeeTypeConfig, setEmployeeTypeConfig] = useState<OwnerTaxYearEmployeeTypeConfig>(
    ownerTaxYear.employeeTypeConfig,
  )

  useEffect(() => {
    if (open) {
      setEnabledModules(ownerTaxYear.enabledModules)
      setEmployeeTypeConfig(ownerTaxYear.employeeTypeConfig)
    }
  }, [open, ownerTaxYear])

  if (!open) return null

  const toggleModule = (key: string) => {
    setEnabledModules((prev) => (prev.includes(key) ? prev.filter((m) => m !== key) : [...prev, key]))
  }

  const handleSave = async () => {
    try {
      await updateModules.mutateAsync({ id: ownerTaxYear.id, enabledModules, employeeTypeConfig })
      showToast(t('taxiq.home.editModulesModal.saved'), 'success')
      onClose()
    } catch {
      showToast(t('taxiq.onboarding.errors.generic'), 'error')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-nexoraText/70 p-4 backdrop-blur-sm">
      <div className="nexora-card w-full max-w-md p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-extrabold text-nexoraText">{t('taxiq.home.editModulesModal.title')}</h2>
          <IconButton label={t('common.cancel')} onClick={onClose}>
            <X className="h-4 w-4" />
          </IconButton>
        </div>

        <div className="space-y-3">
          {([
            ['hasW2', 'taxiq.onboarding.step2.w2Label'],
            ['hasContractor1099', 'taxiq.onboarding.step2.contractor1099Label'],
            ['hasBoothRenter', 'taxiq.onboarding.step2.boothRenterLabel'],
          ] as const).map(([field, labelKey]) => (
            <label key={field} className="flex items-center gap-2.5 text-sm font-semibold text-nexoraText">
              <input
                type="checkbox"
                checked={employeeTypeConfig[field] ?? false}
                onChange={(e) =>
                  setEmployeeTypeConfig((prev) => ({ ...prev, [field]: e.target.checked }))
                }
                className="h-4 w-4 rounded border-nexoraBorder"
              />
              {t(labelKey)}
            </label>
          ))}

          <div className="pt-2 space-y-2">
            {MODULE_OPTIONS.map((mod) => (
              <label key={mod.key} className="flex items-center gap-2.5 text-sm font-semibold text-nexoraText">
                <input
                  type="checkbox"
                  checked={enabledModules.includes(mod.key)}
                  onChange={() => toggleModule(mod.key)}
                  className="h-4 w-4 rounded border-nexoraBorder"
                />
                {t(mod.labelKey)}
                <Tooltip content={t(mod.tooltipKey)} />
              </label>
            ))}
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-xs font-bold text-nexoraMuted"
          >
            {t('taxiq.home.editModulesModal.cancel')}
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={updateModules.isPending}
            className="inline-flex items-center gap-1.5 rounded-lg bg-nexoraBrand px-5 py-2 text-xs font-bold text-white disabled:opacity-60"
          >
            {updateModules.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {t('taxiq.home.editModulesModal.save')}
          </button>
        </div>
      </div>
    </div>
  )
}
