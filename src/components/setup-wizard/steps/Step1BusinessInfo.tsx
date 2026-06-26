import React, { useMemo, useState } from 'react'
import {
  Building2, Upload, MapPin, Globe, ShieldCheck, HelpCircle
} from 'lucide-react'
import CustomSelect from '../../CustomSelect'
import ImageFileInput from '../../ui/ImageFileInput'
import CountryCodeSelect, { formatNationalNumber, parsePhone } from '../../CountryCodeSelect'
import { renderTextWithGoldStars } from '../constants'
import { renderLabel } from '../../../contexts/LanguageContext'
import { getPhoneFieldError } from '../../../utils/onboardingFieldValidation'


export default function Step1BusinessInfo({
  t,
  currentLanguage,
  isSsoLocked,
  businessInfo,
  setBusinessInfo,
  reviewLinks,
  setReviewLinks,
  errors,
  setErrors,
  handleLogoFile
}) {
  const phoneParsed = useMemo(() => parsePhone(businessInfo.phone), [businessInfo.phone])
  const [phoneTouched, setPhoneTouched] = useState(false)

  const syncPhoneError = (nextPhone: string, force = false) => {
    if (!phoneTouched && !errors.phone && !force) return
    const hasDigits = nextPhone.replace(/\D/g, '').length > 0
    const message = getPhoneFieldError(nextPhone, { requireValue: !hasDigits || force })
    setErrors((prev) => {
      const next = { ...prev }
      if (message) next.phone = message
      else delete next.phone
      return next
    })
  }

  const handlePhoneChange = (nextPhone: string) => {
    if (isSsoLocked) return
    setBusinessInfo({ ...businessInfo, phone: nextPhone })
    setPhoneTouched(true)
    syncPhoneError(nextPhone, true)
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="border-b border-nexoraRule pb-4 mb-4">
        <h2 className="font-sans text-xl md:text-2xl font-bold flex items-center gap-2.5 text-nexoraText">
          <Building2 className="text-nexoraBrand w-6 h-6" />
          {t('setup.title_step_1')}
        </h2>
        <p className="text-nexoraSubtle text-sm mt-1">{t('setup.desc_step_1')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* Left Column - Store Info & Logo */}
        <div className="lg:col-span-6 space-y-5 lg:border-r lg:border-nexoraRule lg:pr-8">
          <div className="flex justify-between items-end border-b border-nexoraRule pb-2">
            <h3 className="text-xs font-bold text-nexoraText uppercase tracking-wider">
              {t('setup.store_info_title')}
            </h3>
            <span className="text-[10px] text-red-500 font-bold bg-red-50 px-1.5 py-0.5 rounded">{t('setup.required_badge')}</span>
          </div>

          {/* Logo uploader */}
          <div>
            <label className="block text-[10px] font-bold text-nexoraText uppercase tracking-wider mb-2">{renderLabel(t('setup.store_logo'))}</label>
            <div className="flex items-center gap-3">
              {!isSsoLocked ? (
                <ImageFileInput
                  as="label"
                  className="flex h-12 w-12 cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-dashed border-nexoraBorder bg-nexoraCanvas p-1 shadow-sm transition hover:border-nexoraBrand"
                  onPick={(dataUrl) => {
                    setBusinessInfo({ ...businessInfo, logo: dataUrl })
                    if (errors.logo) setErrors({ ...errors, logo: '' })
                  }}
                  onPickFile={handleLogoFile}
                >
                  {businessInfo.logo ? (
                    <img src={businessInfo.logo} alt="Store logo" className="h-full w-full rounded-lg object-contain" />
                  ) : (
                    <Upload className="h-4 w-4 text-nexoraSubtle" />
                  )}
                </ImageFileInput>
              ) : (
                <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl border border-dashed border-slate-200 bg-slate-100 p-1 shadow-sm">
                  {businessInfo.logo ? (
                    <img src={businessInfo.logo} alt="Store logo" className="h-full w-full rounded-lg object-contain" />
                  ) : (
                    <Upload className="h-4 w-4 text-nexoraSubtle" />
                  )}
                </div>
              )}
              <span className="text-[10px] text-nexoraSubtle">{t('setup.logo_hint')}</span>
            </div>
            {errors.logo && <span className="text-xs text-red-500 mt-1 block">{t(errors.logo)}</span>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="flex items-center text-[10px] font-bold text-nexoraText uppercase tracking-wider mb-2">
                <span>{renderLabel(t('setup.store_name'))}</span>
                <div className="relative group inline-block ml-1.5 align-middle normal-case font-normal text-nexoraSubtle">
                  <HelpCircle className="w-3.5 h-3.5 hover:text-nexoraBrand cursor-help transition-colors" />
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-48 bg-black text-white text-[10px] p-2.5 rounded-lg shadow-xl z-50 text-center leading-normal">
                    {t('components.setup_wizard.steps.Step1BusinessInfo.enterTheLegalOr')}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1.5 border-4 border-transparent border-t-black"></div>
                  </div>
                </div>
              </label>
              <input
                type="text"
                disabled={isSsoLocked}
                placeholder={t('setup.store_name_placeholder')}
                className={`w-full border ${errors.name ? 'border-red-300 focus:border-red-500' : 'border-nexoraBorder focus:border-nexoraBrand'} ${isSsoLocked ? 'bg-slate-100 text-nexoraSubtle cursor-not-allowed border-slate-200' : 'bg-white'} rounded-lg px-4 py-2.5 text-sm text-nexoraText focus:outline-none placeholder-nexoraSubtle focus:ring-0 transition-all`}
                value={businessInfo.name}
                onChange={(e) => {
                  if (isSsoLocked) return
                  setBusinessInfo({ ...businessInfo, name: e.target.value })
                  if (errors.name) setErrors({ ...errors, name: '' })
                }}
              />
              {errors.name && <span className="text-xs text-red-500 mt-1 block">{t(errors.name)}</span>}
            </div>

            <div>
              <label className="block text-[10px] font-bold text-nexoraText uppercase tracking-wider mb-2">{renderLabel(t('setup.business_category'))}</label>
              <CustomSelect
                buttonClass="bg-white"
                disabled={isSsoLocked}
                value={businessInfo.industry}
                onChange={(e) => {
                  if (isSsoLocked) return
                  setBusinessInfo({ ...businessInfo, industry: e.target.value })
                }}
                options={[
                  { value: 'Nail Salon', label: t('setup.biz_type_nail') },
                  { value: 'Restaurant', label: t('setup.biz_type_restaurant') },
                  { value: 'Cafe', label: t('setup.biz_type_cafe') },
                  { value: 'Spa', label: t('setup.biz_type_spa') },
                  { value: 'Khác', label: t('setup.biz_type_other') }
                ]}
              />
            </div>
          </div>



          <div>
            <label className="flex items-center text-[10px] font-bold text-nexoraText uppercase tracking-wider mb-2">
              <span>{renderLabel(t('setup.store_address'))}</span>
              <div className="relative group inline-block ml-1.5 align-middle normal-case font-normal text-nexoraSubtle">
                <HelpCircle className="w-3.5 h-3.5 hover:text-nexoraBrand cursor-help transition-colors" />
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-48 bg-black text-white text-[10px] p-2.5 rounded-lg shadow-xl z-50 text-center leading-normal">
                  {t('components.setup_wizard.steps.Step1BusinessInfo.provideThePhysicalLocation')}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1.5 border-4 border-transparent border-t-black"></div>
                </div>
              </div>
            </label>
            <div className="relative">
              <MapPin className="absolute left-3.5 top-3.5 w-4 h-4 text-nexoraSubtle z-10 pointer-events-none" />
              <input
                type="text"
                disabled={isSsoLocked}
                placeholder={t('setup.store_address_placeholder')}
                className={`w-full border ${errors.address ? 'border-red-300 focus:border-red-500' : 'border-nexoraBorder focus:border-nexoraBrand'} ${isSsoLocked ? 'bg-slate-100 text-nexoraSubtle cursor-not-allowed border-slate-200' : 'bg-white'} rounded-lg pl-11 pr-4 py-2.5 text-sm text-nexoraText focus:outline-none placeholder-nexoraSubtle focus:ring-0 transition-all`}
                value={businessInfo.address}
                onChange={(e) => {
                  if (isSsoLocked) return
                  setBusinessInfo({ ...businessInfo, address: e.target.value })
                  if (errors.address) setErrors({ ...errors, address: '' })
                }}
              />
            </div>
            {errors.address && <span className="text-xs text-red-500 mt-1 block">{t(errors.address)}</span>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-nexoraText uppercase tracking-wider mb-2">{renderLabel(t('setup.store_phone'))}</label>
              <div className="flex rounded-lg shadow-sm">
                <CountryCodeSelect
                  value={phoneParsed.countryCode}
                  onChange={(newCode) => {
                    const reFormatted = formatNationalNumber(phoneParsed.nationalNumber, newCode)
                    handlePhoneChange(`${newCode} ${reFormatted}`.trim())
                  }}
                  disabled={isSsoLocked}
                />
                <input
                  type="text"
                  disabled={isSsoLocked}
                  placeholder={t('components.setup_wizard.steps.Step1BusinessInfo.phPhone')}
                  className={`w-full h-10 border border-l-0 ${errors.phone ? 'border-red-300 focus:border-red-500' : 'border-nexoraBorder focus:border-nexoraBrand'} ${isSsoLocked ? 'bg-slate-100 text-nexoraSubtle cursor-not-allowed border-slate-200' : 'bg-white'} rounded-r-lg px-4 text-sm text-nexoraText focus:outline-none placeholder-nexoraSubtle focus:ring-0 transition-all min-w-0`}
                  value={formatNationalNumber(phoneParsed.nationalNumber, phoneParsed.countryCode)}
                  onChange={(e) => {
                    const formatted = formatNationalNumber(e.target.value, phoneParsed.countryCode)
                    handlePhoneChange(`${phoneParsed.countryCode} ${formatted}`.trim())
                  }}
                  onBlur={() => {
                    setPhoneTouched(true)
                    syncPhoneError(businessInfo.phone, true)
                  }}
                />
              </div>
              {errors.phone && <span className="text-xs text-red-500 mt-1 block">{t(errors.phone)}</span>}
            </div>

            <div>
              <label className="block text-[10px] font-bold text-nexoraText uppercase tracking-wider mb-2">{renderLabel(t('setup.store_website'))}</label>
              <div className="relative">
                <Globe className="absolute left-3.5 top-3.5 w-4 h-4 text-nexoraSubtle z-10 pointer-events-none" />
                <input
                  type="url"
                  disabled={isSsoLocked}
                  placeholder={t('components.setup_wizard.steps.Step1BusinessInfo.phWebsite')}
                  className={`w-full border ${errors.website ? 'border-red-300 focus:border-red-500' : 'border-nexoraBorder focus:border-nexoraBrand'} ${isSsoLocked ? 'bg-slate-100 text-nexoraSubtle cursor-not-allowed border-slate-200' : 'bg-white'} rounded-lg pl-11 pr-4 py-2.5 text-sm text-nexoraText focus:outline-none placeholder-nexoraSubtle focus:ring-0 transition-all`}
                  value={businessInfo.website}
                  onChange={(e) => {
                    if (isSsoLocked) return
                    setBusinessInfo({ ...businessInfo, website: e.target.value })
                    if (errors.website) setErrors({ ...errors, website: '' })
                  }}
                />
              </div>
              {errors.website && <span className="text-xs text-red-500 mt-1 block">{t(errors.website)}</span>}
            </div>
          </div>

        </div>

        {/* Right Column - Review Routing Links */}
        <div className="lg:col-span-6 space-y-5">
          <h3 className="text-xs font-bold text-nexoraText uppercase tracking-wider border-b border-nexoraRule pb-2">
            {t('setup.review_routing_title')}
          </h3>

          {/* Routing explainer card */}
          <div className="p-4.5 rounded-xl border border-nexoraBrandSoft bg-nexoraBrandSoft/40 text-xs text-nexoraText flex gap-3 leading-relaxed shadow-sm">
            <ShieldCheck className="w-5 h-5 text-nexoraBrand shrink-0" />
            <div>
              {renderTextWithGoldStars(t('setup.review_routing_policy'))}
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-nexoraText uppercase tracking-wider mb-2">{renderLabel(t('setup.google_review_link'))}</label>
            <input
              type="url"
              placeholder={t('components.setup_wizard.steps.Step1BusinessInfo.phGoogleReviewUrl')}
              className={`w-full bg-white border ${errors.googleReview ? 'border-red-300 focus:border-red-500' : 'border-nexoraBorder focus:border-nexoraBrand'} rounded-lg px-4 py-2.5 text-sm text-nexoraText focus:outline-none placeholder-nexoraSubtle focus:ring-0 transition-all`}
              value={reviewLinks.googleReview}
              onChange={(e) => {
                setReviewLinks({ ...reviewLinks, googleReview: e.target.value })
                if (errors.googleReview) setErrors({ ...errors, googleReview: '' })
              }}
            />
            {errors.googleReview && <span className="text-xs text-red-500 mt-1 block">{t(errors.googleReview)}</span>}
          </div>

          <div>
            <label className="block text-[10px] font-bold text-nexoraText uppercase tracking-wider mb-2">{renderLabel(t('setup.yelp_review_link'))}</label>
            <input
              type="url"
              placeholder={t('components.setup_wizard.steps.Step1BusinessInfo.phYelpUrl')}
              className={`w-full bg-white border ${errors.yelpReview ? 'border-red-300 focus:border-red-500' : 'border-nexoraBorder focus:border-nexoraBrand'} rounded-lg px-4 py-2.5 text-sm text-nexoraText focus:outline-none placeholder-nexoraSubtle focus:ring-0 transition-all`}
              value={reviewLinks.yelpReview}
              onChange={(e) => {
                setReviewLinks({ ...reviewLinks, yelpReview: e.target.value })
                if (errors.yelpReview) setErrors({ ...errors, yelpReview: '' })
              }}
            />
            {errors.yelpReview && <span className="text-xs text-red-500 mt-1 block">{t(errors.yelpReview)}</span>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-nexoraText uppercase tracking-wider mb-2">{renderLabel(t('setup.facebook_link'))}</label>
              <input
                type="url"
                placeholder={t('components.setup_wizard.steps.Step1BusinessInfo.phFacebookUrl')}
                className="w-full bg-white border border-nexoraBorder focus:border-nexoraBrand rounded-lg px-4 py-2.5 text-sm text-nexoraText focus:outline-none placeholder-nexoraSubtle focus:ring-0 transition-all"
                value={reviewLinks.facebookReview}
                onChange={(e) => setReviewLinks({ ...reviewLinks, facebookReview: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-nexoraText uppercase tracking-wider mb-2">{renderTextWithGoldStars(t('setup.feedback_email'))}</label>
              <input
                type="email"
                placeholder={t('components.setup_wizard.steps.Step1BusinessInfo.phManagerEmail')}
                className={`w-full bg-white border ${errors.feedbackEmail ? 'border-red-300 focus:border-red-500' : 'border-nexoraBorder focus:border-nexoraBrand'} rounded-lg px-4 py-2.5 text-sm text-nexoraText focus:outline-none placeholder-nexoraSubtle focus:ring-0 transition-all`}
                value={reviewLinks.feedbackEmail}
                onChange={(e) => {
                  setReviewLinks({ ...reviewLinks, feedbackEmail: e.target.value })
                  if (errors.feedbackEmail) setErrors({ ...errors, feedbackEmail: '' })
                }}
              />
              {errors.feedbackEmail && <span className="text-xs text-red-500 mt-1 block">{t(errors.feedbackEmail)}</span>}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
