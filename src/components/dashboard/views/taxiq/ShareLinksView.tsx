import { useState } from 'react'
import { Copy, Lock, Plus, QrCode } from 'lucide-react'
import { useTranslation } from '../../../../contexts/LanguageContext'
import { useNotification } from '../../../../contexts/NotificationContext'
import { usePublishShareLink, useRevokeShareLink, useShareLinks } from '../../../../data/hooks/useTaxiqShareLinks'
import taxiqShareLinksRepository from '../../../../data/repositories/taxiqShareLinks'
import type { ShareLinkListItem } from '../../../../data/repositories/taxiqShareLinks'
import { isApiError } from '../../../../types/domain'
import { getErrorI18nKey } from '../../../../data/errorCodes'
import { SkeletonList } from '../../../ui/skeleton'
import { formatTransactionDateTime } from '../../utils'
import ShareLinkStatusBadge from './shared/ShareLinkStatusBadge'
import CreateShareLinkModal from './modals/CreateShareLinkModal'
import RevokeShareLinkModal from './modals/RevokeShareLinkModal'

export default function ShareLinksView({ ownerTaxYearId }: { ownerTaxYearId?: string }) {
  const { t, currentLanguage } = useTranslation()
  const { showToast } = useNotification()

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [revokingLink, setRevokingLink] = useState<ShareLinkListItem | null>(null)

  const listQuery = useShareLinks()
  const publishLink = usePublishShareLink()
  const revokeLink = useRevokeShareLink()
  const items = listQuery.data ?? []

  const handleError = (err: unknown, fallbackKey: string) => {
    const fallback = t(fallbackKey)
    const message = isApiError(err)
      ? (() => {
          const i18nKey = getErrorI18nKey(err.errorCode)
          const translated = t(i18nKey)
          return translated !== i18nKey ? translated : (err.message || fallback)
        })()
      : fallback
    showToast(message, 'error')
  }

  const handleCopyLink = async (link: ShareLinkListItem) => {
    const url = `${window.location.origin}/share/access?token=${encodeURIComponent(link.accessToken)}`
    try {
      await navigator.clipboard.writeText(url)
      showToast(t('common.copied'), 'success')
    } catch {
      showToast(t('taxiq.shareLinks.copyLink.errors.generic'), 'error')
    }
  }

  const handleDownloadQr = async (link: ShareLinkListItem) => {
    try {
      const blob = await taxiqShareLinksRepository.getQrBlob(link.id)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `share-link-${link.id}.png`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      handleError(err, 'taxiq.shareLinks.qr.errors.generic')
    }
  }

  const handlePublish = async (link: ShareLinkListItem) => {
    if (publishLink.isPending) return
    try {
      await publishLink.mutateAsync(link.id)
      showToast(t('taxiq.shareLinks.publish.success'), 'success')
    } catch (err) {
      handleError(err, 'taxiq.shareLinks.publish.errors.generic')
    }
  }

  const handleRevoke = async (reason: string) => {
    if (!revokingLink || revokeLink.isPending) return
    try {
      await revokeLink.mutateAsync({ id: revokingLink.id, revokeReason: reason || undefined })
      showToast(t('taxiq.shareLinks.revoke.success'), 'success')
      setRevokingLink(null)
    } catch (err) {
      handleError(err, 'taxiq.shareLinks.revoke.errors.generic')
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-nexoraText">{t('taxiq.shareLinks.title')}</h2>
          <p className="mt-1 text-xs text-nexoraMuted">{t('taxiq.shareLinks.subtitle')}</p>
        </div>
        <button
          type="button"
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-nexoraBrand px-4 py-2 text-xs font-bold text-white"
        >
          <Plus className="h-3.5 w-3.5" />
          {t('taxiq.shareLinks.createButton')}
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-nexoraBorder bg-white">
        <table className="w-full min-w-[900px] text-left text-xs">
          <thead className="bg-nexoraCanvas text-[10px] font-extrabold uppercase text-nexoraMuted">
            <tr>
              <th className="px-4 py-3">{t('taxiq.shareLinks.columns.recipient')}</th>
              <th className="px-4 py-3">{t('taxiq.shareLinks.columns.accessMode')}</th>
              <th className="px-4 py-3">{t('taxiq.shareLinks.columns.sharedDataBlocks')}</th>
              <th className="px-4 py-3">{t('taxiq.shareLinks.columns.downloadPermission')}</th>
              <th className="px-4 py-3">{t('taxiq.shareLinks.columns.status')}</th>
              <th className="px-4 py-3">{t('taxiq.shareLinks.columns.expiresAt')}</th>
              <th className="px-4 py-3 text-right">{t('taxiq.shareLinks.columns.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {listQuery.isPending ? (
              <tr>
                <td colSpan={7} className="p-4">
                  <SkeletonList count={3} lines={1} />
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center font-medium text-nexoraMuted">
                  {t('taxiq.shareLinks.emptyState')}
                </td>
              </tr>
            ) : (
              items.map((link) => (
                <tr key={link.id} className="border-t border-nexoraRule">
                  <td className="px-4 py-3">
                    <div className="font-bold text-nexoraText">{link.recipientName}</div>
                    <div className="text-[11px] text-nexoraMuted">
                      {t(`taxiq.shareLinks.recipientTypes.${link.recipientType}`)}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-nexoraText">
                    {t(`taxiq.shareLinks.accessModes.${link.accessMode}`)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {link.sharedDataBlocks.map((block) => (
                        <span
                          key={block}
                          className="rounded-full border border-nexoraBorder px-2 py-0.5 text-[10px] font-semibold text-nexoraText"
                        >
                          {t(`taxiq.shareLinks.dataBlocks.${block}`)}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-nexoraText">
                    <span className="inline-flex items-center gap-1">
                      {link.hasPasscode && <Lock className="h-3 w-3 text-nexoraMuted" />}
                      {t(`taxiq.shareLinks.downloadPermissions.${link.downloadPermission}`)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <ShareLinkStatusBadge status={link.status} />
                  </td>
                  <td className="px-4 py-3 text-nexoraMuted">
                    {link.expiresAt ? formatTransactionDateTime(link.expiresAt, currentLanguage) : t('taxiq.shareLinks.neverExpires')}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap items-center justify-end gap-3">
                      {link.status === 'Draft' && (
                        <button
                          type="button"
                          onClick={() => handlePublish(link)}
                          className="text-[11px] font-bold text-nexoraBrand hover:underline"
                        >
                          {t('taxiq.shareLinks.actions.publish')}
                        </button>
                      )}
                      {link.status === 'Active' && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleCopyLink(link)}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-nexoraBrand hover:underline"
                          >
                            <Copy className="h-3 w-3" />
                            {t('taxiq.shareLinks.actions.copyLink')}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDownloadQr(link)}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-nexoraBrand hover:underline"
                          >
                            <QrCode className="h-3 w-3" />
                            {t('taxiq.shareLinks.actions.qr')}
                          </button>
                          <button
                            type="button"
                            onClick={() => setRevokingLink(link)}
                            className="text-[11px] font-bold text-rose-600 hover:underline"
                          >
                            {t('taxiq.shareLinks.actions.revoke')}
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isCreateModalOpen && (
        <CreateShareLinkModal
          open={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          ownerTaxYearId={ownerTaxYearId}
        />
      )}

      <RevokeShareLinkModal
        open={!!revokingLink}
        onClose={() => setRevokingLink(null)}
        onConfirm={handleRevoke}
        recipientName={revokingLink?.recipientName ?? ''}
        isPending={revokeLink.isPending}
      />
    </div>
  )
}
