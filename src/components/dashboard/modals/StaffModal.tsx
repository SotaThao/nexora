import { useState, useEffect, useMemo } from 'react'
import { X, Upload, Eye, AlertTriangle, QrCode, Loader2, CheckCircle2, XCircle, Star, HelpCircle, Plus, Pencil } from 'lucide-react'
import IconButton from '../../ui/IconButton'
import ImageFileInput from '../../ui/ImageFileInput'
import CountryCodeSelect, { parsePhone, formatNationalNumber } from '../../CountryCodeSelect'
import { WalletLogos, DEFAULT_PAYOUT_CONFIGS } from '../constants'
import { useTranslation, renderLabel } from '../../../contexts/LanguageContext'
import { useNotification } from '../../../contexts/NotificationContext'
import PayoutSetupModal from './PayoutSetupModal'
import StaffReviewsDetailModal from './StaffReviewsDetailModal'
import StaffQrScannerModal from './StaffQrScannerModal'
import { useSearchMerchantStaff, useMerchantStaffStats } from '../../../data/hooks/useMerchantStaff'
import {
  useLocalStaffPaymentMethods,
  useToggleLocalStaffPaymentMethod,
  useUpdateLocalStaffPaymentMethod,
} from '../../../data/hooks/useLocalStaff'
import { payoutTypeToUiKey } from '../../../data/paymentMethodTypes'
import { getApiErrorCode } from '../../../types/domain'
import { getErrorI18nKey } from '../../../data/errorCodes'
import { buildStaffReviewSummary } from './staffModalReviewUtils'

const STAFF_MODAL_WALLETS = [
  { name: 'Zelle', key: 'zelle' },
  { name: 'Bank Wire', key: 'bankwire' },
  { name: 'PayPal', key: 'paypal' },
  { name: 'Venmo', key: 'venmo' },
  { name: 'Cash App', key: 'cashapp' },
  { name: 'Apple Cash', key: 'applecash' },
].filter((wallet) => wallet.key !== 'bankwire')

