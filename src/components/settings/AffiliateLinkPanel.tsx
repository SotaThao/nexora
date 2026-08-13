import { useMemo, useState } from 'react'
import { Check, Copy, Download } from 'lucide-react'
import { useTranslation } from '../../contexts/LanguageContext'
import { useNotification } from '../../contexts/NotificationContext'
import { useProfileSettings } from '../../data/hooks/useProfileSettings'
import { buildPublicQrImageUrl } from '../../data/repositories/publicQr'
import {
  buildAffiliateReferralUrl,
  getProfileReferralCode,
} from '../../utils/affiliateReferral'
import { copyTextToClipboard } from '../../utils/clipboard'
import { downloadQrCode, QR_IMAGE_SIZES } from '../../utils/qrUtils'
import QrImage from '../ui/QrImage'

interface AffiliateLinkPanelProps {
  className?: string
}

export default function AffiliateLinkPanel({ className = '' }: AffiliateLinkPanelProps) {
  const { t } = useTranslation()
  const { showToast } = useNotification()
  const { data: profile } = useProfileSettings()
  const [selectedLeg, setSelectedLeg] = useState<'left' | 'right'>('left')
  const [copied, setCopied] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)

  const referralCode = useMemo(
    () => getProfileReferralCode(profile || {}),
    [profile],
  )
  const referralUrl = useMemo(
    () => buildAffiliateReferralUrl({ referralCode, leg: selectedLeg }),
    [referralCode, selectedLeg],
  )
  const qrImageUrl = useMemo(
    () =>
      referralUrl
        ? buildPublicQrImageUrl(referralUrl, QR_IMAGE_SIZES.panel)
        : '',
    [referralUrl],
  )

  const handleCopy = async () => {
    if (!referralUrl) return
    try {
      await copyTextToClipboard(referralUrl)
      setCopied(true)
      showToast(t('dashboard.master_gateway.copied_qr_link'), 'success')
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      showToast(t('components.staff_dashboard.views.StaffMyQR.copyFailed'), 'error')
    }
  }

  const handleDownload = async () => {
    if (!qrImageUrl || isDownloading) return
    setIsDownloading(true)
    try {
      const result: unknown = await downloadQrCode(
        buildPublicQrImageUrl(referralUrl, QR_IMAGE_SIZES.print),
        `affiliate-qr-${selectedLeg}.png`,
      )
      if (result !== 'cancelled') {
        showToast(t('components.SettingsView.qrCodeDownloaded'), 'success')
      }
    } catch {
      showToast(t('common.error'), 'error')
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <div
      className={`mx-auto max-w-xl space-y-6 rounded-xl border border-nexoraBorder bg-white p-4 shadow-sm animate-fadeIn select-none sm:p-6 ${className}`}
    >
      <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
        <span className="mb-2 block text-center text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
          {t('components.SettingsView.selectPlacementLeg')}
        </span>
        <div className="mt-2 flex justify-center gap-6">
          {(['left', 'right'] as const).map((leg) => (
            <label
              key={leg}
              className="flex cursor-pointer items-center gap-2 text-xs font-bold text-slate-700"
            >
              <input
                type="radio"
                name="touchpointAffiliatePlacementLeg"
                value={leg}
                checked={selectedLeg === leg}
                onChange={() => setSelectedLeg(leg)}
                className="sr-only"
              />
              <span
                className={`flex h-4 w-4 items-center justify-center rounded-full border transition-all ${
                  selectedLeg === leg
                    ? 'border-nexoraBrand bg-nexoraBrand/10'
                    : 'border-slate-300 bg-white'
                }`}
              >
                {selectedLeg === leg ? (
                  <span className="h-1.5 w-1.5 rounded-full bg-nexoraBrand" />
                ) : null}
              </span>
              <span
                className={
                  selectedLeg === leg
                    ? 'font-black text-nexoraBrand'
                    : 'text-slate-500'
                }
              >
                {t(
                  leg === 'left'
                    ? 'components.SettingsView.leftLeg'
                    : 'components.SettingsView.rightLeg',
                )}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex flex-col items-center">
        <div className="mb-2 flex h-[220px] w-[220px] items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm transition hover:shadow-md sm:h-[240px] sm:w-[240px]">
          {qrImageUrl ? (
            <QrImage
              src={qrImageUrl}
              alt={t('dashboard.touchpoints.stations_sections.referral')}
              className="h-full w-full rounded-lg"
            />
          ) : (
            <span className="px-4 text-center text-xs font-bold text-nexoraMuted">
              {t(
                'components.staff_registration.hooks.useStaffRegistration.profileReferralCodeMissing',
              )}
            </span>
          )}
        </div>

        <div className="mb-4 min-w-0 max-w-md px-2 text-center">
          {referralUrl ? (
            <a
              href={referralUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="break-all text-[11px] font-bold text-blue-500 underline hover:text-blue-600"
            >
              {referralUrl}
            </a>
          ) : (
            <span className="text-[11px] font-bold text-nexoraMuted">
              {t(
                'components.staff_registration.hooks.useStaffRegistration.profileReferralCodeMissing',
              )}
            </span>
          )}
        </div>

        <div className="flex w-full max-w-md flex-col justify-center gap-3 sm:flex-row">
          <button
            type="button"
            disabled={!referralUrl || isDownloading}
            onClick={() => void handleDownload()}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-3 text-xs font-bold capitalize text-slate-700 shadow-sm transition hover:bg-slate-50 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download className="h-4 w-4 text-slate-500" />
            <span>{t('components.settings.SettingsTipQrPanel.downloadQr')}</span>
          </button>

          <button
            type="button"
            disabled={!referralUrl}
            onClick={() => void handleCopy()}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-nexoraBrand py-3 text-xs font-bold capitalize text-white shadow-sm shadow-indigo-500/10 transition hover:bg-nexoraBrandDark active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            <span>
              {copied
                ? t('common.copied')
                : t('dashboard.touchpoints.stations_sections.affiliate_copy_link')}
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}
