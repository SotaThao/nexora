// useBusinessInfoForm — owns the "Business Information" card's edit state and
// save mutation. Extracted out of useSettingsForm.ts so the same card can be
// rendered both from Settings > Profile and from POS > General Settings
// without duplicating the save/validate logic (two independent mounts of this
// hook share the same underlying useMerchantSetup/useUpdateBusinessInfo query
// cache, so there is no parallel source of truth for the actual business data —
// only the local edit-form state is per-mount, which is expected for a form).
import { useState } from 'react'
import { useNotification } from '../../../contexts/NotificationContext'
import { useTranslation } from '../../../contexts/LanguageContext'
import { resolveEffectiveKybStatus } from '../../../utils/kybStatus'
import { useUpdateBusinessInfo, useUpdateBusinessLogo } from '../../../data/hooks/useMerchantSetup'
import { useVerifiedStatus } from '../../../data/hooks/useProfileSettings'
import { getApiErrorCode } from '../../../types/domain'
import { getErrorI18nKey } from '../../../data/errorCodes'
import { isValidEmail, isValidHttpUrl, isValidPhone } from '../../../utils/validation'

type SettingsFormErrors = Record<string, string>

const formValue = (input: unknown) => String(input ?? '').trim()

const KYB_EDITABLE_STATUSES = new Set(['basic', 'kyb_rejected', 'rejected'])

const validateBusinessForm = (form: LooseObject): SettingsFormErrors => {
  const errors: SettingsFormErrors = {}
  if (!formValue(form.businessName)) errors.businessName = 'required'
  else if (formValue(form.businessName).length < 2) errors.businessName = 'invalid'
  if (!formValue(form.businessPhone)) errors.businessPhone = 'required'
  else if (!isValidPhone(form.businessPhone)) errors.businessPhone = 'phone'
  if (!formValue(form.businessEmail)) errors.businessEmail = 'required'
  else if (!isValidEmail(form.businessEmail)) errors.businessEmail = 'email'
  if (formValue(form.businessWebsite) && !isValidHttpUrl(form.businessWebsite)) {
    errors.businessWebsite = 'url'
  }
  if (formValue(form.salesTaxRatePercent)) {
    const rate = Number(form.salesTaxRatePercent)
    if (Number.isNaN(rate) || rate < 0 || rate > 100) errors.salesTaxRatePercent = 'range'
  }
  return errors
}

type BusinessInfo = {
  businessName: string
  businessPhone: string
  businessEmail: string
  businessWebsite: string
  bookingNotificationPhone: string
  salesTaxRatePercent: string
}

export default function useBusinessInfoForm({
  setupData,
  verificationStatus,
}: {
  setupData?: LooseObject | null
  verificationStatus?: string
}) {
  const { t } = useTranslation()
  const { showToast: notify } = useNotification()
  const updateBusinessInfoMutation = useUpdateBusinessInfo()
  const updateBusinessLogoMutation = useUpdateBusinessLogo()
  const { data: verifiedStatusData } = useVerifiedStatus()

  const effectiveVerificationStatus = resolveEffectiveKybStatus(
    verificationStatus,
    verifiedStatusData?.status as string | undefined,
  )
  const canEditProfile = !KYB_EDITABLE_STATUSES.has(effectiveVerificationStatus)
    ? false
    : !verifiedStatusData
      ? true
      : verifiedStatusData.status === 'None' || verifiedStatusData.status === 'Rejected'

  const businessInfo: BusinessInfo = {
    businessName: setupData?.businessInfo?.name || '',
    businessPhone: setupData?.businessInfo?.phone || '',
    businessEmail: setupData?.reviewLinks?.feedbackEmail || '',
    businessWebsite: setupData?.businessInfo?.website || '',
    bookingNotificationPhone: setupData?.businessInfo?.bookingNotificationPhone || '',
    salesTaxRatePercent:
      setupData?.businessInfo?.salesTaxRatePercent != null
        ? String(setupData.businessInfo.salesTaxRatePercent)
        : '',
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

  const saveBusiness = (e: { preventDefault: () => void }, onSaved?: (next: BusinessInfo) => void) => {
    e.preventDefault()
    if (!canEditProfile) return
    const errors = validateBusinessForm(businessForm)
    setBusinessErrors(errors)
    if (Object.keys(errors).length > 0) return

    const next: BusinessInfo = {
      businessName: formValue(businessForm.businessName),
      businessPhone: formValue(businessForm.businessPhone),
      businessEmail: formValue(businessForm.businessEmail),
      businessWebsite: formValue(businessForm.businessWebsite),
      bookingNotificationPhone: formValue(businessForm.bookingNotificationPhone),
      salesTaxRatePercent: formValue(businessForm.salesTaxRatePercent),
    }
    updateBusinessInfoMutation.mutate(
      {
        name: next.businessName,
        phone: next.businessPhone || undefined,
        feedbackEmail: next.businessEmail || undefined,
        website: next.businessWebsite || undefined,
        bookingNotificationPhone: next.bookingNotificationPhone || undefined,
        salesTaxRatePercent: next.salesTaxRatePercent ? Number(next.salesTaxRatePercent) : undefined,
      },
      {
        onSuccess: () => {
          notify(t('components.settings.hooks.useSettingsForm.settingsUpdatedSuccessfully'))
          setIsEditingBusiness(false)
          onSaved?.(next)
        },
      },
    )
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
  }
}
