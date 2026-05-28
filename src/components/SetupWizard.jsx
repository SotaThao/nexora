import React, { useState } from 'react'
import { 
  Sparkles, Building2, Link2, Users, QrCode, Download, 
  ArrowRight, ArrowLeft, Upload, Plus, Trash2, CheckCircle2, 
  AlertTriangle, Mail, Phone, Globe, Wallet, ShieldCheck, 
  MapPin, Clock, Check, Eye, LogIn, Scissors
} from 'lucide-react'
import { useTranslation } from '../contexts/LanguageContext'

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
    <div className="relative min-h-dvh bg-luxuryBlack text-white font-sans overflow-x-hidden selection:bg-luxuryGold selection:text-black pb-12">
      {/* Background glowing effects */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[rgba(212,175,55,0.08)] via-transparent to-transparent rounded-full pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[rgba(212,175,55,0.06)] via-transparent to-transparent rounded-full pointer-events-none"></div>

      {/* Main Container */}
      <div className="max-w-6xl mx-auto px-4 py-6 sm:py-8 relative z-10 flex flex-col min-h-dvh justify-between">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between border-b border-neutral-800 pb-6 mb-8 gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <img src="/assets/nexora-logo.png" alt="Nexora Logo" className="w-10 h-10 shrink-0 object-contain shadow-lg shadow-[rgba(212,175,55,0.2)]" />
            <div className="min-w-0">
              <h1 className="font-serif text-xl font-bold tracking-wide sm:text-2xl">
                NEXORA <span className="ml-1 inline-flex align-middle text-luxuryGold font-sans text-xs tracking-widest font-black uppercase bg-luxuryGold/10 px-2 py-0.5 rounded border border-neutral-800 sm:ml-2">TOUCH</span>
              </h1>
              <p className="text-xs text-[rgba(243,229,171,0.6)] font-light">By VLINKPAY Technologies</p>
            </div>
          </div>
          
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
            {onBackToLogin && (
              <button 
                onClick={onBackToLogin}
                className="min-h-11 text-xs flex items-center justify-center gap-1.5 px-4.5 py-1.5 rounded-flox-inputs border border-neutral-800 text-neutral-400 hover:text-white bg-neutral-900/30 hover:bg-neutral-900 transition-all font-medium"
              >
                <LogIn className="w-3.5 h-3.5" />
                {t('setup.back_to_login')}
              </button>
            )}
            <button 
              onClick={prefillDemo}
              className="min-h-11 text-xs flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-flox-inputs border border-dashed border-neutral-800 text-luxuryGold bg-luxuryGold/5 hover:bg-luxuryGold/10 transition-all font-medium"
            >
              <Sparkles className="w-3.5 h-3.5" />
              {t('setup.prefill_demo_data')}
            </button>

            {/* Language Switcher */}
            <div className="flex items-center gap-1.5 bg-neutral-900 border border-neutral-800 px-3 py-1.5 rounded-flox-inputs min-h-11">
              <button 
                type="button"
                onClick={() => setLanguage('vi')}
                className={`text-xs font-bold px-2 py-0.5 rounded transition ${currentLanguage === 'vi' ? 'bg-luxuryGold text-black' : 'text-neutral-400 hover:text-white'}`}
              >
                VI
              </button>
              <span className="text-neutral-700 text-xs">|</span>
              <button 
                type="button"
                onClick={() => setLanguage('en')}
                className={`text-xs font-bold px-2 py-0.5 rounded transition ${currentLanguage === 'en' ? 'bg-luxuryGold text-black' : 'text-neutral-400 hover:text-white'}`}
              >
                EN
              </button>
            </div>

            <span className="inline-flex min-h-11 items-center justify-center text-xs text-neutral-400 bg-neutral-900 px-3 py-1.5 rounded-flox-inputs border border-neutral-800">
              {t('setup.onboarding_stage')}
            </span>
          </div>
        </header>

        {/* Wizard Progress Bar */}
        <div className="mb-8 overflow-x-auto pb-3 sm:mb-10 sm:overflow-visible sm:pb-0">
          <div className="relative flex min-w-[320px] max-w-xl mx-auto items-center justify-between sm:min-w-0">
            {/* Background Line */}
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-[2px] bg-neutral-800 -z-10"></div>
            {/* Active Highlight Line */}
            <div 
              className="absolute left-0 top-1/2 -translate-y-1/2 h-[2px] bg-gradient-to-r from-luxuryGold to-luxuryGoldLight -z-10 transition-all duration-500"
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
                        ? 'bg-luxuryCoal border-luxuryGold text-luxuryGold shadow-[0_0_15px_rgba(212,175,55,0.4)] scale-110' 
                        : isCompleted
                          ? 'bg-luxuryGold border-luxuryGold text-black'
                          : 'bg-luxuryBlack border-neutral-800 text-neutral-500'
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
                    ${isActive ? 'text-luxuryGold' : isCompleted ? 'text-luxuryGoldLight' : 'text-neutral-500'}`}>
                    {stepName(step)}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Wizard Panel (Step Body) */}
        <main className="flex-grow py-4">
          <div className="w-full glass-dark rounded-flox-cards p-4 sm:p-6 md:p-10 shadow-premium relative overflow-hidden border border-[rgba(212,175,55,0.18)]">
            
            {/* Subtle light glow inside panel */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[rgba(212,175,55,0.05)] via-transparent to-transparent rounded-full pointer-events-none"></div>

            {/* Error Banner */}
            {errors.staffList && (
              <div className="mb-6 p-4 rounded-flox-cards bg-red-950/40 border border-red-500/30 text-red-200 text-sm flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
                <span>{errors.staffList}</span>
              </div>
            )}

            {/* Step Content */}
            
            {/* STEP 1: STORE SETUP & REVIEW ROUTING LINKS (MERGED) */}
            {currentStep === 1 && (
              <div className="space-y-6 animate-fadeIn">
                <div className="border-b border-neutral-800 pb-4 mb-4">
                  <h2 className="font-serif text-xl md:text-2xl font-semibold flex items-center gap-2.5">
                    <Building2 className="text-luxuryGold w-6 h-6" />
                    {t('setup.title_step_1')}
                  </h2>
                  <p className="text-neutral-400 text-sm mt-1">{t('setup.desc_step_1')}</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  
                  {/* Left Column - Store Info & Logo */}
                  <div className="lg:col-span-6 space-y-5 lg:border-r lg:border-neutral-800/60 lg:pr-8">
                    <h3 className="text-sm font-bold text-luxuryGold uppercase tracking-wider border-b border-neutral-800 pb-2">
                      {t('setup.store_info_title')}
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-luxuryGold uppercase tracking-wider mb-2">{t('setup.store_name')}</label>
                        <input 
                          type="text"
                          placeholder={t('setup.store_name_placeholder')}
                          className={`w-full bg-luxuryBlack border ${errors.name ? 'border-red-500' : 'border-neutral-800'} focus:border-luxuryGold focus:ring-1 focus:ring-luxuryGold/30 rounded-flox-inputs px-4 py-2.5 text-sm text-white placeholder-neutral-600 focus:outline-none transition-all`}
                          value={businessInfo.name}
                          onChange={(e) => {
                            setBusinessInfo({ ...businessInfo, name: e.target.value })
                            if (errors.name) setErrors({ ...errors, name: '' })
                          }}
                        />
                        {errors.name && <span className="text-xs text-red-400 mt-1 block">{errors.name}</span>}
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-luxuryGold uppercase tracking-wider mb-2">{t('setup.business_category')}</label>
                        <select 
                          className="w-full bg-luxuryBlack border border-neutral-800 focus:border-luxuryGold focus:ring-1 focus:ring-luxuryGold/30 rounded-flox-inputs px-4 py-2.5 text-sm text-white focus:outline-none transition-all"
                          value={businessInfo.industry}
                          onChange={(e) => setBusinessInfo({ ...businessInfo, industry: e.target.value })}
                        >
                          <option value="Nail Salon">{t('setup.biz_type_nail')}</option>
                          <option value="Restaurant">{t('setup.biz_type_restaurant')}</option>
                          <option value="Cafe">{t('setup.biz_type_cafe')}</option>
                          <option value="Spa">{t('setup.biz_type_spa')}</option>
                          <option value="Khác">{t('setup.biz_type_other')}</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-luxuryGold uppercase tracking-wider mb-2">{t('setup.store_address')}</label>
                      <div className="relative">
                        <MapPin className="absolute left-3.5 top-3.5 w-4 h-4 text-neutral-500" />
                        <input 
                          type="text"
                          placeholder={t('setup.store_address_placeholder')}
                          className={`w-full bg-luxuryBlack border ${errors.address ? 'border-red-500' : 'border-neutral-800'} focus:border-luxuryGold focus:ring-1 focus:ring-luxuryGold/30 rounded-flox-inputs pl-11 pr-4 py-2.5 text-sm text-white placeholder-neutral-600 focus:outline-none transition-all`}
                          value={businessInfo.address}
                          onChange={(e) => {
                            setBusinessInfo({ ...businessInfo, address: e.target.value })
                            if (errors.address) setErrors({ ...errors, address: '' })
                          }}
                        />
                      </div>
                      {errors.address && <span className="text-xs text-red-400 mt-1 block">{errors.address}</span>}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-luxuryGold uppercase tracking-wider mb-2">{t('setup.store_phone')}</label>
                        <div className="relative">
                          <Phone className="absolute left-3.5 top-3.5 w-4 h-4 text-neutral-500" />
                          <input 
                            type="text"
                            placeholder="+1 (555) 789-2026"
                            className={`w-full bg-luxuryBlack border ${errors.phone ? 'border-red-500' : 'border-neutral-800'} focus:border-luxuryGold focus:ring-1 focus:ring-luxuryGold/30 rounded-flox-inputs pl-11 pr-4 py-2.5 text-sm text-white placeholder-neutral-600 focus:outline-none transition-all`}
                            value={businessInfo.phone}
                            onChange={(e) => {
                              setBusinessInfo({ ...businessInfo, phone: e.target.value })
                              if (errors.phone) setErrors({ ...errors, phone: '' })
                            }}
                          />
                        </div>
                        {errors.phone && <span className="text-xs text-red-400 mt-1 block">{errors.phone}</span>}
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-luxuryGold uppercase tracking-wider mb-2">{t('setup.store_website')}</label>
                        <div className="relative">
                          <Globe className="absolute left-3.5 top-3.5 w-4 h-4 text-neutral-500" />
                          <input 
                            type="url"
                            placeholder="https://spasalon.com"
                            className="w-full bg-luxuryBlack border border-neutral-800 focus:border-luxuryGold focus:ring-1 focus:ring-luxuryGold/30 rounded-flox-inputs pl-11 pr-4 py-2.5 text-sm text-white placeholder-neutral-600 focus:outline-none transition-all"
                            value={businessInfo.website}
                            onChange={(e) => setBusinessInfo({ ...businessInfo, website: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-luxuryGold uppercase tracking-wider mb-2">{t('setup.store_timezone')}</label>
                        <div className="relative">
                          <Clock className="absolute left-3.5 top-3.5 w-4 h-4 text-neutral-500" />
                          <select 
                            className="w-full bg-luxuryBlack border border-neutral-800 focus:border-luxuryGold focus:ring-1 focus:ring-luxuryGold/30 rounded-flox-inputs pl-11 pr-4 py-2.5 text-sm text-white focus:outline-none transition-all"
                            value={businessInfo.timezone}
                            onChange={(e) => setBusinessInfo({ ...businessInfo, timezone: e.target.value })}
                          >
                            <option value="US/Eastern">US Eastern (EST)</option>
                            <option value="US/Central">US Central (CST)</option>
                            <option value="US/Mountain">US Mountain (MST)</option>
                            <option value="US/Pacific">US Pacific (PST)</option>
                            <option value="Asia/Ho_Chi_Minh">Vietnam (GMT+7)</option>
                          </select>
                        </div>
                      </div>

                      {/* Logo uploader compact row */}
                      <div>
                        <label className="block text-[10px] font-bold text-luxuryGold uppercase tracking-wider mb-2">{t('setup.store_logo')}</label>
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl border border-dashed border-neutral-800 bg-luxuryBlack/50 flex items-center justify-center p-1 cursor-pointer hover:border-luxuryGold transition relative group">
                            {businessInfo.logo ? (
                              <img src={businessInfo.logo} alt="Store logo" className="w-full h-full object-contain rounded-lg" />
                            ) : (
                              <Upload className="w-4 h-4 text-neutral-500" />
                            )}
                            <input 
                              type="file" 
                              accept="image/*"
                              className="absolute inset-0 opacity-0 cursor-pointer"
                              onChange={handleLogoChange}
                            />
                          </div>
                          <span className="text-[10px] text-neutral-500">{t('setup.logo_hint')}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Right Column - Review Routing Links */}
                  <div className="lg:col-span-6 space-y-5">
                    <h3 className="text-sm font-bold text-luxuryGold uppercase tracking-wider border-b border-neutral-800 pb-2">
                      {t('setup.review_routing_title')}
                    </h3>

                    {/* Routing explainer card */}
                    <div className="p-4.5 rounded-xl border border-neutral-800 bg-luxuryGold/5 text-xs text-[rgba(243,229,171,0.85)] flex gap-3 leading-relaxed">
                      <ShieldCheck className="w-5 h-5 text-luxuryGold shrink-0" />
                      <div>
                        {t('setup.review_routing_policy')}
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-luxuryGold uppercase tracking-wider mb-2">{t('setup.google_review_link')}</label>
                      <input 
                        type="url"
                        placeholder="https://g.page/r/cxxxxxx/review"
                        className={`w-full bg-luxuryBlack border ${errors.googleReview ? 'border-red-500' : 'border-neutral-800'} focus:border-luxuryGold focus:ring-1 focus:ring-luxuryGold/30 rounded-flox-inputs px-4 py-2.5 text-sm text-white placeholder-neutral-600 focus:outline-none transition-all`}
                        value={reviewLinks.googleReview}
                        onChange={(e) => {
                          setReviewLinks({ ...reviewLinks, googleReview: e.target.value })
                          if (errors.googleReview) setErrors({ ...errors, googleReview: '' })
                        }}
                      />
                      {errors.googleReview && <span className="text-xs text-red-400 mt-1 block">{errors.googleReview}</span>}
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-luxuryGold uppercase tracking-wider mb-2">{t('setup.yelp_review_link')}</label>
                      <input 
                        type="url"
                        placeholder="https://www.yelp.com/biz/your-store"
                        className={`w-full bg-luxuryBlack border ${errors.yelpReview ? 'border-red-500' : 'border-neutral-800'} focus:border-luxuryGold focus:ring-1 focus:ring-luxuryGold/30 rounded-flox-inputs px-4 py-2.5 text-sm text-white placeholder-neutral-600 focus:outline-none transition-all`}
                        value={reviewLinks.yelpReview}
                        onChange={(e) => {
                          setReviewLinks({ ...reviewLinks, yelpReview: e.target.value })
                          if (errors.yelpReview) setErrors({ ...errors, yelpReview: '' })
                        }}
                      />
                      {errors.yelpReview && <span className="text-xs text-red-400 mt-1 block">{errors.yelpReview}</span>}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-luxuryGold uppercase tracking-wider mb-2">{t('setup.facebook_link')}</label>
                        <input 
                          type="url"
                          placeholder="https://facebook.com/reviews"
                          className="w-full bg-luxuryBlack border border-neutral-800 focus:border-luxuryGold focus:ring-1 focus:ring-luxuryGold/30 rounded-flox-inputs px-4 py-2.5 text-sm text-white placeholder-neutral-600 focus:outline-none transition-all"
                          value={reviewLinks.facebookReview}
                          onChange={(e) => setReviewLinks({ ...reviewLinks, facebookReview: e.target.value })}
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-luxuryGold uppercase tracking-wider mb-2">{t('setup.feedback_email')}</label>
                        <input 
                          type="email"
                          placeholder="manager@yourstore.com"
                          className={`w-full bg-luxuryBlack border ${errors.feedbackEmail ? 'border-red-500' : 'border-neutral-800'} focus:border-luxuryGold focus:ring-1 focus:ring-luxuryGold/30 rounded-flox-inputs px-4 py-2.5 text-sm text-white placeholder-neutral-600 focus:outline-none transition-all`}
                          value={reviewLinks.feedbackEmail}
                          onChange={(e) => {
                            setReviewLinks({ ...reviewLinks, feedbackEmail: e.target.value })
                            if (errors.feedbackEmail) setErrors({ ...errors, feedbackEmail: '' })
                          }}
                        />
                        {errors.feedbackEmail && <span className="text-xs text-red-400 mt-1 block">{errors.feedbackEmail}</span>}
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* STEP 2: STAFF LIST & TOUCHPOINTS DIRECTORY (MERGED) */}
            {currentStep === 2 && (
              <div className="space-y-6 animate-fadeIn">
                <div className="border-b border-neutral-800 pb-4 mb-4">
                  <h2 className="font-serif text-xl md:text-2xl font-semibold flex items-center gap-2.5">
                    <Users className="text-luxuryGold w-6 h-6" />
                    {t('setup.title_step_2')}
                  </h2>
                  <p className="text-neutral-400 text-sm mt-1">
                    {t('setup.desc_step_2')}
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  
                  {/* Left Column: Staff Creation & Grid list */}
                  <div className="lg:col-span-6 space-y-6 lg:border-r lg:border-neutral-800/60 lg:pr-8">
                    {/* Add Staff form */}
                    <div className="p-4.5 rounded-xl bg-luxuryCoal/40 space-y-4">
                      <h3 className="text-xs font-semibold text-luxuryGold uppercase tracking-wider flex items-center gap-1.5 border-b border-neutral-800 pb-2">
                        <Plus className="w-4 h-4" /> {t('setup.add_staff_title')}
                      </h3>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-bold text-luxuryGold uppercase tracking-wider mb-1">{t('setup.staff_fullname')}</label>
                          <input 
                            type="text"
                            placeholder={t('setup.staff_fullname_placeholder')}
                            className={`w-full bg-luxuryBlack border ${errors.staffFullName ? 'border-red-500' : 'border-neutral-800'} focus:border-luxuryGold focus:ring-1 focus:ring-luxuryGold/30 rounded-flox-inputs px-3 py-2 text-sm text-white placeholder-neutral-600 focus:outline-none`}
                            value={newStaff.fullName}
                            onChange={(e) => setNewStaff({ ...newStaff, fullName: e.target.value })}
                          />
                          {errors.staffFullName && <span className="text-[10px] text-red-400 mt-0.5 block">{errors.staffFullName}</span>}
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-luxuryGold uppercase tracking-wider mb-1">{t('setup.staff_displayname')}</label>
                          <input 
                            type="text"
                            placeholder={t('setup.staff_displayname_placeholder')}
                            className={`w-full bg-luxuryBlack border ${errors.staffNickname ? 'border-red-500' : 'border-neutral-800'} focus:border-luxuryGold focus:ring-1 focus:ring-luxuryGold/30 rounded-flox-inputs px-3 py-2 text-sm text-white placeholder-neutral-600 focus:outline-none`}
                            value={newStaff.nickname}
                            onChange={(e) => setNewStaff({ ...newStaff, nickname: e.target.value })}
                          />
                          {errors.staffNickname && <span className="text-[10px] text-red-400 mt-0.5 block">{errors.staffNickname}</span>}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-bold text-luxuryGold uppercase tracking-wider mb-1">{t('setup.staff_position')}</label>
                          <input 
                            type="text"
                            placeholder={t('setup.staff_position_placeholder')}
                            className="w-full bg-luxuryBlack border border-neutral-800 focus:border-luxuryGold focus:ring-1 focus:ring-luxuryGold/30 rounded-flox-inputs px-3 py-2 text-sm text-white placeholder-neutral-600 focus:outline-none"
                            value={newStaff.position}
                            onChange={(e) => setNewStaff({ ...newStaff, position: e.target.value })}
                          />
                        </div>

                        {/* Zelle payment account */}
                        <div>
                          <label className="block text-[10px] font-bold text-luxuryGold uppercase tracking-wider mb-1">{t('setup.wallet_zelle')}</label>
                          <input 
                            type="text"
                            placeholder={t('setup.wallet_zelle_placeholder')}
                            className="w-full bg-luxuryBlack border border-neutral-800 focus:border-luxuryGold focus:ring-1 focus:ring-luxuryGold/30 rounded-flox-inputs px-3 py-2 text-sm text-white placeholder-neutral-600 focus:outline-none"
                            value={newStaff.zelle}
                            onChange={(e) => setNewStaff({ ...newStaff, zelle: e.target.value })}
                          />
                        </div>
                      </div>

                      {/* Venmo and Cashapp wallets */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-bold text-luxuryGold uppercase tracking-wider mb-1">{t('setup.wallet_venmo')}</label>
                          <input 
                            type="text"
                            placeholder={t('setup.wallet_venmo_placeholder')}
                            className="w-full bg-luxuryBlack border border-neutral-800 focus:border-luxuryGold focus:ring-1 focus:ring-luxuryGold/30 rounded-flox-inputs px-3 py-2 text-sm text-white placeholder-neutral-600 focus:outline-none"
                            value={newStaff.venmo}
                            onChange={(e) => setNewStaff({ ...newStaff, venmo: e.target.value })}
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-luxuryGold uppercase tracking-wider mb-1">{t('setup.wallet_cashapp')}</label>
                          <input 
                            type="text"
                            placeholder={t('setup.wallet_cashapp_placeholder')}
                            className="w-full bg-luxuryBlack border border-neutral-800 focus:border-luxuryGold focus:ring-1 focus:ring-luxuryGold/30 rounded-flox-inputs px-3 py-2 text-sm text-white placeholder-neutral-600 focus:outline-none"
                            value={newStaff.cashapp}
                            onChange={(e) => setNewStaff({ ...newStaff, cashapp: e.target.value })}
                          />
                        </div>
                      </div>

                      {/* VlinkPay optional input */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-bold text-luxuryGold uppercase tracking-wider mb-1">{t('setup.wallet_vlinkpay')}</label>
                          <input 
                            type="text"
                            placeholder="VLP-XXXX-XX"
                            className="w-full bg-luxuryBlack border border-neutral-800 focus:border-luxuryGold focus:ring-1 focus:ring-luxuryGold/30 rounded-flox-inputs px-3 py-2 text-sm text-white placeholder-neutral-600 focus:outline-none"
                            value={newStaff.vlinkpay}
                            onChange={(e) => setNewStaff({ ...newStaff, vlinkpay: e.target.value })}
                          />
                        </div>

                        <div className="flex items-end">
                          <button 
                            type="button"
                            onClick={handleAddStaff}
                            className="w-full min-h-[38px] bg-luxuryGold hover:bg-opacity-95 text-black font-extrabold text-xs uppercase tracking-wider rounded-flox-buttons flex items-center justify-center gap-1 transition-all"
                          >
                            <Plus className="w-4 h-4 stroke-[3px]" /> {t('setup.add_staff_btn')}
                          </button>
                        </div>
                      </div>
                      {errors.staffPayment && <p className="text-[10px] text-red-400 leading-tight">{errors.staffPayment}</p>}
                    </div>

                    {/* Staff List rendering */}
                    <div className="space-y-3">
                      <h4 className="text-[10px] font-black uppercase text-neutral-400 tracking-wider">{t('setup.staff_directory_title')} ({staffList.length})</h4>
                      {staffList.length === 0 ? (
                        <div className="border border-dashed border-neutral-800 rounded-xl p-6 text-center text-neutral-500 text-xs">
                          {t('setup.staff_directory_empty')}
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[220px] overflow-y-auto pr-1">
                          {staffList.map((staff) => (
                            <div 
                              key={staff.id} 
                              className="p-3 rounded-xl border border-neutral-800 bg-luxuryBlack/40 flex items-center justify-between"
                            >
                              <div className="min-w-0 flex items-center gap-2.5">
                                <div className="w-9 h-9 rounded-full bg-luxuryGold/10 border border-neutral-800 flex items-center justify-center font-bold text-luxuryGold font-serif text-xs">
                                  {staff.nickname.charAt(0)}
                                </div>
                                <div className="min-w-0">
                                  <div className="truncate text-xs font-bold text-white">{staff.fullName}</div>
                                  <div className="text-[10px] text-neutral-500">{staff.position || 'Nail Tech'}</div>
                                </div>
                              </div>
                              <button 
                                onClick={() => handleRemoveStaff(staff.id)}
                                className="p-1 rounded-lg text-neutral-500 hover:text-red-400 transition-colors"
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
                    <div className="p-4.5 rounded-xl bg-luxuryCoal/40 space-y-4">
                      <h3 className="text-xs font-semibold text-luxuryGold uppercase tracking-wider flex items-center gap-1.5 border-b border-neutral-800 pb-2">
                        <QrCode className="w-4 h-4 text-luxuryGold" /> {t('setup.qr_touchpoints_title')}
                      </h3>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-bold text-luxuryGold uppercase tracking-wider mb-1">{t('setup.tp_name')}</label>
                          <input 
                            type="text"
                            placeholder={t('setup.tp_name_placeholder')}
                            className="w-full bg-luxuryBlack border border-neutral-800 focus:border-luxuryGold focus:ring-1 focus:ring-luxuryGold/30 rounded-flox-inputs px-3 py-2 text-sm text-white placeholder-neutral-600 focus:outline-none"
                            value={newTouchpoint.name}
                            onChange={(e) => setNewTouchpoint({ ...newTouchpoint, name: e.target.value })}
                          />
                          {errors.tpName && <span className="text-[10px] text-red-400 mt-1 block">{errors.tpName}</span>}
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-luxuryGold uppercase tracking-wider mb-1">{t('setup.tp_type')}</label>
                          <select 
                            className="w-full bg-luxuryBlack border border-neutral-800 focus:border-luxuryGold focus:ring-1 focus:ring-luxuryGold/30 rounded-flox-inputs pl-3 pr-10 py-2 text-sm text-white focus:outline-none focus:ring-0 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22none%22%3E%3Cpath%20d%3D%22M7%209l3%203%203-3%22%20stroke%3D%22%23D4AF37%22%20stroke-width%3D%221.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E')] bg-[position:right_10px_center] bg-[size:18px_18px] bg-no-repeat"
                            value={newTouchpoint.type}
                            onChange={(e) => setNewTouchpoint({ ...newTouchpoint, type: e.target.value })}
                          >
                            <option value="Table QR">Table QR</option>
                            <option value="Front Desk">Front Desk</option>
                            <option value="Receipt QR">Receipt QR</option>
                          </select>
                        </div>
                      </div>

                      <button 
                        onClick={handleAddTouchpoint}
                        className="w-full py-2 bg-neutral-800 hover:bg-neutral-700 text-luxuryGold text-xs font-bold rounded-flox-inputs transition-all border border-neutral-800"
                      >
                        {t('setup.add_tp_btn')}
                      </button>
                    </div>

                    {/* Touchpoints Listing */}
                    <div className="space-y-3">
                      <h4 className="text-[10px] font-black uppercase text-neutral-400 tracking-wider">{t('setup.qr_touchpoints_title')} ({touchPoints.length})</h4>
                      <div className="space-y-2 overflow-y-auto pr-1 max-h-[220px] lg:max-h-[440px]">
                        {touchPoints.map((tp) => (
                          <div 
                            key={tp.id} 
                            className="flex items-center justify-between p-3 rounded-xl border border-neutral-800 bg-luxuryBlack/40"
                          >
                            <div className="min-w-0">
                              <div className="truncate text-xs font-bold text-white">{tp.name}</div>
                              <div className="text-[9px] flex items-center gap-2 mt-0.5">
                                <span className="px-1.5 py-0.5 rounded font-black bg-luxuryGold/10 text-luxuryGold border border-neutral-800/80 uppercase">
                                  {tp.type}
                                </span>
                                {tp.staffName && (
                                  <span className="text-neutral-500">{t('dashboard.modals.assign_staff')} {tp.staffName}</span>
                                )}
                              </div>
                            </div>
                            {tp.id.includes('custom') && (
                              <button 
                                onClick={() => handleRemoveTouchpoint(tp.id)}
                                className="p-1 text-neutral-500 hover:text-red-400 transition-colors animate-fadeIn"
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
                <div className="border-b border-neutral-800 pb-4 mb-4">
                  <h2 className="font-serif text-xl md:text-2xl font-semibold flex items-center gap-2.5">
                    <Download className="text-luxuryGold w-6 h-6" />
                    {t('setup.title_step_3')}
                  </h2>
                  <p className="text-neutral-400 text-sm mt-1">
                    {t('setup.desc_step_3')}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
                  
                  {/* Stand design template preview */}
                  <div className="md:col-span-5 flex justify-center">
                    <div className="relative w-full max-w-[220px] aspect-[2/3] bg-neutral-900 border border-neutral-800 rounded-flox-cards shadow-2xl p-6 flex flex-col justify-between items-center text-center overflow-hidden">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[rgba(212,175,55,0.08)] via-transparent to-transparent rounded-full pointer-events-none"></div>
                      
                      <div className="w-12 h-[2px] bg-rose-500 rounded-full" />
                      <div className="space-y-0.5">
                        <div className="text-[10px] font-black uppercase text-rose-200 tracking-wide">{businessInfo.name || 'Your Spa Salon'}</div>
                        <div className="text-[7px] text-neutral-400 font-bold uppercase tracking-widest">{t('customer.step_form_title')}</div>
                      </div>
                      
                      {/* Real generated QR code scan preview */}
                      <div className="w-24 h-24 bg-white rounded-lg flex items-center justify-center p-1.5 shadow-inner border border-neutral-800">
                        <img 
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
                            `${window.location.origin}${window.location.pathname}?flow=customer&merchant=${encodeURIComponent(businessInfo.name || 'Golden Glow Nail Spa & Salon')}`
                          )}`} 
                          alt="QR Preview" 
                          className="w-full h-full object-contain"
                        />
                      </div>

                      <div className="space-y-1">
                        <div className="text-[7px] font-bold text-neutral-400 flex items-center justify-center gap-0.5">
                          <CheckCircle2 className="w-2.5 h-2.5 text-rose-300" /> {t('login.sso_security_footer')}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Summary & downloads */}
                  <div className="md:col-span-7 space-y-5">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-green-950/40 text-green-400 border border-green-500/20">
                      <CheckCircle2 className="w-4 h-4" /> {t('common.success')}
                    </div>
                    
                    <h3 className="text-xl font-bold text-white">{t('setup.config_checklist_title')}</h3>
                    <p className="text-sm text-neutral-400 leading-relaxed">
                      {t('setup.chk_business', { name: businessInfo.name, industry: businessInfo.industry })}
                    </p>
                    <p className="text-sm text-neutral-400 leading-relaxed">
                      {t('setup.chk_routing')}
                    </p>
                    <p className="text-sm text-neutral-400 leading-relaxed">
                      {t('setup.chk_staff', { count: staffList.length })}
                    </p>
                    <p className="text-sm text-neutral-400 leading-relaxed">
                      {t('setup.chk_touchpoints', { count: touchPoints.length })}
                    </p>

                    <div className="space-y-3">
                      <button 
                        onClick={() => window.print()}
                        className="w-full flex items-center justify-between p-3.5 rounded-xl border border-neutral-800 bg-neutral-900 hover:bg-neutral-800/80 transition text-left"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="h-8 w-8 rounded-lg bg-neutral-800 flex items-center justify-center shrink-0"><Download className="h-[18px] w-[18px] text-luxuryGold" /></span>
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-white truncate">{t('setup.download_btn')}</div>
                            <div className="text-[10px] text-neutral-500 truncate sm:whitespace-normal">{t('setup.download_explain')}</div>
                          </div>
                        </div>
                        <span className="text-xs text-neutral-400 font-bold shrink-0 whitespace-nowrap ml-4">Print ›</span>
                      </button>
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="border-t border-neutral-800 mt-8 pt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
              {currentStep > 1 ? (
                <button 
                  onClick={handleBack}
                  className="min-h-11 w-full justify-center px-5 py-2.5 rounded-flox-inputs border border-neutral-800 hover:border-neutral-700 bg-neutral-950 text-neutral-300 font-semibold text-sm flex items-center gap-1.5 transition-all sm:w-auto"
                >
                  <ArrowLeft className="w-4 h-4" /> {t('common.back')}
                </button>
              ) : onBackToLogin ? (
                <button 
                  onClick={onBackToLogin}
                  className="min-h-11 w-full justify-center px-5 py-2.5 rounded-flox-inputs border border-neutral-800 hover:border-neutral-700 bg-neutral-950 text-neutral-300 font-semibold text-sm flex items-center gap-1.5 transition-all sm:w-auto"
                >
                  <LogIn className="w-4 h-4 text-neutral-400" /> {t('setup.back_to_login')}
                </button>
              ) : (
                <div />
              )}

              {currentStep < 3 ? (
                <button 
                  onClick={handleNext}
                  className="min-h-11 w-full justify-center px-6 py-2.5 rounded-flox-buttons bg-gradient-to-r from-luxuryGold via-luxuryGoldLight to-luxuryGoldDark text-black font-bold text-sm flex items-center gap-1.5 transition-all shadow-[0_4px_14px_rgba(212,175,55,0.3)] hover:opacity-90 sm:w-auto"
                >
                  {t('common.next')} <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button 
                  onClick={handleCompleteSetup}
                  className="min-h-11 w-full justify-center px-8 py-3 rounded-flox-buttons bg-gradient-to-r from-luxuryGold via-luxuryGoldLight to-luxuryGoldDark text-black font-extrabold text-sm flex items-center gap-2 transition-all shadow-[0_8px_25px_rgba(212,175,55,0.4)] hover:scale-[1.02] sm:w-auto"
                >
                  {t('setup.launch_dashboard_btn')} <ArrowRight className="w-[18px] h-[18px] stroke-[3px]" />
                </button>
              )}
            </div>

          </div>
        </main>

        {/* Footer info */}
        <footer className="text-center text-neutral-600 text-xs py-4 border-t border-neutral-800 mt-8">
          &copy; {new Date().getFullYear()} Nexora Touch by VLINKPAY. All rights reserved. Secured and compliant tip redirects.
        </footer>

      </div>

      {/* Print-only container to match Dashboard's QrModal layout exactly on print */}
      <div className="print-only-container qr-modal-backdrop">
        <div className="qr-modal-container">
          <h2 className="qr-print-title">Business QR - Lobby</h2>
          <p className="qr-print-subtitle">{t('customer.step_form_title') || 'Scan to Tip & Review'}</p>
          
          <div className="qr-print-card">
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
