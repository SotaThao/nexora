import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
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
import { formatPaymentMethodAccountDisplay } from '../../payout/bankWireAccount'
import type { PaymentMethodDto, ReviewLinks } from '../../../types/domain'
import {
  isTouchPaymentIntent,
  isTouchReviewIntent,
  resolvePaymentCopyScope,
  resolveTouchpointRedirectUrl,
} from '../../../utils/customerFlowKind'
import { WALLET_KEYS } from '../constants'
import { randomUuid } from '../../../utils/uuid'
import {
  emptyVlinkpayAddresses,
  getSingleConfiguredVlinkpayCoin,
  normalizeVlinkpayCryptoSymbol,
  resolvePreferredVlinkpayAddresses,
  resolveVlinkpayAddresses,
  withWalletCryptoSymbol,
} from '../../payout/vlinkpayWallet'

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

function collectStaffPaymentKeys(staffMembers: Array<{ availablePaymentMethods?: string[] }>): string[] {
  const keys: string[] = []
  const seen = new Set<string>()
  for (const staff of staffMembers) {
    for (const method of staff.availablePaymentMethods || []) {
      const key = payoutTypeToUiKey(method)
      if (seen.has(key)) continue
      seen.add(key)
      keys.push(key)
    }
  }
  return keys
}

function collectStaffPaymentKeysForMember(staff: { availablePaymentMethods?: string[] }): string[] {
  const keys: string[] = []
  const seen = new Set<string>()
  for (const method of staff.availablePaymentMethods || []) {
    const key = payoutTypeToUiKey(method)
    if (seen.has(key)) continue
    seen.add(key)
    keys.push(key)
  }
  return keys
}

function collectBusinessPaymentKeys(methods: PaymentMethodDto[]): string[] {
  const keys: string[] = []
  const seen = new Set<string>()
  for (const pm of methods) {
    if (!pm.id || pm.isActive === false) continue
    const key = payoutTypeToUiKey(pm.type || pm.name || '')
    if (seen.has(key)) continue
    seen.add(key)
    keys.push(key)
  }
  return keys
}

function buildAvailablePaymentWalletKeys(
  selectedStaffMembers: Array<{ availablePaymentMethods?: string[] }>,
  effectivePaymentMethods: PaymentMethodDto[],
  isMultiStaff: boolean,
): string[] {
  if (!isMultiStaff && selectedStaffMembers.length === 1) {
    const staffKeys = collectStaffPaymentKeysForMember(selectedStaffMembers[0])
    if (staffKeys.length > 0) return staffKeys
  }

  const businessKeys = collectBusinessPaymentKeys(effectivePaymentMethods)
  if (businessKeys.length > 0) return businessKeys

  if (isMultiStaff) {
    return []
  }

  return collectStaffPaymentKeys(selectedStaffMembers)
}

function slugify(value = ''): string {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

function getApiErrorMessage(err: unknown, fallback: string, t?: (key: string) => string): string {
  if (err && typeof err === 'object') {
    const apiErr = err as { message?: string; errorCode?: string }
    if (apiErr.errorCode && apiErr.errorCode !== 'HTTP_ERROR') {
      if (t) {
        const key = `errors.${apiErr.errorCode}`
        const translated = t(key)
        if (translated && translated !== key) return translated
      }
      return apiErr.errorCode
    }
    if (apiErr.message) return apiErr.message
  }
  return fallback
}

function firstNonEmptyString(...values: unknown[]): string {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim()
  }
  return ''
}

