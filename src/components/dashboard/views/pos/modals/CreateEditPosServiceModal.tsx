// POS adapts its API state to the shared AI Hub service editor. POS-only tags
// and add-ons use the extension slot; status uses the shared name-row action slot.
import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { useTranslation } from '../../../../../contexts/LanguageContext'
import type {
  PosCategoryApiDto,
  PosServiceApiDto,
  PosServiceStatus,
  PosTagApiDto,
} from '../../../../../types/repositories'
import type { PosServiceInput } from '../../../../../data/repositories/posServices'
import { SHOW_SERVICE_ADD_ONS } from '../../../../../constants/posFeatureVisibility'
import ToggleSwitch from '../../../../ui/ToggleSwitch'
import {
  ServicesPricingFieldLabel,
  ServicesPricingServiceModal,
  SERVICE_PRICE_INPUT_MAX_LENGTH,
  normalizeServicesPricingPrice,
  type ServicesPricingServiceModalField,
  type ServicesPricingServiceModalFieldErrors,
} from '../../services/ServicesPricingServiceEditor'
import ServiceAddOnsSection from '../ServiceAddOnsSection'

const AI_TK = 'components.dashboard.views.BookingHubView.settings'
const POS_TK = 'components.dashboard.views.pos.PosServicesView'

