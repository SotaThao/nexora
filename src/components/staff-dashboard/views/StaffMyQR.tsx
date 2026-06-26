// StaffMyQR — referral QR tab + per-business tipping QR tab.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Share2, Copy, QrCode, X, Loader2, CheckCircle2, XCircle, Store, Clock, Link2, Download } from 'lucide-react'
import jsQR from 'jsqr'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from '../../../contexts/LanguageContext'
import { useStaffAccount } from '../../../contexts/StaffAccountContext'
import { useStaffBusinessTipQrs } from '../../../data/hooks/useStaffSelf'
import { useNotifications, useMarkNotificationRead } from '../../../data/hooks/useNotifications'
import { useNotification } from '../../../contexts/NotificationContext'
import { useJoinPublicInvite } from '../../../data/hooks/useStaffInvites'
import StaffLinkRequestCard, { getStaffLinkRequestId } from './StaffLinkRequestCard'
import { isApiError } from '../../../types/domain'
import type { StaffBusinessTipQr } from '../../../types/domain'
import { shareUrl } from '../../../utils/shareUrl'
import { buildQrImageUrl } from '../../../utils/staffTipUrl'
import { downloadQrCode } from '../../../utils/qrUtils'
import { getWebUrlOrigin } from '../../../utils/webUrlBase'
import { useQueries } from '@tanstack/react-query'
import { qk } from '../../../data/queryKeys'
import staffSelfRepository from '../../../data/repositories/staffSelf'
import { SkeletonLayout } from '../../ui/skeleton'

type LooseObject = Record<string, any>

const panel = 'rounded-2xl border border-nexoraBorder bg-nexoraSurface p-4 shadow-sm'

type QrTab = 'referral' | 'tipping'

type ZoomedQr = {
  url: string
  title: string
  subtitle?: string
}

type ScannerCameraState = 'loading' | 'ready' | 'permission_denied' | 'unavailable'

function extractReferralCodeFromQrText(value: string): string {
  const text = value.trim()
  if (!text) return ''

  try {
    const parsed = new URL(text)
    const queryRef =
      parsed.searchParams.get('ref') ||
      parsed.searchParams.get('referralCode') ||
      parsed.searchParams.get('code')
    if (queryRef?.trim()) return queryRef.trim()

    const segments = parsed.pathname.split('/').filter(Boolean)
    const last = segments[segments.length - 1] || ''
    if (/^[a-zA-Z0-9_-]{4,80}$/.test(last)) return last
  } catch {
    // Non-URL payloads can still be plain referral codes.
  }

  return /^[a-zA-Z0-9_-]{4,80}$/.test(text) ? text : ''
}

function extractUrlFromQrText(value: string): URL | null {
  const text = value.trim()
  if (!text) return null
  try {
    const parsed = new URL(text)
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null
    return parsed
  } catch {
    return null
  }
}

function getBusinessStatusLabel(biz: StaffBusinessTipQr): string {
  return biz.linkStatusLabel || biz.linkStatus || 'Active'
}

function getBusinessRoleLabel(biz: StaffBusinessTipQr): string {
  return biz.roleAtBusiness?.trim() || biz.roleLabel || 'Staff'
}

function isBusinessActive(biz: StaffBusinessTipQr): boolean {
  const label = getBusinessStatusLabel(biz).toLowerCase()
  return label === 'active' && Boolean(biz.tipUrl) && !biz.tipLinkIncomplete
}

function isTouchPointLinkIncomplete(biz: StaffBusinessTipQr): boolean {
  return Boolean(biz.tipLinkIncomplete)
}

function isBusinessPendingLink(biz: StaffBusinessTipQr): boolean {
  const label = getBusinessStatusLabel(biz).toLowerCase()
  return label.includes('pending link') || label === 'pending link'
}

function isBusinessPendingApproval(biz: StaffBusinessTipQr): boolean {
  const label = getBusinessStatusLabel(biz).toLowerCase()
  return label.includes('pending approval') || label === 'pending approval'
}

function isBusinessPendingUnlink(biz: StaffBusinessTipQr): boolean {
  const label = getBusinessStatusLabel(biz).toLowerCase()
  return label.includes('pending unlink') || label === 'pending unlink'
}

function QrPlaceholderBox() {
  return (
    <div className="mx-auto my-4 flex h-44 w-44 flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-nexoraBorder bg-nexoraCanvas/80 p-4">
      <QrCode className="h-14 w-14 text-nexoraBorder" strokeWidth={1.25} />
    </div>
  )
}

function QrEmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}: {
  icon: typeof Store
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
}) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-nexoraBorder bg-nexoraCanvas/70 px-5 py-8 text-center">
      <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-nexoraBrand shadow-sm">
        <Icon className="h-7 w-7" />
      </div>
      <h4 className="text-sm font-extrabold text-nexoraText">{title}</h4>
      <p className="mt-2 max-w-[280px] text-xs leading-relaxed text-nexoraMuted">{description}</p>
      {actionLabel && onAction ? (
        <button
          type="button"
          onClick={onAction}
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-nexoraBrand px-5 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-nexoraBrandDark"
        >
          <QrCode className="h-4 w-4" />
          {actionLabel}
        </button>
      ) : null}
    </div>
  )
}

function getInactiveTipQrCopy(
  biz: StaffBusinessTipQr,
  t: (key: string, params?: Record<string, string | number>) => string,
): { title: string; description: string; showScanCta: boolean; icon: typeof Store } {
  if (isTouchPointLinkIncomplete(biz)) {
    return {
      icon: Link2,
      title: t('staff_dashboard.qr.touchpoint_missing_title'),
      description: t('staff_dashboard.qr.touchpoint_missing_body', { business: biz.businessName }),
      showScanCta: false,
    }
  }
  if (isBusinessPendingApproval(biz)) {
    return {
      icon: Clock,
      title: t('staff_dashboard.qr.pending_approval_title'),
      description: t('staff_dashboard.qr.pending_approval_body', { business: biz.businessName }),
      showScanCta: false,
    }
  }
  if (isBusinessPendingUnlink(biz)) {
    return {
      icon: Clock,
      title: t('staff_dashboard.qr.pending_unlink_title'),
      description: t('staff_dashboard.qr.pending_unlink_body', { business: biz.businessName }),
      showScanCta: false,
    }
  }
  if (isBusinessPendingLink(biz)) {
    return {
      icon: Link2,
      title: t('staff_dashboard.qr.not_linked_title'),
      description: t('staff_dashboard.qr.not_linked_body'),
      showScanCta: true,
    }
  }
  return {
    icon: Store,
    title: t('staff_dashboard.qr.qr_unavailable_title'),
    description: t('staff_dashboard.qr.qr_unavailable_body', { business: biz.businessName }),
    showScanCta: true,
  }
}

