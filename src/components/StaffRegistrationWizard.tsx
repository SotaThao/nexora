import React, { useState } from 'react'
import { Smartphone } from 'lucide-react'
import useStaffRegistration, { MOCK_NEXORA_STAFF_PROFILES } from './staff-registration/hooks/useStaffRegistration'
import LanguageSwitcher from './ui/LanguageSwitcher'
import StepWelcome from './staff-registration/steps/StepWelcome'
import StepOtpVerify from './staff-registration/steps/StepOtpVerify'
import StepProfile from './staff-registration/steps/StepProfile'
import StepPayments from './staff-registration/steps/StepPayments'
import StepSuccess from './staff-registration/steps/StepSuccess'
import PayoutEditModal from './staff-registration/steps/PayoutEditModal'
import QrScannerModal from './staff-registration/steps/QrScannerModal'

export default function StaffRegistrationWizard({ inviteData, onReturnToMerchant, isDemoToolsEnabled = false }) {
  const [showPassword, setShowPassword] = useState(false)

  const reg = useStaffRegistration({ inviteData })

  return (
    <div className="min-h-dvh bg-nexoraCanvas text-nexoraText font-sans antialiased relative selection:bg-nexoraBrandSoft selection:text-nexoraBrand py-6 sm:py-12">
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
      {/* Background radial soft light */}
      <div className="absolute top-1/4 left-1/4 h-72 w-72 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[rgba(245,158,11,0.04)] via-transparent to-transparent blur-3xl pointer-events-none sm:h-96 sm:w-96"></div>
      <div className="absolute bottom-1/4 right-1/4 h-80 w-80 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[rgba(43,89,255,0.03)] via-transparent to-transparent blur-3xl pointer-events-none sm:h-96 sm:w-96"></div>

      {/* Language Switcher */}
      <div className="absolute top-4 right-4 z-50">
        <LanguageSwitcher />
      </div>

      <div className="max-w-xl mx-auto px-4">
        {/* Onboarding Wizard Portal Container */}
        <div className="bg-white rounded-2xl border border-nexoraBorder shadow-premium p-5 sm:p-8 space-y-6">

          {/* Header info */}
          <div className="flex items-center gap-3 pb-4 border-b border-nexoraRule">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-nexoraBrand to-brandCyan flex items-center justify-center text-white shrink-0 shadow-md">
              <Smartphone className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-nexoraText uppercase tracking-wider">
                {reg.t('staff_invite.wizard_title')}
              </h2>
              <p className="text-[11px] text-nexoraSubtle font-medium mt-0.5 leading-normal">
                {reg.t('staff_invite.wizard_subtitle')}
              </p>
            </div>
          </div>

          {/* Steps indicator */}
          {reg.step > 0 && reg.step < 4 && (
            <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-extrabold uppercase tracking-wider">
              {[
                { id: 1, label: reg.t('components.StaffRegistrationWizard.label1Register') },
                { id: 2, label: reg.t('components.StaffRegistrationWizard.label2Profile') },
                { id: 3, label: reg.t('components.StaffRegistrationWizard.label3Wallet') }
              ].map(s => (
                <div
                  key={s.id}
                  className={`py-2 rounded-lg border transition ${
                    reg.step === s.id
                      ? 'bg-nexoraBrand text-white border-nexoraBrand shadow-sm'
                      : reg.step > s.id
                        ? 'bg-nexoraSuccess/10 text-nexoraSuccess border-nexoraSuccess/20 font-bold'
                        : 'bg-nexoraSurfaceMuted text-nexoraSubtle border-nexoraRule'
                  }`}
                >
                  {s.label}
                </div>
              ))}
            </div>
          )}

          {/* STEP 0: Welcome Invite Acceptance */}
          {reg.step === 0 && (
            <StepWelcome
              inviteData={inviteData}
              businessName={reg.apiInviteInfo?.businessName || inviteData?.biz || ''}
              isInviteLoading={reg.isInviteLoading}
              isInviteError={reg.isInviteError}
              joinPath={reg.joinPath}
              setJoinPath={reg.setJoinPath}
              searchId={reg.searchId}
              setSearchId={reg.setSearchId}
              linkedProfile={reg.linkedProfile}
              setLinkedProfile={reg.setLinkedProfile}
              searchError={reg.searchError}
              setSearchError={reg.setSearchError}
              nexoraStatus={reg.nexoraStatus}
              fullName={reg.fullName}
              position={reg.position}
              phone={reg.phone}
              email={reg.email}
              t={reg.t}
              setStep={reg.setStep}
              handleScanQr={reg.handleScanQr}
              handleLinkExistingProfile={reg.handleLinkExistingProfile}
              onReturnToMerchant={onReturnToMerchant}
              MOCK_NEXORA_STAFF_PROFILES={MOCK_NEXORA_STAFF_PROFILES}
              linkEmail={reg.linkEmail}
              setLinkEmail={reg.setLinkEmail}
              linkPassword={reg.linkPassword}
              setLinkPassword={reg.setLinkPassword}
              linkError={reg.linkError}
              isLinkLoggedIn={reg.isLinkLoggedIn}
              handleLinkLogin={reg.handleLinkLogin}
              handleLinkDecline={reg.handleLinkDecline}
              isDemoToolsEnabled={isDemoToolsEnabled}
              apiInviteInfo={reg.apiInviteInfo}
              isRegisterSubmitting={reg.isRegisterSubmitting}
            />
          )}

          {/* STEP 1: Register Account & OTP Verify */}
          {reg.step === 1 && (
            <StepOtpVerify
              showOtpInput={reg.showOtpInput}
              regEmail={reg.regEmail}
              setRegEmail={reg.setRegEmail}
              regConfirmEmail={reg.regConfirmEmail}
              setRegConfirmEmail={reg.setRegConfirmEmail}
              regPassword={reg.regPassword}
              setRegPassword={reg.setRegPassword}
              regReferralLink={reg.regReferralLink}
              setRegReferralLink={reg.setRegReferralLink}
              regErrors={reg.regErrors}
              setRegErrors={reg.setRegErrors}
              showPassword={showPassword}
              setShowPassword={setShowPassword}
              otpCode={reg.otpCode}
              setOtpCode={reg.setOtpCode}
              otpError={reg.otpError}
              resendTimer={reg.resendTimer}
              setResendTimer={reg.setResendTimer}
              currentLanguage={reg.currentLanguage}
              t={reg.t}
              isSelfServe={reg.isSelfServe}
              inviteData={inviteData}
              termsAccepted={reg.termsAccepted}
              setTermsAccepted={reg.setTermsAccepted}
              handleRegisterSubmit={reg.handleRegisterSubmit}
              handleVerifyOtp={reg.handleVerifyOtp}
              handleResendOtp={reg.handleResendOtp}
              setStep={reg.setStep}
              setJoinPath={reg.setJoinPath}
              setShowOtpInput={reg.setShowOtpInput}
              isDemoToolsEnabled={isDemoToolsEnabled}
              isSubmitting={reg.isRegisterSubmitting}
            />
          )}

          {/* STEP 2: Profile Setup */}
          {reg.step === 2 && (
            <StepProfile
              fullName={reg.fullName}
              setFullName={reg.setFullName}
              nickname={reg.nickname}
              setNickname={reg.setNickname}
              position={reg.position}
              setPosition={reg.setPosition}
              phone={reg.phone}
              setPhone={reg.setPhone}
              email={reg.email}
              setEmail={reg.setEmail}
              avatar={reg.avatar}
              setAvatar={reg.setAvatar}
              onAvatarFileChange={reg.handleAvatarFileChange}
              isAvatarUploading={reg.isAvatarUploading}
              bio={reg.bio}
              setBio={reg.setBio}
              staffId={reg.staffId}
              vlinkpayId={reg.vlinkpayId}
              phoneParsed={reg.phoneParsed}
              vlinkpayStatus={reg.vlinkpayStatus}
              contactLocked={!reg.isSelfServe && !reg.isApiInvite}
              currentLanguage={reg.currentLanguage}
              t={reg.t}
              handleScanQr={reg.handleScanQr}
              setStep={reg.setStep}
              onSubmit={reg.handleProfileSubmit}
              isSubmitting={reg.isProfileSubmitting}
            />
          )}

          {/* STEP 3: Payment Configuration */}
          {reg.step === 3 && (
            <StepPayments
              payouts={reg.payouts}
              staffId={reg.staffId}
              currentLanguage={reg.currentLanguage}
              t={reg.t}
              handleToggleMethod={reg.handleToggleMethod}
              handleEditPayoutAccount={reg.handleEditPayoutAccount}
              handleActivateProfile={reg.handleActivateProfile}
              setStep={reg.setStep}
              isDemoToolsEnabled={isDemoToolsEnabled}
              isSubmitting={reg.isActivating}
            />
          )}

          {/* STEP 5: Success & Redirection */}
          {reg.step === 5 && (
            <StepSuccess
              staffId={reg.staffId}
              position={reg.position}
              inviteData={inviteData}
              currentLanguage={reg.currentLanguage}
              t={reg.t}
              onReturnToMerchant={onReturnToMerchant}
            />
          )}

        </div>

        {/* Payout Account Edit Custom Modal Popup */}
        <PayoutEditModal
          editingMethod={reg.editingMethod}
          setEditingMethod={reg.setEditingMethod}
          editValue={reg.editValue}
          setEditValue={reg.setEditValue}
          editQrCode={reg.editQrCode}
          setEditQrCode={reg.setEditQrCode}
          editAccountName={reg.editAccountName}
          setEditAccountName={reg.setEditAccountName}
          isCapturing={reg.isCapturing}
          modalError={reg.modalError}
          setModalError={reg.setModalError}
          currentLanguage={reg.currentLanguage}
          savePayoutAccount={reg.savePayoutAccount}
          handleModalImagePick={reg.handleModalImagePick}
          handleModalTakePhoto={reg.handleModalTakePhoto}
          handleModalClearQr={reg.handleModalClearQr}
        />

        {/* Simulated QR Code Camera Scanner Modal Overlay */}
        <QrScannerModal
          showScanner={reg.showScanner}
          scanTarget={reg.scanTarget}
          currentLanguage={reg.currentLanguage}
          setShowScanner={reg.setShowScanner}
          setScanTarget={reg.setScanTarget}
          isDemoToolsEnabled={isDemoToolsEnabled}
        />

      </div>
    </div>
  )
}
