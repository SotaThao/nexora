import { useState } from 'react'
import { X, Upload, Eye, AlertTriangle, QrCode, Loader2, CheckCircle2, XCircle } from 'lucide-react'
import IconButton from '../../ui/IconButton'
import CountryCodeSelect, { parsePhone } from '../../CountryCodeSelect'
import { WalletLogos, DEFAULT_PAYOUT_CONFIGS } from '../constants'
import { useTranslation } from '../../../contexts/LanguageContext'
import { useNotification } from '../../../contexts/NotificationContext'
import { MOCK_NEXORA_STAFF_PROFILES } from '../data/mockData'
import PayoutSetupModal from './PayoutSetupModal'
import { getPayoutConfigsFromMember } from '../utils'
import { storage } from '../../../utils/storage'

const localStorage = storage

function StaffModal({
  open,
  editing,
  isApproveMode = false,
  onDecline,
  form,
  errors,
  setForm,
  verificationStatus = 'kyb_approved',
  onBlockedFeatureClick,
  onClose,
  onSave,
  onOpenInviteShare
}) {
  const { t, currentLanguage } = useTranslation()
  const { showToast } = useNotification()
  const [payoutSetupOpen, setPayoutSetupOpen] = useState(false)
  const [payoutSetupWallet, setPayoutSetupWallet] = useState('venmo')
  const [tempPayoutValues, setTempPayoutValues] = useState({ value: '', qrCode: '', accountName: '' })

  // Scanner states
  const [showScanner, setShowScanner] = useState(false)
  const [scanTarget, setScanTarget] = useState(null) // 'staff' | 'vlinkpay'

  // Verification states
  const [vlinkpayStatus, setVlinkpayStatus] = useState('idle') // 'idle' | 'checking' | 'success' | 'error'
  const [nexoraStatus, setNexoraStatus] = useState('idle') // 'idle' | 'checking' | 'success' | 'error'
  const [vlinkpayTimeout, setVlinkpayTimeout] = useState(null)
  const [nexoraTimeout, setNexoraTimeout] = useState(null)

  if (!open) return null

  const phoneParsed = parsePhone(form?.phone || '')

  const handleAvatarChange = (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      setForm({ ...form, avatar: reader.result })
    }
    reader.readAsDataURL(file)
  }

  const handleToggleWallet = (walletKey) => {
    // Read-only for Salon Owner
    return
  }

  const openPayoutSetup = (walletKey) => {
    const configs = form.payoutConfigs || DEFAULT_PAYOUT_CONFIGS
    const config = configs[walletKey] || { enabled: false, value: '', qrCode: '' }
    setTempPayoutValues({
      value: config.value || '',
      qrCode: config.qrCode || '',
      accountName: config.accountName || form.fullName || ''
    })
    setPayoutSetupWallet(walletKey)
    setPayoutSetupOpen(true)
  }

  const handlePayoutSubmit = (value, qrCode, accountName) => {
    const configs = form.payoutConfigs || DEFAULT_PAYOUT_CONFIGS
    setForm({
      ...form,
      payoutConfigs: {
        ...configs,
        [payoutSetupWallet]: {
          enabled: true,
          value: value.trim(),
          qrCode: qrCode,
          accountName: accountName.trim()
        }
      }
    })
    setPayoutSetupOpen(false)
  }

  const handleVlinkpayIdChange = (val) => {
    setForm((prev) => ({ ...prev, vlinkpay: val }))
    const searchId = val.trim().toUpperCase()

    if (vlinkpayTimeout) clearTimeout(vlinkpayTimeout)

    if (!searchId) {
      setVlinkpayStatus('idle')
      return
    }

    setVlinkpayStatus('checking')

    const timer = setTimeout(() => {
      console.log('[DEBUG VLINKPAY ID] Searching for:', searchId)

      // 1. Check mock profiles
      let matchedProfile = Object.values(MOCK_NEXORA_STAFF_PROFILES).find(
        p => p.vlinkpayId?.toUpperCase() === searchId
      )
      if (matchedProfile) {
        console.log('[DEBUG VLINKPAY ID] Found in MOCK_NEXORA_STAFF_PROFILES:', matchedProfile)
      }

      // 2. Check nexora_merchant_setup staffList
      if (!matchedProfile) {
        try {
          const savedSetup = localStorage.getItem('nexora_merchant_setup')
          if (savedSetup) {
            const parsed = JSON.parse(savedSetup)
            console.log('[DEBUG VLINKPAY ID] merchant setup staffList:', parsed.staffList)
            const matched = parsed.staffList?.find(
              s => (s.paymentAccounts?.vlinkpay?.toUpperCase() === searchId) || (s.vlinkpay?.toUpperCase() === searchId)
            )
            if (matched) {
              matchedProfile = {
                fullName: matched.fullName,
                nickname: matched.nickname,
                phone: matched.phone || '',
                email: matched.email || '',
                position: matched.position || 'Nail Tech',
                avatar: matched.avatar || '',
                vlinkpayId: searchId,
                payoutConfigs: matched.payoutConfigs || getPayoutConfigsFromMember(matched)
              }
              console.log('[DEBUG VLINKPAY ID] Found in nexora_merchant_setup:', matchedProfile)
            }
          }
        } catch (e) {
          console.error(e)
        }
      }

      // 3. Check nexora_staff_account
      if (!matchedProfile) {
        try {
          const staffMap = JSON.parse(localStorage.getItem('nexora_staff_account') || '{}')
          console.log('[DEBUG VLINKPAY ID] staffMap:', staffMap)
          const matchedEntry = Object.entries(staffMap).find(
            ([id, acc]) => acc.payoutMethods?.vlinkpay?.value?.toUpperCase() === searchId
          )
          if (matchedEntry) {
            const [id, acc] = matchedEntry
            const payoutConfigs = {}
            const pa = acc.payoutMethods || {}
            Object.keys(pa).forEach(k => {
              payoutConfigs[k] = {
                enabled: !!pa[k]?.enabled,
                value: pa[k]?.value || '',
                qrCode: pa[k]?.qrCode || '',
                accountName: pa[k]?.accountName || acc.defaultDisplayName || ''
              }
            })
            matchedProfile = {
              nexoraStaffId: id,
              fullName: acc.defaultDisplayName || '',
              nickname: acc.defaultDisplayName || '',
              phone: acc.phone || '',
              email: acc.email || '',
              position: acc.bio || 'Nail Tech',
              avatar: acc.avatar || '',
              vlinkpayId: searchId,
              payoutConfigs
            }
            console.log('[DEBUG VLINKPAY ID] Found in nexora_staff_account:', matchedProfile)
          }
        } catch (e) {
          console.error(e)
        }
      }

      // 4. Check nexora_pending_accounts
      if (!matchedProfile) {
        try {
          const pendingList = JSON.parse(localStorage.getItem('nexora_pending_accounts') || '[]')
          console.log('[DEBUG VLINKPAY ID] pendingList:', pendingList)
          const matched = pendingList.find(acc => acc.vlinkpayId?.toUpperCase() === searchId || acc.staffId?.toUpperCase() === searchId)
          if (matched) {
            matchedProfile = {
              nexoraStaffId: matched.staffId || '',
              fullName: matched.fullName || '',
              nickname: matched.fullName ? matched.fullName.split(' ')[0] + '.' : '',
              phone: '',
              email: matched.email || '',
              position: 'Nail Tech',
              avatar: '',
              vlinkpayId: searchId,
              payoutConfigs: {
                zelle: { enabled: false, value: '', qrCode: '', accountName: '' },
                bankwire: { enabled: false, value: '', qrCode: '', accountName: '' },
                paypal: { enabled: false, value: '', qrCode: '', accountName: '' },
                venmo: { enabled: false, value: '', qrCode: '', accountName: '' },
                cashapp: { enabled: false, value: '', qrCode: '', accountName: '' },
                applecash: { enabled: false, value: '', qrCode: '', accountName: '' }
              }
            }
            console.log('[DEBUG VLINKPAY ID] Found in nexora_pending_accounts:', matchedProfile)
          }
        } catch (e) {
          console.error(e)
        }
      }

      if (matchedProfile) {
        setVlinkpayStatus('success')
        showToast(currentLanguage === 'vi'
          ? 'Đã xác thực tài khoản VLINKPAY! Tự động nhập thông tin thợ.'
          : 'VLINKPAY Staff Profile Verified! Auto-filled profile details.', 'success')
        
        const staffIdKey = Object.keys(MOCK_NEXORA_STAFF_PROFILES).find(
          k => MOCK_NEXORA_STAFF_PROFILES[k].vlinkpayId?.toUpperCase() === searchId
        ) || matchedProfile.nexoraStaffId || ''

        setForm(prev => ({
          ...prev,
          fullName: matchedProfile.fullName,
          nickname: matchedProfile.nickname,
          phone: matchedProfile.phone,
          email: matchedProfile.email,
          position: matchedProfile.position,
          avatar: matchedProfile.avatar,
          nexoraStaffId: staffIdKey || prev.nexoraStaffId || '',
          payoutConfigs: {
            ...prev.payoutConfigs,
            ...matchedProfile.payoutConfigs
          }
        }))
      } else {
        setVlinkpayStatus('error')
      }
    }, 600)

    setVlinkpayTimeout(timer)
  }

  const handleNexoraStaffIdChange = (val) => {
    if (verificationStatus !== 'kyb_approved') {
      if (onBlockedFeatureClick) onBlockedFeatureClick()
      return
    }
    setForm((prev) => ({ ...prev, nexoraStaffId: val }))
    const searchId = val.trim().toUpperCase()

    if (nexoraTimeout) clearTimeout(nexoraTimeout)

    if (!searchId) {
      setNexoraStatus('idle')
      return
    }

    setNexoraStatus('checking')

    const timer = setTimeout(() => {
      console.log('[DEBUG STAFF ID] Searching for:', searchId)

      // 1. Check mock profiles
      let kycProfile = MOCK_NEXORA_STAFF_PROFILES[searchId]
      if (kycProfile) {
        console.log('[DEBUG STAFF ID] Found in MOCK_NEXORA_STAFF_PROFILES:', kycProfile)
      }

      // 2. Check nexora_merchant_setup staffList
      if (!kycProfile) {
        try {
          const savedSetup = localStorage.getItem('nexora_merchant_setup')
          if (savedSetup) {
            const parsed = JSON.parse(savedSetup)
            console.log('[DEBUG STAFF ID] merchant setup staffList:', parsed.staffList)
            const matched = parsed.staffList?.find(s => s.id?.toUpperCase() === searchId)
            if (matched) {
              kycProfile = {
                fullName: matched.fullName,
                nickname: matched.nickname,
                phone: matched.phone || '',
                email: matched.email || '',
                position: matched.position || 'Nail Tech',
                avatar: matched.avatar || '',
                vlinkpayId: matched.paymentAccounts?.vlinkpay || matched.vlinkpay || '',
                payoutConfigs: matched.payoutConfigs || getPayoutConfigsFromMember(matched)
              }
              console.log('[DEBUG STAFF ID] Found in nexora_merchant_setup:', kycProfile)
            }
          }
        } catch (e) {
          console.error(e)
        }
      }

      // 3. Check nexora_staff_account
      if (!kycProfile) {
        try {
          const staffMap = JSON.parse(localStorage.getItem('nexora_staff_account') || '{}')
          console.log('[DEBUG STAFF ID] staffMap:', staffMap)
          if (staffMap[searchId]) {
            const acc = staffMap[searchId]
            const payoutConfigs = {}
            const pa = acc.payoutMethods || {}
            Object.keys(pa).forEach(k => {
              payoutConfigs[k] = {
                enabled: !!pa[k]?.enabled,
                value: pa[k]?.value || '',
                qrCode: pa[k]?.qrCode || '',
                accountName: pa[k]?.accountName || acc.defaultDisplayName || ''
              }
            })
            kycProfile = {
              fullName: acc.defaultDisplayName || '',
              nickname: acc.defaultDisplayName || '',
              phone: acc.phone || '',
              email: acc.email || '',
              position: acc.bio || 'Nail Tech',
              avatar: acc.avatar || '',
              vlinkpayId: pa.vlinkpay?.value || '',
              payoutConfigs
            }
            console.log('[DEBUG STAFF ID] Found in nexora_staff_account:', kycProfile)
          }
        } catch (e) {
          console.error(e)
        }
      }

      // 4. Check nexora_pending_accounts
      if (!kycProfile) {
        try {
          const pendingList = JSON.parse(localStorage.getItem('nexora_pending_accounts') || '[]')
          console.log('[DEBUG STAFF ID] pendingList:', pendingList)
          const matched = pendingList.find(acc => acc.staffId?.toUpperCase() === searchId)
          if (matched) {
            kycProfile = {
              fullName: matched.fullName || '',
              nickname: matched.fullName ? matched.fullName.split(' ')[0] + '.' : '',
              phone: '',
              email: matched.email || '',
              position: 'Nail Tech',
              avatar: '',
              vlinkpayId: matched.vlinkpayId || '',
              payoutConfigs: {
                zelle: { enabled: false, value: '', qrCode: '', accountName: '' },
                bankwire: { enabled: false, value: '', qrCode: '', accountName: '' },
                paypal: { enabled: false, value: '', qrCode: '', accountName: '' },
                venmo: { enabled: false, value: '', qrCode: '', accountName: '' },
                cashapp: { enabled: false, value: '', qrCode: '', accountName: '' },
                applecash: { enabled: false, value: '', qrCode: '', accountName: '' }
              }
            }
            console.log('[DEBUG STAFF ID] Found in nexora_pending_accounts:', kycProfile)
          }
        } catch (e) {
          console.error(e)
        }
      }

      if (kycProfile) {
        setNexoraStatus('success')
        showToast(currentLanguage === 'vi'
          ? 'Đã xác thực tài khoản NEXORA! Tự động nhập thông tin thợ.'
          : 'NEXORA Staff Profile Verified! Auto-filled profile details.', 'success')
        
        setForm(prev => ({
          ...prev,
          fullName: kycProfile.fullName,
          nickname: kycProfile.nickname,
          phone: kycProfile.phone,
          email: kycProfile.email,
          position: kycProfile.position,
          avatar: kycProfile.avatar,
          vlinkpay: kycProfile.vlinkpayId || prev.vlinkpay || '',
          payoutConfigs: {
            ...prev.payoutConfigs,
            ...kycProfile.payoutConfigs
          }
        }))
      } else {
        setNexoraStatus('error')
      }
    }, 600)

    setNexoraTimeout(timer)
  }

  const handleScanQr = (target) => {
    if (target === 'staff' && verificationStatus !== 'kyb_approved') {
      if (onBlockedFeatureClick) onBlockedFeatureClick()
      return
    }
    setScanTarget(target)
    setShowScanner(true)
  }

  const simulateSuccessfulScan = () => {
    if (scanTarget === 'staff') {
      setForm(prev => ({ ...prev, nexoraStaffId: 'NEX-STAFF-LISA1102' }))
      setNexoraStatus('success')
      const profile = MOCK_NEXORA_STAFF_PROFILES['NEX-STAFF-LISA1102']
      setForm(prev => ({
        ...prev,
        fullName: profile.fullName,
        nickname: profile.nickname,
        phone: profile.phone,
        email: profile.email,
        position: profile.position,
        avatar: profile.avatar,
        vlinkpay: profile.vlinkpayId || prev.vlinkpay || '',
        payoutConfigs: {
          ...prev.payoutConfigs,
          ...profile.payoutConfigs
        }
      }))
    } else if (scanTarget === 'vlinkpay') {
      setForm(prev => ({ ...prev, vlinkpay: 'VLP-1102-LISA' }))
      setVlinkpayStatus('success')
      const profile = MOCK_NEXORA_STAFF_PROFILES['NEX-STAFF-LISA1102']
      setForm(prev => ({
        ...prev,
        fullName: profile.fullName,
        nickname: profile.nickname,
        phone: profile.phone,
        email: profile.email,
        position: profile.position,
        avatar: profile.avatar,
        nexoraStaffId: 'NEX-STAFF-LISA1102',
        payoutConfigs: {
          ...prev.payoutConfigs,
          ...profile.payoutConfigs
        }
      }))
    }
    setShowScanner(false)
    setScanTarget(null)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-nexoraText/70 p-4 py-6 backdrop-blur-sm sm:items-center">
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-3px); }
          75% { transform: translateX(3px); }
        }
        .animate-shake {
          animation: shake 0.15s ease-in-out 2;
        }
        @keyframes scaleUp {
          0% { transform: scale(0.85); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-scaleUp {
          animation: scaleUp 0.2s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
      `}</style>
      <div className="w-full max-w-lg md:max-w-3xl lg:max-w-4xl rounded-xl bg-white p-6 shadow-2xl transition-all">
        <div className="flex items-center justify-between border-b border-nexoraRule pb-4">
          <h2 className="text-lg font-extrabold text-nexoraText">
            {isApproveMode
              ? (currentLanguage === 'vi' ? 'Duyệt yêu cầu tham gia' : 'Review Join Request')
              : (editing ? t('common.edit') : t('setup.add_staff_title'))}
          </h2>
          <IconButton label="Close modal" onClick={onClose}>
            <X className="h-4 w-4" />
          </IconButton>
        </div>
        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          {/* Left Column: Basic Info */}
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-extrabold uppercase text-nexoraMuted">Avatar</label>
              <div className="mt-2 flex items-center gap-4">
                {form.avatar ? (
                  <img src={form.avatar} alt="" className="h-16 w-16 rounded-full object-cover ring-1 ring-nexoraBorder" />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-nexoraCanvas text-lg font-extrabold text-nexoraBrand ring-1 ring-nexoraBorder">
                    {(form.nickname || form.fullName || 'N').charAt(0)}
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  <label className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg border border-nexoraBorder px-3 text-xs font-bold text-nexoraText transition hover:bg-nexoraCanvas">
                    <Upload className="h-4 w-4 text-nexoraBrand" />
                    Upload photo
                    <input type="file" accept="image/*" className="sr-only" onChange={handleAvatarChange} />
                  </label>
                  {form.avatar && (
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, avatar: '' })}
                      className="h-9 rounded-lg border border-nexoraBorder px-3 text-xs font-bold text-nexoraMuted transition hover:bg-nexoraCanvas"
                    >
                      {t('common.delete')}
                    </button>
                  )}
                </div>
              </div>
            </div>
            <div>
              <label className="text-[10px] font-extrabold uppercase text-nexoraMuted">{t('setup.staff_fullname')}</label>
              <input className="mt-1 h-10 w-full rounded-lg border border-nexoraBorder px-3 text-sm outline-none focus:border-nexoraBrand" value={form.fullName} onChange={(event) => setForm({ ...form, fullName: event.target.value })} placeholder="Mia Tran" />
              {errors.fullName && <p className="mt-1 text-[10px] font-bold text-rose-600">{errors.fullName}</p>}
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="text-[10px] font-extrabold uppercase text-nexoraMuted">{t('setup.staff_displayname')}</label>
                <input className="mt-1 h-10 w-full rounded-lg border border-nexoraBorder px-3 text-sm outline-none focus:border-nexoraBrand" value={form.nickname} onChange={(event) => setForm({ ...form, nickname: event.target.value })} placeholder="Mia T." />
                {errors.nickname && <p className="mt-1 text-[10px] font-bold text-rose-600">{errors.nickname}</p>}
              </div>
              <div>
                <label className="text-[10px] font-extrabold uppercase text-nexoraMuted">{t('setup.staff_position')}</label>
                <input className="mt-1 h-10 w-full rounded-lg border border-nexoraBorder px-3 text-sm outline-none focus:border-nexoraBrand" value={form.position} onChange={(event) => setForm({ ...form, position: event.target.value })} placeholder="Nail Tech" />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="text-[10px] font-extrabold uppercase text-nexoraMuted">{t('setup.staff_phone') || 'Phone Number'}</label>
                <div className="mt-1 flex rounded-lg shadow-sm">
                  <CountryCodeSelect
                    value={phoneParsed.countryCode}
                    onChange={(newCode) => {
                      setForm({ ...form, phone: `${newCode} ${phoneParsed.nationalNumber}`.trim() })
                    }}
                  />
                  <input
                    className="h-10 w-full rounded-r-lg border border-l-0 border-nexoraBorder px-3 text-sm outline-none focus:border-nexoraBrand bg-white min-w-0"
                    value={phoneParsed.nationalNumber}
                    onChange={(event) => setForm({ ...form, phone: `${phoneParsed.countryCode} ${event.target.value}`.trim() })}
                    placeholder={t('setup.staff_phone_placeholder') || 'e.g., 407-555-0123'}
                  />
                </div>
                {errors.phone && <p className="mt-1 text-[10px] font-bold text-rose-600">{errors.phone}</p>}
              </div>
              <div>
                <label className="text-[10px] font-extrabold uppercase text-nexoraMuted">{t('setup.staff_email') || 'Email Address'}</label>
                <input className="mt-1 h-10 w-full rounded-lg border border-nexoraBorder px-3 text-sm outline-none focus:border-nexoraBrand" value={form.email || ''} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder={t('setup.staff_email_placeholder') || 'e.g., mia.tran@gmail.com'} />
                {errors.email && <p className="mt-1 text-[10px] font-bold text-rose-600">{errors.email}</p>}
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-nexoraBorder bg-nexoraCanvas p-3.5 mt-2">
              <div>
                <label className="text-xs font-extrabold text-nexoraText block">{t('setup.show_in_tips_flow') || 'Show in Tips Flow'}</label>
                <p className="text-[10px] text-nexoraMuted leading-relaxed mt-0.5">{t('setup.show_in_tips_flow_desc') || 'If disabled, this staff member won\'t appear in the general QR code staff list.'}</p>
              </div>
              <button
                type="button"
                onClick={() => setForm({ ...form, showInTipsFlow: !form.showInTipsFlow })}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  form.showInTipsFlow ? 'bg-nexoraBrand' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    form.showInTipsFlow ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Right Column: Payout Configurations */}
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-extrabold uppercase text-nexoraMuted">{t('setup.payout_methods') || 'Payout Methods'}</label>
              <div className="mt-2 space-y-4">
                <div className="divide-y divide-slate-100 rounded-xl border border-nexoraBorder bg-white px-4">
                  {[
                    { name: 'Zelle', key: 'zelle' },
                    { name: 'Bank Wire', key: 'bankwire' },
                    { name: 'PayPal', key: 'paypal' },
                    { name: 'Venmo', key: 'venmo' },
                    { name: 'Cash App', key: 'cashapp' },
                    { name: 'Apple Cash', key: 'applecash' }
                  ].map((wallet) => {
                    const config = (form.payoutConfigs && form.payoutConfigs[wallet.key]) || { enabled: false, value: '', qrCode: '' }

                    return (
                      <div key={wallet.key} className="flex items-center justify-between py-3">
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            disabled={true}
                            className={`relative inline-flex h-6 w-11 shrink-0 cursor-not-allowed rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                              config.enabled ? 'bg-amber-600' : 'bg-slate-200'
                            }`}
                          >
                            <span
                              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                config.enabled ? 'translate-x-5' : 'translate-x-0'
                              }`}
                            />
                          </button>
                          <div className="flex items-center gap-2">
                            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-50 shrink-0">
                              {WalletLogos[wallet.key]}
                            </span>
                            <span className="text-xs font-bold text-slate-700">{wallet.name}</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => openPayoutSetup(wallet.key)}
                          className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 hover:text-slate-600 transition"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>{currentLanguage === 'vi' ? 'Xem tài khoản' : 'View Account'}</span>
                        </button>
                      </div>
                    )
                  })}
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-[9px] font-extrabold uppercase text-nexoraMuted mb-1 block">VLINKPAY ID</label>
                    <div className="relative">
                      <span className="absolute left-3 top-[9px] flex items-center justify-center pointer-events-none">
                        <img src="/assets/vlinkpay-logo.png" alt="VLINKPAY Logo" className="h-[18px] w-[18px] object-contain" />
                      </span>
                      <input
                        className={`h-9 w-full rounded-lg border pl-9 pr-14 text-xs outline-none font-semibold font-mono transition-all ${
                          vlinkpayStatus === 'success' ? 'border-emerald-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20' :
                          vlinkpayStatus === 'error' ? 'border-rose-500 focus:border-rose-500 focus:ring-1 focus:ring-rose-500/20 animate-shake' :
                          vlinkpayStatus === 'checking' ? 'border-amber-400 focus:border-amber-400' :
                          'border-nexoraBorder focus:border-nexoraBrand'
                        }`}
                        value={form.vlinkpay || ''}
                        onChange={(event) => handleVlinkpayIdChange(event.target.value)}
                        placeholder="e.g. VLP-8893-VL"
                      />
                      <div className="absolute right-9 top-1/2 -translate-y-1/2 flex items-center gap-1">
                        {vlinkpayStatus === 'checking' && (
                          <Loader2 className="h-3.5 w-3.5 text-amber-500 animate-spin" />
                        )}
                        {vlinkpayStatus === 'success' && (
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 animate-scaleUp" />
                        )}
                        {vlinkpayStatus === 'error' && (
                          <XCircle className="h-3.5 w-3.5 text-rose-500 animate-scaleUp" />
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleScanQr('vlinkpay')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-nexoraBrand transition-colors p-1.5 rounded hover:bg-slate-50"
                        title={currentLanguage === 'vi' ? 'Quét mã VLINKPAY QR' : 'Scan VLINKPAY QR Code'}
                      >
                        <QrCode className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-[9px] font-extrabold uppercase text-nexoraMuted mb-1 block">NEXORA Staff ID</label>
                    <div className="relative">
                      <span className="absolute left-3 top-[9px] flex items-center justify-center pointer-events-none">
                        <img src="/assets/nexora-logo.png" alt="Nexora Logo" className="h-[18px] w-[18px] object-contain" />
                      </span>
                      <input
                        className={`h-9 w-full rounded-lg border pl-9 pr-14 text-xs outline-none font-semibold font-mono transition-all ${
                          nexoraStatus === 'success' ? 'border-emerald-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20' :
                          nexoraStatus === 'error' ? 'border-rose-500 focus:border-rose-500 focus:ring-1 focus:ring-rose-500/20 animate-shake' :
                          nexoraStatus === 'checking' ? 'border-amber-400 focus:border-amber-400' :
                          'border-nexoraBorder focus:border-nexoraBrand'
                        }`}
                        value={form.nexoraStaffId || ''}
                        onClick={(e) => {
                          if (verificationStatus !== 'kyb_approved') {
                            e.preventDefault()
                            e.target.blur()
                            if (onBlockedFeatureClick) onBlockedFeatureClick()
                          }
                        }}
                        onChange={(event) => handleNexoraStaffIdChange(event.target.value)}
                        placeholder="e.g. NEX-STAFF-LISA1102"
                      />
                      <div className="absolute right-9 top-1/2 -translate-y-1/2 flex items-center gap-1">
                        {nexoraStatus === 'checking' && (
                          <Loader2 className="h-3.5 w-3.5 text-amber-500 animate-spin" />
                        )}
                        {nexoraStatus === 'success' && (
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 animate-scaleUp" />
                        )}
                        {nexoraStatus === 'error' && (
                          <XCircle className="h-3.5 w-3.5 text-rose-500 animate-scaleUp" />
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleScanQr('staff')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-nexoraBrand transition-colors p-1.5 rounded hover:bg-slate-50"
                        title={currentLanguage === 'vi' ? 'Quét mã NEXORA QR' : 'Scan NEXORA QR Code'}
                      >
                        <QrCode className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <button
                    type="button"
                    onClick={() => onOpenInviteShare && onOpenInviteShare(form)}
                    className="underline text-xs text-amber-600 hover:text-amber-700 font-bold mt-1 cursor-pointer select-none inline-block text-left"
                  >
                    {currentLanguage === 'vi' ? 'Chia sẻ liên kết & QR mời thợ' : 'Share Invite Link & QR'}
                  </button>
                </div>
              </div>
              {errors.payment && <p className="mt-2 flex items-center gap-1 text-xs font-bold text-rose-600"><AlertTriangle className="h-3.5 w-3.5" />{errors.payment}</p>}
            </div>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2 border-t border-nexoraRule pt-4">
          {isApproveMode ? (
            <>
              <button
                type="button"
                onClick={onDecline}
                className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100 transition"
              >
                {currentLanguage === 'vi' ? 'Từ chối' : 'Decline'}
              </button>
              <button
                type="button"
                onClick={onSave}
                className="rounded-lg bg-indigo-600 px-5 py-2 text-xs font-bold text-white hover:bg-indigo-700 transition animate-pulse"
              >
                {currentLanguage === 'vi' ? 'Duyệt / Chấp nhận' : 'Approve / Accept'}
              </button>
            </>
          ) : (
            <>
              <button onClick={onClose} className="rounded-lg border border-nexoraBorder px-4 py-2 text-xs font-bold text-nexoraMuted">{t('common.cancel')}</button>
              <button onClick={onSave} className="rounded-lg bg-nexoraBrand px-5 py-2 text-xs font-bold text-white">{t('common.save')}</button>
            </>
          )}
        </div>
      </div>

      <PayoutSetupModal
        open={payoutSetupOpen}
        walletKey={payoutSetupWallet}
        staffName={form.fullName}
        initialValue={tempPayoutValues.value}
        initialQrCode={tempPayoutValues.qrCode}
        onClose={() => setPayoutSetupOpen(false)}
        onSubmit={handlePayoutSubmit}
        readOnly={true}
      />

      {/* Simulated QR Code Camera Scanner Modal Overlay */}
      {showScanner && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
          <style>{`
            @keyframes scannerLaser {
              0% { top: 0%; opacity: 0.8; }
              50% { top: 100%; opacity: 0.8; }
              100% { top: 0%; opacity: 0.8; }
            }
            .animate-scannerLaser {
              animation: scannerLaser 2.5s linear infinite;
            }
          `}</style>
          
          <div className="bg-white border border-slate-100 rounded-3xl max-w-sm w-full p-6 text-center space-y-5 relative overflow-hidden text-slate-800 shadow-2xl animate-scaleUp">
            {/* Close Button */}
            <button
              type="button"
              onClick={() => {
                setShowScanner(false)
                setScanTarget(null)
              }}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-700 transition p-1.5 rounded-full hover:bg-slate-100"
              title="Close Scanner"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Header */}
            <div className="space-y-1 text-center">
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-800">
                {currentLanguage === 'vi' ? 'Quét Mã QR Nhận Diện' : 'Scan QR Code'}
              </h3>
              <p className="text-[10px] text-slate-500 font-medium text-center">
                {scanTarget === 'staff' 
                  ? (currentLanguage === 'vi' ? 'Quét mã NEXORA STAFF ID để liên kết hồ sơ' : 'Scan NEXORA STAFF ID to link your profile')
                  : (currentLanguage === 'vi' ? 'Quét mã VLINKPAY ID để tự động điền thông tin' : 'Scan VLINKPAY ID to autofill profile data')}
              </p>
            </div>

            {/* Scanning viewport */}
            <div className="relative h-48 w-48 mx-auto rounded-2xl border-2 border-slate-100 bg-slate-50 overflow-hidden flex items-center justify-center shadow-inner">
              {/* Corner brackets */}
              <div className="absolute top-3 left-3 w-4 h-4 border-t-2 border-l-2 border-amber-500 rounded-tl-sm"></div>
              <div className="absolute top-3 right-3 w-4 h-4 border-t-2 border-r-2 border-amber-500 rounded-tr-sm"></div>
              <div className="absolute bottom-3 left-3 w-4 h-4 border-b-2 border-l-2 border-amber-500 rounded-bl-sm"></div>
              <div className="absolute bottom-3 right-3 w-4 h-4 border-b-2 border-r-2 border-amber-500 rounded-br-sm"></div>

              {/* QR icon background */}
              <QrCode className="h-20 w-20 text-slate-300 opacity-80 animate-pulse" />

              {/* Laser line */}
              <div className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-amber-500 to-transparent shadow-[0_0_8px_#f59e0b] animate-scannerLaser"></div>
            </div>

            {/* Helper Text */}
            <p className="text-[10px] text-slate-500 font-medium max-w-xs mx-auto text-center">
              {currentLanguage === 'vi'
                ? 'Hướng camera về phía mã QR hoặc chọn giả lập quét thành công bên dưới.'
                : 'Point the camera at the QR code, or choose a mockup scan profile below.'}
            </p>

            {/* Quick simulation buttons */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block text-center">
                {currentLanguage === 'vi' ? 'Giả lập quét QR' : 'Simulate QR Scan'}
              </span>
              
              <div className="flex flex-col gap-2">
                {/* Standard Successful Scan button */}
                <button
                  type="button"
                  onClick={simulateSuccessfulScan}
                  className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-colors shadow-sm"
                >
                  {currentLanguage === 'vi' ? 'Giả lập Quét Lisa Tran' : 'Simulate Successful Scan'}
                </button>

                {/* Additional quick options */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (scanTarget === 'staff') {
                        handleNexoraStaffIdChange('NEX-STAFF-ANNA0921')
                      } else {
                        handleVlinkpayIdChange('VLP-0921-ANNA')
                      }
                      setShowScanner(false)
                      setScanTarget(null)
                    }}
                    className="py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-[10px] font-bold transition-colors"
                  >
                    Anna Nguyen
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (scanTarget === 'staff') {
                        handleNexoraStaffIdChange('NEX-STAFF-HN1148')
                      } else {
                        handleVlinkpayIdChange('VLP-1148-HN')
                      }
                      setShowScanner(false)
                      setScanTarget(null)
                    }}
                    className="py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-[10px] font-bold transition-colors"
                  >
                    Hanna Nguyen
                  </button>
                </div>
              </div>
            </div>

            {/* Cancel Button */}
            <button
              type="button"
              onClick={() => {
                setShowScanner(false)
                setScanTarget(null)
              }}
              className="w-full py-2 border border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-slate-700 rounded-xl text-xs font-bold transition"
            >
              {currentLanguage === 'vi' ? 'HỦY BỎ' : 'CANCEL'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default StaffModal
