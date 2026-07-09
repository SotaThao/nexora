import React, { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  ArrowLeft,
  Bell,
  Check,
  ChevronRight,
  Copy,
  CreditCard,
  Download,
  FileText,
  Languages,
  Lock,
  LogOut,
  QrCode,
  ShieldCheck,
  Star,
  UserCircle,
  Users,
  Wallet,
  X,
} from 'lucide-react'
import useSettingsForm from './settings/hooks/useSettingsForm'
import ProfileTab from './settings/tabs/ProfileTab'
import useAuth from '../auth/useAuth'
import { downloadQrCode, buildPublicQrImageUrl } from '../utils/qrUtils'
import { buildAffiliateReferralUrl, getProfileReferralCode } from '../utils/affiliateReferral'
import { useTranslation } from '../contexts/LanguageContext'
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
  useUnreadCount,
} from '../data/hooks/useNotifications'
import { formatNotificationDateTime } from './dashboard/utils'
import QrImage from './ui/QrImage'

const compactPanel =
  'rounded-lg border border-[#EEE9FF] bg-white p-2.5 shadow-[0_8px_18px_rgba(70,72,212,0.08)]'

function MerchantProfileMenuItem({ icon: Icon, label, sub = null, onClick = null }: any) {
  return (
    <button
      type="button"
      onClick={onClick || undefined}
      className="flex min-h-[48px] w-full items-center gap-3 rounded-lg px-2 text-left transition hover:bg-[#F8F7FF] active:scale-[0.99]"
    >
      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white text-slate-500">
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px] font-semibold text-nexoraText">{label}</span>
        {sub ? <span className="block truncate text-[10px] font-medium text-nexoraMuted">{sub}</span> : null}
      </span>
      <ChevronRight className="h-4 w-4 shrink-0 text-nexoraSubtle" />
    </button>
  )
}

function MerchantVerificationMenuItem({ label, status, verified, onClick }: any) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-[48px] w-full items-center gap-3 rounded-lg px-2 text-left transition hover:bg-[#F8F7FF] active:scale-[0.99]"
    >
      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-slate-300 bg-white text-slate-500">
        <ShieldCheck className="h-4 w-4" />
      </span>
      <span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-nexoraText">{label}</span>
      <span className={`shrink-0 rounded-full px-3 py-1 text-[10px] font-extrabold ${verified ? 'bg-emerald-50 text-emerald-500' : 'bg-amber-50 text-amber-600'}`}>
        {status}
      </span>
      <ChevronRight className="h-4 w-4 shrink-0 text-nexoraSubtle" />
    </button>
  )
}

function MerchantLanguageMenuItem({ label, value, onClick }: any) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-[48px] w-full items-center gap-3 rounded-lg px-2 text-left transition hover:bg-[#F8F7FF] active:scale-[0.99]"
    >
      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white text-slate-500">
        <Languages className="h-4 w-4" />
      </span>
      <span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-nexoraText">{label}</span>
      <span className="shrink-0 text-[11px] font-semibold text-slate-500">{value}</span>
      <ChevronRight className="h-4 w-4 shrink-0 text-nexoraSubtle" />
    </button>
  )
}

function MerchantProfileSectionHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={onBack}
        className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-[#EEE9FF] bg-white text-nexoraText shadow-sm transition active:scale-95"
        aria-label="Back"
      >
        <ArrowLeft className="h-4 w-4" />
      </button>
      <h1 className="min-w-0 truncate text-base font-semibold text-nexoraText">{title}</h1>
    </div>
  )
}

const notificationPanel =
  'rounded-2xl border border-nexoraBorder bg-nexoraSurface p-4 shadow-sm sm:p-5'

const notificationIconMap: Record<string, any> = {
  TipReceived: Wallet,
  BusinessReview: Star,
  ReviewReply: Star,
  StaffLinkRequest: Users,
  StaffLinkApproved: Users,
  StaffInviteAccepted: Users,
  DirectPaymentReceived: CreditCard,
}

