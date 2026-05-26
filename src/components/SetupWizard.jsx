import React, { useState } from 'react'
import { 
  Sparkles, Building2, Link2, Users, QrCode, Download, 
  ArrowRight, ArrowLeft, Upload, Plus, Trash2, CheckCircle2, 
  AlertTriangle, Mail, Phone, Globe, Wallet, ShieldCheck, 
  MapPin, Clock, Check, Eye
} from 'lucide-react'

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
    fullName: 'Jane Samantha Miller',
    nickname: 'Jane M.',
    position: 'Nail Artist & Stylist',
    avatar: '',
    paymentAccounts: {
      venmo: '@jane-miller-glow',
      cashapp: '$janeglow',
      zelle: 'jane.miller@gmail.com',
      vlinkpay: ''
    }
  },
  {
    id: '2',
    fullName: 'David Nguyen',
    nickname: 'David N.',
    position: 'Nail Tech Specialist',
    avatar: '',
    paymentAccounts: {
      venmo: '',
      cashapp: '$davidnails',
      zelle: '407-555-0199',
      vlinkpay: 'VLP-8893-DN'
    }
  },
  {
    id: '3',
    fullName: 'Chloe Alexis Watson',
    nickname: 'Chloe W.',
    position: 'Esthetician / Therapist',
    avatar: '',
    paymentAccounts: {
      venmo: '@chloe-watson-spa',
      cashapp: '',
      zelle: '',
      vlinkpay: ''
    }
  }
]

