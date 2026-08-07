import { useState } from 'react'
import { Loader2, Trash2, X } from 'lucide-react'
import IconButton from '../../../../ui/IconButton'
import { SkeletonList } from '../../../../ui/skeleton'
import { useTranslation } from '../../../../../contexts/LanguageContext'
import { useNotification } from '../../../../../contexts/NotificationContext'
import {
  useDeletePreTaxDeduction,
  usePreTaxDeductions,
  useUpsertPreTaxDeduction,
} from '../../../../../data/hooks/usePosStaffProfile'
import {
  PRE_TAX_DEDUCTION_AMOUNT_TYPES,
  PRE_TAX_DEDUCTION_TYPES,
  type PreTaxDeductionAmountType,
  type PreTaxDeductionType,
} from '../../../../../data/repositories/posStaffProfile'
import { isApiError } from '../../../../../types/domain'
import { getErrorI18nKey } from '../../../../../data/errorCodes'

interface Props {
  businessStaffLinkId: string
  displayName: string
  onClose: () => void
}

export default function PreTaxDeductionsModal({ businessStaffLinkId, displayName, onClose }: Props) {
  const { t } = useTranslation()
  const { showToast } = useNotification()
  const query = usePreTaxDeductions(businessStaffLinkId)
  const upsert = useUpsertPreTaxDeduction()
  const remove = useDeletePreTaxDeduction()

  const deductions = query.data ?? []
  const availableTypes = PRE_TAX_DEDUCTION_TYPES.filter((type) => !deductions.some((d) => d.type === type))

  const [newType, setNewType] = useState<PreTaxDeductionType | null>(null)
  const [newAmountType, setNewAmountType] = useState<PreTaxDeductionAmountType>('FlatPerPayPeriod')
  const [newAmount, setNewAmount] = useState('')
  const [error, setError] = useState('')

  // The "add" type must always be one of the types not yet configured — once a type is added,
  // it disappears from availableTypes, so a stale selection (e.g. still pointing at the type
  // just added) would silently overwrite that row instead of creating the next one.
  const selectedType = newType && availableTypes.includes(newType) ? newType : (availableTypes[0] ?? null)

  const isBusy = upsert.isPending || remove.isPending

  const reportError = (err: unknown, fallback: string) => {
    let message = fallback
    if (isApiError(err)) {
      const i18nKey = getErrorI18nKey(err.errorCode)
      const translated = t(i18nKey)
      message = translated !== i18nKey ? translated : (err.message || fallback)
    }
    setError(message)
  }

  const handleAdd = async () => {
    if (isBusy || !newAmount || !selectedType) return
    setError('')
    try {
      await upsert.mutateAsync({
        businessStaffLinkId,
        type: selectedType,
        amountType: newAmountType,
        amount: Number(newAmount),
        isActive: true,
      })
      setNewType(null)
      setNewAmount('')
      showToast(t('taxiq.payEngine.preTaxDeductions.savedNotice'), 'success')
    } catch (err) {
      reportError(err, t('taxiq.payEngine.preTaxDeductions.errors.generic'))
    }
  }

  const handleToggleActive = async (type: PreTaxDeductionType, amountType: PreTaxDeductionAmountType, amount: number, isActive: boolean) => {
    if (isBusy) return
    setError('')
    try {
      await upsert.mutateAsync({ businessStaffLinkId, type, amountType, amount, isActive })
      showToast(t('taxiq.payEngine.preTaxDeductions.savedNotice'), 'success')
    } catch (err) {
      reportError(err, t('taxiq.payEngine.preTaxDeductions.errors.generic'))
    }
  }

  const handleDelete = async (type: PreTaxDeductionType) => {
    if (isBusy) return
    setError('')
    try {
      await remove.mutateAsync({ businessStaffLinkId, type })
      showToast(t('taxiq.payEngine.preTaxDeductions.deletedNotice'), 'success')
    } catch (err) {
      reportError(err, t('taxiq.payEngine.preTaxDeductions.errors.generic'))
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-nexoraText/70 p-4 backdrop-blur-sm">
      <div className="nexora-modal-card max-w-xl">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-extrabold text-nexoraText">{t('taxiq.payEngine.preTaxDeductions.modalTitle')}</h2>
            <p className="text-xs font-medium text-nexoraMuted">{displayName}</p>
          </div>
          <IconButton label={t('common.cancel')} onClick={onClose}>
            <X className="h-4 w-4" />
          </IconButton>
        </div>

        <p className="mb-4 text-[11px] font-medium text-nexoraMuted">{t('taxiq.payEngine.preTaxDeductions.subtitle')}</p>

        {query.isPending ? (
          <SkeletonList count={2} lines={2} />
        ) : (
          <div className="flex-1 space-y-4 overflow-y-auto">
            {deductions.length === 0 ? (
              <p className="rounded-lg bg-nexoraCanvas px-3 py-4 text-center text-xs font-semibold text-nexoraMuted">
                {t('taxiq.payEngine.preTaxDeductions.emptyState')}
              </p>
            ) : (
              <div className="space-y-2">
                {deductions.map((d) => (
                  <div key={d.type} className="grid grid-cols-1 items-center gap-2 rounded-lg border border-nexoraBorder p-3 sm:grid-cols-[1fr_auto_auto]">
                    <div>
                      <div className="text-xs font-bold text-nexoraText">{t(`taxiq.payEngine.preTaxDeductions.types.${d.type}`)}</div>
                      <div className="text-[11px] text-nexoraMuted">
                        {t(`taxiq.payEngine.preTaxDeductions.amountTypes.${d.amountType}`)} — {d.amountType === 'PercentOfGross' ? `${d.amount}%` : `$${d.amount}`}
                      </div>
                    </div>
                    <label className="flex items-center gap-2 text-xs font-semibold text-nexoraText">
                      <input
                        type="checkbox"
                        checked={d.isActive}
                        disabled={isBusy}
                        onChange={(e) => handleToggleActive(d.type, d.amountType, d.amount, e.target.checked)}
                        className="h-4 w-4 rounded border-nexoraBorder"
                      />
                      {t('taxiq.payEngine.preTaxDeductions.activeLabel')}
                    </label>
                    <button
                      type="button"
                      onClick={() => handleDelete(d.type)}
                      disabled={isBusy}
                      className="inline-flex items-center gap-1 justify-self-start text-[11px] font-bold text-rose-600 hover:underline disabled:opacity-60 sm:justify-self-center"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      {t('taxiq.payEngine.preTaxDeductions.deleteButton')}
                    </button>
                  </div>
                ))}
              </div>
            )}

            {availableTypes.length > 0 ? (
              <div className="space-y-3 rounded-lg bg-nexoraCanvas p-3">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-bold text-nexoraMuted">{t('taxiq.payEngine.preTaxDeductions.typeLabel')}</label>
                    <select
                      value={selectedType ?? ''}
                      onChange={(e) => setNewType(e.target.value as PreTaxDeductionType)}
                      className="w-full rounded-lg border border-nexoraBorder px-3 py-2 text-xs font-semibold"
                    >
                      {availableTypes.map((type) => (
                        <option key={type} value={type}>
                          {t(`taxiq.payEngine.preTaxDeductions.types.${type}`)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-bold text-nexoraMuted">{t('taxiq.payEngine.preTaxDeductions.amountTypeLabel')}</label>
                    <select
                      value={newAmountType}
                      onChange={(e) => setNewAmountType(e.target.value as PreTaxDeductionAmountType)}
                      className="w-full rounded-lg border border-nexoraBorder px-3 py-2 text-xs font-semibold"
                    >
                      {PRE_TAX_DEDUCTION_AMOUNT_TYPES.map((amountType) => (
                        <option key={amountType} value={amountType}>
                          {t(`taxiq.payEngine.preTaxDeductions.amountTypes.${amountType}`)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold text-nexoraMuted">{t('taxiq.payEngine.preTaxDeductions.amountLabel')}</label>
                  <input
                    type="number"
                    min={0}
                    max={newAmountType === 'PercentOfGross' ? 100 : undefined}
                    step="0.01"
                    value={newAmount}
                    onChange={(e) => setNewAmount(e.target.value)}
                    className="w-full rounded-lg border border-nexoraBorder px-3 py-2 text-xs"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAdd}
                  disabled={isBusy || !newAmount || !selectedType}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-nexoraBrand px-4 py-2 text-xs font-bold text-white disabled:opacity-60"
                >
                  {upsert.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  {t('taxiq.payEngine.preTaxDeductions.addButton')}
                </button>
              </div>
            ) : (
              <p className="text-[11px] font-medium text-nexoraMuted">{t('taxiq.payEngine.preTaxDeductions.allTypesConfigured')}</p>
            )}

            {error && <p className="text-xs font-semibold text-rose-600">{error}</p>}
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-xs font-bold text-nexoraMuted">
            {t('common.close')}
          </button>
        </div>
      </div>
    </div>
  )
}
