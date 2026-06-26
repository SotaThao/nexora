import React from 'react'
import { Upload, X, ArrowLeft, ArrowRight } from 'lucide-react'
import ImageFileInput from '../../ui/ImageFileInput'
import CountryCodeSelect, { formatNationalNumber, isPhoneValid } from '../../CountryCodeSelect'

export default function StepProfileSetup({
  nickname, setNickname,
  fullName, setFullName,
  phone, setPhone,
  phoneParsed,
  bio, setBio,
  avatar, setAvatar,
  handleAvatarFileChange,
  position, setPosition,
  email,
  generatedStaffId,
  setCurrentStep,
  handleProfileSetupSubmit,
  errors,
  t,
  currentLanguage,
  renderLabel,
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
                {nickname.charAt(0) || 'N'}
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
              className="w-full bg-white border border-nexoraBorder focus:border-nexoraBrand rounded-lg px-4 py-2.5 text-sm text-nexoraText focus:outline-none transition-all"
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value)
                if (!nickname) setNickname(e.target.value.split(' ')[0] + '.')
              }}
            />
          </div>

          {/* Display Nickname */}
          <div>
            <label className="block text-[10px] font-bold text-nexoraText uppercase tracking-wider mb-2">
              {renderLabel(t('components.register.steps.StepProfileSetup.displayNickname'))}
            </label>
            <input
              type="text"
              placeholder={t('components.register.steps.StepProfileSetup.phNickname')}
              required
              className="w-full bg-white border border-nexoraBorder focus:border-nexoraBrand rounded-lg px-4 py-2.5 text-sm text-nexoraText focus:outline-none transition-all"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Phone Number */}
          <div>
            <label className="block text-[10px] font-bold text-nexoraText uppercase tracking-wider mb-2">
              {renderLabel(t('components.register.steps.StepProfileSetup.phoneNumber'))}
            </label>
            <div className="flex rounded-lg shadow-sm">
              <CountryCodeSelect
                value={phoneParsed.countryCode}
                onChange={(newCode) => {
                  const reFormatted = formatNationalNumber(phoneParsed.nationalNumber, newCode)
                  setPhone(`${newCode} ${reFormatted}`.trim())
                }}
              />
              <input
                type="text"
                className="h-10 w-full bg-white border border-l-0 border-nexoraBorder focus:border-nexoraBrand rounded-r-lg px-4 text-sm text-nexoraText focus:outline-none transition-all min-w-0"
                value={formatNationalNumber(phoneParsed.nationalNumber, phoneParsed.countryCode)}
                onChange={(e) => {
                  const formatted = formatNationalNumber(e.target.value, phoneParsed.countryCode)
                  setPhone(`${phoneParsed.countryCode} ${formatted}`.trim())
                }}
                placeholder={t('components.register.steps.StepProfileSetup.phPhone')}
                required
              />
            </div>
          </div>

          {/* Email Address (View-Only) */}
          <div>
            <label className="block text-[10px] font-bold text-nexoraText uppercase tracking-wider mb-2">
              {t('components.register.steps.StepProfileSetup.emailAddress')}
            </label>
            <input
              type="email"
              disabled
              className="w-full bg-nexoraCanvas border border-nexoraBorder rounded-lg px-4 py-2.5 text-sm text-nexoraSubtle cursor-not-allowed"
              value={email}
            />
          </div>
        </div>

        {/* Role / Specialty */}
        <div>
          <label className="block text-[10px] font-bold text-nexoraText uppercase tracking-wider mb-2">
            {t('components.register.steps.StepProfileSetup.roleSpeciality')}
          </label>
          <input
            type="text"
            placeholder={t('components.register.steps.StepProfileSetup.phPosition')}
            className="w-full bg-white border border-nexoraBorder focus:border-nexoraBrand rounded-lg px-4 py-2.5 text-sm text-nexoraText focus:outline-none transition-all"
            value={position}
            onChange={(e) => setPosition(e.target.value)}
          />
        </div>

        {/* Short Bio */}
        <div>
          <label className="block text-[10px] font-bold text-nexoraText uppercase tracking-wider mb-2">
            {t('components.register.steps.StepProfileSetup.shortBioShowsOn')}
          </label>
          <textarea
            className="w-full bg-white border border-nexoraBorder focus:border-nexoraBrand rounded-lg p-3 text-sm text-nexoraText focus:outline-none transition-all min-h-[70px]"
            placeholder={t('components.register.steps.StepProfileSetup.phBio')}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
          />
        </div>

        {/* Action Buttons */}
        <div className="pt-4 flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={() => setCurrentStep(1)}
            className="w-full min-h-11 py-2.5 border border-nexoraBorder hover:bg-nexoraCanvas text-nexoraSubtle hover:text-nexoraText font-semibold text-xs uppercase tracking-wider rounded-lg flex items-center justify-center gap-1.5 transition-all"
          >
            <ArrowLeft className="w-4 h-4" /> {t('common.back')}
          </button>
          <button
            type="submit"
            disabled={!fullName.trim() || !nickname.trim() || !phone.trim() || !isPhoneValid(phone)}
            className="w-full min-h-11 py-2.5 bg-gradient-to-r from-nexoraElectric to-nexoraViolet hover:opacity-90 text-white font-extrabold text-xs uppercase tracking-wider rounded-lg flex items-center justify-center gap-1.5 shadow-[0_4px_12px_rgba(43,89,255,0.25)] transition-all disabled:opacity-50"
          >
            {t('common.next')} <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  )
}
