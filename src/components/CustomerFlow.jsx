import React, { useState, useMemo, useEffect } from 'react'
import { Star, CheckCircle, Wallet, ArrowRight, ShieldCheck, Heart, Search, Users } from 'lucide-react'
import { useTranslation } from '../contexts/LanguageContext'

const WalletLogos = {
  venmo: (
    <svg viewBox="0 0 448 512" className="h-[18px] w-[18px] fill-white" xmlns="http://www.w3.org/2000/svg">
      <path d="M381.4 105.3c11 18.1 15.9 36.7 15.9 60.3 0 75.1-64.1 172.7-116.2 241.2h-118.8l-47.6-285 104.1-9.9 25.3 202.8c23.5-38.4 52.6-98.7 52.6-139.7 0-22.5-3.9-37.8-9.9-50.4z" />
    </svg>
  ),
  cashapp: (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] fill-white" xmlns="http://www.w3.org/2000/svg">
      <path d="M23.59 3.475a5.1 5.1 0 00-3.05-3.05c-1.31-.42-2.5-.42-4.92-.42H8.36c-2.4 0-3.61 0-4.9.4a5.1 5.1 0 00-3.05 3.06C0 4.765 0 5.965 0 8.365v7.27c0 2.41 0 3.6.4 4.9a5.1 5.1 0 003.05 3.05c1.3.41 2.5.41 4.9.41h7.28c2.41 0 3.61 0 4.9-.4a5.1 5.1 0 003.06-3.06c.41-1.3.41-2.5.41-4.9v-7.25c0-2.41 0-3.61-.41-4.91zm-6.17 4.63l-.93.93a.5.5 0 01-.67.01 5 5 0 00-3.22-1.18c-.97 0-1.94.32-1.94 1.21 0 .9 1.04 1.2 2.24 1.65 2.1.7 3.84 1.58 3.84 3.64 0 2.24-1.74 3.78-4.58 3.95l-.26 1.2a.49.49 0 01-.48.39H9.63l-.09-.01a.5.5 0 01-.38-.59l.28-1.27a6.54 6.54 0 01-2.88-1.57v-.01a.48.48 0 010-.68l1-.97a.49.49 0 01.67 0c.91.86 2.13 1.34 3.39 1.32 1.3 0 2.17-.55 2.17-1.42 0-.87-.88-1.1-2.54-1.72-1.76-.63-3.43-1.52-3.43-3.6 0-2.42 2.01-3.6 4.39-3.71l.25-1.23a.48.48 0 01.48-.38h1.78l.1.01c.26.06.43.31.37.57l-.27 1.37c.9.3 1.75.77 2.48 1.39l.02.02c.19.2.19.5 0 .68z" />
    </svg>
  ),
  zelle: (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] fill-white" xmlns="http://www.w3.org/2000/svg">
      <path d="M13.559 24h-2.841a.483.483 0 0 1-.483-.483v-2.765H5.638a.667.667 0 0 1-.666-.666v-2.234a.67.67 0 0 1 .142-.412l8.139-10.382h-7.25a.667.667 0 0 1-.667-.667V3.914c0-.367.299-.666.666-.666h4.23V.483c0-.266.217-.483.483-.483h2.841c.266 0 .483.217.483.483v2.765h4.323c.367 0 .666.299.666.666v2.137a.67.67 0 0 1-.141.41l-8.19 10.481h7.665c.367 0 .666.299.666.666v2.477a.667.667 0 0 1-.666.667h-4.32v2.765a.483.483 0 0 1-.483.483Z" />
    </svg>
  ),
  vlinkpay: (
    <img src="/assets/vlinkpay-logo.png" alt="VLINKPAY Logo" className="h-[22px] w-[22px] object-contain" />
  )
}

