import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { useTranslation } from '../../../../../contexts/LanguageContext'
import { useCreateStaffTaxYearByOwner } from '../../../../../data/hooks/useTaxiqOwnerPayouts'
import { CONTRACT_TYPES, W9_STATUSES, type ContractType, type W9Status } from '../../../../../data/repositories/taxiqOwnerPayouts'
import { isApiError } from '../../../../../types/domain'
import { getErrorI18nKey } from '../../../../../data/errorCodes'
import Tooltip from '../../../../ui/Tooltip'

const CONTRACT_TYPE_TOOLTIP_KEYS: Partial<Record<ContractType, string>> = {
  W2: 'taxiq.tooltips.w2',
  C1099: 'taxiq.tooltips.contractor1099',
  BoothRenter: 'taxiq.tooltips.boothRenter',
}

/**
 * Precondition step embedded inside AddPayoutModal (US-09 AC "QT-04 bước 0"): a Staff
 * must have a StaffTaxYear for the current tax year before the Owner can enter a payout
 * for them. This lets the Owner create one on the Staff's behalf instead of hitting a
 * 400 (TAXIQ_STAFF_TAX_YEAR_REQUIRED_FOR_PAYOUT) after submitting the payout form.
 */
export default function CreateStaffTaxYearForModal({
  ownerTaxYearId,
  staffUserId,
  staffDisplayName,
  onCreated,
  onCancel,
}: {
  ownerTaxYearId: string
  staffUserId: string
  staffDisplayName: string
  onCreated: (contractType: ContractType, w9Status: W9Status) => void
  onCancel: () => void
}) {
  const { t } = useTranslation()
  const createStaffTaxYear = useCreateStaffTaxYearByOwner()

  const [contractType, setContractType] = useState<ContractType>(CONTRACT_TYPES[0])
  const [w9Status, setW9Status] = useState<W9Status>(W9_STATUSES[0])
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (createStaffTaxYear.isPending) return
    setError('')
    try {
      await createStaffTaxYear.mutateAsync({ ownerTaxYearId, staffUserId, contractType, w9Status })
      onCreated(contractType, w9Status)
    } catch (err) {
      const fallback = t('taxiq.payoutCenter.createStaffTaxYear.errors.generic')
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
    <div className="space-y-3">
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs font-semibold text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-400">
        {t('taxiq.payoutCenter.createStaffTaxYear.notice', { name: staffDisplayName })}
      </div>

      <div>
        <label className="mb-1 block text-xs font-bold text-nexoraMuted">
          {t('taxiq.payoutCenter.createStaffTaxYear.contractTypeLabel')}
        </label>
        <select
          value={contractType}
          onChange={(e) => setContractType(e.target.value as ContractType)}
          className="w-full rounded-lg border border-nexoraBorder px-3 py-2 text-xs font-semibold"
        >
          {CONTRACT_TYPES.map((type) => (
            <option key={type} value={type}>{t(`taxiq.payoutCenter.contractTypes.${type}`)}</option>
          ))}
        </select>
        {CONTRACT_TYPE_TOOLTIP_KEYS[contractType] && (
          <p className="mt-1 text-[11px] font-medium text-nexoraMuted">{t(CONTRACT_TYPE_TOOLTIP_KEYS[contractType] as string)}</p>
        )}
      </div>

      {contractType === 'C1099' && (
        <div>
          <label className="mb-1 block text-xs font-bold text-nexoraMuted">
            <span className="inline-flex items-center gap-1">
              {t('taxiq.payoutCenter.createStaffTaxYear.w9StatusLabel')}
              <Tooltip content={t('taxiq.tooltips.w9')} />
            </span>
          </label>
          <select
            value={w9Status}
            onChange={(e) => setW9Status(e.target.value as W9Status)}
            className="w-full rounded-lg border border-nexoraBorder px-3 py-2 text-xs font-semibold"
          >
            {W9_STATUSES.map((status) => (
              <option key={status} value={status}>{t(`taxiq.payoutCenter.w9Statuses.${status}`)}</option>
            ))}
          </select>
        </div>
      )}

      {error && <p className="text-xs font-semibold text-rose-600">{error}</p>}

      <div className="flex justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg px-4 py-2 text-xs font-bold text-nexoraMuted"
        >
          {t('common.cancel')}
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={createStaffTaxYear.isPending}
          className="inline-flex items-center gap-1.5 rounded-lg bg-nexoraBrand px-5 py-2 text-xs font-bold text-white disabled:opacity-60"
        >
          {createStaffTaxYear.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          {t('taxiq.payoutCenter.createStaffTaxYear.submitButton')}
        </button>
      </div>
    </div>
  )
}
