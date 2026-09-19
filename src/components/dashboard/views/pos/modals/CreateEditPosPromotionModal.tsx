// CreateEditPosPromotionModal — studio layout: details, discount & schedule, checkout placement,
// and a live banner preview. One window per promotion by design.
import { useEffect, useState } from 'react'
import { Globe, Scan, ShoppingBag, Upload, X } from 'lucide-react'
import { useTranslation } from '../../../../../contexts/LanguageContext'
import { MAX_DISCOUNT_PERCENT, PosServiceDiscountType } from '../../../../../constants/posDiscount'
import { TWELVE_HOUR_INPUT_LANG } from '../../../../../constants/timeFormat'
import { sanitizeDecimalInput } from '../../../../../utils/currencyInput'
import type { PosPromotionApiDto, PosPromotionPayload } from '../../../../../types/repositories'
import { POS_WEEK_DAYS, formatPromotionArtSaving } from '../posPromotionDisplay'
import type { PosPromotionDraft, PromoArtTheme } from '../posPromotionTemplates'
import {
  colorHexFromTheme,
  promotionBannerImageUrl,
  themeFromColorHex,
} from '../posPromotionBanner'

const BANNER_THEMES: PromoArtTheme[] = [
  'purple',
  'gold',
  'rose',
  'ocean',
  'teal',
  'sage',
  'peach',
  'slate',
]
import '../pos-promotions.css'

const K = 'components.dashboard.views.pos.PosPromotionsView'

const DEFAULT_START = '10:00'
const DEFAULT_END = '14:00'
const DEFAULT_THEME: PromoArtTheme = 'purple'

enum PromotionField {
  Name = 'name',
  Value = 'value',
  Days = 'days',
  Window = 'window',
}

type PromotionErrors = Partial<Record<PromotionField, string>>

function toApiTime(value: string): string {
  return value.length === 5 ? `${value}:00` : value
}

function toInputTime(value: string): string {
  return value.slice(0, 5)
}

