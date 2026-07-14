// StaffMyQR — personal share QR (ref + staff) + per-business tipping QR tab.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Share2, Copy, QrCode, X, Loader2, Store, Clock, Link2, Download, CreditCard, Gift, BadgeCheck, Eye, Star, Heart, Bell } from 'lucide-react'
import jsQR from 'jsqr'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from '../../../contexts/LanguageContext'
import { useStaffAccount } from '../../../contexts/StaffAccountContext'
import { useProfileSettings } from '../../../data/hooks/useProfileSettings'
import { buildStaffShareUrl, getProfileReferralCode, splitStaffShareUrlDisplay, splitUrlQueryParamDisplay, splitUrlPathTailDisplay } from '../../../utils/affiliateReferral'
import { shareQrImage, downloadQrCode, QR_IMAGE_SIZES } from '../../../utils/qrUtils'
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
import QrImage from '../../ui/QrImage'

type LooseObject = Record<string, any>

const panel = 'rounded-2xl border border-nexoraBorder bg-nexoraSurface p-4 shadow-sm'
const compactPanel = 'rounded-lg border border-[#EEE9FF] bg-white p-2.5 shadow-[0_8px_18px_rgba(70,72,212,0.08)]'

type QrTab = 'personal' | 'tipping' | 'payment'

function initialsFor(value: string) {
  const parts = String(value || '').trim().split(/\s+/).filter(Boolean)
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  return String(value || '?').slice(0, 2).toUpperCase()
}

