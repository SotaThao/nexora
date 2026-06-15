// StaffMyQR — personal QR/link + per-business staff QR (placeholder QR visuals).
import { useCallback, useMemo, useState } from 'react'
import { Share2, Copy, QrCode, X, Loader2, CheckCircle2, XCircle } from 'lucide-react'
import { useTranslation } from '../../../contexts/LanguageContext'
import { useStaffAccount } from '../../../contexts/StaffAccountContext'
import { useStaffLinkedBusinesses } from '../hooks/useStaffLinkedBusinesses'
import { useNotification } from '../../../contexts/NotificationContext'
import { useJoinPublicInvite } from '../../../data/hooks/useStaffInvites'
import { isApiError } from '../../../types/domain'
import { shareUrl } from '../../../utils/shareUrl'

type LooseObject = Record<string, any>

const panel = 'rounded-2xl border border-nexoraBorder bg-nexoraSurface p-4 shadow-sm'

const slugify = (str = '') => str.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

export default function StaffMyQR() {
  const { t, currentLanguage } = useTranslation()
  const { staffMember, account } = useStaffAccount()
  const { linkedBusinesses } = useStaffLinkedBusinesses()
  const { showToast } = useNotification()
  const joinPublicInviteMutation = useJoinPublicInvite()

  const [showScanner, setShowScanner] = useState(false)
  const [scanStatus, setScanStatus] = useState('idle') // 'idle' | 'checking' | 'success' | 'error'
  const [customInviteLink, setCustomInviteLink] = useState('')
  const [zoomedQr, setZoomedQr] = useState<any | null>(null)

  const staffCode = (account.staffCode || staffMember.id || '').trim()
  const staffLink = useMemo(
    () =>
      staffCode
        ? `${window.location.origin}/?flow=staff-invite&staff=${encodeURIComponent(staffCode)}`
        : '',
    [staffCode],
  )
  const qrImageSrc = useMemo(
    () =>
      staffLink
        ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(staffLink)}`
        : '',
    [staffLink],
  )

  const handleCopy = useCallback(async () => {
    if (!staffLink) {
      showToast(t('components.staff_dashboard.views.StaffMyQR.staffCodeUnavailable'), 'error')
      return
    }
    try {
      await navigator.clipboard.writeText(staffLink)
      showToast(
        t('components.staff_dashboard.views.StaffMyQR.linkCopiedToClipboard'),
        'success',
      )
    } catch {
      showToast(t('components.staff_dashboard.views.StaffMyQR.copyFailed'), 'error')
    }
  }, [staffLink, showToast, t])

  const handleShare = useCallback(async () => {
    if (!staffLink) {
      showToast(t('components.staff_dashboard.views.StaffMyQR.staffCodeUnavailable'), 'error')
      return
    }

    try {
      const result = await shareUrl({
        url: staffLink,
        title: t('staff_dashboard.qr.share'),
        text: staffCode,
      })

      if (result === 'copied') {
        showToast(
          t('components.staff_dashboard.views.StaffMyQR.linkCopiedToClipboard'),
          'success',
        )
      }
    } catch {
      showToast(t('components.staff_dashboard.views.StaffMyQR.shareFailed'), 'error')
    }
  }, [staffCode, staffLink, showToast, t])

  const handleOpenScan = () => {
    setShowScanner(true)
    setScanStatus('idle')
    setCustomInviteLink('')
  }

  const handleUrlOrTextSubmit = async () => {
    if (joinPublicInviteMutation.isPending) return

    setScanStatus('checking')
    try {
      await joinPublicInviteMutation.mutateAsync()
      setScanStatus('success')
      showToast(
        t('components.staff_dashboard.views.StaffMyQR.joinRequestSent'),
        'success',
      )
      setTimeout(() => {
        setShowScanner(false)
        setScanStatus('idle')
        setCustomInviteLink('')
      }, 1000)
    } catch (err: unknown) {
      setScanStatus('error')
      const isAlreadyLinked =
        isApiError(err) &&
        (err.errorCode === 'STAFF_ALREADY_LINKED_TO_BUSINESS' ||
          err.errorCode === 'STAFF_INVITE_ALREADY_EXISTS')
      const isMissingReferralCode =
        isApiError(err) && err.errorCode === 'REFERRAL_CODE_REQUIRED'
      showToast(
        isMissingReferralCode
          ? t('components.staff_dashboard.views.StaffMyQR.profileReferralCodeMissing')
          : isAlreadyLinked
            ? t('components.staff_dashboard.views.StaffMyQR.alreadyLinkedOrRequested')
            : t('components.staff_dashboard.views.StaffMyQR.joinRequestFailed'),
        'error',
      )
    }
  }

  return (
    <div className="space-y-4">
      <style>{`
        @keyframes scannerLaser {
          0% { top: 0%; opacity: 0.8; }
          50% { top: 100%; opacity: 0.8; }
          100% { top: 0%; opacity: 0.8; }
        }
        .animate-scannerLaser {
          animation: scannerLaser 2.5s linear infinite;
        }
        @keyframes scaleUp {
          0% { transform: scale(0.85); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-scaleUp {
          animation: scaleUp 0.2s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
      `}</style>

      <section className={`${panel} text-center`}>
        <h3 className="text-base font-extrabold text-nexoraText">{t('staff_dashboard.qr.personal_title')}</h3>
        <p className="mt-1 text-xs text-nexoraMuted">{t('staff_dashboard.qr.personal_sub')}</p>
        <div className="mx-auto my-4 h-44 w-44 rounded-xl bg-white border border-nexoraBorder/60 p-3.5 flex items-center justify-center shadow-sm select-none overflow-hidden shrink-0">
          {qrImageSrc ? (
            <img
              src={qrImageSrc}
              alt="Scan QR"
              className="h-full w-full object-contain"
            />
          ) : (
            <QrCode className="h-16 w-16 text-nexoraSubtle" />
          )}
        </div>
        <div className="text-sm font-bold text-nexoraText">
          {t('staff_dashboard.staff_id')}: {staffCode || '—'}
        </div>
        <div className="mt-3 space-y-2">
          <button
            type="button"
            onClick={handleShare}
            disabled={!staffLink}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-nexoraElectric to-nexoraViolet py-3 text-sm font-extrabold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Share2 className="h-4 w-4" />
            {t('staff_dashboard.qr.share')}
          </button>
          <button
            type="button"
            onClick={handleCopy}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-nexoraBorder bg-nexoraSurface py-3 text-sm font-bold text-nexoraBrand transition hover:bg-nexoraCanvas"
          >
            <Copy className="h-4 w-4" />
            {t('staff_dashboard.qr.copy_link')}
          </button>
        </div>
      </section>

      <section className={panel}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-extrabold text-nexoraText">{t('staff_dashboard.home.linked_businesses')}</h3>
          <button
            type="button"
            onClick={handleOpenScan}
            className="flex items-center gap-1.5 rounded-lg border border-nexoraBorder bg-white hover:bg-slate-50 px-3 py-1.5 text-xs font-bold text-nexoraBrand transition shadow-sm"
          >
            <QrCode className="h-3.5 w-3.5" />
            <span>{t('components.staff_dashboard.views.StaffMyQR.scanSalonQr')}</span>
          </button>
        </div>

        <div className="divide-y divide-nexoraBorder">
          {linkedBusinesses.map((biz) => {
            const isNotConnected = biz.status === 'Pending Link'
            const businessSlug = slugify(biz.businessName || '')
            const tpSlug = slugify(staffMember.nickname || staffMember.fullName || '')
            const tipUrl = `${window.location.origin}/touch/${businessSlug}/staff-${tpSlug}`

            return (
              <div key={biz.businessStaffLinkId} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 border-b border-nexoraBorder last:border-0">
                <div className="flex items-center gap-3 min-w-0">
                  {biz.status === 'Active' && (
                    <div
                      onClick={() => setZoomedQr({ url: tipUrl, title: biz.businessName })}
                      className="h-12 w-12 bg-white border border-slate-200 p-1 rounded-xl cursor-zoom-in hover:scale-105 transition-transform flex items-center justify-center shrink-0 shadow-sm relative group"
                      title={t('components.staff_dashboard.views.StaffMyQR.clickToEnlargeTipping')}
                    >
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(tipUrl)}`}
                        alt="Tipping QR"
                        className="h-full w-full object-contain"
                      />
                      <div className="absolute inset-0 bg-black/40 rounded-xl opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-[8px] font-black">
                        ZOOM
                      </div>
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="truncate text-sm font-bold text-nexoraText">{biz.displayName} @ {biz.businessName}</div>
                    <div className="truncate text-xs text-nexoraMuted">
                      {biz.status === 'Active'
                        ? (t('components.staff_dashboard.views.StaffMyQR.personalTippingQrCode'))
                        : t('staff_dashboard.qr.business_sub')
                      }
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 font-sans justify-end">
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-black ${
                    biz.status === 'Active' ? 'bg-emerald-50 text-emerald-600' :
                    biz.status === 'Pending Approval' ? 'bg-amber-50 text-amber-600' :
                    biz.status === 'Pending Unlink' ? 'bg-rose-50 text-rose-600' :
                    'bg-slate-100 text-slate-600'
                  }`}>
                    {biz.status === 'Active' ? (t('components.staff_dashboard.views.StaffMyQR.active')) :
                     biz.status === 'Pending Approval' ? (t('components.staff_dashboard.views.StaffMyQR.pendingApproval')) :
                     biz.status === 'Pending Unlink' ? (t('components.staff_dashboard.views.StaffMyQR.pendingUnlink')) :
                     (t('components.staff_dashboard.views.StaffMyQR.notConnected'))}
                  </span>
                  {isNotConnected && (
                    <button
                      type="button"
                      onClick={handleOpenScan}
                      className="inline-flex items-center gap-1 rounded-lg bg-nexoraBrand px-3 py-1.5 text-xs font-bold text-white transition hover:bg-opacity-95 shadow-sm"
                    >
                      <QrCode className="h-3 w-3" />
                      <span>{t('components.staff_dashboard.views.StaffMyQR.link')}</span>
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
        <p className="mt-3 rounded-xl border border-dashed border-nexoraBorder bg-nexoraCanvas p-3 text-xs leading-relaxed text-nexoraMuted">
          {t('staff_dashboard.qr.note')}
        </p>
      </section>

      {/* Simulated QR Code Camera Scanner Modal Overlay */}
      {showScanner && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
          <div className="bg-white border border-slate-100 rounded-3xl max-w-sm w-full p-6 text-center space-y-5 relative overflow-hidden text-slate-800 shadow-2xl animate-scaleUp">
            {/* Close Button */}
            <button
              type="button"
              onClick={() => {
                setShowScanner(false)
                setScanStatus('idle')
              }}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-700 transition p-1.5 rounded-full hover:bg-slate-100"
              title="Close Scanner"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Header */}
            <div className="space-y-1 text-center">
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-800">
                {t('components.staff_dashboard.views.StaffMyQR.scanSalonQrCode')}
              </h3>
              <p className="text-[10px] text-slate-500 font-medium text-center leading-normal">
                {t('components.staff_dashboard.views.StaffMyQR.scanTheSalonReferral')}
              </p>
            </div>

            {/* Scanning viewport */}
            <div className="relative h-44 w-44 mx-auto rounded-2xl border-2 border-slate-100 bg-slate-50 overflow-hidden flex items-center justify-center shadow-inner">
              {/* Corner brackets */}
              <div className="absolute top-3 left-3 w-4 h-4 border-t-2 border-l-2 border-amber-500 rounded-tl-sm"></div>
              <div className="absolute top-3 right-3 w-4 h-4 border-t-2 border-r-2 border-amber-500 rounded-tr-sm"></div>
              <div className="absolute bottom-3 left-3 w-4 h-4 border-b-2 border-l-2 border-amber-500 rounded-bl-sm"></div>
              <div className="absolute bottom-3 right-3 w-4 h-4 border-b-2 border-r-2 border-amber-500 rounded-br-sm"></div>

              {/* QR icon background */}
              {scanStatus === 'checking' ? (
                <Loader2 className="h-16 w-16 text-amber-500 animate-spin" />
              ) : scanStatus === 'success' ? (
                <CheckCircle2 className="h-16 w-16 text-emerald-500 animate-scaleUp" />
              ) : scanStatus === 'error' ? (
                <XCircle className="h-16 w-16 text-rose-500" />
              ) : (
                <QrCode className="h-16 w-16 text-slate-300 opacity-80 animate-pulse" />
              )}

              {/* Laser line */}
              {scanStatus === 'idle' && (
                <div className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-amber-500 to-transparent shadow-[0_0_8px_#f59e0b] animate-scannerLaser"></div>
              )}
            </div>

            {/* Custom URL or text input */}
            <div className="space-y-2 text-left">
              <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">
                {t('components.staff_dashboard.views.StaffMyQR.orEnterInviteLink')}
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder={
                    t('components.staff_dashboard.views.StaffMyQR.pasteSalonInviteLink')
                  }
                  className="flex-grow h-9 px-3 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-amber-500 text-slate-700 bg-slate-50"
                  value={customInviteLink}
                  onChange={(e) => setCustomInviteLink(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => handleUrlOrTextSubmit()}
                  disabled={joinPublicInviteMutation.isPending}
                  className="h-9 px-3 bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-slate-700 transition disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {joinPublicInviteMutation.isPending
                    ? t('common.processing')
                    : t('components.staff_dashboard.views.StaffMyQR.send')}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Zoomed Tipping QR Modal */}
      {zoomedQr && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4 cursor-zoom-out"
          onClick={() => setZoomedQr(null)}
        >
          <div
            className="bg-white border border-slate-100 rounded-3xl max-w-sm w-full p-6 text-center space-y-5 relative overflow-hidden text-slate-800 shadow-2xl animate-scaleUp cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setZoomedQr(null)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-700 transition p-1.5 rounded-full hover:bg-slate-100"
              title="Close"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Header */}
            <div className="space-y-1 text-center">
              <span className="text-[9px] font-black text-nexoraBrand uppercase tracking-widest block">
                {t('components.staff_dashboard.views.StaffMyQR.personalTippingQr')}
              </span>
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-800">
                {zoomedQr.title}
              </h3>
              <p className="text-[10px] text-slate-500 font-medium text-center leading-normal">
                {currentLanguage === 'vi'
                  ? `Khách hàng quét mã này để gửi tip trực tiếp cho ${staffMember.nickname || staffMember.fullName}`
                  : `Customers scan this QR to tip ${staffMember.nickname || staffMember.fullName} directly`}
              </p>
            </div>

            {/* QR viewport */}
            <div className="relative h-56 w-56 mx-auto rounded-2xl border-2 border-slate-100 bg-white p-4 flex items-center justify-center shadow-md">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(zoomedQr.url)}`}
                alt="Personal Tipping QR"
                className="h-full w-full object-contain"
              />
            </div>

            {/* Link Copy */}
            <div className="space-y-2 text-left">
              <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">
                {t('components.staff_dashboard.views.StaffMyQR.tippingLink')}
              </label>
              <div className="flex gap-2 bg-slate-50 rounded-xl p-1.5 border border-slate-100 items-center justify-between">
                <span className="text-[10px] text-slate-500 font-mono truncate max-w-[210px] pl-2">
                  {zoomedQr.url}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    try {
                      navigator.clipboard?.writeText(zoomedQr.url)
                      showToast(
                        t('components.staff_dashboard.views.StaffMyQR.tippingLinkCopied'),
                        'success'
                      )
                    } catch (e) {}
                  }}
                  className="h-7 px-3 bg-slate-800 text-white rounded-lg text-[10px] font-bold hover:bg-slate-700 transition flex items-center gap-1 shrink-0"
                >
                  <Copy className="h-3.5 w-3.5" />
                  <span>{t('components.staff_dashboard.views.StaffMyQR.copy')}</span>
                </button>
              </div>
            </div>

            {/* Simulation button */}
            <div className="pt-2 border-t border-slate-100">
              <a
                href={zoomedQr.url}
                target="_blank"
                rel="opener"
                className="inline-flex w-full items-center justify-center gap-1 text-[11px] font-black text-nexoraBrand hover:underline tracking-wide bg-nexoraBrandSoft py-2 rounded-xl transition"
              >
                <span>{t('components.staff_dashboard.views.StaffMyQR.openTippingPageSimulate')}</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
