import React, { useState } from 'react'
import { 
  Sparkles, Building2, Link2, Users, QrCode, Download, 
  ArrowRight, ArrowLeft, Upload, Plus, Trash2, CheckCircle2, 
  AlertTriangle, Mail, Phone, Globe, Wallet, ShieldCheck, 
  MapPin, Clock, Check, Eye, LogIn, Scissors
} from 'lucide-react'
import { useTranslation } from '../contexts/LanguageContext'
import CustomSelect from './CustomSelect'

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
  timezone: 'US/Eastern',
  logo: null
}

const DEMO_LINKS = {
  googleReview: 'https://g.page/r/cGoldenGlowNails/review',
  yelpReview: 'https://www.yelp.com/biz/golden-glow-nails-palm-beach',
  facebookReview: 'https://www.facebook.com/goldenglownails/reviews',
  feedbackEmail: 'manager@goldenglownails.com'
}

const DEMO_STAFF = [
  {
    id: '1',
    fullName: 'Mia Tran',
    nickname: 'Mia T.',
    position: 'Gel-X Artist',
    avatar: '',
    showInTipsFlow: true,
    paymentAccounts: {
      venmo: '@mia-nails',
      cashapp: '$miaglow',
      zelle: 'mia.tran@gmail.com',
      vlinkpay: ''
    }
  },
  {
    id: '2',
    fullName: 'Vivian Le',
    nickname: 'Vivian L.',
    position: 'Acrylic Specialist',
    avatar: '',
    showInTipsFlow: true,
    paymentAccounts: {
      venmo: '',
      cashapp: '$vivianle',
      zelle: '407-555-0199',
      vlinkpay: 'VLP-8893-VL'
    }
  },
  {
    id: '3',
    fullName: 'Ashley Park',
    nickname: 'Ashley P.',
    position: 'Pedicure Lead',
    avatar: '',
    showInTipsFlow: true,
    paymentAccounts: {
      venmo: '@ashley-pedi',
      cashapp: '',
      zelle: 'ashley@glownails.com',
      vlinkpay: ''
    }
  },
  {
    id: '4',
    fullName: 'Hanna Nguyen',
    nickname: 'Hanna Ng.',
    position: 'Nail Art Designer',
    avatar: '',
    showInTipsFlow: true,
    paymentAccounts: {
      venmo: '@hanna-art',
      cashapp: '',
      zelle: '',
      vlinkpay: 'VLP-1148-HN'
    }
  }
]

