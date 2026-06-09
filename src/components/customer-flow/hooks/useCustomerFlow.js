import { useState, useMemo, useEffect } from 'react'
import { useTranslation } from '../../../contexts/LanguageContext'
import { useNotification } from '../../../contexts/NotificationContext'
import { logger } from '../../../utils/logger'
import publicTouchRepository from '../../../data/repositories/publicTouch'
import { useMerchantSetup } from '../../../data/hooks/useMerchantSetup'
import { useProfileSettings } from '../../../data/hooks/useProfileSettings'
import { useAddTransaction } from '../../../data/hooks/useTransactions'
import { useAddReview } from '../../../data/hooks/useReviews'
import { useAddNotification } from '../../../data/hooks/useNotifications'
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
import { createSimulationHandlers } from './useSimulationHandlers'

/**
 * Custom hook powering the entire customer tipping & review flow.
 *
 * Supports two operational modes:
 * - **API mode** — triggered by `/touch/{businessSlug}/{touchPointSlug}` URLs,
 *   all data comes from the public touch API.
 * - **Simulation mode** — triggered by `?flow=customer`, uses local
 *   merchant setup / profile settings data.
 *
 * @returns {Object} All state, derived values, and handlers for CustomerFlow.
 */
export default function useCustomerFlow() {
  const { currentLanguage, setLanguage, t } = useTranslation()
  const { showToast } = useNotification()

  // ── Detect real API touch route ──
  const touchRoute = useMemo(() => {
    const parts = window.location.pathname.split('/').filter(Boolean)
    if (parts[0] === 'touch' && parts.length >= 3) {
      return { businessSlug: parts[1], touchPointSlug: parts[2] }
    }
    return null
  }, [])

  const isApiMode = !!touchRoute

  /** Generate or extract sessionId for API mode */
  const sessionId = useMemo(() => {
    if (!isApiMode) return null
    const params = new URLSearchParams(window.location.search)
    return params.get('sessionId') || crypto.randomUUID()
  }, [isApiMode])

  // ── API data (only fetched in API mode) ──
  const touchPageQuery = useCustomerTouchPage({
    businessSlug: touchRoute?.businessSlug,
    touchPointSlug: touchRoute?.touchPointSlug,
    sessionId,
  })
  const touchPageData = touchPageQuery.data ?? null

  // ── Simulation data (only fetched in simulation mode) ──
  const { data: setupData = null } = useMerchantSetup({ enabled: !isApiMode })
  const { data: profileSettings = null } = useProfileSettings({ enabled: !isApiMode })
  const addTransactionMutation = useAddTransaction()
  const addReviewMutation = useAddReview()
  const addNotificationMutation = useAddNotification()

  // ── API mutations ──
  const createTipMutation = useCreateTip()
  const confirmTipMutation = useConfirmTip()
  const skipTipMutation = useSkipTip()
  const createReviewMutationApi = useCreateReview()
  const trackGoogleMutation = useTrackGoogle()
  const trackYelpMutation = useTrackYelp()

  // Query-string params
  const params = useMemo(() => new URLSearchParams(window.location.search), [])
  const techSlug = params.get('tech') || ''

  // ── Unified derived data ──
  const bizName = useMemo(() => {
    if (isApiMode && touchPageData?.business) return touchPageData.business.name || ''
    if (profileSettings?.businessName) return profileSettings.businessName
    if (setupData?.businessInfo?.name) return setupData.businessInfo.name
    return params.get('biz') || ''
  }, [isApiMode, touchPageData, profileSettings, setupData, params])

  const scannedTouchpoint = useMemo(() => {
    if (isApiMode) return null
    if (!techSlug || techSlug.startsWith('staff/')) return null
    return setupData?.touchPoints?.find(tp => techSlug.includes(tp.id))
  }, [isApiMode, setupData, techSlug])

  const activeStaffList = useMemo(() => {
    if (isApiMode && touchPageData?.staff) {
      return touchPageData.staff.filter(s => s.isActive !== false)
    }
    const list = setupData?.staffList || []
    return list.filter(s => s.isActive !== false && s.showInTipsFlow !== false)
  }, [isApiMode, touchPageData, setupData])

  const initialStaffMember = useMemo(() => {
    if (isApiMode) return null
    if (!techSlug || techSlug.toLowerCase().startsWith('tp/') || techSlug.toLowerCase().startsWith('tp-')) return null
    const list = setupData?.staffList || []
    const matched = list.find(s =>
      techSlug.includes(s.id) ||
      techSlug.toLowerCase().includes(s.nickname.toLowerCase().replace(/[^a-z0-9]+/g, '-')) ||
      techSlug.toLowerCase().includes(s.fullName.toLowerCase().split(' ')[0])
    )
    return (matched && matched.isActive !== false && matched.showInTipsFlow !== false) ? matched : null
  }, [isApiMode, setupData, techSlug])

  const reviewLinks = useMemo(() => {
    const defaultLinks = { googleReview: '', yelpReview: '', feedbackEmail: '' }
    if (isApiMode && touchPageData?.business) {
      return {
        googleReview: touchPageData.business.googleReviewUrl || '',
        yelpReview: touchPageData.business.yelpUrl || '',
        feedbackEmail: touchPageData.business.feedbackEmail || '',
      }
    }
    if (profileSettings?.googleReview || profileSettings?.yelpReview) {
      return {
        googleReview: profileSettings.googleReview || '',
        yelpReview: profileSettings.yelpReview || '',
        feedbackEmail: profileSettings.businessEmail || profileSettings.email || '',
      }
    }
    return setupData?.reviewLinks || defaultLinks
  }, [isApiMode, touchPageData, profileSettings, setupData])

  // ── Local state ──
  const [selectedStaffMembers, setSelectedStaffMembers] = useState(initialStaffMember ? [initialStaffMember] : [])
  const [step, setStep] = useState(initialStaffMember ? 'tip_amount' : 'select_staff')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTips, setSelectedTips] = useState(() => initialStaffMember ? { [initialStaffMember.id]: 15 } : {})
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
  const publicPaymentMethods = publicMethodsQuery.data ?? []

  const businessPaymentAccounts = useMemo(() => {
    const defaultAccounts = { venmo: '', cashapp: '', zelle: '', vlinkpay: '' }
    if (isApiMode && publicPaymentMethods.length > 0) {
      const accounts = { ...defaultAccounts }
      publicPaymentMethods.forEach(pm => {
        const key = (pm.type || pm.name || '').toLowerCase()
        if (accounts[key] !== undefined) accounts[key] = pm.accountInfo || ''
      })
      return accounts
    }
    if (profileSettings?.paymentAccounts) return profileSettings.paymentAccounts
    return setupData?.businessInfo?.paymentAccounts || defaultAccounts
  }, [isApiMode, publicPaymentMethods, profileSettings, setupData])

  const selectedStaffHasAnyPayment = useMemo(() => {
    if (selectedStaffMembers.length !== 1) return false
    const staff = selectedStaffMembers[0]
    if (isApiMode) {
      // API staff have availablePaymentMethods: string[]
      return Array.isArray(staff.availablePaymentMethods) && staff.availablePaymentMethods.length > 0
    }
    return Object.values(staff.paymentAccounts || {}).some(val => val && val.trim() !== '')
  }, [selectedStaffMembers, isApiMode])

  const qrCodeVal = useMemo(() => {
    if (!selectedWalletObj) return null
    if (selectedStaffMembers.length === 1 && selectedStaffHasAnyPayment) {
      const staff = selectedStaffMembers[0]
      return staff.payoutConfigs?.[selectedWalletObj.key]?.qrCode || staff.payoutQrCodes?.[selectedWalletObj.key] || null
    }
    return setupData?.businessInfo?.payoutQrCodes?.[selectedWalletObj.key] || null
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

  // ── Simulation handlers (extracted) ──
  const { simulatePay, simulateReview } = createSimulationHandlers({
    addTransactionMutation, addReviewMutation, addNotificationMutation,
    selectedStaffMembers, selectedTips, customTips, techSlug, setupData,
    setStep, setIsProcessing,
  })

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
    if (isApiMode) {
      try {
        const member = selectedStaffMembers[0]
        const selTip = selectedTips[member.id] !== undefined ? selectedTips[member.id] : 15
        const amount = selTip === 'custom' ? Number(customTips[member.id]) || 0 : selTip
        const result = await createTipMutation.mutateAsync({
          touchPointId: touchPageData.touchPoint.id, staffProfileId: member.id,
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
    } else {
      simulatePay(walletName)
    }
  }

  /** Confirms that customer completed external wallet payment (API mode). */
  const handleConfirmTip = async () => {
    if (isApiMode && currentTipId) {
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
    if (isApiMode) {
      try {
        const member = selectedStaffMembers[0]
        await skipTipMutation.mutateAsync({
          touchPointId: touchPageData.touchPoint.id, staffProfileId: member?.id, sessionId,
        })
      } catch (err) { logger.error('Failed to record skip-tip', err) }
    }
    setStep('leave_review')
  }

  /** Submits customer feedback review. */
  const handleSubmitFeedback = async () => {
    const cleanComment = comment.trim()
    if (isApiMode) {
      try {
        const member = selectedStaffMembers[0]
        const result = await createReviewMutationApi.mutateAsync({
          touchPointId: touchPageData.touchPoint.id, tipId: currentTipId || undefined,
          staffProfileId: member.id, rating,
          comment: cleanComment || (rating >= 4 ? 'Good service' : 'Needs improvement'),
        })
        setCurrentReviewId(result?.id || result?.reviewId)
        setStep(rating >= 4 ? 'google_yelp_review' : 'final_done')
      } catch (err) {
        logger.error('Failed to submit review', err)
        showToast(t('errors.generic'), 'error')
      }
    } else {
      const nextStep = simulateReview(rating, cleanComment)
      setStep(nextStep)
    }
  }

  /**
   * Tracks external review link click and navigates to final_done.
   * @param {'google'|'yelp'} platform
   */
  const handleTrackExternalReview = async (platform) => {
    if (isApiMode && currentReviewId) {
      try {
        if (platform === 'google') await trackGoogleMutation.mutateAsync(currentReviewId)
        if (platform === 'yelp') await trackYelpMutation.mutateAsync(currentReviewId)
      } catch (err) { logger.error(`Failed to track ${platform} review click`, err) }
    }
    setStep('final_done')
  }

  const handleReset = () => {
    setSelectedStaffMembers(initialStaffMember ? [initialStaffMember] : [])
    setStep(initialStaffMember ? 'tip_amount' : 'select_staff')
    setSelectedTips(initialStaffMember ? { [initialStaffMember.id]: 15 } : {})
    setCustomTips({}); setRating(5); setComment(''); setSelectedTags([])
    setSelectedWallet(''); setSelectedWalletObj(null); setTipRefNumber('')
    setCurrentTipId(null); setCurrentReviewId(null); setPaymentLinkData(null)
  }

  return {
    currentLanguage, setLanguage, t, showToast,
    isApiMode, touchPageQuery,
    params, techSlug, bizName, setupData, scannedTouchpoint, activeStaffList,
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
