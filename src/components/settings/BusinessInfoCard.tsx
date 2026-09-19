// BusinessInfoCard — the "Business Information" card (name/phone/email/website/
// booking notification phone). Extracted so it can be rendered both from the
// general Settings > Profile tab and from the POS > General Settings screen
// without duplicating the form/view markup.
import type { ChangeEvent, Dispatch, FormEvent, SetStateAction } from 'react'
import { Building2, Camera, Edit2, ExternalLink, HelpCircle, Info } from 'lucide-react'
import { useTranslation } from '../../contexts/LanguageContext'
import PhoneInput from '../ui/PhoneInput'
import { formatAddressForMap, type MapAddressParts } from '../../utils/mapUrl'
import { formatPhoneDisplay } from '../../utils/phoneDisplay'

type SettingsFormErrors = Record<string, string>

type BusinessInfoCardProps = {
  businessAddress?: MapAddressParts
  className?: string
  businessName?: string
  businessPhone?: string
  businessEmail?: string
  businessWebsite?: string
  bookingNotificationPhone?: string
  salesTaxRatePercent?: string
  showReviewLinks?: boolean
  googleReview?: string
  yelpReview?: string
  facebookReview?: string
  instagramReview?: string
  logoUrl?: string | null
  onLogoChange?: (e: ChangeEvent<HTMLInputElement>) => void
  isUploadingLogo?: boolean
  isEditingBusiness: boolean
  setIsEditingBusiness: (value: boolean) => void
  businessForm: LooseObject
  setBusinessForm: (value: LooseObject) => void
  businessErrors: SettingsFormErrors
  setBusinessErrors: Dispatch<SetStateAction<SettingsFormErrors>>
  canEdit: boolean
  /**
   * When true (KYB already submitted), show that edits apply on Nexora only and
   * do not update the VlinkPay SSO / KYB account.
   */
  showLocalOnlyHint?: boolean
  /** @deprecated Lock UI removed — business info stays editable after KYB. Kept for call-site compat. */
  verificationStatus?: string
  startEditBusiness: () => void
  saveBusiness: (e: FormEvent) => void
}