export default function CustomerFlow() {
  const { currentLanguage, setLanguage, t } = useTranslation()

  // Parse parameters from query string
  const params = useMemo(() => new URLSearchParams(window.location.search), [])
  const techSlug = params.get('tech') || '' // e.g. 'staff/mia-t'
  const bizName = params.get('biz') || 'Golden Glow Nail Spa'

  // Load merchant setup from localStorage (shared origin)
  const setupData = useMemo(() => {
    const saved = localStorage.getItem('nexora_merchant_setup')
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch (e) {
        return null
      }
    }
    return null
  }, [])

  // Get active and visible staff list
  const activeStaffList = useMemo(() => {
    const defaultStaff = [
      { id: '1', fullName: 'Mia Tran', nickname: 'Mia T.', position: 'Gel-X Lead', isActive: true, showInTipsFlow: true, paymentAccounts: { venmo: '@mia-nails', cashapp: '$miaglow', zelle: 'mia.tran@gmail.com', vlinkpay: '' } },
      { id: '2', fullName: 'Vivian Le', nickname: 'Vivian L.', position: 'Acrylic Specialist', isActive: true, showInTipsFlow: true, paymentAccounts: { venmo: '', cashapp: '$vivianle', zelle: '407-555-0199', vlinkpay: 'VLP-8893-VL' } },
      { id: '3', fullName: 'Ashley Park', nickname: 'Ashley P.', position: 'Pedicure Lead', isActive: true, showInTipsFlow: true, paymentAccounts: { venmo: '@ashley-pedi', cashapp: '', zelle: 'ashley@glownails.com', vlinkpay: '' } },
      { id: '4', fullName: 'Hanna Nguyen', nickname: 'Hanna Ng.', position: 'Nail Art Designer', isActive: false, showInTipsFlow: true, paymentAccounts: { venmo: '@hanna-art', cashapp: '', zelle: '', vlinkpay: 'VLP-1148-HN' } }
    ]

    const list = setupData?.staffList || defaultStaff
    return list.filter(s => s.isActive !== false && s.showInTipsFlow !== false)
  }, [setupData])

  // Determine if a specific technician QR was scanned directly
  const initialStaffMember = useMemo(() => {
    if (!techSlug || techSlug.toLowerCase().startsWith('tp/') || techSlug.toLowerCase().startsWith('tp-')) {
      return null
    }

    const defaultStaff = [
      { id: '1', fullName: 'Mia Tran', nickname: 'Mia T.', position: 'Gel-X Lead', isActive: true, showInTipsFlow: true, paymentAccounts: { venmo: '@mia-nails', cashapp: '$miaglow', zelle: 'mia.tran@gmail.com', vlinkpay: '' } },
      { id: '2', fullName: 'Vivian Le', nickname: 'Vivian L.', position: 'Acrylic Specialist', isActive: true, showInTipsFlow: true, paymentAccounts: { venmo: '', cashapp: '$vivianle', zelle: '407-555-0199', vlinkpay: 'VLP-8893-VL' } },
      { id: '3', fullName: 'Ashley Park', nickname: 'Ashley P.', position: 'Pedicure Lead', isActive: true, showInTipsFlow: true, paymentAccounts: { venmo: '@ashley-pedi', cashapp: '', zelle: 'ashley@glownails.com', vlinkpay: '' } },
      { id: '4', fullName: 'Hanna Nguyen', nickname: 'Hanna Ng.', position: 'Nail Art Designer', isActive: false, showInTipsFlow: true, paymentAccounts: { venmo: '@hanna-art', cashapp: '', zelle: '', vlinkpay: 'VLP-1148-HN' } }
    ]

    const list = setupData?.staffList || defaultStaff
    const matched = list.find(s => 
      techSlug.includes(s.id) || 
      techSlug.toLowerCase().includes(s.nickname.toLowerCase().replace(/[^a-z0-9]+/g, '-')) ||
      techSlug.toLowerCase().includes(s.fullName.toLowerCase().split(' ')[0])
    )
    
    return (matched && matched.isActive !== false) ? matched : null
  }, [setupData, techSlug])

  // Get review destination links
  const reviewLinks = useMemo(() => {
    const defaultLinks = {
      googleReview: 'https://g.page/r/cGoldenGlowNails/review',
      yelpReview: 'https://www.yelp.com/biz/golden-glow-nails-palm-beach',
      feedbackEmail: 'manager@goldenglownails.com'
    }
    return setupData?.reviewLinks || defaultLinks
  }, [setupData])

  const [selectedStaffMember, setSelectedStaffMember] = useState(initialStaffMember)
  const [step, setStep] = useState(initialStaffMember ? 'form' : 'select_staff')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTip, setSelectedTip] = useState(15) // default $15
  const [customTip, setCustomTip] = useState('')
  const [rating, setRating] = useState(5) // default 5 stars
  const [comment, setComment] = useState('')
  const [selectedTags, setSelectedTags] = useState([])
  const [selectedWallet, setSelectedWallet] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  const filteredStaff = useMemo(() => {
    return activeStaffList.filter(s => 
      s.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.nickname.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.position.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [activeStaffList, searchQuery])

  const positiveTagKeys = ['friendly', 'professional', 'meticulous', 'clean', 'art', 'fast', 'gentle']
  const negativeTagKeys = ['slow', 'rushed', 'careless', 'unfriendly', 'hygiene', 'wrong_design', 'rough']

  // Sync selected tags state when customer manually edits comment
  useEffect(() => {
    if (!comment) {
      setSelectedTags([])
      return
    }
    const isPositive = rating >= 4
    const activeKeys = isPositive ? positiveTagKeys : negativeTagKeys
    
    const nextSelected = activeKeys.filter(key => {
      const tagText = isPositive 
        ? t(`customer.tags_positive.${key}`) 
        : t(`customer.tags_negative.${key}`)
      return comment.toLowerCase().includes(tagText.toLowerCase())
    })
    
    if (JSON.stringify(nextSelected) !== JSON.stringify(selectedTags)) {
      setSelectedTags(nextSelected)
    }
  }, [comment, rating, t])

  const handleTagToggle = (key) => {
    const isPositive = rating >= 4
    const tagText = isPositive 
      ? t(`customer.tags_positive.${key}`) 
      : t(`customer.tags_negative.${key}`)

    setSelectedTags((prev) => {
      const isSelected = prev.includes(key)
      let nextTags = []
      let newComment = comment.trim()

      if (isSelected) {
        nextTags = prev.filter(k => k !== key)
        const escapedText = tagText.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')
        const regexes = [
          new RegExp(`,\\s*${escapedText}`, 'gi'),
          new RegExp(`${escapedText},\\s*`, 'gi'),
          new RegExp(`^${escapedText}$`, 'gi'),
          new RegExp(escapedText, 'gi')
        ]
        
        for (const regex of regexes) {
          if (regex.test(newComment)) {
            newComment = newComment.replace(regex, '').trim()
            break
          }
        }
        
        newComment = newComment
          .replace(/,\s*,/g, ', ')
          .replace(/^,\s*|,\s*$/g, '')
          .trim()
      } else {
        nextTags = [...prev, key]
        if (newComment === '') {
          newComment = tagText
        } else {
          if (/[.,!]$/.test(newComment)) {
            newComment = `${newComment} ${tagText}`
          } else {
            newComment = `${newComment}, ${tagText}`
          }
        }
      }

      setComment(newComment)
      return nextTags
    })
  }

  const handleRatingChange = (newRating) => {
    const wasPositive = rating >= 4
    const isPositive = newRating >= 4
    if (wasPositive !== isPositive) {
      setComment('')
      setSelectedTags([])
    }
    setRating(newRating)
  }

  const activeTipAmount = selectedTip === 'custom' ? Number(customTip) || 0 : selectedTip

  // Handlers
  const handleNextToPayment = (e) => {
    e.preventDefault()
    setStep('payment')
  }

  const handlePay = (walletName) => {
    setSelectedWallet(walletName)
    setStep('processing')
    setIsProcessing(true)

    // Simulate payment transaction routing
    setTimeout(() => {
      setIsProcessing(false)
      setStep('success_payment')
    }, 1800)
  }

  const handleSubmitFeedback = () => {
    setStep('success_feedback')
  }

  const handleReset = () => {
    setStep('form')
    setSelectedTip(15)
    setCustomTip('')
    setRating(5)
    setComment('')
    setSelectedTags([])
    setSelectedWallet('')
  }

  return (
    <div className="min-h-screen bg-nexoraCanvas text-nexoraText font-sans flex flex-col justify-between selection:bg-nexoraBrandSoft selection:text-nexoraBrand pb-8 relative">
      {/* Glow effects */}
      <div className="absolute top-0 left-0 w-full h-[30%] bg-gradient-to-b from-blue-50/50 to-transparent pointer-events-none" />

      {/* Language Switcher */}
      <div className="absolute top-4 right-4 z-50 flex items-center gap-2 bg-white/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-nexoraBorder shadow-sm">
        <button 
          onClick={() => setLanguage('vi')}
          className={`text-xs font-bold px-2 py-0.5 rounded transition ${currentLanguage === 'vi' ? 'bg-nexoraBrand text-white' : 'text-nexoraSubtle hover:text-nexoraText'}`}
        >
          VI
        </button>
        <span className="text-nexoraBorder text-xs">|</span>
        <button 
          onClick={() => setLanguage('en')}
          className={`text-xs font-bold px-2 py-0.5 rounded transition ${currentLanguage === 'en' ? 'bg-nexoraBrand text-white' : 'text-nexoraSubtle hover:text-nexoraText'}`}
        >
          EN
        </button>
      </div>

      {/* Header */}
      <header className="border-b border-nexoraBorder py-5 text-center relative z-10 bg-white/40 backdrop-blur-sm">
        <h1 className="font-serif text-lg font-bold tracking-wide uppercase text-nexoraText">{bizName}</h1>
        <p className="text-[10px] text-nexoraSubtle font-black tracking-widest uppercase mt-0.5">{t('customer.header_subtitle')}</p>
      </header>

      {/* Body content */}
      <main className="flex-grow flex items-center justify-center p-4 relative z-10">
        <div className="w-full max-w-md bg-white border border-nexoraBorder rounded-2xl p-6 shadow-premium space-y-6">
          
          {/* STEP 0: STAFF SELECTION SCREEN */}
          {step === 'select_staff' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="text-center space-y-1">
                <h2 className="font-serif text-xl font-bold tracking-wide text-nexoraText uppercase">
                  {t('customer.select_staff_title') || 'Select Staff Member'}
                </h2>
                <p className="text-xs text-nexoraSubtle font-medium">
                  {t('customer.select_staff_subtitle') || 'Who served you today?'}
                </p>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-3.5 w-4 h-4 text-nexoraSubtle" />
                <input
                  type="text"
                  placeholder={t('customer.search_staff_placeholder') || 'Search by name or position...'}
                  className="w-full bg-nexoraCanvas border border-nexoraBorder focus:border-nexoraBrand focus:bg-white rounded-lg pl-10 pr-4 py-2.5 text-sm text-nexoraText focus:outline-none placeholder-nexoraSubtle transition-all"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Staff cards */}
              <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
                {filteredStaff.length > 0 ? (
                  filteredStaff.map((member) => (
                    <button
                      key={member.id}
                      type="button"
                      onClick={() => {
                        setSelectedStaffMember(member)
                        setStep('form')
                      }}
                      className="w-full flex items-center justify-between p-4 bg-white border border-nexoraBorder hover:border-nexoraBrand/40 hover:bg-nexoraCanvas rounded-xl text-left transition-all duration-200 shadow-sm hover:shadow group"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        {member.avatar ? (
                          <img
                            src={member.avatar}
                            alt=""
                            className="h-12 w-12 rounded-full object-cover border border-nexoraBorder shrink-0"
                          />
                        ) : (
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-tr from-[#2B59FF] to-[#8E4DF8] text-sm font-extrabold text-white shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                            {member.nickname.charAt(0)}
                          </div>
                        )}
                        <div className="min-w-0">
                          <h4 className="font-extrabold text-nexoraText text-sm group-hover:text-nexoraBrand transition-colors truncate">
                            {member.fullName}
                          </h4>
                          <p className="text-xs text-nexoraSubtle font-semibold truncate mt-0.5">
                            {member.position}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-black text-nexoraBrand uppercase tracking-wider group-hover:translate-x-1 transition-transform">
                        {t('customer.choose_chevron') || 'Select ›'}
                      </span>
                    </button>
                  ))
                ) : (
                  <div className="py-12 flex flex-col items-center justify-center text-center text-nexoraSubtle">
                    <Users className="w-10 h-10 text-nexoraBorder mb-3" />
                    <p className="text-xs font-semibold">{t('customer.no_staff_found') || 'No staff members found.'}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 1: RATING & TIP FORM */}
          {step === 'form' && (
            <form onSubmit={handleNextToPayment} className="space-y-6 animate-fadeIn">
              {/* Tech details */}
              <div className="flex items-center gap-4 bg-nexoraCanvas p-4 rounded-xl border border-nexoraBorder/50">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-tr from-[#2B59FF] to-[#8E4DF8] text-lg font-black text-white shrink-0 shadow-md">
                  {selectedStaffMember.nickname.charAt(0)}
                </div>
                <div className="flex-grow min-w-0">
                  <h3 className="font-extrabold text-nexoraText text-base leading-tight">{t('customer.step_form_title')}</h3>
                  <p className="text-xs text-nexoraMuted font-semibold truncate mt-0.5">{selectedStaffMember.fullName} • {selectedStaffMember.position}</p>
                </div>
                {!initialStaffMember && (
                  <button
                    type="button"
                    onClick={() => {
                      setStep('select_staff')
                    }}
                    className="text-[10.5px] font-black uppercase text-nexoraBrand tracking-wider bg-nexoraBrandSoft hover:opacity-90 px-2.5 py-1.5 rounded-lg transition"
                  >
                    {t('common.edit') || 'Đổi'}
                  </button>
                )}
              </div>

              {/* Tip options */}
              <div className="space-y-3">
                <label className="block text-[10px] font-bold text-nexoraMuted uppercase tracking-widest">{t('customer.select_tip_label')}</label>
                <div className="grid grid-cols-3 gap-2">
                  {[5, 10, 15, 20, 30].map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setSelectedTip(val)}
                      className={`py-3 rounded-lg text-sm font-black transition ${
                        selectedTip === val
                          ? 'bg-nexoraBrand text-white shadow-lg shadow-nexoraBrand/30'
                          : 'bg-nexoraCanvas hover:bg-nexoraSurfaceMuted text-nexoraText border border-nexoraBorder/50'
                      }`}
                    >
                      ${val}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setSelectedTip('custom')}
                    className={`py-3 rounded-lg text-sm font-black transition ${
                      selectedTip === 'custom'
                        ? 'bg-nexoraBrand text-white shadow-lg shadow-nexoraBrand/30'
                        : 'bg-nexoraCanvas hover:bg-nexoraSurfaceMuted text-nexoraText border border-nexoraBorder/50'
                    }`}
                  >
                    {t('customer.custom_tip_btn')}
                  </button>
                </div>

                {selectedTip === 'custom' && (
                  <div className="relative animate-fadeIn">
                    <span className="absolute left-3.5 top-2.5 text-sm font-bold text-nexoraSubtle">$</span>
                    <input
                      type="number"
                      placeholder={t('customer.custom_tip_placeholder')}
                      required
                      min="1"
                      className="w-full bg-nexoraCanvas border border-nexoraBorder rounded-lg pl-8 pr-4 py-2.5 text-sm text-nexoraText focus:outline-none focus:border-nexoraBrand focus:bg-white transition-all"
                      value={customTip}
                      onChange={(e) => setCustomTip(e.target.value)}
                    />
                  </div>
                )}
              </div>

              {/* Star Rating */}
              <div className="space-y-3">
                <label className="block text-[10px] font-bold text-nexoraMuted uppercase tracking-widest text-center">{t('customer.rate_service_label')}</label>
                <div className="flex justify-center gap-2">
                  {[1, 2, 3, 4, 5].map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => handleRatingChange(val)}
                      className="p-1 hover:scale-110 transition"
                    >
                      <Star 
                        className={`h-9 w-9 ${
                          val <= rating
                            ? 'fill-amber-500 text-amber-500 filter drop-shadow-[0_0_8px_rgba(245,158,11,0.4)]'
                            : 'text-nexoraBorder hover:text-amber-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Comment Chips */}
              <div className="space-y-2.5 animate-fadeIn">
                <label className="block text-[10px] font-bold text-nexoraMuted uppercase tracking-widest">
                  {rating >= 4 ? t('customer.quick_tags_positive_label') : t('customer.quick_tags_negative_label')}
                </label>
                <div className="flex flex-wrap gap-2">
                  {(rating >= 4 ? positiveTagKeys : negativeTagKeys).map((key) => {
                    const tagText = rating >= 4 
                      ? t(`customer.tags_positive.${key}`) 
                      : t(`customer.tags_negative.${key}`)
                    const isSelected = selectedTags.includes(key)
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => handleTagToggle(key)}
                        className={`text-xs px-3 py-1.5 rounded-full border transition-all duration-200 active:scale-95 font-medium ${
                          isSelected
                            ? 'bg-nexoraBrandSoft text-nexoraBrand border-nexoraBrand/30 shadow-sm shadow-nexoraBrandSoft/20'
                            : 'bg-nexoraCanvas hover:bg-nexoraSurfaceMuted text-nexoraMuted border border-nexoraBorder/50'
                        }`}
                      >
                        {tagText}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Review Text */}
              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-nexoraMuted uppercase tracking-widest">{t('customer.feedback_label')}</label>
                <textarea
                  rows="3"
                  placeholder={t('customer.feedback_placeholder')}
                  className="w-full bg-nexoraCanvas border border-nexoraBorder rounded-lg p-3 text-xs text-nexoraText placeholder-nexoraSubtle focus:outline-none focus:border-nexoraBrand focus:bg-white transition-all"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
              </div>

              {/* Button */}
              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-[#2B59FF] to-[#8E4DF8] hover:opacity-90 transition text-white font-extrabold text-xs uppercase tracking-wider rounded-lg flex items-center justify-center gap-1.5 shadow-lg shadow-[#2B59FF]/25"
              >
                {t('customer.pay_btn')} <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          )}

          {/* STEP 2: PAYMENT METHOD */}
          {step === 'payment' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="text-center space-y-1">
                <h3 className="font-extrabold text-lg text-nexoraText">{t('customer.payment_title')}</h3>
                <p className="text-xs text-nexoraMuted">{t('customer.payment_desc', { amount: `$${activeTipAmount}` })}</p>
              </div>

              <div className="space-y-3">
                {[
                  { name: 'Venmo', key: 'venmo', color: 'bg-[#008CFF] hover:bg-[#007ad6] text-white', logo: WalletLogos.venmo },
                  { name: 'Cash App', key: 'cashapp', color: 'bg-[#00D632] hover:bg-[#00b52a] text-white', logo: WalletLogos.cashapp },
                  { name: 'Zelle', key: 'zelle', color: 'bg-[#7414CA] hover:bg-[#5f10a6] text-white', logo: WalletLogos.zelle },
                  { name: 'VLINKPAY Gateway', key: 'vlinkpay', color: 'bg-white text-black hover:opacity-90 border border-nexoraBorder', logo: WalletLogos.vlinkpay }
                ].map(wallet => {
                   const accountVal = selectedStaffMember.paymentAccounts[wallet.key]
                  // Zelle fallback if empty
                  const isAvailable = wallet.key === 'vlinkpay' || wallet.key === 'zelle' || accountVal

                  return (
                    <button
                      key={wallet.key}
                      onClick={() => handlePay(wallet.name)}
                      className={`w-full flex items-center justify-between p-4 rounded-xl font-bold text-sm transition ${
                        isAvailable
                          ? 'bg-white border border-nexoraBorder hover:bg-nexoraCanvas text-nexoraText shadow-sm'
                          : 'opacity-40 cursor-not-allowed bg-nexoraCanvas border border-nexoraBorder/40 text-nexoraSubtle'
                      }`}
                      disabled={!isAvailable}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${wallet.color}`}>
                          {wallet.logo}
                        </span>
                        <span>{t('customer.pay_via', { name: wallet.name })}</span>
                      </div>
                      {isAvailable ? (
                        <span className="text-xs text-nexoraSubtle font-medium">{t('customer.choose_chevron')}</span>
                      ) : (
                        <span className="text-[10px] text-nexoraSubtle/70 italic">{t('customer.not_supported')}</span>
                      )}
                    </button>
                  )
                })}
              </div>

              <button
                onClick={() => setStep('form')}
                className="w-full py-2.5 bg-nexoraCanvas border border-nexoraBorder hover:bg-nexoraSurfaceMuted transition text-nexoraMuted font-extrabold text-xs uppercase tracking-wider rounded-lg"
              >
                {t('common.back')}
              </button>
            </div>
          )}

          {/* LOADING TRANSACTIONS */}
          {step === 'processing' && (
            <div className="py-12 flex flex-col items-center justify-center space-y-4 animate-fadeIn">
              <div className="w-10 h-10 border-4 border-nexoraBrand/20 border-t-nexoraBrand rounded-full animate-spin"></div>
              <p className="text-xs text-nexoraBrand font-bold uppercase tracking-wider animate-pulse">
                {t('customer.processing_payment', { name: selectedWallet })}
              </p>
            </div>
          )}

          {/* STEP 3: SUCCESS PAYMENT & REVIEW ROUTING */}
          {step === 'success_payment' && (
            <div className="text-center space-y-6 animate-fadeIn">
              <div className="flex justify-center">
                <CheckCircle className="h-16 w-16 text-emerald-500 filter drop-shadow-[0_0_12px_rgba(16,185,129,0.3)]" />
              </div>

              <div className="space-y-2">
                <h3 className="font-extrabold text-xl text-nexoraText">{t('customer.payment_success_title')}</h3>
                <p className="text-sm text-nexoraMuted leading-relaxed">
                  {t('customer.payment_success_desc', { amount: `$${activeTipAmount}`, name: selectedStaffMember.fullName })}
                </p>
              </div>

              <div className="border-t border-nexoraBorder pt-5 space-y-4">
                <div className="space-y-1">
                  <h4 className="text-xs font-black uppercase text-nexoraText tracking-wider">{t('customer.share_review_title')}</h4>
                  <p className="text-[11px] text-nexoraSubtle">{t('customer.share_review_desc')}</p>
                </div>

                {rating >= 4 ? (
                  <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl space-y-3">
                    <p className="text-xs text-emerald-800 font-semibold leading-relaxed">
                      {t('customer.rating_good_text', { rating: rating })}
                    </p>
                    <div className="flex gap-2">
                      <a
                        href={reviewLinks.googleReview}
                        target="_blank"
                        rel="noreferrer"
                        onClick={handleSubmitFeedback}
                        className="flex-1 py-2.5 bg-white hover:bg-nexoraCanvas text-nexoraText text-xs font-bold rounded-lg border border-nexoraBorder shadow-sm flex items-center justify-center gap-1.5"
                      >
                        {t('customer.google_review_btn')}
                      </a>
                      <a
                        href={reviewLinks.yelpReview}
                        target="_blank"
                        rel="noreferrer"
                        onClick={handleSubmitFeedback}
                        className="flex-1 py-2.5 bg-white hover:bg-nexoraCanvas text-nexoraText text-xs font-bold rounded-lg border border-nexoraBorder shadow-sm flex items-center justify-center gap-1.5"
                      >
                        {t('customer.yelp_review_btn')}
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl space-y-3">
                    <p className="text-xs text-amber-800 font-semibold leading-relaxed">
                      {t('customer.rating_bad_text')}
                    </p>
                    <button
                      onClick={handleSubmitFeedback}
                      className="w-full py-2.5 bg-gradient-to-r from-[#2B59FF] to-[#8E4DF8] hover:opacity-90 text-xs font-bold text-white rounded-lg"
                    >
                      {t('customer.submit_internal_btn')}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 4: FINAL SUCCESS FEEDBACK */}
          {step === 'success_feedback' && (
            <div className="text-center space-y-6 animate-fadeIn">
              <div className="flex justify-center">
                <div className="h-16 w-16 bg-nexoraBrand/10 text-nexoraBrand rounded-full flex items-center justify-center animate-bounce">
                  <Heart className="h-8 w-8 fill-current" />
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-extrabold text-xl text-nexoraText">{t('customer.final_success_title')}</h3>
                <p className="text-sm text-nexoraMuted leading-relaxed">
                  {t('customer.final_success_desc')}
                </p>
              </div>

              <button
                onClick={handleReset}
                className="w-full py-3 bg-nexoraCanvas border border-nexoraBorder hover:bg-nexoraSurfaceMuted transition text-nexoraText font-extrabold text-xs uppercase tracking-wider rounded-lg"
              >
                {t('customer.send_new_btn')}
              </button>
            </div>
          )}

        </div>
      </main>

      {/* Footer */}
      <footer className="text-center space-y-2 relative z-10">
        <div className="flex items-center justify-center gap-1.5 text-xs text-nexoraSubtle">
          <ShieldCheck className="h-4 w-4 text-nexoraBrand" /> {t('customer.secure_footer')}
        </div>
        <p className="text-[10px] text-nexoraSubtle/70">{t('customer.copyright')}</p>
      </footer>
    </div>
  )
}
