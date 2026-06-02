import React, { useState, useMemo, useEffect } from 'react'
import { Star, CheckCircle, Wallet, ArrowRight, ShieldCheck, Heart, Search, Users, Check, AlertTriangle } from 'lucide-react'
import { useTranslation } from '../contexts/LanguageContext'
import { storage } from '../utils/storage'
import { useNotification } from '../contexts/NotificationContext'

const localStorage = storage
const sessionStorage = storage

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
  paypal: (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] fill-white" xmlns="http://www.w3.org/2000/svg">
      <path d="M20.09 6.85c-.45 2.24-1.93 7.82-2.18 8.87-.24 1.05-1.12 1.77-2.22 1.77h-3.32l-.96 6.02c-.08.5-.52.87-1.03.87H6.22c-.65 0-1.13-.59-.99-1.22L8.53 5.4c.14-.63.7-.1 1.33-.1h5.8c2.81 0 4.88 1.48 4.43 3.7.22-1.07.13-2.15-.36-3.05z" />
      <path d="M16.92 3.85c-.45 2.24-1.93 7.82-2.18 8.87-.24 1.05-1.12 1.77-2.22 1.77h-3.32l-.96 6.02c-.08.5-.52.87-1.03.87H3.06c-.65 0-1.13-.59-.99-1.22L5.37 2.4c.14-.63.7-1.1 1.33-1.1h5.8c2.81 0 4.88 1.48 4.43 3.7.22-1.07.13-2.15-.36-3.05z" opacity="0.6" />
    </svg>
  ),
  bankwire: (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] fill-white" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2L1 7v2h22V7L12 2zm0 18H3v-8h3v8h3v-8h3v8h3v-8h3v8h3v-8h3v8h3v-8h3v8h3v-8h3v8h-3zm-11 2h22v2H1v-2z" />
    </svg>
  ),
  applepay: (
    <div className="flex items-center gap-[1px] justify-center scale-90 origin-center shrink-0">
      <svg viewBox="0 0 170 170" className="h-[12px] w-[12px] fill-current text-white shrink-0" xmlns="http://www.w3.org/2000/svg">
        <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.34.22-9.13-1.78-14.37-6.02-3.43-2.73-7.25-7.28-11.45-13.68-4.73-7.24-8.55-15.53-11.45-24.85-2.9-9.33-4.35-18.21-4.35-26.65 0-14.93 3.94-27.17 11.83-36.73 7.89-9.55 17.58-14.39 29.08-14.5 5.8-.11 11.9 1.67 18.3 5.35 6.4 3.68 11.13 5.52 14.18 5.52 2.34 0 6.81-1.67 13.43-5.02 6.62-3.34 12.52-4.85 17.68-4.52 13.25.67 23.95 5.57 32.09 14.72-11.48 6.91-17.11 16.28-16.89 28.1.22 9.58 3.84 17.6 10.87 24.08 7.02 6.47 15.21 9.94 24.57 10.42-2.12 6.13-4.68 12.26-7.69 18.38zM119.22 35.24c0-7.8-2.79-15.01-8.36-21.62C105.3 7 98 3.32 89.17 3.32c-.11.9-.11 1.78.11 2.68.22 5.58 2.51 11.23 6.85 16.94 4.35 5.71 9.76 9.47 16.23 11.3 1.34-5.36 6.86-9 6.86-9z"/>
      </svg>
      <span className="font-black text-[10px] tracking-tighter ml-[1px] leading-none select-none">Pay</span>
    </div>
  ),
  vlinkpay: (
    <img src="/assets/vlinkpay-logo.png" alt="VLINKPAY Logo" className="h-[22px] w-[22px] object-contain" />
  )
}