export default function BusinessInfoCard({
  businessAddress,
  className = 'md:col-span-2',
  businessName,
  businessPhone,
  businessEmail,
  businessWebsite,
  bookingNotificationPhone,
  salesTaxRatePercent,
  showReviewLinks,
  googleReview,
  yelpReview,
  facebookReview,
  instagramReview,
  logoUrl,
  onLogoChange,
  isUploadingLogo,
  isEditingBusiness,
  setIsEditingBusiness,
  businessForm,
  setBusinessForm,
  businessErrors,
  setBusinessErrors,
  canEdit,
  showLocalOnlyHint = false,
  startEditBusiness,
  saveBusiness,
}: BusinessInfoCardProps) {
  const { t } = useTranslation()

  const inputClass = (error?: string) =>
    `mt-1 h-10 w-full rounded-lg border bg-white px-3.5 text-xs text-nexoraText outline-none transition-all ${
      error
        ? 'border-rose-500 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/15'
        : 'border-nexoraBorder focus:border-nexoraBrand'
    }`
  const validationMessage = (error: string) =>
    t(`components.settings.tabs.ProfileTab.validation.${error}`)
  const clearError = (setter: BusinessInfoCardProps['setBusinessErrors'], field: string) => {
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
    <div className={`rounded-xl border border-nexoraBorder bg-white shadow-sm p-6 relative ${className}`}>
      <div className="flex justify-between items-center border-b border-nexoraRule pb-3 mb-4 gap-3">
        <h4 className="text-xs font-black uppercase text-nexoraText tracking-wider flex items-center gap-2 min-w-0">
          <Building2 className="h-4 w-4 text-purple-500 shrink-0" />
          <span className="truncate">{t('components.settings.tabs.ProfileTab.businessInformation')}</span>
        </h4>
        {!isEditingBusiness && canEdit && (
          <button
            type="button"
            onClick={startEditBusiness}
            aria-label="Edit Business Information"
            className="text-slate-400 hover:text-nexoraBrand transition p-1 hover:bg-slate-100 rounded shrink-0"
          >
            <Edit2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      {showLocalOnlyHint && (
        <p className="mb-4 -mt-2 flex items-start gap-1.5 text-[11px] leading-4 text-nexoraMuted">
          <Info className="mt-0.5 h-3 w-3 shrink-0 text-nexoraBrand" aria-hidden />
          <span>{t('components.settings.tabs.ProfileTab.businessInfoLocalOnlyHint')}</span>
        </p>
      )}

      {onLogoChange && (
        <div className="flex items-center gap-3 pb-4 mb-4 border-b border-nexoraRule">
          <div className="relative group shrink-0">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={t('components.settings.tabs.ProfileTab.businessLogo')}
                className="h-14 w-14 rounded-lg object-cover border border-nexoraBorder shadow-sm"
              />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-nexoraCanvas border border-nexoraBorder text-nexoraSubtle">
                <Building2 className="h-6 w-6" />
              </div>
            )}
            <label className="absolute inset-0 rounded-lg bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
              <Camera className="h-4 w-4" />
              <input type="file" accept="image/*" className="hidden" onChange={onLogoChange} disabled={isUploadingLogo} />
            </label>
          </div>
          <div className="text-[11px] text-nexoraMuted">
            <div className="font-bold text-nexoraText">{t('components.settings.tabs.ProfileTab.businessLogo')}</div>
            <div>
              {isUploadingLogo
                ? t('components.settings.tabs.ProfileTab.uploading')
                : t('components.settings.tabs.ProfileTab.businessLogoHint')}
            </div>
          </div>
        </div>
      )}

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
          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,14rem),1fr))] gap-3">
            <div>
              <label htmlFor="settings-business-phone" className="text-[10px] font-extrabold uppercase text-nexoraMuted">{t('components.settings.tabs.ProfileTab.businessPhone')}</label>
              <PhoneInput
                id="settings-business-phone"
                value={businessForm.businessPhone}
                error={businessErrors.businessPhone}
                onChange={(businessPhone) => {
                  setBusinessForm({ ...businessForm, businessPhone })
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
                inputMode="email"
                autoComplete="email"
                className={inputClass(businessErrors.businessEmail)}
                value={businessForm.businessEmail}
                placeholder={t('components.settings.tabs.ProfileTab.businessEmailPlaceholder')}
                aria-invalid={Boolean(businessErrors.businessEmail)}
                aria-describedby={businessErrors.businessEmail ? 'settings-business-email-error' : undefined}
                onChange={(e) => {
                  setBusinessForm({ ...businessForm, businessEmail: e.target.value.trim() })
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
          <fieldset className="space-y-3 border-t border-nexoraRule pt-3">
            <legend className="px-1 text-[10px] font-extrabold uppercase text-nexoraMuted">
              {t('components.settings.tabs.ProfileTab.businessAddress')}
            </legend>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { field: 'street', label: 'streetAddress', autoComplete: 'address-line1', maxLength: 300 },
                { field: 'city', label: 'city', autoComplete: 'address-level2', maxLength: 100 },
                { field: 'state', label: 'stateProvince', autoComplete: 'address-level1', maxLength: 50 },
                { field: 'zipCode', label: 'zipCode', autoComplete: 'postal-code', maxLength: 20 },
                { field: 'country', label: 'country', autoComplete: 'country-name', maxLength: 100 },
              ].map(({ field, label, autoComplete, maxLength }) => {
                const error = businessErrors[`businessAddress.${field}`]
                const id = `settings-business-address-${field}`
                return (
                  <div key={field} className={field === 'street' ? 'sm:col-span-2' : ''}>
                    <label htmlFor={id} className="text-[10px] font-extrabold uppercase text-nexoraMuted">
                      {t(`components.settings.tabs.ProfileTab.${label}`)}
                    </label>
                    <input
                      id={id}
                      type="text"
                      autoComplete={`section-business ${autoComplete}`}
                      maxLength={maxLength}
                      placeholder={t(`components.settings.tabs.ProfileTab.businessAddressPlaceholders.${field}`)}
                      className={inputClass(error)}
                      value={businessForm.businessAddress?.[field] || ''}
                      aria-invalid={Boolean(error)}
                      aria-describedby={error ? `${id}-error` : undefined}
                      onChange={(e) => {
                        setBusinessForm({ ...businessForm, businessAddress: { ...businessForm.businessAddress, [field]: e.target.value } })
                        clearError(setBusinessErrors, `businessAddress.${field}`)
                      }}
                    />
                    <FieldError id={`${id}-error`} error={error} />
                  </div>
                )
              })}
            </div>
          </fieldset>
          {showReviewLinks && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-extrabold uppercase text-nexoraMuted">{t('components.settings.tabs.ProfileTab.googleReviewLink')}</label>
                  <input
                    id="settings-business-google-review"
                    type="url"
                    className={inputClass(businessErrors.googleReview)}
                    value={businessForm.googleReview}
                    placeholder={t('components.settings.tabs.ProfileTab.phGoogleReviewUrl')}
                    aria-invalid={Boolean(businessErrors.googleReview)}
                    aria-describedby={businessErrors.googleReview ? 'settings-business-google-review-error' : undefined}
                    onChange={(e) => {
                      setBusinessForm({ ...businessForm, googleReview: e.target.value })
                      clearError(setBusinessErrors, 'googleReview')
                    }}
                  />
                  <FieldError id="settings-business-google-review-error" error={businessErrors.googleReview} />
                </div>
                <div>
                  <label className="text-[10px] font-extrabold uppercase text-nexoraMuted">{t('components.settings.tabs.ProfileTab.yelpReviewLink')}</label>
                  <input
                    id="settings-business-yelp-review"
                    type="url"
                    className={inputClass(businessErrors.yelpReview)}
                    value={businessForm.yelpReview}
                    placeholder={t('components.settings.tabs.ProfileTab.phYelpUrl')}
                    aria-invalid={Boolean(businessErrors.yelpReview)}
                    aria-describedby={businessErrors.yelpReview ? 'settings-business-yelp-review-error' : undefined}
                    onChange={(e) => {
                      setBusinessForm({ ...businessForm, yelpReview: e.target.value })
                      clearError(setBusinessErrors, 'yelpReview')
                    }}
                  />
                  <FieldError id="settings-business-yelp-review-error" error={businessErrors.yelpReview} />
                </div>
              </div>
              <div className="border-t border-nexoraRule pt-3">
                <div className="text-[10px] font-black uppercase text-nexoraMuted tracking-wider mb-3">
                  {t('components.settings.tabs.ProfileTab.socialLinks')}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-extrabold uppercase text-nexoraMuted">{t('components.settings.tabs.ProfileTab.facebook')}</label>
                    <input
                      id="settings-business-facebook"
                      type="url"
                      className={inputClass(businessErrors.facebookReview)}
                      value={businessForm.facebookReview}
                      placeholder={t('components.settings.tabs.ProfileTab.phFacebookUrl')}
                      aria-invalid={Boolean(businessErrors.facebookReview)}
                      aria-describedby={businessErrors.facebookReview ? 'settings-business-facebook-error' : undefined}
                      onChange={(e) => {
                        setBusinessForm({ ...businessForm, facebookReview: e.target.value })
                        clearError(setBusinessErrors, 'facebookReview')
                      }}
                    />
                    <FieldError id="settings-business-facebook-error" error={businessErrors.facebookReview} />
                  </div>
                  <div>
                    <label className="text-[10px] font-extrabold uppercase text-nexoraMuted">{t('components.settings.tabs.ProfileTab.instagram')}</label>
                    <input
                      id="settings-business-instagram"
                      type="url"
                      className={inputClass(businessErrors.instagramReview)}
                      value={businessForm.instagramReview}
                      placeholder={t('components.settings.tabs.ProfileTab.phInstagramUrl')}
                      aria-invalid={Boolean(businessErrors.instagramReview)}
                      aria-describedby={businessErrors.instagramReview ? 'settings-business-instagram-error' : undefined}
                      onChange={(e) => {
                        setBusinessForm({ ...businessForm, instagramReview: e.target.value })
                        clearError(setBusinessErrors, 'instagramReview')
                      }}
                    />
                    <FieldError id="settings-business-instagram-error" error={businessErrors.instagramReview} />
                  </div>
                </div>
              </div>
            </>
          )}
          <div>
            <label htmlFor="settings-booking-notification-phone" className="flex items-center text-[10px] font-extrabold uppercase text-nexoraMuted gap-1">
              <span>{t('components.settings.tabs.ProfileTab.bookingNotificationPhone')}</span>
              <div className="relative group inline-block normal-case font-normal text-nexoraSubtle">
                <HelpCircle className="w-3.5 h-3.5 hover:text-nexoraBrand cursor-help transition-colors" />
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-48 bg-black text-white text-[10px] p-2.5 rounded-lg shadow-xl z-50 text-center leading-normal">
                  {t('components.settings.tabs.ProfileTab.bookingNotificationPhoneHint')}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1.5 border-4 border-transparent border-t-black"></div>
                </div>
              </div>
            </label>
            <PhoneInput
              id="settings-booking-notification-phone"
              value={businessForm.bookingNotificationPhone}
              error={businessErrors.bookingNotificationPhone}
              onChange={(bookingNotificationPhone) => {
                setBusinessForm({ ...businessForm, bookingNotificationPhone })
                clearError(setBusinessErrors, 'bookingNotificationPhone')
              }}
            />
            <FieldError id="settings-booking-notification-phone-error" error={businessErrors.bookingNotificationPhone} />
          </div>
          <div>
            <label className="flex items-center text-[10px] font-extrabold uppercase text-nexoraMuted gap-1">
              <span>{t('components.settings.tabs.ProfileTab.salesTaxRatePercent')}</span>
              <div className="relative group inline-block normal-case font-normal text-nexoraSubtle">
                <HelpCircle className="w-3.5 h-3.5 hover:text-nexoraBrand cursor-help transition-colors" />
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-48 bg-black text-white text-[10px] p-2.5 rounded-lg shadow-xl z-50 text-center leading-normal">
                  {t('components.settings.tabs.ProfileTab.salesTaxRatePercentHint')}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1.5 border-4 border-transparent border-t-black"></div>
                </div>
              </div>
            </label>
            <input
              id="settings-sales-tax-rate-percent"
              type="number"
              min={0}
              max={100}
              step="0.01"
              className={inputClass(businessErrors.salesTaxRatePercent)}
              value={businessForm.salesTaxRatePercent}
              aria-invalid={Boolean(businessErrors.salesTaxRatePercent)}
              aria-describedby={businessErrors.salesTaxRatePercent ? 'settings-sales-tax-rate-percent-error' : undefined}
              onChange={(e) => {
                setBusinessForm({ ...businessForm, salesTaxRatePercent: e.target.value })
                clearError(setBusinessErrors, 'salesTaxRatePercent')
              }}
            />
            <FieldError id="settings-sales-tax-rate-percent-error" error={businessErrors.salesTaxRatePercent} />
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
          <div className="flex flex-col gap-1 py-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:py-1">
            <span className="shrink-0 text-nexoraMuted font-bold">{t('components.settings.tabs.ProfileTab.businessName')}</span>
            <span className="min-w-0 break-words text-nexoraText font-extrabold sm:text-right">{businessName}</span>
          </div>
          <div className="flex flex-col gap-1 border-t border-slate-50 py-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:py-1">
            <span className="shrink-0 text-nexoraMuted font-bold">{t('components.settings.tabs.ProfileTab.businessPhone')}</span>
            <span className="min-w-0 break-words text-nexoraText font-extrabold sm:text-right">{formatPhoneDisplay(businessPhone)}</span>
          </div>
          <div className="flex flex-col gap-1 border-t border-slate-50 py-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3 sm:py-1">
            <span className="shrink-0 text-nexoraMuted font-bold">{t('components.settings.tabs.ProfileTab.businessAddress')}</span>
            <span className="min-w-0 break-words text-nexoraText font-extrabold sm:text-right">
              {formatAddressForMap(businessAddress || {}) || t('components.settings.tabs.ProfileTab.notConfigured')}
            </span>
          </div>
          <div className="flex flex-col gap-1 border-t border-slate-50 py-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:py-1">
            <span className="shrink-0 text-nexoraMuted font-bold">{t('components.settings.tabs.ProfileTab.businessEmail')}</span>
            <span className="min-w-0 truncate text-nexoraText font-extrabold sm:text-right" title={businessEmail || undefined}>{businessEmail || '-'}</span>
          </div>
          <div className="flex flex-col gap-1 border-t border-slate-50 py-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:py-1">
            <span className="shrink-0 text-nexoraMuted font-bold">{t('components.settings.tabs.ProfileTab.website')}</span>
            {businessWebsite ? (
              <a
                href={businessWebsite}
                target="_blank"
                rel="noopener noreferrer"
                className="flex min-w-0 items-center gap-0.5 font-extrabold text-nexoraBrand hover:underline sm:justify-end sm:text-right"
                title={businessWebsite}
              >
                <span className="min-w-0 truncate">{businessWebsite.replace(/^https?:\/\//, '')}</span>
                <ExternalLink className="h-3 w-3 shrink-0" />
              </a>
            ) : (
              <span className="min-w-0 text-nexoraText font-extrabold sm:text-right">-</span>
            )}
          </div>
          {showReviewLinks && (
            <>
              {[
                { label: 'googleReviewLink', href: googleReview },
                { label: 'yelpReviewLink', href: yelpReview },
                { label: 'facebook', href: facebookReview },
                { label: 'instagram', href: instagramReview },
              ].map(({ label, href }) => (
                <div
                  key={label}
                  className="flex flex-col gap-1 border-t border-slate-50 py-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:py-1"
                >
                  <span className="shrink-0 text-nexoraMuted font-bold">{t(`components.settings.tabs.ProfileTab.${label}`)}</span>
                  {href ? (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex min-w-0 items-center gap-0.5 font-extrabold text-nexoraBrand hover:underline sm:justify-end sm:text-right"
                      title={href}
                    >
                      <span className="min-w-0 truncate">{href}</span>
                      <ExternalLink className="h-3 w-3 shrink-0" />
                    </a>
                  ) : (
                    <span className="min-w-0 text-nexoraText font-extrabold sm:text-right">-</span>
                  )}
                </div>
              ))}
            </>
          )}
          <div className="flex flex-col gap-1 border-t border-slate-50 py-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:py-1">
            <span className="shrink-0 text-nexoraMuted font-bold">{t('components.settings.tabs.ProfileTab.bookingNotificationPhone')}</span>
            <span className="min-w-0 break-words text-nexoraText font-extrabold sm:text-right">{formatPhoneDisplay(bookingNotificationPhone) || '-'}</span>
          </div>
          <div className="flex flex-col gap-1 border-t border-slate-50 py-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:py-1">
            <span className="shrink-0 text-nexoraMuted font-bold">{t('components.settings.tabs.ProfileTab.salesTaxRatePercent')}</span>
            <span className="min-w-0 break-words text-nexoraText font-extrabold sm:text-right">{salesTaxRatePercent ? `${salesTaxRatePercent}%` : '-'}</span>
          </div>
        </div>
      )}
    </div>
  )
}
