import React, { useState, useEffect, useMemo } from 'react'
import { 
  Check, ShieldCheck, AlertCircle, ArrowRight, ArrowLeft, 
  Copy, Plus, CheckCircle2, Building, CreditCard, Smartphone, 
  Sparkles, Lock, User, Info, Upload, X, QrCode, Star, 
  Award, DollarSign, Wallet, Send, CheckSquare, Globe, Edit2,
  Camera, FolderOpen, AlertTriangle
} from 'lucide-react'
import { useTranslation } from '../contexts/LanguageContext'
import { storage } from '../utils/storage'

const localStorage = storage
const sessionStorage = storage
import CountryCodeSelect, { parsePhone } from './CountryCodeSelect'

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

// Pre-selected modern profile avatars to avoid forced file uploads
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

const AVATAR_PRESETS = [
  { id: '1', name: 'Anna', url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200&h=200' },
  { id: '2', name: 'Lisa', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200&h=200' },
  { id: '3', name: 'Hanna', url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=200&h=200' },
  { id: '4', name: 'David', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200&h=200' },
  { id: '5', name: 'Sophia', url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200&h=200' },
]

export default function StaffRegistrationWizard({ inviteData, onReturnToMerchant }) {
  const { t, currentLanguage, setLanguage } = useTranslation()
  const [step, setStep] = useState(0) // 0: Welcome Invite, 1: OTP, 2: Profile, 3: Payments, 4: Consent & Activate, 5: Success
  
  // Path selection states
  const [joinPath, setJoinPath] = useState(null)
  const [searchId, setSearchId] = useState('')
  const [linkedProfile, setLinkedProfile] = useState(null)
  const [searchError, setSearchError] = useState('')

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
    } catch (e) {
      console.error('Failed to update staff database in wizard', e)
    }

    setStep(5)
  }

  // Helper for dynamic logos
  const WalletLogos = {
    vlinkpay: <span className="text-[10px] font-black text-[#F59E0B] tracking-tighter">VLINK</span>,
    zelle: <span className="text-[10px] font-black text-purple-600">Zelle</span>,
    cashapp: <span className="text-[10px] font-black text-emerald-600">$</span>,
    venmo: <span className="text-[10px] font-black text-blue-500">V</span>,
    paypal: <span className="text-[10px] font-black text-blue-700">P</span>,
    applecash: <span className="text-[10px] font-black text-black"></span>
  }

  const getWalletColor = (key) => {
    switch (key) {
      case 'zelle': return 'bg-purple-50 text-purple-700 border-purple-200'
      case 'cashapp': return 'bg-emerald-50 text-emerald-700 border-emerald-200'
      case 'venmo': return 'bg-blue-50 text-blue-600 border-blue-200'
      case 'vlinkpay': return 'bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/20'
      case 'paypal': return 'bg-nexoraSurfaceMuted text-blue-800 border-nexoraBorder'
      case 'applecash': return 'bg-nexoraSurfaceMuted text-black border-nexoraBorder'
      default: return 'bg-nexoraSurfaceMuted text-nexoraMuted border-nexoraBorder'
    }
  }

  return (
    <div className="min-h-screen bg-nexoraCanvas text-nexoraText font-sans antialiased relative selection:bg-nexoraBrandSoft selection:text-nexoraBrand py-6 sm:py-12">
      {/* Background radial soft light */}
      <div className="absolute top-1/4 left-1/4 h-72 w-72 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[rgba(245,158,11,0.04)] via-transparent to-transparent blur-3xl pointer-events-none sm:h-[450px] sm:w-[450px]"></div>
      <div className="absolute bottom-1/4 right-1/4 h-80 w-80 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[rgba(43,89,255,0.03)] via-transparent to-transparent blur-3xl pointer-events-none sm:h-[500px] sm:w-[500px]"></div>

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

      <div className="max-w-xl mx-auto px-4">
        {/* Onboarding Wizard Portal Container */}
        <div className="bg-white rounded-2xl border border-nexoraBorder shadow-premium p-5 sm:p-8 space-y-6">
            
            {/* Header info */}
            <div className="flex items-center gap-3 pb-4 border-b border-nexoraRule">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-[#4648D8] to-[#32D7FF] flex items-center justify-center text-white shrink-0 shadow-md">
                <Smartphone className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-black text-nexoraText uppercase tracking-wider">
                  {t('staff_invite.wizard_title') || 'Complete Your Staff Tip Profile'}
                </h2>
                <p className="text-[11px] text-nexoraSubtle font-medium mt-0.5 leading-normal">
                  {t('staff_invite.wizard_subtitle') || 'Configure your technician profile and payment methods once. Use it to link with any salon.'}
                </p>
              </div>
            </div>

            {/* Steps indicator */}
            {step > 0 && step < 4 && (
              <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-extrabold uppercase tracking-wider">
                {[
                  { id: 1, label: currentLanguage === 'vi' ? '1. Đăng ký' : '1. Register' },
                  { id: 2, label: currentLanguage === 'vi' ? '2. Hồ sơ' : '2. Profile' },
                  { id: 3, label: currentLanguage === 'vi' ? '3. Ví nhận' : '3. Wallet' }
                ].map(s => (
                  <div 
                    key={s.id} 
                    className={`py-2 rounded-lg border transition ${
                      step === s.id 
                        ? 'bg-[#4648D8] text-white border-[#4648D8] shadow-sm' 
                        : step > s.id 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-100 font-bold'
                          : 'bg-nexoraSurfaceMuted text-nexoraSubtle border-nexoraRule'
                    }`}
                  >
                    {s.label}
                  </div>
                ))}
              </div>
            )}

            {/* STEP 0: Welcome Invite Acceptance */}
            {step === 0 && (
              <>
                {/* A. If merchant sent a direct prefilled invite */}
                {inviteData?.name ? (
                  <div className="space-y-6 py-4">
                    <div className="p-5 border border-[#4648D8]/15 rounded-2xl bg-[#E9E9FF]/20 text-center space-y-4">
                      <div className="h-14 w-14 rounded-full bg-[#E9E9FF]/60 flex items-center justify-center mx-auto text-[#4648D8]">
                        <Building className="h-7 w-7" />
                      </div>
                      
                      <div className="space-y-1">
                        <span className="text-[10px] font-black uppercase text-[#4648D8] bg-[#E9E9FF]/80 px-2.5 py-0.5 rounded-full">
                          {t('staff_invite.invite_from_biz') || 'Invitation from Business'}
                        </span>
                        <h3 className="text-lg font-black text-nexoraText tracking-tight mt-2">
                          {inviteData?.biz || 'Golden Glow Nail Spa'}
                        </h3>
                        <p className="text-xs text-nexoraMuted max-w-sm mx-auto leading-relaxed mt-1">
                          {t('staff_invite.invite_desc') || 'You are invited to join NEXORA TOUCH staff profile for the business below.'}
                        </p>
                      </div>

                      <div className="p-3 border border-nexoraBorder rounded-xl bg-white text-left text-xs max-w-xs mx-auto space-y-1">
                        <div className="flex justify-between text-nexoraMuted">
                          <span>Invited Name:</span>
                          <strong className="text-nexoraText">{fullName}</strong>
                        </div>
                        <div className="flex justify-between text-nexoraMuted">
                          <span>Assigned Role:</span>
                          <strong className="text-nexoraText">{position}</strong>
                        </div>
                        {email && (
                          <div className="flex justify-between text-nexoraMuted">
                            <span>Invited Email:</span>
                            <strong className="text-nexoraText font-mono">{email}</strong>
                          </div>
                        )}
                        {phone && (
                          <div className="flex justify-between text-nexoraMuted">
                            <span>Invited Phone:</span>
                            <strong className="text-nexoraText font-mono">{phone}</strong>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="pt-2 flex flex-col sm:flex-row gap-3">
                      <button 
                        onClick={onReturnToMerchant}
                        className="w-full h-11 border border-nexoraBorder text-nexoraMuted font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-nexoraSurfaceMuted transition"
                      >
                        {currentLanguage === 'vi' ? 'Hủy bỏ / Từ chối' : 'Decline Request'}
                      </button>
                      
                      <button 
                        onClick={() => setStep(1)}
                        className="w-full h-11 bg-nexoraBrand hover:bg-nexoraBrandDark text-white font-black text-xs uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-1.5 shadow-md"
                      >
                        {t('staff_invite.accept_invite') || 'Accept Invite & Continue Setup'} <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="text-center pt-2">
                      <button 
                        type="button" 
                        onClick={() => {
                          setJoinPath('link')
                          setSearchId('')
                          setLinkedProfile(null)
                          setSearchError('')
                        }}
                        className="text-xs text-nexoraBrand font-bold hover:underline"
                      >
                        {t('staff_invite.already_have_id') || 'I already have Staff ID'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* B. Self-serve Join selection screen */}
                    {joinPath === null && (
                      <div className="space-y-6 py-4">
                        <div className="bg-gradient-to-br from-amber-50/70 to-orange-50/40 border-2 border-amber-200/80 rounded-2xl p-6 text-center space-y-3 relative overflow-hidden shadow-sm">
                          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 to-orange-500 animate-pulse" />
                          <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-white mx-auto shadow-lg border border-amber-300/30">
                            <Building className="h-6 w-6" />
                          </div>
                          <div className="space-y-1.5">
                            <span className="text-[10px] font-black uppercase text-amber-600 tracking-widest block font-sans">
                              {currentLanguage === 'vi' ? 'THƯ MỜI GIA NHẬP HỆ THỐNG TIỆM' : 'SALON NETWORK INVITATION'}
                            </span>
                            <h3 className="text-xl font-black text-nexoraText tracking-tight leading-snug">
                              {inviteData?.biz || 'Golden Glow Nail Spa & Salon'}
                            </h3>
                            <p className="text-xs text-nexoraMuted max-w-sm mx-auto leading-relaxed font-medium">
                              {currentLanguage === 'vi'
                                ? 'Bạn đã được mời liên kết hồ sơ của mình để nhận tiền tip trực tiếp vào tài khoản cá nhân tại tiệm này.'
                                : 'You have been invited to link your profile to receive tips directly to your personal account at this salon.'}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          {/* Card 1: Existing Account */}
                          <button
                            onClick={() => {
                              setJoinPath('link')
                              setSearchId('')
                              setLinkedProfile(null)
                              setSearchError('')
                            }}
                            className="p-5 border border-nexoraBorder rounded-2xl bg-white hover:border-[#4648D8] hover:bg-[#E9E9FF]/10 transition-all text-left space-y-3 shadow-sm hover:shadow-md group focus:outline-none"
                          >
                            <div className="h-10 w-10 rounded-xl bg-[#E9E9FF]/60 text-[#4648D8] flex items-center justify-center group-hover:bg-[#E9E9FF] transition-colors">
                              <ShieldCheck className="h-5 w-5" />
                            </div>
                            <div>
                              <strong className="text-xs font-black text-nexoraText block">
                                {currentLanguage === 'vi' ? 'Đã có tài khoản' : 'I already have a Profile'}
                              </strong>
                              <span className="text-[10px] text-nexoraSubtle block mt-0.5 leading-normal">
                                {currentLanguage === 'vi'
                                  ? 'Sử dụng VLINKPAY ID sẵn có của bạn để liên kết nhanh với tiệm.'
                                  : 'Use your existing VLINKPAY ID to link instantly and import your wallets.'}
                              </span>
                            </div>
                          </button>

                          {/* Card 2: New Registration */}
                          <button
                            onClick={() => {
                              setJoinPath('register')
                              setStep(1)
                            }}
                            className="p-5 border border-nexoraBorder rounded-2xl bg-white hover:border-[#4648D8] hover:bg-[#E9E9FF]/10 transition-all text-left space-y-3 shadow-sm hover:shadow-md group focus:outline-none"
                          >
                            <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                              <Plus className="h-5 w-5" />
                            </div>
                            <div>
                              <strong className="text-xs font-black text-nexoraText block">
                                {currentLanguage === 'vi' ? 'Tôi là thợ mới' : 'I am a new Technician'}
                              </strong>
                              <span className="text-[10px] text-nexoraSubtle block mt-0.5 leading-normal">
                                {currentLanguage === 'vi'
                                  ? 'Đăng ký tài khoản mới, thiết lập ví nhận tiền và KYC.'
                                  : 'Register a new account, configure payout wallets, and complete KYC.'}
                              </span>
                            </div>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* C. Option A: VLINKPAY ID Verification screen */}
                    {joinPath === 'link' && (
                      <div className="space-y-5 py-2 animate-fadeIn">
                        <div className="flex items-center gap-2 border-b border-nexoraRule pb-2">
                          <button
                            onClick={() => {
                              setJoinPath(null)
                            }}
                            className="p-1 hover:bg-nexoraSurfaceMuted rounded-lg text-nexoraMuted transition"
                          >
                            <ArrowLeft className="h-4 w-4" />
                          </button>
                          <h3 className="text-sm font-extrabold text-nexoraText uppercase tracking-wide">
                            {currentLanguage === 'vi' ? 'Liên kết NEXORA Staff ID' : 'Link NEXORA Staff ID'}
                          </h3>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <label className="text-[10px] font-black uppercase text-nexoraSubtle tracking-wider">
                              {currentLanguage === 'vi' ? 'Nhập NEXORA Staff ID của bạn' : 'Enter your NEXORA Staff ID'}
                            </label>
                            <div className="mt-1.5 flex gap-2">
                              <input
                                type="text"
                                placeholder="e.g. NEX-STAFF-LISA1102"
                                className="h-10 flex-grow rounded-lg border border-nexoraBorder px-3 text-xs outline-none focus:border-[#4648D8] focus:ring-2 focus:ring-[#4648D8]/20 focus:outline-none transition-all font-mono font-bold uppercase"
                                value={searchId}
                                onChange={(e) => {
                                  setSearchId(e.target.value)
                                  setSearchError('')
                                  setLinkedProfile(null)
                                }}
                              />
                              <button
                                onClick={() => {
                                  const query = searchId.trim().toUpperCase()
                                  const profile = MOCK_NEXORA_STAFF_PROFILES[query]
                                  if (profile) {
                                    setLinkedProfile(profile)
                                    setSearchError('')
                                  } else {
                                    setLinkedProfile(null)
                                    setSearchError(currentLanguage === 'vi' ? 'Không tìm thấy NEXORA Staff ID này.' : 'NEXORA Staff ID not found.')
                                  }
                                }}
                                className="h-10 px-4 bg-nexoraBrand hover:bg-nexoraBrandDark text-white rounded-lg text-xs font-bold transition"
                              >
                                {currentLanguage === 'vi' ? 'Kiểm tra' : 'Verify'}
                              </button>
                            </div>
                            {searchError && (
                              <p className="mt-1 text-xs font-bold text-rose-600 flex items-center gap-1">
                                <AlertCircle className="h-3.5 w-3.5" /> {searchError}
                              </p>
                            )}
                          </div>

                          {linkedProfile && (
                            <div className="border border-[#4648D8]/15 rounded-2xl bg-[#E9E9FF]/10 p-4 space-y-4 animate-scaleIn">
                              <div className="flex items-center gap-3">
                                {linkedProfile.avatar ? (
                                  <img src={linkedProfile.avatar} alt="" className="h-12 w-12 rounded-full object-cover border border-[#4648D8]/20 shadow-sm" />
                                ) : (
                                  <div className="h-12 w-12 rounded-full bg-[#E9E9FF]/60 flex items-center justify-center font-black text-[#4648D8] text-sm">
                                    {linkedProfile.nickname.charAt(0)}
                                  </div>
                                )}
                                <div>
                                  <h4 className="text-xs font-extrabold text-nexoraText flex items-center gap-1.5 font-sans">
                                    {linkedProfile.fullName}
                                    <span className="inline-flex items-center gap-0.5 bg-[#E9E9FF] text-[#4648D8] text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full">
                                      <ShieldCheck className="h-2.5 w-2.5" /> KYC
                                    </span>
                                  </h4>
                                  <span className="text-[10px] text-nexoraMuted">{linkedProfile.position} • {linkedProfile.phone}</span>
                                </div>
                              </div>

                              <div className="text-[10px] text-nexoraMuted leading-normal border-t border-[#4648D8]/15 pt-2 space-y-1.5">
                                <div className="flex justify-between">
                                  <span>Email:</span>
                                  <strong className="text-nexoraMuted font-mono">{linkedProfile.email}</strong>
                                </div>
                                <div className="flex justify-between">
                                  <span>{currentLanguage === 'vi' ? 'Ví nhận liên kết:' : 'Linked payout methods:'}</span>
                                  <strong className="text-emerald-700 uppercase">
                                    {Object.keys(linkedProfile.payoutConfigs).filter(k => linkedProfile.payoutConfigs[k].enabled).join(', ')}
                                  </strong>
                                </div>
                              </div>

                              <button
                                onClick={handleLinkExistingProfile}
                                className="w-full h-10 bg-nexoraBrand hover:bg-nexoraBrandDark text-white font-extrabold text-xs uppercase tracking-wider rounded-lg transition shadow-md flex items-center justify-center gap-1.5 font-sans"
                              >
                                <Check className="h-4 w-4 stroke-[3px]" />
                                {currentLanguage === 'vi' ? 'Đồng ý liên kết & gửi yêu cầu' : 'Accept & Link with Salon'}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </>
            )}

            {/* STEP 1: Register Account & Activate */}
            {step === 1 && !showOtpInput && (
              <form onSubmit={handleRegisterSubmit} className="space-y-6 py-4">
                <div className="text-center space-y-1.5">
                  <h3 className="text-base font-extrabold text-nexoraText uppercase tracking-wide">
                    {currentLanguage === 'vi' ? '1. Đăng ký tài khoản' : '1. Register Account'}
                  </h3>
                  <p className="text-xs text-nexoraMuted leading-relaxed max-w-sm mx-auto">
                    {currentLanguage === 'vi' 
                      ? 'Đăng ký tài khoản thợ mới để bắt đầu nhận tiền tip.' 
                      : 'Register a new technician account to start receiving tips.'}
                  </p>
                </div>

                <div className="space-y-4">
                  {/* Email */}
                  <div>
                    <label className="text-[10px] font-black uppercase text-nexoraSubtle tracking-wider">
                      {currentLanguage === 'vi' ? 'Địa chỉ Email' : 'Email Address'}
                    </label>
                    <input 
                      type="email"
                      className={`mt-1.5 h-10 w-full rounded-lg border ${regErrors.email ? 'border-rose-500 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20' : 'border-nexoraBorder focus:border-[#4648D8] focus:ring-2 focus:ring-[#4648D8]/20'} px-3 text-xs outline-none transition-all`}
                      placeholder="e.g. name@example.com"
                      value={regEmail}
                      onChange={(e) => {
                        setRegEmail(e.target.value)
                        setRegErrors(prev => ({ ...prev, email: '' }))
                      }}
                      required
                    />
                    {regErrors.email && <p className="mt-1 text-[10px] font-bold text-rose-600">{regErrors.email}</p>}
                  </div>

                  {/* Confirm Email */}
                  <div>
                    <label className="text-[10px] font-black uppercase text-nexoraSubtle tracking-wider">
                      {currentLanguage === 'vi' ? 'Nhập lại địa chỉ Email' : 'Confirm Email Address'}
                    </label>
                    <input 
                      type="email"
                      className={`mt-1.5 h-10 w-full rounded-lg border ${regErrors.confirmEmail ? 'border-rose-500 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20' : 'border-nexoraBorder focus:border-[#4648D8] focus:ring-2 focus:ring-[#4648D8]/20'} px-3 text-xs outline-none transition-all`}
                      placeholder="e.g. name@example.com"
                      value={regConfirmEmail}
                      onChange={(e) => {
                        setRegConfirmEmail(e.target.value)
                        setRegErrors(prev => ({ ...prev, confirmEmail: '' }))
                      }}
                      required
                    />
                    {regErrors.confirmEmail && <p className="mt-1 text-[10px] font-bold text-rose-600">{regErrors.confirmEmail}</p>}
                  </div>

                  {/* Password */}
                  <div>
                    <label className="text-[10px] font-black uppercase text-nexoraSubtle tracking-wider">
                      {currentLanguage === 'vi' ? 'Mật khẩu' : 'Password'}
                    </label>
                    <input 
                      type="password"
                      className={`mt-1.5 h-10 w-full rounded-lg border ${regErrors.password ? 'border-rose-500 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20' : 'border-nexoraBorder focus:border-[#4648D8] focus:ring-2 focus:ring-[#4648D8]/20'} px-3 text-xs outline-none transition-all`}
                      placeholder="••••••••"
                      value={regPassword}
                      onChange={(e) => {
                        setRegPassword(e.target.value)
                        setRegErrors(prev => ({ ...prev, password: '' }))
                      }}
                      required
                    />
                    {regErrors.password && <p className="mt-1 text-[10px] font-bold text-rose-600">{regErrors.password}</p>}
                  </div>

                  {/* Referral Link */}
                  <div>
                    <label className="text-[10px] font-black uppercase text-nexoraSubtle tracking-wider">
                      {currentLanguage === 'vi' ? 'Liên kết giới thiệu / Salon' : 'Referral Link / Salon'}
                    </label>
                    <input 
                      type="text"
                      className={`mt-1.5 h-10 w-full rounded-lg border px-3 text-xs outline-none transition-all ${
                        inviteData?.biz 
                          ? 'bg-nexoraSurfaceMuted text-nexoraSubtle border-nexoraBorder cursor-not-allowed' 
                          : 'border-nexoraBorder focus:border-[#4648D8] focus:ring-2 focus:ring-[#4648D8]/20 focus:outline-none'
                      }`}
                      placeholder="e.g. nexora-salon-link"
                      value={regReferralLink}
                      onChange={(e) => setRegReferralLink(e.target.value)}
                      disabled={!!inviteData?.biz}
                    />
                  </div>
                </div>

                <div className="pt-4 flex gap-3 border-t border-nexoraRule">
                  <button 
                    type="button" 
                    onClick={() => {
                      if (isSelfServe) {
                        setJoinPath(null)
                      }
                      setStep(0)
                    }} 
                    className="h-10 px-4 border border-nexoraBorder text-nexoraMuted font-bold text-xs uppercase tracking-wider rounded-lg hover:bg-nexoraSurfaceMuted transition"
                  >
                    {t('common.back') || 'Back'}
                  </button>
                  <button 
                    type="submit" 
                    className="flex-grow h-10 bg-nexoraBrand hover:bg-nexoraBrandDark text-white font-bold text-xs uppercase tracking-wider rounded-lg transition"
                  >
                    {t('common.next') || 'Continue'}
                  </button>
                </div>
              </form>
            )}

            {step === 1 && showOtpInput && (
              <form onSubmit={handleVerifyOtp} className="space-y-6 py-4">
                <div className="text-center space-y-1.5">
                  <h3 className="text-base font-extrabold text-nexoraText uppercase tracking-wide">
                    {currentLanguage === 'vi' ? '1. Kích hoạt tài khoản' : '1. Activate Account'}
                  </h3>
                  <p className="text-xs text-nexoraMuted leading-relaxed max-w-sm mx-auto">
                    {currentLanguage === 'vi' 
                      ? 'Nhập mã OTP được gửi tới email của bạn để kích hoạt tài khoản.' 
                      : 'Enter the OTP code sent to your email to activate your account.'}
                  </p>
                </div>

                <div className="space-y-4">
                  {/* Single OTP Input */}
                  <div>
                    <label className="text-[10px] font-black uppercase text-nexoraSubtle tracking-wider">
                      {currentLanguage === 'vi' ? 'Nhập mã OTP' : 'Enter OTP Code'}
                    </label>
                    <input 
                      type="text"
                      className="mt-1.5 h-12 w-full rounded-lg border border-nexoraBorder px-4 text-center font-mono font-black text-lg text-nexoraText focus:border-[#4648D8] focus:ring-2 focus:ring-[#4648D8]/20 focus:outline-none transition-all"
                      placeholder="e.g. 1234"
                      value={otpCode}
                      onChange={(e) => {
                        setOtpCode(e.target.value)
                        setOtpError('')
                      }}
                      required
                    />
                  </div>

                  {otpError && <p className="text-xs font-bold text-center text-rose-600">{otpError}</p>}

                  <div className="text-center">
                    <span className="text-[10px] text-nexoraSubtle font-bold block">
                      {resendTimer > 0 
                        ? `Resend code in ${resendTimer}s` 
                        : (
                          <button 
                            type="button" 
                            onClick={() => setResendTimer(30)}
                            className="text-[#4648D8] hover:underline"
                          >
                            Resend Verification Code
                          </button>
                        )
                      }
                    </span>
                  </div>
                </div>

                {/* Simulation Shortcut */}
                <div className="p-3 border border-dashed border-nexoraBrand/40 bg-nexoraBrandSoft/20 rounded-xl flex items-center justify-between gap-3 max-w-xs mx-auto">
                  <span className="text-[10px] text-nexoraBrand font-bold">Simulator Helper:</span>
                  <button 
                    type="button" 
                    onClick={autoFillOtp}
                    className="px-2.5 py-1 bg-[#4648D8] text-white rounded text-[10px] font-black uppercase hover:bg-opacity-90 shadow-sm"
                  >
                    Auto-fill (1234)
                  </button>
                </div>

                <div className="pt-4 flex gap-3 border-t border-nexoraRule">
                  <button 
                    type="button" 
                    onClick={() => setShowOtpInput(false)} 
                    className="h-10 px-4 border border-nexoraBorder text-nexoraMuted font-bold text-xs uppercase tracking-wider rounded-lg hover:bg-nexoraSurfaceMuted transition"
                  >
                    {t('common.back') || 'Back'}
                  </button>
                  <button 
                    type="submit" 
                    className="flex-grow h-10 bg-nexoraBrand hover:bg-nexoraBrandDark text-white font-bold text-xs uppercase tracking-wider rounded-lg transition"
                  >
                    {currentLanguage === 'vi' ? 'Xác minh & Kích hoạt' : 'Verify & Activate'}
                  </button>
                </div>
              </form>
            )}

            {/* STEP 2: Profile Setup */}
            {step === 2 && (
              <div className="space-y-5 py-2">
                <div className="border-b border-nexoraRule pb-2">
                  <h3 className="text-sm font-extrabold text-nexoraText uppercase tracking-wide">
                    {currentLanguage === 'vi' ? '2. Thông tin cá nhân' : '2. Personal Profile'}
                  </h3>
                </div>

                <div className="space-y-4">
                  {/* Avatar section */}
                  <div>
                    <label className="text-[10px] font-black uppercase text-nexoraSubtle tracking-wider">Choose Profile Avatar</label>
                    <div className="mt-2 flex items-center gap-3">
                      {avatar ? (
                        <img src={avatar} alt="" className="h-16 w-16 rounded-full object-cover border border-nexoraBorder ring-2 ring-[#4648D8]/20" />
                      ) : (
                        <div className="h-16 w-16 rounded-full bg-nexoraSurfaceMuted flex items-center justify-center font-black text-nexoraSubtle text-lg border border-nexoraBorder">
                          {nickname.charAt(0) || 'N'}
                        </div>
                      )}
                      
                      <div className="flex flex-col gap-2">
                        {/* Avatar presets selection */}
                        <div className="flex items-center gap-2 flex-wrap">
                          {AVATAR_PRESETS.map(p => (
                            <button 
                              key={p.id}
                              type="button"
                              onClick={() => setAvatar(p.url)}
                              className={`h-9 w-9 rounded-full overflow-hidden border-2 transition hover:scale-105 shrink-0 ${
                                avatar === p.url ? 'border-[#4648D8] ring-2 ring-[#4648D8]/20' : 'border-nexoraBorder'
                              }`}
                            >
                              <img src={p.url} alt="" className="h-full w-full object-cover" />
                            </button>
                          ))}
                          
                          {/* Device upload option */}
                          <label className="h-9 w-9 rounded-full bg-nexoraSurfaceMuted border-2 border-dashed border-nexoraBorder flex items-center justify-center cursor-pointer hover:bg-nexoraSurfaceMuted hover:border-[#4648D8] text-nexoraMuted hover:text-[#4648D8] transition shrink-0" title={currentLanguage === 'vi' ? 'Tải lên từ thiết bị' : 'Upload from device'}>
                            <Upload className="h-4 w-4" />
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
                        <span className="text-[9px] text-nexoraSubtle">
                          {currentLanguage === 'vi' 
                            ? 'Chọn ảnh đại diện có sẵn, hoặc tải lên ảnh mới từ thiết bị' 
                            : 'Click to choose a preset photo, or upload custom one from device'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="text-[10px] font-black uppercase text-nexoraSubtle tracking-wider">Full Name</label>
                      <input 
                        type="text"
                        className="mt-1.5 h-10 w-full rounded-lg border border-nexoraBorder px-3 text-xs outline-none focus:border-[#4648D8] focus:ring-2 focus:ring-[#4648D8]/20 focus:outline-none transition-all"
                        placeholder="Lisa Marie Tran"
                        value={fullName}
                        onChange={(e) => {
                          setFullName(e.target.value)
                          if (!nickname) setNickname(e.target.value.split(' ')[0] + '.')
                        }}
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase text-nexoraSubtle tracking-wider">Display Nickname</label>
                      <input 
                        type="text"
                        className="mt-1.5 h-10 w-full rounded-lg border border-nexoraBorder px-3 text-xs outline-none focus:border-[#4648D8] focus:ring-2 focus:ring-[#4648D8]/20 focus:outline-none transition-all"
                        placeholder="Lisa T."
                        value={nickname}
                        onChange={(e) => setNickname(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="text-[10px] font-black uppercase text-nexoraSubtle tracking-wider font-sans">Phone Number</label>
                      <div className="mt-1.5 flex rounded-lg shadow-sm">
                        <CountryCodeSelect
                          value={phoneParsed.countryCode}
                          onChange={(newCode) => {
                            setPhone(`${newCode} ${phoneParsed.nationalNumber}`.trim())
                          }}
                          disabled={!isSelfServe}
                        />
                        <input 
                          type="text"
                          className={`h-10 w-full rounded-r-lg border border-l-0 border-nexoraBorder px-3 text-xs outline-none focus:border-[#4648D8] focus:ring-2 focus:ring-[#4648D8]/20 focus:outline-none transition-all min-w-0 ${!isSelfServe ? 'bg-nexoraSurfaceMuted text-nexoraMuted' : 'bg-white text-nexoraText'}`}
                          value={phoneParsed.nationalNumber}
                          onChange={(e) => setPhone(`${phoneParsed.countryCode} ${e.target.value}`.trim())}
                          disabled={!isSelfServe}
                          placeholder="e.g. 408-555-1234"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase text-nexoraSubtle tracking-wider font-sans">Email Address</label>
                      <input 
                        type="email"
                        className={`mt-1.5 h-10 w-full rounded-lg border border-nexoraBorder px-3 text-xs outline-none focus:border-[#4648D8] focus:ring-2 focus:ring-[#4648D8]/20 focus:outline-none transition-all ${isSelfServe ? 'bg-white text-nexoraText' : 'bg-nexoraSurfaceMuted text-nexoraMuted'}`}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={!isSelfServe}
                        placeholder="e.g. name@example.com"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="text-[10px] font-black uppercase text-nexoraSubtle tracking-wider">Role / Speciality</label>
                      <input 
                        type="text"
                        className="mt-1.5 h-10 w-full rounded-lg border border-nexoraBorder px-3 text-xs outline-none focus:border-[#4648D8] focus:ring-2 focus:ring-[#4648D8]/20 focus:outline-none transition-all"
                        placeholder="e.g. Acrylic Specialist"
                        value={position}
                        onChange={(e) => setPosition(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase text-nexoraSubtle tracking-wider font-sans">
                        {currentLanguage === 'vi' ? 'Ví VLINKPAY ID' : 'VLINKPAY ID'}
                      </label>
                      <input 
                        type="text"
                        className="mt-1.5 h-10 w-full rounded-lg border border-nexoraBorder px-3 text-xs outline-none focus:border-[#4648D8] focus:ring-2 focus:ring-[#4648D8]/20 focus:outline-none transition-all font-mono font-bold"
                        placeholder="e.g. VLP-8893-VL"
                        value={vlinkpayId}
                        onChange={(e) => setVlinkpayId(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="text-[10px] font-black uppercase text-nexoraSubtle tracking-wider">Staff ID (Auto-Generated)</label>
                      <input 
                        type="text"
                        className="mt-1.5 h-10 w-full rounded-lg border border-nexoraBorder px-3 text-xs outline-none bg-nexoraSurfaceMuted text-nexoraSubtle font-mono font-bold"
                        value={staffId}
                        disabled
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase text-nexoraSubtle tracking-wider">Short Bio (Shows on customer tip screen)</label>
                    <textarea 
                      className="mt-1.5 w-full rounded-lg border border-nexoraBorder p-3 text-xs outline-none focus:border-[#4648D8] focus:ring-2 focus:ring-[#4648D8]/20 focus:outline-none transition-all min-h-[70px]"
                      placeholder="Welcome to my chair! I specialize in luxury nail art, acrylic extensions, and hot stone spa treatments..."
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                    />
                  </div>
                </div>

                <div className="pt-4 flex gap-3 border-t border-nexoraRule">
                  <button 
                    type="button" 
                    onClick={() => setStep(1)} 
                    className="h-10 px-4 border border-nexoraBorder text-nexoraMuted font-bold text-xs uppercase tracking-wider rounded-lg hover:bg-nexoraSurfaceMuted transition"
                  >
                    {t('common.back') || 'Back'}
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setStep(3)} 
                    disabled={!fullName.trim()}
                    className="flex-grow h-10 bg-nexoraBrand hover:bg-nexoraBrandDark text-white font-bold text-xs uppercase tracking-wider rounded-lg transition disabled:opacity-50"
                  >
                    {t('common.next') || 'Next: Payout Configuration'}
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: Payment Configuration */}
            {step === 3 && (
              <div className="space-y-5 py-2 animate-fadeIn">
                <div className="border-b border-nexoraRule pb-2 flex items-center justify-between">
                  <h3 className="text-sm font-extrabold text-nexoraText uppercase tracking-wide">
                    {currentLanguage === 'vi' ? '3. Cấu hình Ví nhận tiền tip' : '3. Payout Configurations'}
                  </h3>
                  
                  {/* Simulation Helper */}
                  <button 
                    type="button"
                    onClick={autoFillPayments}
                    className="px-2 py-1 bg-[#E9E9FF] hover:bg-opacity-90 text-[#4648D8] border border-[#4648D8]/20 rounded text-[9px] font-black uppercase tracking-wider transition"
                  >
                    ⚡ Auto-Fill Mock Handles
                  </button>
                </div>

                <p className="text-xs text-nexoraMuted leading-relaxed font-medium">
                  {currentLanguage === 'vi' 
                    ? 'Bật các kênh thanh toán bạn muốn nhận tiền. Khi khách hàng quét mã QR của bạn, họ sẽ thanh toán trực tiếp vào các tài khoản này.' 
                    : 'Toggle the payment channels you want to receive money. When customers scan your QR, they pay you directly to these accounts.'}
                </p>

                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 divide-y divide-nexoraRule">
                  {payoutMethodsList.map(method => {
                    const cfg = payouts[method.key] || { enabled: false, value: '' }
                    return (
                      <div key={method.key} className="flex items-center justify-between py-3">
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Toggle Switch on Left */}
                          <button
                            type="button"
                            onClick={() => handleToggleMethod(method.key)}
                            aria-label={`Toggle ${method.label}`}
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

                          {/* Logo + Label in Middle */}
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="h-7 w-7 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                              {PayoutLogos[method.key]}
                            </span>
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-nexoraText">{method.label}</div>
                              {cfg.value ? (
                                <div className="text-[10px] text-nexoraMuted font-mono mt-0.5 truncate max-w-[110px] sm:max-w-[150px]">
                                  {cfg.value}
                                </div>
                              ) : (
                                <div className="text-[10px] text-nexoraSubtle italic font-medium mt-0.5">
                                  {currentLanguage === 'vi' ? 'Chưa cấu hình' : 'Not Configured'}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Edit Button on Right */}
                        <button
                          type="button"
                          onClick={() => handleEditPayoutAccount(method.key)}
                          aria-label={`Edit ${method.label} Payout Account`}
                          className="flex items-center gap-1 text-[10px] font-bold text-nexoraBrand hover:text-nexoraBrandDark transition shrink-0 ml-2"
                        >
                          <Edit2 className="h-3 w-3" />
                          <span>{currentLanguage === 'vi' ? 'Tài khoản' : 'Payout account'}</span>
                        </button>
                      </div>
                    )
                  })}
                </div>

                {/* NEXORA Staff ID display at the bottom */}
                <div className="mt-4 pt-3 border-t border-nexoraRule flex justify-between items-center text-xs">
                  <div className="flex items-center gap-2">
                    <span className="h-7 w-7 rounded-lg bg-[#E9E9FF] border border-[#4648D8]/20 flex items-center justify-center shrink-0">
                      <User className="h-4 w-4 text-[#4648D8]" />
                    </span>
                    <span className="text-nexoraMuted font-bold">NEXORA Staff ID</span>
                  </div>
                  <span className="text-nexoraText font-extrabold font-mono bg-slate-50 border border-slate-200 px-2 py-0.5 rounded">
                    {staffId || 'Pending Register'}
                  </span>
                </div>

                <div className="pt-4 flex gap-3 border-t border-nexoraRule">
                  <button 
                    type="button" 
                    onClick={() => setStep(2)} 
                    className="h-10 px-4 border border-nexoraBorder text-nexoraMuted font-bold text-xs uppercase tracking-wider rounded-lg hover:bg-nexoraSurfaceMuted transition"
                  >
                    {t('common.back') || 'Back'}
                  </button>
                  <button 
                    type="button" 
                    onClick={handleActivateProfile} 
                    className="flex-grow h-10 bg-nexoraBrand hover:bg-nexoraBrandDark text-white font-bold text-xs uppercase tracking-wider rounded-lg transition"
                  >
                    {currentLanguage === 'vi' ? 'Lưu & Kích hoạt' : 'Save & Activate'}
                  </button>
                </div>
              </div>
            )}

            {/* STEP 5: Success & Redirection */}
            {step === 5 && (
              <div className="space-y-6 py-4 text-center animate-scaleIn">
                <div className="h-16 w-16 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center mx-auto text-emerald-600">
                  <Check className="h-9 w-9 stroke-[3px]" />
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-xl font-black text-nexoraText tracking-tight font-sans">
                    {currentLanguage === 'vi' ? 'Yêu cầu gia nhập đã gửi!' : 'Join Request Submitted!'}
                  </h3>
                  <p className="text-xs text-nexoraMuted max-w-md mx-auto leading-relaxed">
                    {currentLanguage === 'vi' 
                      ? `Mã thợ NEXORA của bạn là ${staffId}. Yêu cầu liên kết với ${inviteData?.biz || 'Golden Glow Nail Spa'} đã được gửi thành công. Vui lòng chờ chủ tiệm duyệt để kích hoạt QR nhận tiền tip.` 
                      : `Your NEXORA Staff ID is ${staffId}. Your request to link with ${inviteData?.biz || 'Golden Glow Nail Spa'} has been successfully submitted. Please ask the salon owner to approve your request to activate your tipping QR.`
                    }
                  </p>
                </div>

                {/* Connection dashboard list */}
                <div className="max-w-md mx-auto bg-nexoraSurfaceMuted border border-nexoraBorder rounded-xl p-4 text-left text-xs space-y-3">
                  <div className="flex items-center justify-between border-b border-nexoraBorder pb-1.5">
                    <span className="font-extrabold text-nexoraText uppercase text-[9px] tracking-wider flex items-center gap-1.5 font-sans">
                      <Building className="h-3.5 w-3.5 text-[#F59E0B]" />
                      {t('staff_invite.linked_businesses') || 'Linked Businesses'}
                    </span>
                    <span className="px-1.5 py-0.5 rounded font-extrabold text-[8px] uppercase font-sans bg-[#F59E0B]/10 text-[#F59E0B]">
                      {currentLanguage === 'vi' ? 'CHỜ DUYỆT' : 'PENDING'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <strong className="text-nexoraText block font-sans">{inviteData?.biz || 'Golden Glow Nail Spa'}</strong>
                      <span className="text-[9px] text-nexoraSubtle mt-0.5 block">Joined: Today • Role: {position}</span>
                    </div>
                    <span className="text-xs font-bold text-[#F59E0B] flex items-center gap-1 font-sans">
                      <AlertCircle className="h-3.5 w-3.5 text-[#F59E0B] animate-pulse" /> {currentLanguage === 'vi' ? 'Chờ duyệt' : 'Pending Approval'}
                    </span>
                  </div>
                </div>

                {/* Copy link option */}
                <div className="max-w-md mx-auto p-4.5 rounded-2xl border border-slate-200 flex items-center justify-between bg-white shadow-sm">
                  <div className="text-left">
                    <strong className="text-xs text-slate-800 font-extrabold block">Personal Payout ID</strong>
                    <span className="text-[11px] text-slate-500 font-bold select-all mt-1 block">{staffId}</span>
                  </div>
                  
                  <button 
                    onClick={() => {
                      const link = `https://touch.nexora.com/staff/${staffId}`
                      navigator.clipboard.writeText(link)
                      alert(currentLanguage === 'vi' ? 'Đã sao chép liên kết của thợ!' : 'Staff link copied to clipboard!')
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition"
                  >
                    <Copy className="h-3.5 w-3.5" /> 
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-700">COPY STAFF LINK</span>
                  </button>
                </div>

                <div className="pt-4 border-t border-nexoraRule">
                  <button 
                    onClick={onReturnToMerchant}
                    className="w-full h-11 bg-nexoraBrand hover:bg-nexoraBrandDark text-white font-black text-xs uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-1.5 shadow-md"
                  >
                    {t('staff_invite.return_merchant') || 'Return to Merchant Dashboard'}
                  </button>
                </div>
              </div>
            )}

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
          bankwire: currentLanguage === 'vi' ? 'Số tài khoản & Số Routing' : 'Account & Routing numbers',
          paypal: 'email@paypal.com',
          venmo: '@username-venmo',
          cashapp: '$cashtag',
          applecash: currentLanguage === 'vi' ? 'Nhập số điện thoại...' : 'Enter phone number...'
        }

        const brandStyles = {
          venmo: { text: 'venmo', color: 'text-[#008CFF]', fontClass: 'font-black italic text-lg tracking-tight' },
          cashapp: { text: 'cash app', color: 'text-[#00D632]', fontClass: 'font-extrabold text-lg tracking-tighter' },
          zelle: { text: 'zelle', color: 'text-[#7414CA]', fontClass: 'font-black text-lg' },
          paypal: { text: 'PayPal', color: 'text-[#003087]', fontClass: 'font-black italic text-lg' },
          applecash: { text: 'Apple Cash', color: 'text-black', fontClass: 'font-black text-lg tracking-tight' },
          bankwire: { text: 'Bank Wire', color: 'text-[#475569]', fontClass: 'font-bold uppercase text-xs tracking-widest' }
        }[editingMethod] || { text: editingMethod, color: 'text-slate-800', fontClass: 'font-bold' }

        return (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl border border-slate-100 max-w-sm w-full shadow-2xl p-6 relative overflow-hidden animate-scaleUp text-left space-y-4">
              
              {/* Header */}
              <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                <span className="h-8 w-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                  {PayoutLogos[editingMethod]}
                </span>
                <div>
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">
                    {currentLanguage === 'vi'
                      ? `CẤU HÌNH ${walletNames[editingMethod]?.toUpperCase()}`
                      : `CONFIGURE ${walletNames[editingMethod]?.toUpperCase()}`}
                  </h3>
                  <p className="text-[10px] text-slate-400">
                    {currentLanguage === 'vi' ? 'Chỉ định thông tin tài khoản nhận tiền' : 'Specify receiving target identifier'}
                  </p>
                </div>
              </div>

              {/* Form Content */}
              <form onSubmit={savePayoutAccount} className="space-y-4">
                {/* Account Identifier Input */}
                <div>
                  <label className="block text-[9px] font-extrabold uppercase tracking-wider text-slate-500 mb-1.5">
                    {currentLanguage === 'vi'
                      ? `${walletNames[editingMethod]} ${walletFields[editingMethod]} của bạn *`
                      : `Your ${walletNames[editingMethod]} ${walletFields[editingMethod]} *`}
                  </label>
                  <input
                    type="text"
                    value={editValue}
                    onChange={(e) => {
                      setEditValue(e.target.value)
                      setModalError('')
                    }}
                    placeholder={walletPlaceholders[editingMethod]}
                    className={`mt-1.5 h-10 w-full rounded-lg border px-3 text-sm font-semibold outline-none focus:ring-1 focus:ring-nexoraBrand transition-all ${
                      modalError ? 'border-rose-500 focus:border-rose-500' : 'border-slate-200 focus:border-nexoraBrand'
                    }`}
                  />
                  {modalError && <p className="mt-1 text-[10px] font-bold text-rose-500">{modalError}</p>}
                </div>

                {/* QR Code Optional Upload */}
                <div>
                  <label className="block text-[9px] font-extrabold uppercase tracking-wider text-slate-500 mb-2">
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
                      <div className={`${brandStyles.color} ${brandStyles.fontClass}`}>
                        {brandStyles.text}
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

                  {!editQrCode && (
                    <p className="mt-2 text-[9px] text-slate-400 leading-normal">
                      {currentLanguage === 'vi'
                        ? 'Bạn có thể chụp hình bằng camera hoặc chọn ảnh từ thiết bị. Định dạng: JPG, PNG, JPEG. Tối đa: 5MB.'
                        : 'You can either take a photo or upload from your device. Accepted formats: JPG, PNG, JPEG. Max size: 5MB.'}
                    </p>
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
                <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setEditingMethod(null)}
                    className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-500 text-[10px] font-bold uppercase tracking-wider rounded transition"
                  >
                    {currentLanguage === 'vi' ? 'HỦY' : 'CANCEL'}
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-nexoraBrand hover:opacity-95 text-white text-[10px] font-bold uppercase tracking-wider rounded shadow-sm transition"
                  >
                    {currentLanguage === 'vi' ? 'LƯU' : 'SAVE'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

      </div>
    </div>
  )
}
