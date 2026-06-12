import { useState, useMemo, useEffect } from 'react'
import { useTranslation } from '../../../contexts/LanguageContext'
import { useNotification } from '../../../contexts/NotificationContext'
import { logger } from '../../../utils/logger'
import publicTouchRepository from '../../../data/repositories/publicTouch'
import {
  useCustomerTouchPage,
  useCreateTip,
  useConfirmTip,
  useSkipTip,
  useCreateReview,
  useTrackGoogle,
  useTrackYelp,
  usePublicBusinessPaymentMethods,
} from '../../../data/hooks/usePublicTouch'

/**
 * Custom hook powering the entire customer tipping & review flow.
 *
 * This flow operates STRICTLY in API mode, driven by the real Touchpoint API.
 * Triggered by `/touch/{businessSlug}/{touchPointSlug}` URLs.
 *
 * @returns {Object} All state, derived values, and handlers for CustomerFlow.
 */
export default function useCustomerFlow() {
  const { currentLanguage, setLanguage, t } = useTranslation()
  const { showToast } = useNotification()

  // ── Route & Session Parameters ──
  const touchRoute = useMemo(() => {
    const parts = window.location.pathname.split('/').filter(Boolean)
    if (parts[0] === 'touch' && parts.length >= 3) {
      return { businessSlug: parts[1], touchPointSlug: parts[2] }
    }
    return null
  }, [])

  const sessionId = useMemo(() => {
    const params = new URLSearchParams(window.location.search)
    return params.get('sessionId') || crypto.randomUUID()
  }, [])

  // ── API data ──
  const touchPageQuery = useCustomerTouchPage({
    businessSlug: touchRoute?.businessSlug,
    touchPointSlug: touchRoute?.touchPointSlug,
    sessionId,
  })
  const touchPageData = (touchPageQuery.data ?? null) as LooseObject | null

  // ── API mutations ──
  const createTipMutation = useCreateTip()
  const confirmTipMutation = useConfirmTip()
  const skipTipMutation = useSkipTip()
  const createReviewMutationApi = useCreateReview()
  const trackGoogleMutation = useTrackGoogle()
  const trackYelpMutation = useTrackYelp()

  // ── Unified derived data ──
  const bizName = useMemo(() => {
    return touchPageData?.business?.name || ''
  }, [touchPageData])

  const activeStaffList = useMemo(() => {
    let staffArray = []
    if (Array.isArray(touchPageData?.staff)) {
      staffArray = touchPageData.staff
    } else if (Array.isArray(touchPageData?.staff?.items)) {
      staffArray = touchPageData.staff.items
    } else if (Array.isArray(touchPageData?.items)) { // Fallback if API root is items
      staffArray = touchPageData.items
    }

    if (staffArray.length > 0) {
      return staffArray
        .filter(s => (s.status === 'Active' || s.isActive !== false) && s.showInTipsFlow !== false)
        .map(s => ({
          ...s,
          fullName: s.fullName || s.displayName || '',
          nickname: s.nickname || s.displayName || '',
          avatar: s.avatar || s.photoUrl || ''
        }))
    }
    return []
  }, [touchPageData])

  const initialStaffMember = null // No auto-select since 'techSlug' simulation is removed

  const reviewLinks = useMemo(() => {
    const defaultLinks = { googleReview: '', yelpReview: '', feedbackEmail: '' }
    if (touchPageData?.business) {
      return {
        googleReview: touchPageData.business.googleReviewUrl || '',
        yelpReview: touchPageData.business.yelpUrl || '',
        feedbackEmail: touchPageData.business.feedbackEmail || '',
      }
    }
    return defaultLinks
  }, [touchPageData])

  // ── Local state ──
  const [selectedStaffMembers, setSelectedStaffMembers] = useState([])
  const [step, setStep] = useState('select_staff')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTips, setSelectedTips] = useState({})
  const [customTips, setCustomTips] = useState({})
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [selectedTags, setSelectedTags] = useState([])
  const [selectedWallet, setSelectedWallet] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [selectedWalletObj, setSelectedWalletObj] = useState(null)
  const [tipRefNumber, setTipRefNumber] = useState('')
  const [currentTipId, setCurrentTipId] = useState(null)
  const [currentReviewId, setCurrentReviewId] = useState(null)
  const [paymentLinkData, setPaymentLinkData] = useState(null)

  // ── Payment accounts ──
  const businessId = touchPageData?.business?.id || null
  const publicMethodsQuery = usePublicBusinessPaymentMethods(businessId)
  const publicPaymentMethods = (publicMethodsQuery.data ?? []) as LooseObject[]

  const businessPaymentAccounts = useMemo(() => {
    const defaultAccounts = { venmo: '', cashapp: '', zelle: '', vlinkpay: '' }
    if (publicPaymentMethods.length > 0) {
      const accounts = { ...defaultAccounts }
      publicPaymentMethods.forEach(pm => {
        const key = (pm.type || pm.name || '').toLowerCase()
        if (accounts[key] !== undefined) accounts[key] = pm.accountInfo || ''
      })
      return accounts
    }
    return defaultAccounts
  }, [publicPaymentMethods])

  const selectedStaffHasAnyPayment = useMemo(() => {
    if (selectedStaffMembers.length !== 1) return false
    const staff = selectedStaffMembers[0]
    return Array.isArray(staff.availablePaymentMethods) && staff.availablePaymentMethods.length > 0
  }, [selectedStaffMembers])

  const qrCodeVal = useMemo(() => {
    if (!selectedWalletObj) return null
    if (selectedStaffMembers.length === 1 && selectedStaffHasAnyPayment) {
      const staff = selectedStaffMembers[0]
      return staff.payoutConfigs?.[selectedWalletObj.key]?.qrCode || staff.payoutQrCodes?.[selectedWalletObj.key] || null
    }
    return null // Business-level fallback is not supported in API strictly without data payload mapping
  }, [selectedWalletObj, selectedStaffMembers, selectedStaffHasAnyPayment])

  const filteredStaff = useMemo(() => {
    return activeStaffList.filter(s =>
      s.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.nickname.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.position.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [activeStaffList, searchQuery])

  const positiveTagKeys = ['friendly', 'professional', 'meticulous', 'clean', 'art', 'fast', 'gentle']
  const negativeTagKeys = ['slow', 'rushed', 'careless', 'unfriendly', 'hygiene', 'wrong_design', 'rough']

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
    return t('components.customer_flow.hooks.useCustomerFlow.addTipsForYour')
  }, [selectedStaffMembers, currentLanguage, t])

  // ── Tag / comment sync ──
  useEffect(() => {
    if (!comment) { setSelectedTags([]); return }
    const isPositive = rating >= 4
    const activeKeys = isPositive ? positiveTagKeys : negativeTagKeys
    const nextSelected = activeKeys.filter(key => {
      const tagText = isPositive ? t(`customer.tags_positive.${key}`) : t(`customer.tags_negative.${key}`)
      return comment.toLowerCase().includes(tagText.toLowerCase())
    })
    if (JSON.stringify(nextSelected) !== JSON.stringify(selectedTags)) setSelectedTags(nextSelected)
  }, [comment, rating, t])

  /** @param {string} key - Tag key to toggle */
  const handleTagToggle = (key) => {
    const isPositive = rating >= 4
    const tagText = isPositive ? t(`customer.tags_positive.${key}`) : t(`customer.tags_negative.${key}`)
    setSelectedTags((prev) => {
      const isSelected = prev.includes(key)
      let nextTags, newComment = comment.trim()
      if (isSelected) {
        nextTags = prev.filter(k => k !== key)
        const esc = tagText.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')
        for (const rx of [new RegExp(`,\\s*${esc}`, 'gi'), new RegExp(`${esc},\\s*`, 'gi'), new RegExp(`^${esc}$`, 'gi'), new RegExp(esc, 'gi')]) {
          if (rx.test(newComment)) { newComment = newComment.replace(rx, '').trim(); break }
        }
        newComment = newComment.replace(/,\s*,/g, ', ').replace(/^,\s*|,\s*$/g, '').trim()
      } else {
        nextTags = [...prev, key]
        newComment = newComment === '' ? tagText : (/[.,!]$/.test(newComment) ? `${newComment} ${tagText}` : `${newComment}, ${tagText}`)
      }
      setComment(newComment)
      return nextTags
    })
  }

  const handleRatingChange = (newRating) => {
    if ((rating >= 4) !== (newRating >= 4)) { setComment(''); setSelectedTags([]) }
    setRating(newRating)
  }

  const handleToggleStaff = (member) => {
    setSelectedStaffMembers((prev) => {
      const isAlreadySelected = prev.some((s) => s.id === member.id)
      if (isAlreadySelected) {
        const nextTips = { ...selectedTips }; delete nextTips[member.id]; setSelectedTips(nextTips)
        return prev.filter((s) => s.id !== member.id)
      }
      setSelectedTips({ ...selectedTips, [member.id]: 15 })
      return [...prev, member]
    })
  }

  /**
   * Validates tip amounts and navigates to payment step.
   * @param {Event} e - Form submit event.
   */
  const handleNextToPayment = (e) => {
    e.preventDefault()
    const MIN_TIP = 1, MAX_TIP = 500
    let total = 0
    for (const member of selectedStaffMembers) {
      const selTip = selectedTips[member.id] !== undefined ? selectedTips[member.id] : 15
      const amount = selTip === 'custom' ? Number(customTips[member.id]) : selTip
      if (isNaN(amount) || amount < MIN_TIP) {
        showToast(t('customer.tip_min_error', { amount: `$${MIN_TIP.toFixed(2)}` }), 'error'); return
      }
      if (amount > MAX_TIP) {
        showToast(t('customer.tip_max_error', { amount: `$${MAX_TIP.toFixed(2)}` }), 'error'); return
      }
      total += amount
    }
    if (total > MAX_TIP) {
      showToast(t('customer.tip_total_max_error', { amount: `$${MAX_TIP.toFixed(2)}` }), 'error'); return
    }
    setStep('payment')
  }

  /**
   * Handles wallet selection and initiates tip payment.
   * @param {string} walletName - Payment wallet selected.
   */
  const handlePay = async (walletName) => {
    setSelectedWallet(walletName)
    setStep('processing')
    try {
      const member = selectedStaffMembers[0]
      const selTip = selectedTips[member.id] !== undefined ? selectedTips[member.id] : 15
      const amount = selTip === 'custom' ? Number(customTips[member.id]) || 0 : selTip
      const result = await (createTipMutation.mutateAsync as unknown as (args: LooseObject) => Promise<LooseObject>)({
        touchPointId: (touchPageData as LooseObject)?.touchPoint?.id, staffProfileId: member.id,
        amount, paymentMethod: walletName, sessionId,
      })
      setCurrentTipId(result?.id || result?.tipId)
      // Fetch payment link for wallet details display
      try {
        const linkData = await publicTouchRepository.getPaymentLink({
          staffId: member.id,
          method: walletName,
          amount,
        })
        setPaymentLinkData(linkData)
      } catch (linkErr) {
        logger.error('Failed to fetch payment link', linkErr)
        // Continue without link data — WalletDetails will use fallback
      }
      setStep('wallet_details')
    } catch (err) {
      logger.error('Failed to create tip', err)
      showToast(t('errors.generic'), 'error')
      setStep('payment')
    }
  }

  /** Confirms that customer completed external wallet payment. */
  const handleConfirmTip = async () => {
    if (currentTipId) {
      try {
        await confirmTipMutation.mutateAsync(currentTipId)
        setStep('success_payment')
      } catch (err) {
        logger.error('Failed to confirm tip', err)
        showToast(t('errors.generic'), 'error')
      }
    }
  }

  /** Records that customer skipped tipping and navigates to review. */
  const handleSkipTip = async () => {
    try {
      const member = selectedStaffMembers[0]
      await (skipTipMutation.mutateAsync as unknown as (args: LooseObject) => Promise<LooseObject>)({
        touchPointId: (touchPageData as LooseObject)?.touchPoint?.id, staffProfileId: member?.id, sessionId,
      })
    } catch (err) { logger.error('Failed to record skip-tip', err) }
    setStep('leave_review')
  }

  /** Submits customer feedback review. */
  const handleSubmitFeedback = async () => {
    const cleanComment = comment.trim()
    try {
      const member = selectedStaffMembers[0]
      const result = await (createReviewMutationApi.mutateAsync as unknown as (args: LooseObject) => Promise<LooseObject>)({
        touchPointId: (touchPageData as LooseObject)?.touchPoint?.id, tipId: currentTipId || undefined,
        staffProfileId: member.id, rating,
        comment: cleanComment || (rating >= 4 ? 'Good service' : 'Needs improvement'),
      })
      setCurrentReviewId(result?.id || result?.reviewId)
      setStep(rating >= 4 ? 'google_yelp_review' : 'final_done')
    } catch (err) {
      logger.error('Failed to submit review', err)
      showToast(t('errors.generic'), 'error')
    }
  }

  /**
   * Tracks external review link click and navigates to final_done.
   * @param {'google'|'yelp'} platform
   */
  const handleTrackExternalReview = async (platform) => {
    if (currentReviewId) {
      try {
        if (platform === 'google') await trackGoogleMutation.mutateAsync(currentReviewId)
        if (platform === 'yelp') await trackYelpMutation.mutateAsync(currentReviewId)
      } catch (err) { logger.error(`Failed to track ${platform} review click`, err) }
    }
    setStep('final_done')
  }

  const handleReset = () => {
    setSelectedStaffMembers([])
    setStep('select_staff')
    setSelectedTips({})
    setCustomTips({}); setRating(5); setComment(''); setSelectedTags([])
    setSelectedWallet(''); setSelectedWalletObj(null); setTipRefNumber('')
    setCurrentTipId(null); setCurrentReviewId(null); setPaymentLinkData(null)
  }

  // To preserve backwards compatibility with tests and consumers, we export 'isApiMode' as true
  return {
    currentLanguage, setLanguage, t, showToast,
    isApiMode: true, touchPageQuery,
    bizName, activeStaffList,
    initialStaffMember, reviewLinks, businessPaymentAccounts,
    selectedStaffHasAnyPayment, qrCodeVal, filteredStaff,
    positiveTagKeys, negativeTagKeys, activeTipAmount, tipScreenTitle,
    selectedStaffMembers, setSelectedStaffMembers, step, setStep,
    searchQuery, setSearchQuery, selectedTips, setSelectedTips,
    customTips, setCustomTips, rating, setRating, comment, setComment,
    selectedTags, setSelectedTags, selectedWallet, setSelectedWallet,
    isProcessing, setIsProcessing, selectedWalletObj, setSelectedWalletObj,
    tipRefNumber, setTipRefNumber, currentTipId, currentReviewId,
    handleTagToggle, handleRatingChange, handleToggleStaff, handleNextToPayment,
    handlePay, handleConfirmTip, handleSkipTip, handleSubmitFeedback,
    handleTrackExternalReview, handleReset, paymentLinkData,
  }
}
