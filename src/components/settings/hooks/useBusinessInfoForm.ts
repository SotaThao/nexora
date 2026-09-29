// useBusinessInfoForm — owns the "Business Information" card's edit state and
// save mutation. Extracted out of useSettingsForm.ts so the same card can be
// rendered both from Settings > Profile and from POS > General Settings
// without duplicating the save/validate logic (two independent mounts of this
// hook share the same underlying useMerchantSetup/useUpdateBusinessInfo query
// cache, so there is no parallel source of truth for the actual business data —
// only the local edit-form state is per-mount, which is expected for a form).
import { useState } from 'react'
import { flushSync } from 'react-dom'
import { useNotification } from '../../../contexts/NotificationContext'
import { useTranslation } from '../../../contexts/LanguageContext'
import { resolveEffectiveKybStatus } from '../../../utils/kybStatus'
import { useUpdateBusinessInfo, useUpdateBusinessLogo, useUpdateReviewLinks } from '../../../data/hooks/useMerchantSetup'
import { useVerifiedStatus } from '../../../data/hooks/useProfileSettings'
import { getApiErrorCode } from '../../../types/domain'
import { getErrorI18nKey } from '../../../data/errorCodes'
import { isValidEmail, isValidHttpUrl, isValidPhone } from '../../../utils/validation'
import { scrollToElementById } from '../../../utils/scrollToElement'
import type { MapAddressParts } from '../../../utils/mapUrl'

type SettingsFormErrors = Record<string, string>

const formValue = (input: unknown) => String(input ?? '').trim()

