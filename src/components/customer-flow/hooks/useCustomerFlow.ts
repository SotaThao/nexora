import { useState, useMemo, useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from '../../../contexts/LanguageContext'
import { useNotification } from '../../../contexts/NotificationContext'
import { logger } from '../../../utils/logger'
import { sanitizePlainText } from '../../../utils/sanitize'
import publicTouchRepository from '../../../data/repositories/publicTouch'
import { resolveTouchBusinessId } from '../../../data/repositories/normalizeTouchPage'
import merchantsRepository from '../../../data/repositories/merchants'
import { useMerchantSetup } from '../../../data/hooks/useMerchantSetup'
import {
  useCustomerTouchPage,
  useCreateTip,
  useConfirmTip,
  useCreateMultiStaffTip,
  useConfirmMultiStaffTip,
  useSkipTip,
  useCreateReview,
  useTrackGoogle,
  useTrackYelp,
  usePublicBusinessPaymentMethods,
} from '../../../data/hooks/usePublicTouch'
import { PAYOUT_UI_LABELS, payoutTypeToUiKey } from '../../../data/paymentMethodTypes'
import type { PaymentMethodDto } from '../../../types/domain'

function walletNameToKey(walletName: string): string {
  const match = Object.entries(PAYOUT_UI_LABELS).find(([, label]) => label === walletName)
  return match?.[0] ?? walletName.toLowerCase().replace(/\s+/g, '')
}

function resolveBusinessPaymentMethodId(
  methods: PaymentMethodDto[],
  walletKey: string,
): string | null {
  const normalizedKey = walletKey.toLowerCase()
  const match = methods.find((pm) => {
    if (!pm.id || pm.isActive === false) return false
    const uiKey = (pm.uiKey || payoutTypeToUiKey(pm.type)).toLowerCase()
    const typeKey = (pm.type || '').toLowerCase()
    const nameKey = (pm.name || '').toLowerCase().replace(/\s+/g, '')
    return uiKey === normalizedKey || typeKey === normalizedKey || nameKey === normalizedKey
  })
  return match?.id ?? null
}

function getStaffTipAmount(
  memberId: string,
  selectedTips: LooseObject,
  customTips: LooseObject,
): number {
  const selTip = selectedTips[memberId] !== undefined ? selectedTips[memberId] : 15
  return selTip === 'custom' ? Number(customTips[memberId]) || 0 : Number(selTip)
}

function collectStaffPaymentKeys(staffMembers: Array<{ availablePaymentMethods?: string[] }>): Set<string> {
  const keys = new Set<string>()
  for (const staff of staffMembers) {
    for (const method of staff.availablePaymentMethods || []) {
      keys.add(payoutTypeToUiKey(method))
    }
  }
  return keys
}

function collectBusinessPaymentKeys(methods: PaymentMethodDto[]): Set<string> {
  const keys = new Set<string>()
  for (const pm of methods) {
    if (!pm.id || pm.isActive === false) continue
    keys.add(payoutTypeToUiKey(pm.type || pm.name || ''))
  }
  return keys
}

function buildAvailablePaymentWalletKeys(
  selectedStaffMembers: Array<{ availablePaymentMethods?: string[] }>,
  effectivePaymentMethods: PaymentMethodDto[],
  isMultiStaff: boolean,
): Set<string> {
  if (!isMultiStaff && selectedStaffMembers.length === 1) {
    const staffKeys = collectStaffPaymentKeys(selectedStaffMembers)
    if (staffKeys.size > 0) return staffKeys
  }

  const businessKeys = collectBusinessPaymentKeys(effectivePaymentMethods)
  if (businessKeys.size > 0) return businessKeys

  if (isMultiStaff) {
    return new Set<string>()
  }

  return collectStaffPaymentKeys(selectedStaffMembers)
}

function slugify(value = ''): string {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

function getApiErrorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === 'object') {
    const apiErr = err as { message?: string; errorCode?: string }
    if (apiErr.message) return apiErr.message
    if (apiErr.errorCode && apiErr.errorCode !== 'HTTP_ERROR') return apiErr.errorCode
  }
  return fallback
}

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

  const queryBusinessId = useMemo(() => {
    const params = new URLSearchParams(window.location.search)
    return params.get('businessId')
  }, [])

  const preselectedStaffProfileId = useMemo(() => {
    const params = new URLSearchParams(window.location.search)
    return params.get('staffProfileId') || params.get('staffId')
  }, [])

  const didApplyStaffPreselect = useRef(false)

  // ── API data ──
  const touchPageQuery = useCustomerTouchPage({
    businessSlug: touchRoute?.businessSlug,
    touchPointSlug: touchRoute?.touchPointSlug,
    sessionId,
  })
  const touchPageData = touchPageQuery.data ?? null

  // ── API mutations ──
  const createTipMutation = useCreateTip()
  const confirmTipMutation = useConfirmTip()
  const createMultiStaffTipMutation = useCreateMultiStaffTip()
  const confirmMultiStaffTipMutation = useConfirmMultiStaffTip()
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
  const [selectedStaffMembers, setSelectedStaffMembers] = useState<any[]>([])
  const [step, setStep] = useState('select_staff')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTips, setSelectedTips] = useState<LooseObject>({})
  const [customTips, setCustomTips] = useState<LooseObject>({})
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [selectedTags, setSelectedTags] = useState<any[]>([])
  const [selectedWallet, setSelectedWallet] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [selectedWalletObj, setSelectedWalletObj] = useState<any | null>(null)
  const [tipRefNumber, setTipRefNumber] = useState('')
  const [currentTipId, setCurrentTipId] = useState<any | null>(null)
  const [currentReviewId, setCurrentReviewId] = useState<any | null>(null)
  const [paymentLinkData, setPaymentLinkData] = useState<any | null>(null)

  useEffect(() => {
    if (didApplyStaffPreselect.current || activeStaffList.length === 0) return

    const assignedStaffProfileId = touchPageData?.touchPoint?.assignedStaffProfileId
    const staffCardPreselectId =
      touchPageData?.touchPoint?.type === 'StaffCard' && assignedStaffProfileId
        ? String(assignedStaffProfileId)
        : null
    const preselectId = preselectedStaffProfileId || staffCardPreselectId
    if (!preselectId) return

    const match = activeStaffList.find(
      (staff) => String(staff.id) === preselectId,
    )
    if (!match) return

    didApplyStaffPreselect.current = true
    setSelectedStaffMembers([match])
    setSelectedTips((prev) => ({
      ...prev,
      [match.id]: prev[match.id] !== undefined ? prev[match.id] : 15,
    }))
    setStep('tip_amount')
  }, [preselectedStaffProfileId, activeStaffList, touchPageData])

  // ── Payment accounts ──
  const touchBusinessId = useMemo(
    () => resolveTouchBusinessId(touchPageData, touchRoute?.businessSlug, queryBusinessId),
    [touchPageData, touchRoute?.businessSlug, queryBusinessId],
  )

  const merchantSetupQuery = useMerchantSetup({
    enabled: Boolean(touchRoute?.businessSlug && !touchBusinessId),
  })

  const merchantProfileBusinessId = useMemo(() => {
    const info = merchantSetupQuery.data?.businessInfo as LooseObject | undefined
    const profileId = info?.businessId || info?.id
    if (!profileId || !touchRoute?.businessSlug) return null
    const profileSlug = slugify(String(info?.slug || info?.name || ''))
    return profileSlug === touchRoute.businessSlug ? String(profileId) : null
  }, [merchantSetupQuery.data, touchRoute?.businessSlug])

  const merchantBusinessQuery = useQuery({
    queryKey: ['merchantBusinessContext', touchRoute?.businessSlug],
    queryFn: () => merchantsRepository.getBusinessContext(),
    enabled: Boolean(
      touchRoute?.businessSlug &&
      !touchBusinessId &&
      !merchantProfileBusinessId &&
      merchantSetupQuery.isFetched &&
      !merchantSetupQuery.data,
    ),
    staleTime: 60_000,
    retry: false,
  })

  const merchantMatchedBusinessId = useMemo(() => {
    const ctx = merchantBusinessQuery.data
    if (!ctx?.id || !touchRoute?.businessSlug) return null
    const merchantSlug = slugify(ctx.slug || ctx.name)
    return merchantSlug === touchRoute.businessSlug ? ctx.id : null
  }, [merchantBusinessQuery.data, touchRoute?.businessSlug])

  const businessId =
    touchBusinessId ||
    merchantProfileBusinessId ||
    merchantMatchedBusinessId ||
    null
  const publicMethodsQuery = usePublicBusinessPaymentMethods(businessId)
  const publicPaymentMethods = publicMethodsQuery.data ?? []

  const touchPagePaymentMethods = touchPageData?.businessPaymentMethods ?? []
  const effectivePaymentMethods = useMemo(() => {
    if (touchPagePaymentMethods.length > 0) return touchPagePaymentMethods
    return publicPaymentMethods
  }, [touchPagePaymentMethods, publicPaymentMethods])

  const isMultiStaffSelection = selectedStaffMembers.length > 1

  const businessPaymentAccounts = useMemo(() => {
    const accounts: Record<string, string> = {}
    for (const pm of effectivePaymentMethods) {
      const key = payoutTypeToUiKey(pm.type || pm.name || '')
      accounts[key] = pm.accountInfo || ''
    }
    return accounts
  }, [effectivePaymentMethods])

  const availablePaymentWalletKeys = useMemo(
    () => buildAvailablePaymentWalletKeys(
      selectedStaffMembers,
      effectivePaymentMethods,
      isMultiStaffSelection,
    ),
    [selectedStaffMembers, effectivePaymentMethods, isMultiStaffSelection],
  )

  const multiStaffPaymentBlocked = useMemo(() => {
    if (!isMultiStaffSelection) return null
    const resolvingMerchantProfile =
      !touchBusinessId &&
      (merchantSetupQuery.isLoading || merchantBusinessQuery.isLoading)
    if (resolvingMerchantProfile && !businessId) return null
    if (!businessId) return 'missing_business'
    if (!publicMethodsQuery.isLoading && effectivePaymentMethods.length === 0) {
      return 'missing_payment_methods'
    }
    return null
  }, [
    isMultiStaffSelection,
    businessId,
    touchBusinessId,
    merchantSetupQuery.isLoading,
    merchantBusinessQuery.isLoading,
    publicMethodsQuery.isLoading,
    effectivePaymentMethods.length,
  ])

  const isPaymentMethodsLoading =
    publicMethodsQuery.isLoading ||
    (!touchBusinessId && (merchantSetupQuery.isLoading || merchantBusinessQuery.isLoading))

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
    if (selectedStaffMembers.length > 1) {
      const walletKey = selectedWalletObj.key.toLowerCase()
      const match = effectivePaymentMethods.find((pm) => {
        if (!pm.id || pm.isActive === false) return false
        const uiKey = (pm.uiKey || payoutTypeToUiKey(pm.type)).toLowerCase()
        return uiKey === walletKey
      })
      return match?.imageUrl || null
    }
    return null
  }, [selectedWalletObj, selectedStaffMembers, selectedStaffHasAnyPayment, effectivePaymentMethods])

  const filteredStaff = useMemo(() => {
    const query = searchQuery.toLowerCase()
    return activeStaffList.filter(s =>
      s.fullName.toLowerCase().includes(query) ||
      s.nickname.toLowerCase().includes(query) ||
      (s.position || '').toLowerCase().includes(query)
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
   * Handles wallet selection and initiates tip payment.
   * Single staff → POST /api/v1/touch/tip
   * Multi staff  → POST /api/v1/tips/multi-staff
   * @param {string} walletName - Payment wallet display name.
   * @param {string} [walletKey] - Wallet key for business payment method lookup.
   */
  const handlePay = async (walletName, walletKey?: string) => {
    setSelectedWallet(walletName)
    setStep('processing')
    const resolvedWalletKey = walletKey || walletNameToKey(walletName)

    try {
      if (selectedStaffMembers.length > 1) {
        const touchPointId = touchPageData?.touchPoint?.id
        if (!touchPointId) {
          showToast(t('customer.multi_staff_missing_touchpoint'), 'error')
          setStep('tip_amount')
          return
        }
        if (!businessId) {
          showToast(t('customer.multi_staff_missing_business'), 'error')
          setStep('tip_amount')
          return
        }

        const businessPaymentMethodId = resolveBusinessPaymentMethodId(
          effectivePaymentMethods,
          resolvedWalletKey,
        )
        if (!businessPaymentMethodId) {
          showToast(t('customer.multi_staff_missing_payment_method'), 'error')
          setStep('tip_amount')
          return
        }

        const tipItems = selectedStaffMembers.map((member) => ({
          staffProfileId: member.id,
          amount: getStaffTipAmount(member.id, selectedTips, customTips),
        }))

        const result = await createMultiStaffTipMutation.mutateAsync({
          businessId,
          touchPointId,
          businessPaymentMethodId,
          tipItems,
        })
        setCurrentTipId(result?.tipId || result?.id)
        setPaymentLinkData(null)
        setStep('wallet_details')
        return
      }

      const member = selectedStaffMembers[0]
      const amount = getStaffTipAmount(member.id, selectedTips, customTips)
      const result = await createTipMutation.mutateAsync({
        touchPointId: touchPageData?.touchPoint?.id, staffProfileId: member.id,
        amount, paymentMethod: walletName, sessionId,
      })
      setCurrentTipId(result?.id || result?.tipId)
      try {
        const linkData = await publicTouchRepository.getPaymentLink({
          staffId: member.id,
          method: walletName,
          amount,
        })
        setPaymentLinkData(linkData)
      } catch (linkErr) {
        logger.error('Failed to fetch payment link', linkErr)
      }
      setStep('wallet_details')
    } catch (err) {
      logger.error('Failed to create tip', err)
      showToast(getApiErrorMessage(err, t('errors.generic')), 'error')
      setStep('tip_amount')
    }
  }

  /** Confirms that customer completed external wallet payment. */
  const handleConfirmTip = async () => {
    if (currentTipId) {
      try {
        if (selectedStaffMembers.length > 1) {
          await confirmMultiStaffTipMutation.mutateAsync(currentTipId)
        } else {
          await confirmTipMutation.mutateAsync(currentTipId)
        }
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
      await skipTipMutation.mutateAsync({
        touchPointId: touchPageData?.touchPoint?.id, staffProfileId: member?.id, sessionId,
      })
    } catch (err) { logger.error('Failed to record skip-tip', err) }
    setStep('leave_review')
  }

  /** Submits customer feedback review. */
  const handleSubmitFeedback = async () => {
    const cleanComment = sanitizePlainText(comment)
    try {
      const member = selectedStaffMembers[0]
      const result = await createReviewMutationApi.mutateAsync({
        touchPointId: touchPageData?.touchPoint?.id, tipId: currentTipId || undefined,
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
    availablePaymentWalletKeys, isPaymentMethodsLoading, multiStaffPaymentBlocked,
    selectedStaffHasAnyPayment, qrCodeVal, filteredStaff,
    positiveTagKeys, negativeTagKeys, activeTipAmount, tipScreenTitle,
    selectedStaffMembers, setSelectedStaffMembers, step, setStep,
    searchQuery, setSearchQuery, selectedTips, setSelectedTips,
    customTips, setCustomTips, rating, setRating, comment, setComment,
    selectedTags, setSelectedTags, selectedWallet, setSelectedWallet,
    isProcessing, setIsProcessing, selectedWalletObj, setSelectedWalletObj,
    tipRefNumber, setTipRefNumber, currentTipId, currentReviewId,
    handleTagToggle, handleRatingChange, handleToggleStaff,
    handlePay, handleConfirmTip, handleSkipTip, handleSubmitFeedback,
    handleTrackExternalReview, handleReset, paymentLinkData,
    scannedTouchpoint: null,
  }
}