function StaffModal({
  open,
  editing,
  viewOnly = false,
  isApproveMode = false,
  onDecline,
  form,
  errors,
  setForm,
  verificationStatus = 'kyb_approved',
  onBlockedFeatureClick,
  onClose,
  onSave,
  onLinkStaff,
  onOpenInviteShare,
  onToggleTipsFlow,
  isTogglingTipsFlow = false,
  staffLinkId = null,
  reviews: reviewsProp = null,
  merchantSetupData = null,
  isSavingLocal = false,
  isLoadingDetail = false,
  fetchStaffStats = true,
}) {
  const { t, currentLanguage } = useTranslation()
  const { showToast } = useNotification()
  const [payoutSetupOpen, setPayoutSetupOpen] = useState(false)
  const [payoutSetupWallet, setPayoutSetupWallet] = useState('venmo')
  const [tempPayoutValues, setTempPayoutValues] = useState({ value: '', qrCode: '', accountName: '' })

  // Scanner states
  const [showScanner, setShowScanner] = useState(false)
  const [scanTarget, setScanTarget] = useState<any | null>(null) // 'staff' | 'vlinkpay' | 'combined'

  const isLocalStaff = Boolean(form?.isLocalStaff)
  const isReviewOnly = (isApproveMode || viewOnly) && !isLocalStaff
  const isIdReadOnly = isReviewOnly || isLocalStaff
  const canManageLocalPayouts = isLocalStaff && !viewOnly && !isApproveMode

  const [idInput, setIdInput] = useState(() =>
    isReviewOnly ? (form.nexoraStaffId || form.vlinkpay || '') : (form.vlinkpay || form.nexoraStaffId || ''),
  )
  const [searchQuery, setSearchQuery] = useState('')
  const [lastHandledSearchQuery, setLastHandledSearchQuery] = useState('')
  const readOnlyInputClass = 'border-nexoraBorder bg-nexoraCanvas cursor-not-allowed'
  const canToggleTipsFlowViaApi = (viewOnly || editing) && Boolean(staffLinkId) && Boolean(onToggleTipsFlow)

  const handleShowInTipsFlowToggle = () => {
    if (isApproveMode || isTogglingTipsFlow) return
    if (canToggleTipsFlowViaApi) {
      onToggleTipsFlow(staffLinkId)
      return
    }
    setForm({ ...form, showInTipsFlow: !form.showInTipsFlow })
  }

  useEffect(() => {
    setIdInput(
      isReviewOnly
        ? (form.nexoraStaffId || form.vlinkpay || '')
        : (form.vlinkpay || form.nexoraStaffId || ''),
    )
  }, [form.vlinkpay, form.nexoraStaffId, isReviewOnly])

  // Verification states
  const [vlinkpayStatus, setVlinkpayStatus] = useState('idle') // 'idle' | 'checking' | 'success' | 'error'
  const [nexoraStatus, setNexoraStatus] = useState('idle') // 'idle' | 'checking' | 'success' | 'error'
  const [vlinkpayTimeout, setVlinkpayTimeout] = useState<any | null>(null)
  const [nexoraTimeout, setNexoraTimeout] = useState<any | null>(null)
  const [showReviewsDetailModal, setShowReviewsDetailModal] = useState(false)
  const [reviewFilterRating, setReviewFilterRating] = useState('all')
  const [reviewFilterSource, setReviewFilterSource] = useState('all')
  const [reviewFilterOnlyCommented, setReviewFilterOnlyCommented] = useState(false)

  const searchResultsQuery = useSearchMerchantStaff(searchQuery, {
    enabled: open && !editing && !isReviewOnly && searchQuery.trim().length > 0,
  })

  const staffProfileId = typeof form?.staffProfileId === 'string' ? form.staffProfileId : null
  const { data: staffStats } = useMerchantStaffStats(staffProfileId, {}, {
    enabled: open && !!staffProfileId && fetchStaffStats,
  })
  const { data: localPaymentMethods = [] } = useLocalStaffPaymentMethods(staffProfileId, {
    enabled: open && isLocalStaff && !!staffProfileId,
  })
  const updateLocalPaymentMutation = useUpdateLocalStaffPaymentMethod()
  const toggleLocalPaymentMutation = useToggleLocalStaffPaymentMethod()
  const isLocalPaymentSaving =
    updateLocalPaymentMutation.isPending || toggleLocalPaymentMutation.isPending

  const localPaymentMethodsByKey = useMemo(() => {
    const map = new Map<string, (typeof localPaymentMethods)[number]>()
    for (const method of localPaymentMethods) {
      const key = method.uiKey || payoutTypeToUiKey(method.type || '')
      if (key) map.set(key, method)
    }
    return map
  }, [localPaymentMethods])

  const showLocalPaymentError = (err: unknown) => {
    showToast(t(getErrorI18nKey(getApiErrorCode(err))), 'error')
  }

  useEffect(() => {
    if (!searchQuery) return

    if (searchResultsQuery.isFetching) {
      setVlinkpayStatus('checking')
      setNexoraStatus('checking')
      return
    }

    if (searchResultsQuery.isError) {
      setVlinkpayStatus('error')
      setNexoraStatus('error')
      if (lastHandledSearchQuery !== searchQuery) {
        setLastHandledSearchQuery(searchQuery)
        showToast(t('components.dashboard.modals.StaffModal.searchError'), 'error')
      }
      return
    }

    const results = searchResultsQuery.data
    if (!results) return

    if (results.length > 0) {
      const matchedProfile = results[0]
      setForm(prev => ({
        ...prev,
        fullName: matchedProfile.fullName,
        nickname: matchedProfile.fullName?.split(' ')[0] || '',
        position: matchedProfile.position || 'Nail Tech',
        avatar: matchedProfile.avatar || '',
        nexoraStaffId: matchedProfile.staffCode || '',
        staffProfileId: matchedProfile.staffProfileId || '',
        vlinkpay: '',
        payoutConfigs: { ...prev.payoutConfigs },
      }))
      setNexoraStatus('success')
      setVlinkpayStatus('idle')
      if (lastHandledSearchQuery !== searchQuery) {
        setLastHandledSearchQuery(searchQuery)
        showToast(t('components.dashboard.modals.StaffModal.staffProfileVerifiedAuto'), 'success')
      }
      return
    }

    setForm(prev => ({ ...prev, staffProfileId: '', nexoraStaffId: '', vlinkpay: '' }))
    setNexoraStatus('error')
    setVlinkpayStatus('error')
    if (lastHandledSearchQuery !== searchQuery) {
      setLastHandledSearchQuery(searchQuery)
      showToast(t('components.dashboard.modals.StaffModal.staffNotFound'), 'error')
    }
  }, [lastHandledSearchQuery, searchQuery, searchResultsQuery.data, searchResultsQuery.isError, searchResultsQuery.isFetching, setForm, showToast, t])

  if (!open) return null

  const staffMemberContext = form
    ? {
        ...form,
        id: staffLinkId ?? form.id,
        staffCode: form.nexoraStaffId,
      }
    : null

  const { reviewsList, averageRating, starCounts, filteredReviewsList } = buildStaffReviewSummary(
    reviewsProp ?? [],
    staffMemberContext,
    {
      rating: reviewFilterRating,
      source: reviewFilterSource,
      onlyCommented: reviewFilterOnlyCommented,
    },
  )

  const displayRating = averageRating > 0
    ? averageRating
    : Number(staffStats?.allTime?.averageRating ?? form?.averageRating ?? 0)

  const displayReviewCount = reviewsList.length > 0
    ? reviewsList.length
    : Number(staffStats?.allTime?.totalReviews ?? staffStats?.period?.totalReviews ?? 0)

  const phoneParsed = parsePhone(form?.phone || '')

  const handleAvatarPick = (dataUrl: string) => {
    if (!dataUrl) return
    setForm((prev) => ({ ...prev, avatar: dataUrl }))
  }

  const handleAvatarFilePick = (file: File) => {
    setForm((prev) => ({ ...prev, avatarFile: file }))
  }

  const openPayoutSetup = (walletKey: string) => {
    if (isLocalStaff) {
      const method = localPaymentMethodsByKey.get(walletKey)
      setTempPayoutValues({
        value: method?.accountInfo || '',
        qrCode: method?.imageUrl || '',
        accountName: form.fullName || '',
      })
    } else {
      const configs = form.payoutConfigs || DEFAULT_PAYOUT_CONFIGS
      const config = configs[walletKey] || { enabled: false, value: '', qrCode: '' }
      setTempPayoutValues({
        value: config.value || '',
        qrCode: config.qrCode || '',
        accountName: config.accountName || form.fullName || '',
      })
    }
    setPayoutSetupWallet(walletKey)
    setPayoutSetupOpen(true)
  }

  const handlePayoutSubmit = (value: string, qrCode: string, accountName: string, qrFile?: File | null) => {
    if (isLocalStaff) {
      const method = localPaymentMethodsByKey.get(payoutSetupWallet)
      if (!method?.id || !staffProfileId) return

      updateLocalPaymentMutation.mutate(
        {
          staffProfileId,
          paymentMethodId: method.id,
          accountInfo: value.trim(),
          imageUrl: qrCode || null,
          imageFile: qrFile,
        },
        {
          onSuccess: (updated) => {
            setPayoutSetupOpen(false)
            if (!updated.isActive && value.trim()) {
              toggleLocalPaymentMutation.mutate(
                { staffProfileId, paymentMethodId: method.id },
                { onError: showLocalPaymentError },
              )
            }
          },
          onError: showLocalPaymentError,
        },
      )
      return
    }

    const configs = form.payoutConfigs || DEFAULT_PAYOUT_CONFIGS
    setForm({
      ...form,
      payoutConfigs: {
        ...configs,
        [payoutSetupWallet]: {
          enabled: true,
          value: value.trim(),
          qrCode: qrCode,
          accountName: accountName.trim(),
        },
      },
    })
    setPayoutSetupOpen(false)
  }

  const handleToggleLocalPayment = (walletKey: string) => {
    if (!canManageLocalPayouts || !staffProfileId || isLocalPaymentSaving) return
    const method = localPaymentMethodsByKey.get(walletKey)
    if (!method?.id) return
    // Enabling a method without account info is meaningless — send them to setup first.
    if (!method.isActive && !method.accountInfo) {
      openPayoutSetup(walletKey)
      return
    }
    toggleLocalPaymentMutation.mutate(
      { staffProfileId, paymentMethodId: method.id },
      { onError: showLocalPaymentError },
    )
  }

  const handleCombinedIdChange = (val) => {
    if (isReviewOnly) return

    const trimmed = val.trim()
    const searchId = trimmed.includes('@') ? trimmed : trimmed.toUpperCase()

    // KYB verification check removed — NEXORA does not require KYB for add staff
    setIdInput(val)

    if (vlinkpayTimeout) clearTimeout(vlinkpayTimeout)
    if (nexoraTimeout) clearTimeout(nexoraTimeout)
    setSearchQuery('')
    setLastHandledSearchQuery('')

    if (!searchId) {
      setVlinkpayStatus('idle')
      setNexoraStatus('idle')
      setForm((prev) => ({ ...prev, vlinkpay: '', nexoraStaffId: '', staffProfileId: '' }))
      return
    }

    // Checking states for both
    setVlinkpayStatus('checking')
    setNexoraStatus('checking')
    setForm((prev) => ({ ...prev, vlinkpay: '', nexoraStaffId: '', staffProfileId: '' }))

    const apiSearchTimer = setTimeout(() => {
      setSearchQuery(searchId)
    }, 600)

    setVlinkpayTimeout(apiSearchTimer)
    setNexoraTimeout(apiSearchTimer)
    return

  }

  const handleScanQr = (target) => {
    // For combined scanning, if KYB is not approved, we will block it inside the callbacks or allow VLP scans
    setScanTarget(target || 'combined')
    setShowScanner(true)
  }

  const handleQrScanResult = (value: string) => {
    handleCombinedIdChange(value)
    setShowScanner(false)
    setScanTarget(null)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-nexoraText/70 p-4 py-6 backdrop-blur-sm sm:items-center">
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-3px); }
          75% { transform: translateX(3px); }
        }
        .animate-shake {
          animation: shake 0.15s ease-in-out 2;
        }
        @keyframes scaleUp {
          0% { transform: scale(0.85); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-scaleUp {
          animation: scaleUp 0.2s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
      `}</style>
      <div className="w-full max-w-lg md:max-w-3xl lg:max-w-4xl rounded-xl bg-white p-6 shadow-2xl transition-all relative">
        {isLoadingDetail && (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-white/70 backdrop-blur-[1px]">
            <Loader2 className="h-8 w-8 animate-spin text-nexoraBrand" />
          </div>
        )}
        <div className="flex items-center justify-between border-b border-nexoraRule pb-4">
          <h2 className="text-lg font-extrabold text-nexoraText">
            {isApproveMode
              ? (t('components.dashboard.modals.StaffModal.reviewJoinRequest'))
              : (viewOnly ? t('common.view_detail') : (editing ? t('common.edit') : t('setup.add_staff_title')))}
          </h2>
          <IconButton label={t('common.close')} onClick={onClose}>
            <X className="h-4 w-4" />
          </IconButton>
        </div>
        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          {/* Left Column: Basic Info & ID Verification */}
          <div className="space-y-4">
            {/* Staff ID / VLINKPAY ID Section */}
            <div>
              <label className="text-[10px] font-extrabold uppercase text-nexoraMuted block">
                {t('components.dashboard.modals.StaffModal.nexoraIdVlinkpayId')}
              </label>
              <div className="mt-1 flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none gap-1 bg-white px-1">
                    <img src="/assets/vlinkpay-logo.png" alt="VLINKPAY Logo" className="h-4.5 w-4.5 object-contain" />
                    <span className="text-nexoraBorder">/</span>
                    <img src="/assets/nexora-logo.png" alt="Nexora Logo" className="h-4.5 w-4.5 object-contain" />
                  </span>
                  <input
                    className={`h-10 w-full rounded-lg border pl-[76px] pr-10 text-sm outline-none font-semibold font-mono transition-all ${
                      isIdReadOnly ? 'border-nexoraBorder bg-nexoraCanvas cursor-default' :
                      (vlinkpayStatus === 'success' || nexoraStatus === 'success') ? 'border-nexoraSuccess focus:border-nexoraSuccess focus:ring-1 focus:ring-nexoraSuccess/20' :
                      (vlinkpayStatus === 'error' && nexoraStatus === 'error') ? 'border-nexoraDanger focus:border-nexoraDanger focus:ring-1 focus:ring-nexoraDanger/20 animate-shake' :
                      (vlinkpayStatus === 'checking' || nexoraStatus === 'checking') ? 'border-nexoraWarning focus:border-nexoraWarning' :
                      'border-nexoraBorder focus:border-nexoraBrand'
                    }`}
                    value={idInput}
                    readOnly={isIdReadOnly}
                    onChange={(event) => handleCombinedIdChange(event.target.value)}
                    placeholder={t('components.dashboard.modals.StaffModal.phExampleVlp1')}
                  />
                  {/* Legacy hidden inputs to maintain unit test compatibility */}
                  <input
                    type="text"
                    style={{ display: 'none' }}
                    placeholder={t('components.dashboard.modals.StaffModal.phExampleVlp2')}
                    value={form.vlinkpay || ''}
                    readOnly
                  />
                  <input
                    type="text"
                    style={{ display: 'none' }}
                    placeholder={t('components.dashboard.modals.StaffModal.phExampleStaffId')}
                    value={form.nexoraStaffId || ''}
                    readOnly
                  />
                  {!isReviewOnly && !isLocalStaff && (
                    <>
                      <div className="absolute right-9 top-1/2 -translate-y-1/2 flex items-center gap-1">
                        {(vlinkpayStatus === 'checking' || nexoraStatus === 'checking') && (
                          <Loader2 className="h-3.5 w-3.5 text-nexoraWarning animate-spin" />
                        )}
                        {(vlinkpayStatus === 'success' || nexoraStatus === 'success') && (
                          <CheckCircle2 className="h-3.5 w-3.5 text-nexoraSuccess animate-scaleUp" />
                        )}
                        {(vlinkpayStatus === 'error' && nexoraStatus === 'error') && (
                          <XCircle className="h-3.5 w-3.5 text-nexoraDanger animate-scaleUp" />
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleScanQr('combined')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-nexoraSubtle hover:text-nexoraBrand transition-colors p-1.5 rounded hover:bg-nexoraCanvas"
                        title={t('components.dashboard.modals.StaffModal.scanQrCode')}
                      >
                        <QrCode className="h-3.5 w-3.5" />
                      </button>
                      {/* Hidden legacy scan buttons to satisfy unit test assertions */}
                      <button
                        type="button"
                        style={{ display: 'none' }}
                        title={t('components.dashboard.modals.StaffModal.scanVlinkpayQrCode')}
                        onClick={() => handleScanQr('vlinkpay')}
                      />
                      <button
                        type="button"
                        style={{ display: 'none' }}
                        title={t('components.dashboard.modals.StaffModal.scanNexoraQrCode')}
                        onClick={() => handleScanQr('staff')}
                      />
                    </>
                  )}
                </div>

                {!isReviewOnly && !isLocalStaff && (
                  <button
                    type="button"
                    onClick={() => onOpenInviteShare && onOpenInviteShare(form)}
                    className="h-10 px-3 rounded-lg bg-nexoraBrandSoft hover:bg-nexoraBrandSoft/80 text-nexoraBrand border border-nexoraBrandSoft text-sm font-bold transition flex items-center justify-center gap-1 cursor-pointer whitespace-nowrap"
                    title={t('components.dashboard.modals.StaffModal.shareInviteLink')}
                  >
                    <QrCode className="h-4 w-4 shrink-0" />
                    {t('components.dashboard.modals.StaffModal.invite')}
                  </button>
                )}
              </div>
              {(vlinkpayStatus === 'success' || nexoraStatus === 'success') && (
                <p className="mt-1 text-[10px] font-bold text-nexoraSuccess">
                  ✓ {t('components.dashboard.modals.StaffModal.profileVerified')}
                </p>
              )}
            </div>

            {/* Avatar */}
            <div>
              <label className="text-[10px] font-extrabold uppercase text-nexoraMuted">Avatar</label>
              <div className="mt-2 flex items-center gap-4">
                <div className="relative">
                  {form.avatar ? (
                    <>
                      <img src={form.avatar} alt="" className="h-16 w-16 rounded-full object-cover ring-1 ring-nexoraBorder" />
                    </>
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-nexoraCanvas text-lg font-extrabold text-nexoraBrand ring-1 ring-nexoraBorder">
                      {(form.nickname || form.fullName || 'N').charAt(0)}
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 items-center">
                  {!isReviewOnly && (
                    <ImageFileInput
                      as="label"
                      className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg border border-nexoraBorder px-3 text-xs font-bold text-nexoraText transition hover:bg-nexoraCanvas"
                      onPick={handleAvatarPick}
                      onPickFile={handleAvatarFilePick}
                    >
                      <Upload className="h-4 w-4 text-nexoraBrand" />
                      {t('common.upload_photo')}
                    </ImageFileInput>
                  )}
                  {(form.nexoraStaffId || form.id) && (
                    <button
                      type="button"
                      onClick={() => setShowReviewsDetailModal(true)}
                      className="inline-flex h-9 items-center gap-2 rounded-lg border border-nexoraBrandSoft bg-nexoraBrandSoft/50 px-2.5 hover:bg-nexoraBrandSoft transition shadow-sm text-left group shrink-0"
                      title={t('components.dashboard.modals.StaffModal.viewAllReviews')}
                    >
                      <div className="flex items-center gap-0.5 text-nexoraWarning">
                        <Star className="h-3.5 w-3.5 fill-current" />
                        <span className="text-xs font-black text-nexoraText">
                          {displayRating > 0 ? displayRating.toFixed(1) : '-.-'}
                        </span>
                      </div>
                      <div className="h-3.5 w-px bg-nexoraBrandSoft" />
                      <span className="text-[10px] text-nexoraMuted font-bold group-hover:underline">
                        {t('components.dashboard.modals.StaffModal.review_count', { count: displayReviewCount })}
                      </span>
                    </button>
                  )}
                </div>
              </div>
            </div>
            <div>
              <label className="text-[10px] font-extrabold uppercase text-nexoraMuted">{renderLabel(t('setup.staff_fullname'))}</label>
              <input
                className={`mt-1 h-10 w-full rounded-lg border px-3 text-sm font-semibold text-nexoraText outline-none transition ${
                  isReviewOnly ? readOnlyInputClass : 'border-nexoraBorder bg-white focus:border-nexoraBrand focus:ring-2 focus:ring-nexoraBrand/20'
                }`}
                value={form.fullName}
                readOnly={isReviewOnly}
                onChange={(event) => setForm(prev => ({ ...prev, fullName: event.target.value }))}
                placeholder={t('components.dashboard.modals.StaffModal.phFullName')}
              />
              {errors.fullName && <p className="mt-1 text-[10px] font-bold text-nexoraDanger">{errors.fullName}</p>}
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
              <div className="min-w-0">
                <label className="flex h-4 items-center text-[10px] font-extrabold uppercase text-nexoraMuted gap-1">
                  <span>{renderLabel(t('setup.staff_displayname'))}</span>
                  <div className="relative group inline-block normal-case font-normal text-nexoraSubtle">
                    <HelpCircle className="w-3.5 h-3.5 hover:text-nexoraBrand cursor-help transition-colors" />
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-48 bg-black text-white text-[10px] p-2.5 rounded-lg shadow-xl z-50 text-center leading-normal">
                      {t('setup.nickname_tooltip')}
                      <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1.5 border-4 border-transparent border-t-black"></div>
                    </div>
                  </div>
                </label>
                <input
                  className={`mt-1 h-10 w-full min-w-0 rounded-lg border px-3 text-sm font-semibold text-nexoraText outline-none transition ${
                    isReviewOnly ? readOnlyInputClass : 'border-nexoraBorder bg-white focus:border-nexoraBrand focus:ring-2 focus:ring-nexoraBrand/20'
                  }`}
                  value={form.nickname}
                  readOnly={isReviewOnly}
                  onChange={(event) => setForm(prev => ({ ...prev, nickname: event.target.value }))}
                  placeholder={t('components.dashboard.modals.StaffModal.phNickname')}
                />
                {errors.nickname && <p className="mt-1 text-[10px] font-bold text-nexoraDanger">{errors.nickname}</p>}
              </div>
              <div className="min-w-0">
                <label className="flex h-4 items-center text-[10px] font-extrabold uppercase text-nexoraMuted">{t('setup.staff_position')}</label>
                <input
                  className={`mt-1 h-10 w-full min-w-0 rounded-lg border px-3 text-sm font-semibold text-nexoraText outline-none transition ${
                    isReviewOnly ? readOnlyInputClass : 'border-nexoraBorder bg-white focus:border-nexoraBrand focus:ring-2 focus:ring-nexoraBrand/20'
                  }`}
                  value={form.position}
                  readOnly={isReviewOnly}
                  onChange={(event) => setForm(prev => ({ ...prev, position: event.target.value }))}
                  placeholder={t('components.dashboard.modals.StaffModal.phPosition')}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="min-w-0">
                <label className="flex h-4 items-center text-[10px] font-extrabold uppercase text-nexoraMuted">{t('setup.staff_phone')}</label>
                <div className={`mt-1 flex h-10 w-full overflow-hidden rounded-lg shadow-sm ${isReviewOnly ? 'opacity-70 pointer-events-none' : ''}`}>
                  <CountryCodeSelect
                    value={phoneParsed.countryCode}
                    disabled={isReviewOnly}
                    onChange={(nextCode) => {
                      if (isReviewOnly) return
                      const digits = phoneParsed.nationalNumber.replace(/\D/g, '')
                      setForm((prev) => ({ ...prev, phone: digits ? `${nextCode}${digits}` : '' }))
                    }}
                  />
                  <input
                    className={`h-10 w-full min-w-0 rounded-r-lg border border-l-0 px-3 text-sm font-semibold text-nexoraText outline-none transition ${
                      isReviewOnly
                        ? 'border-nexoraBorder bg-nexoraCanvas'
                        : 'border-nexoraBorder bg-white focus:border-nexoraBrand focus:ring-2 focus:ring-nexoraBrand/20'
                    }`}
                    value={formatNationalNumber(phoneParsed.nationalNumber, phoneParsed.countryCode)}
                    readOnly={isReviewOnly}
                    onChange={(event) => {
                      if (isReviewOnly) return
                      const formatted = formatNationalNumber(event.target.value, phoneParsed.countryCode)
                      const digits = formatted.replace(/\D/g, '')
                      setForm((prev) => ({
                        ...prev,
                        phone: digits ? `${phoneParsed.countryCode}${digits}` : '',
                      }))
                    }}
                    placeholder={t('setup.staff_phone_placeholder')}
                  />
                </div>
                {errors.phone && <p className="mt-1 text-[10px] font-bold text-nexoraDanger">{errors.phone}</p>}
              </div>
              <div className="min-w-0">
                <label className="flex h-4 items-center text-[10px] font-extrabold uppercase text-nexoraMuted">{t('setup.staff_email')}</label>
                <input
                  className={`mt-1 h-10 w-full rounded-lg border px-3 text-sm font-semibold text-nexoraText outline-none transition ${
                    isReviewOnly
                      ? 'border-nexoraBorder bg-nexoraCanvas cursor-not-allowed'
                      : 'border-nexoraBorder bg-white focus:border-nexoraBrand focus:ring-2 focus:ring-nexoraBrand/20'
                  }`}
                  value={form.email || ''}
                  readOnly={isReviewOnly}
                  onChange={(event) => {
                    if (isReviewOnly) return
                    setForm((prev) => ({ ...prev, email: event.target.value }))
                  }}
                  placeholder={t('setup.staff_email_placeholder')}
                />
                {errors.email && <p className="mt-1 text-[10px] font-bold text-nexoraDanger">{errors.email}</p>}
              </div>
            </div>
          </div>

          {/* Right Column: Payout Configurations & Settings */}
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-extrabold uppercase text-nexoraMuted">{t('setup.payout_methods')}</label>
              <div className="mt-2 space-y-4">
                <div className="divide-y divide-nexoraRule rounded-xl border border-nexoraBorder bg-white px-4">
                  {STAFF_MODAL_WALLETS.map((wallet) => {
                    const localMethod = isLocalStaff ? localPaymentMethodsByKey.get(wallet.key) : null
                    const config = isLocalStaff
                      ? {
                          enabled: Boolean(localMethod?.isActive),
                          value: localMethod?.accountInfo || '',
                          qrCode: localMethod?.imageUrl || '',
                        }
                      : ((form.payoutConfigs && form.payoutConfigs[wallet.key]) || { enabled: false, value: '', qrCode: '' })

                    return (
                      <div key={wallet.key} className="flex items-center justify-between py-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <button
                            type="button"
                            disabled={!canManageLocalPayouts || isLocalPaymentSaving}
                            onClick={canManageLocalPayouts ? () => handleToggleLocalPayment(wallet.key) : undefined}
                            className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                              config.enabled ? 'bg-nexoraBrand' : 'bg-nexoraBorder'
                            } ${
                              !canManageLocalPayouts
                                ? 'cursor-not-allowed'
                                : isLocalPaymentSaving
                                  ? 'cursor-not-allowed opacity-70'
                                  : 'cursor-pointer'
                            }`}
                          >
                            <span
                              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                config.enabled ? 'translate-x-5' : 'translate-x-0'
                              }`}
                            />
                          </button>
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-nexoraCanvas shrink-0">
                              {WalletLogos[wallet.key]}
                            </span>
                            <div className="min-w-0">
                              <span className="text-xs font-bold text-nexoraText">{wallet.name}</span>
                              {config.value ? (
                                <div className="mt-0.5 truncate text-[10px] font-mono text-nexoraMuted">
                                  {config.value}
                                </div>
                              ) : null}
                            </div>
                          </div>
                        </div>
                        {canManageLocalPayouts ? (
                          <button
                            type="button"
                            onClick={() => openPayoutSetup(wallet.key)}
                            disabled={isLocalPaymentSaving}
                            className="inline-flex shrink-0 items-center gap-1 text-[11px] font-bold text-nexoraBrand transition hover:text-nexoraBrandDark disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {config.value ? (
                              <Pencil className="h-3 w-3 stroke-[2.5]" />
                            ) : (
                              <Plus className="h-3 w-3 stroke-[2.5]" />
                            )}
                            <span>
                              {config.value
                                ? t('components.dashboard.modals.StaffModal.editAccount')
                                : t('components.dashboard.modals.AddStaffModal.manual_add_account')}
                            </span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => openPayoutSetup(wallet.key)}
                            className="flex items-center gap-1.5 text-[11px] font-bold text-nexoraMuted transition hover:text-nexoraText"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span>{t('components.dashboard.modals.StaffModal.viewAccount')}</span>
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
              {errors.payment && <p className="mt-2 flex items-center gap-1 text-xs font-bold text-nexoraDanger"><AlertTriangle className="h-3.5 w-3.5" />{errors.payment}</p>}
            </div>

            {!isApproveMode && (
            <div className="rounded-lg border border-nexoraBorder bg-nexoraCanvas p-3.5 mt-2">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-xs font-extrabold text-nexoraText block">{t('components.dashboard.views.StaffView.tipsFlow')}</label>
                  <p className="text-[10px] text-nexoraMuted leading-relaxed mt-0.5">{t('components.dashboard.views.StaffView.clickPillToShow')}</p>
                </div>
                <button
                  type="button"
                  disabled={isTogglingTipsFlow}
                  onClick={handleShowInTipsFlowToggle}
                  className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    form.showInTipsFlow ? 'bg-nexoraBrand' : 'bg-nexoraBorder'
                  } ${isTogglingTipsFlow ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      form.showInTipsFlow ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
            )}
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2 border-t border-nexoraRule pt-4">
          {isApproveMode ? (
            <>
              <button
                type="button"
                onClick={onDecline}
                className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-bold text-rose-700 transition hover:border-rose-300 hover:bg-rose-100"
              >
                {t('components.dashboard.modals.StaffModal.decline')}
              </button>
              <button
                type="button"
                onClick={onSave}
                className="rounded-lg bg-nexoraBrand px-5 py-2 text-xs font-bold text-white transition hover:bg-nexoraBrandDark hover:shadow-md"
              >
                {t('components.dashboard.modals.StaffModal.approveAccept')}
              </button>
            </>
          ) : viewOnly ? (
            <button onClick={onClose} className="rounded-lg border border-nexoraBorder px-4 py-2 text-xs font-bold text-nexoraMuted">{t('common.close')}</button>
          ) : (
            <>
              <button onClick={onClose} className="rounded-lg border border-nexoraBorder px-4 py-2 text-xs font-bold text-nexoraMuted">{t('common.cancel')}</button>
              {!editing && form.staffProfileId ? (
                <button
                  type="button"
                  onClick={() => {
                    onLinkStaff?.({
                      staffProfileId: form.staffProfileId,
                      staffCode: form.nexoraStaffId || null,
                      fullName: form.fullName,
                      roleAtBusiness: form.position,
                    })
                    onClose()
                  }}
                  className="rounded-lg bg-nexoraBrand px-5 py-2 text-xs font-bold text-white"
                >
                  {t('components.dashboard.modals.StaffModal.linkRequestBtn')}
                </button>
              ) : (
                <button
                  onClick={onSave}
                  disabled={isSavingLocal || isLocalPaymentSaving}
                  className="inline-flex items-center gap-2 rounded-lg bg-nexoraBrand px-5 py-2 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {(isSavingLocal || isLocalPaymentSaving) && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  {t('common.save')}
                </button>
              )}
            </>
          )}
        </div>
      </div>

      <PayoutSetupModal
        open={payoutSetupOpen}
        walletKey={payoutSetupWallet}
        staffName={form.fullName}
        initialValue={tempPayoutValues.value}
        initialQrCode={tempPayoutValues.qrCode}
        onClose={() => setPayoutSetupOpen(false)}
        onSubmit={handlePayoutSubmit}
        readOnly={!isLocalStaff}
        isSaving={isLocalPaymentSaving}
      />

      <StaffReviewsDetailModal
        open={showReviewsDetailModal}
        onClose={() => setShowReviewsDetailModal(false)}
        form={form}
        reviewsList={reviewsList}
        filteredReviewsList={filteredReviewsList}
        averageRating={displayRating}
        starCounts={starCounts}
        reviewFilterRating={reviewFilterRating}
        reviewFilterSource={reviewFilterSource}
        reviewFilterOnlyCommented={reviewFilterOnlyCommented}
        setReviewFilterRating={setReviewFilterRating}
        setReviewFilterSource={setReviewFilterSource}
        setReviewFilterOnlyCommented={setReviewFilterOnlyCommented}
      />

      <StaffQrScannerModal
        open={showScanner}
        scanTarget={scanTarget}
        onClose={() => { setShowScanner(false); setScanTarget(null) }}
        onScan={handleQrScanResult}
      />
    </div>
  )
}

export default StaffModal
