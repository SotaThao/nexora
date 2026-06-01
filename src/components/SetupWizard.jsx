import React, { useState, useEffect, useRef } from 'react'
import { 
  Sparkles, Building2, Link2, Users, QrCode, Download, 
  ArrowRight, ArrowLeft, Upload, Plus, Trash2, CheckCircle2, 
  AlertTriangle, Mail, Phone, Globe, Wallet, ShieldCheck, 
  MapPin, Clock, Check, Eye, LogIn, Scissors, Edit2, Camera, FolderOpen, X, HelpCircle,
  Search, ChevronDown
} from 'lucide-react'
import { useTranslation } from '../contexts/LanguageContext'
import { storage } from '../utils/storage'

const localStorage = storage
const sessionStorage = storage
import CustomSelect from './CustomSelect'
import CountryCodeSelect, { parsePhone } from './CountryCodeSelect'

// Helper to render text with styled star rating symbols (★) in luxuryGold and 4px space
export function renderTextWithGoldStars(text) {
  if (!text) return null
  const parts = text.split('★')
  return parts.map((part, index) => {
    if (index === parts.length - 1) {
      return part
    }
    return (
      <span key={index}>
        {part}
        <span className="text-luxuryGold ml-flox-4 inline-block font-normal">★</span>
      </span>
    )
  })
}

// Demo data for quick testing
const DEMO_BUSINESS = {
  name: 'Golden Glow Nail Spa & Salon',
  industry: 'Nail Salon',
  address: '1088 Gold Coast Hwy, Palm Beach, QLD 4221',
  phone: '+1 (555) 789-2026',
  website: 'https://goldenglownails.com',
  logo: null,
  paymentAccounts: {
    venmo: '@goldenglow-spa',
    cashapp: '$goldenglownails',
    zelle: 'payment@goldenglownails.com',
    vlinkpay: 'VLP-8893-GG'
  }
}

const DEMO_LINKS = {
  googleReview: 'https://g.page/r/cGoldenGlowNails/review',
  yelpReview: 'https://www.yelp.com/biz/golden-glow-nails-palm-beach',
  facebookReview: 'https://www.facebook.com/goldenglownails/reviews',
  feedbackEmail: 'manager@goldenglownails.com'
}

const DEMO_STAFF = [
  {
    id: 'NEX-STAFF-MIA0123',
    fullName: 'Mia Tran',
    nickname: 'Mia T.',
    position: 'Gel-X Artist',
    avatar: '',
    phone: '407-555-0123',
    email: 'mia.tran@gmail.com',
    showInTipsFlow: true,
    paymentAccounts: {
      venmo: '@mia-nails',
      cashapp: '$miaglow',
      zelle: 'mia.tran@gmail.com',
      vlinkpay: 'VLP-0123-MIA'
    }
  },
  {
    id: 'NEX-STAFF-VL8893',
    fullName: 'Vivian Le',
    nickname: 'Vivian L.',
    position: 'Acrylic Specialist',
    avatar: '',
    phone: '407-555-0199',
    email: 'vivian.le@gmail.com',
    showInTipsFlow: true,
    paymentAccounts: {
      venmo: '',
      cashapp: '$vivianle',
      zelle: '407-555-0199',
      vlinkpay: 'VLP-8893-VL'
    }
  },
  {
    id: 'NEX-STAFF-ASH0155',
    fullName: 'Ashley Park',
    nickname: 'Ashley P.',
    position: 'Pedicure Lead',
    avatar: '',
    phone: '407-555-0155',
    email: 'ashley@glownails.com',
    showInTipsFlow: true,
    paymentAccounts: {
      venmo: '@ashley-pedi',
      cashapp: '',
      zelle: 'ashley@glownails.com',
      vlinkpay: 'VLP-0155-ASH'
    }
  },
  {
    id: 'NEX-STAFF-HN1148',
    fullName: 'Hanna Nguyen',
    nickname: 'Hanna Ng.',
    position: 'Nail Art Designer',
    avatar: '',
    phone: '407-555-0144',
    email: 'hanna.art@gmail.com',
    showInTipsFlow: true,
    paymentAccounts: {
      venmo: '@hanna-art',
      cashapp: '',
      zelle: '',
      vlinkpay: 'VLP-1148-HN'
    }
  }
]

const WalletLogos = {
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
  zelle: (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] fill-[#7414CA]" xmlns="http://www.w3.org/2000/svg">
      <path d="M13.559 24h-2.841a.483.483 0 0 1-.483-.483v-2.765H5.638a.667.667 0 0 1-.666-.666v-2.234a.67.67 0 0 1 .142-.412l8.139-10.382h-7.25a.667.667 0 0 1-.667-.667V3.914c0-.367.299-.666.666-.666h4.23V.483c0-.266.217-.483.483-.483h2.841c.266 0 .483.217.483.483v2.765h4.323c.367 0 .666.299.666.666v2.137a.67.67 0 0 1-.141.41l-8.19 10.481h7.665c.367 0 .666.299.666.666v2.477a.667.667 0 0 1-.666.667h-4.32v2.765a.483.483 0 0 1-.483.483Z" />
    </svg>
  ),
  paypal: (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] fill-[#003087]" xmlns="http://www.w3.org/2000/svg">
      <path d="M20.09 6.85c-.45 2.24-1.93 7.82-2.18 8.87-.24 1.05-1.12 1.77-2.22 1.77h-3.32l-.96 6.02c-.08.5-.52.87-1.03.87H6.22c-.65 0-1.13-.59-.99-1.22L8.53 5.4c.14-.63.7-.1 1.33-.1h5.8c2.81 0 4.88 1.48 4.43 3.7.22-1.07.13-2.15-.36-3.05z" />
      <path d="M16.92 3.85c-.45 2.24-1.93 7.82-2.18 8.87-.24 1.05-1.12 1.77-2.22 1.77h-3.32l-.96 6.02c-.08.5-.52.87-1.03.87H3.06c-.65 0-1.13-.59-.99-1.22L5.37 2.4c.14-.63.7-1.1 1.33-1.1h5.8c2.81 0 4.88 1.48 4.43 3.7.22-1.07.13-2.15-.36-3.05z" opacity="0.6" />
    </svg>
  ),
  bankwire: (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] fill-[#475569]" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2L1 7v2h22V7L12 2zm0 18H3v-8h3v8h3v-8h3v8h3v-8h3v8h3v-8h3v8h3v-8h3v8h-3zm-11 2h22v2H1v-2z" />
    </svg>
  ),
  applecash: (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] fill-black" xmlns="http://www.w3.org/2000/svg">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83zM15.97 4.17c.66-.81 1.11-1.93.99-3.06-1 .04-2.22.67-2.94 1.51-.62.73-1.16 1.87-1.02 2.98 1.11.09 2.25-.56 2.97-1.43z" />
    </svg>
  ),
  vlinkpay: (
    <img src="/assets/vlinkpay-logo.png" alt="VLINKPAY Logo" className="h-[18px] w-[18px] object-contain" />
  )
}

const DEFAULT_PAYOUT_CONFIGS = {
  zelle: { enabled: false, value: '', qrCode: '', accountName: '' },
  bankwire: { enabled: false, value: '', qrCode: '', accountName: '' },
  paypal: { enabled: false, value: '', qrCode: '', accountName: '' },
  venmo: { enabled: false, value: '', qrCode: '', accountName: '' },
  cashapp: { enabled: false, value: '', qrCode: '', accountName: '' },
  applecash: { enabled: false, value: '', qrCode: '', accountName: '' }
}

