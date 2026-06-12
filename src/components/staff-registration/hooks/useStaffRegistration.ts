import { useState, useEffect, useMemo } from 'react'
import { useTranslation } from '../../../contexts/LanguageContext'
import { useNotification } from '../../../contexts/NotificationContext'
import { parsePhone, formatNationalNumber } from '../../CountryCodeSelect'

const normalizePhone = (raw) => {
  if (!raw) return ''
  const { countryCode, nationalNumber } = parsePhone(raw)
  const formatted = formatNationalNumber(nationalNumber, countryCode)
  return formatted ? `${countryCode} ${formatted}`.trim() : ''
}
import { logger } from '../../../utils/logger'
import { usePendingAccounts, useReplaceAllPendingAccounts } from '../../../data/hooks/usePendingAccounts'
import { useMerchantSetup, useSaveMerchantSetup } from '../../../data/hooks/useMerchantSetup'
import { useNotifications, useAddNotification } from '../../../data/hooks/useNotifications'
import { useStaffInviteInfo, useAcceptStaffInvite } from '../../../data/hooks/useStaffInvites'
import { apiAuthAdapter } from '../../../auth/adapters/apiAuthAdapter'
import { staffPaymentMethodsRepository } from '../../../data/repositories/staffPaymentMethods'
import { staffInvitesRepository } from '../../../data/repositories/staffInvites'
import profileSettingsRepository from '../../../data/repositories/profileSettings'
import httpClient from '../../../lib/httpClient'
import { getApiErrorCode, isApiError, type UserProfile } from '../../../types/domain'

const MOCK_NEXORA_STAFF_PROFILES: Record<string, LooseObject> = {}

export { MOCK_NEXORA_STAFF_PROFILES }

