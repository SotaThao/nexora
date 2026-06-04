import React, { useState } from 'react'
import { QrCode, Copy, Check, X, Download } from 'lucide-react'
import useSettingsForm from './settings/hooks/useSettingsForm'
import ProfileTab from './settings/tabs/ProfileTab'
import KybTab from './settings/tabs/KybTab'

export default function SettingsView({
  setupData,
  hasKyb = true,
  userEmail,
  onKybRequired,
  initialTab = 'profile',
  onTabChange,
  onKybSuccess,
  verificationStatus = hasKyb ? 'kyb_approved' : 'basic'
}) {
  const form = useSettingsForm({
    setupData,
    hasKyb,
    userEmail,
    onKybRequired,
    initialTab,
    onTabChange,
    onKybSuccess,
    verificationStatus
  })

  const [showKybBankAccount, setShowKybBankAccount] = useState(false)
  const [showQrModal, setShowQrModal] = useState(false)
  const [selectedLeg, setSelectedLeg] = useState('left')

  const referralUrl = `https://nexora.com/?ref=${form.profile.referralId || '640B5FBF'}&leg=${selectedLeg}`
  const baseReferralUrl = `https://nexora.com/?ref=${form.profile.referralId || '640B5FBF'}`

  const handleSaveQr = async (qrUrl) => {
    try {
      const response = await fetch(qrUrl)
      const blob = await response.blob()
      const blobUrl = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = blobUrl
      link.download = `referral-qr-${selectedLeg}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(blobUrl)
      form.showToast(form.currentLanguage === 'vi' ? 'Đã tải xuống mã QR!' : 'QR code downloaded!')
    } catch (error) {
      console.error('Failed to download QR code', error)
      window.open(qrUrl, '_blank')
    }
  }

  const handleTabChange = (tab) => {
    form.handleTabChange(tab)
  }

  const cardDetails = form.getStatusCardDetails()

  return (
    <div className="w-full space-y-6 animate-fadeIn pb-24 select-none">
      {/* Toast Notification */}
      {form.toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs font-semibold shadow-2xl flex items-center gap-2 animate-bounce">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
          {form.toastMessage}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-nexoraRule pb-4">
        <div>
          <h2 className="text-xl font-extrabold text-nexoraText">
            {form.currentLanguage === 'vi' ? 'Cấu Hinh Cài Đặt' : 'Settings Configuration'}
          </h2>
          <p className="mt-1 text-xs text-nexoraMuted">
            {form.currentLanguage === 'vi'
              ? 'Quản lý thông tin tài khoản chủ sở hữu, địa chỉ cửa hàng và cấu hình xác thực pháp lý (KYB).'
              : 'Manage your owner credentials, store configurations, receiving wallets, and corporate compliance details (KYB).'}
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 pb-2">
        <button
          type="button"
          onClick={() => handleTabChange('profile')}
          className={`px-4 py-2 rounded-lg text-xs font-extrabold uppercase transition ${
            form.activeTab === 'profile'
              ? 'bg-nexoraBrand text-white shadow-sm'
              : 'bg-nexoraSurfaceMuted text-nexoraMuted hover:bg-slate-200'
          }`}
        >
          {form.currentLanguage === 'vi' ? 'Tài khoản' : 'Account'}
        </button>
        <button
          type="button"
          onClick={() => handleTabChange('kyb')}
          className={`px-4 py-2 rounded-lg text-xs font-extrabold uppercase transition ${
            form.activeTab === 'kyb'
              ? 'bg-nexoraBrand text-white shadow-sm'
              : 'bg-nexoraSurfaceMuted text-nexoraMuted hover:bg-slate-200'
          }`}
        >
          {form.currentLanguage === 'vi' ? 'Xác thực KYB' : 'KYB'}
        </button>
        <button
          type="button"
          onClick={() => handleTabChange('affiliate')}
          className={`px-4 py-2 rounded-lg text-xs font-extrabold uppercase transition ${
            form.activeTab === 'affiliate'
              ? 'bg-nexoraBrand text-white shadow-sm'
              : 'bg-nexoraSurfaceMuted text-nexoraMuted hover:bg-slate-200'
          }`}
        >
          {form.currentLanguage === 'vi' ? 'Affiliate Link' : 'Affiliate Link'}
        </button>
      </div>

      {/* Content Area */}
      <div className="space-y-6">

        {form.activeTab === 'profile' && (
          <ProfileTab
            profile={form.profile}
            copiedId={form.copiedId}
            isEditingBasic={form.isEditingBasic}
            setIsEditingBasic={form.setIsEditingBasic}
            basicForm={form.basicForm}
            setBasicForm={form.setBasicForm}
            isEditingAddress={form.isEditingAddress}
            setIsEditingAddress={form.setIsEditingAddress}
            addressForm={form.addressForm}
            setAddressForm={form.setAddressForm}
            isEditingBusiness={form.isEditingBusiness}
            setIsEditingBusiness={form.setIsEditingBusiness}
            businessForm={form.businessForm}
            setBusinessForm={form.setBusinessForm}
            isEditingReviews={form.isEditingReviews}
            setIsEditingReviews={form.setIsEditingReviews}
            reviewsForm={form.reviewsForm}
            setReviewsForm={form.setReviewsForm}
            editingMethod={form.editingMethod}
            setEditingMethod={form.setEditingMethod}
            editValue={form.editValue}
            setEditValue={form.setEditValue}
            editQrCode={form.editQrCode}
            setEditQrCode={form.setEditQrCode}
            isCapturing={form.isCapturing}
            modalError={form.modalError}
            setModalError={form.setModalError}
            hasKyb={hasKyb}
            currentLanguage={form.currentLanguage}
            showToast={form.showToast}
            handleCopy={form.handleCopy}
            startEditBasic={form.startEditBasic}
            saveBasic={form.saveBasic}
            startEditAddress={form.startEditAddress}
            saveAddress={form.saveAddress}
            startEditBusiness={form.startEditBusiness}
            saveBusiness={form.saveBusiness}
            startEditReviews={form.startEditReviews}
            saveReviews={form.saveReviews}
            handleToggleMethod={form.handleToggleMethod}
            handleEditPayoutAccount={form.handleEditPayoutAccount}
            handleModalFileChange={form.handleModalFileChange}
            handleModalTakePhoto={form.handleModalTakePhoto}
            handleModalClearQr={form.handleModalClearQr}
            savePayoutAccount={form.savePayoutAccount}
            handleAvatarChange={form.handleAvatarChange}
            formatDOB={form.formatDOB}
            onShowQr={() => setShowQrModal(true)}
          />
        )}

        {form.activeTab === 'kyb' && (
          <KybTab
            profile={form.profile}
            kybData={form.kybData}
            setKybData={form.setKybData}
            isSubmittingKyb={form.isSubmittingKyb}
            kybErrors={form.kybErrors}
            showPortal={form.showPortal}
            setShowPortal={form.setShowPortal}
            handleKybSubmit={form.handleKybSubmit}
            showKybBankAccount={showKybBankAccount}
            setShowKybBankAccount={setShowKybBankAccount}
            cardDetails={cardDetails}
            verificationStatus={verificationStatus}
            currentLanguage={form.currentLanguage}
            showToast={form.showToast}
          />
        )}

        {form.activeTab === 'affiliate' && (
          <div className="rounded-xl border border-nexoraBorder bg-white shadow-sm p-6 max-w-xl mx-auto animate-fadeIn select-none space-y-6">
            <div className="flex justify-between items-center border-b border-nexoraRule pb-3">
              <h4 className="text-xs font-black uppercase text-nexoraText tracking-wider flex items-center gap-2">
                <QrCode className="h-4 w-4 text-nexoraBrand" />
                {form.currentLanguage === 'vi' ? 'Liên kết Affiliate' : 'Affiliate Link'}
              </h4>
            </div>
            
            {/* QR Section (Inline) */}
            <div className="flex flex-col items-center">
              {/* QR Code Container */}
              <div className="flex justify-center mb-2">
                <div className="bg-slate-50 p-4 border border-slate-200 rounded-2xl flex items-center justify-center h-[240px] w-[240px] shadow-sm hover:shadow-md transition">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(baseReferralUrl)}`}
                    alt="Referral Link QR Code"
                    className="h-full w-full object-contain rounded-lg"
                  />
                </div>
              </div>

              {/* Clickable Referral URL Link */}
              <div className="text-center mb-4 max-w-xs sm:max-w-md min-w-0 px-2">
                <a
                  href={baseReferralUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:text-blue-600 underline text-[11px] font-bold break-all"
                >
                  {baseReferralUrl}
                </a>
              </div>

              {/* Buttons: Download QR & Copy Link */}
              <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs sm:max-w-md justify-center">
                <button
                  type="button"
                  onClick={() => handleSaveQr(
                    `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(baseReferralUrl)}`
                  )}
                  className="flex-1 flex items-center justify-center gap-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs uppercase tracking-wider py-3 rounded-xl transition active:scale-[0.98] shadow-sm"
                >
                  <Download className="h-4 w-4 text-slate-500" />
                  <span>Download QR</span>
                </button>

                <button
                  type="button"
                  onClick={() => form.handleCopy(baseReferralUrl, 'inline-ref')}
                  className="flex-1 flex items-center justify-center gap-2 bg-nexoraBrand hover:bg-nexoraBrandDark text-white font-bold text-xs uppercase tracking-wider py-3 rounded-xl transition active:scale-[0.98] shadow-sm shadow-indigo-500/10"
                >
                  {form.copiedId === 'inline-ref' ? (
                    <>
                      <Check className="h-4 w-4 text-white" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 text-white" />
                      <span>Copy Link</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Show QR Code Modal Popup */}
      {showQrModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-100 max-w-sm w-full shadow-2xl p-6 relative overflow-hidden animate-scaleIn text-center text-slate-800 space-y-4">
            
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setShowQrModal(false)}
              className="absolute right-4 top-4 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
              title="Close modal"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Title */}
            <h3 className="text-lg font-black text-slate-800 uppercase tracking-wider mt-2">
              {form.currentLanguage === 'vi' ? 'Đăng ký Thành viên Mới' : 'Register a New Member'}
            </h3>
            <p className="text-[11px] text-slate-400 leading-normal">
              {form.currentLanguage === 'vi' 
                ? 'Chia sẻ liên kết này để mời thành viên mới gia nhập mạng lưới của bạn.' 
                : 'Share this link to invite a new member to join your network.'}
            </p>

            {/* Select Placement Leg */}
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
              <span className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider mb-2 block">
                {form.currentLanguage === 'vi' ? 'Chọn Nhánh Xếp Lập' : 'Select Placement Leg'}
              </span>
              <div className="flex justify-center gap-6 mt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                  <input
                    type="radio"
                    name="placementLeg"
                    value="left"
                    checked={selectedLeg === 'left'}
                    onChange={() => setSelectedLeg('left')}
                    className="sr-only"
                  />
                  <span className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
                    selectedLeg === 'left' 
                      ? 'border-[#f0b90b] bg-[#f0b90b]/10' 
                      : 'border-slate-300 bg-white'
                  }`}>
                    {selectedLeg === 'left' && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#f0b90b]" />
                    )}
                  </span>
                  <span className={selectedLeg === 'left' ? 'text-[#e6ad00] font-black' : 'text-slate-500'}>
                    {form.currentLanguage === 'vi' ? 'Nhánh Trái' : 'Left Leg'}
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                  <input
                    type="radio"
                    name="placementLeg"
                    value="right"
                    checked={selectedLeg === 'right'}
                    onChange={() => setSelectedLeg('right')}
                    className="sr-only"
                  />
                  <span className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
                    selectedLeg === 'right' 
                      ? 'border-[#f0b90b] bg-[#f0b90b]/10' 
                      : 'border-slate-300 bg-white'
                  }`}>
                    {selectedLeg === 'right' && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#f0b90b]" />
                    )}
                  </span>
                  <span className={selectedLeg === 'right' ? 'text-[#e6ad00] font-black' : 'text-slate-500'}>
                    {form.currentLanguage === 'vi' ? 'Nhánh Phải' : 'Right Leg'}
                  </span>
                </label>
              </div>
            </div>

            {/* QR Code Display */}
            <div className="flex justify-center my-3">
              <div className="bg-slate-50 p-4 border border-slate-200 rounded-xl flex items-center justify-center h-[240px] w-[240px]">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
                    `https://nexora.com/?ref=${form.profile.referralId || '640B5FBF'}&leg=${selectedLeg}`
                  )}`}
                  alt="Referral Link QR Code"
                  className="h-full w-full object-contain rounded"
                />
              </div>
            </div>

            {/* Save QR Button */}
            <button
              type="button"
              onClick={() => handleSaveQr(
                `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(
                  `https://nexora.com/?ref=${form.profile.referralId || '640B5FBF'}&leg=${selectedLeg}`
                )}`
              )}
              className="w-full bg-[#f0b90b] hover:bg-[#d4a30a] text-black font-extrabold text-xs uppercase tracking-wider py-3.5 rounded-xl transition active:scale-[0.98] shadow-md shadow-amber-500/10"
            >
              Save QR
            </button>

          </div>
        </div>
      )}
    </div>
  )
}
