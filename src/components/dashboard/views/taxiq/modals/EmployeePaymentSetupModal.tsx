import { useState } from 'react'
import { CheckCircle2, Circle, Loader2, Plus, Trash2, X } from 'lucide-react'
import IconButton from '../../../../ui/IconButton'
import { SkeletonList } from '../../../../ui/skeleton'
import { useTranslation } from '../../../../../contexts/LanguageContext'
import { useNotification } from '../../../../../contexts/NotificationContext'
import {
  usePayRule,
  useUpsertPayoutDestination,
  useUpsertPayRule,
} from '../../../../../data/hooks/usePosStaffProfile'
import {
  PAY_FORMULAS,
  PAY_SCHEDULES,
  PAYOUT_METHODS,
  type PayFormula,
  type PaySchedule,
  type PayoutMethod,
  type TieredRateEntry,
} from '../../../../../data/repositories/posStaffProfile'
import { isApiError } from '../../../../../types/domain'
import { getErrorI18nKey } from '../../../../../data/errorCodes'

interface Props {
  businessId: string
  businessStaffLinkId: string
  displayName: string
  onClose: () => void
}

function ReadyRow({ label, ready }: { label: string; ready: boolean }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      {ready ? (
        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
      ) : (
        <Circle className="h-4 w-4 shrink-0 text-nexoraMuted" />
      )}
      <span className={ready ? 'font-semibold text-nexoraText' : 'text-nexoraMuted'}>{label}</span>
    </div>
  )
}

