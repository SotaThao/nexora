import React, { useState } from 'react'
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
          onClick={() => form.handleTabChange('profile')}
          className={`px-4 py-2 rounded-lg text-xs font-extrabold uppercase transition ${
            form.activeTab === 'profile'
              ? 'bg-nexoraBrand text-white shadow-sm'
              : 'bg-nexoraSurfaceMuted text-nexoraMuted hover:bg-slate-200'
          }`}
        >
          {form.currentLanguage === 'vi' ? 'Hồ sơ cá nhân' : 'Profile'}
        </button>
        <button
          type="button"
          onClick={() => form.handleTabChange('kyb')}
          className={`px-4 py-2 rounded-lg text-xs font-extrabold uppercase transition ${
            form.activeTab === 'kyb'
              ? 'bg-nexoraBrand text-white shadow-sm'
              : 'bg-nexoraSurfaceMuted text-nexoraMuted hover:bg-slate-200'
          }`}
        >
          {form.currentLanguage === 'vi' ? 'Xác thực KYB' : 'KYB'}
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

      </div>
    </div>
  )
}
