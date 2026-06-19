// StaffProfile — personal profile (staff-owned: display name + bio) and
// per-business display names. Identity basics come from the merchant record.
import { useEffect, useRef, useState } from 'react'
import {
  LogOut,
  Camera,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  Clock,
} from 'lucide-react'
import { useTranslation } from '../../../contexts/LanguageContext'
import { useStaffAccount } from '../../../contexts/StaffAccountContext'
import { useStaffLinkedBusinesses } from '../hooks/useStaffLinkedBusinesses'
import { useOutletContext, useSearchParams } from 'react-router-dom'
import { UserVerifyStatus } from '../../../constants/userVerifyStatus'
import { useVerifiedStatus } from '../../../data/hooks/useProfileSettings'
import { useUploadImage } from '../../../data/hooks/useMerchantSetup'
import { logger } from '../../../utils/logger'
import StaffKycOverview from './StaffKycOverview'
import Tooltip from '../../ui/Tooltip'

const panel = 'rounded-2xl border border-nexoraBorder bg-nexoraSurface p-4 shadow-sm'
const labelCls = 'mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-nexoraSubtle'
const inputCls = 'w-full rounded-xl border border-nexoraBorder bg-nexoraSurface px-3 py-2.5 text-sm text-nexoraText outline-none focus:border-nexoraBrand transition-all'
const readOnlyCls = 'w-full rounded-xl border border-nexoraBorder bg-nexoraCanvas px-3 py-2.5 text-sm font-medium text-nexoraMuted select-text'

