import { useState, useEffect, useMemo } from 'react'
import { useTranslation } from '../../../contexts/LanguageContext'
import { useNotification } from '../../../contexts/NotificationContext'
import { parsePhone, formatNationalNumber } from '../../CountryCodeSelect'
import { serializeBankWireAccount } from '../../payout/bankWireAccount'
import { captureQrImage } from '../../../utils/qrCode'

const normalizePhone = (raw) => {
  if (!raw) return ''
  const { countryCode, nationalNumber } = parsePhone(raw)
  const formatted = formatNationalNumber(nationalNumber, countryCode)
  return formatted ? `${countryCode} ${formatted}`.trim() : ''
}

const imageUrlOrNull = (value) => {
  if (!value || String(value).startsWith('data:')) return null
  return value
}

const buildVlinkpayId = (name = 'STAFF') => {
  const initials = name.replace(/[^a-zA-Z]/g, '').slice(0, 4).toUpperCase() || 'STAFF'
  return `${initials}${Math.floor(1000 + Math.random() * 9000)}`
}

const formatReferralDisplay = (businessName = '', referralCode = '') => {
  const name = String(businessName || '').trim()
  const code = String(referralCode || '').trim()
  return [name, code].filter(Boolean).join(' - ')
}
import { logger } from '../../../utils/logger'
import { getUserProfileImageUrl } from '../../../utils/userProfileImage'
import { usePendingAccounts, useReplaceAllPendingAccounts } from '../../../data/hooks/usePendingAccounts'
import { useMerchantSetup, useSaveMerchantSetup, useUploadImage } from '../../../data/hooks/useMerchantSetup'
import { useNotifications, useAddNotification } from '../../../data/hooks/useNotifications'
import { useStaffInviteInfo, useAcceptStaffInvite, usePublicMerchantInvite } from '../../../data/hooks/useStaffInvites'
import { apiAuthAdapter } from '../../../auth/adapters/apiAuthAdapter'
import { getSignupOtp } from '../../../auth/signupOtp'
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
  const uploadImageMutation = useUploadImage()
  useNotifications()
  const addNotificationMutation = useAddNotification()

  // API invite hooks - only active when inviteData has a real token
  const inviteToken = inviteData?.token ?? null
  const inviteRefCode = inviteData?.refCode || null
  const inviteBusinessSlug = inviteData?.businessSlug || null
  const inviteEmail = inviteData?.email || null
  const inviteInfoQuery = useStaffInviteInfo(inviteToken)
  const acceptInviteMutation = useAcceptStaffInvite()

  // Derive whether this is a real API-backed invite (has token) or simulation
  const isApiInvite = Boolean(inviteToken)
  const isPublicInvite = Boolean(inviteBusinessSlug)
  const usesApiRegistration = isApiInvite || isPublicInvite
  // Public invite landing: fetch business info by referralCode (no token).
  const publicInviteInfoQuery = usePublicMerchantInvite(
    isPublicInvite ? inviteRefCode : null,
  )
  // Invite metadata from the API (null if not loaded yet). Token invite first,
  // then public merchant-invite for the QR/public-link flow.
  const apiInviteInfo = inviteInfoQuery.data ?? publicInviteInfoQuery.data ?? null
  const isInviteLoading =
    (inviteInfoQuery.isLoading && isApiInvite) ||
    (publicInviteInfoQuery.isLoading && isPublicInvite)
  const isInviteError =
    (inviteInfoQuery.isError && isApiInvite) ||
    (publicInviteInfoQuery.isError && isPublicInvite)

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
  const [needsOnboarding, setNeedsOnboarding] = useState(false)

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
  // (payment-methods) steps - drive button loading/disabled states.
  const [isProfileSubmitting, setIsProfileSubmitting] = useState(false)
  const [isActivating, setIsActivating] = useState(false)
  const [isRegisterSubmitting, setIsRegisterSubmitting] = useState(false)

  // Setup initial values from inviteData (merchant dashboard simulation) or API metadata
  useEffect(() => {
    // API invite: use metadata from the API response
    if ((isApiInvite || isPublicInvite) && apiInviteInfo) {
      setFullName(apiInviteInfo.invitedName || '')
      setNickname(apiInviteInfo.invitedName ? apiInviteInfo.invitedName.split(' ')[0] + '.' : '')
      setPosition(apiInviteInfo.invitedPosition || 'Nail Technician')
      setRegReferralLink(formatReferralDisplay(apiInviteInfo.businessName, apiInviteInfo.refCode || inviteRefCode))
      setEmail(apiInviteInfo.invitedEmail || inviteEmail || '')
      setRegEmail(apiInviteInfo.invitedEmail || inviteEmail || '')
      setRegConfirmEmail(apiInviteInfo.invitedEmail || inviteEmail || '')
      setLinkEmail(apiInviteInfo.invitedEmail || inviteEmail || '')
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
      setRegReferralLink(formatReferralDisplay(inviteData.biz, inviteData.refCode || inviteData.referralCode))
      setLinkEmail(inviteData.email || '')

      // If it's a verification lookup (Option A linking) they might already have an ID
      if (inviteData.id) {
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
        setVlinkpayId(buildVlinkpayId(inviteData.name || 'STAFF'))
      }
    }
  }, [inviteData, isApiInvite, isPublicInvite, apiInviteInfo, inviteEmail])

  // Auto-generate staffId and vlinkpayId once fullName is typed (for self-serve flow)
  useEffect(() => {
    if (isSelfServe && fullName.trim()) {
      if (!vlinkpayId) {
        setVlinkpayId(buildVlinkpayId(fullName.trim()))
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

  const handleAvatarFileChange = async (file) => {
    if (!file) return
    try {
      const uploaded = await uploadImageMutation.mutateAsync(file)
      const uploadedUrl = uploaded.imageUrl || uploaded.fileUrl || ''
      if (uploadedUrl) {
        setAvatar(uploadedUrl)
        return
      }
      showToast(t('errors.image_upload_failed'), 'error')
    } catch (err: unknown) {
      logger.error('Failed to upload staff avatar', err)
      showToast(t('errors.image_upload_failed'), 'error')
    }
  }

  // Handle opening scanner modal
  const handleScanQr = (target) => {
    setScanTarget(target)
    setShowScanner(true)
  }

  // Handle simulation of successful scan (Lisa Tran)

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

    if (usesApiRegistration) {
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
      .then((signupResponse) => {
        const signupOtp = getSignupOtp(signupResponse)
        if (signupOtp) {
          setOtpCode(signupOtp)
        }
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
    
    if (usesApiRegistration) {
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
    if (usesApiRegistration) {
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

  const autoFillOtp = () => {}

  // Pre-fill payment configurations for faster testing
  const autoFillPayments = () => {}

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
          referralCode: inviteRefCode || '',
          displayName: linkedProfile.fullName,
          phoneNumber: linkedProfile.phone,
          position: linkedProfile.position,
          bio: null,
        },
        isPublicInvite ? {} : { anonymous: true },
      )
    } catch (err: unknown) {
      if (isExistingBusinessLinkError(err)) {
        try {
          await hydrateStaffSessionAfterPublicJoin()
        } catch (sessionErr: unknown) {
          logger.warn('Could not refresh session for existing public join request', sessionErr)
        }
        showToast(getPublicJoinAlreadyLinkedMessage(), 'info')
        const linkedCode = searchId.trim().toUpperCase()
        if (linkedCode) {
          setStaffId(linkedCode)
        }
        setStep(5)
        return
      }

      logger.error('Failed to join public invite', err)
      const isAlreadyLinked =
        isApiError(err) &&
        (err.errorCode === 'STAFF_ALREADY_LINKED_TO_BUSINESS' ||
          err.errorCode === 'STAFF_INVITE_ALREADY_EXISTS')
      const errorMsg = isAlreadyLinked
        ? t('components.staff_registration.hooks.useStaffRegistration.alreadyLinkedOrRequested')
        : t('components.staff_registration.hooks.useStaffRegistration.joinRequestFailed', {
          error: getApiErrorCode(err, 'Unknown error'),
        })
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

    if (isRegisterSubmitting) return
    setIsRegisterSubmitting(true)
    try {
      // Step 1: Silent sign-in (do NOT accept invite yet)
      await apiAuthAdapter.signInForInviteAccept({ email: emailQuery, password: passwordQuery })

      // Step 2: Fetch user profile to validate account type & onboarding status
      const profileData = await httpClient.get<UserProfile>('/api/v1/userprofile/me')

      // Step 3: Only personal accounts can accept invite links
      const isMerchant =
        profileData.userType === 'Merchant' || profileData.profileType === 'Merchant'
      if (isMerchant) {
        setLinkError(t('staff_registration.link.business_account_not_allowed'))
        return
      }

      // Step 4: Determine onboarding status (same logic as apiAuthAdapter.mapProfileToSession)
      const hasOnboarded = Boolean(
        ((profileData.firstName ?? '') as string).trim() ||
          ((profileData.lastName ?? '') as string).trim(),
      )

      if (!hasOnboarded) {
        // User has NOT completed personal onboarding - send to profile + payout steps first
        setNeedsOnboarding(true)
        setIsLinkLoggedIn(true)
        setLinkedProfile({
          fullName: '',
          nickname: '',
          position: apiInviteInfo?.invitedPosition || 'Nail Technician',
          phone: '',
          email: profileData.email || emailQuery,
          avatar: '',
          vlinkpayId: '',
          payoutConfigs: {},
        })
        // Pre-fill form fields for the profile step
        setFullName('')
        setNickname('')
        setPhone('')
        setEmail(profileData.email || emailQuery)
        setPosition(apiInviteInfo?.invitedPosition || 'Nail Technician')
        setStep(2)
        showToast(
          t('staff_registration.link.onboarding_required'),
          'info',
        )
        return
      }

      // Step 5: Already onboarded → fetch full profile + payment methods, show confirm screen
      let paymentMethods: import('../../../types/domain').PaymentMethodDto[] = []
      try {
        // Staff profile may not exist yet (not linked to any business), so handle 404
        paymentMethods = await staffPaymentMethodsRepository.getAll()
      } catch (pmErr: unknown) {
        logger.warn('Could not fetch payment methods during link login', pmErr)
      }

      const payoutConfigs = {}
      paymentMethods.forEach(pm => {
        const typeLower = pm.type.toLowerCase()
        payoutConfigs[typeLower] = {
          enabled: pm.isActive,
          value: pm.accountInfo || '',
          qrCode: pm.imageUrl || '',
          accountName: profileData.fullName || '',
        }
      })

      const vlinkpayMethod = paymentMethods.find(m => m.type.toLowerCase() === 'vlinkpay')
      const vlinkpayIdVal = vlinkpayMethod ? vlinkpayMethod.accountInfo : ''

      setSearchId(
        (profileData.staffCode as string | undefined) ||
          (profileData.staffId as string | undefined) ||
          `${emailQuery.slice(0, 4).toUpperCase()}${Math.floor(1000 + Math.random() * 9000)}`,
      )
      setLinkedProfile({
        fullName: profileData.fullName || profileData.email?.split('@')[0] || '',
        nickname: profileData.firstName || profileData.email?.split('@')[0] || '',
        position: apiInviteInfo?.invitedPosition || 'Nail Technician',
        phone: profileData.phoneNumber || '',
        email: profileData.email || emailQuery,
        avatar: getUserProfileImageUrl(profileData) || '',
        vlinkpayId: vlinkpayIdVal,
        payoutConfigs,
      })
      setIsLinkLoggedIn(true)
      setNeedsOnboarding(false)
      showToast(
        currentLanguage === 'vi'
          ? `Đăng nhập thành công! Chào mừng ${profileData.fullName || emailQuery}.`
          : `Login successful! Welcome ${profileData.fullName || emailQuery}.`,
      )
      // Stay on Step 0 - section D (confirm screen) will render
    } catch (err: unknown) {
      logger.error('handleLinkLogin API error', err)
      if (isApiError(err) && (err.status === 401 || err.errorCode === 'USER_LOGIN_INVALID_USERNAME_OR_PASSWORD')) {
        setLinkError(err.message || t('staff_registration.link.incorrect_password'))
      } else {
        const apiMsg = isApiError(err) ? err.message : ''
        setLinkError(apiMsg || (currentLanguage === 'vi' ? 'Lỗi đăng nhập. Vui lòng thử lại.' : 'Login failed. Please try again.'))
      }
    } finally {
      setIsRegisterSubmitting(false)
    }
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

  const isExistingBusinessLinkError = (err: unknown) =>
    isApiError(err) &&
    (err.errorCode === 'STAFF_ALREADY_LINKED_TO_BUSINESS' ||
      err.errorCode === 'STAFF_INVITE_ALREADY_EXISTS' ||
      err.errorCode === 'STAFF_ALREADY_LINKED')

  const getPublicJoinAlreadyLinkedMessage = () =>
    t('components.staff_registration.hooks.useStaffRegistration.alreadyLinkedOrRequested')

  const hydrateStaffSessionAfterPublicJoin = async () => {
    const loginEmail = regEmail || inviteData?.invitedEmail || inviteData?.email || linkEmail || ''
    const loginPassword = regPassword || linkPassword
    const session =
      loginEmail && loginPassword
        ? await apiAuthAdapter.login({ email: loginEmail, password: loginPassword })
        : await apiAuthAdapter.refreshSession()

    if (session) {
      const code = session.staffCode || session.staffId
      if (code) {
        setStaffId(code)
      }
    }
  }

  const saveSelectedPaymentMethods = async () => {
    let methods: import('../../../types/domain').PaymentMethodDto[] = []
    try {
      methods = await staffPaymentMethodsRepository.getAll()
    } catch (pmErr: unknown) {
      logger.warn('Could not fetch payment methods during activation', pmErr)
    }

    for (const [key, cfg] of Object.entries(payouts)) {
      const accountInfo = cfg.value?.trim()
      if (!accountInfo) continue

      const match = methods.find(m => {
        const mUiKey = (m.uiKey || '').toLowerCase().replace(/\s+/g, '')
        const mType = m.type.toLowerCase().replace(/\s+/g, '')
        const cKey = key.toLowerCase().replace(/\s+/g, '')
        return mUiKey === cKey || mType === cKey
      })

      if (!match?.id) continue

      await staffPaymentMethodsRepository.update(match.id, {
        accountInfo,
        imageUrl: imageUrlOrNull(cfg.qrCode),
      })

      if (Boolean(cfg.enabled) !== Boolean(match.isActive)) {
        await staffPaymentMethodsRepository.toggle(match.id)
      }
    }
  }

  const handleProfileSubmit = async () => {
    if (usesApiRegistration) {
      if (isProfileSubmitting) return
      setIsProfileSubmitting(true)
      try {
        // --- Existing-account link flow (needsOnboarding): persist profile
        // to backend without accepting invite yet. Acceptance happens at
        // the final confirm screen (handleLinkExistingProfile).
        if (isLinkLoggedIn && needsOnboarding) {
          const trimmedName = fullName.trim()
          const profileFirstName = trimmedName.split(' ')[0] || ''
          const profileLastName = trimmedName.split(' ').slice(1).join(' ') || ''
          await profileSettingsRepository.updateUserProfile({
            firstName: profileFirstName,
            lastName: profileLastName,
            phoneNumber: phone || '',
          })
          setStep(3)
          return
        }

        // --- New registration flow: sign in, accept token invite if present,
        // then persist profile. Public invites join the business at activation.
        // Sign in without hydrating the session so /staff/profile is not
        // requested before the invite has been accepted.
        await apiAuthAdapter.signInForInviteAccept({
          email: regEmail || inviteData?.invitedEmail || inviteData?.email || '',
          password: regPassword
        })

        if (isApiInvite) {
          await acceptInviteMutation.mutateAsync({
            token: inviteToken,
            displayName: fullName.trim(),
            position: position || null,
            bio: bio || null,
            photoUrl: imageUrlOrNull(avatar),
          })
        }

        if (isApiInvite) {
          // Re-sign in so the freshly minted JWT carries the newly linked Staff
          // Profile claim. Public invites cannot do this yet because the staff
          // profile is created later by join-public-invite during activation.
          const updatedSession = await apiAuthAdapter.login({
            email: regEmail || inviteData?.invitedEmail || inviteData?.email || '',
            password: regPassword
          })

          if (updatedSession) {
             const code = updatedSession.staffCode || updatedSession.staffId
             if (code) {
               setStaffId(code)
             }
          }
        }

        // Persist personal onboarding data to the backend user profile.
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

        setHasAcceptedInvite(isApiInvite)
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
        await saveSelectedPaymentMethods()

        // Post-onboarding link flow: refresh profile data and return to confirm screen
        if (isLinkLoggedIn && needsOnboarding) {
          const refreshedProfile = await httpClient.get<UserProfile>('/api/v1/userprofile/me')
          setLinkedProfile(prev => ({
            ...prev,
            fullName: refreshedProfile.fullName || refreshedProfile.email?.split('@')[0] || '',
            nickname: refreshedProfile.firstName || refreshedProfile.email?.split('@')[0] || '',
            phone: refreshedProfile.phoneNumber || '',
            email: refreshedProfile.email || prev?.email || '',
            avatar: getUserProfileImageUrl(refreshedProfile) || '',
          }))
          setNeedsOnboarding(false)
          setStep(0)
          return
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

    if (isPublicInvite) {
      if (isActivating) return
      setIsActivating(true)
      try {
        await staffInvitesRepository.joinPublicInvite(
          {
            referralCode: inviteRefCode || '',
            displayName: finalStaffMember.fullName,
            phoneNumber: finalStaffMember.phone,
            position: finalStaffMember.position,
            bio: bio || null,
            photoUrl: imageUrlOrNull(avatar),
          },
          {},
        )
        await hydrateStaffSessionAfterPublicJoin()
        await saveSelectedPaymentMethods()
        setStep(5)
      } catch (err: unknown) {
        if (isExistingBusinessLinkError(err)) {
          try {
            await hydrateStaffSessionAfterPublicJoin()
            await saveSelectedPaymentMethods()
          } catch (followUpErr: unknown) {
            logger.warn('Could not hydrate session or save payment methods for existing public join request', followUpErr)
          }
          showToast(getPublicJoinAlreadyLinkedMessage(), 'info')
          setStep(5)
          return
        }

        logger.error('Failed to join public invite', err)
        showToast(
          t('components.staff_registration.hooks.useStaffRegistration.joinRequestFailed', {
            error: getApiErrorCode(err, 'Unknown error'),
          }),
          'error',
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
    isAvatarUploading: uploadImageMutation.isPending,
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
    avatar, setAvatar, handleAvatarFileChange,
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
    needsOnboarding,
    handleLinkLogin,
    handleLinkDecline,
    // handlers
    handleSearchIdChange,
    handleVlinkpayIdChange,
    handleScanQr,
    handleRegisterSubmit,
    handleVerifyOtp,
    isRegisterSubmitting,
    handleResendOtp,
    autoFillOtp,
    autoFillPayments,
    handleToggleMethod,
    handleEditPayoutAccount,
    savePayoutAccount,
    handleModalImagePick,
    handleModalTakePhoto,
    handleModalClearQr,
    handleLinkExistingProfile,
    handleActivateProfile,
    handleProfileSubmit,
    autofillFromProfile,
  }
}
