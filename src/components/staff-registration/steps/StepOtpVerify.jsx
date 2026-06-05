import React, { useState } from 'react'
import { Eye, EyeOff, X } from 'lucide-react'
import { renderLabel } from '../../../contexts/LanguageContext'

export default function StepOtpVerify({
  showOtpInput,
  regEmail, setRegEmail,
  regConfirmEmail, setRegConfirmEmail,
  regPassword, setRegPassword,
  regReferralLink, setRegReferralLink,
  regErrors, setRegErrors,
  showPassword, setShowPassword,
  otpCode, setOtpCode,
  otpError,
  resendTimer, setResendTimer,
  currentLanguage, t,
  isSelfServe,
  inviteData,
  termsAccepted, setTermsAccepted,
  handleRegisterSubmit,
  handleVerifyOtp,
  autoFillOtp,
  setStep,
  setJoinPath,
  setShowOtpInput,
  isDemoToolsEnabled = false,
}) {
  const [showTermsModal, setShowTermsModal] = useState(false)
  const [modalType, setModalType] = useState('terms')
  return (
    <>
      {/* STEP 1: Register Account & Activate */}
      {!showOtpInput && (
        <form onSubmit={handleRegisterSubmit} className="space-y-6 py-4">
          <div className="text-center space-y-1.5">
            <h3 className="text-base font-extrabold text-nexoraText uppercase tracking-wide">
              {currentLanguage === 'vi' ? '1. Đăng ký tài khoản' : '1. Register Account'}
            </h3>
            <p className="text-xs text-nexoraMuted leading-relaxed max-w-sm mx-auto">
              {currentLanguage === 'vi'
                ? 'Đăng ký tài khoản thợ mới để bắt đầu nhận tiền tip.'
                : 'Register a new technician account to start receiving tips.'}
            </p>
          </div>

          <div className="space-y-4">
            {/* Email */}
            <div>
              <label className="text-[10px] font-black uppercase text-nexoraSubtle tracking-wider">
                {renderLabel(currentLanguage === 'vi' ? 'Địa chỉ Email *' : 'Email Address *')}
              </label>
              <input
                type="email"
                className={`mt-1.5 h-10 w-full rounded-lg border ${regErrors.email ? 'border-nexoraDanger focus:border-nexoraDanger focus:ring-2 focus:ring-nexoraDanger/20' : 'border-nexoraBorder focus:border-nexoraBrand focus:ring-2 focus:ring-nexoraBrand/20'} px-3 text-xs outline-none transition-all`}
                placeholder="e.g. name@example.com"
                value={regEmail}
                onChange={(e) => {
                  setRegEmail(e.target.value)
                  setRegErrors(prev => ({ ...prev, email: '' }))
                }}
                required
              />
              {regErrors.email && <p className="mt-1 text-[10px] font-bold text-nexoraDanger">{regErrors.email}</p>}
            </div>

            {/* Confirm Email */}
            <div>
              <label className="text-[10px] font-black uppercase text-nexoraSubtle tracking-wider">
                {renderLabel(currentLanguage === 'vi' ? 'Nhập lại địa chỉ Email *' : 'Confirm Email Address *')}
              </label>
              <input
                type="email"
                className={`mt-1.5 h-10 w-full rounded-lg border ${regErrors.confirmEmail ? 'border-nexoraDanger focus:border-nexoraDanger focus:ring-2 focus:ring-nexoraDanger/20' : 'border-nexoraBorder focus:border-nexoraBrand focus:ring-2 focus:ring-nexoraBrand/20'} px-3 text-xs outline-none transition-all`}
                placeholder="e.g. name@example.com"
                value={regConfirmEmail}
                onChange={(e) => {
                  setRegConfirmEmail(e.target.value)
                  setRegErrors(prev => ({ ...prev, confirmEmail: '' }))
                }}
                required
              />
              {regErrors.confirmEmail && <p className="mt-1 text-[10px] font-bold text-nexoraDanger">{regErrors.confirmEmail}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="text-[10px] font-black uppercase text-nexoraSubtle tracking-wider">
                {renderLabel(currentLanguage === 'vi' ? 'Mật khẩu *' : 'Password *')}
              </label>
              <div className="relative mt-1.5">
                <input
                  type={showPassword ? "text" : "password"}
                  className={`h-10 w-full rounded-lg border ${regErrors.password ? 'border-nexoraDanger focus:border-nexoraDanger focus:ring-2 focus:ring-nexoraDanger/20' : 'border-nexoraBorder focus:border-nexoraBrand focus:ring-2 focus:ring-nexoraBrand/20'} pl-3 pr-10 text-xs outline-none transition-all`}
                  placeholder="••••••••"
                  value={regPassword}
                  onChange={(e) => {
                    setRegPassword(e.target.value)
                    setRegErrors(prev => ({ ...prev, password: '' }))
                  }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-nexoraSubtle hover:text-nexoraText focus:outline-none"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {regErrors.password && <p className="mt-1 text-[10px] font-bold text-nexoraDanger">{regErrors.password}</p>}
            </div>

            {/* Referral Link */}
            <div>
              <label className="text-[10px] font-black uppercase text-nexoraSubtle tracking-wider">
                {currentLanguage === 'vi' ? 'Liên kết giới thiệu / Salon' : 'Referral Link / Salon'}
              </label>
              <input
                type="text"
                className={`mt-1.5 h-10 w-full rounded-lg border px-3 text-xs outline-none transition-all ${
                  inviteData?.biz
                    ? 'bg-nexoraSurfaceMuted text-nexoraSubtle border-nexoraBorder cursor-not-allowed'
                    : 'border-nexoraBorder focus:border-nexoraBrand focus:ring-2 focus:ring-nexoraBrand/20 focus:outline-none'
                }`}
                placeholder="Enter referral code..."
                value={regReferralLink}
                onChange={(e) => setRegReferralLink(e.target.value)}
                disabled={!!inviteData?.biz}
              />
            </div>

            {/* Implicit Consent Terms and Privacy Note */}
            <div className="text-[11px] text-nexoraMuted leading-normal text-center font-sans max-w-sm mx-auto pt-1 pb-2">
              {currentLanguage === 'vi' ? (
                <>
                  Bằng cách chọn vào <span className="font-bold text-nexoraText">Đăng ký</span>, bạn xác nhận rằng bạn đã đọc và đồng ý với{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setModalType('terms')
                      setShowTermsModal(true)
                    }}
                    className="text-nexoraTealAlt hover:underline font-bold"
                  >
                    Điều khoản dịch vụ
                  </button>{' '}
                  và{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setModalType('privacy')
                      setShowTermsModal(true)
                    }}
                    className="text-nexoraTealAlt hover:underline font-bold"
                  >
                    Chính sách bảo mật
                  </button>{' '}
                  của chúng tôi.
                </>
              ) : (
                <>
                  By selecting <span className="font-bold text-nexoraText">Register</span>, you confirm that you have read and agree to our{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setModalType('terms')
                      setShowTermsModal(true)
                    }}
                    className="text-nexoraTealAlt hover:underline font-bold"
                  >
                    Terms of Service
                  </button>{' '}
                  and{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setModalType('privacy')
                      setShowTermsModal(true)
                    }}
                    className="text-nexoraTealAlt hover:underline font-bold"
                  >
                    Privacy Policy
                  </button>.
                </>
              )}
            </div>
          </div>

          <div className="pt-4 flex gap-3 border-t border-nexoraRule">
            <button
              type="button"
              onClick={() => {
                if (isSelfServe) {
                  setJoinPath(null)
                }
                setStep(0)
              }}
              className="h-10 px-4 border border-nexoraBorder text-nexoraMuted font-bold text-xs uppercase tracking-wider rounded-lg hover:bg-nexoraSurfaceMuted transition"
            >
              {t('common.back') || 'Back'}
            </button>
            <button
              type="submit"
              className="flex-grow h-10 bg-nexoraBrand hover:bg-nexoraBrandDark text-white font-bold text-xs uppercase tracking-wider rounded-lg transition"
            >
              {t('common.next') || 'Continue'}
            </button>
          </div>
        </form>
      )}

      {showOtpInput && (
        <form onSubmit={handleVerifyOtp} className="space-y-6 py-4">
          <div className="text-center space-y-1.5">
            <h3 className="text-base font-extrabold text-nexoraText uppercase tracking-wide">
              {currentLanguage === 'vi' ? '1. Kích hoạt tài khoản' : '1. Activate Account'}
            </h3>
            <p className="text-xs text-nexoraMuted leading-relaxed max-w-sm mx-auto">
              {currentLanguage === 'vi'
                ? 'Nhập mã OTP được gửi tới email của bạn để kích hoạt tài khoản.'
                : 'Enter the OTP code sent to your email to activate your account.'}
            </p>
          </div>

          <div className="space-y-4">
            {/* Single OTP Input */}
            <div>
              <label className="text-[10px] font-black uppercase text-nexoraSubtle tracking-wider">
                {renderLabel(currentLanguage === 'vi' ? 'Nhập mã OTP *' : 'Enter OTP Code *')}
              </label>
              <input
                type="text"
                className="mt-1.5 h-12 w-full rounded-lg border border-nexoraBorder px-4 text-center font-mono font-black text-lg text-nexoraText focus:border-nexoraBrand focus:ring-2 focus:ring-nexoraBrand/20 focus:outline-none transition-all"
                placeholder="e.g. 1234"
                value={otpCode}
                onChange={(e) => {
                  setOtpCode(e.target.value)
                }}
                required
              />
            </div>

            {otpError && <p className="text-xs font-bold text-center text-nexoraDanger">{otpError}</p>}

            <div className="text-center">
              <span className="text-[10px] text-nexoraSubtle font-bold block">
                {resendTimer > 0
                  ? `Resend code in ${resendTimer}s`
                  : (
                    <button
                      type="button"
                      onClick={() => setResendTimer(30)}
                      className="text-nexoraBrand hover:underline"
                    >
                      Resend Verification Code
                    </button>
                  )
                }
              </span>
            </div>
          </div>

          {isDemoToolsEnabled && (
            <div className="p-3 border border-dashed border-nexoraBrand/40 bg-nexoraBrandSoft/20 rounded-xl flex items-center justify-between gap-3 max-w-xs mx-auto">
              <span className="text-[10px] text-nexoraBrand font-bold">Simulator Helper:</span>
              <button
                type="button"
                onClick={autoFillOtp}
                className="px-2.5 py-1 bg-nexoraBrand text-white rounded text-[10px] font-black uppercase hover:bg-opacity-90 shadow-sm"
              >
                Auto-fill (1234)
              </button>
            </div>
          )}

          <div className="pt-4 flex gap-3 border-t border-nexoraRule">
            <button
              type="button"
              onClick={() => setShowOtpInput(false)}
              className="h-10 px-4 border border-nexoraBorder text-nexoraMuted font-bold text-xs uppercase tracking-wider rounded-lg hover:bg-nexoraSurfaceMuted transition"
            >
              {t('common.back') || 'Back'}
            </button>
            <button
              type="submit"
              className="flex-grow h-10 bg-nexoraBrand hover:bg-nexoraBrandDark text-white font-bold text-xs uppercase tracking-wider rounded-lg transition"
            >
              {currentLanguage === 'vi' ? 'Xác minh & Kích hoạt' : 'Verify & Activate'}
            </button>
          </div>
        </form>
      )}
      <TermsModal
        open={showTermsModal}
        currentLanguage={currentLanguage}
        onClose={() => setShowTermsModal(false)}
        onAccept={() => {
          setTermsAccepted(true)
          setRegErrors(prev => ({ ...prev, terms: '' }))
          setShowTermsModal(false)
        }}
        modalType={modalType}
      />
    </>
  )
}

