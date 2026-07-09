// ReferralShare — self-contained affiliate referral card (US-040).
// Renders the user's referral QR (encoding /?ref=<code>), the referral code,
// the shareable link, and copy/share actions. Shared surface so Link & Tip and
// (later) Profile/Settings present affiliate sharing identically.
import { useCallback, useMemo } from 'react'
import { Share2, Copy, Gift } from 'lucide-react'
import { useTranslation } from '../../contexts/LanguageContext'
import { useNotification } from '../../contexts/NotificationContext'
import { useProfileSettings } from '../../data/hooks/useProfileSettings'
import { getProfileReferralCode, buildAffiliateReferralUrl } from '../../utils/affiliateReferral'
import { buildQrImageUrl } from '../../utils/staffTipUrl'
import { shareUrl } from '../../utils/shareUrl'
import QrImage from '../ui/QrImage'

const panel = 'rounded-2xl border border-nexoraBorder bg-nexoraSurface p-4 shadow-sm'

const KEY = 'components.staff_dashboard.views.StaffMyQR'

type ReferralShareProps = {
  showExplainer?: boolean
  className?: string
}

export default function ReferralShare({ showExplainer = true, className = '' }: ReferralShareProps) {
  const { t } = useTranslation()
  const { showToast } = useNotification()
  const { data: profile } = useProfileSettings()

  const referralCode = useMemo(() => getProfileReferralCode(profile || {}), [profile])
  const referralUrl = useMemo(
    () => buildAffiliateReferralUrl({ referralCode }),
    [referralCode],
  )
  const qrImageSrc = useMemo(
    () => (referralUrl ? buildQrImageUrl(referralUrl, 200) : ''),
    [referralUrl],
  )

  const copyValue = useCallback(
    async (value: string, successKey: string) => {
      if (!value) {
        showToast(t(`${KEY}.referralCodeUnavailable`), 'error')
        return
      }
      try {
        await navigator.clipboard.writeText(value)
        showToast(t(successKey), 'success')
      } catch {
        showToast(t(`${KEY}.copyFailed`), 'error')
      }
    },
    [showToast, t],
  )

  const handleShare = useCallback(async () => {
    if (!referralUrl) {
      showToast(t(`${KEY}.referralCodeUnavailable`), 'error')
      return
    }
    try {
      const result = await shareUrl({
        url: referralUrl,
        title: t('staff_dashboard.qr.share_referral'),
        text: referralCode,
      })
      if (result === 'copied') {
        showToast(t(`${KEY}.referralLinkCopied`), 'success')
      }
    } catch {
      showToast(t(`${KEY}.shareFailed`), 'error')
    }
  }, [referralUrl, referralCode, showToast, t])

  return (
    <section className={`${panel} text-center ${className}`}>
      <h3 className="text-base font-extrabold text-nexoraText">
        {t('staff_dashboard.qr.affiliate_title')}
      </h3>
      <p className="mt-1 text-xs text-nexoraMuted">{t('staff_dashboard.qr.affiliate_sub')}</p>

      {referralUrl ? (
        <>
          {showExplainer && (
            <div className="mx-auto mt-3 flex max-w-xs items-start gap-2 rounded-xl border border-nexoraBrand/20 bg-nexoraBrandSoft/60 px-3 py-2 text-left">
              <Gift className="mt-0.5 h-4 w-4 shrink-0 text-nexoraBrand" />
              <span className="text-[11px] font-semibold leading-relaxed text-nexoraBrand">
                {t('staff_dashboard.qr.affiliate_explainer')}
              </span>
            </div>
          )}

          <div className="mx-auto my-4 flex h-44 w-44 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-nexoraBorder/60 bg-white p-3.5 shadow-sm select-none">
            <QrImage src={qrImageSrc} alt="Referral QR" className="h-full w-full" />
          </div>

          <div className="flex items-center justify-center gap-2 text-sm font-bold text-nexoraText">
            <span>
              {t('staff_dashboard.qr.referral_code')}: {referralCode}
            </span>
            <button
              type="button"
              onClick={() => copyValue(referralCode, `${KEY}.referralCodeCopied`)}
              className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-nexoraBorder bg-nexoraSurface text-nexoraBrand transition hover:bg-nexoraCanvas"
              aria-label={t('staff_dashboard.qr.referral_code')}
              title={t('staff_dashboard.qr.referral_code')}
            >
              <Copy className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="mx-auto mt-3 flex max-w-xs items-center justify-between gap-2 overflow-hidden rounded-xl border border-nexoraBorder bg-slate-50 p-1.5 shadow-inner">
            <span className="min-w-0 flex-1 truncate pl-2 text-left font-mono text-[10px] text-slate-500">
              {referralUrl.replace(/^https?:\/\//, '')}
            </span>
            <button
              type="button"
              onClick={() => copyValue(referralUrl, `${KEY}.referralLinkCopied`)}
              className="flex h-7 shrink-0 items-center gap-1 rounded-lg bg-slate-800 px-3 text-[10px] font-bold text-white transition hover:bg-slate-700"
            >
              <Copy className="h-3.5 w-3.5" />
              <span>{t(`${KEY}.copy`)}</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleShare}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-nexoraElectric to-nexoraViolet py-3 text-sm font-extrabold text-white transition hover:opacity-90"
          >
            <Share2 className="h-4 w-4" />
            {t('staff_dashboard.qr.share_referral')}
          </button>
        </>
      ) : (
        <div className="mt-4 flex flex-col items-center rounded-2xl border border-dashed border-nexoraBorder bg-nexoraCanvas/70 px-5 py-8 text-center">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-nexoraBrand shadow-sm">
            <Gift className="h-7 w-7" />
          </div>
          <p className="max-w-[280px] text-xs leading-relaxed text-nexoraMuted">
            {t('staff_dashboard.qr.affiliate_unavailable')}
          </p>
        </div>
      )}
    </section>
  )
}
