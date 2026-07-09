import { useEffect, useState } from 'react'
import { X, Loader2 } from 'lucide-react'
import IconButton from '../../../../ui/IconButton'
import Tooltip from '../../../../ui/Tooltip'
import { useTranslation } from '../../../../../contexts/LanguageContext'
import { useNotification } from '../../../../../contexts/NotificationContext'
import { useCreateOwnerAdjustment } from '../../../../../data/hooks/useTaxiqOwnerTaxYearLock'
import { ADJUSTMENT_ENTITY_FIELD_MAP } from '../../../../../data/repositories/taxiqOwnerAdjustments'
import { isApiError } from '../../../../../types/domain'
import { getErrorI18nKey } from '../../../../../data/errorCodes'

const ENTITY_TYPE_LABEL_KEYS: Record<string, string> = {
  DeductionRecord: 'taxiq.createAdjustment.entityTypes.deductionRecord',
  PayoutRecord: 'taxiq.createAdjustment.entityTypes.payoutRecord',
  EquipmentAsset: 'taxiq.createAdjustment.entityTypes.equipmentAsset',
  GiftCardLiability: 'taxiq.createAdjustment.entityTypes.giftCardLiability',
  MembershipCredit: 'taxiq.createAdjustment.entityTypes.membershipCredit',
}

// Fields whose OldValue/NewValue are numeric (JSON-encoded as a number on submit).
// The remainder are free text (JSON-encoded as a string). Mirrors the entity/field
// combinations enforced server-side in CreateAdjustmentRecordCommand's switch.
const NUMERIC_FIELDS = new Set([
  'Amount', 'BusinessUsePercent', 'ServicePayout', 'Tip', 'Bonus', 'Reimbursement',
  'TotalSold', 'TotalRedeemed', 'CreditsIssued', 'CreditsUsed', 'CreditsExpired',
])

const ENTITY_TYPES = Object.keys(ADJUSTMENT_ENTITY_FIELD_MAP)

export interface CreateAdjustmentPrefill {
  entityType?: string
  entityId?: string
}

