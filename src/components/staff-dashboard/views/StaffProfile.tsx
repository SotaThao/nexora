// StaffProfile — personal profile (staff-owned: display name + bio) and
// per-business display names. Identity basics come from the merchant record.
import { useEffect, useState } from 'react'
import {
  LogOut,
  Camera,
  ShieldCheck,
  ShieldAlert,
  Building2,
  Landmark,
  FileText,
  User,
  Eye,
  EyeOff,
  Upload,
  Download
} from 'lucide-react'
import { useTranslation } from '../../../contexts/LanguageContext'
import { useStaffAccount } from '../../../contexts/StaffAccountContext'
import { useStaffLinkedBusinesses } from '../hooks/useStaffLinkedBusinesses'
import { useOutletContext } from 'react-router-dom'

const panel = 'rounded-2xl border border-nexoraBorder bg-nexoraSurface p-4 shadow-sm'
const labelCls = 'mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-nexoraSubtle'
const inputCls = 'w-full rounded-xl border border-nexoraBorder bg-nexoraSurface px-3 py-2.5 text-sm text-nexoraText outline-none focus:border-nexoraBrand transition-all'
const readOnlyCls = 'w-full rounded-xl border border-nexoraBorder bg-nexoraCanvas px-3 py-2.5 text-sm font-medium text-nexoraMuted select-text'

