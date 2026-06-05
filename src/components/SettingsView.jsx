import React, { useState, useEffect } from 'react'
import {
  User,
  Building2,
  Edit2,
  Copy,
  Check,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  Download,
  ExternalLink,
  MapPin,
  FileText,
  Landmark,
  Wallet,
  Globe,
  HelpCircle,
  Camera,
  FolderOpen,
  AlertTriangle,
  X,
  Eye,
  EyeOff
} from 'lucide-react'
import { useTranslation } from '../contexts/LanguageContext'
import { storage } from '../utils/storage'

const localStorage = storage
const sessionStorage = storage
import CustomSelect from './CustomSelect'

const DEFAULT_PROFILE = {
  username: 'goldenglow_owner',
  email: 'owner@goldenglownails.com',
  referralId: 'VLP-8893-GG',
  avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200&h=200',
  // Basic Info
  fullName: 'Elena Rostova',
  dob: '1985-05-15',
  phone: '+1 (555) 789-2026',
  // Sponsor Info
  sponsorReferralId: 'VLP-Sponsor-99',
  sponsorUsername: 'admin_vlinkpay',
  sponsorEmail: 'support@vlinkpay.com',
  sponsorPhone: '+1 (800) 555-0100',
  // Address Details
  street: '1088 Gold Coast Hwy, Palm Beach, QLD 4221',
  city: 'Palm Beach',
  state: 'QLD',
  zipCode: '4221',
  country: 'Australia',
  // Business Info
  businessName: 'Golden Glow Nail Spa & Salon',
  businessPhone: '+1 (555) 789-2026',
  businessEmail: 'manager@goldenglownails.com',
  businessWebsite: 'https://goldenglownails.com',
  // Linked Payment Wallets
  paymentAccounts: {
    zelle: 'payment@goldenglownails.com',
    bankwire: '',
    paypal: '',
    venmo: '@goldenglow-spa',
    cashapp: '$goldenglownails',
    applecash: '',
    vlinkpay: 'VLP-8893-GG'
  },
  payoutToggles: {
    zelle: true,
    bankwire: false,
    paypal: false,
    venmo: true,
    cashapp: true,
    applecash: false
  },
  payoutQrCodes: {
    zelle: '',
    bankwire: '',
    paypal: '',
    venmo: '',
    cashapp: '',
    applecash: ''
  },
  googleReview: 'https://g.page/r/cGoldenGlowNails/review',
  yelpReview: 'https://www.yelp.com/biz/golden-glow-nails-palm-beach'
}

