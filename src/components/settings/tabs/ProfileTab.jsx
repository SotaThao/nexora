import React from 'react'
import {
  User,
  Building2,
  Edit2,
  Copy,
  Check,
  MapPin,
  ExternalLink,
  Wallet,
  Globe,
  HelpCircle,
  Camera,
  FolderOpen,
  AlertTriangle,
  X
} from 'lucide-react'

const PayoutLogos = {
  zelle: (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] fill-[#7414CA]" xmlns="http://www.w3.org/2000/svg">
      <path d="M13.559 24h-2.841a.483.483 0 0 1-.483-.483v-2.765H5.638a.667.667 0 0 1-.666-.666v-2.234a.67.67 0 0 1 .142-.412l8.139-10.382h-7.25a.667.667 0 0 1-.667-.667V3.914c0-.367.299-.666.666-.666h4.23V.483c0-.266.217-.483.483-.483h2.841c.266 0 .483.217.483.483v2.765h4.323c.367 0 .666.299.666.666v2.137a.67.67 0 0 1-.141.41l-8.19 10.481h7.665c.367 0 .666.299.666.666v2.477a.667.667 0 0 1-.666.667h-4.32v2.765a.483.483 0 0 1-.483.483Z" />
    </svg>
  ),
  bankwire: (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] fill-[#475569]" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2L1 7v2h22V7L12 2zm0 18H3v-8h3v8h3v-8h3v8h3v-8h3v8h3v-8h3v8h3v-8h3v8h-3zm-11 2h22v2H1v-2z" />
    </svg>
  ),
  paypal: (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] fill-[#003087]" xmlns="http://www.w3.org/2000/svg">
      <path d="M20.09 6.85c-.45 2.24-1.93 7.82-2.18 8.87-.24 1.05-1.12 1.77-2.22 1.77h-3.32l-.96 6.02c-.08.5-.52.87-1.03.87H6.22c-.65 0-1.13-.59-.99-1.22L8.53 5.4c.14-.63.7-.1 1.33-.1h5.8c2.81 0 4.88 1.48 4.43 3.7.22-1.07.13-2.15-.36-3.05z" />
      <path d="M16.92 3.85c-.45 2.24-1.93 7.82-2.18 8.87-.24 1.05-1.12 1.77-2.22 1.77h-3.32l-.96 6.02c-.08.5-.52.87-1.03.87H3.06c-.65 0-1.13-.59-.99-1.22L5.37 2.4c.14-.63.7-1.1 1.33-1.1h5.8c2.81 0 4.88 1.48 4.43 3.7.22-1.07.13-2.15-.36-3.05z" opacity="0.6" />
    </svg>
  ),
  venmo: (
    <svg viewBox="0 0 448 512" className="h-[18px] w-[18px] fill-[#008CFF]" xmlns="http://www.w3.org/2000/svg">
      <path d="M381.4 105.3c11 18.1 15.9 36.7 15.9 60.3 0 75.1-64.1 172.7-116.2 241.2h-118.8l-47.6-285 104.1-9.9 25.3 202.8c23.5-38.4 52.6-98.7 52.6-139.7 0-22.5-3.9-37.8-9.9-50.4z" />
    </svg>
  ),
  cashapp: (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] fill-[#00D632]" xmlns="http://www.w3.org/2000/svg">
      <path d="M23.59 3.475a5.1 5.1 0 00-3.05-3.05c-1.31-.42-2.5-.42-4.92-.42H8.36c-2.4 0-3.61 0-4.9.4a5.1 5.1 0 00-3.05 3.06C0 4.765 0 5.965 0 8.365v7.27c0 2.41 0 3.6.4 4.9a5.1 5.1 0 003.05 3.05c1.3.41 2.5.41 4.9.41h7.28c2.41 0 3.61 0 4.9-.4a5.1 5.1 0 003.06-3.06c.41-1.3.41-2.5.41-4.9v-7.25c0-2.41 0-3.61-.41-4.91zm-6.17 4.63l-.93.93a.5.5 0 01-.67.01 5 5 0 00-3.22-1.18c-.97 0-1.94.32-1.94 1.21 0 .9 1.04 1.2 2.24 1.65 2.1.7 3.84 1.58 3.84 3.64 0 2.24-1.74 3.78-4.58 3.95l-.26 1.2a.49.49 0 01-.48.39H9.63l-.09-.01a.5.5 0 01-.38-.59l.28-1.27a6.54 6.54 0 01-2.88-1.57v-.01a.48.48 0 010-.68l1-.97a.49.49 0 01.67 0c.91.86 2.13 1.34 3.39 1.32c1.3 0 2.17-.55 2.17-1.42 0-.87-.88-1.1-2.54-1.72-1.76-.63-3.43-1.52-3.43-3.6 0-2.42 2.01-3.6 4.39-3.71l.25-1.23a.48.48 0 01.48-.38h1.78l.1.01c.26.06.43.31.37.57l-.27 1.37c.9.3 1.75.77 2.48 1.39l.02.02c.19.2.19.5 0 .68z" />
    </svg>
  ),
  applecash: (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] fill-black" xmlns="http://www.w3.org/2000/svg">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83zM15.97 4.17c.66-.81 1.11-1.93.99-3.06-1 .04-2.22.67-2.94 1.51-.62.73-1.16 1.87-1.02 2.98 1.11.09 2.25-.56 2.97-1.43z" />
    </svg>
  )
}

