// StaffMyQR — personal share QR (ref + staff) + per-business tipping QR tab.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Share2, Copy, QrCode, X, Loader2, Store, Clock, Link2, Download, CreditCard } from 'lucide-react'
import jsQR from 'jsqr'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from '../../../contexts/LanguageContext'
import { useStaffAccount } from '../../../contexts/StaffAccountContext'
import { useProfileSettings } from '../../../data/hooks/useProfileSettings'
import { buildStaffShareUrl, getProfileReferralCode, splitStaffShareUrlDisplay, splitUrlQueryParamDisplay, splitUrlPathTailDisplay } from '../../../utils/affiliateReferral'
import { shareQrImage, downloadQrCode } from '../../../utils/qrUtils'
import { useStaffBusinessTipQrs } from '../../../data/hooks/useStaffSelf'
import { useNotifications, useMarkNotificationRead } from '../../../data/hooks/useNotifications'
import { useNotification } from '../../../contexts/NotificationContext'
import { useJoinPublicInvite } from '../../../data/hooks/useStaffInvites'
import StaffLinkRequestCard, { getStaffLinkRequestId } from './StaffLinkRequestCard'
import { isApiError } from '../../../types/domain'
import type { StaffBusinessTipQr } from '../../../types/domain'
import { shareUrl } from '../../../utils/shareUrl'
import { buildQrImageUrl, resolveStaffDirectPaymentPageUrl } from '../../../utils/staffTipUrl'
import { useStaffPaymentQr } from '../../../data/hooks/useStaffPayments'
import { useStaffPaymentMethods } from '../../../data/hooks/useStaffPaymentMethods'
import { useQueries } from '@tanstack/react-query'
import { qk } from '../../../data/queryKeys'
import staffSelfRepository from '../../../data/repositories/staffSelf'
import { SkeletonLayout } from '../../ui/skeleton'

type LooseObject = Record<string, any>

const panel = 'rounded-2xl border border-nexoraBorder bg-nexoraSurface p-4 shadow-sm'

type QrTab = 'personal' | 'tipping' | 'payment'