export default function CreateAdjustmentModal({
  open,
  onClose,
  ownerTaxYearId,
  prefill,
}: {
  open: boolean
  onClose: () => void
  ownerTaxYearId: string
  prefill?: CreateAdjustmentPrefill | null
}) {
  const { t } = useTranslation()
  const { showToast } = useNotification()
  const createAdjustment = useCreateOwnerAdjustment()

  const [entityType, setEntityType] = useState(ENTITY_TYPES[0])
  const [entityId, setEntityId] = useState('')
  const [fieldName, setFieldName] = useState(ADJUSTMENT_ENTITY_FIELD_MAP[ENTITY_TYPES[0]][0])
  const [oldValue, setOldValue] = useState('')
  const [newValue, setNewValue] = useState('')
  const [reason, setReason] = useState('')
  const [cpaNotes, setCpaNotes] = useState('')
  const [receiptId, setReceiptId] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    const initialEntityType = prefill?.entityType && ADJUSTMENT_ENTITY_FIELD_MAP[prefill.entityType]
      ? prefill.entityType
      : ENTITY_TYPES[0]
    setEntityType(initialEntityType)
    setEntityId(prefill?.entityId ?? '')
    setFieldName(ADJUSTMENT_ENTITY_FIELD_MAP[initialEntityType][0])
    setOldValue('')
    setNewValue('')
    setReason('')
    setCpaNotes('')
    setReceiptId('')
    setError('')
  }, [open, prefill])

  if (!open) return null

  const fieldOptions = ADJUSTMENT_ENTITY_FIELD_MAP[entityType] ?? []
  const isNumericField = NUMERIC_FIELDS.has(fieldName)

  const handleEntityTypeChange = (value: string) => {
    setEntityType(value)
    setFieldName(ADJUSTMENT_ENTITY_FIELD_MAP[value][0])
  }

  const canSubmit =
    entityId.trim().length > 0 &&
    oldValue.trim().length > 0 &&
    newValue.trim().length > 0 &&
    reason.trim().length > 0

  const handleSubmit = async () => {
    if (!canSubmit || createAdjustment.isPending) return
    setError('')
    try {
      const encode = (raw: string) => (isNumericField ? JSON.stringify(Number(raw)) : JSON.stringify(raw))
      await createAdjustment.mutateAsync({
        ownerTaxYearId,
        entityType,
        entityId: entityId.trim(),
        fieldName,
        oldValue: encode(oldValue.trim()),
        newValue: encode(newValue.trim()),
        reason: reason.trim(),
        cpaNotes: cpaNotes.trim() || undefined,
        receiptId: receiptId.trim() || undefined,
      })
      showToast(t('taxiq.createAdjustment.success'), 'success')
      onClose()
    } catch (err) {
      const fallback = t('taxiq.createAdjustment.errors.generic')
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
      <div className="nexora-modal-card max-w-lg">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-extrabold text-nexoraText">
            <span className="inline-flex items-center gap-1">
              {t('taxiq.createAdjustment.modalTitle')}
              <Tooltip content={t('taxiq.yearEndExport.tooltips.adjustment')} />
            </span>
          </h2>
          <IconButton label={t('common.cancel')} onClick={onClose}>
            <X className="h-4 w-4" />
          </IconButton>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-bold text-nexoraMuted">
                {t('taxiq.createAdjustment.entityTypeLabel')}
              </label>
              <select
                value={entityType}
                onChange={(e) => handleEntityTypeChange(e.target.value)}
                className="w-full rounded-lg border border-nexoraBorder px-3 py-2 text-xs font-semibold"
              >
                {ENTITY_TYPES.map((key) => (
                  <option key={key} value={key}>{t(ENTITY_TYPE_LABEL_KEYS[key] ?? key)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-nexoraMuted">
                {t('taxiq.createAdjustment.fieldNameLabel')}
              </label>
              <select
                value={fieldName}
                onChange={(e) => setFieldName(e.target.value)}
                className="w-full rounded-lg border border-nexoraBorder px-3 py-2 text-xs font-semibold"
              >
                {fieldOptions.map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold text-nexoraMuted">
              {t('taxiq.createAdjustment.entityIdLabel')}
            </label>
            <input
              type="text"
              value={entityId}
              onChange={(e) => setEntityId(e.target.value)}
              placeholder={t('taxiq.createAdjustment.entityIdPlaceholder')}
              className="w-full rounded-lg border border-nexoraBorder px-3 py-2 text-sm"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-bold text-nexoraMuted">
                {t('taxiq.createAdjustment.oldValueLabel')}
              </label>
              <input
                type={isNumericField ? 'number' : 'text'}
                value={oldValue}
                onChange={(e) => setOldValue(e.target.value)}
                className="w-full rounded-lg border border-nexoraBorder px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-nexoraMuted">
                {t('taxiq.createAdjustment.newValueLabel')}
              </label>
              <input
                type={isNumericField ? 'number' : 'text'}
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                className="w-full rounded-lg border border-nexoraBorder px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold text-nexoraMuted">
              {t('taxiq.createAdjustment.reasonLabel')}
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-nexoraBorder px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold text-nexoraMuted">
              {t('taxiq.createAdjustment.cpaNotesLabel')}
            </label>
            <textarea
              value={cpaNotes}
              onChange={(e) => setCpaNotes(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-nexoraBorder px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold text-nexoraMuted">
              {t('taxiq.createAdjustment.receiptIdLabel')}
            </label>
            <input
              type="text"
              value={receiptId}
              onChange={(e) => setReceiptId(e.target.value)}
              placeholder={t('taxiq.createAdjustment.receiptIdPlaceholder')}
              className="w-full rounded-lg border border-nexoraBorder px-3 py-2 text-sm"
            />
          </div>

          {error && <p className="text-xs font-semibold text-rose-600">{error}</p>}
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-xs font-bold text-nexoraMuted"
          >
            {t('common.cancel')}
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit || createAdjustment.isPending}
            className="inline-flex items-center gap-1.5 rounded-lg bg-nexoraBrand px-5 py-2 text-xs font-bold text-white disabled:opacity-60"
          >
            {createAdjustment.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {t('taxiq.createAdjustment.submitButton')}
          </button>
        </div>
      </div>
    </div>
  )
}
