import { useState, useEffect } from 'react'
import { useTranslation } from '../../../contexts/LanguageContext'
import { storage } from '../../../utils/storage'
import {
  DEMO_BUSINESS,
  DEMO_LINKS,
  DEMO_STAFF,
  DEFAULT_PAYOUT_CONFIGS,
  getPayoutConfigsFromMember
} from '../constants'

const localStorage = storage
const sessionStorage = storage

export default function useSetupWizard({ initialBusinessInfo }) {
  const { currentLanguage, setLanguage, t } = useTranslation()
  const [currentStep, setCurrentStep] = useState(1) // 1, 2, 3
  const isSsoLocked = !!initialBusinessInfo

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
    }
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
  const handleLogoChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      const reader = new FileReader()
      reader.onload = (uploadEvent) => {
        setBusinessInfo({ ...businessInfo, logo: uploadEvent.target.result })
      }
      reader.readAsDataURL(file)
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

      // Store Payment validation
      const hasVenmo = businessInfo.paymentAccounts?.venmo?.trim()
      const hasCashapp = businessInfo.paymentAccounts?.cashapp?.trim()
      const hasZelle = businessInfo.paymentAccounts?.zelle?.trim()
      const hasVlinkpay = businessInfo.paymentAccounts?.vlinkpay?.trim()
      if (!hasVenmo && !hasCashapp && !hasZelle && !hasVlinkpay) {
        newErrors.storePayment = t('setup.errors.store_payment_required')
      }

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
      if (!isSsoLocked && staffList.length === 0) {
        newErrors.staffList = t('setup.errors.staff_empty')
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (validateStep()) {
      // Auto-populate default business touchpoints on moving from Step 1 to Step 2 if empty
      if (currentStep === 1 && touchPoints.length === 0) {
        setTouchPoints([
          { id: 'tp-main', nameKey: 'setup.tp_lobby_default', name: t('setup.tp_lobby_default'), type: 'Business Main', isActive: true, scans: 0 },
          { id: 'tp-front', nameKey: 'setup.tp_front_default', name: t('setup.tp_front_default'), type: 'Front Desk', isActive: true, scans: 0 }
        ])
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
      staffErrors.staffEmail = t('setup.errors.staff_email_invalid') || 'Invalid email address format.'
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
    const configs = newStaff.payoutConfigs || DEFAULT_PAYOUT_CONFIGS
    const config = configs[walletKey] || { enabled: false, value: '', qrCode: '' }

    if (config.enabled) {
      setNewStaff({
        ...newStaff,
        payoutConfigs: {
          ...configs,
          [walletKey]: { ...config, enabled: false }
        }
      })
    } else {
      if (config.value?.trim()) {
        setNewStaff({
          ...newStaff,
          payoutConfigs: {
            ...configs,
            [walletKey]: { ...config, enabled: true }
          }
        })
      } else {
        openPayoutSetup(walletKey)
      }
    }
  }

  const openPayoutSetup = (walletKey) => {
    const configs = newStaff.payoutConfigs || DEFAULT_PAYOUT_CONFIGS
    const config = configs[walletKey] || { enabled: false, value: '', qrCode: '' }
    setTempPayoutValues({
      value: config.value || '',
      qrCode: config.qrCode || '',
      accountName: config.accountName || newStaff.fullName || ''
    })
    setPayoutSetupWallet(walletKey)
    setPayoutSetupOpen(true)
  }

  const handlePayoutSubmit = (value, qrCode, accountName) => {
    const configs = newStaff.payoutConfigs || DEFAULT_PAYOUT_CONFIGS
    setNewStaff({
      ...newStaff,
      payoutConfigs: {
        ...configs,
        [payoutSetupWallet]: {
          enabled: true,
          value: value.trim(),
          qrCode: qrCode,
          accountName: accountName.trim()
        }
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

  // Final Complete
  const handleCompleteSetup = (onComplete) => {
    const data = {
      businessInfo,
      reviewLinks,
      staffList,
      touchPoints
    }
    localStorage.setItem('nexora_merchant_setup', JSON.stringify(data))
    sessionStorage.setItem('nexora_merchant_setup', JSON.stringify(data))
    onComplete(data)
  }

  // UI Step Indicator Helpers
  const stepIcon = (step) => {
    // Returns step number/icon info — used by shell
    return step
  }

  const stepName = (step) => {
    switch (step) {
      case 1: return t('setup.step_name_1')
      case 2: return isSsoLocked
        ? (currentLanguage === 'vi' ? 'Điểm chạm QR' : 'QR Touchpoints')
        : (t('setup.step_name_2') || 'Nhân viên & QR')
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