export default function EmployeePaymentSetupModal({ businessId, businessStaffLinkId, displayName, onClose }: Props) {
  const { t } = useTranslation()
  const { showToast } = useNotification()
  const payRuleQuery = usePayRule(businessStaffLinkId)
  const upsertPayRule = useUpsertPayRule(businessId)
  const upsertPayoutDestination = useUpsertPayoutDestination(businessId)

  const data = payRuleQuery.data

  const [payStructureType, setPayStructureType] = useState<PayFormula>('Hourly')
  const [hourlyRate, setHourlyRate] = useState('')
  const [overtimeThresholdHours, setOvertimeThresholdHours] = useState('40')
  const [commissionPercent, setCommissionPercent] = useState('')
  const [tieredRates, setTieredRates] = useState<TieredRateEntry[]>([])
  const [salesThresholdBonusEnabled, setSalesThresholdBonusEnabled] = useState(false)
  const [salesThresholdBonusThreshold, setSalesThresholdBonusThreshold] = useState('')
  const [salesThresholdBonusPercent, setSalesThresholdBonusPercent] = useState('')
  const [kpiBonusEnabled, setKpiBonusEnabled] = useState(false)
  const [kpiBonusTarget, setKpiBonusTarget] = useState('')
  const [kpiBonusPercent, setKpiBonusPercent] = useState('')
  const [paySchedule, setPaySchedule] = useState<PaySchedule>('Weekly')
  const [requirePaymentProof, setRequirePaymentProof] = useState(true)
  const [syncProofToPayoutLedger, setSyncProofToPayoutLedger] = useState(true)
  const [blockPaymentIfTaxProfileMissing, setBlockPaymentIfTaxProfileMissing] = useState(true)
  const [allowOwnerOverrideWithAuditNote, setAllowOwnerOverrideWithAuditNote] = useState(false)

  const [primaryMethod, setPrimaryMethod] = useState<PayoutMethod>('Zelle')
  const [primaryDestination, setPrimaryDestination] = useState('')
  const [backupMethod, setBackupMethod] = useState<PayoutMethod | ''>('')
  const [backupDestination, setBackupDestination] = useState('')

  const [initializedFor, setInitializedFor] = useState<string | null>(null)
  const [error, setError] = useState('')

  // Hydrate local form state from the fetched detail exactly once per staff member — after
  // that, this is an uncontrolled-by-server form so re-fetches (from our own invalidation)
  // don't clobber what the Owner is mid-typing.
  if (data && initializedFor !== businessStaffLinkId) {
    setInitializedFor(businessStaffLinkId)
    setPayStructureType((PAY_FORMULAS as readonly string[]).includes(data.payStructureType)
      ? (data.payStructureType as PayFormula)
      : 'Hourly')
    setHourlyRate(data.hourlyRate != null ? String(data.hourlyRate) : '')
    setOvertimeThresholdHours(String(data.overtimeThresholdHours ?? 40))
    setCommissionPercent(data.commissionPercent != null ? String(data.commissionPercent) : '')
    setTieredRates(data.tieredRates ?? [])
    setSalesThresholdBonusEnabled(data.salesThresholdBonusEnabled)
    setSalesThresholdBonusThreshold(data.salesThresholdBonusThreshold != null ? String(data.salesThresholdBonusThreshold) : '')
    setSalesThresholdBonusPercent(data.salesThresholdBonusPercent != null ? String(data.salesThresholdBonusPercent) : '')
    setKpiBonusEnabled(data.kpiBonusEnabled)
    setKpiBonusTarget(data.kpiBonusTarget != null ? String(data.kpiBonusTarget) : '')
    setKpiBonusPercent(data.kpiBonusPercent != null ? String(data.kpiBonusPercent) : '')
    setPaySchedule((PAY_SCHEDULES as readonly string[]).includes(data.paySchedule) ? (data.paySchedule as PaySchedule) : 'Weekly')
    setRequirePaymentProof(data.requirePaymentProof)
    setSyncProofToPayoutLedger(data.syncProofToPayoutLedger)
    setBlockPaymentIfTaxProfileMissing(data.blockPaymentIfTaxProfileMissing)
    setAllowOwnerOverrideWithAuditNote(data.allowOwnerOverrideWithAuditNote)
    setPrimaryMethod((PAYOUT_METHODS as readonly string[]).includes(data.primaryMethod ?? '') ? (data.primaryMethod as PayoutMethod) : 'Zelle')
    setPrimaryDestination(data.primaryDestination ?? '')
    setBackupMethod((data.backupMethod as PayoutMethod) ?? '')
    setBackupDestination(data.backupDestination ?? '')
  }

  const isPending = upsertPayRule.isPending || upsertPayoutDestination.isPending

  const addTier = () => setTieredRates((rows) => [...rows, { thresholdAmount: 0, commissionPercent: 20 }])
  const removeTier = (index: number) => setTieredRates((rows) => rows.filter((_, i) => i !== index))
  const updateTier = (index: number, field: keyof TieredRateEntry, value: number) =>
    setTieredRates((rows) => rows.map((row, i) => (i === index ? { ...row, [field]: value } : row)))

  const handleSave = async () => {
    if (isPending) return
    setError('')
    try {
      await upsertPayRule.mutateAsync({
        businessStaffLinkId,
        payStructureType,
        hourlyRate: hourlyRate ? Number(hourlyRate) : null,
        overtimeThresholdHours: overtimeThresholdHours ? Number(overtimeThresholdHours) : null,
        commissionPercent: commissionPercent ? Number(commissionPercent) : null,
        tieredRates: payStructureType === 'Tiered' ? tieredRates : null,
        salesThresholdBonusEnabled,
        salesThresholdBonusThreshold: salesThresholdBonusEnabled && salesThresholdBonusThreshold ? Number(salesThresholdBonusThreshold) : null,
        salesThresholdBonusPercent: salesThresholdBonusEnabled && salesThresholdBonusPercent ? Number(salesThresholdBonusPercent) : null,
        kpiBonusEnabled,
        kpiBonusTarget: kpiBonusEnabled && kpiBonusTarget ? Number(kpiBonusTarget) : null,
        kpiBonusPercent: kpiBonusEnabled && kpiBonusPercent ? Number(kpiBonusPercent) : null,
        paySchedule,
        requirePaymentProof,
        syncProofToPayoutLedger,
        blockPaymentIfTaxProfileMissing,
        allowOwnerOverrideWithAuditNote,
      })

      if (primaryDestination.trim()) {
        await upsertPayoutDestination.mutateAsync({
          businessStaffLinkId,
          primaryMethod,
          primaryDestination: primaryDestination.trim(),
          backupMethod: backupMethod || null,
          backupDestination: backupMethod && backupDestination.trim() ? backupDestination.trim() : null,
        })
      }

      showToast(t('taxiq.payEngine.savedNotice'), 'success')
      onClose()
    } catch (err) {
      const fallback = t('taxiq.payEngine.errors.generic')
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-nexoraText/70 p-4 backdrop-blur-sm">
      <div className="nexora-modal-card max-w-2xl">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-extrabold text-nexoraText">{t('taxiq.payEngine.modalTitle')}</h2>
            <p className="text-xs font-medium text-nexoraMuted">{displayName}</p>
          </div>
          <IconButton label={t('common.cancel')} onClick={onClose}>
            <X className="h-4 w-4" />
          </IconButton>
        </div>

        {payRuleQuery.isPending ? (
          <SkeletonList count={4} lines={2} />
        ) : (
          <div className="flex-1 space-y-5 overflow-y-auto">
            {/* Block 1 — Worker + Tax Readiness (read-only) */}
            <section className="space-y-2">
              <h3 className="text-xs font-extrabold uppercase text-nexoraMuted">{t('taxiq.payEngine.blocks.workerReadiness')}</h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-lg bg-nexoraCanvas px-3 py-2 text-xs">
                  <div className="font-bold text-nexoraMuted">{t('taxiq.payEngine.fields.contractType')}</div>
                  <div className="font-semibold text-nexoraText">
                    {data?.contractType ? t(`taxiq.payoutCenter.contractTypes.${data.contractType}`) : '—'}
                  </div>
                </div>
                <div className="rounded-lg bg-nexoraCanvas px-3 py-2 text-xs">
                  <div className="font-bold text-nexoraMuted">{t('taxiq.payEngine.fields.tinStatus')}</div>
                  <div className="font-semibold text-nexoraText">{t(`taxiq.payEngine.tinStatuses.${data?.tinStatus ?? 'Missing'}`)}</div>
                </div>
              </div>
            </section>

            {/* Block 2 — Pay Formula */}
            <section className="space-y-3">
              <h3 className="text-xs font-extrabold uppercase text-nexoraMuted">{t('taxiq.payEngine.blocks.payFormula')}</h3>
              <div>
                <label className="mb-1 block text-xs font-bold text-nexoraMuted">{t('taxiq.payEngine.fields.payStructureType')}</label>
                <select
                  value={payStructureType}
                  onChange={(e) => setPayStructureType(e.target.value as PayFormula)}
                  className="w-full rounded-lg border border-nexoraBorder px-3 py-2 text-xs font-semibold"
                >
                  {PAY_FORMULAS.map((formula) => (
                    <option key={formula} value={formula}>
                      {t(`taxiq.payEngine.payFormulas.${formula}`)}
                    </option>
                  ))}
                </select>
              </div>

              {(payStructureType === 'Hourly' || payStructureType === 'Hybrid') && (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-bold text-nexoraMuted">{t('taxiq.payEngine.fields.hourlyRate')}</label>
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={hourlyRate}
                      onChange={(e) => setHourlyRate(e.target.value)}
                      className="w-full rounded-lg border border-nexoraBorder px-3 py-2 text-xs"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-bold text-nexoraMuted">{t('taxiq.payEngine.fields.overtimeThresholdHours')}</label>
                    <input
                      type="number"
                      min={0}
                      step="0.5"
                      value={overtimeThresholdHours}
                      onChange={(e) => setOvertimeThresholdHours(e.target.value)}
                      className="w-full rounded-lg border border-nexoraBorder px-3 py-2 text-xs"
                    />
                  </div>
                </div>
              )}

              {(payStructureType === 'Commission' || payStructureType === 'Hybrid') && (
                <div>
                  <label className="mb-1 block text-xs font-bold text-nexoraMuted">{t('taxiq.payEngine.fields.commissionPercent')}</label>
                  <input
                    type="number"
                    min={20}
                    max={65}
                    step="0.5"
                    value={commissionPercent}
                    onChange={(e) => setCommissionPercent(e.target.value)}
                    className="w-full rounded-lg border border-nexoraBorder px-3 py-2 text-xs"
                  />
                  <p className="mt-1 text-[11px] text-nexoraMuted">{t('taxiq.payEngine.fields.commissionRangeHint')}</p>
                </div>
              )}

              {payStructureType === 'Tiered' && (
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-nexoraMuted">{t('taxiq.payEngine.fields.tieredRates')}</label>
                  {tieredRates.map((rate, index) => (
                    <div key={index} className="grid grid-cols-1 items-center gap-2 sm:grid-cols-[1fr_1fr_auto]">
                      <input
                        type="number"
                        min={0}
                        value={rate.thresholdAmount}
                        onChange={(e) => updateTier(index, 'thresholdAmount', Number(e.target.value))}
                        placeholder={t('taxiq.payEngine.fields.tierThreshold')}
                        className="w-full rounded-lg border border-nexoraBorder px-3 py-2 text-xs"
                      />
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={rate.commissionPercent}
                        onChange={(e) => updateTier(index, 'commissionPercent', Number(e.target.value))}
                        placeholder={t('taxiq.payEngine.fields.tierPercent')}
                        className="w-full rounded-lg border border-nexoraBorder px-3 py-2 text-xs"
                      />
                      <button type="button" onClick={() => removeTier(index)} className="justify-self-start p-1 text-rose-600 sm:justify-self-center">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addTier}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-nexoraBrand hover:underline"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    {t('taxiq.payEngine.fields.addTier')}
                  </button>
                </div>
              )}

              <div>
                <label className="mb-1 block text-xs font-bold text-nexoraMuted">{t('taxiq.payEngine.fields.paySchedule')}</label>
                <select
                  value={paySchedule}
                  onChange={(e) => setPaySchedule(e.target.value as PaySchedule)}
                  className="w-full rounded-lg border border-nexoraBorder px-3 py-2 text-xs font-semibold"
                >
                  {PAY_SCHEDULES.map((schedule) => (
                    <option key={schedule} value={schedule}>
                      {t(`taxiq.payEngine.paySchedules.${schedule}`)}
                    </option>
                  ))}
                </select>
              </div>

              <label className="flex items-center gap-2 text-xs font-semibold text-nexoraText">
                <input
                  type="checkbox"
                  checked={salesThresholdBonusEnabled}
                  onChange={(e) => setSalesThresholdBonusEnabled(e.target.checked)}
                  className="h-4 w-4 rounded border-nexoraBorder"
                />
                {t('taxiq.payEngine.fields.salesThresholdBonusEnabled')}
              </label>
              {salesThresholdBonusEnabled && (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={salesThresholdBonusThreshold}
                    onChange={(e) => setSalesThresholdBonusThreshold(e.target.value)}
                    placeholder={t('taxiq.payEngine.fields.bonusThreshold')}
                    className="w-full rounded-lg border border-nexoraBorder px-3 py-2 text-xs"
                  />
                  <input
                    type="number"
                    min={0}
                    step="0.1"
                    value={salesThresholdBonusPercent}
                    onChange={(e) => setSalesThresholdBonusPercent(e.target.value)}
                    placeholder={t('taxiq.payEngine.fields.bonusPercent')}
                    className="w-full rounded-lg border border-nexoraBorder px-3 py-2 text-xs"
                  />
                </div>
              )}

              <label className="flex items-center gap-2 text-xs font-semibold text-nexoraText">
                <input
                  type="checkbox"
                  checked={kpiBonusEnabled}
                  onChange={(e) => setKpiBonusEnabled(e.target.checked)}
                  className="h-4 w-4 rounded border-nexoraBorder"
                />
                {t('taxiq.payEngine.fields.kpiBonusEnabled')}
              </label>
              {kpiBonusEnabled && (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={kpiBonusTarget}
                    onChange={(e) => setKpiBonusTarget(e.target.value)}
                    placeholder={t('taxiq.payEngine.fields.kpiTarget')}
                    className="w-full rounded-lg border border-nexoraBorder px-3 py-2 text-xs"
                  />
                  <input
                    type="number"
                    min={0}
                    step="0.1"
                    value={kpiBonusPercent}
                    onChange={(e) => setKpiBonusPercent(e.target.value)}
                    placeholder={t('taxiq.payEngine.fields.bonusPercent')}
                    className="w-full rounded-lg border border-nexoraBorder px-3 py-2 text-xs"
                  />
                </div>
              )}
            </section>

            {/* Block 3 — Payout Method (Owner-managed, separate from staff-owned payment handles) */}
            <section className="space-y-3">
              <h3 className="text-xs font-extrabold uppercase text-nexoraMuted">{t('taxiq.payEngine.blocks.payoutMethod')}</h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-bold text-nexoraMuted">{t('taxiq.payEngine.fields.primaryMethod')}</label>
                  <select
                    value={primaryMethod}
                    onChange={(e) => setPrimaryMethod(e.target.value as PayoutMethod)}
                    className="w-full rounded-lg border border-nexoraBorder px-3 py-2 text-xs font-semibold"
                  >
                    {PAYOUT_METHODS.map((method) => (
                      <option key={method} value={method}>
                        {t(`taxiq.payEngine.payoutMethods.${method}`)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold text-nexoraMuted">{t('taxiq.payEngine.fields.primaryDestination')}</label>
                  <input
                    type="text"
                    value={primaryDestination}
                    onChange={(e) => setPrimaryDestination(e.target.value)}
                    className="w-full rounded-lg border border-nexoraBorder px-3 py-2 text-xs"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-bold text-nexoraMuted">{t('taxiq.payEngine.fields.backupMethod')}</label>
                  <select
                    value={backupMethod}
                    onChange={(e) => setBackupMethod(e.target.value as PayoutMethod | '')}
                    className="w-full rounded-lg border border-nexoraBorder px-3 py-2 text-xs font-semibold"
                  >
                    <option value="">{t('taxiq.payEngine.fields.none')}</option>
                    {PAYOUT_METHODS.map((method) => (
                      <option key={method} value={method}>
                        {t(`taxiq.payEngine.payoutMethods.${method}`)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold text-nexoraMuted">{t('taxiq.payEngine.fields.backupDestination')}</label>
                  <input
                    type="text"
                    value={backupDestination}
                    onChange={(e) => setBackupDestination(e.target.value)}
                    disabled={!backupMethod}
                    className="w-full rounded-lg border border-nexoraBorder px-3 py-2 text-xs disabled:bg-nexoraCanvas"
                  />
                </div>
              </div>
            </section>

            {/* Block 4 — Proof + Blocking Rules */}
            <section className="space-y-2">
              <h3 className="text-xs font-extrabold uppercase text-nexoraMuted">{t('taxiq.payEngine.blocks.proofBlocking')}</h3>
              <label className="flex items-center gap-2 text-xs font-semibold text-nexoraText">
                <input type="checkbox" checked={requirePaymentProof} onChange={(e) => setRequirePaymentProof(e.target.checked)} className="h-4 w-4 rounded border-nexoraBorder" />
                {t('taxiq.payEngine.fields.requirePaymentProof')}
              </label>
              <label className="flex items-center gap-2 text-xs font-semibold text-nexoraText">
                <input type="checkbox" checked={syncProofToPayoutLedger} onChange={(e) => setSyncProofToPayoutLedger(e.target.checked)} className="h-4 w-4 rounded border-nexoraBorder" />
                {t('taxiq.payEngine.fields.syncProofToPayoutLedger')}
              </label>
              <label className="flex items-center gap-2 text-xs font-semibold text-nexoraText">
                <input type="checkbox" checked={blockPaymentIfTaxProfileMissing} onChange={(e) => setBlockPaymentIfTaxProfileMissing(e.target.checked)} className="h-4 w-4 rounded border-nexoraBorder" />
                {t('taxiq.payEngine.fields.blockPaymentIfTaxProfileMissing')}
              </label>
              <label className="flex items-center gap-2 text-xs font-semibold text-nexoraText">
                <input type="checkbox" checked={allowOwnerOverrideWithAuditNote} onChange={(e) => setAllowOwnerOverrideWithAuditNote(e.target.checked)} className="h-4 w-4 rounded border-nexoraBorder" />
                {t('taxiq.payEngine.fields.allowOwnerOverrideWithAuditNote')}
              </label>
            </section>

            {/* Block 5 — Ready To Pay Gate */}
            <section className="space-y-2 rounded-lg bg-nexoraCanvas p-3">
              <h3 className="text-xs font-extrabold uppercase text-nexoraMuted">{t('taxiq.payEngine.blocks.readyToPayGate')}</h3>
              <ReadyRow label={t('taxiq.payEngine.gate.workerClassification')} ready={!!data?.readyToPayGate.workerClassificationReady} />
              <ReadyRow label={t('taxiq.payEngine.gate.payFormula')} ready={!!data?.readyToPayGate.payFormulaReady} />
              <ReadyRow label={t('taxiq.payEngine.gate.payoutMethod')} ready={!!data?.readyToPayGate.payoutMethodReady} />
              <div className="text-xs text-nexoraMuted">
                {t('taxiq.payEngine.gate.proofRule')}: <span className="font-semibold text-nexoraText">{data?.readyToPayGate.proofRuleRequired ? t('taxiq.payEngine.gate.required') : t('taxiq.payEngine.gate.notRequired')}</span>
              </div>
              <div className="text-xs text-nexoraMuted">
                {t('taxiq.payEngine.gate.firstPaymentAction')}: <span className="font-semibold text-nexoraText">{t('taxiq.payEngine.gate.afterSetup')}</span>
              </div>
            </section>

            {error && <p className="text-xs font-semibold text-rose-600">{error}</p>}
          </div>
        )}

        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-xs font-bold text-nexoraMuted">
            {t('common.cancel')}
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isPending || payRuleQuery.isPending}
            className="inline-flex items-center gap-1.5 rounded-lg bg-nexoraBrand px-5 py-2 text-xs font-bold text-white disabled:opacity-60"
          >
            {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {t('common.save')}
          </button>
        </div>
      </div>
    </div>
  )
}
