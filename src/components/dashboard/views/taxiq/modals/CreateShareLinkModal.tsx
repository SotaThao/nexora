import { useState } from 'react'
import { Loader2, X } from 'lucide-react'
import IconButton from '../../../../ui/IconButton'
import { useTranslation } from '../../../../../contexts/LanguageContext'
import { useNotification } from '../../../../../contexts/NotificationContext'
import { useCreateShareLink } from '../../../../../data/hooks/useTaxiqShareLinks'
import {
  SHARE_LINK_ACCESS_MODES,
  SHARE_LINK_DATA_BLOCKS,
  SHARE_LINK_DOWNLOAD_PERMISSIONS,
  SHARE_LINK_EXPIRY_DAYS,
  SHARE_LINK_RECIPIENT_TYPES,
  type ShareLinkAccessMode,
  type ShareLinkDataBlock,
  type ShareLinkDownloadPermission,
  type ShareLinkExpiryDays,
  type ShareLinkRecipientType,
} from '../../../../../data/repositories/taxiqShareLinks'
import { isApiError } from '../../../../../types/domain'
import { getErrorI18nKey } from '../../../../../data/errorCodes'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const TAX_YEAR_SCOPED_BLOCKS = new Set<ShareLinkDataBlock>(['ReceiptIndex', 'PayoutEvidence'])

