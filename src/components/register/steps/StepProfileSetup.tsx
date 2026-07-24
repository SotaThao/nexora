import React, { useMemo } from 'react'
import { Upload, X, ArrowLeft, ArrowRight } from 'lucide-react'
import ImageFileInput from '../../ui/ImageFileInput'
import CountryCodeSelect, { formatNationalNumber } from '../../CountryCodeSelect'
import { PayoutLogos, getSortedPayoutMethods } from '../constants'
import { useSupportedPaymentMethods } from '../../../data/hooks/useSupportedPaymentMethods'
import ToggleSwitch from '../../ui/ToggleSwitch'

export default function StepProfileSetup({
  fullName, setFullName, fullNameLocked,
  phone, setPhone, phoneLocked,
  phoneParsed,
  avatar, setAvatar,
  handleAvatarFileChange,
  payouts,
  handleToggleMethod,
  handleEditPayoutAccount,
  generatedStaffId,
  setCurrentStep,
  handleProfileSetupSubmit,
  errors,
  t,
  currentLanguage,
  renderLabel,
  onBack,
}) {
  const { data: supportedPaymentMethods } = useSupportedPaymentMethods()
  const displayPayoutMethods = useMemo(
    () => getSortedPayoutMethods(supportedPaymentMethods),
    [supportedPaymentMethods]
  )
  return (
    <div className="p-6 sm:p-8 animate-fadeIn max-w-xl mx-auto">
      <div className="text-center">
        <h3 className="text-lg font-bold text-nexoraText">
          {t('components.register.steps.StepProfileSetup.personalProfileSetup')}
        </h3>
        <p className="text-xs text-nexoraSubtle mt-1">
          {t('components.register.steps.StepProfileSetup.configureYourDisplayDetails')}
        </p>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); handleProfileSetupSubmit(); }} className="space-y-4 mt-6">
        {/* Avatar section */}
        <div className="flex items-center gap-4 border-b border-nexoraBorder pb-4">
          <div className="relative">
            {avatar ? (
              <>
                <img src={avatar} alt="" className="h-16 w-16 rounded-full object-cover border border-nexoraBorder ring-2 ring-nexoraBrand/20" />
                <button
                  type="button"
                  onClick={() => setAvatar(null)}
                  className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 hover:bg-red-600 text-white transition shadow duration-150 cursor-pointer"
                  title={t('common.remove_photo')}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </>
            ) : (
              <div className="h-16 w-16 rounded-full bg-nexoraCanvas flex items-center justify-center font-black text-nexoraSubtle text-lg border border-nexoraBorder">
                {fullName.trim().charAt(0) || 'N'}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <ImageFileInput
                as="label"
                className="h-9 px-4 rounded-lg bg-gradient-to-r from-nexoraElectric to-nexoraViolet hover:opacity-90 text-white flex items-center justify-center gap-1.5 cursor-pointer text-xs font-bold transition shadow-sm"
                onPickFile={handleAvatarFileChange}
              >
                <Upload className="h-3.5 w-3.5" />
                <span>{t('common.upload_photo')}</span>
              </ImageFileInput>
            </div>
            <span className="text-[10px] text-nexoraSubtle">
              {t('components.register.steps.StepProfileSetup.acceptedFormatsJpgPng')}
            </span>
            {errors?.avatar && (
              <span className="text-[10px] text-red-500 font-medium">{t(errors.avatar)}</span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Full Name */}
          <div>
            <label className="block text-[10px] font-bold text-nexoraText uppercase tracking-wider mb-2">
              {renderLabel(t('components.register.steps.StepProfileSetup.fullName'))}
            </label>
            <input
              type="text"
              placeholder={t('components.register.steps.StepProfileSetup.phFullName')}
              required
              disabled={fullNameLocked}
              className={`w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none transition-all ${
                fullNameLocked
                  ? 'bg-nexoraCanvas text-nexoraSubtle cursor-not-allowed border-nexoraBorder'
                  : `bg-white text-nexoraText ${errors?.fullName ? 'border-red-300 focus:border-red-500' : 'border-nexoraBorder focus:border-nexoraBrand'}`
              }`}
              value={fullName}
              onChange={(e) => {
                if (fullNameLocked) return
                setFullName(e.target.value)
              }}
            />
            {errors?.fullName && (
              <span className="text-[10px] text-red-500 mt-1 block">{t(errors.fullName)}</span>
            )}
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-[10px] font-bold text-nexoraText uppercase tracking-wider mb-2">
              {renderLabel(t('components.register.steps.StepProfileSetup.phoneNumber'))}
            </label>
            <div className="flex rounded-lg shadow-sm">
              <CountryCodeSelect
                value={phoneParsed.countryCode}
                disabled={phoneLocked}
                onChange={(newCode) => {
                  if (phoneLocked) return
                  const reFormatted = formatNationalNumber(phoneParsed.nationalNumber, newCode)
                  setPhone(`${newCode} ${reFormatted}`.trim())
                }}
              />
              <input
                type="text"
                disabled={phoneLocked}
                className={`h-10 w-full border border-l-0 rounded-r-lg px-4 text-sm focus:outline-none transition-all min-w-0 ${
                  phoneLocked
                    ? 'bg-nexoraCanvas text-nexoraSubtle cursor-not-allowed border-nexoraBorder'
                    : `bg-white text-nexoraText ${errors?.phone ? 'border-red-300 focus:border-red-500' : 'border-nexoraBorder focus:border-nexoraBrand'}`
                }`}
                value={formatNationalNumber(phoneParsed.nationalNumber, phoneParsed.countryCode)}
                onChange={(e) => {
                  if (phoneLocked) return
                  const formatted = formatNationalNumber(e.target.value, phoneParsed.countryCode)
                  setPhone(`${phoneParsed.countryCode} ${formatted}`.trim())
                }}
                placeholder={t('components.register.steps.StepProfileSetup.phPhone')}
                required
              />
            </div>
            {errors?.phone && (
              <span className="text-[10px] text-red-500 mt-1 block">{t(errors.phone)}</span>
            )}
          </div>
        </div>

        {/* Payout methods (optional — leave everything off/blank to skip) */}
        <div className="border-t border-nexoraBorder pt-4">
          <h4 className="text-xs font-bold text-nexoraText uppercase tracking-wider">
            {t('components.register.steps.StepPayoutSetup.payoutConfiguration')}
          </h4>
          <p className="text-[10px] text-nexoraSubtle mt-1 mb-3">
            {t('components.register.steps.StepPayoutSetup.enableAndConfigureYour')}
          </p>

          <div className="space-y-1 divide-y divide-nexoraBorder max-h-[380px] overflow-y-auto pr-1">
            {displayPayoutMethods.filter(method => method.key !== 'bankwire').map(method => {
              const cfg = payouts[method.key] || { enabled: false, value: '' }
              return (
                <div key={method.key} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <ToggleSwitch
                      checked={cfg.enabled}
                      onChange={() => handleToggleMethod(method.key)}
                      activeColor="bg-nexoraBrand"
                      inactiveColor="bg-slate-200"
                    />
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="h-8 w-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                        {PayoutLogos[method.key]}
                      </span>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-nexoraText">{method.label}</div>
                        {cfg.value ? (
                          <div className="text-[10px] text-nexoraMuted font-mono mt-0.5 truncate max-w-[150px]">
                            {cfg.value}
                          </div>
                        ) : (
                          <div className="text-[10px] text-nexoraSubtle italic mt-0.5">
                            {t('components.register.steps.StepPayoutSetup.notConfigured')}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleEditPayoutAccount(method.key)}
                    className="flex items-center gap-1 text-[10px] font-bold text-nexoraBrand hover:underline transition shrink-0 ml-2"
                  >
                    <span>{t('components.register.steps.StepPayoutSetup.configure')}</span>
                  </button>
                </div>
              )
            })}
          </div>

          {generatedStaffId && (
            <div className="mt-3 p-4 bg-slate-50 rounded-xl border border-nexoraBorder flex justify-between items-center text-xs">
              <div className="flex items-center gap-2">
                <span className="h-7 w-7 rounded-lg bg-nexoraBrand/10 border border-nexoraBrand/20 flex items-center justify-center shrink-0">
                  <img src="/assets/nexora-logo.png" alt="Nexora" className="h-4 w-4 object-contain" />
                </span>
                <span className="text-nexoraSubtle font-bold">{t('components.register.steps.StepPayoutSetup.nexoraId')}</span>
              </div>
              <span className="text-nexoraText font-extrabold font-mono bg-white border border-nexoraBorder px-2.5 py-1 rounded-lg">
                {generatedStaffId}
              </span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="pt-4 flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={() => (onBack ? onBack() : setCurrentStep(1))}
            className="w-full min-h-11 py-2.5 border border-nexoraBorder hover:bg-nexoraCanvas text-nexoraSubtle hover:text-nexoraText font-semibold text-xs uppercase tracking-wider rounded-lg flex items-center justify-center gap-1.5 transition-all"
          >
            <ArrowLeft className="w-4 h-4" /> {t('common.back')}
          </button>
          <button
            type="submit"
            disabled={
              !fullName.trim() ||
              !phone.trim() ||
              (!phoneLocked && phoneParsed?.nationalNumber?.replace(/\D/g, '').length < 7)
            }
            className="w-full min-h-11 py-2.5 bg-gradient-to-r from-nexoraElectric to-nexoraViolet hover:opacity-90 text-white font-extrabold text-xs uppercase tracking-wider rounded-lg flex items-center justify-center gap-1.5 shadow-[0_4px_12px_rgba(43,89,255,0.25)] transition-all disabled:opacity-50"
          >
            {t('components.register.steps.StepPayoutSetup.saveAndActivate')} <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  )
}
