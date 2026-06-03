import { useState, useEffect, useMemo } from 'react'
import { useTranslation } from '../../../contexts/LanguageContext'
import { storage } from '../../../utils/storage'
import { useNotification } from '../../../contexts/NotificationContext'
import { parsePhone } from '../../CountryCodeSelect'

const localStorage = storage
const sessionStorage = storage

const MOCK_NEXORA_STAFF_PROFILES = {
  'NEX-STAFF-ANNA0921': {
    fullName: 'Anna Nguyen',
    nickname: 'Anna N.',
    phone: '(713) 555-1234',
    email: 'anna@example.com',
    position: 'Nail Technician',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200&h=200',
    vlinkpayId: 'VLP-0921-ANNA',
    payoutConfigs: {
      zelle: { enabled: true, value: '(713) 555-1234', qrCode: '', accountName: 'Anna Nguyen' },
      cashapp: { enabled: true, value: '$annanais', qrCode: '', accountName: 'Anna Nguyen' },
      venmo: { enabled: true, value: '@annanais', qrCode: '', accountName: 'Anna Nguyen' },
      bankwire: { enabled: false, value: '', qrCode: '', accountName: '' },
      paypal: { enabled: false, value: '', qrCode: '', accountName: '' },
      applecash: { enabled: false, value: '', qrCode: '', accountName: '' }
    }
  },
  'NEX-STAFF-LISA1102': {
    fullName: 'Lisa Tran',
    nickname: 'Lisa T.',
    phone: '(408) 555-2345',
    email: 'lisa@example.com',
    position: 'Nail Tech',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200&h=200',
    vlinkpayId: 'VLP-1102-LISA',
    payoutConfigs: {
      venmo: { enabled: true, value: '@lisatran-nails', qrCode: '', accountName: 'Lisa Tran' },
      cashapp: { enabled: true, value: '$lisatran', qrCode: '', accountName: 'Lisa Tran' },
      zelle: { enabled: true, value: 'lisa@example.com', qrCode: '', accountName: 'Lisa Tran' },
      bankwire: { enabled: false, value: '', qrCode: '', accountName: '' },
      paypal: { enabled: false, value: '', qrCode: '', accountName: '' },
      applecash: { enabled: false, value: '', qrCode: '', accountName: '' }
    }
  },
  'NEX-STAFF-HN1148': {
    fullName: 'Hanna Nguyen',
    nickname: 'Hanna Ng.',
    phone: '(407) 555-4567',
    email: 'hanna@example.com',
    position: 'Nail Art Designer',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=200&h=200',
    vlinkpayId: 'VLP-1148-HN',
    payoutConfigs: {
      venmo: { enabled: true, value: '@hanna-art', qrCode: '', accountName: 'Hanna Nguyen' },
      zelle: { enabled: true, value: 'hanna@example.com', qrCode: '', accountName: 'Hanna Nguyen' },
      cashapp: { enabled: false, value: '', qrCode: '', accountName: '' },
      bankwire: { enabled: false, value: '', qrCode: '', accountName: '' },
      paypal: { enabled: false, value: '', qrCode: '', accountName: '' },
      applecash: { enabled: false, value: '', qrCode: '', accountName: '' }
    }
  }
}

export { MOCK_NEXORA_STAFF_PROFILES }

