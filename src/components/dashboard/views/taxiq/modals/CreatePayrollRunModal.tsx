import { useState } from 'react'
import { Loader2, X } from 'lucide-react'
import IconButton from '../../../../ui/IconButton'
import { useTranslation } from '../../../../../contexts/LanguageContext'
import { useCreatePayrollRun } from '../../../../../data/hooks/usePayrollRuns'
import type { PayrollRun } from '../../../../../data/repositories/payrollRuns'
import { isApiError } from '../../../../../types/domain'
import { getErrorI18nKey } from '../../../../../data/errorCodes'

const PAY_SCHEDULES = ['Weekly', 'Biweekly', 'FifteenthAndThirtieth', 'Monthly']
const RUN_TYPES = ['Regular', 'Bonus']

interface Props {
  businessId: string
  employerId: string
  onClose: () => void
  onCreated: (id: string) => void
  // Doc mục 16 "Điều chỉnh số thuế đã post" — when set, this modal creates a correction run
  // against `correctionOf` instead of an ordinary run: dates/schedule prefill from it, and
  // `correctionOfRunId` is sent so Finalize posts new TaxLedgerEntry rows without touching the
  // original run's rows.
  correctionOf?: PayrollRun
}

export default function CreatePayrollRunModal({ businessId, employerId, onClose, onCreated, correctionOf }: Props) {
  const { t } = useTranslation()
  const createPayrollRun = useCreatePayrollRun(businessId)
  const isCorrection = !!correctionOf

  const [paySchedule, setPaySchedule] = useState(correctionOf?.paySchedule ?? 'Weekly')
  const [periodStart, setPeriodStart] = useState(correctionOf?.periodStart ?? '')
  const [periodEnd, setPeriodEnd] = useState(correctionOf?.periodEnd ?? '')
  const [payDate, setPayDate] = useState(correctionOf?.payDate ?? '')
  const [depositDue, setDepositDue] = useState(correctionOf?.depositDue ?? '')
  const [runType, setRunType] = useState('Regular')
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (createPayrollRun.isPending) return
    setError('')
    if (!periodStart || !periodEnd || !payDate || !depositDue) {
      setError(t('taxiq.payrollRuns.createModal.requiredFields'))
      return
    }
    try {
      const id = await createPayrollRun.mutateAsync({
        employerId,
        paySchedule,
        periodStart,
        periodEnd,
        payDate,
        depositDue,
        runType,
        correctionOfRunId: correctionOf?.id,
      })
      onCreated(id)
    } catch (err) {
      const fallback = t('taxiq.payrollRuns.errors.generic')
      let message = fallback
      if (isApiError(err)) {
        const i18nKey = getErrorI18nKey(err.errorCode)
        const translated = t(i18nKey)
        message = translated !== i18nKey ? translated : (err.message || fallback)
      }
      setError(message)
    }
  }

  return (
    // Correction mode always launches from PayrollRunDetailModal (z-50) still open behind it —
    // z-[60] stacks above it, same convention as CancelPayrollRunModal.
    <div className={`fixed inset-0 ${isCorrection ? 'z-[60]' : 'z-50'} flex items-center justify-center bg-nexoraText/70 p-4 backdrop-blur-sm`}>
      <div className="nexora-modal-card max-w-md">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-extrabold text-nexoraText">
            {isCorrection
              ? t('taxiq.payrollRuns.createModal.correctionTitle', { runCode: correctionOf?.runCode ?? '' })
              : t('taxiq.payrollRuns.createModal.title')}
          </h2>
          <IconButton label={t('common.cancel')} onClick={onClose}>
            <X className="h-4 w-4" />
          </IconButton>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto">
          {isCorrection && (
            <p className="rounded-lg bg-nexoraCanvas p-3 text-[11px] font-semibold text-nexoraMuted">
              {t('taxiq.payrollRuns.createModal.correctionNote', { runCode: correctionOf?.runCode ?? '' })}
            </p>
          )}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-bold text-nexoraMuted">{t('taxiq.payrollRuns.createModal.paySchedule')}</label>
              <select
                value={paySchedule}
                onChange={(e) => setPaySchedule(e.target.value)}
                className="w-full rounded-lg border border-nexoraBorder px-3 py-2 text-xs"
              >
                {PAY_SCHEDULES.map((s) => (
                  <option key={s} value={s}>
                    {t(`taxiq.payEngine.paySchedules.${s}`)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-nexoraMuted">{t('taxiq.payrollRuns.createModal.runType')}</label>
              <select
                value={runType}
                onChange={(e) => setRunType(e.target.value)}
                className="w-full rounded-lg border border-nexoraBorder px-3 py-2 text-xs"
              >
                {RUN_TYPES.map((rt) => (
                  <option key={rt} value={rt}>
                    {t(`taxiq.payrollRuns.runType.${rt}`)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-bold text-nexoraMuted">{t('taxiq.payrollRuns.createModal.periodStart')}</label>
              <input
                type="date"
                value={periodStart}
                onChange={(e) => setPeriodStart(e.target.value)}
                className="w-full rounded-lg border border-nexoraBorder px-3 py-2 text-xs"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-nexoraMuted">{t('taxiq.payrollRuns.createModal.periodEnd')}</label>
              <input
                type="date"
                value={periodEnd}
                onChange={(e) => setPeriodEnd(e.target.value)}
                className="w-full rounded-lg border border-nexoraBorder px-3 py-2 text-xs"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-nexoraMuted">{t('taxiq.payrollRuns.createModal.payDate')}</label>
              <input
                type="date"
                value={payDate}
                onChange={(e) => setPayDate(e.target.value)}
                className="w-full rounded-lg border border-nexoraBorder px-3 py-2 text-xs"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-nexoraMuted">{t('taxiq.payrollRuns.createModal.depositDue')}</label>
              <input
                type="date"
                value={depositDue}
                onChange={(e) => setDepositDue(e.target.value)}
                className="w-full rounded-lg border border-nexoraBorder px-3 py-2 text-xs"
              />
            </div>
          </div>

          <p className="text-[11px] text-nexoraMuted">{t('taxiq.payrollRuns.createModal.importNote')}</p>

          {error && <p className="text-xs font-semibold text-rose-600">{error}</p>}
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-xs font-bold text-nexoraMuted">
            {t('common.cancel')}
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={createPayrollRun.isPending}
            className="inline-flex items-center gap-1.5 rounded-lg bg-nexoraBrand px-5 py-2 text-xs font-bold text-white disabled:opacity-60"
          >
            {createPayrollRun.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {isCorrection ? t('taxiq.payrollRuns.createModal.correctionSubmitButton') : t('taxiq.payrollRuns.createModal.submitButton')}
          </button>
        </div>
      </div>
    </div>
  )
}
