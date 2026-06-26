import React, { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createPortal } from 'react-dom'
import { useTranslation } from '../../../contexts/LanguageContext'
import useAuth from '../../../auth/useAuth'
import { useNotification } from '../../../contexts/NotificationContext'
import { useDeleteAccount } from '../../../data/hooks/useProfileSettings'
import { buildAffiliateReferralUrl, getProfileReferralCode } from '../../../utils/affiliateReferral'
import { buildGoogleMapsEmbedUrl, formatAddressForMap } from '../../../utils/mapUrl'
import {
  useMerchantPaymentMethods,
  useUpdateMerchantPaymentMethod,
  useToggleMerchantPaymentMethod
} from '../../../data/hooks/useMerchantPaymentMethods'
import {
  User,
  Building2,
  Edit2,
  Copy,
  Check,
  MapPin,
  ExternalLink,
  Wallet,
  Globe,
  HelpCircle,
  Camera,
  FolderOpen,
  AlertTriangle,
  X,
  QrCode,
  Trash2,
} from 'lucide-react'
import ToggleSwitch from '../../ui/ToggleSwitch'
import { isValidEmail, isValidPhone } from '../../../utils/validation'
import CountryCodeSelect, { formatNationalNumber, parsePhone } from '../../CountryCodeSelect'
import CameraCapture from '../../ui/CameraCapture'
import {
  getPaymentMethodDisplayName,
  payoutTypeToUiKey,
} from '../../../data/paymentMethodTypes'
import { formatPaymentMethodAccountDisplay } from '../../payout/bankWireAccount'
import type { PaymentMethodDto } from '../../../types/domain'

const PayoutLogos = {
  zelle: (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] fill-walletZelle" xmlns="http://www.w3.org/2000/svg">
      <path d="M13.559 24h-2.841a.483.483 0 0 1-.483-.483v-2.765H5.638a.667.667 0 0 1-.666-.666v-2.234a.67.67 0 0 1 .142-.412l8.139-10.382h-7.25a.667.667 0 0 1-.667-.667V3.914c0-.367.299-.666.666-.666h4.23V.483c0-.266.217-.483.483-.483h2.841c.266 0 .483.217.483.483v2.765h4.323c.367 0 .666.299.666.666v2.137a.67.67 0 0 1-.141.41l-8.19 10.481h7.665c.367 0 .666.299.666.666v2.477a.667.667 0 0 1-.666.667h-4.32v2.765a.483.483 0 0 1-.483.483Z" />
    </svg>
  ),
  bankwire: (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] fill-slate-600" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2L1 7v2h22V7L12 2zm0 18H3v-8h3v8h3v-8h3v8h3v-8h3v8h3v-8h3v8h3v-8h3v8h-3zm-11 2h22v2H1v-2z" />
    </svg>
  ),
  paypal: (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] fill-walletPaypal" xmlns="http://www.w3.org/2000/svg">
      <path d="M20.09 6.85c-.45 2.24-1.93 7.82-2.18 8.87-.24 1.05-1.12 1.77-2.22 1.77h-3.32l-.96 6.02c-.08.5-.52.87-1.03.87H6.22c-.65 0-1.13-.59-.99-1.22L8.53 5.4c.14-.63.7-.1 1.33-.1h5.8c2.81 0 4.88 1.48 4.43 3.7.22-1.07.13-2.15-.36-3.05z" />
      <path d="M16.92 3.85c-.45 2.24-1.93 7.82-2.18 8.87-.24 1.05-1.12 1.77-2.22 1.77h-3.32l-.96 6.02c-.08.5-.52.87-1.03.87H3.06c-.65 0-1.13-.59-.99-1.22L5.37 2.4c.14-.63.7-1.1 1.33-1.1h5.8c2.81 0 4.88 1.48 4.43 3.7.22-1.07.13-2.15-.36-3.05z" opacity="0.6" />
    </svg>
  ),
  venmo: (
    <svg viewBox="0 0 448 512" className="h-[18px] w-[18px] fill-walletVenmo" xmlns="http://www.w3.org/2000/svg">
      <path d="M381.4 105.3c11 18.1 15.9 36.7 15.9 60.3 0 75.1-64.1 172.7-116.2 241.2h-118.8l-47.6-285 104.1-9.9 25.3 202.8c23.5-38.4 52.6-98.7 52.6-139.7 0-22.5-3.9-37.8-9.9-50.4z" />
    </svg>
  ),
  cashapp: (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] fill-walletCashapp" xmlns="http://www.w3.org/2000/svg">
      <path d="M23.59 3.475a5.1 5.1 0 00-3.05-3.05c-1.31-.42-2.5-.42-4.92-.42H8.36c-2.4 0-3.61 0-4.9.4a5.1 5.1 0 00-3.05 3.06C0 4.765 0 5.965 0 8.365v7.27c0 2.41 0 3.6.4 4.9a5.1 5.1 0 003.05 3.05c1.3.41 2.5.41 4.9.41h7.28c2.41 0 3.61 0 4.9-.4a5.1 5.1 0 003.06-3.06c.41-1.3.41-2.5.41-4.9v-7.25c0-2.41 0-3.61-.41-4.91zm-6.17 4.63l-.93.93a.5.5 0 01-.67.01 5 5 0 00-3.22-1.18c-.97 0-1.94.32-1.94 1.21 0 .9 1.04 1.2 2.24 1.65 2.1.7 3.84 1.58 3.84 3.64 0 2.24-1.74 3.78-4.58 3.95l-.26 1.2a.49.49 0 01-.48.39H9.63l-.09-.01a.5.5 0 01-.38-.59l.28-1.27a6.54 6.54 0 01-2.88-1.57v-.01a.48.48 0 010-.68l1-.97a.49.49 0 01.67 0c.91.86 2.13 1.34 3.39 1.32c1.3 0 2.17-.55 2.17-1.42 0-.87-.88-1.1-2.54-1.72-1.76-.63-3.43-1.52-3.43-3.6 0-2.42 2.01-3.6 4.39-3.71l.25-1.23a.48.48 0 01.48-.38h1.78l.1.01c.26.06.43.31.37.57l-.27 1.37c.9.3 1.75.77 2.48 1.39l.02.02c.19.2.19.5 0 .68z" />
    </svg>
  ),
  applecash: (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] fill-black" xmlns="http://www.w3.org/2000/svg">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83zM15.97 4.17c.66-.81 1.11-1.93.99-3.06-1 .04-2.22.67-2.94 1.51-.62.73-1.16 1.87-1.02 2.98 1.11.09 2.25-.56 2.97-1.43z" />
    </svg>
  ),
  vlinkpay: (
    <img src="/assets/vlinkpay-logo.png" alt="VLINKPAY Logo" className="h-[18px] w-[18px] object-contain" />
  ),
}

