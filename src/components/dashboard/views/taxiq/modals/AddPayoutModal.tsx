import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, Loader2, X } from 'lucide-react'
import IconButton from '../../../../ui/IconButton'
import { useTranslation } from '../../../../../contexts/LanguageContext'
import { useNotification } from '../../../../../contexts/NotificationContext'
import { useCreatePayoutRecord, useTaxiqOwnerStaffList, useUpdatePayoutRecord } from '../../../../../data/hooks/useTaxiqOwnerPayouts'
import { PAY_PERIODS, type ContractType, type PayPeriod, type PayoutRecord, type W9Status } from '../../../../../data/repositories/taxiqOwnerPayouts'
import { isApiError } from '../../../../../types/domain'
import { getErrorI18nKey } from '../../../../../data/errorCodes'
import { formatCurrency } from '../../../utils'
import CreateStaffTaxYearForModal from './CreateStaffTaxYearForModal'

type Step = 'select-staff' | 'create-tax-year' | 'form'

const EMPTY_FORM = {
  payPeriod: PAY_PERIODS[0] as PayPeriod,
  periodStart: '',
  periodEnd: '',
  servicePayout: '',
  tip: '',
  bonus: '',
  reimbursement: '',
  paymentMethod: '',
}

export default function AddPayoutModal({
  open,
  onClose,
  ownerTaxYearId,
  editingRecord,
}: {
  open: boolean
  onClose: () => void
  ownerTaxYearId: string
  editingRecord?: PayoutRecord | null
}) {
  const { t } = useTranslation()
  const { showToast } = useNotification()
  const isEditing = !!editingRecord

  const staffListQuery = useTaxiqOwnerStaffList(ownerTaxYearId)
  const staffList = staffListQuery.data ?? []

  const createPayout = useCreatePayoutRecord()
  const updatePayout = useUpdatePayoutRecord(ownerTaxYearId)
  const isBusy = createPayout.isPending || updatePayout.isPending

  const [step, setStep] = useState<Step>('select-staff')
  const [selectedStaffUserId, setSelectedStaffUserId] = useState('')
  const [contractType, setContractType] = useState<ContractType | null>(null)
  const [w9Status, setW9Status] = useState<W9Status | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setError('')
    if (isEditing && editingRecord) {
      setStep('form')
      setSelectedStaffUserId(editingRecord.staffUserId)
      setContractType(null)
      setW9Status(null)
      setForm({
        payPeriod: editingRecord.payPeriod as PayPeriod,
        periodStart: editingRecord.periodStart,
        periodEnd: editingRecord.periodEnd,
        servicePayout: String(editingRecord.servicePayout),
        tip: String(editingRecord.tip),
        bonus: String(editingRecord.bonus),
        reimbursement: String(editingRecord.reimbursement),
        paymentMethod: editingRecord.paymentMethod,
      })
    } else {
      setStep('select-staff')
      setSelectedStaffUserId('')
      setContractType(null)
      setW9Status(null)
      setForm(EMPTY_FORM)
    }
  }, [open, isEditing, editingRecord])

  if (!open) return null

  const selectedStaff = staffList.find((s) => s.userProfileId === selectedStaffUserId) ?? null

  const handleContinueFromStaffSelect = () => {
    if (!selectedStaff) return
    if (!selectedStaff.hasStaffTaxYear) {
      setStep('create-tax-year')
      return
    }
    setContractType((selectedStaff.contractType as ContractType) ?? null)
    setW9Status((selectedStaff.w9Status as W9Status) ?? null)
    setStep('form')
  }

  const handleTaxYearCreated = (createdContractType: ContractType, createdW9Status: W9Status) => {
    setContractType(createdContractType)
    setW9Status(createdW9Status)
    setStep('form')
  }

  const servicePayout = Number(form.servicePayout) || 0
  const tip = Number(form.tip) || 0
  const bonus = Number(form.bonus) || 0
  const reimbursement = Number(form.reimbursement) || 0
  const grossPayout = useMemo(() => servicePayout + tip + bonus, [servicePayout, tip, bonus])
  const netPaid = useMemo(() => grossPayout - reimbursement, [grossPayout, reimbursement])

  const showW9Warning = contractType === 'C1099' && w9Status !== 'Received'

  const canSubmit =
    form.periodStart.trim().length > 0 &&
    form.periodEnd.trim().length > 0 &&
    servicePayout > 0 &&
    form.paymentMethod.trim().length > 0

  const handleClose = () => {
    setForm(EMPTY_FORM)
    setError('')
    onClose()
  }

  const handleSubmit = async () => {
    if (!canSubmit || isBusy) return
    setError('')
    try {
      if (isEditing && editingRecord) {
        await updatePayout.mutateAsync({
          payoutRecordId: editingRecord.id,
          payPeriod: form.payPeriod,
          periodStart: form.periodStart,
          periodEnd: form.periodEnd,
          servicePayout,
          tip,
          bonus,
          reimbursement,
          paymentMethod: form.paymentMethod.trim(),
        })
        showToast(t('taxiq.payoutCenter.form.updateSuccess'), 'success')
      } else {
        await createPayout.mutateAsync({
          ownerTaxYearId,
          staffUserId: selectedStaffUserId,
          payPeriod: form.payPeriod,
          periodStart: form.periodStart,
          periodEnd: form.periodEnd,
          servicePayout,
          tip,
          bonus,
          reimbursement,
          paymentMethod: form.paymentMethod.trim(),
        })
        showToast(t('taxiq.payoutCenter.form.createSuccess'), 'success')
      }
      handleClose()
    } catch (err) {
      const fallback = t('taxiq.payoutCenter.form.errors.generic')
      let message = fallback
      if (isApiError(err)) {
        message = err.errorCode === 'TAXIQ_OWNER_TAX_YEAR_LOCKED'
          ? t('taxiq.payoutCenter.form.errors.taxYearLocked')
          : (() => {
              const i18nKey = getErrorI18nKey(err.errorCode)
              const translated = t(i18nKey)
              return translated !== i18nKey ? translated : (err.message || fallback)
            })()
      }
      setError(message)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-nexoraText/70 p-4 backdrop-blur-sm">
      <div className="nexora-modal-card max-w-lg">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-extrabold text-nexoraText">
            {isEditing ? t('taxiq.payoutCenter.form.editModalTitle') : t('taxiq.payoutCenter.form.addModalTitle')}
          </h2>
          <IconButton label={t('common.cancel')} onClick={handleClose}>
            <X className="h-4 w-4" />
          </IconButton>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto">
          {step === 'select-staff' && (
            <>
              <div>
                <label className="mb-1 block text-xs font-bold text-nexoraMuted">
                  {t('taxiq.payoutCenter.form.staffLabel')}
                </label>
                <select
                  value={selectedStaffUserId}
                  onChange={(e) => setSelectedStaffUserId(e.target.value)}
                  className="w-full rounded-lg border border-nexoraBorder px-3 py-2 text-xs font-semibold"
                >
                  <option value="">{t('taxiq.payoutCenter.form.staffPlaceholder')}</option>
                  {staffList.map((s) => (
                    <option key={s.userProfileId} value={s.userProfileId}>{s.displayName}</option>
                  ))}
                </select>
              </div>
              {selectedStaff && !selectedStaff.hasStaffTaxYear && (
                <p className="text-xs font-semibold text-amber-600">
                  {t('taxiq.payoutCenter.form.staffNeedsTaxYear')}
                </p>
              )}
              <div className="flex justify-end gap-2 pt-1">
                <button type="button" onClick={handleClose} className="rounded-lg px-4 py-2 text-xs font-bold text-nexoraMuted">
                  {t('common.cancel')}
                </button>
                <button
                  type="button"
                  onClick={handleContinueFromStaffSelect}
                  disabled={!selectedStaffUserId}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-nexoraBrand px-5 py-2 text-xs font-bold text-white disabled:opacity-60"
                >
                  {t('common.next')}
                </button>
              </div>
            </>
          )}

          {step === 'create-tax-year' && selectedStaff && (
            <CreateStaffTaxYearForModal
              ownerTaxYearId={ownerTaxYearId}
              staffUserId={selectedStaff.userProfileId}
              staffDisplayName={selectedStaff.displayName}
              onCreated={handleTaxYearCreated}
              onCancel={() => setStep('select-staff')}
            />
          )}

          {step === 'form' && (
            <>
              {showW9Warning && (
                <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs font-bold text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-400">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  {t('taxiq.payoutCenter.form.w9Warning')}
                </div>
              )}

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-bold text-nexoraMuted">
                    {t('taxiq.payoutCenter.form.payPeriodLabel')}
                  </label>
                  <select
                    value={form.payPeriod}
                    onChange={(e) => setForm((f) => ({ ...f, payPeriod: e.target.value as PayPeriod }))}
                    className="w-full rounded-lg border border-nexoraBorder px-3 py-2 text-xs font-semibold"
                  >
                    {PAY_PERIODS.map((p) => (
                      <option key={p} value={p}>{t(`taxiq.payoutCenter.payPeriods.${p}`)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold text-nexoraMuted">
                    {t('taxiq.payoutCenter.form.paymentMethodLabel')}
                  </label>
                  <input
                    type="text"
                    value={form.paymentMethod}
                    onChange={(e) => setForm((f) => ({ ...f, paymentMethod: e.target.value }))}
                    placeholder={t('taxiq.payoutCenter.form.paymentMethodPlaceholder')}
                    className="w-full rounded-lg border border-nexoraBorder px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-bold text-nexoraMuted">
                    {t('taxiq.payoutCenter.form.periodStartLabel')}
                  </label>
                  <input
                    type="date"
                    value={form.periodStart}
                    onChange={(e) => setForm((f) => ({ ...f, periodStart: e.target.value }))}
                    className="w-full rounded-lg border border-nexoraBorder px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold text-nexoraMuted">
                    {t('taxiq.payoutCenter.form.periodEndLabel')}
                  </label>
                  <input
                    type="date"
                    value={form.periodEnd}
                    onChange={(e) => setForm((f) => ({ ...f, periodEnd: e.target.value }))}
                    className="w-full rounded-lg border border-nexoraBorder px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-bold text-nexoraMuted">
                    {t('taxiq.payoutCenter.form.servicePayoutLabel')}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={form.servicePayout}
                    onChange={(e) => setForm((f) => ({ ...f, servicePayout: e.target.value }))}
                    className="w-full rounded-lg border border-nexoraBorder px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold text-nexoraMuted">
                    {t('taxiq.payoutCenter.form.tipLabel')}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={form.tip}
                    onChange={(e) => setForm((f) => ({ ...f, tip: e.target.value }))}
                    className="w-full rounded-lg border border-nexoraBorder px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-bold text-nexoraMuted">
                    {t('taxiq.payoutCenter.form.bonusLabel')}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={form.bonus}
                    onChange={(e) => setForm((f) => ({ ...f, bonus: e.target.value }))}
                    className="w-full rounded-lg border border-nexoraBorder px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold text-nexoraMuted">
                    {t('taxiq.payoutCenter.form.reimbursementLabel')}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={form.reimbursement}
                    onChange={(e) => setForm((f) => ({ ...f, reimbursement: e.target.value }))}
                    className="w-full rounded-lg border border-nexoraBorder px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="nexora-card flex items-center justify-between gap-4 p-3">
                <div>
                  <div className="text-[10px] font-extrabold uppercase tracking-wider text-nexoraMuted">
                    {t('taxiq.payoutCenter.form.grossPayoutLabel')}
                  </div>
                  <div className="text-sm font-extrabold text-nexoraText">{formatCurrency(grossPayout)}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-extrabold uppercase tracking-wider text-nexoraMuted">
                    {t('taxiq.payoutCenter.form.netPaidLabel')}
                  </div>
                  <div className="text-sm font-extrabold text-nexoraText">{formatCurrency(netPaid)}</div>
                </div>
              </div>

              {error && <p className="text-xs font-semibold text-rose-600">{error}</p>}

              <div className="flex justify-end gap-2 pt-1">
                <button type="button" onClick={handleClose} className="rounded-lg px-4 py-2 text-xs font-bold text-nexoraMuted">
                  {t('common.cancel')}
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!canSubmit || isBusy}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-nexoraBrand px-5 py-2 text-xs font-bold text-white disabled:opacity-60"
                >
                  {isBusy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  {isEditing ? t('taxiq.payoutCenter.form.updateButton') : t('taxiq.payoutCenter.form.submitButton')}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