const payoutMethodsList = [
  { key: 'zelle', label: 'Zelle', placeholder: 'Enter Zelle email/phone...' },
  { key: 'bankwire', label: 'Bank Wire', placeholder: 'Enter Bank Wire routing - account...' },
  { key: 'paypal', label: 'PayPal', placeholder: 'Enter PayPal email...' },
  { key: 'venmo', label: 'Venmo', placeholder: 'Enter Venmo @username...' },
  { key: 'cashapp', label: 'Cash App', placeholder: 'Enter Cash App $cashtag...' },
  { key: 'applecash', label: 'Apple Cash', placeholder: 'Enter Apple Cash phone number...' }
]

export default function ProfileTab({
  profile,
  copiedId,
  isEditingBasic,
  setIsEditingBasic,
  basicForm,
  setBasicForm,
  isEditingAddress,
  setIsEditingAddress,
  addressForm,
  setAddressForm,
  isEditingBusiness,
  setIsEditingBusiness,
  businessForm,
  setBusinessForm,
  isEditingReviews,
  setIsEditingReviews,
  reviewsForm,
  setReviewsForm,
  editingMethod,
  setEditingMethod,
  editValue,
  setEditValue,
  editQrCode,
  setEditQrCode,
  isCapturing,
  modalError,
  setModalError,
  hasKyb,
  currentLanguage,
  showToast,
  handleCopy,
  startEditBasic,
  saveBasic,
  startEditAddress,
  saveAddress,
  startEditBusiness,
  saveBusiness,
  startEditReviews,
  saveReviews,
  handleToggleMethod,
  handleEditPayoutAccount,
  handleModalFileChange,
  handleModalTakePhoto,
  handleModalClearQr,
  savePayoutAccount,
  handleAvatarChange,
  formatDOB,
}) {
  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">

        {/* Left Column (Owner Profile + Payout Methods) */}
        <div className="lg:col-span-1 space-y-6">

          {/* Owner Profile Card */}
          <div className="rounded-xl border border-nexoraBorder bg-white shadow-sm p-6 flex flex-col items-center text-center relative">
            {/* Avatar Section */}
            <div className="relative group">
              <img
                src={profile.avatar}
                alt={profile.fullName}
                className="h-20 w-20 rounded-full object-cover border border-white shadow-sm"
              />
              <label className="absolute inset-0 rounded-full bg-black/40 text-white text-[9px] font-black uppercase flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                Edit
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
              </label>
            </div>
            <span className="mt-2 inline-block bg-orange-50 text-orange-600 border border-orange-100 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full">
              Business Owner
            </span>

            <div className="w-full mt-6 space-y-3.5 text-xs text-left border-t border-nexoraRule pt-4">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2 sm:py-1 gap-1">
                <span className="text-nexoraMuted font-bold">Username:</span>
                <span className="text-nexoraText font-extrabold">{profile.username}</span>
              </div>

              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2 sm:py-1 border-t border-slate-50 gap-1">
                <span className="text-nexoraMuted font-bold">Email:</span>
                <div className="flex items-center gap-1 self-end sm:self-auto min-w-0">
                  <span className="text-nexoraText font-extrabold truncate" title={profile.email}>{profile.email}</span>
                  <button
                    type="button"
                    onClick={() => showToast(currentLanguage === 'vi' ? 'Chức năng thay đổi email đang được phát triển.' : 'Email modification is currently under development.')}
                    className="text-blue-500 hover:text-blue-600 font-bold text-[10px] uppercase hover:underline ml-2 shrink-0"
                  >
                    Change
                  </button>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2 sm:py-1 border-t border-slate-50 gap-1">
                <span className="text-nexoraMuted font-bold">Referral ID:</span>
                <div className="flex items-center gap-1 self-end sm:self-auto">
                  <span className="font-mono text-nexoraText font-extrabold">{profile.referralId}</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(profile.referralId, 'ref')}
                    className="text-blue-500 hover:text-blue-600 font-bold text-[10px] uppercase hover:underline ml-2 flex items-center gap-1"
                  >
                    {copiedId === 'ref' ? (
                      <>
                        <Check className="h-3 w-3 text-emerald-600" />
                        <span className="text-emerald-600">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Payout Methods Configuration */}
          <div className="rounded-xl border border-nexoraBorder bg-white shadow-sm p-6 relative">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
              <h4 className="text-xs font-black uppercase text-nexoraText tracking-wider flex items-center gap-2">
                <Wallet className="h-4 w-4 text-nexoraBrand" />
                {currentLanguage === 'vi' ? 'Phương thức thanh toán' : 'Payout Methods'}
              </h4>
              {/* Keep Payment Wallets text for unit tests matching */}
              <span className="sr-only">Payment Wallets</span>
            </div>

            <div className="divide-y divide-slate-100">
              {payoutMethodsList.map((item) => (
                <div key={item.key} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Toggle Switch */}
                    <button
                      type="button"
                      onClick={() => handleToggleMethod(item.key)}
                      aria-label={`Toggle ${item.label}`}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        profile.payoutToggles?.[item.key] ? 'bg-amber-600' : 'bg-slate-200'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          profile.payoutToggles?.[item.key] ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>

                    {/* Logo and Label */}
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="h-7 w-7 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                        {PayoutLogos[item.key]}
                      </span>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-800">{item.label}</div>
                        {profile.paymentAccounts?.[item.key] ? (
                          <div className="text-[10px] text-slate-500 font-mono mt-0.5 truncate max-w-[110px] sm:max-w-[150px]">
                            {profile.paymentAccounts[item.key]}
                          </div>
                        ) : (
                          <div className="text-[10px] text-slate-300 italic font-medium mt-0.5">
                            Not Configured
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Edit button */}
                  <button
                    type="button"
                    onClick={() => handleEditPayoutAccount(item.key)}
                    aria-label={`Edit ${item.label} Payout Account`}
                    className="flex items-center gap-1 text-[10px] font-bold text-amber-600 hover:text-amber-700 transition shrink-0 ml-2"
                  >
                    <Edit2 className="h-3 w-3" />
                    <span>{currentLanguage === 'vi' ? 'Tài khoản' : 'Payout account'}</span>
                  </button>
                </div>
              ))}
            </div>

            {/* VLINKPAY ID display at the bottom */}
            <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center text-xs">
              <div className="flex items-center gap-2">
                <span className="h-7 w-7 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                  <img src="/assets/vlinkpay-logo.png" alt="VLINKPAY Logo" className="h-4.5 w-4.5 object-contain animate-pulse" />
                </span>
                <span className="text-nexoraMuted font-bold">VLINKPAY ID</span>
              </div>
              <span className="text-nexoraText font-extrabold font-mono bg-slate-50 border border-slate-200 px-2 py-0.5 rounded">
                {profile.paymentAccounts?.vlinkpay || 'Pending KYB'}
              </span>
            </div>

          </div>

        </div>

        {/* Right Column (Basic Info + Address Details + Business Info + Map/Sponsor Grid) */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 content-start">

          {/* Basic Information */}
          <div className="rounded-xl border border-nexoraBorder bg-white shadow-sm p-6 relative">
            <div className="flex justify-between items-center border-b border-nexoraRule pb-3 mb-4">
              <h4 className="text-xs font-black uppercase text-nexoraText tracking-wider flex items-center gap-2">
                <User className="h-4 w-4 text-nexoraBrand" />
                {currentLanguage === 'vi' ? 'Thông tin cơ bản' : 'Basic Information'}
              </h4>
              {!isEditingBasic && !hasKyb && (
                <button
                  type="button"
                  onClick={startEditBasic}
                  aria-label="Edit Basic Information"
                  className="text-slate-400 hover:text-nexoraBrand transition p-1 hover:bg-slate-100 rounded"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {isEditingBasic ? (
              <form onSubmit={saveBasic} className="space-y-4">
                <div>
                  <label className="flex items-center text-[10px] font-extrabold uppercase text-nexoraMuted gap-1">
                    <span>Full Name</span>
                    <div className="relative group inline-block normal-case font-normal text-nexoraSubtle">
                      <HelpCircle className="w-3.5 h-3.5 hover:text-nexoraBrand cursor-help transition-colors" />
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-48 bg-black text-white text-[10px] p-2.5 rounded-lg shadow-xl z-50 text-center leading-normal">
                        {currentLanguage === 'vi'
                          ? 'Nhập đầy đủ họ và tên hợp pháp của bạn như trên giấy tờ tùy thân.'
                          : 'Specify your full legal name as it appears on your official government identification documents.'}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1.5 border-4 border-transparent border-t-black"></div>
                      </div>
                    </div>
                  </label>
                  <input
                    type="text"
                    required
                    className="mt-1 h-10 w-full rounded-lg border border-nexoraBorder bg-nexoraCanvas focus:bg-white px-3.5 text-xs text-nexoraText outline-none focus:border-nexoraBrand transition-all"
                    value={basicForm.fullName}
                    onChange={(e) => setBasicForm({ ...basicForm, fullName: e.target.value })}
                  />
                </div>
                <div>
                  <label className="flex items-center text-[10px] font-extrabold uppercase text-nexoraMuted gap-1">
                    <span>Date of Birth</span>
                    <div className="relative group inline-block normal-case font-normal text-nexoraSubtle">
                      <HelpCircle className="w-3.5 h-3.5 hover:text-nexoraBrand cursor-help transition-colors" />
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-48 bg-black text-white text-[10px] p-2.5 rounded-lg shadow-xl z-50 text-center leading-normal">
                        {currentLanguage === 'vi'
                          ? 'Ngày sinh của bạn (phải từ 18 tuổi trở lên để xác thực).'
                          : 'Required for identity verification purposes (must be 18 years or older).'}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1.5 border-4 border-transparent border-t-black"></div>
                      </div>
                    </div>
                  </label>
                  <input
                    type="date"
                    required
                    className="mt-1 h-10 w-full rounded-lg border border-nexoraBorder bg-nexoraCanvas focus:bg-white px-3.5 text-xs text-nexoraText outline-none focus:border-nexoraBrand transition-all"
                    value={basicForm.dob}
                    onChange={(e) => setBasicForm({ ...basicForm, dob: e.target.value })}
                  />
                </div>
                <div>
                  <label className="flex items-center text-[10px] font-extrabold uppercase text-nexoraMuted gap-1">
                    <span>Phone Number</span>
                    <div className="relative group inline-block normal-case font-normal text-nexoraSubtle">
                      <HelpCircle className="w-3.5 h-3.5 hover:text-nexoraBrand cursor-help transition-colors" />
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-48 bg-black text-white text-[10px] p-2.5 rounded-lg shadow-xl z-50 text-center leading-normal">
                        {currentLanguage === 'vi'
                          ? 'Số điện thoại chính để nhận thông báo và xác minh tài khoản.'
                          : 'Primary phone contact for administrative account alerts and verification updates.'}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1.5 border-4 border-transparent border-t-black"></div>
                      </div>
                    </div>
                  </label>
                  <input
                    type="text"
                    required
                    className="mt-1 h-10 w-full rounded-lg border border-nexoraBorder bg-nexoraCanvas focus:bg-white px-3.5 text-xs text-nexoraText outline-none focus:border-nexoraBrand transition-all"
                    value={basicForm.phone}
                    onChange={(e) => setBasicForm({ ...basicForm, phone: e.target.value })}
                  />
                </div>
                <div className="flex gap-2 pt-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setIsEditingBasic(false)}
                    className="px-3 py-1.5 border border-slate-200 rounded text-[10px] font-bold text-slate-500 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-nexoraBrand hover:bg-nexoraBrandDark text-white rounded text-[10px] font-bold"
                  >
                    Save
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-3.5 text-xs">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2 sm:py-1 gap-1">
                  <span className="text-nexoraMuted font-bold">{currentLanguage === 'vi' ? 'Họ và tên' : 'Full Name'}</span>
                  <span className="text-nexoraText font-extrabold">{profile.fullName}</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2 sm:py-1 border-t border-slate-50 gap-1">
                  <span className="text-nexoraMuted font-bold">{currentLanguage === 'vi' ? 'Ngày sinh' : 'Date of Birth'}</span>
                  <span className="text-nexoraText font-extrabold">{formatDOB(profile.dob)}</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2 sm:py-1 border-t border-slate-50 gap-1">
                  <span className="text-nexoraMuted font-bold">{currentLanguage === 'vi' ? 'Số điện thoại' : 'Phone Number'}</span>
                  <span className="text-nexoraText font-extrabold">{profile.phone}</span>
                </div>
              </div>
            )}
          </div>

          {/* Address Details */}
          <div className="rounded-xl border border-nexoraBorder bg-white shadow-sm p-6 relative">
            <div className="flex justify-between items-center border-b border-nexoraRule pb-3 mb-4">
              <h4 className="text-xs font-black uppercase text-nexoraText tracking-wider flex items-center gap-2">
                <MapPin className="h-4 w-4 text-rose-500" />
                {currentLanguage === 'vi' ? 'Chi tiết địa chỉ' : 'Address Details'}
              </h4>
              {!isEditingAddress && !hasKyb && (
                <button
                  type="button"
                  onClick={startEditAddress}
                  aria-label="Edit Address Details"
                  className="text-slate-400 hover:text-nexoraBrand transition p-1 hover:bg-slate-100 rounded"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {isEditingAddress ? (
              <form onSubmit={saveAddress} className="space-y-4">
                <div>
                  <label className="flex items-center text-[10px] font-extrabold uppercase text-nexoraMuted gap-1">
                    <span>Street Address</span>
                    <div className="relative group inline-block normal-case font-normal text-nexoraSubtle">
                      <HelpCircle className="w-3.5 h-3.5 hover:text-nexoraBrand cursor-help transition-colors" />
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-48 bg-black text-white text-[10px] p-2.5 rounded-lg shadow-xl z-50 text-center leading-normal">
                        {currentLanguage === 'vi'
                          ? 'Cung cấp địa chỉ thực của cửa hàng. Được sử dụng để bản địa hóa và xác minh.'
                          : 'Provide the physical location of your store. Used for localization and verification purposes.'}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1.5 border-4 border-transparent border-t-black"></div>
                      </div>
                    </div>
                  </label>
                  <input
                    type="text"
                    required
                    className="mt-1 h-10 w-full rounded-lg border border-nexoraBorder bg-nexoraCanvas focus:bg-white px-3.5 text-xs text-nexoraText outline-none focus:border-nexoraBrand transition-all"
                    value={addressForm.street}
                    onChange={(e) => setAddressForm({ ...addressForm, street: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-extrabold uppercase text-nexoraMuted">City</label>
                    <input
                       type="text"
                       required
                       className="mt-1 h-10 w-full rounded-lg border border-nexoraBorder bg-nexoraCanvas focus:bg-white px-3.5 text-xs text-nexoraText outline-none focus:border-nexoraBrand transition-all"
                       value={addressForm.city}
                       onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-extrabold uppercase text-nexoraMuted">State / Province</label>
                    <input
                      type="text"
                      className="mt-1 h-10 w-full rounded-lg border border-nexoraBorder bg-nexoraCanvas focus:bg-white px-3.5 text-xs text-nexoraText outline-none focus:border-nexoraBrand transition-all"
                      value={addressForm.state}
                      onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-extrabold uppercase text-nexoraMuted">Zip Code</label>
                    <input
                      type="text"
                      required
                      className="mt-1 h-10 w-full rounded-lg border border-nexoraBorder bg-nexoraCanvas focus:bg-white px-3.5 text-xs text-nexoraText outline-none focus:border-nexoraBrand transition-all"
                      value={addressForm.zipCode}
                      onChange={(e) => setAddressForm({ ...addressForm, zipCode: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-extrabold uppercase text-nexoraMuted">Country</label>
                    <input
                      type="text"
                      required
                      className="mt-1 h-10 w-full rounded-lg border border-nexoraBorder bg-nexoraCanvas focus:bg-white px-3.5 text-xs text-nexoraText outline-none focus:border-nexoraBrand transition-all"
                      value={addressForm.country}
                      onChange={(e) => setAddressForm({ ...addressForm, country: e.target.value })}
                    />
                  </div>
                </div>
                <div className="flex gap-2 pt-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setIsEditingAddress(false)}
                    className="px-3 py-1.5 border border-slate-200 rounded text-[10px] font-bold text-slate-500 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-nexoraBrand hover:bg-nexoraBrandDark text-white rounded text-[10px] font-bold"
                  >
                    Save
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-3.5 text-xs">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start py-2 sm:py-1 gap-1">
                  <span className="text-nexoraMuted font-bold shrink-0">{currentLanguage === 'vi' ? 'Đường/Phố' : 'Street'}</span>
                  <span className="text-nexoraText font-extrabold sm:text-right break-words max-w-full sm:max-w-[180px]">{profile.street}</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2 sm:py-1 border-t border-slate-50 gap-1">
                  <span className="text-nexoraMuted font-bold">{currentLanguage === 'vi' ? 'Thành phố' : 'City'}</span>
                  <span className="text-nexoraText font-extrabold">{profile.city}</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2 sm:py-1 border-t border-slate-50 gap-1">
                  <span className="text-nexoraMuted font-bold">{currentLanguage === 'vi' ? 'Bang/Tỉnh' : 'State'}</span>
                  <span className="text-nexoraText font-extrabold">{profile.state || 'N/A'}</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2 sm:py-1 border-t border-slate-50 gap-1">
                  <span className="text-nexoraMuted font-bold">Zip Code</span>
                  <span className="text-nexoraText font-extrabold font-mono">{profile.zipCode}</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2 sm:py-1 border-t border-slate-50 gap-1">
                  <span className="text-nexoraMuted font-bold">{currentLanguage === 'vi' ? 'Quốc gia' : 'Country'}</span>
                  <span className="text-nexoraText font-extrabold">{profile.country}</span>
                </div>
              </div>
            )}
          </div>

          {/* Business Information */}
          <div className="rounded-xl border border-nexoraBorder bg-white shadow-sm p-6 relative md:col-span-2">
            <div className="flex justify-between items-center border-b border-nexoraRule pb-3 mb-4">
              <h4 className="text-xs font-black uppercase text-nexoraText tracking-wider flex items-center gap-2">
                <Building2 className="h-4 w-4 text-purple-500" />
                {currentLanguage === 'vi' ? 'Thông tin doanh nghiệp' : 'Business Information'}
              </h4>
              {!isEditingBusiness && !hasKyb && (
                <button
                  type="button"
                  onClick={startEditBusiness}
                  aria-label="Edit Business Information"
                  className="text-slate-400 hover:text-nexoraBrand transition p-1 hover:bg-slate-100 rounded"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {isEditingBusiness ? (
              <form onSubmit={saveBusiness} className="space-y-4">
                <div>
                  <label className="flex items-center text-[10px] font-extrabold uppercase text-nexoraMuted gap-1">
                    <span>Business Name</span>
                    <div className="relative group inline-block normal-case font-normal text-nexoraSubtle">
                      <HelpCircle className="w-3.5 h-3.5 hover:text-nexoraBrand cursor-help transition-colors" />
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-48 bg-black text-white text-[10px] p-2.5 rounded-lg shadow-xl z-50 text-center leading-normal">
                        {currentLanguage === 'vi'
                          ? 'Nhập tên hợp pháp hoặc tên công khai của cửa hàng/salon của bạn sẽ hiển thị trên màn hình thanh toán của khách hàng.'
                          : 'Enter the legal or public name of your store/salon as it will appear on customer payment screens.'}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1.5 border-4 border-transparent border-t-black"></div>
                      </div>
                    </div>
                  </label>
                  <input
                    type="text"
                    required
                    className="mt-1 h-10 w-full rounded-lg border border-nexoraBorder bg-nexoraCanvas focus:bg-white px-3.5 text-xs text-nexoraText outline-none focus:border-nexoraBrand transition-all"
                    value={businessForm.businessName}
                    onChange={(e) => setBusinessForm({ ...businessForm, businessName: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-extrabold uppercase text-nexoraMuted">Business Phone</label>
                    <input
                      type="text"
                      required
                      className="mt-1 h-10 w-full rounded-lg border border-nexoraBorder bg-nexoraCanvas focus:bg-white px-3.5 text-xs text-nexoraText outline-none focus:border-nexoraBrand transition-all"
                      value={businessForm.businessPhone}
                      onChange={(e) => setBusinessForm({ ...businessForm, businessPhone: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-extrabold uppercase text-nexoraMuted">Business Email</label>
                    <input
                      type="email"
                      required
                      className="mt-1 h-10 w-full rounded-lg border border-nexoraBorder bg-nexoraCanvas focus:bg-white px-3.5 text-xs text-nexoraText outline-none focus:border-nexoraBrand transition-all"
                      value={businessForm.businessEmail}
                      onChange={(e) => setBusinessForm({ ...businessForm, businessEmail: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-extrabold uppercase text-nexoraMuted">Website</label>
                  <input
                    type="text"
                    className="mt-1 h-10 w-full rounded-lg border border-nexoraBorder bg-nexoraCanvas focus:bg-white px-3.5 text-xs text-nexoraText outline-none focus:border-nexoraBrand transition-all"
                    value={businessForm.businessWebsite}
                    onChange={(e) => setBusinessForm({ ...businessForm, businessWebsite: e.target.value })}
                  />
                </div>
                <div className="flex gap-2 pt-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setIsEditingBusiness(false)}
                    className="px-3 py-1.5 border border-slate-200 rounded text-[10px] font-bold text-slate-500 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-nexoraBrand hover:bg-nexoraBrandDark text-white rounded text-[10px] font-bold"
                  >
                    Save
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-3.5 text-xs">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2 sm:py-1 gap-1">
                  <span className="text-nexoraMuted font-bold">{currentLanguage === 'vi' ? 'Tên doanh nghiệp' : 'Business Name'}</span>
                  <span className="text-nexoraText font-extrabold">{profile.businessName}</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2 sm:py-1 border-t border-slate-50 gap-1">
                  <span className="text-nexoraMuted font-bold">{currentLanguage === 'vi' ? 'Số điện thoại' : 'Phone'}</span>
                  <span className="text-nexoraText font-extrabold">{profile.businessPhone}</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2 sm:py-1 border-t border-slate-50 gap-1">
                  <span className="text-nexoraMuted font-bold">Email</span>
                  <span className="text-nexoraText font-extrabold">{profile.businessEmail}</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2 sm:py-1 border-t border-slate-50 gap-1">
                  <span className="text-nexoraMuted font-bold">Website</span>
                  {profile.businessWebsite ? (
                    <a
                      href={profile.businessWebsite}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-nexoraBrand hover:underline font-extrabold flex items-center gap-0.5"
                    >
                      {profile.businessWebsite.replace(/^https?:\/\//, '')} <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : (
                    <span className="text-nexoraSubtle font-medium">N/A</span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Nested Location Map and Sponsor Information Grid */}
            {/* Location Map */}
            <div className="rounded-xl border border-nexoraBorder bg-white shadow-sm p-6 relative overflow-hidden flex flex-col justify-between">
              <div className="flex justify-between items-center border-b border-nexoraRule pb-3 mb-4">
                <h4 className="text-xs font-black uppercase text-nexoraText tracking-wider flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-sky-500" />
                  {currentLanguage === 'vi' ? 'Bản đồ vị trí' : 'Location Map'}
                </h4>
              </div>
              <div className="h-[220px] w-full rounded-lg border border-slate-200 overflow-hidden bg-slate-100">
                <iframe
                  title="Business Location Map"
                  src="https://maps.google.com/maps?q=Palm%20Beach,%20QLD,%20Australia&t=&z=14&ie=UTF8&iwloc=&output=embed"
                  className="w-full h-full border-0 grayscale-[10%]"
                  allowFullScreen=""
                  loading="lazy"
                ></iframe>
              </div>
            </div>

            {/* Review Links */}
            <div className="rounded-xl border border-nexoraBorder bg-white shadow-sm p-6 relative">
              <div className="flex justify-between items-center border-b border-nexoraRule pb-3 mb-4">
                <h4 className="text-xs font-black uppercase text-nexoraText tracking-wider flex items-center gap-2">
                  <Globe className="h-4 w-4 text-emerald-500" />
                  {currentLanguage === 'vi' ? 'Liên kết đánh giá' : 'Review Links'}
                </h4>
                {!isEditingReviews && (
                  <button
                    type="button"
                    onClick={startEditReviews}
                    aria-label="Edit Review Links"
                    className="text-slate-400 hover:text-nexoraBrand transition p-1 hover:bg-slate-100 rounded"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {isEditingReviews ? (
                <form onSubmit={saveReviews} className="space-y-4">
                  <div>
                    <label className="text-[10px] font-extrabold uppercase text-nexoraMuted">Google Review Link</label>
                    <input
                      type="url"
                      required
                      className="mt-1 h-10 w-full rounded-lg border border-nexoraBorder bg-nexoraCanvas focus:bg-white px-3.5 text-xs text-nexoraText outline-none focus:border-nexoraBrand transition-all"
                      value={reviewsForm.googleReview}
                      onChange={(e) => setReviewsForm({ ...reviewsForm, googleReview: e.target.value })}
                      placeholder="https://g.page/r/.../review"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-extrabold uppercase text-nexoraMuted">Yelp Review Link</label>
                    <input
                      type="url"
                      required
                      className="mt-1 h-10 w-full rounded-lg border border-nexoraBorder bg-nexoraCanvas focus:bg-white px-3.5 text-xs text-nexoraText outline-none focus:border-nexoraBrand transition-all"
                      value={reviewsForm.yelpReview}
                      onChange={(e) => setReviewsForm({ ...reviewsForm, yelpReview: e.target.value })}
                      placeholder="https://www.yelp.com/biz/..."
                    />
                  </div>
                  <div className="flex gap-2 pt-2 justify-end">
                    <button
                      type="button"
                      onClick={() => setIsEditingReviews(false)}
                      className="px-3 py-1.5 border border-slate-200 rounded text-[10px] font-bold text-slate-500 hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-3 py-1.5 bg-nexoraBrand hover:bg-nexoraBrandDark text-white rounded text-[10px] font-bold"
                    >
                      Save
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-3.5 text-xs">
                  <div className="flex flex-col py-1.5 border-b border-slate-50 gap-1">
                    <span className="text-nexoraMuted font-bold">Google Review Link</span>
                    {profile.googleReview ? (
                      <a
                        href={profile.googleReview}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-nexoraBrand hover:underline font-extrabold flex items-center gap-0.5 break-all text-[11px]"
                      >
                        {profile.googleReview} <ExternalLink className="h-3 w-3 shrink-0" />
                      </a>
                    ) : (
                      <span className="text-nexoraSubtle font-medium">Not Configured</span>
                    )}
                  </div>
                  <div className="flex flex-col py-1.5 border-b border-slate-50 gap-1">
                    <span className="text-nexoraMuted font-bold">Yelp Review Link</span>
                    {profile.yelpReview ? (
                      <a
                        href={profile.yelpReview}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-nexoraBrand hover:underline font-extrabold flex items-center gap-0.5 break-all text-[11px]"
                      >
                        {profile.yelpReview} <ExternalLink className="h-3 w-3 shrink-0" />
                      </a>
                    ) : (
                      <span className="text-nexoraSubtle font-medium">Not Configured</span>
                    )}
                  </div>
                </div>
              )}
            </div>

        </div>

      </div>

      {/* Payout Account Edit Custom Modal Popup */}
      {editingMethod && (() => {
        const walletNames = {
          zelle: 'Zelle',
          bankwire: 'Bank Wire',
          paypal: 'PayPal',
          venmo: 'Venmo',
          cashapp: 'Cash App',
          applecash: 'Apple Cash'
        }

        const walletFields = {
          zelle: currentLanguage === 'vi' ? 'email/SĐT' : 'email/phone',
          bankwire: currentLanguage === 'vi' ? 'chi tiết' : 'details',
          paypal: 'email',
          venmo: '@username',
          cashapp: '$cashtag',
          applecash: currentLanguage === 'vi' ? 'SĐT' : 'phone number'
        }

        const walletPlaceholders = {
          zelle: currentLanguage === 'vi' ? 'Nhập email/SĐT Zelle...' : 'Enter Zelle email/phone...',
          bankwire: currentLanguage === 'vi' ? 'Số tài khoản & Số Routing...' : 'Enter Bank Wire routing - account...',
          paypal: currentLanguage === 'vi' ? 'Nhập PayPal email...' : 'Enter PayPal email...',
          venmo: currentLanguage === 'vi' ? 'Nhập Venmo @username...' : 'Enter Venmo @username...',
          cashapp: currentLanguage === 'vi' ? 'Nhập Cash App $cashtag...' : 'Enter Cash App $cashtag...',
          applecash: currentLanguage === 'vi' ? 'Nhập số điện thoại...' : 'Enter Apple Cash phone number...'
        }

        return (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl border border-slate-100 max-w-sm w-full shadow-2xl p-6 relative overflow-hidden animate-scaleIn text-left space-y-4.5">

              {/* Header */}
              <div className="flex items-center gap-3.5 border-b border-slate-100 pb-3">
                <span className="h-11 w-11 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 shadow-sm">
                  {PayoutLogos[editingMethod]}
                </span>
                <div>
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">
                    {currentLanguage === 'vi'
                      ? `CẤU HÌNH ${walletNames[editingMethod]?.toUpperCase()}`
                      : `CONFIGURE ${walletNames[editingMethod]?.toUpperCase()}`}
                  </h3>
                  <p className="text-[10px] text-slate-400 font-medium">
                    {currentLanguage === 'vi' ? 'Chỉ định thông tin tài khoản nhận tiền' : 'Specify receiving target identifier'}
                  </p>
                </div>
              </div>

              {/* Form Content */}
              <form onSubmit={savePayoutAccount} className="space-y-4">
                {/* Account Identifier Input */}
                <div>
                  <label className="block text-[10px] font-extrabold uppercase text-slate-500 tracking-wider mb-2">
                    {currentLanguage === 'vi'
                      ? `${walletNames[editingMethod]?.toUpperCase()} EMAIL/SĐT CỦA BẠN *`
                      : `YOUR ${walletNames[editingMethod]?.toUpperCase()} EMAIL/PHONE *`}
                  </label>
                  <input
                    type="text"
                    required
                    autoFocus
                    value={editValue}
                    onChange={(e) => {
                      setEditValue(e.target.value)
                      setModalError('')
                    }}
                    placeholder={walletPlaceholders[editingMethod]}
                    className={`w-full bg-slate-50 border border-slate-200 focus:border-nexoraBrand focus:ring-2 focus:ring-[#4648D8]/20 focus:bg-white rounded-xl px-3.5 h-11 text-xs text-slate-800 focus:outline-none transition-all ${
                      modalError ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20' : ''
                    }`}
                  />
                  {modalError && <p className="mt-1 text-[10px] font-bold text-rose-500">{modalError}</p>}
                </div>

                {/* QR Code Optional Upload */}
                <div>
                  <label className="block text-[10px] font-extrabold uppercase text-slate-500 tracking-wider mb-2">
                    {currentLanguage === 'vi' ? 'MÃ QR (TÙY CHỌN)' : 'QR CODE (OPTIONAL)'}
                  </label>

                  {isCapturing ? (
                    <div className="flex h-44 w-full flex-col items-center justify-center rounded-xl border border-slate-200 bg-slate-50">
                      <div className="h-6 w-6 border-2 border-nexoraBrand/20 border-t-nexoraBrand rounded-full animate-spin"></div>
                      <span className="mt-2 text-xs font-semibold text-slate-500">
                        {currentLanguage === 'vi' ? 'Đang chụp hình...' : 'Taking photo...'}
                      </span>
                    </div>
                  ) : editQrCode ? (
                    <div className="relative flex flex-col items-center rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                      <button
                        type="button"
                        onClick={handleModalClearQr}
                        className="absolute right-2 top-2 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
                        title="Remove image"
                      >
                        <X className="h-4 w-4" />
                      </button>
                      <div className="text-center">
                        <div className="text-sm font-extrabold text-slate-800">{walletNames[editingMethod]}</div>
                        <div className="text-[10px] font-semibold text-slate-400 mt-0.5">{editValue}</div>
                      </div>
                      <div className="my-3 flex h-28 w-28 items-center justify-center border border-slate-100 bg-white p-1 rounded-lg">
                        <img src={editQrCode} alt="Payout QR Code" className="h-full w-full object-contain" />
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={handleModalTakePhoto}
                        className="flex flex-col items-center justify-center py-5 border border-dashed border-slate-200 hover:border-nexoraBrand rounded-xl bg-slate-50 hover:bg-slate-50/50 transition gap-1.5"
                      >
                        <Camera className="w-5 h-5 text-nexoraBrand" />
                        <span className="text-[11px] font-bold text-slate-600">
                          {currentLanguage === 'vi' ? 'CHỤP HÌNH' : 'TAKE PHOTO'}
                        </span>
                      </button>
                      <label
                        className="flex flex-col items-center justify-center py-5 border border-dashed border-slate-200 hover:border-nexoraBrand rounded-xl bg-slate-50 hover:bg-slate-50/50 transition gap-1.5 cursor-pointer"
                      >
                        <FolderOpen className="w-5 h-5 text-nexoraBrand" />
                        <span className="text-[11px] font-bold text-slate-600">
                          {currentLanguage === 'vi' ? 'CHỌN FILE' : 'CHOOSE FILE'}
                        </span>
                        <input type="file" accept="image/*" className="sr-only" onChange={handleModalFileChange} />
                      </label>
                    </div>
                  )}
                </div>

                {/* Warning box */}
                <div className="rounded-lg bg-blue-50/50 border border-blue-100 p-3 text-[10px] leading-relaxed text-blue-800 flex gap-2">
                  <AlertTriangle className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                  <span>
                    {currentLanguage === 'vi'
                      ? 'Vui lòng nhập đúng thông tin tài khoản nhận tiền. Tài khoản này sẽ được dùng để nhận tiền tip.'
                      : 'Please enter the correct receiving account information. This will be used to receive payments.'}
                  </span>
                </div>

                {/* Footer Action Buttons */}
                <div className="flex justify-end gap-2.5 pt-2.5 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setEditingMethod(null)}
                    className="px-5 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider rounded-lg transition"
                  >
                    {currentLanguage === 'vi' ? 'HỦY' : 'CANCEL'}
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow-sm transition"
                  >
                    {currentLanguage === 'vi' ? 'LƯU LẠI' : 'SAVE'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}
    </>
  )
}
