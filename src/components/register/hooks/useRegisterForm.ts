import { useState, useEffect, useMemo, useRef } from 'react'
import { getApiErrorCode, isApiError } from '../../../types/domain'
import { useTranslation } from '../../../contexts/LanguageContext'
import { parsePhone, formatNationalNumber } from '../../CountryCodeSelect'
import { serializeBankWireAccount } from '../../payout/bankWireAccount'
import { captureQrImage } from '../../../utils/qrCode'

const normalizePhone = (raw) => {
  if (!raw) return ''
  const { countryCode, nationalNumber } = parsePhone(raw)
  const formatted = formatNationalNumber(nationalNumber, countryCode)
  return formatted ? `${countryCode} ${formatted}`.trim() : ''
}
import { MOCK_NEXORA_STAFF_PROFILES } from '../../staff-registration/hooks/useStaffRegistration'
import { useReplaceAllPendingAccounts, usePendingAccounts } from '../../../data/hooks/usePendingAccounts'
import { useMerchantSetup, useSaveMerchantSetup, useUploadImage } from '../../../data/hooks/useMerchantSetup'
import { useAddNotification } from '../../../data/hooks/useNotifications'
import { logger } from '../../../utils/logger'
import apiAuthAdapter from '../../../auth/adapters/apiAuthAdapter'
import { getSignupOtp } from '../../../auth/signupOtp'
import { savePendingRegistration, clearPendingRegistration } from '../../../auth/pendingRegistration'
import { getErrorI18nKey } from '../../../data/errorCodes'
import { useCompletePersonalOnboarding } from '../../../data/hooks/usePersonalOnboarding'
import { useCreateStaffProfile } from '../../../data/hooks/useProfileSettings'
import { buildUpdateStaffProfileDto } from '../../../utils/mapStaffProfileView'