export default function CreateEditPosServiceModal({
  open,
  onClose,
  onSubmit,
  isSubmitting,
  categories,
  tagSuggestions,
  service,
  defaultCategoryId,
}: {
  open: boolean
  onClose: () => void
  onSubmit: (input: PosServiceInput) => void
  isSubmitting: boolean
  categories: PosCategoryApiDto[]
  tagSuggestions: PosTagApiDto[]
  service?: PosServiceApiDto | null
  defaultCategoryId?: string | null
}) {
  const { t } = useTranslation()
  const isEditMode = Boolean(service)
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [supplyFee, setSupplyFee] = useState('0')
  const [durationMinutes, setDurationMinutes] = useState('')
  const [description, setDescription] = useState('')
  const [categoryIds, setCategoryIds] = useState<Set<string>>(new Set())
  const [tags, setTags] = useState<string[]>([])
  const [tagDraft, setTagDraft] = useState('')
  const [status, setStatus] = useState<PosServiceStatus>('Active')
  const [requireCustomerApproval, setRequireCustomerApproval] = useState(false)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<ServicesPricingServiceModalFieldErrors>({})
  const [categoriesError, setCategoriesError] = useState('')
  const [supplyFeeError, setSupplyFeeError] = useState('')

  useEffect(() => {
    if (!open) return
    setName(service?.name ?? '')
    setPrice(service ? String(service.price) : '')
    setSupplyFee(service ? String(service.supplyFee) : '0')
    setDurationMinutes(service ? String(service.durationMinutes) : '')
    setDescription(service?.description ?? '')
    const assignedCategoryIds = service?.categoryIds.length
      ? service.categoryIds
      : defaultCategoryId
        ? [defaultCategoryId]
        : []
    setCategoryIds(new Set(assignedCategoryIds))
    setTags(service?.tags ?? [])
    setTagDraft('')
    setStatus(service?.status ?? 'Active')
    setRequireCustomerApproval(false)
    setPhotoFile(null)
    setPhotoPreviewUrl(service?.photoUrl ?? null)
    setFieldErrors({})
    setCategoriesError('')
    setSupplyFeeError('')
  }, [defaultCategoryId, open, service])

  useEffect(() => {
    if (!photoFile) return
    const url = URL.createObjectURL(photoFile)
    setPhotoPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [photoFile])

  const toggleCategory = (categoryId: string) => {
    setCategoriesError('')
    setCategoryIds((previous) => {
      const next = new Set(previous)
      if (next.has(categoryId)) next.delete(categoryId)
      else next.add(categoryId)
      return next
    })
  }

  const updateField = (field: ServicesPricingServiceModalField, value: string) => {
    setFieldErrors((previous) => {
      if (!previous[field]) return previous
      const next = { ...previous }
      delete next[field]
      return next
    })
    if (field === 'name') setName(value)
    if (field === 'price') setPrice(value)
    if (field === 'duration') setDurationMinutes(value)
    if (field === 'description') setDescription(value)
  }

  const addTag = (rawValue: string) => {
    const trimmed = rawValue.trim()
    if (!trimmed) return
    if (tags.some((existing) => existing.toLowerCase() === trimmed.toLowerCase())) {
      setTagDraft('')
      return
    }
    setTags((previous) => [...previous, trimmed])
    setTagDraft('')
  }

  const submit = () => {
    const trimmedName = name.trim()
    const priceValue = Number(price)
    const supplyFeeValue = supplyFee.trim() === '' ? 0 : Number(supplyFee)
    const durationValue = Number(durationMinutes)
    const selectedCategoryIds = Array.from(categoryIds)

    const nextFieldErrors: ServicesPricingServiceModalFieldErrors = {}
    const nextCategoriesError = selectedCategoryIds.length === 0
      ? t(`${AI_TK}.serviceModalCategoryRequired`)
      : ''
    if (!trimmedName) {
      nextFieldErrors.name = t(`${AI_TK}.serviceModalNameRequired`)
    }
    if (
      price.trim() === '' ||
      !Number.isFinite(priceValue) ||
      priceValue < 0 ||
      priceValue > 1_000_000
    ) {
      nextFieldErrors.price = t(`${AI_TK}.serviceModalPriceInvalid`)
    }
    const nextSupplyFeeError =
      !Number.isFinite(supplyFeeValue) ||
      supplyFeeValue < 0 ||
      supplyFeeValue > priceValue
        ? t(`${POS_TK}.supplyFeeInvalid`)
        : ''
    if (!Number.isFinite(durationValue) || durationValue <= 0 || durationValue > 720) {
      nextFieldErrors.duration = t(`${AI_TK}.serviceModalDurationInvalid`)
    }
    setFieldErrors(nextFieldErrors)
    setCategoriesError(nextCategoriesError)
    setSupplyFeeError(nextSupplyFeeError)
    if (nextCategoriesError || nextSupplyFeeError || Object.keys(nextFieldErrors).length > 0) {
      return
    }

    const pendingTag = tagDraft.trim()
    const submittedTags = pendingTag && !tags.some(
      (tag) => tag.toLowerCase() === pendingTag.toLowerCase(),
    ) ? [...tags, pendingTag] : tags

    onSubmit({
      name: trimmedName,
      price: priceValue,
      supplyFee: supplyFeeValue,
      durationMinutes: durationValue,
      description: description.trim() || undefined,
      categoryIds: selectedCategoryIds,
      tags: submittedTags,
      status,
      photo: photoFile,
    })
  }

  const availableSuggestions = tagSuggestions.filter(
    (suggestion) =>
      !tags.some((tag) => tag.toLowerCase() === suggestion.name.toLowerCase()),
  )

  return (
    <ServicesPricingServiceModal
      open={open}
      mode={isEditMode ? 'edit' : 'create'}
      layout="overview"
      size="wide"
      value={{
        name,
        price,
        duration: durationMinutes,
        description,
        categoryIds: Array.from(categoryIds),
        photoPreviewUrl,
      }}
      categories={categories.map((category) => ({
        id: category.id,
        name: category.name,
        checked: categoryIds.has(category.id),
      }))}
      controller={{
        onClose,
        onFieldChange: updateField,
        onToggleCategory: toggleCategory,
        onPhotoChange: setPhotoFile,
        onSubmit: submit,
      }}
      labels={{
        title: t(`${POS_TK}.${isEditMode ? 'editServiceModalTitle' : 'addServiceModalTitle'}`),
        subtitle: t(`${AI_TK}.${isEditMode ? 'serviceModalEditSub' : 'serviceModalSub'}`),
        categories: t(`${AI_TK}.serviceModalCategories`),
        categoriesEmpty: t(`${AI_TK}.serviceModalCategoriesEmpty`),
        categoriesHelp: t(`${POS_TK}.serviceModalCategoriesHelp`),
        name: t(`${AI_TK}.serviceModalName`),
        namePlaceholder: t(`${AI_TK}.placeholderServiceName`),
        price: t(`${AI_TK}.serviceModalPrice`),
        pricePlaceholder: t(`${AI_TK}.placeholderServicePrice`),
        duration: t(`${AI_TK}.serviceModalDuration`),
        durationPlaceholder: t(`${AI_TK}.placeholderServiceDuration`),
        durationUnit: t(`${AI_TK}.durationUnit`),
        description: t(`${AI_TK}.serviceModalDescription`),
        descriptionPlaceholder: t(`${AI_TK}.serviceModalDescriptionPlaceholder`),
        image: t(`${AI_TK}.serviceModalImage`),
        chooseImage: t(`${AI_TK}.serviceModalChoosePhoto`),
        takePhoto: t(`${AI_TK}.serviceModalTakePhoto`),
        imageHelp: t(`${AI_TK}.serviceModalImageHelp`),
        imageFormats: t(`${AI_TK}.serviceModalImageFormats`),
        imageSizeHint: t(`${AI_TK}.serviceModalImageSizeHint`),
        imageCompactHelp: t(`${POS_TK}.imageCompactHelp`),
        cameraTitle: t(`${AI_TK}.serviceModalCameraTitle`),
        cameraHint: t(`${AI_TK}.serviceModalCameraHint`),
        photoUploadAria: t(`${AI_TK}.serviceModalPhotoUploadAria`),
        required: t(`${AI_TK}.serviceModalRequired`),
        optional: t(`${AI_TK}.serviceModalOptional`),
        close: t(`${AI_TK}.serviceModalCloseAria`),
        cancel: t(`${AI_TK}.serviceModalCancel`),
        submit: t(`${AI_TK}.${isEditMode ? 'serviceModalUpdate' : 'serviceModalSave'}`),
      }}
      nameAction={
        <div className="settings-service-modal-status-control">
          <span>{t(`${POS_TK}.activeLabel`)}</span>
          <ToggleSwitch
            checked={status === 'Active'}
            onChange={() => setStatus(status === 'Active' ? 'Inactive' : 'Active')}
            activeColor="bg-nexoraBrand"
            inactiveColor="bg-nexoraBorder"
            ariaLabel={t(`${POS_TK}.activeLabel`)}
            title={t(`${POS_TK}.activeLabel`)}
            disabled={isSubmitting}
          />
        </div>
      }
      overviewFieldsExtension={
        <label className={`settings-field${supplyFeeError ? ' has-error' : ''}`}>
          <ServicesPricingFieldLabel
            label={t(`${POS_TK}.supplyFeeLabel`)}
            requirement={t(`${AI_TK}.serviceModalOptional`)}
            optional
          />
          <div className="settings-service-input-wrap settings-service-modal-input-wrap">
            <span className="settings-service-prefix" aria-hidden="true">$</span>
            <input
              className="settings-input settings-service-modal-affix-input is-price"
              type="text"
              inputMode="decimal"
              maxLength={SERVICE_PRICE_INPUT_MAX_LENGTH}
              value={supplyFee}
              placeholder={t(`${POS_TK}.supplyFeePlaceholder`)}
              aria-label={t(`${POS_TK}.supplyFeeLabel`)}
              aria-invalid={supplyFeeError ? 'true' : undefined}
              aria-describedby={supplyFeeError ? 'pos-service-supply-fee-error' : undefined}
              disabled={isSubmitting}
              onChange={(event) => {
                setSupplyFee(normalizeServicesPricingPrice(event.target.value))
                setSupplyFeeError('')
              }}
            />
          </div>
          {supplyFeeError ? (
            <small id="pos-service-supply-fee-error" className="settings-field-error" role="alert">
              {supplyFeeError}
            </small>
          ) : null}
        </label>
      }
      afterDescriptionExtension={
        <div className="grid gap-3">
          <div className="settings-field">
            <label className="settings-label" htmlFor="pos-service-tags">
              <ServicesPricingFieldLabel
                label={t(`${POS_TK}.tagsLabel`)}
                requirement={t(`${AI_TK}.serviceModalOptional`)}
                optional
              />
            </label>
            {tags.length > 0 ? (
              <div className="mb-2 flex flex-wrap gap-1.5">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 rounded-full bg-nexoraCanvas px-2.5 py-1 text-[10px] font-bold text-nexoraText"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() =>
                        setTags((previous) => previous.filter((item) => item !== tag))
                      }
                      className="text-slate-400 hover:text-rose-600"
                      aria-label={`${t(`${POS_TK}.deleteService`)} ${tag}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            ) : null}
            <input
              id="pos-service-tags"
              className="settings-input"
              type="text"
              list="pos-service-tag-suggestions"
              value={tagDraft}
              maxLength={50}
              placeholder={t(`${POS_TK}.tagsPlaceholder`)}
              onChange={(event) => setTagDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key !== 'Enter') return
                event.preventDefault()
                addTag(tagDraft)
              }}
            />
            <datalist id="pos-service-tag-suggestions">
              {availableSuggestions.map((suggestion) => (
                <option key={suggestion.id} value={suggestion.name} />
              ))}
            </datalist>
          </div>
          <label className="settings-service-modal-approval">
            <input
              type="checkbox"
              checked={requireCustomerApproval}
              disabled={isSubmitting}
              onChange={(event) => setRequireCustomerApproval(event.target.checked)}
            />
            <span>
              <strong>{t(`${POS_TK}.requireApprovalLabel`)}</strong>
              <small>{t(`${POS_TK}.requireApprovalHint`)}</small>
            </span>
          </label>
        </div>
      }
      extension={
        SHOW_SERVICE_ADD_ONS && isEditMode && service ? (
          <ServiceAddOnsSection serviceId={service.id} />
        ) : null
      }
      fieldErrors={fieldErrors}
      categoriesError={categoriesError}
      isSubmitting={isSubmitting}
    />
  )
}