export default function useStaffRegistration({ inviteData }) {
  const { t, currentLanguage, setLanguage } = useTranslation()
  const { showToast } = useNotification()
  const [step, setStep] = useState(0) // 0: Welcome Invite, 1: OTP, 2: Profile, 3: Payments, 4: Consent & Activate, 5: Success

  // Path selection states
  const [joinPath, setJoinPath] = useState(null)
  const [searchId, setSearchId] = useState('')
  const [linkedProfile, setLinkedProfile] = useState(null)
  const [searchError, setSearchError] = useState('')

  // Scanner states
  const [showScanner, setShowScanner] = useState(false)
  const [scanTarget, setScanTarget] = useState(null) // 'staff' | 'vlinkpay'

  const isSelfServe = !inviteData?.name

  // Verification states
  const [showOtpInput, setShowOtpInput] = useState(false)
  const [otpCode, setOtpCode] = useState('')
  const [otpError, setOtpError] = useState('')
  const [resendTimer, setResendTimer] = useState(30)

  // Registration states
  const [regEmail, setRegEmail] = useState('')
  const [regConfirmEmail, setRegConfirmEmail] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [regReferralLink, setRegReferralLink] = useState('')
  const [regErrors, setRegErrors] = useState({})
  const [termsAccepted, setTermsAccepted] = useState(false)

  // Profile states
  const [fullName, setFullName] = useState('')
  const [nickname, setNickname] = useState('')
  const [position, setPosition] = useState('Nail Technician')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [avatar, setAvatar] = useState('')
  const [bio, setBio] = useState('')
  const [staffId, setStaffId] = useState('')
  const [vlinkpayId, setVlinkpayId] = useState('')
  const phoneParsed = useMemo(() => parsePhone(phone), [phone])

  // Verification states for animation
  const [vlinkpayStatus, setVlinkpayStatus] = useState('idle') // 'idle' | 'checking' | 'success' | 'error'
  const [nexoraStatus, setNexoraStatus] = useState('idle') // 'idle' | 'checking' | 'success' | 'error'
  const [vlinkpayTimeout, setVlinkpayTimeout] = useState(null)
  const [nexoraTimeout, setNexoraTimeout] = useState(null)

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (vlinkpayTimeout) clearTimeout(vlinkpayTimeout)
      if (nexoraTimeout) clearTimeout(nexoraTimeout)
    }
  }, [vlinkpayTimeout, nexoraTimeout])

  // Payout Methods Toggles & Values
  const [payouts, setPayouts] = useState({
    zelle: { enabled: false, value: '', qrCode: '', accountName: '' },
    bankwire: { enabled: false, value: '', qrCode: '', accountName: '' },
    paypal: { enabled: false, value: '', qrCode: '', accountName: '' },
    venmo: { enabled: false, value: '', qrCode: '', accountName: '' },
    cashapp: { enabled: false, value: '', qrCode: '', accountName: '' },
    applecash: { enabled: false, value: '', qrCode: '', accountName: '' }
  })

  const [editingMethod, setEditingMethod] = useState(null)
  const [editValue, setEditValue] = useState('')
  const [editQrCode, setEditQrCode] = useState('')
  const [editAccountName, setEditAccountName] = useState('')
  const [isCapturing, setIsCapturing] = useState(false)
  const [modalError, setModalError] = useState('')

  // Setup initial values from inviteData (merchant dashboard simulation)
  useEffect(() => {
    if (inviteData) {
      setFullName(inviteData.name || '')
      setNickname(inviteData.name ? inviteData.name.split(' ')[0] + '.' : '')
      setPosition(inviteData.role || 'Nail Technician')
      setPhone(inviteData.phone || '')
      setEmail(inviteData.email || '')

      // Prefill registration fields
      setRegEmail(inviteData.email || '')
      setRegConfirmEmail(inviteData.email || '')
      setRegReferralLink(inviteData.biz || '')

      // If it's a verification lookup (Option A linking) they might already have an ID
      if (inviteData.id && inviteData.id.startsWith('NEX-STAFF-')) {
        setStaffId(inviteData.id)
      } else {
        setStaffId(`NEX-STAFF-${(inviteData.name || 'STAFF').replace(/[^a-zA-Z]/g, '').slice(0, 4).toUpperCase()}${Math.floor(1000 + Math.random() * 9000)}`)
      }

      // Prefill or generate VLINKPAY ID
      if (inviteData.vlinkpayId) {
        setVlinkpayId(inviteData.vlinkpayId)
      } else if (inviteData.vlinkpay) {
        setVlinkpayId(inviteData.vlinkpay)
      } else {
        const initials = (inviteData.name || 'STAFF').replace(/[^a-zA-Z]/g, '').slice(0, 4).toUpperCase()
        setVlinkpayId(`VLP-${Math.floor(1000 + Math.random() * 9000)}-${initials}`)
      }
    }
  }, [inviteData])

  // Auto-generate staffId and vlinkpayId once fullName is typed (for self-serve flow)
  useEffect(() => {
    if (isSelfServe && fullName.trim()) {
      const initials = fullName.trim().replace(/[^a-zA-Z]/g, '').slice(0, 4).toUpperCase() || 'STAFF'
      if (!staffId) {
        setStaffId(`NEX-STAFF-${initials}${Math.floor(1000 + Math.random() * 9000)}`)
      }
      if (!vlinkpayId) {
        setVlinkpayId(`VLP-${Math.floor(1000 + Math.random() * 9000)}-${initials}`)
      }
    }
  }, [fullName, isSelfServe])

  // Count down OTP timer
  useEffect(() => {
    if (step === 1 && resendTimer > 0) {
      const interval = setInterval(() => {
        setResendTimer(prev => prev - 1)
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [step, resendTimer])

  // Helper to autofill profile based on a mock profile
  const autofillFromProfile = (profile) => {
    if (!profile) return
    setFullName(profile.fullName || '')
    setNickname(profile.nickname || '')
    setPosition(profile.position || 'Nail Technician')
    setPhone(profile.phone || '')
    setEmail(profile.email || '')
    setAvatar(profile.avatar || '')
    if (profile.vlinkpayId) {
      setVlinkpayId(profile.vlinkpayId)
    }

    // Also autofill staff ID if it's found in MOCK_NEXORA_STAFF_PROFILES keys
    const foundStaffId = Object.keys(MOCK_NEXORA_STAFF_PROFILES).find(
      key => MOCK_NEXORA_STAFF_PROFILES[key] === profile
    )
    if (foundStaffId) {
      setStaffId(foundStaffId)
    }

    // Autofill payout configs
    if (profile.payoutConfigs) {
      setPayouts(profile.payoutConfigs)
    }

    showToast(
      currentLanguage === 'vi'
        ? `Đã nhận diện thành công hồ sơ của ${profile.fullName}!`
        : `Successfully matched and imported profile for ${profile.fullName}!`
    )
  }

  // Handle typing or scanning a NEXORA STAFF ID with debounce and animation
  const handleSearchIdChange = (val) => {
    setSearchId(val)
    setSearchError('')
    const upperVal = val.trim().toUpperCase()

    if (nexoraTimeout) clearTimeout(nexoraTimeout)

    if (!upperVal) {
      setNexoraStatus('idle')
      setLinkedProfile(null)
      return
    }

    setNexoraStatus('checking')

    const timer = setTimeout(() => {
      const profile = MOCK_NEXORA_STAFF_PROFILES[upperVal]
      if (profile) {
        setLinkedProfile(profile)
        setNexoraStatus('success')
        setSearchError('')
        showToast(
          currentLanguage === 'vi'
            ? `Tìm thấy hồ sơ ${profile.fullName}!`
            : `Found profile for ${profile.fullName}!`
        )
      } else {
        setLinkedProfile(null)
        setNexoraStatus('error')
        setSearchError(
          currentLanguage === 'vi'
            ? 'Không tìm thấy NEXORA Staff ID này.'
            : 'NEXORA Staff ID not found.'
        )
      }
    }, 600)

    setNexoraTimeout(timer)
  }

  // Handle typing or scanning a VLINKPAY ID with debounce and animation
  const handleVlinkpayIdChange = (val) => {
    setVlinkpayId(val)
    const upperVal = val.trim().toUpperCase()

    if (vlinkpayTimeout) clearTimeout(vlinkpayTimeout)

    if (!upperVal) {
      setVlinkpayStatus('idle')
      return
    }

    setVlinkpayStatus('checking')

    const timer = setTimeout(() => {
      const matchedProfile = Object.values(MOCK_NEXORA_STAFF_PROFILES).find(
        p => p.vlinkpayId?.toUpperCase() === upperVal
      )
      if (matchedProfile) {
        setVlinkpayStatus('success')
        autofillFromProfile(matchedProfile)
      } else {
        setVlinkpayStatus('error')
      }
    }, 600)

    setVlinkpayTimeout(timer)
  }

  // Handle opening scanner modal
  const handleScanQr = (target) => {
    setScanTarget(target)
    setShowScanner(true)
  }

  // Handle simulation of successful scan (Lisa Tran)
  const simulateSuccessfulScan = () => {
    if (scanTarget === 'staff') {
      setSearchId('NEX-STAFF-LISA1102')
      setNexoraStatus('success')
      setSearchError('')
      const profile = MOCK_NEXORA_STAFF_PROFILES['NEX-STAFF-LISA1102']
      setLinkedProfile(profile)
      showToast(
        currentLanguage === 'vi'
          ? `Tìm thấy hồ sơ ${profile.fullName}!`
          : `Found profile for ${profile.fullName}!`
      )
    } else if (scanTarget === 'vlinkpay') {
      setVlinkpayId('VLP-1102-LISA')
      setVlinkpayStatus('success')
      const profile = MOCK_NEXORA_STAFF_PROFILES['NEX-STAFF-LISA1102']
      autofillFromProfile(profile)
    }
    setShowScanner(false)
    setScanTarget(null)
  }

  // handle registration form submit
  const handleRegisterSubmit = (e) => {
    if (e) e.preventDefault()
    const errors = {}
    if (!regEmail.trim()) {
      errors.email = currentLanguage === 'vi' ? 'Email không được để trống' : 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(regEmail)) {
      errors.email = currentLanguage === 'vi' ? 'Email không hợp lệ' : 'Email is invalid'
    }
    if (regEmail !== regConfirmEmail) {
      errors.confirmEmail = currentLanguage === 'vi' ? 'Email nhập lại không khớp' : 'Emails do not match'
    }
    if (!regPassword) {
      errors.password = currentLanguage === 'vi' ? 'Mật khẩu không được để trống' : 'Password is required'
    } else if (regPassword.length < 6) {
      errors.password = currentLanguage === 'vi' ? 'Mật khẩu phải từ 6 ký tự' : 'Password must be at least 6 characters'
    }
    if (!termsAccepted) {
      errors.terms = currentLanguage === 'vi'
        ? 'Bạn phải đồng ý với Điều khoản & Điều kiện để tiếp tục.'
        : 'You must agree to the Terms & Conditions to proceed.'
    }

    if (Object.keys(errors).length > 0) {
      setRegErrors(errors)
      return
    }
    setRegErrors({})
    setEmail(regEmail) // Copy email to profile state
    setShowOtpInput(true) // Proceed to OTP activation stage
  }

  const handleVerifyOtp = (e) => {
    if (e) e.preventDefault()
    if (otpCode.trim() === '1234') {
      setStep(2)
    } else {
      setOtpError(currentLanguage === 'vi' ? 'Mã xác thực không hợp lệ. Gợi ý: Hãy nhập 1234.' : 'Invalid code. Tip: Enter 1234.')
    }
  }

  const autoFillOtp = () => {
    setOtpCode('1234')
    setOtpError('')
  }

  // Pre-fill payment configurations for faster testing
  const autoFillPayments = () => {
    const defaultName = fullName.trim() || 'Lisa Tran'
    setPayouts({
      zelle: { enabled: true, value: email || 'lisa@example.com', qrCode: '', accountName: defaultName },
      bankwire: { enabled: true, value: '123456789 - 987654321', qrCode: '', accountName: defaultName },
      paypal: { enabled: true, value: email || 'lisa@example.com', qrCode: '', accountName: defaultName },
      venmo: { enabled: true, value: `@${nickname.toLowerCase().replace(/[^a-z]/g, '') || 'lisa'}-nails`, qrCode: '', accountName: defaultName },
      cashapp: { enabled: true, value: `$${nickname.toLowerCase().replace(/[^a-z]/g, '') || 'lisa'}nails`, qrCode: '', accountName: defaultName },
      applecash: { enabled: true, value: phone || '408-555-2345', qrCode: '', accountName: defaultName }
    })
  }

  // Toggle payout method
  const handleToggleMethod = (key) => {
    setPayouts(prev => {
      const current = prev[key] || { enabled: false, value: '', qrCode: '', accountName: '' }
      const newEnabled = !current.enabled
      if (newEnabled && !current.value.trim()) {
        setTimeout(() => {
          handleEditPayoutAccount(key)
        }, 0)
      }
      return {
        ...prev,
        [key]: {
          ...current,
          enabled: newEnabled
        }
      }
    })
  }

  const handleEditPayoutAccount = (key) => {
    const config = payouts[key] || { enabled: false, value: '', qrCode: '', accountName: '' }
    setEditingMethod(key)
    setEditValue(config.value || '')
    setEditQrCode(config.qrCode || '')
    setEditAccountName(config.accountName || fullName || '')
    setModalError('')
    setIsCapturing(false)
  }

  const savePayoutAccount = (e) => {
    if (e) e.preventDefault()
    if (!editValue.trim()) {
      setModalError(currentLanguage === 'vi' ? 'Trường này là bắt buộc.' : 'This field is required.')
      return
    }
    setPayouts(prev => ({
      ...prev,
      [editingMethod]: {
        enabled: true,
        value: editValue.trim(),
        qrCode: editQrCode,
        accountName: editAccountName.trim()
      }
    }))
    setEditingMethod(null)
  }

  const handleModalFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      setEditQrCode(reader.result)
    }
    reader.readAsDataURL(file)
  }

  const handleModalTakePhoto = () => {
    setIsCapturing(true)
    setTimeout(() => {
      const mockQr = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
        editValue || 'nexora-mock-payout'
      )}`
      setEditQrCode(mockQr)
      setIsCapturing(false)
    }, 800)
  }

  const handleModalClearQr = () => {
    setEditQrCode('')
  }

  // Link existing profile (Option A)
  const handleLinkExistingProfile = () => {
    if (!linkedProfile) return

    const finalStaffMember = {
      id: searchId.trim().toUpperCase(),
      fullName: linkedProfile.fullName,
      nickname: linkedProfile.nickname,
      position: linkedProfile.position,
      avatar: linkedProfile.avatar,
      phone: linkedProfile.phone,
      email: linkedProfile.email,
      isActive: false, // Must be approved by merchant
      status: 'Pending Acceptance',
      flowType: 'Link Existing Staff ID',
      paymentAccounts: {
        venmo: linkedProfile.payoutConfigs?.venmo?.enabled ? linkedProfile.payoutConfigs.venmo.value.trim() : '',
        cashapp: linkedProfile.payoutConfigs?.cashapp?.enabled ? linkedProfile.payoutConfigs.cashapp.value.trim() : '',
        zelle: linkedProfile.payoutConfigs?.zelle?.enabled ? linkedProfile.payoutConfigs.zelle.value.trim() : '',
        vlinkpay: linkedProfile.vlinkpayId || '',
        paypal: linkedProfile.payoutConfigs?.paypal?.enabled ? linkedProfile.payoutConfigs.paypal.value.trim() : '',
        bankwire: linkedProfile.payoutConfigs?.bankwire?.enabled ? linkedProfile.payoutConfigs.bankwire.value.trim() : '',
        applecash: linkedProfile.payoutConfigs?.applecash?.enabled ? linkedProfile.payoutConfigs.applecash.value.trim() : ''
      },
      payoutConfigs: linkedProfile.payoutConfigs
    }

    // Save into localStorage merchant setup
    const savedSetup = localStorage.getItem('nexora_merchant_setup')
    let parsed = null
    if (savedSetup) {
      try {
        parsed = JSON.parse(savedSetup)
      } catch (e) {
        console.error('Failed to parse saved setup', e)
      }
    }
    if (!parsed) {
      parsed = {
        businessInfo: {
          name: inviteData?.biz || 'Golden Glow Nail Spa & Salon',
          email: 'owner@goldenglownails.com',
          phone: '(555) 019-2834',
          category: 'Nail Salon'
        },
        staffList: [
          { id: '1', fullName: 'Mia Tran', nickname: 'Mia T.', position: 'Gel-X Artist', avatar: '', isActive: true, showInTipsFlow: true, paymentAccounts: { venmo: '@miatran-nails', cashapp: '$miatran', zelle: 'mia.tran@gmail.com', vlinkpay: 'VLP-8842-MT' }, status: 'Active', flowType: 'Direct Addition' },
          { id: '2', fullName: 'Vivian Le', nickname: 'Vivian L.', position: 'Acrylic Specialist', avatar: '', isActive: true, showInTipsFlow: true, paymentAccounts: { venmo: '', cashapp: '$vivianle', zelle: '', vlinkpay: 'VLP-7629-VL' }, status: 'Active', flowType: 'Direct Addition' },
          { id: '3', fullName: 'Ashley Park', nickname: 'Ashley P.', position: 'Pedicure Lead', avatar: '', isActive: true, showInTipsFlow: true, paymentAccounts: { venmo: '@ashleypark', cashapp: '', zelle: 'ashley.p@gmail.com', vlinkpay: 'VLP-5521-AP' }, status: 'Active', flowType: 'Direct Addition' },
          { id: '4', fullName: 'Hanna Nguyen', nickname: 'Hanna N.', position: 'Nail Art Designer', avatar: '', isActive: false, showInTipsFlow: true, paymentAccounts: { venmo: '@hanna-art', cashapp: '', zelle: '', vlinkpay: 'VLP-1148-HN' }, status: 'Inactive', flowType: 'Direct Addition' }
        ],
        touchPoints: [
          { id: 'tp-main', name: 'Business Main Lobby QR', type: 'Business Main' },
          { id: 'tp-front', name: 'Reception Front Desk', type: 'Front Desk' },
          { id: 'tp-t1', name: 'Service Chair 01', type: 'Table QR' },
          { id: 'tp-t2', name: 'Service Chair 02', type: 'Table QR' },
        ]
      }
    }

    try {
      let staffList = parsed.staffList || []

      // Find existing index or append
      const existingIdx = staffList.findIndex(s => s.id === searchId.trim().toUpperCase() || s.email === linkedProfile.email || s.phone === linkedProfile.phone)
      if (existingIdx !== -1) {
        staffList[existingIdx] = {
          ...staffList[existingIdx],
          ...finalStaffMember
        }
      } else {
        staffList.push(finalStaffMember)
      }

      parsed.staffList = staffList
      localStorage.setItem('nexora_merchant_setup', JSON.stringify(parsed))
      sessionStorage.setItem('nexora_merchant_setup', JSON.stringify(parsed))

      // Add notification to merchant
      const savedNotifications = localStorage.getItem('nexora_notifications')
      let notis = []
      if (savedNotifications) {
        try {
          notis = JSON.parse(savedNotifications)
        } catch (e) {}
      }
      const newNoti = {
        id: `noti-join-${finalStaffMember.id}-${Date.now()}`,
        staffId: finalStaffMember.id,
        type: 'feedback_alert',
        title: currentLanguage === 'vi' ? 'Yêu cầu gia nhập mới' : 'New Join Request',
        message: currentLanguage === 'vi'
          ? `Thợ ${finalStaffMember.fullName} (${finalStaffMember.position}) đã gửi yêu cầu liên kết với tiệm của bạn.`
          : `Technician ${finalStaffMember.fullName} (${finalStaffMember.position}) requested to link with your salon.`,
        time: currentLanguage === 'vi' ? 'Vừa xong' : 'Just now',
        read: false,
        linkTab: 'staff'
      }
      notis = [newNoti, ...notis]
      localStorage.setItem('nexora_notifications', JSON.stringify(notis))
      sessionStorage.setItem('nexora_notifications', JSON.stringify(notis))
    } catch (e) {
      console.error('Failed to update staff database in wizard', e)
    }

    setStaffId(searchId.trim().toUpperCase())
    setStep(5)
  }

  // Save profile and notify App + LocalStorage
  const handleActivateProfile = () => {
    // Create the updated staff object
    const finalPaymentAccounts = {}
    if (vlinkpayId.trim()) {
      finalPaymentAccounts.vlinkpay = vlinkpayId.trim()
    }
    Object.keys(payouts).forEach(key => {
      if (payouts[key].enabled && payouts[key].value.trim()) {
        finalPaymentAccounts[key] = payouts[key].value.trim()
      }
    })

    const finalStaffMember = {
      id: staffId || `NEX-STAFF-${fullName.replace(/[^a-zA-Z]/g, '').slice(0, 4).toUpperCase()}${Math.floor(1000 + Math.random() * 9000)}`,
      fullName: fullName.trim(),
      nickname: nickname.trim() || fullName.split(' ')[0] + '.',
      position: position,
      avatar: avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200&h=200',
      phone: phone,
      email: email,
      isActive: false,
      status: 'Pending Acceptance',
      flowType: isSelfServe ? 'Self-Service Join' : (inviteData?.isLinkOnly ? 'Link Existing Staff ID' : 'Invite New Staff'),
      paymentAccounts: finalPaymentAccounts,
      payoutConfigs: payouts
    }

    // Save into localStorage merchant setup
    const savedSetup = localStorage.getItem('nexora_merchant_setup')
    let parsedActive = null
    if (savedSetup) {
      try {
        parsedActive = JSON.parse(savedSetup)
      } catch (e) {
        console.error('Failed to parse saved setup', e)
      }
    }
    if (!parsedActive) {
      parsedActive = {
        businessInfo: {
          name: inviteData?.biz || 'Golden Glow Nail Spa & Salon',
          email: 'owner@goldenglownails.com',
          phone: '(555) 019-2834',
          category: 'Nail Salon'
        },
        staffList: [
          { id: '1', fullName: 'Mia Tran', nickname: 'Mia T.', position: 'Gel-X Artist', avatar: '', isActive: true, showInTipsFlow: true, paymentAccounts: { venmo: '@miatran-nails', cashapp: '$miatran', zelle: 'mia.tran@gmail.com', vlinkpay: 'VLP-8842-MT' }, status: 'Active', flowType: 'Direct Addition' },
          { id: '2', fullName: 'Vivian Le', nickname: 'Vivian L.', position: 'Acrylic Specialist', avatar: '', isActive: true, showInTipsFlow: true, paymentAccounts: { venmo: '', cashapp: '$vivianle', zelle: '', vlinkpay: 'VLP-7629-VL' }, status: 'Active', flowType: 'Direct Addition' },
          { id: '3', fullName: 'Ashley Park', nickname: 'Ashley P.', position: 'Pedicure Lead', avatar: '', isActive: true, showInTipsFlow: true, paymentAccounts: { venmo: '@ashleypark', cashapp: '', zelle: 'ashley.p@gmail.com', vlinkpay: 'VLP-5521-AP' }, status: 'Active', flowType: 'Direct Addition' },
          { id: '4', fullName: 'Hanna Nguyen', nickname: 'Hanna N.', position: 'Nail Art Designer', avatar: '', isActive: false, showInTipsFlow: true, paymentAccounts: { venmo: '@hanna-art', cashapp: '', zelle: '', vlinkpay: 'VLP-1148-HN' }, status: 'Inactive', flowType: 'Direct Addition' }
        ],
        touchPoints: [
          { id: 'tp-main', name: 'Business Main Lobby QR', type: 'Business Main' },
          { id: 'tp-front', name: 'Reception Front Desk', type: 'Front Desk' },
          { id: 'tp-t1', name: 'Service Chair 01', type: 'Table QR' },
          { id: 'tp-t2', name: 'Service Chair 02', type: 'Table QR' },
        ]
      }
    }

    try {
      let staffList = parsedActive.staffList || []

      // Find existing index or append
      const existingIdx = staffList.findIndex(s => s.id === inviteData?.id || s.email === email || s.phone === phone)
      if (existingIdx !== -1) {
        const oldId = staffList[existingIdx].id
        const newId = finalStaffMember.id

        staffList[existingIdx] = {
          ...staffList[existingIdx],
          ...finalStaffMember,
          id: newId
        }
        // Update the local staff ID for the success message
        setStaffId(newId)

        // Update touchpoints matching oldId to newId
        if (parsedActive.touchPoints?.length) {
          parsedActive.touchPoints = parsedActive.touchPoints.map(tp => {
            if (tp.staffId === oldId) {
              return {
                ...tp,
                id: tp.id === `tp-staff-${oldId}` ? `tp-staff-${newId}` : tp.id,
                staffId: newId
              }
            }
            return tp
          })
        }
      } else {
        staffList.push(finalStaffMember)
      }

      parsedActive.staffList = staffList

      // We do NOT auto-generate touchpoint QR codes here anymore, because they are Pending Acceptance.
      // Touchpoint will be generated upon manual acceptance by the merchant.

      localStorage.setItem('nexora_merchant_setup', JSON.stringify(parsedActive))
      sessionStorage.setItem('nexora_merchant_setup', JSON.stringify(parsedActive))

      // Add notification to merchant
      const savedNotifications = localStorage.getItem('nexora_notifications')
      let notis = []
      if (savedNotifications) {
        try {
          notis = JSON.parse(savedNotifications)
        } catch (e) {}
      }
      const newNoti = {
        id: `noti-join-${finalStaffMember.id}-${Date.now()}`,
        staffId: finalStaffMember.id,
        type: 'feedback_alert',
        title: currentLanguage === 'vi' ? 'Yêu cầu gia nhập mới' : 'New Join Request',
        message: currentLanguage === 'vi'
          ? `Thợ ${finalStaffMember.fullName} (${finalStaffMember.position}) đã gửi yêu cầu liên kết với tiệm của bạn.`
          : `Technician ${finalStaffMember.fullName} (${finalStaffMember.position}) requested to link with your salon.`,
        time: currentLanguage === 'vi' ? 'Vừa xong' : 'Just now',
        read: false,
        linkTab: 'staff'
      }
      notis = [newNoti, ...notis]
      localStorage.setItem('nexora_notifications', JSON.stringify(notis))
      sessionStorage.setItem('nexora_notifications', JSON.stringify(notis))

      // Also save the staff account to nexora_pending_accounts so they can log in!
      if (email.trim() && regPassword) {
        const pendingAccounts = JSON.parse(localStorage.getItem('nexora_pending_accounts') || '[]')
        const staffAccount = {
          email: email.trim().toLowerCase(),
          password: regPassword,
          role: 'staff',
          staffId: finalStaffMember.id,
          isVerified: true,
          verificationStatus: 'verified'
        }
        const filtered = pendingAccounts.filter(acc => acc.email !== staffAccount.email)
        filtered.push(staffAccount)
        localStorage.setItem('nexora_pending_accounts', JSON.stringify(filtered))
        window.dispatchEvent(new Event('storage'))
      }
    } catch (e) {
      console.error('Failed to update staff database in wizard', e)
    }

    setStep(5)
  }

  return {
    // translation
    t, currentLanguage, setLanguage,
    // step
    step, setStep,
    // path selection
    joinPath, setJoinPath,
    searchId, setSearchId,
    linkedProfile, setLinkedProfile,
    searchError, setSearchError,
    // scanner
    showScanner, setShowScanner,
    scanTarget, setScanTarget,
    // flags
    isSelfServe,
    // otp
    showOtpInput, setShowOtpInput,
    otpCode, setOtpCode,
    otpError, setOtpError,
    resendTimer, setResendTimer,
    // registration
    regEmail, setRegEmail,
    regConfirmEmail, setRegConfirmEmail,
    regPassword, setRegPassword,
    regReferralLink, setRegReferralLink,
    regErrors, setRegErrors,
    termsAccepted, setTermsAccepted,
    // profile
    fullName, setFullName,
    nickname, setNickname,
    position, setPosition,
    phone, setPhone,
    email, setEmail,
    avatar, setAvatar,
    bio, setBio,
    staffId, setStaffId,
    vlinkpayId, setVlinkpayId,
    phoneParsed,
    // verification status
    vlinkpayStatus, setVlinkpayStatus,
    nexoraStatus, setNexoraStatus,
    // payouts
    payouts, setPayouts,
    editingMethod, setEditingMethod,
    editValue, setEditValue,
    editQrCode, setEditQrCode,
    editAccountName, setEditAccountName,
    isCapturing, setIsCapturing,
    modalError, setModalError,
    // handlers
    handleSearchIdChange,
    handleVlinkpayIdChange,
    handleScanQr,
    simulateSuccessfulScan,
    handleRegisterSubmit,
    handleVerifyOtp,
    autoFillOtp,
    autoFillPayments,
    handleToggleMethod,
    handleEditPayoutAccount,
    savePayoutAccount,
    handleModalFileChange,
    handleModalTakePhoto,
    handleModalClearQr,
    handleLinkExistingProfile,
    handleActivateProfile,
    autofillFromProfile,
  }
}