export default function SetupWizard({ onComplete }) {
  const [currentStep, setCurrentStep] = useState(1)
  
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
      if (!businessInfo.name.trim()) newErrors.name = 'Tên cửa hàng là bắt buộc'
      if (!businessInfo.address.trim()) newErrors.address = 'Địa chỉ là bắt buộc'
      if (!businessInfo.phone.trim()) newErrors.phone = 'Số điện thoại là bắt buộc'
    }
    
    if (currentStep === 2) {
      if (!reviewLinks.googleReview.trim()) {
        newErrors.googleReview = 'Link Google Review là bắt buộc'
      } else if (!reviewLinks.googleReview.startsWith('http')) {
        newErrors.googleReview = 'Định dạng URL không hợp lệ (cần bắt đầu bằng http:// hoặc https://)'
      }
      
      if (!reviewLinks.yelpReview.trim()) {
        newErrors.yelpReview = 'Link Yelp Review là bắt buộc'
      } else if (!reviewLinks.yelpReview.startsWith('http')) {
        newErrors.yelpReview = 'Định dạng URL không hợp lệ'
      }
      
      if (reviewLinks.facebookReview && !reviewLinks.facebookReview.startsWith('http')) {
        newErrors.facebookReview = 'Định dạng URL không hợp lệ'
      }

      if (!reviewLinks.feedbackEmail.trim()) {
        newErrors.feedbackEmail = 'Email nhận góp ý là bắt buộc'
      } else if (!/\S+@\S+\.\S+/.test(reviewLinks.feedbackEmail)) {
        newErrors.feedbackEmail = 'Địa chỉ email không đúng định dạng'
      }
    }
    
    if (currentStep === 3) {
      if (staffList.length === 0) {
        newErrors.staffList = 'Vui lòng thêm ít nhất 1 nhân viên để tiếp tục.'
      }
    }

    if (currentStep === 4) {
      if (touchPoints.length === 0) {
        newErrors.touchPoints = 'Vui lòng tạo ít nhất 1 Điểm Chạm QR/NFC.'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (validateStep()) {
      // Auto populate touchpoints at Step 3 completion if empty
      if (currentStep === 3 && touchPoints.length === 0) {
        const autoTP = [
          { id: 'tp-main', name: 'Cổng QR Tiệm (Lobby)', type: 'Business Main' },
          { id: 'tp-front', name: 'Quầy Thu Ngân (Front Desk)', type: 'Front Desk' },
          ...staffList.map(s => ({
            id: `tp-staff-${s.id}`,
            name: `QR Cá Nhân - ${s.nickname}`,
            type: 'Staff QR',
            staffId: s.id,
            staffName: s.nickname
          }))
        ]
        setTouchPoints(autoTP)
      }
      setCurrentStep(prev => prev + 1)
    }
  }

  const handleBack = () => {
    setCurrentStep(prev => prev - 1)
  }

  // Step 3: Add Staff Action
  const handleAddStaff = () => {
    const staffErrors = {}
    if (!newStaff.fullName.trim()) staffErrors.staffFullName = 'Họ tên bắt buộc'
    if (!newStaff.nickname.trim()) staffErrors.staffNickname = 'Tên hiển thị bắt buộc'
    
    // Check if at least 1 payment account is provided (Business Rule)
    const hasVenmo = newStaff.venmo.trim() !== ''
    const hasCashapp = newStaff.cashapp.trim() !== ''
    const hasZelle = newStaff.zelle.trim() !== ''
    const hasVlinkpay = newStaff.vlinkpay.trim() !== ''
    
    if (!hasVenmo && !hasCashapp && !hasZelle && !hasVlinkpay) {
      staffErrors.staffPayment = 'Yêu cầu: Phải liên kết ít nhất 1 ví nhận tiền (Venmo, Cash App, Zelle, hoặc VLinkPay).'
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
        name: `QR Cá Nhân - ${added.nickname}`,
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

  // Step 3: Remove Staff Action
  const handleRemoveStaff = (id) => {
    const updated = staffList.filter(s => s.id !== id)
    setStaffList(updated)
    // Remove related touchpoint
    setTouchPoints(prev => prev.filter(tp => !(tp.type === 'Staff QR' && tp.staffId === id)))
  }

  // Step 4: Add Touch Point
  const handleAddTouchpoint = () => {
    if (!newTouchpoint.name.trim()) {
      setErrors({ ...errors, tpName: 'Tên điểm chạm là bắt buộc' })
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
    delete cleanedErrors.touchPoints
    setErrors(cleanedErrors)
  }

  // Step 4: Remove Touch Point
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
      case 2: return <Link2 className="w-5 h-5" />
      case 3: return <Users className="w-5 h-5" />
      case 4: return <QrCode className="w-5 h-5" />
      case 5: return <Download className="w-5 h-5" />
      default: return null
    }
  }

  const stepName = (step) => {
    switch (step) {
      case 1: return 'Business Info'
      case 2: return 'Review Links'
      case 3: return 'Add Staff'
      case 4: return 'Touch Points'
      case 5: return 'Download QR'
      default: return ''
    }
  }

  return (
    <div className="min-h-screen bg-luxuryBlack text-white font-sans overflow-x-hidden selection:bg-luxuryGold selection:text-black">
      {/* Background glowing effects */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[rgba(212,175,55,0.08)] via-transparent to-transparent rounded-full pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[rgba(212,175,55,0.06)] via-transparent to-transparent rounded-full pointer-events-none"></div>

      {/* Main Container */}
      <div className="max-w-5xl mx-auto px-4 py-8 relative z-10 flex flex-col min-h-screen justify-between">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between border-b border-luxuryGold/18 pb-6 mb-8 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-flox-cards bg-gradient-to-br from-luxuryGold to-luxuryGoldDark flex items-center justify-center shadow-lg shadow-[rgba(212,175,55,0.2)]">
              <span className="font-serif font-black text-black text-xl">N</span>
            </div>
            <div>
              <h1 className="font-serif text-2xl font-bold tracking-wide">
                NEXORA <span className="text-luxuryGold font-sans text-xs tracking-widest font-black uppercase bg-luxuryGold/10 px-2 py-0.5 rounded border border-luxuryGold/30 ml-2">TOUCH</span>
              </h1>
              <p className="text-xs text-[rgba(243,229,171,0.6)] font-light">By VLinkPay Technologies</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={prefillDemo}
              className="text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-flox-inputs border border-dashed border-luxuryGold/40 text-luxuryGold bg-luxuryGold/5 hover:bg-luxuryGold/20 transition-all font-medium"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Prefill Demo Data
            </button>
            <span className="text-xs text-neutral-400 bg-neutral-900 px-3 py-1.5 rounded-flox-inputs border border-luxuryGold/18">
              Onboarding Stage
            </span>
          </div>
        </header>

        {/* Wizard Progress Bar */}
        <div className="mb-10">
          <div className="flex justify-between items-center relative">
            {/* Background Line */}
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-[2px] bg-neutral-800 -z-10"></div>
            {/* Active Highlight Line */}
            <div 
              className="absolute left-0 top-1/2 -translate-y-1/2 h-[2px] bg-gradient-to-r from-luxuryGold to-luxuryGoldLight -z-10 transition-all duration-500"
              style={{ width: `${((currentStep - 1) / 4) * 100}%` }}
            ></div>

            {[1, 2, 3, 4, 5].map((step) => {
              const isActive = step === currentStep
              const isCompleted = step < currentStep
              return (
                <div key={step} className="flex flex-col items-center">
                  <div 
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 border-2 font-bold cursor-pointer
                      ${isActive 
                        ? 'bg-luxuryCoal border-luxuryGold text-luxuryGold shadow-[0_0_15px_rgba(212,175,55,0.4)] scale-110' 
                        : isCompleted
                          ? 'bg-luxuryGold border-luxuryGold text-black'
                          : 'bg-luxuryBlack border-luxuryGold/18 text-neutral-500'
                      }`}
                    onClick={() => {
                      // Allow navigation back to already completed steps or current step
                      if (step <= currentStep || (step > currentStep && validateStep())) {
                        setCurrentStep(step)
                      }
                    }}
                  >
                    {isCompleted ? <Check className="w-5 h-5 stroke-[3px]" /> : step}
                  </div>
                  <span className={`text-[10px] md:text-xs mt-2 font-medium tracking-wide transition-colors duration-300
                    ${isActive ? 'text-luxuryGold font-semibold' : isCompleted ? 'text-luxuryGoldLight' : 'text-neutral-500'}`}>
                    {stepName(step)}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Wizard Panel (Step Body) */}
        <main className="flex-grow flex items-center justify-center py-4">
          <div className="w-full glass-dark rounded-flox-cards p-6 md:p-10 shadow-premium relative overflow-hidden">
            
            {/* Subtle light glow inside panel */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[rgba(212,175,55,0.05)] via-transparent to-transparent rounded-full pointer-events-none"></div>

            {/* Error Banner */}
            {errors.staffList && (
              <div className="mb-6 p-4 rounded-flox-cards bg-red-950/40 border border-red-500/30 text-red-200 text-sm flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
                <span>{errors.staffList}</span>
              </div>
            )}
            {errors.touchPoints && (
              <div className="mb-6 p-4 rounded-flox-cards bg-red-950/40 border border-red-500/30 text-red-200 text-sm flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
                <span>{errors.touchPoints}</span>
              </div>
            )}

            {/* Step Content */}
            
            {/* STEP 1: BUSINESS INFO */}
            {currentStep === 1 && (
              <div className="space-y-6 animate-fadeIn">
                <div className="border-b border-luxuryGold/18 pb-4 mb-4">
                  <h2 className="font-serif text-xl md:text-2xl font-semibold flex items-center gap-2.5">
                    <Building2 className="text-luxuryGold w-6 h-6" />
                    Bước 1: Thiết Lập Thông Tin Cửa Hàng
                  </h2>
                  <p className="text-neutral-400 text-sm mt-1">Cung cấp thông tin cơ bản về tiệm của bạn để hiển thị trên ứng dụng.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                  
                  {/* Left Column - Form Inputs */}
                  <div className="md:col-span-8 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-luxuryGold uppercase tracking-wider mb-2">Tên Cửa Hàng *</label>
                        <input 
                          type="text"
                          placeholder="Ví dụ: Luxury Golden Spa"
                          className={`w-full bg-luxuryBlack border ${errors.name ? 'border-red-500' : 'border-luxuryGold/18'} focus:border-luxuryGold focus:ring-1 focus:ring-luxuryGold/30 rounded-flox-inputs px-4 py-2.5 text-white placeholder-neutral-600 focus:outline-none transition-all`}
                          value={businessInfo.name}
                          onChange={(e) => {
                            setBusinessInfo({ ...businessInfo, name: e.target.value })
                            if (errors.name) setErrors({ ...errors, name: '' })
                          }}
                        />
                        {errors.name && <span className="text-xs text-red-400 mt-1 block">{errors.name}</span>}
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-luxuryGold uppercase tracking-wider mb-2">Loại hình dịch vụ</label>
                        <select 
                          className="w-full bg-luxuryBlack border border-luxuryGold/18 focus:border-luxuryGold focus:ring-1 focus:ring-luxuryGold/30 rounded-flox-inputs px-4 py-2.5 text-white focus:outline-none transition-all"
                          value={businessInfo.industry}
                          onChange={(e) => setBusinessInfo({ ...businessInfo, industry: e.target.value })}
                        >
                          <option value="Nail Salon">Nail Salon (Tiệm Nail)</option>
                          <option value="Restaurant">Restaurant (Nhà Hàng)</option>
                          <option value="Cafe">Cafe / Tiệm bánh</option>
                          <option value="Spa">Spa & Beauty Clinic</option>
                          <option value="Bar">Bar & Lounge</option>
                          <option value="Hotel">Hotel & Resort</option>
                          <option value="Event Team">Event Team</option>
                          <option value="Khác">Khác / Khác biệt</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-luxuryGold uppercase tracking-wider mb-2">Địa Chỉ Hoạt Động *</label>
                      <div className="relative">
                        <MapPin className="absolute left-3.5 top-3.5 w-4 h-4 text-neutral-500" />
                        <input 
                          type="text"
                          placeholder="Nhập địa chỉ chính xác của cửa hàng"
                          className={`w-full bg-luxuryBlack border ${errors.address ? 'border-red-500' : 'border-luxuryGold/18'} focus:border-luxuryGold focus:ring-1 focus:ring-luxuryGold/30 rounded-flox-inputs pl-11 pr-4 py-2.5 text-white placeholder-neutral-600 focus:outline-none transition-all`}
                          value={businessInfo.address}
                          onChange={(e) => {
                            setBusinessInfo({ ...businessInfo, address: e.target.value })
                            if (errors.address) setErrors({ ...errors, address: '' })
                          }}
                        />
                      </div>
                      {errors.address && <span className="text-xs text-red-400 mt-1 block">{errors.address}</span>}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-luxuryGold uppercase tracking-wider mb-2">Số Điện Thoại Tiệm *</label>
                        <div className="relative">
                          <Phone className="absolute left-3.5 top-3.5 w-4 h-4 text-neutral-500" />
                          <input 
                            type="text"
                            placeholder="+1 (555) 000-0000"
                            className={`w-full bg-luxuryBlack border ${errors.phone ? 'border-red-500' : 'border-luxuryGold/18'} focus:border-luxuryGold focus:ring-1 focus:ring-luxuryGold/30 rounded-flox-inputs pl-11 pr-4 py-2.5 text-white placeholder-neutral-600 focus:outline-none transition-all`}
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
                        <label className="block text-[10px] font-bold text-luxuryGold uppercase tracking-wider mb-2">Website (Tùy chọn)</label>
                        <div className="relative">
                          <Globe className="absolute left-3.5 top-3.5 w-4 h-4 text-neutral-500" />
                          <input 
                            type="url"
                            placeholder="https://spasalon.com"
                            className="w-full bg-luxuryBlack border border-luxuryGold/18 focus:border-luxuryGold focus:ring-1 focus:ring-luxuryGold/30 rounded-flox-inputs pl-11 pr-4 py-2.5 text-white placeholder-neutral-600 focus:outline-none transition-all"
                            value={businessInfo.website}
                            onChange={(e) => setBusinessInfo({ ...businessInfo, website: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-luxuryGold uppercase tracking-wider mb-2">Múi giờ hoạt động</label>
                      <div className="relative">
                        <Clock className="absolute left-3.5 top-3.5 w-4 h-4 text-neutral-500" />
                        <select 
                          className="w-full bg-luxuryBlack border border-luxuryGold/18 focus:border-luxuryGold focus:ring-1 focus:ring-luxuryGold/30 rounded-flox-inputs pl-11 pr-4 py-2.5 text-white focus:outline-none transition-all"
                          value={businessInfo.timezone}
                          onChange={(e) => setBusinessInfo({ ...businessInfo, timezone: e.target.value })}
                        >
                          <option value="US/Eastern">US Eastern Time (EST/EDT)</option>
                          <option value="US/Central">US Central Time (CST/CDT)</option>
                          <option value="US/Mountain">US Mountain Time (MST/MDT)</option>
                          <option value="US/Pacific">US Pacific Time (PST/PDT)</option>
                          <option value="Asia/Ho_Chi_Minh">Vietnam (GMT+7)</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Right Column - Logo Uploader Graphic */}
                  <div className="md:col-span-4 flex flex-col items-center justify-center">
                    <label className="block text-[10px] font-bold text-luxuryGold uppercase tracking-wider mb-2 self-start md:self-center">Logo Cửa Hàng</label>
                    <div className="w-full max-w-[200px] aspect-square rounded-flox-cards border-2 border-dashed border-luxuryGold/18 bg-luxuryBlack/50 hover:bg-luxuryBlack hover:border-luxuryGold rounded-flox-cards flex flex-col items-center justify-center p-4 text-center cursor-pointer transition-all hover:border-luxuryGold relative group">
                      
                      {businessInfo.logo ? (
                        <>
                          <img src={businessInfo.logo} alt="Store logo" className="w-full h-full object-contain rounded-flox-cards" />
                          <div className="absolute inset-0 bg-black/60 rounded-flox-cards opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                            <span className="text-xs font-semibold text-luxuryGold flex items-center gap-1"><Upload className="w-3.5 h-3.5" /> Đổi ảnh</span>
                          </div>
                        </>
                      ) : (
                        <div className="space-y-2">
                          <div className="w-12 h-12 rounded-full bg-luxuryGold/5 flex items-center justify-center mx-auto text-luxuryGold group-hover:scale-110 transition-transform">
                            <Upload className="w-6 h-6" />
                          </div>
                          <p className="text-xs text-neutral-400 font-medium">Click để chọn hoặc kéo thả logo</p>
                          <p className="text-[9px] text-neutral-600">Hỗ trợ PNG, JPG (Max 2MB)</p>
                        </div>
                      )}
                      
                      <input 
                        type="file" 
                        accept="image/*"
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        onChange={handleLogoChange}
                      />
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* STEP 2: REVIEW ROUTING LINKS */}
            {currentStep === 2 && (
              <div className="space-y-6 animate-fadeIn">
                <div className="border-b border-luxuryGold/18 pb-4 mb-4">
                  <h2 className="font-serif text-xl md:text-2xl font-semibold flex items-center gap-2.5">
                    <Link2 className="text-luxuryGold w-6 h-6" />
                    Bước 2: Cấu Hình Các Liên Kết Đánh Giá
                  </h2>
                  <p className="text-neutral-400 text-sm mt-1">Các liên kết dùng cho bộ lọc đánh giá thông minh (Review Routing) của Nexora Touch.</p>
                </div>

                {/* routing routing alert explainer */}
                <div className="p-4 rounded-flox-cards bg-luxuryGold/5 border border-luxuryGold/18 text-xs md:text-sm text-[rgba(243,229,171,0.85)] flex gap-3 leading-relaxed">
                  <ShieldCheck className="w-5 h-5 text-luxuryGold shrink-0" />
                  <div>
                    <span className="font-semibold text-luxuryGold">Cơ chế định tuyến review:</span> Khách hàng đánh giá <span className="text-green-400 font-semibold">4–5 sao</span> sẽ được hệ thống điều hướng trực tiếp sang Google/Yelp công khai. Đánh giá từ <span className="text-yellow-500 font-semibold">1–3 sao</span> sẽ gửi biểu mẫu góp ý kín trực tiếp về Email dưới đây.
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  <div>
                    <label className="block text-[10px] font-bold text-luxuryGold uppercase tracking-wider mb-2">Google Review Link *</label>
                    <div className="relative">
                      <div className="absolute left-3.5 top-3.5 font-bold text-red-500 text-xs select-none">G</div>
                      <input 
                        type="url"
                        placeholder="https://g.page/r/cxxxxxx/review"
                        className={`w-full bg-luxuryBlack border ${errors.googleReview ? 'border-red-500' : 'border-luxuryGold/18'} focus:border-luxuryGold focus:ring-1 focus:ring-luxuryGold/30 rounded-flox-inputs pl-9 pr-4 py-2.5 text-white placeholder-neutral-600 focus:outline-none transition-all`}
                        value={reviewLinks.googleReview}
                        onChange={(e) => {
                          setReviewLinks({ ...reviewLinks, googleReview: e.target.value })
                          if (errors.googleReview) setErrors({ ...errors, googleReview: '' })
                        }}
                      />
                    </div>
                    {errors.googleReview && <span className="text-xs text-red-400 mt-1 block">{errors.googleReview}</span>}
                    <p className="text-[10px] text-neutral-500 mt-1.5">Mẹo: Truy cập Google Business Profile của bạn và sao chép link "Yêu cầu đánh giá".</p>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-luxuryGold uppercase tracking-wider mb-2">Yelp Review Link *</label>
                    <div className="relative">
                      <div className="absolute left-3.5 top-3.5 font-bold text-red-600 text-xs select-none">Y</div>
                      <input 
                        type="url"
                        placeholder="https://www.yelp.com/biz/ten-cua-hang"
                        className={`w-full bg-luxuryBlack border ${errors.yelpReview ? 'border-red-500' : 'border-luxuryGold/18'} focus:border-luxuryGold focus:ring-1 focus:ring-luxuryGold/30 rounded-flox-inputs pl-9 pr-4 py-2.5 text-white placeholder-neutral-600 focus:outline-none transition-all`}
                        value={reviewLinks.yelpReview}
                        onChange={(e) => {
                          setReviewLinks({ ...reviewLinks, yelpReview: e.target.value })
                          if (errors.yelpReview) setErrors({ ...errors, yelpReview: '' })
                        }}
                      />
                    </div>
                    {errors.yelpReview && <span className="text-xs text-red-400 mt-1 block">{errors.yelpReview}</span>}
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-luxuryGold uppercase tracking-wider mb-2">Facebook Review Link (Tùy chọn)</label>
                    <div className="relative">
                      <div className="absolute left-3.5 top-3.5 font-bold text-blue-500 text-xs select-none">F</div>
                      <input 
                        type="url"
                        placeholder="https://www.facebook.com/ten-tiem/reviews"
                        className={`w-full bg-luxuryBlack border ${errors.facebookReview ? 'border-red-500' : 'border-luxuryGold/18'} focus:border-luxuryGold focus:ring-1 focus:ring-luxuryGold/30 rounded-flox-inputs pl-9 pr-4 py-2.5 text-white placeholder-neutral-600 focus:outline-none transition-all`}
                        value={reviewLinks.facebookReview}
                        onChange={(e) => {
                          setReviewLinks({ ...reviewLinks, facebookReview: e.target.value })
                          if (errors.facebookReview) setErrors({ ...errors, facebookReview: '' })
                        }}
                      />
                    </div>
                    {errors.facebookReview && <span className="text-xs text-red-400 mt-1 block">{errors.facebookReview}</span>}
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-luxuryGold uppercase tracking-wider mb-2">Email Nhận Feedback Nội Bộ (1-3★) *</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-neutral-500" />
                      <input 
                        type="email"
                        placeholder="chu-tiem-feedback@gmail.com"
                        className={`w-full bg-luxuryBlack border ${errors.feedbackEmail ? 'border-red-500' : 'border-luxuryGold/18'} focus:border-luxuryGold focus:ring-1 focus:ring-luxuryGold/30 rounded-flox-inputs pl-11 pr-4 py-2.5 text-white placeholder-neutral-600 focus:outline-none transition-all`}
                        value={reviewLinks.feedbackEmail}
                        onChange={(e) => {
                          setReviewLinks({ ...reviewLinks, feedbackEmail: e.target.value })
                          if (errors.feedbackEmail) setErrors({ ...errors, feedbackEmail: '' })
                        }}
                      />
                    </div>
                    {errors.feedbackEmail && <span className="text-xs text-red-400 mt-1 block">{errors.feedbackEmail}</span>}
                  </div>

                </div>
              </div>
            )}

            {/* STEP 3: ADD STAFF */}
            {currentStep === 3 && (
              <div className="space-y-6 animate-fadeIn">
                <div className="border-b border-luxuryGold/18 pb-4 mb-4">
                  <h2 className="font-serif text-xl md:text-2xl font-semibold flex items-center gap-2.5">
                    <Users className="text-luxuryGold w-6 h-6" />
                    Bước 3: Thiết Lập Danh Sách Nhân Viên
                  </h2>
                  <p className="text-neutral-400 text-sm mt-1">
                    Thêm các thợ vào hệ thống để khách hàng gửi tiền tip trực tiếp và chọn tên khi đánh giá.
                  </p>
                </div>

                {/* Add Staff Mini Form */}
                <div className="p-5 rounded-flox-cards border border-luxuryGold/18 bg-luxuryCoal/40 space-y-4">
                  <h3 className="text-sm font-semibold text-luxuryGold flex items-center gap-1.5">
                    <Plus className="w-4 h-4" /> Thêm Nhân Viên Mới
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-luxuryGold uppercase tracking-wider mb-1">Họ Tên Đầy Đủ (Nội bộ) *</label>
                      <input 
                        type="text"
                        placeholder="Jane Samantha Miller"
                        className={`w-full bg-luxuryBlack border ${errors.staffFullName ? 'border-red-500' : 'border-luxuryGold/18'} focus:border-luxuryGold focus:ring-1 focus:ring-luxuryGold/30 rounded-flox-inputs px-3 py-2 text-sm text-white focus:outline-none`}
                        value={newStaff.fullName}
                        onChange={(e) => setNewStaff({ ...newStaff, fullName: e.target.value })}
                      />
                      {errors.staffFullName && <span className="text-[10px] text-red-400 mt-0.5 block">{errors.staffFullName}</span>}
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-luxuryGold uppercase tracking-wider mb-1">Tên Hiển Thị (Màn hình khách) *</label>
                      <input 
                        type="text"
                        placeholder="Jane M."
                        className={`w-full bg-luxuryBlack border ${errors.staffNickname ? 'border-red-500' : 'border-luxuryGold/18'} focus:border-luxuryGold focus:ring-1 focus:ring-luxuryGold/30 rounded-flox-inputs px-3 py-2 text-sm text-white focus:outline-none`}
                        value={newStaff.nickname}
                        onChange={(e) => setNewStaff({ ...newStaff, nickname: e.target.value })}
                      />
                      {errors.staffNickname && <span className="text-[10px] text-red-400 mt-0.5 block">{errors.staffNickname}</span>}
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-luxuryGold uppercase tracking-wider mb-1">Chức Vụ</label>
                      <input 
                        type="text"
                        placeholder="Ví dụ: Nail Tech, Server..."
                        className="w-full bg-luxuryBlack border border-luxuryGold/18 focus:border-luxuryGold focus:ring-1 focus:ring-luxuryGold/30 rounded-flox-inputs px-3 py-2 text-sm text-white focus:outline-none"
                        value={newStaff.position}
                        onChange={(e) => setNewStaff({ ...newStaff, position: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Payment Accounts inputs */}
                  <div>
                    <label className="block text-[10px] font-bold text-luxuryGold uppercase tracking-wider mb-2">
                      Ví Nhận Tiền Cá Nhân (Cần điền ít nhất 1 phương thức nhận tiền) *
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                      <div>
                        <div className="relative">
                          <span className="absolute left-2.5 top-2.5 text-[10px] text-neutral-500 font-bold">Venmo</span>
                          <input 
                            type="text"
                            placeholder="@username"
                            className="w-full bg-luxuryBlack border border-luxuryGold/18 focus:border-luxuryGold focus:ring-1 focus:ring-luxuryGold/30 rounded-flox-inputs pl-14 pr-2 py-2 text-xs text-white focus:outline-none placeholder-neutral-600"
                            value={newStaff.venmo}
                            onChange={(e) => setNewStaff({ ...newStaff, venmo: e.target.value })}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="relative">
                          <span className="absolute left-2.5 top-2.5 text-[10px] text-neutral-500 font-bold">CashApp</span>
                          <input 
                            type="text"
                            placeholder="$cashtag"
                            className="w-full bg-luxuryBlack border border-luxuryGold/18 focus:border-luxuryGold focus:ring-1 focus:ring-luxuryGold/30 rounded-flox-inputs pl-14 pr-2 py-2 text-xs text-white focus:outline-none placeholder-neutral-600"
                            value={newStaff.cashapp}
                            onChange={(e) => setNewStaff({ ...newStaff, cashapp: e.target.value })}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="relative">
                          <span className="absolute left-2.5 top-2.5 text-[10px] text-neutral-500 font-bold">Zelle</span>
                          <input 
                            type="text"
                            placeholder="Email / Phone"
                            className="w-full bg-luxuryBlack border border-luxuryGold/18 focus:border-luxuryGold focus:ring-1 focus:ring-luxuryGold/30 rounded-flox-inputs pl-11 pr-2 py-2 text-xs text-white focus:outline-none placeholder-neutral-600"
                            value={newStaff.zelle}
                            onChange={(e) => setNewStaff({ ...newStaff, zelle: e.target.value })}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="relative">
                          <span className="absolute left-2.5 top-2.5 text-[10px] text-neutral-500 font-bold">VLinkPay</span>
                          <input 
                            type="text"
                            placeholder="ID VLinkPay"
                            className="w-full bg-luxuryBlack border border-luxuryGold/18 focus:border-luxuryGold focus:ring-1 focus:ring-luxuryGold/30 rounded-flox-inputs pl-16 pr-2 py-2 text-xs text-white focus:outline-none placeholder-neutral-600"
                            value={newStaff.vlinkpay}
                            onChange={(e) => setNewStaff({ ...newStaff, vlinkpay: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>
                    {errors.staffPayment && (
                      <span className="text-xs text-red-400 mt-2 block font-medium flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        {errors.staffPayment}
                      </span>
                    )}
                  </div>

                  <div className="flex justify-end pt-2">
                    <button 
                      onClick={handleAddStaff}
                      className="px-4 py-2 bg-luxuryGold hover:bg-luxuryGoldLight text-black text-xs font-bold rounded-flox-inputs flex items-center gap-1.5 transition-all shadow-md"
                    >
                      <Plus className="w-4 h-4 stroke-[3px]" /> Thêm vào danh sách
                    </button>
                  </div>
                </div>

                {/* Staff List Display */}
                <div>
                  <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-3">
                    Đã Thêm ({staffList.length})
                  </h3>

                  {staffList.length === 0 ? (
                    <div className="border border-dashed border-luxuryGold/18 rounded-flox-cards p-8 text-center text-neutral-500 text-sm">
                      Chưa có nhân viên nào. Vui lòng thêm ít nhất 1 nhân viên để tiến hành onboarding.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[300px] overflow-y-auto pr-2">
                      {staffList.map((staff) => (
                        <div 
                          key={staff.id} 
                          className="flex items-center justify-between p-3.5 rounded-flox-cards border border-luxuryGold/18 bg-luxuryBlack/40"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-luxuryGold/10 border border-luxuryGold/18 flex items-center justify-center font-bold text-luxuryGold font-serif text-sm">
                              {staff.nickname.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-semibold text-sm">{staff.fullName}</div>
                              <div className="text-xs text-neutral-400 flex items-center gap-2">
                                <span className="text-neutral-500 font-light">{staff.position}</span>
                                <span>•</span>
                                <span className="text-luxuryGold">{staff.nickname}</span>
                              </div>
                              {/* Show badges for linked accounts */}
                              <div className="flex gap-1.5 mt-1.5">
                                {staff.paymentAccounts.venmo && <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-neutral-800 text-blue-400">Venmo</span>}
                                {staff.paymentAccounts.cashapp && <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-neutral-800 text-green-400">CashApp</span>}
                                {staff.paymentAccounts.zelle && <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-neutral-800 text-purple-400">Zelle</span>}
                                {staff.paymentAccounts.vlinkpay && <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-neutral-800 text-cyan-400">VLinkPay</span>}
                              </div>
                            </div>
                          </div>

                          <button 
                            onClick={() => handleRemoveStaff(staff.id)}
                            className="p-1.5 rounded-flox-inputs border border-transparent hover:border-red-500/30 hover:bg-red-500/10 text-neutral-500 hover:text-red-400 transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            )}

            {/* STEP 4: CREATE TOUCH POINTS */}
            {currentStep === 4 && (
              <div className="space-y-6 animate-fadeIn">
                <div className="border-b border-luxuryGold/18 pb-4 mb-4">
                  <h2 className="font-serif text-xl md:text-2xl font-semibold flex items-center gap-2.5">
                    <QrCode className="text-luxuryGold w-6 h-6" />
                    Bước 4: Tạo Các Điểm Chạm QR/NFC (Touch Points)
                  </h2>
                  <p className="text-neutral-400 text-sm mt-1">
                    Thiết lập các vị trí dán mã QR/NFC tại cửa hàng (bàn làm việc, quầy thu ngân, hoặc in trên hóa đơn).
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                  
                  {/* Left Column: Form to add touchpoint */}
                  <div className="md:col-span-5 space-y-4">
                    <div className="p-4 rounded-flox-cards border border-luxuryGold/18 bg-neutral-900/50 space-y-4">
                      <h3 className="text-xs font-semibold text-luxuryGold uppercase tracking-wider">
                        Thêm Điểm Chạm Mới
                      </h3>

                      <div>
                        <label className="block text-[10px] font-bold text-luxuryGold uppercase tracking-wider mb-1">Tên Điểm Chạm *</label>
                        <input 
                          type="text"
                          placeholder="Ví dụ: Table 01, Cashier 1"
                          className="w-full bg-luxuryBlack border border-luxuryGold/18 focus:border-luxuryGold focus:ring-1 focus:ring-luxuryGold/30 rounded-flox-inputs px-3 py-2 text-sm text-white focus:outline-none"
                          value={newTouchpoint.name}
                          onChange={(e) => setNewTouchpoint({ ...newTouchpoint, name: e.target.value })}
                        />
                        {errors.tpName && <span className="text-[10px] text-red-400 mt-1 block">{errors.tpName}</span>}
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-luxuryGold uppercase tracking-wider mb-1">Loại Điểm Chạm</label>
                        <select 
                          className="w-full bg-luxuryBlack border border-luxuryGold/18 focus:border-luxuryGold focus:ring-1 focus:ring-luxuryGold/30 rounded-flox-inputs px-3 py-2 text-sm text-white focus:outline-none focus:ring-0"
                          value={newTouchpoint.type}
                          onChange={(e) => setNewTouchpoint({ ...newTouchpoint, type: e.target.value })}
                        >
                          <option value="Table QR">Table QR (Mã QR đặt tại bàn / ghế dịch vụ)</option>
                          <option value="Front Desk">Front Desk (Quầy thu ngân / Tiếp tân)</option>
                          <option value="Receipt QR">Receipt QR (Mã in trên hóa đơn)</option>
                          <option value="Business Main">Business Main (Mã QR chung sảnh chờ)</option>
                        </select>
                      </div>

                      <button 
                        onClick={handleAddTouchpoint}
                        className="w-full py-2 bg-neutral-800 hover:bg-neutral-700 text-luxuryGold text-xs font-bold rounded-flox-inputs transition-all border border-luxuryGold/20"
                      >
                        Tạo Điểm Chạm
                      </button>
                    </div>
                  </div>

                  {/* Right Column: List of generated touchpoints */}
                  <div className="md:col-span-7 space-y-3">
                    <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                      Danh Sách Điểm Chạm Đã Cấu Hình ({touchPoints.length})
                    </h3>

                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                      {touchPoints.map((tp) => (
                        <div 
                          key={tp.id} 
                          className="flex items-center justify-between p-3 rounded-flox-inputs border border-luxuryGold/18 bg-luxuryBlack/70"
                        >
                          <div>
                            <div className="font-semibold text-sm">{tp.name}</div>
                            <div className="text-[10px] flex items-center gap-2 mt-0.5">
                              <span className="px-1.5 py-0.5 rounded font-bold bg-luxuryGold/10 text-luxuryGold border border-luxuryGold/20 uppercase tracking-wider">
                                {tp.type}
                              </span>
                              {tp.staffName && (
                                <span className="text-neutral-500 font-light">Thợ nhận: {tp.staffName}</span>
                              )}
                            </div>
                          </div>

                          <button 
                            onClick={() => handleRemoveTouchpoint(tp.id)}
                            className="p-1.5 rounded-flox-inputs text-neutral-500 hover:text-red-400 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* STEP 5: DOWNLOAD QR */}
            {currentStep === 5 && (
              <div className="space-y-6 animate-fadeIn">
                <div className="border-b border-luxuryGold/18 pb-4 mb-4">
                  <h2 className="font-serif text-xl md:text-2xl font-semibold flex items-center gap-2.5">
                    <Download className="text-luxuryGold w-6 h-6" />
                    Bước 5: Hoàn Thành & Tải Thiết Kế Mã QR
                  </h2>
                  <p className="text-neutral-400 text-sm mt-1">
                    Cửa hàng đã sẵn sàng hoạt động! Hãy tải về các bộ thiết kế QR Code chất lượng cao để in ấn và sử dụng.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
                  
                  {/* Left Column: Mock of Mica Stand Graphic */}
                  <div className="md:col-span-5 flex flex-col items-center">
                    <div className="relative w-full max-w-[240px] aspect-[2/3] bg-neutral-900 border border-luxuryGold/18 rounded-flox-cards shadow-[0_20px_40px_rgba(0,0,0,0.8)] p-6 flex flex-col justify-between items-center text-center overflow-hidden">
                      
                      {/* Stand Top Bar */}
                      <div className="w-16 h-1 rounded-full bg-luxuryGold/50 mb-1"></div>

                      {/* Store Name */}
                      <div className="space-y-1">
                        <div className="font-serif text-[11px] font-bold text-luxuryGold max-w-[180px] truncate">
                          {businessInfo.name || "TEN CUA HANG"}
                        </div>
                        <div className="text-[7px] text-neutral-400 uppercase tracking-widest font-light">Scan to Tip & Review</div>
                      </div>

                      {/* Mock QR Center */}
                      <div className="my-3 p-2 bg-white rounded-flox-inputs aspect-square w-[110px] flex items-center justify-center relative shadow-lg">
                        {/* Custom QR code box mockup */}
                        <div className="w-full h-full border-2 border-dashed border-neutral-300 flex items-center justify-center p-1">
                          <div className="w-full h-full relative">
                            {/* Inner grid points simulator */}
                            <div className="absolute top-0 left-0 w-4 h-4 bg-black"></div>
                            <div className="absolute top-0 right-0 w-4 h-4 bg-black"></div>
                            <div className="absolute bottom-0 left-0 w-4 h-4 bg-black"></div>
                            <div className="absolute inset-4 border border-black flex items-center justify-center">
                              <div className="w-4 h-4 rounded bg-luxuryGold flex items-center justify-center">
                                <span className="text-[6px] text-black font-black font-serif">N</span>
                              </div>
                            </div>
                            {/* Tiny random blocks */}
                            <div className="absolute top-1 left-6 w-2 h-2 bg-neutral-700"></div>
                            <div className="absolute top-6 left-1 w-2 h-2 bg-neutral-700"></div>
                            <div className="absolute bottom-1 right-6 w-3 h-2 bg-neutral-700"></div>
                            <div className="absolute top-7 right-2 w-2 h-3 bg-neutral-700"></div>
                          </div>
                        </div>
                      </div>

                      {/* Brand Footer */}
                      <div className="space-y-1">
                        <div className="text-[7px] text-neutral-400 font-semibold flex items-center justify-center gap-1">
                          <ShieldCheck className="w-2.5 h-2.5 text-luxuryGold" /> Secure Tip Redirects via VLinkPay
                        </div>
                        <div className="text-[6px] text-neutral-600 font-mono">nexora.vlinkpay.com/touch/{businessInfo.name.toLowerCase().replace(/\s+/g, '-')}</div>
                      </div>

                      {/* Stand wood base holder simulator */}
                      <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-t from-luxuryGoldDark via-luxuryGold to-luxuryGoldLight"></div>
                    </div>
                    <span className="text-xs text-neutral-500 mt-3 italic">Mô phỏng đế Mica đặt bàn thực tế</span>
                  </div>

                  {/* Right Column: Download List / Success Text */}
                  <div className="md:col-span-7 space-y-6">
                    <div className="space-y-2">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-green-950/40 text-green-400 border border-green-500/20">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Thiết lập thành công
                      </div>
                      <h3 className="font-serif text-xl font-bold">
                        Đang Khởi Tạo {touchPoints.length} Bộ Mã Thiết Kế
                      </h3>
                      <p className="text-neutral-400 text-sm">
                        Mỗi mã QR tương ứng với một điểm chạm dịch vụ hoặc mã cá nhân thợ. Bạn có thể tải gói tổng hợp toàn bộ file chất lượng cao để in ấn chuyên nghiệp (kích thước 4x6 inch, tiêu chuẩn Mica đứng).
                      </p>
                    </div>

                    {/* Download buttons */}
                    <div className="space-y-3">
                      <button 
                        onClick={() => alert('Đang chuẩn bị tải về file ZIP chứa toàn bộ QR (PNG/PDF)...')}
                        className="w-full flex items-center justify-between p-4 rounded-flox-cards border border-luxuryGold/20 hover:border-luxuryGold bg-luxuryGold/5 hover:bg-luxuryGold/10 transition-all text-left"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 rounded-flox-inputs bg-luxuryGold/10 text-luxuryGold">
                            <Download className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="text-sm font-semibold">Tải Toàn Bộ Gói Thiết Kế QR (ZIP)</div>
                            <div className="text-xs text-neutral-400">Bao gồm {touchPoints.length} file PNG chất lượng cao và file PDF in ấn</div>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-luxuryGold" />
                      </button>

                      <div className="p-4 rounded-flox-cards border border-luxuryGold/18 bg-luxuryBlack/30">
                        <div className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-3">Tải lẻ từng Điểm Chạm</div>
                        <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1">
                          {touchPoints.map(tp => (
                            <div key={tp.id} className="flex items-center justify-between text-xs py-1.5 border-b border-luxuryGold/18 last:border-b-0">
                              <span className="font-medium text-neutral-300">{tp.name} ({tp.type})</span>
                              <button 
                                onClick={() => alert(`Tải xuống QR cho ${tp.name}`)}
                                className="text-luxuryGold hover:text-luxuryGoldLight hover:underline font-semibold flex items-center gap-1"
                              >
                                <Download className="w-3 h-3" /> PNG
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="border-t border-luxuryGold/18 mt-8 pt-6 flex justify-between items-center">
              {currentStep > 1 ? (
                <button 
                  onClick={handleBack}
                  className="px-5 py-2.5 rounded-flox-inputs border border-luxuryGold/18 hover:border-neutral-700 bg-neutral-950 text-neutral-300 font-semibold text-sm flex items-center gap-1.5 transition-all"
                >
                  <ArrowLeft className="w-4 h-4" /> Quay lại
                </button>
              ) : (
                <div />
              )}

              {currentStep < 5 ? (
                <button 
                  onClick={handleNext}
                  className="px-6 py-2.5 rounded-flox-buttons bg-gradient-to-r from-luxuryGold via-luxuryGoldLight to-luxuryGoldDark text-black font-bold text-sm flex items-center gap-1.5 transition-all shadow-[0_4px_14px_rgba(212,175,55,0.3)] hover:opacity-90"
                >
                  Tiếp theo <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button 
                  onClick={handleCompleteSetup}
                  className="px-8 py-3 rounded-flox-buttons bg-gradient-to-r from-luxuryGold via-luxuryGoldLight to-luxuryGoldDark text-black font-extrabold text-sm flex items-center gap-2 transition-all shadow-[0_8px_25px_rgba(212,175,55,0.4)] hover:scale-[1.02]"
                >
                  Hoàn Tất Cấu Hình & Đến Dashboard <ArrowRight className="w-4.5 h-4.5 stroke-[3px]" />
                </button>
              )}
            </div>

          </div>
        </main>

        {/* Footer info */}
        <footer className="text-center text-neutral-600 text-xs py-4 border-t border-luxuryGold/18 mt-8">
          &copy; {new Date().getFullYear()} Nexora Touch by VLinkPay. All rights reserved. Secured and compliant tip redirects.
        </footer>

      </div>
    </div>
  )
}

// Simple Chevron Icon since we didn't import it
function ChevronRight(props) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      {...props}
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  )
}
