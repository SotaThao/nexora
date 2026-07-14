import { useCallback, useMemo, useState } from 'react'
import { QrCode, Eye, Download, Copy, Check, UserPlus } from 'lucide-react'
import QrImage from '../../ui/QrImage'
import { useProfileSettings } from '../../../data/hooks/useProfileSettings'
import { getProfileReferralCode, buildAffiliateReferralUrl } from '../../../utils/affiliateReferral'
import { buildQrImageUrl } from '../../../utils/staffTipUrl'
import { downloadQrCode, QR_IMAGE_SIZES } from '../../../utils/qrUtils'
import { copyTextToClipboard } from '../../../utils/clipboard'
import ReferralQrModal from '../modals/ReferralQrModal'

const gatewayCardClass = 'rounded-xl border border-nexoraBorder bg-nexoraCanvas p-5'

const gatewayActionBtnClass = 'flex h-9 flex-1 min-w-0 items-center justify-center gap-1 rounded-lg px-2 text-xs font-bold transition cursor-pointer'

export default function ReferralGatewayPanel({ t, showToast }) {
  const { data: profile } = useProfileSettings()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [copied, setCopied] = useState(false)

  const referralCode = useMemo(() => getProfileReferralCode(profile || {}), [profile])
  const referralUrl = useMemo(() => buildAffiliateReferralUrl({ referralCode }), [referralCode])
  const qrPreviewUrl = useMemo(
    () => (referralUrl ? buildQrImageUrl(referralUrl, QR_IMAGE_SIZES.thumb) : ''),
    [referralUrl],
  )
  const qrDownloadUrl = useMemo(
    () => (referralUrl ? buildQrImageUrl(referralUrl, QR_IMAGE_SIZES.panel) : ''),
    [referralUrl],
  )

  const handleCopy = useCallback(async () => {
    if (!referralUrl) return
    try {
      await copyTextToClipboard(referralUrl)
      setCopied(true)
      showToast(t('dashboard.master_gateway.copied_qr_link'), 'success')
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      showToast(t('components.staff_dashboard.views.StaffMyQR.copyFailed'), 'error')
    }
  }, [referralUrl, showToast, t])

  const handleDownload = useCallback(async () => {
    if (!qrDownloadUrl || isDownloading) return
    setIsDownloading(true)
    try {
      await downloadQrCode(qrDownloadUrl, `${referralCode || 'referral'}-qr.png`)
      showToast(t('components.SettingsView.qrCodeDownloaded'), 'success')
    } catch {
      showToast(t('common.error'), 'error')
    } finally {
      setIsDownloading(false)
    }
  }, [qrDownloadUrl, isDownloading, referralCode, showToast, t])

  return (
    <>
      <div className={`${gatewayCardClass} flex flex-col gap-5`}>
        <div className="flex flex-col gap-5 md:flex-row md:justify-between">
          <div className="md:min-w-0 md:flex-grow">
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-nexoraBrandSoft text-nexoraBrand">
                <UserPlus className="h-5 w-5" />
              </span>
              <h3 className="text-sm font-extrabold text-nexoraText">
                {t('dashboard.master_gateway.referral_title')}
              </h3>
            </div>
            <p className="mt-3 text-xs leading-normal text-nexoraMuted">
              {t('dashboard.master_gateway.referral_body')}
            </p>

            <div className="mt-3 flex items-center justify-between gap-2 rounded-lg border border-nexoraBorder bg-white py-1.5 pl-4 pr-1.5">
              <input
                type="text"
                readOnly
                value={referralUrl ? referralUrl.replace(/^https?:\/\//, '') : ''}
                className="min-w-0 flex-1 truncate bg-transparent text-xs font-semibold text-nexoraBrand"
              />
              <button
                type="button"
                onClick={() => void handleCopy()}
                disabled={!referralUrl}
                aria-label={t('dashboard.master_gateway.btn_copy_link')}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-nexoraMuted transition hover:bg-nexoraSurfaceMuted hover:text-nexoraBrand disabled:cursor-not-allowed disabled:opacity-40"
              >
                {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            aria-label={t('dashboard.master_gateway.referral_title')}
            className="mx-auto flex h-28 w-28 shrink-0 items-center justify-center rounded-lg border border-nexoraBorder/80 bg-white p-2 shadow-sm relative overflow-hidden cursor-pointer hover:border-nexoraBrand transition select-none group md:mx-0 md:self-start"
          >
            {qrPreviewUrl ? (
              <QrImage
                src={qrPreviewUrl}
                alt={t('dashboard.master_gateway.referral_title')}
                className="h-full w-full transition duration-200 group-hover:scale-105"
              />
            ) : (
              <QrCode className="h-12 w-12 text-slate-300" />
            )}
            <div className="absolute inset-0 bg-nexoraBrand/80 opacity-0 group-hover:opacity-100 transition flex flex-col items-center justify-center gap-1 text-white select-none">
              <QrCode className="h-5 w-5" />
              <span className="text-[9px] font-black uppercase tracking-wider">
                {t('components.dashboard.views.StaffView.preview')}
              </span>
            </div>
          </button>
        </div>

        <div className="flex w-full gap-2">
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className={`${gatewayActionBtnClass} bg-white border border-nexoraBorder text-nexoraText hover:bg-nexoraSurfaceMuted`}
          >
            <Eye className="h-4 w-4 shrink-0" />
            <span className="truncate">{t('dashboard.master_gateway.btn_open')}</span>
          </button>
          <button
            type="button"
            onClick={() => void handleDownload()}
            disabled={isDownloading || !qrDownloadUrl}
            className={`${gatewayActionBtnClass} bg-nexoraBrand text-white hover:bg-nexoraBrandDark disabled:cursor-not-allowed disabled:opacity-60`}
          >
            <Download className="h-4 w-4 shrink-0" />
            <span className="truncate">{t('dashboard.master_gateway.btn_download')}</span>
          </button>
        </div>
      </div>
      <ReferralQrModal open={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  )
}