const PayoutLogos = {
  zelle: (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] fill-[#7414CA]" xmlns="http://www.w3.org/2000/svg">
      <path d="M13.559 24h-2.841a.483.483 0 0 1-.483-.483v-2.765H5.638a.667.667 0 0 1-.666-.666v-2.234a.67.67 0 0 1 .142-.412l8.139-10.382h-7.25a.667.667 0 0 1-.667-.667V3.914c0-.367.299-.666.666-.666h4.23V.483c0-.266.217-.483.483-.483h2.841c.266 0 .483.217.483.483v2.765h4.323c.367 0 .666.299.666.666v2.137a.67.67 0 0 1-.141.41l-8.19 10.481h7.665c.367 0 .666.299.666.666v2.477a.667.667 0 0 1-.666.667h-4.32v2.765a.483.483 0 0 1-.483.483Z" />
    </svg>
  ),
  bankwire: (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] fill-[#475569]" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2L1 7v2h22V7L12 2zm0 18H3v-8h3v8h3v-8h3v8h3v-8h3v8h3v-8h3v8h3v-8h3v8h3v-8h3v8h-3zm-11 2h22v2H1v-2z" />
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
  const { t, currentLanguage } = useTranslation()
  const [activeTab, setActiveTab] = useState(initialTab) // profile | kyb
  
  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab)
    }
  }, [initialTab])

  const handleTabChange = (tab) => {
    setActiveTab(tab)
    if (onTabChange) onTabChange(tab)
  }

  // State for secure VLINKPAY KYB iframe
  const [kybData, setKybData] = useState({
    legalName: '',
    taxId: '',
    businessType: 'LLC',
    ownerName: '',
    bankName: '',
    bankAccount: '',
    bankRouting: ''
  })
  const [isSubmittingKyb, setIsSubmittingKyb] = useState(false)
  const [kybErrors, setKybErrors] = useState({})
  const [showPortal, setShowPortal] = useState(verificationStatus !== 'kyb_approved' && verificationStatus !== 'verified_pro')
  const [showKybBankAccount, setShowKybBankAccount] = useState(false)

  useEffect(() => {
    setShowPortal(verificationStatus !== 'kyb_approved' && verificationStatus !== 'verified_pro')
  }, [verificationStatus])

  const handleKybSubmit = (e) => {
    e.preventDefault()
    if (!kybData.legalName.trim() || !kybData.taxId.trim() || !kybData.ownerName.trim() || 
        !kybData.bankName.trim() || !kybData.bankAccount.trim() || !kybData.bankRouting.trim()) {
      setKybErrors({ kyb: t('register.errors.kyb_required') || 'All fields are required.' })
      return
    }
    setKybErrors({})
    setIsSubmittingKyb(true)
    setTimeout(() => {
      setIsSubmittingKyb(false)
      const pendingAccounts = JSON.parse(localStorage.getItem('nexora_pending_accounts') || '[]')
      const targetEmail = profile.email || 'sso_no_kyb@gmail.com'
      const existing = pendingAccounts.find(acc => acc.email === targetEmail)
      const newAccount = {
        email: targetEmail,
        password: existing ? existing.password : '••••••••',
        referralCode: existing ? existing.referralCode : '',
        isVerified: true,
        kybDetails: { ...kybData }
      }
      const filtered = pendingAccounts.filter(acc => acc.email !== targetEmail)
      filtered.push(newAccount)
      localStorage.setItem('nexora_pending_accounts', JSON.stringify(filtered))
      if (onKybSuccess) {
        onKybSuccess(targetEmail)
      }
      setShowPortal(false)
      setProfile(prev => ({
        ...prev,
        businessName: kybData.legalName,
        fullName: kybData.ownerName,
        paymentAccounts: {
          ...prev.paymentAccounts,
          vlinkpay: kybData.bankAccount ? `VLP-${kybData.bankAccount.slice(-4)}` : 'VLINKPAY-ID'
        }
      }))
      showToast(currentLanguage === 'vi' ? 'Xác thực KYB thành công!' : 'KYB verification successful!')
    }, 2000)
  }

  // Settings profile state loaded from local storage or default
  const [profile, setProfile] = useState(() => {
    if (!hasKyb) {
      return {
        ...DEFAULT_PROFILE,
        username: '',
        fullName: '',
        phone: '',
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: '',
        businessName: '',
        businessPhone: '',
        businessEmail: '',
        businessWebsite: '',
        paymentAccounts: {
          zelle: '',
          bankwire: '',
          paypal: '',
          venmo: '',
          cashapp: '',
          applecash: '',
          vlinkpay: ''
        },
        payoutToggles: {
          zelle: false,
          bankwire: false,
          paypal: false,
          venmo: false,
          cashapp: false,
          applecash: false
        },
        payoutQrCodes: {
          zelle: '',
          bankwire: '',
          paypal: '',
          venmo: '',
          cashapp: '',
          applecash: ''
        }
      }
    }
    return DEFAULT_PROFILE
  })
  const [copiedId, setCopiedId] = useState(null)
  const [toastMessage, setToastMessage] = useState('')

  // Edit states for different cards
  const [isEditingBasic, setIsEditingBasic] = useState(false)
  const [basicForm, setBasicForm] = useState({})
  
  const [isEditingAddress, setIsEditingAddress] = useState(false)
  const [addressForm, setAddressForm] = useState({})

  const [isEditingBusiness, setIsEditingBusiness] = useState(false)
  const [businessForm, setBusinessForm] = useState({})

  const [isEditingReviews, setIsEditingReviews] = useState(false)
  const [reviewsForm, setReviewsForm] = useState({ googleReview: '', yelpReview: '' })

  const [editingMethod, setEditingMethod] = useState(null)
  const [editValue, setEditValue] = useState('')
  const [editQrCode, setEditQrCode] = useState('')
  const [isCapturing, setIsCapturing] = useState(false)
  const [modalError, setModalError] = useState('')

  // Load profile settings from localStorage or sync with setupData
  useEffect(() => {
    const saved = localStorage.getItem('nexora_profile_settings')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setProfile(prev => ({ ...prev, ...parsed }))
      } catch (e) {
        console.error(e)
      }
    } else if (setupData) {
      const synced = {
        fullName: setupData.businessInfo?.ownerName || (hasKyb ? DEFAULT_PROFILE.fullName : ''),
        businessName: setupData.businessInfo?.name || (hasKyb ? DEFAULT_PROFILE.businessName : ''),
        businessPhone: setupData.businessInfo?.phone || (hasKyb ? DEFAULT_PROFILE.businessPhone : ''),
        businessWebsite: setupData.businessInfo?.website || (hasKyb ? DEFAULT_PROFILE.businessWebsite : ''),
        businessEmail: setupData.reviewLinks?.feedbackEmail || (hasKyb ? DEFAULT_PROFILE.businessEmail : ''),
        street: setupData.businessInfo?.address || (hasKyb ? DEFAULT_PROFILE.street : ''),
        googleReview: setupData.reviewLinks?.googleReview || DEFAULT_PROFILE.googleReview,
        yelpReview: setupData.reviewLinks?.yelpReview || DEFAULT_PROFILE.yelpReview,
        paymentAccounts: setupData.businessInfo?.paymentAccounts || (hasKyb ? DEFAULT_PROFILE.paymentAccounts : {
          zelle: '',
          bankwire: '',
          paypal: '',
          venmo: '',
          cashapp: '',
          applecash: '',
          vlinkpay: ''
        }),
        payoutQrCodes: setupData.businessInfo?.payoutQrCodes || (hasKyb ? DEFAULT_PROFILE.payoutQrCodes : {
          zelle: '',
          bankwire: '',
          paypal: '',
          venmo: '',
          cashapp: '',
          applecash: ''
        })
      }
      setProfile(prev => ({ ...prev, ...synced }))
    } else if (!hasKyb) {
      setProfile(prev => ({
        ...prev,
        email: userEmail || prev.email || '',
        businessEmail: userEmail || prev.businessEmail || ''
      }))
    }
  }, [setupData, hasKyb, userEmail])

  const saveProfile = (updatedProfile) => {
    setProfile(updatedProfile)
    localStorage.setItem('nexora_profile_settings', JSON.stringify(updatedProfile))
    sessionStorage.setItem('nexora_profile_settings', JSON.stringify(updatedProfile))
    showToast(currentLanguage === 'vi' ? 'Đã cập nhật cài đặt thành công!' : 'Settings updated successfully!')
    window.dispatchEvent(new Event('storage'))
  }

  const showToast = (msg) => {
    setToastMessage(msg)
    setTimeout(() => {
      setToastMessage('')
    }, 3000)
  }

  const handleCopy = (text, id) => {
    if (!text) return
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    showToast(currentLanguage === 'vi' ? 'Đã sao chép vào bộ nhớ tạm!' : 'Copied to clipboard!')
    setTimeout(() => setCopiedId(null), 2000)
  }

  // --- Edit Actions ---
  const startEditBasic = () => {
    setBasicForm({
      fullName: profile.fullName,
      dob: profile.dob,
      phone: profile.phone
    })
    setIsEditingBasic(true)
  }

  const saveBasic = (e) => {
    e.preventDefault()
    saveProfile({
      ...profile,
      fullName: basicForm.fullName,
      dob: basicForm.dob,
      phone: basicForm.phone
    })
    setIsEditingBasic(false)
  }

  const startEditAddress = () => {
    setAddressForm({
      street: profile.street,
      city: profile.city,
      state: profile.state,
      zipCode: profile.zipCode,
      country: profile.country
    })
    setIsEditingAddress(true)
  }

  const saveAddress = (e) => {
    e.preventDefault()
    saveProfile({
      ...profile,
      street: addressForm.street,
      city: addressForm.city,
      state: addressForm.state,
      zipCode: addressForm.zipCode,
      country: addressForm.country
    })
    setIsEditingAddress(false)
  }

  const startEditBusiness = () => {
    setBusinessForm({
      businessName: profile.businessName,
      businessPhone: profile.businessPhone,
      businessEmail: profile.businessEmail,
      businessWebsite: profile.businessWebsite
    })
    setIsEditingBusiness(true)
  }

  const saveBusiness = (e) => {
    e.preventDefault()
    saveProfile({
      ...profile,
      businessName: businessForm.businessName,
      businessPhone: businessForm.businessPhone,
      businessEmail: businessForm.businessEmail,
      businessWebsite: businessForm.businessWebsite
    })

    // Update setupData businessInfo in storage to synchronize with other views
    const savedSetupStr = localStorage.getItem('nexora_merchant_setup') || sessionStorage.getItem('nexora_merchant_setup')
    if (savedSetupStr) {
      try {
        const savedSetup = JSON.parse(savedSetupStr)
        if (!savedSetup.businessInfo) {
          savedSetup.businessInfo = {}
        }
        savedSetup.businessInfo.name = businessForm.businessName
        savedSetup.businessInfo.phone = businessForm.businessPhone
        savedSetup.businessInfo.businessEmail = businessForm.businessEmail
        savedSetup.businessInfo.website = businessForm.businessWebsite
        localStorage.setItem('nexora_merchant_setup', JSON.stringify(savedSetup))
        sessionStorage.setItem('nexora_merchant_setup', JSON.stringify(savedSetup))
        window.dispatchEvent(new Event('storage'))
      } catch (err) {
        console.error(err)
      }
    }

    setIsEditingBusiness(false)
  }

  const startEditReviews = () => {
    setReviewsForm({
      googleReview: profile.googleReview || '',
      yelpReview: profile.yelpReview || ''
    })
    setIsEditingReviews(true)
  }

  const saveReviews = (e) => {
    e.preventDefault()
    const updatedProfile = {
      ...profile,
      googleReview: reviewsForm.googleReview,
      yelpReview: reviewsForm.yelpReview
    }
    saveProfile(updatedProfile)

    // Update setupData reviewLinks in storage to synchronize with other views
    const savedSetupStr = localStorage.getItem('nexora_merchant_setup') || sessionStorage.getItem('nexora_merchant_setup')
    if (savedSetupStr) {
      try {
        const savedSetup = JSON.parse(savedSetupStr)
        if (!savedSetup.reviewLinks) {
          savedSetup.reviewLinks = {}
        }
        savedSetup.reviewLinks.googleReview = reviewsForm.googleReview
        savedSetup.reviewLinks.yelpReview = reviewsForm.yelpReview
        localStorage.setItem('nexora_merchant_setup', JSON.stringify(savedSetup))
        sessionStorage.setItem('nexora_merchant_setup', JSON.stringify(savedSetup))
        
        // Dispatch storage event to notify other components
        window.dispatchEvent(new Event('storage'))
      } catch (err) {
        console.error(err)
      }
    }
    setIsEditingReviews(false)
  }

  const handleToggleMethod = (key) => {
    const updatedToggles = {
      ...profile.payoutToggles,
      [key]: !profile.payoutToggles?.[key]
    }
    const updatedProfile = {
      ...profile,
      payoutToggles: updatedToggles
    }
    saveProfile(updatedProfile)
  }

  const handleEditPayoutAccount = (key) => {
    setEditingMethod(key)
    setEditValue(profile.paymentAccounts?.[key] || '')
    setEditQrCode(profile.payoutQrCodes?.[key] || '')
    setModalError('')
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

  const savePayoutAccount = (e) => {
    e.preventDefault()
    const updatedAccounts = {
      ...profile.paymentAccounts,
      [editingMethod]: editValue
    }
    const updatedQrCodes = {
      ...profile.payoutQrCodes,
      [editingMethod]: editQrCode
    }
    const updatedToggles = {
      ...profile.payoutToggles,
      [editingMethod]: editValue.trim() !== '' ? true : !!profile.payoutToggles?.[editingMethod]
    }
    const updatedProfile = {
      ...profile,
      paymentAccounts: updatedAccounts,
      payoutQrCodes: updatedQrCodes,
      payoutToggles: updatedToggles
    }
    saveProfile(updatedProfile)

    // Update setupData businessInfo paymentAccounts in storage to synchronize with other views
    const savedSetupStr = localStorage.getItem('nexora_merchant_setup') || sessionStorage.getItem('nexora_merchant_setup')
    if (savedSetupStr) {
      try {
        const savedSetup = JSON.parse(savedSetupStr)
        if (!savedSetup.businessInfo) {
          savedSetup.businessInfo = {}
        }
        savedSetup.businessInfo.paymentAccounts = updatedAccounts
        savedSetup.businessInfo.payoutQrCodes = updatedQrCodes
        localStorage.setItem('nexora_merchant_setup', JSON.stringify(savedSetup))
        sessionStorage.setItem('nexora_merchant_setup', JSON.stringify(savedSetup))
        window.dispatchEvent(new Event('storage'))
      } catch (err) {
        console.error(err)
      }
    }

    setEditingMethod(null)
  }

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      saveProfile({
        ...profile,
        avatar: reader.result
      })
    }
    reader.readAsDataURL(file)
  }

  const formatDOB = (dobString) => {
    if (!dobString) return ''
    try {
      const date = new Date(dobString)
      return date.toLocaleDateString(currentLanguage === 'vi' ? 'vi-VN' : 'en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
    } catch (e) {
      return dobString
    }
  }

  const getStatusCardDetails = () => {
    switch (verificationStatus) {
      case 'basic':
        return {
          bgClass: 'bg-blue-50/70 border-blue-200 text-blue-900',
          icon: ShieldAlert,
          iconBg: 'bg-blue-500',
          title: currentLanguage === 'vi' ? 'HỒ SƠ CƠ BẢN' : 'BASIC ACCOUNT STATUS',
          description: currentLanguage === 'vi'
            ? 'Hồ sơ của bạn chỉ hoạt động cho nhận tiền típ trực tiếp P2P (Venmo, Cash App, Zelle) và đánh giá của khách hàng. Các tính năng xử lý tài chính nâng cao (Ví VLINKPAY, Xử lý Thẻ Tín Dụng, Merchant ATM) đã bị Khóa.'
            : 'Your profile is active only for direct P2P tipping (Venmo, Cash App, direct Zelle) and customer reviews. Advanced financial processing features (VLINKPAY Wallet, Credit Card processing, Merchant ATM) are Gated.',
          ctaText: currentLanguage === 'vi' ? 'Hoàn tất Xác minh Doanh nghiệp' : 'Complete Business Verification',
          ctaAction: () => setShowPortal(prev => !prev)
        }
      case 'lite_pending':
        return {
          bgClass: 'bg-amber-50/70 border-amber-200 text-amber-900',
          icon: ShieldAlert,
          iconBg: 'bg-amber-500',
          title: currentLanguage === 'vi' ? 'ĐANG CHỜ XÁC MINH LITE' : 'LITE VERIFICATION PENDING REVIEW',
          description: currentLanguage === 'vi'
            ? 'Lite Verification đang chờ xem duyệt.'
            : 'Lite Verification Pending review.',
          ctaText: null
        }
      case 'verified_lite':
        return {
          bgClass: 'bg-emerald-50/70 border-emerald-200 text-emerald-900',
          icon: ShieldCheck,
          iconBg: 'bg-emerald-500',
          title: currentLanguage === 'vi' ? 'ĐÃ XÁC THỰC LITE' : 'VERIFIED LITE',
          description: currentLanguage === 'vi'
            ? 'Đã xác thực Lite. Bật nhận tiền típ P2P. Hoàn thành KYB đầy đủ để mở khóa xử lý thẻ tín dụng.'
            : 'Verified Lite. P2P tipping enabled. Complete full KYB to unlock credit card processing.',
          ctaText: currentLanguage === 'vi' ? 'Hoàn tất Xác minh Doanh nghiệp' : 'Complete Business Verification',
          ctaAction: () => setShowPortal(prev => !prev)
        }
      case 'kyb_required':
        return {
          bgClass: 'bg-orange-50/70 border-orange-200 text-orange-900',
          icon: ShieldAlert,
          iconBg: 'bg-orange-500',
          title: currentLanguage === 'vi' ? 'YÊU CẦU XÁC MINH DOANH NGHIỆP' : 'BUSINESS VERIFICATION REQUIRED',
          description: currentLanguage === 'vi'
            ? 'Yêu cầu Xác minh Doanh nghiệp. Bạn phải xác minh doanh nghiệp của mình để kích hoạt xử lý thẻ.'
            : 'Business Verification Required. You must verify your business to enable card processing.',
          ctaText: currentLanguage === 'vi' ? 'Hoàn tất Xác minh Doanh nghiệp' : 'Complete Business Verification',
          ctaAction: () => setShowPortal(prev => !prev)
        }
      case 'kyb_pending':
        return {
          bgClass: 'bg-indigo-50/70 border-indigo-200 text-indigo-900',
          icon: ShieldAlert,
          iconBg: 'bg-indigo-500',
          title: currentLanguage === 'vi' ? 'ĐANG CHỜ XÁC MINH DOANH NGHIỆP' : 'BUSINESS VERIFICATION PENDING',
          description: currentLanguage === 'vi'
            ? 'Xác minh doanh nghiệp đang chờ xử lý. Ban tuân thủ VLINKPAY đang xem xét chi tiết của bạn.'
            : 'Business Verification Pending. VLINKPAY Compliance is reviewing your details.',
          ctaText: null
        }
      case 'kyb_approved':
      case 'verified_pro':
        return {
          bgClass: 'bg-emerald-50/70 border-emerald-200 text-emerald-900',
          icon: ShieldCheck,
          iconBg: 'bg-emerald-500',
          title: currentLanguage === 'vi' ? 'Hồ sơ doanh nghiệp đã xác minh (Phê duyệt KYB)' : 'BUSINESS PROFILE VERIFIED (KYB APPROVED)',
          description: currentLanguage === 'vi'
            ? 'Chúc mừng! Hồ sơ doanh nghiệp của bạn đã được VLINKPAY xác minh đầy đủ. Không giới hạn hạn mức xử lý thẻ tín dụng và tính năng Merchant ATM hoạt động.'
            : 'Business Profile Verified (KYB Approved).',
          subText: 'Verified Date: May 20, 2026 • Certificate ID: VLP-KYB-99812A',
          ctaText: null
        }
      case 'suspended':
        return {
          bgClass: 'bg-red-50/70 border-red-200 text-red-900',
          icon: ShieldAlert,
          iconBg: 'bg-red-500',
          title: currentLanguage === 'vi' ? 'TÀI KHOẢN BỊ ĐÌNH CHỈ' : 'ACCOUNT SUSPENDED',
          description: currentLanguage === 'vi'
            ? 'Tài khoản bị đình chỉ. Vui lòng liên hệ bộ phận hỗ trợ.'
            : 'Account Suspended. Please contact support.',
          ctaText: null
        }
      case 'pro_pending':
        return {
          bgClass: 'bg-blue-50/70 border-blue-200 text-blue-900',
          icon: ShieldAlert,
          iconBg: 'bg-blue-500',
          title: currentLanguage === 'vi' ? 'ĐANG CHỜ PHÊ DUYỆT PRO' : 'PRO VERIFICATION PENDING REVIEW',
          description: currentLanguage === 'vi'
            ? 'Hồ sơ nâng cấp Pro đang được thẩm định.'
            : 'Your Pro Verification upgrade is currently pending review.',
          ctaText: null
        }
      case 'kyb_rejected':
        return {
          bgClass: 'bg-rose-50/70 border-rose-200 text-rose-900',
          icon: ShieldAlert,
          iconBg: 'bg-rose-500',
          title: currentLanguage === 'vi' ? 'BỊ TỪ CHỐI XÁC THỰC' : 'VERIFICATION REJECTED BY COMPLIANCE',
          description: currentLanguage === 'vi'
            ? 'Hồ sơ xác thực doanh nghiệp của bạn đã bị từ chối.'
            : 'Your business verification application was rejected by Compliance.',
          ctaText: currentLanguage === 'vi' ? 'Nộp lại thông tin xác minh' : 'Re-submit Verification',
          ctaAction: () => setShowPortal(prev => !prev)
        }
      case 'under_review':
        return {
          bgClass: 'bg-amber-50/70 border-amber-200 text-amber-900',
          icon: ShieldAlert,
          iconBg: 'bg-amber-500',
          title: currentLanguage === 'vi' ? 'CẦN BỔ SUNG HỒ SƠ' : 'UNDER REVIEW - INFO REQUESTED',
          description: currentLanguage === 'vi'
            ? 'Hồ sơ đang được xem xét.'
            : 'Under Review. Additional compliance documentation has been requested.',
          ctaText: currentLanguage === 'vi' ? 'Tải lên tài liệu bổ sung' : 'Upload Additional Documents',
          ctaAction: () => setShowPortal(prev => !prev)
        }
      default:
        return null;
    }
  }

  const cardDetails = getStatusCardDetails()

  const tabs = [
    { id: 'profile', label: currentLanguage === 'vi' ? 'Hồ sơ' : 'Profile' },
    { id: 'kyb', label: currentLanguage === 'vi' ? 'Xác minh Doanh nghiệp' : 'Business Verification' }
  ]

  return (
    <div className="w-full space-y-6 animate-fadeIn pb-24 select-none">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs font-semibold shadow-2xl flex items-center gap-2 animate-bounce">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
          {toastMessage}
        </div>
      )}

      {/* 1. Header Area Consistent with Dashboard Views */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-nexoraRule pb-4">
        <div>
          <h2 className="text-xl font-extrabold text-nexoraText">
            {currentLanguage === 'vi' ? 'Cấu Hinh Cài Đặt' : 'Settings Configuration'}
          </h2>
          <p className="mt-1 text-xs text-nexoraMuted">
            {currentLanguage === 'vi' 
              ? 'Quản lý thông tin tài khoản chủ sở hữu, địa chỉ cửa hàng và cấu hình xác thực pháp lý (KYB).'
              : 'Manage your owner credentials, store configurations, receiving wallets, and corporate compliance details (KYB).'}
          </p>
        </div>
      </div>

      {/* 2. Pill Navigation Tabs Consistent with Detail View filters */}
      <div className="flex gap-2 pb-2">
        <button
          type="button"
          onClick={() => handleTabChange('profile')}
          className={`px-4 py-2 rounded-lg text-xs font-extrabold uppercase transition ${
            activeTab === 'profile'
              ? 'bg-nexoraBrand text-white shadow-sm'
              : 'bg-nexoraSurfaceMuted text-nexoraMuted hover:bg-slate-200'
          }`}
        >
          {currentLanguage === 'vi' ? 'Hồ sơ cá nhân' : 'Profile'}
        </button>
        <button
          type="button"
          onClick={() => handleTabChange('kyb')}
          className={`px-4 py-2 rounded-lg text-xs font-extrabold uppercase transition ${
            activeTab === 'kyb'
              ? 'bg-nexoraBrand text-white shadow-sm'
              : 'bg-nexoraSurfaceMuted text-nexoraMuted hover:bg-slate-200'
          }`}
        >
          {currentLanguage === 'vi' ? 'Xác thực KYB' : 'KYB'}
        </button>
      </div>

      {/* Content Area */}
      <div className="space-y-6">
        
        {/* ================= PROFILE TAB ================= */}
        {activeTab === 'profile' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
            
            {/* Left Column (Owner Profile + Payout Methods) */}
            <div className="lg:col-span-1 space-y-6">
              
              {/* Owner Profile Card */}
              <div className="rounded-xl border border-nexoraBorder bg-white shadow-sm p-6 flex flex-col items-center text-center relative">
                {/* Avatar Section */}
                <div className="relative group">
                  <img
                    src={profile.avatar}
                    alt={profile.fullName}
                    className="h-20 w-20 rounded-full object-cover border border-white shadow-sm"
                  />
                  <label className="absolute inset-0 rounded-full bg-black/40 text-white text-[9px] font-black uppercase flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                    Edit
                    <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                  </label>
                </div>
                <span className="mt-2 inline-block bg-orange-50 text-orange-600 border border-orange-100 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full">
                  Business Owner
                </span>

                <div className="w-full mt-6 space-y-3.5 text-xs text-left border-t border-nexoraRule pt-4">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2 sm:py-1 gap-1">
                    <span className="text-nexoraMuted font-bold">Username:</span>
                    <span className="text-nexoraText font-extrabold">{profile.username}</span>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2 sm:py-1 border-t border-slate-50 gap-1">
                    <span className="text-nexoraMuted font-bold">Email:</span>
                    <div className="flex items-center gap-1 self-end sm:self-auto min-w-0">
                      <span className="text-nexoraText font-extrabold truncate" title={profile.email}>{profile.email}</span>
                      <button
                        type="button"
                        onClick={() => showToast(currentLanguage === 'vi' ? 'Chức năng thay đổi email đang được phát triển.' : 'Email modification is currently under development.')}
                        className="text-blue-500 hover:text-blue-600 font-bold text-[10px] uppercase hover:underline ml-2 shrink-0"
                      >
                        Change
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2 sm:py-1 border-t border-slate-50 gap-1">
                    <span className="text-nexoraMuted font-bold">Referral ID:</span>
                    <div className="flex items-center gap-1 self-end sm:self-auto">
                      <span className="font-mono text-nexoraText font-extrabold">{profile.referralId}</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(profile.referralId, 'ref')}
                        className="text-blue-500 hover:text-blue-600 font-bold text-[10px] uppercase hover:underline ml-2 flex items-center gap-1"
                      >
                        {copiedId === 'ref' ? (
                          <>
                            <Check className="h-3 w-3 text-emerald-600" />
                            <span className="text-emerald-600">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payout Methods Configuration */}
              <div className="rounded-xl border border-nexoraBorder bg-white shadow-sm p-6 relative">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
                  <h4 className="text-xs font-black uppercase text-nexoraText tracking-wider flex items-center gap-2">
                    <Wallet className="h-4 w-4 text-nexoraBrand" />
                    {currentLanguage === 'vi' ? 'Phương thức thanh toán' : 'Payout Methods'}
                  </h4>
                  {/* Keep Payment Wallets text for unit tests matching */}
                  <span className="sr-only">Payment Wallets</span>
                </div>

                <div className="divide-y divide-slate-100">
                  {payoutMethodsList.map((item) => (
                    <div key={item.key} className="flex items-center justify-between py-3">
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Toggle Switch */}
                        <button
                          type="button"
                          onClick={() => handleToggleMethod(item.key)}
                          aria-label={`Toggle ${item.label}`}
                          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            profile.payoutToggles?.[item.key] ? 'bg-amber-600' : 'bg-slate-200'
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                              profile.payoutToggles?.[item.key] ? 'translate-x-4' : 'translate-x-0'
                            }`}
                          />
                        </button>

                        {/* Logo and Label */}
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="h-7 w-7 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                            {PayoutLogos[item.key]}
                          </span>
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-slate-800">{item.label}</div>
                            {profile.paymentAccounts?.[item.key] ? (
                              <div className="text-[10px] text-slate-500 font-mono mt-0.5 truncate max-w-[110px] sm:max-w-[150px]">
                                {profile.paymentAccounts[item.key]}
                              </div>
                            ) : (
                              <div className="text-[10px] text-slate-300 italic font-medium mt-0.5">
                                Not Configured
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Edit button */}
                      <button
                        type="button"
                        onClick={() => handleEditPayoutAccount(item.key)}
                        aria-label={`Edit ${item.label} Payout Account`}
                        className="flex items-center gap-1 text-[10px] font-bold text-amber-600 hover:text-amber-700 transition shrink-0 ml-2"
                      >
                        <Edit2 className="h-3 w-3" />
                        <span>{currentLanguage === 'vi' ? 'Tài khoản' : 'Payout account'}</span>
                      </button>
                    </div>
                  ))}
                </div>

                {/* VLINKPAY ID display at the bottom */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center text-xs">
                  <div className="flex items-center gap-2">
                    <span className="h-7 w-7 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                      <img src="/assets/vlinkpay-logo.png" alt="VLINKPAY Logo" className="h-4.5 w-4.5 object-contain animate-pulse" />
                    </span>
                    <span className="text-nexoraMuted font-bold">VLINKPAY ID</span>
                  </div>
                  <span className="text-nexoraText font-extrabold font-mono bg-slate-50 border border-slate-200 px-2 py-0.5 rounded">
                    {profile.paymentAccounts?.vlinkpay || 'Pending KYB'}
                  </span>
                </div>

              </div>

            </div>

            {/* Right Column (Basic Info + Address Details + Business Info + Map/Sponsor Grid) */}
            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 content-start">
              
              {/* Basic Information */}
              <div className="rounded-xl border border-nexoraBorder bg-white shadow-sm p-6 relative">
                <div className="flex justify-between items-center border-b border-nexoraRule pb-3 mb-4">
                  <h4 className="text-xs font-black uppercase text-nexoraText tracking-wider flex items-center gap-2">
                    <User className="h-4 w-4 text-nexoraBrand" />
                    {currentLanguage === 'vi' ? 'Thông tin cơ bản' : 'Basic Information'}
                  </h4>
                  {!isEditingBasic && !hasKyb && (
                    <button
                      type="button"
                      onClick={startEditBasic}
                      aria-label="Edit Basic Information"
                      className="text-slate-400 hover:text-nexoraBrand transition p-1 hover:bg-slate-100 rounded"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                {isEditingBasic ? (
                  <form onSubmit={saveBasic} className="space-y-4">
                    <div>
                      <label className="flex items-center text-[10px] font-extrabold uppercase text-nexoraMuted gap-1">
                        <span>Full Name</span>
                        <div className="relative group inline-block normal-case font-normal text-nexoraSubtle">
                          <HelpCircle className="w-3.5 h-3.5 hover:text-nexoraBrand cursor-help transition-colors" />
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-48 bg-black text-white text-[10px] p-2.5 rounded-lg shadow-xl z-50 text-center leading-normal">
                            {currentLanguage === 'vi'
                              ? 'Nhập đầy đủ họ và tên hợp pháp của bạn như trên giấy tờ tùy thân.'
                              : 'Specify your full legal name as it appears on your official government identification documents.'}
                            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1.5 border-4 border-transparent border-t-black"></div>
                          </div>
                        </div>
                      </label>
                      <input
                        type="text"
                        required
                        className="mt-1 h-10 w-full rounded-lg border border-nexoraBorder bg-nexoraCanvas focus:bg-white px-3.5 text-xs text-nexoraText outline-none focus:border-nexoraBrand transition-all"
                        value={basicForm.fullName}
                        onChange={(e) => setBasicForm({ ...basicForm, fullName: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="flex items-center text-[10px] font-extrabold uppercase text-nexoraMuted gap-1">
                        <span>Date of Birth</span>
                        <div className="relative group inline-block normal-case font-normal text-nexoraSubtle">
                          <HelpCircle className="w-3.5 h-3.5 hover:text-nexoraBrand cursor-help transition-colors" />
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-48 bg-black text-white text-[10px] p-2.5 rounded-lg shadow-xl z-50 text-center leading-normal">
                            {currentLanguage === 'vi'
                              ? 'Ngày sinh của bạn (phải từ 18 tuổi trở lên để xác thực).'
                              : 'Required for identity verification purposes (must be 18 years or older).'}
                            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1.5 border-4 border-transparent border-t-black"></div>
                          </div>
                        </div>
                      </label>
                      <input
                        type="date"
                        required
                        className="mt-1 h-10 w-full rounded-lg border border-nexoraBorder bg-nexoraCanvas focus:bg-white px-3.5 text-xs text-nexoraText outline-none focus:border-nexoraBrand transition-all"
                        value={basicForm.dob}
                        onChange={(e) => setBasicForm({ ...basicForm, dob: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="flex items-center text-[10px] font-extrabold uppercase text-nexoraMuted gap-1">
                        <span>Phone Number</span>
                        <div className="relative group inline-block normal-case font-normal text-nexoraSubtle">
                          <HelpCircle className="w-3.5 h-3.5 hover:text-nexoraBrand cursor-help transition-colors" />
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-48 bg-black text-white text-[10px] p-2.5 rounded-lg shadow-xl z-50 text-center leading-normal">
                            {currentLanguage === 'vi'
                              ? 'Số điện thoại chính để nhận thông báo và xác minh tài khoản.'
                              : 'Primary phone contact for administrative account alerts and verification updates.'}
                            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1.5 border-4 border-transparent border-t-black"></div>
                          </div>
                        </div>
                      </label>
                      <input
                        type="text"
                        required
                        className="mt-1 h-10 w-full rounded-lg border border-nexoraBorder bg-nexoraCanvas focus:bg-white px-3.5 text-xs text-nexoraText outline-none focus:border-nexoraBrand transition-all"
                        value={basicForm.phone}
                        onChange={(e) => setBasicForm({ ...basicForm, phone: e.target.value })}
                      />
                    </div>
                    <div className="flex gap-2 pt-2 justify-end">
                      <button
                        type="button"
                        onClick={() => setIsEditingBasic(false)}
                        className="px-3 py-1.5 border border-slate-200 rounded text-[10px] font-bold text-slate-500 hover:bg-slate-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-3 py-1.5 bg-nexoraBrand hover:bg-nexoraBrandDark text-white rounded text-[10px] font-bold"
                      >
                        Save
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-3.5 text-xs">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2 sm:py-1 gap-1">
                      <span className="text-nexoraMuted font-bold">{currentLanguage === 'vi' ? 'Họ và tên' : 'Full Name'}</span>
                      <span className="text-nexoraText font-extrabold">{profile.fullName}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2 sm:py-1 border-t border-slate-50 gap-1">
                      <span className="text-nexoraMuted font-bold">{currentLanguage === 'vi' ? 'Ngày sinh' : 'Date of Birth'}</span>
                      <span className="text-nexoraText font-extrabold">{formatDOB(profile.dob)}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2 sm:py-1 border-t border-slate-50 gap-1">
                      <span className="text-nexoraMuted font-bold">{currentLanguage === 'vi' ? 'Số điện thoại' : 'Phone Number'}</span>
                      <span className="text-nexoraText font-extrabold">{profile.phone}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Address Details */}
              <div className="rounded-xl border border-nexoraBorder bg-white shadow-sm p-6 relative">
                <div className="flex justify-between items-center border-b border-nexoraRule pb-3 mb-4">
                  <h4 className="text-xs font-black uppercase text-nexoraText tracking-wider flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-rose-500" />
                    {currentLanguage === 'vi' ? 'Chi tiết địa chỉ' : 'Address Details'}
                  </h4>
                  {!isEditingAddress && !hasKyb && (
                    <button
                      type="button"
                      onClick={startEditAddress}
                      aria-label="Edit Address Details"
                      className="text-slate-400 hover:text-nexoraBrand transition p-1 hover:bg-slate-100 rounded"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                {isEditingAddress ? (
                  <form onSubmit={saveAddress} className="space-y-4">
                    <div>
                      <label className="flex items-center text-[10px] font-extrabold uppercase text-nexoraMuted gap-1">
                        <span>Street Address</span>
                        <div className="relative group inline-block normal-case font-normal text-nexoraSubtle">
                          <HelpCircle className="w-3.5 h-3.5 hover:text-nexoraBrand cursor-help transition-colors" />
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-48 bg-black text-white text-[10px] p-2.5 rounded-lg shadow-xl z-50 text-center leading-normal">
                            {currentLanguage === 'vi'
                              ? 'Cung cấp địa chỉ thực của cửa hàng. Được sử dụng để bản địa hóa và xác minh.'
                              : 'Provide the physical location of your store. Used for localization and verification purposes.'}
                            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1.5 border-4 border-transparent border-t-black"></div>
                          </div>
                        </div>
                      </label>
                      <input
                        type="text"
                        required
                        className="mt-1 h-10 w-full rounded-lg border border-nexoraBorder bg-nexoraCanvas focus:bg-white px-3.5 text-xs text-nexoraText outline-none focus:border-nexoraBrand transition-all"
                        value={addressForm.street}
                        onChange={(e) => setAddressForm({ ...addressForm, street: e.target.value })}
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-extrabold uppercase text-nexoraMuted">City</label>
                        <input
                           type="text"
                           required
                           className="mt-1 h-10 w-full rounded-lg border border-nexoraBorder bg-nexoraCanvas focus:bg-white px-3.5 text-xs text-nexoraText outline-none focus:border-nexoraBrand transition-all"
                           value={addressForm.city}
                           onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-extrabold uppercase text-nexoraMuted">State / Province</label>
                        <input
                          type="text"
                          className="mt-1 h-10 w-full rounded-lg border border-nexoraBorder bg-nexoraCanvas focus:bg-white px-3.5 text-xs text-nexoraText outline-none focus:border-nexoraBrand transition-all"
                          value={addressForm.state}
                          onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-extrabold uppercase text-nexoraMuted">Zip Code</label>
                        <input
                          type="text"
                          required
                          className="mt-1 h-10 w-full rounded-lg border border-nexoraBorder bg-nexoraCanvas focus:bg-white px-3.5 text-xs text-nexoraText outline-none focus:border-nexoraBrand transition-all"
                          value={addressForm.zipCode}
                          onChange={(e) => setAddressForm({ ...addressForm, zipCode: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-extrabold uppercase text-nexoraMuted">Country</label>
                        <input
                          type="text"
                          required
                          className="mt-1 h-10 w-full rounded-lg border border-nexoraBorder bg-nexoraCanvas focus:bg-white px-3.5 text-xs text-nexoraText outline-none focus:border-nexoraBrand transition-all"
                          value={addressForm.country}
                          onChange={(e) => setAddressForm({ ...addressForm, country: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 pt-2 justify-end">
                      <button
                        type="button"
                        onClick={() => setIsEditingAddress(false)}
                        className="px-3 py-1.5 border border-slate-200 rounded text-[10px] font-bold text-slate-500 hover:bg-slate-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-3 py-1.5 bg-nexoraBrand hover:bg-nexoraBrandDark text-white rounded text-[10px] font-bold"
                      >
                        Save
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-3.5 text-xs">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start py-2 sm:py-1 gap-1">
                      <span className="text-nexoraMuted font-bold shrink-0">{currentLanguage === 'vi' ? 'Đường/Phố' : 'Street'}</span>
                      <span className="text-nexoraText font-extrabold sm:text-right break-words max-w-full sm:max-w-[180px]">{profile.street}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2 sm:py-1 border-t border-slate-50 gap-1">
                      <span className="text-nexoraMuted font-bold">{currentLanguage === 'vi' ? 'Thành phố' : 'City'}</span>
                      <span className="text-nexoraText font-extrabold">{profile.city}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2 sm:py-1 border-t border-slate-50 gap-1">
                      <span className="text-nexoraMuted font-bold">{currentLanguage === 'vi' ? 'Bang/Tỉnh' : 'State'}</span>
                      <span className="text-nexoraText font-extrabold">{profile.state || 'N/A'}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2 sm:py-1 border-t border-slate-50 gap-1">
                      <span className="text-nexoraMuted font-bold">Zip Code</span>
                      <span className="text-nexoraText font-extrabold font-mono">{profile.zipCode}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2 sm:py-1 border-t border-slate-50 gap-1">
                      <span className="text-nexoraMuted font-bold">{currentLanguage === 'vi' ? 'Quốc gia' : 'Country'}</span>
                      <span className="text-nexoraText font-extrabold">{profile.country}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Business Information */}
              <div className="rounded-xl border border-nexoraBorder bg-white shadow-sm p-6 relative md:col-span-2">
                <div className="flex justify-between items-center border-b border-nexoraRule pb-3 mb-4">
                  <h4 className="text-xs font-black uppercase text-nexoraText tracking-wider flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-purple-500" />
                    {currentLanguage === 'vi' ? 'Thông tin doanh nghiệp' : 'Business Information'}
                  </h4>
                  {!isEditingBusiness && !hasKyb && (
                    <button
                      type="button"
                      onClick={startEditBusiness}
                      aria-label="Edit Business Information"
                      className="text-slate-400 hover:text-nexoraBrand transition p-1 hover:bg-slate-100 rounded"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                {isEditingBusiness ? (
                  <form onSubmit={saveBusiness} className="space-y-4">
                    <div>
                      <label className="flex items-center text-[10px] font-extrabold uppercase text-nexoraMuted gap-1">
                        <span>Business Name</span>
                        <div className="relative group inline-block normal-case font-normal text-nexoraSubtle">
                          <HelpCircle className="w-3.5 h-3.5 hover:text-nexoraBrand cursor-help transition-colors" />
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-48 bg-black text-white text-[10px] p-2.5 rounded-lg shadow-xl z-50 text-center leading-normal">
                            {currentLanguage === 'vi'
                              ? 'Nhập tên hợp pháp hoặc tên công khai của cửa hàng/salon của bạn sẽ hiển thị trên màn hình thanh toán của khách hàng.'
                              : 'Enter the legal or public name of your store/salon as it will appear on customer payment screens.'}
                            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1.5 border-4 border-transparent border-t-black"></div>
                          </div>
                        </div>
                      </label>
                      <input
                        type="text"
                        required
                        className="mt-1 h-10 w-full rounded-lg border border-nexoraBorder bg-nexoraCanvas focus:bg-white px-3.5 text-xs text-nexoraText outline-none focus:border-nexoraBrand transition-all"
                        value={businessForm.businessName}
                        onChange={(e) => setBusinessForm({ ...businessForm, businessName: e.target.value })}
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-extrabold uppercase text-nexoraMuted">Business Phone</label>
                        <input
                          type="text"
                          required
                          className="mt-1 h-10 w-full rounded-lg border border-nexoraBorder bg-nexoraCanvas focus:bg-white px-3.5 text-xs text-nexoraText outline-none focus:border-nexoraBrand transition-all"
                          value={businessForm.businessPhone}
                          onChange={(e) => setBusinessForm({ ...businessForm, businessPhone: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-extrabold uppercase text-nexoraMuted">Business Email</label>
                        <input
                          type="email"
                          required
                          className="mt-1 h-10 w-full rounded-lg border border-nexoraBorder bg-nexoraCanvas focus:bg-white px-3.5 text-xs text-nexoraText outline-none focus:border-nexoraBrand transition-all"
                          value={businessForm.businessEmail}
                          onChange={(e) => setBusinessForm({ ...businessForm, businessEmail: e.target.value })}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-extrabold uppercase text-nexoraMuted">Website</label>
                      <input
                        type="text"
                        className="mt-1 h-10 w-full rounded-lg border border-nexoraBorder bg-nexoraCanvas focus:bg-white px-3.5 text-xs text-nexoraText outline-none focus:border-nexoraBrand transition-all"
                        value={businessForm.businessWebsite}
                        onChange={(e) => setBusinessForm({ ...businessForm, businessWebsite: e.target.value })}
                      />
                    </div>
                    <div className="flex gap-2 pt-2 justify-end">
                      <button
                        type="button"
                        onClick={() => setIsEditingBusiness(false)}
                        className="px-3 py-1.5 border border-slate-200 rounded text-[10px] font-bold text-slate-500 hover:bg-slate-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-3 py-1.5 bg-nexoraBrand hover:bg-nexoraBrandDark text-white rounded text-[10px] font-bold"
                      >
                        Save
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-3.5 text-xs">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2 sm:py-1 gap-1">
                      <span className="text-nexoraMuted font-bold">{currentLanguage === 'vi' ? 'Tên doanh nghiệp' : 'Business Name'}</span>
                      <span className="text-nexoraText font-extrabold">{profile.businessName}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2 sm:py-1 border-t border-slate-50 gap-1">
                      <span className="text-nexoraMuted font-bold">{currentLanguage === 'vi' ? 'Số điện thoại' : 'Phone'}</span>
                      <span className="text-nexoraText font-extrabold">{profile.businessPhone}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2 sm:py-1 border-t border-slate-50 gap-1">
                      <span className="text-nexoraMuted font-bold">Email</span>
                      <span className="text-nexoraText font-extrabold">{profile.businessEmail}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2 sm:py-1 border-t border-slate-50 gap-1">
                      <span className="text-nexoraMuted font-bold">Website</span>
                      {profile.businessWebsite ? (
                        <a
                          href={profile.businessWebsite}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-nexoraBrand hover:underline font-extrabold flex items-center gap-0.5"
                        >
                          {profile.businessWebsite.replace(/^https?:\/\//, '')} <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : (
                        <span className="text-nexoraSubtle font-medium">N/A</span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Nested Location Map and Sponsor Information Grid */}
                {/* Location Map */}
                <div className="rounded-xl border border-nexoraBorder bg-white shadow-sm p-6 relative overflow-hidden flex flex-col justify-between">
                  <div className="flex justify-between items-center border-b border-nexoraRule pb-3 mb-4">
                    <h4 className="text-xs font-black uppercase text-nexoraText tracking-wider flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-sky-500" />
                      {currentLanguage === 'vi' ? 'Bản đồ vị trí' : 'Location Map'}
                    </h4>
                  </div>
                  <div className="h-[220px] w-full rounded-lg border border-slate-200 overflow-hidden bg-slate-100">
                    <iframe
                      title="Business Location Map"
                      src="https://maps.google.com/maps?q=Palm%20Beach,%20QLD,%20Australia&t=&z=14&ie=UTF8&iwloc=&output=embed"
                      className="w-full h-full border-0 grayscale-[10%]"
                      allowFullScreen=""
                      loading="lazy"
                    ></iframe>
                  </div>
                </div>

                {/* Review Links */}
                <div className="rounded-xl border border-nexoraBorder bg-white shadow-sm p-6 relative">
                  <div className="flex justify-between items-center border-b border-nexoraRule pb-3 mb-4">
                    <h4 className="text-xs font-black uppercase text-nexoraText tracking-wider flex items-center gap-2">
                      <Globe className="h-4 w-4 text-emerald-500" />
                      {currentLanguage === 'vi' ? 'Liên kết đánh giá' : 'Review Links'}
                    </h4>
                    {!isEditingReviews && (
                      <button
                        type="button"
                        onClick={startEditReviews}
                        aria-label="Edit Review Links"
                        className="text-slate-400 hover:text-nexoraBrand transition p-1 hover:bg-slate-100 rounded"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>

                  {isEditingReviews ? (
                    <form onSubmit={saveReviews} className="space-y-4">
                      <div>
                        <label className="text-[10px] font-extrabold uppercase text-nexoraMuted">Google Review Link</label>
                        <input
                          type="url"
                          required
                          className="mt-1 h-10 w-full rounded-lg border border-nexoraBorder bg-nexoraCanvas focus:bg-white px-3.5 text-xs text-nexoraText outline-none focus:border-nexoraBrand transition-all"
                          value={reviewsForm.googleReview}
                          onChange={(e) => setReviewsForm({ ...reviewsForm, googleReview: e.target.value })}
                          placeholder="https://g.page/r/.../review"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-extrabold uppercase text-nexoraMuted">Yelp Review Link</label>
                        <input
                          type="url"
                          required
                          className="mt-1 h-10 w-full rounded-lg border border-nexoraBorder bg-nexoraCanvas focus:bg-white px-3.5 text-xs text-nexoraText outline-none focus:border-nexoraBrand transition-all"
                          value={reviewsForm.yelpReview}
                          onChange={(e) => setReviewsForm({ ...reviewsForm, yelpReview: e.target.value })}
                          placeholder="https://www.yelp.com/biz/..."
                        />
                      </div>
                      <div className="flex gap-2 pt-2 justify-end">
                        <button
                          type="button"
                          onClick={() => setIsEditingReviews(false)}
                          className="px-3 py-1.5 border border-slate-200 rounded text-[10px] font-bold text-slate-500 hover:bg-slate-50"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-3 py-1.5 bg-nexoraBrand hover:bg-nexoraBrandDark text-white rounded text-[10px] font-bold"
                        >
                          Save
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="space-y-3.5 text-xs">
                      <div className="flex flex-col py-1.5 border-b border-slate-50 gap-1">
                        <span className="text-nexoraMuted font-bold">Google Review Link</span>
                        {profile.googleReview ? (
                          <a
                            href={profile.googleReview}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-nexoraBrand hover:underline font-extrabold flex items-center gap-0.5 break-all text-[11px]"
                          >
                            {profile.googleReview} <ExternalLink className="h-3 w-3 shrink-0" />
                          </a>
                        ) : (
                          <span className="text-nexoraSubtle font-medium">Not Configured</span>
                        )}
                      </div>
                      <div className="flex flex-col py-1.5 border-b border-slate-50 gap-1">
                        <span className="text-nexoraMuted font-bold">Yelp Review Link</span>
                        {profile.yelpReview ? (
                          <a
                            href={profile.yelpReview}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-nexoraBrand hover:underline font-extrabold flex items-center gap-0.5 break-all text-[11px]"
                          >
                            {profile.yelpReview} <ExternalLink className="h-3 w-3 shrink-0" />
                          </a>
                        ) : (
                          <span className="text-nexoraSubtle font-medium">Not Configured</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

            </div>

          </div>
        )}

        {/* ================= KYB (KNOW YOUR BUSINESS) TAB ================= */}
        {activeTab === 'kyb' && (
          <div className="space-y-6 animate-fadeIn">
            
            {/* Status Card */}
            {cardDetails && (
              <div className={`rounded-xl border p-5 sm:p-6 flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4 shadow-nexora-soft ${cardDetails.bgClass}`}>
                <div className="flex gap-4 items-start text-center sm:text-left flex-col sm:flex-row">
                  <span className={`flex h-12 w-12 items-center justify-center rounded-2xl shrink-0 shadow-sm text-white ${cardDetails.iconBg}`}>
                    <cardDetails.icon className="h-6 w-6" />
                  </span>
                  
                  <div className="space-y-1">
                    <h3 className="text-sm font-black uppercase tracking-wider">
                      {cardDetails.title}
                    </h3>
                    <p className="text-xs font-semibold opacity-85 leading-relaxed max-w-2xl">
                      {cardDetails.description}
                    </p>
                    {cardDetails.subText && (
                      <div className="text-[10px] font-bold bg-white/50 border border-emerald-200/50 inline-block px-2.5 py-0.5 rounded mt-2">
                        {cardDetails.subText}
                      </div>
                    )}
                  </div>
                </div>

                {cardDetails.ctaText && (
                  <button
                    type="button"
                    onClick={cardDetails.ctaAction}
                    className="shrink-0 rounded-lg bg-nexoraBrand hover:bg-nexoraBrandDark text-white px-4 py-2.5 text-xs font-bold transition shadow-sm animate-pulse"
                  >
                    {showPortal ? (currentLanguage === 'vi' ? 'Đóng Form' : 'Close Form') : cardDetails.ctaText}
                  </button>
                )}
              </div>
            )}

            {showPortal && verificationStatus !== 'kyb_approved' ? (
              /* Simulated browser window border with Secure Iframe */
              <div className="border border-slate-300 rounded-xl overflow-hidden shadow-md bg-[#EDF2F7] animate-fadeIn">
                {/* Browser bar */}
                <div className="bg-slate-200 border-b border-slate-300 px-4 py-2 flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-400"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-400"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-green-400"></div>
                  </div>
                  <div className="bg-white rounded-md border border-slate-300 text-[10px] text-slate-500 font-mono px-3 py-0.5 flex-grow text-center select-none truncate">
                    https://gateway.vlinkpay.com/merchant/kyb?merchant_email={encodeURIComponent(profile.email || '')}
                  </div>
                </div>

                {/* Iframe Content */}
                <div className="bg-white p-5 sm:p-8 min-h-[400px] relative">
                  {isSubmittingKyb && (
                    <div className="absolute inset-0 bg-white/95 z-20 flex flex-col items-center justify-center space-y-4">
                      <div className="w-12 h-12 border-4 border-nexoraBrand/20 border-t-nexoraBrand rounded-full animate-spin"></div>
                      <p className="text-xs text-nexoraBrand font-bold uppercase tracking-wider animate-pulse">
                        {currentLanguage === 'vi' ? 'Đang gửi thông tin xác thực...' : 'Submitting KYB details...'}
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
                        <p className="text-[9px] text-slate-400">Merchant Underwriting & Compliance</p>
                      </div>
                    </div>
                    <span className="text-[9px] text-emerald-600 font-bold bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200">
                      SECURE OAUTH 2.0
                    </span>
                  </div>

                  {kybErrors.kyb && (
                    <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
                      {kybErrors.kyb}
                    </div>
                  )}

                  <form onSubmit={handleKybSubmit} className="space-y-4 text-left">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Legal Business Name */}
                      <div>
                        <label className="block text-[9px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                          {currentLanguage === 'vi' ? 'Tên pháp lý doanh nghiệp' : 'Legal Business Name'}
                        </label>
                        <input 
                          type="text"
                          required
                          placeholder="e.g. Golden Glow Nails LLC"
                          className="w-full bg-slate-50 border border-slate-300 focus:border-blue-500 focus:bg-white rounded px-3 h-9 text-xs text-slate-800 focus:outline-none transition-colors"
                          value={kybData.legalName}
                          onChange={(e) => setKybData({ ...kybData, legalName: e.target.value })}
                        />
                      </div>

                      {/* Tax ID */}
                      <div>
                        <label className="block text-[9px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                          {currentLanguage === 'vi' ? 'Mã số thuế / EIN' : 'Tax ID / EIN'}
                        </label>
                        <input 
                          type="text"
                          required
                          placeholder="e.g. XX-XXXXXXX"
                          className="w-full bg-slate-50 border border-slate-300 focus:border-blue-500 focus:bg-white rounded px-3 h-9 text-xs text-slate-800 focus:outline-none transition-colors"
                          value={kybData.taxId}
                          onChange={(e) => setKybData({ ...kybData, taxId: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Business Structure */}
                      <div>
                        <label className="block text-[9px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                          {currentLanguage === 'vi' ? 'Hình thức doanh nghiệp' : 'Business Structure'}
                        </label>
                        <CustomSelect
                          size="sm"
                          buttonClass="bg-slate-50 border-slate-300 focus:bg-white focus:border-blue-500 text-xs text-slate-800 font-normal focus:ring-0 rounded"
                          value={kybData.businessType}
                          onChange={(e) => setKybData({ ...kybData, businessType: e.target.value })}
                          options={[
                            { value: 'LLC', label: 'LLC (Limited Liability Co.)' },
                            { value: 'Corp', label: 'Corporation' },
                            { value: 'Sole', label: 'Sole Proprietorship' },
                            { value: 'Partnership', label: 'Partnership' }
                          ]}
                        />
                      </div>

                      {/* Owner Representative */}
                      <div>
                        <label className="block text-[9px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                          {currentLanguage === 'vi' ? 'Người đại diện pháp luật' : 'Representative Owner Name'}
                        </label>
                        <input 
                          type="text"
                          required
                          placeholder="Representative full name"
                          className="w-full bg-slate-50 border border-slate-300 focus:border-blue-500 focus:bg-white rounded px-3 h-9 text-xs text-slate-800 focus:outline-none transition-colors"
                          value={kybData.ownerName}
                          onChange={(e) => setKybData({ ...kybData, ownerName: e.target.value })}
                        />
                      </div>
                    </div>

                    {/* Settlement bank section */}
                    <div className="border-t border-slate-100 pt-4 mt-2">
                      <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-3">
                        Merchant Settlement Account Info (Tài khoản nhận tiền)
                      </h5>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[9px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                            {currentLanguage === 'vi' ? 'Tên ngân hàng' : 'Bank Name'}
                          </label>
                          <input 
                            type="text"
                            required
                            placeholder="e.g. Chase Bank"
                            className="w-full bg-slate-50 border border-slate-300 focus:border-blue-500 focus:bg-white rounded px-3 h-9 text-xs text-slate-800 focus:outline-none transition-colors"
                            value={kybData.bankName}
                            onChange={(e) => setKybData({ ...kybData, bankName: e.target.value })}
                          />
                        </div>

                        <div>
                          <label className="block text-[9px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                            {currentLanguage === 'vi' ? 'Số tài khoản' : 'Account Number'}
                          </label>
                          <div className="relative">
                            <input 
                              type={showKybBankAccount ? "text" : "password"}
                              required
                              placeholder="Account Number"
                              className="w-full bg-slate-50 border border-slate-300 focus:border-blue-500 focus:bg-white rounded pl-3 pr-10 h-9 text-xs text-slate-800 focus:outline-none transition-colors"
                              value={kybData.bankAccount}
                              onChange={(e) => setKybData({ ...kybData, bankAccount: e.target.value })}
                            />
                            <button
                              type="button"
                              onClick={() => setShowKybBankAccount(!showKybBankAccount)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                            >
                              {showKybBankAccount ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="block text-[9px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                            {currentLanguage === 'vi' ? 'Mã định tuyến (Routing)' : 'Routing Code'}
                          </label>
                          <input 
                            type="text"
                            required
                            placeholder="Routing Code"
                            className="w-full bg-slate-50 border border-slate-300 focus:border-blue-500 focus:bg-white rounded px-3 h-9 text-xs text-slate-800 focus:outline-none transition-colors"
                            value={kybData.bankRouting}
                            onChange={(e) => setKybData({ ...kybData, bankRouting: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 flex items-center justify-end gap-3">
                      <button 
                        type="button"
                        onClick={() => setShowPortal(false)}
                        className="px-4 py-2.5 border border-slate-300 hover:bg-slate-50 text-slate-700 font-extrabold text-xs uppercase tracking-wider rounded transition"
                      >
                        {currentLanguage === 'vi' ? 'Hủy' : 'Cancel'}
                      </button>
                      <button 
                        type="submit"
                        className="px-6 py-2.5 bg-[#2B59FF] hover:bg-blue-700 text-white font-extrabold text-xs uppercase tracking-wider rounded flex items-center gap-1.5 transition shadow-sm"
                      >
                        <ShieldCheck className="w-4 h-4" /> {currentLanguage === 'vi' ? 'Gửi hồ sơ KYB' : 'Submit KYB'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
                
                {/* Card 1: Registered Company Dossier (2/3 width) */}
                <div className="lg:col-span-2 rounded-xl border border-nexoraBorder bg-white shadow-sm p-6 space-y-4">
                  <div className="flex justify-between items-center border-b border-nexoraRule pb-3 mb-2">
                    <h4 className="text-xs font-black uppercase text-nexoraText tracking-wider flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-slate-600" />
                      {currentLanguage === 'vi' ? 'Hồ sơ pháp lý công ty' : 'Registered Company Dossier'}
                    </h4>
                  </div>

                  <div className="space-y-3.5 text-xs">
                    <div className="flex flex-col py-1.5 border-b border-slate-50 gap-1">
                      <span className="text-nexoraMuted font-semibold">Legal Company Name</span>
                      <span className="text-nexoraText font-extrabold">{profile.businessName || 'Pending Submission'}</span>
                    </div>
                    <div className="flex flex-col py-1.5 border-b border-slate-50 gap-1">
                      <span className="text-nexoraMuted font-semibold">Tax ID / EIN</span>
                      <span className="font-mono text-nexoraText font-extrabold">
                        {verificationStatus === 'kyb_approved' ? 'XX-XXX9832' : (verificationStatus === 'verified_lite' ? 'XX-XXX4192' : 'Pending Verification')}
                      </span>
                    </div>
                    <div className="flex flex-col py-1.5 border-b border-slate-50 gap-1">
                      <span className="text-nexoraMuted font-semibold">Business Entity Type</span>
                      <span className="text-nexoraText font-extrabold">LLC (Limited Liability Co.)</span>
                    </div>
                    <div className="flex flex-col py-1.5 border-b border-slate-50 gap-1">
                      <span className="text-nexoraMuted font-semibold">Authorized Representative</span>
                      <span className="text-nexoraText font-extrabold">{profile.fullName}</span>
                    </div>
                    <div className="flex flex-col py-1.5 border-b border-slate-50 gap-1">
                      <span className="text-nexoraMuted font-semibold">Industry classification (MCC)</span>
                      <span className="text-nexoraText font-extrabold">7230 - Nails & Beauty</span>
                    </div>
                    <div className="flex flex-col py-1.5 border-b border-slate-50 gap-1">
                      <span className="text-nexoraMuted font-semibold">Corporate Address</span>
                      <span className="text-nexoraText font-extrabold truncate" title={profile.street}>{profile.street || 'Pending'}</span>
                    </div>
                  </div>
                </div>

                {/* Card 2: Settlement Account Info (1/3 width) */}
                <div className="lg:col-span-1 rounded-xl border border-nexoraBorder bg-white shadow-sm p-6 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-center border-b border-nexoraRule pb-3 mb-4">
                      <h4 className="text-xs font-black uppercase text-nexoraText tracking-wider flex items-center gap-2">
                        <Landmark className="h-4 w-4 text-emerald-600" />
                        {currentLanguage === 'vi' ? 'Tài khoản thanh toán nhận tiền' : 'Settlement Account Details'}
                      </h4>
                    </div>

                    <div className="space-y-4 text-xs">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2 sm:py-1 gap-1">
                        <span className="text-nexoraMuted font-semibold">Bank Institution</span>
                        <span className="text-nexoraText font-extrabold">{(verificationStatus === 'kyb_approved' || verificationStatus === 'verified_lite') ? 'Chase Bank, N.A.' : 'N/A'}</span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2 sm:py-1 border-t border-slate-50 gap-1">
                        <span className="text-nexoraMuted font-semibold">Routing (ABA)</span>
                        <span className="font-mono text-nexoraText font-extrabold">{(verificationStatus === 'kyb_approved' || verificationStatus === 'verified_lite') ? '021000021' : 'N/A'}</span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2 sm:py-1 border-t border-slate-50 gap-1">
                        <span className="text-nexoraMuted font-semibold">Account Number</span>
                        <span className="font-mono text-nexoraText font-extrabold">{(verificationStatus === 'kyb_approved' || verificationStatus === 'verified_lite') ? '•••• 9832' : 'N/A'}</span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2 sm:py-1 border-t border-slate-50 gap-1">
                        <span className="text-nexoraMuted font-semibold">Payout frequency</span>
                        <span className="text-emerald-600 font-extrabold">
                          {verificationStatus === 'kyb_approved' ? 'Instant Settlement (24/7)' : (verificationStatus === 'verified_lite' ? 'Next-Day ACH Settlement' : 'N/A')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {verificationStatus === 'kyb_approved' ? (
                    <button
                      type="button"
                      onClick={() => showToast(currentLanguage === 'vi' ? 'Để thay đổi tài khoản nhận vui lòng liên hệ hỗ trợ.' : 'To modify receiving targets, contact client support.')}
                      className="w-full mt-5 rounded-lg border border-slate-200 py-2 text-center text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                    >
                      Change Settlement Target
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowPortal(true)}
                      disabled={verificationStatus === 'lite_pending' || verificationStatus === 'pro_pending'}
                      className={`w-full mt-5 rounded-lg py-2 text-center text-xs font-bold transition text-white
                        ${(verificationStatus === 'lite_pending' || verificationStatus === 'pro_pending')
                          ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                          : 'bg-nexoraBrand hover:bg-nexoraBrandDark'
                        }`}
                    >
                      {currentLanguage === 'vi' ? 'Liên kết Ngân hàng Thanh toán' : 'Link Settlement Bank'}
                    </button>
                  )}
                </div>

                {/* Card 3: Uploaded Compliance Documents (full width) */}
                <div className="lg:col-span-3 rounded-xl border border-nexoraBorder bg-white shadow-sm p-6">
                  <div className="flex justify-between items-center border-b border-nexoraRule pb-3 mb-4">
                    <h4 className="text-xs font-black uppercase text-nexoraText tracking-wider flex items-center gap-2">
                      <FileText className="h-4 w-4 text-blue-500" />
                      {currentLanguage === 'vi' ? 'Hồ sơ tài liệu xác thực' : 'Uploaded Compliance Documents'}
                    </h4>
                  </div>

                  {(verificationStatus === 'kyb_approved' || verificationStatus === 'verified_lite') ? (
                    <div className="divide-y divide-slate-100">
                      <div className="flex items-center justify-between py-3.5 text-xs">
                        <div className="flex items-center gap-3">
                          <span className="h-9 w-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">PDF</span>
                          <div>
                            <p className="font-extrabold text-slate-800 truncate max-w-[120px] sm:max-w-[150px]">Articles_of_Organization_LLC.pdf</p>
                            <p className="text-[10px] text-slate-400">1.4 MB • Verified & Uploaded</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] font-black uppercase rounded">Verified</span>
                          <button className="p-1.5 border border-slate-200 hover:bg-slate-50 rounded text-slate-500 transition" title="Download">
                            <Download className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between py-3.5 text-xs">
                        <div className="flex items-center gap-3">
                          <span className="h-9 w-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">PDF</span>
                          <div>
                            <p className="font-extrabold text-slate-800 truncate max-w-[120px] sm:max-w-[150px]">IRS_EIN_Tax_Confirmation_Letter.pdf</p>
                            <p className="text-[10px] text-slate-400">680 KB • Verified & Uploaded</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] font-black uppercase rounded">Verified</span>
                          <button className="p-1.5 border border-slate-200 hover:bg-slate-50 rounded text-slate-500 transition" title="Download">
                            <Download className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="py-8 text-center text-slate-400">
                      <FileText className="h-10 w-10 text-slate-200 mx-auto mb-2" />
                      <p className="text-xs font-semibold">No compliance documents submitted yet.</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Documents uploaded during compliance registration will display here.</p>
                    </div>
                  )}
                </div>

              </div>
            )}

            {/* Legal Disclosures */}
            <div className="rounded-xl border border-nexoraBorder bg-slate-50 p-6 space-y-4 text-xs mt-6 text-nexoraMuted select-text">
              <h5 className="font-bold text-nexoraText uppercase tracking-wider border-b border-slate-200 pb-2">
                {currentLanguage === 'vi' ? 'Công bố pháp lý & Điều khoản' : 'Legal Disclosures & Terms'}
              </h5>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-1">
                  <h6 className="font-extrabold text-slate-700">
                    {currentLanguage === 'vi' ? '1. Báo cáo thu nhập IRS' : '1. IRS Income Reporting'}
                  </h6>
                  <p className="leading-relaxed text-[11px]">
                    {currentLanguage === 'vi'
                      ? 'Theo quy định 1099-K của IRS, thu nhập từ tiền típ được xử lý qua các cổng này phải báo cáo thuế hàng năm.'
                      : 'Under 1099-K regulations, tipping income processed through these gateways is subject to annual IRS reporting.'}
                  </p>
                </div>
                <div className="space-y-1">
                  <h6 className="font-extrabold text-slate-700">
                    {currentLanguage === 'vi' ? '2. Tuyên bố miễn trừ tiết kiệm' : '2. Savings Disclaimer'}
                  </h6>
                  <p className="leading-relaxed text-[11px]">
                    {currentLanguage === 'vi'
                      ? 'Mức tiết kiệm chi phí xử lý ước tính được tính toán so với phí đại lý tiêu chuẩn ngành và không được bảo đảm.'
                      : 'Estimated processing savings are calculated relative to industry standard merchant processing fees and are not guaranteed.'}
                  </p>
                </div>
                <div className="space-y-1">
                  <h6 className="font-extrabold text-slate-700">
                    {currentLanguage === 'vi' ? '3. Điều khoản dịch vụ' : '3. Terms of Service'}
                  </h6>
                  <p className="leading-relaxed text-[11px]">
                    {currentLanguage === 'vi'
                      ? 'Việc sử dụng dịch vụ đồng nghĩa với việc đồng ý với các điều khoản tuân thủ doanh nghiệp và chính sách thẩm định của VLINKPAY.'
                      : 'Usage constitutes agreement with VLINKPAY corporate compliance terms and underwriting policies.'}
                  </p>
                </div>
              </div>
            </div>

          </div>
        )}

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
          bankwire: currentLanguage === 'vi' ? 'Số tài khoản & Số Routing...' : 'Enter Bank Wire routing - account...',
          paypal: currentLanguage === 'vi' ? 'Nhập PayPal email...' : 'Enter PayPal email...',
          venmo: currentLanguage === 'vi' ? 'Nhập Venmo @username...' : 'Enter Venmo @username...',
          cashapp: currentLanguage === 'vi' ? 'Nhập Cash App $cashtag...' : 'Enter Cash App $cashtag...',
          applecash: currentLanguage === 'vi' ? 'Nhập số điện thoại...' : 'Enter Apple Cash phone number...'
        }

        return (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl border border-slate-100 max-w-sm w-full shadow-2xl p-6 relative overflow-hidden animate-scaleIn text-left space-y-4.5">
              
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
                    {currentLanguage === 'vi'
                      ? `${walletNames[editingMethod]?.toUpperCase()} EMAIL/SĐT CỦA BẠN *`
                      : `YOUR ${walletNames[editingMethod]?.toUpperCase()} EMAIL/PHONE *`}
                  </label>
                  <input
                    type="text"
                    required
                    autoFocus
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
                        <div className="text-sm font-extrabold text-slate-800">{walletNames[editingMethod]}</div>
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
                    className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow-sm transition"
                  >
                    {currentLanguage === 'vi' ? 'LƯU LẠI' : 'SAVE'}
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
