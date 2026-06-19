import React, { useMemo, useRef, useState } from 'react'
import { QrCode, Copy, Check, X, Download } from 'lucide-react'
import useSettingsForm from './settings/hooks/useSettingsForm'
import ProfileTab from './settings/tabs/ProfileTab'
import KybTab from './settings/tabs/KybTab'
import { downloadQrCode } from '../utils/qrUtils'
import { buildAffiliateReferralUrl, getProfileReferralCode } from '../utils/affiliateReferral'
import { useTranslation } from '../contexts/LanguageContext'

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
  const { t } = useTranslation()
  const kybPortalRef = useRef(null)
  const form = useSettingsForm({
    setupData,
    hasKyb,
    userEmail,
    onKybRequired,
    initialTab,
    onTabChange,
    onKybSuccess,
    verificationStatus,
    openKybPortal: () => kybPortalRef.current?.openPortal(),
  })

  const [showQrModal, setShowQrModal] = useState(false)
  const [selectedLeg, setSelectedLeg] = useState('left')

  const referralCode = useMemo(
    () => getProfileReferralCode(form.profile),
    [form.profile],
  )
  const baseReferralUrl = useMemo(
    () => buildAffiliateReferralUrl({ referralCode }),
    [referralCode],
  )
  const referralUrl = useMemo(
    () => buildAffiliateReferralUrl({ referralCode, leg: selectedLeg }),
    [referralCode, selectedLeg],
  )
  const qrCodeUrl = (url: string) =>
    `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(url)}`

  const handleSaveQr = async (qrUrl) => {
    try {
      await downloadQrCode(qrUrl, `referral-qr-${selectedLeg}.png`)
      form.showToast(t('components.SettingsView.qrCodeDownloaded'))
    } catch {
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
            {t('components.SettingsView.settingsConfiguration')}
          </h2>
          <p className="mt-1 text-xs text-nexoraMuted">
            {t('components.SettingsView.manageYourOwnerCredentials')}
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
          {t('components.SettingsView.account')}
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
          {t('components.SettingsView.kyb')}
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
          {t('components.SettingsView.affiliateLink')}
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
            handleAvatarChange={form.handleAvatarChange}
            formatDOB={form.formatDOB}
            onShowQr={() => setShowQrModal(true)}
          />
        )}

        {form.activeTab === 'kyb' && (
          <KybTab
            profile={form.profile}
            cardDetails={cardDetails}
            verificationStatus={verificationStatus}
            showToast={form.showToast}
            portalRef={kybPortalRef}
          />
        )}

        {form.activeTab === 'affiliate' && (
          <div className="rounded-xl border border-nexoraBorder bg-white shadow-sm p-6 max-w-xl mx-auto animate-fadeIn select-none space-y-6">
            <div className="flex justify-between items-center border-b border-nexoraRule pb-3">
              <h4 className="text-xs font-black uppercase text-nexoraText tracking-wider flex items-center gap-2">
                <QrCode className="h-4 w-4 text-nexoraBrand" />
                {t('components.SettingsView.affiliateLink2')}
              </h4>
            </div>
            
            {/* QR Section (Inline) */}
            <div className="flex flex-col items-center">
              {/* QR Code Container */}
              <div className="flex justify-center mb-2">
                <div className="bg-slate-50 p-4 border border-slate-200 rounded-2xl flex items-center justify-center h-[240px] w-[240px] shadow-sm hover:shadow-md transition">
                  {baseReferralUrl ? (
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(baseReferralUrl)}`}
                      alt="Referral Link QR Code"
                      className="h-full w-full object-contain rounded-lg"
                    />
                  ) : (
                    <span className="text-xs font-bold text-nexoraMuted text-center px-4">
                      {t('components.staff_registration.hooks.useStaffRegistration.profileReferralCodeMissing')}
                    </span>
                  )}
                </div>
              </div>

              {/* Clickable Referral URL Link */}
              <div className="text-center mb-4 max-w-xs sm:max-w-md min-w-0 px-2">
                {baseReferralUrl ? (
                  <a
                    href={baseReferralUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:text-blue-600 underline text-[11px] font-bold break-all"
                  >
                    {baseReferralUrl}
                  </a>
                ) : (
                  <span className="text-[11px] font-bold text-nexoraMuted">
                    {t('components.staff_registration.hooks.useStaffRegistration.profileReferralCodeMissing')}
                  </span>
                )}
              </div>

              {/* Buttons: Download QR & Copy Link */}
              <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs sm:max-w-md justify-center">
                <button
                  type="button"
                  disabled={!baseReferralUrl}
                  onClick={() => handleSaveQr(qrCodeUrl(baseReferralUrl))}
                  className="flex-1 flex items-center justify-center gap-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs uppercase tracking-wider py-3 rounded-xl transition active:scale-[0.98] shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Download className="h-4 w-4 text-slate-500" />
                  <span>Download QR</span>
                </button>

                <button
                  type="button"
                  disabled={!baseReferralUrl}
                  onClick={() => form.handleCopy(baseReferralUrl, 'inline-ref')}
                  className="flex-1 flex items-center justify-center gap-2 bg-nexoraBrand hover:bg-nexoraBrandDark text-white font-bold text-xs uppercase tracking-wider py-3 rounded-xl transition active:scale-[0.98] shadow-sm shadow-indigo-500/10 disabled:cursor-not-allowed disabled:opacity-50"
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
              {t('components.SettingsView.registerANewMember')}
            </h3>
            <p className="text-[11px] text-slate-400 leading-normal">
              {t('components.SettingsView.shareThisLinkTo')}
            </p>

            {/* Select Placement Leg */}
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
              <span className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider mb-2 block">
                {t('components.SettingsView.selectPlacementLeg')}
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
                      ? 'border-nexoraWarning bg-nexoraWarning/10' 
                      : 'border-slate-300 bg-white'
                  }`}>
                    {selectedLeg === 'left' && (
                      <span className="w-1.5 h-1.5 rounded-full bg-nexoraWarning" />
                    )}
                  </span>
                  <span className={selectedLeg === 'left' ? 'text-nexoraWarning font-black' : 'text-slate-500'}>
                    {t('components.SettingsView.leftLeg')}
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
                      ? 'border-nexoraWarning bg-nexoraWarning/10' 
                      : 'border-slate-300 bg-white'
                  }`}>
                    {selectedLeg === 'right' && (
                      <span className="w-1.5 h-1.5 rounded-full bg-nexoraWarning" />
                    )}
                  </span>
                  <span className={selectedLeg === 'right' ? 'text-nexoraWarning font-black' : 'text-slate-500'}>
                    {t('components.SettingsView.rightLeg')}
                  </span>
                </label>
              </div>
            </div>

            {/* QR Code Display */}
            <div className="flex justify-center my-3">
              <div className="bg-slate-50 p-4 border border-slate-200 rounded-xl flex items-center justify-center h-[240px] w-[240px]">
                {referralUrl ? (
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(referralUrl)}`}
                    alt="Referral Link QR Code"
                    className="h-full w-full object-contain rounded"
                  />
                ) : (
                  <span className="text-xs font-bold text-nexoraMuted text-center px-4">
                    {t('components.staff_registration.hooks.useStaffRegistration.profileReferralCodeMissing')}
                  </span>
                )}
              </div>
            </div>

            {/* Save QR Button */}
            <button
              type="button"
              disabled={!referralUrl}
              onClick={() => handleSaveQr(qrCodeUrl(referralUrl))}
              className="w-full bg-nexoraWarning hover:bg-nexoraWarning text-black font-extrabold text-xs uppercase tracking-wider py-3.5 rounded-xl transition active:scale-[0.98] shadow-md shadow-amber-500/10 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Save QR
            </button>

          </div>
        </div>
      )}
    </div>
  )
}