// Terms & Conditions Modal Overlay
function TermsModal({ open, currentLanguage, onClose, onAccept, modalType }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 bg-nexoraText/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
      <div className="bg-white border border-nexoraRule rounded-3xl max-w-xl w-full p-6 flex flex-col max-h-[85vh] text-left text-nexoraText shadow-2xl animate-scaleUp">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-nexoraRule pb-4">
          <h3 className="text-sm font-black uppercase tracking-wider text-nexoraText">
            {modalType === 'privacy'
              ? (currentLanguage === 'vi' ? 'Chính sách bảo mật' : 'Privacy Policy')
              : (currentLanguage === 'vi' ? 'Điều khoản dịch vụ' : 'Terms of Service')
            }
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-nexoraSubtle hover:text-nexoraText transition p-1.5 rounded-full hover:bg-nexoraSurfaceMuted"
            title="Close modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content body */}
        <div className="flex-grow overflow-y-auto pr-2 py-4 space-y-4 text-xs text-nexoraMuted leading-relaxed max-h-[50vh] scrollbar-thin">
          {modalType === 'privacy' ? (
            currentLanguage === 'vi' ? (
              <>
                <h4 className="font-extrabold text-nexoraText">1. Thu thập thông tin</h4>
                <p>Chúng tôi thu thập thông tin cá nhân của bạn như Họ tên, địa chỉ Email, Số điện thoại và thông tin tài khoản thanh toán để hỗ trợ việc định tuyến tiền tip từ khách hàng trực tiếp.</p>

                <h4 className="font-extrabold text-nexoraText">2. Bảo mật dữ liệu</h4>
                <p>Mọi dữ liệu cá nhân và thông tin ví của bạn đều được mã hóa và bảo mật an toàn theo tiêu chuẩn SSL. Chúng tôi cam kết không bán, chia sẻ hoặc tiết lộ thông tin của bạn cho bất kỳ bên thứ ba nào ngoại trừ các mục đích định tuyến giao dịch qua cổng thanh toán VLINKPAY.</p>

                <h4 className="font-extrabold text-nexoraText">3. Quyền hạn cá nhân</h4>
                <p>Bạn có toàn quyền kiểm soát thông tin cá nhân của mình. Bạn có thể truy cập, chỉnh sửa hoặc yêu cầu xóa các thông tin này bất kỳ lúc nào trực tiếp trong trang quản lý tài khoản Dashboard.</p>
              </>
            ) : (
              <>
                <h4 className="font-extrabold text-nexoraText">1. Information Collection</h4>
                <p>We collect personal details such as your Full Name, Email Address, Phone Number, and linked payment methods to power customer tip routing.</p>

                <h4 className="font-extrabold text-nexoraText">2. Data Privacy & Protection</h4>
                <p>Your details are securely encrypted and protected under SSL standards. We do not sell or distribute your personal information to third parties except as necessary to process transactions through VLINKPAY.</p>

                <h4 className="font-extrabold text-nexoraText">3. Your Rights</h4>
                <p>You have full ownership of your data. You may review, edit, or request deletion of your account credentials at any time directly through your dashboard settings.</p>
              </>
            )
          ) : (
            currentLanguage === 'vi' ? (
              <>
                <h4 className="font-extrabold text-nexoraText">1. Giới thiệu và Đồng ý</h4>
                <p>Chào mừng bạn đến với Nexora Touch, dịch vụ được cung cấp bởi VLINKPAY. Bằng việc đăng ký tài khoản thợ hoặc liên kết ví nhận tiền tip, bạn đồng ý tuân thủ toàn bộ các điều khoản được quy định dưới đây. Nếu không đồng ý, vui lòng ngừng sử dụng dịch vụ.</p>

                <h4 className="font-extrabold text-nexoraText">2. Tài khoản Kỹ thuật viên (Personal Account)</h4>
                <p>Bạn có trách nhiệm tự bảo mật thông tin tài khoản đăng nhập và đảm bảo độ chính xác của các ví nhận tiền được liên kết. VLINKPAY không chịu trách nhiệm trong trường hợp thông tin thanh toán của bạn bị nhập sai dẫn đến thất thoát tiền tip.</p>

                <h4 className="font-extrabold text-nexoraText">3. Quy trình Tiền Tip và Rút tiền</h4>
                <p>Tiền tip từ khách hàng gửi trực tiếp thông qua cổng VLINKPAY của bạn sẽ được định tuyến trực tiếp đến tài khoản thanh toán mà bạn chỉ định (Zelle, Venmo, PayPal, vv.). Mọi giao dịch khi đã được hoàn thành qua hệ thống sẽ không thể hoàn trả hoặc thu hồi.</p>

                <h4 className="font-extrabold text-nexoraText">4. Quyền riêng tư và Bảo mật dữ liệu</h4>
                <p>Chúng tôi cam kết bảo vệ dữ liệu cá nhân của bạn, bao gồm tên hiển thị, hình ảnh, email và thông tin ví thanh toán. Dữ liệu này chỉ được sử dụng cho mục đích vận hành hệ thống Nexora Touch, hiển thị trang gửi tip cho khách hàng của salon và báo cáo lịch sử giao dịch.</p>

                <h4 className="font-extrabold text-nexoraText">5. Thay đổi Điều khoản</h4>
                <p>Chúng tôi có quyền sửa đổi hoặc cập nhật các điều khoản này bất kỳ lúc nào để đáp ứng các quy định pháp lý và nâng cấp dịch vụ. Mọi thay đổi sẽ được thông báo trực tiếp trên cổng thông tin này.</p>
              </>
            ) : (
              <>
                <h4 className="font-extrabold text-nexoraText">1. Introduction & Acceptance</h4>
                <p>Welcome to Nexora Touch, a service provided by VLINKPAY. By creating a technician account or configuring your tipping payout wallet, you fully agree to be bound by these Terms & Conditions. If you do not agree, please discontinue using this portal.</p>

                <h4 className="font-extrabold text-nexoraText">2. Technician Personal Account</h4>
                <p>You are solely responsible for maintaining the confidentiality of your login credentials and ensuring the accuracy of your linked payout methods. VLINKPAY is not liable for transactions sent to incorrect wallet addresses provided by you.</p>

                <h4 className="font-extrabold text-nexoraText">3. Tips & Payouts Processing</h4>
                <p>Customer tips processed through VLINKPAY are routed directly to your configured payout wallets (such as Zelle, Venmo, PayPal, etc.). All completed transactions are final and cannot be refunded or recalled.</p>

                <h4 className="font-extrabold text-nexoraText">4. Privacy & Data Security</h4>
                <p>We are committed to protecting your personal information, including your public display name, photo, email, and wallet details. This data is processed only to power the tipping workflow, display options to salon clients, and log transaction history.</p>

                <h4 className="font-extrabold text-nexoraText">5. Modifications of Terms</h4>
                <p>We reserve the right to modify these terms at any time to comply with legal requirements or service enhancements. Any updates will be published and made viewable on this portal.</p>
              </>
            )
          )}
        </div>

        {/* Footer action buttons */}
        <div className="flex justify-end gap-3 border-t border-nexoraRule pt-4 mt-auto">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-nexoraBorder text-nexoraMuted rounded-xl font-bold hover:bg-nexoraSurfaceMuted transition"
          >
            {currentLanguage === 'vi' ? 'Đóng' : 'Close'}
          </button>
          <button
            type="button"
            onClick={onAccept}
          className="px-5 py-2 bg-nexoraText hover:bg-nexoraText/90 text-white rounded-xl font-bold transition shadow-sm"
          >
            {currentLanguage === 'vi' ? 'Tôi Đồng Ý' : 'I Accept'}
          </button>
        </div>
      </div>
    </div>
  )
}