function resolveCustomerReviewLinks(source: LooseObject | null | undefined): ReviewLinks {
  const business = source?.business || source?.businessInfo || {}
  const reviewLinks = source?.reviewLinks || business.reviewLinks || {}

  return {
    googleReview: firstNonEmptyString(
      business.googleReviewUrl,
      business.googleReview,
      business.googleReviewLink,
      reviewLinks.googleReview,
      reviewLinks.googleReviewUrl,
      reviewLinks.googleReviewLink,
      source?.googleReviewUrl,
      source?.googleReview,
      source?.googleReviewLink,
    ),
    yelpReview: firstNonEmptyString(
      business.yelpUrl,
      business.yelpReview,
      business.yelpReviewUrl,
      business.yelpReviewLink,
      reviewLinks.yelpReview,
      reviewLinks.yelpUrl,
      reviewLinks.yelpReviewUrl,
      reviewLinks.yelpReviewLink,
      source?.yelpUrl,
      source?.yelpReview,
      source?.yelpReviewUrl,
      source?.yelpReviewLink,
    ),
    feedbackEmail: firstNonEmptyString(
      business.feedbackEmail,
      reviewLinks.feedbackEmail,
      source?.feedbackEmail,
    ),
  }
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
    return params.get('sessionId') || randomUuid()
  }, [])

  const touchSearchParams = useMemo(
    () => new URLSearchParams(window.location.search),
    [],
  )

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

  const isPaymentFlow = useMemo(
    () => isTouchPaymentIntent(touchSearchParams, touchPageData),
    [touchSearchParams, touchPageData],
  )

  const isReviewFlow = useMemo(
    () => isTouchReviewIntent(touchSearchParams),
    [touchSearchParams],
  )

  useEffect(() => {
    if (!touchPageQuery.isSuccess || !touchPageData) return
    // Carry the touch context so /pay can load this touchpoint's tippable staff.
    const redirectPath = resolveTouchpointRedirectUrl(touchPageData, undefined, {
      businessSlug: touchRoute?.businessSlug,
      touchPointSlug: touchRoute?.touchPointSlug,
      sessionId,
    })
    if (!redirectPath) return
    const currentPath = `${window.location.pathname}${window.location.search}`
    if (currentPath === redirectPath) return
    window.location.replace(redirectPath)
  }, [touchPageQuery.isSuccess, touchPageData, touchRoute, sessionId])

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

  const touchReviewLinks = useMemo(
    () => resolveCustomerReviewLinks(touchPageData),
    [touchPageData],
  )
  const hasTouchReviewLinks = Boolean(touchReviewLinks.googleReview || touchReviewLinks.yelpReview)

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
  const [selectedCryptoSymbol, setSelectedCryptoSymbol] = useState<string | null>(null)
  const [tipRefNumber, setTipRefNumber] = useState('')
  const [currentTipId, setCurrentTipId] = useState<any | null>(null)
  const [currentReviewId, setCurrentReviewId] = useState<any | null>(null)
  const [paymentLinkData, setPaymentLinkData] = useState<any | null>(null)
  const [tipPaymentMethodsData, setTipPaymentMethodsData] = useState<any[] | null>(null)
  const vlinkpayCreateInFlightRef = useRef(false)

  const paymentCopyScope = useMemo(
    () => resolvePaymentCopyScope(isPaymentFlow, selectedStaffMembers.length),
    [isPaymentFlow, selectedStaffMembers.length],
  )

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
    enabled: Boolean(touchRoute?.businessSlug && (!touchBusinessId || !hasTouchReviewLinks)),
  })

  const merchantProfileBusinessId = useMemo(() => {
    const info = merchantSetupQuery.data?.businessInfo as LooseObject | undefined
    const profileId = info?.businessId || info?.id
    if (!profileId || !touchRoute?.businessSlug) return null
    if (touchBusinessId && String(profileId) === String(touchBusinessId)) return String(profileId)
    const profileSlug = slugify(String(info?.slug || info?.name || ''))
    return profileSlug === touchRoute.businessSlug ? String(profileId) : null
  }, [merchantSetupQuery.data, touchBusinessId, touchRoute?.businessSlug])

  const merchantSetupReviewLinks = useMemo(
    () => merchantProfileBusinessId
      ? resolveCustomerReviewLinks(merchantSetupQuery.data as LooseObject | null | undefined)
      : { googleReview: '', yelpReview: '', feedbackEmail: '' },
    [merchantSetupQuery.data, merchantProfileBusinessId],
  )
  const reviewLinks = useMemo(() => ({
    googleReview: touchReviewLinks.googleReview || merchantSetupReviewLinks.googleReview || '',
    yelpReview: touchReviewLinks.yelpReview || merchantSetupReviewLinks.yelpReview || '',
    feedbackEmail: touchReviewLinks.feedbackEmail || merchantSetupReviewLinks.feedbackEmail || '',
  }), [touchReviewLinks, merchantSetupReviewLinks])

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
    if (publicPaymentMethods.length > 0) return publicPaymentMethods
    if (touchPagePaymentMethods.length > 0) return touchPagePaymentMethods
    return []
  }, [touchPagePaymentMethods, publicPaymentMethods])

  const isMultiStaffSelection = selectedStaffMembers.length > 1

  const businessPaymentAccounts = useMemo(() => {
    const accounts: Record<string, string> = {}
    for (const pm of effectivePaymentMethods) {
      const key = payoutTypeToUiKey(pm.type || pm.name || '')
      accounts[key] = formatPaymentMethodAccountDisplay(
        key,
        pm.accountInfo,
        pm.cryptoAddresses,
      ) || pm.accountInfo || ''
    }
    return accounts
  }, [effectivePaymentMethods])

  const businessVlinkpayCryptoAddresses = useMemo(() => {
    const isVlinkpayMethod = (method: PaymentMethodDto) => {
      if (!method.id) return false
      const key = payoutTypeToUiKey(method.type || method.name || method.uiKey || '')
      return key === WALLET_KEYS.VLINKPAY && Array.isArray(method.cryptoAddresses) && method.cryptoAddresses.length > 0
    }
    const active = effectivePaymentMethods.find((method) => isVlinkpayMethod(method) && method.isActive !== false)
    return (active || effectivePaymentMethods.find(isVlinkpayMethod))?.cryptoAddresses ?? null
  }, [effectivePaymentMethods])

  const customerVlinkpayAddresses = useMemo(() => {
    const empty = emptyVlinkpayAddresses()
    const fromStaff =
      !isMultiStaffSelection && selectedStaffMembers.length === 1
        ? resolveVlinkpayAddresses({
            cryptoAddresses: selectedStaffMembers[0]?.vlinkPayCryptoAddresses,
          })
        : empty
    const fromBusiness = resolveVlinkpayAddresses({
      cryptoAddresses: businessVlinkpayCryptoAddresses,
    })
    return !isMultiStaffSelection
      ? resolvePreferredVlinkpayAddresses(fromStaff, fromBusiness)
      : fromBusiness
  }, [isMultiStaffSelection, selectedStaffMembers, businessVlinkpayCryptoAddresses])

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

  const canSelectMultipleStaff = useMemo(() => {
    const resolvingMerchantProfile =
      !touchBusinessId &&
      (merchantSetupQuery.isLoading || merchantBusinessQuery.isLoading)
    if (resolvingMerchantProfile && !businessId) return true
    if (!businessId) return false
    if (!publicMethodsQuery.isLoading && effectivePaymentMethods.length === 0) {
      return false
    }
    return true
  }, [
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

  const createTipForWallet = useCallback(async (walletKey: string, cryptoSymbol?: string) => {
    if (selectedStaffMembers.length > 1) {
      const touchPointId = touchPageData?.touchPoint?.id
      if (!touchPointId) {
        showToast(t('customer.multi_staff_missing_touchpoint'), 'error')
        return null
      }
      if (!businessId) {
        showToast(t('customer.multi_staff_missing_business'), 'error')
        return null
      }

      const businessPaymentMethodId = resolveBusinessPaymentMethodId(
        effectivePaymentMethods,
        walletKey,
      )
      if (!businessPaymentMethodId) {
        showToast(t('customer.multi_staff_missing_payment_method'), 'error')
        return null
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
        ...(cryptoSymbol ? { cryptoSymbol } : {}),
      })
      const tipId = String(result?.tipId || result?.id || '')
      setPaymentLinkData(
        cryptoSymbol && result?.cryptoAddress
          ? { cryptoAddress: result.cryptoAddress }
          : null,
      )
      return tipId || null
    }

    const member = selectedStaffMembers[0]
    const amount = getStaffTipAmount(member.id, selectedTips, customTips)
    const result = await createTipMutation.mutateAsync({
      touchPointId: touchPageData?.touchPoint?.id,
      staffProfileId: member.id,
      amount,
      paymentMethod: walletKey,
      sessionId,
      ...(cryptoSymbol ? { cryptoSymbol } : {}),
    })
    return String(result?.id || result?.tipId || '') || null
  }, [
    businessId,
    createMultiStaffTipMutation,
    createTipMutation,
    customTips,
    effectivePaymentMethods,
    selectedStaffMembers,
    selectedTips,
    sessionId,
    showToast,
    t,
    touchPageData,
  ])

  const loadTipPaymentMethods = useCallback(async (tipId: string) => {
    try {
      const methods = await publicTouchRepository.getTipPaymentMethods(tipId)
      setTipPaymentMethodsData(Array.isArray(methods) ? methods : null)
    } catch (methodsErr) {
      logger.error('Failed to fetch tip payment methods', methodsErr)
      setTipPaymentMethodsData(null)
    }
  }, [])

  /**
   * Handles wallet selection and initiates tip payment.
   * Single staff → POST /api/v1/touch/tip
   * Multi staff  → POST /api/v1/tips/multi-staff
   * VlinkPay with one configured asset → create tip immediately and skip asset picker.
   * VlinkPay with multiple assets → asset picker first, tip created on Confirm.
   */
  const handlePay = useCallback(async (walletName, walletKey?: string) => {
    setSelectedWallet(walletName)
    const resolvedWalletKey = walletKey || walletNameToKey(walletName)

    if (resolvedWalletKey === WALLET_KEYS.VLINKPAY) {
      const singleCoin = getSingleConfiguredVlinkpayCoin(customerVlinkpayAddresses)

      if (singleCoin) {
        const symbol = singleCoin.symbol
        setIsProcessing(true)
        try {
          const tipId = await createTipForWallet(WALLET_KEYS.VLINKPAY, symbol)
          if (!tipId) return
          setCurrentTipId(tipId)
          setSelectedCryptoSymbol(symbol)
          setSelectedWalletObj((current) => withWalletCryptoSymbol(current, symbol))
          await loadTipPaymentMethods(tipId)
          setStep('wallet_details')
        } catch (err) {
          logger.error('Failed to create VlinkPay tip', err)
          showToast(getApiErrorMessage(err, t('errors.generic'), t), 'error')
        } finally {
          setIsProcessing(false)
        }
        return
      }

      vlinkpayCreateInFlightRef.current = false
      setPaymentLinkData(null)
      setTipPaymentMethodsData(null)
      setCurrentTipId(null)
      setSelectedCryptoSymbol(null)
      setStep('wallet_details')
      return
    }

    setIsProcessing(true)
    setSelectedCryptoSymbol(null)

    try {
      const tipId = await createTipForWallet(resolvedWalletKey)
      if (!tipId) return
      setCurrentTipId(tipId)
      await loadTipPaymentMethods(String(tipId))
      setStep('wallet_details')
    } catch (err) {
      logger.error('Failed to create tip', err)
      showToast(getApiErrorMessage(err, t('errors.generic'), t), 'error')
    } finally {
      setIsProcessing(false)
    }
  }, [createTipForWallet, customerVlinkpayAddresses, loadTipPaymentMethods, showToast, t])

  /**
   * VlinkPay asset Confirm: POST /touch/tip (or multi-staff) with cryptoSymbol.
   */
  const handleCreateVlinkpayTip = useCallback(async (cryptoSymbol: string) => {
    const normalizedSymbol = normalizeVlinkpayCryptoSymbol(cryptoSymbol)
    if (!normalizedSymbol) {
      showToast(t('errors.TIP_CRYPTO_SYMBOL_REQUIRED'), 'error')
      return false
    }
    if (vlinkpayCreateInFlightRef.current) return false

    vlinkpayCreateInFlightRef.current = true
    setIsProcessing(true)

    try {
      const tipId = await createTipForWallet(WALLET_KEYS.VLINKPAY, normalizedSymbol)
      if (!tipId) return false

      setCurrentTipId(tipId)
      setSelectedCryptoSymbol(normalizedSymbol)
      setSelectedWalletObj((current) => withWalletCryptoSymbol(current, normalizedSymbol))
      await loadTipPaymentMethods(tipId)
      return true
    } catch (err) {
      logger.error('Failed to create VlinkPay tip', err)
      showToast(getApiErrorMessage(err, t('errors.generic'), t), 'error')
      setCurrentTipId(null)
      return false
    } finally {
      vlinkpayCreateInFlightRef.current = false
      setIsProcessing(false)
    }
  }, [createTipForWallet, loadTipPaymentMethods, showToast, t])

  const handleResetVlinkpayTip = useCallback(() => {
    vlinkpayCreateInFlightRef.current = false
    setCurrentTipId(null)
    setTipPaymentMethodsData(null)
    setPaymentLinkData(null)
    setSelectedCryptoSymbol(null)
    setSelectedWalletObj((current) => withWalletCryptoSymbol(current, null))
  }, [])

  const isConfirmingTip = confirmTipMutation.isPending || confirmMultiStaffTipMutation.isPending

  /** Confirms that customer completed external wallet payment. */
  const handleConfirmTip = async () => {
    if (isConfirmingTip) return
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
    if (skipTipMutation.isPending) return
    try {
      const member = selectedStaffMembers[0]
      await skipTipMutation.mutateAsync({
        touchPointId: touchPageData?.touchPoint?.id, staffProfileId: member?.id, sessionId,
      })
    } catch (err) { logger.error('Failed to record skip-tip', err) }
    setStep('leave_review')
  }

  const handleStaffSelectionNext = () => {
    if (isReviewFlow) {
      handleSkipTip()
      return
    }
    setStep('tip_amount')
  }

  /** Submits customer feedback review. */
  const handleSubmitFeedback = async () => {
    if (createReviewMutationApi.isPending) return
    const cleanComment = sanitizePlainText(comment)
    try {
      const member = selectedStaffMembers[0]
      const result = await createReviewMutationApi.mutateAsync({
        touchPointId: touchPageData?.touchPoint?.id, tipId: currentTipId || undefined,
        staffProfileId: member.id, rating,
        comment: cleanComment || (rating >= 4 ? 'Good service' : 'Needs improvement'),
      })
      setCurrentReviewId(result?.id || result?.reviewId)
      const hasReviewLinks = Boolean(reviewLinks.googleReview || reviewLinks.yelpReview)
      setStep(rating >= 4 && hasReviewLinks ? 'google_yelp_review' : 'final_done')
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
    if (trackGoogleMutation.isPending || trackYelpMutation.isPending) return
    if (currentReviewId) {
      try {
        if (platform === 'google') await trackGoogleMutation.mutateAsync(currentReviewId)
        if (platform === 'yelp') await trackYelpMutation.mutateAsync(currentReviewId)
      } catch (err) { logger.error(`Failed to track ${platform} review click`, err) }
    }
    setStep('final_done')
  }

  // To preserve backwards compatibility with tests and consumers, we export 'isApiMode' as true
  return {
    currentLanguage, setLanguage, t, showToast,
    isApiMode: true, touchPageQuery,
    businessSlug: touchRoute?.businessSlug ?? null,
    bizName, activeStaffList,
    initialStaffMember, reviewLinks, businessPaymentAccounts,
    businessVlinkpayCryptoAddresses,
    availablePaymentWalletKeys, isPaymentMethodsLoading, multiStaffPaymentBlocked,
    selectedStaffHasAnyPayment, qrCodeVal, filteredStaff,
    positiveTagKeys, negativeTagKeys, activeTipAmount, tipScreenTitle,
    selectedStaffMembers, setSelectedStaffMembers, step, setStep,
    searchQuery, setSearchQuery, selectedTips, setSelectedTips,
    customTips, setCustomTips, rating, setRating, comment, setComment,
    selectedTags, setSelectedTags, selectedWallet, setSelectedWallet,
    isProcessing, setIsProcessing, selectedWalletObj, setSelectedWalletObj,
    selectedCryptoSymbol,
    tipRefNumber, setTipRefNumber, currentTipId, currentReviewId,
    isConfirmingTip, isSubmittingReview: createReviewMutationApi.isPending,
    handleTagToggle, handleRatingChange, handleToggleStaff,
    handlePay, handleConfirmTip, handleSkipTip, handleSubmitFeedback,
    handleTrackExternalReview, paymentLinkData, tipPaymentMethodsData,
    scannedTouchpoint: null,
    canSelectMultipleStaff,
    isPaymentFlow,
    isReviewFlow,
    handleStaffSelectionNext,
    paymentCopyScope,
    handleCreateVlinkpayTip,
    handleResetVlinkpayTip,
  }
}
