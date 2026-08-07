import { useState } from 'react'
import { Loader2, X } from 'lucide-react'
import IconButton from '../../../../ui/IconButton'
import { useTranslation } from '../../../../../contexts/LanguageContext'
import { useNotification } from '../../../../../contexts/NotificationContext'
import { useAddTipLedgerEntry, useEditTipLedgerEntry } from '../../../../../data/hooks/useTaxiqTipLedger'
import { TIP_METHODS, TIP_PROOF_TYPES } from '../../../../../data/repositories/taxiqTipLedger'
import type { TipLedgerEntry, TipMethod, TipProofType } from '../../../../../data/repositories/taxiqTipLedger'
import { isApiError } from '../../../../../types/domain'
import { getErrorI18nKey } from '../../../../../data/errorCodes'

const SERVICE_TYPES = ['Manicure', 'Pedicure', 'NailFullSet', 'Eyebrows', 'Lashes', 'Waxing', 'Facial', 'Other'] as const

interface FormErrors {
  date?: string
  amount?: string
  reason?: string
}

export default function AddEditTipModal({
  open,
  mode,
  onClose,
  ownerTaxYearId,
  staffTaxYearId,
  entry,
}: {
  open: boolean
  mode: 'add' | 'edit'
  onClose: () => void
  ownerTaxYearId: string
  staffTaxYearId: string
  entry?: TipLedgerEntry | null
}) {
  const { t } = useTranslation()
  const { showToast } = useNotification()
  const addTip = useAddTipLedgerEntry()
  const editTip = useEditTipLedgerEntry(staffTaxYearId)

  const [date, setDate] = useState(entry?.date ?? new Date().toISOString().split('T')[0])
  const [method, setMethod] = useState<TipMethod>((entry?.method as TipMethod) ?? 'Cash')
  const [amount, setAmount] = useState(entry ? String(entry.amount) : '')
  const [serviceType, setServiceType] = useState(entry?.serviceType ?? '')
  const [serviceAmount, setServiceAmount] = useState(entry?.serviceAmount != null ? String(entry.serviceAmount) : '')
  const [isVoluntary, setIsVoluntary] = useState(entry ? entry.qualifiedStatus !== 'NotQualified' : true)
  const [isNotMandatoryServiceCharge, setIsNotMandatoryServiceCharge] = useState(entry ? entry.qualifiedStatus !== 'NotQualified' : true)
  const [proof, setProof] = useState<TipProofType>((entry?.proof as TipProofType) ?? 'None')
  const [note, setNote] = useState(entry?.note ?? '')
  const [reason, setReason] = useState('')
  const [errors, setErrors] = useState<FormErrors>({})

  if (!open) return null

  const isPending = addTip.isPending || editTip.isPending

  const validate = (): boolean => {
    const nextErrors: FormErrors = {}
    if (!date) nextErrors.date = t('taxiq.tipLedger.form.dateRequired')
    if (!amount || Number(amount) <= 0) nextErrors.amount = t('taxiq.tipLedger.form.amountRequired')
    if (mode === 'edit' && !reason.trim()) nextErrors.reason = t('taxiq.tipLedger.form.reasonRequired')
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return
    try {
      if (mode === 'add') {
        await addTip.mutateAsync({
          ownerTaxYearId,
          staffTaxYearId,
          date,
          method,
          amount: Number(amount),
          serviceType: serviceType || null,
          serviceAmount: serviceAmount ? Number(serviceAmount) : null,
          isVoluntary,
          isNotMandatoryServiceCharge,
          proof,
          note: note.trim() || null,
        })
        showToast(t('taxiq.tipLedger.form.addSuccess'), 'success')
      } else if (entry) {
        await editTip.mutateAsync({
          id: entry.id,
          params: {
            date,
            method,
            amount: Number(amount),
            serviceType: serviceType || null,
            serviceAmount: serviceAmount ? Number(serviceAmount) : null,
            isVoluntary,
            isNotMandatoryServiceCharge,
            proof,
            note: note.trim() || null,
            reason: reason.trim(),
          },
        })
        showToast(t('taxiq.tipLedger.form.editSuccess'), 'success')
      }
      onClose()
    } catch (err) {
      const fallback = t('taxiq.tipLedger.errors.generic')
      const message = isApiError(err)
        ? (() => {
            const i18nKey = getErrorI18nKey(err.errorCode)
            const translated = t(i18nKey)
            return translated !== i18nKey ? translated : (err.message || fallback)
          })()
        : fallback
      showToast(message, 'error')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-nexoraText/70 p-4 backdrop-blur-sm">
      <div className="nexora-modal-card max-w-lg">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-extrabold text-nexoraText">
            {mode === 'add' ? t('taxiq.tipLedger.addButton') : t('taxiq.tipLedger.actions.edit')}
          </h2>
          <IconButton label={t('common.cancel')} onClick={onClose}>
            <X className="h-4 w-4" />
          </IconButton>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto">
          <div>
            <label className="text-xs font-bold text-nexoraMuted">{t('taxiq.tipLedger.form.amountLabel')}</label>
            <input
              type="number"
              min={0}
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="mt-1 w-full rounded-lg border border-nexoraBorder px-3 py-2 text-lg font-bold"
            />
            {errors.amount && <p className="mt-1 text-xs font-semibold text-rose-500">{errors.amount}</p>}
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold text-nexoraMuted">{t('taxiq.tipLedger.form.methodLabel')}</label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {TIP_METHODS.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMethod(m)}
                  className={`rounded-lg border px-2 py-1.5 text-[11px] font-bold ${
                    method === m ? 'border-nexoraBrand bg-nexoraBrand text-white' : 'border-nexoraBorder text-nexoraText'
                  }`}
                >
                  {t(`taxiq.tipLedger.method.${m}`)}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs font-bold text-nexoraMuted">{t('taxiq.tipLedger.form.serviceTypeLabel')}</label>
              <select
                value={serviceType}
                onChange={(e) => setServiceType(e.target.value)}
                className="mt-1 w-full rounded-lg border border-nexoraBorder px-3 py-2 text-sm"
              >
                <option value="">—</option>
                {SERVICE_TYPES.map((s) => (
                  <option key={s} value={s}>
                    {t(`taxiq.tipLedger.serviceType.${s}`)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-nexoraMuted">{t('taxiq.tipLedger.form.dateLabel')}</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="mt-1 w-full rounded-lg border border-nexoraBorder px-3 py-2 text-sm"
              />
              {errors.date && <p className="mt-1 text-xs font-semibold text-rose-500">{errors.date}</p>}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-nexoraMuted">{t('taxiq.tipLedger.form.serviceAmountLabel')}</label>
            <input
              type="number"
              min={0}
              step="0.01"
              value={serviceAmount}
              onChange={(e) => setServiceAmount(e.target.value)}
              className="mt-1 w-full rounded-lg border border-nexoraBorder px-3 py-2 text-sm"
            />
          </div>

          <div className="space-y-2 rounded-lg border border-nexoraBorder bg-nexoraCanvas p-3">
            <label className="flex items-center gap-2 text-xs font-bold text-nexoraText">
              <input type="checkbox" checked={isVoluntary} onChange={(e) => setIsVoluntary(e.target.checked)} />
              {t('taxiq.tipLedger.form.isVoluntaryLabel')}
            </label>
            <label className="flex items-center gap-2 text-xs font-bold text-nexoraText">
              <input
                type="checkbox"
                checked={isNotMandatoryServiceCharge}
                onChange={(e) => setIsNotMandatoryServiceCharge(e.target.checked)}
              />
              {t('taxiq.tipLedger.form.isNotMandatoryServiceChargeLabel')}
            </label>
          </div>

          <div>
            <label className="text-xs font-bold text-nexoraMuted">{t('taxiq.tipLedger.form.proofLabel')}</label>
            <select
              value={proof}
              onChange={(e) => setProof(e.target.value as TipProofType)}
              className="mt-1 w-full rounded-lg border border-nexoraBorder px-3 py-2 text-sm"
            >
              {TIP_PROOF_TYPES.map((p) => (
                <option key={p} value={p}>
                  {t(`taxiq.tipLedger.proof.${p}`)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-nexoraMuted">{t('taxiq.tipLedger.form.noteLabel')}</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              className="mt-1 w-full rounded-lg border border-nexoraBorder px-3 py-2 text-sm"
            />
          </div>

          {mode === 'edit' && (
            <div>
              <label className="text-xs font-bold text-nexoraMuted">{t('taxiq.tipLedger.form.reasonLabel')}</label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={2}
                className="mt-1 w-full rounded-lg border border-nexoraBorder px-3 py-2 text-sm"
              />
              {errors.reason && <p className="mt-1 text-xs font-semibold text-rose-500">{errors.reason}</p>}
            </div>
          )}

          <p className="text-[11px] font-medium text-nexoraMuted">{t('taxiq.tipLedger.disclaimer')}</p>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-xs font-bold text-nexoraMuted">
            {t('common.cancel')}
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isPending}
            className="inline-flex items-center gap-1.5 rounded-lg bg-nexoraBrand px-5 py-2 text-xs font-bold text-white disabled:opacity-60"
          >
            {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {t('taxiq.tipLedger.form.submit')}
          </button>
        </div>
      </div>
    </div>
  )
}
