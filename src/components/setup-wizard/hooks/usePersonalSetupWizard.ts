import { useState, useEffect } from 'react'
import { useTranslation } from '../../../contexts/LanguageContext'
import { useProfileSettings, useUpdateStaffProfile, useCreateStaffProfile, useUpdateBasicInfo } from '../../../data/hooks/useProfileSettings'
import { useCompletePersonalOnboarding } from '../../../data/hooks/usePersonalOnboarding'
import { useAuth } from '../../../auth/useAuth'
import { parsePhone } from '../../CountryCodeSelect'
import { captureQrImage } from '../../../utils/qrCode'
import { useUploadImage } from '../../../data/hooks/useMerchantSetup'
import { getPhoneFieldError, getRequiredFieldError } from '../../../utils/onboardingFieldValidation'
import { getPhoneFieldError, getRequiredFieldError } from '../../../utils/onboardingFieldValidation'

export default function usePersonalSetupWizard({ onBackToLogin }) {
  const { t, currentLanguage, setLanguage, renderLabel } = useTranslation()
  const { session, refreshSession } = useAuth()
  const { data: userProfile } = useProfileSettings()
  
  const createStaffProfileMutation = useCreateStaffProfile()
  const updateStaffProfileMutation = useUpdateStaffProfile()
  const updateBasicInfoMutation = useUpdateBasicInfo()
  const uploadImageMutation = useUploadImage()
  const completePersonalOnboardingMutation = useCompletePersonalOnboarding()

  const [currentStep, setCurrentStep] = useState(1)
  const [errors, setErrors] = useState<any>({})
  
  // Step 1: Profile
  const [nickname, setNickname] = useState('')
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [bio, setBio] = useState('')
  const [avatar, setAvatar] = useState<string | null>(null)
  const [position, setPosition] = useState('Nail Technician')
  
  const email = session?.email || ''
  const generatedStaffId = userProfile?.staffProfile?.staffCode || ''
  
  const phoneParsed = parsePhone(phone)

  // Step 2: Payouts
  const [payouts, setPayouts] = useState<any>({
    zelle: { enabled: false, value: '' },
    venmo: { enabled: false, value: '' },
    cashapp: { enabled: false, value: '' },
    bankwire: { enabled: false, value: '' },
  })
  
  // Modal states for Payout
  const [editingMethod, setEditingMethod] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [editQrCode, setEditQrCode] = useState('')
  const [editAccountName, setEditAccountName] = useState('')
  const [isCapturing, setIsCapturing] = useState(false)
  const [modalError, setModalError] = useState('')

  useEffect(() => {
    if (userProfile) {
      if (userProfile.firstName) setFullName(`${userProfile.firstName} ${userProfile.lastName || ''}`.trim())
      if (userProfile.nickname) setNickname(userProfile.nickname)
      if (userProfile.phoneNumber) setPhone(userProfile.phoneNumber)
      if (userProfile.profileImageUrl || userProfile.avatarUrl) setAvatar((userProfile.avatarUrl as string) || userProfile.profileImageUrl || null)
    }
  }, [userProfile])

  const handleProfileSetupSubmit = async () => {
    const fieldErrors: Record<string, string> = {}

    if (!fullName.trim()) {
      fieldErrors.fullName = getRequiredFieldError(fullName, 'setup.errors.staff_name_required')
    }
    if (!nickname.trim()) {
      fieldErrors.nickname = getRequiredFieldError(nickname, 'setup.errors.staff_nickname_required')
    }
    const phoneError = getPhoneFieldError(phone, { requireValue: true })
    if (phoneError) {
      fieldErrors.phone = phoneError
    }

    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors)
      return
    }

    try {
      const parsedName = nickname.trim() || email.split('@')[0]
      const nameParts = parsedName.split(' ')
      const fName = nameParts[0]
      const lName = nameParts.slice(1).join(' ') || undefined

      // 1. Update basic info so backend marks user as onboarded (has firstName)
      await updateBasicInfoMutation.mutateAsync({
        firstName: fName,
        lastName: lName,
        phoneNumber: phoneParsed?.nationalNumber?.length >= 7 ? phone : undefined
      })

      // 2. Update staff profile
      if (userProfile?.hasStaffProfile) {
        await updateStaffProfileMutation.mutateAsync({
          displayName: parsedName,
          position,
          bio,
          photoUrl: avatar || undefined
        })
      } else {
        await createStaffProfileMutation.mutateAsync({
          displayName: parsedName,
          position,
          bio,
          photoUrl: avatar || undefined
        })
      }

      setErrors({})
      setCurrentStep(2)
    } catch (err) {
      setErrors({ submit: t('register.errors.profile_setup_failed') })
    }
  }

  const handleAvatarFileChange = async (file: File) => {
    if (!file) return
    try {
      const uploaded = await uploadImageMutation.mutateAsync(file)
      const uploadedUrl = uploaded.imageUrl || uploaded.fileUrl || ''
      if (uploadedUrl) {
        setAvatar(uploadedUrl)
      }
    } catch (err: unknown) {
      console.error('Failed to upload staff avatar', err)
    }
  }

  const handlePersonalRegisterSubmit = async () => {
    // Validate payout method
    const hasConfiguredPayout = Object.values(payouts).some((p: any) => p.enabled && p.value.trim())
    if (!hasConfiguredPayout) {
      setErrors({ payout: t('components.register.hooks.useRegisterForm.thisFieldIsRequired') })
      return
    }
    setErrors({ ...errors, payout: '' })

    try {
      // Call Payout APIs
      await completePersonalOnboardingMutation.mutateAsync({
        accountData: {
          fullName: fullName.trim(),
          nickname: nickname.trim() || email.split('@')[0],
          phone,
          position
        },
        paymentAccounts: {},
        payoutConfigs: payouts
      })

      // Move to success
      setCurrentStep(3)
    } catch (err) {
      setErrors({ submit: t('register.errors.profile_setup_failed') })
    }
  }

  const handleToggleMethod = (key: string) => {
    setPayouts(prev => ({
      ...prev,
      [key]: { ...prev[key], enabled: !prev[key].enabled }
    }))
  }

  const handleEditPayoutAccount = (key: string) => {
    setEditingMethod(key)
    const current = payouts[key]
    if (current) {
      setEditValue(current.value || '')
      setEditQrCode(current.qrCode || '')
      setEditAccountName(current.accountName || '')
    }
    setModalError('')
  }

  const savePayoutAccount = () => {
    if (!editingMethod) return
    if (!editValue.trim() && !editQrCode) {
      setModalError(t('components.register.modals.PayoutEditModal.pleaseEnterHandleOrQr'))
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

  const handleModalImagePick = (dataUrl: string) => {
    setEditQrCode(dataUrl)
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

  const handleCompleteSetup = async () => {
    // Navigate to staff dashboard after refreshing session
    await refreshSession()
    window.location.href = '/staff'
  }

  const stepName = (step: number) => {
    switch (step) {
      case 1: return t('components.register.hooks.useRegisterForm.profileSetup')
      case 2: return t('components.register.hooks.useRegisterForm.payoutSetup')
      case 3: return t('components.register.hooks.useRegisterForm.success')
      default: return ''
    }
  }

  return {
    t, currentLanguage, setLanguage, renderLabel,
    currentStep, setCurrentStep,
    errors, setErrors,
    nickname, setNickname,
    fullName, setFullName,
    phone, setPhone, phoneParsed,
    bio, setBio,
    avatar, setAvatar,
    position, setPosition,
    email, generatedStaffId,
    payouts,
    editingMethod, setEditingMethod,
    editValue, setEditValue,
    editQrCode, setEditQrCode,
    editAccountName, setEditAccountName,
    isCapturing, modalError, setModalError,
    handleProfileSetupSubmit,
    handlePersonalRegisterSubmit,
    handleToggleMethod,
    handleEditPayoutAccount,
    savePayoutAccount,
    handleModalImagePick,
    handleModalTakePhoto,
    handleModalClearQr,
    handleAvatarFileChange,
    handleCompleteSetup,
    stepName,
    onBackToLogin
  }
}
