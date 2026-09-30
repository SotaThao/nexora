import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Camera, ChevronDown, FolderOpen, Image as ImageIcon, ImageOff } from 'lucide-react'
import CameraCaptureModal from '../../../ui/CameraCaptureModal'
import ImageFileInput from '../../../ui/ImageFileInput'
import {
  CheckCircleFillIcon,
  PencilIcon,
  PlusIcon,
  SpinnerIcon,
  XLgIcon,
} from '../BookingHubIcons'

export const SERVICE_PRICE_INPUT_MAX_LENGTH = 10
export const SERVICE_DURATION_INPUT_MAX_LENGTH = 3
export const SERVICE_DESCRIPTION_MAX_LENGTH = 1000

export type ServicesPricingServiceField = 'name' | 'price' | 'duration'

export function normalizeServicesPricingPrice(raw: string): string {
  const sanitized = raw.replace(/[^\d.]/g, '')
  const parts = sanitized.split('.')
  if (parts.length <= 1) return sanitized.slice(0, SERVICE_PRICE_INPUT_MAX_LENGTH)
  return `${parts[0]}.${parts.slice(1).join('').slice(0, 2)}`.slice(
    0,
    SERVICE_PRICE_INPUT_MAX_LENGTH,
  )
}

export interface ServicesPricingServiceRowAdapter<TItem> {
  getId: (item: TItem) => string
  getName: (item: TItem) => string
  getPrice: (item: TItem) => string
  getDuration: (item: TItem) => string
  getPhotoUrl: (item: TItem) => string | null | undefined
  getTone?: (item: TItem) => string | undefined
  getStatus?: (item: TItem) =>
    | {
        label: string
        tone: 'active' | 'inactive'
      }
    | null
    | undefined
  getApproval?: (item: TItem) =>
    | {
        required: boolean
        label: string
      }
    | null
    | undefined
}

export interface ServicesPricingServiceRowController<TItem> {
  onChange: (item: TItem, field: ServicesPricingServiceField, value: string) => void
  onEdit?: (item: TItem) => void
  onRemove?: (item: TItem) => void | Promise<void>
  onSave?: (item: TItem) => void | Promise<void>
  isDirty?: (item: TItem) => boolean
  isPending?: (item: TItem) => boolean
}

export interface ServicesPricingServiceRowLabels {
  name: string
  namePlaceholder: string
  price: string
  pricePlaceholder: string
  duration: string
  durationPlaceholder: string
  durationUnit: string
  edit: string
  editAction?: string
  remove: string
  removeAction?: string
  save: string
}