export default function CreateShareLinkModal({
  open,
  onClose,
  ownerTaxYearId,
}: {
  open: boolean
  onClose: () => void
  ownerTaxYearId?: string
}) {
  const { t } = useTranslation()
  const { showToast } = useNotification()
  const createShareLink = useCreateShareLink()

  const [recipientType, setRecipientType] = useState<ShareLinkRecipientType>(SHARE_LINK_RECIPIENT_TYPES[0])
  const [recipientName, setRecipientName] = useState('')
  const [cpaEmail, setCpaEmail] = useState('')
  const [accessMode, setAccessMode] = useState<ShareLinkAccessMode>(SHARE_LINK_ACCESS_MODES[0])
  const [sharedDataBlocks, setSharedDataBlocks] = useState<ShareLinkDataBlock[]>([])
  const [downloadPermission, setDownloadPermission] = useState<ShareLinkDownloadPermission>(SHARE_LINK_DOWNLOAD_PERMISSIONS[0])
  const [passcodeEnabled, setPasscodeEnabled] = useState(false)
  const [passcode, setPasscode] = useState('')
  const [expiryDays, setExpiryDays] = useState<ShareLinkExpiryDays | null>(SHARE_LINK_EXPIRY_DAYS[1])
  const [saveAsDraft, setSaveAsDraft] = useState(false)
  const [error, setError] = useState('')

  if (!open) return null

  const isPublicProfileOnly = sharedDataBlocks.length === 1 && sharedDataBlocks[0] === 'PublicProfile'
  const requiresTaxYearAnchor = sharedDataBlocks.some((b) => TAX_YEAR_SCOPED_BLOCKS.has(b))
  const requiresCpaEmail = recipientType === 'Cpa'

  const toggleBlock = (block: ShareLinkDataBlock) => {
    setSharedDataBlocks((prev) => {
      const next = prev.includes(block) ? prev.filter((b) => b !== block) : [...prev, block]
      if (expiryDays === null && !(next.length === 1 && next[0] === 'PublicProfile')) {
        setExpiryDays(SHARE_LINK_EXPIRY_DAYS[1])
      }
      return next
    })
  }

  const canSubmit =
    recipientName.trim().length > 0 &&
    (!requiresCpaEmail || EMAIL_PATTERN.test(cpaEmail.trim())) &&
    sharedDataBlocks.length > 0 &&
    (!passcodeEnabled || passcode.trim().length > 0) &&
    (!requiresTaxYearAnchor || !!ownerTaxYearId)

  const handleClose = () => {
    setRecipientType(SHARE_LINK_RECIPIENT_TYPES[0])
    setRecipientName('')
    setCpaEmail('')
    setAccessMode(SHARE_LINK_ACCESS_MODES[0])
    setSharedDataBlocks([])
    setDownloadPermission(SHARE_LINK_DOWNLOAD_PERMISSIONS[0])
    setPasscodeEnabled(false)
    setPasscode('')
    setExpiryDays(SHARE_LINK_EXPIRY_DAYS[1])
    setSaveAsDraft(false)
    setError('')
    onClose()
  }

  const handleSubmit = async () => {
    if (!canSubmit || createShareLink.isPending) return
    setError('')
    try {
      await createShareLink.mutateAsync({
        recipientName: recipientName.trim(),
        recipientType,
        cpaEmail: requiresCpaEmail ? cpaEmail.trim() : null,
        accessMode,
        sharedDataBlocks,
        downloadPermission,
        passcode: passcodeEnabled ? passcode.trim() : null,
        expiryDays,
        ownerTaxYearId: requiresTaxYearAnchor ? ownerTaxYearId : undefined,
        saveAsDraft,
      })
      showToast(t('taxiq.shareLinks.form.success'), 'success')
      handleClose()
    } catch (err) {
      const fallback = t('taxiq.shareLinks.form.errors.generic')
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
          <h2 className="text-sm font-extrabold text-nexoraText">{t('taxiq.shareLinks.form.modalTitle')}</h2>
          <IconButton label={t('common.cancel')} onClick={handleClose}>
            <X className="h-4 w-4" />
          </IconButton>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto">
          <div>
            <label className="mb-1 block text-xs font-bold text-nexoraMuted">
              {t('taxiq.shareLinks.form.recipientTypeLabel')}
            </label>
            <div className="flex flex-wrap gap-2">
              {SHARE_LINK_RECIPIENT_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setRecipientType(type)}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-bold ${
                    recipientType === type
                      ? 'border-nexoraBrand bg-nexoraBrand text-white'
                      : 'border-nexoraBorder text-nexoraText'
                  }`}
                >
                  {t(`taxiq.shareLinks.recipientTypes.${type}`)}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-bold text-nexoraMuted">
                {t('taxiq.shareLinks.form.recipientNameLabel')}
              </label>
              <input
                type="text"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                placeholder={t('taxiq.shareLinks.form.recipientNamePlaceholder')}
                className="w-full rounded-lg border border-nexoraBorder px-3 py-2 text-sm"
              />
            </div>
            {requiresCpaEmail && (
              <div>
                <label className="mb-1 block text-xs font-bold text-nexoraMuted">
                  {t('taxiq.shareLinks.form.cpaEmailLabel')}
                </label>
                <input
                  type="email"
                  value={cpaEmail}
                  onChange={(e) => setCpaEmail(e.target.value)}
                  placeholder={t('taxiq.shareLinks.form.cpaEmailPlaceholder')}
                  className="w-full rounded-lg border border-nexoraBorder px-3 py-2 text-sm"
                />
              </div>
            )}
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold text-nexoraMuted">
              {t('taxiq.shareLinks.form.accessModeLabel')}
            </label>
            <div className="flex flex-wrap gap-2">
              {SHARE_LINK_ACCESS_MODES.map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setAccessMode(mode)}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-bold ${
                    accessMode === mode
                      ? 'border-nexoraBrand bg-nexoraBrand text-white'
                      : 'border-nexoraBorder text-nexoraText'
                  }`}
                >
                  {t(`taxiq.shareLinks.accessModes.${mode}`)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold text-nexoraMuted">
              {t('taxiq.shareLinks.form.sharedDataBlocksLabel')}
            </label>
            <div className="space-y-1.5">
              {SHARE_LINK_DATA_BLOCKS.map((block) => (
                <label key={block} className="flex items-center gap-2 text-xs font-semibold text-nexoraText">
                  <input
                    type="checkbox"
                    checked={sharedDataBlocks.includes(block)}
                    onChange={() => toggleBlock(block)}
                  />
                  {t(`taxiq.shareLinks.dataBlocks.${block}`)}
                </label>
              ))}
            </div>
            {requiresTaxYearAnchor && !ownerTaxYearId && (
              <p className="mt-1 text-[11px] font-semibold text-rose-600">
                {t('taxiq.shareLinks.form.noOwnerTaxYear')}
              </p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold text-nexoraMuted">
              {t('taxiq.shareLinks.form.downloadPermissionLabel')}
            </label>
            <div className="flex flex-wrap gap-2">
              {SHARE_LINK_DOWNLOAD_PERMISSIONS.map((perm) => (
                <button
                  key={perm}
                  type="button"
                  onClick={() => setDownloadPermission(perm)}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-bold ${
                    downloadPermission === perm
                      ? 'border-nexoraBrand bg-nexoraBrand text-white'
                      : 'border-nexoraBorder text-nexoraText'
                  }`}
                >
                  {t(`taxiq.shareLinks.downloadPermissions.${perm}`)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold text-nexoraMuted">
              {t('taxiq.shareLinks.form.expiryDaysLabel')}
            </label>
            <div className="flex flex-wrap gap-2">
              {SHARE_LINK_EXPIRY_DAYS.map((days) => (
                <button
                  key={days}
                  type="button"
                  onClick={() => setExpiryDays(days)}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-bold ${
                    expiryDays === days
                      ? 'border-nexoraBrand bg-nexoraBrand text-white'
                      : 'border-nexoraBorder text-nexoraText'
                  }`}
                >
                  {t('taxiq.shareLinks.form.expiryDaysOption', { count: days })}
                </button>
              ))}
              <button
                type="button"
                disabled={!isPublicProfileOnly}
                onClick={() => setExpiryDays(null)}
                className={`rounded-lg border px-3 py-1.5 text-xs font-bold disabled:cursor-not-allowed disabled:opacity-40 ${
                  expiryDays === null
                    ? 'border-nexoraBrand bg-nexoraBrand text-white'
                    : 'border-nexoraBorder text-nexoraText'
                }`}
              >
                {t('taxiq.shareLinks.form.neverExpires')}
              </button>
            </div>
            {!isPublicProfileOnly && (
              <p className="mt-1 text-[11px] font-medium text-nexoraMuted">
                {t('taxiq.shareLinks.form.neverExpiresHint')}
              </p>
            )}
          </div>

          <div className="rounded-lg border border-nexoraBorder p-3">
            <label className="flex items-center gap-2 text-xs font-bold text-nexoraText">
              <input
                type="checkbox"
                checked={passcodeEnabled}
                onChange={(e) => setPasscodeEnabled(e.target.checked)}
              />
              {t('taxiq.shareLinks.form.passcodeEnableLabel')}
            </label>
            {passcodeEnabled && (
              <input
                type="text"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder={t('taxiq.shareLinks.form.passcodePlaceholder')}
                maxLength={50}
                className="mt-2 w-full rounded-lg border border-nexoraBorder px-3 py-2 text-sm"
              />
            )}
          </div>

          <label className="flex items-center gap-2 text-xs font-bold text-nexoraText">
            <input type="checkbox" checked={saveAsDraft} onChange={(e) => setSaveAsDraft(e.target.checked)} />
            {t('taxiq.shareLinks.form.saveAsDraftLabel')}
          </label>

          {error && <p className="text-xs font-semibold text-rose-600">{error}</p>}
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={handleClose} className="rounded-lg px-4 py-2 text-xs font-bold text-nexoraMuted">
            {t('common.cancel')}
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit || createShareLink.isPending}
            className="inline-flex items-center gap-1.5 rounded-lg bg-nexoraBrand px-5 py-2 text-xs font-bold text-white disabled:opacity-60"
          >
            {createShareLink.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {saveAsDraft ? t('taxiq.shareLinks.form.saveDraftButton') : t('taxiq.shareLinks.form.submitButton')}
          </button>
        </div>
      </div>
    </div>
  )
}
