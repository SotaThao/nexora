import { useEffect, useState } from 'react'
import { X, Loader2 } from 'lucide-react'
import IconButton from '../../../../ui/IconButton'
import Tooltip from '../../../../ui/Tooltip'
import { useTranslation } from '../../../../../contexts/LanguageContext'
import { useNotification } from '../../../../../contexts/NotificationContext'
import { useUpdateStaffTaxYearModules } from '../../../../../data/hooks/useTaxiqStaffTaxYear'
import type { StaffTaxYear } from '../../../../../data/repositories/taxiqStaffTaxYear'

// Values match backend/src/Domain/Enums/TaxIq/TaxIqModule.cs exactly.
const MODULE_OPTIONS = [
  { key: 'DeductionTracking', labelKey: 'taxiq.onboarding.step3.deductionCenter', tooltipKey: 'taxiq.onboarding.step3.tooltips.deductionCenter' },
  { key: 'ReceiptManagement', labelKey: 'taxiq.onboarding.step3.receiptManagement', tooltipKey: 'taxiq.onboarding.step3.tooltips.receiptManagement' },
  { key: 'MileageLog', labelKey: 'taxiq.onboarding.step3.mileageLog', tooltipKey: 'taxiq.onboarding.step3.tooltips.mileageLog' },
  { key: 'CPAExport', labelKey: 'taxiq.onboarding.step3.cpaExport', tooltipKey: 'taxiq.onboarding.step3.tooltips.cpaExport' },
]

export default function EditStaffModuleConfigModal({
  open,
  onClose,
  staffTaxYear,
}: {
  open: boolean
  onClose: () => void
  staffTaxYear: StaffTaxYear
}) {
  const { t } = useTranslation()
  const { showToast } = useNotification()
  const updateModules = useUpdateStaffTaxYearModules()

  const [enabledModules, setEnabledModules] = useState<string[]>(staffTaxYear.enabledModules)
  const [officeSqFt, setOfficeSqFt] = useState(staffTaxYear.officeSqFt?.toString() ?? '')
  const [totalHomeSqFt, setTotalHomeSqFt] = useState(staffTaxYear.totalHomeSqFt?.toString() ?? '')
  const [homeOfficeError, setHomeOfficeError] = useState('')

  useEffect(() => {
    if (open) {
      setEnabledModules(staffTaxYear.enabledModules)
      setOfficeSqFt(staffTaxYear.officeSqFt?.toString() ?? '')
      setTotalHomeSqFt(staffTaxYear.totalHomeSqFt?.toString() ?? '')
      setHomeOfficeError('')
    }
  }, [open, staffTaxYear])

  if (!open) return null

  const toggleModule = (key: string) => {
    setEnabledModules((prev) => (prev.includes(key) ? prev.filter((m) => m !== key) : [...prev, key]))
  }

  const handleSave = async () => {
    if (officeSqFt && totalHomeSqFt && Number(officeSqFt) > Number(totalHomeSqFt)) {
      setHomeOfficeError(t('taxiq.staffOnboarding.step1.homeOfficeError'))
      return
    }
    try {
      await updateModules.mutateAsync({
        id: staffTaxYear.id,
        enabledModules,
        contractType: staffTaxYear.contractType,
        w9Status: staffTaxYear.w9Status,
        officeSqFt: officeSqFt ? Number(officeSqFt) : null,
        totalHomeSqFt: totalHomeSqFt ? Number(totalHomeSqFt) : null,
      })
      showToast(t('taxiq.staffHome.editModulesModal.saved'), 'success')
      onClose()
    } catch {
      showToast(t('taxiq.staffOnboarding.errors.generic'), 'error')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-nexoraText/70 p-4 backdrop-blur-sm">
      <div className="nexora-card flex max-h-[90vh] w-full max-w-md flex-col p-6" style={{ maxHeight: '90dvh' }}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-extrabold text-nexoraText">{t('taxiq.staffHome.editModulesModal.title')}</h2>
          <IconButton label={t('common.cancel')} onClick={onClose}>
            <X className="h-4 w-4" />
          </IconButton>
        </div>

        <div className="flex-1 space-y-2 overflow-y-auto">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-bold text-nexoraMuted">
                <span className="inline-flex items-center gap-1">
                  {t('taxiq.staffOnboarding.step1.officeSqFtLabel')}
                  <Tooltip content={t('taxiq.staffOnboarding.step1.homeOfficeTooltip')} />
                </span>
              </label>
              <input
                type="number"
                min="0"
                value={officeSqFt}
                onChange={(e) => {
                  setOfficeSqFt(e.target.value)
                  setHomeOfficeError('')
                }}
                className="mt-1 w-full rounded-lg border border-nexoraBorder px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-nexoraMuted">
                {t('taxiq.staffOnboarding.step1.totalHomeSqFtLabel')}
              </label>
              <input
                type="number"
                min="0"
                value={totalHomeSqFt}
                onChange={(e) => {
                  setTotalHomeSqFt(e.target.value)
                  setHomeOfficeError('')
                }}
                className="mt-1 w-full rounded-lg border border-nexoraBorder px-3 py-2 text-sm"
              />
            </div>
          </div>
          {homeOfficeError && <p className="text-xs font-semibold text-rose-500">{homeOfficeError}</p>}

          {MODULE_OPTIONS.map((mod) => (
            <label key={mod.key} className="flex items-center gap-2.5 text-sm font-semibold text-nexoraText">
              <input
                type="checkbox"
                checked={enabledModules.includes(mod.key)}
                onChange={() => toggleModule(mod.key)}
                className="h-4 w-4 rounded border-nexoraBorder"
              />
              <span className="inline-flex items-center gap-1">
                {t(mod.labelKey)}
                <Tooltip content={t(mod.tooltipKey)} />
              </span>
            </label>
          ))}
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-xs font-bold text-nexoraMuted"
          >
            {t('taxiq.staffHome.editModulesModal.cancel')}
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={updateModules.isPending}
            className="inline-flex items-center gap-1.5 rounded-lg bg-nexoraBrand px-5 py-2 text-xs font-bold text-white disabled:opacity-60"
          >
            {updateModules.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {t('taxiq.staffHome.editModulesModal.save')}
          </button>
        </div>
      </div>
    </div>
  )
}
