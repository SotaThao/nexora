import { useState, useEffect } from 'react'
import { ShieldCheck, ShieldAlert } from 'lucide-react'
import { useTranslation } from '../../../contexts/LanguageContext'
import { logger } from '../../../utils/logger'
import { useProfileSettings, useSaveProfileSettings } from '../../../data/hooks/useProfileSettings'
import { useMerchantSetup, useSaveMerchantSetup } from '../../../data/hooks/useMerchantSetup'
import { usePendingAccounts, useReplaceAllPendingAccounts } from '../../../data/hooks/usePendingAccounts'

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

export default function useSettingsForm({
  setupData,
  hasKyb,
  userEmail,
  onKybRequired,
  initialTab,
  onTabChange,
  onKybSuccess,
  verificationStatus
}) {
  const { t, currentLanguage } = useTranslation()
  const profileSettingsQuery = useProfileSettings()
  const saveProfileSettingsMutation = useSaveProfileSettings()
  const merchantSetupQuery = useMerchantSetup()
  const saveMerchantSetupMutation = useSaveMerchantSetup()
  const pendingAccountsQuery = usePendingAccounts()
  const replaceAllPendingAccountsMutation = useReplaceAllPendingAccounts()
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
    setTimeout(async () => {
      setIsSubmittingKyb(false)
      const existingAccounts = pendingAccountsQuery.data ?? []
      const targetEmail = profile.email || 'sso_no_kyb@gmail.com'
      const existing = existingAccounts.find(acc => acc.email === targetEmail)
      const newAccount = {
        email: targetEmail,
        password: existing ? existing.password : '••••••••',
        referralCode: existing ? existing.referralCode : '',
        isVerified: true,
        kybDetails: { ...kybData }
      }
      const filtered = existingAccounts.filter(acc => acc.email !== targetEmail)
      filtered.push(newAccount)
      await replaceAllPendingAccountsMutation.mutateAsync(filtered)
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

  // Load profile settings from Query cache or sync with setupData
  useEffect(() => {
    if (profileSettingsQuery.data) {
      setProfile(prev => ({ ...prev, ...profileSettingsQuery.data }))
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
  }, [profileSettingsQuery.data, setupData, hasKyb, userEmail])

  const saveProfile = (updatedProfile) => {
    setProfile(updatedProfile)
    saveProfileSettingsMutation.mutate(updatedProfile)
    showToast(currentLanguage === 'vi' ? 'Đã cập nhật cài đặt thành công!' : 'Settings updated successfully!')
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

    // Update merchantSetup businessInfo via repository to synchronize with other views
    const currentSetup = merchantSetupQuery.data
    if (currentSetup) {
      const updatedSetup = {
        ...currentSetup,
        businessInfo: {
          ...(currentSetup.businessInfo || {}),
          name: businessForm.businessName,
          phone: businessForm.businessPhone,
          businessEmail: businessForm.businessEmail,
          website: businessForm.businessWebsite
        }
      }
      saveMerchantSetupMutation.mutate(updatedSetup)
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

    // Update merchantSetup reviewLinks via repository to synchronize with other views
    const currentSetup = merchantSetupQuery.data
    if (currentSetup) {
      const updatedSetup = {
        ...currentSetup,
        reviewLinks: {
          ...(currentSetup.reviewLinks || {}),
          googleReview: reviewsForm.googleReview,
          yelpReview: reviewsForm.yelpReview
        }
      }
      saveMerchantSetupMutation.mutate(updatedSetup)
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

    // Update merchantSetup businessInfo paymentAccounts via repository to synchronize with other views
    const currentSetup = merchantSetupQuery.data
    if (currentSetup) {
      const updatedSetup = {
        ...currentSetup,
        businessInfo: {
          ...(currentSetup.businessInfo || {}),
          paymentAccounts: updatedAccounts,
          payoutQrCodes: updatedQrCodes
        }
      }
      saveMerchantSetupMutation.mutate(updatedSetup)
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

  return {
    // tab state
    activeTab,
    handleTabChange,
    // kyb state
    kybData,
    setKybData,
    isSubmittingKyb,
    kybErrors,
    showPortal,
    setShowPortal,
    handleKybSubmit,
    // profile state
    profile,
    copiedId,
    toastMessage,
    // edit states
    isEditingBasic,
    setIsEditingBasic,
    basicForm,
    setBasicForm,
    isEditingAddress,
    setIsEditingAddress,
    addressForm,
    setAddressForm,
    isEditingBusiness,
    setIsEditingBusiness,
    businessForm,
    setBusinessForm,
    isEditingReviews,
    setIsEditingReviews,
    reviewsForm,
    setReviewsForm,
    editingMethod,
    setEditingMethod,
    editValue,
    setEditValue,
    editQrCode,
    setEditQrCode,
    isCapturing,
    modalError,
    setModalError,
    // handlers
    saveProfile,
    showToast,
    handleCopy,
    startEditBasic,
    saveBasic,
    startEditAddress,
    saveAddress,
    startEditBusiness,
    saveBusiness,
    startEditReviews,
    saveReviews,
    handleToggleMethod,
    handleEditPayoutAccount,
    handleModalFileChange,
    handleModalTakePhoto,
    handleModalClearQr,
    savePayoutAccount,
    handleAvatarChange,
    formatDOB,
    getStatusCardDetails,
    currentLanguage,
  }
}