export function ServicesPricingServiceRow<TItem>({
  item,
  dragHandle,
  adapter,
  controller,
  labels,
  extension,
  actionsExtension,
  error,
  invalidFields = [],
  isNew = false,
  highlighted = false,
  autoFocusName = false,
  visualFallbackText,
  actionsAsText = false,
}: {
  item: TItem
  dragHandle: ReactNode
  adapter: ServicesPricingServiceRowAdapter<TItem>
  controller: ServicesPricingServiceRowController<TItem>
  labels: ServicesPricingServiceRowLabels
  extension?: ReactNode
  actionsExtension?: ReactNode
  error?: string
  invalidFields?: ServicesPricingServiceField[]
  isNew?: boolean
  highlighted?: boolean
  autoFocusName?: boolean
  visualFallbackText?: string
  actionsAsText?: boolean
}) {
  const id = adapter.getId(item)
  const name = adapter.getName(item)
  const photoUrl = adapter.getPhotoUrl(item)
  const status = adapter.getStatus?.(item)
  const approval = adapter.getApproval?.(item)
  const isPending = controller.isPending?.(item) ?? false
  const isDirty = controller.isDirty?.(item) ?? false

  return (
    <div
      className={`settings-service-row is-compact${actionsAsText ? ' has-text-actions' : ''}${isDirty ? ' is-editing' : ''}${isNew ? ' is-new' : ''}${highlighted ? ' is-highlight' : ''}`}
      data-service-row-id={isNew ? undefined : id}
      data-new-service-draft-id={isNew ? id : undefined}
    >
      <div className="settings-service-edit-grid">
        {dragHandle}
        <span
          className={`settings-service-visual settings-service-photo ${adapter.getTone?.(item) ?? ''}`}
        >
          {photoUrl ? <img src={photoUrl} alt={name} /> : <ImageOff aria-hidden="true" />}
          {visualFallbackText ? <span className="sr-only">{visualFallbackText}</span> : null}
        </span>
        <input
          autoFocus={autoFocusName}
          className="settings-service-input"
          type="text"
          value={name}
          placeholder={labels.namePlaceholder}
          aria-label={labels.name}
          aria-invalid={invalidFields.includes('name') ? 'true' : undefined}
          disabled={isPending}
          onChange={(event) => controller.onChange(item, 'name', event.target.value)}
        />
        <div className="settings-service-input-wrap settings-service-price-wrap">
          <span className="settings-service-prefix" aria-hidden="true">$</span>
          <input
            className="settings-service-input price"
            type="text"
            inputMode="decimal"
            maxLength={SERVICE_PRICE_INPUT_MAX_LENGTH}
            value={adapter.getPrice(item)}
            placeholder={labels.pricePlaceholder}
            aria-label={labels.price}
            aria-invalid={invalidFields.includes('price') ? 'true' : undefined}
            disabled={isPending}
            onChange={(event) =>
              controller.onChange(item, 'price', normalizeServicesPricingPrice(event.target.value))
            }
          />
        </div>
        <div className="settings-service-input-wrap settings-service-duration-wrap">
          <input
            className="settings-service-input duration"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={SERVICE_DURATION_INPUT_MAX_LENGTH}
            value={adapter.getDuration(item)}
            placeholder={labels.durationPlaceholder}
            aria-label={labels.duration}
            aria-invalid={invalidFields.includes('duration') ? 'true' : undefined}
            disabled={isPending}
            onChange={(event) =>
              controller.onChange(
                item,
                'duration',
                event.target.value.replace(/\D/g, '').slice(0, SERVICE_DURATION_INPUT_MAX_LENGTH),
              )
            }
          />
          <span className="settings-service-suffix" aria-hidden="true">
            {labels.durationUnit}
          </span>
        </div>
        {status || approval ? (
          <div className="settings-service-row-flags">
            {status ? (
              <span className={`settings-service-status is-${status.tone}`}>{status.label}</span>
            ) : null}
            {approval ? (
              <span
                className={`settings-service-approval is-${approval.required ? 'required' : 'optional'}`}
                title={approval.label}
              >
                {approval.label}
              </span>
            ) : null}
          </div>
        ) : null}
        <div className="settings-service-row-actions">
          {actionsExtension}
          {controller.onSave && isDirty ? (
            <button
              className="settings-service-confirm"
              type="button"
              aria-label={labels.save}
              disabled={isPending}
              onClick={() => void controller.onSave?.(item)}
            >
              {isPending ? (
                <SpinnerIcon className="booking-inline-spinner" />
              ) : actionsAsText ? (
                labels.save
              ) : (
                <CheckCircleFillIcon className="settings-action-icon" />
              )}
            </button>
          ) : null}
          {controller.onEdit ? (
            <button
              className="settings-service-edit"
              type="button"
              aria-label={labels.edit}
              disabled={isPending}
              onClick={() => controller.onEdit?.(item)}
            >
              {actionsAsText ? labels.editAction ?? labels.edit : <PencilIcon className="settings-service-edit-icon" />}
            </button>
          ) : null}
          {controller.onRemove ? (
            <button
              className="settings-service-remove"
              type="button"
              aria-label={labels.remove}
              disabled={isPending}
              onClick={() => void controller.onRemove?.(item)}
            >
              {isPending ? (
                <SpinnerIcon className="booking-inline-spinner" />
              ) : actionsAsText ? (
                labels.removeAction ?? labels.remove
              ) : (
                <XLgIcon className="settings-row-remove-icon" />
              )}
            </button>
          ) : null}
        </div>
      </div>
      {extension ? <div className="settings-service-row-extension">{extension}</div> : null}
      {error ? <p className="settings-service-row-error" role="alert">{error}</p> : null}
    </div>
  )
}

