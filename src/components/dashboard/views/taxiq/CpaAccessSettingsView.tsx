import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useTranslation } from '../../../../contexts/LanguageContext'
import { useNotification } from '../../../../contexts/NotificationContext'
import { useRevokeCpaAccessGrant, useTaxiqCpaAccessGrants } from '../../../../data/hooks/useTaxiqCpaAccess'
import type { CpaAccessGrantListItem } from '../../../../data/repositories/taxiqCpaAccess'
import { isApiError } from '../../../../types/domain'
import { getErrorI18nKey } from '../../../../data/errorCodes'
import { SkeletonList } from '../../../ui/skeleton'
import { formatTransactionDateTime } from '../../utils'
import CpaGrantStatusBadge from './shared/CpaGrantStatusBadge'
import CreateCpaAccessGrantModal from './modals/CreateCpaAccessGrantModal'
import ConfirmModal from './modals/ConfirmModal'

export default function CpaAccessSettingsView({
  scope,
  ownerTaxYearId,
  staffTaxYearId,
}: {
  scope: 'owner' | 'staff'
  ownerTaxYearId?: string
  staffTaxYearId?: string
}) {
  const { t, currentLanguage } = useTranslation()
  const { showToast } = useNotification()

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [revokingGrant, setRevokingGrant] = useState<CpaAccessGrantListItem | null>(null)

  const listParams = { ownerTaxYearId, staffTaxYearId }
  const listQuery = useTaxiqCpaAccessGrants(listParams)
  const revokeGrant = useRevokeCpaAccessGrant(listParams)
  const items = listQuery.data ?? []

  const handleRevoke = async () => {
    if (!revokingGrant || revokeGrant.isPending) return
    try {
      await revokeGrant.mutateAsync(revokingGrant.id)
      showToast(t('taxiq.cpaAccess.revoke.success'), 'success')
      setRevokingGrant(null)
    } catch (err) {
      const fallback = t('taxiq.cpaAccess.revoke.errors.generic')
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
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-nexoraText">{t('taxiq.cpaAccess.title')}</h2>
          <p className="mt-1 text-xs text-nexoraMuted">{t('taxiq.cpaAccess.subtitle')}</p>
        </div>
        <button
          type="button"
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-nexoraBrand px-4 py-2 text-xs font-bold text-white"
        >
          <Plus className="h-3.5 w-3.5" />
          {t('taxiq.cpaAccess.addButton')}
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-nexoraBorder bg-white">
        <table className="w-full min-w-[760px] text-left text-xs">
          <thead className="bg-nexoraCanvas text-[10px] font-extrabold uppercase text-nexoraMuted">
            <tr>
              <th className="px-4 py-3">{t('taxiq.cpaAccess.columns.cpaEmail')}</th>
              <th className="px-4 py-3">{t('taxiq.cpaAccess.columns.packageType')}</th>
              <th className="px-4 py-3">{t('taxiq.cpaAccess.columns.dataMode')}</th>
              <th className="px-4 py-3">{t('taxiq.cpaAccess.columns.expiresAt')}</th>
              <th className="px-4 py-3">{t('taxiq.cpaAccess.columns.status')}</th>
              <th className="px-4 py-3 text-right">{t('taxiq.cpaAccess.columns.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {listQuery.isPending ? (
              <tr>
                <td colSpan={6} className="p-4">
                  <SkeletonList count={3} lines={1} />
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center font-medium text-nexoraMuted">
                  {t('taxiq.cpaAccess.emptyState')}
                </td>
              </tr>
            ) : (
              items.map((grant) => (
                <tr key={grant.id} className="border-t border-nexoraRule">
                  <td className="px-4 py-3 font-bold text-nexoraText">{grant.cpaEmail}</td>
                  <td className="px-4 py-3 text-nexoraText">{t(`taxiq.cpaAccess.packageTypes.${grant.packageType}`)}</td>
                  <td className="px-4 py-3 text-nexoraText">{t(`taxiq.cpaAccess.dataModes.${grant.dataMode}`)}</td>
                  <td className="px-4 py-3 text-nexoraMuted">{formatTransactionDateTime(grant.expiresAt, currentLanguage)}</td>
                  <td className="px-4 py-3">
                    <CpaGrantStatusBadge status={grant.status} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end">
                      {grant.status === 'Active' && (
                        <button
                          type="button"
                          onClick={() => setRevokingGrant(grant)}
                          className="text-[11px] font-bold text-rose-600 hover:underline"
                        >
                          {t('taxiq.cpaAccess.actions.revoke')}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="nexora-card p-4">
        <h3 className="text-sm font-extrabold text-nexoraText">{t('taxiq.cpaAccess.downloadHistory.title')}</h3>
        <p className="mt-1 text-xs text-nexoraMuted">{t('taxiq.cpaAccess.downloadHistory.phase2Notice')}</p>
      </div>

      {isCreateModalOpen && (
        <CreateCpaAccessGrantModal
          open={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          scope={scope}
          ownerTaxYearId={ownerTaxYearId}
          staffTaxYearId={staffTaxYearId}
        />
      )}

      <ConfirmModal
        open={!!revokingGrant}
        onClose={() => setRevokingGrant(null)}
        onConfirm={handleRevoke}
        title={t('taxiq.cpaAccess.revoke.modalTitle')}
        message={t('taxiq.cpaAccess.revoke.modalMessage', { email: revokingGrant?.cpaEmail ?? '' })}
        confirmLabel={t('taxiq.cpaAccess.revoke.confirmButton')}
        isDangerous
        isPending={revokeGrant.isPending}
      />
    </div>
  )
}
