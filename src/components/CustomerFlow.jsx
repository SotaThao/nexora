import React, { useState, useMemo, useEffect } from 'react'
import { Star, CheckCircle, Wallet, ArrowRight, ShieldCheck, Heart } from 'lucide-react'
import { useTranslation } from '../contexts/LanguageContext'

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

  // Find the staff member
  const staffMember = useMemo(() => {
    // Default fallback staff list matching standard demo names
    const defaultStaff = [
      { id: '1', fullName: 'Mia Tran', nickname: 'Mia T.', position: 'Gel-X Lead', paymentAccounts: { venmo: '@mia-nails', cashapp: '$miaglow', zelle: 'mia.tran@gmail.com', vlinkpay: '' } },
      { id: '2', fullName: 'Vivian Le', nickname: 'Vivian L.', position: 'Acrylic Specialist', paymentAccounts: { venmo: '', cashapp: '$vivianle', zelle: '407-555-0199', vlinkpay: 'VLP-8893-VL' } },
      { id: '3', fullName: 'Ashley Park', nickname: 'Ashley P.', position: 'Pedicure Lead', paymentAccounts: { venmo: '@ashley-pedi', cashapp: '', zelle: 'ashley@glownails.com', vlinkpay: '' } },
      { id: '4', fullName: 'Hanna Nguyen', nickname: 'Hanna Ng.', position: 'Nail Art Designer', paymentAccounts: { venmo: '@hanna-art', cashapp: '', zelle: '', vlinkpay: 'VLP-1148-HN' } }
    ]

    const list = setupData?.staffList || defaultStaff
    // Find by nickname or slug
    return list.find(s => 
      techSlug.includes(s.id) || 
      techSlug.toLowerCase().includes(s.nickname.toLowerCase().replace(/[^a-z0-9]+/g, '-')) ||
      techSlug.toLowerCase().includes(s.fullName.toLowerCase().split(' ')[0])
    ) || list[0]
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

  // State machine
  // 'form' | 'processing' | 'success_payment' | 'success_feedback'
  const [step, setStep] = useState('form')
  const [selectedTip, setSelectedTip] = useState(15) // default $15
  const [customTip, setCustomTip] = useState('')
  const [rating, setRating] = useState(5) // default 5 stars
  const [comment, setComment] = useState('')
  const [selectedTags, setSelectedTags] = useState([])
  const [selectedWallet, setSelectedWallet] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

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
    <div className="min-h-screen bg-neutral-950 text-white font-sans flex flex-col justify-between selection:bg-rose-500 selection:text-white pb-8 relative">
      {/* Glow effects */}
      <div className="absolute top-0 left-0 w-full h-[30%] bg-gradient-to-b from-rose-950/20 to-transparent pointer-events-none" />

      {/* Language Switcher */}
      <div className="absolute top-4 right-4 z-50 flex items-center gap-2 bg-neutral-900/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
        <button 
          onClick={() => setLanguage('vi')}
          className={`text-xs font-bold px-2 py-0.5 rounded transition ${currentLanguage === 'vi' ? 'bg-rose-600 text-white' : 'text-neutral-400 hover:text-white'}`}
        >
          VI
        </button>
        <span className="text-neutral-700 text-xs">|</span>
        <button 
          onClick={() => setLanguage('en')}
          className={`text-xs font-bold px-2 py-0.5 rounded transition ${currentLanguage === 'en' ? 'bg-rose-600 text-white' : 'text-neutral-400 hover:text-white'}`}
        >
          EN
        </button>
      </div>

      {/* Header */}
      <header className="border-b border-white/10 py-5 text-center relative z-10 bg-neutral-900/40 backdrop-blur-sm">
        <h1 className="font-serif text-lg font-bold tracking-wide uppercase text-rose-100">{bizName}</h1>
        <p className="text-[10px] text-neutral-500 font-black tracking-widest uppercase mt-0.5">{t('customer.header_subtitle')}</p>
      </header>

      {/* Body content */}
      <main className="flex-grow flex items-center justify-center p-4 relative z-10">
        <div className="w-full max-w-md bg-neutral-900 border border-white/10 rounded-2xl p-6 shadow-2xl space-y-6">
          
          {/* STEP 1: RATING & TIP FORM */}
          {step === 'form' && (
            <form onSubmit={handleNextToPayment} className="space-y-6 animate-fadeIn">
              {/* Tech details */}
              <div className="flex items-center gap-4 bg-white/5 p-4 rounded-xl border border-white/5">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-tr from-rose-600 to-indigo-600 text-lg font-black text-white shadow-md">
                  {staffMember.nickname.charAt(0)}
                </div>
                <div>
                  <h3 className="font-extrabold text-white text-base">{t('customer.step_form_title')}</h3>
                  <p className="text-xs text-neutral-400 font-semibold">{staffMember.fullName} • {staffMember.position}</p>
                </div>
              </div>

              {/* Tip options */}
              <div className="space-y-3">
                <label className="block text-[10px] font-bold text-rose-300 uppercase tracking-widest">{t('customer.select_tip_label')}</label>
                <div className="grid grid-cols-3 gap-2">
                  {[5, 10, 15, 20, 30].map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setSelectedTip(val)}
                      className={`py-3 rounded-lg text-sm font-black transition ${
                        selectedTip === val
                          ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30'
                          : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300'
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
                        ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30'
                        : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300'
                    }`}
                  >
                    {t('customer.custom_tip_btn')}
                  </button>
                </div>

                {selectedTip === 'custom' && (
                  <div className="relative animate-fadeIn">
                    <span className="absolute left-3.5 top-2.5 text-sm font-bold text-neutral-400">$</span>
                    <input
                      type="number"
                      placeholder={t('customer.custom_tip_placeholder')}
                      required
                      min="1"
                      className="w-full bg-neutral-800 border border-white/10 rounded-lg pl-8 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-rose-600"
                      value={customTip}
                      onChange={(e) => setCustomTip(e.target.value)}
                    />
                  </div>
                )}
              </div>

              {/* Star Rating */}
              <div className="space-y-3">
                <label className="block text-[10px] font-bold text-rose-300 uppercase tracking-widest text-center">{t('customer.rate_service_label')}</label>
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
                            : 'text-neutral-700'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Comment Chips */}
              <div className="space-y-2.5 animate-fadeIn">
                <label className="block text-[10px] font-bold text-rose-300 uppercase tracking-widest">
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
                            ? 'bg-rose-600/20 text-rose-200 border-rose-500/50 shadow-sm shadow-rose-500/10'
                            : 'bg-neutral-800/60 hover:bg-neutral-700/80 text-neutral-300 border-white/5'
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
                <label className="block text-[10px] font-bold text-rose-300 uppercase tracking-widest">{t('customer.feedback_label')}</label>
                <textarea
                  rows="3"
                  placeholder={t('customer.feedback_placeholder')}
                  className="w-full bg-neutral-800 border border-white/10 rounded-lg p-3 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-rose-600 resize-none"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
              </div>

              {/* Button */}
              <button
                type="submit"
                className="w-full py-3 bg-rose-600 hover:bg-rose-500 transition text-white font-extrabold text-xs uppercase tracking-wider rounded-lg flex items-center justify-center gap-1.5 shadow-lg shadow-rose-600/20"
              >
                {t('customer.pay_btn')} <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          )}

          {/* STEP 2: PAYMENT METHOD */}
          {step === 'payment' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="text-center space-y-1">
                <h3 className="font-extrabold text-lg">{t('customer.payment_title')}</h3>
                <p className="text-xs text-neutral-400">{t('customer.payment_desc', { amount: `$${activeTipAmount}` })}</p>
              </div>

              <div className="space-y-3">
                {[
                  { name: 'Venmo', key: 'venmo', color: 'bg-blue-600 hover:bg-blue-500 text-white', label: 'V' },
                  { name: 'Cash App', key: 'cashapp', color: 'bg-emerald-600 hover:bg-emerald-500 text-white', label: '$' },
                  { name: 'Zelle', key: 'zelle', color: 'bg-purple-700 hover:bg-purple-600 text-white', label: 'Z' },
                  { name: 'VLINKPAY Gateway', key: 'vlinkpay', color: 'bg-rose-600 hover:bg-rose-500 text-white', label: 'N' }
                ].map(wallet => {
                  const accountVal = staffMember.paymentAccounts[wallet.key]
                  // Zelle fallback if empty
                  const isAvailable = wallet.key === 'vlinkpay' || wallet.key === 'zelle' || accountVal

                  return (
                    <button
                      key={wallet.key}
                      onClick={() => handlePay(wallet.name)}
                      className={`w-full flex items-center justify-between p-4 rounded-xl font-bold text-sm transition ${
                        isAvailable
                          ? 'bg-neutral-800 border border-white/10 hover:border-white/20'
                          : 'opacity-40 cursor-not-allowed bg-neutral-900 border border-white/5'
                      }`}
                      disabled={!isAvailable}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`h-8 w-8 rounded-lg flex items-center justify-center font-black ${wallet.color}`}>
                          {wallet.label}
                        </span>
                        <span>{t('customer.pay_via', { name: wallet.name })}</span>
                      </div>
                      {isAvailable ? (
                        <span className="text-xs text-neutral-400 font-medium">{t('customer.choose_chevron')}</span>
                      ) : (
                        <span className="text-[10px] text-neutral-600 italic">{t('customer.not_supported')}</span>
                      )}
                    </button>
                  )
                })}
              </div>

              <button
                onClick={() => setStep('form')}
                className="w-full py-2.5 bg-neutral-800 hover:bg-neutral-700 transition text-neutral-400 font-extrabold text-xs uppercase tracking-wider rounded-lg"
              >
                {t('common.back')}
              </button>
            </div>
          )}

          {/* LOADING TRANSACTIONS */}
          {step === 'processing' && (
            <div className="py-12 flex flex-col items-center justify-center space-y-4 animate-fadeIn">
              <div className="w-10 h-10 border-4 border-rose-500/20 border-t-rose-500 rounded-full animate-spin"></div>
              <p className="text-xs text-rose-400 font-bold uppercase tracking-wider animate-pulse">
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
                <h3 className="font-extrabold text-xl">{t('customer.payment_success_title')}</h3>
                <p className="text-sm text-neutral-400 leading-relaxed">
                  {t('customer.payment_success_desc', { amount: `$${activeTipAmount}`, name: staffMember.fullName })}
                </p>
              </div>

              <div className="border-t border-white/5 pt-5 space-y-4">
                <div className="space-y-1">
                  <h4 className="text-xs font-black uppercase text-neutral-400 tracking-wider">{t('customer.share_review_title')}</h4>
                  <p className="text-[11px] text-neutral-500">{t('customer.share_review_desc')}</p>
                </div>

                {rating >= 4 ? (
                  <div className="bg-emerald-500/5 border border-emerald-500/10 p-4 rounded-xl space-y-3">
                    <p className="text-xs text-emerald-400 font-semibold leading-relaxed">
                      {t('customer.rating_good_text', { rating: rating })}
                    </p>
                    <div className="flex gap-2">
                      <a
                        href={reviewLinks.googleReview}
                        target="_blank"
                        rel="noreferrer"
                        onClick={handleSubmitFeedback}
                        className="flex-1 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-xs font-bold rounded-lg border border-white/10 flex items-center justify-center gap-1.5"
                      >
                        {t('customer.google_review_btn')}
                      </a>
                      <a
                        href={reviewLinks.yelpReview}
                        target="_blank"
                        rel="noreferrer"
                        onClick={handleSubmitFeedback}
                        className="flex-1 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-xs font-bold rounded-lg border border-white/10 flex items-center justify-center gap-1.5"
                      >
                        {t('customer.yelp_review_btn')}
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="bg-amber-500/5 border border-amber-500/10 p-4 rounded-xl space-y-3">
                    <p className="text-xs text-amber-400 font-semibold leading-relaxed">
                      {t('customer.rating_bad_text')}
                    </p>
                    <button
                      onClick={handleSubmitFeedback}
                      className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 text-xs font-bold rounded-lg"
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
                <div className="h-16 w-16 bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center animate-bounce">
                  <Heart className="h-8 w-8 fill-current" />
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-extrabold text-xl">{t('customer.final_success_title')}</h3>
                <p className="text-sm text-neutral-400 leading-relaxed">
                  {t('customer.final_success_desc')}
                </p>
              </div>

              <button
                onClick={handleReset}
                className="w-full py-3 bg-neutral-800 hover:bg-neutral-700 transition text-white font-extrabold text-xs uppercase tracking-wider rounded-lg"
              >
                {t('customer.send_new_btn')}
              </button>
            </div>
          )}

        </div>
      </main>

      {/* Footer */}
      <footer className="text-center space-y-2 relative z-10">
        <div className="flex items-center justify-center gap-1.5 text-xs text-neutral-500">
          <ShieldCheck className="h-4 w-4 text-rose-500" /> {t('customer.secure_footer')}
        </div>
        <p className="text-[10px] text-neutral-600">{t('customer.copyright')}</p>
      </footer>
    </div>
  )
}