function paymentMethodLabel(method: LooseObject) {
  return method.name || method.type || method.uiKey || 'Payment method'
}

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
  const { t } = useTranslation()
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
  const handledFirstTipPreviewRef = useRef(false)

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
    () => (staffShareUrl ? buildQrImageUrl(staffShareUrl, QR_IMAGE_SIZES.panel) : ''),
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
    () => (staffPaymentPageUrl ? buildQrImageUrl(staffPaymentPageUrl, QR_IMAGE_SIZES.panel) : ''),
    [staffPaymentPageUrl],
  )

  const isPaymentTabLoading = isPaymentQrLoading || isPaymentMethodsLoading

  const activeTipQrs = useMemo(() => businessTipQrs.filter(isBusinessActive), [businessTipQrs])

  const orderedTabs = useMemo<QrTab[]>(
    () => ['tipping', 'personal', 'payment'],
    [],
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

  const tabDisplayLabel: Record<QrTab, string> = {
    tipping: t('staff_dashboard.qr.tab_receive_tips'),
    personal: t('staff_dashboard.qr.tab_invite_refer'),
    payment: t('staff_dashboard.qr.tab_accept_payments'),
  }
  const tabIcon: Record<QrTab, typeof QrCode> = {
    tipping: QrCode,
    personal: Gift,
    payment: CreditCard,
  }

  const selectedBusiness = useMemo(() => {
    if (!activeTipQrs.length) return null
    const match = activeTipQrs.find((biz) => biz.businessId === selectedBusinessId)
    return match || activeTipQrs[0]
  }, [activeTipQrs, selectedBusinessId])

  useEffect(() => {
    const shouldPreviewFirstTip = searchParams.get('preview') === 'firstTip'
    if (!shouldPreviewFirstTip) {
      handledFirstTipPreviewRef.current = false
      return
    }
    if (handledFirstTipPreviewRef.current) return

    const firstTipQr = activeTipQrs.find((biz) => Boolean(biz.tipUrl))
    if (!firstTipQr?.tipUrl) return

    handledFirstTipPreviewRef.current = true
    setSelectedBusinessId(firstTipQr.businessId)
    setZoomedQr({
      url: firstTipQr.tipUrl,
      title: firstTipQr.businessName,
      subtitle: firstTipQr.touchPointSlug,
      kind: 'tipping',
    })

    const nextParams = new URLSearchParams(searchParams)
    nextParams.delete('preview')
    setSearchParams(nextParams, { replace: true })
  }, [activeTipQrs, searchParams, setSearchParams])

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
      const qrImageUrl = buildQrImageUrl(biz.tipUrl, QR_IMAGE_SIZES.zoom, biz.qrImageUrl)
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
      const qrImageUrl = buildQrImageUrl(zoomedQr.url, QR_IMAGE_SIZES.zoom)
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

      <section className="space-y-2">
        <div className="flex items-center justify-between px-0.5">
          <h1 className="text-base font-semibold leading-tight text-nexoraText">{t('staff_dashboard.qr.my_qr_title')}</h1>
          <span className="rounded-full bg-nexoraSuccess/10 px-2.5 py-1 text-[10px] font-semibold text-nexoraSuccess">
            {t('staff_dashboard.home.ready')}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-1 rounded-full border border-[#EEE9FF] bg-white/95 p-1 shadow-[0_8px_18px_rgba(70,72,212,0.08)]">
          {orderedTabs.map((tab) => {
            const TabIcon = tabIcon[tab]
            const isActive = activeTab === tab
            return (
              <button
                key={tab}
                type="button"
                onClick={() => handleSelectTab(tab)}
                className={`inline-flex h-8 min-w-0 items-center justify-center gap-1.5 rounded-full px-2 text-[10px] font-semibold transition ${
                  isActive
                    ? 'bg-nexoraBrand text-white shadow-[0_6px_14px_rgba(70,72,212,0.25)]'
                    : 'bg-transparent text-nexoraBrandDark hover:bg-[#F4F2FF]'
                }`}
              >
                <TabIcon className="h-3.5 w-3.5 shrink-0" strokeWidth={2.2} />
                <span className="truncate">{tabDisplayLabel[tab]}</span>
              </button>
            )
          })}
        </div>
      </section>

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
          <section className={`${compactPanel} text-center`}>
            <div className="mb-2 flex items-center justify-between gap-2 text-left">
              <div>
                <h3 className="text-sm font-semibold text-nexoraText">{t('staff_dashboard.qr.staff_invite_link')}</h3>
              </div>
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-rose-50 text-rose-500">
                <Gift className="h-4 w-4" />
              </span>
            </div>
            {staffCode && staffShareUrl ? (
              <>
                <div className="mx-auto my-3 flex h-40 w-40 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#EEE9FF] bg-white p-3 shadow-sm select-none">
                  <QrImage src={personalQrImageSrc} alt={t('staff_dashboard.qr.scan_qr_alt')} className="h-full w-full" />
                </div>
                <div className="flex items-center justify-center gap-2 text-[12px] font-semibold text-nexoraText">
                  <span>
                    {t('staff_dashboard.staff_id')}: {staffCode}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyStaffId}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-[#EEE9FF] bg-white text-nexoraBrand transition hover:bg-nexoraCanvas"
                    aria-label={t('staff_dashboard.qr.copy_staff_id')}
                    title={t('staff_dashboard.qr.copy_staff_id')}
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="mx-auto mt-3 max-w-xs" title={staffShareUrlDisplay.fullDisplay}>
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
              <section className="rounded-2xl border border-[#DDD8FF] bg-white p-3 shadow-[0_10px_22px_rgba(70,72,212,0.10)]">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <div>
                    <h4 className="text-sm font-semibold text-nexoraText">
                      {t('staff_dashboard.qr.business_title')}
                    </h4>
                  </div>
                  <span className="rounded-full bg-[#F4F2FF] px-3 py-1.5 text-[10px] font-semibold text-nexoraBrandDark">
                    {t(
                      activeTipQrs.length === 1
                        ? 'staff_dashboard.qr.salons_count_one'
                        : 'staff_dashboard.qr.salons_count_other',
                      { count: activeTipQrs.length },
                    )}
                  </span>
                </div>

                <div className="space-y-2">
                  {activeTipQrs.map((biz) => (
                    <div
                      key={biz.businessId}
                      className="grid grid-cols-[64px_minmax(0,1fr)_72px] items-center gap-2 rounded-2xl border border-[#DDD8FF] bg-[linear-gradient(135deg,#FFFFFF_0%,#F8F7FF_100%)] p-2 shadow-[0_6px_14px_rgba(70,72,212,0.06)]"
                    >
                      <button
                        type="button"
                        onClick={() =>
                          biz.tipUrl &&
                          setZoomedQr({
                            url: biz.tipUrl,
                            title: biz.businessName,
                            subtitle: biz.touchPointSlug,
                          })
                        }
                        className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl border border-[#EEE9FF] bg-white p-1.5 shadow-sm"
                      >
                        {biz.tipUrl ? (
                          <QrImage
                            src={buildQrImageUrl(biz.tipUrl, QR_IMAGE_SIZES.thumb, biz.qrImageUrl)}
                            alt={`${biz.businessName} QR`}
                            className="h-full w-full"
                          />
                        ) : (
                          <QrCode className="h-8 w-8 text-nexoraBrandDark" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedBusinessId(biz.businessId)}
                        className="min-w-0 text-left"
                      >
                        <div className="truncate text-[12px] font-semibold leading-4 text-nexoraText">
                          {biz.businessName}
                        </div>
                        <div className="truncate text-[10px] font-medium leading-3 text-nexoraMuted">
                          {t('staff_dashboard.qr.business_sub')}
                        </div>
                        {biz.tipUrl && (
                          <div className="mt-1 truncate font-mono text-[9px] font-semibold text-nexoraBrandDark">
                            {splitUrlQueryParamDisplay(biz.tipUrl, 'staffProfileId').fullDisplay}
                          </div>
                        )}
                      </button>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          disabled={!biz.tipUrl}
                          onClick={() =>
                            biz.tipUrl &&
                            setZoomedQr({
                              url: biz.tipUrl,
                              title: biz.businessName,
                              subtitle: biz.touchPointSlug,
                            })
                          }
                          className="grid h-8 w-8 place-items-center rounded-full border border-[#EEE9FF] bg-white text-nexoraBrandDark shadow-sm disabled:opacity-50"
                          aria-label={t('components.staff_dashboard.views.StaffMyQR.clickToEnlargeTipping')}
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          disabled={!biz.tipUrl}
                          onClick={() => handleShareTipQr(biz)}
                          className="grid h-8 w-8 place-items-center rounded-full bg-nexoraBrand text-white shadow-sm disabled:opacity-50"
                          aria-label={t('staff_dashboard.qr.share_tip')}
                        >
                          <Link2 className="h-4 w-4" />
                        </button>
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
            <section className={`${compactPanel} text-center`}>
              <div className="mb-2 flex items-center justify-between gap-2 text-left">
                <div>
                  <h3 className="text-sm font-semibold text-nexoraText">{t('staff_dashboard.qr.payment_title')}</h3>
                </div>
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-indigo-50 text-indigo-600">
                  <CreditCard className="h-4 w-4" />
                </span>
              </div>

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
                className="group relative mx-auto my-3 flex h-40 w-40 items-center justify-center overflow-hidden rounded-xl border border-[#EEE9FF] bg-white p-3 shadow-sm transition hover:scale-[1.02]"
                title={t('staff_dashboard.qr.payment_preview')}
              >
                <QrImage
                  src={staffPaymentQrImageSrc}
                  alt={t('staff_dashboard.qr.payment_title')}
                  className="h-full w-full"
                />
                <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-nexoraBrand/75 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                  <span className="rounded-lg bg-white/20 px-3 py-1 text-[11px] font-black uppercase tracking-widest text-white backdrop-blur-sm">
                    PREVIEW
                  </span>
                </div>
              </button>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <div className="min-w-0 rounded-full border border-[#EEE9FF] bg-white px-2 text-left">
                  <div className="flex h-8 items-center gap-1.5">
                    <span className="min-w-0 flex-1 truncate font-mono text-[9px] text-nexoraMuted">
                      {splitUrlPathTailDisplay(staffPaymentPageUrl, 2).fullDisplay}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyPaymentUrl}
                      className="inline-flex h-6 shrink-0 items-center justify-center rounded-md bg-slate-900 px-2.5 text-[10px] font-semibold text-white"
                    >
                      {t('components.staff_dashboard.views.StaffMyQR.copy')}
                    </button>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleSharePaymentUrl}
                  className="flex h-8 w-full items-center justify-center gap-1.5 rounded-full bg-[#EEE9FF] px-3 text-[11px] font-semibold text-nexoraBrandDark transition hover:bg-[#E5DFFF]"
                >
                  <Share2 className="h-3.5 w-3.5" />
                  {t('staff_dashboard.qr.share_short')}
                </button>
              </div>
            </section>
          )}
          {readyStaffPaymentMethods.length > 0 && (
            <section className={compactPanel}>
              <div className="mb-2 flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-nexoraText">{t('staff_dashboard.qr.payout_settings')}</h3>
                <button
                  type="button"
                  onClick={handleSetupPayout}
                  className="inline-flex h-7 items-center justify-center rounded-md px-2 text-[11px] font-semibold text-nexoraBrandDark"
                >
                  {t('staff_dashboard.qr.settings')}
                </button>
              </div>
              <div className="space-y-1.5">
                {readyStaffPaymentMethods.slice(0, 5).map((method) => {
                  const label = paymentMethodLabel(method)
                  return (
                    <div key={method.id || label} className="grid grid-cols-[32px_minmax(0,1fr)_auto] items-center gap-2 rounded-lg border border-[#EEE9FF] bg-white px-2 py-2">
                      <span className="grid h-8 w-8 place-items-center rounded-lg bg-nexoraBrand/10 text-nexoraBrandDark">
                        <CreditCard className="h-4 w-4" />
                      </span>
                      <div className="min-w-0 text-left">
                        <p className="truncate text-[12px] font-semibold text-nexoraText">{label}</p>
                        <p className="truncate text-[10px] font-medium text-nexoraMuted">{method.accountInfo}</p>
                      </div>
                      <span className="inline-flex items-center gap-1 rounded-full bg-nexoraSuccess/10 px-2 py-1 text-[10px] font-semibold text-nexoraSuccess">
                        <BadgeCheck className="h-3 w-3" />
                        Active
                      </span>
                    </div>
                  )
                })}
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
              title={t('common.close')}
              aria-label={t('common.close')}
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
            className={`relative w-full animate-scaleUp cursor-default text-center shadow-2xl ${
              zoomedQr.kind === 'payment'
                ? 'max-w-md space-y-5 overflow-x-hidden overflow-y-auto rounded-3xl border border-slate-100 bg-white p-6 text-slate-800 max-h-[min(92dvh,calc(100dvh-var(--app-safe-area-top)-var(--app-safe-area-bottom)-1.5rem))]'
                : 'max-w-sm overflow-hidden overflow-y-auto rounded-[28px] border-4 border-white bg-[#050817] text-white max-h-[min(92dvh,calc(100dvh-var(--app-safe-area-top)-var(--app-safe-area-bottom)-1.5rem))]'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setZoomedQr(null)}
              className={`modal-close-btn absolute right-3 top-3 z-20 rounded-lg transition ${
                zoomedQr.kind === 'payment'
                  ? 'text-slate-400 hover:bg-slate-100 hover:text-slate-700'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
              title={t('common.close')}
              aria-label={t('common.close')}
            >
              <X className="h-4 w-4" />
            </button>

            {zoomedQr.kind !== 'payment' ? (
              <div className="relative overflow-hidden px-6 pb-6 pt-10">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_16%_28%,rgba(236,72,153,0.34)_0,transparent_28%),radial-gradient(circle_at_88%_42%,rgba(34,211,238,0.36)_0,transparent_30%),linear-gradient(180deg,#050505_0%,#101332_62%,#090A2A_100%)]" />
                <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:8px_8px]" />
                <div className="relative z-10">
                  <div className="mb-8 grid justify-items-center">
                    <img src="/assets/nexora-logo.png" alt="Nexora" className="h-8 w-8 object-contain" />
                    <p className="mt-2 text-[17px] font-semibold uppercase tracking-[0.28em] text-white/85">Nexora</p>
                    <p className="-mt-1 text-[10px] font-black uppercase tracking-[0.34em] text-fuchsia-400">Touch</p>
                  </div>

                  <h2 className="text-[34px] font-black uppercase leading-none tracking-[0.08em]">
                    <span className="bg-gradient-to-r from-pink-200 via-white to-cyan-200 bg-clip-text text-transparent">{t('staff_dashboard.qr.poster_scan_here')}</span>
                  </h2>
                  <p className="mt-2 text-[15px] font-black text-white">
                    {t('staff_dashboard.qr.poster_payment')} <span className="text-pink-400">•</span> {t('staff_dashboard.qr.poster_tip')} <span className="text-cyan-300">•</span> {t('staff_dashboard.qr.poster_review')}
                  </p>
                  <p className="mt-2 text-[9px] font-bold text-white/55">{t('staff_dashboard.qr.poster_tagline')}</p>

                  <div className="mx-auto mt-5 w-[224px] rounded-[24px] border border-cyan-300/80 bg-white p-3 shadow-[0_0_28px_rgba(34,211,238,0.55)]">
                    <QrImage src={buildQrImageUrl(zoomedQr.url, QR_IMAGE_SIZES.panel)} alt={t('staff_dashboard.qr.tipping_qr_alt')} className="h-full w-full rounded-xl" />
                  </div>

                  <div className="mt-5 grid grid-cols-[1fr_auto_1fr_auto_1fr] items-start gap-2 text-center">
                    <div className="grid justify-items-center gap-1">
                      <span className="grid h-5 w-5 place-items-center rounded-full border border-fuchsia-300 text-[10px] font-bold text-fuchsia-200">1</span>
                      <QrCode className="h-5 w-5 text-white" />
                      <span className="text-[8px] font-black leading-tight text-white">{t('staff_dashboard.qr.poster_step_scan')}</span>
                    </div>
                    <span className="pt-7 text-xl text-white/70">→</span>
                    <div className="grid justify-items-center gap-1">
                      <span className="grid h-5 w-5 place-items-center rounded-full border border-fuchsia-300 text-[10px] font-bold text-fuchsia-200">2</span>
                      <CreditCard className="h-5 w-5 text-white" />
                      <span className="text-[8px] font-black leading-tight text-white">{t('staff_dashboard.qr.poster_step_pay_tip')}</span>
                    </div>
                    <span className="pt-7 text-xl text-white/70">→</span>
                    <div className="grid justify-items-center gap-1">
                      <span className="grid h-5 w-5 place-items-center rounded-full border border-cyan-300 text-[10px] font-bold text-cyan-200">3</span>
                      <Star className="h-5 w-5 text-white" />
                      <span className="text-[8px] font-black leading-tight text-white">{t('staff_dashboard.qr.poster_step_review')}</span>
                    </div>
                  </div>

                  <div className="mt-5 rounded-2xl border border-fuchsia-300/60 bg-white/5 p-3 text-left shadow-[0_0_18px_rgba(236,72,153,0.22)]">
                    <div className="flex items-center gap-3">
                      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-fuchsia-300/60 bg-white/10 text-fuchsia-300">
                        <Gift className="h-7 w-7" />
                      </span>
                      <div>
                        <p className="text-[16px] font-black uppercase leading-none tracking-wider text-pink-300">{t('staff_dashboard.qr.poster_rewards_title')}</p>
                        <p className="mt-1 text-[9px] font-bold text-white">{t('staff_dashboard.qr.poster_rewards_subtitle')}</p>
                        <p className="mt-1 text-[8px] font-semibold leading-tight text-white/70">{t('staff_dashboard.qr.poster_rewards_body')}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-[1fr_20px_1fr_20px_1fr_20px_1fr] items-start">
                    <div className="grid justify-items-center gap-1 text-center">
                      <CreditCard className="h-5 w-5 text-pink-300" />
                      <span className="text-[7px] font-black leading-tight text-white">{t('staff_dashboard.qr.poster_easy_payment_1')}<br />{t('staff_dashboard.qr.poster_easy_payment_2')}</span>
                    </div>
                    <div className="flex h-5 items-center justify-center pt-2">
                      <span className="h-0.5 w-3 rounded-full bg-pink-400/80" />
                      <span className="h-1.5 w-1.5 rounded-full bg-pink-400 shadow-[0_0_8px_rgba(244,114,182,0.9)]" />
                    </div>
                    <div className="grid justify-items-center gap-1 text-center">
                      <Heart className="h-5 w-5 text-pink-300" />
                      <span className="text-[7px] font-black leading-tight text-white">{t('staff_dashboard.qr.poster_easy_tipping_1')}<br />{t('staff_dashboard.qr.poster_easy_tipping_2')}</span>
                    </div>
                    <div className="flex h-5 items-center justify-center pt-2">
                      <span className="h-0.5 w-3 rounded-full bg-violet-400/80" />
                      <span className="h-1.5 w-1.5 rounded-full bg-violet-400 shadow-[0_0_8px_rgba(167,139,250,0.9)]" />
                    </div>
                    <div className="grid justify-items-center gap-1 text-center">
                      <Bell className="h-5 w-5 text-cyan-300" />
                      <span className="text-[7px] font-black leading-tight text-white">{t('staff_dashboard.qr.poster_review_reminder_1')}<br />{t('staff_dashboard.qr.poster_review_reminder_2')}</span>
                    </div>
                    <div className="flex h-5 items-center justify-center pt-2">
                      <span className="h-0.5 w-3 rounded-full bg-cyan-300/80" />
                      <span className="h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_8px_rgba(103,232,249,0.9)]" />
                    </div>
                    <div className="grid justify-items-center gap-1 text-center">
                      <Gift className="h-5 w-5 text-pink-300" />
                      <span className="text-[7px] font-black leading-tight text-white">{t('staff_dashboard.qr.poster_earn_rewards_1')}<br />{t('staff_dashboard.qr.poster_earn_rewards_2')}</span>
                    </div>
                  </div>

                  <p className="mt-7 text-[15px] font-black text-pink-300/75">{t('staff_dashboard.qr.poster_thank_you')}</p>
                  <p className="mt-1 text-[7px] font-black uppercase tracking-[0.3em] text-white/80">{t('staff_dashboard.qr.poster_powered_by')}</p>
                </div>
              </div>
            ) : (
              <>
                <div className="space-y-1 text-center">
                  <h3 className="text-sm font-black uppercase tracking-wider text-slate-800">
                    {t('staff_dashboard.qr.payment_title')}
                  </h3>
                </div>

                <div className="relative mx-auto flex h-56 w-56 items-center justify-center rounded-2xl border-2 border-slate-100 bg-white p-4 shadow-md">
                  <QrImage src={buildQrImageUrl(zoomedQr.url, QR_IMAGE_SIZES.panel)} alt={t('staff_dashboard.qr.payment_qr_alt')} className="h-full w-full" />
                </div>

                <div className="space-y-2 text-left">
                  <QrLinkPanel
                    label={t('staff_dashboard.qr.payment_link_label')}
                    url={zoomedQr.url}
                    onCopy={handleCopyPaymentUrl}
                    displayParts={splitUrlPathTailDisplay(zoomedQr.url, 2)}
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
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
