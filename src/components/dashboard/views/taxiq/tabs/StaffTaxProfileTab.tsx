import { useState } from 'react'
import { Eye, Loader2 } from 'lucide-react'
import { useTranslation } from '../../../../../contexts/LanguageContext'
import { useNotification } from '../../../../../contexts/NotificationContext'
import {
  useStaffTinMasked,
  useTaxiqOwnerStaffList,
  useRevealStaffTin,
  useUpdateStaffW9Status,
} from '../../../../../data/hooks/useTaxiqOwnerPayouts'
import { useOwnerTaxYear, useUpdateBusinessEin } from '../../../../../data/hooks/useTaxiqOwnerTaxYear'
import { W9_STATUSES, type W9Status } from '../../../../../data/repositories/taxiqOwnerPayouts'
import { isApiError } from '../../../../../types/domain'
import { getErrorI18nKey } from '../../../../../data/errorCodes'
import { SkeletonList } from '../../../../ui/skeleton'
import Tooltip from '../../../../ui/Tooltip'

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
  const { showToast } = useNotification()
  const listQuery = useTaxiqOwnerStaffList(ownerTaxYearId)
  const updateW9Status = useUpdateStaffW9Status()

  const [busyStaffTaxYearId, setBusyStaffTaxYearId] = useState<string | null>(null)

  const items = listQuery.data ?? []

  const handleW9StatusChange = async (staffTaxYearId: string, w9Status: W9Status) => {
    setBusyStaffTaxYearId(staffTaxYearId)
    try {
      await updateW9Status.mutateAsync({ ownerTaxYearId, staffTaxYearId, w9Status })
      showToast(t('taxiq.payoutCenter.staffTaxProfile.updateSuccess'), 'success')
    } catch (err) {
      const i18nKey = isApiError(err) ? getErrorI18nKey(err.errorCode) : 'taxiq.payoutCenter.staffTaxProfile.errors.generic'
      showToast(t(i18nKey), 'error')
    } finally {
      setBusyStaffTaxYearId(null)
    }
  }

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
              items.map((item) => {
                const isBusy = busyStaffTaxYearId === item.staffTaxYearId
                return (
                  <tr key={item.userProfileId} className="border-t border-nexoraRule">
                    <td className="px-4 py-3 font-bold text-nexoraText">{item.displayName}</td>
                    <td className="px-4 py-3 text-nexoraText">
                      {item.contractType ? t(`taxiq.payoutCenter.contractTypes.${item.contractType}`) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      {!item.hasStaffTaxYear || !item.staffTaxYearId ? (
                        <span className="text-nexoraMuted">{t('taxiq.payoutCenter.staffTaxProfile.noTaxYearYet')}</span>
                      ) : canEdit ? (
                        <div className="flex items-center gap-2">
                          <select
                            value={item.w9Status ?? 'NotRequired'}
                            disabled={isBusy}
                            onChange={(e) => handleW9StatusChange(item.staffTaxYearId as string, e.target.value as W9Status)}
                            className="rounded-lg border border-nexoraBorder px-2 py-1.5 text-xs font-semibold disabled:opacity-60"
                          >
                            {W9_STATUSES.map((status) => (
                              <option key={status} value={status}>{t(`taxiq.payoutCenter.w9Statuses.${status}`)}</option>
                            ))}
                          </select>
                          {isBusy && <Loader2 className="h-3.5 w-3.5 animate-spin text-nexoraMuted" />}
                        </div>
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
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
