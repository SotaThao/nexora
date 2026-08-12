import { useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { Copy, Loader2, X } from 'lucide-react'
import { useTranslation } from '../../../contexts/LanguageContext'
import { useNotification } from '../../../contexts/NotificationContext'
import { useProfileSettings } from '../../../data/hooks/useProfileSettings'
import { getProfileReferralCode, buildAffiliateReferralUrl } from '../../../utils/affiliateReferral'
import { buildQrImageUrl } from '../../../utils/staffTipUrl'
import { downloadQrCode, QR_IMAGE_SIZES } from '../../../utils/qrUtils'
import { copyTextToClipboard } from '../../../utils/clipboard'
import QrImage from '../../ui/QrImage'

const TOAST_KEY = 'components.staff_dashboard.views.StaffMyQR'

const slugify = (value = '') =>
  value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'referral-qr'

type ReferralQrModalProps = {
  open: boolean
  onClose: () => void
}

export default function ReferralQrModal({ open, onClose }: ReferralQrModalProps) {
  const { t } = useTranslation()
  const { showToast } = useNotification()
  const { data: profile } = useProfileSettings()
  const [leg, setLeg] = useState<'left' | 'right'>('left')
  const [isSaving, setIsSaving] = useState(false)

  const k = (key: string, vars?: Record<string, string | number>) =>
    t(`dashboard.owner_home.${key}`, vars)

  const referralCode = useMemo(() => getProfileReferralCode(profile || {}), [profile])
  const referralUrl = useMemo(
    () => buildAffiliateReferralUrl({ referralCode, leg }),
    [referralCode, leg],
  )
  const qrImageSrc = useMemo(
    () => (referralUrl ? buildQrImageUrl(referralUrl, QR_IMAGE_SIZES.panel) : ''),
    [referralUrl],
  )

  if (!open || typeof document === 'undefined') return null

  const handleCopy = async () => {
    if (!referralUrl) {
      showToast(t(`${TOAST_KEY}.referralCodeUnavailable`), 'error')
      return
    }
    try {
      await copyTextToClipboard(referralUrl)
      showToast(t(`${TOAST_KEY}.referralLinkCopied`), 'success')
    } catch {
      showToast(t(`${TOAST_KEY}.copyFailed`), 'error')
    }
  }

  const handleSave = async () => {
    if (!qrImageSrc || isSaving) return
    setIsSaving(true)
    try {
      await downloadQrCode(qrImageSrc, `${slugify(referralCode || 'referral')}-${leg}-qr.png`)
      showToast(t('components.SettingsView.qrCodeDownloaded'), 'success')
    } catch {
      showToast(t('common.error'), 'error')
    } finally {
      setIsSaving(false)
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-nexoraText/70 modal-overlay-safe backdrop-blur-sm qr-modal-backdrop"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-xl bg-white p-6 shadow-2xl animate-scaleUp qr-modal-container"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="no-print modal-close-btn absolute right-2 top-2 rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          title={t('common.close')}
          aria-label={t('common.close')}
        >
          <X className="h-5 w-5" />
        </button>

        <h2 className="text-center text-base font-black uppercase tracking-wide text-nexoraText">
          {k('referral_qr_modal_title')}
        </h2>

        <div className="mt-4">
          <p className="text-xs font-semibold text-nexoraMuted">{k('referral_qr_choose_leg')}</p>
          <div className="mt-2 flex items-center justify-center gap-5">
            <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-nexoraText">
              <input
                type="radio"
                name="referral-leg"
                checked={leg === 'left'}
                onChange={() => setLeg('left')}
                className="h-4 w-4 accent-nexoraBrand"
              />
              {k('referral_qr_left_leg')}
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-nexoraText">
              <input
                type="radio"
                name="referral-leg"
                checked={leg === 'right'}
                onChange={() => setLeg('right')}
                className="h-4 w-4 accent-nexoraBrand"
              />
              {k('referral_qr_right_leg')}
            </label>
          </div>
        </div>

        <div className="mx-auto mt-4 flex aspect-square w-full max-w-[14.5rem] shrink-0 items-center justify-center overflow-hidden rounded-xl border border-nexoraBorder/60 bg-white p-2.5 shadow-inner">
          <QrImage src={qrImageSrc} alt={k('referral_qr_modal_title')} className="h-full w-full" />
        </div>

        <div className="mt-4">
          <p className="text-xs font-semibold text-nexoraMuted">{k('referral_qr_link_label')}</p>
          <div className="mt-1.5 flex items-center justify-between gap-2 overflow-hidden rounded-xl border border-nexoraBorder bg-slate-50 p-2 shadow-inner">
            <span className="min-w-0 flex-1 truncate pl-2 text-left font-mono text-[11px] text-slate-500">
              {referralUrl.replace(/^https?:\/\//, '')}
            </span>
            <button
              type="button"
              onClick={() => void handleCopy()}
              disabled={!referralUrl}
              className="flex shrink-0 items-center gap-1.5 rounded-full px-2 py-1 text-xs font-extrabold uppercase tracking-wide text-nexoraBrand transition hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Copy className="h-3.5 w-3.5" />
              <span>{t('common.copy')}</span>
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={isSaving || !qrImageSrc}
          className="no-print mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-nexoraBrand px-4 py-2.5 text-xs font-bold text-white transition hover:bg-opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
          {k('referral_qr_save_btn')}
        </button>
      </div>
    </div>,
    document.body,
  )
}