export type ServicesPricingServiceModalField =
  | 'name'
  | 'price'
  | 'duration'
  | 'description'

export type ServicesPricingServiceModalFieldErrors = Partial<
  Record<ServicesPricingServiceModalField, string>
>

export interface ServicesPricingServiceModalValue {
  name: string
  price: string
  duration: string
  description: string
  categoryIds: string[]
  photoPreviewUrl?: string | null
}

export interface ServicesPricingServiceCategoryOption {
  id: string
  name: string
  disabled?: boolean
  checked?: boolean
}

export interface ServicesPricingServiceModalController {
  onClose: () => void
  onFieldChange: (field: ServicesPricingServiceModalField, value: string) => void
  onToggleCategory: (categoryId: string) => void
  onPhotoChange: (photo: File | null) => void
  onSubmit: () => void | Promise<void>
}

export interface ServicesPricingServiceModalLabels {
  title: string
  subtitle: string
  categories: string
  categoriesEmpty: string
  categoriesHelp: string
  name: string
  namePlaceholder: string
  price: string
  pricePlaceholder: string
  duration: string
  durationPlaceholder: string
  durationUnit: string
  description: string
  descriptionPlaceholder: string
  image: string
  chooseImage: string
  takePhoto: string
  imageHelp: string
  imageFormats: string
  imageSizeHint: string
  cameraTitle: string
  cameraHint: string
  photoUploadAria: string
  required: string
  optional: string
  close: string
  cancel: string
  submit: string
  imageCompactHelp?: string
}

export function ServicesPricingFieldLabel({
  label,
  requirement,
  optional = false,
}: {
  label: string
  requirement: string
  optional?: boolean
}) {
  return (
    <span className="settings-label settings-service-modal-label">
      {label}{' '}
      <small className={`settings-field-requirement${optional ? ' is-optional' : ''}`}>
        ({requirement.toLocaleLowerCase()})
      </small>
    </span>
  )
}

