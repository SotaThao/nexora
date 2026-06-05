import React from 'react'
import {
  Building2,
  ShieldCheck,
  FileText,
  Landmark,
  Download,
  Eye,
  EyeOff
} from 'lucide-react'
import CustomSelect from '../../CustomSelect'

export default function KybTab({
  profile,
  kybData,
  setKybData,
  isSubmittingKyb,
  kybErrors,
  showPortal,
  setShowPortal,
  handleKybSubmit,
  showKybBankAccount,
  setShowKybBankAccount,
  cardDetails,
  verificationStatus,
  currentLanguage,
  showToast,
}) {
  return (
    <div className="space-y-6 animate-fadeIn">

      {/* Status Card */}
      {cardDetails && (
        <div className={`rounded-xl border p-5 sm:p-6 flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4 shadow-nexora-soft ${cardDetails.bgClass}`}>
          <div className="flex gap-4 items-start text-center sm:text-left flex-col sm:flex-row">
            <span className={`flex h-12 w-12 items-center justify-center rounded-2xl shrink-0 shadow-sm text-white ${cardDetails.iconBg}`}>
              <cardDetails.icon className="h-6 w-6" />
            </span>

            <div className="space-y-1">
              <h3 className="text-sm font-black uppercase tracking-wider">
                {cardDetails.title}
              </h3>
              <p className="text-xs font-semibold opacity-85 leading-relaxed max-w-2xl">
                {cardDetails.description}
              </p>
              {cardDetails.subText && (
                <div className="text-[10px] font-bold bg-white/50 border border-emerald-200/50 inline-block px-2.5 py-0.5 rounded mt-2">
                  {cardDetails.subText}
                </div>
              )}
            </div>
          </div>

          {cardDetails.ctaText && (
            <button
              type="button"
              onClick={cardDetails.ctaAction}
              className="shrink-0 rounded-lg bg-nexoraBrand hover:bg-nexoraBrandDark text-white px-4 py-2.5 text-xs font-bold transition shadow-sm animate-pulse"
            >
              {showPortal ? (currentLanguage === 'vi' ? 'Đóng Form' : 'Close Form') : cardDetails.ctaText}
            </button>
          )}
        </div>
      )}

      {showPortal && verificationStatus !== 'kyb_approved' ? (
        /* Simulated browser window border with Secure Iframe */
        <div className="border border-slate-300 rounded-xl overflow-hidden shadow-md bg-slate-100 animate-fadeIn">
          {/* Browser bar */}
          <div className="bg-slate-200 border-b border-slate-300 px-4 py-2 flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-400"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-400"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-green-400"></div>
            </div>
            <div className="bg-white rounded-md border border-slate-300 text-[10px] text-slate-500 font-mono px-3 py-0.5 flex-grow text-center select-none truncate">
              https://gateway.vlinkpay.com/merchant/kyb?merchant_email={encodeURIComponent(profile.email || '')}
            </div>
          </div>

          {/* Iframe Content */}
          <div className="bg-white p-5 sm:p-8 min-h-[400px] relative">
            {isSubmittingKyb && (
              <div className="absolute inset-0 bg-white/95 z-20 flex flex-col items-center justify-center space-y-4">
                <div className="w-12 h-12 border-4 border-nexoraBrand/20 border-t-nexoraBrand rounded-full animate-spin"></div>
                <p className="text-xs text-nexoraBrand font-bold uppercase tracking-wider animate-pulse">
                  {currentLanguage === 'vi' ? 'Đang gửi thông tin xác thực...' : 'Submitting KYB details...'}
                </p>
              </div>
            )}

            {/* Portal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-md flex items-center justify-center text-white font-extrabold text-[10px] tracking-tighter">
                  VLP
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-800 tracking-wider">VLINKPAY PORTAL</h4>
                  <p className="text-[9px] text-slate-400">Merchant Underwriting & Compliance</p>
                </div>
              </div>
              <span className="text-[9px] text-emerald-600 font-bold bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200">
                SECURE OAUTH 2.0
              </span>
            </div>

            {kybErrors.kyb && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
                {kybErrors.kyb}
              </div>
            )}

            <form onSubmit={handleKybSubmit} className="space-y-4 text-left">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Legal Business Name */}
                <div>
                  <label className="block text-[9px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                    {currentLanguage === 'vi' ? 'Tên pháp lý doanh nghiệp' : 'Legal Business Name'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Golden Glow Nails LLC"
                    className="w-full bg-slate-50 border border-slate-300 focus:border-blue-500 focus:bg-white rounded px-3 h-9 text-xs text-slate-800 focus:outline-none transition-colors"
                    value={kybData.legalName}
                    onChange={(e) => setKybData({ ...kybData, legalName: e.target.value })}
                  />
                </div>

                {/* Tax ID */}
                <div>
                  <label className="block text-[9px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                    {currentLanguage === 'vi' ? 'Mã số thuế / EIN' : 'Tax ID / EIN'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. XX-XXXXXXX"
                    className="w-full bg-slate-50 border border-slate-300 focus:border-blue-500 focus:bg-white rounded px-3 h-9 text-xs text-slate-800 focus:outline-none transition-colors"
                    value={kybData.taxId}
                    onChange={(e) => setKybData({ ...kybData, taxId: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Business Structure */}
                <div>
                  <label className="block text-[9px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                    {currentLanguage === 'vi' ? 'Hình thức doanh nghiệp' : 'Business Structure'}
                  </label>
                  <CustomSelect
                    size="sm"
                    buttonClass="bg-slate-50 border-slate-300 focus:bg-white focus:border-blue-500 text-xs text-slate-800 font-normal focus:ring-0 rounded"
                    value={kybData.businessType}
                    onChange={(e) => setKybData({ ...kybData, businessType: e.target.value })}
                    options={[
                      { value: 'LLC', label: 'LLC (Limited Liability Co.)' },
                      { value: 'Corp', label: 'Corporation' },
                      { value: 'Sole', label: 'Sole Proprietorship' },
                      { value: 'Partnership', label: 'Partnership' }
                    ]}
                  />
                </div>

                {/* Owner Representative */}
                <div>
                  <label className="block text-[9px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                    {currentLanguage === 'vi' ? 'Người đại diện pháp luật' : 'Representative Owner Name'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Representative full name"
                    className="w-full bg-slate-50 border border-slate-300 focus:border-blue-500 focus:bg-white rounded px-3 h-9 text-xs text-slate-800 focus:outline-none transition-colors"
                    value={kybData.ownerName}
                    onChange={(e) => setKybData({ ...kybData, ownerName: e.target.value })}
                  />
                </div>
              </div>

              {/* Settlement bank section */}
              <div className="border-t border-slate-100 pt-4 mt-2">
                <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-3">
                  Merchant Settlement Account Info (Tài khoản nhận tiền)
                </h5>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[9px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                      {currentLanguage === 'vi' ? 'Tên ngân hàng' : 'Bank Name'}
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Chase Bank"
                      className="w-full bg-slate-50 border border-slate-300 focus:border-blue-500 focus:bg-white rounded px-3 h-9 text-xs text-slate-800 focus:outline-none transition-colors"
                      value={kybData.bankName}
                      onChange={(e) => setKybData({ ...kybData, bankName: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                      {currentLanguage === 'vi' ? 'Số tài khoản' : 'Account Number'}
                    </label>
                    <div className="relative">
                      <input
                        type={showKybBankAccount ? "text" : "password"}
                        required
                        placeholder="Account Number"
                        className="w-full bg-slate-50 border border-slate-300 focus:border-blue-500 focus:bg-white rounded pl-3 pr-10 h-9 text-xs text-slate-800 focus:outline-none transition-colors"
                        value={kybData.bankAccount}
                        onChange={(e) => setKybData({ ...kybData, bankAccount: e.target.value })}
                      />
                      <button
                        type="button"
                        onClick={() => setShowKybBankAccount(!showKybBankAccount)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                      >
                        {showKybBankAccount ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                      {currentLanguage === 'vi' ? 'Mã định tuyến (Routing)' : 'Routing Code'}
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Routing Code"
                      className="w-full bg-slate-50 border border-slate-300 focus:border-blue-500 focus:bg-white rounded px-3 h-9 text-xs text-slate-800 focus:outline-none transition-colors"
                      value={kybData.bankRouting}
                      onChange={(e) => setKybData({ ...kybData, bankRouting: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowPortal(false)}
                  className="px-4 py-2.5 border border-slate-300 hover:bg-slate-50 text-slate-700 font-extrabold text-xs uppercase tracking-wider rounded transition"
                >
                  {currentLanguage === 'vi' ? 'Hủy' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-nexoraElectric hover:bg-blue-700 text-white font-extrabold text-xs uppercase tracking-wider rounded flex items-center gap-1.5 transition shadow-sm"
                >
                  <ShieldCheck className="w-4 h-4" /> {currentLanguage === 'vi' ? 'Gửi hồ sơ KYB' : 'Submit KYB'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">

          {/* Card 1: Registered Company Dossier (2/3 width) */}
          <div className="lg:col-span-2 rounded-xl border border-nexoraBorder bg-white shadow-sm p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-nexoraRule pb-3 mb-2">
              <h4 className="text-xs font-black uppercase text-nexoraText tracking-wider flex items-center gap-2">
                <Building2 className="h-4 w-4 text-slate-600" />
                {currentLanguage === 'vi' ? 'Hồ sơ pháp lý công ty' : 'Registered Company Dossier'}
              </h4>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="flex flex-col py-1.5 border-b border-slate-50 gap-1">
                <span className="text-nexoraMuted font-semibold">Legal Company Name</span>
                <span className="text-nexoraText font-extrabold">{profile.businessName || 'Pending Submission'}</span>
              </div>
              <div className="flex flex-col py-1.5 border-b border-slate-50 gap-1">
                <span className="text-nexoraMuted font-semibold">Tax ID / EIN</span>
                <span className="font-mono text-nexoraText font-extrabold">
                  {verificationStatus === 'kyb_approved' ? 'XX-XXX9832' : (verificationStatus === 'verified_lite' ? 'XX-XXX4192' : 'Pending Verification')}
                </span>
              </div>
              <div className="flex flex-col py-1.5 border-b border-slate-50 gap-1">
                <span className="text-nexoraMuted font-semibold">Business Entity Type</span>
                <span className="text-nexoraText font-extrabold">LLC (Limited Liability Co.)</span>
              </div>
              <div className="flex flex-col py-1.5 border-b border-slate-50 gap-1">
                <span className="text-nexoraMuted font-semibold">Authorized Representative</span>
                <span className="text-nexoraText font-extrabold">{profile.fullName}</span>
              </div>
              <div className="flex flex-col py-1.5 border-b border-slate-50 gap-1">
                <span className="text-nexoraMuted font-semibold">Industry classification (MCC)</span>
                <span className="text-nexoraText font-extrabold">7230 - Nails & Beauty</span>
              </div>
              <div className="flex flex-col py-1.5 border-b border-slate-50 gap-1">
                <span className="text-nexoraMuted font-semibold">Corporate Address</span>
                <span className="text-nexoraText font-extrabold truncate" title={profile.street}>{profile.street || 'Pending'}</span>
              </div>
            </div>
          </div>

          {/* Card 2: Settlement Account Info (1/3 width) */}
          <div className="lg:col-span-1 rounded-xl border border-nexoraBorder bg-white shadow-sm p-6 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center border-b border-nexoraRule pb-3 mb-4">
                <h4 className="text-xs font-black uppercase text-nexoraText tracking-wider flex items-center gap-2">
                  <Landmark className="h-4 w-4 text-emerald-600" />
                  {currentLanguage === 'vi' ? 'Tài khoản thanh toán nhận tiền' : 'Settlement Account Details'}
                </h4>
              </div>

              <div className="space-y-4 text-xs">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2 sm:py-1 gap-1">
                  <span className="text-nexoraMuted font-semibold">Bank Institution</span>
                  <span className="text-nexoraText font-extrabold">{(verificationStatus === 'kyb_approved' || verificationStatus === 'verified_lite') ? 'Chase Bank, N.A.' : 'N/A'}</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2 sm:py-1 border-t border-slate-50 gap-1">
                  <span className="text-nexoraMuted font-semibold">Routing (ABA)</span>
                  <span className="font-mono text-nexoraText font-extrabold">{(verificationStatus === 'kyb_approved' || verificationStatus === 'verified_lite') ? '021000021' : 'N/A'}</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2 sm:py-1 border-t border-slate-50 gap-1">
                  <span className="text-nexoraMuted font-semibold">Account Number</span>
                  <span className="font-mono text-nexoraText font-extrabold">{(verificationStatus === 'kyb_approved' || verificationStatus === 'verified_lite') ? '•••• 9832' : 'N/A'}</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2 sm:py-1 border-t border-slate-50 gap-1">
                  <span className="text-nexoraMuted font-semibold">Payout frequency</span>
                  <span className="text-emerald-600 font-extrabold">
                    {verificationStatus === 'kyb_approved' ? 'Instant Settlement (24/7)' : (verificationStatus === 'verified_lite' ? 'Next-Day ACH Settlement' : 'N/A')}
                  </span>
                </div>
              </div>
            </div>

            {verificationStatus === 'kyb_approved' ? (
              <button
                type="button"
                onClick={() => showToast(currentLanguage === 'vi' ? 'Để thay đổi tài khoản nhận vui lòng liên hệ hỗ trợ.' : 'To modify receiving targets, contact client support.')}
                className="w-full mt-5 rounded-lg border border-slate-200 py-2 text-center text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
              >
                Change Settlement Target
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setShowPortal(true)}
                disabled={verificationStatus === 'lite_pending' || verificationStatus === 'pro_pending'}
                className={`w-full mt-5 rounded-lg py-2 text-center text-xs font-bold transition text-white
                  ${(verificationStatus === 'lite_pending' || verificationStatus === 'pro_pending')
                    ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                    : 'bg-nexoraBrand hover:bg-nexoraBrandDark'
                  }`}
              >
                {currentLanguage === 'vi' ? 'Liên kết Ngân hàng Thanh toán' : 'Link Settlement Bank'}
              </button>
            )}
          </div>

          {/* Card 3: Uploaded Compliance Documents (full width) */}
          <div className="lg:col-span-3 rounded-xl border border-nexoraBorder bg-white shadow-sm p-6">
            <div className="flex justify-between items-center border-b border-nexoraRule pb-3 mb-4">
              <h4 className="text-xs font-black uppercase text-nexoraText tracking-wider flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-500" />
                {currentLanguage === 'vi' ? 'Hồ sơ tài liệu xác thực' : 'Uploaded Compliance Documents'}
              </h4>
            </div>

            {(verificationStatus === 'kyb_approved' || verificationStatus === 'verified_lite') ? (
              <div className="divide-y divide-slate-100">
                <div className="flex items-center justify-between py-3.5 text-xs">
                  <div className="flex items-center gap-3">
                    <span className="h-9 w-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">PDF</span>
                    <div>
                      <p className="font-extrabold text-slate-800 truncate max-w-[120px] sm:max-w-[150px]">Articles_of_Organization_LLC.pdf</p>
                      <p className="text-[10px] text-slate-400">1.4 MB • Verified & Uploaded</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] font-black uppercase rounded">Verified</span>
                    <button className="p-1.5 border border-slate-200 hover:bg-slate-50 rounded text-slate-500 transition" title="Download">
                      <Download className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between py-3.5 text-xs">
                  <div className="flex items-center gap-3">
                    <span className="h-9 w-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">PDF</span>
                    <div>
                      <p className="font-extrabold text-slate-800 truncate max-w-[120px] sm:max-w-[150px]">IRS_EIN_Tax_Confirmation_Letter.pdf</p>
                      <p className="text-[10px] text-slate-400">680 KB • Verified & Uploaded</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] font-black uppercase rounded">Verified</span>
                    <button className="p-1.5 border border-slate-200 hover:bg-slate-50 rounded text-slate-500 transition" title="Download">
                      <Download className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-slate-400">
                <FileText className="h-10 w-10 text-slate-200 mx-auto mb-2" />
                <p className="text-xs font-semibold">No compliance documents submitted yet.</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Documents uploaded during compliance registration will display here.</p>
              </div>
            )}
          </div>

        </div>
      )}

      {/* Legal Disclosures */}
      <div className="rounded-xl border border-nexoraBorder bg-slate-50 p-6 space-y-4 text-xs mt-6 text-nexoraMuted select-text">
        <h5 className="font-bold text-nexoraText uppercase tracking-wider border-b border-slate-200 pb-2">
          {currentLanguage === 'vi' ? 'Công bố pháp lý & Điều khoản' : 'Legal Disclosures & Terms'}
        </h5>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-1">
            <h6 className="font-extrabold text-slate-700">
              {currentLanguage === 'vi' ? '1. Báo cáo thu nhập IRS' : '1. IRS Income Reporting'}
            </h6>
            <p className="leading-relaxed text-[11px]">
              {currentLanguage === 'vi'
                ? 'Theo quy định 1099-K của IRS, thu nhập từ tiền típ được xử lý qua các cổng này phải báo cáo thuế hàng năm.'
                : 'Under 1099-K regulations, tipping income processed through these gateways is subject to annual IRS reporting.'}
            </p>
          </div>
          <div className="space-y-1">
            <h6 className="font-extrabold text-slate-700">
              {currentLanguage === 'vi' ? '2. Tuyên bố miễn trừ tiết kiệm' : '2. Savings Disclaimer'}
            </h6>
            <p className="leading-relaxed text-[11px]">
              {currentLanguage === 'vi'
                ? 'Mức tiết kiệm chi phí xử lý ước tính được tính toán so với phí đại lý tiêu chuẩn ngành và không được bảo đảm.'
                : 'Estimated processing savings are calculated relative to industry standard merchant processing fees and are not guaranteed.'}
            </p>
          </div>
          <div className="space-y-1">
            <h6 className="font-extrabold text-slate-700">
              {currentLanguage === 'vi' ? '3. Điều khoản dịch vụ' : '3. Terms of Service'}
            </h6>
            <p className="leading-relaxed text-[11px]">
              {currentLanguage === 'vi'
                ? 'Việc sử dụng dịch vụ đồng nghĩa với việc đồng ý với các điều khoản tuân thủ doanh nghiệp và chính sách thẩm định của VLINKPAY.'
                : 'Usage constitutes agreement with VLINKPAY corporate compliance terms and underwriting policies.'}
            </p>
          </div>
        </div>
      </div>

    </div>
  )
}