const getPayoutConfigsFromMember = (member) => {
  const configs = {
    zelle: { enabled: false, value: '', qrCode: '', accountName: '' },
    bankwire: { enabled: false, value: '', qrCode: '', accountName: '' },
    paypal: { enabled: false, value: '', qrCode: '', accountName: '' },
    venmo: { enabled: false, value: '', qrCode: '', accountName: '' },
    cashapp: { enabled: false, value: '', qrCode: '', accountName: '' },
    applecash: { enabled: false, value: '', qrCode: '', accountName: '' }
  }
  const accounts = member.paymentAccounts || {}
  const memberConfigs = member.payoutConfigs || {}
  
  if (accounts.zelle || memberConfigs.zelle?.value) {
    configs.zelle = {
      enabled: memberConfigs.zelle ? memberConfigs.zelle.enabled : true,
      value: accounts.zelle || memberConfigs.zelle?.value || '',
      qrCode: memberConfigs.zelle?.qrCode || '',
      accountName: memberConfigs.zelle?.accountName || member.fullName || ''
    }
  }
  if (accounts.bankwire || memberConfigs.bankwire?.value) {
    configs.bankwire = {
      enabled: memberConfigs.bankwire ? memberConfigs.bankwire.enabled : true,
      value: accounts.bankwire || memberConfigs.bankwire?.value || '',
      qrCode: memberConfigs.bankwire?.qrCode || '',
      accountName: memberConfigs.bankwire?.accountName || member.fullName || ''
    }
  }
  if (accounts.paypal || memberConfigs.paypal?.value) {
    configs.paypal = {
      enabled: memberConfigs.paypal ? memberConfigs.paypal.enabled : true,
      value: accounts.paypal || memberConfigs.paypal?.value || '',
      qrCode: memberConfigs.paypal?.qrCode || '',
      accountName: memberConfigs.paypal?.accountName || member.fullName || ''
    }
  }
  if (accounts.venmo || memberConfigs.venmo?.value) {
    configs.venmo = {
      enabled: memberConfigs.venmo ? memberConfigs.venmo.enabled : true,
      value: accounts.venmo || memberConfigs.venmo?.value || '',
      qrCode: memberConfigs.venmo?.qrCode || '',
      accountName: memberConfigs.venmo?.accountName || member.fullName || ''
    }
  }
  if (accounts.cashapp || memberConfigs.cashapp?.value) {
    configs.cashapp = {
      enabled: memberConfigs.cashapp ? memberConfigs.cashapp.enabled : true,
      value: accounts.cashapp || memberConfigs.cashapp?.value || '',
      qrCode: memberConfigs.cashapp?.qrCode || '',
      accountName: memberConfigs.cashapp?.accountName || member.fullName || ''
    }
  }
  if (accounts.applecash || memberConfigs.applecash?.value) {
    configs.applecash = {
      enabled: memberConfigs.applecash ? memberConfigs.applecash.enabled : true,
      value: accounts.applecash || memberConfigs.applecash?.value || '',
      qrCode: memberConfigs.applecash?.qrCode || '',
      accountName: memberConfigs.applecash?.accountName || member.fullName || ''
    }
  }
  
  return configs
}

