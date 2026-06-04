import { useState, useEffect, useMemo } from 'react'
import { useTranslation } from '../../../contexts/LanguageContext'
import { parsePhone } from '../../CountryCodeSelect'
import { MOCK_NEXORA_STAFF_PROFILES } from '../../staff-registration/hooks/useStaffRegistration'
import { useReplaceAllPendingAccounts, usePendingAccounts } from '../../../data/hooks/usePendingAccounts'
import { useMerchantSetup, useSaveMerchantSetup } from '../../../data/hooks/useMerchantSetup'
import { useNotifications, useAddNotification } from '../../../data/hooks/useNotifications'
import { logger } from '../../../utils/logger'

export function useRegisterForm({ ssoEmail, onBackToLogin, onRegisterSuccess, onRegisterAndLogin, onKybSuccess, isRedirectedFromSession }) {
  const { t, currentLanguage, setLanguage, renderLabel } = useTranslation()
  const replaceAllPendingAccountsMutation = useReplaceAllPendingAccounts()
  const pendingAccountsQuery = usePendingAccounts()
  const merchantSetupQuery = useMerchantSetup()
  const saveMerchantSetupMutation = useSaveMerchantSetup()
  useNotifications()
  const addNotificationMutation = useAddNotification()
  const [currentStep, setCurrentStep] = useState(0)
  const [role, setRole] = useState('business')

  // Step 1 states
  const [email, setEmail] = useState(ssoEmail || '')
  const [confirmEmail, setConfirmEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [referralCode, setReferralCode] = useState('')
  const [fullName, setFullName] = useState('')
  const [termsAccepted, setTermsAccepted] = useState(true)
  const [showTermsModal, setShowTermsModal] = useState(false)
  const [modalType, setModalType] = useState('terms')
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
  const [vlinkpayStatus, setVlinkpayStatus] = useState('idle')
  const [vlinkpayTimeout, setVlinkpayTimeout] = useState(null)

  // Validation errors
  const [errors, setErrors] = useState({})

  useEffect(() => {
    let interval = null
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer(prev => prev - 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [resendTimer])

  useEffect(() => {
    return () => {
      if (vlinkpayTimeout) clearTimeout(vlinkpayTimeout)
    }
  }, [vlinkpayTimeout])

  const phoneParsed = useMemo(() => parsePhone(phone), [phone])

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
      const emailPrefix = email.split('@')[0].toUpperCase()
      const initials = emailPrefix.slice(0, 3) || 'STAFF'
      const randomDigits = Math.floor(1000 + Math.random() * 9000)
      const staffId = `NEX-STAFF-${initials}${randomDigits}`
      setGeneratedStaffId(staffId)
      setVlinkpayId(`VLP-${randomDigits}-${initials}`)

      setShowOtpInput(true)
      setOtpCode('')
      setOtpError('')
      setResendTimer(30)
    } else {
      setOtpCode('')
      setOtpError('')
      setResendTimer(30)
      setCurrentStep(2)
    }
  }

  const handleVerifyOtp = (e) => {
    e.preventDefault()
    if (otpCode === '1234') {
      setOtpError('')

      if (role === 'business') {
        const existingAccounts = pendingAccountsQuery.data ?? []
        const newAccount = {
          email: email.trim().toLowerCase(),
          password: password,
          referralCode: referralCode.trim(),
          role: role,
          fullName: null,
          staffId: null,
          isVerified: false,
          kybDetails: null
        }

        // Replace entire list to de-dupe by email, then add new
        const filtered = existingAccounts.filter(acc => acc.email !== newAccount.email)
        filtered.push(newAccount)
        // Fire-and-forget: invoke callback immediately (same user-observable timing as before),
        // and let the mutation persist in the background.
        replaceAllPendingAccountsMutation.mutate(filtered)

        if (onRegisterAndLogin) {
          onRegisterAndLogin(email.trim().toLowerCase())
        } else if (onRegisterSuccess) {
          onRegisterSuccess()
        }
      } else {
        setShowOtpInput(false)
        setCurrentStep(2)
      }
    } else {
      setOtpError(currentLanguage === 'vi' ? 'Mã OTP không chính xác. Thử lại với 1234.' : 'Invalid OTP. Try again with 1234.')
    }
  }

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

    const existingAccounts = pendingAccountsQuery.data ?? []
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
    const filteredPending = existingAccounts.filter(acc => acc.email !== newAccount.email)
    filteredPending.push(newAccount)
    replaceAllPendingAccountsMutation.mutate(filteredPending)

    let parsedSetup = merchantSetupQuery.data ? { ...merchantSetupQuery.data } : null
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
      saveMerchantSetupMutation.mutateAsync(parsedSetup)
        .catch((err) => logger.error('Failed to save merchant setup during registration', err))

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
      addNotificationMutation.mutate(newNoti)
    } catch (e) {
      logger.error('Failed to update merchant setup during registration', e)
    }

    setCurrentStep(4)
  }

  const handleCopyStaffId = () => {
    navigator.clipboard.writeText(generatedStaffId)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

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

  return {
    // translation
    t,
    currentLanguage,
    setLanguage,
    renderLabel,
    // step/role
    currentStep,
    setCurrentStep,
    role,
    setRole,
    // step 1 state
    email,
    setEmail,
    confirmEmail,
    setConfirmEmail,
    password,
    setPassword,
    showPassword,
    setShowPassword,
    referralCode,
    setReferralCode,
    fullName,
    setFullName,
    termsAccepted,
    setTermsAccepted,
    showTermsModal,
    setShowTermsModal,
    modalType,
    setModalType,
    nickname,
    setNickname,
    position,
    setPosition,
    phone,
    setPhone,
    phoneParsed,
    bio,
    setBio,
    vlinkpayId,
    setVlinkpayId,
    avatar,
    setAvatar,
    payouts,
    setPayouts,
    // step 2 state
    generatedStaffId,
    setGeneratedStaffId,
    copied,
    setCopied,
    // OTP state
    otpCode,
    setOtpCode,
    otpError,
    setOtpError,
    showOtpInput,
    setShowOtpInput,
    resendTimer,
    setResendTimer,
    // payout modal state
    editingMethod,
    setEditingMethod,
    editValue,
    setEditValue,
    editQrCode,
    setEditQrCode,
    editAccountName,
    setEditAccountName,
    isCapturing,
    setIsCapturing,
    modalError,
    setModalError,
    vlinkpayStatus,
    setVlinkpayStatus,
    // validation
    errors,
    setErrors,
    // handlers
    handleStep1Next,
    handleVerifyOtp,
    handleVlinkpayIdChange,
    autoFillPayments,
    handleToggleMethod,
    handleEditPayoutAccount,
    savePayoutAccount,
    handleModalFileChange,
    handleModalTakePhoto,
    handleModalClearQr,
    handlePersonalRegisterSubmit,
    handleCopyStaffId,
    getStepName,
    // props passthrough
    ssoEmail,
    onBackToLogin,
    onRegisterSuccess,
    onRegisterAndLogin,
    onKybSuccess,
    isRedirectedFromSession,
  }
}