export default function StaffMyQR() {
  const navigate = useNavigate()
  const { t, currentLanguage } = useTranslation()
  const { staffMember, account } = useStaffAccount()
  const { businessTipQrs, isLoading: isTipQrLoading } = useStaffBusinessTipQrs()
  const { showToast, showConfirm } = useNotification()
  const joinPublicInviteMutation = useJoinPublicInvite()
  const { data: notifications = [] } = useNotifications()
  const markNotificationRead = useMarkNotificationRead()
  const linkRequests = useMemo(
    () => notifications.filter((n) => n.type === 'StaffLinkRequest'),
    [notifications],
  )

  const linkRequestQueries = useQueries({
    queries: linkRequests.map((n) => {
      const linkId = getStaffLinkRequestId(n)
      return {
        queryKey: qk.staffLinkRequest(linkId),
        queryFn: () => staffSelfRepository.getLinkRequest(linkId || ''),
        enabled: !!linkId,
      }
    }),
  })

  const pendingLinkRequests = useMemo(() => {
    return linkRequests.filter((n, i) => {
      const query = linkRequestQueries[i]
      return query.isSuccess && query.data?.status === 'WaitingStaffAcceptance'
    })
  }, [linkRequests, linkRequestQueries])

  const [activeTab, setActiveTab] = useState<QrTab>('referral')
  const [showScanner, setShowScanner] = useState(false)
  const [scannerCameraState, setScannerCameraState] = useState<ScannerCameraState>('loading')
  const [isSubmittingScan, setIsSubmittingScan] = useState(false)
  const [zoomedQr, setZoomedQr] = useState<ZoomedQr | null>(null)
  const [isSavingQr, setIsSavingQr] = useState(false)
  const [selectedBusinessId, setSelectedBusinessId] = useState<string | null>(null)
  const scannerVideoRef = useRef<HTMLVideoElement | null>(null)
  const scannerStreamRef = useRef<MediaStream | null>(null)
  const scannerCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const scannerFrameRef = useRef<number | null>(null)
  const lastScanAtRef = useRef(0)

  const staffCode = (account.staffCode || staffMember.id || '').trim()
  const staffLink = useMemo(
    () =>
      staffCode
        ? `${getWebUrlOrigin()}/?flow=staff-invite&staff=${encodeURIComponent(staffCode)}`
        : '',
    [staffCode],
  )
  const referralQrImageSrc = useMemo(
    () => (staffCode ? buildQrImageUrl(staffCode, 200) : ''),
    [staffCode],
  )

  const activeTipQrs = useMemo(() => businessTipQrs.filter(isBusinessActive), [businessTipQrs])

  const selectedBusiness = useMemo(() => {
    if (!activeTipQrs.length) return null
    const match = activeTipQrs.find((biz) => biz.businessId === selectedBusinessId)
    return match || activeTipQrs[0]
  }, [activeTipQrs, selectedBusinessId])

  const copyText = useCallback(
    async (text: string, successKey: string, failKey: string) => {
      if (!text) {
        showToast(t('components.staff_dashboard.views.StaffMyQR.staffCodeUnavailable'), 'error')
        return
      }
      try {
        await navigator.clipboard.writeText(text)
        showToast(t(successKey), 'success')
      } catch {
        showToast(t(failKey), 'error')
      }
    },
    [showToast, t],
  )

  const handleCopyReferral = useCallback(() => {
    copyText(
      staffCode,
      'components.staff_dashboard.views.StaffMyQR.linkCopiedToClipboard',
      'components.staff_dashboard.views.StaffMyQR.copyFailed',
    )
  }, [copyText, staffCode])

  const handleShareReferral = useCallback(async () => {
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
        showToast(t('components.staff_dashboard.views.StaffMyQR.linkCopiedToClipboard'), 'success')
      }
    } catch {
      showToast(t('components.staff_dashboard.views.StaffMyQR.shareFailed'), 'error')
    }
  }, [staffCode, staffLink, showToast, t])

  const handleCopyTipUrl = useCallback(
    (tipUrl: string) => {
      copyText(
        tipUrl,
        'components.staff_dashboard.views.StaffMyQR.tippingLinkCopied',
        'components.staff_dashboard.views.StaffMyQR.copyFailed',
      )
    },
    [copyText],
  )

  const handleShareTipUrl = useCallback(
    async (biz: StaffBusinessTipQr) => {
      if (!biz.tipUrl) return
      try {
        const result = await shareUrl({
          url: biz.tipUrl,
          title: t('staff_dashboard.qr.business_title'),
          text: biz.businessName,
        })
        if (result === 'copied') {
          showToast(t('components.staff_dashboard.views.StaffMyQR.tippingLinkCopied'), 'success')
        }
      } catch {
        showToast(t('components.staff_dashboard.views.StaffMyQR.shareFailed'), 'error')
      }
    },
    [showToast, t],
  )

  const handleDownloadZoomedQr = useCallback(async () => {
    if (!zoomedQr?.url || isSavingQr) return

    setIsSavingQr(true)
    try {
      const qrImageUrl = buildQrImageUrl(zoomedQr.url, 600)
      const safeName = (zoomedQr.title || 'tipping-qr').replace(/\s+/g, '-').toLowerCase()
      const result = await downloadQrCode(qrImageUrl, `${safeName}-qr.png`)
      if (result !== 'cancelled') {
        showToast(t('components.SettingsView.qrCodeDownloaded'), 'success')
      }
    } catch {
      showToast(t('components.staff_dashboard.views.StaffMyQR.shareFailed'), 'error')
    } finally {
      setIsSavingQr(false)
    }
  }, [isSavingQr, showToast, t, zoomedQr])

  const handleOpenScan = () => {
    setShowScanner(true)
    setScannerCameraState('loading')
    setIsSubmittingScan(false)
  }

  const handleUnlink = async (biz: StaffBusinessTipQr) => {
    const confirmed = await showConfirm(
      t('components.staff_dashboard.views.StaffMyQR.unlinkConfirm', { business: biz.businessName }),
      t('components.staff_dashboard.views.StaffMyQR.unlinkConfirmTitle'),
    )
    if (!confirmed) return
    // No staff-side unlink endpoint exists yet (only merchant-side DELETE /merchant/staff/{staffLinkId}).
    // TODO(BE): call the staff unlink / request-unlink endpoint once it is available, then invalidate
    // qk.staffBusinesses(). For now we surface a clear message instead of guessing the contract.
    showToast(t('components.staff_dashboard.views.StaffMyQR.unlinkUnavailable'), 'info')
  }

  const handleUrlOrTextSubmit = async () => {
    if (joinPublicInviteMutation.isPending) return

    setIsSubmittingScan(true)
    try {
      await joinPublicInviteMutation.mutateAsync(undefined)
      showToast(t('components.staff_dashboard.views.StaffMyQR.joinRequestSent'), 'success')
      setTimeout(() => {
        setShowScanner(false)
        setScannerCameraState('loading')
        setIsSubmittingScan(false)
      }, 900)
    } catch (err: unknown) {
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
      setIsSubmittingScan(false)
    }
  }

  useEffect(() => {
    if (!showScanner) {
      scannerStreamRef.current?.getTracks().forEach((track) => track.stop())
      scannerStreamRef.current = null
      if (scannerFrameRef.current != null) {
        window.cancelAnimationFrame(scannerFrameRef.current)
        scannerFrameRef.current = null
      }
      if (scannerVideoRef.current) {
        scannerVideoRef.current.srcObject = null
      }
      return
    }

    let cancelled = false

    const startScannerCamera = async () => {
      setScannerCameraState('loading')

      if (!navigator.mediaDevices?.getUserMedia) {
        setScannerCameraState('unavailable')
        return
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
          audio: false,
        })

        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop())
          return
        }

        scannerStreamRef.current = stream
        if (scannerVideoRef.current) {
          scannerVideoRef.current.srcObject = stream
          await scannerVideoRef.current.play()
        }
        setScannerCameraState('ready')
      } catch (err: unknown) {
        if (cancelled) return
        const name = err instanceof DOMException ? err.name : ''
        if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
          setScannerCameraState('permission_denied')
        } else {
          setScannerCameraState('unavailable')
        }
      }
    }

    startScannerCamera()

    return () => {
      cancelled = true
      scannerStreamRef.current?.getTracks().forEach((track) => track.stop())
      scannerStreamRef.current = null
      if (scannerFrameRef.current != null) {
        window.cancelAnimationFrame(scannerFrameRef.current)
        scannerFrameRef.current = null
      }
      if (scannerVideoRef.current) {
        scannerVideoRef.current.srcObject = null
      }
    }
  }, [showScanner])

  useEffect(() => {
    if (!showScanner || scannerCameraState !== 'ready' || isSubmittingScan) return
    const video = scannerVideoRef.current
    if (!video) return

    if (!scannerCanvasRef.current) {
      scannerCanvasRef.current = document.createElement('canvas')
    }
    const canvas = scannerCanvasRef.current
    const context = canvas.getContext('2d', { willReadFrequently: true })
    if (!context) return

    let cancelled = false

    const submitReferralCode = async (referralCode: string) => {
      setIsSubmittingScan(true)
      setScannerCameraState('loading')
      try {
        await joinPublicInviteMutation.mutateAsync(referralCode)
        showToast(t('components.staff_dashboard.views.StaffMyQR.joinRequestSent'), 'success')
        setTimeout(() => {
          setShowScanner(false)
          setScannerCameraState('loading')
          setIsSubmittingScan(false)
        }, 900)
      } catch (err: unknown) {
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
        setIsSubmittingScan(false)
        setScannerCameraState('ready')
      }
    }

    const handleScannedUrl = (parsedUrl: URL) => {
      setIsSubmittingScan(true)
      setShowScanner(false)
      setScannerCameraState('loading')

      if (parsedUrl.origin === window.location.origin) {
        navigate(`${parsedUrl.pathname}${parsedUrl.search}${parsedUrl.hash}`)
        return
      }
      window.open(parsedUrl.toString(), '_blank', 'noopener,noreferrer')
    }

    const loop = () => {
      if (cancelled || isSubmittingScan) return
      scannerFrameRef.current = window.requestAnimationFrame(loop)

      const now = Date.now()
      if (now - lastScanAtRef.current < 180) return
      lastScanAtRef.current = now

      if (!video.videoWidth || !video.videoHeight) return
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      context.drawImage(video, 0, 0, canvas.width, canvas.height)

      const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
      const detected = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'attemptBoth',
      })
      if (!detected?.data) return

      const referralCode = extractReferralCodeFromQrText(detected.data)
      if (referralCode) {
        if (scannerFrameRef.current != null) {
          window.cancelAnimationFrame(scannerFrameRef.current)
          scannerFrameRef.current = null
        }
        submitReferralCode(referralCode)
        return
      }

      const parsedUrl = extractUrlFromQrText(detected.data)
      if (parsedUrl) {
        if (scannerFrameRef.current != null) {
          window.cancelAnimationFrame(scannerFrameRef.current)
          scannerFrameRef.current = null
        }
        handleScannedUrl(parsedUrl)
      }
    }

    scannerFrameRef.current = window.requestAnimationFrame(loop)

    return () => {
      cancelled = true
      if (scannerFrameRef.current != null) {
        window.cancelAnimationFrame(scannerFrameRef.current)
        scannerFrameRef.current = null
      }
    }
  }, [isSubmittingScan, joinPublicInviteMutation, navigate, scannerCameraState, showScanner, showToast, t])

  const renderStatusBadge = (biz: StaffBusinessTipQr) => {
    const status = getBusinessStatusLabel(biz)
    const className =
      status === 'Active'
        ? 'bg-emerald-50 text-emerald-600'
        : status === 'Pending Approval'
          ? 'bg-amber-50 text-amber-600'
          : status === 'Pending Unlink'
            ? 'bg-rose-50 text-rose-600'
            : 'bg-slate-100 text-slate-600'

    const label =
      status === 'Active'
        ? t('components.staff_dashboard.views.StaffMyQR.active')
        : status === 'Pending Approval'
          ? t('components.staff_dashboard.views.StaffMyQR.pendingApproval')
          : status === 'Pending Unlink'
            ? t('components.staff_dashboard.views.StaffMyQR.pendingUnlink')
            : t('components.staff_dashboard.views.StaffMyQR.notConnected')

    return (
      <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-black ${className}`}>
        {label}
      </span>
    )
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

      <div className="flex gap-2 pb-1">
        <button
          type="button"
          onClick={() => setActiveTab('referral')}
          className={`flex-1 px-3 py-2 rounded-lg text-xs font-extrabold uppercase transition ${
            activeTab === 'referral'
              ? 'bg-nexoraBrand text-white shadow-sm'
              : 'bg-nexoraSurfaceMuted text-nexoraMuted hover:bg-slate-200'
          }`}
        >
          {t('staff_dashboard.qr.tab_referral')}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('tipping')}
          className={`flex-1 px-3 py-2 rounded-lg text-xs font-extrabold uppercase transition ${
            activeTab === 'tipping'
              ? 'bg-nexoraBrand text-white shadow-sm'
              : 'bg-nexoraSurfaceMuted text-nexoraMuted hover:bg-slate-200'
          }`}
        >
          {t('staff_dashboard.qr.tab_tipping')}
        </button>
      </div>

      {activeTab === 'referral' && (
        <div className="space-y-4">
          {pendingLinkRequests.length > 0 && (
            <section className={panel}>
              <h3 className="mb-3 text-base font-extrabold text-nexoraText">
                {t('staff_dashboard.qr.link_requests_title')}
              </h3>
              <div className="space-y-2">
                {pendingLinkRequests.map((n) => (
                  <StaffLinkRequestCard
                    key={n.id}
                    notification={n}
                    onResolved={(id) => markNotificationRead.mutate(id)}
                  />
                ))}
              </div>
            </section>
          )}
          <section className={`${panel} text-center`}>
            <h3 className="text-base font-extrabold text-nexoraText">
            {t('staff_dashboard.qr.personal_title')}
          </h3>
          <p className="mt-1 text-xs text-nexoraMuted">{t('staff_dashboard.qr.personal_sub')}</p>
          {staffCode ? (
            <>
              <div className="mx-auto my-4 flex h-44 w-44 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-nexoraBorder/60 bg-white p-3.5 shadow-sm select-none">
                <img src={referralQrImageSrc} alt="Scan QR" className="h-full w-full object-contain" />
              </div>
              <div className="flex items-center justify-center gap-2 text-sm font-bold text-nexoraText">
                <span>
                  {t('staff_dashboard.staff_id')}: {staffCode}
                </span>
                <button
                  type="button"
                  onClick={handleCopyReferral}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-nexoraBorder bg-nexoraSurface text-nexoraBrand transition hover:bg-nexoraCanvas"
                  aria-label={t('staff_dashboard.qr.copy_link')}
                  title={t('staff_dashboard.qr.copy_link')}
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="mt-3 space-y-2">
                <button
                  type="button"
                  onClick={handleShareReferral}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-nexoraElectric to-nexoraViolet py-3 text-sm font-extrabold text-white transition hover:opacity-90"
                >
                  <Share2 className="h-4 w-4" />
                  {t('staff_dashboard.qr.share')}
                </button>
              </div>
            </>
          ) : (
            <div className="mt-4">
              <QrEmptyState
                icon={QrCode}
                title={t('staff_dashboard.qr.referral_unavailable_title')}
                description={t('staff_dashboard.qr.referral_unavailable_body')}
              />
            </div>
          )}
        </section>
        </div>
      )}

      {activeTab === 'tipping' && (
        <>
          {isTipQrLoading ? (
            <SkeletonLayout
              blocks={[
                { type: 'panel', rows: 1, titleWidth: '45%' },
                { type: 'panel', rows: 4, titleWidth: '70%' },
              ]}
            />
          ) : businessTipQrs.length === 0 ? (
            <section className={panel}>
              <QrEmptyState
                icon={Store}
                title={t('staff_dashboard.qr.no_linked_businesses_title')}
                description={t('staff_dashboard.qr.no_linked_businesses_body')}
                actionLabel={t('components.staff_dashboard.views.StaffMyQR.scanSalonQr')}
                onAction={handleOpenScan}
              />
            </section>
          ) : (
            <>
              <section className={panel}>
                <div className="mb-3 flex items-center justify-between gap-2">
                  <div>
                    <h3 className="text-base font-extrabold text-nexoraText">
                      {t('staff_dashboard.qr.business_title')}
                    </h3>
                    <p className="mt-0.5 text-xs text-nexoraMuted">
                      {t('staff_dashboard.qr.business_sub')}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {activeTipQrs.map((biz) => {
                    const isSelected = selectedBusiness?.businessId === biz.businessId
                    return (
                      <button
                        key={biz.businessId}
                        type="button"
                        onClick={() => setSelectedBusinessId(biz.businessId)}
                        className={`rounded-full border px-3 py-1.5 text-xs font-bold transition ${
                          isSelected
                            ? 'border-nexoraBrand bg-nexoraBrandSoft text-nexoraBrand'
                            : 'border-nexoraBorder bg-white text-nexoraMuted hover:text-nexoraText'
                        }`}
                      >
                        {biz.businessName}
                      </button>
                    )
                  })}
                </div>
              </section>

              {selectedBusiness && (
                <section className={`${panel} text-center`}>
                  <div className="mb-2 flex items-start justify-between gap-3">
                    <div className="min-w-0 text-left">
                      <h3 className="truncate text-base font-extrabold text-nexoraText">
                        {(selectedBusiness.displayName || staffMember.nickname) &&
                        selectedBusiness.businessName
                          ? `${selectedBusiness.displayName || staffMember.nickname} @ ${selectedBusiness.businessName}`
                          : selectedBusiness.businessName}
                      </h3>
                      <p className="mt-0.5 text-xs text-nexoraMuted">
                        {isBusinessActive(selectedBusiness)
                          ? t('components.staff_dashboard.views.StaffMyQR.personalTippingQrCode')
                          : t('staff_dashboard.qr.business_sub')}
                      </p>
                    </div>
                    {renderStatusBadge(selectedBusiness)}
                  </div>

                  {isBusinessActive(selectedBusiness) ? (
                    <>
                      <button
                        type="button"
                        onClick={() =>
                          setZoomedQr({
                            url: selectedBusiness.tipUrl,
                            title: selectedBusiness.businessName,
                            subtitle: selectedBusiness.touchPointSlug,
                          })
                        }
                        className="group relative mx-auto my-4 flex h-44 w-44 items-center justify-center overflow-hidden rounded-xl border border-nexoraBorder/60 bg-white p-3.5 shadow-sm transition hover:scale-[1.02]"
                        title={t('components.staff_dashboard.views.StaffMyQR.clickToEnlargeTipping')}
                      >
                        <img
                          src={buildQrImageUrl(
                            selectedBusiness.tipUrl,
                            200,
                            selectedBusiness.qrImageUrl,
                          )}
                          alt="Tipping QR"
                          className="h-full w-full object-contain"
                        />
                        <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-nexoraBrand/75 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                          <span className="rounded-lg bg-white/20 px-3 py-1 text-[11px] font-black uppercase tracking-widest text-white backdrop-blur-sm">
                            PREVIEW
                          </span>
                        </div>
                      </button>

                      <div className="flex items-center justify-between gap-2 overflow-hidden rounded-xl border border-nexoraBorder bg-slate-50 p-1.5 shadow-inner">
                        <span className="min-w-0 flex-1 truncate pl-2 font-mono text-[10px] text-slate-500">
                          {selectedBusiness.tipUrl.replace(/^https?:\/\//, '')}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopyTipUrl(selectedBusiness.tipUrl)}
                          className="flex h-7 shrink-0 items-center gap-1 rounded-lg bg-slate-800 px-3 text-[10px] font-bold text-white transition hover:bg-slate-700"
                        >
                          <Copy className="h-3.5 w-3.5" />
                          <span>{t('components.staff_dashboard.views.StaffMyQR.copy')}</span>
                        </button>
                      </div>

                      <div className="mt-3 space-y-2">
                        <button
                          type="button"
                          onClick={() => handleShareTipUrl(selectedBusiness)}
                          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-nexoraElectric to-nexoraViolet py-3 text-sm font-extrabold text-white transition hover:opacity-90"
                        >
                          <Share2 className="h-4 w-4" />
                          {t('staff_dashboard.qr.share_tip')}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCopyTipUrl(selectedBusiness.tipUrl)}
                          className="flex w-full items-center justify-center gap-2 rounded-xl border border-nexoraBorder bg-nexoraSurface py-3 text-sm font-bold text-nexoraBrand transition hover:bg-nexoraCanvas"
                        >
                          <Copy className="h-4 w-4" />
                          {t('staff_dashboard.qr.copy_tip_link')}
                        </button>
                      </div>
                    </>
                  ) : (
                    (() => {
                      const inactiveCopy = getInactiveTipQrCopy(selectedBusiness, t)
                      return (
                        <div className="mt-2">
                          <QrPlaceholderBox />
                          <QrEmptyState
                            icon={inactiveCopy.icon}
                            title={inactiveCopy.title}
                            description={inactiveCopy.description}
                            actionLabel={
                              inactiveCopy.showScanCta
                                ? t('components.staff_dashboard.views.StaffMyQR.scanSalonQr')
                                : undefined
                            }
                            onAction={inactiveCopy.showScanCta ? handleOpenScan : undefined}
                          />
                        </div>
                      )
                    })()
                  )}
                </section>
              )}

              <section className={panel}>
                <div className="mb-3 flex items-center justify-between gap-2">
                  <h4 className="text-base font-extrabold text-nexoraText">
                    {t('staff_dashboard.home.linked_businesses')}
                  </h4>
                </div>

                <div className="divide-y divide-nexoraBorder">
                  {activeTipQrs.map((biz) => (
                    <div
                      key={biz.businessId}
                      className="flex items-center justify-between gap-3 py-3 last:pb-0"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-nexoraBrandSoft text-nexoraBrand">
                          {biz.logoUrl ? (
                            <img src={biz.logoUrl} alt={biz.businessName} className="h-full w-full object-cover" />
                          ) : (
                            <span className="text-lg font-bold uppercase">{biz.businessName.substring(0, 2)}</span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedBusinessId(biz.businessId)}
                          className="min-w-0 text-left"
                        >
                          <div className="truncate text-sm font-bold text-nexoraText">
                            {biz.businessName}
                          </div>
                          <div className="truncate text-xs text-nexoraMuted">
                            {t('staff_dashboard.notifications.link_request_role', { role: getBusinessRoleLabel(biz) })}
                          </div>
                        </button>
                      </div>

                      <div className="flex shrink-0 items-center gap-2">
                        {renderStatusBadge(biz)}
                        {isBusinessActive(biz) && (
                          <button
                            type="button"
                            onClick={() => handleUnlink(biz)}
                            className="rounded-lg border border-nexoraDanger/20 bg-nexoraDanger/10 px-3 py-1.5 text-xs font-extrabold text-nexoraDanger transition hover:bg-nexoraDanger/15"
                          >
                            {t('components.staff_dashboard.views.StaffMyQR.unlink')}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>


              </section>
            </>
          )}
        </>
      )}

      {showScanner && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md animate-scaleUp space-y-5 overflow-hidden rounded-3xl border border-slate-100 bg-white p-6 text-center text-slate-800 shadow-2xl">
            <button
              type="button"
              onClick={() => {
                setShowScanner(false)
                setScannerCameraState('loading')
                setIsSubmittingScan(false)
              }}
              className="absolute right-4 top-4 rounded-full p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              title="Close Scanner"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="space-y-1 text-center">
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-800">
                {t('components.staff_dashboard.views.StaffMyQR.scanSalonQrCode')}
              </h3>
              <p className="text-center text-[10px] font-medium leading-normal text-slate-500">
                {t('components.staff_dashboard.views.StaffMyQR.scanTheSalonReferral')}
              </p>
            </div>

            <div className="relative mx-auto flex h-64 w-64 items-center justify-center overflow-hidden rounded-2xl border-2 border-slate-100 bg-slate-50 shadow-inner">
              <div className="absolute left-3 top-3 h-4 w-4 rounded-tl-sm border-l-2 border-t-2 border-amber-500" />
              <div className="absolute right-3 top-3 h-4 w-4 rounded-tr-sm border-r-2 border-t-2 border-amber-500" />
              <div className="absolute bottom-3 left-3 h-4 w-4 rounded-bl-sm border-b-2 border-l-2 border-amber-500" />
              <div className="absolute bottom-3 right-3 h-4 w-4 rounded-br-sm border-b-2 border-r-2 border-amber-500" />

              {(scannerCameraState === 'loading' || isSubmittingScan) && (
                <Loader2 className="h-16 w-16 animate-spin text-amber-500" />
              )}

              <video
                ref={scannerVideoRef}
                playsInline
                muted
                className={`h-full w-full object-cover ${scannerCameraState === 'ready' ? 'block' : 'hidden'}`}
              />

              {scannerCameraState !== 'ready' && scannerCameraState !== 'loading' && !isSubmittingScan ? (
                <QrCode className="h-16 w-16 animate-pulse text-slate-300 opacity-80" />
              ) : null}

              {scannerCameraState === 'ready' && (
                <div className="animate-scannerLaser absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-amber-500 to-transparent shadow-[0_0_8px_#f59e0b]" />
              )}
            </div>

            {scannerCameraState !== 'ready' && scannerCameraState !== 'loading' ? (
              <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-2 text-center text-[11px] font-semibold text-slate-500">
                {t('components.staff_dashboard.views.StaffMyQR.cameraScanNotAvailableYet')}
              </p>
            ) : null}
          </div>
        </div>
      )}

      {zoomedQr && (
        <div
          className="fixed inset-0 z-[70] flex cursor-zoom-out items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
          onClick={() => setZoomedQr(null)}
        >
          <div
            className="relative w-full max-w-sm animate-scaleUp cursor-default space-y-5 overflow-hidden rounded-3xl border border-slate-100 bg-white p-6 text-center text-slate-800 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setZoomedQr(null)}
              className="absolute right-4 top-4 rounded-full p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              title="Close"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="space-y-1 text-center">
              <span className="block text-[9px] font-black uppercase tracking-widest text-nexoraBrand">
                {t('components.staff_dashboard.views.StaffMyQR.personalTippingQr')}
              </span>
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-800">
                {zoomedQr.title}
              </h3>
              <p className="text-center text-[10px] font-medium leading-normal text-slate-500">
                {currentLanguage === 'vi'
                  ? `Khách hàng quét mã này để gửi tip trực tiếp cho ${staffMember.nickname || staffMember.fullName}`
                  : `Customers scan this QR to tip ${staffMember.nickname || staffMember.fullName} directly`}
              </p>
            </div>

            <div className="relative mx-auto flex h-56 w-56 items-center justify-center rounded-2xl border-2 border-slate-100 bg-white p-4 shadow-md">
              <img
                src={buildQrImageUrl(zoomedQr.url, 300)}
                alt="Personal Tipping QR"
                className="h-full w-full object-contain"
              />
            </div>

            <div className="space-y-2 text-left">
              <label className="text-[9px] font-black uppercase tracking-wider text-slate-400">
                {t('components.staff_dashboard.views.StaffMyQR.tippingLink')}
              </label>
              <div className="flex items-center justify-between gap-2 rounded-xl border border-slate-100 bg-slate-50 p-1.5">
                <span className="max-w-[210px] truncate pl-2 font-mono text-[10px] text-slate-500">
                  {zoomedQr.url}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopyTipUrl(zoomedQr.url)}
                  className="flex h-7 shrink-0 items-center gap-1 rounded-lg bg-slate-800 px-3 text-[10px] font-bold text-white transition hover:bg-slate-700"
                >
                  <Copy className="h-3.5 w-3.5" />
                  <span>{t('components.staff_dashboard.views.StaffMyQR.copy')}</span>
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={handleDownloadZoomedQr}
              disabled={isSavingQr}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-nexoraElectric to-nexoraViolet py-3 text-sm font-extrabold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSavingQr ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              {t('dashboard.master_gateway.btn_download')}
            </button>

            <div className="border-t border-slate-100 pt-2">
              <a
                href={zoomedQr.url}
                target="_blank"
                rel="opener"
                className="inline-flex w-full items-center justify-center gap-1 rounded-xl bg-nexoraBrandSoft py-2 text-[11px] font-black tracking-wide text-nexoraBrand transition hover:underline"
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