export default function SetupWizard({ 
  onComplete, 
  onBackToLogin, 
  initialBusinessInfo, 
  verificationStatus = 'kyb_approved',
  hasKyb = verificationStatus === 'kyb_approved', 
  onKybRequired 
}) {
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
  const newStaffPhoneParsed = parsePhone(newStaff.phone || '')

  // Payout Sub-modal States
  const [payoutSetupOpen, setPayoutSetupOpen] = useState(false)
  const [payoutSetupWallet, setPayoutSetupWallet] = useState('venmo')
  const [tempPayoutValues, setTempPayoutValues] = useState({ value: '', qrCode: '', accountName: '' })
  
  // Touchpoint input state
  const [newTouchpoint, setNewTouchpoint] = useState({
    name: '',
    type: 'Table QR'
  })

  // Validation errors
  const [errors, setErrors] = useState({})
  
  // Merchant consent checkbox
  const [isConsentChecked, setIsConsentChecked] = useState(false)

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
      { id: 'tp-main', name: 'Business Main Lobby QR', type: 'Business Main', isActive: true, scans: 245 },
      { id: 'tp-front', name: 'Reception Front Desk', type: 'Front Desk', isActive: true, scans: 842 },
      { id: 'tp-t1', name: 'Service Chair 01', type: 'Table QR', isActive: true, scans: 1102 },
      { id: 'tp-t2', name: 'Service Chair 02', type: 'Table QR', isActive: true, scans: 636 },
      { id: 'tp-receipt', name: 'Bottom-of-Receipt QR', type: 'Receipt QR', isActive: true, scans: 436 },
      ...DEMO_STAFF.map(s => ({
        id: `tp-staff-${s.id}`,
        name: `Personal QR - ${s.nickname}`,
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
      if (staffList.length === 0) {
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
          { id: 'tp-main', name: t('setup.tp_lobby_default'), type: 'Business Main', isActive: true, scans: 0 },
          { id: 'tp-front', name: t('setup.tp_front_default'), type: 'Front Desk', isActive: true, scans: 0 }
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

  // Final Complete
  const handleCompleteSetup = () => {
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
    switch (step) {
      case 1: return <Building2 className="w-5 h-5" />
      case 2: return <Users className="w-5 h-5" />
      case 3: return <Download className="w-5 h-5" />
      default: return null
    }
  }

  const stepName = (step) => {
    switch (step) {
      case 1: return t('setup.step_name_1')
      case 2: return t('setup.step_name_2')
      case 3: return t('setup.step_name_3')
      default: return ''
    }
  }


  return (
    <div className="relative min-h-dvh bg-nexoraCanvas text-nexoraText font-sans overflow-x-hidden selection:bg-nexoraBrandSoft selection:text-nexoraBrand pb-12 print:bg-transparent print:p-0 print:pb-0 print:m-0">
      {/* Background glowing effects */}
      <div className="absolute top-1/4 left-1/4 h-56 w-56 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[rgba(66,72,216,0.04)] via-transparent to-transparent blur-3xl pointer-events-none sm:h-96 sm:w-96 no-print"></div>
      <div className="absolute bottom-1/4 right-1/4 h-64 w-64 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[rgba(43,89,255,0.02)] via-transparent to-transparent blur-3xl pointer-events-none sm:h-[450px] sm:w-[450px] no-print"></div>

      {/* Main Container */}
      <div className="max-w-6xl mx-auto px-4 py-6 sm:py-8 relative z-10 flex flex-col min-h-dvh justify-between no-print">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between border-b border-nexoraBorder pb-6 mb-8 gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <img src="/assets/nexora-logo.png" alt="Nexora Logo" className="w-10 h-10 shrink-0 object-contain shadow-md" />
            <div className="min-w-0">
              <h1 className="font-sans text-xl font-bold tracking-wide sm:text-2xl text-nexoraText">
                NEXORA <span className="ml-1 inline-flex align-middle text-nexoraBrand font-sans text-xs tracking-widest font-black uppercase bg-nexoraBrand/10 px-2 py-0.5 rounded border border-nexoraBrand/30 sm:ml-2">TOUCH</span>
              </h1>
              <p className="text-xs text-nexoraSubtle font-light">By VLINKPAY Technologies</p>
            </div>
          </div>
          
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
            {onBackToLogin && (
              <button 
                onClick={onBackToLogin}
                className="min-h-11 text-xs flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-flox-inputs border border-nexoraBorder text-nexoraSubtle hover:text-nexoraText bg-white hover:bg-nexoraCanvas transition-all font-semibold shadow-sm"
              >
                <LogIn className="w-3.5 h-3.5" />
                {t('setup.back_to_login')}
              </button>
            )}
            <button 
              onClick={prefillDemo}
              className="min-h-11 text-xs flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-flox-inputs border border-dashed border-nexoraBrand/30 text-nexoraBrand bg-nexoraBrandSoft/40 hover:bg-nexoraBrandSoft transition-all font-semibold"
            >
              <Sparkles className="w-3.5 h-3.5" />
              {t('setup.prefill_demo_data')}
            </button>

            {/* Language Switcher */}
            <div className="flex items-center gap-1.5 bg-white border border-nexoraBorder px-3 py-1.5 rounded-flox-inputs min-h-11 shadow-sm">
              <button 
                type="button"
                onClick={() => setLanguage('vi')}
                className={`text-xs font-bold px-2 py-0.5 rounded transition ${currentLanguage === 'vi' ? 'bg-nexoraBrand text-white' : 'text-nexoraSubtle hover:text-nexoraText'}`}
              >
                VI
              </button>
              <span className="text-nexoraBorder text-xs">|</span>
              <button 
                type="button"
                onClick={() => setLanguage('en')}
                className={`text-xs font-bold px-2 py-0.5 rounded transition ${currentLanguage === 'en' ? 'bg-nexoraBrand text-white' : 'text-nexoraSubtle hover:text-nexoraText'}`}
              >
                EN
              </button>
            </div>

            <span className="inline-flex min-h-11 items-center justify-center text-xs text-nexoraSubtle bg-white px-3 py-1.5 rounded-flox-inputs border border-nexoraBorder shadow-sm">
              {t('setup.onboarding_stage')}
            </span>
          </div>
        </header>

        {/* Wizard Progress Bar */}
        <div className="mb-8 overflow-x-auto pb-3 sm:mb-10 sm:overflow-visible sm:pb-0">
          <div className="relative flex min-w-[320px] max-w-xl mx-auto items-center justify-between sm:min-w-0">
            {/* Background Line */}
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-[2px] bg-nexoraBorder -z-10"></div>
            {/* Active Highlight Line */}
            <div 
              className="absolute left-0 top-1/2 -translate-y-1/2 h-[2px] bg-nexoraBrand -z-10 transition-all duration-500"
              style={{ width: `${((currentStep - 1) / 2) * 100}%` }}
            ></div>

            {[1, 2, 3].map((step) => {
              const isActive = step === currentStep
              const isCompleted = step < currentStep
              return (
                <div key={step} className="flex flex-col items-center px-1">
                  <div 
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 border-2 font-bold cursor-pointer
                      ${isActive 
                        ? 'bg-white border-nexoraBrand text-nexoraBrand shadow-[0_4px_12px_rgba(70,72,216,0.2)] scale-110' 
                        : isCompleted
                          ? 'bg-nexoraBrand border-nexoraBrand text-white'
                          : 'bg-white border-nexoraBorder text-nexoraSubtle'
                      }`}
                    onClick={() => {
                      if (step <= currentStep || (step > currentStep && validateStep())) {
                        setCurrentStep(step)
                      }
                    }}
                  >
                    {isCompleted ? <Check className="w-5 h-5 stroke-[3px]" /> : step}
                  </div>
                  <span className={`mt-2 whitespace-nowrap text-center text-[10px] font-semibold tracking-wide transition-colors duration-300 md:text-xs
                    ${isActive ? 'text-nexoraBrand font-bold' : isCompleted ? 'text-nexoraText' : 'text-nexoraSubtle'}`}>
                    {stepName(step)}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Wizard Panel (Step Body) */}
        <main className="flex-grow py-4">
          <div className="w-full bg-white rounded-2xl p-5 sm:p-8 md:p-10 border border-nexoraBorder shadow-premium relative overflow-hidden flex flex-col justify-between">
            
            {/* Subtle light glow inside panel */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[rgba(70,72,216,0.03)] via-transparent to-transparent rounded-full pointer-events-none"></div>

            {/* Error Banner */}
            {errors.staffList && (
              <div className="mb-6 p-4 rounded-flox-cards bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
                <span>{errors.staffList}</span>
              </div>
            )}

            {/* Step Content */}
            
            {/* STEP 1: STORE SETUP & REVIEW ROUTING LINKS (MERGED) */}
            {currentStep === 1 && (
              <div className="space-y-6 animate-fadeIn">
                <div className="border-b border-nexoraRule pb-4 mb-4">
                  <h2 className="font-sans text-xl md:text-2xl font-bold flex items-center gap-2.5 text-nexoraText">
                    <Building2 className="text-nexoraBrand w-6 h-6" />
                    {t('setup.title_step_1')}
                  </h2>
                  <p className="text-nexoraSubtle text-sm mt-1">{t('setup.desc_step_1')}</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  
                  {/* Left Column - Store Info & Logo */}
                  <div className="lg:col-span-6 space-y-5 lg:border-r lg:border-nexoraRule lg:pr-8">
                    <h3 className="text-xs font-bold text-nexoraText uppercase tracking-wider border-b border-nexoraRule pb-2">
                      {t('setup.store_info_title')}
                    </h3>

                    {/* Logo uploader compact row */}
                    <div>
                      <label className="block text-[10px] font-bold text-nexoraText uppercase tracking-wider mb-2">{t('setup.store_logo')}</label>
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-xl border border-dashed border-nexoraBorder bg-nexoraCanvas flex items-center justify-center p-1 relative group shadow-sm ${isSsoLocked ? 'bg-slate-100 cursor-not-allowed border-slate-200' : 'cursor-pointer hover:border-nexoraBrand transition'}`}>
                          {businessInfo.logo ? (
                            <img src={businessInfo.logo} alt="Store logo" className="w-full h-full object-contain rounded-lg" />
                          ) : (
                            <Upload className="w-4 h-4 text-nexoraSubtle" />
                          )}
                          {!isSsoLocked && (
                            <input 
                              type="file" 
                              accept="image/*"
                              className="absolute inset-0 opacity-0 cursor-pointer"
                              onChange={handleLogoChange}
                            />
                          )}
                        </div>
                        <span className="text-[10px] text-nexoraSubtle">{t('setup.logo_hint')}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="flex items-center text-[10px] font-bold text-nexoraText uppercase tracking-wider mb-2">
                          <span>{t('setup.store_name')}</span>
                          <div className="relative group inline-block ml-1.5 align-middle normal-case font-normal text-nexoraSubtle">
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
                          disabled={isSsoLocked}
                          placeholder={t('setup.store_name_placeholder')}
                          className={`w-full bg-nexoraCanvas border ${errors.name ? 'border-red-300 focus:border-red-500' : 'border-nexoraBorder focus:border-nexoraBrand focus:bg-white'} ${isSsoLocked ? 'bg-slate-100 text-nexoraSubtle cursor-not-allowed border-slate-200' : ''} rounded-lg px-4 py-2.5 text-sm text-nexoraText focus:outline-none placeholder-nexoraSubtle focus:ring-0 transition-all`}
                          value={businessInfo.name}
                          onChange={(e) => {
                            if (isSsoLocked) return
                            setBusinessInfo({ ...businessInfo, name: e.target.value })
                            if (errors.name) setErrors({ ...errors, name: '' })
                          }}
                        />
                        {errors.name && <span className="text-xs text-red-500 mt-1 block">{errors.name}</span>}
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-nexoraText uppercase tracking-wider mb-2">{t('setup.business_category')}</label>
                        <CustomSelect
                          buttonClass="bg-nexoraCanvas focus:bg-white"
                          disabled={isSsoLocked}
                          value={businessInfo.industry}
                          onChange={(e) => {
                            if (isSsoLocked) return
                            setBusinessInfo({ ...businessInfo, industry: e.target.value })
                          }}
                          options={[
                            { value: 'Nail Salon', label: t('setup.biz_type_nail') },
                            { value: 'Restaurant', label: t('setup.biz_type_restaurant') },
                            { value: 'Cafe', label: t('setup.biz_type_cafe') },
                            { value: 'Spa', label: t('setup.biz_type_spa') },
                            { value: 'Khác', label: t('setup.biz_type_other') }
                          ]}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="flex items-center text-[10px] font-bold text-nexoraText uppercase tracking-wider mb-2">
                        <span>{t('setup.store_address')}</span>
                        <div className="relative group inline-block ml-1.5 align-middle normal-case font-normal text-nexoraSubtle">
                          <HelpCircle className="w-3.5 h-3.5 hover:text-nexoraBrand cursor-help transition-colors" />
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-48 bg-black text-white text-[10px] p-2.5 rounded-lg shadow-xl z-50 text-center leading-normal">
                            {currentLanguage === 'vi'
                              ? 'Cung cấp địa chỉ thực của cửa hàng. Được sử dụng để bản địa hóa và xác minh.'
                              : 'Provide the physical location of your store. Used for localization and verification purposes.'}
                            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1.5 border-4 border-transparent border-t-black"></div>
                          </div>
                        </div>
                      </label>
                      <div className="relative">
                        <MapPin className="absolute left-3.5 top-3.5 w-4 h-4 text-nexoraSubtle" />
                        <input 
                          type="text"
                          disabled={isSsoLocked}
                          placeholder={t('setup.store_address_placeholder')}
                          className={`w-full bg-nexoraCanvas border ${errors.address ? 'border-red-300 focus:border-red-500' : 'border-nexoraBorder focus:border-nexoraBrand focus:bg-white'} ${isSsoLocked ? 'bg-slate-100 text-nexoraSubtle cursor-not-allowed border-slate-200' : ''} rounded-lg pl-11 pr-4 py-2.5 text-sm text-nexoraText focus:outline-none placeholder-nexoraSubtle focus:ring-0 transition-all`}
                          value={businessInfo.address}
                          onChange={(e) => {
                            if (isSsoLocked) return
                            setBusinessInfo({ ...businessInfo, address: e.target.value })
                            if (errors.address) setErrors({ ...errors, address: '' })
                          }}
                        />
                      </div>
                      {errors.address && <span className="text-xs text-red-500 mt-1 block">{errors.address}</span>}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-nexoraText uppercase tracking-wider mb-2">{t('setup.store_phone')}</label>
                        <div className="relative">
                          <Phone className="absolute left-3.5 top-3.5 w-4 h-4 text-nexoraSubtle" />
                          <input 
                            type="text"
                            disabled={isSsoLocked}
                            placeholder="+1 (555) 789-2026"
                            className={`w-full bg-nexoraCanvas border ${errors.phone ? 'border-red-300 focus:border-red-500' : 'border-nexoraBorder focus:border-nexoraBrand focus:bg-white'} ${isSsoLocked ? 'bg-slate-100 text-nexoraSubtle cursor-not-allowed border-slate-200' : ''} rounded-lg pl-11 pr-4 py-2.5 text-sm text-nexoraText focus:outline-none placeholder-nexoraSubtle focus:ring-0 transition-all`}
                            value={businessInfo.phone}
                            onChange={(e) => {
                              if (isSsoLocked) return
                              setBusinessInfo({ ...businessInfo, phone: e.target.value })
                              if (errors.phone) setErrors({ ...errors, phone: '' })
                            }}
                          />
                        </div>
                        {errors.phone && <span className="text-xs text-red-500 mt-1 block">{errors.phone}</span>}
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-nexoraText uppercase tracking-wider mb-2">{t('setup.store_website')}</label>
                        <div className="relative">
                          <Globe className="absolute left-3.5 top-3.5 w-4 h-4 text-nexoraSubtle" />
                          <input 
                            type="url"
                            disabled={isSsoLocked}
                            placeholder="https://spasalon.com"
                            className={`w-full bg-nexoraCanvas border border-nexoraBorder focus:border-nexoraBrand focus:bg-white ${isSsoLocked ? 'bg-slate-100 text-nexoraSubtle cursor-not-allowed border-slate-200' : ''} rounded-lg pl-11 pr-4 py-2.5 text-sm text-nexoraText focus:outline-none placeholder-nexoraSubtle focus:ring-0 transition-all`}
                            value={businessInfo.website}
                            onChange={(e) => {
                              if (isSsoLocked) return
                              setBusinessInfo({ ...businessInfo, website: e.target.value })
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Store Payment Methods */}
                    <div className="space-y-4 pt-2">
                      <h3 className="text-xs font-bold text-nexoraText uppercase tracking-wider border-b border-nexoraRule pb-2 mt-4">
                        {t('setup.store_payment_title')}
                      </h3>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-bold text-nexoraText uppercase tracking-wider mb-2">{t('setup.wallet_zelle')}</label>
                          <input 
                            type="text"
                            placeholder={t('setup.wallet_zelle_placeholder')}
                            className="w-full bg-nexoraCanvas border border-nexoraBorder focus:border-nexoraBrand focus:bg-white rounded-lg px-4 py-2.5 text-sm text-nexoraText focus:outline-none placeholder-nexoraSubtle transition-all"
                            value={businessInfo.paymentAccounts?.zelle || ''}
                            onChange={(e) => setBusinessInfo({
                              ...businessInfo,
                              paymentAccounts: {
                                ...businessInfo.paymentAccounts,
                                zelle: e.target.value
                              }
                            })}
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-nexoraText uppercase tracking-wider mb-2">{t('setup.wallet_venmo')}</label>
                          <input 
                            type="text"
                            placeholder={t('setup.wallet_venmo_placeholder')}
                            className="w-full bg-nexoraCanvas border border-nexoraBorder focus:border-nexoraBrand focus:bg-white rounded-lg px-4 py-2.5 text-sm text-nexoraText focus:outline-none placeholder-nexoraSubtle transition-all"
                            value={businessInfo.paymentAccounts?.venmo || ''}
                            onChange={(e) => setBusinessInfo({
                              ...businessInfo,
                              paymentAccounts: {
                                ...businessInfo.paymentAccounts,
                                venmo: e.target.value
                              }
                            })}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-bold text-nexoraText uppercase tracking-wider mb-2">{t('setup.wallet_cashapp')}</label>
                          <input 
                            type="text"
                            placeholder={t('setup.wallet_cashapp_placeholder')}
                            className="w-full bg-nexoraCanvas border border-nexoraBorder focus:border-nexoraBrand focus:bg-white rounded-lg px-4 py-2.5 text-sm text-nexoraText focus:outline-none placeholder-nexoraSubtle transition-all"
                            value={businessInfo.paymentAccounts?.cashapp || ''}
                            onChange={(e) => setBusinessInfo({
                              ...businessInfo,
                              paymentAccounts: {
                                ...businessInfo.paymentAccounts,
                                cashapp: e.target.value
                              }
                            })}
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-nexoraText uppercase tracking-wider mb-2">{t('setup.wallet_vlinkpay')}</label>
                          <input 
                            type="text"
                            disabled={isSsoLocked}
                            placeholder="VLP-XXXX-XX"
                            className={`w-full bg-nexoraCanvas border border-nexoraBorder focus:border-nexoraBrand focus:bg-white ${isSsoLocked ? 'bg-slate-100 text-nexoraSubtle cursor-not-allowed border-slate-200' : ''} rounded-lg px-4 py-2.5 text-sm text-nexoraText focus:outline-none placeholder-nexoraSubtle transition-all`}
                            value={businessInfo.paymentAccounts?.vlinkpay || ''}
                            onChange={(e) => {
                              if (isSsoLocked) return
                              setBusinessInfo({
                                ...businessInfo,
                                paymentAccounts: {
                                  ...businessInfo.paymentAccounts,
                                  vlinkpay: e.target.value
                                }
                              })
                            }}
                          />
                        </div>
                      </div>
                      {errors.storePayment && <span className="text-xs text-red-500 mt-1 block">{errors.storePayment}</span>}
                    </div>
                  </div>
                  
                  {/* Right Column - Review Routing Links */}
                  <div className="lg:col-span-6 space-y-5">
                    <h3 className="text-xs font-bold text-nexoraText uppercase tracking-wider border-b border-nexoraRule pb-2">
                      {t('setup.review_routing_title')}
                    </h3>

                    {/* Routing explainer card */}
                    <div className="p-4.5 rounded-xl border border-nexoraBrandSoft bg-nexoraBrandSoft/40 text-xs text-nexoraText flex gap-3 leading-relaxed shadow-sm">
                      <ShieldCheck className="w-5 h-5 text-nexoraBrand shrink-0" />
                      <div>
                        {renderTextWithGoldStars(t('setup.review_routing_policy'))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-nexoraText uppercase tracking-wider mb-2">{t('setup.google_review_link')}</label>
                      <input 
                        type="url"
                        placeholder="https://g.page/r/cxxxxxx/review"
                        className={`w-full bg-nexoraCanvas border ${errors.googleReview ? 'border-red-300 focus:border-red-500' : 'border-nexoraBorder focus:border-nexoraBrand focus:bg-white'} rounded-lg px-4 py-2.5 text-sm text-nexoraText focus:outline-none placeholder-nexoraSubtle focus:ring-0 transition-all`}
                        value={reviewLinks.googleReview}
                        onChange={(e) => {
                          setReviewLinks({ ...reviewLinks, googleReview: e.target.value })
                          if (errors.googleReview) setErrors({ ...errors, googleReview: '' })
                        }}
                      />
                      {errors.googleReview && <span className="text-xs text-red-500 mt-1 block">{errors.googleReview}</span>}
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-nexoraText uppercase tracking-wider mb-2">{t('setup.yelp_review_link')}</label>
                      <input 
                        type="url"
                        placeholder="https://www.yelp.com/biz/your-store"
                        className={`w-full bg-nexoraCanvas border ${errors.yelpReview ? 'border-red-300 focus:border-red-500' : 'border-nexoraBorder focus:border-nexoraBrand focus:bg-white'} rounded-lg px-4 py-2.5 text-sm text-nexoraText focus:outline-none placeholder-nexoraSubtle focus:ring-0 transition-all`}
                        value={reviewLinks.yelpReview}
                        onChange={(e) => {
                          setReviewLinks({ ...reviewLinks, yelpReview: e.target.value })
                          if (errors.yelpReview) setErrors({ ...errors, yelpReview: '' })
                        }}
                      />
                      {errors.yelpReview && <span className="text-xs text-red-500 mt-1 block">{errors.yelpReview}</span>}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-nexoraText uppercase tracking-wider mb-2">{t('setup.facebook_link')}</label>
                        <input 
                          type="url"
                          placeholder="https://facebook.com/reviews"
                          className="w-full bg-nexoraCanvas border border-nexoraBorder focus:border-nexoraBrand focus:bg-white rounded-lg px-4 py-2.5 text-sm text-nexoraText focus:outline-none placeholder-nexoraSubtle focus:ring-0 transition-all"
                          value={reviewLinks.facebookReview}
                          onChange={(e) => setReviewLinks({ ...reviewLinks, facebookReview: e.target.value })}
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-nexoraText uppercase tracking-wider mb-2">{renderTextWithGoldStars(t('setup.feedback_email'))}</label>
                        <input 
                          type="email"
                          placeholder="manager@yourstore.com"
                          className={`w-full bg-nexoraCanvas border ${errors.feedbackEmail ? 'border-red-300 focus:border-red-500' : 'border-nexoraBorder focus:border-nexoraBrand focus:bg-white'} rounded-lg px-4 py-2.5 text-sm text-nexoraText focus:outline-none placeholder-nexoraSubtle focus:ring-0 transition-all`}
                          value={reviewLinks.feedbackEmail}
                          onChange={(e) => {
                            setReviewLinks({ ...reviewLinks, feedbackEmail: e.target.value })
                            if (errors.feedbackEmail) setErrors({ ...errors, feedbackEmail: '' })
                          }}
                        />
                        {errors.feedbackEmail && <span className="text-xs text-red-500 mt-1 block">{errors.feedbackEmail}</span>}
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* STEP 2: STAFF LIST & TOUCHPOINTS DIRECTORY (MERGED) */}
            {currentStep === 2 && (
              <div className="space-y-6 animate-fadeIn">
                <div className="border-b border-nexoraRule pb-4 mb-4">
                  <h2 className="font-sans text-xl md:text-2xl font-bold flex items-center gap-2.5 text-nexoraText">
                    <Users className="text-nexoraBrand w-6 h-6" />
                    {t('setup.title_step_2')}
                  </h2>
                  <p className="text-nexoraSubtle text-sm mt-1">
                    {t('setup.desc_step_2')}
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  
                  {/* Left Column: Staff Creation & Grid list */}
                  <div className="lg:col-span-6 space-y-6 lg:border-r lg:border-nexoraRule lg:pr-8">
                    {/* Add Staff form */}
                    <div className="space-y-4">
                      <h3 className="text-xs font-bold text-nexoraText uppercase tracking-wider flex items-center gap-1.5 pb-1">
                        <Plus className="w-4 h-4 text-nexoraBrand" /> {t('setup.add_staff_title')}
                      </h3>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-bold text-nexoraText uppercase tracking-wider mb-1">{t('setup.staff_fullname')}</label>
                          <input 
                            type="text"
                            placeholder={t('setup.staff_fullname_placeholder')}
                            className={`w-full bg-nexoraCanvas border ${errors.staffFullName ? 'border-red-300 focus:border-red-500' : 'border-nexoraBorder focus:border-nexoraBrand focus:bg-white'} rounded-lg px-3 py-2 text-sm text-nexoraText focus:outline-none transition-all`}
                            value={newStaff.fullName}
                            onChange={(e) => setNewStaff({ ...newStaff, fullName: e.target.value })}
                          />
                          {errors.staffFullName && <span className="text-[10px] text-red-500 mt-0.5 block">{errors.staffFullName}</span>}
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-nexoraText uppercase tracking-wider mb-1">{t('setup.staff_displayname')}</label>
                          <input 
                            type="text"
                            placeholder={t('setup.staff_displayname_placeholder')}
                            className={`w-full bg-nexoraCanvas border ${errors.staffNickname ? 'border-red-300 focus:border-red-500' : 'border-nexoraBorder focus:border-nexoraBrand focus:bg-white'} rounded-lg px-3 py-2 text-sm text-nexoraText focus:outline-none transition-all`}
                            value={newStaff.nickname}
                            onChange={(e) => setNewStaff({ ...newStaff, nickname: e.target.value })}
                          />
                          {errors.staffNickname && <span className="text-[10px] text-red-500 mt-0.5 block">{errors.staffNickname}</span>}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-4">
                        <div>
                          <label className="block text-[10px] font-bold text-nexoraText uppercase tracking-wider mb-1">{t('setup.staff_position')}</label>
                          <input 
                            type="text"
                            placeholder={t('setup.staff_position_placeholder')}
                            className="w-full bg-nexoraCanvas border border-nexoraBorder focus:border-nexoraBrand focus:bg-white rounded-lg px-3 py-2 text-sm text-nexoraText focus:outline-none transition-all"
                            value={newStaff.position}
                            onChange={(e) => setNewStaff({ ...newStaff, position: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-bold text-nexoraText uppercase tracking-wider mb-1">{t('setup.staff_phone') || 'Phone Number'}</label>
                          <div className="flex rounded-lg shadow-sm">
                            <CountryCodeSelect
                              value={newStaffPhoneParsed.countryCode}
                              onChange={(newCode) => {
                                setNewStaff({ ...newStaff, phone: `${newCode} ${newStaffPhoneParsed.nationalNumber}`.trim() })
                              }}
                            />
                            <input 
                              type="text"
                              placeholder={t('setup.staff_phone_placeholder') || 'e.g., 407-555-0123'}
                              className="h-10 w-full bg-nexoraCanvas border border-l-0 border-nexoraBorder focus:border-nexoraBrand focus:bg-white rounded-r-lg px-3 text-sm text-nexoraText focus:outline-none transition-all min-w-0"
                              value={newStaffPhoneParsed.nationalNumber}
                              onChange={(e) => setNewStaff({ ...newStaff, phone: `${newStaffPhoneParsed.countryCode} ${e.target.value}`.trim() })}
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-nexoraText uppercase tracking-wider mb-1">{t('setup.staff_email') || 'Email Address'}</label>
                          <input 
                            type="text"
                            placeholder={t('setup.staff_email_placeholder') || 'e.g., mia.tran@gmail.com'}
                            className={`w-full bg-nexoraCanvas border ${errors.staffEmail ? 'border-red-300 focus:border-red-500' : 'border-nexoraBorder focus:border-nexoraBrand focus:bg-white'} rounded-lg px-3 py-2 text-sm text-nexoraText focus:outline-none transition-all`}
                            value={newStaff.email}
                            onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
                          />
                          {errors.staffEmail && <span className="text-[10px] text-red-500 mt-0.5 block">{errors.staffEmail}</span>}
                        </div>
                      </div>

                      <div className="mt-4">
                        <label className="text-[10px] font-bold uppercase text-nexoraText tracking-wider block mb-2">
                          {t('setup.payout_methods') || 'Payout Methods'}
                        </label>
                        <div className="divide-y divide-slate-100 rounded-xl border border-nexoraBorder bg-white px-4">
                          {[
                            { name: 'Zelle', key: 'zelle' },
                            { name: 'Bank Wire', key: 'bankwire' },
                            { name: 'PayPal', key: 'paypal' },
                            { name: 'Venmo', key: 'venmo' },
                            { name: 'Cash App', key: 'cashapp' },
                            { name: 'Apple Cash', key: 'applecash' }
                          ].map((wallet) => {
                            const config = (newStaff.payoutConfigs && newStaff.payoutConfigs[wallet.key]) || { enabled: false, value: '', qrCode: '' }
                            
                            return (
                              <div key={wallet.key} className="flex items-center justify-between py-3.5">
                                <div className="flex items-center gap-3">
                                  <button
                                    type="button"
                                    onClick={() => handleToggleWallet(wallet.key)}
                                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                      config.enabled ? 'bg-amber-600' : 'bg-slate-200'
                                    }`}
                                  >
                                    <span
                                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                        config.enabled ? 'translate-x-5' : 'translate-x-0'
                                      }`}
                                    />
                                  </button>
                                  <div className="flex items-center gap-2">
                                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-50 shrink-0">
                                      {WalletLogos[wallet.key]}
                                    </span>
                                    <span className="text-xs font-bold text-slate-700">{wallet.name}</span>
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => openPayoutSetup(wallet.key)}
                                  className="flex items-center gap-1 text-[11px] font-bold text-amber-600 hover:text-amber-700 transition"
                                >
                                  <Edit2 className="h-3 w-3 stroke-[2.5]" />
                                  <span>{t('setup.payout_account') || 'Payout account'}</span>
                                </button>
                              </div>
                            )
                          })}
                        </div>
                        {errors.staffPayment && (
                          <p className="mt-2 flex items-center gap-1 text-xs font-bold text-rose-600">
                            <AlertTriangle className="h-3.5 w-3.5" />
                            {errors.staffPayment}
                          </p>
                        )}
                      </div>

                      <div className="flex justify-end mt-4">
                        <button 
                          type="button"
                          onClick={handleAddStaff}
                          className="w-full min-h-[38px] bg-nexoraBrand hover:bg-nexoraBrandDark text-white font-extrabold text-xs uppercase tracking-wider rounded-lg flex items-center justify-center gap-1 transition-all shadow-sm"
                        >
                          <Plus className="w-4 h-4 stroke-[3px]" /> {t('setup.add_staff_btn')}
                        </button>
                      </div>
                    </div>

                    {/* Staff List rendering */}
                    <div className="space-y-3">
                      <h4 className="text-[10px] font-black uppercase text-nexoraMuted tracking-wider">{t('setup.staff_directory_title')} ({staffList.length})</h4>
                      {staffList.length === 0 ? (
                        <div className="border border-dashed border-nexoraBorder bg-white rounded-xl p-6 text-center text-nexoraSubtle text-xs">
                          {t('setup.staff_directory_empty')}
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[220px] overflow-y-auto pr-1">
                          {staffList.map((staff) => (
                            <div 
                              key={staff.id} 
                              className="p-3 rounded-xl border border-nexoraBorder bg-white hover:border-nexoraBrand/40 transition shadow-sm flex items-center justify-between"
                            >
                              <div className="min-w-0 flex items-center gap-2.5">
                                <div className="w-9 h-9 rounded-full bg-nexoraBrandSoft border border-nexoraBrandSoft text-nexoraBrand flex items-center justify-center font-bold font-sans text-xs">
                                  {staff.nickname.charAt(0)}
                                </div>
                                <div className="min-w-0">
                                  <div className="truncate text-xs font-bold text-nexoraText">{staff.fullName}</div>
                                  <div className="text-[10px] text-nexoraSubtle">{staff.position || 'Nail Tech'}</div>
                                </div>
                              </div>
                              <button 
                                onClick={() => handleRemoveStaff(staff.id)}
                                className="p-1 rounded-lg text-nexoraSubtle hover:text-red-500 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Right Column: QR Touchpoints management & custom adding */}
                  <div className="lg:col-span-6 space-y-6">
                    {/* Add Custom touchpoint form */}
                    <div className="space-y-4">
                      <h3 className="text-xs font-bold text-nexoraText uppercase tracking-wider flex items-center gap-1.5 pb-1">
                        <QrCode className="w-4 h-4 text-nexoraBrand" /> {t('setup.qr_touchpoints_title')}
                      </h3>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="flex items-center text-[10px] font-bold text-nexoraText uppercase tracking-wider mb-1">
                            <span>{t('setup.tp_name')}</span>
                            <div className="relative group inline-block ml-1.5 align-middle normal-case font-normal text-nexoraSubtle">
                              <HelpCircle className="w-3.5 h-3.5 hover:text-nexoraBrand cursor-help transition-colors" />
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-48 bg-black text-white text-[10px] p-2.5 rounded-lg shadow-xl z-50 text-center leading-normal">
                                {currentLanguage === 'vi'
                                  ? 'Đặt tên cho điểm chạm cụ thể này (ví dụ: Bàn 1, Ghế 3) để theo dõi vị trí nhận tiền tip và phản hồi.'
                                  : 'Name this specific touch point (e.g., Table 1, Station 3) to track tips and feedback location-wise.'}
                                <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1.5 border-4 border-transparent border-t-black"></div>
                              </div>
                            </div>
                          </label>
                          <input 
                            type="text"
                            placeholder={t('setup.tp_name_placeholder')}
                            className={`w-full bg-nexoraCanvas border ${errors.tpName ? 'border-red-300 focus:border-red-500' : 'border-nexoraBorder focus:border-nexoraBrand focus:bg-white'} rounded-lg px-3 py-2 text-sm text-nexoraText placeholder-nexoraSubtle focus:outline-none transition-all`}
                            value={newTouchpoint.name}
                            onChange={(e) => setNewTouchpoint({ ...newTouchpoint, name: e.target.value })}
                          />
                          {errors.tpName && <span className="text-[10px] text-red-500 mt-1 block">{errors.tpName}</span>}
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-nexoraText uppercase tracking-wider mb-1">{t('setup.tp_type')}</label>
                          <CustomSelect
                            buttonClass="bg-nexoraCanvas focus:bg-white"
                            value={newTouchpoint.type}
                            onChange={(e) => setNewTouchpoint({ ...newTouchpoint, type: e.target.value })}
                            options={[
                              { value: 'Table QR', label: 'Table QR' },
                              { value: 'Front Desk', label: 'Front Desk' },
                              { value: 'Receipt QR', label: 'Receipt QR' }
                            ]}
                          />
                        </div>
                      </div>

                      <button 
                        onClick={handleAddTouchpoint}
                        className="w-full py-2 bg-white hover:bg-nexoraCanvas text-nexoraBrand border border-nexoraBorder rounded-lg shadow-sm font-bold transition-all"
                      >
                        {t('setup.add_tp_btn')}
                      </button>
                    </div>

                    {/* Touchpoints Listing */}
                    <div className="space-y-3">
                      <h4 className="text-[10px] font-black uppercase text-nexoraMuted tracking-wider">{t('setup.qr_touchpoints_title')} ({touchPoints.length})</h4>
                      <div className="space-y-2 overflow-y-auto pr-1 max-h-[220px] lg:max-h-[440px]">
                        {touchPoints.map((tp) => (
                          <div 
                            key={tp.id} 
                            className="flex items-center justify-between p-3 rounded-xl border border-nexoraBorder bg-white shadow-sm animate-fadeIn"
                          >
                            <div className="min-w-0">
                              <div className="truncate text-xs font-bold text-nexoraText">{tp.name}</div>
                              <div className="text-[9px] flex items-center gap-2 mt-0.5">
                                <span className="px-1.5 py-0.5 rounded font-black bg-nexoraBrandSoft text-nexoraBrand border border-nexoraBrandSoft/50 uppercase">
                                  {tp.type}
                                </span>
                                {tp.staffName && (
                                  <span className="text-nexoraSubtle">{t('dashboard.modals.assign_staff')} {tp.staffName}</span>
                                )}
                              </div>
                            </div>
                            {tp.id.includes('custom') && (
                              <button 
                                onClick={() => handleRemoveTouchpoint(tp.id)}
                                className="p-1 text-nexoraSubtle hover:text-red-500 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* STEP 3: PRINT PREVIEW & FINAL REDIRECT (MERGED) */}
            {currentStep === 3 && (
              <div className="space-y-6 animate-fadeIn">
                <div className="border-b border-nexoraRule pb-4 mb-4">
                  <h2 className="font-sans text-xl md:text-2xl font-bold flex items-center gap-2.5 text-nexoraText">
                    <Download className="text-nexoraBrand w-6 h-6" />
                    {t('setup.title_step_3')}
                  </h2>
                  <p className="text-nexoraSubtle text-sm mt-1">
                    {t('setup.desc_step_3')}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
                  
                  {/* Stand design template preview */}
                  <div className="md:col-span-5 flex justify-center">
                    <div className="mx-auto flex aspect-[2/3] w-44 flex-col items-center justify-between rounded-2xl bg-nexoraCanvas border border-nexoraBorder/80 p-4 text-nexoraText shadow-md qr-print-card">
                      {/* Nexora Branding Header inside Card */}
                      <div className="flex items-center gap-1 justify-center qr-print-brand-header">
                        <img src="/assets/nexora-logo.png" alt="Nexora Logo" className="h-3.5 w-3.5 object-contain qr-print-brand-logo" />
                        <span className="text-[8px] font-black tracking-wider text-slate-800 qr-print-brand-text">NEXORA</span>
                      </div>

                      <div className="w-full text-center">
                        <div className="text-[10px] font-extrabold uppercase text-nexoraBrand tracking-wide qr-print-biz-name mx-auto">General Lobby QR</div>
                        <div className="text-[7.5px] font-bold text-nexoraMuted qr-print-staff-info mx-auto">{businessInfo.name || 'Your Spa Salon'}</div>
                      </div>
                      
                      {/* Real generated QR code scan preview */}
                      <div className="h-28 w-28 rounded-lg bg-white border border-nexoraBorder/60 p-2 flex items-center justify-center shadow-inner qr-print-qr-wrapper">
                        <img 
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
                            `${window.location.origin}${window.location.pathname}?flow=customer&merchant=${encodeURIComponent(businessInfo.name || 'Golden Glow Nail Spa & Salon')}`
                          )}`} 
                          alt="QR Preview" 
                          className="h-full w-full object-contain qr-print-qr-image"
                        />
                      </div>

                      <div className="text-[8px] font-extrabold uppercase text-nexoraMuted tracking-wider qr-print-scan-text leading-tight mx-auto">
                        {t('customer.scan_to_tip_review') || 'Scan to Tip & Review'}
                      </div>

                      <div className="flex items-center gap-1 text-[7.5px] font-bold text-nexoraSubtle qr-print-footer">
                        <ShieldCheck className="h-2.5 w-2.5 text-nexoraBrand shrink-0" />
                        <span>Secure redirect by VLINKPAY</span>
                      </div>
                    </div>
                  </div>

                  {/* Summary & downloads */}
                  <div className="md:col-span-7 space-y-5">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/50 animate-pulse">
                      <CheckCircle2 className="w-4 h-4" /> {t('common.success')}
                    </div>
                    
                    <h3 className="text-xl font-bold text-nexoraText">{t('setup.config_checklist_title')}</h3>
                    <p className="text-sm text-nexoraMuted leading-relaxed">
                      {t('setup.chk_business', { name: businessInfo.name, industry: businessInfo.industry })}
                    </p>
                    <p className="text-sm text-nexoraMuted leading-relaxed">
                      {t('setup.chk_routing')}
                    </p>
                    <p className="text-sm text-nexoraMuted leading-relaxed">
                      {t('setup.chk_staff', { count: staffList.length })}
                    </p>
                    <p className="text-sm text-nexoraMuted leading-relaxed">
                      {t('setup.chk_touchpoints', { count: touchPoints.length })}
                    </p>

                    <div className="space-y-3">
                      <button 
                        onClick={() => window.print()}
                        className="w-full flex items-center justify-between p-3.5 rounded-xl border border-nexoraBorder bg-white hover:bg-nexoraCanvas transition text-left shadow-sm"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="h-8 w-8 rounded-lg bg-nexoraBrandSoft flex items-center justify-center shrink-0"><Download className="h-[18px] w-[18px] text-nexoraBrand" /></span>
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-nexoraText truncate">{t('setup.download_btn')}</div>
                            <div className="text-[10px] text-nexoraSubtle truncate sm:whitespace-normal">{t('setup.download_explain')}</div>
                          </div>
                        </div>
                        <span className="text-xs text-nexoraSubtle font-bold shrink-0 whitespace-nowrap ml-4">Print ›</span>
                      </button>
                    </div>

                    {/* Merchant Consent Checkbox */}
                    <div className="pt-4 border-t border-nexoraRule">
                      <label className="flex items-start gap-3 cursor-pointer select-none p-2 rounded-lg hover:bg-slate-50 transition-colors min-h-[44px]">
                        <input
                          type="checkbox"
                          className="mt-1 h-5 w-5 rounded border-nexoraBorder text-nexoraBrand focus:ring-nexoraBrand cursor-pointer shrink-0"
                          checked={isConsentChecked}
                          onChange={(e) => setIsConsentChecked(e.target.checked)}
                        />
                        <span className="text-xs text-nexoraMuted leading-relaxed">
                          {currentLanguage === 'vi'
                            ? 'Tôi đồng ý với Điều khoản dịch vụ người bán của VLINKPAY, yêu cầu báo cáo thuế IRS 1099-K và chính sách thẩm định của doanh nghiệp. Tôi xác nhận rằng tất cả thông tin đăng ký là chính xác.'
                            : 'I hereby consent to the VLINKPAY Merchant Terms of Service, IRS 1099-K tax reporting requirements, and corporate compliance underwriting policies. I certify that all registration and business details provided are true and accurate.'}
                        </span>
                      </label>
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="border-t border-nexoraRule mt-8 pt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
              {currentStep > 1 ? (
                <button 
                  onClick={handleBack}
                  className="min-h-11 w-full justify-center px-5 py-2.5 rounded-flox-inputs border border-nexoraBorder hover:bg-nexoraCanvas bg-white text-nexoraText font-semibold text-sm flex items-center gap-1.5 transition-all shadow-sm sm:w-auto"
                >
                  <ArrowLeft className="w-4 h-4" /> {t('common.back')}
                </button>
              ) : onBackToLogin ? (
                <button 
                  onClick={onBackToLogin}
                  className="min-h-11 w-full justify-center px-5 py-2.5 rounded-flox-inputs border border-nexoraBorder hover:bg-nexoraCanvas bg-white text-nexoraText font-semibold text-sm flex items-center gap-1.5 transition-all shadow-sm sm:w-auto"
                >
                  <LogIn className="w-4 h-4 text-nexoraSubtle" /> {t('setup.back_to_login')}
                </button>
              ) : (
                <div />
              )}

              {currentStep < 3 ? (
                <button 
                  onClick={handleNext}
                  className="min-h-11 w-full justify-center px-6 py-2.5 rounded-flox-buttons bg-gradient-to-r from-[#2B59FF] to-[#8E4DF8] hover:opacity-90 transition-opacity text-white font-extrabold text-sm flex items-center gap-1.5 transition-all shadow-[0_4px_14px_rgba(43,89,255,0.25)] sm:w-auto"
                >
                  {t('common.next')} <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button 
                  onClick={handleCompleteSetup}
                  disabled={!isConsentChecked}
                  className={`min-h-11 w-full justify-center px-8 py-3 rounded-flox-buttons text-white font-extrabold text-sm flex items-center gap-2 transition-all sm:w-auto
                    ${!isConsentChecked 
                      ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none' 
                      : 'bg-gradient-to-r from-[#2B59FF] to-[#8E4DF8] hover:opacity-90 transition-opacity shadow-[0_8px_25px_rgba(43,89,255,0.3)]'
                    }`}
                >
                  {t('setup.launch_dashboard_btn')} <ArrowRight className="w-[18px] h-[18px] stroke-[3px]" />
                </button>
              )}
            </div>

          </div>
        </main>

        {/* Footer info */}
        <footer className="text-center text-nexoraSubtle text-xs py-4 border-t border-nexoraRule mt-8">
          &copy; {new Date().getFullYear()} Nexora Touch by VLINKPAY. All rights reserved. Secured and compliant tip redirects.
        </footer>

      </div>

      <PayoutSetupModal
        open={payoutSetupOpen}
        walletKey={payoutSetupWallet}
        staffName={newStaff.fullName || 'Edna Y Schwartz'}
        initialValue={tempPayoutValues.value}
        initialQrCode={tempPayoutValues.qrCode}
        onClose={() => setPayoutSetupOpen(false)}
        onSubmit={handlePayoutSubmit}
      />

      {/* Print-only container to match Dashboard's QrModal layout exactly on print */}
      <div className="print-only-container qr-modal-backdrop">
        <div className="qr-modal-container">
          <h2 className="qr-print-title">Business QR - Lobby</h2>
          <p className="qr-print-subtitle">{t('customer.step_form_title') || 'Scan to Tip & Review'}</p>
          
          <div className="qr-print-card">
            {/* Nexora Branding Header inside Card */}
            <div className="flex items-center gap-1 justify-center qr-print-brand-header">
              <img src="/assets/nexora-logo.png" alt="Nexora Logo" className="h-3.5 w-3.5 object-contain qr-print-brand-logo" />
              <span className="text-[8px] font-black tracking-wider text-slate-800 qr-print-brand-text">NEXORA</span>
            </div>

            <div className="w-full text-center">
              <div className="text-[10px] font-extrabold uppercase text-nexoraBrand tracking-wide qr-print-biz-name mx-auto">General Lobby QR</div>
              <div className="text-[7.5px] font-bold text-nexoraMuted qr-print-staff-info mx-auto">{businessInfo.name || 'Your Salon'}</div>
            </div>
            
            <div className="qr-print-qr-wrapper">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
                  `${window.location.origin}${window.location.pathname}?flow=customer&merchant=${encodeURIComponent(businessInfo.name || 'Golden Glow Nail Spa & Salon')}`
                )}`}
                alt="Scan QR code to tip and review"
                className="qr-print-qr-image"
              />
            </div>

            <div className="text-[8px] font-extrabold uppercase text-nexoraMuted tracking-wider qr-print-scan-text leading-tight mx-auto">
              {t('customer.scan_to_tip_review') || 'Scan to Tip & Review'}
            </div>

            <div className="flex items-center gap-1 text-[7.5px] font-bold text-nexoraSubtle qr-print-footer">
              <ShieldCheck className="h-2.5 w-2.5 text-nexoraBrand shrink-0" />
              <span>Secure redirect by VLINKPAY</span>
            </div>
          </div>
          
          <p className="qr-print-url">
            nexora.vlinkpay.com/touch/tp-main
          </p>
        </div>
      </div>
    </div>
  )
}

function PayoutSetupModal({ open, walletKey, staffName, initialValue, initialQrCode, onClose, onSubmit }) {
  const { t } = useTranslation()
  const [value, setValue] = useState(initialValue || '')
  const [qrCode, setQrCode] = useState(initialQrCode || '')
  const [accountName, setAccountName] = useState(staffName || '')
  const [isCapturing, setIsCapturing] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setValue(initialValue || '')
    setQrCode(initialQrCode || '')
    setAccountName(staffName || '')
    setError('')
  }, [open, walletKey, initialValue, initialQrCode, staffName])

  if (!open) return null

  const walletNames = {
    zelle: 'Zelle',
    bankwire: 'Bank Wire',
    paypal: 'PayPal',
    venmo: 'Venmo',
    cashapp: 'Cash App',
    applecash: 'Apple Cash'
  }

  const walletFields = {
    zelle: 'email/phone',
    bankwire: 'details',
    paypal: 'email',
    venmo: '@username',
    cashapp: '$cashtag',
    applecash: 'phone number'
  }

  const walletPlaceholders = {
    zelle: 'Enter Zelle email/phone...',
    bankwire: 'Account & Routing numbers',
    paypal: 'email@paypal.com',
    venmo: '@username-venmo',
    cashapp: '$cashtag',
    applecash: 'Enter phone number...'
  }

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      setQrCode(reader.result)
    }
    reader.readAsDataURL(file)
  }

  const handleTakePhoto = () => {
    setIsCapturing(true)
    setTimeout(() => {
      const mockQr = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
        value || 'nexora-mock-payout'
      )}`
      setQrCode(mockQr)
      setIsCapturing(false)
    }, 800)
  }

  const handleClearQr = () => {
    setQrCode('')
  }

  const handleSubmit = () => {
    if (!value.trim()) {
      setError(t('setup.errors.field_required') || 'This field is required.')
      return
    }
    onSubmit(value, qrCode, accountName)
  }

  const brandStyles = {
    venmo: { text: 'venmo', color: 'text-[#008CFF]', fontClass: 'font-black italic text-lg tracking-tight' },
    cashapp: { text: 'cash app', color: 'text-[#00D632]', fontClass: 'font-extrabold text-lg tracking-tighter' },
    zelle: { text: 'zelle', color: 'text-[#7414CA]', fontClass: 'font-black text-lg' },
    paypal: { text: 'PayPal', color: 'text-[#003087]', fontClass: 'font-black italic text-lg' },
    applecash: { text: 'Apple Cash', color: 'text-black', fontClass: 'font-black text-lg tracking-tight' },
    bankwire: { text: 'Bank Wire', color: 'text-[#475569]', fontClass: 'font-bold uppercase text-xs tracking-widest' }
  }[walletKey] || { text: walletKey, color: 'text-slate-800', fontClass: 'font-bold' }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl animate-scaleUp">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-base font-extrabold text-slate-800">
            {t('setup.setup_wallet_title', { wallet: walletNames[walletKey] }) || `Set up ${walletNames[walletKey]} account`}
          </h3>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 space-y-4">
          <div>
            <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
              {t('setup.payout_input_label', { wallet: walletNames[walletKey], field: walletFields[walletKey] }) || `Your ${walletNames[walletKey]} ${walletFields[walletKey]} *`}
            </label>
            <input
              type="text"
              value={value}
              onChange={(e) => {
                setValue(e.target.value)
                setError('')
              }}
              placeholder={walletPlaceholders[walletKey]}
              className={`mt-1.5 h-10 w-full rounded-lg border px-3 text-sm font-semibold outline-none focus:ring-1 focus:ring-nexoraBrand transition-all ${
                error ? 'border-rose-500 focus:border-rose-500' : 'border-slate-200 focus:border-nexoraBrand'
              }`}
            />
            {error && <p className="mt-1 text-[10px] font-bold text-rose-500">{error}</p>}
          </div>

          <div>
            <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block mb-2">
              {t('setup.qr_code_optional') || 'QR Code (optional)'}
            </label>

            {isCapturing ? (
              <div className="flex h-44 w-full flex-col items-center justify-center rounded-xl border border-slate-200 bg-slate-50">
                <div className="h-6 w-6 border-2 border-nexoraBrand/20 border-t-nexoraBrand rounded-full animate-spin"></div>
                <span className="mt-2 text-xs font-semibold text-slate-500">{t('setup.taking_photo') || 'Taking photo...'}</span>
              </div>
            ) : qrCode ? (
              <div className="relative flex flex-col items-center rounded-xl border border-slate-200 bg-white p-4.5 shadow-sm">
                <button
                  type="button"
                  onClick={handleClearQr}
                  className="absolute right-2 top-2 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
                  title="Remove image"
                >
                  <X className="h-4 w-4" />
                </button>
                <div className="text-center">
                  <div className="text-sm font-extrabold text-slate-800">{accountName}</div>
                  <div className="text-[10px] font-semibold text-slate-400 mt-0.5">{value}</div>
                </div>
                <div className="my-3 flex h-28 w-28 items-center justify-center border border-slate-100 bg-white p-1 rounded-lg">
                  <img src={qrCode} alt="Payout QR Code" className="h-full w-full object-contain" />
                </div>
                <div className={`${brandStyles.color} ${brandStyles.fontClass}`}>
                  {brandStyles.text}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={handleTakePhoto}
                  className="flex flex-col items-center justify-center py-5 border border-dashed border-slate-200 hover:border-nexoraBrand rounded-xl bg-slate-50 hover:bg-slate-50/50 transition gap-1.5"
                >
                  <Camera className="w-5 h-5 text-nexoraBrand" />
                  <span className="text-[11px] font-bold text-slate-600">{t('setup.take_photo') || 'Take photo'}</span>
                </button>
                <label
                  className="flex flex-col items-center justify-center py-5 border border-dashed border-slate-200 hover:border-nexoraBrand rounded-xl bg-slate-50 hover:bg-slate-50/50 transition gap-1.5 cursor-pointer"
                >
                  <FolderOpen className="w-5 h-5 text-nexoraBrand" />
                  <span className="text-[11px] font-bold text-slate-600">{t('setup.choose_file') || 'Choose file'}</span>
                  <input type="file" accept="image/*" className="sr-only" onChange={handleFileChange} />
                </label>
              </div>
            )}
            {!qrCode && (
              <p className="mt-2 text-[10px] text-slate-400 leading-normal">
                {t('setup.uploader_hint') || 'You can either take a photo or upload from your device. Accepted formats: JPG, PNG, JPEG. Max size: 5MB per file.'}
              </p>
            )}
          </div>

          <div className="rounded-lg bg-blue-50/50 border border-blue-100 p-3 text-[10.5px] leading-relaxed text-blue-800 flex gap-2">
            <AlertTriangle className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
            <span>
              {t('setup.payout_warning') || 'Please enter the correct receiving account information. This will be used to receive payments.'}
            </span>
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2 border-t border-slate-100 pt-3">
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-50 transition"
          >
            {t('setup.close') || 'Close'}
          </button>
          <button
            onClick={handleSubmit}
            className="rounded-lg bg-nexoraBrand px-5 py-2 text-xs font-bold text-white hover:opacity-90 shadow-sm transition"
          >
            {t('setup.submit') || 'Submit'}
          </button>
        </div>
      </div>
    </div>
  )
}