export default function StaffProfile() {
  const { currentLanguage, t } = useTranslation()
  const { staffMember, account, saveProfile, setBusinessDisplayName } = useStaffAccount()
  const { linkedBusinesses } = useStaffLinkedBusinesses()
  const { onLogout } = useOutletContext<LooseObject>()
  const [searchParams] = useSearchParams()

  const tabFromUrl = searchParams.get('tab')
  const [activeTab, setActiveTab] = useState(tabFromUrl === 'kyc' ? 'kyc' : 'profile') // profile | kyc

  useEffect(() => {
    if (tabFromUrl === 'kyc') setActiveTab('kyc')
    else if (tabFromUrl === 'account' || !tabFromUrl) setActiveTab('profile')
  }, [tabFromUrl])
  const [displayName, setDisplayName] = useState(account.defaultDisplayName || '')
  const [bio, setBio] = useState(account.bio || '')
  const [fullName, setFullName] = useState(account.fullName || staffMember.fullName || '')
  const [phone, setPhone] = useState(account.phone || staffMember.phone || '')
  const [saved, setSaved] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const avatarObjectUrlRef = useRef<string | null>(null)
  const uploadImageMutation = useUploadImage()

  const displayAvatar = avatarPreview || account.avatar

  const { data: verifyStatusData } = useVerifiedStatus({ enabled: activeTab === 'kyc' })
  const verifyStatus = verifyStatusData?.status

  useEffect(() => {
    setDisplayName(account.defaultDisplayName || '')
    setBio(account.bio || '')
    setFullName(account.fullName || staffMember.fullName || '')
    setPhone(account.phone || staffMember.phone || '')
  }, [account.defaultDisplayName, account.bio, account.fullName, staffMember.fullName, account.phone, staffMember.phone])

  useEffect(() => {
    return () => {
      if (avatarObjectUrlRef.current) {
        URL.revokeObjectURL(avatarObjectUrlRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (account.avatar && avatarPreview && avatarPreview === account.avatar) {
      setAvatarPreview(null)
    }
  }, [account.avatar, avatarPreview])

  const showToast = (msg) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(''), 3000)
  }

  const handleSave = () => {
    saveProfile({
      defaultDisplayName: displayName,
      bio,
      fullName,
      phone
    })
    setSaved(true)
    showToast(t('components.staff_dashboard.views.StaffProfile.accountChangesSavedSuccessfully'))
  }

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (avatarObjectUrlRef.current) {
      URL.revokeObjectURL(avatarObjectUrlRef.current)
      avatarObjectUrlRef.current = null
    }

    const objectUrl = URL.createObjectURL(file)
    avatarObjectUrlRef.current = objectUrl
    setAvatarPreview(objectUrl)

    try {
      const uploaded = await uploadImageMutation.mutateAsync(file)
      const photoUrl = uploaded.imageUrl || uploaded.fileUrl || ''
      if (!photoUrl) {
        throw new Error('IMAGE_UPLOAD_FAILED')
      }
      saveProfile({ avatar: photoUrl })
      setAvatarPreview(photoUrl)
      if (avatarObjectUrlRef.current) {
        URL.revokeObjectURL(avatarObjectUrlRef.current)
        avatarObjectUrlRef.current = null
      }
      showToast(t('components.staff_dashboard.views.StaffProfile.avatarUpdatedSuccessfully'))
    } catch (err) {
      logger.error('[StaffProfile] Failed to upload avatar', err)
      setAvatarPreview(account.avatar || null)
      if (avatarObjectUrlRef.current) {
        URL.revokeObjectURL(avatarObjectUrlRef.current)
        avatarObjectUrlRef.current = null
      }
      showToast(t('errors.image_upload_failed'))
    } finally {
      e.target.value = ''
    }
  }

  // Determine status card details for KYC
  const getKycCardDetails = () => {
    switch (verifyStatus) {
      case UserVerifyStatus.Verified:
        return {
          bgClass: 'bg-emerald-50/70 border-emerald-200 text-emerald-900 dark:bg-emerald-950/20 dark:border-emerald-900 dark:text-emerald-200',
          icon: ShieldCheck,
          iconBg: 'bg-emerald-500',
          title: t('components.staff_dashboard.views.StaffProfile.personalProfileVerifiedKyc'),
          description: t('components.staff_dashboard.views.StaffProfile.congratulationsYourPersonalIdentity'),
          subText: t('components.staff_dashboard.views.StaffProfile.verifiedToday'),
        }
      case UserVerifyStatus.Review:
        return {
          bgClass: 'bg-amber-50/70 border-amber-200 text-amber-900 dark:bg-amber-950/20 dark:border-amber-900 dark:text-amber-200',
          icon: Clock,
          iconBg: 'bg-amber-500',
          title: t('components.staff_dashboard.views.StaffKycOverview.statusReviewTitle'),
          description: t('components.staff_dashboard.views.StaffKycOverview.statusReviewDescription'),
        }
      case UserVerifyStatus.Rejected:
        return {
          bgClass: 'bg-red-50/70 border-red-200 text-red-900 dark:bg-red-950/20 dark:border-red-900 dark:text-red-200',
          icon: ShieldX,
          iconBg: 'bg-red-500',
          title: t('components.staff_dashboard.views.StaffKycOverview.statusRejectedTitle'),
          description: t('components.staff_dashboard.views.StaffKycOverview.statusRejectedDescription'),
        }
      case UserVerifyStatus.None:
      default:
        return {
          bgClass: 'bg-blue-50/70 border-blue-200 text-blue-900 dark:bg-blue-950/20 dark:border-blue-900 dark:text-blue-200',
          icon: ShieldAlert,
          iconBg: 'bg-blue-500',
          title: t('components.staff_dashboard.views.StaffProfile.basicAccountStatus'),
          description: t('components.staff_dashboard.views.StaffProfile.yourProfileIsActive'),
        }
    }
  }

  const kycCard = getKycCardDetails()

  return (
    <div className="space-y-4">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs font-semibold shadow-2xl flex items-center gap-2 animate-bounce">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
          {toastMessage}
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex gap-2 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          className={`px-4 py-2 rounded-lg text-xs font-extrabold uppercase transition cursor-pointer ${
            activeTab === 'profile'
              ? 'bg-nexoraBrand text-white shadow-sm'
              : 'bg-nexoraSurfaceMuted text-nexoraMuted hover:bg-slate-200'
          }`}
        >
          {t('components.staff_dashboard.views.StaffProfile.account')}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('kyc')}
          className={`px-4 py-2 rounded-lg text-xs font-extrabold uppercase transition cursor-pointer ${
            activeTab === 'kyc'
              ? 'bg-nexoraBrand text-white shadow-sm'
              : 'bg-nexoraSurfaceMuted text-nexoraMuted hover:bg-slate-200'
          }`}
        >
          {t('components.staff_dashboard.views.StaffProfile.kyc')}
        </button>
      </div>

      {activeTab === 'profile' && (
        <>
          <section className={panel}>
            <h3 className="mb-4 flex items-center gap-1.5 text-base font-extrabold text-nexoraText">
              {t('staff_dashboard.profile.title')}
              <Tooltip content={t('staff_dashboard.profile.title_tooltip')} />
            </h3>

            {/* Avatar Section */}
            <div className="flex flex-col items-center mb-6">
              <div className="relative group">
                {displayAvatar ? (
                  <img
                    src={displayAvatar}
                    alt={fullName}
                    className={`h-24 w-24 rounded-full object-cover border-2 border-nexoraBorder shadow-md transition-all group-hover:opacity-85 ${uploadImageMutation.isPending ? 'opacity-60' : ''}`}
                  />
                ) : (
                  <div className={`flex h-24 w-24 items-center justify-center rounded-full bg-nexoraBrand/10 text-nexoraBrand border-2 border-dashed border-nexoraBrand/30 text-3xl font-extrabold transition-all group-hover:bg-nexoraBrand/20 ${uploadImageMutation.isPending ? 'opacity-60' : ''}`}>
                    {(fullName || displayName || 'S').charAt(0)}
                  </div>
                )}
                <label className={`absolute inset-0 rounded-full bg-black/45 text-white text-[10px] font-black uppercase flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity ${uploadImageMutation.isPending ? 'pointer-events-none opacity-100' : ''}`}>
                  <Camera className="h-5 w-5 mb-1" />
                  {uploadImageMutation.isPending
                    ? t('common.loading')
                    : t('components.staff_dashboard.views.StaffProfile.change')}
                  <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} disabled={uploadImageMutation.isPending} />
                </label>
              </div>
              <span className="mt-2 text-xs font-bold text-nexoraText">
                {fullName || displayName}
              </span>
              <span className="text-[10px] text-nexoraSubtle">
                {t('staff_dashboard.staff_id')}: {account.staffCode || staffMember.id}
              </span>
            </div>

            <div className="space-y-3">
              <div>
                <label className={labelCls}>{t('staff_dashboard.profile.full_name')}</label>
                <input
                  type="text"
                  className={inputCls}
                  value={fullName}
                  onChange={(e) => { setFullName(e.target.value); setSaved(false) }}
                />
              </div>
              <div>
                <label className={labelCls}>{t('staff_dashboard.profile.display_name')}</label>
                <input
                  type="text"
                  className={inputCls}
                  value={displayName}
                  onChange={(e) => { setDisplayName(e.target.value); setSaved(false) }}
                />
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className={labelCls}>{t('staff_dashboard.profile.phone')}</label>
                  <input
                    type="text"
                    className={inputCls}
                    value={phone}
                    onChange={(e) => { setPhone(e.target.value); setSaved(false) }}
                  />
                </div>
                <div>
                  <label className={labelCls}>{t('staff_dashboard.profile.email')}</label>
                  <div className={readOnlyCls}>{staffMember.email || '—'}</div>
                </div>
              </div>
              <div>
                <label className={`${labelCls} flex items-center gap-1.5`}>
                  {t('staff_dashboard.profile.bio')}
                  <Tooltip content={t('staff_dashboard.profile.bio_tooltip')} />
                </label>
                <textarea
                  className={`${inputCls} h-24 resize-none`}
                  value={bio}
                  onChange={(e) => { setBio(e.target.value); setSaved(false) }}
                />
              </div>
            </div>

            <p className="mt-3 text-[11px] text-nexoraSubtle">{t('staff_dashboard.profile.identity_note')}</p>

            <button
              type="button"
              onClick={handleSave}
              className="mt-4 w-full rounded-xl bg-gradient-to-r from-nexoraElectric to-nexoraViolet py-3 text-sm font-extrabold text-white transition hover:opacity-90 cursor-pointer"
            >
              {saved ? t('staff_dashboard.profile.saved') : t('staff_dashboard.profile.save')}
            </button>
          </section>

          <section className={panel}>
            <h3 className="mb-3 text-base font-extrabold text-nexoraText">{t('staff_dashboard.profile.business_names')}</h3>
            <div className="space-y-3">
              {linkedBusinesses.map((biz) => (
                <div key={biz.businessStaffLinkId}>
                  <label className={labelCls}>{biz.businessName}</label>
                  <input
                    className={inputCls}
                    value={biz.displayName}
                    onChange={(e) => setBusinessDisplayName(biz.businessStaffLinkId, e.target.value)}
                  />
                </div>
              ))}
            </div>
          </section>

          <section className={panel}>
            <h3 className="mb-3 text-base font-extrabold text-nexoraDangerDark dark:text-red-400">
              {t('components.staff_dashboard.views.StaffProfile.signOutAccount')}
            </h3>
            <p className="mb-4 text-xs text-nexoraSubtle">
              {t('components.staff_dashboard.views.StaffProfile.signOutFromThe')}
            </p>
            <button
              type="button"
              onClick={onLogout}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 py-3 text-sm font-extrabold text-red-600 transition hover:bg-red-100 cursor-pointer"
            >
              <LogOut className="h-4.5 w-4.5" />
              {t('staff_dashboard.sign_out')}
            </button>
          </section>
        </>
      )}

      {activeTab === 'kyc' && (
        <div className="space-y-4 animate-fadeIn">
          {/* Status Banner */}
          <div className={`rounded-xl border p-5 flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4 shadow-sm ${kycCard.bgClass}`}>
            <div className="flex gap-4 items-start text-center sm:text-left flex-col sm:flex-row">
              <span className={`flex h-12 w-12 items-center justify-center rounded-2xl shrink-0 text-white ${kycCard.iconBg}`}>
                <kycCard.icon className="h-6 w-6" />
              </span>

              <div className="space-y-1">
                <h3 className="text-sm font-black uppercase tracking-wider">
                  {kycCard.title}
                </h3>
                <p className="text-xs font-semibold opacity-85 leading-relaxed max-w-2xl">
                  {kycCard.description}
                </p>
                {kycCard.subText && (
                  <div className="text-[10px] font-bold bg-white/50 border border-emerald-200/50 dark:bg-slate-900/40 dark:border-slate-800 inline-block px-2.5 py-0.5 rounded mt-2">
                    {kycCard.subText}
                  </div>
                )}
              </div>
            </div>
          </div>

          <StaffKycOverview />

          {/* Legal Disclosures */}
          <div className="rounded-xl border border-nexoraBorder bg-slate-50 dark:bg-slate-900/10 p-6 space-y-4 text-xs mt-6 text-nexoraMuted select-text text-left">
            <h5 className="font-bold text-nexoraText uppercase tracking-wider border-b border-slate-200 dark:border-slate-800 pb-2">
              {t('components.staff_dashboard.views.StaffProfile.legalDisclosuresAndKyc')}
            </h5>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-1">
                <h6 className="font-extrabold text-slate-700 dark:text-slate-350">
                  {t('components.staff_dashboard.views.StaffProfile.label1PersonalDataEncryption')}
                </h6>
                <p className="leading-relaxed text-[11px]">
                  {t('components.staff_dashboard.views.StaffProfile.yourIdentityInputsAnd')}
                </p>
              </div>
              <div className="space-y-1">
                <h6 className="font-extrabold text-slate-700 dark:text-slate-350">
                  {t('components.staff_dashboard.views.StaffProfile.label2TipIncomeAnd')}
                </h6>
                <p className="leading-relaxed text-[11px]">
                  {t('components.staff_dashboard.views.StaffProfile.completingKycSecuresYour')}
                </p>
              </div>
              <div className="space-y-1">
                <h6 className="font-extrabold text-slate-700 dark:text-slate-350">
                  {t('components.staff_dashboard.views.StaffProfile.label3ComplianceTerms')}
                </h6>
                <p className="leading-relaxed text-[11px]">
                  {t('components.staff_dashboard.views.StaffProfile.providingInaccurateOrFalsified')}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
