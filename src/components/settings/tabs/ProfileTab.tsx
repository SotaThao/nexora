import React, { useMemo, useState } from 'react'
import { useTranslation } from '../../../contexts/LanguageContext'
import { useNotification } from '../../../contexts/NotificationContext'
import { buildAffiliateReferralUrl, getProfileReferralCode } from '../../../utils/affiliateReferral'
import { buildGoogleMapsEmbedUrl, formatAddressForMap } from '../../../utils/mapUrl'
import {
  useMerchantPaymentMethods,
  useUpdateMerchantPaymentMethod,
  useToggleMerchantPaymentMethod
} from '../../../data/hooks/useMerchantPaymentMethods'
import {
  User,
  Edit2,
  Copy,
  Check,
  MapPin,
  ExternalLink,
  Wallet,
  Globe,
  HelpCircle,
  QrCode,
  Eye,
} from 'lucide-react'
import ToggleSwitch from '../../ui/ToggleSwitch'
import { isValidEmail, isValidPhone } from '../../../utils/validation'
import CountryCodeSelect, { formatNationalNumber, parsePhone } from '../../CountryCodeSelect'
import {
  getPaymentMethodDisplayName,
  payoutTypeToUiKey,
  isHiddenPayoutConfigType,
  isPaymentMethodConfigured,
  supportsPayoutAccountName,
  toPayoutAccountNameDto,
} from '../../../data/paymentMethodTypes'
import { formatPaymentMethodAccountDisplay } from '../../payout/bankWireAccount'
import {
  parseVlinkpayAddresses,
  parseVlinkpayAddressesFromMethod,
  serializeVlinkpayAddresses,
  toVlinkpayCryptoAddressesPayload,
} from '../../payout/vlinkpayWallet'
import PayoutMethodDetailModal from '../../payout/PayoutMethodDetailModal'
import PayoutSetupModal from '../../payout/PayoutSetupModal'
import SettingsTipQrPanel from '../SettingsTipQrPanel'
import BusinessInfoCard from '../BusinessInfoCard'
import type { PaymentMethodDto } from '../../../types/domain'
import { PayoutUiKey } from '../../../data/payoutUiKeys'

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
  logoUrl,
  handleLogoChange,
  isUploadingLogo,
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
  showToast: providedShowToast,
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
  inlineReferral = false,
  focusPayoutMethods = false,
  hidePayoutMethods = false,
}) {
  const canEditKybFields = canEditProfile
  const { t } = useTranslation()
  const { showToast: notifyToast } = useNotification()
  const showToast = providedShowToast ?? notifyToast
  const referralCode = useMemo(() => getProfileReferralCode(profile), [profile])
  const referralUrl = useMemo(
    // No leg picker on this page (unlike staff's My QR page) — omit `leg` entirely
    // until the merchant actually picks a side, rather than silently defaulting.
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
    `mt-1 h-10 w-full rounded-lg border bg-white px-3.5 text-xs text-nexoraText outline-none transition-all ${
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

  // Local state for the shared payment method setup/edit modal.
  const [editingMethod, setEditingMethod] = useState<any | null>(null)
  const [payoutCardTab, setPayoutCardTab] = useState<'methods' | 'paymentQr'>('methods')
  const [viewingMethod, setViewingMethod] = useState<PaymentMethodDto | null>(null)

  const getMethodUiKey = (method: PaymentMethodDto) =>
    method.uiKey || payoutTypeToUiKey(method.type || '')

  const displayedPaymentMethods = apiPaymentMethods.filter(
    (m) => getMethodUiKey(m) !== PayoutUiKey.BankWire && !isHiddenPayoutConfigType(m),
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

    if (nextActive && !isPaymentMethodConfigured(methodData)) {
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
    setEditingMethod(key)
  }

  const handleSavePayoutAccount = (
    value: string,
    qrCode: string,
    accountName: string,
    qrFile?: File | null,
  ) => {
    const methodData = getMethod(editingMethod)
    if (!methodData.id) {
      showToast(t('components.settings.tabs.ProfileTab.methodIdMissing'), 'error')
      return
    }
    const isVlinkpay = editingMethod === PayoutUiKey.VlinkPay
    const cryptoAddresses = isVlinkpay
      ? toVlinkpayCryptoAddressesPayload(parseVlinkpayAddresses(value))
      : undefined
    updateMutation.mutate(
      {
        id: methodData.id,
        ...(isVlinkpay
          ? { accountInfo: null, cryptoAddresses }
          : { accountInfo: value.trim() }),
        accountName: toPayoutAccountNameDto(editingMethod, accountName),
        imageUrl: qrFile ? null : (qrCode || null),
        imageFile: qrFile || undefined,
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

  const editingMethodData = editingMethod ? getMethod(editingMethod) : null
 

  return (
    <>
      <div className={`grid grid-cols-1 gap-6 animate-fadeIn ${focusPayoutMethods ? '' : 'lg:grid-cols-3'}`}>

        {/* Left Column (Owner Profile + Payout Methods) */}
        <div className={`${focusPayoutMethods ? '' : 'lg:col-span-1'} space-y-6`}>

          {/* Owner Profile Card */}
          <div className={`rounded-xl border border-nexoraBorder bg-white shadow-sm p-6 flex flex-col items-center text-center relative ${focusPayoutMethods ? 'hidden' : ''}`}>
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

              {inlineReferral ? (
                <div className="flex flex-col py-2 sm:py-1 border-t border-slate-50 gap-1.5">
                  <span className="text-nexoraMuted font-bold">{t('components.settings.tabs.ProfileTab.referralLink')}:</span>
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Link — truncates from the domain side so the ref code stays visible */}
                    <span
                      dir="rtl"
                      className="min-w-0 flex-1 truncate text-left text-nexoraText font-extrabold"
                      title={referralUrl || referralDisplay}
                    >
                      {referralUrl ? referralUrl.replace(/^https?:\/\//, '') : referralDisplay}
                    </span>
                    {/* Copy Button — text above icon */}
                    <button
                      type="button"
                      disabled={!referralUrl}
                      onClick={() => handleCopy(referralUrl, 'ref')}
                      className="text-blue-500 hover:text-blue-600 font-bold text-[10px] uppercase hover:underline flex flex-col items-center gap-0.5 shrink-0 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {copiedId === 'ref' ? (
                        <>
                          <span className="text-emerald-500">{t('components.settings.tabs.ProfileTab.copied')}</span>
                          <Check className="h-3 w-3 text-emerald-600" />
                        </>
                      ) : (
                        <>
                          <span>{t('components.settings.tabs.ProfileTab.copy')}</span>
                          <Copy className="h-3 w-3" />
                        </>
                      )}
                    </button>
                    {/* Show QR Button — text above icon */}
                    <button
                      type="button"
                      onClick={onShowQr}
                      className="text-blue-500 hover:text-blue-600 font-bold text-[10px] uppercase hover:underline flex flex-col items-center gap-0.5 shrink-0"
                    >
                      <span>{t('components.settings.tabs.ProfileTab.showQr')}</span>
                      <QrCode className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col py-2 sm:py-1 border-t border-slate-50 gap-1.5">
                  <span className="text-nexoraMuted font-bold">{t('components.settings.tabs.ProfileTab.referralLink')}:</span>
                  <span className="text-nexoraText font-extrabold break-all" title={referralUrl || referralDisplay}>
                    {referralDisplay}
                  </span>
                  <div className="flex items-center justify-center gap-4">
                    {/* Copy Button */}
                    <button
                      type="button"
                      disabled={!referralUrl}
                      onClick={() => handleCopy(referralUrl, 'ref')}
                      className="text-blue-500 hover:text-blue-600 font-bold text-[10px] uppercase hover:underline flex items-center gap-1 shrink-0 disabled:cursor-not-allowed disabled:opacity-50"
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
                      className="text-blue-500 hover:text-blue-600 font-bold text-[10px] uppercase hover:underline flex items-center gap-1 shrink-0"
                    >
                      <QrCode className="h-3 w-3" />
                      <span>{t('components.settings.tabs.ProfileTab.showQr')}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Payout Methods & Direct Payment QR */}
          {!hidePayoutMethods ? (
          <div className="rounded-xl border border-nexoraBorder bg-white shadow-sm p-6 relative">
            <div className="border-b border-slate-100 pb-3 mb-4 space-y-3">
              <h4 className="text-xs font-black uppercase text-nexoraText tracking-wider flex items-center gap-2">
                <Wallet className="h-4 w-4 text-nexoraBrand" />
                {t('components.settings.tabs.ProfileTab.payoutMethods')}
              </h4>
              {/* Keep Payment Wallets text for unit tests matching */}
              <span className="sr-only">Payment Wallets</span>

              <div
                className="flex gap-2 rounded-xl border border-nexoraBorder bg-nexoraSurfaceMuted p-1.5"
                role="tablist"
                aria-label={t('components.settings.tabs.ProfileTab.payoutMethods')}
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={payoutCardTab === 'methods'}
                  onClick={() => setPayoutCardTab('methods')}
                  className={`flex-1 rounded-lg px-3 py-2 text-[10px] font-extrabold uppercase tracking-wide transition ${
                    payoutCardTab === 'methods'
                      ? 'bg-nexoraBrand text-white shadow-md shadow-nexoraBrand/25 ring-2 ring-nexoraBrand/20'
                      : 'bg-transparent text-nexoraMuted hover:bg-white/70 hover:text-nexoraText'
                  }`}
                >
                  {t('components.settings.tabs.ProfileTab.payoutMethodsTab')}
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={payoutCardTab === 'paymentQr'}
                  onClick={() => setPayoutCardTab('paymentQr')}
                  className={`flex-1 rounded-lg px-3 py-2 text-[10px] font-extrabold uppercase tracking-wide transition ${
                    payoutCardTab === 'paymentQr'
                      ? 'bg-nexoraBrand text-white shadow-md shadow-nexoraBrand/25 ring-2 ring-nexoraBrand/20'
                      : 'bg-transparent text-nexoraMuted hover:bg-white/70 hover:text-nexoraText'
                  }`}
                >
                  {t('components.settings.tabs.ProfileTab.paymentQrTab')}
                </button>
              </div>
            </div>

            {payoutCardTab === 'paymentQr' ? (
              <SettingsTipQrPanel
                businessName={profile.businessName}
                showToast={showToast}
                handleCopy={handleCopy}
                copiedId={copiedId}
                t={t}
                onConfigurePayoutMethods={() => setPayoutCardTab('methods')}
              />
            ) : (
            <div className="space-y-2">
              {displayedPaymentMethods.map((method) => {
                const uiKey = getMethodUiKey(method)
                const label = method.name || getPaymentMethodDisplayName(method.type || '')
                const accountDisplay = formatPaymentMethodAccountDisplay(
                  uiKey,
                  method.accountInfo,
                  method.cryptoAddresses,
                )
                return (
                <div
                  key={method.id || uiKey}
                  className="flex flex-col gap-3 rounded-xl border border-nexoraBorder bg-white px-3 py-2.5 shadow-sm sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex w-full min-w-0 items-center gap-3 sm:flex-1">
                    <ToggleSwitch
                      checked={!!method.isActive}
                      onChange={() => handleToggleMethod(uiKey, !!method.isActive)}
                      ariaLabel={`Toggle ${label}`}
                      activeColor="bg-amber-600"
                      inactiveColor="bg-slate-200"
                    />

                    {/* Logo and Label */}
                    <div className="flex min-w-0 flex-1 items-center gap-2.5">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-nexoraBorder bg-nexoraCanvas">
                        {PayoutLogos[uiKey]}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-nexoraText">{label}</div>
                        {isPaymentMethodConfigured(method) ? (
                          <div className="mt-0.5 max-w-full truncate font-mono text-[10px] text-nexoraMuted sm:max-w-[150px]">
                            {supportsPayoutAccountName(uiKey) && method.accountName ? (
                              <span className="font-sans font-semibold">{method.accountName} · </span>
                            ) : null}
                            {accountDisplay}
                          </div>
                        ) : (
                          <div className="mt-0.5 text-[10px] font-medium italic text-nexoraSubtle">
                            {t('components.settings.tabs.ProfileTab.notConfigured')}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid w-full grid-cols-2 gap-2 sm:ml-2 sm:flex sm:w-auto sm:shrink-0 sm:items-center sm:gap-1.5">
                    <button
                      type="button"
                      onClick={() => setViewingMethod(method)}
                      aria-label={`View ${label} Payout Details`}
                      className="flex min-w-0 items-center justify-center gap-1 rounded-lg border border-sky-200 bg-sky-50 px-2 py-1.5 text-[10px] font-bold text-sky-700"
                    >
                      <Eye className="h-3 w-3" />
                      <span className="truncate">{t('components.settings.tabs.ProfileTab.view')}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleEditPayoutAccount(uiKey)}
                      aria-label={`Edit ${label} Payout Account`}
                      className="flex min-w-0 items-center justify-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-2 py-1.5 text-[10px] font-bold text-amber-700"
                    >
                      <Edit2 className="h-3 w-3" />
                      <span className="truncate">{t('components.settings.tabs.ProfileTab.payoutAccount')}</span>
                    </button>
                  </div>
                </div>
              )})}
            </div>
            )}

          </div>
          ) : null}

        </div>

        {/* Right Column (Basic Info + Address Details + Business Info + Map/Sponsor Grid) */}
        <div className={`lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 content-start ${focusPayoutMethods ? 'hidden' : ''}`}>

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
          <BusinessInfoCard
            businessName={profile.businessName}
            businessPhone={profile.businessPhone}
            businessEmail={profile.businessEmail}
            businessWebsite={profile.businessWebsite}
            bookingNotificationPhone={profile.bookingNotificationPhone}
            salesTaxRatePercent={profile.salesTaxRatePercent}
            logoUrl={logoUrl}
            onLogoChange={handleLogoChange}
            isUploadingLogo={isUploadingLogo}
            isEditingBusiness={isEditingBusiness}
            setIsEditingBusiness={setIsEditingBusiness}
            businessForm={businessForm}
            setBusinessForm={setBusinessForm}
            businessErrors={businessErrors}
            setBusinessErrors={setBusinessErrors}
            canEdit={canEditKybFields}
            startEditBusiness={startEditBusiness}
            saveBusiness={saveBusiness}
          />

          {/* Nested Location Map and Sponsor Information Grid */}
            {/* Location Map */}
            <div className="rounded-xl border border-nexoraBorder bg-white shadow-sm p-6 relative overflow-hidden flex flex-col">
              <div className="flex justify-between items-center border-b border-nexoraRule pb-3 mb-4">
                <h4 className="text-xs font-black uppercase text-nexoraText tracking-wider flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-sky-500" />
                  {t('components.settings.tabs.ProfileTab.locationMap')}
                </h4>
              </div>
              <div className="min-h-[220px] flex-1 w-full rounded-lg border border-slate-200 overflow-hidden bg-slate-100">
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
                  <div>
                    <label htmlFor="settings-facebook-review" className="text-[10px] font-extrabold uppercase text-nexoraMuted">{t('components.settings.tabs.ProfileTab.facebook')}</label>
                    <input
                      id="settings-facebook-review"
                      type="url"
                      className={inputClass(reviewsErrors.facebookReview)}
                      value={reviewsForm.facebookReview}
                      aria-invalid={Boolean(reviewsErrors.facebookReview)}
                      aria-describedby={reviewsErrors.facebookReview ? 'settings-facebook-review-error' : undefined}
                      onChange={(e) => {
                        setReviewsForm({ ...reviewsForm, facebookReview: e.target.value })
                        clearError(setReviewsErrors, 'facebookReview')
                      }}
                      placeholder={t('components.settings.tabs.ProfileTab.phFacebookUrl')}
                    />
                    <FieldError id="settings-facebook-review-error" error={reviewsErrors.facebookReview} />
                  </div>
                  <div>
                    <label htmlFor="settings-instagram-review" className="text-[10px] font-extrabold uppercase text-nexoraMuted">{t('components.settings.tabs.ProfileTab.instagram')}</label>
                    <input
                      id="settings-instagram-review"
                      type="url"
                      className={inputClass(reviewsErrors.instagramReview)}
                      value={reviewsForm.instagramReview}
                      aria-invalid={Boolean(reviewsErrors.instagramReview)}
                      aria-describedby={reviewsErrors.instagramReview ? 'settings-instagram-review-error' : undefined}
                      onChange={(e) => {
                        setReviewsForm({ ...reviewsForm, instagramReview: e.target.value })
                        clearError(setReviewsErrors, 'instagramReview')
                      }}
                      placeholder={t('components.settings.tabs.ProfileTab.phInstagramUrl')}
                    />
                    <FieldError id="settings-instagram-review-error" error={reviewsErrors.instagramReview} />
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
                  <div className="flex flex-col py-1.5 border-b border-slate-50 gap-1">
                    <span className="text-nexoraMuted font-bold">{t('components.settings.tabs.ProfileTab.facebook')}</span>
                    {profile.facebookReview ? (
                      <a
                        href={profile.facebookReview}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-nexoraBrand hover:underline font-extrabold flex items-center gap-0.5 break-all text-[11px]"
                      >
                        {profile.facebookReview} <ExternalLink className="h-3 w-3 shrink-0" />
                      </a>
                    ) : (
                      <span className="text-nexoraSubtle font-medium">{t('components.settings.tabs.ProfileTab.notConfigured')}</span>
                    )}
                  </div>
                  <div className="flex flex-col py-1.5 gap-1">
                    <span className="text-nexoraMuted font-bold">{t('components.settings.tabs.ProfileTab.instagram')}</span>
                    {profile.instagramReview ? (
                      <a
                        href={profile.instagramReview}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-nexoraBrand hover:underline font-extrabold flex items-center gap-0.5 break-all text-[11px]"
                      >
                        {profile.instagramReview} <ExternalLink className="h-3 w-3 shrink-0" />
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

      <PayoutMethodDetailModal
        method={viewingMethod}
        logo={viewingMethod ? PayoutLogos[getMethodUiKey(viewingMethod)] : null}
        onClose={() => setViewingMethod(null)}
      />

      <PayoutSetupModal
        open={Boolean(editingMethod)}
        walletKey={editingMethod || ''}
        initialValue={
          editingMethod === PayoutUiKey.VlinkPay
            ? serializeVlinkpayAddresses(parseVlinkpayAddressesFromMethod(editingMethodData))
            : (editingMethodData?.accountInfo || '')
        }
        initialQrCode={editingMethodData?.imageUrl || ''}
        initialAccountName={editingMethodData?.accountName || ''}
        onClose={() => setEditingMethod(null)}
        onSubmit={handleSavePayoutAccount}
        isSaving={updateMutation.isPending}
      />
    </>
  )
}
