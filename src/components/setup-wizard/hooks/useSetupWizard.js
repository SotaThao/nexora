import { useState, useEffect } from 'react'
import { useTranslation } from '../../../contexts/LanguageContext'
import {
  useSaveMerchantSetup,
  useCreateBusiness,
  useUploadLogo,
  useUpdateReviewLinks,
  useCompleteOnboarding
} from '../../../data/hooks/useMerchantSetup'
import {
  useMerchantPaymentMethods,
  useSaveMerchantPayoutConfigs
} from '../../../data/hooks/useMerchantPaymentMethods'
import {
  DEMO_BUSINESS,
  DEMO_LINKS,
  DEMO_STAFF,
  DEFAULT_PAYOUT_CONFIGS,
  getPayoutConfigsFromMember
} from '../constants'

export default function useSetupWizard({ initialBusinessInfo, onBackToLogin, hasKyb }) {
  const { currentLanguage, setLanguage, t } = useTranslation()
  const saveMerchantSetup = useSaveMerchantSetup()
  const createBusinessMutation = useCreateBusiness()
  const uploadLogoMutation = useUploadLogo()
  const updateReviewLinksMutation = useUpdateReviewLinks()
  const completeOnboardingMutation = useCompleteOnboarding()
  const savePayoutConfigsMutation = useSaveMerchantPayoutConfigs()
  const [currentStep, setCurrentStep] = useState(1) // 1, 2, 3
  const isSsoLocked = !!hasKyb // Lock fields ONLY if business is already KYB approved

  // State for all steps
  const [businessInfo, setBusinessInfo] = useState({
    name: initialBusinessInfo?.name || '',
    industry: initialBusinessInfo?.industry || 'Nail Salon',
    address: initialBusinessInfo?.address || '',
    phone: initialBusinessInfo?.phone || '',
    website: initialBusinessInfo?.website || '',
    logo: initialBusinessInfo?.logo || null,
    paymentAccounts: {
      venmo: initialBusinessInfo?.paymentAccounts?.venmo || '',
      cashapp: initialBusinessInfo?.paymentAccounts?.cashapp || '',
      zelle: initialBusinessInfo?.paymentAccounts?.zelle || '',
      vlinkpay: initialBusinessInfo?.paymentAccounts?.vlinkpay || ''
    },
    payoutConfigs: { ...DEFAULT_PAYOUT_CONFIGS }
  })

  const [reviewLinks, setReviewLinks] = useState({
    googleReview: initialBusinessInfo?.reviewLinks?.googleReview || '',
    yelpReview: initialBusinessInfo?.reviewLinks?.yelpReview || '',
    facebookReview: initialBusinessInfo?.reviewLinks?.facebookReview || '',
    feedbackEmail: initialBusinessInfo?.reviewLinks?.feedbackEmail || initialBusinessInfo?.email || ''
  })

  const [staffList, setStaffList] = useState([])
  const [touchPoints, setTouchPoints] = useState([])

  // Staff input state
  const [newStaff, setNewStaff] = useState({
    fullName: '',
    nickname: '',
    position: 'Nail Tech',
    avatar: '',
    phone: '',
    email: '',
    venmo: '',
    cashapp: '',
    zelle: '',
    vlinkpay: '',
    payoutConfigs: { ...DEFAULT_PAYOUT_CONFIGS }
  })

  // Payout Sub-modal States
  const [payoutSetupOpen, setPayoutSetupOpen] = useState(false)
  const [payoutSetupWallet, setPayoutSetupWallet] = useState('venmo')
  const [tempPayoutValues, setTempPayoutValues] = useState({ value: '', qrCode: '', accountName: '' })

  // Touchpoint input state
  const [newTouchpoint, setNewTouchpoint] = useState({
    name: '',
    type: 'Table QR'
  })

  // Touchpoint editing states
  const [editingTpId, setEditingTpId] = useState(null)
  const [editingTpName, setEditingTpName] = useState('')
  const [editingTpType, setEditingTpType] = useState('Table QR')

  // QR preview modal state
  const [previewingTp, setPreviewingTp] = useState(null)

  // Validation errors
  const [errors, setErrors] = useState({})

  // Merchant consent checkbox
  const [isConsentChecked, setIsConsentChecked] = useState(false)

  // Merchant payment methods are pre-seeded by the backend when the business is
  // created at the end of step 1, so only fetch from step 2 onward.
  const merchantPaymentMethodsQuery = useMerchantPaymentMethods({ enabled: currentStep >= 2 })

  // Prefill payout toggles from GET /api/v1/merchant/payment-methods without
  // clobbering values the user already entered in this session.
  useEffect(() => {
    const methods = merchantPaymentMethodsQuery.data
    if (!methods?.length) return
    setBusinessInfo(prev => {
      const configs = { ...(prev.payoutConfigs || DEFAULT_PAYOUT_CONFIGS) }
      let changed = false
      for (const method of methods) {
        const key = (method.type || '').toLowerCase()
        const existing = configs[key]
        if (!existing || existing.value.trim()) continue
        if (!method.accountInfo && !method.isActive) continue
        configs[key] = { ...existing, enabled: !!method.isActive, value: method.accountInfo || '' }
        changed = true
      }
      return changed ? { ...prev, payoutConfigs: configs } : prev
    })
  }, [merchantPaymentMethodsQuery.data])

  // Translate default/personal touchpoints dynamically when language toggles
  useEffect(() => {
    setTouchPoints(prev => prev.map(tp => {
      if (tp.nameKey) {
        return {
          ...tp,
          name: tp.nameKey === 'setup.tp_personal_default'
            ? t('setup.tp_personal_default', { name: tp.staffName || '' })
            : t(tp.nameKey)
        }
      }
      return tp
    }))
  }, [currentLanguage, t])

  // Prefill demo data helper
  const prefillDemo = () => {
    setBusinessInfo(DEMO_BUSINESS)
    setReviewLinks(DEMO_LINKS)
    setStaffList(DEMO_STAFF.map(member => ({
      ...member,
      payoutConfigs: getPayoutConfigsFromMember(member)
    })))

    // Auto-generate touchpoints based on staff
    const initialTouchpoints = [
      { id: 'tp-main', nameKey: 'setup.tp_lobby_default', name: t('setup.tp_lobby_default'), type: 'Business Main', isActive: true, scans: 245 },
      { id: 'tp-front', nameKey: 'setup.tp_front_default', name: t('setup.tp_front_default'), type: 'Front Desk', isActive: true, scans: 842 },
      { id: 'tp-t1', name: 'Service Chair 01', type: 'Table QR', isActive: true, scans: 1102 },
      { id: 'tp-t2', name: 'Service Chair 02', type: 'Table QR', isActive: true, scans: 636 },
      { id: 'tp-receipt', name: 'Bottom-of-Receipt QR', type: 'Receipt QR', isActive: true, scans: 436 },
      ...DEMO_STAFF.map(s => ({
        id: `tp-staff-${s.id}`,
        nameKey: 'setup.tp_personal_default',
        name: t('setup.tp_personal_default', { name: s.nickname }),
        type: 'Staff QR',
        staffId: s.id,
        staffName: s.nickname,
        isActive: true,
        scans: 120
      }))
    ]
    setTouchPoints(initialTouchpoints)
    setErrors({})
  }

  // Handle file logo selection
  const handleLogoChange = async (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      try {
        const response = await uploadLogoMutation.mutateAsync(file)
        const finalUrl = response?.imageUrl || response
        setBusinessInfo(prev => ({ ...prev, logo: finalUrl }))
        if (errors.logo) setErrors(prev => ({ ...prev, logo: '' }))
      } catch (err) {
        setErrors(prev => ({ ...prev, logo: err.errorCode || 'Logo upload failed' }))
      }
    }
  }

  // Next Step Validation
  const validateStep = () => {
    const newErrors = {}

    if (currentStep === 1) {
      // Store Info validation
      if (!businessInfo.name.trim()) newErrors.name = t('setup.errors.name_required')
      if (!businessInfo.address.trim()) newErrors.address = t('setup.errors.address_required')
      if (!businessInfo.phone.trim()) newErrors.phone = t('setup.errors.phone_required')

      // Review Links validation (Optional)
      if (reviewLinks.googleReview && reviewLinks.googleReview.trim() && !reviewLinks.googleReview.startsWith('http')) {
        newErrors.googleReview = t('setup.errors.url_protocol')
      }

      if (reviewLinks.yelpReview && reviewLinks.yelpReview.trim() && !reviewLinks.yelpReview.startsWith('http')) {
        newErrors.yelpReview = t('setup.errors.url_protocol')
      }

      if (reviewLinks.facebookReview && reviewLinks.facebookReview.trim() && !reviewLinks.facebookReview.startsWith('http')) {
        newErrors.facebookReview = t('setup.errors.url_invalid')
      }

      if (reviewLinks.feedbackEmail && reviewLinks.feedbackEmail.trim() && !/\S+@\S+\.\S+/.test(reviewLinks.feedbackEmail)) {
        newErrors.feedbackEmail = t('setup.errors.email_invalid')
      }
    }

    if (currentStep === 2) {
      // Staff has been removed; no validation needed for step 2 right now
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = async () => {
    if (validateStep()) {
      if (currentStep === 1) {
        try {
          const businessDto = {
            name: businessInfo.name,
            businessType: businessInfo.industry,
            address: businessInfo.address,
            phone: businessInfo.phone,
            website: businessInfo.website,
            logoUrl: businessInfo.logo
          }
          const res = await createBusinessMutation.mutateAsync(businessDto)
          setBusinessInfo(prev => ({
            ...prev,
            businessId: res.businessId,
            customSlug: res.slug
          }))

          const linksDto = {
            googleReviewUrl: reviewLinks.googleReview,
            yelpUrl: reviewLinks.yelpReview,
            facebookUrl: reviewLinks.facebookReview,
            feedbackEmail: reviewLinks.feedbackEmail
          }
          await updateReviewLinksMutation.mutateAsync(linksDto)
        } catch (err) {
          const newErrors = {}
          if (err?.errorCode === 'BUSINESS_NAME_REQUIRED') {
            newErrors.name = t('setup.errors.name_required')
          } else if (err?.errorCode === 'USER_NOT_MERCHANT') {
            newErrors.submit = t('setup.errors.user_not_merchant')
            setTimeout(() => {
              onBackToLogin?.()
            }, 3000)
          } else {
            newErrors.submit = err.errorCode || 'Failed to save business profile.'
          }
          setErrors({
            ...errors,
            ...newErrors
          })
          return
        }
      }
      setCurrentStep(prev => prev + 1)
    }
  }

  const handleBack = () => {
    setCurrentStep(prev => prev - 1)
  }

  // Step 2: Add Staff Action
  const handleAddStaff = () => {
    const staffErrors = {}
    if (!newStaff.fullName.trim()) staffErrors.staffFullName = t('setup.errors.staff_name_required')
    if (!newStaff.nickname.trim()) staffErrors.staffNickname = t('setup.errors.staff_nickname_required')
    if (newStaff.email?.trim() && !/\S+@\S+\.\S+/.test(newStaff.email.trim())) {
      staffErrors.staffEmail = t('setup.errors.staff_email_invalid')
    }

    const configs = newStaff.payoutConfigs || DEFAULT_PAYOUT_CONFIGS
    const hasAnyActive = Object.values(configs).some(c => c.enabled && c.value.trim() !== '')
    if (!hasAnyActive && !newStaff.vlinkpay.trim()) {
      staffErrors.staffPayment = t('setup.errors.staff_payment_required')
    }

    if (Object.keys(staffErrors).length > 0) {
      setErrors({ ...errors, ...staffErrors })
      return
    }

    // Add to list
    const added = {
      id: Date.now().toString(),
      fullName: newStaff.fullName.trim(),
      nickname: newStaff.nickname.trim(),
      position: newStaff.position.trim() || 'Nail Tech',
      avatar: newStaff.avatar,
      phone: newStaff.phone.trim(),
      email: newStaff.email.trim(),
      showInTipsFlow: true,
      paymentAccounts: {
        venmo: configs.venmo?.enabled ? configs.venmo.value.trim() : '',
        cashapp: configs.cashapp?.enabled ? configs.cashapp.value.trim() : '',
        zelle: configs.zelle?.enabled ? configs.zelle.value.trim() : '',
        vlinkpay: newStaff.vlinkpay.trim(),
        paypal: configs.paypal?.enabled ? configs.paypal.value.trim() : '',
        bankwire: configs.bankwire?.enabled ? configs.bankwire.value.trim() : '',
        applecash: configs.applecash?.enabled ? configs.applecash.value.trim() : ''
      },
      payoutConfigs: configs
    }

    const updatedStaff = [...staffList, added]
    setStaffList(updatedStaff)

    // Update touchpoints dynamically to add personal QR for the new staff
    setTouchPoints(prev => [
      ...prev,
      {
        id: `tp-staff-${added.id}`,
        nameKey: 'setup.tp_personal_default',
        name: t('setup.tp_personal_default', { name: added.nickname }),
        type: 'Staff QR',
        staffId: added.id,
        staffName: added.nickname,
        isActive: true,
        scans: 0
      }
    ])

    // Clear form
    setNewStaff({
      fullName: '',
      nickname: '',
      position: 'Nail Tech',
      avatar: '',
      phone: '',
      email: '',
      venmo: '',
      cashapp: '',
      zelle: '',
      vlinkpay: '',
      payoutConfigs: { ...DEFAULT_PAYOUT_CONFIGS }
    })

    // Clear staff errors
    const cleanedErrors = { ...errors }
    delete cleanedErrors.staffFullName
    delete cleanedErrors.staffNickname
    delete cleanedErrors.staffPhone
    delete cleanedErrors.staffEmail
    delete cleanedErrors.staffPayment
    delete cleanedErrors.staffList
    setErrors(cleanedErrors)
  }

  const handleToggleWallet = (walletKey) => {
    const configs = businessInfo.payoutConfigs || DEFAULT_PAYOUT_CONFIGS
    const config = configs[walletKey] || { enabled: false, value: '', qrCode: '' }

    if (config.enabled) {
      setBusinessInfo({
        ...businessInfo,
        payoutConfigs: {
          ...configs,
          [walletKey]: { ...config, enabled: false }
        }
      })
    } else {
      setPayoutSetupWallet(walletKey)
      setTempPayoutValues({ value: config.value || '', qrCode: config.qrCode || '', accountName: config.accountName || '' })
      setPayoutSetupOpen(true)
    }
  }

  const openPayoutSetup = (walletKey) => {
    const configs = businessInfo.payoutConfigs || DEFAULT_PAYOUT_CONFIGS
    const config = configs[walletKey] || { enabled: false, value: '', qrCode: '' }
    setPayoutSetupWallet(walletKey)
    setTempPayoutValues({ value: config.value || '', qrCode: config.qrCode || '', accountName: config.accountName || '' })
    setPayoutSetupOpen(true)
  }

  const handlePayoutSubmit = (value, qrCode, accountName) => {
    const configs = businessInfo.payoutConfigs || DEFAULT_PAYOUT_CONFIGS
    setBusinessInfo({
      ...businessInfo,
      payoutConfigs: {
        ...configs,
        [payoutSetupWallet]: { enabled: true, value, qrCode, accountName }
      }
    })
    setPayoutSetupOpen(false)
  }

  // Step 2: Remove Staff Action
  const handleRemoveStaff = (id) => {
    const updated = staffList.filter(s => s.id !== id)
    setStaffList(updated)
    // Remove related touchpoint
    setTouchPoints(prev => prev.filter(tp => !(tp.type === 'Staff QR' && tp.staffId === id)))
  }

  // Step 2: Add Touch Point
  const handleAddTouchpoint = () => {
    if (!newTouchpoint.name.trim()) {
      setErrors({ ...errors, tpName: t('setup.errors.tp_name_required') })
      return
    }

    const added = {
      id: `tp-custom-${Date.now()}`,
      name: newTouchpoint.name.trim(),
      type: newTouchpoint.type,
      isActive: true,
      scans: 0
    }

    setTouchPoints([...touchPoints, added])
    setNewTouchpoint({ ...newTouchpoint, name: '' })

    const cleanedErrors = { ...errors }
    delete cleanedErrors.tpName
    setErrors(cleanedErrors)
  }

  // Step 2: Remove Touch Point
  const handleRemoveTouchpoint = (id) => {
    setTouchPoints(touchPoints.filter(tp => tp.id !== id))
  }

  // Step 2: Start Editing Touch Point
  const handleStartEditTouchpoint = (tp) => {
    setEditingTpId(tp.id)
    setEditingTpName(tp.name)
    setEditingTpType(tp.type)
  }

  // Step 2: Save Edited Touch Point
  const handleSaveTouchpoint = (id) => {
    if (!editingTpName.trim()) {
      return
    }
    setTouchPoints(prev => prev.map(tp => {
      if (tp.id === id) {
        const updated = {
          ...tp,
          name: editingTpName.trim(),
          type: editingTpType
        }
        // If the name is changed, remove the nameKey so that it doesn't get auto-translated
        if (tp.nameKey) {
          const originalTranslated = tp.nameKey === 'setup.tp_personal_default'
            ? t('setup.tp_personal_default', { name: tp.staffName || '' })
            : t(tp.nameKey)
          if (editingTpName.trim() !== originalTranslated) {
            delete updated.nameKey
          }
        }
        return updated
      }
      return tp
    }))
    setEditingTpId(null)
    setEditingTpName('')
  }

  // Final Complete — persist payout configs to the merchant payment-methods API
  // (PUT accountInfo + PATCH toggle on the pre-seeded methods), then complete onboarding.
  const handleCompleteSetup = (onComplete) => {
    savePayoutConfigsMutation.mutate(businessInfo.payoutConfigs, {
      onSuccess: () => {
        completeOnboardingMutation.mutate(undefined, {
          onSuccess: () => {
            onComplete({
              businessInfo,
              reviewLinks,
              staffList,
              touchPoints
            })
          },
          onError: (err) => {
            setErrors({
              ...errors,
              submit: err.errorCode || 'Failed to complete onboarding'
            })
          }
        })
      },
      onError: (err) => {
        setErrors({
          ...errors,
          submit: err.errorCode || 'Failed to save payout methods'
        })
      }
    })
  }

  // UI Step Indicator Helpers
  const stepIcon = (step) => {
    // Returns step number/icon info — used by shell
    return step
  }

  const stepName = (step) => {
    switch (step) {
      case 1: return t('setup.step_name_1')
      case 2: return t('components.setup_wizard.hooks.useSetupWizard.payoutAndQrTouchpoints')
      case 3: return t('setup.step_name_3')
      default: return ''
    }
  }

  return {
    // language
    currentLanguage,
    setLanguage,
    t,
    // step
    currentStep,
    setCurrentStep,
    isSsoLocked,
    // business
    businessInfo,
    setBusinessInfo,
    // review links
    reviewLinks,
    setReviewLinks,
    // staff
    staffList,
    setStaffList,
    newStaff,
    setNewStaff,
    // touchpoints
    touchPoints,
    setTouchPoints,
    newTouchpoint,
    setNewTouchpoint,
    editingTpId,
    setEditingTpId,
    editingTpName,
    setEditingTpName,
    editingTpType,
    setEditingTpType,
    previewingTp,
    setPreviewingTp,
    // payout modal
    payoutSetupOpen,
    setPayoutSetupOpen,
    payoutSetupWallet,
    setPayoutSetupWallet,
    tempPayoutValues,
    // consent
    isConsentChecked,
    setIsConsentChecked,
    // errors
    errors,
    setErrors,
    // handlers
    prefillDemo,
    handleLogoChange,
    validateStep,
    handleNext,
    handleBack,
    handleAddStaff,
    handleToggleWallet,
    openPayoutSetup,
    handlePayoutSubmit,
    handleRemoveStaff,
    handleAddTouchpoint,
    handleRemoveTouchpoint,
    handleStartEditTouchpoint,
    handleSaveTouchpoint,
    handleCompleteSetup,
    stepName
  }
}