/** Accept bare domains from KYB/SSO (e.g. "mysalon.com") by prefixing https://. */
const normalizeWebsiteUrl = (input: unknown) => {
  const raw = formValue(input)
  if (!raw) return ''
  if (/^https?:\/\//i.test(raw)) return raw
  return `https://${raw}`
}

/** Form field order (top → bottom) → input id in BusinessInfoCard. */
const BUSINESS_FIELD_SCROLL_IDS: Array<{ field: string; id: string }> = [
  { field: 'businessName', id: 'settings-business-name' },
  { field: 'businessPhone', id: 'settings-business-phone' },
  { field: 'businessEmail', id: 'settings-business-email' },
  { field: 'businessWebsite', id: 'settings-business-website' },
  { field: 'businessAddress.street', id: 'settings-business-address-street' },
  { field: 'businessAddress.city', id: 'settings-business-address-city' },
  { field: 'businessAddress.state', id: 'settings-business-address-state' },
  { field: 'businessAddress.zipCode', id: 'settings-business-address-zipCode' },
  { field: 'businessAddress.country', id: 'settings-business-address-country' },
  { field: 'googleReview', id: 'settings-business-google-review' },
  { field: 'yelpReview', id: 'settings-business-yelp-review' },
  { field: 'facebookReview', id: 'settings-business-facebook' },
  { field: 'instagramReview', id: 'settings-business-instagram' },
  { field: 'bookingNotificationPhone', id: 'settings-booking-notification-phone' },
  { field: 'salesTaxRatePercent', id: 'settings-sales-tax-rate-percent' },
]

const scrollToFirstBusinessError = (errors: SettingsFormErrors) => {
  const first = BUSINESS_FIELD_SCROLL_IDS.find(({ field }) => errors[field])
  if (!first) return
  // Defer until after React paints the error styles / aria-invalid.
  window.setTimeout(() => {
    scrollToElementById(first.id)
    const el = document.getElementById(first.id) as HTMLElement | null
    el?.focus?.({ preventScroll: true })
  }, 0)
}

const validateBusinessForm = (form: LooseObject, includeReviewLinks?: boolean): SettingsFormErrors => {
  const errors: SettingsFormErrors = {}
  if (!formValue(form.businessName)) errors.businessName = 'required'
  else if (formValue(form.businessName).length < 2) errors.businessName = 'invalid'
  if (!formValue(form.businessPhone)) errors.businessPhone = 'required'
  else if (!isValidPhone(form.businessPhone)) errors.businessPhone = 'phone'
  // Feedback email is optional on the API — only validate format when provided.
  if (formValue(form.businessEmail) && !isValidEmail(form.businessEmail)) {
    errors.businessEmail = 'email'
  }
  if (formValue(form.businessWebsite)) {
    const website = normalizeWebsiteUrl(form.businessWebsite)
    if (!isValidHttpUrl(website)) errors.businessWebsite = 'url'
  }
  if (includeReviewLinks) {
    if (formValue(form.googleReview) && !isValidHttpUrl(form.googleReview)) errors.googleReview = 'url'
    if (formValue(form.yelpReview) && !isValidHttpUrl(form.yelpReview)) errors.yelpReview = 'url'
    if (formValue(form.facebookReview) && !isValidHttpUrl(form.facebookReview)) errors.facebookReview = 'url'
    if (formValue(form.instagramReview) && !isValidHttpUrl(form.instagramReview)) errors.instagramReview = 'url'
  }
  if (formValue(form.salesTaxRatePercent)) {
    const rate = Number(form.salesTaxRatePercent)
    if (Number.isNaN(rate) || rate < 0 || rate > 100) errors.salesTaxRatePercent = 'range'
  }
  for (const [field, limit] of Object.entries({ street: 300, city: 100, state: 50, zipCode: 20, country: 100 })) {
    if (formValue(form.businessAddress?.[field]).length > limit) errors[`businessAddress.${field}`] = 'invalid'
  }
  return errors
}

type BusinessInfo = {
  businessAddress: MapAddressParts
  businessName: string
  businessPhone: string
  businessEmail: string
  businessWebsite: string
  bookingNotificationPhone: string
  salesTaxRatePercent: string
  googleReview: string
  yelpReview: string
  facebookReview: string
  instagramReview: string
}

export default function useBusinessInfoForm({
  setupData,
  verificationStatus,
  includeReviewLinks,
  /** POS Salon Information only — bypass KYB lock; saves stay Nexora-local (no SSO). */
  allowEditAfterKyb = false,
}: {
  setupData?: LooseObject | null
  verificationStatus?: string
  includeReviewLinks?: boolean
  allowEditAfterKyb?: boolean
}) {
  const { t } = useTranslation()
  const { showToast: notify } = useNotification()
  const updateBusinessInfoMutation = useUpdateBusinessInfo()
  const updateReviewLinksMutation = useUpdateReviewLinks()
  const updateBusinessLogoMutation = useUpdateBusinessLogo()
  const { data: verifiedStatusData } = useVerifiedStatus()

  const effectiveVerificationStatus = resolveEffectiveKybStatus(
    verificationStatus,
    verifiedStatusData?.status as string | undefined,
  )

  // Settings > Profile keeps the KYB lock. POS > Salon Information opts out via
  // allowEditAfterKyb; those saves are still Nexora-local and never push to SSO.
  const KYB_EDITABLE_STATUSES = new Set(['basic', 'kyb_rejected', 'rejected'])
  const canEditProfile = allowEditAfterKyb
    ? true
    : !KYB_EDITABLE_STATUSES.has(effectiveVerificationStatus)
      ? false
      : !verifiedStatusData
        ? true
        : verifiedStatusData.status === 'None' || verifiedStatusData.status === 'Rejected'

  const businessInfo: BusinessInfo = {
    businessAddress: {
      street: setupData?.businessInfo?.address || '',
      city: setupData?.businessInfo?.city || '',
      state: setupData?.businessInfo?.state || '',
      zipCode: setupData?.businessInfo?.zipCode || '',
      country: setupData?.businessInfo?.country || '',
    },
    businessName: setupData?.businessInfo?.name || '',
    businessPhone: setupData?.businessInfo?.phone || '',
    businessEmail: setupData?.reviewLinks?.feedbackEmail || '',
    businessWebsite: setupData?.businessInfo?.website || '',
    bookingNotificationPhone: setupData?.businessInfo?.bookingNotificationPhone || '',
    salesTaxRatePercent:
      setupData?.businessInfo?.salesTaxRatePercent != null
        ? String(setupData.businessInfo.salesTaxRatePercent)
        : '',
    googleReview: includeReviewLinks ? setupData?.reviewLinks?.googleReview || '' : '',
    yelpReview: includeReviewLinks ? setupData?.reviewLinks?.yelpReview || '' : '',
    facebookReview: includeReviewLinks ? setupData?.reviewLinks?.facebookReview || '' : '',
    instagramReview: includeReviewLinks ? setupData?.reviewLinks?.instagramReview || '' : '',
  }

  const logoUrl: string | null = setupData?.businessInfo?.logo || null

  const handleLogoChange = async (e: { target: { value: string; files?: FileList | null } }) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      await updateBusinessLogoMutation.mutateAsync(file)
      notify(t('components.settings.hooks.useSettingsForm.settingsUpdatedSuccessfully'))
    } catch (err: unknown) {
      notify(t(getErrorI18nKey(getApiErrorCode(err, 'IMAGE_UPLOAD_FAILED'))), 'error')
    } finally {
      e.target.value = ''
    }
  }

  const [isEditingBusiness, setIsEditingBusiness] = useState(false)
  const [businessForm, setBusinessForm] = useState<LooseObject>({})
  const [businessErrors, setBusinessErrors] = useState<SettingsFormErrors>({})

  const startEditBusiness = () => {
    if (!canEditProfile) return
    setBusinessErrors({})
    setBusinessForm({ ...businessInfo })
    setIsEditingBusiness(true)
  }

  const saveBusiness = async (e: { preventDefault: () => void }, onSaved?: (next: BusinessInfo) => void) => {
    e.preventDefault()
    if (!canEditProfile) return
    const errors = validateBusinessForm(businessForm, includeReviewLinks)
    if (Object.keys(errors).length > 0) {
      // No toast/popup — jump to the first invalid field.
      flushSync(() => setBusinessErrors(errors))
      scrollToFirstBusinessError(errors)
      return
    }
    setBusinessErrors({})

    const next: BusinessInfo = {
      businessAddress: {
        street: formValue(businessForm.businessAddress?.street),
        city: formValue(businessForm.businessAddress?.city),
        state: formValue(businessForm.businessAddress?.state),
        zipCode: formValue(businessForm.businessAddress?.zipCode),
        country: formValue(businessForm.businessAddress?.country),
      },
      businessName: formValue(businessForm.businessName),
      businessPhone: formValue(businessForm.businessPhone),
      businessEmail: formValue(businessForm.businessEmail),
      businessWebsite: normalizeWebsiteUrl(businessForm.businessWebsite),
      bookingNotificationPhone: formValue(businessForm.bookingNotificationPhone),
      salesTaxRatePercent: formValue(businessForm.salesTaxRatePercent),
      googleReview: formValue(businessForm.googleReview),
      yelpReview: formValue(businessForm.yelpReview),
      facebookReview: formValue(businessForm.facebookReview),
      instagramReview: formValue(businessForm.instagramReview),
    }
    const savePromises: Array<Promise<unknown>> = [
      updateBusinessInfoMutation.mutateAsync({
        address: next.businessAddress.street,
        city: next.businessAddress.city,
        state: next.businessAddress.state,
        zipCode: next.businessAddress.zipCode,
        country: next.businessAddress.country,
        name: next.businessName,
        phone: next.businessPhone || undefined,
        feedbackEmail: next.businessEmail || undefined,
        website: next.businessWebsite || undefined,
        bookingNotificationPhone: next.bookingNotificationPhone || undefined,
        salesTaxRatePercent: next.salesTaxRatePercent ? Number(next.salesTaxRatePercent) : undefined,
      }),
    ]
    if (includeReviewLinks) {
      savePromises.push(
        updateReviewLinksMutation.mutateAsync({
          googleReviewUrl: next.googleReview || undefined,
          yelpUrl: next.yelpReview || undefined,
          facebookUrl: next.facebookReview || undefined,
          instagramUrl: next.instagramReview || undefined,
          // Round-trip FeedbackEmail: omitting it used to bind as null on the API and wipe the
          // value (same defect BookingSettingsPanel hit when saving Voice config).
          feedbackEmail: next.businessEmail || undefined,
        }),
      )
    }

    const results = await Promise.allSettled(savePromises)
    const failures = results.filter(
      (result): result is PromiseRejectedResult => result.status === 'rejected',
    )

    if (failures.length === 0) {
      notify(t('components.settings.hooks.useSettingsForm.settingsUpdatedSuccessfully'))
      setIsEditingBusiness(false)
      onSaved?.(next)
    } else if (failures.length === results.length) {
      notify(t(getErrorI18nKey(getApiErrorCode(failures[0].reason))), 'error')
    } else {
      notify(t('components.settings.hooks.useSettingsForm.partialSaveFailed'), 'error')
    }
  }

  return {
    businessInfo,
    logoUrl,
    handleLogoChange,
    isUploadingLogo: updateBusinessLogoMutation.isPending,
    isEditingBusiness,
    setIsEditingBusiness,
    businessForm,
    setBusinessForm,
    businessErrors,
    setBusinessErrors,
    startEditBusiness,
    saveBusiness,
    canEditProfile,
    effectiveVerificationStatus,
  }
}
