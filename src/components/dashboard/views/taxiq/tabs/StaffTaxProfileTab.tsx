import { useState } from 'react'
import { Eye, Loader2 } from 'lucide-react'
import { useTranslation } from '../../../../../contexts/LanguageContext'
import { useNotification } from '../../../../../contexts/NotificationContext'
import {
  useStaffTinMasked,
  useTaxiqOwnerStaffList,
  useRevealStaffTin,
  useSetStaffTin,
} from '../../../../../data/hooks/useTaxiqOwnerPayouts'
import { useOwnerTaxYear, useUpdateBusinessEin } from '../../../../../data/hooks/useTaxiqOwnerTaxYear'
import { getApiErrorCode, isApiError } from '../../../../../types/domain'
import { getErrorI18nKey } from '../../../../../data/errorCodes'
import { SkeletonList } from '../../../../ui/skeleton'
import Tooltip from '../../../../ui/Tooltip'
import { SetStaffTinParams } from '@/data/repositories/taxiqOwnerPayouts'

const EIN_PATTERN = /^\d{2}-?\d{7}$/

function BusinessEinCard({ ownerTaxYearId, canEdit }: { ownerTaxYearId: string; canEdit: boolean }) {
  const { t } = useTranslation()
  const { showToast } = useNotification()
  const ownerTaxYearQuery = useOwnerTaxYear(ownerTaxYearId)
  const updateEin = useUpdateBusinessEin()

  const [ein, setEin] = useState('')
  const [error, setError] = useState<string | undefined>(undefined)

  const businessId = ownerTaxYearQuery.data?.businessId

  const handleSave = async () => {
    if (!businessId) return
    if (!EIN_PATTERN.test(ein.trim())) {
      setError(t('taxiq.taxProfile.errors.einFormat'))
      return
    }
    setError(undefined)
    try {
      await updateEin.mutateAsync({ businessId, ein: ein.trim(), ownerTaxYearId })
      showToast(t('taxiq.taxProfile.savedNotice'), 'success')
    } catch (err) {
      const i18nKey = isApiError(err) ? getErrorI18nKey(err.errorCode) : 'taxiq.taxProfile.errors.generic'
      showToast(t(i18nKey), 'error')
    }
  }

  if (!canEdit) return null

  return (
    <div className="rounded-xl border border-nexoraBorder bg-white p-4">
      <h3 className="text-xs font-extrabold uppercase text-nexoraMuted">{t('taxiq.taxProfile.einLabel')}</h3>
      <div className="mt-2 flex flex-wrap items-start gap-2">
        <div>
          <input
            type="text"
            value={ein}
            onChange={(e) => setEin(e.target.value)}
            placeholder={t('taxiq.taxProfile.einPlaceholder')}
            className="rounded-lg border border-nexoraBorder px-3 py-2 text-sm"
          />
          {error && <p className="mt-1 text-xs font-semibold text-rose-500">{error}</p>}
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={updateEin.isPending || !businessId}
          className="inline-flex items-center gap-1.5 rounded-lg bg-nexoraBrand px-4 py-2 text-xs font-bold text-white disabled:opacity-60"
        >
          {updateEin.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          {t('taxiq.taxProfile.saveButton')}
        </button>
      </div>
    </div>
  )
}

// One row per field (SSN, EIN) so each can independently show either its masked value
// (with the shared Reveal action) or a fill-in-when-empty input — Owner may set a field
// only while it's still null; once set (by Staff or a prior Owner write), it becomes
// view-only here (backend rejects overwrite with TAXIQ_STAFF_TIN_ALREADY_SET). Shared
// write path (useSetStaffTin) is also used by POS's PosStaffProfileView — see
// CLAUDE.md "Module Independence & Shared Data".
function StaffTinFieldRow({
  label,
  fieldValue,
  revealed,
  isRevealPending,
  onReveal,
  staffUserId,
}: {
  label: string
  fieldValue: string | null
  revealed: boolean
  isRevealPending: boolean
  onReveal: () => void
  staffUserId: string
}) {
  const { t } = useTranslation()
  const { showToast } = useNotification()
  const setTin = useSetStaffTin()
  const [inputValue, setInputValue] = useState('')

  const field = label === 'EIN' ? 'ein' : 'ssn'

  const handleSet = async () => {
    const trimmed = inputValue.trim()
    if (!trimmed) return
    const payload: SetStaffTinParams = { staffUserId }
    if (field === 'ein') payload.ein = trimmed
    else payload.ssn = trimmed
    try {
      await setTin.mutateAsync(payload)
      setInputValue('')
      showToast(t('taxiq.taxProfile.savedNotice'), 'success')
    } catch (err) {
      showToast(t(getErrorI18nKey(getApiErrorCode(err))), 'error')
    }
  }

  return (
    <div className="flex items-center gap-1.5">
      <span className="w-8 shrink-0 text-[10px] font-bold uppercase text-nexoraMuted">{label}</span>
      {fieldValue ? (
        <>
          <span className="font-mono text-nexoraText">{fieldValue}</span>
          {!revealed && (
            <button
              type="button"
              onClick={onReveal}
              disabled={isRevealPending}
              title={t('taxiq.taxProfile.revealedNotice')}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-nexoraBrand hover:underline disabled:opacity-60"
            >
              {isRevealPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Eye className="h-3 w-3" />}
              {t('taxiq.taxProfile.revealButton')}
            </button>
          )}
        </>
      ) : (
        <>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={t('taxiq.taxProfile.notProvided')}
            className="w-28 rounded border border-nexoraBorder px-1.5 py-0.5 text-[11px]"
          />
          <button
            type="button"
            onClick={handleSet}
            disabled={setTin.isPending || !inputValue.trim()}
            className="inline-flex items-center gap-1 text-[11px] font-bold text-nexoraBrand hover:underline disabled:opacity-60"
          >
            {setTin.isPending && <Loader2 className="h-3 w-3 animate-spin" />}
            {t('taxiq.taxProfile.setButton')}
          </button>
        </>
      )}
    </div>
  )
}

function StaffTinCell({ ownerTaxYearId, staffUserId }: { ownerTaxYearId: string; staffUserId: string }) {
  const { t } = useTranslation()
  const maskedQuery = useStaffTinMasked(ownerTaxYearId, staffUserId)
  const revealTin = useRevealStaffTin()

  const masked = maskedQuery.data
  const revealed = revealTin.data

  const value = revealed ?? masked
  const displayValue = value?.ein ?? value?.ssn ?? null

  if (maskedQuery.isPending) {
    return <span className="text-nexoraMuted">…</span>
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <span className="font-mono text-nexoraText">{displayValue ?? t('taxiq.taxProfile.notProvided')}</span>
        {displayValue && !revealed && (
          <button
            type="button"
            onClick={() => revealTin.mutate({ ownerTaxYearId, staffUserId })}
            disabled={revealTin.isPending}
            title={t('taxiq.taxProfile.revealedNotice')}
            className="inline-flex items-center gap-1 text-[11px] font-bold text-nexoraBrand hover:underline disabled:opacity-60"
          >
            {revealTin.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Eye className="h-3 w-3" />}
            {t('taxiq.taxProfile.revealButton')}
          </button>
        )}
      </div>
      {value?.w9LegalName && (
        <div className="text-[11px] text-nexoraMuted">
          <div>{value.w9LegalName}{value.w9DbaName ? ` (DBA: ${value.w9DbaName})` : ''}</div>
          {value.w9Address && <div>{value.w9Address}</div>}
          {value.w9TaxClassification && <div>{value.w9TaxClassification}</div>}
          {value.w9HasSignedDocument && (
            <span className="font-bold text-emerald-600">{t('taxiq.taxProfile.w9.documentAttached')}</span>
          )}
        </div>
      )}
    </div>
  )
}

export default function StaffTaxProfileTab({
  ownerTaxYearId,
  canEdit,
}: {
  ownerTaxYearId: string
  canEdit: boolean
}) {
  const { t } = useTranslation()
  const listQuery = useTaxiqOwnerStaffList(ownerTaxYearId)

  const items = listQuery.data ?? []

  return (
    <div className="space-y-4">
      {!canEdit && (
        <div className="rounded-lg border border-nexoraBorder bg-nexoraCanvas px-3 py-2 text-xs font-semibold text-nexoraMuted">
          {t('taxiq.payoutCenter.staffTaxProfile.notActiveNotice')}
        </div>
      )}

      <BusinessEinCard ownerTaxYearId={ownerTaxYearId} canEdit={canEdit} />

      <div className="overflow-x-auto rounded-xl border border-nexoraBorder bg-white">
        <table className="w-full min-w-[760px] text-left text-xs">
          <thead className="bg-nexoraCanvas text-[10px] font-extrabold uppercase text-nexoraMuted">
            <tr>
              <th className="px-4 py-3">{t('taxiq.payoutCenter.staffTaxProfile.columns.staff')}</th>
              <th className="px-4 py-3">{t('taxiq.payoutCenter.staffTaxProfile.columns.contractType')}</th>
              <th className="px-4 py-3">
                <span className="inline-flex items-center gap-1">
                  {t('taxiq.payoutCenter.staffTaxProfile.columns.w9Status')}
                  <Tooltip content={t('taxiq.tooltips.w9')} />
                </span>
              </th>
              <th className="px-4 py-3">{t('taxiq.taxProfile.title')}</th>
            </tr>
          </thead>
          <tbody>
            {listQuery.isPending ? (
              <tr>
                <td colSpan={4} className="p-4">
                  <SkeletonList count={4} lines={1} />
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center font-medium text-nexoraMuted">
                  {t('taxiq.payoutCenter.staffTaxProfile.emptyState')}
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.userProfileId} className="border-t border-nexoraRule">
                  <td className="px-4 py-3 font-bold text-nexoraText">{item.displayName}</td>
                  <td className="px-4 py-3 text-nexoraText">
                    {item.contractType ? t(`taxiq.payoutCenter.contractTypes.${item.contractType}`) : '—'}
                  </td>
                  <td className="px-4 py-3">
                    {!item.hasStaffTaxYear || !item.staffTaxYearId ? (
                      <span className="text-nexoraMuted">{t('taxiq.payoutCenter.staffTaxProfile.noTaxYearYet')}</span>
                    ) : (
                      <span className="text-nexoraText">
                        {t(`taxiq.payoutCenter.w9Statuses.${item.w9Status ?? 'NotRequired'}`)}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <StaffTinCell ownerTaxYearId={ownerTaxYearId} staffUserId={item.userProfileId} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