export default function CreateEditPosPromotionModal({
  promotion,
  draft,
  isSaving,
  onSubmit,
  onClose,
}: {
  /** Null while creating. */
  promotion: PosPromotionApiDto | null
  /** Prefill from a template when creating; ignored while editing. */
  draft?: PosPromotionDraft | null
  isSaving: boolean
  onSubmit: (payload: PosPromotionPayload) => void
  onClose: () => void
}) {
  const { t } = useTranslation()
  const [name, setName] = useState('')
  const [badgeLabel, setBadgeLabel] = useState('')
  const [description, setDescription] = useState('')
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null)
  const [theme, setTheme] = useState<PromoArtTheme>(DEFAULT_THEME)
  const [templateCode, setTemplateCode] = useState<string | null>(null)
  const [discountType, setDiscountType] = useState<PosServiceDiscountType>(PosServiceDiscountType.Percent)
  const [valueInput, setValueInput] = useState('')
  const [days, setDays] = useState<string[]>([])
  const [startTime, setStartTime] = useState(DEFAULT_START)
  const [endTime, setEndTime] = useState(DEFAULT_END)
  const [isActive, setIsActive] = useState(false)
  const [showHero, setShowHero] = useState(false)
  const [submitPublic, setSubmitPublic] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<PromotionErrors>({})

  useEffect(() => {
    if (promotion) {
      setName(promotion.name ?? '')
      setBadgeLabel(promotion.badgeLabel ?? '')
      setDescription(promotion.description ?? '')
      setPhotoFile(null)
      setPhotoPreviewUrl(promotionBannerImageUrl(promotion))
      setTheme(themeFromColorHex(promotion.primaryBannerColorHex) ?? DEFAULT_THEME)
      setTemplateCode(promotion.templateCode ?? null)
      setDiscountType(
        promotion.discountType === PosServiceDiscountType.Amount
          ? PosServiceDiscountType.Amount
          : PosServiceDiscountType.Percent,
      )
      setValueInput(String(promotion.discountValue))
      setDays(promotion.daysOfWeek ?? [])
      setStartTime(toInputTime(promotion.startTime))
      setEndTime(toInputTime(promotion.endTime))
      setIsActive(promotion.isActive)
      setShowHero(Boolean(promotionBannerImageUrl(promotion)))
      setSubmitPublic(false)
    } else if (draft) {
      setName(draft.name)
      setBadgeLabel(draft.badgeLabel)
      setDescription(draft.description)
      setPhotoFile(null)
      setPhotoPreviewUrl(null)
      setTheme(draft.theme)
      setTemplateCode(draft.templateCode ?? null)
      setDiscountType(draft.discountType)
      setValueInput(String(draft.discountValue))
      setDays([...draft.daysOfWeek])
      setStartTime(draft.startTime)
      setEndTime(draft.endTime)
      setIsActive(false)
      setShowHero(true)
      setSubmitPublic(false)
    } else {
      setName('')
      setBadgeLabel('')
      setDescription('')
      setPhotoFile(null)
      setPhotoPreviewUrl(null)
      setTheme(DEFAULT_THEME)
      setTemplateCode(null)
      setDiscountType(PosServiceDiscountType.Percent)
      setValueInput('')
      setDays([])
      setStartTime(DEFAULT_START)
      setEndTime(DEFAULT_END)
      setIsActive(false)
      setShowHero(false)
      setSubmitPublic(false)
    }
    setFieldErrors({})
  }, [promotion, draft])

  useEffect(() => {
    if (!photoFile) return
    const url = URL.createObjectURL(photoFile)
    setPhotoPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [photoFile])

  const parsedValue = Number(valueInput)
  const isPercent = discountType === PosServiceDiscountType.Percent

  const clearFieldError = (field: PromotionField) => {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev
      const next = { ...prev }
      delete next[field]
      return next
    })
  }

  const validateFields = (): PromotionErrors => {
    const errors: PromotionErrors = {}

    if (!name.trim()) errors[PromotionField.Name] = t(`${K}.errorNameRequired`)

    if (!valueInput.trim()) {
      errors[PromotionField.Value] = t(`${K}.errorValueRequired`)
    } else if (!Number.isFinite(parsedValue) || parsedValue <= 0) {
      errors[PromotionField.Value] = t(`${K}.errorValueInvalid`)
    } else if (isPercent && parsedValue > MAX_DISCOUNT_PERCENT) {
      errors[PromotionField.Value] = t(`${K}.errorValuePercentMax`, { max: MAX_DISCOUNT_PERCENT })
    }

    if (days.length === 0) errors[PromotionField.Days] = t(`${K}.errorDaysRequired`)

    if (!startTime || !endTime) {
      errors[PromotionField.Window] = t(`${K}.errorWindowRequired`)
    } else if (endTime <= startTime) {
      errors[PromotionField.Window] = t(`${K}.windowInvalid`)
    }

    return errors
  }

  const toggleDay = (day: string) => {
    setDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]))
    clearFieldError(PromotionField.Days)
  }

  const handleSubmit = () => {
    if (isSaving) return
    const errors = validateFields()
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return

    const hasExistingImage = Boolean(photoPreviewUrl) && !photoFile
    onSubmit({
      name: name.trim(),
      badgeLabel: badgeLabel.trim() || null,
      description: description.trim() || null,
      templateCode: templateCode || null,
      photo: photoFile,
      banners: photoFile
        ? [{ colorHex: null, image: photoFile }]
        : hasExistingImage
          ? undefined
          : [{ colorHex: colorHexFromTheme(theme), image: null }],
      discountType,
      discountValue: parsedValue,
      daysOfWeek: days,
      startTime: toApiTime(startTime),
      endTime: toApiTime(endTime),
      isActive,
    })
  }

  const previewRate =
    valueInput.trim() && Number.isFinite(parsedValue) && parsedValue > 0
      ? formatPromotionArtSaving(discountType, parsedValue)
      : t(`${K}.invalidPreview`)

  const previewName = name.trim() || t(`${K}.previewUntitled`)
  const firstError =
    fieldErrors.name || fieldErrors.value || fieldErrors.days || fieldErrors.window || ''

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0c1b3b59] p-4 backdrop-blur-[2px]">
      <div
        className="pos-promo-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pos-promo-editor-title"
      >
        <header className="editor-header">
          <div>
            <p className="promo-eyebrow">{t(`${K}.studioEyebrow`)}</p>
            <h2 id="pos-promo-editor-title">
              {promotion ? t(`${K}.editTitle`) : t(`${K}.createTitle`)}
            </h2>
          </div>
          <button
            type="button"
            className="promo-close"
            aria-label={t(`${K}.cancel`)}
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="editor-help">
          <strong>{t(`${K}.helpTitle`)}</strong>
          <span>{t(`${K}.helpSteps`)}</span>
          <small>{t(`${K}.helpNote`)}</small>
        </div>

        <div className="editor-body">
          <div className="editor-fields">
            <section className="editor-section" aria-labelledby="promo-details-title">
              <h3 className="section-number" id="promo-details-title">
                {t(`${K}.detailsSection`)}
              </h3>
              <div className="promo-field-row details-row">
                <label className="promo-field">
                  <span>{t(`${K}.nameLabel`)}</span>
                  <input
                    type="text"
                    value={name}
                    maxLength={100}
                    onChange={(e) => {
                      setName(e.target.value)
                      clearFieldError(PromotionField.Name)
                    }}
                    placeholder={t(`${K}.namePlaceholder`)}
                    aria-invalid={Boolean(fieldErrors.name)}
                    className={fieldErrors.name ? 'is-invalid' : undefined}
                  />
                </label>
                <label className="promo-field">
                  <span>{t(`${K}.badgeLabel`)}</span>
                  <input
                    type="text"
                    value={badgeLabel}
                    maxLength={50}
                    onChange={(e) => setBadgeLabel(e.target.value)}
                    placeholder={t(`${K}.badgePlaceholder`)}
                  />
                </label>
              </div>
              {fieldErrors.name ? <p className="field-error">{fieldErrors.name}</p> : null}
              <p className="promo-note">{t(`${K}.detailsHint`)}</p>
              <label className="promo-field">
                <span>{t(`${K}.descriptionLabel`)}</span>
                <textarea
                  value={description}
                  maxLength={1000}
                  rows={3}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={t(`${K}.descriptionPlaceholder`)}
                />
              </label>
            </section>

            <section className="editor-section" aria-labelledby="promo-schedule-title">
              <h3 className="section-number" id="promo-schedule-title">
                {t(`${K}.scheduleSection`)}
              </h3>
              <div className="promo-field-row">
                <label className="promo-field">
                  <span>{t(`${K}.typeLabel`)}</span>
                  <select
                    value={discountType}
                    onChange={(e) => {
                      setDiscountType(e.target.value as PosServiceDiscountType)
                      clearFieldError(PromotionField.Value)
                    }}
                  >
                    <option value={PosServiceDiscountType.Percent}>{t(`${K}.typePercent`)}</option>
                    <option value={PosServiceDiscountType.Amount}>{t(`${K}.typeAmount`)}</option>
                  </select>
                </label>
                <label className="promo-field">
                  <span>{t(`${K}.valueLabel`)}</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={valueInput}
                    onChange={(e) => {
                      setValueInput(sanitizeDecimalInput(e.target.value))
                      clearFieldError(PromotionField.Value)
                    }}
                    placeholder={isPercent ? '15' : '10'}
                    aria-invalid={Boolean(fieldErrors.value)}
                    className={fieldErrors.value ? 'is-invalid' : undefined}
                  />
                </label>
              </div>
              {fieldErrors.value ? <p className="field-error">{fieldErrors.value}</p> : null}

              <fieldset className="promo-days">
                <legend>{t(`${K}.daysLabel`)}</legend>
                <div>
                  {POS_WEEK_DAYS.map((day) => (
                    <label
                      key={day}
                      className={`promo-day${fieldErrors.days ? ' is-invalid' : ''}`}
                    >
                      <input
                        type="checkbox"
                        checked={days.includes(day)}
                        onChange={() => toggleDay(day)}
                      />
                      <span>
                        {t(`components.dashboard.views.pos.OrderDiscountSection.dayShort.${day}`)}
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>
              {fieldErrors.days ? <p className="field-error">{fieldErrors.days}</p> : null}

              <div className="promo-field-row">
                <label className="promo-field">
                  <span>{t(`${K}.startLabel`)}</span>
                  <input
                    type="time"
                    lang={TWELVE_HOUR_INPUT_LANG}
                    value={startTime}
                    onChange={(e) => {
                      setStartTime(e.target.value)
                      clearFieldError(PromotionField.Window)
                    }}
                    aria-invalid={Boolean(fieldErrors.window)}
                    className={fieldErrors.window ? 'is-invalid' : undefined}
                  />
                </label>
                <label className="promo-field">
                  <span>{t(`${K}.endLabel`)}</span>
                  <input
                    type="time"
                    lang={TWELVE_HOUR_INPUT_LANG}
                    value={endTime}
                    onChange={(e) => {
                      setEndTime(e.target.value)
                      clearFieldError(PromotionField.Window)
                    }}
                    aria-invalid={Boolean(fieldErrors.window)}
                    className={fieldErrors.window ? 'is-invalid' : undefined}
                  />
                </label>
              </div>
              {fieldErrors.window ? <p className="field-error">{fieldErrors.window}</p> : null}
              <p className="promo-note">{t(`${K}.timeHint`)}</p>
            </section>

            <section className="editor-section" aria-labelledby="promo-placements-title">
              <h3 className="section-number" id="promo-placements-title">
                {t(`${K}.placementsSection`)}
              </h3>
              <label className="promo-check-card">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                />
                <span>
                  <strong>{t(`${K}.activeLabel`)}</strong>
                  <small>{t(`${K}.checkoutHint`)}</small>
                </span>
                <ShoppingBag className="promo-check-icon h-5 w-5" aria-hidden />
              </label>
              <label className="promo-check-card">
                <input
                  type="checkbox"
                  checked={showHero}
                  onChange={(e) => setShowHero(e.target.checked)}
                />
                <span>
                  <strong>{t(`${K}.heroLabel`)}</strong>
                  <small>{t(`${K}.heroHint`)}</small>
                </span>
                <Scan className="promo-check-icon h-5 w-5" aria-hidden />
              </label>
              <label className="promo-check-card">
                <input
                  type="checkbox"
                  checked={submitPublic}
                  onChange={(e) => setSubmitPublic(e.target.checked)}
                />
                <span>
                  <strong>{t(`${K}.publicLabel`)}</strong>
                  <small>{t(`${K}.publicHint`)}</small>
                </span>
                <Globe className="promo-check-icon h-5 w-5" aria-hidden />
              </label>
              <p className="promo-note">{t(`${K}.publicNote`)}</p>
            </section>
          </div>

          <aside className="editor-preview" aria-labelledby="promo-banners-title">
            <h3 className="section-number" id="promo-banners-title">
              {t(`${K}.bannersSection`)}
            </h3>
            <div aria-live="polite">
              {photoPreviewUrl ? (
                <div className="promo-art image-art">
                  <img src={photoPreviewUrl} alt="" width={400} height={250} />
                </div>
              ) : (
                <div className={`promo-art theme-${theme}`}>
                  <span className="art-badge">{badgeLabel.trim() || t(`${K}.specialOffer`)}</span>
                  <h3>{previewName}</h3>
                  <strong className="art-saving">{previewRate}</strong>
                </div>
              )}
            </div>
            <p className="promo-note">{t(`${K}.bannerHint`)}</p>

            <div className="promo-field-row banner-add-row">
              <label className="promo-field">
                <span>{t(`${K}.chooseTheme`)}</span>
                <select
                  value={photoPreviewUrl ? '' : theme}
                  disabled={Boolean(photoPreviewUrl)}
                  onChange={(e) => setTheme(e.target.value as PromoArtTheme)}
                >
                  {photoPreviewUrl ? (
                    <option value="">{t(`${K}.uploadedTheme`)}</option>
                  ) : null}
                  {BANNER_THEMES.map((themeId) => (
                    <option key={themeId} value={themeId}>
                      {t(`${K}.theme.${themeId}`)}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="promo-upload">
              <Upload className="h-5 w-5 text-nexoraBrand" aria-hidden />
              <strong>{t(`${K}.upload`)}</strong>
              <span className="promo-note">
                {photoFile?.name ||
                  (photoPreviewUrl && !photoFile ? t(`${K}.currentImage`) : t(`${K}.chooseFile`))}
              </span>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)}
              />
            </label>
            <p className="promo-note">{t(`${K}.uploadHint`)}</p>
          </aside>
        </div>

        <footer className="editor-footer">
          <div>
            {firstError ? (
              <p className="promo-error" role="alert">
                {firstError}
              </p>
            ) : null}
            <p className="promo-note">
              {promotion ? t(`${K}.editNote`) : t(`${K}.saveNote`)}
            </p>
          </div>
          <div className="editor-footer-actions">
            <button type="button" className="promo-button" onClick={onClose} disabled={isSaving}>
              {t(`${K}.cancel`)}
            </button>
            <button
              type="button"
              className="promo-button primary"
              onClick={handleSubmit}
              disabled={isSaving}
            >
              {t(`${K}.save`)}
            </button>
          </div>
        </footer>
      </div>
    </div>
  )
}