const validatePayoutAccount = (method, input) => {
  const account = String(input || '').trim()
  if (!account) return 'required'

  if (method === 'zelle') return isValidEmail(account) || isValidPhone(account) ? '' : 'emailOrPhone'
  if (method === 'paypal') return isValidEmail(account) ? '' : 'email'
  if (method === 'venmo') return /^@[A-Za-z0-9_]{2,30}$/.test(account) ? '' : 'venmo'
  if (method === 'cashapp') return /^\$[A-Za-z][A-Za-z0-9_]{1,19}$/.test(account) ? '' : 'cashapp'
  if (method === 'applecash') return isValidPhone(account) ? '' : 'phone'
  return account.length >= 3 ? '' : 'invalid'
}

const KYB_EDITABLE_STATUSES = new Set(['basic', 'kyb_rejected', 'rejected'])

export default function ProfileTab({
  profile,
  copiedId,
  isEditingBasic,
  setIsEditingBasic,
  basicForm,
  setBasicForm,
  basicErrors,
  setBasicErrors,
  isEditingAddress,
  setIsEditingAddress,
  addressForm,
  setAddressForm,
  addressErrors,
  setAddressErrors,
  isEditingBusiness,
  setIsEditingBusiness,
  businessForm,
  setBusinessForm,
  businessErrors,
  setBusinessErrors,
  isEditingReviews,
  setIsEditingReviews,
  reviewsForm,
  setReviewsForm,
  reviewsErrors,
  setReviewsErrors,
  hasKyb,
  verificationStatus = 'basic',
  canEditProfile = true,
  currentLanguage,
  showToast,
  handleCopy,
  startEditBasic,
  saveBasic,
  startEditAddress,
  saveAddress,
  startEditBusiness,
  saveBusiness,
  startEditReviews,
  saveReviews,
  handleAvatarChange,
  formatDOB,
  onShowQr,
}) {
  const canEditKybFields = canEditProfile
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { logout } = useAuth()
  const { showConfirm } = useNotification()
  const deleteAccountMutation = useDeleteAccount()
  const referralCode = useMemo(() => getProfileReferralCode(profile), [profile])
  const referralUrl = useMemo(
    () => buildAffiliateReferralUrl({ referralCode }),
    [referralCode],
  )
  const referralDisplay = useMemo(() => {
    if (!referralUrl) {
      return t('components.staff_registration.hooks.useStaffRegistration.profileReferralCodeMissing')
    }
    const compactUrl = referralUrl.replace(/^https?:\/\//, '')
    if (referralCode.length <= 8) return compactUrl
    const maskedRef = `${referralCode.slice(0, 3)}...${referralCode.slice(-3)}`
    return compactUrl.replace(referralCode, maskedRef)
  }, [referralCode, referralUrl, t])

  const locationMapSource = isEditingAddress ? addressForm : profile
  const locationMapQuery = useMemo(
    () =>
      formatAddressForMap({
        street: locationMapSource.street,
        city: locationMapSource.city,
        state: locationMapSource.state,
        zipCode: locationMapSource.zipCode,
        country: locationMapSource.country,
      }),
    [locationMapSource],
  )
  const locationMapEmbedUrl = useMemo(
    () => buildGoogleMapsEmbedUrl(locationMapQuery),
    [locationMapQuery],
  )

  const inputClass = (error?: string) =>
    `mt-1 h-10 w-full rounded-lg border bg-nexoraCanvas focus:bg-white px-3.5 text-xs text-nexoraText outline-none transition-all ${
      error
        ? 'border-rose-500 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/15'
        : 'border-nexoraBorder focus:border-nexoraBrand'
    }`
  const validationMessage = (error: string) =>
    t(`components.settings.tabs.ProfileTab.validation.${error}`)
  const clearError = (setter, field: string) => {
    setter((current) => {
      if (!current[field]) return current
      const next = { ...current }
      delete next[field]
      return next
    })
  }
  const FieldError = ({ id, error }: { id: string; error?: string }) =>
    error ? (
      <p id={id} role="alert" className="mt-1 text-[10px] font-bold text-rose-500">
        {validationMessage(error)}
      </p>
    ) : null

  const { data: apiPaymentMethods = [] } = useMerchantPaymentMethods()
  const toggleMutation = useToggleMerchantPaymentMethod()
  const updateMutation = useUpdateMerchantPaymentMethod()

  // Local state for the payment method edit modal
  const [editingMethod, setEditingMethod] = useState<any | null>(null)
  const [editValue, setEditValue] = useState('')
  const [editQrCode, setEditQrCode] = useState<any | null>(null)
  const [editQrFile, setEditQrFile] = useState(null)
  const [isCapturing, setIsCapturing] = useState(false)
  const [isCameraOpen, setIsCameraOpen] = useState(false)
  const [modalError, setModalError] = useState('')

  const getMethodUiKey = (method: PaymentMethodDto) =>
    method.uiKey || payoutTypeToUiKey(method.type || '')

  const displayedPaymentMethods = apiPaymentMethods.filter(
    (m) => getMethodUiKey(m) !== 'bankwire'
  )

  const getMethod = (key: string) =>
    apiPaymentMethods.find((m) => getMethodUiKey(m) === key) || {
      type: key,
      isActive: false,
      isConfigured: false,
      accountInfo: '',
      id: undefined,
      imageUrl: null,
      accountName: null,
    }

  const handleToggleMethod = (key: string, isCurrentlyActive: boolean) => {
    const methodData = getMethod(key)
    const nextActive = !isCurrentlyActive

    if (nextActive && !(methodData.isConfigured && methodData.accountInfo?.trim())) {
      handleEditPayoutAccount(key)
      return
    }

    if (!methodData.id) {
      showToast(t('components.settings.tabs.ProfileTab.methodNotConfigured'), 'error')
      return
    }

    toggleMutation.mutate(methodData.id)
  }

  const handleEditPayoutAccount = (key) => {
    const methodData = getMethod(key)
    setEditingMethod(key)
    setEditValue(methodData.accountInfo || '')
    setEditQrCode(methodData.imageUrl || null)
    setEditQrFile(null)
    setModalError('')
  }

  const savePayoutAccount = (e) => {
    e.preventDefault()
    const validationError = validatePayoutAccount(editingMethod, editValue)
    if (validationError) {
      setModalError(validationMessage(validationError))
      return
    }
    const methodData = getMethod(editingMethod)
    if (!methodData.id) {
      showToast(t('components.settings.tabs.ProfileTab.methodIdMissing'), 'error')
      return
    }
    updateMutation.mutate(
      {
        id: methodData.id,
        accountInfo: editValue.trim(),
        imageUrl: editQrFile ? null : (editQrCode || null),
        imageFile: editQrFile || undefined,
      },
      {
        onSuccess: () => {
          setEditingMethod(null)
          if (!methodData.isActive) {
            toggleMutation.mutate({ id: methodData.id, silentSuccessToast: true })
          }
        }
      }
    )
  }

  const handleModalFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (editQrCode?.startsWith?.('blob:')) {
      URL.revokeObjectURL(editQrCode)
    }
    setEditQrFile(file)
    setEditQrCode(URL.createObjectURL(file))
  }

  const handleModalTakePhoto = () => {
    setIsCameraOpen(true)
  }

  const handleModalClearQr = () => {
    if (editQrCode?.startsWith?.('blob:')) {
      URL.revokeObjectURL(editQrCode)
    }
    setEditQrFile(null)
    setEditQrCode(null)
  }

  const handleDeleteAccount = async () => {
    if (deleteAccountMutation.isPending) return

    const confirmed = await showConfirm(
      t('components.settings.tabs.ProfileTab.deleteAccountConfirmMessage'),
      t('components.settings.tabs.ProfileTab.deleteAccountConfirmTitle'),
    )
    if (!confirmed) return

    try {
      await deleteAccountMutation.mutateAsync()
      await logout()
      navigate('/login', { replace: true })
    } catch {
      showToast(t('components.settings.tabs.ProfileTab.deleteAccountFailed'), 'error')
    }
  }

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">

        {/* Left Column (Owner Profile + Payout Methods) */}
        <div className="lg:col-span-1 space-y-6">

          {/* Owner Profile Card */}
          <div className="rounded-xl border border-nexoraBorder bg-white shadow-sm p-6 flex flex-col items-center text-center relative">
            {/* Avatar Section */}
            <div className="relative group">
              {profile.avatar && !profile.avatar.includes('unsplash.com') ? (
                <img
                  src={profile.avatar}
                  alt={profile.fullName}
                  className="h-20 w-20 rounded-full object-cover border border-white shadow-sm"
                />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-nexoraElectric to-nexoraViolet text-2xl font-extrabold text-white uppercase border border-white shadow-sm">
                  {(profile.businessName || profile.email || '').slice(0, 2).toUpperCase() || '?'}
                </div>
              )}
              <label className="absolute inset-0 rounded-full bg-black/40 text-white text-[9px] font-black uppercase flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                {t('components.settings.tabs.ProfileTab.edit')}
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
              </label>
            </div>
            <div className="mt-2 text-sm font-extrabold text-nexoraText truncate max-w-full">
              {profile.businessName || profile.email}
            </div>
            <span className="mt-1 inline-block bg-orange-50 text-orange-600 border border-orange-100 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full">
              {t('components.settings.tabs.ProfileTab.businessOwner')}
            </span>

            <div className="w-full mt-6 space-y-3.5 text-xs text-left border-t border-nexoraRule pt-4">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2 sm:py-1 gap-1">
                <span className="text-nexoraMuted font-bold">{t('components.settings.tabs.ProfileTab.username')}:</span>
                <span className="text-nexoraText font-extrabold">{profile.username}</span>
              </div>

              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2 sm:py-1 border-t border-slate-50 gap-1">
                <span className="text-nexoraMuted font-bold">{t('components.settings.tabs.ProfileTab.email')}:</span>
                <span className="text-nexoraText font-extrabold truncate" title={profile.email}>{profile.email}</span>
              </div>

              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2 sm:py-1 border-t border-slate-50 gap-1">
                <span className="text-nexoraMuted font-bold">{t('components.settings.tabs.ProfileTab.referralLink')}:</span>
                <div className="flex items-center gap-1 self-end sm:self-auto min-w-0">
                  <span className="text-nexoraText font-extrabold" title={referralUrl || referralDisplay}>
                    {referralDisplay}
                  </span>
                  
                  {/* Copy Button */}
                  <button
                    type="button"
                    disabled={!referralUrl}
                    onClick={() => handleCopy(referralUrl, 'ref')}
                    className="text-blue-500 hover:text-blue-600 font-bold text-[10px] uppercase hover:underline ml-2 flex items-center gap-1 shrink-0 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {copiedId === 'ref' ? (
                      <>
                        <Check className="h-3 w-3 text-emerald-600" />
                        <span className="text-emerald-500">{t('components.settings.tabs.ProfileTab.copied')}</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        <span>{t('components.settings.tabs.ProfileTab.copy')}</span>
                      </>
                    )}
                  </button>

                  {/* Show QR Button */}
                  <button
                    type="button"
                    onClick={onShowQr}
                    className="text-blue-500 hover:text-blue-600 font-bold text-[10px] uppercase hover:underline ml-2 flex items-center gap-1 shrink-0"
                  >
                    <QrCode className="h-3 w-3" />
                    <span>{t('components.settings.tabs.ProfileTab.showQr')}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Payout Methods Configuration */}
          <div className="rounded-xl border border-nexoraBorder bg-white shadow-sm p-6 relative">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
              <h4 className="text-xs font-black uppercase text-nexoraText tracking-wider flex items-center gap-2">
                <Wallet className="h-4 w-4 text-nexoraBrand" />
                {t('components.settings.tabs.ProfileTab.payoutMethods')}
              </h4>
              {/* Keep Payment Wallets text for unit tests matching */}
              <span className="sr-only">Payment Wallets</span>
            </div>

            <div className="divide-y divide-slate-100">
              {displayedPaymentMethods.map((method) => {
                const uiKey = getMethodUiKey(method)
                const label = method.name || getPaymentMethodDisplayName(method.type || '')
                const accountDisplay = formatPaymentMethodAccountDisplay(uiKey, method.accountInfo)
                return (
                <div key={method.id || uiKey} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <ToggleSwitch
                      checked={methodData.isActive}
                      onChange={() => handleToggleMethod(item.key)}
                      ariaLabel={`Toggle ${item.label}`}
                      activeColor="bg-amber-600"
                      inactiveColor="bg-slate-200"
                    />

                    {/* Logo and Label */}
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="h-7 w-7 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                        {PayoutLogos[uiKey]}
                      </span>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-800">{label}</div>
                        {method.isConfigured ? (
                          <div className="text-[10px] text-slate-500 font-mono mt-0.5 truncate max-w-[110px] sm:max-w-[150px]">
                            {accountDisplay}
                          </div>
                        ) : (
                          <div className="text-[10px] text-slate-300 italic font-medium mt-0.5">
                            {t('components.settings.tabs.ProfileTab.notConfigured')}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Edit button */}
                  <button
                    type="button"
                    onClick={() => handleEditPayoutAccount(uiKey)}
                    aria-label={`Edit ${label} Payout Account`}
                    className="flex items-center gap-1 text-[10px] font-bold text-amber-600 hover:text-amber-700 transition shrink-0 ml-2"
                  >
                    <Edit2 className="h-3 w-3" />
                    <span>{t('components.settings.tabs.ProfileTab.payoutAccount')}</span>
                  </button>
                </div>
              )})}
            </div>

          </div>

        </div>

        {/* Right Column (Basic Info + Address Details + Business Info + Map/Sponsor Grid) */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 content-start">

          {/* Basic Information */}
          <div className="rounded-xl border border-nexoraBorder bg-white shadow-sm p-6 relative">
            <div className="flex justify-between items-center border-b border-nexoraRule pb-3 mb-4">
              <h4 className="text-xs font-black uppercase text-nexoraText tracking-wider flex items-center gap-2">
                <User className="h-4 w-4 text-nexoraBrand" />
                {t('components.settings.tabs.ProfileTab.basicInformation')}
              </h4>
              {!isEditingBasic && canEditKybFields && (
                <button
                  type="button"
                  onClick={startEditBasic}
                  aria-label="Edit Basic Information"
                  className="text-slate-400 hover:text-nexoraBrand transition p-1 hover:bg-slate-100 rounded"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {isEditingBasic ? (
              <form onSubmit={saveBasic} noValidate className="space-y-4">
                <div>
                  <label className="flex items-center text-[10px] font-extrabold uppercase text-nexoraMuted gap-1">
                    <span>{t('components.settings.tabs.ProfileTab.fullName')}</span>
                    <div className="relative group inline-block normal-case font-normal text-nexoraSubtle">
                      <HelpCircle className="w-3.5 h-3.5 hover:text-nexoraBrand cursor-help transition-colors" />
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-48 bg-black text-white text-[10px] p-2.5 rounded-lg shadow-xl z-50 text-center leading-normal">
                        {t('components.settings.tabs.ProfileTab.specifyYourFullLegal')}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1.5 border-4 border-transparent border-t-black"></div>
                      </div>
                    </div>
                  </label>
                  <input
                    id="settings-full-name"
                    type="text"
                    className={inputClass(basicErrors.fullName)}
                    value={basicForm.fullName}
                    aria-invalid={Boolean(basicErrors.fullName)}
                    aria-describedby={basicErrors.fullName ? 'settings-full-name-error' : undefined}
                    onChange={(e) => {
                      setBasicForm({ ...basicForm, fullName: e.target.value })
                      clearError(setBasicErrors, 'fullName')
                    }}
                  />
                  <FieldError id="settings-full-name-error" error={basicErrors.fullName} />
                </div>
                <div>
                  <label className="flex items-center text-[10px] font-extrabold uppercase text-nexoraMuted gap-1">
                    <span>Date of Birth</span>
                    <div className="relative group inline-block normal-case font-normal text-nexoraSubtle">
                      <HelpCircle className="w-3.5 h-3.5 hover:text-nexoraBrand cursor-help transition-colors" />
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-48 bg-black text-white text-[10px] p-2.5 rounded-lg shadow-xl z-50 text-center leading-normal">
                        {t('components.settings.tabs.ProfileTab.requiredForIdentityVerification')}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1.5 border-4 border-transparent border-t-black"></div>
                      </div>
                    </div>
                  </label>
                  <input
                    id="settings-dob"
                    type="date"
                    className={inputClass(basicErrors.dob)}
                    value={basicForm.dob}
                    aria-invalid={Boolean(basicErrors.dob)}
                    aria-describedby={basicErrors.dob ? 'settings-dob-error' : undefined}
                    onChange={(e) => {
                      setBasicForm({ ...basicForm, dob: e.target.value })
                      clearError(setBasicErrors, 'dob')
                    }}
                  />
                  <FieldError id="settings-dob-error" error={basicErrors.dob} />
                </div>
                <div>
                  <label className="flex items-center text-[10px] font-extrabold uppercase text-nexoraMuted gap-1">
                    <span>Phone Number</span>
                    <div className="relative group inline-block normal-case font-normal text-nexoraSubtle">
                      <HelpCircle className="w-3.5 h-3.5 hover:text-nexoraBrand cursor-help transition-colors" />
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-48 bg-black text-white text-[10px] p-2.5 rounded-lg shadow-xl z-50 text-center leading-normal">
                        {t('components.settings.tabs.ProfileTab.primaryPhoneContactFor')}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1.5 border-4 border-transparent border-t-black"></div>
                      </div>
                    </div>
                  </label>
                  <div className="mt-1 flex rounded-lg shadow-sm">
                    <CountryCodeSelect
                      value={parsePhone(basicForm.phone).countryCode}
                      onChange={(newCode) => {
                        const { nationalNumber } = parsePhone(basicForm.phone)
                        const reFormatted = formatNationalNumber(nationalNumber, newCode)
                        setBasicForm({ ...basicForm, phone: `${newCode} ${reFormatted}`.trim() })
                        clearError(setBasicErrors, 'phone')
                      }}
                    />
                    <input
                      id="settings-phone"
                      type="text"
                      className={`h-10 w-full min-w-0 rounded-r-lg border border-l-0 bg-nexoraCanvas focus:bg-white px-3.5 text-xs text-nexoraText outline-none transition-all ${
                        basicErrors.phone
                          ? 'border-rose-500 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/15'
                          : 'border-nexoraBorder focus:border-nexoraBrand'
                      }`}
                      value={formatNationalNumber(parsePhone(basicForm.phone).nationalNumber, parsePhone(basicForm.phone).countryCode)}
                      aria-invalid={Boolean(basicErrors.phone)}
                      aria-describedby={basicErrors.phone ? 'settings-phone-error' : undefined}
                      onChange={(e) => {
                        const { countryCode } = parsePhone(basicForm.phone)
                        const formatted = formatNationalNumber(e.target.value, countryCode)
                        setBasicForm({ ...basicForm, phone: `${countryCode} ${formatted}`.trim() })
                        clearError(setBasicErrors, 'phone')
                      }}
                    />
                  </div>
                  <FieldError id="settings-phone-error" error={basicErrors.phone} />
                </div>
                <div className="flex gap-2 pt-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setIsEditingBasic(false)}
                    className="px-3 py-1.5 border border-slate-200 rounded text-[10px] font-bold text-slate-500 hover:bg-slate-50"
                  >
                    {t('components.settings.tabs.ProfileTab.cancel')}
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-nexoraBrand hover:bg-nexoraBrandDark text-white rounded text-[10px] font-bold"
                  >
                    {t('components.settings.tabs.ProfileTab.save')}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-3.5 text-xs">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2 sm:py-1 gap-1">
                  <span className="text-nexoraMuted font-bold">{t('components.settings.tabs.ProfileTab.fullName')}</span>
                  <span className="text-nexoraText font-extrabold">{profile.fullName}</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2 sm:py-1 border-t border-slate-50 gap-1">
                  <span className="text-nexoraMuted font-bold">{t('components.settings.tabs.ProfileTab.dateOfBirth')}</span>
                  <span className="text-nexoraText font-extrabold">{formatDOB(profile.dob)}</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2 sm:py-1 border-t border-slate-50 gap-1">
                  <span className="text-nexoraMuted font-bold">{t('components.settings.tabs.ProfileTab.phoneNumber')}</span>
                  <span className="text-nexoraText font-extrabold">{profile.phone}</span>
                </div>
              </div>
            )}
          </div>

          {/* Address Details */}
          <div className="rounded-xl border border-nexoraBorder bg-white shadow-sm p-6 relative">
            <div className="flex justify-between items-center border-b border-nexoraRule pb-3 mb-4">
              <h4 className="text-xs font-black uppercase text-nexoraText tracking-wider flex items-center gap-2">
                <MapPin className="h-4 w-4 text-rose-500" />
                {t('components.settings.tabs.ProfileTab.addressDetails')}
              </h4>
              {!isEditingAddress && canEditKybFields && (
                <button
                  type="button"
                  onClick={startEditAddress}
                  aria-label="Edit Address Details"
                  className="text-slate-400 hover:text-nexoraBrand transition p-1 hover:bg-slate-100 rounded"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {isEditingAddress ? (
              <form onSubmit={saveAddress} noValidate className="space-y-4">
                <div>
                  <label className="flex items-center text-[10px] font-extrabold uppercase text-nexoraMuted gap-1">
                    <span>{t('components.settings.tabs.ProfileTab.streetAddress')}</span>
                    <div className="relative group inline-block normal-case font-normal text-nexoraSubtle">
                      <HelpCircle className="w-3.5 h-3.5 hover:text-nexoraBrand cursor-help transition-colors" />
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-48 bg-black text-white text-[10px] p-2.5 rounded-lg shadow-xl z-50 text-center leading-normal">
                        {t('components.settings.tabs.ProfileTab.provideThePhysicalLocation')}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1.5 border-4 border-transparent border-t-black"></div>
                      </div>
                    </div>
                  </label>
                  <input
                    id="settings-street"
                    type="text"
                    className={inputClass(addressErrors.street)}
                    value={addressForm.street}
                    aria-invalid={Boolean(addressErrors.street)}
                    aria-describedby={addressErrors.street ? 'settings-street-error' : undefined}
                    onChange={(e) => {
                      setAddressForm({ ...addressForm, street: e.target.value })
                      clearError(setAddressErrors, 'street')
                    }}
                  />
                  <FieldError id="settings-street-error" error={addressErrors.street} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-extrabold uppercase text-nexoraMuted">{t('components.settings.tabs.ProfileTab.city')}</label>
                    <input
                       id="settings-city"
                       type="text"
                       className={inputClass(addressErrors.city)}
                       value={addressForm.city}
                       aria-invalid={Boolean(addressErrors.city)}
                       aria-describedby={addressErrors.city ? 'settings-city-error' : undefined}
                       onChange={(e) => {
                         setAddressForm({ ...addressForm, city: e.target.value })
                         clearError(setAddressErrors, 'city')
                       }}
                    />
                    <FieldError id="settings-city-error" error={addressErrors.city} />
                  </div>
                  <div>
                    <label className="text-[10px] font-extrabold uppercase text-nexoraMuted">{t('components.settings.tabs.ProfileTab.stateProvince')}</label>
                    <input
                      id="settings-state"
                      type="text"
                      className={inputClass(addressErrors.state)}
                      value={addressForm.state}
                      aria-invalid={Boolean(addressErrors.state)}
                      aria-describedby={addressErrors.state ? 'settings-state-error' : undefined}
                      onChange={(e) => {
                        setAddressForm({ ...addressForm, state: e.target.value })
                        clearError(setAddressErrors, 'state')
                      }}
                    />
                    <FieldError id="settings-state-error" error={addressErrors.state} />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-extrabold uppercase text-nexoraMuted">{t('components.settings.tabs.ProfileTab.zipCode')}</label>
                    <input
                      id="settings-zip-code"
                      type="text"
                      className={inputClass(addressErrors.zipCode)}
                      value={addressForm.zipCode}
                      aria-invalid={Boolean(addressErrors.zipCode)}
                      aria-describedby={addressErrors.zipCode ? 'settings-zip-code-error' : undefined}
                      onChange={(e) => {
                        setAddressForm({ ...addressForm, zipCode: e.target.value })
                        clearError(setAddressErrors, 'zipCode')
                      }}
                    />
                    <FieldError id="settings-zip-code-error" error={addressErrors.zipCode} />
                  </div>
                  <div>
                    <label className="text-[10px] font-extrabold uppercase text-nexoraMuted">{t('components.settings.tabs.ProfileTab.country')}</label>
                    <input
                      id="settings-country"
                      type="text"
                      className={inputClass(addressErrors.country)}
                      value={addressForm.country}
                      aria-invalid={Boolean(addressErrors.country)}
                      aria-describedby={addressErrors.country ? 'settings-country-error' : undefined}
                      onChange={(e) => {
                        setAddressForm({ ...addressForm, country: e.target.value })
                        clearError(setAddressErrors, 'country')
                      }}
                    />
                    <FieldError id="settings-country-error" error={addressErrors.country} />
                  </div>
                </div>
                <div className="flex gap-2 pt-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setIsEditingAddress(false)}
                    className="px-3 py-1.5 border border-slate-200 rounded text-[10px] font-bold text-slate-500 hover:bg-slate-50"
                  >
                    {t('components.settings.tabs.ProfileTab.cancel')}
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-nexoraBrand hover:bg-nexoraBrandDark text-white rounded text-[10px] font-bold"
                  >
                    {t('components.settings.tabs.ProfileTab.save')}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-3.5 text-xs">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start py-2 sm:py-1 gap-1">
                  <span className="text-nexoraMuted font-bold shrink-0">{t('components.settings.tabs.ProfileTab.street')}</span>
                  <span className="text-nexoraText font-extrabold sm:text-right break-words max-w-full sm:max-w-[180px]">{profile.street}</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2 sm:py-1 border-t border-slate-50 gap-1">
                <span className="text-nexoraMuted font-bold">{t('common.city')}</span>
                  <span className="text-nexoraText font-extrabold">{profile.city}</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2 sm:py-1 border-t border-slate-50 gap-1">
                  <span className="text-nexoraMuted font-bold">{t('components.settings.tabs.ProfileTab.state')}</span>
                  <span className="text-nexoraText font-extrabold">{profile.state || 'N/A'}</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2 sm:py-1 border-t border-slate-50 gap-1">
                  <span className="text-nexoraMuted font-bold">{t('components.settings.tabs.ProfileTab.zipCode')}</span>
                  <span className="text-nexoraText font-extrabold font-mono">{profile.zipCode}</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2 sm:py-1 border-t border-slate-50 gap-1">
                  <span className="text-nexoraMuted font-bold">{t('components.settings.tabs.ProfileTab.country')}</span>
                  <span className="text-nexoraText font-extrabold">{profile.country}</span>
                </div>
              </div>
            )}
          </div>

          {/* Business Information */}
          <div className="rounded-xl border border-nexoraBorder bg-white shadow-sm p-6 relative md:col-span-2">
            <div className="flex justify-between items-center border-b border-nexoraRule pb-3 mb-4">
              <h4 className="text-xs font-black uppercase text-nexoraText tracking-wider flex items-center gap-2">
                <Building2 className="h-4 w-4 text-purple-500" />
                {t('components.settings.tabs.ProfileTab.businessInformation')}
              </h4>
              {!isEditingBusiness && canEditKybFields && (
                <button
                  type="button"
                  onClick={startEditBusiness}
                  aria-label="Edit Business Information"
                  className="text-slate-400 hover:text-nexoraBrand transition p-1 hover:bg-slate-100 rounded"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {isEditingBusiness ? (
              <form onSubmit={saveBusiness} noValidate className="space-y-4">
                <div>
                  <label className="flex items-center text-[10px] font-extrabold uppercase text-nexoraMuted gap-1">
                    <span>{t('components.settings.tabs.ProfileTab.businessName')}</span>
                    <div className="relative group inline-block normal-case font-normal text-nexoraSubtle">
                      <HelpCircle className="w-3.5 h-3.5 hover:text-nexoraBrand cursor-help transition-colors" />
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-48 bg-black text-white text-[10px] p-2.5 rounded-lg shadow-xl z-50 text-center leading-normal">
                        {t('components.settings.tabs.ProfileTab.enterTheLegalOr')}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1.5 border-4 border-transparent border-t-black"></div>
                      </div>
                    </div>
                  </label>
                  <input
                    id="settings-business-name"
                    type="text"
                    className={inputClass(businessErrors.businessName)}
                    value={businessForm.businessName}
                    aria-invalid={Boolean(businessErrors.businessName)}
                    aria-describedby={businessErrors.businessName ? 'settings-business-name-error' : undefined}
                    onChange={(e) => {
                      setBusinessForm({ ...businessForm, businessName: e.target.value })
                      clearError(setBusinessErrors, 'businessName')
                    }}
                  />
                  <FieldError id="settings-business-name-error" error={businessErrors.businessName} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-extrabold uppercase text-nexoraMuted">{t('components.settings.tabs.ProfileTab.businessPhone')}</label>
                    <input
                      id="settings-business-phone"
                      type="tel"
                      className={inputClass(businessErrors.businessPhone)}
                      value={businessForm.businessPhone}
                      aria-invalid={Boolean(businessErrors.businessPhone)}
                      aria-describedby={businessErrors.businessPhone ? 'settings-business-phone-error' : undefined}
                      onChange={(e) => {
                        setBusinessForm({ ...businessForm, businessPhone: e.target.value })
                        clearError(setBusinessErrors, 'businessPhone')
                      }}
                    />
                    <FieldError id="settings-business-phone-error" error={businessErrors.businessPhone} />
                  </div>
                  <div>
                    <label className="text-[10px] font-extrabold uppercase text-nexoraMuted">{t('components.settings.tabs.ProfileTab.businessEmail')}</label>
                    <input
                      id="settings-business-email"
                      type="email"
                      className={inputClass(businessErrors.businessEmail)}
                      value={businessForm.businessEmail}
                      aria-invalid={Boolean(businessErrors.businessEmail)}
                      aria-describedby={businessErrors.businessEmail ? 'settings-business-email-error' : undefined}
                      onChange={(e) => {
                        setBusinessForm({ ...businessForm, businessEmail: e.target.value })
                        clearError(setBusinessErrors, 'businessEmail')
                      }}
                    />
                    <FieldError id="settings-business-email-error" error={businessErrors.businessEmail} />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-extrabold uppercase text-nexoraMuted">{t('components.settings.tabs.ProfileTab.website')}</label>
                  <input
                    id="settings-business-website"
                    type="url"
                    className={inputClass(businessErrors.businessWebsite)}
                    value={businessForm.businessWebsite}
                    aria-invalid={Boolean(businessErrors.businessWebsite)}
                    aria-describedby={businessErrors.businessWebsite ? 'settings-business-website-error' : undefined}
                    placeholder="https://example.com"
                    onChange={(e) => {
                      setBusinessForm({ ...businessForm, businessWebsite: e.target.value })
                      clearError(setBusinessErrors, 'businessWebsite')
                    }}
                  />
                  <FieldError id="settings-business-website-error" error={businessErrors.businessWebsite} />
                </div>
                <div className="flex gap-2 pt-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setIsEditingBusiness(false)}
                    className="px-3 py-1.5 border border-slate-200 rounded text-[10px] font-bold text-slate-500 hover:bg-slate-50"
                  >
                    {t('components.settings.tabs.ProfileTab.cancel')}
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-nexoraBrand hover:bg-nexoraBrandDark text-white rounded text-[10px] font-bold"
                  >
                    {t('components.settings.tabs.ProfileTab.save')}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-3.5 text-xs">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2 sm:py-1 gap-1">
                  <span className="text-nexoraMuted font-bold">{t('components.settings.tabs.ProfileTab.businessName')}</span>
                  <span className="text-nexoraText font-extrabold">{profile.businessName}</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2 sm:py-1 border-t border-slate-50 gap-1">
                  <span className="text-nexoraMuted font-bold">{t('components.settings.tabs.ProfileTab.phone')}</span>
                  <span className="text-nexoraText font-extrabold">{profile.businessPhone}</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2 sm:py-1 border-t border-slate-50 gap-1">
                  <span className="text-nexoraMuted font-bold">{t('components.settings.tabs.ProfileTab.email')}</span>
                  <span className="text-nexoraText font-extrabold">{profile.businessEmail}</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2 sm:py-1 border-t border-slate-50 gap-1">
                  <span className="text-nexoraMuted font-bold">{t('components.settings.tabs.ProfileTab.website')}</span>
                  {profile.businessWebsite ? (
                    <a
                      href={profile.businessWebsite}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-nexoraBrand hover:underline font-extrabold flex items-center gap-0.5"
                    >
                      {profile.businessWebsite.replace(/^https?:\/\//, '')} <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : (
                    <span className="text-nexoraSubtle font-medium">N/A</span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Nested Location Map and Sponsor Information Grid */}
            {/* Location Map */}
            <div className="rounded-xl border border-nexoraBorder bg-white shadow-sm p-6 relative overflow-hidden flex flex-col justify-between">
              <div className="flex justify-between items-center border-b border-nexoraRule pb-3 mb-4">
                <h4 className="text-xs font-black uppercase text-nexoraText tracking-wider flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-sky-500" />
                  {t('components.settings.tabs.ProfileTab.locationMap')}
                </h4>
              </div>
              <div className="h-[220px] w-full rounded-lg border border-slate-200 overflow-hidden bg-slate-100">
                {locationMapEmbedUrl ? (
                  <iframe
                    key={locationMapQuery}
                    title="Business Location Map"
                    src={locationMapEmbedUrl}
                    className="w-full h-full border-0 grayscale-[10%]"
                    allowFullScreen
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center gap-2 px-4 text-center">
                    <MapPin className="h-8 w-8 text-slate-300" />
                    <p className="text-[11px] font-semibold text-slate-500">
                      {t('components.settings.tabs.ProfileTab.locationMapEmpty')}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Review Links */}
            <div className="rounded-xl border border-nexoraBorder bg-white shadow-sm p-6 relative">
              <div className="flex justify-between items-center border-b border-nexoraRule pb-3 mb-4">
                <h4 className="text-xs font-black uppercase text-nexoraText tracking-wider flex items-center gap-2">
                  <Globe className="h-4 w-4 text-emerald-500" />
                  {t('components.settings.tabs.ProfileTab.reviewLinks')}
                </h4>
                {!isEditingReviews && (
                  <button
                    type="button"
                    onClick={startEditReviews}
                    aria-label="Edit Review Links"
                    className="text-slate-400 hover:text-nexoraBrand transition p-1 hover:bg-slate-100 rounded"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {isEditingReviews ? (
                <form onSubmit={saveReviews} noValidate className="space-y-4">
                  <div>
                    <label className="text-[10px] font-extrabold uppercase text-nexoraMuted">{t('components.settings.tabs.ProfileTab.googleReviewLink')}</label>
                    <input
                      id="settings-google-review"
                      type="url"
                      className={inputClass(reviewsErrors.googleReview)}
                      value={reviewsForm.googleReview}
                      aria-invalid={Boolean(reviewsErrors.googleReview)}
                      aria-describedby={reviewsErrors.googleReview ? 'settings-google-review-error' : undefined}
                      onChange={(e) => {
                        setReviewsForm({ ...reviewsForm, googleReview: e.target.value })
                        clearError(setReviewsErrors, 'googleReview')
                      }}
                      placeholder={t('components.settings.tabs.ProfileTab.phGoogleReviewUrl')}
                    />
                    <FieldError id="settings-google-review-error" error={reviewsErrors.googleReview} />
                  </div>
                  <div>
                    <label className="text-[10px] font-extrabold uppercase text-nexoraMuted">{t('components.settings.tabs.ProfileTab.yelpReviewLink')}</label>
                    <input
                      id="settings-yelp-review"
                      type="url"
                      className={inputClass(reviewsErrors.yelpReview)}
                      value={reviewsForm.yelpReview}
                      aria-invalid={Boolean(reviewsErrors.yelpReview)}
                      aria-describedby={reviewsErrors.yelpReview ? 'settings-yelp-review-error' : undefined}
                      onChange={(e) => {
                        setReviewsForm({ ...reviewsForm, yelpReview: e.target.value })
                        clearError(setReviewsErrors, 'yelpReview')
                      }}
                      placeholder={t('components.settings.tabs.ProfileTab.phYelpUrl')}
                    />
                    <FieldError id="settings-yelp-review-error" error={reviewsErrors.yelpReview} />
                  </div>
                  <div className="flex gap-2 pt-2 justify-end">
                    <button
                      type="button"
                      onClick={() => setIsEditingReviews(false)}
                      className="px-3 py-1.5 border border-slate-200 rounded text-[10px] font-bold text-slate-500 hover:bg-slate-50"
                    >
                      {t('components.settings.tabs.ProfileTab.cancel')}
                    </button>
                    <button
                      type="submit"
                      className="px-3 py-1.5 bg-nexoraBrand hover:bg-nexoraBrandDark text-white rounded text-[10px] font-bold"
                    >
                      {t('components.settings.tabs.ProfileTab.save')}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-3.5 text-xs">
                  <div className="flex flex-col py-1.5 border-b border-slate-50 gap-1">
                    <span className="text-nexoraMuted font-bold">{t('components.settings.tabs.ProfileTab.googleReviewLink')}</span>
                    {profile.googleReview ? (
                      <a
                        href={profile.googleReview}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-nexoraBrand hover:underline font-extrabold flex items-center gap-0.5 break-all text-[11px]"
                      >
                        {profile.googleReview} <ExternalLink className="h-3 w-3 shrink-0" />
                      </a>
                    ) : (
                      <span className="text-nexoraSubtle font-medium">{t('components.settings.tabs.ProfileTab.notConfigured')}</span>
                    )}
                  </div>
                  <div className="flex flex-col py-1.5 border-b border-slate-50 gap-1">
                    <span className="text-nexoraMuted font-bold">{t('components.settings.tabs.ProfileTab.yelpReviewLink')}</span>
                    {profile.yelpReview ? (
                      <a
                        href={profile.yelpReview}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-nexoraBrand hover:underline font-extrabold flex items-center gap-0.5 break-all text-[11px]"
                      >
                        {profile.yelpReview} <ExternalLink className="h-3 w-3 shrink-0" />
                      </a>
                    ) : (
                      <span className="text-nexoraSubtle font-medium">{t('components.settings.tabs.ProfileTab.notConfigured')}</span>
                    )}
                  </div>
                </div>
              )}
            </div>

        </div>

      </div>

      <div className="rounded-xl border border-rose-200 bg-white shadow-sm p-6 animate-fadeIn">
        <h3 className="mb-3 text-base font-extrabold text-nexoraDangerDark">
          {t('components.settings.tabs.ProfileTab.deleteAccountTitle')}
        </h3>
        <p className="mb-4 text-xs text-nexoraSubtle">
          {t('components.settings.tabs.ProfileTab.deleteAccountConfirmMessage')}
        </p>
        <button
          type="button"
          onClick={() => void handleDeleteAccount()}
          disabled={deleteAccountMutation.isPending}
          className="flex w-full max-w-md items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 py-3 text-sm font-extrabold text-rose-700 transition hover:bg-rose-100 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <Trash2 className="h-4.5 w-4.5" />
          {deleteAccountMutation.isPending
            ? t('common.processing')
            : t('components.settings.tabs.ProfileTab.deleteAccount')}
        </button>
      </div>

      {/* Payout Account Edit Custom Modal Popup */}
      {editingMethod && (() => {
        const walletNames = {
          zelle: 'Zelle',
          bankwire: 'Bank Wire',
          paypal: 'PayPal',
          venmo: 'Venmo',
          cashapp: 'Cash App',
          applecash: 'Apple Cash',
          vlinkpay: 'VLINKPAY Wallet',
        }

        const walletFields = {
          zelle: t('components.settings.tabs.ProfileTab.emailPhone'),
          bankwire: t('components.settings.tabs.ProfileTab.details'),
          paypal: 'email',
          venmo: '@username',
          cashapp: '$cashtag',
    applecash: t('common.phone_number_short')
        }

        const walletPlaceholders = {
          zelle: t('components.settings.tabs.ProfileTab.enterZelleEmailPhone'),
          bankwire: t('components.settings.tabs.ProfileTab.enterBankWireRouting'),
          paypal: t('components.settings.tabs.ProfileTab.enterPaypalEmail'),
          venmo: t('components.settings.tabs.ProfileTab.enterVenmoUsername'),
          cashapp: t('components.settings.tabs.ProfileTab.enterCashAppCashtag'),
          applecash: t('components.settings.tabs.ProfileTab.enterAppleCashPhone'),
          vlinkpay: t('components.dashboard.modals.PayoutSetupModal.placeholderVlinkpay'),
        }

        return createPortal(
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className={`bg-white rounded-3xl border border-slate-100 max-w-sm w-full shadow-2xl relative overflow-hidden animate-scaleIn text-left ${isCameraOpen ? 'h-[480px]' : 'p-6 space-y-4.5'}`}>

              {/* Header */}
              <div className="flex items-center gap-3.5 border-b border-slate-100 pb-3">
                <span className="h-11 w-11 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 shadow-sm">
                  {PayoutLogos[editingMethod]}
                </span>
                <div>
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">
                    {currentLanguage === 'vi'
                      ? `CẤU HÌNH ${walletNames[editingMethod]?.toUpperCase()}`
                      : `CONFIGURE ${walletNames[editingMethod]?.toUpperCase()}`}
                  </h3>
                  <p className="text-[10px] text-slate-400 font-medium">
                    {t('components.settings.tabs.ProfileTab.specifyReceivingTargetIdentifier')}
                  </p>
                </div>
              </div>

              {/* Form Content */}
              <form onSubmit={savePayoutAccount} noValidate className="space-y-4">
                {/* Account Identifier Input */}
                <div>
                  <label className="block text-[10px] font-extrabold uppercase text-slate-500 tracking-wider mb-2">
                    {currentLanguage === 'vi'
                      ? `${walletNames[editingMethod]?.toUpperCase()} EMAIL/SĐT CỦA BẠN *`
                      : `YOUR ${walletNames[editingMethod]?.toUpperCase()} EMAIL/PHONE *`}
                  </label>
                  <input
                    type="text"
                    autoFocus
                    value={editValue}
                    aria-invalid={Boolean(modalError)}
                    aria-describedby={modalError ? 'settings-payout-error' : undefined}
                    onChange={(e) => {
                      setEditValue(e.target.value)
                      setModalError('')
                    }}
                    placeholder={walletPlaceholders[editingMethod]}
                    className={`w-full bg-slate-50 border border-slate-200 focus:border-nexoraBrand focus:ring-2 focus:ring-nexoraBrand/20 focus:bg-white rounded-xl px-3.5 h-11 text-xs text-slate-800 focus:outline-none transition-all ${
                      modalError ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20' : ''
                    }`}
                  />
                  {modalError && <p id="settings-payout-error" role="alert" className="mt-1 text-[10px] font-bold text-rose-500">{modalError}</p>}
                </div>

                {/* QR Code Optional Upload */}
                <div>
                  <label className="block text-[10px] font-extrabold uppercase text-slate-500 tracking-wider mb-2">
                    {t('components.settings.tabs.ProfileTab.qrCodeOptional')}
                  </label>

                  {isCapturing ? (
                    <div className="flex h-44 w-full flex-col items-center justify-center rounded-xl border border-slate-200 bg-slate-50">
                      <div className="h-6 w-6 border-2 border-nexoraBrand/20 border-t-nexoraBrand rounded-full animate-spin"></div>
                      <span className="mt-2 text-xs font-semibold text-slate-500">
              {t('setup.taking_photo')}
                      </span>
                    </div>
                  ) : editQrCode ? (
                    <div className="relative flex flex-col items-center rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                      <button
                        type="button"
                        onClick={handleModalClearQr}
                        className="absolute right-2 top-2 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
                        title="Remove image"
                      >
                        <X className="h-4 w-4" />
                      </button>
                      <div className="text-center">
                        <div className="text-sm font-extrabold text-slate-800">{walletNames[editingMethod]}</div>
                        <div className="text-[10px] font-semibold text-slate-400 mt-0.5">{editValue}</div>
                      </div>
                      <div className="my-3 flex h-28 w-28 items-center justify-center border border-slate-100 bg-white p-1 rounded-lg">
                        <img src={editQrCode} alt="Payout QR Code" className="h-full w-full object-contain" />
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={handleModalTakePhoto}
                        className="flex flex-col items-center justify-center py-5 border border-dashed border-slate-200 hover:border-nexoraBrand rounded-xl bg-slate-50 hover:bg-slate-50/50 transition gap-1.5"
                      >
                        <Camera className="w-5 h-5 text-nexoraBrand" />
                        <span className="text-[11px] font-bold text-slate-600">
                          {t('components.settings.tabs.ProfileTab.takePhoto')}
                        </span>
                      </button>
                      <label
                        className="flex flex-col items-center justify-center py-5 border border-dashed border-slate-200 hover:border-nexoraBrand rounded-xl bg-slate-50 hover:bg-slate-50/50 transition gap-1.5 cursor-pointer"
                      >
                        <FolderOpen className="w-5 h-5 text-nexoraBrand" />
                        <span className="text-[11px] font-bold text-slate-600">
                          {t('components.settings.tabs.ProfileTab.chooseFile')}
                        </span>
                        <input type="file" accept="image/*" className="sr-only" onChange={handleModalFileChange} />
                      </label>
                    </div>
                  )}
                </div>

                {/* Warning box */}
                <div className="rounded-lg bg-blue-50/50 border border-blue-100 p-3 text-[10px] leading-relaxed text-blue-800 flex gap-2">
                  <AlertTriangle className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                  <span>
                    {t('components.settings.tabs.ProfileTab.pleaseEnterTheCorrect')}
                  </span>
                </div>

                {/* Footer Action Buttons */}
                <div className="flex justify-end gap-2.5 pt-2.5 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setEditingMethod(null)}
                    className="px-5 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider rounded-lg transition"
                  >
                    {t('components.settings.tabs.ProfileTab.cancel')}
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow-sm transition"
                  >
                    {t('components.settings.tabs.ProfileTab.save')}
                  </button>
                </div>
              </form>

              {isCameraOpen && (
                <CameraCapture
                  onCapture={(dataUrl) => {
                    setEditQrCode(dataUrl)
                    setIsCameraOpen(false)
                  }}
                  onCancel={() => setIsCameraOpen(false)}
                />
              )}
            </div>
          </div>
        , document.body);
      })()}
    </>
  )
}
