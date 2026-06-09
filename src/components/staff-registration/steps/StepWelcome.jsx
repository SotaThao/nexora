import React, { useState } from 'react'
import {
  Check, ShieldCheck, AlertCircle, ArrowLeft,
  CheckCircle2, Building, Plus, Loader2, QrCode, XCircle,
  Eye, EyeOff, Lock, Mail
} from 'lucide-react'

export default function StepWelcome({
  inviteData,
  businessName = '',
  isInviteLoading = false,
  isInviteError = false,
  joinPath, setJoinPath,
  searchId,
  linkedProfile,
  searchError,
  nexoraStatus,
  fullName, position, phone, email,
  currentLanguage, t,
  setStep,
  setSearchId, setLinkedProfile, setSearchError,
  handleSearchIdChange,
  handleScanQr,
  handleLinkExistingProfile,
  onReturnToMerchant,
  MOCK_NEXORA_STAFF_PROFILES,
  linkEmail, setLinkEmail,
  linkPassword, setLinkPassword,
  linkError,
  isLinkLoggedIn,
  handleLinkLogin,
  handleLinkDecline,
  isDemoToolsEnabled = false,
}) {
  const [showLinkPassword, setShowLinkPassword] = useState(false)

  // Token-based invite: while metadata loads or the token is invalid/expired,
  // show a dedicated state instead of an empty invitation card.
  if (isInviteLoading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
        <Loader2 className="h-7 w-7 text-nexoraBrand animate-spin" />
        <p className="text-xs text-nexoraMuted font-semibold uppercase tracking-wider">
          {currentLanguage === 'vi' ? 'Đang tải lời mời…' : 'Loading invitation…'}
        </p>
      </div>
    )
  }

  if (isInviteError) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
        <div className="h-14 w-14 rounded-full bg-nexoraDanger/10 flex items-center justify-center text-nexoraDanger">
          <XCircle className="h-7 w-7" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-black text-nexoraText tracking-tight">
            {currentLanguage === 'vi' ? 'Lời mời không hợp lệ' : 'Invitation Not Valid'}
          </h3>
          <p className="text-xs text-nexoraMuted max-w-xs mx-auto leading-relaxed">
            {currentLanguage === 'vi'
              ? 'Liên kết lời mời này không hợp lệ hoặc đã hết hạn. Vui lòng liên hệ tiệm để được mời lại.'
              : 'This invitation link is invalid or has expired. Please contact the salon to request a new invite.'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* A. If merchant sent a direct prefilled invite */}
      {inviteData?.name ? (
        <div className="space-y-6 py-4">
          <div className="p-5 border border-nexoraBrand/15 rounded-2xl bg-nexoraBrandSoft/20 text-center space-y-4">
            <div className="h-14 w-14 rounded-full bg-nexoraBrandSoft/60 flex items-center justify-center mx-auto text-nexoraBrand">
              <Building className="h-7 w-7" />
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase text-nexoraBrand bg-nexoraBrandSoft/80 px-2.5 py-0.5 rounded-full">
                {t('staff_invite.invite_from_biz')}
              </span>
              <h3 className="text-lg font-black text-nexoraText tracking-tight mt-2">
                {businessName}
              </h3>
              <p className="text-xs text-nexoraMuted max-w-sm mx-auto leading-relaxed mt-1">
                {t('staff_invite.invite_desc')}
              </p>
            </div>

            <div className="p-3 border border-nexoraBorder rounded-xl bg-white text-left text-xs max-w-xs mx-auto space-y-1">
              <div className="flex justify-between text-nexoraMuted">
                <span>Invited Name:</span>
                <strong className="text-nexoraText">{fullName}</strong>
              </div>
              <div className="flex justify-between text-nexoraMuted">
                <span>Assigned Role:</span>
                <strong className="text-nexoraText">{position}</strong>
              </div>
              {email && (
                <div className="flex justify-between text-nexoraMuted">
                  <span>Invited Email:</span>
                  <strong className="text-nexoraText font-mono">{email}</strong>
                </div>
              )}
              {phone && (
                <div className="flex justify-between text-nexoraMuted">
                  <span>Invited Phone:</span>
                  <strong className="text-nexoraText font-mono">{phone}</strong>
                </div>
              )}
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <button
              onClick={onReturnToMerchant}
              className="w-full h-11 border border-nexoraBorder text-nexoraMuted font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-nexoraSurfaceMuted transition"
            >
              {t('components.staff_registration.steps.StepWelcome.declineRequest')}
            </button>

            <button
              onClick={() => setStep(1)}
              className="w-full h-11 bg-nexoraBrand hover:bg-nexoraBrandDark text-white font-black text-xs uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-1.5 shadow-md"
            >
              {t('staff_invite.accept_invite')} <AlertCircle className="h-4 w-4" />
            </button>
          </div>

          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => {
                setJoinPath('link')
                setSearchId('')
                setLinkedProfile(null)
                setSearchError('')
              }}
              className="text-xs text-nexoraBrand font-bold hover:underline"
            >
              {t('staff_invite.already_have_id')}
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* B. Self-serve Join selection screen */}
          {joinPath === null && (
            <div className="space-y-6 py-4">
              <div className="bg-gradient-to-br from-nexoraWarning/10 to-nexoraBrandSoft/20 border-2 border-nexoraWarning/20 rounded-2xl p-6 text-center space-y-3 relative overflow-hidden shadow-sm">
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-nexoraWarning to-nexoraBrand animate-pulse" />
                <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-nexoraWarning to-nexoraBrand flex items-center justify-center text-white mx-auto shadow-lg border border-nexoraWarning/30">
                  <Building className="h-6 w-6" />
                </div>
                <div className="space-y-1.5">
                  <span className="text-[10px] font-black uppercase text-nexoraWarning tracking-widest block font-sans">
                    {t('components.staff_registration.steps.StepWelcome.salonNetworkInvitation')}
                  </span>
                  <h3 className="text-xl font-black text-nexoraText tracking-tight leading-snug">
                    {businessName}
                  </h3>
                  <p className="text-xs text-nexoraMuted max-w-sm mx-auto leading-relaxed font-medium">
                    {t('components.staff_registration.steps.StepWelcome.youHaveBeenInvited')}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* Card 1: Existing Account */}
                <button
                  onClick={() => {
                    setJoinPath('link')
                    setSearchId('')
                    setLinkedProfile(null)
                    setSearchError('')
                  }}
                  className="p-5 border border-nexoraBorder rounded-2xl bg-white hover:border-nexoraBrand hover:bg-nexoraBrandSoft/10 transition-all text-left space-y-3 shadow-sm hover:shadow-md group focus:outline-none"
                >
                  <div className="h-10 w-10 rounded-xl bg-nexoraBrandSoft/60 text-nexoraBrand flex items-center justify-center group-hover:bg-nexoraBrandSoft transition-colors">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <strong className="text-xs font-black text-nexoraText block">
                      {t('components.staff_registration.steps.StepWelcome.iAlreadyHaveAn')}
                    </strong>
                    <span className="text-[10px] text-nexoraSubtle block mt-0.5 leading-normal">
                      {t('components.staff_registration.steps.StepWelcome.useYourExistingVlinkpay')}
                    </span>
                  </div>
                </button>

                {/* Card 2: New Registration */}
                <button
                  onClick={() => {
                    setJoinPath('register')
                    setStep(1)
                  }}
                  className="p-5 border border-nexoraBorder rounded-2xl bg-white hover:border-nexoraBrand hover:bg-nexoraBrandSoft/10 transition-all text-left space-y-3 shadow-sm hover:shadow-md group focus:outline-none"
                >
                  <div className="h-10 w-10 rounded-xl bg-nexoraBrandSoft text-nexoraBrand flex items-center justify-center group-hover:bg-nexoraBrandSoft transition-colors">
                    <Plus className="h-5 w-5" />
                  </div>
                  <div>
                    <strong className="text-xs font-black text-nexoraText block">
                      {t('components.staff_registration.steps.StepWelcome.registerAccount')}
                    </strong>
                    <span className="text-[10px] text-nexoraSubtle block mt-0.5 leading-normal">
                      {t('components.staff_registration.steps.StepWelcome.registerANewAccount')}
                    </span>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* C. Option A: VLINKPAY ID Verification / Login screen */}
          {joinPath === 'link' && !isLinkLoggedIn && (
            <div className="space-y-5 py-2 animate-fadeIn">
              <div className="flex items-center gap-2 border-b border-nexoraRule pb-2">
                <button
                  onClick={() => {
                    setJoinPath(null)
                  }}
                  className="p-1 hover:bg-nexoraSurfaceMuted rounded-lg text-nexoraMuted transition"
                  title="Back"
                  aria-label="Back"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <h3 className="text-sm font-extrabold text-nexoraText uppercase tracking-wide font-sans">
                  {t('components.staff_registration.steps.StepWelcome.linkAccountLogin')}
                </h3>
              </div>

              <form onSubmit={handleLinkLogin} className="space-y-4">
                <p className="text-xs text-nexoraSubtle font-medium leading-relaxed">
                  {t('components.staff_registration.steps.StepWelcome.signInToYour')}
                </p>

                {/* Email field */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-nexoraSubtle tracking-wider flex items-center gap-1">
                    <Mail className="h-3.5 w-3.5" /> Email
                  </label>
                  <input
                    type="email"
                    placeholder={t('components.staff_registration.steps.StepWelcome.phExampleEmail')}
                    className="h-10 w-full rounded-lg border border-nexoraBorder px-3 text-xs outline-none focus:border-nexoraBrand focus:ring-2 focus:ring-nexoraBrand/20 font-bold transition-all"
                    value={linkEmail}
                    onChange={(e) => setLinkEmail(e.target.value)}
                  />
                </div>

                {/* Password field */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-nexoraSubtle tracking-wider flex items-center gap-1">
                    <Lock className="h-3.5 w-3.5" /> {t('components.staff_registration.steps.StepWelcome.password')}
                  </label>
                  <div className="relative">
                    <input
                      type={showLinkPassword ? 'text' : 'password'}
                      placeholder={t('components.staff_registration.steps.StepWelcome.phPassword')}
                      className="h-10 w-full rounded-lg border border-nexoraBorder pl-3 pr-10 text-xs outline-none focus:border-nexoraBrand focus:ring-2 focus:ring-nexoraBrand/20 font-bold transition-all"
                      value={linkPassword}
                      onChange={(e) => setLinkPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowLinkPassword(!showLinkPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-nexoraSubtle hover:text-nexoraBrand transition"
                    >
                      {showLinkPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {linkError && (
                  <p className="text-xs font-bold text-nexoraDanger flex items-center gap-1 bg-nexoraDanger/10 border border-nexoraDanger/20 rounded-lg p-2.5 animate-shake">
                    <AlertCircle className="h-4 w-4 shrink-0" /> {linkError}
                  </p>
                )}

                {isDemoToolsEnabled && (
                  <div className="p-3 border border-nexoraWarning/20 bg-nexoraWarning/10 rounded-xl text-[11px] text-nexoraWarning leading-normal font-sans">
                    <span className="font-bold block uppercase tracking-wider text-[9px] text-nexoraWarning mb-0.5">
                      {t('components.staff_registration.steps.StepWelcome.demoAccountTip')}
                    </span>
                    Email: <code className="font-bold font-mono">lisa@example.com</code> / {t('components.staff_registration.steps.StepWelcome.password')}: <code className="font-bold font-mono">password123</code> (hoặc thợ khác đã tạo)
                  </div>
                )}

                <div className="pt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setJoinPath(null)}
                    className="w-full h-10 border border-nexoraBorder text-nexoraMuted font-bold text-xs uppercase tracking-wider rounded-lg hover:bg-nexoraSurfaceMuted transition"
                  >
                    {t('components.staff_registration.steps.StepWelcome.back')}
                  </button>

                  <button
                    type="submit"
                    className="w-full h-10 bg-nexoraBrand hover:bg-nexoraBrandDark text-white font-black text-xs uppercase tracking-wider rounded-lg transition shadow-md flex items-center justify-center gap-1.5"
                  >
                    {t('components.staff_registration.steps.StepWelcome.loginAndVerify')}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* D. Option A: Preview & Confirm Link screen */}
          {joinPath === 'link' && isLinkLoggedIn && linkedProfile && (
            <div className="space-y-5 py-2 animate-fadeIn">
              <div className="flex items-center gap-2 border-b border-nexoraRule pb-2">
                <h3 className="text-sm font-extrabold text-nexoraText uppercase tracking-wide font-sans">
                  {t('components.staff_registration.steps.StepWelcome.confirmSalonConnection')}
                </h3>
              </div>

              <div className="space-y-4">
                <p className="text-xs text-nexoraSubtle font-medium leading-relaxed">
                  {t('components.staff_registration.steps.StepWelcome.pleaseReviewYourPersonal')}
                </p>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {/* Personal Profile Card */}
                  <div className="border border-nexoraBrand/15 rounded-2xl bg-nexoraBrandSoft/10 p-4 space-y-3">
                    <span className="text-[9px] font-black uppercase text-nexoraBrand bg-nexoraBrandSoft/80 px-2 py-0.5 rounded-full inline-block">
                      {t('components.staff_registration.steps.StepWelcome.personalProfile')}
                    </span>
                    <div className="flex items-center gap-3 pt-1">
                      {linkedProfile.avatar ? (
                        <img src={linkedProfile.avatar} alt="" className="h-10 w-10 rounded-full object-cover border border-nexoraBrand/20 shadow-sm" />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-nexoraBrandSoft/60 flex items-center justify-center font-black text-nexoraBrand text-xs">
                          {linkedProfile.nickname?.charAt(0) || linkedProfile.fullName?.charAt(0) || 'U'}
                        </div>
                      )}
                      <div>
                        <h4 className="text-xs font-extrabold text-nexoraText flex items-center gap-1 font-sans">
                          {linkedProfile.fullName}
                          <span className="inline-flex items-center gap-0.5 bg-nexoraBrandSoft text-nexoraBrand text-[8px] font-black uppercase px-1 py-0.5 rounded-full">
                            <ShieldCheck className="h-2 w-2" /> KYC
                          </span>
                        </h4>
                        <span className="text-[10px] text-nexoraMuted">{linkedProfile.position}</span>
                      </div>
                    </div>

                    <div className="text-[10px] text-nexoraMuted leading-normal border-t border-nexoraBrand/15 pt-2 space-y-1">
                      <div className="flex justify-between">
                        <span>Email:</span>
                        <strong className="text-nexoraMuted font-mono truncate max-w-32">{linkedProfile.email}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>{t('components.staff_registration.steps.StepWelcome.phone')}</span>
                        <strong className="text-nexoraMuted font-mono">{linkedProfile.phone || 'N/A'}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Nail Salon Info Card */}
                  <div className="border border-nexoraWarning/20 rounded-2xl bg-nexoraWarning/10 p-4 space-y-3">
                    <span className="text-[9px] font-black uppercase text-nexoraWarning bg-nexoraWarning/10 px-2 py-0.5 rounded-full inline-block">
                      {t('components.staff_registration.steps.StepWelcome.nailSalonInfo')}
                    </span>
                    <div className="flex items-center gap-3 pt-1">
                      <div className="h-10 w-10 rounded-xl bg-nexoraWarning/10 text-nexoraWarning flex items-center justify-center shrink-0">
                        <Building className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-extrabold text-nexoraText font-sans">
                          {businessName}
                        </h4>
                        <span className="text-[10px] text-nexoraMuted">
                          {t('components.staff_registration.steps.StepWelcome.invitedRole')} {inviteData?.role || position}
                        </span>
                      </div>
                    </div>

                    <div className="text-[10px] text-nexoraMuted leading-normal border-t border-nexoraWarning/20 pt-2 space-y-1">
                      <div className="flex justify-between">
                        <span>{t('components.staff_registration.steps.StepWelcome.connectionStatus')}</span>
                        <strong className="text-nexoraWarning uppercase text-[9px] font-black">
                          {t('components.staff_registration.steps.StepWelcome.newRequest')}
                        </strong>
                      </div>
                      <div className="flex justify-between">
                        <span>{t('components.staff_registration.steps.StepWelcome.location')}</span>
                        <strong className="text-nexoraMuted truncate max-w-32">San Jose, CA</strong>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row gap-3">
                  <button
                    type="button"
                    onClick={handleLinkDecline}
                    className="w-full h-11 border border-nexoraDanger/20 text-nexoraDanger bg-nexoraDanger/10 hover:bg-nexoraDanger/10 hover:border-nexoraDanger/30 font-bold text-xs uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-1.5"
                  >
                    {t('components.staff_registration.steps.StepWelcome.decline')}
                  </button>

                  <button
                    type="button"
                    onClick={handleLinkExistingProfile}
                    className="w-full h-11 bg-nexoraBrand hover:bg-nexoraBrandDark text-white font-black text-xs uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-1.5 shadow-md"
                  >
                    <Check className="h-4 w-4 stroke-[3px]" />
                    {t('components.staff_registration.steps.StepWelcome.acceptAndJoin')}
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </>
  )
}
