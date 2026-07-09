import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { useTranslation } from '../../../../../contexts/LanguageContext'
import { useNotification } from '../../../../../contexts/NotificationContext'
import { useTaxiqOwnerStaffList, useUpdateStaffW9Status } from '../../../../../data/hooks/useTaxiqOwnerPayouts'
import { W9_STATUSES, type W9Status } from '../../../../../data/repositories/taxiqOwnerPayouts'
import { isApiError } from '../../../../../types/domain'
import { getErrorI18nKey } from '../../../../../data/errorCodes'
import { SkeletonList } from '../../../../ui/skeleton'
import Tooltip from '../../../../ui/Tooltip'

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

      <div className="overflow-x-auto rounded-xl border border-nexoraBorder bg-white">
        <table className="w-full min-w-[640px] text-left text-xs">
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
            </tr>
          </thead>
          <tbody>
            {listQuery.isPending ? (
              <tr>
                <td colSpan={3} className="p-4">
                  <SkeletonList count={4} lines={1} />
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center font-medium text-nexoraMuted">
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
