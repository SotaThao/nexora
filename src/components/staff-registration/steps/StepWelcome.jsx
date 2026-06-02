import React from 'react'
import {
  Check, ShieldCheck, AlertCircle, ArrowLeft,
  CheckCircle2, Building, Plus, Loader2, QrCode, XCircle
} from 'lucide-react'

export default function StepWelcome({
  inviteData,
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
}) {
  return (
    <>
      {/* A. If merchant sent a direct prefilled invite */}
      {inviteData?.name ? (
        <div className="space-y-6 py-4">
          <div className="p-5 border border-[#4648D8]/15 rounded-2xl bg-[#E9E9FF]/20 text-center space-y-4">
            <div className="h-14 w-14 rounded-full bg-[#E9E9FF]/60 flex items-center justify-center mx-auto text-[#4648D8]">
              <Building className="h-7 w-7" />
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase text-[#4648D8] bg-[#E9E9FF]/80 px-2.5 py-0.5 rounded-full">
                {t('staff_invite.invite_from_biz') || 'Invitation from Business'}
              </span>
              <h3 className="text-lg font-black text-nexoraText tracking-tight mt-2">
                {inviteData?.biz || 'Golden Glow Nail Spa'}
              </h3>
              <p className="text-xs text-nexoraMuted max-w-sm mx-auto leading-relaxed mt-1">
                {t('staff_invite.invite_desc') || 'You are invited to join NEXORA TOUCH staff profile for the business below.'}
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
              {currentLanguage === 'vi' ? 'Hủy bỏ / Từ chối' : 'Decline Request'}
            </button>

            <button
              onClick={() => setStep(1)}
              className="w-full h-11 bg-nexoraBrand hover:bg-nexoraBrandDark text-white font-black text-xs uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-1.5 shadow-md"
            >
              {t('staff_invite.accept_invite') || 'Accept Invite & Continue Setup'} <AlertCircle className="h-4 w-4" />
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
              {t('staff_invite.already_have_id') || 'I already have Staff ID'}
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* B. Self-serve Join selection screen */}
          {joinPath === null && (
            <div className="space-y-6 py-4">
              <div className="bg-gradient-to-br from-amber-50/70 to-orange-50/40 border-2 border-amber-200/80 rounded-2xl p-6 text-center space-y-3 relative overflow-hidden shadow-sm">
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 to-orange-500 animate-pulse" />
                <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-white mx-auto shadow-lg border border-amber-300/30">
                  <Building className="h-6 w-6" />
                </div>
                <div className="space-y-1.5">
                  <span className="text-[10px] font-black uppercase text-amber-600 tracking-widest block font-sans">
                    {currentLanguage === 'vi' ? 'THƯ MỜI GIA NHẬP HỆ THỐNG TIỆM' : 'SALON NETWORK INVITATION'}
                  </span>
                  <h3 className="text-xl font-black text-nexoraText tracking-tight leading-snug">
                    {inviteData?.biz || 'Golden Glow Nail Spa & Salon'}
                  </h3>
                  <p className="text-xs text-nexoraMuted max-w-sm mx-auto leading-relaxed font-medium">
                    {currentLanguage === 'vi'
                      ? 'Bạn đã được mời liên kết hồ sơ của mình để nhận tiền tip trực tiếp vào tài khoản cá nhân tại tiệm này.'
                      : 'You have been invited to link your profile to receive tips directly to your personal account at this salon.'}
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
                  className="p-5 border border-nexoraBorder rounded-2xl bg-white hover:border-[#4648D8] hover:bg-[#E9E9FF]/10 transition-all text-left space-y-3 shadow-sm hover:shadow-md group focus:outline-none"
                >
                  <div className="h-10 w-10 rounded-xl bg-[#E9E9FF]/60 text-[#4648D8] flex items-center justify-center group-hover:bg-[#E9E9FF] transition-colors">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <strong className="text-xs font-black text-nexoraText block">
                      {currentLanguage === 'vi' ? 'Đã có tài khoản' : 'I already have a Profile'}
                    </strong>
                    <span className="text-[10px] text-nexoraSubtle block mt-0.5 leading-normal">
                      {currentLanguage === 'vi'
                        ? 'Sử dụng VLINKPAY ID sẵn có của bạn để liên kết nhanh với tiệm.'
                        : 'Use your existing VLINKPAY ID to link instantly and import your wallets.'}
                    </span>
                  </div>
                </button>

                {/* Card 2: New Registration */}
                <button
                  onClick={() => {
                    setJoinPath('register')
                    setStep(1)
                  }}
                  className="p-5 border border-nexoraBorder rounded-2xl bg-white hover:border-[#4648D8] hover:bg-[#E9E9FF]/10 transition-all text-left space-y-3 shadow-sm hover:shadow-md group focus:outline-none"
                >
                  <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                    <Plus className="h-5 w-5" />
                  </div>
                  <div>
                    <strong className="text-xs font-black text-nexoraText block">
                      {currentLanguage === 'vi' ? 'Tôi là thợ mới' : 'I am a new Technician'}
                    </strong>
                    <span className="text-[10px] text-nexoraSubtle block mt-0.5 leading-normal">
                      {currentLanguage === 'vi'
                        ? 'Đăng ký tài khoản mới, thiết lập ví nhận tiền và KYC.'
                        : 'Register a new account, configure payout wallets, and complete KYC.'}
                    </span>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* C. Option A: VLINKPAY ID Verification screen */}
          {joinPath === 'link' && (
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
                <h3 className="text-sm font-extrabold text-nexoraText uppercase tracking-wide">
                  {currentLanguage === 'vi' ? 'Liên kết NEXORA Staff ID' : 'Link NEXORA Staff ID'}
                </h3>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black uppercase text-nexoraSubtle tracking-wider">
                    {currentLanguage === 'vi' ? 'Nhập NEXORA Staff ID của bạn' : 'Enter your NEXORA Staff ID'}
                  </label>
                  <div className="mt-1.5 flex gap-2">
                    <div className="relative flex-grow font-sans">
                      <input
                        type="text"
                        placeholder="e.g. NEX-STAFF-LISA1102"
                        className={`h-10 w-full rounded-lg border pl-3 pr-20 text-xs outline-none font-mono font-bold uppercase transition-all ${
                          nexoraStatus === 'success' ? 'border-emerald-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 font-bold' :
                          nexoraStatus === 'error' ? 'border-rose-500 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 animate-shake font-bold' :
                          nexoraStatus === 'checking' ? 'border-amber-400 focus:border-amber-400 font-bold' :
                          'border-nexoraBorder focus:border-[#4648D8] focus:ring-2 focus:ring-[#4648D8]/20 font-bold'
                        }`}
                        value={searchId}
                        onChange={(e) => handleSearchIdChange(e.target.value)}
                      />
                      <div className="absolute right-10 top-1/2 -translate-y-1/2 flex items-center gap-1">
                        {nexoraStatus === 'checking' && (
                          <Loader2 className="h-4 w-4 text-amber-500 animate-spin" />
                        )}
                        {nexoraStatus === 'success' && (
                          <CheckCircle2 className="h-4 w-4 text-emerald-500 animate-scaleUp" />
                        )}
                        {nexoraStatus === 'error' && (
                          <XCircle className="h-4 w-4 text-rose-500 animate-scaleUp" />
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleScanQr('staff')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-nexoraSubtle hover:text-[#4648D8] transition-colors p-1 rounded-md hover:bg-slate-100"
                        title={currentLanguage === 'vi' ? 'Quét mã QR' : 'Scan QR Code'}
                      >
                        <QrCode className="h-4 w-4" />
                      </button>
                    </div>
                    <button
                      onClick={() => {
                        const query = searchId.trim().toUpperCase()
                        const profile = MOCK_NEXORA_STAFF_PROFILES[query]
                        if (profile) {
                          setLinkedProfile(profile)
                          setSearchError('')
                        } else {
                          setLinkedProfile(null)
                          setSearchError(currentLanguage === 'vi' ? 'Không tìm thấy NEXORA Staff ID này.' : 'NEXORA Staff ID not found.')
                        }
                      }}
                      className="h-10 px-4 bg-nexoraBrand hover:bg-nexoraBrandDark text-white rounded-lg text-xs font-bold transition"
                    >
                      {currentLanguage === 'vi' ? 'Kiểm tra' : 'Verify'}
                    </button>
                  </div>
                  {searchError && (
                    <p className="mt-1 text-xs font-bold text-rose-600 flex items-center gap-1">
                      <AlertCircle className="h-3.5 w-3.5" /> {searchError}
                    </p>
                  )}
                </div>

                {linkedProfile && (
                  <div className="border border-[#4648D8]/15 rounded-2xl bg-[#E9E9FF]/10 p-4 space-y-4 animate-scaleIn">
                    <div className="flex items-center gap-3">
                      {linkedProfile.avatar ? (
                        <img src={linkedProfile.avatar} alt="" className="h-12 w-12 rounded-full object-cover border border-[#4648D8]/20 shadow-sm" />
                      ) : (
                        <div className="h-12 w-12 rounded-full bg-[#E9E9FF]/60 flex items-center justify-center font-black text-[#4648D8] text-sm">
                          {linkedProfile.nickname.charAt(0)}
                        </div>
                      )}
                      <div>
                        <h4 className="text-xs font-extrabold text-nexoraText flex items-center gap-1.5 font-sans">
                          {linkedProfile.fullName}
                          <span className="inline-flex items-center gap-0.5 bg-[#E9E9FF] text-[#4648D8] text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full">
                            <ShieldCheck className="h-2.5 w-2.5" /> KYC
                          </span>
                        </h4>
                        <span className="text-[10px] text-nexoraMuted">{linkedProfile.position} • {linkedProfile.phone}</span>
                      </div>
                    </div>

                    <div className="text-[10px] text-nexoraMuted leading-normal border-t border-[#4648D8]/15 pt-2 space-y-1.5">
                      <div className="flex justify-between">
                        <span>Email:</span>
                        <strong className="text-nexoraMuted font-mono">{linkedProfile.email}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>{currentLanguage === 'vi' ? 'Ví nhận liên kết:' : 'Linked payout methods:'}</span>
                        <strong className="text-emerald-700 uppercase">
                          {Object.keys(linkedProfile.payoutConfigs).filter(k => linkedProfile.payoutConfigs[k].enabled).join(', ')}
                        </strong>
                      </div>
                    </div>

                    <button
                      onClick={handleLinkExistingProfile}
                      className="w-full h-10 bg-nexoraBrand hover:bg-nexoraBrandDark text-white font-extrabold text-xs uppercase tracking-wider rounded-lg transition shadow-md flex items-center justify-center gap-1.5 font-sans"
                    >
                      <Check className="h-4 w-4 stroke-[3px]" />
                      {currentLanguage === 'vi' ? 'Đồng ý liên kết & gửi yêu cầu' : 'Accept & Link with Salon'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </>
  )
}
