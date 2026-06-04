import { useState, useMemo, useEffect } from 'react'
import { useTranslation } from '../../../contexts/LanguageContext'
import { useNotification } from '../../../contexts/NotificationContext'
import { logger } from '../../../utils/logger'
import { useMerchantSetup } from '../../../data/hooks/useMerchantSetup'
import { useProfileSettings } from '../../../data/hooks/useProfileSettings'
import { useAddTransaction } from '../../../data/hooks/useTransactions'
import { useAddReview } from '../../../data/hooks/useReviews'
import { useAddNotification } from '../../../data/hooks/useNotifications'

export default function useCustomerFlow() {
  const { currentLanguage, setLanguage, t } = useTranslation()
  const { showToast } = useNotification()

  // Domain data via TanStack Query hooks (D3 / D8)
  const { data: setupData = null } = useMerchantSetup()
  const { data: profileSettings = null } = useProfileSettings()
  const addTransactionMutation = useAddTransaction()
  const addReviewMutation = useAddReview()
  const addNotificationMutation = useAddNotification()

  // Parse parameters from query string
  const params = useMemo(() => new URLSearchParams(window.location.search), [])
  const techSlug = params.get('tech') || '' // e.g. 'staff/mia-t'

  // Get business name from profile settings or merchant setup (D3: no direct storage reads)
  const bizName = useMemo(() => {
    if (profileSettings?.businessName) return profileSettings.businessName
    if (setupData?.businessInfo?.name) return setupData.businessInfo.name
    return params.get('biz') || 'Golden Glow Nail Spa'
  }, [profileSettings, setupData, params])

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

  // Get review destination links from profile settings or merchant setup (D3: no direct storage reads)
  const reviewLinks = useMemo(() => {
    const defaultLinks = {
      googleReview: 'https://g.page/r/cGoldenGlowNails/review',
      yelpReview: 'https://www.yelp.com/biz/golden-glow-nails-palm-beach',
      feedbackEmail: 'manager@goldenglownails.com'
    }

    if (profileSettings?.googleReview || profileSettings?.yelpReview) {
      return {
        googleReview: profileSettings.googleReview || '',
        yelpReview: profileSettings.yelpReview || '',
        feedbackEmail: profileSettings.businessEmail || profileSettings.email || defaultLinks.feedbackEmail
      }
    }

    return setupData?.reviewLinks || defaultLinks
  }, [profileSettings, setupData])

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

    if (profileSettings?.paymentAccounts) return profileSettings.paymentAccounts
    return setupData?.businessInfo?.paymentAccounts || defaultAccounts
  }, [profileSettings, setupData])

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

      // D8: all tip/transaction writes go through useAddTransaction so the
      // future API swap is localized to transactionsRepository / apiAdapter.
      const baseTxIdNum = Math.floor(2000 + Math.random() * 1000)
      const touchpointStr = techSlug
        ? (techSlug.startsWith('staff/') ? 'Staff Personal QR' : (setupData?.touchPoints?.find(tp => techSlug.includes(tp.id))?.name || 'QR Touchpoint'))
        : 'Lobby Welcome QR'

      selectedStaffMembers.forEach((member, index) => {
        const selTip = selectedTips[member.id] !== undefined ? selectedTips[member.id] : 15
        const amount = selTip === 'custom' ? Number(customTips[member.id]) || 0 : selTip
        const txId = selectedStaffMembers.length > 1
          ? `TX-${baseTxIdNum}-${index + 1}`
          : `TX-${baseTxIdNum}`

        // Exact transaction object shape preserved from original
        const tx = {
          id: txId,
          dateTime: new Date().toISOString().replace('T', ' ').substring(0, 16),
          amount: amount,
          staffName: member.nickname,
          staffId: member.id,
          touchpoint: touchpointStr,
          paymentMethod: walletName,
          status: 'Success'
        }

        addTransactionMutation.mutate(tx, {
          onError: (e) => logger.error('Error saving transaction', e)
        })

        // Corresponding notification for the tipped staff member
        const notification = {
          id: `noti-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 5)}`,
          type: 'tip_success',
          title: `New Tip Received ($${Number(amount).toFixed(2)})`,
          message: `${member.nickname} received $${Number(amount).toFixed(2)} tip via ${walletName} at ${touchpointStr}.`,
          time: 'Just now',
          read: false,
          linkTab: 'reports'
        }

        addNotificationMutation.mutate(notification, {
          onError: (e) => logger.error('Error saving notification', e)
        })
      })
    }, 1800)
  }

  const handleSubmitFeedback = () => {
    const cleanComment = comment.trim()

    selectedStaffMembers.forEach((member, index) => {
      const review = {
        id: `R-${Date.now()}-${member.id}`,
        rating: rating,
        comment: cleanComment || (rating >= 4 ? 'Good service' : 'Needs improvement'),
        staffName: member.nickname,
        staffId: member.id,
        category: rating >= 4 ? 'Good (Google)' : 'Internal Feedback',
        date: new Date().toISOString().substring(0, 10)
      }

      addReviewMutation.mutate(review, {
        onError: (e) => logger.error('Error saving review', e)
      })

      // Corresponding notification for the feedback
      const notification = {
        id: `noti-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 5)}`,
        type: rating >= 4 ? 'review_good' : 'feedback_alert',
        title: rating >= 4 ? `New Review (${rating}★)` : `New Internal Feedback (${rating}★)`,
        message: `Customer left feedback for ${member.nickname}: "${cleanComment.substring(0, 50)}${cleanComment.length > 50 ? '...' : ''}"`,
        time: 'Just now',
        read: false,
        linkTab: 'reviews'
      }

      addNotificationMutation.mutate(notification, {
        onError: (e) => logger.error('Error saving notification', e)
      })
    })

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

  return {
    // context
    currentLanguage,
    setLanguage,
    t,
    showToast,
    // derived data
    params,
    techSlug,
    bizName,
    setupData,
    scannedTouchpoint,
    activeStaffList,
    initialStaffMember,
    reviewLinks,
    businessPaymentAccounts,
    selectedStaffHasAnyPayment,
    qrCodeVal,
    filteredStaff,
    positiveTagKeys,
    negativeTagKeys,
    activeTipAmount,
    tipScreenTitle,
    // state
    selectedStaffMembers,
    setSelectedStaffMembers,
    step,
    setStep,
    searchQuery,
    setSearchQuery,
    selectedTips,
    setSelectedTips,
    customTips,
    setCustomTips,
    rating,
    setRating,
    comment,
    setComment,
    selectedTags,
    setSelectedTags,
    selectedWallet,
    setSelectedWallet,
    isProcessing,
    setIsProcessing,
    selectedWalletObj,
    setSelectedWalletObj,
    tipRefNumber,
    setTipRefNumber,
    // handlers
    handleTagToggle,
    handleRatingChange,
    handleToggleStaff,
    handleNextToPayment,
    handlePay,
    handleSubmitFeedback,
    handleReset,
  }
}