export default function CustomerFlow() {
  const { currentLanguage, setLanguage, t } = useTranslation()
  const { showToast } = useNotification()

  // Parse parameters from query string
  const params = useMemo(() => new URLSearchParams(window.location.search), [])
  const techSlug = params.get('tech') || '' // e.g. 'staff/mia-t'
  // Get business name dynamically checking sessionStorage first
  const bizName = useMemo(() => {
    try {
      const sessionProfile = sessionStorage.getItem('nexora_profile_settings')
      if (sessionProfile) {
        const parsed = JSON.parse(sessionProfile)
        if (parsed.businessName) return parsed.businessName
      }
      const sessionSetup = sessionStorage.getItem('nexora_merchant_setup')
      if (sessionSetup) {
        const parsed = JSON.parse(sessionSetup)
        if (parsed.businessInfo?.name) return parsed.businessInfo.name
      }
    } catch (e) {}

    return params.get('biz') || 'Golden Glow Nail Spa'
  }, [params])

  // Load merchant setup from sessionStorage or localStorage (shared origin)
  const setupData = useMemo(() => {
    const sessionSaved = sessionStorage.getItem('nexora_merchant_setup')
    if (sessionSaved) {
      try {
        return JSON.parse(sessionSaved)
      } catch (e) {}
    }
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

  // Resolve touchpoint information and check if active
  const scannedTouchpoint = useMemo(() => {
    if (!techSlug || techSlug.startsWith('staff/')) return null
    return setupData?.touchPoints?.find(tp => techSlug.includes(tp.id))
  }, [setupData, techSlug])

  // Get active and visible staff list
  const activeStaffList = useMemo(() => {
    const defaultStaff = [
      { id: 'NEX-STAFF-MIA0123', fullName: 'Mia Tran', nickname: 'Mia T.', position: 'Gel-X Lead', isActive: true, showInTipsFlow: true, paymentAccounts: { venmo: '@mia-nails', cashapp: '$miaglow', zelle: 'mia.tran@gmail.com', vlinkpay: 'VLP-0123-MIA' }, payoutConfigs: { zelle: { enabled: true, value: 'mia.tran@gmail.com', qrCode: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=MiaTranTip' } } },
      { id: 'NEX-STAFF-VL8893', fullName: 'Vivian Le', nickname: 'Vivian L.', position: 'Acrylic Specialist', isActive: true, showInTipsFlow: true, paymentAccounts: { venmo: '', cashapp: '$vivianle', zelle: '407-555-0199', vlinkpay: 'VLP-8893-VL' }, payoutConfigs: { zelle: { enabled: true, value: '407-555-0199', qrCode: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=VivianLeTip' } } },
      { id: 'NEX-STAFF-ASH0155', fullName: 'Ashley Park', nickname: 'Ashley P.', position: 'Pedicure Lead', isActive: true, showInTipsFlow: true, paymentAccounts: { venmo: '@ashley-pedi', cashapp: '', zelle: 'ashley@glownails.com', vlinkpay: 'VLP-0155-ASH' } },
      { id: 'NEX-STAFF-HN1148', fullName: 'Hanna Nguyen', nickname: 'Hanna Ng.', position: 'Nail Art Designer', isActive: false, showInTipsFlow: true, paymentAccounts: { venmo: '@hanna-art', cashapp: '', zelle: '', vlinkpay: 'VLP-1148-HN' } }
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
      { id: 'NEX-STAFF-MIA0123', fullName: 'Mia Tran', nickname: 'Mia T.', position: 'Gel-X Lead', isActive: true, showInTipsFlow: true, paymentAccounts: { venmo: '@mia-nails', cashapp: '$miaglow', zelle: 'mia.tran@gmail.com', vlinkpay: 'VLP-0123-MIA' }, payoutConfigs: { zelle: { enabled: true, value: 'mia.tran@gmail.com', qrCode: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=MiaTranTip' } } },
      { id: 'NEX-STAFF-VL8893', fullName: 'Vivian Le', nickname: 'Vivian L.', position: 'Acrylic Specialist', isActive: true, showInTipsFlow: true, paymentAccounts: { venmo: '', cashapp: '$vivianle', zelle: '407-555-0199', vlinkpay: 'VLP-8893-VL' }, payoutConfigs: { zelle: { enabled: true, value: '407-555-0199', qrCode: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=VivianLeTip' } } },
      { id: 'NEX-STAFF-ASH0155', fullName: 'Ashley Park', nickname: 'Ashley P.', position: 'Pedicure Lead', isActive: true, showInTipsFlow: true, paymentAccounts: { venmo: '@ashley-pedi', cashapp: '', zelle: 'ashley@glownails.com', vlinkpay: 'VLP-0155-ASH' } },
      { id: 'NEX-STAFF-HN1148', fullName: 'Hanna Nguyen', nickname: 'Hanna Ng.', position: 'Nail Art Designer', isActive: false, showInTipsFlow: true, paymentAccounts: { venmo: '@hanna-art', cashapp: '', zelle: '', vlinkpay: 'VLP-1148-HN' } }
    ]

    const list = setupData?.staffList || defaultStaff
    const matched = list.find(s => 
      techSlug.includes(s.id) || 
      techSlug.toLowerCase().includes(s.nickname.toLowerCase().replace(/[^a-z0-9]+/g, '-')) ||
      techSlug.toLowerCase().includes(s.fullName.toLowerCase().split(' ')[0])
    )
    
    return (matched && matched.isActive !== false && matched.showInTipsFlow !== false) ? matched : null
  }, [setupData, techSlug])

  // Get review destination links dynamically checking sessionStorage first
  const reviewLinks = useMemo(() => {
    const defaultLinks = {
      googleReview: 'https://g.page/r/cGoldenGlowNails/review',
      yelpReview: 'https://www.yelp.com/biz/golden-glow-nails-palm-beach',
      feedbackEmail: 'manager@goldenglownails.com'
    }

    try {
      const sessionProfile = sessionStorage.getItem('nexora_profile_settings')
      if (sessionProfile) {
        const parsed = JSON.parse(sessionProfile)
        if (parsed.googleReview || parsed.yelpReview) {
          return {
            googleReview: parsed.googleReview || '',
            yelpReview: parsed.yelpReview || '',
            feedbackEmail: parsed.businessEmail || parsed.email || defaultLinks.feedbackEmail
          }
        }
      }
    } catch (e) {}

    return setupData?.reviewLinks || defaultLinks
  }, [setupData])

  const [selectedStaffMembers, setSelectedStaffMembers] = useState(initialStaffMember ? [initialStaffMember] : [])
  const [step, setStep] = useState(initialStaffMember ? 'tip_amount' : 'select_staff')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTips, setSelectedTips] = useState(() => {
    return initialStaffMember ? { [initialStaffMember.id]: 15 } : {}
  })
  const [customTips, setCustomTips] = useState({})
  const [rating, setRating] = useState(5) // default 5 stars
  const [comment, setComment] = useState('')
  const [selectedTags, setSelectedTags] = useState([])
  const [selectedWallet, setSelectedWallet] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [selectedWalletObj, setSelectedWalletObj] = useState(null)
  const [tipRefNumber, setTipRefNumber] = useState('')

  const businessPaymentAccounts = useMemo(() => {
    const defaultAccounts = {
      venmo: '@goldenglow-spa',
      cashapp: '$goldenglownails',
      zelle: 'payment@goldenglownails.com',
      vlinkpay: 'VLP-8893-GG'
    }

    try {
      const sessionProfile = sessionStorage.getItem('nexora_profile_settings')
      if (sessionProfile) {
        const parsed = JSON.parse(sessionProfile)
        if (parsed.paymentAccounts) return parsed.paymentAccounts
      }
    } catch (e) {}

    return setupData?.businessInfo?.paymentAccounts || defaultAccounts
  }, [setupData])

  const selectedStaffHasAnyPayment = useMemo(() => {
    if (selectedStaffMembers.length !== 1) return false
    const staff = selectedStaffMembers[0]
    return Object.values(staff.paymentAccounts || {}).some(val => val && val.trim() !== '')
  }, [selectedStaffMembers])

  const qrCodeVal = useMemo(() => {
    if (!selectedWalletObj) return null;
    if (selectedStaffMembers.length === 1) {
      const staff = selectedStaffMembers[0];
      if (selectedStaffHasAnyPayment) {
        return staff.payoutConfigs?.[selectedWalletObj.key]?.qrCode || staff.payoutQrCodes?.[selectedWalletObj.key] || null;
      }
    }
    return setupData?.businessInfo?.payoutQrCodes?.[selectedWalletObj.key] || null;
  }, [selectedWalletObj, selectedStaffMembers, selectedStaffHasAnyPayment, setupData])


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

  const handleToggleStaff = (member) => {
    setSelectedStaffMembers((prev) => {
      const isAlreadySelected = prev.some((s) => s.id === member.id)
      if (isAlreadySelected) {
        const next = prev.filter((s) => s.id !== member.id)
        const nextTips = { ...selectedTips }
        delete nextTips[member.id]
        setSelectedTips(nextTips)
        return next
      } else {
        const next = [...prev, member]
        setSelectedTips({
          ...selectedTips,
          [member.id]: 15
        })
        return next
      }
    })
  }

  const activeTipAmount = useMemo(() => {
    return selectedStaffMembers.reduce((sum, member) => {
      const selTip = selectedTips[member.id] !== undefined ? selectedTips[member.id] : 15
      const val = selTip === 'custom' ? Number(customTips[member.id]) || 0 : selTip
      return sum + val
    }, 0)
  }, [selectedStaffMembers, selectedTips, customTips])

  const tipScreenTitle = useMemo(() => {
    if (selectedStaffMembers.length === 1) {
      return t('customer.step_form_title', { name: selectedStaffMembers[0].nickname })
    }
    return currentLanguage === 'vi' ? 'Thêm tiền Tip cho nhân viên' : 'Add tips for your providers'
  }, [selectedStaffMembers, currentLanguage, t])

  const handleNextToPayment = (e) => {
    e.preventDefault()
    for (const member of selectedStaffMembers) {
      const selTip = selectedTips[member.id] !== undefined ? selectedTips[member.id] : 15
      if (selTip === 'custom') {
        const val = Number(customTips[member.id])
        if (isNaN(val) || val <= 0) {
          showToast(t('customer.invalid_tip') || 'Please enter a valid tip amount greater than 0.', 'error')
          return
        }
      } else {
        if (selTip <= 0) {
          showToast(t('customer.invalid_tip') || 'Please enter a valid tip amount greater than 0.', 'error')
          return
        }
      }
    }
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

      // Save simulated transaction to localStorage
      const baseTxIdNum = Math.floor(2000 + Math.random() * 1000)
      const touchpointStr = techSlug 
        ? (techSlug.startsWith('staff/') ? 'Staff Personal QR' : (setupData?.touchPoints?.find(tp => techSlug.includes(tp.id))?.name || 'QR Touchpoint'))
        : 'Lobby Welcome QR'

      const newTransactions = selectedStaffMembers.map((member, index) => {
        const selTip = selectedTips[member.id] !== undefined ? selectedTips[member.id] : 15
        const amount = selTip === 'custom' ? Number(customTips[member.id]) || 0 : selTip
        const txId = selectedStaffMembers.length > 1
          ? `TX-${baseTxIdNum}-${index + 1}`
          : `TX-${baseTxIdNum}`
        
        return {
          id: txId,
          dateTime: new Date().toISOString().replace('T', ' ').substring(0, 16),
          amount: amount,
          staffName: member.nickname,
          staffId: member.id,
          touchpoint: touchpointStr,
          paymentMethod: walletName,
          status: 'Success'
        }
      })

      try {
        const existingTx = JSON.parse(localStorage.getItem('nexora_transactions') || '[]')
        localStorage.setItem('nexora_transactions', JSON.stringify([...newTransactions, ...existingTx]))

        // Create corresponding notifications for each tipped staff
        const newNotifications = selectedStaffMembers.map((member, index) => {
          const selTip = selectedTips[member.id] !== undefined ? selectedTips[member.id] : 15
          const amount = selTip === 'custom' ? Number(customTips[member.id]) || 0 : selTip
          return {
            id: `noti-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 5)}`,
            type: 'tip_success',
            title: `New Tip Received ($${Number(amount).toFixed(2)})`,
            message: `${member.nickname} received $${Number(amount).toFixed(2)} tip via ${walletName} at ${touchpointStr}.`,
            time: 'Just now',
            read: false,
            linkTab: 'reports'
          }
        })
        const existingNotis = JSON.parse(localStorage.getItem('nexora_notifications') || '[]')
        localStorage.setItem('nexora_notifications', JSON.stringify([...newNotifications, ...existingNotis]))
      } catch (e) {
        console.error('Error saving transaction/notification', e)
      }
    }, 1800)
  }

  const handleSubmitFeedback = () => {
    const cleanComment = comment.trim()
    const newReviews = selectedStaffMembers.map((member) => {
      return {
        id: `R-${Date.now()}-${member.id}`,
        rating: rating,
        comment: cleanComment || (rating >= 4 ? 'Good service' : 'Needs improvement'),
        staffName: member.nickname,
        staffId: member.id,
        category: rating >= 4 ? 'Good (Google)' : 'Internal Feedback',
        date: new Date().toISOString().substring(0, 10)
      }
    })

    try {
      const existingReviews = JSON.parse(localStorage.getItem('nexora_reviews') || '[]')
      localStorage.setItem('nexora_reviews', JSON.stringify([...newReviews, ...existingReviews]))

      // Add notifications for feedback
      const newNotifications = selectedStaffMembers.map((member, index) => {
        return {
          id: `noti-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 5)}`,
          type: rating >= 4 ? 'review_good' : 'feedback_alert',
          title: rating >= 4 ? `New Review (${rating}★)` : `New Internal Feedback (${rating}★)`,
          message: `Customer left feedback for ${member.nickname}: "${cleanComment.substring(0, 50)}${cleanComment.length > 50 ? '...' : ''}"`,
          time: 'Just now',
          read: false,
          linkTab: 'reviews'
        }
      })
      const existingNotis = JSON.parse(localStorage.getItem('nexora_notifications') || '[]')
      localStorage.setItem('nexora_notifications', JSON.stringify([...newNotifications, ...existingNotis]))
    } catch (e) {
      console.error('Error saving review/notification', e)
    }

    if (rating >= 4) {
      setStep('google_yelp_review')
    } else {
      setStep('final_done')
    }
  }

  const handleReset = () => {
    setSelectedStaffMembers(initialStaffMember ? [initialStaffMember] : [])
    setStep(initialStaffMember ? 'tip_amount' : 'select_staff')
    setSelectedTips(initialStaffMember ? { [initialStaffMember.id]: 15 } : {})
    setCustomTips({})
    setRating(5)
    setComment('')
    setSelectedTags([])
    setSelectedWallet('')
    setSelectedWalletObj(null)
    setTipRefNumber('')
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



      {/* Body content */}
      <main className="flex-grow flex items-center justify-center p-4 relative z-10">
        <div className="w-full max-w-md bg-white border border-nexoraBorder rounded-2xl p-6 shadow-premium space-y-6">
          
          {scannedTouchpoint && scannedTouchpoint.isActive === false ? (
            <div className="text-center space-y-6 py-6 animate-fadeIn flex flex-col items-center">
              <div className="h-16 w-16 bg-amber-100 rounded-full flex items-center justify-center shadow-inner mb-2 animate-bounce">
                <AlertTriangle className="h-8 w-8 text-amber-600 animate-pulse" />
              </div>
              <div className="space-y-2">
                <h3 className="font-extrabold text-lg text-nexoraText">
                  {t('dashboard.touchpoint_stats.inactive_warning_title') || 'Station Inactive'}
                </h3>
                <p className="text-xs text-nexoraMuted leading-relaxed px-4">
                  {t('dashboard.touchpoint_stats.inactive_warning_desc') || 'This QR touchpoint is currently disabled by the owner.'}
                </p>
              </div>
              <button
                onClick={() => {
                  window.location.href = `${window.location.origin}${window.location.pathname}?biz=${encodeURIComponent(bizName)}`
                }}
                className="w-full mt-4 py-3 bg-nexoraCanvas border border-nexoraBorder hover:bg-nexoraSurfaceMuted text-nexoraText font-extrabold text-xs uppercase tracking-wider rounded-xl transition"
              >
                {t('common.back') || 'Go Back'}
              </button>
            </div>
          ) : (
            <>
              {/* STEP 2: STAFF SELECTION SCREEN */}
          {step === 'select_staff' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="text-center space-y-1">
                <h2 className="font-sans text-xl font-bold tracking-wide text-nexoraText uppercase">
                  {t('customer.select_staff_title') || 'Choose your service provider'}
                </h2>
                <p className="text-xs text-nexoraSubtle font-medium">
                  {t('customer.select_staff_subtitle') || 'Select the staff who served you.'}
                </p>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-3.5 w-4 h-4 text-nexoraSubtle" />
                <input
                  type="text"
                  placeholder={t('customer.search_staff_placeholder') || 'Search staff...'}
                  className="w-full bg-nexoraCanvas border border-nexoraBorder focus:border-nexoraBrand focus:bg-white rounded-lg pl-10 pr-4 py-2.5 text-sm text-nexoraText focus:outline-none placeholder-nexoraSubtle transition-all"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Staff cards */}
              <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
                {filteredStaff.length > 0 ? (
                  filteredStaff.map((member) => {
                    const isSelected = selectedStaffMembers.some(s => s.id === member.id)
                    return (
                      <button
                        key={member.id}
                        type="button"
                        onClick={() => {
                          handleToggleStaff(member)
                        }}
                        className={`w-full flex items-center justify-between p-4 bg-white border rounded-xl text-left transition-all duration-200 shadow-sm hover:shadow group ${
                          isSelected
                            ? 'border-nexoraBrand bg-nexoraBrandSoft/10'
                            : 'border-nexoraBorder hover:border-nexoraBrand/40 hover:bg-nexoraCanvas'
                        }`}
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
                        
                        <div className="flex items-center shrink-0">
                          <div className={`h-5 w-5 rounded-full flex items-center justify-center border transition-all ${
                            isSelected
                              ? 'bg-nexoraBrand border-nexoraBrand text-white scale-110'
                              : 'border-nexoraBorder group-hover:border-nexoraBrand/60 bg-white'
                          }`}>
                            {isSelected && (
                              <Check className="w-3.5 h-3.5 stroke-[3px]" />
                            )}
                          </div>
                        </div>
                      </button>
                    )
                  })
                ) : (
                  <div className="py-12 flex flex-col items-center justify-center text-center text-nexoraSubtle">
                    <Users className="w-10 h-10 text-nexoraBorder mb-3" />
                    <p className="text-xs font-semibold">{t('customer.no_staff_found') || 'No staff members found.'}</p>
                  </div>
                )}
              </div>

              {/* Bottom Next Button */}
              <div className="pt-2">
                <button
                  type="button"
                  disabled={selectedStaffMembers.length === 0}
                  onClick={() => setStep('tip_amount')}
                  className={`w-full py-3.5 bg-gradient-to-r from-[#2B59FF] to-[#8E4DF8] hover:opacity-90 transition text-white font-extrabold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-1.5 shadow-lg shadow-[#2B59FF]/25 ${
                    selectedStaffMembers.length === 0 ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {t('common.next') || 'Next'} <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: CHOOSE TIP AMOUNT */}
          {step === 'tip_amount' && selectedStaffMembers.length > 0 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="text-center space-y-4">
                <h2 className="font-sans text-xl font-bold tracking-wide text-nexoraText uppercase">
                  {tipScreenTitle}
                </h2>
              </div>

              {/* Tip grid for each selected staff */}
              <div className="space-y-4 max-h-[320px] overflow-y-auto pr-1">
                {selectedStaffMembers.map((member) => {
                  const selTip = selectedTips[member.id] !== undefined ? selectedTips[member.id] : 15
                  const custTip = customTips[member.id] || ''
                  return (
                    <div key={member.id} className="p-4 bg-nexoraCanvas/30 border border-nexoraBorder rounded-xl space-y-3">
                      {/* Staff Mini Profile */}
                      <div className="flex items-center gap-3">
                        {member.avatar ? (
                          <img
                            src={member.avatar}
                            alt=""
                            className="h-9 w-9 rounded-full object-cover border border-nexoraBorder shrink-0"
                          />
                        ) : (
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-tr from-[#2B59FF] to-[#8E4DF8] text-xs font-black text-white shrink-0 shadow-sm">
                            {member.nickname.charAt(0)}
                          </div>
                        )}
                        <div>
                          <h4 className="font-bold text-nexoraText text-xs leading-none">
                            {member.nickname}
                          </h4>
                          <p className="text-[10px] text-nexoraSubtle mt-0.5 font-semibold">
                            {member.position}
                          </p>
                        </div>
                      </div>

                      {/* Tip Grid for this staff */}
                      <div className="grid grid-cols-3 gap-2">
                        {[5, 10, 15, 20, 30].map(val => (
                          <button
                            key={val}
                            type="button"
                            onClick={() => {
                              setSelectedTips({ ...selectedTips, [member.id]: val })
                            }}
                            className={`py-2 rounded-lg text-xs font-black transition-all ${
                              selTip === val
                                ? 'bg-nexoraBrand text-white shadow shadow-nexoraBrand/30'
                                : 'bg-white hover:bg-slate-50 text-nexoraText border border-nexoraBorder/60'
                            }`}
                          >
                            ${val}
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedTips({ ...selectedTips, [member.id]: 'custom' })
                            if (!customTips[member.id]) {
                              setCustomTips({ ...customTips, [member.id]: '' })
                            }
                          }}
                          className={`py-2 rounded-lg text-xs font-black transition-all ${
                            selTip === 'custom'
                              ? 'bg-nexoraBrand text-white shadow shadow-nexoraBrand/30'
                              : 'bg-white hover:bg-slate-50 text-nexoraText border border-nexoraBorder/60'
                          }`}
                        >
                          {t('customer.custom_tip_btn') || 'Other'}
                        </button>
                      </div>

                      {/* Custom Input for this staff */}
                      {selTip === 'custom' && (
                        <div className="relative mt-2">
                          <span className="absolute left-3 top-2.5 text-xs font-extrabold text-nexoraSubtle">$</span>
                          <input
                            type="text"
                            inputMode="decimal"
                            placeholder="0.00"
                            className="w-full bg-white border border-nexoraBorder focus:border-nexoraBrand rounded-lg pl-7 pr-3 py-2 text-xs font-extrabold text-nexoraText focus:outline-none transition-all"
                            value={custTip}
                            onChange={(e) => {
                              setCustomTips({ ...customTips, [member.id]: e.target.value })
                            }}
                          />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Total Tip summary */}
              <div className="p-4 bg-nexoraBrandSoft/40 border border-nexoraBrandSoft rounded-xl flex items-center justify-between shadow-sm">
                <div>
                  <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                    {currentLanguage === 'vi' ? 'Tổng tiền Tip' : 'Total Tip'}
                  </h4>
                  <p className="text-[10px] text-nexoraMuted font-semibold mt-0.5">
                    {currentLanguage === 'vi' ? `Cho ${selectedStaffMembers.length} nhân viên` : `For ${selectedStaffMembers.length} provider(s)`}
                  </p>
                </div>
                <div className="text-lg font-black text-nexoraBrand">
                  ${activeTipAmount.toFixed(2)}
                </div>
              </div>

              {/* Next button */}
              <div className="pt-2 flex gap-3">
                {!initialStaffMember && (
                  <button
                    type="button"
                    onClick={() => setStep('select_staff')}
                    className="w-1/3 py-3.5 bg-nexoraCanvas border border-nexoraBorder hover:bg-nexoraSurfaceMuted transition text-nexoraMuted font-extrabold text-xs uppercase tracking-wider rounded-xl"
                  >
                    {t('common.back')}
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleNextToPayment}
                  className={`py-3.5 bg-gradient-to-r from-[#2B59FF] to-[#8E4DF8] hover:opacity-90 transition text-white font-extrabold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-1.5 shadow-lg shadow-[#2B59FF]/25 ${
                    initialStaffMember ? 'w-full' : 'w-2/3'
                  }`}
                >
                  {t('customer.pay_btn')} <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: SELECT PAYMENT METHOD */}
          {step === 'payment' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="text-center space-y-1">
                <h3 className="font-extrabold text-lg text-nexoraText">{t('customer.payment_title')}</h3>
                <p className="text-xs text-nexoraMuted">{t('customer.payment_desc')}</p>
              </div>

              <div className="space-y-3">
                {[
                  { name: 'Zelle', key: 'zelle', color: 'bg-[#7414CA] hover:bg-[#5f10a6] text-white', logo: WalletLogos.zelle },
                  { name: 'Bank Wire', key: 'bankwire', color: 'bg-[#475569] hover:bg-[#334155] text-white', logo: WalletLogos.bankwire },
                  { name: 'PayPal', key: 'paypal', color: 'bg-[#003087] hover:bg-[#002466] text-white', logo: WalletLogos.paypal },
                  { name: 'Venmo', key: 'venmo', color: 'bg-[#008CFF] hover:bg-[#007ad6] text-white', logo: WalletLogos.venmo },
                  { name: 'Cash App', key: 'cashapp', color: 'bg-[#00D632] hover:bg-[#00b52a] text-white', logo: WalletLogos.cashapp },
                  { name: 'Apple Pay', key: 'applecash', color: 'bg-black hover:opacity-90 text-white', logo: WalletLogos.applepay }
                ].filter(wallet => {
                  if (selectedStaffMembers.length === 1) {
                    const staff = selectedStaffMembers[0]
                    if (selectedStaffHasAnyPayment) {
                      return !!staff.paymentAccounts?.[wallet.key]
                    } else {
                      return !!businessPaymentAccounts?.[wallet.key]
                    }
                  }
                  return !!businessPaymentAccounts?.[wallet.key]
                }).map(wallet => {
                  return (
                    <button
                      key={wallet.key}
                      onClick={() => {
                        setSelectedWalletObj(wallet)
                        setSelectedWallet(wallet.name)
                        setTipRefNumber(Math.floor(1000 + Math.random() * 9000).toString())
                        setStep('wallet_details')
                      }}
                      className="w-full flex items-center justify-between p-4 rounded-xl font-bold text-sm bg-white border border-nexoraBorder hover:bg-nexoraCanvas text-nexoraText shadow-sm transition"
                    >
                      <div className="flex items-center gap-3">
                        <span className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${wallet.color}`}>
                          {wallet.logo}
                        </span>
                        <span>{wallet.name}</span>
                      </div>
                      <span className="text-xs text-nexoraSubtle font-medium">{t('customer.choose_chevron')}</span>
                    </button>
                  )
                })}
              </div>

              <button
                onClick={() => setStep('tip_amount')}
                className="w-full py-3 bg-nexoraCanvas border border-nexoraBorder hover:bg-nexoraSurfaceMuted transition text-nexoraMuted font-extrabold text-xs uppercase tracking-wider rounded-xl"
              >
                {t('common.back')}
              </button>
            </div>
          )}

          {/* STEP 4.5: WALLET DETAILS */}
          {step === 'wallet_details' && selectedWalletObj && (
            <div className="space-y-6 animate-fadeIn">
              <div className="text-center space-y-1">
                <h3 className="font-extrabold text-xl text-nexoraText">
                  {currentLanguage === 'vi' 
                    ? `Gửi tiền Tip qua ${selectedWalletObj.name}` 
                    : `Send Tip via ${selectedWalletObj.name}`}
                </h3>
                <p className="text-xs text-nexoraSubtle font-medium leading-relaxed">
                  {(() => {
                    const recipientName = selectedStaffMembers.length === 1 
                      ? selectedStaffMembers[0].nickname 
                      : bizName;
                    
                    if (currentLanguage === 'vi') {
                      if (selectedWalletObj.key === 'zelle') return `Mở ứng dụng ngân hàng của bạn và gửi tới ${recipientName}.`;
                      if (selectedWalletObj.key === 'venmo') return `Mở ứng dụng Venmo và gửi tới ${recipientName}.`;
                      if (selectedWalletObj.key === 'cashapp') return `Mở ứng dụng Cash App và gửi tới ${recipientName}.`;
                      return `Mở ứng dụng ví và gửi tới ${recipientName}.`;
                    } else {
                      if (selectedWalletObj.key === 'zelle') return `Open your bank app and send to ${recipientName}.`;
                      if (selectedWalletObj.key === 'venmo') return `Open your Venmo app and send to ${recipientName}.`;
                      if (selectedWalletObj.key === 'cashapp') return `Open your Cash App and send to ${recipientName}.`;
                      return `Open your wallet app and send to ${recipientName}.`;
                    }
                  })()}
                </p>
              </div>

              <div className="bg-white border border-nexoraBorder rounded-2xl p-6 shadow-sm space-y-5 flex flex-col items-center relative overflow-hidden">
                <div 
                  className="absolute -top-12 -left-12 w-24 h-24 rounded-full opacity-10 filter blur-xl"
                  style={{ backgroundColor: selectedWalletObj.key === 'zelle' ? '#7414CA' : selectedWalletObj.key === 'venmo' ? '#008CFF' : selectedWalletObj.key === 'cashapp' ? '#00D632' : '#475569' }} 
                />
                <div 
                  className="absolute -bottom-12 -right-12 w-24 h-24 rounded-full opacity-10 filter blur-xl"
                  style={{ backgroundColor: selectedWalletObj.key === 'zelle' ? '#7414CA' : selectedWalletObj.key === 'venmo' ? '#008CFF' : selectedWalletObj.key === 'cashapp' ? '#00D632' : '#475569' }} 
                />

                <div className={`h-16 w-16 rounded-2xl flex items-center justify-center shadow-md scale-105 transform transition duration-300 hover:rotate-3 ${selectedWalletObj.color}`}>
                  <span className="scale-[1.5]">
                    {selectedWalletObj.logo}
                  </span>
                </div>

                <div className="text-center space-y-1">
                  <div 
                    className="text-4xl font-black tracking-tight"
                    style={{ 
                      color: selectedWalletObj.key === 'zelle' 
                        ? '#7414CA' 
                        : selectedWalletObj.key === 'venmo' 
                          ? '#008CFF' 
                          : selectedWalletObj.key === 'cashapp' 
                            ? '#00D632' 
                            : '#1E293B' 
                    }}
                  >
                    ${activeTipAmount.toFixed(2)}
                  </div>
                  <p className="text-[10px] text-nexoraSubtle font-semibold tracking-wider uppercase">
                    {currentLanguage === 'vi' ? 'Số tiền chuyển khoản' : 'Tip Amount'}
                  </p>
                </div>

                {/* QR Code (if available) */}
                {qrCodeVal && (
                  <div className="flex flex-col items-center justify-center p-3 bg-slate-50 border border-nexoraBorder/60 rounded-xl my-2 max-w-[200px] animate-fadeIn">
                    <img 
                      src={qrCodeVal} 
                      alt={`${selectedWalletObj.name} QR Code`} 
                      className="h-32 w-32 object-contain rounded shadow-sm"
                    />
                    <p className="text-[9px] text-nexoraSubtle font-bold mt-2 text-center uppercase tracking-wider">
                      {currentLanguage === 'vi' ? 'Quét mã để chuyển khoản' : 'Scan to pay'}
                    </p>
                  </div>
                )}

                <div className="w-full border-t border-dashed border-nexoraBorder/60 my-1" />

                <div className="w-full space-y-3.5">
                  {/* Name Field */}
                  <div className="group relative border border-nexoraBorder/80 rounded-xl px-4 py-2.5 bg-nexoraCanvas/10 hover:bg-nexoraCanvas/30 hover:border-nexoraBrand/30 transition-all flex flex-col justify-between min-h-[56px]">
                    <span className="text-[10px] font-bold text-nexoraSubtle uppercase tracking-wider">
                      {currentLanguage === 'vi' ? 'Tên người nhận' : 'Name'}
                    </span>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-sm font-extrabold text-slate-800">
                        {selectedStaffMembers.length === 1 
                          ? selectedStaffMembers[0].fullName 
                          : bizName}
                      </span>
                      <button 
                        type="button"
                        onClick={() => {
                          const nameText = selectedStaffMembers.length === 1 
                            ? selectedStaffMembers[0].fullName 
                            : bizName;
                          navigator.clipboard.writeText(nameText);
                          showToast(t('common.copied') || 'Copied!', 'success');
                        }}
                        className="text-[10px] font-bold text-nexoraBrand hover:text-nexoraBrand/80 px-2 py-1 rounded bg-nexoraBrandSoft/40 hover:bg-nexoraBrandSoft transition"
                      >
                        {t('common.copy') || 'Copy'}
                      </button>
                    </div>
                  </div>

                  {/* Account Field */}
                  {(() => {
                    const accountVal = selectedStaffMembers.length === 1 
                      ? selectedStaffMembers[0].paymentAccounts?.[selectedWalletObj.key] 
                      : businessPaymentAccounts?.[selectedWalletObj.key];

                    const getFieldLabel = () => {
                      if (selectedWalletObj.key === 'zelle') return currentLanguage === 'vi' ? 'Email / SĐT' : 'Email/Phone';
                      if (selectedWalletObj.key === 'venmo') return currentLanguage === 'vi' ? 'Tài khoản Venmo' : 'Venmo Username';
                      if (selectedWalletObj.key === 'cashapp') return currentLanguage === 'vi' ? 'Thẻ Cash App' : 'Cash Tag';
                      if (selectedWalletObj.key === 'paypal') return currentLanguage === 'vi' ? 'Tài khoản PayPal' : 'PayPal Email/Phone';
                      if (selectedWalletObj.key === 'bankwire') return currentLanguage === 'vi' ? 'Thông tin ngân hàng' : 'Bank details';
                      return currentLanguage === 'vi' ? 'Tài khoản nhận' : 'Account';
                    };

                    return (
                      <div className="group relative border border-nexoraBorder/80 rounded-xl px-4 py-2.5 bg-nexoraCanvas/10 hover:bg-nexoraCanvas/30 hover:border-nexoraBrand/30 transition-all flex flex-col justify-between min-h-[56px]">
                        <span className="text-[10px] font-bold text-nexoraSubtle uppercase tracking-wider">
                          {getFieldLabel()}
                        </span>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-sm font-extrabold text-slate-800 break-all select-all">
                            {accountVal || 'N/A'}
                          </span>
                          {accountVal && (
                            <button 
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(accountVal);
                                showToast(t('common.copied') || 'Copied!', 'success');
                              }}
                              className="text-[10px] font-bold text-nexoraBrand hover:text-nexoraBrand/80 px-2 py-1 rounded bg-nexoraBrandSoft/40 hover:bg-nexoraBrandSoft transition"
                            >
                              {t('common.copy') || 'Copy'}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Reference Note Field */}
                  {(() => {
                    const noteText = selectedStaffMembers.length === 1 
                      ? `TIP-${selectedStaffMembers[0].nickname.toUpperCase().replace(/[^A-Z0-9]/g, '')}-${tipRefNumber}` 
                      : `TIP-NEXORA-${tipRefNumber}`;

                    return (
                      <div className="group relative border border-nexoraBorder/80 rounded-xl px-4 py-2.5 bg-nexoraCanvas/10 hover:bg-nexoraCanvas/30 hover:border-nexoraBrand/30 transition-all flex flex-col justify-between min-h-[56px]">
                        <span className="text-[10px] font-bold text-nexoraSubtle uppercase tracking-wider">
                          {currentLanguage === 'vi' ? 'Nội dung (Bắt buộc)' : 'Note (Required)'}
                        </span>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-sm font-black text-red-600 font-mono tracking-wide">
                            {noteText}
                          </span>
                          <button 
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(noteText);
                              showToast(t('common.copied') || 'Copied!', 'success');
                            }}
                            className="text-[10px] font-bold text-nexoraBrand hover:text-nexoraBrand/80 px-2 py-1 rounded bg-nexoraBrandSoft/40 hover:bg-nexoraBrandSoft transition"
                          >
                            {t('common.copy') || 'Copy'}
                          </button>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <button
                  type="button"
                  onClick={() => handlePay(selectedWalletObj.name)}
                  className="w-full py-4 bg-gradient-to-r from-[#2B59FF] to-[#8E4DF8] hover:opacity-95 active:scale-[0.99] transition-all text-white font-extrabold text-sm uppercase tracking-wider rounded-xl shadow-lg shadow-[#2B59FF]/25 flex items-center justify-center gap-1.5"
                >
                  <CheckCircle className="h-5 w-5" /> 
                  {currentLanguage === 'vi' ? 'Tôi Đã Gửi Tiền Tip' : 'Yes, I Sent The Tip'}
                </button>

                <button
                  type="button"
                  onClick={() => setStep('payment')}
                  className="w-full py-3 bg-nexoraCanvas border border-nexoraBorder hover:bg-nexoraSurfaceMuted transition text-nexoraMuted font-extrabold text-xs uppercase tracking-wider rounded-xl"
                >
                  {currentLanguage === 'vi' ? 'Quay Lại' : 'Go Back'}
                </button>
              </div>
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

          {/* STEP 5: PAYMENT SUCCESS */}
          {step === 'success_payment' && (
            <div className="text-center space-y-6 animate-fadeIn py-4 flex flex-col items-center">
              <div className="h-20 w-20 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/20 mb-2">
                <Check className="h-10 w-10 text-white stroke-[4]" />
              </div>

              <div className="space-y-3">
                <h3 className="font-extrabold text-2xl text-nexoraText tracking-tight">
                  {t('customer.payment_success_title')}
                </h3>
                <p className="text-sm text-nexoraMuted font-medium px-4 leading-relaxed">
                  {(() => {
                    const namesStr = selectedStaffMembers.map(s => s.fullName.split(' ')[0]).join(', ')
                    const descTemplate = t('customer.payment_success_desc', { 
                      name: namesStr 
                    })
                    const parts = descTemplate.split('{amount}')
                    if (parts.length === 2) {
                      return (
                        <>
                          {parts[0]}
                          <span className="font-bold text-nexoraText">${Number(activeTipAmount).toFixed(2)}</span>
                          {parts[1]}
                        </>
                      )
                    }
                    return descTemplate
                  })()}
                </p>
                <p className="text-xs text-nexoraSubtle font-semibold tracking-wide pt-1 uppercase">
                  {t('customer.tip_success_sub')}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setStep('leave_review')}
                className="w-full mt-4 py-3.5 bg-gradient-to-r from-nexoraBrand to-indigo-600 hover:opacity-95 active:scale-[0.98] transition-all text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-indigo-600/25 flex items-center justify-center"
              >
                {t('customer.done')}
              </button>
            </div>
          )}

          {/* STEP 6: LEAVE REVIEW */}
          {step === 'leave_review' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="text-center space-y-1">
                <h2 className="font-sans text-xl font-bold tracking-wide text-nexoraText uppercase">
                  {t('customer.rate_service_label')}
                </h2>
              </div>

              {/* Star Rating */}
              <div className="space-y-3">
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
                {/* Rating description */}
                <p className="text-center text-sm font-bold text-amber-600 animate-pulse">
                  {rating === 5 ? 'Amazing!' : rating === 4 ? 'Good!' : rating === 3 ? 'Okay' : rating === 2 ? 'Bad' : 'Terrible'}
                </p>
              </div>

              {/* Quick Comment Chips */}
              <div className="space-y-2.5">
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
                <label className="block text-[10px] font-bold text-nexoraMuted uppercase tracking-widest">
                  {t('customer.feedback_label')}
                </label>
                <textarea
                  rows="3"
                  placeholder={t('customer.feedback_placeholder')}
                  className="w-full bg-nexoraCanvas border border-nexoraBorder rounded-lg p-3 text-xs text-nexoraText placeholder-nexoraSubtle focus:outline-none focus:border-nexoraBrand focus:bg-white transition-all"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
              </div>

              {/* Buttons */}
              <div className="space-y-3 pt-2">
                <button
                  type="button"
                  onClick={handleSubmitFeedback}
                  className="w-full py-3.5 bg-gradient-to-r from-[#2B59FF] to-[#8E4DF8] hover:opacity-90 transition text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-[#2B59FF]/25"
                >
                  Submit Review
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (rating >= 4) {
                      setStep('google_yelp_review')
                    } else {
                      setStep('final_done')
                    }
                  }}
                  className="w-full py-2 text-center text-xs font-bold text-nexoraSubtle hover:text-nexoraText transition"
                >
                  Skip
                </button>
              </div>
            </div>
          )}

          {/* STEP 7: GOOGLE / YELP REVIEW */}
          {step === 'google_yelp_review' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="text-center space-y-2">
                <h3 className="font-sans text-2xl font-bold tracking-wide text-nexoraText uppercase">
                  {t('customer.share_review_title')}
                </h3>
                <p className="text-xs text-nexoraSubtle font-medium leading-relaxed px-2">
                  {t('customer.share_review_desc')}
                </p>
              </div>

              <div className="space-y-3">
                {reviewLinks.googleReview && (
                  <a
                    href={reviewLinks.googleReview}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => setStep('final_done')}
                    className="w-full flex items-center justify-between p-4 rounded-xl border border-nexoraBorder hover:bg-nexoraCanvas text-nexoraText shadow-sm transition group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 bg-white border border-nexoraBorder rounded-lg flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                        {/* Google Logo */}
                        <svg viewBox="0 0 24 24" className="h-[20px] w-[20px]" xmlns="http://www.w3.org/2000/svg">
                          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
                        </svg>
                      </div>
                      <span className="font-extrabold text-sm text-nexoraText">
                        {t('customer.google_review_btn')}
                      </span>
                    </div>
                    <span className="text-xs text-nexoraSubtle font-medium group-hover:translate-x-1 transition-transform">
                      {t('customer.choose_chevron')}
                    </span>
                  </a>
                )}

                {reviewLinks.yelpReview && (
                  <a
                    href={reviewLinks.yelpReview}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => setStep('final_done')}
                    className="w-full flex items-center justify-between p-4 rounded-xl border border-nexoraBorder hover:bg-nexoraCanvas text-nexoraText shadow-sm transition group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 bg-white border border-nexoraBorder rounded-lg flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                        {/* Yelp Logo */}
                        <svg viewBox="0 0 24 24" className="h-[20px] w-[20px] fill-[#D32323]" xmlns="http://www.w3.org/2000/svg">
                          <path d="m7.6885 15.1415-3.6715.8483c-.3769.0871-.755.183-1.1452.155-.2611-.0188-.5122-.0414-.7606-.213a1.179 1.179 0 0 1-.331-.3594c-.3486-.5519-.3656-1.3661-.3697-2.0004a6.2874 6.2874 0 0 1 .3314-2.0642 1.857 1.857 0 0 1 .1073-.2474 2.3426 2.3426 0 0 1 .1255-.2165 2.4572 2.4572 0 0 1 .1563-.1975 1.1736 1.1736 0 0 1 .399-.2831 1.082 1.082 0 0 1 .4592-.0837c.2355.0016.5139.052.91.1734.0555.0191.1237.0382.1856.0572.3277.1013.7048.2404 1.1499.3987.6863.2404 1.3663.487 2.0463.7397l1.2117.4423c.2217.0807.4363.18.6412.297.174.0984.3273.2298.4512.387a1.217 1.217 0 0 1 .192.4309 1.2205 1.2205 0 0 1-.872 1.4522c-.0468.0151-.0852.0239-.1085.0293l-1.105.2553-.0031-.001zM18.8208 7.565a1.8506 1.8506 0 0 0-.2042-.1754 2.4082 2.4082 0 0 0-.2077-.1394 2.3607 2.3607 0 0 0-.2269-.109 1.1705 1.1705 0 0 0-.482-.0796 1.0862 1.0862 0 0 0-.4498.1263c-.2107.1048-.4388.2732-.742.5551-.042.0417-.0947.0886-.142.133-.2502.2351-.5286.5252-.8599.863a114.6363 114.6363 0 0 0-1.5166 1.5629l-.8962.9293a4.1897 4.1897 0 0 0-.4466.5483 1.541 1.541 0 0 0-.2364.5459 1.2199 1.2199 0 0 0 .0107.4518l.0046.02a1.218 1.218 0 0 0 1.4184.923 1.162 1.162 0 0 0 .1105-.0213l4.7781-1.104c.3766-.087.7587-.1667 1.097-.3631.2269-.1316.4428-.262.5909-.5252a1.1793 1.1793 0 0 0 .1405-.4683c.0733-.6512-.2668-1.3908-.5403-1.963a6.2792 6.2792 0 0 0-1.2001-1.7103zM8.9703.0754a8.6724 8.6724 0 0 0-.83.1564c-.2754.066-.548.1383-.8146.2236-.868.2844-2.0884.8063-2.295 1.8065-.1165.5655.1595 1.1439.3737 1.66.2595.6254.614 1.1889.9373 1.7777.8543 1.5545 1.7245 3.0993 2.5922 4.6457.259.4617.5416 1.0464 1.043 1.2856a1.058 1.058 0 0 0 .1013.0383c.2248.0851.4699.1016.7041.0471a4.3015 4.3015 0 0 0 .0418-.0097 1.2136 1.2136 0 0 0 .5658-.3397 1.1033 1.1033 0 0 0 .079-.0822c.3463-.435.3454-1.0833.3764-1.6134.1042-1.771.2139-3.5423.3009-5.3142.0332-.6712.1055-1.3333.0655-2.0096-.0328-.5579-.0368-1.1984-.3891-1.6563-.6218-.8073-1.9476-.741-2.8523-.6158zm2.084 15.9505a1.1053 1.1053 0 0 0-1.2306-.4145 1.1398 1.1398 0 0 0-.1526.0633 1.4806 1.4806 0 0 0-.2171.1354c-.1992.1475-.3668.3392-.5196.5315-.0386.049-.074.1143-.12.1562l-.7686 1.0573a113.9168 113.9168 0 0 0-1.2913 1.789c-.278.3895-.5184.7184-.7083 1.0094-.036.0547-.0734.116-.1075.1647-.2277.3522-.3566.6092-.4228.8381a1.0945 1.0945 0 0 0-.046.4721c.0211.1655.0768.3246.1635.467.046.0715.0957.1406.1487.207a2.334 2.334 0 0 0 .1754.1825 1.843 1.843 0 0 0 .2108.1732c.5304.369 1.1112.6342 1.722.8391a6.0958 6.0958 0 0 0 1.5716.3004c.091.0046.1821.0025.2728-.006a2.3878 2.3878 0 0 0 .2506-.0351 2.3862 2.3862 0 0 0 .2447-.071 1.1927 1.1927 0 0 0 .4175-.2658c.1127-.113.1994-.249.2541-.3989.0889-.2214.1473-.5026.1857-.92.0034-.0593.0118-.1305.0177-.1958.0304-.3463.0443-.7531.0666-1.2315.0375-.7357.067-1.4681.0903-2.2026 0 0 .0495-1.3053.0494-1.306.0113-.3008.002-.6342-.0814-.9336a1.396 1.396 0 0 0-.1756-.4054zm8.6754 2.0439c-.1605-.176-.3878-.3514-.7462-.5682-.0518-.0288-.1124-.0674-.1684-.1009-.2985-.1795-.658-.3684-1.078-.5965a120.7615 120.7615 0 0 0-1.9427-1.042l-1.1515-.6107c-.0597-.0175-.1203-.0607-.1766-.0878-.2212-.1058-.4558-.2045-.6992-.2498a1.4915 1.4915 0 0 0-.2545-.0265 1.1527 1.1527 0 0 0-.1648.01 1.1077 1.1077 0 0 0-.9227.9133 1.4186 1.4186 0 0 0 .0159.439c.0563.3065.1932.6096.3346.875l.615 1.1526c.3422.65.6884 1.2963 1.0435 1.9406.229.4202.4196.7799.5982 1.078.0338.056.0721.1163.1011.1682.2173.3584.392.584.569.7458.1146.1107.252.195.4026.247.1583.0525.326.071.4919.0546a2.368 2.368 0 0 0 .251-.0435c.0817-.022.1622-.048.241-.0784a1.863 1.863 0 0 0 .2475-.1143 6.1018 6.1018 0 0 0 1.2818-.9597c.4596-.4522.8659-.9454 1.182-1.51.044-.08.0819-.163.1138-.2483a2.49 2.49 0 0 0 .0773-.2411c.0186-.083.033-.1669.0429-.2513a1.188 1.188 0 0 0-.0565-.491 1.0933 1.0933 0 0 0-.248-.4041z"/>
                        </svg>
                      </div>
                      <span className="font-extrabold text-sm text-nexoraText">
                        {t('customer.yelp_review_btn')}
                      </span>
                    </div>
                    <span className="text-xs text-nexoraSubtle font-medium group-hover:translate-x-1 transition-transform">
                      {t('customer.choose_chevron')}
                    </span>
                  </a>
                )}
              </div>

              <div className="space-y-4 text-center pt-2">
                <button
                  type="button"
                  onClick={() => setStep('final_done')}
                  className="text-xs font-bold text-nexoraSubtle hover:text-nexoraText transition"
                >
                  Maybe later
                </button>
                <p className="text-[10px] text-nexoraSubtle font-medium italic mt-2">
                  {t('customer.final_success_desc')}
                </p>
              </div>
            </div>
          )}

          {/* STEP 8: FINAL DONE STATE */}
          {step === 'final_done' && (
            <div className="text-center space-y-6 animate-fadeIn py-4 flex flex-col items-center">
              <div className="h-16 w-16 bg-nexoraBrand/10 text-nexoraBrand rounded-full flex items-center justify-center animate-bounce">
                <Heart className="h-8 w-8 fill-current text-red-500 animate-pulse" />
              </div>

              <div className="space-y-2">
                <h3 className="font-extrabold text-xl text-nexoraText">{t('customer.final_success_title')}</h3>
                <p className="text-sm text-nexoraMuted leading-relaxed">
                  Thank you for your support! Have a great day!
                </p>
              </div>

              <button
                type="button"
                onClick={handleReset}
                className="w-full mt-4 py-3.5 bg-gradient-to-r from-nexoraBrand to-indigo-600 hover:opacity-95 active:scale-[0.98] transition-all text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-indigo-600/25 flex items-center justify-center"
              >
                {t('customer.send_new_btn')}
              </button>
            </div>
          )}
            </>
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
