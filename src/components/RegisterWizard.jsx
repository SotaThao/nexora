import React, { useState, useEffect, useMemo } from 'react'
import { 
  Mail, Lock, Eye, EyeOff, ShieldCheck, Check, 
  CheckCircle2, ArrowRight, ArrowLeft, Building2, 
  Globe, Landmark, FileText, Sparkles, CheckSquare, X,
  Upload, Loader2, XCircle, Camera, FolderOpen, AlertTriangle
} from 'lucide-react'
import { useTranslation } from '../contexts/LanguageContext'
import { storage } from '../utils/storage'
import CountryCodeSelect, { parsePhone } from './CountryCodeSelect'
import { MOCK_NEXORA_STAFF_PROFILES } from './staff-registration/hooks/useStaffRegistration'

const localStorage = storage
const sessionStorage = storage

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

export default function RegisterWizard({ ssoEmail, onBackToLogin, onRegisterSuccess, onRegisterAndLogin, onKybSuccess, isRedirectedFromSession }) {
  const { t, currentLanguage, setLanguage, renderLabel } = useTranslation()
  const [currentStep, setCurrentStep] = useState(0) // 0 (Role selection), 1 (Details), 2 (Profile), 3 (Payouts), 4 (Success)
  const [role, setRole] = useState('business') // 'business' | 'personal'

  // Step 1 states
  const [email, setEmail] = useState(ssoEmail || '')
  const [confirmEmail, setConfirmEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [referralCode, setReferralCode] = useState('')
  const [fullName, setFullName] = useState('')
  const [termsAccepted, setTermsAccepted] = useState(true)
  const [showTermsModal, setShowTermsModal] = useState(false)
  const [modalType, setModalType] = useState('terms') // 'terms' | 'privacy'
  const [nickname, setNickname] = useState('')
  const [position, setPosition] = useState('Nail Technician')
  const [phone, setPhone] = useState('')
  const [bio, setBio] = useState('')
  const [vlinkpayId, setVlinkpayId] = useState('')
  const [avatar, setAvatar] = useState('')
  const [payouts, setPayouts] = useState({
    zelle: { enabled: false, value: '', qrCode: '', accountName: '' },
    bankwire: { enabled: false, value: '', qrCode: '', accountName: '' },
    paypal: { enabled: false, value: '', qrCode: '', accountName: '' },
    venmo: { enabled: false, value: '', qrCode: '', accountName: '' },
    cashapp: { enabled: false, value: '', qrCode: '', accountName: '' },
    applecash: { enabled: false, value: '', qrCode: '', accountName: '' }
  })

  // Step 2 states
  const [generatedStaffId, setGeneratedStaffId] = useState('')
  const [copied, setCopied] = useState(false)
  
  // OTP activation states
  const [otpCode, setOtpCode] = useState('')
  const [otpError, setOtpError] = useState('')
  const [showOtpInput, setShowOtpInput] = useState(false)
  const [resendTimer, setResendTimer] = useState(30)

  // Profile / Payments Setup extra states
  const [editingMethod, setEditingMethod] = useState(null)
  const [editValue, setEditValue] = useState('')
  const [editQrCode, setEditQrCode] = useState('')
  const [editAccountName, setEditAccountName] = useState('')
  const [isCapturing, setIsCapturing] = useState(false)
  const [modalError, setModalError] = useState('')
  const [vlinkpayStatus, setVlinkpayStatus] = useState('idle') // 'idle' | 'checking' | 'success' | 'error'
  const [vlinkpayTimeout, setVlinkpayTimeout] = useState(null)

  useEffect(() => {
    let interval = null
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer(prev => prev - 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [resendTimer])
  
  // Validation errors
  const [errors, setErrors] = useState({})
  


  // Handle Step 1 Submit
  const handleStep1Next = (e) => {
    e.preventDefault()
    const newErrors = {}

    if (!email.trim()) {
      newErrors.email = t('register.errors.email_required')
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = t('register.errors.email_invalid')
    }

    if (!confirmEmail.trim()) {
      newErrors.confirmEmail = t('register.errors.confirm_email_required')
    } else if (confirmEmail.trim().toLowerCase() !== email.trim().toLowerCase()) {
      newErrors.confirmEmail = t('register.errors.email_mismatch')
    }

    if (!password) {
      newErrors.password = t('register.errors.password_required')
    } else if (password.length < 6) {
      newErrors.password = t('register.errors.password_short')
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setErrors({})
    
    if (role === 'personal') {
      // Generate Staff ID from email prefix for personal account
      const emailPrefix = email.split('@')[0].toUpperCase()
      const initials = emailPrefix.slice(0, 3) || 'STAFF'
      const randomDigits = Math.floor(1000 + Math.random() * 9000)
      const staffId = `NEX-STAFF-${initials}${randomDigits}`
      setGeneratedStaffId(staffId)
      setVlinkpayId(`VLP-${randomDigits}-${initials}`)

      // Show OTP input inline in Step 1
      setShowOtpInput(true)
      setOtpCode('')
      setOtpError('')
      setResendTimer(30)
    } else {
      // Business: go to OTP activation step
      setOtpCode('')
      setOtpError('')
      setResendTimer(30)
      setCurrentStep(2) // Step 2 is OTP Activation for business
    }
  }

  // Handle OTP Verification Submit (Business & Personal inline)
  const handleVerifyOtp = (e) => {
    e.preventDefault()
    if (otpCode === '1234') {
      setOtpError('')

      if (role === 'business') {
        // Register business account in local persistence
        const pendingAccounts = JSON.parse(localStorage.getItem('nexora_pending_accounts') || '[]')
        const newAccount = {
          email: email.trim().toLowerCase(),
          password: password,
          referralCode: referralCode.trim(),
          role: role,
          fullName: null,
          staffId: null,
          isVerified: false, // Business accounts start as unverified until KYB
          kybDetails: null
        }

        const filtered = pendingAccounts.filter(acc => acc.email !== newAccount.email)
        filtered.push(newAccount)
        localStorage.setItem('nexora_pending_accounts', JSON.stringify(filtered))

        if (onRegisterAndLogin) {
          onRegisterAndLogin(email.trim().toLowerCase())
        } else if (onRegisterSuccess) {
          onRegisterSuccess()
        }
      } else {
        // Personal: OTP verified, move to Step 2 (Profile Setup)
        setShowOtpInput(false)
        setCurrentStep(2)
      }
    } else {
      setOtpError(currentLanguage === 'vi' ? 'Mã OTP không chính xác. Thử lại với 1234.' : 'Invalid OTP. Try again with 1234.')
    }
  }

  useEffect(() => {
    return () => {
      if (vlinkpayTimeout) clearTimeout(vlinkpayTimeout)
    }
  }, [vlinkpayTimeout])

  const phoneParsed = useMemo(() => parsePhone(phone), [phone])

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
        setNickname(matchedProfile.nickname || '')
        setPosition(matchedProfile.position || 'Nail Technician')
        setPhone(matchedProfile.phone || '')
        setAvatar(matchedProfile.avatar || '')
        if (matchedProfile.payoutConfigs) {
          setPayouts(matchedProfile.payoutConfigs)
        }
      } else {
        setVlinkpayStatus('error')
      }
    }, 600)

    setVlinkpayTimeout(timer)
  }

  const autoFillPayments = () => {
    const defaultName = nickname.trim() || 'Lisa Tran'
    setPayouts({
      zelle: { enabled: true, value: email || 'lisa@example.com', qrCode: '', accountName: defaultName },
      bankwire: { enabled: true, value: '123456789 - 987654321', qrCode: '', accountName: defaultName },
      paypal: { enabled: true, value: email || 'lisa@example.com', qrCode: '', accountName: defaultName },
      venmo: { enabled: true, value: `@${nickname.toLowerCase().replace(/[^a-z]/g, '') || 'lisa'}-nails`, qrCode: '', accountName: defaultName },
      cashapp: { enabled: true, value: `$${nickname.toLowerCase().replace(/[^a-z]/g, '') || 'lisa'}nails`, qrCode: '', accountName: defaultName },
      applecash: { enabled: true, value: phone || '408-555-2345', qrCode: '', accountName: defaultName }
    })
  }

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
    setEditAccountName(config.accountName || nickname || '')
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

  const handlePersonalRegisterSubmit = () => {
    let staffId = generatedStaffId
    if (!staffId) {
      const emailPrefix = email.split('@')[0].toUpperCase()
      const initials = emailPrefix.slice(0, 3) || 'STAFF'
      const randomDigits = Math.floor(1000 + Math.random() * 9000)
      staffId = `NEX-STAFF-${initials}${randomDigits}`
      setGeneratedStaffId(staffId)
    }

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
      id: staffId,
      fullName: nickname.trim() || email.split('@')[0],
      nickname: nickname.trim() || email.split('@')[0],
      position: position,
      avatar: avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200&h=200',
      phone: phone,
      email: email,
      isActive: false,
      status: 'Pending Acceptance',
      flowType: 'Self-Service Join',
      paymentAccounts: finalPaymentAccounts,
      payoutConfigs: payouts
    }

    const pendingAccounts = JSON.parse(localStorage.getItem('nexora_pending_accounts') || '[]')
    const newAccount = {
      email: email.trim().toLowerCase(),
      password: password,
      referralCode: referralCode.trim(),
      role: role,
      fullName: nickname.trim() || email.split('@')[0],
      staffId: staffId,
      isVerified: true,
      kybDetails: null,
      nickname: nickname.trim(),
      position: position,
      phone: phone,
      avatar: avatar,
      payoutConfigs: payouts,
      paymentAccounts: finalPaymentAccounts
    }
    const filteredPending = pendingAccounts.filter(acc => acc.email !== newAccount.email)
    filteredPending.push(newAccount)
    localStorage.setItem('nexora_pending_accounts', JSON.stringify(filteredPending))

    const savedSetup = localStorage.getItem('nexora_merchant_setup')
    let parsedSetup = null
    if (savedSetup) {
      try {
        parsedSetup = JSON.parse(savedSetup)
      } catch (e) {}
    }
    if (!parsedSetup) {
      parsedSetup = {
        businessInfo: {
          name: 'Golden Glow Nail Spa & Salon',
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
      const staffList = parsedSetup.staffList || []
      const existingIdx = staffList.findIndex(s => s.id === staffId || s.email === email || s.phone === phone)
      if (existingIdx !== -1) {
        staffList[existingIdx] = {
          ...staffList[existingIdx],
          ...finalStaffMember
        }
      } else {
        staffList.push(finalStaffMember)
      }
      parsedSetup.staffList = staffList
      localStorage.setItem('nexora_merchant_setup', JSON.stringify(parsedSetup))
      sessionStorage.setItem('nexora_merchant_setup', JSON.stringify(parsedSetup))

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
      window.dispatchEvent(new Event('storage'))
    } catch (e) {}

    setCurrentStep(4)
  }

  const handleCopyStaffId = () => {
    navigator.clipboard.writeText(generatedStaffId)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Helper for steps naming
  const getStepName = (step) => {
    if (role === 'business') {
      switch (step) {
        case 0: return currentLanguage === 'vi' ? 'Chọn vai trò' : 'Account Type'
        case 1: return currentLanguage === 'vi' ? 'Thông tin đăng ký' : 'Credentials'
        case 2: return currentLanguage === 'vi' ? 'Kích hoạt OTP' : 'Activate OTP'
        default: return ''
      }
    } else {
      switch (step) {
        case 0: return currentLanguage === 'vi' ? 'Chọn vai trò' : 'Account Type'
        case 1: return currentLanguage === 'vi' ? 'Thông tin đăng ký' : 'Credentials'
        case 2: return currentLanguage === 'vi' ? 'Hồ sơ cá nhân' : 'Profile Setup'
        case 3: return currentLanguage === 'vi' ? 'Cấu hình ví' : 'Payout Setup'
        case 4: return currentLanguage === 'vi' ? 'Hoàn tất' : 'Success'
        default: return ''
      }
    }
  }

  return (
    <div className="min-h-dvh bg-[#F8FAFC] text-[#0B1C30] font-sans antialiased relative overflow-x-hidden selection:bg-nexoraBrandSoft selection:text-nexoraBrand">
      {/* Background decorations */}
      <div className="absolute top-1/4 left-1/4 h-56 w-56 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[rgba(66,72,216,0.04)] via-transparent to-transparent blur-3xl pointer-events-none sm:h-96 sm:w-96"></div>
      <div className="absolute bottom-1/4 right-1/4 h-64 w-64 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[rgba(43,89,255,0.02)] via-transparent to-transparent blur-3xl pointer-events-none sm:h-[450px] sm:w-[450px]"></div>

      {/* Language Switcher */}
      <div className="absolute top-4 right-4 z-50 flex items-center gap-2 bg-white/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-nexoraBorder shadow-sm">
        <button 
          onClick={() => setLanguage('vi')}
          className={`text-xs font-bold px-2 py-0.5 rounded transition ${currentLanguage === 'vi' ? 'bg-nexoraBrand text-white' : 'text-nexoraSubtle hover:text-nexoraText'}`}
        >
          VI
        </button>
        <span className="text-nexoraBorder text-xs">|</span>
        <button 
          onClick={() => setLanguage('en')}
          className={`text-xs font-bold px-2 py-0.5 rounded transition ${currentLanguage === 'en' ? 'bg-nexoraBrand text-white' : 'text-nexoraSubtle hover:text-nexoraText'}`}
        >
          EN
        </button>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 relative z-10 flex flex-col justify-center min-h-dvh">
        {/* Branding header */}
        <div className="text-center mb-6">
          <img src="/assets/nexora-logo.png" alt="Nexora Logo" className="w-12 h-12 mx-auto object-contain mb-2" />
          <h2 className="font-sans text-xl font-bold tracking-wide sm:text-2xl text-nexoraText">
            NEXORA <span className="ml-1.5 inline-flex align-middle text-nexoraBrand font-sans text-xs tracking-widest font-black uppercase bg-nexoraBrand/10 px-2 py-0.5 rounded border border-nexoraBrand/30">TOUCH</span>
          </h2>
          <p className="text-xs text-nexoraSubtle font-light tracking-wide mt-1">Cổng đăng ký Merchant Nexora & VLINKPAY KYB</p>
        </div>

        {/* Wizard Steps indicator */}
        {currentStep > 0 && (
          <div className="max-w-xl mx-auto w-full mb-10 px-4">
            <div className="relative flex items-center justify-between">
              {/* Connecting Track Line */}
              <div className="absolute left-0 top-5 -translate-y-1/2 w-full h-[3px] bg-slate-200/60 rounded-full -z-10"></div>
              <div 
                className="absolute left-0 top-5 -translate-y-1/2 h-[3px] bg-gradient-to-r from-[#2B59FF] via-[#5A5CFF] to-[#8E4DF8] rounded-full -z-10 transition-all duration-500 ease-out"
                style={{ width: `${((currentStep - 1) / (role === 'business' ? 1 : 3)) * 100}%` }}
              ></div>

              {(role === 'business' ? [1, 2] : [1, 2, 3, 4]).map((step) => {
                const isActive = step === currentStep
                const isCompleted = step < currentStep
                return (
                  <div key={step} className="flex flex-col items-center relative z-10">
                    <div 
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 border-2 font-bold text-sm
                        ${isActive 
                          ? 'bg-white border-nexoraBrand text-nexoraBrand shadow-[0_4px_12px_rgba(70,72,216,0.18)] ring-4 ring-nexoraBrandSoft/80 scale-110' 
                          : isCompleted
                            ? 'bg-gradient-to-tr from-[#2B59FF] to-[#8E4DF8] border-transparent text-white shadow-sm'
                            : 'bg-white border-slate-200 text-slate-400'
                        }`}
                    >
                      {isCompleted ? <Check className="w-5 h-5 stroke-[3px]" /> : step}
                    </div>
                    <div className="text-center mt-2.5">
                      <span className="text-[9px] font-extrabold uppercase tracking-widest text-[#2B59FF]/80 mb-0.5 block">
                        {currentLanguage === 'vi' ? `Bước ${step}` : `Step ${step}`}
                      </span>
                      <span className={`text-[11px] font-extrabold tracking-wide transition-colors duration-300 block
                        ${isActive ? 'text-nexoraBrand' : isCompleted ? 'text-slate-800' : 'text-slate-400'}`}>
                        {getStepName(step)}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Main Card container */}
        <div className="bg-white rounded-2xl border border-nexoraBorder shadow-premium overflow-hidden transition-all duration-500">
          
          {/* STEP 0: Role Selection */}
          {currentStep === 0 && (
            <div className="p-6 sm:p-10 space-y-6">
              <div className="text-center max-w-md mx-auto">
                <h3 className="text-lg font-bold text-nexoraText">{t('register.role_select_title')}</h3>
                <p className="text-xs text-nexoraSubtle mt-1">{t('register.role_select_desc')}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto pt-2">
                {/* Business Owner Option */}
                <button
                  type="button"
                  onClick={() => setRole('business')}
                  className={`p-6 rounded-2xl border text-left flex flex-col justify-between transition-all duration-300 group min-h-[180px] hover:shadow-md
                    ${role === 'business'
                      ? 'border-nexoraBrand bg-nexoraBrandSoft/10 ring-2 ring-nexoraBrand/20'
                      : 'border-nexoraBorder bg-white hover:border-slate-300'
                    }`}
                >
                  <div className="flex justify-between items-start w-full">
                    <div className={`p-3 rounded-xl transition-all duration-300
                      ${role === 'business'
                        ? 'bg-nexoraBrand text-white'
                        : 'bg-slate-50 text-slate-400 group-hover:bg-slate-100 group-hover:text-slate-600'
                      }`}
                    >
                      <Building2 className="w-6 h-6" />
                    </div>
                    {role === 'business' && (
                      <span className="h-5 w-5 rounded-full bg-nexoraBrand text-white flex items-center justify-center">
                        <Check className="w-3 h-3 stroke-[3px]" />
                      </span>
                    )}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 mt-4 group-hover:text-nexoraBrand transition-colors">
                      {t('register.role_business_title')}
                    </h4>
                    <p className="text-[11px] text-nexoraSubtle mt-1 leading-relaxed">
                      {t('register.role_business_desc')}
                    </p>
                  </div>
                </button>

                {/* Technician Option */}
                <button
                  type="button"
                  onClick={() => setRole('personal')}
                  className={`p-6 rounded-2xl border text-left flex flex-col justify-between transition-all duration-300 group min-h-[180px] hover:shadow-md
                    ${role === 'personal'
                      ? 'border-nexoraBrand bg-nexoraBrandSoft/10 ring-2 ring-nexoraBrand/20'
                      : 'border-nexoraBorder bg-white hover:border-slate-300'
                    }`}
                >
                  <div className="flex justify-between items-start w-full">
                    <div className={`p-3 rounded-xl transition-all duration-300
                      ${role === 'personal'
                        ? 'bg-nexoraBrand text-white'
                        : 'bg-slate-50 text-slate-400 group-hover:bg-slate-100 group-hover:text-slate-600'
                      }`}
                    >
                      <Sparkles className="w-6 h-6" />
                    </div>
                    {role === 'personal' && (
                      <span className="h-5 w-5 rounded-full bg-nexoraBrand text-white flex items-center justify-center">
                        <Check className="w-3 h-3 stroke-[3px]" />
                      </span>
                    )}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 mt-4 group-hover:text-nexoraBrand transition-colors">
                      {t('register.role_personal_title')}
                    </h4>
                    <p className="text-[11px] text-nexoraSubtle mt-1 leading-relaxed">
                      {t('register.role_personal_desc')}
                    </p>
                  </div>
                </button>
              </div>

              <div className="pt-4 flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                <button
                  type="button"
                  onClick={onBackToLogin}
                  className="w-full min-h-11 py-2.5 border border-nexoraBorder hover:bg-nexoraCanvas text-nexoraSubtle hover:text-nexoraText font-semibold text-xs uppercase tracking-wider rounded-lg flex items-center justify-center gap-1.5 transition-all"
                >
                  <ArrowLeft className="w-4 h-4" /> {t('common.back')}
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="w-full min-h-11 py-2.5 bg-gradient-to-r from-[#2B59FF] to-[#8E4DF8] hover:opacity-90 text-white font-extrabold text-xs uppercase tracking-wider rounded-lg flex items-center justify-center gap-1.5 shadow-[0_4px_12px_rgba(43,89,255,0.25)] transition-all"
                >
                  {t('common.next')} <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 1: Registration Form */}
          {currentStep === 1 && (
            <div className="p-6 sm:p-10 space-y-6">
              {showOtpInput ? (
                <div className="space-y-6 animate-fadeIn">
                  <div className="text-center max-w-md mx-auto">
                    <h3 className="text-lg font-bold text-nexoraText font-sans">
                      {currentLanguage === 'vi' ? 'Kích hoạt tài khoản (Nhập OTP)' : 'Activate Account (Enter OTP)'}
                    </h3>
                    <p className="text-xs text-nexoraSubtle mt-1 leading-relaxed">
                      {currentLanguage === 'vi'
                        ? 'Nhập mã OTP được gửi tới email của bạn để kích hoạt tài khoản.'
                        : 'Enter the OTP code sent to your email to activate your account.'}
                    </p>
                  </div>

                  <form onSubmit={handleVerifyOtp} className="space-y-4 max-w-md mx-auto">
                    <div>
                      <label className="block text-[10px] font-bold text-nexoraText uppercase tracking-wider mb-2">
                        {renderLabel(currentLanguage === 'vi' ? 'Nhập mã OTP *' : 'Enter OTP Code *')}
                      </label>
                      <input 
                        type="text"
                        placeholder="e.g. 1234"
                        maxLength={6}
                        className={`w-full bg-nexoraCanvas border ${otpError ? 'border-red-300 focus:border-red-500' : 'border-nexoraBorder focus:border-nexoraBrand focus:bg-white'} rounded-lg px-4 py-2.5 text-center font-mono font-extrabold text-lg text-nexoraText focus:outline-none transition-all`}
                        value={otpCode}
                        onChange={(e) => {
                          setOtpCode(e.target.value)
                          if (otpError) setOtpError('')
                        }}
                        required
                      />
                      {otpError && <span className="text-xs text-red-500 mt-1 block text-center font-semibold">{otpError}</span>}
                    </div>

                    <div className="text-center">
                      <span className="text-[10px] text-slate-400 font-bold block">
                        {resendTimer > 0
                          ? (currentLanguage === 'vi' ? `Gửi lại mã sau ${resendTimer}s` : `Resend code in ${resendTimer}s`)
                          : (
                            <button
                              type="button"
                              onClick={() => setResendTimer(30)}
                              className="text-nexoraBrand hover:underline"
                            >
                              {currentLanguage === 'vi' ? 'Gửi lại mã xác thực' : 'Resend Verification Code'}
                            </button>
                          )
                        }
                      </span>
                    </div>

                    {/* Simulator Helper */}
                    <div className="p-3 border border-dashed border-nexoraBrand/30 bg-nexoraBrandSoft/30 rounded-xl flex items-center justify-between gap-3 max-w-xs mx-auto">
                      <span className="text-[10px] text-nexoraBrand font-bold">Simulator Helper:</span>
                      <button
                        type="button"
                        onClick={() => {
                          setOtpCode('1234')
                          setOtpError('')
                        }}
                        className="px-2.5 py-1 bg-nexoraBrand text-white rounded text-[10px] font-black uppercase hover:bg-opacity-90 shadow-sm"
                      >
                        Auto-fill (1234)
                      </button>
                    </div>

                    <div className="pt-4 flex flex-col sm:flex-row gap-3">
                      <button 
                        type="button"
                        onClick={() => setShowOtpInput(false)}
                        className="w-full min-h-11 py-2.5 border border-nexoraBorder hover:bg-nexoraCanvas text-nexoraSubtle hover:text-nexoraText font-semibold text-xs uppercase tracking-wider rounded-lg flex items-center justify-center gap-1.5 transition-all"
                      >
                        <ArrowLeft className="w-4 h-4" /> {t('common.back')}
                      </button>
                      <button 
                        type="submit"
                        className="w-full min-h-11 py-2.5 bg-gradient-to-r from-[#2B59FF] to-[#8E4DF8] hover:opacity-90 text-white font-extrabold text-xs uppercase tracking-wider rounded-lg flex items-center justify-center gap-1.5 shadow-[0_4px_12px_rgba(43,89,255,0.25)] transition-all"
                      >
                        {currentLanguage === 'vi' ? 'Xác minh & Kích hoạt' : 'Verify & Activate'} <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                <>
                  <div>
                    <h3 className="text-lg font-bold text-nexoraText">{t('register.title_step_1')}</h3>
                    <p className="text-xs text-nexoraSubtle mt-1">{t('register.desc_step_1')}</p>
                  </div>

                  <form onSubmit={handleStep1Next} noValidate className="space-y-4 max-w-md mx-auto">
                    {/* Email Input */}
                    <div>
                      <label className="block text-[10px] font-bold text-nexoraText uppercase tracking-wider mb-2">
                        {renderLabel(t('register.email_label'))}
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 w-4 h-4 text-nexoraSubtle" />
                        <input 
                          type="email"
                          placeholder={t('register.email_placeholder')}
                          disabled={!!ssoEmail}
                          className={`w-full bg-nexoraCanvas border ${errors.email ? 'border-red-300' : 'border-nexoraBorder'} ${ssoEmail ? 'bg-blue-50/50 text-nexoraSubtle' : 'focus:bg-white focus:border-nexoraBrand'} rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none transition-all`}
                          value={email}
                          onChange={(e) => {
                            setEmail(e.target.value)
                            if (errors.email) setErrors({ ...errors, email: '' })
                          }}
                        />
                      </div>
                      {errors.email && <span className="text-xs text-red-500 mt-1 block">{errors.email}</span>}
                    </div>

                    {/* Confirm Email Input */}
                    <div>
                      <label className="block text-[10px] font-bold text-nexoraText uppercase tracking-wider mb-2">
                        {renderLabel(t('register.confirm_email_label'))}
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 w-4 h-4 text-nexoraSubtle" />
                        <input 
                          type="email"
                          placeholder={t('register.confirm_email_placeholder')}
                          className={`w-full bg-nexoraCanvas border ${errors.confirmEmail ? 'border-red-300 focus:border-red-500' : 'border-nexoraBorder focus:border-nexoraBrand focus:bg-white'} rounded-lg pl-10 pr-4 py-2.5 text-sm text-nexoraText focus:outline-none transition-all`}
                          value={confirmEmail}
                          onChange={(e) => {
                            setConfirmEmail(e.target.value)
                            if (errors.confirmEmail) setErrors({ ...errors, confirmEmail: '' })
                          }}
                        />
                      </div>
                      {errors.confirmEmail && <span className="text-xs text-red-500 mt-1 block">{errors.confirmEmail}</span>}
                    </div>

                    {/* Password Input */}
                    <div>
                      <label className="block text-[10px] font-bold text-nexoraText uppercase tracking-wider mb-2">
                        {renderLabel(t('register.password_label'))}
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 w-4 h-4 text-nexoraSubtle" />
                        <input 
                          type={showPassword ? "text" : "password"}
                          placeholder={t('register.password_placeholder')}
                          className={`w-full bg-nexoraCanvas border ${errors.password ? 'border-red-300 focus:border-red-500' : 'border-nexoraBorder focus:border-nexoraBrand focus:bg-white'} rounded-lg pl-10 pr-12 py-2.5 text-sm text-nexoraText focus:outline-none transition-all`}
                          value={password}
                          onChange={(e) => {
                            setPassword(e.target.value)
                            if (errors.password) setErrors({ ...errors, password: '' })
                          }}
                        />
                        <button 
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-3 text-nexoraSubtle hover:text-nexoraText transition"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {errors.password && <span className="text-xs text-red-500 mt-1 block">{errors.password}</span>}
                    </div>

                    {/* Referral Code Input */}
                    <div>
                      <label className="block text-[10px] font-bold text-nexoraText uppercase tracking-wider mb-2">
                        {t('register.referral_code_label')}
                      </label>
                      <input 
                        type="text"
                        placeholder={t('register.referral_code_placeholder')}
                        className="w-full bg-nexoraCanvas border border-nexoraBorder focus:border-nexoraBrand focus:bg-white rounded-lg px-4 py-2.5 text-sm text-nexoraText focus:outline-none transition-all"
                        value={referralCode}
                        onChange={(e) => setReferralCode(e.target.value)}
                      />
                    </div>

                    {/* Implicit Consent Terms and Privacy Note */}
                    <div className="text-[11px] text-slate-500 leading-normal text-center font-sans max-w-sm mx-auto pt-1 pb-2">
                      {currentLanguage === 'vi' ? (
                        <>
                          Bằng cách chọn vào <span className="font-bold text-slate-700">Đăng ký</span>, bạn xác nhận rằng bạn đã đọc và đồng ý với{' '}
                          <button
                            type="button"
                            onClick={() => {
                              setModalType('terms')
                              setShowTermsModal(true)
                            }}
                            className="text-[#0da59a] hover:underline font-bold"
                          >
                            Điều khoản dịch vụ
                          </button>{' '}
                          và{' '}
                          <button
                            type="button"
                            onClick={() => {
                              setModalType('privacy')
                              setShowTermsModal(true)
                            }}
                            className="text-[#0da59a] hover:underline font-bold"
                          >
                            Chính sách bảo mật
                          </button>{' '}
                          của chúng tôi.
                        </>
                      ) : (
                        <>
                          By selecting <span className="font-bold text-slate-700">Register</span>, you confirm that you have read and agree to our{' '}
                          <button
                            type="button"
                            onClick={() => {
                              setModalType('terms')
                              setShowTermsModal(true)
                            }}
                            className="text-[#0da59a] hover:underline font-bold"
                          >
                            Terms of Service
                          </button>{' '}
                          and{' '}
                          <button
                            type="button"
                            onClick={() => {
                              setModalType('privacy')
                              setShowTermsModal(true)
                            }}
                            className="text-[#0da59a] hover:underline font-bold"
                          >
                            Privacy Policy
                          </button>.
                        </>
                      )}
                    </div>

                    <div className="pt-4 flex flex-col sm:flex-row gap-3">
                      <button 
                        type="button"
                        onClick={() => setCurrentStep(0)}
                        className="w-full min-h-11 py-2.5 border border-nexoraBorder hover:bg-nexoraCanvas text-nexoraSubtle hover:text-nexoraText font-semibold text-xs uppercase tracking-wider rounded-lg flex items-center justify-center gap-1.5 transition-all"
                      >
                        <ArrowLeft className="w-4 h-4" /> {t('common.back')}
                      </button>
                      <button 
                        type="submit"
                        className="w-full min-h-11 py-2.5 bg-gradient-to-r from-[#2B59FF] to-[#8E4DF8] hover:opacity-90 text-white font-extrabold text-xs uppercase tracking-wider rounded-lg flex items-center justify-center gap-1.5 shadow-[0_4px_12px_rgba(43,89,255,0.25)] transition-all"
                      >
                        {currentLanguage === 'vi' ? 'Đăng ký' : 'Register'} <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </form>
                </>
              )}
            </div>
          )}

          {/* STEP 2: OTP Verification (Merchant only) */}
          {currentStep === 2 && role === 'business' && (
            <div className="p-6 sm:p-10 space-y-6 animate-fadeIn">
              <div className="text-center max-w-md mx-auto">
                <h3 className="text-lg font-bold text-nexoraText">
                  {currentLanguage === 'vi' ? 'Kích hoạt tài khoản (Nhập OTP)' : 'Activate Account (Enter OTP)'}
                </h3>
                <p className="text-xs text-nexoraSubtle mt-1 leading-relaxed">
                  {currentLanguage === 'vi'
                    ? 'Nhập mã OTP được gửi tới email của bạn để kích hoạt tài khoản.'
                    : 'Enter the OTP code sent to your email to activate your account.'}
                </p>
              </div>

              <form onSubmit={handleVerifyOtp} className="space-y-4 max-w-md mx-auto">
                <div>
                  <label className="block text-[10px] font-bold text-nexoraText uppercase tracking-wider mb-2">
                    {renderLabel(currentLanguage === 'vi' ? 'Nhập mã OTP *' : 'Enter OTP Code *')}
                  </label>
                  <input 
                    type="text"
                    placeholder="e.g. 1234"
                    maxLength={6}
                    className={`w-full bg-nexoraCanvas border ${otpError ? 'border-red-300 focus:border-red-500' : 'border-nexoraBorder focus:border-nexoraBrand focus:bg-white'} rounded-lg px-4 py-2.5 text-center font-mono font-extrabold text-lg text-nexoraText focus:outline-none transition-all`}
                    value={otpCode}
                    onChange={(e) => {
                      setOtpCode(e.target.value)
                      if (otpError) setOtpError('')
                    }}
                    required
                  />
                  {otpError && <span className="text-xs text-red-500 mt-1 block text-center font-semibold">{otpError}</span>}
                </div>

                <div className="text-center">
                  <span className="text-[10px] text-slate-400 font-bold block">
                    {resendTimer > 0
                      ? (currentLanguage === 'vi' ? `Gửi lại mã sau ${resendTimer}s` : `Resend code in ${resendTimer}s`)
                      : (
                        <button
                          type="button"
                          onClick={() => setResendTimer(30)}
                          className="text-nexoraBrand hover:underline"
                        >
                          {currentLanguage === 'vi' ? 'Gửi lại mã xác thực' : 'Resend Verification Code'}
                        </button>
                      )
                    }
                  </span>
                </div>

                {/* Simulator Helper */}
                <div className="p-3 border border-dashed border-nexoraBrand/30 bg-nexoraBrandSoft/30 rounded-xl flex items-center justify-between gap-3 max-w-xs mx-auto">
                  <span className="text-[10px] text-nexoraBrand font-bold">Simulator Helper:</span>
                  <button
                    type="button"
                    onClick={() => {
                      setOtpCode('1234')
                      setOtpError('')
                    }}
                    className="px-2.5 py-1 bg-[#2B59FF] text-white rounded text-[10px] font-black uppercase hover:bg-opacity-90 shadow-sm animate-pulse"
                  >
                    Auto-fill (1234)
                  </button>
                </div>

                <div className="pt-4 flex flex-col sm:flex-row gap-3">
                  <button 
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="w-full min-h-11 py-2.5 border border-nexoraBorder hover:bg-nexoraCanvas text-nexoraSubtle hover:text-nexoraText font-semibold text-xs uppercase tracking-wider rounded-lg flex items-center justify-center gap-1.5 transition-all"
                  >
                    <ArrowLeft className="w-4 h-4" /> {t('common.back')}
                  </button>
                  <button 
                    type="submit"
                    className="w-full min-h-11 py-2.5 bg-gradient-to-r from-[#2B59FF] to-[#8E4DF8] hover:opacity-90 text-white font-extrabold text-xs uppercase tracking-wider rounded-lg flex items-center justify-center gap-1.5 shadow-[0_4px_12px_rgba(43,89,255,0.25)] transition-all"
                  >
                    {currentLanguage === 'vi' ? 'Xác minh & Kích hoạt' : 'Verify & Activate'} <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* STEP 2: Profile Setup (Personal only) */}
          {currentStep === 2 && role === 'personal' && (
            <div className="p-6 sm:p-10 space-y-6 animate-fadeIn">
              <div>
                <h3 className="text-lg font-bold text-nexoraText">
                  {currentLanguage === 'vi' ? 'Cấu hình hồ sơ cá nhân' : 'Personal Profile Setup'}
                </h3>
                <p className="text-xs text-nexoraSubtle mt-1">
                  {currentLanguage === 'vi' ? 'Thiết lập thông tin hiển thị của bạn trên màn hình nhận tiền tip.' : 'Configure your display details for the customer tip screen.'}
                </p>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); setCurrentStep(3); }} className="space-y-4 max-w-xl mx-auto">
                {/* Avatar section */}
                <div className="flex items-center gap-4 border-b border-nexoraBorder pb-4">
                  <div className="relative">
                    {avatar ? (
                      <>
                        <img src={avatar} alt="" className="h-16 w-16 rounded-full object-cover border border-nexoraBorder ring-2 ring-nexoraBrand/20" />
                        <button
                          type="button"
                          onClick={() => setAvatar(null)}
                          className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 hover:bg-red-600 text-white transition shadow duration-150 cursor-pointer"
                          title={currentLanguage === 'vi' ? 'Xóa ảnh' : 'Remove photo'}
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </>
                    ) : (
                      <div className="h-16 w-16 rounded-full bg-nexoraCanvas flex items-center justify-center font-black text-nexoraSubtle text-lg border border-nexoraBorder">
                        {nickname.charAt(0) || 'N'}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-2">
                      <label className="h-9 px-4 rounded-lg bg-gradient-to-r from-[#2B59FF] to-[#8E4DF8] hover:opacity-90 text-white flex items-center justify-center gap-1.5 cursor-pointer text-xs font-bold transition shadow-sm">
                        <Upload className="h-3.5 w-3.5" />
                        <span>{currentLanguage === 'vi' ? 'Tải ảnh lên' : 'Upload photo'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) {
                              const reader = new FileReader()
                              reader.onloadend = () => {
                                setAvatar(reader.result)
                              }
                              reader.readAsDataURL(file)
                            }
                          }}
                        />
                      </label>
                    </div>
                    <span className="text-[10px] text-nexoraSubtle">
                      {currentLanguage === 'vi'
                        ? 'Chấp nhận định dạng JPG, PNG. Dung lượng tối đa 5MB.'
                        : 'Accepted formats: JPG, PNG. Max size: 5MB.'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Full Name */}
                  <div>
                    <label className="block text-[10px] font-bold text-nexoraText uppercase tracking-wider mb-2">
                      {renderLabel(currentLanguage === 'vi' ? 'Họ và tên *' : 'Full Name *')}
                    </label>
                    <input 
                      type="text"
                      placeholder="e.g. Lisa Marie Tran"
                      required
                      className="w-full bg-nexoraCanvas border border-nexoraBorder focus:border-nexoraBrand focus:bg-white rounded-lg px-4 py-2.5 text-sm text-nexoraText focus:outline-none transition-all"
                      value={fullName}
                      onChange={(e) => {
                        setFullName(e.target.value)
                        if (!nickname) setNickname(e.target.value.split(' ')[0] + '.')
                      }}
                    />
                  </div>

                  {/* Display Nickname */}
                  <div>
                    <label className="block text-[10px] font-bold text-nexoraText uppercase tracking-wider mb-2">
                      {renderLabel(currentLanguage === 'vi' ? 'Tên hiển thị (Nickname) *' : 'Display Nickname *')}
                    </label>
                    <input 
                      type="text"
                      placeholder="e.g. Lisa T."
                      required
                      className="w-full bg-nexoraCanvas border border-nexoraBorder focus:border-nexoraBrand focus:bg-white rounded-lg px-4 py-2.5 text-sm text-nexoraText focus:outline-none transition-all"
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Phone Number */}
                  <div>
                    <label className="block text-[10px] font-bold text-nexoraText uppercase tracking-wider mb-2">
                      {renderLabel(currentLanguage === 'vi' ? 'Số điện thoại *' : 'Phone Number *')}
                    </label>
                    <div className="flex rounded-lg shadow-sm">
                      <CountryCodeSelect
                        value={phoneParsed.countryCode}
                        onChange={(newCode) => {
                          setPhone(`${newCode} ${phoneParsed.nationalNumber}`.trim())
                        }}
                      />
                      <input
                        type="text"
                        className="h-10 w-full bg-nexoraCanvas border border-l-0 border-nexoraBorder focus:border-nexoraBrand focus:bg-white rounded-r-lg px-4 text-sm text-nexoraText focus:outline-none transition-all min-w-0"
                        value={phoneParsed.nationalNumber}
                        onChange={(e) => setPhone(`${phoneParsed.countryCode} ${e.target.value}`.trim())}
                        placeholder="e.g. 408-555-1234"
                        required
                      />
                    </div>
                  </div>

                  {/* Email Address (View-Only) */}
                  <div>
                    <label className="block text-[10px] font-bold text-nexoraText uppercase tracking-wider mb-2">
                      {currentLanguage === 'vi' ? 'Địa chỉ Email' : 'Email Address'}
                    </label>
                    <input
                      type="email"
                      disabled
                      className="w-full bg-nexoraCanvas border border-nexoraBorder rounded-lg px-4 py-2.5 text-sm text-nexoraSubtle cursor-not-allowed"
                      value={email}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Role / Specialty */}
                  <div>
                    <label className="block text-[10px] font-bold text-nexoraText uppercase tracking-wider mb-2">
                      {currentLanguage === 'vi' ? 'Chuyên môn / Vai trò' : 'Role / Speciality'}
                    </label>
                    <input 
                      type="text"
                      placeholder="e.g. Acrylic Specialist"
                      className="w-full bg-nexoraCanvas border border-nexoraBorder focus:border-nexoraBrand focus:bg-white rounded-lg px-4 py-2.5 text-sm text-nexoraText focus:outline-none transition-all"
                      value={position}
                      onChange={(e) => setPosition(e.target.value)}
                    />
                  </div>

                  {/* Staff ID */}
                  <div>
                    <label className="block text-[10px] font-bold text-nexoraText uppercase tracking-wider mb-2">
                      {currentLanguage === 'vi' ? 'Mã thợ NEXORA' : 'NEXORA Staff ID'}
                    </label>
                    <input
                      type="text"
                      disabled
                      className="w-full bg-nexoraCanvas border border-nexoraBorder rounded-lg px-4 py-2.5 text-sm text-nexoraSubtle font-mono font-bold cursor-not-allowed"
                      value={generatedStaffId || 'Pending'}
                    />
                  </div>
                </div>

                {/* Short Bio */}
                <div>
                  <label className="block text-[10px] font-bold text-nexoraText uppercase tracking-wider mb-2">
                    {currentLanguage === 'vi' ? 'Lời chào / Tiểu sử ngắn (Hiển thị cho khách hàng gửi tip)' : 'Short Bio (Shows on customer tip screen)'}
                  </label>
                  <textarea
                    className="w-full bg-nexoraCanvas border border-nexoraBorder focus:border-nexoraBrand focus:bg-white rounded-lg p-3 text-sm text-nexoraText focus:outline-none transition-all min-h-[70px]"
                    placeholder="Welcome to my chair! I specialize in luxury nail art..."
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                  />
                </div>

                {/* Action Buttons */}
                <div className="pt-4 flex flex-col sm:flex-row gap-3">
                  <button 
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="w-full min-h-11 py-2.5 border border-nexoraBorder hover:bg-nexoraCanvas text-nexoraSubtle hover:text-nexoraText font-semibold text-xs uppercase tracking-wider rounded-lg flex items-center justify-center gap-1.5 transition-all"
                  >
                    <ArrowLeft className="w-4 h-4" /> {t('common.back')}
                  </button>
                  <button 
                    type="submit"
                    disabled={!fullName.trim() || !nickname.trim() || !phone.trim()}
                    className="w-full min-h-11 py-2.5 bg-gradient-to-r from-[#2B59FF] to-[#8E4DF8] hover:opacity-90 text-white font-extrabold text-xs uppercase tracking-wider rounded-lg flex items-center justify-center gap-1.5 shadow-[0_4px_12px_rgba(43,89,255,0.25)] transition-all disabled:opacity-50"
                  >
                    {t('common.next')} <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* STEP 3: Payout Setup (Personal only) */}
          {currentStep === 3 && role === 'personal' && (
            <div className="p-6 sm:p-10 space-y-6 animate-fadeIn">
              <div className="flex items-center justify-between border-b border-nexoraBorder pb-3">
                <div>
                  <h3 className="text-lg font-bold text-nexoraText">
                    {currentLanguage === 'vi' ? 'Cấu hình ví nhận tiền' : 'Payout Configuration'}
                  </h3>
                  <p className="text-xs text-nexoraSubtle mt-1">
                    {currentLanguage === 'vi' ? 'Chọn và thiết lập các ví nhận tiền tip từ khách hàng.' : 'Enable and configure your tipping payout methods.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={autoFillPayments}
                  className="px-3 py-1.5 bg-nexoraBrand/10 hover:bg-nexoraBrand/20 text-nexoraBrand border border-nexoraBrand/20 rounded-lg text-[10px] font-extrabold uppercase tracking-wider transition-all"
                >
                  ⚡ {currentLanguage === 'vi' ? 'Tự động điền' : 'Auto-Fill'}
                </button>
              </div>

              <div className="space-y-1 divide-y divide-nexoraBorder max-h-[300px] overflow-y-auto pr-1">
                {payoutMethodsList.map(method => {
                  const cfg = payouts[method.key] || { enabled: false, value: '' }
                  return (
                    <div key={method.key} className="flex items-center justify-between py-3">
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Toggle Switch */}
                        <button
                          type="button"
                          onClick={() => handleToggleMethod(method.key)}
                          className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            cfg.enabled ? 'bg-nexoraBrand' : 'bg-slate-200'
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                              cfg.enabled ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </button>

                        {/* Logo + Info */}
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="h-8 w-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                            {PayoutLogos[method.key]}
                          </span>
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-nexoraText">{method.label}</div>
                            {cfg.value ? (
                              <div className="text-[10px] text-nexoraMuted font-mono mt-0.5 truncate max-w-[150px]">
                                {cfg.value}
                              </div>
                            ) : (
                              <div className="text-[10px] text-nexoraSubtle italic mt-0.5">
                                {currentLanguage === 'vi' ? 'Chưa cấu hình' : 'Not Configured'}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Edit Button */}
                      <button
                        type="button"
                        onClick={() => handleEditPayoutAccount(method.key)}
                        className="flex items-center gap-1 text-[10px] font-bold text-nexoraBrand hover:underline transition shrink-0 ml-2"
                      >
                        <span>{currentLanguage === 'vi' ? 'Thiết lập' : 'Configure'}</span>
                      </button>
                    </div>
                  )
                })}
              </div>

              {/* Staff ID Indicator at Bottom */}
              <div className="p-4 bg-slate-50 rounded-xl border border-nexoraBorder flex justify-between items-center text-xs">
                <div className="flex items-center gap-2">
                  <span className="h-7 w-7 rounded-lg bg-nexoraBrand/10 border border-nexoraBrand/20 flex items-center justify-center shrink-0">
                    <img src="/assets/nexora-logo.png" alt="Nexora" className="h-4 w-4 object-contain" />
                  </span>
                  <span className="text-nexoraSubtle font-bold">NEXORA Staff ID</span>
                </div>
                <span className="text-nexoraText font-extrabold font-mono bg-white border border-nexoraBorder px-2.5 py-1 rounded-lg">
                  {generatedStaffId || 'Pending'}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 flex flex-col sm:flex-row gap-3">
                <button 
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="w-full min-h-11 py-2.5 border border-nexoraBorder hover:bg-nexoraCanvas text-nexoraSubtle hover:text-nexoraText font-semibold text-xs uppercase tracking-wider rounded-lg flex items-center justify-center gap-1.5 transition-all"
                >
                  <ArrowLeft className="w-4 h-4" /> {t('common.back')}
                </button>
                <button 
                  type="button"
                  onClick={handlePersonalRegisterSubmit}
                  className="w-full min-h-11 py-2.5 bg-gradient-to-r from-[#2B59FF] to-[#8E4DF8] hover:opacity-90 text-white font-extrabold text-xs uppercase tracking-wider rounded-lg flex items-center justify-center gap-1.5 shadow-[0_4px_12px_rgba(43,89,255,0.25)] transition-all"
                >
                  {currentLanguage === 'vi' ? 'Lưu & Kích hoạt' : 'Save & Activate'} <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: Registration Success (Staff) */}
          {currentStep === 4 && role === 'personal' && (
            <div className="p-6 sm:p-10 space-y-6 text-center animate-fadeIn">
              <div className="w-16 h-16 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-full flex items-center justify-center mx-auto animate-bounce">
                <Sparkles className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-bold text-nexoraText">
                  {t('register.staff_success_title')}
                </h3>
                <p className="text-xs text-nexoraSubtle max-w-lg mx-auto">
                  {t('register.staff_success_desc')}
                </p>
              </div>

              {/* Staff ID Box */}
              <div className="max-w-md mx-auto p-5 rounded-2xl border border-nexoraBorder bg-slate-50 flex flex-col items-center justify-center space-y-3 shadow-sm">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  {t('register.staff_id_label')}
                </span>
                <div className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-xl border border-nexoraBorder w-full justify-between shadow-inner">
                  <span className="font-mono text-base font-extrabold text-nexoraBrand select-all">
                    {generatedStaffId}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyStaffId}
                    className="px-3 py-1 bg-nexoraBrandSoft text-nexoraBrand hover:bg-nexoraBrand hover:text-white rounded-lg text-xs font-bold transition-all shrink-0"
                  >
                    {copied ? t('common.copied') : t('common.copy')}
                  </button>
                </div>
                <p className="text-[10px] text-nexoraSubtle leading-relaxed max-w-xs">
                  {t('register.staff_linking_instructions')}
                </p>
              </div>

              {/* Info summary */}
              <div className="max-w-md mx-auto bg-slate-50 border border-slate-200 rounded-xl p-4 text-left text-xs space-y-2.5">
                <h4 className="font-extrabold text-slate-800 border-b border-slate-200 pb-1.5 uppercase text-[10px] tracking-wider">
                  {currentLanguage === 'vi' ? 'Thông tin đăng ký của bạn' : 'Registered Staff Summary'}
                </h4>
                <div className="grid grid-cols-3 gap-y-1.5 text-slate-600">


                  <span className="font-semibold">{currentLanguage === 'vi' ? 'Email tài khoản:' : 'Account Email:'}</span>
                  <span className="col-span-2 font-mono break-all text-slate-800">{email}</span>

                  {referralCode && (
                    <>
                      <span className="font-semibold">{currentLanguage === 'vi' ? 'Mã giới thiệu:' : 'Referral Code:'}</span>
                      <span className="col-span-2 text-slate-800 font-mono">{referralCode}</span>
                    </>
                  )}
                </div>
              </div>

              <div className="pt-6">
                <button 
                  onClick={onBackToLogin}
                  className="px-6 py-2.5 bg-gradient-to-r from-[#2B59FF] to-[#8E4DF8] hover:opacity-90 text-white font-extrabold text-xs uppercase tracking-wider rounded-lg shadow-md transition-all"
                >
                  {t('register.staff_login_btn')}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Terms & Conditions Modal Overlay */}
      <TermsModal
        open={showTermsModal}
        currentLanguage={currentLanguage}
        onClose={() => setShowTermsModal(false)}
        onAccept={() => {
          setTermsAccepted(true)
          setErrors(prev => ({ ...prev, terms: '' }))
          setShowTermsModal(false)
        }}
        modalType={modalType}
      />

      {/* Payout Configuration Edit Modal Overlay */}
      <PayoutEditModal
        editingMethod={editingMethod}
        setEditingMethod={setEditingMethod}
        editValue={editValue}
        setEditValue={setEditValue}
        editQrCode={editQrCode}
        setEditQrCode={setEditQrCode}
        editAccountName={editAccountName}
        setEditAccountName={setEditAccountName}
        isCapturing={isCapturing}
        modalError={modalError}
        setModalError={setModalError}
        currentLanguage={currentLanguage}
        savePayoutAccount={savePayoutAccount}
        handleModalFileChange={handleModalFileChange}
        handleModalTakePhoto={handleModalTakePhoto}
        handleModalClearQr={handleModalClearQr}
      />
    </div>
  )
}

// Terms & Conditions Modal Overlay
function TermsModal({ open, currentLanguage, onClose, onAccept, modalType }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
      <div className="bg-white border border-slate-100 rounded-3xl max-w-xl w-full p-6 flex flex-col max-h-[85vh] text-left text-slate-800 shadow-2xl animate-scaleUp">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <h3 className="text-sm font-black uppercase tracking-wider text-slate-800">
            {modalType === 'privacy'
              ? (currentLanguage === 'vi' ? 'Chính sách bảo mật' : 'Privacy Policy')
              : (currentLanguage === 'vi' ? 'Điều khoản dịch vụ' : 'Terms of Service')
            }
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 transition p-1.5 rounded-full hover:bg-slate-100"
            title="Close modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content body */}
        <div className="flex-grow overflow-y-auto pr-2 py-4 space-y-4 text-xs text-slate-600 leading-relaxed max-h-[50vh] scrollbar-thin">
          {modalType === 'privacy' ? (
            currentLanguage === 'vi' ? (
              <>
                <h4 className="font-extrabold text-slate-800">1. Thu thập thông tin</h4>
                <p>Chúng tôi thu thập thông tin cá nhân của bạn như Họ tên, địa chỉ Email, Số điện thoại và thông tin tài khoản thanh toán để hỗ trợ việc định tuyến tiền tip từ khách hàng trực tiếp.</p>

                <h4 className="font-extrabold text-slate-800">2. Bảo mật dữ liệu</h4>
                <p>Mọi dữ liệu cá nhân và thông tin ví của bạn đều được mã hóa và bảo mật an toàn theo tiêu chuẩn SSL. Chúng tôi cam kết không bán, chia sẻ hoặc tiết lộ thông tin của bạn cho bất kỳ bên thứ ba nào ngoại trừ các mục đích định tuyến giao dịch qua cổng thanh toán VLINKPAY.</p>

                <h4 className="font-extrabold text-slate-800">3. Quyền hạn cá nhân</h4>
                <p>Bạn có toàn quyền kiểm soát thông tin cá nhân của mình. Bạn có thể truy cập, chỉnh sửa hoặc yêu cầu xóa các thông tin này bất kỳ lúc nào trực tiếp trong trang quản lý tài khoản Dashboard.</p>
              </>
            ) : (
              <>
                <h4 className="font-extrabold text-slate-800">1. Information Collection</h4>
                <p>We collect personal details such as your Full Name, Email Address, Phone Number, and linked payment methods to power customer tip routing.</p>

                <h4 className="font-extrabold text-slate-800">2. Data Privacy & Protection</h4>
                <p>Your details are securely encrypted and protected under SSL standards. We do not sell or distribute your personal information to third parties except as necessary to process transactions through VLINKPAY.</p>

                <h4 className="font-extrabold text-slate-800">3. Your Rights</h4>
                <p>You have full ownership of your data. You may review, edit, or request deletion of your account credentials at any time directly through your dashboard settings.</p>
              </>
            )
          ) : (
            currentLanguage === 'vi' ? (
              <>
                <h4 className="font-extrabold text-slate-800">1. Giới thiệu và Đồng ý</h4>
                <p>Chào mừng bạn đến với Nexora Touch, dịch vụ được cung cấp bởi VLINKPAY. Bằng việc đăng ký tài khoản thợ hoặc liên kết ví nhận tiền tip, bạn đồng ý tuân thủ toàn bộ các điều khoản được quy định dưới đây. Nếu không đồng ý, vui lòng ngừng sử dụng dịch vụ.</p>

                <h4 className="font-extrabold text-slate-800">2. Tài khoản Kỹ thuật viên (Personal Account)</h4>
                <p>Bạn có trách nhiệm tự bảo mật thông tin tài khoản đăng nhập và đảm bảo độ chính xác của các ví nhận tiền được liên kết. VLINKPAY không chịu trách nhiệm trong trường hợp thông tin thanh toán của bạn bị nhập sai dẫn đến thất thoát tiền tip.</p>

                <h4 className="font-extrabold text-slate-800">3. Quy trình Tiền Tip và Rút tiền</h4>
                <p>Tiền tip từ khách hàng gửi trực tiếp thông qua cổng VLINKPAY của bạn sẽ được định tuyến trực tiếp đến tài khoản thanh toán mà bạn chỉ định (Zelle, Venmo, PayPal, vv.). Mọi giao dịch khi đã được hoàn thành qua hệ thống sẽ không thể hoàn trả hoặc thu hồi.</p>

                <h4 className="font-extrabold text-slate-800">4. Quyền riêng tư và Bảo mật dữ liệu</h4>
                <p>Chúng tôi cam kết bảo vệ dữ liệu cá nhân của bạn, bao gồm tên hiển thị, hình ảnh, email và thông tin ví thanh toán. Dữ liệu này chỉ được sử dụng cho mục đích vận hành hệ thống Nexora Touch, hiển thị trang gửi tip cho khách hàng của salon và báo cáo lịch sử giao dịch.</p>

                <h4 className="font-extrabold text-slate-800">5. Thay đổi Điều khoản</h4>
                <p>Chúng tôi có quyền sửa đổi hoặc cập nhật các điều khoản này bất kỳ lúc nào để đáp ứng các quy định pháp lý và nâng cấp dịch vụ. Mọi thay đổi sẽ được thông báo trực tiếp trên cổng thông tin này.</p>
              </>
            ) : (
              <>
                <h4 className="font-extrabold text-slate-800">1. Introduction & Acceptance</h4>
                <p>Welcome to Nexora Touch, a service provided by VLINKPAY. By creating a technician account or configuring your tipping payout wallet, you fully agree to be bound by these Terms & Conditions. If you do not agree, please discontinue using this portal.</p>

                <h4 className="font-extrabold text-slate-800">2. Technician Personal Account</h4>
                <p>You are solely responsible for maintaining the confidentiality of your login credentials and ensuring the accuracy of your linked payout methods. VLINKPAY is not liable for transactions sent to incorrect wallet addresses provided by you.</p>

                <h4 className="font-extrabold text-slate-800">3. Tips & Payouts Processing</h4>
                <p>Customer tips processed through VLINKPAY are routed directly to your configured payout wallets (such as Zelle, Venmo, PayPal, etc.). All completed transactions are final and cannot be refunded or recalled.</p>

                <h4 className="font-extrabold text-slate-800">4. Privacy & Data Security</h4>
                <p>We are committed to protecting your personal information, including your public display name, photo, email, and wallet details. This data is processed only to power the tipping workflow, display options to salon clients, and log transaction history.</p>

                <h4 className="font-extrabold text-slate-800">5. Modifications of Terms</h4>
                <p>We reserve the right to modify these terms at any time to comply with legal requirements or service enhancements. Any updates will be published and made viewable on this portal.</p>
              </>
            )
          )}
        </div>

        {/* Footer action buttons */}
        <div className="flex justify-end gap-3 border-t border-slate-100 pt-4 mt-auto">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-200 text-slate-500 rounded-xl font-bold hover:bg-slate-50 transition"
          >
            {currentLanguage === 'vi' ? 'Đóng' : 'Close'}
          </button>
          <button
            type="button"
            onClick={onAccept}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold transition shadow-sm"
          >
            {currentLanguage === 'vi' ? 'Tôi Đồng Ý' : 'I Accept'}
          </button>
        </div>
      </div>
    </div>
  )
}

function PayoutEditModal({
  editingMethod,
  setEditingMethod,
  editValue, setEditValue,
  editQrCode, setEditQrCode,
  editAccountName, setEditAccountName,
  isCapturing,
  modalError, setModalError,
  currentLanguage,
  savePayoutAccount,
  handleModalFileChange,
  handleModalTakePhoto,
  handleModalClearQr,
}) {
  if (!editingMethod) return null

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
    bankwire: currentLanguage === 'vi' ? 'Số tài khoản & Số Routing' : 'Account & Routing numbers',
    paypal: 'email@paypal.com',
    venmo: '@username-venmo',
    cashapp: '$cashtag',
    applecash: currentLanguage === 'vi' ? 'Nhập số điện thoại...' : 'Enter phone number...'
  }

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl border border-slate-100 max-w-sm w-full shadow-2xl p-6 relative overflow-hidden animate-scaleUp text-left space-y-4">

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
              {renderLabel(currentLanguage === 'vi'
                ? `${walletNames[editingMethod]} ${walletFields[editingMethod]} của bạn *`
                : `Your ${walletNames[editingMethod]} ${walletFields[editingMethod]} *`)}
            </label>
            <input
              type="text"
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
                  <div className="text-sm font-extrabold text-slate-800">{editAccountName}</div>
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
              className="px-5 py-2.5 bg-gradient-to-r from-[#2B59FF] to-[#8E4DF8] hover:opacity-90 text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow-sm transition"
            >
              {currentLanguage === 'vi' ? 'LƯU LẠI' : 'SAVE'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