export default function SetupWizard({ onComplete, onBackToLogin }) {
  const { currentLanguage, setLanguage, t } = useTranslation()
  const [currentStep, setCurrentStep] = useState(1) // 1, 2, 3
  
  // State for all steps
  const [businessInfo, setBusinessInfo] = useState({
    name: '',
    industry: 'Nail Salon',
    address: '',
    phone: '',
    website: '',
    timezone: 'US/Eastern',
    logo: null
  })
  
  const [reviewLinks, setReviewLinks] = useState({
    googleReview: '',
    yelpReview: '',
    facebookReview: '',
    feedbackEmail: ''
  })
  
  const [staffList, setStaffList] = useState([])
  const [touchPoints, setTouchPoints] = useState([])
  
  // Staff input state
  const [newStaff, setNewStaff] = useState({
    fullName: '',
    nickname: '',
    position: 'Nail Tech',
    avatar: '',
    venmo: '',
    cashapp: '',
    zelle: '',
    vlinkpay: ''
  })
  
  // Touchpoint input state
  const [newTouchpoint, setNewTouchpoint] = useState({
    name: '',
    type: 'Table QR'
  })

  // Validation errors
  const [errors, setErrors] = useState({})

  // Prefill demo data helper
  const prefillDemo = () => {
    setBusinessInfo(DEMO_BUSINESS)
    setReviewLinks(DEMO_LINKS)
    setStaffList(DEMO_STAFF)
    
    // Auto-generate touchpoints based on staff
    const initialTouchpoints = [
      { id: 'tp-main', name: 'Business Main Lobby QR', type: 'Business Main' },
      { id: 'tp-front', name: 'Reception Front Desk', type: 'Front Desk' },
      { id: 'tp-t1', name: 'Service Chair 01', type: 'Table QR' },
      { id: 'tp-t2', name: 'Service Chair 02', type: 'Table QR' },
      { id: 'tp-receipt', name: 'Bottom-of-Receipt QR', type: 'Receipt QR' },
      ...DEMO_STAFF.map(s => ({
        id: `tp-staff-${s.id}`,
        name: `Personal QR - ${s.nickname}`,
        type: 'Staff QR',
        staffId: s.id,
        staffName: s.nickname
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
      
      // Review Links validation
      if (!reviewLinks.googleReview.trim()) {
        newErrors.googleReview = t('setup.errors.google_required')
      } else if (!reviewLinks.googleReview.startsWith('http')) {
        newErrors.googleReview = t('setup.errors.url_protocol')
      }
      
      if (!reviewLinks.yelpReview.trim()) {
        newErrors.yelpReview = t('setup.errors.yelp_required')
      } else if (!reviewLinks.yelpReview.startsWith('http')) {
        newErrors.yelpReview = t('setup.errors.url_protocol')
      }
      
      if (reviewLinks.facebookReview && !reviewLinks.facebookReview.startsWith('http')) {
        newErrors.facebookReview = t('setup.errors.url_invalid')
      }

      if (!reviewLinks.feedbackEmail.trim()) {
        newErrors.feedbackEmail = t('setup.errors.email_required')
      } else if (!/\S+@\S+\.\S+/.test(reviewLinks.feedbackEmail)) {
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
          { id: 'tp-main', name: t('setup.tp_lobby_default'), type: 'Business Main' },
          { id: 'tp-front', name: t('setup.tp_front_default'), type: 'Front Desk' }
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
    
    // Check if at least 1 payment account is provided
    const hasVenmo = newStaff.venmo.trim() !== ''
    const hasCashapp = newStaff.cashapp.trim() !== ''
    const hasZelle = newStaff.zelle.trim() !== ''
    const hasVlinkpay = newStaff.vlinkpay.trim() !== ''
    
    if (!hasVenmo && !hasCashapp && !hasZelle && !hasVlinkpay) {
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
      position: newStaff.position,
      avatar: newStaff.avatar,
      showInTipsFlow: true,
      paymentAccounts: {
        venmo: newStaff.venmo.trim(),
        cashapp: newStaff.cashapp.trim(),
        zelle: newStaff.zelle.trim(),
        vlinkpay: newStaff.vlinkpay.trim()
      }
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
        staffName: added.nickname
      }
    ])

    // Clear form
    setNewStaff({
      fullName: '',
      nickname: '',
      position: 'Nail Tech',
      avatar: '',
      venmo: '',
      cashapp: '',
      zelle: '',
      vlinkpay: ''
    })
    
    // Clear staff errors
    const cleanedErrors = { ...errors }
    delete cleanedErrors.staffFullName
    delete cleanedErrors.staffNickname
    delete cleanedErrors.staffPayment
    delete cleanedErrors.staffList
    setErrors(cleanedErrors)
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
      type: newTouchpoint.type
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
              <h1 className="font-serif text-xl font-bold tracking-wide sm:text-2xl text-nexoraText">
                NEXORA <span className="ml-1 inline-flex align-middle text-nexoraBrand font-sans text-xs tracking-widest font-black uppercase bg-nexoraBrand/10 px-2 py-0.5 rounded border border-nexoraBrand/30 sm:ml-2">TOUCH</span>
              </h1>
              <p className="text-xs text-nexoraSubtle font-light">By VLINKPAY Technologies</p>
            </div>
          </div>
          
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
            {onBackToLogin && (
              <button 
                onClick={onBackToLogin}
                className="min-h-11 text-xs flex items-center justify-center gap-1.5 px-4.5 py-1.5 rounded-flox-inputs border border-nexoraBorder text-nexoraSubtle hover:text-nexoraText bg-white hover:bg-nexoraCanvas transition-all font-semibold shadow-sm"
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
                  <h2 className="font-serif text-xl md:text-2xl font-bold flex items-center gap-2.5 text-nexoraText">
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

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-nexoraText uppercase tracking-wider mb-2">{t('setup.store_name')}</label>
                        <input 
                          type="text"
                          placeholder={t('setup.store_name_placeholder')}
                          className={`w-full bg-nexoraCanvas border ${errors.name ? 'border-red-300 focus:border-red-500' : 'border-nexoraBorder focus:border-nexoraBrand focus:bg-white'} rounded-lg px-4 py-2.5 text-sm text-nexoraText focus:outline-none placeholder-nexoraSubtle focus:ring-0 transition-all`}
                          value={businessInfo.name}
                          onChange={(e) => {
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
                          value={businessInfo.industry}
                          onChange={(e) => setBusinessInfo({ ...businessInfo, industry: e.target.value })}
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
                      <label className="block text-[10px] font-bold text-nexoraText uppercase tracking-wider mb-2">{t('setup.store_address')}</label>
                      <div className="relative">
                        <MapPin className="absolute left-3.5 top-3.5 w-4 h-4 text-nexoraSubtle" />
                        <input 
                          type="text"
                          placeholder={t('setup.store_address_placeholder')}
                          className={`w-full bg-nexoraCanvas border ${errors.address ? 'border-red-300 focus:border-red-500' : 'border-nexoraBorder focus:border-nexoraBrand focus:bg-white'} rounded-lg pl-11 pr-4 py-2.5 text-sm text-nexoraText focus:outline-none placeholder-nexoraSubtle focus:ring-0 transition-all`}
                          value={businessInfo.address}
                          onChange={(e) => {
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
                            placeholder="+1 (555) 789-2026"
                            className={`w-full bg-nexoraCanvas border ${errors.phone ? 'border-red-300 focus:border-red-500' : 'border-nexoraBorder focus:border-nexoraBrand focus:bg-white'} rounded-lg pl-11 pr-4 py-2.5 text-sm text-nexoraText focus:outline-none placeholder-nexoraSubtle focus:ring-0 transition-all`}
                            value={businessInfo.phone}
                            onChange={(e) => {
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
                            placeholder="https://spasalon.com"
                            className="w-full bg-nexoraCanvas border border-nexoraBorder focus:border-nexoraBrand focus:bg-white rounded-lg pl-11 pr-4 py-2.5 text-sm text-nexoraText focus:outline-none placeholder-nexoraSubtle focus:ring-0 transition-all"
                            value={businessInfo.website}
                            onChange={(e) => setBusinessInfo({ ...businessInfo, website: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-nexoraText uppercase tracking-wider mb-2">{t('setup.store_timezone')}</label>
                        <div className="relative">
                          <Clock className="absolute left-3.5 top-3.5 w-4 h-4 text-nexoraSubtle pointer-events-none z-10" />
                          <CustomSelect
                            buttonClass="bg-nexoraCanvas focus:bg-white pl-11"
                            value={businessInfo.timezone}
                            onChange={(e) => setBusinessInfo({ ...businessInfo, timezone: e.target.value })}
                            options={[
                              { value: 'US/Eastern', label: 'US Eastern (EST)' },
                              { value: 'US/Central', label: 'US Central (CST)' },
                              { value: 'US/Mountain', label: 'US Mountain (MST)' },
                              { value: 'US/Pacific', label: 'US Pacific (PST)' },
                              { value: 'Asia/Ho_Chi_Minh', label: 'Vietnam (GMT+7)' }
                            ]}
                          />
                        </div>
                      </div>

                      {/* Logo uploader compact row */}
                      <div>
                        <label className="block text-[10px] font-bold text-nexoraText uppercase tracking-wider mb-2">{t('setup.store_logo')}</label>
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl border border-dashed border-nexoraBorder bg-nexoraCanvas flex items-center justify-center p-1 cursor-pointer hover:border-nexoraBrand transition relative group shadow-sm">
                            {businessInfo.logo ? (
                              <img src={businessInfo.logo} alt="Store logo" className="w-full h-full object-contain rounded-lg" />
                            ) : (
                              <Upload className="w-4 h-4 text-nexoraSubtle" />
                            )}
                            <input 
                              type="file" 
                              accept="image/*"
                              className="absolute inset-0 opacity-0 cursor-pointer"
                              onChange={handleLogoChange}
                            />
                          </div>
                          <span className="text-[10px] text-nexoraSubtle">{t('setup.logo_hint')}</span>
                        </div>
                      </div>
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
                  <h2 className="font-serif text-xl md:text-2xl font-bold flex items-center gap-2.5 text-nexoraText">
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

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

                        {/* Zelle payment account */}
                        <div>
                          <label className="block text-[10px] font-bold text-nexoraText uppercase tracking-wider mb-1">{t('setup.wallet_zelle')}</label>
                          <input 
                            type="text"
                            placeholder={t('setup.wallet_zelle_placeholder')}
                            className="w-full bg-nexoraCanvas border border-nexoraBorder focus:border-nexoraBrand focus:bg-white rounded-lg px-3 py-2 text-sm text-nexoraText focus:outline-none transition-all"
                            value={newStaff.zelle}
                            onChange={(e) => setNewStaff({ ...newStaff, zelle: e.target.value })}
                          />
                        </div>
                      </div>

                      {/* Venmo and Cashapp wallets */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-bold text-nexoraText uppercase tracking-wider mb-1">{t('setup.wallet_venmo')}</label>
                          <input 
                            type="text"
                            placeholder={t('setup.wallet_venmo_placeholder')}
                            className="w-full bg-nexoraCanvas border border-nexoraBorder focus:border-nexoraBrand focus:bg-white rounded-lg px-3 py-2 text-sm text-nexoraText focus:outline-none transition-all"
                            value={newStaff.venmo}
                            onChange={(e) => setNewStaff({ ...newStaff, venmo: e.target.value })}
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-nexoraText uppercase tracking-wider mb-1">{t('setup.wallet_cashapp')}</label>
                          <input 
                            type="text"
                            placeholder={t('setup.wallet_cashapp_placeholder')}
                            className="w-full bg-nexoraCanvas border border-nexoraBorder focus:border-nexoraBrand focus:bg-white rounded-lg px-3 py-2 text-sm text-nexoraText focus:outline-none transition-all"
                            value={newStaff.cashapp}
                            onChange={(e) => setNewStaff({ ...newStaff, cashapp: e.target.value })}
                          />
                        </div>
                      </div>

                      {/* VlinkPay optional input */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-bold text-nexoraText uppercase tracking-wider mb-1">{t('setup.wallet_vlinkpay')}</label>
                          <input 
                            type="text"
                            placeholder="VLP-XXXX-XX"
                            className="w-full bg-nexoraCanvas border border-nexoraBorder focus:border-nexoraBrand focus:bg-white rounded-lg px-3 py-2 text-sm text-nexoraText focus:outline-none transition-all"
                            value={newStaff.vlinkpay}
                            onChange={(e) => setNewStaff({ ...newStaff, vlinkpay: e.target.value })}
                          />
                        </div>

                        <div className="flex items-end">
                          <button 
                            type="button"
                            onClick={handleAddStaff}
                            className="w-full min-h-[38px] bg-nexoraBrand hover:bg-nexoraBrandDark text-white font-extrabold text-xs uppercase tracking-wider rounded-lg flex items-center justify-center gap-1 transition-all shadow-sm"
                          >
                            <Plus className="w-4 h-4 stroke-[3px]" /> {t('setup.add_staff_btn')}
                          </button>
                        </div>
                      </div>
                      {errors.staffPayment && <p className="text-[10px] text-red-500 leading-tight">{errors.staffPayment}</p>}
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
                                <div className="w-9 h-9 rounded-full bg-nexoraBrandSoft border border-nexoraBrandSoft text-nexoraBrand flex items-center justify-center font-bold font-serif text-xs">
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
                          <label className="block text-[10px] font-bold text-nexoraText uppercase tracking-wider mb-1">{t('setup.tp_name')}</label>
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
                  <h2 className="font-serif text-xl md:text-2xl font-bold flex items-center gap-2.5 text-nexoraText">
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
                    <div className="mx-auto flex aspect-[2/3] w-44 flex-col items-center justify-between rounded-2xl bg-nexoraCanvas border border-nexoraBorder/80 p-4 text-nexoraText shadow-md">
                      {/* Nexora Branding Header inside Card */}
                      <div className="flex items-center gap-1 justify-center">
                        <img src="/assets/nexora-logo.png" alt="Nexora Logo" className="h-3.5 w-3.5 object-contain" />
                        <span className="text-[8px] font-black tracking-wider text-slate-800">NEXORA</span>
                      </div>

                      <div className="h-1 w-14 rounded-full bg-gradient-to-r from-[#2B59FF] to-[#8E4DF8]" />
                      <div className="space-y-0.5 text-center">
                        <div className="text-[10px] font-extrabold uppercase text-nexoraBrand tracking-wide truncate max-w-[140px]">{businessInfo.name || 'Your Spa Salon'}</div>
                        <div className="text-[8px] font-bold uppercase text-nexoraMuted tracking-wider">{t('customer.step_form_title') || 'Scan to Tip & Review'}</div>
                      </div>
                      
                      {/* Real generated QR code scan preview */}
                      <div className="h-28 w-28 rounded-lg bg-white border border-nexoraBorder/60 p-2 flex items-center justify-center shadow-inner">
                        <img 
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
                            `${window.location.origin}${window.location.pathname}?flow=customer&merchant=${encodeURIComponent(businessInfo.name || 'Golden Glow Nail Spa & Salon')}`
                          )}`} 
                          alt="QR Preview" 
                          className="h-full w-full object-contain"
                        />
                      </div>

                      <div className="flex items-center gap-1 text-[8px] font-bold text-nexoraSubtle">
                        <Scissors className="h-3 w-3 text-nexoraBrand" />
                        Secure redirect by VLINKPAY
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
                  className="min-h-11 w-full justify-center px-8 py-3 rounded-flox-buttons bg-gradient-to-r from-[#2B59FF] to-[#8E4DF8] hover:opacity-90 transition-opacity text-white font-extrabold text-sm flex items-center gap-2 transition-all shadow-[0_8px_25px_rgba(43,89,255,0.3)] sm:w-auto"
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

            <div className="qr-print-card-strip" />
            <div>
              <div className="qr-print-biz-name">{businessInfo.name || 'Your Salon'}</div>
              <div className="qr-print-scan-text">SCAN TO TIP AND REVIEW</div>
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

            <div className="flex items-center gap-1 text-[8px] font-bold text-nexoraSubtle qr-print-footer">
              <Scissors className="h-3 w-3 text-nexoraBrand" />
              Secure redirect by VLINKPAY
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