type ZoomedQr = {
  url: string
  title: string
  subtitle?: string
  kind?: 'tipping' | 'payment'
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

function ShareLinkPill({
  url,
  onCopy,
  displayParts,
  className = '',
}: {
  url: string
  onCopy: () => void | boolean | Promise<boolean>
  displayParts?: { leading: string; suffix: string; fullDisplay: string }
  className?: string
}) {
  const { t } = useTranslation()
  const fullDisplay = displayParts?.fullDisplay ?? url.replace(/^https?:\/\//, '')
  const copyText = t('components.staff_dashboard.views.StaffMyQR.copy')

  return (
    <div
      className={`flex items-center justify-between gap-2 overflow-hidden rounded-xl border border-nexoraBorder bg-slate-50 p-1.5 shadow-inner ${className}`}
      title={url}
    >
      <div className="flex min-w-0 flex-1 items-center overflow-hidden pl-2 text-left font-mono text-[10px] text-slate-500">
        {displayParts?.suffix ? (
          <>
            <span className="min-w-0 truncate">{displayParts.leading}</span>
            <span className="shrink-0">{displayParts.suffix}</span>
          </>
        ) : (
          <span className="min-w-0 truncate">{fullDisplay}</span>
        )}
      </div>
      <button
        type="button"
        onClick={() => void onCopy()}
        className="flex h-7 shrink-0 items-center rounded-lg bg-slate-800 px-3 text-[10px] font-bold text-white transition hover:bg-slate-700"
        aria-label={copyText}
        title={copyText}
      >
        {copyText}
      </button>
    </div>
  )
}

function QrLinkPanel({
  label,
  url,
  onCopy,
  displayParts,
}: {
  label: string
  url: string
  onCopy: () => boolean | Promise<boolean>
  displayParts?: { leading: string; suffix: string; fullDisplay: string }
}) {
  return (
    <div className="mt-3 text-left">
      <p className="mb-2 text-[10px] font-black uppercase tracking-wider text-nexoraMuted">{label}</p>
      <ShareLinkPill url={url} onCopy={onCopy} displayParts={displayParts} />
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
  const [searchParams, setSearchParams] = useSearchParams()
  const { t, currentLanguage } = useTranslation()
  const { staffMember, account } = useStaffAccount()
  const { data: profile } = useProfileSettings()
  const { businessTipQrs, isLoading: isTipQrLoading } = useStaffBusinessTipQrs()
  const { showToast } = useNotification()
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

  const [activeTab, setActiveTab] = useState<QrTab>('personal')
  const userSelectedTabRef = useRef(false)
  const {
    data: paymentQr,
    isLoading: isPaymentQrLoading,
    isError: isPaymentQrError,
    refetch: refetchPaymentQr,
  } = useStaffPaymentQr({ enabled: activeTab === 'payment' })
  const {
    data: staffPaymentMethods = [],
    isLoading: isPaymentMethodsLoading,
  } = useStaffPaymentMethods({ enabled: activeTab === 'payment' })
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

  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab === 'personal' || tab === 'tipping' || tab === 'payment') {
      userSelectedTabRef.current = true
      setActiveTab(tab)
    }
  }, [searchParams])

  const staffCode = (account.staffCode || staffMember.id || '').trim()
  const referralCode = useMemo(() => getProfileReferralCode(profile || {}), [profile])
  const staffShareUrl = useMemo(
    () => buildStaffShareUrl({ referralCode, staffCode }),
    [referralCode, staffCode],
  )
  const staffShareUrlDisplay = useMemo(
    () => splitStaffShareUrlDisplay(staffShareUrl),
    [staffShareUrl],
  )
  const personalQrImageSrc = useMemo(
    () => (staffShareUrl ? buildQrImageUrl(staffShareUrl, 200) : ''),
    [staffShareUrl],
  )

  const readyStaffPaymentMethods = useMemo(
    () =>
      staffPaymentMethods.filter(
        (method) => Boolean(method.isActive && method.isConfigured && method.accountInfo?.trim()),
      ),
    [staffPaymentMethods],
  )

  const staffPaymentPageUrl = useMemo(
    () =>
      resolveStaffDirectPaymentPageUrl({
        staffProfileId: paymentQr?.staffProfileId,
        paymentUrlFromApi: paymentQr?.paymentUrl,
      }),
    [paymentQr?.paymentUrl, paymentQr?.staffProfileId],
  )

  const staffPaymentQrImageSrc = useMemo(
    () => (staffPaymentPageUrl ? buildQrImageUrl(staffPaymentPageUrl, 200) : ''),
    [staffPaymentPageUrl],
  )

  const isPaymentTabLoading = isPaymentQrLoading || isPaymentMethodsLoading

  const activeTipQrs = useMemo(() => businessTipQrs.filter(isBusinessActive), [businessTipQrs])

  // Tab order: not linked → [Personal, Payment, Tips]; linked → [Tips, Payment, Personal].
  const orderedTabs = useMemo<QrTab[]>(
    () => (businessTipQrs.length > 0 ? ['tipping', 'payment', 'personal'] : ['personal', 'payment', 'tipping']),
    [businessTipQrs.length],
  )

  useEffect(() => {
    if (userSelectedTabRef.current) {
      if (!orderedTabs.includes(activeTab)) setActiveTab(orderedTabs[0])
      return
    }
    setActiveTab(orderedTabs[0])
  }, [orderedTabs, activeTab])

  const handleSelectTab = useCallback((tab: QrTab) => {
    userSelectedTabRef.current = true
    setActiveTab(tab)
    const nextParams = new URLSearchParams(searchParams)
    nextParams.set('tab', tab)
    setSearchParams(nextParams, { replace: true })
  }, [searchParams, setSearchParams])

  const tabLabelKey: Record<QrTab, string> = {
    personal: 'staff_dashboard.qr.tab_personal',
    tipping: 'staff_dashboard.qr.tab_tipping',
    payment: 'staff_dashboard.qr.tab_payment',
  }

  const selectedBusiness = useMemo(() => {
    if (!activeTipQrs.length) return null
    const match = activeTipQrs.find((biz) => biz.businessId === selectedBusinessId)
    return match || activeTipQrs[0]
  }, [activeTipQrs, selectedBusinessId])

  const copyText = useCallback(
    async (text: string, successKey: string, failKey: string): Promise<boolean> => {
      if (!text) {
        showToast(t('components.staff_dashboard.views.StaffMyQR.staffCodeUnavailable'), 'error')
        return false
      }
      try {
        await navigator.clipboard.writeText(text)
        showToast(t(successKey), 'success')
        return true
      } catch {
        showToast(t(failKey), 'error')
        return false
      }
    },
    [showToast, t],
  )

  const handleCopyStaffId = useCallback(() => {
    void copyText(
      staffCode,
      'components.staff_dashboard.views.StaffMyQR.staffIdCopied',
      'components.staff_dashboard.views.StaffMyQR.copyFailed',
    )
  }, [copyText, staffCode])

  const handleCopyStaffShareLink = useCallback(() => {
    void copyText(
      staffShareUrl,
      'components.staff_dashboard.views.StaffMyQR.staffShareLinkCopied',
      'components.staff_dashboard.views.StaffMyQR.copyFailed',
    )
  }, [copyText, staffShareUrl])

  const handleCopyTipUrl = useCallback(
    (tipUrl: string) =>
      copyText(
        tipUrl,
        'components.staff_dashboard.views.StaffMyQR.tippingLinkCopied',
        'components.staff_dashboard.views.StaffMyQR.copyFailed',
      ),
    [copyText],
  )

  const handleShareTipQr = useCallback(
    async (biz: StaffBusinessTipQr) => {
      if (!biz.tipUrl) return
      const qrImageUrl = buildQrImageUrl(biz.tipUrl, 512, biz.qrImageUrl)
      const safeName = (biz.businessName || 'salon').replace(/[^\w.-]+/g, '-').slice(0, 40)
      const ownerName =
        biz.displayName || staffMember.nickname || staffMember.fullName || ''

      try {
        const result = await shareQrImage(qrImageUrl, {
          filename: `tip-qr-${safeName || biz.businessId}.png`,
          title: t('staff_dashboard.qr.share_tip'),
          text: biz.businessName,
          ownerName,
          businessName: biz.businessName,
        })
        if (result === 'downloaded') {
          showToast(t('components.staff_dashboard.views.StaffMyQR.tipQrDownloaded'), 'success')
        }
      } catch {
        showToast(t('components.staff_dashboard.views.StaffMyQR.shareFailed'), 'error')
      }
    },
    [showToast, staffMember.fullName, staffMember.nickname, t],
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

  const handleCopyPaymentUrl = useCallback(
    () =>
      copyText(
        staffPaymentPageUrl,
        'staff_dashboard.qr.payment_link_copied',
        'components.staff_dashboard.views.StaffMyQR.copyFailed',
      ),
    [copyText, staffPaymentPageUrl],
  )

  const handleSharePaymentUrl = useCallback(async () => {
    if (!staffPaymentPageUrl) {
      showToast(t('staff_dashboard.qr.payment_unavailable_title'), 'error')
      return
    }

    try {
      const result = await shareUrl({
        url: staffPaymentPageUrl,
        title: t('staff_dashboard.qr.payment_title'),
        text: staffMember.nickname || account.defaultDisplayName || '',
      })
      if (result === 'copied') {
        showToast(t('staff_dashboard.qr.payment_link_copied'), 'success')
      }
    } catch {
      showToast(t('components.staff_dashboard.views.StaffMyQR.shareFailed'), 'error')
    }
  }, [account.defaultDisplayName, showToast, staffMember.nickname, staffPaymentPageUrl, t])

  const handleSetupPayout = useCallback(() => {
    navigate('/staff/pay')
  }, [navigate])

  const handleOpenScan = () => {
    setShowScanner(true)
    setScannerCameraState('loading')
    setIsSubmittingScan(false)
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
        {orderedTabs.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => handleSelectTab(tab)}
            className={`flex-1 px-2 py-2 rounded-lg text-[10px] sm:text-xs font-extrabold uppercase transition ${
              activeTab === tab
                ? 'bg-nexoraBrand text-white shadow-sm'
                : 'bg-nexoraSurfaceMuted text-nexoraMuted hover:bg-slate-200'
            }`}
          >
            {t(tabLabelKey[tab])}
          </button>
        ))}
      </div>

      {activeTab === 'personal' && (
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
            {staffCode && staffShareUrl ? (
              <>
                <div className="mx-auto my-4 flex h-44 w-44 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-nexoraBorder/60 bg-white p-3.5 shadow-sm select-none">
                  <img src={personalQrImageSrc} alt="Scan QR" className="h-full w-full object-contain" />
                </div>
                <div className="flex items-center justify-center gap-2 text-sm font-bold text-nexoraText">
                  <span>
                    {t('staff_dashboard.staff_id')}: {staffCode}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyStaffId}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-nexoraBorder bg-nexoraSurface text-nexoraBrand transition hover:bg-nexoraCanvas"
                    aria-label={t('staff_dashboard.qr.copy_staff_id')}
                    title={t('staff_dashboard.qr.copy_staff_id')}
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div
                  className="mx-auto mt-3 max-w-xs"
                  title={staffShareUrlDisplay.fullDisplay}
                >
                  <ShareLinkPill
                    url={staffShareUrl}
                    onCopy={handleCopyStaffShareLink}
                    displayParts={{
                      leading: staffShareUrlDisplay.leading,
                      suffix: staffShareUrlDisplay.staffSuffix,
                      fullDisplay: staffShareUrlDisplay.fullDisplay,
                    }}
                  />
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

                      <QrLinkPanel
                        label={t('staff_dashboard.qr.tip_link_label')}
                        url={selectedBusiness.tipUrl}
                        onCopy={() => handleCopyTipUrl(selectedBusiness.tipUrl)}
                        displayParts={splitUrlQueryParamDisplay(selectedBusiness.tipUrl, 'staffProfileId')}
                      />

                      <div className="mt-3">
                        <button
                          type="button"
                          onClick={() => handleShareTipQr(selectedBusiness)}
                          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-nexoraElectric to-nexoraViolet py-3 text-sm font-extrabold text-white transition hover:opacity-90"
                        >
                          <Share2 className="h-4 w-4" />
                          {t('staff_dashboard.qr.share_tip')}
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
                      </div>
                    </div>
                  ))}
                </div>


              </section>
            </>
          )}
        </>
      )}

      {activeTab === 'payment' && (
        <>
          {isPaymentTabLoading ? (
            <SkeletonLayout
              blocks={[
                { type: 'panel', rows: 1, titleWidth: '55%' },
                { type: 'panel', rows: 3, titleWidth: '40%' },
              ]}
            />
          ) : isPaymentQrError ? (
            <section className={panel}>
              <QrEmptyState
                icon={CreditCard}
                title={t('staff_dashboard.qr.payment_load_error_title')}
                description={t('staff_dashboard.qr.payment_load_error_body')}
                actionLabel={t('staff_dashboard.qr.payment_retry')}
                onAction={() => refetchPaymentQr()}
              />
            </section>
          ) : readyStaffPaymentMethods.length === 0 ? (
            <section className={panel}>
              <QrEmptyState
                icon={CreditCard}
                title={t('staff_dashboard.qr.payment_setup_title')}
                description={t('staff_dashboard.qr.payment_setup_body')}
                actionLabel={t('staff_dashboard.setup_payout_now')}
                onAction={handleSetupPayout}
              />
            </section>
          ) : !staffPaymentPageUrl ? (
            <section className={panel}>
              <QrEmptyState
                icon={CreditCard}
                title={t('staff_dashboard.qr.payment_unavailable_title')}
                description={t('staff_dashboard.qr.payment_unavailable_body')}
              />
            </section>
          ) : (
            <section className={`${panel} text-center`}>
              <p className="text-xs text-nexoraMuted">{t('staff_dashboard.qr.payment_sub')}</p>

              <button
                type="button"
                onClick={() =>
                  setZoomedQr({
                    url: staffPaymentPageUrl,
                    title: t('staff_dashboard.qr.payment_title'),
                    subtitle: staffMember.nickname || account.defaultDisplayName || '',
                    kind: 'payment',
                  })
                }
                className="group relative mx-auto my-4 flex h-44 w-44 items-center justify-center overflow-hidden rounded-xl border border-nexoraBorder/60 bg-white p-3.5 shadow-sm transition hover:scale-[1.02]"
                title={t('staff_dashboard.qr.payment_preview')}
              >
                <img
                  src={staffPaymentQrImageSrc}
                  alt={t('staff_dashboard.qr.payment_title')}
                  className="h-full w-full object-contain"
                />
                <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-nexoraBrand/75 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                  <span className="rounded-lg bg-white/20 px-3 py-1 text-[11px] font-black uppercase tracking-widest text-white backdrop-blur-sm">
                    PREVIEW
                  </span>
                </div>
              </button>

              <QrLinkPanel
                label={t('staff_dashboard.qr.payment_link_label')}
                url={staffPaymentPageUrl}
                onCopy={handleCopyPaymentUrl}
                displayParts={splitUrlPathTailDisplay(staffPaymentPageUrl, 2)}
              />

              <div className="mt-3">
                <button
                  type="button"
                  onClick={handleSharePaymentUrl}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-nexoraElectric to-nexoraViolet py-3 text-sm font-extrabold text-white transition hover:opacity-90"
                >
                  <Share2 className="h-4 w-4" />
                  {t('staff_dashboard.qr.share_payment')}
                </button>
              </div>
            </section>
          )}
        </>
      )}

      {showScanner && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/60 modal-overlay-safe backdrop-blur-sm">
          <div className="relative w-full max-w-md animate-scaleUp space-y-5 overflow-hidden rounded-3xl border border-slate-100 bg-white p-6 text-center text-slate-800 shadow-2xl">
            <button
              type="button"
              onClick={() => {
                setShowScanner(false)
                setScannerCameraState('loading')
                setIsSubmittingScan(false)
              }}
              className="modal-close-btn absolute right-2 top-2 rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              title="Close Scanner"
              aria-label="Close Scanner"
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
          className="fixed inset-0 z-[70] flex cursor-zoom-out items-center justify-center bg-slate-900/60 modal-overlay-safe backdrop-blur-sm"
          onClick={() => setZoomedQr(null)}
        >
          <div
            className="relative w-full max-w-sm animate-scaleUp cursor-default space-y-5 overflow-hidden rounded-3xl border border-slate-100 bg-white p-6 text-center text-slate-800 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setZoomedQr(null)}
              className="modal-close-btn absolute right-2 top-2 rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              title="Close"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="space-y-1 text-center">
              {zoomedQr.kind !== 'payment' ? (
                <span className="block text-[9px] font-black uppercase tracking-widest text-nexoraBrand">
                  {t('components.staff_dashboard.views.StaffMyQR.personalTippingQr')}
                </span>
              ) : null}
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-800">
                {zoomedQr.kind === 'payment'
                  ? t('staff_dashboard.qr.payment_title')
                  : zoomedQr.title}
              </h3>
              <p className="text-center text-[10px] font-medium leading-normal text-slate-500">
                {zoomedQr.kind === 'payment'
                  ? t('staff_dashboard.qr.payment_sub')
                  : currentLanguage === 'vi'
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
              <QrLinkPanel
                label={
                  zoomedQr.kind === 'payment'
                    ? t('staff_dashboard.qr.payment_link_label')
                    : t('components.staff_dashboard.views.StaffMyQR.tippingLink')
                }
                url={zoomedQr.url}
                onCopy={() =>
                  zoomedQr.kind === 'payment' ? handleCopyPaymentUrl() : handleCopyTipUrl(zoomedQr.url)
                }
                displayParts={
                  zoomedQr.kind === 'payment'
                    ? splitUrlPathTailDisplay(zoomedQr.url, 2)
                    : splitUrlQueryParamDisplay(zoomedQr.url, 'staffProfileId')
                }
              />
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
