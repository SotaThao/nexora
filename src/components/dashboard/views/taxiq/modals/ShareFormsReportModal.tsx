import { useState } from 'react'
import { Check, Copy, Loader2, X } from 'lucide-react'
import IconButton from '../../../../ui/IconButton'
import { useTranslation } from '../../../../../contexts/LanguageContext'
import { useNotification } from '../../../../../contexts/NotificationContext'
import { useShareFormsReport } from '../../../../../data/hooks/useTaxiqFormsReports'
import { SHARE_LINK_ACCESS_MODES, SHARE_LINK_DOWNLOAD_PERMISSIONS, SHARE_LINK_EXPIRY_DAYS, SHARE_LINK_RECIPIENT_TYPES } from '../../../../../data/repositories/taxiqShareLinks'
import type { ShareLink } from '../../../../../data/repositories/taxiqShareLinks'
import { isApiError } from '../../../../../types/domain'
import { getErrorI18nKey } from '../../../../../data/errorCodes'

export default function ShareFormsReportModal({
  open,
  onClose,
  ownerTaxYearId,
  formsReportId,
  reportName,
}: {
  open: boolean
  onClose: () => void
  ownerTaxYearId: string
  formsReportId: string
  reportName: string
}) {
  const { t } = useTranslation()
  const { showToast } = useNotification()
  const shareForCpa = useShareFormsReport()

  const [recipientName, setRecipientName] = useState('')
  const [recipientType, setRecipientType] = useState<(typeof SHARE_LINK_RECIPIENT_TYPES)[number]>('Cpa')
  const [cpaEmail, setCpaEmail] = useState('')
  const [accessMode, setAccessMode] = useState<(typeof SHARE_LINK_ACCESS_MODES)[number]>('ReviewOnly')
  const [downloadPermission, setDownloadPermission] = useState<(typeof SHARE_LINK_DOWNLOAD_PERMISSIONS)[number]>('Disabled')
  const [expiryDays, setExpiryDays] = useState<(typeof SHARE_LINK_EXPIRY_DAYS)[number]>(SHARE_LINK_EXPIRY_DAYS[1])
  const [error, setError] = useState('')
  const [createdLink, setCreatedLink] = useState<ShareLink | null>(null)
  const [copied, setCopied] = useState(false)

  if (!open) return null

  const handleClose = () => {
    setRecipientName('')
    setCpaEmail('')
    setCreatedLink(null)
    setCopied(false)
    setError('')
    onClose()
  }

  const handleSubmit = async () => {
    if (!recipientName.trim()) {
      setError(t('taxiq.formsReports.share.recipientNameRequired'))
      return
    }
    if (recipientType === 'Cpa' && !cpaEmail.trim()) {
      setError(t('taxiq.formsReports.share.cpaEmailRequired'))
      return
    }
    setError('')
    try {
      const link = await shareForCpa.mutateAsync({
        formsReportId,
        params: {
          ownerTaxYearId,
          recipientName: recipientName.trim(),
          recipientType,
          cpaEmail: cpaEmail.trim() || null,
          accessMode,
          downloadPermission,
          expiryDays,
        },
      })
      setCreatedLink(link)
      showToast(t('taxiq.formsReports.share.success'), 'success')
    } catch (err) {
      const fallback = t('taxiq.formsReports.errors.generic')
      const message = isApiError(err)
        ? (() => {
            const i18nKey = getErrorI18nKey(err.errorCode)
            const translated = t(i18nKey)
            return translated !== i18nKey ? translated : (err.message || fallback)
          })()
        : fallback
      setError(message)
    }
  }

  const handleCopyLink = async () => {
    if (!createdLink) return
    const url = `${window.location.origin}/share/access?token=${encodeURIComponent(createdLink.accessToken)}`
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      showToast(t('common.copied'), 'success')
    } catch {
      showToast(t('taxiq.formsReports.share.copyErrors.generic'), 'error')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-nexoraText/70 p-4 backdrop-blur-sm">
      <div className="nexora-modal-card max-w-lg">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-extrabold text-nexoraText">{t('taxiq.formsReports.actions.share')}</h2>
          <IconButton label={t('common.cancel')} onClick={handleClose}>
            <X className="h-4 w-4" />
          </IconButton>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto">
          <p className="text-xs font-semibold text-nexoraText">{reportName}</p>

          {createdLink ? (
            <div className="space-y-3">
              <p className="text-xs font-medium text-nexoraMuted">{t('taxiq.formsReports.share.linkCreatedNotice')}</p>
              <div className="flex items-center gap-2 rounded-lg border border-nexoraBorder bg-nexoraCanvas px-3 py-2">
                <span className="flex-1 truncate font-mono text-[11px] text-nexoraText">{createdLink.accessToken}</span>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-nexoraBrand hover:underline"
                >
                  {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  {t('taxiq.formsReports.share.copyLinkButton')}
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-bold text-nexoraMuted">{t('taxiq.formsReports.share.recipientNameLabel')}</label>
                  <input
                    type="text"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-nexoraBorder px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-nexoraMuted">{t('taxiq.formsReports.share.recipientTypeLabel')}</label>
                  <select
                    value={recipientType}
                    onChange={(e) => setRecipientType(e.target.value as (typeof SHARE_LINK_RECIPIENT_TYPES)[number])}
                    className="mt-1 w-full rounded-lg border border-nexoraBorder px-3 py-2 text-sm"
                  >
                    {SHARE_LINK_RECIPIENT_TYPES.map((rt) => (
                      <option key={rt} value={rt}>
                        {t(`taxiq.shareLinks.recipientTypes.${rt}`)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-nexoraMuted">{t('taxiq.formsReports.share.cpaEmailLabel')}</label>
                <input
                  type="email"
                  value={cpaEmail}
                  onChange={(e) => setCpaEmail(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-nexoraBorder px-3 py-2 text-sm"
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-bold text-nexoraMuted">{t('taxiq.formsReports.share.accessModeLabel')}</label>
                  <select
                    value={accessMode}
                    onChange={(e) => setAccessMode(e.target.value as (typeof SHARE_LINK_ACCESS_MODES)[number])}
                    className="mt-1 w-full rounded-lg border border-nexoraBorder px-3 py-2 text-sm"
                  >
                    {SHARE_LINK_ACCESS_MODES.map((am) => (
                      <option key={am} value={am}>
                        {t(`taxiq.shareLinks.accessModes.${am}`)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-nexoraMuted">{t('taxiq.formsReports.share.downloadPermissionLabel')}</label>
                  <select
                    value={downloadPermission}
                    onChange={(e) => setDownloadPermission(e.target.value as (typeof SHARE_LINK_DOWNLOAD_PERMISSIONS)[number])}
                    className="mt-1 w-full rounded-lg border border-nexoraBorder px-3 py-2 text-sm"
                  >
                    {SHARE_LINK_DOWNLOAD_PERMISSIONS.map((dp) => (
                      <option key={dp} value={dp}>
                        {t(`taxiq.shareLinks.downloadPermissions.${dp}`)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-nexoraMuted">{t('taxiq.formsReports.share.expiryDaysLabel')}</label>
                <div className="flex flex-wrap gap-2">
                  {SHARE_LINK_EXPIRY_DAYS.map((days) => (
                    <button
                      key={days}
                      type="button"
                      onClick={() => setExpiryDays(days)}
                      className={`rounded-lg border px-3 py-1.5 text-xs font-bold ${
                        expiryDays === days ? 'border-nexoraBrand bg-nexoraBrand text-white' : 'border-nexoraBorder text-nexoraText'
                      }`}
                    >
                      {t('taxiq.formsReports.share.expiryDaysOption', { count: days })}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {error && <p className="text-xs font-semibold text-rose-600">{error}</p>}
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={handleClose} className="rounded-lg px-4 py-2 text-xs font-bold text-nexoraMuted">
            {createdLink ? t('common.close') : t('common.cancel')}
          </button>
          {!createdLink && (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={shareForCpa.isPending}
              className="inline-flex items-center gap-1.5 rounded-lg bg-nexoraBrand px-5 py-2 text-xs font-bold text-white disabled:opacity-60"
            >
              {shareForCpa.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {t('taxiq.formsReports.share.generateButton')}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