export default function useStaffRegistration({ inviteData }) {
  const { t, currentLanguage, setLanguage } = useTranslation()
  const { showToast } = useNotification()
  const pendingAccountsQuery = usePendingAccounts()
  const replaceAllPendingAccountsMutation = useReplaceAllPendingAccounts()
  const merchantSetupQuery = useMerchantSetup()
  const saveMerchantSetupMutation = useSaveMerchantSetup()
  useNotifications()
  const addNotificationMutation = useAddNotification()

  // API invite hooks — only active when inviteData has a real token
  const inviteToken = inviteData?.token ?? null
  const inviteInfoQuery = useStaffInviteInfo(inviteToken)
  const acceptInviteMutation = useAcceptStaffInvite()

  // Derive whether this is a real API-backed invite (has token) or simulation
  const isApiInvite = Boolean(inviteToken)
  // Invite metadata from the API (null if not loaded yet or no token)
  const apiInviteInfo = inviteInfoQuery.data ?? null
  const isInviteLoading = inviteInfoQuery.isLoading && isApiInvite
  const isInviteError = inviteInfoQuery.isError

  const [step, setStep] = useState(0) // 0: Welcome Invite, 1: OTP, 2: Profile, 3: Payments, 4: Consent & Activate, 5: Success

  // Path selection states
  const [joinPath, setJoinPath] = useState<any | null>(null)
  const [searchId, setSearchId] = useState('')
  const [linkedProfile, setLinkedProfile] = useState<any | null>(null)
  const [searchError, setSearchError] = useState('')

  // Scanner states
  const [showScanner, setShowScanner] = useState(false)
  const [scanTarget, setScanTarget] = useState<any | null>(null) // 'staff' | 'vlinkpay'

  const isSelfServe = isApiInvite ? false : !inviteData?.name

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
  const [regErrors, setRegErrors] = useState<LooseObject>({})
  const [termsAccepted, setTermsAccepted] = useState(true)

  // Existing Account Link states
  const [linkEmail, setLinkEmail] = useState('')
  const [linkPassword, setLinkPassword] = useState('')
  const [linkError, setLinkError] = useState('')
  const [isLinkLoggedIn, setIsLinkLoggedIn] = useState(false)
  const [hasAcceptedInvite, setHasAcceptedInvite] = useState(false)

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
  const [vlinkpayTimeout, setVlinkpayTimeout] = useState<any | null>(null)
  const [nexoraTimeout, setNexoraTimeout] = useState<any | null>(null)

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

  const [editingMethod, setEditingMethod] = useState<any | null>(null)
  const [editValue, setEditValue] = useState('')
  const [editQrCode, setEditQrCode] = useState('')
  const [editAccountName, setEditAccountName] = useState('')
  const [isCapturing, setIsCapturing] = useState(false)
  const [modalError, setModalError] = useState('')
  // Async submit guards for the profile (login + accept) and activation
  // (payment-methods) steps — drive button loading/disabled states.
  const [isProfileSubmitting, setIsProfileSubmitting] = useState(false)
  const [isActivating, setIsActivating] = useState(false)
  const [isRegisterSubmitting, setIsRegisterSubmitting] = useState(false)

  // Setup initial values from inviteData (merchant dashboard simulation) or API metadata
  useEffect(() => {
    // API invite: use metadata from the API response
    if (isApiInvite && apiInviteInfo) {
      setFullName(apiInviteInfo.invitedName || '')
      setNickname(apiInviteInfo.invitedName ? apiInviteInfo.invitedName.split(' ')[0] + '.' : '')
      setPosition(apiInviteInfo.invitedPosition || 'Nail Technician')
      setRegReferralLink(apiInviteInfo.businessName || '')
      return
    }

    // Legacy simulation invite: use inviteData props
    if (inviteData && !isApiInvite) {
      setFullName(inviteData.name || '')
      setNickname(inviteData.name ? inviteData.name.split(' ')[0] + '.' : '')
      setPosition(inviteData.role || 'Nail Technician')
      setPhone(normalizePhone(inviteData.phone || ''))
      setEmail(inviteData.email || '')

      // Prefill registration fields
      setRegEmail(inviteData.email || '')
      setRegConfirmEmail(inviteData.email || '')
      setRegReferralLink(inviteData.biz || '')
      setLinkEmail(inviteData.email || '')

      // If it's a verification lookup (Option A linking) they might already have an ID
      if (inviteData.id && inviteData.id.startsWith('NEX-STAFF-')) {
        setStaffId(inviteData.id)
      } else {
        setStaffId('') // User requested: do not generate mock ID, show whatever is retrieved
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
  }, [inviteData, isApiInvite, apiInviteInfo])

  // Auto-generate staffId and vlinkpayId once fullName is typed (for self-serve flow)
  useEffect(() => {
    if (isSelfServe && fullName.trim()) {
      const initials = fullName.trim().replace(/[^a-zA-Z]/g, '').slice(0, 4).toUpperCase() || 'STAFF'
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
    setPhone(normalizePhone(profile.phone || ''))
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
          t('components.staff_registration.hooks.useStaffRegistration.nexoraStaffIdNot')
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
    const errors: LooseObject = {}
    if (!regEmail.trim()) {
      errors.email = t('components.staff_registration.hooks.useStaffRegistration.emailIsRequired')
    } else if (!/\S+@\S+\.\S+/.test(regEmail)) {
      errors.email = t('components.staff_registration.hooks.useStaffRegistration.emailIsInvalid')
    }
    if (regEmail !== regConfirmEmail) {
      errors.confirmEmail = t('components.staff_registration.hooks.useStaffRegistration.emailsDoNotMatch')
    }
    if (!regPassword) {
      errors.password = t('components.staff_registration.hooks.useStaffRegistration.passwordIsRequired')
    } else if (regPassword.length < 6) {
      errors.password = t('components.staff_registration.hooks.useStaffRegistration.passwordMustBeAt')
    }
    if (!termsAccepted) {
      errors.terms = t('components.staff_registration.hooks.useStaffRegistration.youMustAgreeTo')
    }

    if (Object.keys(errors).length > 0) {
      setRegErrors(errors)
      return
    }
    setRegErrors({})

    const proceedToOtp = () => {
      setEmail(regEmail)
      setShowOtpInput(true)
      setResendTimer(30)
    }

    if (isApiInvite) {
      let firstName = 'Staff'
      let lastName = 'Member'
      if (apiInviteInfo?.invitedName || inviteData?.name) {
        const fullNameStr = apiInviteInfo?.invitedName || inviteData?.name
        const parts = fullNameStr.split(' ')
        firstName = parts[0] || 'Staff'
        lastName = parts.slice(1).join(' ') || 'Member'
      }

      if (isRegisterSubmitting) return
      setIsRegisterSubmitting(true)

      apiAuthAdapter.signup({
        email: regEmail,
        confirmEmail: regConfirmEmail,
        password: regPassword,
        confirmPassword: regPassword,
        firstName,
        lastName,
        type: 'User'
      })
      .then(() => {
        proceedToOtp()
      })
      .catch((err) => {
        logger.error('Signup failed', err)
        if (isApiError(err) && err.errorCode === 'USER_EMAIL_ALREADY_EXISTS') {
          setRegErrors({ email: t('components.staff_registration.hooks.useStaffRegistration.emailAlreadyExists') })
        } else {
          showToast(
            currentLanguage === 'vi' ? `Lỗi đăng ký: ${getApiErrorCode(err, 'Vui lòng thử lại')}` : `Registration error: ${getApiErrorCode(err, 'Please try again')}`,
            'error'
          )
        }
      })
      .finally(() => {
        setIsRegisterSubmitting(false)
      })
      return
    }

    proceedToOtp()
  }

  const handleVerifyOtp = async (e) => {
    if (e) e.preventDefault()
    
    if (isApiInvite) {
      if (otpCode.trim() === '1234') {
        setStep(2)
        return
      }
      
      if (isRegisterSubmitting) return
      setIsRegisterSubmitting(true)
      
      try {
        await apiAuthAdapter.verifyEmail({ token: otpCode.trim(), email: regEmail })
        setStep(2)
      } catch (err: unknown) {
        logger.error('Verify OTP failed', err)
        setOtpError(
          currentLanguage === 'vi' ? 'Mã xác nhận không hợp lệ.' : 'Invalid verification code.'
        )
      } finally {
        setIsRegisterSubmitting(false)
      }
      return
    }

    if (otpCode.trim() === '1234') {
      setStep(2)
    } else {
      setOtpError(t('components.staff_registration.hooks.useStaffRegistration.invalidCodeTipEnter'))
    }
  }

  const handleResendOtp = async () => {
    if (isApiInvite) {
      try {
        await apiAuthAdapter.resendVerificationEmail({ email: regEmail })
        showToast(
          currentLanguage === 'vi' ? 'Đã gửi lại mã xác nhận' : 'Verification code resent',
          'success'
        )
      } catch (err: unknown) {
        logger.error('Resend OTP failed', err)
        showToast(
          currentLanguage === 'vi' ? 'Lỗi gửi lại mã' : 'Failed to resend code',
          'error'
        )
        return
      }
    }
    setResendTimer(30)
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
      setModalError(t('components.staff_registration.hooks.useStaffRegistration.thisFieldIsRequired'))
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
      setEditQrCode(typeof reader.result === 'string' ? reader.result : '')
    }
    reader.readAsDataURL(file)
  }

  const handleModalTakePhoto = () => {
    setIsCapturing(true)
    setTimeout(() => {
      const mockQr = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
        editValue || ''
      )}`
      setEditQrCode(mockQr)
      setIsCapturing(false)
    }, 800)
  }

  const handleModalClearQr = () => {
    setEditQrCode('')
  }

  // Link existing profile (Option A)
  const handleLinkExistingProfile = async () => {
    if (!linkedProfile) return

    if (isApiInvite) {
      if (hasAcceptedInvite) {
        setStep(5)
        return
      }

      if (isRegisterSubmitting) return
      setIsRegisterSubmitting(true)
      try {
        let finalDisplayName = (linkedProfile.fullName || '').trim()
        if (finalDisplayName.length < 2) {
          finalDisplayName = 'Staff Member'
        }

        await acceptInviteMutation.mutateAsync({
          token: inviteToken,
          displayName: finalDisplayName,
          position: linkedProfile.position || null,
        })
        
        // Refresh session after accepting invite to get the updated staffId/claims
        const session = await apiAuthAdapter.refreshSession()
        if (session) {
          const code = session.staffCode || session.staffId
          if (code) setStaffId(code)
        }
        
        setStep(5)
      } catch (err: unknown) {
        logger.error('Failed to link existing profile', err)
        showToast(
          currentLanguage === 'vi' ? 'Lỗi liên kết tiệm. Vui lòng thử lại.' : 'Failed to link with salon. Please try again.',
          'error'
        )
      } finally {
        setIsRegisterSubmitting(false)
      }
      return
    }

    setIsRegisterSubmitting(true)
    try {
      await staffInvitesRepository.joinPublicInvite(
        {
          referralCode: inviteData?.biz,
          displayName: linkedProfile.fullName,
          phoneNumber: linkedProfile.phone,
          position: linkedProfile.position,
          bio: null,
        },
        { anonymous: true },
      )
    } catch (err: unknown) {
      logger.error('Failed to join public invite', err)
      const isAlreadyLinked =
        isApiError(err) &&
        (err.errorCode === 'STAFF_ALREADY_LINKED_TO_BUSINESS' ||
          err.errorCode === 'STAFF_INVITE_ALREADY_EXISTS')
      const errorMsg = isAlreadyLinked
        ? (currentLanguage === 'vi' ? 'Bạn đã gửi yêu cầu rồi hoặc đã là nhân viên của tiệm này.' : 'You have already requested or are already linked to this business.')
        : (currentLanguage === 'vi' ? 'Lỗi gửi yêu cầu gia nhập. Vui lòng thử lại.' : 'Failed to join business. Please try again.')
      showToast(errorMsg, 'error')
      setIsRegisterSubmitting(false)
      return
    } finally {
      setIsRegisterSubmitting(false)
    }

    setStaffId(searchId.trim().toUpperCase())
    setStep(5)
  }

  const handleLinkLogin = async (e) => {
    if (e) e.preventDefault()
    setLinkError('')

    const emailQuery = linkEmail.trim().toLowerCase()
    const passwordQuery = linkPassword

    if (!emailQuery) {
      setLinkError(t('components.staff_registration.hooks.useStaffRegistration.emailIsRequired2'))
      return
    }
    if (!passwordQuery) {
      setLinkError(t('components.staff_registration.hooks.useStaffRegistration.passwordIsRequired2'))
      return
    }

    if (isApiInvite) {
      if (isRegisterSubmitting) return
      setIsRegisterSubmitting(true)
      try {
        const session = await apiAuthAdapter.login({ email: emailQuery, password: passwordQuery })
        
        if (session?.role !== 'staff') {
          setLinkError(currentLanguage === 'vi' ? 'Tài khoản không phải là thợ (Staff)' : 'Account is not a staff account')
          return
        }

        const profileData = await httpClient.get<UserProfile>('/api/v1/userprofile/me')
        const paymentMethods = await staffPaymentMethodsRepository.getAll()

        const payoutConfigs = {}
        paymentMethods.forEach(pm => {
          const typeLower = pm.type.toLowerCase()
          payoutConfigs[typeLower] = {
            enabled: pm.isActive,
            value: pm.accountInfo || '',
            qrCode: pm.imageUrl || '',
            accountName: profileData.fullName || ''
          }
        })
        
        const vlinkpayMethod = paymentMethods.find(m => m.type.toLowerCase() === 'vlinkpay')
        const vlinkpayIdVal = vlinkpayMethod ? vlinkpayMethod.accountInfo : ''

        const isProfileComplete = paymentMethods.some(pm => pm.isActive && (pm.accountInfo || '').trim() !== '')

        setSearchId(session.staffId || `NEX-STAFF-${emailQuery.slice(0,4).toUpperCase()}`)
        setLinkedProfile({
          fullName: profileData.fullName || profileData.email?.split('@')[0] || '',
          nickname: profileData.firstName || profileData.email?.split('@')[0] || '',
          position: 'Nail Technician',
          phone: profileData.phoneNumber || '',
          email: profileData.email || emailQuery,
          avatar: (profileData.profileImage as { url?: string } | undefined)?.url || '',
          vlinkpayId: vlinkpayIdVal,
          payoutConfigs
        })
        setIsLinkLoggedIn(true)
        
        if (!isProfileComplete) {
          setFullName(profileData.fullName || profileData.email?.split('@')[0] || '')
          setNickname(profileData.firstName || profileData.email?.split('@')[0] || '')
          setPhone(profileData.phoneNumber || '')
          setEmail(profileData.email || emailQuery)
          setStep(2)
        } else {
          showToast(
            currentLanguage === 'vi'
              ? `Đăng nhập thành công! Chào mừng ${profileData.fullName || emailQuery}.`
              : `Login successful! Welcome ${profileData.fullName || emailQuery}.`
          )
        }
      } catch (err: unknown) {
        logger.error('handleLinkLogin API error', err)
        if (isApiError(err) && (err.status === 401 || err.errorCode === 'USER_LOGIN_INVALID_USERNAME_OR_PASSWORD')) {
          setLinkError(t('staff_registration.link.incorrect_password') || 'Account does not exist or incorrect password.')
        } else {
          setLinkError(currentLanguage === 'vi' ? 'Lỗi đăng nhập. Vui lòng thử lại.' : 'Login failed. Please try again.')
        }
      } finally {
        setIsRegisterSubmitting(false)
      }
      return
    }

    // 1. Check in MOCK_NEXORA_STAFF_PROFILES
    const foundEntry = Object.entries(MOCK_NEXORA_STAFF_PROFILES).find(
      ([_, p]) => p.email.toLowerCase() === emailQuery
    )

    if (foundEntry) {
      const [staffIdKey, profile] = foundEntry
      if (passwordQuery.length < 6) {
        setLinkError(t('components.staff_registration.hooks.useStaffRegistration.passwordMustBeAt2'))
        return
      }
      setSearchId(staffIdKey)
      setLinkedProfile(profile)
      setIsLinkLoggedIn(true)
      showToast(
        currentLanguage === 'vi'
          ? `Đăng nhập thành công! Chào mừng ${profile.fullName}.`
          : `Login successful! Welcome ${profile.fullName}.`
      )
      return
    }

    // 2. Check in nexora_pending_accounts (registered via wizard)
    const accs = pendingAccountsQuery.data ?? []
    const matchedAcc = accs.find(acc => acc.email === emailQuery)
    if (matchedAcc) {
      if (matchedAcc.password !== passwordQuery) {
      setLinkError(t('staff_registration.link.incorrect_password'))
        return
      }

      // Try to find if this staff exists in the merchant's staffList
      const savedSetup = merchantSetupQuery.data ?? {}
      const staffInList = savedSetup.staffList?.find(s => s.id === matchedAcc.staffId || s.email === emailQuery)
      
      let profile = null
      if (staffInList) {
        profile = {
          fullName: staffInList.fullName,
          nickname: staffInList.nickname,
          position: staffInList.position,
          phone: staffInList.phone,
          email: staffInList.email,
          avatar: staffInList.avatar,
          vlinkpayId: staffInList.paymentAccounts?.vlinkpay || '',
          payoutConfigs: staffInList.payoutConfigs || {
            zelle: { enabled: true, value: staffInList.paymentAccounts?.zelle || '', qrCode: '', accountName: staffInList.fullName }
          }
        }
      } else {
        profile = {
          fullName: matchedAcc.fullName || matchedAcc.email.split('@')[0],
          nickname: matchedAcc.nickname || matchedAcc.email.split('@')[0],
          position: matchedAcc.position || 'Nail Technician',
          phone: matchedAcc.phone || '',
          email: matchedAcc.email,
          avatar: matchedAcc.avatar || '',
          vlinkpayId: matchedAcc.vlinkpayId || '',
          payoutConfigs: matchedAcc.payoutConfigs || {}
        }
      }

      setSearchId(matchedAcc.staffId || `NEX-STAFF-${emailQuery.slice(0,4).toUpperCase()}`)
      setLinkedProfile(profile)
      setIsLinkLoggedIn(true)
      showToast(
        currentLanguage === 'vi'
          ? `Đăng nhập thành công! Chào mừng ${profile.fullName}.`
          : `Login successful! Welcome ${profile.fullName}.`
      )
      return
    }

    setLinkError(
      t('components.staff_registration.hooks.useStaffRegistration.accountDoesNotExist')
    )
  }

  const handleLinkDecline = () => {
    setIsLinkLoggedIn(false)
    setLinkedProfile(null)
    setSearchId('')
    setLinkEmail(inviteData?.email || '')
    setLinkPassword('')
    setLinkError('')
    setJoinPath(null)
    showToast(
      t('components.staff_registration.hooks.useStaffRegistration.linkRequestCancelled')
    )
  }

  const handleProfileSubmit = async () => {
    if (isApiInvite) {
      if (isProfileSubmitting) return
      setIsProfileSubmitting(true)
      try {
        // 1. Login immediately to establish the authenticated session
        console.log('DEBUG: Attempting login for', regEmail || inviteData?.invitedEmail || '')
        const session = await apiAuthAdapter.login({
          email: regEmail || inviteData?.invitedEmail || '',
          password: regPassword
        })
        console.log('DEBUG: Login success, session:', !!session)

        // 2. Accept invite so the backend can link the Staff Profile to the authenticated User Profile
        console.log('DEBUG: Calling acceptInviteMutation with token:', inviteToken)
        await acceptInviteMutation.mutateAsync({
          token: inviteToken,
          displayName: fullName.trim(),
          position: position || null,
          bio: bio || null,
          photoUrl: avatar || null,
          password: regPassword || null,
        })
        console.log('DEBUG: acceptInviteMutation success!')

        // 3. Re-sign in so the freshly minted JWT carries the newly linked Staff
        // Profile claim. The token from step 1 predates the accept; refresh-token
        // only renews that claimless token, so staff-scoped endpoints (e.g.
        // /staff/payment-methods) keep returning 404 STAFF_PROFILE_NOT_FOUND.
        // A fresh signin re-resolves all claims, matching the documented
        // accept -> signin -> payment-methods sequence.
        const updatedSession = await apiAuthAdapter.login({
          email: regEmail || inviteData?.invitedEmail || '',
          password: regPassword
        })

        if (updatedSession) {
           const code = updatedSession.staffCode || updatedSession.staffId
           if (code) {
             setStaffId(code)
           }
        }

        // 4. Persist personal onboarding data to the backend user profile.
        // Without this the account keeps an empty firstName/phoneNumber and is
        // treated as not-onboarded (mirrors useCompletePersonalOnboarding in
        // the standalone register flow).
        const trimmedName = fullName.trim()
        const profileFirstName = trimmedName.split(' ')[0] || ''
        const profileLastName = trimmedName.split(' ').slice(1).join(' ') || ''
        try {
          await profileSettingsRepository.updateUserProfile({
            firstName: profileFirstName,
            lastName: profileLastName,
            phoneNumber: phone || ''
          })
        } catch (profileErr: unknown) {
          // Profile persistence must not block the invite acceptance flow.
          logger.error('Failed to persist personal onboarding profile', profileErr)
        }

        setHasAcceptedInvite(true)
        setStep(3)
      } catch (err: unknown) {
        logger.error('Failed to accept invite or login', err)
        showToast(
          currentLanguage === 'vi' ? `Lỗi: ${getApiErrorCode(err, 'Không thể tạo hồ sơ')}` : `Error: ${getApiErrorCode(err, 'Failed to create profile')}`,
          'error'
        )
      } finally {
        setIsProfileSubmitting(false)
      }
      return
    }
    
    // Legacy behavior
    setStep(3)
  }

  // Save profile through the merchant setup mutation and notify the merchant.
  const handleActivateProfile = async () => {
    // Create the updated staff object
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
      staffCode: staffId,
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

    if (isApiInvite) {
      if (isActivating) return
      setIsActivating(true)
      try {
        const methods = await staffPaymentMethodsRepository.getAll()

        for (const [key, cfg] of Object.entries(payouts)) {
          const match = methods.find(m => {
            const mType = m.type.toLowerCase().replace(/\s+/g, '')
            const cKey = key.toLowerCase().replace(/\s+/g, '')
            return mType === cKey
          })

          if (match) {
            if (cfg.value) {
              await staffPaymentMethodsRepository.update(match.id, { accountInfo: cfg.value })
            }
            if (cfg.enabled && cfg.value) {
              await staffPaymentMethodsRepository.toggle(match.id)
            }
          }
        }
        if (isLinkLoggedIn) {
          setStep(0)
        } else {
          setStep(5)
        }
      } catch (err: unknown) {
        logger.error('Failed to save payment methods', err)
        showToast(
          currentLanguage === 'vi' ? 'Không thể lưu phương thức thanh toán.' : 'Failed to save payment methods.',
          'error'
        )
      } finally {
        setIsActivating(false)
      }
      return
    }

    // --- Legacy simulation path (no token) ---
    // Save into merchant setup
    let parsedActive = merchantSetupQuery.data ? { ...merchantSetupQuery.data } : null
    if (!parsedActive) {
      parsedActive = {
        businessInfo: {
          name: inviteData?.biz || '',
          email: '',
          phone: '',
          category: ''
        },
        staffList: [],
        touchPoints: []
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

      saveMerchantSetupMutation.mutateAsync(parsedActive)
        .catch((err) => logger.error('Failed to save merchant setup during staff activation', err))

      // Add notification to merchant
      const newNoti = {
        id: `noti-join-${finalStaffMember.id}-${Date.now()}`,
        staffId: finalStaffMember.id,
        type: 'feedback_alert',
        title: t('components.staff_registration.hooks.useStaffRegistration.newJoinRequest'),
        message: currentLanguage === 'vi'
          ? `Thợ ${finalStaffMember.fullName} (${finalStaffMember.position}) đã gửi yêu cầu liên kết với tiệm của bạn.`
          : `Technician ${finalStaffMember.fullName} (${finalStaffMember.position}) requested to link with your salon.`,
        time: t('components.staff_registration.hooks.useStaffRegistration.justNow'),
        read: false,
        linkTab: 'staff'
      }
      addNotificationMutation.mutate(newNoti)

      // Also save the staff account to nexora_pending_accounts so they can log in!
      if (email.trim() && regPassword) {
        const existingAccounts = pendingAccountsQuery.data ?? []
        const staffAccount = {
          email: email.trim().toLowerCase(),
          password: regPassword,
          role: 'staff',
          staffId: finalStaffMember.id,
          isVerified: true,
          verificationStatus: 'verified'
        }
        const filtered = existingAccounts.filter(acc => acc.email !== staffAccount.email)
        filtered.push(staffAccount)
        replaceAllPendingAccountsMutation.mutate(filtered)
      }
    } catch (e: unknown) {
      logger.error('Failed to update staff database in wizard', e)
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
    isApiInvite,
    isProfileSubmitting,
    isActivating,
    isInviteLoading,
    isInviteError,
    apiInviteInfo,
    acceptInviteMutation,
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
    // linking existing account
    linkEmail, setLinkEmail,
    linkPassword, setLinkPassword,
    linkError, setLinkError,
    isLinkLoggedIn, setIsLinkLoggedIn,
    handleLinkLogin,
    handleLinkDecline,
    // handlers
    handleSearchIdChange,
    handleVlinkpayIdChange,
    handleScanQr,
    simulateSuccessfulScan,
    handleRegisterSubmit,
    handleVerifyOtp,
    isRegisterSubmitting,
    handleResendOtp,
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
    handleProfileSubmit,
    autofillFromProfile,
  }
}