export function ServicesPricingServiceModal({
  open,
  mode,
  value,
  categories,
  controller,
  labels,
  nameAction,
  beforeImageExtension,
  overviewFieldsExtension,
  afterDescriptionExtension,
  extension,
  error,
  fieldErrors,
  categoriesError,
  isSubmitting = false,
  layout = 'default',
  size = 'default',
  categoriesControl = 'options',
  categoriesPlacement = 'top',
}: {
  open: boolean
  mode: 'create' | 'edit'
  value: ServicesPricingServiceModalValue
  categories: readonly ServicesPricingServiceCategoryOption[]
  controller: ServicesPricingServiceModalController
  labels: ServicesPricingServiceModalLabels
  nameAction?: ReactNode
  beforeImageExtension?: ReactNode
  overviewFieldsExtension?: ReactNode
  afterDescriptionExtension?: ReactNode
  extension?: ReactNode
  error?: string
  fieldErrors?: ServicesPricingServiceModalFieldErrors
  categoriesError?: string
  isSubmitting?: boolean
  layout?: 'default' | 'overview'
  size?: 'default' | 'wide'
  categoriesControl?: 'options' | 'select'
  categoriesPlacement?: 'top' | 'overview'
}) {
  const [cameraOpen, setCameraOpen] = useState(false)
  const [categoriesOpen, setCategoriesOpen] = useState(false)
  const categoriesSelectRef = useRef<HTMLDivElement>(null)
  const isOverview = layout === 'overview'

  useEffect(() => {
    if (!open || categoriesControl !== 'select') {
      setCategoriesOpen(false)
      return
    }

    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!categoriesSelectRef.current?.contains(event.target as Node)) {
        setCategoriesOpen(false)
      }
    }
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setCategoriesOpen(false)
    }

    document.addEventListener('mousedown', closeOnOutsideClick)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('mousedown', closeOnOutsideClick)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [categoriesControl, open])

  if (!open) return null

  const selectedCategoryNames = categories
    .filter((category) => category.checked ?? value.categoryIds.includes(category.id))
    .map((category) => category.name)
  const categoriesSummary = selectedCategoryNames.length > 0
    ? selectedCategoryNames.join(', ')
    : categories.length === 0
      ? labels.categoriesEmpty
      : labels.categoriesHelp

  const categoryOptions = categories.length === 0 ? (
    <div className="settings-service-modal-categories-empty">
      {labels.categoriesEmpty}
    </div>
  ) : (
    categories.map((category) => {
      const checked = category.checked ?? value.categoryIds.includes(category.id)
      return (
        <label
          key={category.id}
          className={`settings-service-modal-category-option${checked ? ' is-selected' : ''}${category.disabled ? ' is-disabled' : ''}`}
        >
          <input
            type="checkbox"
            checked={checked}
            disabled={category.disabled || isSubmitting}
            onChange={() => controller.onToggleCategory(category.id)}
          />
          <span>{category.name}</span>
        </label>
      )
    })
  )

  const categoriesField = (
    <div
      className={`settings-field settings-service-modal-field-name${categoriesError ? ' has-error' : ''}${categoriesOpen ? ' has-open-menu' : ''}`}
    >
      <ServicesPricingFieldLabel
        label={labels.categories}
        requirement={labels.required}
      />
      {categoriesControl === 'select' ? (
        <div className="settings-service-modal-category-select" ref={categoriesSelectRef}>
          <button
            type="button"
            className={`settings-input settings-service-modal-category-trigger${categoriesError ? ' has-error' : ''}`}
            aria-label={`${labels.categories}: ${categoriesSummary}`}
            aria-haspopup="dialog"
            aria-expanded={categoriesOpen}
            aria-controls="shared-services-categories-options"
            aria-invalid={categoriesError ? 'true' : undefined}
            aria-describedby={categoriesError ? 'shared-services-categories-error' : undefined}
            disabled={isSubmitting || categories.length === 0}
            onClick={() => setCategoriesOpen((previous) => !previous)}
          >
            <span className={selectedCategoryNames.length === 0 ? 'is-placeholder' : ''}>
              {categoriesSummary}
            </span>
            <ChevronDown
              className={`settings-service-modal-category-chevron${categoriesOpen ? ' is-open' : ''}`}
              aria-hidden="true"
            />
          </button>
          {categoriesOpen ? (
            <div
              id="shared-services-categories-options"
              className="settings-service-modal-category-menu"
              role="group"
              aria-label={labels.categories}
            >
              {categoryOptions}
            </div>
          ) : null}
        </div>
      ) : (
        <div
          className={`settings-service-modal-categories${categoriesError ? ' has-error' : ''}`}
          role="group"
          aria-invalid={categoriesError ? 'true' : undefined}
          aria-describedby={categoriesError ? 'shared-services-categories-error' : undefined}
          aria-label={labels.categories}
        >
          {categoryOptions}
        </div>
      )}
      {categoriesError ? (
        <small id="shared-services-categories-error" className="settings-field-error" role="alert">
          {categoriesError}
        </small>
      ) : categoriesControl !== 'select' ? (
        <span className="settings-help">{labels.categoriesHelp}</span>
      ) : null}
    </div>
  )

  const nameField = (
    <div
      className={`settings-field settings-service-modal-field-name${fieldErrors?.name ? ' has-error' : ''}`}
    >
      <div className="settings-service-modal-field-head">
        <label htmlFor="shared-services-name-input">
          <ServicesPricingFieldLabel label={labels.name} requirement={labels.required} />
        </label>
        {nameAction}
      </div>
      <input
        id="shared-services-name-input"
        className="settings-input"
        type="text"
        value={value.name}
        placeholder={labels.namePlaceholder}
        autoComplete="off"
        disabled={isSubmitting}
        aria-label={labels.name}
        aria-invalid={fieldErrors?.name ? 'true' : undefined}
        aria-describedby={fieldErrors?.name ? 'shared-services-name-error' : undefined}
        onChange={(event) => controller.onFieldChange('name', event.target.value)}
      />
      {fieldErrors?.name ? (
        <small id="shared-services-name-error" className="settings-field-error" role="alert">
          {fieldErrors.name}
        </small>
      ) : null}
    </div>
  )

  const priceField = (
    <label className={`settings-field${fieldErrors?.price ? ' has-error' : ''}`}>
      <ServicesPricingFieldLabel label={labels.price} requirement={labels.required} />
      <div className="settings-service-input-wrap settings-service-modal-input-wrap">
        <span className="settings-service-prefix" aria-hidden="true">$</span>
        <input
          className="settings-input settings-service-modal-affix-input is-price"
          type="text"
          inputMode="decimal"
          maxLength={SERVICE_PRICE_INPUT_MAX_LENGTH}
          value={value.price}
          placeholder={labels.pricePlaceholder}
          aria-label={labels.price}
          aria-invalid={fieldErrors?.price ? 'true' : undefined}
          aria-describedby={fieldErrors?.price ? 'shared-services-price-error' : undefined}
          disabled={isSubmitting}
          onChange={(event) =>
            controller.onFieldChange('price', normalizeServicesPricingPrice(event.target.value))
          }
        />
      </div>
      {fieldErrors?.price ? (
        <small id="shared-services-price-error" className="settings-field-error" role="alert">
          {fieldErrors.price}
        </small>
      ) : null}
    </label>
  )

  const durationField = (
    <label className={`settings-field${fieldErrors?.duration ? ' has-error' : ''}`}>
      <ServicesPricingFieldLabel label={labels.duration} requirement={labels.required} />
      <div className="settings-service-input-wrap settings-service-modal-input-wrap">
        <input
          className="settings-input settings-service-modal-affix-input is-duration"
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={SERVICE_DURATION_INPUT_MAX_LENGTH}
          value={value.duration}
          placeholder={labels.durationPlaceholder}
          aria-label={labels.duration}
          aria-invalid={fieldErrors?.duration ? 'true' : undefined}
          aria-describedby={fieldErrors?.duration ? 'shared-services-duration-error' : undefined}
          disabled={isSubmitting}
          onChange={(event) =>
            controller.onFieldChange(
              'duration',
              event.target.value.replace(/\D/g, '').slice(0, SERVICE_DURATION_INPUT_MAX_LENGTH),
            )
          }
        />
        <span className="settings-service-suffix" aria-hidden="true">
          {labels.durationUnit}
        </span>
      </div>
      {fieldErrors?.duration ? (
        <small id="shared-services-duration-error" className="settings-field-error" role="alert">
          {fieldErrors.duration}
        </small>
      ) : null}
    </label>
  )

  const descriptionField = (
    <label className={`settings-field settings-service-modal-field-name${isOverview ? ' settings-service-modal-description-field' : ''}`}>
      <ServicesPricingFieldLabel
        label={labels.description}
        requirement={labels.optional}
        optional
      />
      <textarea
        className="settings-input settings-service-modal-description"
        value={value.description}
        maxLength={SERVICE_DESCRIPTION_MAX_LENGTH}
        rows={isOverview ? 3 : 4}
        aria-label={labels.description}
        placeholder={labels.descriptionPlaceholder}
        disabled={isSubmitting}
        onChange={(event) =>
          controller.onFieldChange(
            'description',
            event.target.value.slice(0, SERVICE_DESCRIPTION_MAX_LENGTH),
          )
        }
      />
      <span className="settings-service-modal-character-count">
        {value.description.length}/{SERVICE_DESCRIPTION_MAX_LENGTH}
      </span>
    </label>
  )

  const photoField = (
    <div className={`settings-field${isOverview ? '' : ' settings-service-modal-field-name'}`}>
      <ServicesPricingFieldLabel
        label={labels.image}
        requirement={labels.optional}
        optional
      />
      <div className="settings-service-modal-photo">
        {isOverview || value.photoPreviewUrl ? (
          <div className="settings-service-modal-photo-preview" aria-hidden="true">
            {value.photoPreviewUrl ? (
              <img src={value.photoPreviewUrl} alt="" />
            ) : (
              <ImageIcon />
            )}
          </div>
        ) : null}
        <div className="settings-service-modal-photo-actions">
          <button
            type="button"
            className="settings-service-modal-photo-action"
            disabled={isSubmitting}
            aria-label={labels.takePhoto}
            onClick={() => setCameraOpen(true)}
          >
            <Camera aria-hidden="true" />
            <span>{labels.takePhoto}</span>
          </button>
          <ImageFileInput
            as="label"
            accept="image/jpeg,image/png,image/webp"
            inputAriaLabel={labels.photoUploadAria}
            disabled={isSubmitting}
            onPickFile={controller.onPhotoChange}
            className={`settings-service-modal-photo-action${isSubmitting ? ' is-disabled' : ''}`}
          >
            <FolderOpen aria-hidden="true" />
            <span>{labels.chooseImage}</span>
          </ImageFileInput>
        </div>
        <div className="settings-service-modal-photo-help">
          {isOverview ? (
            <p>{labels.imageCompactHelp ?? 'JPG, PNG, WebP · Up to 10MB'}</p>
          ) : (
            <>
              <p>{labels.imageHelp}</p>
              <p>{labels.imageFormats}</p>
              <p>{labels.imageSizeHint}</p>
            </>
          )}
        </div>
      </div>
    </div>
  )

  return (
    <div className="booking-hub-view settings-service-modal" role="presentation">
      <div
        className={`settings-service-dialog${size === 'wide' ? ' is-wide' : ''}${isOverview ? ' is-overview' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="shared-services-service-modal-title"
      >
        <div className="settings-service-modal-head">
          <div>
            <div className="settings-service-modal-title" id="shared-services-service-modal-title">
              {labels.title}
            </div>
            <div className="settings-service-modal-sub">{labels.subtitle}</div>
          </div>
          <button
            className="settings-service-modal-close"
            type="button"
            aria-label={labels.close}
            onClick={controller.onClose}
          >
            <XLgIcon />
          </button>
        </div>

        <div className="settings-service-modal-body">
          <div className="settings-service-modal-grid items-start">
            {categoriesPlacement === 'top' ? categoriesField : null}

            {isOverview ? (
              <div className="settings-service-modal-overview">
                <div className="settings-service-modal-overview-photo">{photoField}</div>
                <div className="settings-service-modal-overview-fields">
                  {nameField}
                  <div className="settings-service-modal-metrics">
                    {priceField}
                    {durationField}
                  </div>
                  {categoriesPlacement === 'overview' ? categoriesField : null}
                  {overviewFieldsExtension}
                </div>
              </div>
            ) : (
              <>
                {nameField}
                {priceField}
                {durationField}
                {descriptionField}
                {beforeImageExtension ? (
                  <div className="settings-service-modal-before-image">
                    {beforeImageExtension}
                  </div>
                ) : null}
                {photoField}
              </>
            )}

            {isOverview ? (
              <>
                {descriptionField}
                {afterDescriptionExtension ? (
                  <div className="settings-service-modal-after-description">
                    {afterDescriptionExtension}
                  </div>
                ) : null}
              </>
            ) : null}
          </div>

          {extension ? <div className="settings-service-modal-extension">{extension}</div> : null}
          {error ? <div className="settings-service-modal-error" role="alert">{error}</div> : null}
        </div>

        <div className="settings-service-modal-actions">
          <button
            className="booking-secondary-button"
            type="button"
            disabled={isSubmitting}
            onClick={controller.onClose}
          >
            {labels.cancel}
          </button>
          <button
            className="booking-primary-button"
            type="button"
            disabled={isSubmitting}
            aria-label={labels.submit}
            onClick={() => void controller.onSubmit()}
          >
            {isSubmitting ? (
              <SpinnerIcon className="booking-inline-spinner" />
            ) : mode === 'edit' ? (
              <CheckCircleFillIcon className="settings-action-icon" />
            ) : (
              <PlusIcon className="settings-action-icon" />
            )}
            {labels.submit}
          </button>
        </div>
      </div>
      <CameraCaptureModal
        open={cameraOpen}
        onClose={() => setCameraOpen(false)}
        onCapture={(file) => controller.onPhotoChange(file)}
        title={labels.cameraTitle}
        hint={labels.cameraHint}
        accept="image/jpeg,image/png,image/webp"
      />
    </div>
  )
}