function MerchantNotificationsContent() {
  const { t, currentLanguage } = useTranslation()
  const { data: notifications = [], isPending } = useNotifications()
  const { data: unreadCount = 0 } = useUnreadCount()
  const markReadMutation = useMarkNotificationRead()
  const markAllReadMutation = useMarkAllNotificationsRead()

  const handleMarkAllRead = () => {
    if (markAllReadMutation.isPending) return
    markAllReadMutation.mutate()
  }

  if (isPending) {
    return (
      <section className={notificationPanel}>
        <div className="animate-pulse space-y-3">
          <div className="h-5 w-36 rounded bg-nexoraSurfaceMuted" />
          <div className="h-14 rounded-xl bg-nexoraSurfaceMuted" />
          <div className="h-14 rounded-xl bg-nexoraSurfaceMuted" />
          <div className="h-14 rounded-xl bg-nexoraSurfaceMuted" />
        </div>
      </section>
    )
  }

  return (
    <section className={notificationPanel}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-base font-extrabold text-nexoraText">
          {t('staff_dashboard.titles.notifications')}
        </h3>
        {unreadCount > 0 ? (
          <button
            type="button"
            onClick={handleMarkAllRead}
            disabled={markAllReadMutation.isPending}
            className="shrink-0 text-xs font-bold text-nexoraBrand transition hover:opacity-80 disabled:opacity-50"
          >
            {t('staff_dashboard.notifications.mark_all_read')}
          </button>
        ) : null}
      </div>

      {notifications.length === 0 ? (
        <p className="py-6 text-center text-xs text-nexoraSubtle">
          {t('staff_dashboard.notifications.empty')}
        </p>
      ) : (
        <div className="space-y-1">
          {notifications.map((notification: any) => {
            const Icon = notificationIconMap[notification.type] || Bell
            const title = notification.title?.trim() || t('staff_dashboard.notifications.generic_title')
            const message = (notification.message || notification.body || '').trim()
            const read = !!notification.read
            return (
              <button
                key={notification.id}
                type="button"
                onClick={() => {
                  if (!read && !markReadMutation.isPending) markReadMutation.mutate(notification.id)
                }}
                className={`flex w-full items-start gap-3 px-3 py-3 text-left transition ${
                  read
                    ? 'rounded-xl hover:bg-nexoraCanvas/60'
                    : 'rounded-xl bg-nexoraBrandSoft/30 hover:bg-nexoraBrandSoft/40'
                }`}
              >
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white ${
                    notification.type === 'BusinessReview' || notification.type === 'ReviewReply'
                      ? 'bg-amber-500'
                      : 'bg-nexoraBrand'
                  } ${read ? 'opacity-60' : ''}`}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className={`text-sm ${read ? 'font-bold text-nexoraMuted' : 'font-extrabold text-nexoraText'}`}>
                    {title}
                  </div>
                  {message ? <p className="mt-0.5 text-xs leading-normal text-nexoraMuted">{message}</p> : null}
                  {notification.createdAt || notification.time ? (
                    <p className="mt-1 text-[10px] text-nexoraSubtle">
                      {formatNotificationDateTime(notification.createdAt || notification.time, currentLanguage)}
                    </p>
                  ) : null}
                </div>
                {!read ? <span className="ml-auto mt-1 h-2 w-2 shrink-0 rounded-full bg-nexoraBrand" /> : null}
              </button>
            )
          })}
        </div>
      )}
    </section>
  )
}

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
  const { currentLanguage, setLanguage, t } = useTranslation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { logout } = useAuth()
  const form = useSettingsForm({
    setupData,
    hasKyb,
    userEmail,
    onKybRequired,
    initialTab,
    onTabChange,
    onKybSuccess,
    verificationStatus,
    openKybPortal: undefined,
  })

  const [showQrModal, setShowQrModal] = useState(false)
  const [selectedLeg, setSelectedLeg] = useState('left')
  const activeSection = form.activeTab === 'profile' ? (searchParams.get('section') || '') : ''
  const merchantName = form.profile.businessName || form.profile.fullName || userEmail || 'Merchant'
  const merchantInitial = merchantName.trim().charAt(0).toUpperCase() || 'M'
  const merchantId = form.profile.referralId || (form.profile as any).id || form.profile.email || '—'
  const isKybVerified = ['kyb_approved', 'verified_pro', 'verified_lite'].includes(form.effectiveVerificationStatus)
  const kybStatusLabel = isKybVerified
    ? t('staff_dashboard.profile.menu_verified')
    : t('staff_dashboard.profile.menu_not_verified')

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
  const qrCodeUrl = (url: string) => (url ? buildPublicQrImageUrl(url, 250) : '')

  const handleSaveQr = async (qrUrl) => {
    try {
      const result = await downloadQrCode(qrUrl, `referral-qr-${selectedLeg}.png`)
      if (result !== 'cancelled') {
        form.showToast(t('components.SettingsView.qrCodeDownloaded'))
      }
    } catch {
      window.open(qrUrl, '_blank')
    }
  }

  const handleTabChange = (tab) => {
    form.handleTabChange(tab)
  }

  const openProfileSection = (section: string) => {
    navigate(`/dashboard/settings/profile?section=${section}`)
  }

  const closeProfileSection = () => {
    navigate('/dashboard/settings/profile')
  }

  return (
    <div className="w-full space-y-6 animate-fadeIn pb-24 select-none">
      {/* Content Area */}
      <div className="space-y-6">

        {form.activeTab === 'profile' && !activeSection && (
          <>
            <section className="space-y-2 px-0.5">
              <h1 className="text-base font-semibold leading-tight text-nexoraText">
                {t('staff_dashboard.profile.screen_title')}
              </h1>
              <div className={`${compactPanel} flex items-center gap-4 rounded-2xl p-3`}>
                <div className="grid h-[60px] w-[60px] shrink-0 place-items-center overflow-hidden rounded-full border-4 border-white bg-[#EDEBFF] text-xl font-semibold text-nexoraBrandDark shadow-sm">
                  {form.profile.avatar ? (
                    <img src={form.profile.avatar} alt={merchantName} className="h-full w-full object-cover" />
                  ) : (
                    merchantInitial
                  )}
                </div>
                <div className="min-w-0 flex-1 text-left">
                  <h2 className="truncate text-base font-semibold leading-tight text-nexoraText">{merchantName}</h2>
                  <p className="mt-1 truncate text-[11px] font-medium text-nexoraMuted">
                    {t('staff_dashboard.profile.nexora_id', { id: merchantId })}
                  </p>
                  <p className="mt-0.5 text-[11px] font-medium text-nexoraMuted">
                    {t('staff_dashboard.profile.member_since')}
                  </p>
                  <button
                    type="button"
                    onClick={() => openProfileSection('personal')}
                    className="mt-2 inline-flex h-7 min-w-[88px] items-center justify-center rounded-lg bg-[#EEE9FF] px-4 text-[12px] font-semibold text-nexoraBrandDark transition active:scale-95"
                  >
                    {t('staff_dashboard.profile.edit_profile')}
                  </button>
                </div>
              </div>
            </section>

            <section className={`${compactPanel} divide-y divide-[#EEE9FF]`}>
              <MerchantProfileMenuItem
                icon={UserCircle}
                label={t('staff_dashboard.profile.menu_personal_information')}
                onClick={() => openProfileSection('personal')}
              />
              <MerchantVerificationMenuItem
                label={t('staff_dashboard.profile.menu_verification')}
                status={kybStatusLabel}
                verified={isKybVerified}
                onClick={() => openProfileSection('verification')}
              />
              <MerchantProfileMenuItem
                icon={Wallet}
                label={t('components.settings.tabs.ProfileTab.payoutMethods')}
                onClick={() => openProfileSection('payouts')}
              />
              <MerchantProfileMenuItem
                icon={Bell}
                label={t('staff_dashboard.profile.menu_notification_preferences')}
                onClick={() => openProfileSection('notifications')}
              />
              <MerchantLanguageMenuItem
                label={t('staff_dashboard.profile.menu_language')}
                value={currentLanguage === 'vi' ? 'Tiếng Việt' : 'English'}
                onClick={() => openProfileSection('language')}
              />
              <MerchantProfileMenuItem
                icon={Lock}
                label={t('staff_dashboard.profile.menu_privacy_security')}
                onClick={() => openProfileSection('privacy')}
              />
            </section>

            <button
              type="button"
              onClick={logout}
              className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-2 text-xs font-extrabold text-amber-700 transition hover:bg-amber-100 cursor-pointer"
            >
              <LogOut className="h-4.5 w-4.5 shrink-0" />
              <span className="truncate">{t('dashboard.sidebar.sign_out')}</span>
            </button>
          </>
        )}

        {form.activeTab === 'profile' && activeSection === 'personal' && (
          <>
          <MerchantProfileSectionHeader
            title={t('staff_dashboard.profile.menu_personal_information')}
            onBack={closeProfileSection}
          />
          <ProfileTab
            profile={form.profile}
            copiedId={form.copiedId}
            isEditingBasic={form.isEditingBasic}
            setIsEditingBasic={form.setIsEditingBasic}
            basicForm={form.basicForm}
            setBasicForm={form.setBasicForm}
            basicErrors={form.basicErrors}
            setBasicErrors={form.setBasicErrors}
            isEditingAddress={form.isEditingAddress}
            setIsEditingAddress={form.setIsEditingAddress}
            addressForm={form.addressForm}
            setAddressForm={form.setAddressForm}
            addressErrors={form.addressErrors}
            setAddressErrors={form.setAddressErrors}
            isEditingBusiness={form.isEditingBusiness}
            setIsEditingBusiness={form.setIsEditingBusiness}
            businessForm={form.businessForm}
            setBusinessForm={form.setBusinessForm}
            businessErrors={form.businessErrors}
            setBusinessErrors={form.setBusinessErrors}
            isEditingReviews={form.isEditingReviews}
            setIsEditingReviews={form.setIsEditingReviews}
            reviewsForm={form.reviewsForm}
            setReviewsForm={form.setReviewsForm}
            reviewsErrors={form.reviewsErrors}
            setReviewsErrors={form.setReviewsErrors}
            hasKyb={hasKyb}
            verificationStatus={form.effectiveVerificationStatus}
            canEditProfile={form.canEditProfile}
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
            hidePayoutMethods
          />
          </>
        )}

        {form.activeTab === 'profile' && activeSection === 'payouts' && (
          <>
            <MerchantProfileSectionHeader
              title={t('components.settings.tabs.ProfileTab.payoutMethods')}
              onBack={closeProfileSection}
            />
            <ProfileTab
              profile={form.profile}
              copiedId={form.copiedId}
              isEditingBasic={form.isEditingBasic}
              setIsEditingBasic={form.setIsEditingBasic}
              basicForm={form.basicForm}
              setBasicForm={form.setBasicForm}
              basicErrors={form.basicErrors}
              setBasicErrors={form.setBasicErrors}
              isEditingAddress={form.isEditingAddress}
              setIsEditingAddress={form.setIsEditingAddress}
              addressForm={form.addressForm}
              setAddressForm={form.setAddressForm}
              addressErrors={form.addressErrors}
              setAddressErrors={form.setAddressErrors}
              isEditingBusiness={form.isEditingBusiness}
              setIsEditingBusiness={form.setIsEditingBusiness}
              businessForm={form.businessForm}
              setBusinessForm={form.setBusinessForm}
              businessErrors={form.businessErrors}
              setBusinessErrors={form.setBusinessErrors}
              isEditingReviews={form.isEditingReviews}
              setIsEditingReviews={form.setIsEditingReviews}
              reviewsForm={form.reviewsForm}
              setReviewsForm={form.setReviewsForm}
              reviewsErrors={form.reviewsErrors}
              setReviewsErrors={form.setReviewsErrors}
              hasKyb={hasKyb}
              verificationStatus={form.effectiveVerificationStatus}
              canEditProfile={form.canEditProfile}
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
              focusPayoutMethods
            />
          </>
        )}

        {form.activeTab === 'profile' && activeSection === 'verification' && (
          <>
            <MerchantProfileSectionHeader
              title={t('staff_dashboard.profile.menu_verification')}
              onBack={closeProfileSection}
            />
            <section className="rounded-2xl border border-nexoraBorder bg-nexoraSurface p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${isKybVerified ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                  <ShieldCheck className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="text-sm font-extrabold text-nexoraText">{kybStatusLabel}</h3>
                  <p className="mt-1 text-xs leading-5 text-nexoraMuted">
                    {isKybVerified
                      ? t('staff_dashboard.profile.verification_body')
                      : t('staff_dashboard.profile.verification_unverified_body')}
                  </p>
                </div>
              </div>
            </section>
          </>
        )}

        {form.activeTab === 'profile' && activeSection === 'notifications' && (
          <>
            <MerchantProfileSectionHeader title={t('staff_dashboard.profile.menu_notification_preferences')} onBack={closeProfileSection} />
            <MerchantNotificationsContent />
          </>
        )}

        {form.activeTab === 'profile' && activeSection === 'language' && (
          <>
            <MerchantProfileSectionHeader title={t('staff_dashboard.profile.menu_language')} onBack={closeProfileSection} />
            <section className={`${compactPanel} divide-y divide-[#EEE9FF]`}>
              <button type="button" onClick={() => setLanguage('en')} className="flex min-h-[44px] w-full items-center justify-between rounded-lg px-2 text-left transition hover:bg-[#F8F7FF]">
                <span className="text-[13px] font-semibold text-nexoraText">English</span>
                <span className="text-[11px] font-bold text-nexoraMuted">{currentLanguage === 'en' ? t('staff_dashboard.profile.current_language') : ''}</span>
              </button>
              <button type="button" onClick={() => setLanguage('vi')} className="flex min-h-[44px] w-full items-center justify-between rounded-lg px-2 text-left transition hover:bg-[#F8F7FF]">
                <span className="text-[13px] font-semibold text-nexoraText">Tiếng Việt</span>
                <span className="text-[11px] font-bold text-nexoraMuted">{currentLanguage === 'vi' ? t('staff_dashboard.profile.current_language') : ''}</span>
              </button>
            </section>
          </>
        )}

        {form.activeTab === 'profile' && activeSection === 'privacy' && (
          <>
            <MerchantProfileSectionHeader title={t('staff_dashboard.profile.menu_privacy_security')} onBack={closeProfileSection} />
            <section className={`${compactPanel} divide-y divide-[#EEE9FF]`}>
              <MerchantProfileMenuItem
                icon={FileText}
                label={t('staff_dashboard.profile.terms_title')}
                sub={t('staff_dashboard.profile.terms_subtitle')}
                onClick={() => navigate(`/terms-of-service?returnTo=${encodeURIComponent('/dashboard/settings/profile?section=privacy')}`)}
              />
              <MerchantProfileMenuItem
                icon={Lock}
                label={t('staff_dashboard.profile.privacy_policy_title')}
                sub={t('staff_dashboard.profile.privacy_subtitle')}
                onClick={() => navigate(`/privacy-policy?returnTo=${encodeURIComponent('/dashboard/settings/profile?section=privacy')}`)}
              />
            </section>
          </>
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
                    <QrImage
                      src={buildPublicQrImageUrl(baseReferralUrl, 220)}
                      alt="Referral Link QR Code"
                      className="h-full w-full rounded-lg"
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
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center modal-overlay-safe">
          <div className="bg-white rounded-3xl border border-slate-100 max-w-lg w-full shadow-2xl p-6 relative overflow-hidden animate-scaleIn text-center text-slate-800 space-y-4">
            
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setShowQrModal(false)}
              className="modal-close-btn absolute right-2 top-2 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
              title="Close modal"
              aria-label="Close modal"
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
            <div className="w-full">
              <div className="aspect-square w-full max-w-full min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white p-3 shadow-inner sm:p-4">
                {referralUrl ? (
                  <QrImage
                    src={buildPublicQrImageUrl(referralUrl, 440)}
                    alt="Referral Link QR Code"
                    className="h-full w-full max-h-full max-w-full rounded"
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