export default function StaffProfile() {
  const { currentLanguage, t } = useTranslation()
  const { staffMember, account, saveProfile, setBusinessDisplayName } = useStaffAccount()
  const { linkedBusinesses } = useStaffLinkedBusinesses()
  const { onLogout } = useOutletContext<LooseObject>()

  const [activeTab, setActiveTab] = useState('profile') // profile | kyc
  const [displayName, setDisplayName] = useState(account.defaultDisplayName || '')
  const [bio, setBio] = useState(account.bio || '')
  const [fullName, setFullName] = useState(account.fullName || staffMember.fullName || '')
  const [phone, setPhone] = useState(account.phone || staffMember.phone || '')
  const [saved, setSaved] = useState(false)
  const [toastMessage, setToastMessage] = useState('')

  // KYC States
  const kycStatus = account.kycStatus || 'basic'
  const [showPortal, setShowPortal] = useState(false)
  const [isSubmittingKyc, setIsSubmittingKyc] = useState(false)
  const [kycErrors, setKycErrors] = useState<LooseObject>({})
  const [showKycBankAccount, setShowKycBankAccount] = useState(false)
  const [kycData, setKycData] = useState({
    legalName: account.fullName || staffMember.fullName || '',
    idNumber: '',
    idType: 'DriverLicense',
    bankName: '',
    bankAccount: '',
    bankRouting: '',
    phone: '',
  })
  const [idFrontFile, setIdFrontFile] = useState<any | null>(null)
  const [idBackFile, setIdBackFile] = useState<any | null>(null)

  useEffect(() => {
    setDisplayName(account.defaultDisplayName || '')
    setBio(account.bio || '')
    setFullName(account.fullName || staffMember.fullName || '')
    setPhone(account.phone || staffMember.phone || '')
  }, [account.defaultDisplayName, account.bio, account.fullName, staffMember.fullName, account.phone, staffMember.phone])

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

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      saveProfile({ avatar: reader.result })
      showToast(t('components.staff_dashboard.views.StaffProfile.avatarUpdatedSuccessfully'))
    }
    reader.readAsDataURL(file)
  }

  const handleKycSubmit = (e) => {
    e.preventDefault()
    if (!kycData.legalName.trim() || !kycData.idNumber.trim() || !kycData.bankName.trim() || !kycData.bankAccount.trim() || !kycData.bankRouting.trim()) {
      setKycErrors({ kyc: t('components.staff_dashboard.views.StaffProfile.allFieldsAreRequired') })
      return
    }
    setKycErrors({})
    setIsSubmittingKyc(true)
    setTimeout(() => {
      setIsSubmittingKyc(false)
      saveProfile({
        kycStatus: 'kyc_approved',
        fullName: kycData.legalName,
        phone: phone || kycData.phone || staffMember.phone
      })
      setShowPortal(false)
      showToast(t('components.staff_dashboard.views.StaffProfile.kycVerificationSuccessful'))
    }, 2000)
  }

  const handleFileChange = (e, side) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (side === 'front') {
      setIdFrontFile(file.name)
    } else {
      setIdBackFile(file.name)
    }
  }

  // Determine status card details for KYC
  const getKycCardDetails = () => {
    switch (kycStatus) {
      case 'basic':
        return {
          bgClass: 'bg-blue-50/70 border-blue-200 text-blue-900 dark:bg-blue-950/20 dark:border-blue-900 dark:text-blue-200',
          icon: ShieldAlert,
          iconBg: 'bg-blue-500',
          title: t('components.staff_dashboard.views.StaffProfile.basicAccountStatus'),
          description: t('components.staff_dashboard.views.StaffProfile.yourProfileIsActive'),
          ctaText: t('components.staff_dashboard.views.StaffProfile.completeKycVerification'),
          ctaAction: () => setShowPortal(prev => !prev)
        }
      case 'kyc_approved':
      default:
        return {
          bgClass: 'bg-emerald-50/70 border-emerald-200 text-emerald-900 dark:bg-emerald-950/20 dark:border-emerald-900 dark:text-emerald-200',
          icon: ShieldCheck,
          iconBg: 'bg-emerald-500',
          title: t('components.staff_dashboard.views.StaffProfile.personalProfileVerifiedKyc'),
          description: t('components.staff_dashboard.views.StaffProfile.congratulationsYourPersonalIdentity'),
          subText: t('components.staff_dashboard.views.StaffProfile.verifiedToday'),
          ctaText: null
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
            <h3 className="mb-4 text-base font-extrabold text-nexoraText">{t('staff_dashboard.profile.title')}</h3>

            {/* Avatar Section */}
            <div className="flex flex-col items-center mb-6">
              <div className="relative group">
                {account.avatar ? (
                  <img
                    src={account.avatar}
                    alt={fullName}
                    className="h-24 w-24 rounded-full object-cover border-2 border-nexoraBorder shadow-md transition-all group-hover:opacity-85"
                  />
                ) : (
                  <div className="flex h-24 w-24 items-center justify-center rounded-full bg-nexoraBrand/10 text-nexoraBrand border-2 border-dashed border-nexoraBrand/30 text-3xl font-extrabold transition-all group-hover:bg-nexoraBrand/20">
                    {(fullName || displayName || 'S').charAt(0)}
                  </div>
                )}
                <label className="absolute inset-0 rounded-full bg-black/45 text-white text-[10px] font-black uppercase flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                  <Camera className="h-5 w-5 mb-1" />
                  {t('components.staff_dashboard.views.StaffProfile.change')}
                  <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
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
                <label className={labelCls}>{t('staff_dashboard.profile.bio')}</label>
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

            {kycCard.ctaText && (
              <button
                type="button"
                onClick={kycCard.ctaAction}
                className="shrink-0 rounded-lg bg-nexoraBrand hover:bg-nexoraBrandDark text-white px-4 py-2.5 text-xs font-bold transition shadow-sm animate-pulse cursor-pointer"
              >
                {showPortal ? (t('components.staff_dashboard.views.StaffProfile.closeForm')) : kycCard.ctaText}
              </button>
            )}
          </div>

          {showPortal && kycStatus !== 'kyc_approved' ? (
            /* Secure Iframe Portal Simulation */
            <div className="border border-slate-300 rounded-xl overflow-hidden shadow-md bg-slate-100 animate-fadeIn">
              {/* Browser navigation bar */}
              <div className="bg-slate-200 border-b border-slate-300 px-4 py-2 flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-400"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-400"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-green-400"></div>
                </div>
                <div className="bg-white rounded-md border border-slate-300 text-[10px] text-slate-500 font-mono px-3 py-0.5 flex-grow text-center select-none truncate">
                  https://gateway.vlinkpay.com/personal/kyc?email={encodeURIComponent(staffMember.email || '')}
                </div>
              </div>

              {/* Portal Content */}
              <div className="bg-white p-5 sm:p-8 min-h-[400px] relative text-left">
                {isSubmittingKyc && (
                  <div className="absolute inset-0 bg-white/95 z-20 flex flex-col items-center justify-center space-y-4">
                    <div className="w-12 h-12 border-4 border-nexoraBrand/20 border-t-nexoraBrand rounded-full animate-spin"></div>
                    <p className="text-xs text-nexoraBrand font-bold uppercase tracking-wider animate-pulse">
                      {t('components.staff_dashboard.views.StaffProfile.submittingKycDetails')}
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
                      <p className="text-[9px] text-slate-400">Personal Identity Verification (KYC)</p>
                    </div>
                  </div>
                  <span className="text-[9px] text-emerald-600 font-bold bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200">
                    SECURE OAUTH 2.0
                  </span>
                </div>

                {kycErrors.kyc && (
                  <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
                    {kycErrors.kyc}
                  </div>
                )}

                <form onSubmit={handleKycSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[9px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                        {t('components.staff_dashboard.views.StaffProfile.legalFullName')}
                      </label>
                      <input
                        type="text"
                        required
                        placeholder={t('components.staff_dashboard.views.StaffProfile.phFullName')}
                        className="w-full bg-slate-50 border border-slate-300 focus:border-blue-500 focus:bg-white rounded px-3 h-9 text-xs text-slate-800 focus:outline-none transition-colors"
                        value={kycData.legalName}
                        onChange={(e) => setKycData({ ...kycData, legalName: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                        {t('components.staff_dashboard.views.StaffProfile.idNumberSsn')}
                      </label>
                      <input
                        type="text"
                        required
                        placeholder={t('components.staff_dashboard.views.StaffProfile.phSsn')}
                        className="w-full bg-slate-50 border border-slate-300 focus:border-blue-500 focus:bg-white rounded px-3 h-9 text-xs text-slate-800 focus:outline-none transition-colors"
                        value={kycData.idNumber}
                        onChange={(e) => setKycData({ ...kycData, idNumber: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                      {t('components.staff_dashboard.views.StaffProfile.documentType')}
                    </label>
                    <select
                      className="w-full bg-slate-50 border border-slate-300 focus:border-blue-500 focus:bg-white rounded px-3 h-9 text-xs text-slate-800 focus:outline-none transition-colors"
                      value={kycData.idType}
                      onChange={(e) => setKycData({ ...kycData, idType: e.target.value })}
                    >
              <option value="DriverLicense">{t('common.driver_license')}</option>
                      <option value="Passport">{t('components.staff_dashboard.views.StaffProfile.passport')}</option>
                      <option value="NationalID">{t('components.staff_dashboard.views.StaffProfile.nationalIdCard')}</option>
                    </select>
                  </div>

                  {/* ID Upload boxes */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div>
                      <label className="block text-[9px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                        {t('components.staff_dashboard.views.StaffProfile.idCardFrontImage')}
                      </label>
                      <div className="border border-dashed border-slate-300 rounded-lg p-4 flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 transition relative cursor-pointer min-h-[90px]">
                        <Upload className="w-4 h-4 text-slate-400 mb-1" />
                        <span className="text-[10px] text-slate-500 text-center font-medium">
                          {idFrontFile || (t('components.staff_dashboard.views.StaffProfile.uploadFrontSide'))}
                        </span>
                        <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleFileChange(e, 'front')} />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                        {t('components.staff_dashboard.views.StaffProfile.idCardBackImage')}
                      </label>
                      <div className="border border-dashed border-slate-300 rounded-lg p-4 flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 transition relative cursor-pointer min-h-[90px]">
                        <Upload className="w-4 h-4 text-slate-400 mb-1" />
                        <span className="text-[10px] text-slate-500 text-center font-medium">
                          {idBackFile || (t('components.staff_dashboard.views.StaffProfile.uploadBackSide'))}
                        </span>
                        <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleFileChange(e, 'back')} />
                      </div>
                    </div>
                  </div>

                  {/* Personal Settlement Bank Info */}
                  <div className="border-t border-slate-100 pt-4 mt-2">
                    <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-3">
                      {t('components.staff_dashboard.views.StaffProfile.personalSettlementAccountInfo')}
                    </h5>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[9px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                          {t('components.staff_dashboard.views.StaffProfile.bankName')}
                        </label>
                        <input
                          type="text"
                          required
                          placeholder={t('components.staff_dashboard.views.StaffProfile.phBankName')}
                          className="w-full bg-slate-50 border border-slate-300 focus:border-blue-500 focus:bg-white rounded px-3 h-9 text-xs text-slate-800 focus:outline-none transition-colors"
                          value={kycData.bankName}
                          onChange={(e) => setKycData({ ...kycData, bankName: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                          {t('components.staff_dashboard.views.StaffProfile.accountNumber')}
                        </label>
                        <div className="relative">
                          <input
                            type={showKycBankAccount ? 'text' : 'password'}
                            required
                            placeholder={t('components.staff_dashboard.views.StaffProfile.phAccountNumber')}
                            className="w-full bg-slate-50 border border-slate-300 focus:border-blue-500 focus:bg-white rounded pl-3 pr-8 h-9 text-xs text-slate-800 focus:outline-none transition-colors"
                            value={kycData.bankAccount}
                            onChange={(e) => setKycData({ ...kycData, bankAccount: e.target.value })}
                          />
                          <button
                            type="button"
                            onClick={() => setShowKycBankAccount(!showKycBankAccount)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                          >
                            {showKycBankAccount ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                          {t('components.staff_dashboard.views.StaffProfile.routingCode')}
                        </label>
                        <input
                          type="text"
                          required
                          placeholder={t('components.staff_dashboard.views.StaffProfile.phRoutingCode')}
                          className="w-full bg-slate-50 border border-slate-300 focus:border-blue-500 focus:bg-white rounded px-3 h-9 text-xs text-slate-800 focus:outline-none transition-colors"
                          value={kycData.bankRouting}
                          onChange={(e) => setKycData({ ...kycData, bankRouting: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setShowPortal(false)}
                      className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 font-extrabold text-xs uppercase tracking-wider rounded transition cursor-pointer"
                    >
                      {t('components.staff_dashboard.views.StaffProfile.cancel')}
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2 bg-nexoraElectric hover:bg-blue-700 text-white font-extrabold text-xs uppercase tracking-wider rounded flex items-center gap-1.5 transition shadow-sm cursor-pointer"
                    >
                      <ShieldCheck className="w-4 h-4" /> {t('components.staff_dashboard.views.StaffProfile.submitKyc')}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          ) : (
            kycStatus === 'kyc_approved' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn text-left">
                {/* Dossier Card */}
                <div className="lg:col-span-2 rounded-xl border border-nexoraBorder bg-white shadow-sm p-6 space-y-4">
                  <div className="flex justify-between items-center border-b border-nexoraRule pb-3 mb-2">
                    <h4 className="text-xs font-black uppercase text-nexoraText tracking-wider flex items-center gap-2">
                      <User className="h-4 w-4 text-slate-600" />
                      {t('components.staff_dashboard.views.StaffProfile.verifiedPersonalDossier')}
                    </h4>
                  </div>

                  <div className="space-y-3.5 text-xs">
                    <div className="flex flex-col py-1.5 border-b border-slate-50 gap-1">
                      <span className="text-nexoraMuted font-semibold">{t('components.staff_dashboard.views.StaffProfile.legalFullName2')}</span>
                      <span className="text-nexoraText font-extrabold">{account.fullName || staffMember.fullName}</span>
                    </div>
                    <div className="flex flex-col py-1.5 border-b border-slate-50 gap-1">
                      <span className="text-nexoraMuted font-semibold">{t('components.staff_dashboard.views.StaffProfile.documentType2')}</span>
                      <span className="text-nexoraText font-extrabold">National ID / Passport</span>
                    </div>
                    <div className="flex flex-col py-1.5 border-b border-slate-50 gap-1">
                      <span className="text-nexoraMuted font-semibold">{t('components.staff_dashboard.views.StaffProfile.identityNumberSsn')}</span>
                      <span className="font-mono text-nexoraText font-extrabold">•••• •••• 9102</span>
                    </div>
                    <div className="flex flex-col py-1.5 border-b border-slate-50 gap-1">
                      <span className="text-nexoraMuted font-semibold">{t('components.staff_dashboard.views.StaffProfile.residentialAddress')}</span>
                      <span className="text-nexoraText font-extrabold">1088 Gold Coast Hwy, Palm Beach, QLD 4221</span>
                    </div>
                  </div>
                </div>

                {/* Bank Account Details */}
                <div className="lg:col-span-1 rounded-xl border border-nexoraBorder bg-white shadow-sm p-6 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-center border-b border-nexoraRule pb-3 mb-4">
                      <h4 className="text-xs font-black uppercase text-nexoraText tracking-wider flex items-center gap-2">
                        <Landmark className="h-4 w-4 text-emerald-600" />
                        {t('components.staff_dashboard.views.StaffProfile.payoutSettlementBank')}
                      </h4>
                    </div>

                    <div className="space-y-4 text-xs">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2 sm:py-1 gap-1">
                        <span className="text-nexoraMuted font-semibold">{t('components.staff_dashboard.views.StaffProfile.bankName')}</span>
                        <span className="text-nexoraText font-extrabold">Chase Bank, N.A.</span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2 sm:py-1 border-t border-slate-50 gap-1">
                        <span className="text-nexoraMuted font-semibold">Routing (ABA)</span>
                        <span className="font-mono text-nexoraText font-extrabold">021000021</span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2 sm:py-1 border-t border-slate-50 gap-1">
                        <span className="text-nexoraMuted font-semibold">{t('components.staff_dashboard.views.StaffProfile.accountNumber')}</span>
                        <span className="font-mono text-nexoraText font-extrabold">•••• 4192</span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2 sm:py-1 border-t border-slate-50 gap-1">
                        <span className="text-nexoraMuted font-semibold">{t('components.staff_dashboard.views.StaffProfile.payoutFrequency')}</span>
                        <span className="text-emerald-600 font-extrabold">Auto-Settled 24/7 (Instant)</span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => showToast(t('components.staff_dashboard.views.StaffProfile.pleaseContactSupportTo'))}
                    className="w-full mt-5 rounded-lg border border-slate-200 py-2 text-center text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                  >
                    {t('components.staff_dashboard.views.StaffProfile.changeSettlementBank')}
                  </button>
                </div>

                {/* Uploaded Documents List */}
                <div className="lg:col-span-3 rounded-xl border border-nexoraBorder bg-white shadow-sm p-6">
                  <div className="flex justify-between items-center border-b border-nexoraRule pb-3 mb-4">
                    <h4 className="text-xs font-black uppercase text-nexoraText tracking-wider flex items-center gap-2">
                      <FileText className="h-4 w-4 text-blue-500" />
                      {t('components.staff_dashboard.views.StaffProfile.uploadedIdentityDocuments')}
                    </h4>
                  </div>

                  <div className="divide-y divide-slate-100">
                    <div className="flex items-center justify-between py-3 text-xs">
                      <div className="flex items-center gap-3">
                        <span className="h-9 w-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">IMG</span>
                        <div>
                          <p className="font-extrabold text-slate-800 truncate max-w-[150px] sm:max-w-xs">National_ID_Front.jpg</p>
                          <p className="text-[10px] text-slate-400">1.2 MB • Verified & Securely Stored</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] font-black uppercase rounded">Verified</span>
                        <button className="p-1.5 border border-slate-200 hover:bg-slate-50 rounded text-slate-500 transition cursor-pointer" title="Download">
                          <Download className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between py-3 text-xs">
                      <div className="flex items-center gap-3">
                        <span className="h-9 w-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">IMG</span>
                        <div>
                          <p className="font-extrabold text-slate-800 truncate max-w-[150px] sm:max-w-xs">National_ID_Back.jpg</p>
                          <p className="text-[10px] text-slate-400">980 KB • Verified & Securely Stored</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] font-black uppercase rounded">Verified</span>
                        <button className="p-1.5 border border-slate-200 hover:bg-slate-50 rounded text-slate-500 transition cursor-pointer" title="Download">
                          <Download className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          )}

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
