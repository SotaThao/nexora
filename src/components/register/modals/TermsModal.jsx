import React from 'react'
import { X } from 'lucide-react'

export default function TermsModal({ open, currentLanguage, onClose, onAccept, modalType }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
      <div className="bg-white border border-slate-100 rounded-3xl max-w-xl w-full p-6 flex flex-col max-h-[85vh] text-left text-slate-800 shadow-2xl animate-scaleUp">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <h3 className="text-sm font-black uppercase tracking-wider text-slate-800">
            {modalType === 'privacy'
              ? (currentLanguage === 'vi' ? 'Chính sách bảo mật' : 'Privacy Policy')
              : (currentLanguage === 'vi' ? 'Điều khoản dịch vụ' : 'Terms of Service')
            }
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 transition p-1.5 rounded-full hover:bg-slate-100"
            title="Close modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content body */}
        <div className="flex-grow overflow-y-auto pr-2 py-4 space-y-4 text-xs text-slate-600 leading-relaxed max-h-[50vh] scrollbar-thin">
          {modalType === 'privacy' ? (
            currentLanguage === 'vi' ? (
              <>
                <h4 className="font-extrabold text-slate-800">1. Thu thập thông tin</h4>
                <p>Chúng tôi thu thập thông tin cá nhân của bạn như Họ tên, địa chỉ Email, Số điện thoại và thông tin tài khoản thanh toán để hỗ trợ việc định tuyến tiền tip từ khách hàng trực tiếp.</p>

                <h4 className="font-extrabold text-slate-800">2. Bảo mật dữ liệu</h4>
                <p>Mọi dữ liệu cá nhân và thông tin ví của bạn đều được mã hóa và bảo mật an toàn theo tiêu chuẩn SSL. Chúng tôi cam kết không bán, chia sẻ hoặc tiết lộ thông tin của bạn cho bất kỳ bên thứ ba nào ngoại trừ các mục đích định tuyến giao dịch qua cổng thanh toán VLINKPAY.</p>

                <h4 className="font-extrabold text-slate-800">3. Quyền hạn cá nhân</h4>
                <p>Bạn có toàn quyền kiểm soát thông tin cá nhân của mình. Bạn có thể truy cập, chỉnh sửa hoặc yêu cầu xóa các thông tin này bất kỳ lúc nào trực tiếp trong trang quản lý tài khoản Dashboard.</p>
              </>
            ) : (
              <>
                <h4 className="font-extrabold text-slate-800">1. Information Collection</h4>
                <p>We collect personal details such as your Full Name, Email Address, Phone Number, and linked payment methods to power customer tip routing.</p>

                <h4 className="font-extrabold text-slate-800">2. Data Privacy & Protection</h4>
                <p>Your details are securely encrypted and protected under SSL standards. We do not sell or distribute your personal information to third parties except as necessary to process transactions through VLINKPAY.</p>

                <h4 className="font-extrabold text-slate-800">3. Your Rights</h4>
                <p>You have full ownership of your data. You may review, edit, or request deletion of your account credentials at any time directly through your dashboard settings.</p>
              </>
            )
          ) : (
            currentLanguage === 'vi' ? (
              <>
                <h4 className="font-extrabold text-slate-800">1. Giới thiệu và Đồng ý</h4>
                <p>Chào mừng bạn đến với Nexora Touch, dịch vụ được cung cấp bởi VLINKPAY. Bằng việc đăng ký tài khoản thợ hoặc liên kết ví nhận tiền tip, bạn đồng ý tuân thủ toàn bộ các điều khoản được quy định dưới đây. Nếu không đồng ý, vui lòng ngừng sử dụng dịch vụ.</p>

                <h4 className="font-extrabold text-slate-800">2. Tài khoản Kỹ thuật viên (Personal Account)</h4>
                <p>Bạn có trách nhiệm tự bảo mật thông tin tài khoản đăng nhập và đảm bảo độ chính xác của các ví nhận tiền được liên kết. VLINKPAY không chịu trách nhiệm trong trường hợp thông tin thanh toán của bạn bị nhập sai dẫn đến thất thoát tiền tip.</p>

                <h4 className="font-extrabold text-slate-800">3. Quy trình Tiền Tip và Rút tiền</h4>
                <p>Tiền tip từ khách hàng gửi trực tiếp thông qua cổng VLINKPAY của bạn sẽ được định tuyến trực tiếp đến tài khoản thanh toán mà bạn chỉ định (Zelle, Venmo, PayPal, vv.). Mọi giao dịch khi đã được hoàn thành qua hệ thống sẽ không thể hoàn trả hoặc thu hồi.</p>

                <h4 className="font-extrabold text-slate-800">4. Quyền riêng tư và Bảo mật dữ liệu</h4>
                <p>Chúng tôi cam kết bảo vệ dữ liệu cá nhân của bạn, bao gồm tên hiển thị, hình ảnh, email và thông tin ví thanh toán. Dữ liệu này chỉ được sử dụng cho mục đích vận hành hệ thống Nexora Touch, hiển thị trang gửi tip cho khách hàng của salon và báo cáo lịch sử giao dịch.</p>

                <h4 className="font-extrabold text-slate-800">5. Thay đổi Điều khoản</h4>
                <p>Chúng tôi có quyền sửa đổi hoặc cập nhật các điều khoản này bất kỳ lúc nào để đáp ứng các quy định pháp lý và nâng cấp dịch vụ. Mọi thay đổi sẽ được thông báo trực tiếp trên cổng thông tin này.</p>
              </>
            ) : (
              <>
                <h4 className="font-extrabold text-slate-800">1. Introduction & Acceptance</h4>
                <p>Welcome to Nexora Touch, a service provided by VLINKPAY. By creating a technician account or configuring your tipping payout wallet, you fully agree to be bound by these Terms & Conditions. If you do not agree, please discontinue using this portal.</p>

                <h4 className="font-extrabold text-slate-800">2. Technician Personal Account</h4>
                <p>You are solely responsible for maintaining the confidentiality of your login credentials and ensuring the accuracy of your linked payout methods. VLINKPAY is not liable for transactions sent to incorrect wallet addresses provided by you.</p>

                <h4 className="font-extrabold text-slate-800">3. Tips & Payouts Processing</h4>
                <p>Customer tips processed through VLINKPAY are routed directly to your configured payout wallets (such as Zelle, Venmo, PayPal, etc.). All completed transactions are final and cannot be refunded or recalled.</p>

                <h4 className="font-extrabold text-slate-800">4. Privacy & Data Security</h4>
                <p>We are committed to protecting your personal information, including your public display name, photo, email, and wallet details. This data is processed only to power the tipping workflow, display options to salon clients, and log transaction history.</p>

                <h4 className="font-extrabold text-slate-800">5. Modifications of Terms</h4>
                <p>We reserve the right to modify these terms at any time to comply with legal requirements or service enhancements. Any updates will be published and made viewable on this portal.</p>
              </>
            )
          )}
        </div>

        {/* Footer action buttons */}
        <div className="flex justify-end gap-3 border-t border-slate-100 pt-4 mt-auto">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-200 text-slate-500 rounded-xl font-bold hover:bg-slate-50 transition"
          >
            {currentLanguage === 'vi' ? 'Đóng' : 'Close'}
          </button>
          <button
            type="button"
            onClick={onAccept}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold transition shadow-sm"
          >
            {currentLanguage === 'vi' ? 'Tôi Đồng Ý' : 'I Accept'}
          </button>
        </div>
      </div>
    </div>
  )
}
