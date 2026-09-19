import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from '../../../contexts/LanguageContext'
import { buildAffiliateReferralUrl, getProfileReferralCode } from '../../../utils/affiliateReferral'
import { buildGoogleMapsEmbedUrl, formatAddressForMap } from '../../../utils/mapUrl'
import { formatPhoneDisplay } from '../../../utils/phoneDisplay'
import {
  User,
  Edit2,
  Copy,
  Check,
  MapPin,
  ExternalLink,
  Globe,
  HelpCircle,
  QrCode,
} from 'lucide-react'
import { isValidEmail, isValidPhone } from '../../../utils/validation'
import PhoneInput from '../../ui/PhoneInput'
import ReceivePaymentsQrContent from '../../payments/ReceivePaymentsQrContent'
import BusinessInfoCard from '../BusinessInfoCard'

export default function ProfileTab({
  profile,
  copiedId,
  isEditingBasic,
  setIsEditingBasic,
  basicForm,
  setBasicForm,
  basicErrors,
  setBasicErrors,
  isSavingPersonalInfo = false,
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

  const locationMapSource = profile.businessAddress || {}
  const locationMapContainerRef = useRef<HTMLDivElement>(null)
  const [locationMapScale, setLocationMapScale] = useState(1)
  useEffect(() => {
    const container = locationMapContainerRef.current
    if (!container) return
    // Google hides ratings below 400px wide or 300px high; keep both dimensions large enough.
    const resize = () => {
      if (container.clientWidth > 0) {
        setLocationMapScale(Math.min(1, container.clientWidth / 400))
      }
    }
    resize()
    const observer = new ResizeObserver(resize)
    observer.observe(container)
    return () => observer.disconnect()
  }, [])
  const locationMapQuery = useMemo(
    () => {
      const address = formatAddressForMap({
        street: locationMapSource.street,
        city: locationMapSource.city,
        state: locationMapSource.state,
        zipCode: locationMapSource.zipCode,
        country: locationMapSource.country,
      })
      if (!address) return ''
      return [String(profile.businessName || '').trim(), address].filter(Boolean).join(', ')
    },
    [locationMapSource, profile.businessName],
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

  return (
    <>
      <div className="space-y-6 animate-fadeIn">

          {/* Owner Profile Card */}
          <div className={`rounded-xl border border-nexoraRule bg-white shadow-sm p-4 flex items-center gap-4 sm:gap-6 relative ${focusPayoutMethods ? 'hidden' : ''}`}>
            <div className="flex shrink-0 flex-col items-center gap-1.5">
            {/* Avatar Section */}
            <div className="relative group">
              {profile.avatar && !profile.avatar.includes('unsplash.com') ? (
                <img
                  src={profile.avatar}
                  alt={profile.fullName}
                  className="h-14 w-14 rounded-full object-cover border border-white shadow-sm"
                />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-nexoraElectric to-nexoraViolet text-xl font-extrabold text-white uppercase border border-white shadow-sm">
                  {(profile.fullName || profile.email || '').slice(0, 2).toUpperCase() || '?'}
                </div>
              )}
              <label className="absolute inset-0 rounded-full bg-black/40 text-white text-[9px] font-black uppercase flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                {t('components.settings.tabs.ProfileTab.edit')}
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
              </label>
            </div>
            <span className="inline-block bg-orange-50 text-orange-600 text-[9px] font-semibold px-1.5 py-0.5 rounded">
              {t('components.settings.tabs.ProfileTab.businessOwner')}
            </span>

            </div>

            <div className="min-w-0 flex-1 space-y-2 text-xs sm:text-sm leading-5 text-left">
              {String(profile.username ?? '').trim() && (
                <div className="flex min-w-0 items-baseline gap-1">
                  <span className="shrink-0 text-nexoraMuted">{t('components.settings.tabs.ProfileTab.username')}:</span>
                  <span className="text-nexoraText font-medium">{profile.username}</span>
                </div>
              )}

              <div className="flex min-w-0 items-baseline gap-1">
                <span className="shrink-0 text-nexoraMuted">{t('components.settings.tabs.ProfileTab.email')}:</span>
                <span className="text-nexoraText font-medium truncate" title={profile.email}>{profile.email}</span>
              </div>

              {inlineReferral ? (
                <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
                  <span className="shrink-0 text-nexoraMuted">{t('components.settings.tabs.ProfileTab.referralLink')}:</span>
                  <div className="flex flex-wrap items-center gap-2 min-w-0 max-w-full">
                    {/* Link — truncates from the domain side so the ref code stays visible */}
                    <span
                      dir="rtl"
                      className="min-w-0 max-w-[10rem] sm:max-w-sm truncate text-left text-nexoraText font-medium"
                      title={referralUrl || referralDisplay}
                    >
                      {referralUrl ? referralUrl.replace(/^https?:\/\//, '') : referralDisplay}
                    </span>
                    {/* Copy Button */}
                    <button
                      type="button"
                      disabled={!referralUrl}
                      onClick={() => handleCopy(referralUrl, 'ref')}
                      className="text-blue-500 hover:text-blue-600 font-medium text-xs hover:underline flex items-center gap-1 shrink-0 disabled:cursor-not-allowed disabled:opacity-50"
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
                    {/* Show QR Button */}
                    <button
                      type="button"
                      onClick={onShowQr}
                      className="text-blue-500 hover:text-blue-600 font-medium text-xs hover:underline flex items-center gap-1 shrink-0"
                    >
                      <span>{t('components.settings.tabs.ProfileTab.showQr')}</span>
                      <QrCode className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
                  <span className="shrink-0 text-nexoraMuted">{t('components.settings.tabs.ProfileTab.referralLink')}:</span>
                  <span className="min-w-0 max-w-full truncate text-nexoraText font-medium" title={referralUrl || referralDisplay}>
                    {referralDisplay}
                  </span>
                  <div className="flex items-center gap-2">
                    {/* Copy Button */}
                    <button
                      type="button"
                      disabled={!referralUrl}
                      onClick={() => handleCopy(referralUrl, 'ref')}
                      className="text-blue-500 hover:text-blue-600 font-medium text-xs hover:underline flex items-center gap-1 shrink-0 disabled:cursor-not-allowed disabled:opacity-50"
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
                      className="text-blue-500 hover:text-blue-600 font-medium text-xs hover:underline flex items-center gap-1 shrink-0"
                    >
                      <QrCode className="h-3 w-3" />
                      <span>{t('components.settings.tabs.ProfileTab.showQr')}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

        {/* Profile details and business location */}
        <div className={`grid grid-cols-1 lg:grid-cols-6 gap-6 content-start ${focusPayoutMethods ? 'hidden' : ''}`}>

          {/* Basic Information */}
          <div className="min-w-0 lg:col-span-3 rounded-xl border border-nexoraBorder bg-white shadow-sm p-6 relative">
            <div className="flex justify-between items-center border-b border-nexoraRule pb-3 mb-4">
              <h4 className="text-xs font-black uppercase text-nexoraText tracking-wider flex items-center gap-2">
                <User className="h-4 w-4 text-nexoraBrand" />
                {t('components.settings.tabs.ProfileTab.basicInformation')}
              </h4>
              {!isEditingBasic && canEditKybFields && (
                <button
                  type="button"
                  onClick={startEditBasic}
                  aria-label={t('components.settings.tabs.ProfileTab.editPersonalInformation')}
                  className="text-slate-400 hover:text-nexoraBrand transition p-1 hover:bg-slate-100 rounded"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {isEditingBasic ? (
              <form onSubmit={saveBasic} noValidate aria-busy={isSavingPersonalInfo}>
                <fieldset disabled={isSavingPersonalInfo} className="min-w-0 space-y-4 disabled:opacity-60">
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
                      <span>{t('components.settings.tabs.ProfileTab.dateOfBirth')}</span>
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
                    <label htmlFor="settings-phone" className="flex items-center text-[10px] font-extrabold uppercase text-nexoraMuted gap-1">
                      <span>{t('components.settings.tabs.ProfileTab.phoneNumber')}</span>
                      <div className="relative group inline-block normal-case font-normal text-nexoraSubtle">
                        <HelpCircle className="w-3.5 h-3.5 hover:text-nexoraBrand cursor-help transition-colors" />
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-48 bg-black text-white text-[10px] p-2.5 rounded-lg shadow-xl z-50 text-center leading-normal">
                          {t('components.settings.tabs.ProfileTab.primaryPhoneContactFor')}
                          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1.5 border-4 border-transparent border-t-black"></div>
                        </div>
                      </div>
                    </label>
                    <PhoneInput
                      id="settings-phone"
                      value={basicForm.phone}
                      error={basicErrors.phone}
                      disabled={isSavingPersonalInfo}
                      onChange={(phone) => {
                        setBasicForm({ ...basicForm, phone })
                        clearError(setBasicErrors, 'phone')
                      }}
                    />
                    <FieldError id="settings-phone-error" error={basicErrors.phone} />
                  </div>
                  <fieldset className="min-w-0 space-y-4 border-t border-nexoraRule pt-3">
                    <legend className="px-1 text-[10px] font-extrabold uppercase text-nexoraMuted">
                      {t('components.settings.tabs.ProfileTab.addressDetails')}
                    </legend>
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
                  </fieldset>
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
                </fieldset>
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
                  <span className="text-nexoraText font-extrabold">{formatPhoneDisplay(profile.phone)}</span>
                </div>
                <div className="flex items-start gap-3 border-t border-slate-50 py-1">
                  <span className="shrink-0 font-bold text-nexoraMuted">{t('components.settings.tabs.ProfileTab.addressDetails')}</span>
                  <span className="min-w-0 flex-1 break-words text-right font-extrabold text-nexoraText">{formatAddressForMap(profile) || '-'}</span>
                </div>
              </div>
            )}
          </div>

          {/* Business Information */}
          <BusinessInfoCard
            businessAddress={profile.businessAddress}
            className="min-w-0 lg:col-span-3"
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
            verificationStatus={verificationStatus}
            startEditBusiness={startEditBusiness}
            saveBusiness={saveBusiness}
          />

            {/* Review Links */}
            <div className="min-w-0 lg:col-span-2 rounded-xl border border-nexoraBorder bg-white shadow-sm p-6 relative">
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

            {/* Location Map */}
            <div className="min-w-0 lg:col-span-4 rounded-xl border border-nexoraBorder bg-white shadow-sm p-6 relative overflow-hidden flex flex-col">
              <div className="flex justify-between items-center border-b border-nexoraRule pb-3 mb-4">
                <h4 className="text-xs font-black uppercase text-nexoraText tracking-wider flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-sky-500" />
                  {t('components.settings.tabs.ProfileTab.locationMap')}
                </h4>
              </div>
              {locationMapQuery && (
                <p className="mb-3 text-xs text-nexoraMuted break-words">
                  <span className="font-bold">{t('components.settings.tabs.ProfileTab.businessAddress')}: </span>
                  {formatAddressForMap(locationMapSource)}
                </p>
              )}
              <div ref={locationMapContainerRef} className="relative min-h-[320px] flex-1 w-full rounded-lg border border-slate-200 overflow-hidden bg-slate-100">
                {locationMapEmbedUrl ? (
                  <iframe
                    key={locationMapQuery}
                    title="Business Location Map"
                    src={locationMapEmbedUrl}
                    className="absolute left-0 top-0 border-0 origin-top-left"
                    style={{
                      width: `${100 / locationMapScale}%`,
                      height: `${100 / locationMapScale}%`,
                      transform: `scale(${locationMapScale})`,
                    }}
                    referrerPolicy="strict-origin-when-cross-origin"
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


        </div>

          {!hidePayoutMethods && (
            <ReceivePaymentsQrContent businessName={profile.businessName} />
          )}

      </div>

    </>
  )
}
