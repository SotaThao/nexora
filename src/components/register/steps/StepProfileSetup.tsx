import React from 'react'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import CountryCodeSelect, { formatNationalNumber } from '../../CountryCodeSelect'

export default function StepProfileSetup({
  fullName, setFullName, fullNameLocked,
  phone, setPhone, phoneLocked,
  phoneParsed,
  setCurrentStep,
  handleProfileSetupSubmit,
  errors,
  t,
  renderLabel,
  showBackButton = true,
}) {
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

        {/* Action Buttons */}
        <div className="pt-4 flex flex-col sm:flex-row gap-3">
          {showBackButton && (
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className="w-full min-h-11 py-2.5 border border-nexoraBorder hover:bg-nexoraCanvas text-nexoraSubtle hover:text-nexoraText font-semibold text-xs uppercase tracking-wider rounded-lg flex items-center justify-center gap-1.5 transition-all"
            >
              <ArrowLeft className="w-4 h-4" /> {t('common.back')}
            </button>
          )}
          <button
            type="submit"
            disabled={
              !fullName.trim() ||
              !phone.trim() ||
              (!phoneLocked && phoneParsed?.nationalNumber?.replace(/\D/g, '').length < 7)
            }
            className="w-full min-h-11 py-2.5 bg-gradient-to-r from-nexoraElectric to-nexoraViolet hover:opacity-90 text-white font-extrabold text-xs uppercase tracking-wider rounded-lg flex items-center justify-center gap-1.5 shadow-[0_4px_12px_rgba(43,89,255,0.25)] transition-all disabled:opacity-50"
          >
            {t('common.next')} <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  )
}