export function useRegisterForm({ ssoEmail, onBackToLogin, onRegisterSuccess, onRegisterAndLogin, onKybSuccess = () => {}, isRedirectedFromSession, initialStep = 0, initialRole = 'personal', resumeOtpVerification = false, autoSendVerificationOnResume = false, resumeEmail = '', resumePassword = '', resumeRole = null }) {
  const { t, currentLanguage, setLanguage, renderLabel } = useTranslation()
  const replaceAllPendingAccountsMutation = useReplaceAllPendingAccounts()
  const pendingAccountsQuery = usePendingAccounts()
  const merchantSetupQuery = useMerchantSetup()
  const saveMerchantSetupMutation = useSaveMerchantSetup()
  const uploadImageMutation = useUploadImage()

  const addNotificationMutation = useAddNotification()
  const completePersonalOnboardingMutation = useCompletePersonalOnboarding()
  const createStaffProfileMutation = useCreateStaffProfile()
  const [currentStep, setCurrentStep] = useState(resumeOtpVerification ? 2 : initialStep)
  const [role, setRole] = useState(resumeRole || initialRole)

  // Step 1 states
  const [email, setEmail] = useState(resumeEmail || ssoEmail || '')
  const [confirmEmail, setConfirmEmail] = useState(resumeEmail || '')
  const [password, setPassword] = useState(resumePassword || '')
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

  // API mode states
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [isVerificationPending, setIsVerificationPending] = useState(false)
  const [simToken, setSimToken] = useState('sim-token-123')
  const [verifySuccess, setVerifySuccess] = useState(false)
  const [resendMessage, setResendMessage] = useState('')

  // Step 2 states
  const [generatedStaffId, setGeneratedStaffId] = useState('')
  const [copied, setCopied] = useState(false)

  // OTP activation states
  const [otpCode, setOtpCode] = useState('')
  const [otpError, setOtpError] = useState('')
  const [showOtpInput, setShowOtpInput] = useState(false)
  const [resendTimer, setResendTimer] = useState(30)

  // Profile / Payments Setup extra states
  const [editingMethod, setEditingMethod] = useState<any | null>(null)
  const [editValue, setEditValue] = useState('')
  const [editQrCode, setEditQrCode] = useState('')
  const [editAccountName, setEditAccountName] = useState('')
  const [isCapturing, setIsCapturing] = useState(false)
  const [modalError, setModalError] = useState('')
  const [vlinkpayStatus, setVlinkpayStatus] = useState('idle')
  const [vlinkpayTimeout, setVlinkpayTimeout] = useState<any | null>(null)

  // Validation errors
  const [errors, setErrors] = useState<LooseObject>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const resumeVerificationSentRef = useRef(false)

  const handleToggleTerms = () => {
    setTermsAccepted(!termsAccepted)
    if (errors.terms) {
      setErrors({ ...errors, terms: undefined })
    }
  }

  const AVATAR_MAX_SIZE = 5 * 1024 * 1024
  const AVATAR_ALLOWED_TYPES = ['image/jpeg', 'image/png']

  const handleAvatarFileChange = async (file: File) => {
    if (!file) return

    if (!AVATAR_ALLOWED_TYPES.includes(file.type)) {
      setErrors(prev => ({ ...prev, avatar: 'errors.image_unsupported_file_type' }))
      return
    }
    if (file.size > AVATAR_MAX_SIZE) {
      setErrors(prev => ({ ...prev, avatar: 'errors.image_file_size_exceeded_5mb' }))
      return
    }

    setErrors(prev => ({ ...prev, avatar: undefined }))
    try {
      const uploaded = await uploadImageMutation.mutateAsync(file)
      const uploadedUrl = uploaded.imageUrl || uploaded.fileUrl || ''
      if (uploadedUrl) {
        setAvatar(uploadedUrl)
        return
      }
    } catch (err: unknown) {
      logger.error('Failed to upload staff avatar', err)
      setErrors(prev => ({ ...prev, avatar: 'errors.image_upload_failed' }))
    }
  }

  const handleSimulateVerify = () => {
    setErrors({})
    setVerifySuccess(false)
    apiAuthAdapter.verifyEmail({ token: simToken, email: email.trim().toLowerCase() })
      .then(() => {
        setVerifySuccess(true)
        // Auto-login to get tokens for subsequent protected calls (Step 2, 3, 4)
        // using signInForInviteAccept to prevent fetching staff profile prematurely
        return apiAuthAdapter.signInForInviteAccept({ email: email.trim().toLowerCase(), password })
      })
      .then(async () => {
        // Business creation is handled by Setup Wizard (onboarding), not here.
        setTimeout(() => {
          if (role === 'business') {
            if (onRegisterAndLogin) onRegisterAndLogin(email.trim().toLowerCase())
            else if (onRegisterSuccess) onRegisterSuccess()
          } else {
            setIsVerificationPending(false)
            setCurrentStep(3)
          }
        }, 1500)
      })
      .catch((err) => {
        logger.error('handleSimulateVerify error:', err)
        const code = getApiErrorCode(err, 'HTTP_ERROR')
        const i18nKey = getErrorI18nKey(code)
        setErrors({ submit: i18nKey })
      })
  }

  const handleResendVerification = () => {
    setErrors({})
    setResendMessage('')
    apiAuthAdapter.resendVerificationEmail({ email: email.trim().toLowerCase() })
      .then(() => {
        setResendMessage(t('register.resend_verification_success'))
        setResendTimer(60)
      })
      .catch((err) => {
        const code = getApiErrorCode(err, 'HTTP_ERROR')
        const i18nKey = getErrorI18nKey(code)
        setErrors({ submit: i18nKey })
      })
  }

  useEffect(() => {
    // Chỉ tự gửi lại verification email ở luồng login-resume rõ ràng. KHÔNG tự gửi
    // ngay sau signup (signup đã trigger OTP) — tránh gửi OTP trùng khi reload bước OTP.
    if (!autoSendVerificationOnResume || !resumeEmail.trim()) return undefined
    if (resumeVerificationSentRef.current) return undefined

    resumeVerificationSentRef.current = true
    let cancelled = false

    const resumeVerification = async () => {
      try {
        await apiAuthAdapter.resendVerificationEmail({ email: resumeEmail.trim().toLowerCase() })
        if (cancelled) return
        setResendMessage(t('register.resend_verification_success'))
        setResendTimer(60)
      } catch (err) {
        if (cancelled) return
        resumeVerificationSentRef.current = false
        const code = getApiErrorCode(err, 'HTTP_ERROR')
        setOtpError(t(getErrorI18nKey(code)))
      }
    }

    resumeVerification()
    return () => {
      cancelled = true
    }
  }, [autoSendVerificationOnResume, resumeEmail, t])

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

  const handleStep1Next = async (e) => {
    e.preventDefault()
    const newErrors: LooseObject = {}

    if (!email.trim()) {
      newErrors.email = 'register.errors.email_required'
    } else if (!/^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/.test(email.trim())) {
      newErrors.email = 'register.errors.email_invalid'
    }

    if (!confirmEmail.trim()) {
      newErrors.confirmEmail = 'register.errors.confirm_email_required'
    } else if (confirmEmail.trim().toLowerCase() !== email.trim().toLowerCase()) {
      newErrors.confirmEmail = 'register.errors.email_mismatch'
    }

    if (!password) {
      newErrors.password = 'register.errors.password_required'
    } else if (password.length < 6) {
      newErrors.password = 'register.errors.password_short'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setErrors({})
    setIsSubmitting(true)

    try {
      const signupResponse = await apiAuthAdapter.signup({
        email: email.trim().toLowerCase(),
        confirmEmail: confirmEmail.trim().toLowerCase(),
        password,
        confirmPassword: password,
        firstName: email.split('@')[0],
        lastName: 'User',
        // profileType enum per signup API docs is "Merchant" | "User" (not "Personal").
        profileType: role === 'business' ? 'Merchant' : 'User'
      })
      const signupOtp = getSignupOtp(signupResponse)

      setOtpCode(signupOtp)
      setSimToken(signupOtp || simToken)
      setResendMessage('')
      setIsVerificationPending(false)
      savePendingRegistration({
        email: email.trim().toLowerCase(),
        password,
        role,
      })
      setCurrentStep(2)
    } catch (err) {
      const errorsMap: LooseObject = {}
      const code = getApiErrorCode(err, 'HTTP_ERROR')
      const i18nKey = getErrorI18nKey(code)
      if (code === 'AUTH_PASSWORDS_DO_NOT_MATCH') {
        errorsMap.confirmEmail = 'register.errors.email_mismatch'
      } else {
        errorsMap.email = i18nKey || 'errors.unknown_error'
      }
      setErrors(errorsMap)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleVerifyOtp = async (e) => {
    e.preventDefault()
    const token = otpCode.trim()

    if (!token) {
      setOtpError(t('components.register.hooks.useRegisterForm.invalidCodeTipEnter'))
      return
    }

    setOtpError('')
    setErrors({})
    setIsSubmitting(true)

    try {
      try {
        await apiAuthAdapter.verifyEmail({
          token,
          email: email.trim().toLowerCase()
        })
      } catch (err) {
        if (!isApiError(err) || err.errorCode !== 'USER_EMAIL_ALREADY_VERIFIED') {
          throw err
        }
      }

      // Use signInForInviteAccept to avoid fetching staff profile prematurely
      await apiAuthAdapter.signInForInviteAccept({
        email: email.trim().toLowerCase(),
        password
      })

      clearPendingRegistration()
      setOtpError('')

      if (role === 'business') {
        const existingAccounts = pendingAccountsQuery.data ?? []
        const newAccount = {
          email: email.trim().toLowerCase(),
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
        // Let the mutation persist in the background.
        replaceAllPendingAccountsMutation.mutate(filtered)

        // Business creation is handled by Setup Wizard (onboarding), not here.
        if (onRegisterAndLogin) {
          onRegisterAndLogin(email.trim().toLowerCase())
        } else if (onRegisterSuccess) {
          onRegisterSuccess()
        }
      } else {
        const existingAccounts = pendingAccountsQuery.data ?? []
        const newAccount = {
          email: email.trim().toLowerCase(),
          referralCode: referralCode.trim(),
          role: role,
          fullName: email.split('@')[0],
          staffId: null,
          isVerified: true,
          kybDetails: null
        }
        const filtered = existingAccounts.filter(acc => acc.email !== newAccount.email)
        filtered.push(newAccount)
        replaceAllPendingAccountsMutation.mutate(filtered)

        setShowOtpInput(false)
        setCurrentStep(3)
      }
    } catch (err) {
      logger.error('Verify account activation failed', err)
      const code = getApiErrorCode(err, 'HTTP_ERROR')
      const i18nKey = getErrorI18nKey(code)
      setOtpError(t(i18nKey))
    } finally {
      setIsSubmitting(false)
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
        setPhone(normalizePhone(matchedProfile.phone || ''))
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

  const autoFillPayments = () => {}

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
      setModalError(t('components.register.hooks.useRegisterForm.thisFieldIsRequired'))
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

  const handleModalImagePick = (dataUrl) => {
    if (dataUrl) setEditQrCode(dataUrl)
  }

  const handleModalTakePhoto = async () => {
    setIsCapturing(true)
    try {
      const dataUrl = await captureQrImage({ fallbackValue: editValue || '' })
      if (dataUrl) setEditQrCode(dataUrl)
    } finally {
      setIsCapturing(false)
    }
  }

  const handleModalClearQr = () => {
    setEditQrCode('')
  }

  const handleProfileSetupSubmit = async () => {
    const isApiMode = import.meta.env.VITE_DATA_SOURCE === 'api'
    if (isApiMode) {
      try {
        const dto = buildUpdateStaffProfileDto({}, {
          fullName: fullName.trim(),
          defaultDisplayName: nickname.trim() || email.split('@')[0],
          position,
          bio,
          avatar,
          phone,
        })
        await createStaffProfileMutation.mutateAsync(dto)
      } catch (err: unknown) {
        logger.error('Failed to create staff profile during onboarding', err)
      }
    }
    
    if (onRegisterAndLogin) {
      onRegisterAndLogin(email.trim().toLowerCase())
    } else if (onRegisterSuccess) {
      onRegisterSuccess()
    }
  }

  const handlePersonalRegisterSubmit = async () => {
    // Validate payout method
    const hasConfiguredPayout = Object.values(payouts).some(p => p.enabled && p.value.trim())
    if (!hasConfiguredPayout) {
      setErrors({ payout: t('components.register.hooks.useRegisterForm.thisFieldIsRequired') })
      return
    }
    setErrors(prev => ({ ...prev, payout: '' }))

    const isApiMode = import.meta.env.VITE_DATA_SOURCE === 'api'

    let staffId = generatedStaffId
    if (!staffId) {
      const emailPrefix = email.split('@')[0].toUpperCase()
      const initials = emailPrefix.slice(0, 3) || 'STAFF'
      const randomDigits = Math.floor(1000 + Math.random() * 9000)
      staffId = `${initials}${randomDigits}`
      
      // Try to get actual user ID if in API mode
      if (isApiMode) {
        try {
          const session = await apiAuthAdapter.getSession()
          if (session && session.id) {
            staffId = session.id
          }
        } catch (e: unknown) {
          // ignore
        }
      }
      
      setGeneratedStaffId(staffId)
    }

    if (isApiMode) {
      try {
        await completePersonalOnboardingMutation.mutateAsync({
          accountData: { 
            fullName: nickname.trim() || email.split('@')[0], 
            nickname: nickname.trim() || email.split('@')[0], 
            phone, 
            position 
          },
          paymentAccounts: {},
          payoutConfigs: payouts
        })
        setCurrentStep(5)
      } catch (err: unknown) {
        logger.error('Failed to complete API onboarding', err)
        setErrors({ submit: t('register.errors.onboarding_failed') })
      }
      return
    }

    const finalPaymentAccounts: LooseObject = {}
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
          name: '',
          email: '',
          phone: '',
          category: ''
        },
        staffList: [],
        touchPoints: []
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
        title: t('components.register.hooks.useRegisterForm.newJoinRequest'),
        message: currentLanguage === 'vi'
          ? `Thợ ${finalStaffMember.fullName} (${finalStaffMember.position}) đã gửi yêu cầu liên kết với tiệm của bạn.`
          : `Technician ${finalStaffMember.fullName} (${finalStaffMember.position}) requested to link with your salon.`,
        time: t('components.register.hooks.useRegisterForm.justNow'),
        read: false,
        linkTab: 'staff'
      }
      addNotificationMutation.mutate(newNoti)
    } catch (e: unknown) {
      logger.error('Failed to update merchant setup during registration', e)
    }

    setCurrentStep(5)
  }

  const handleCopyStaffId = () => {
    navigator.clipboard.writeText(generatedStaffId)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const getStepName = (step) => {
    if (role === 'business') {
      switch (step) {
        case 0: return t('components.register.hooks.useRegisterForm.accountType')
        case 1: return t('components.register.hooks.useRegisterForm.credentials')
        case 2: return t('components.register.hooks.useRegisterForm.activateOtp')
        default: return ''
      }
    } else {
      switch (step) {
        case 0: return t('components.register.hooks.useRegisterForm.accountType')
        case 1: return t('components.register.hooks.useRegisterForm.credentials')
        case 2: return t('components.register.hooks.useRegisterForm.activateOtp')
        case 3: return t('components.register.hooks.useRegisterForm.profileSetup')
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
    // API mode states & handlers
    firstName,
    setFirstName,
    lastName,
    setLastName,
    isVerificationPending,
    setIsVerificationPending,
    simToken,
    setSimToken,
    verifySuccess,
    setVerifySuccess,
    resendMessage,
    setResendMessage,
    handleSimulateVerify,
    handleResendVerification,
    // validation
    errors,
    setErrors,
    isSubmitting,
    // handlers
    handleStep1Next,
    handleVerifyOtp,
    handleProfileSetupSubmit,
    handleVlinkpayIdChange,
    handleToggleMethod,
    handleEditPayoutAccount,
    savePayoutAccount,
    handleModalImagePick,
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
    handleAvatarFileChange,
  }
}
