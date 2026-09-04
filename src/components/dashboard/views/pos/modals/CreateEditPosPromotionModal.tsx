// CreateEditPosPromotionModal — one offer: what it is called, how much it takes off, which days it
// runs and the daily window it runs in.
//
// One window per promotion by design: a different window on Saturday is a second offer with its own
// name, which is also how the front desk reads the cards at the counter.
import { useEffect, useRef, useState } from 'react'
import { ImagePlus, X } from 'lucide-react'
import { useTranslation } from '../../../../../contexts/LanguageContext'
import IconButton from '../../../../ui/IconButton'
import { MAX_DISCOUNT_PERCENT, PosServiceDiscountType } from '../../../../../constants/posDiscount'
import { TWELVE_HOUR_INPUT_LANG } from '../../../../../constants/timeFormat'
import { sanitizeDecimalInput } from '../../../../../utils/currencyInput'
import type { PosPromotionApiDto, PosPromotionPayload } from '../../../../../types/repositories'
import { POS_WEEK_DAYS } from '../posPromotionDisplay'

const K = 'components.dashboard.views.pos.PosPromotionsView'

const DEFAULT_START = '10:00'
const DEFAULT_END = '14:00'

// Per-field validation mirroring PosPromotionInputValidator on the backend. Save stays clickable so
// an incomplete form answers with the field that is actually wrong instead of a dead button.
enum PromotionField {
  Name = 'name',
  Value = 'value',
  Days = 'days',
  Window = 'window',
}

type PromotionErrors = Partial<Record<PromotionField, string>>

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return (
    <p role="alert" aria-live="polite" className="mt-1 text-[11px] font-bold text-rose-600">
      {message}
    </p>
  )
}

/** 'HH:mm' from the time input; the API takes 'HH:mm:ss'. */
function toApiTime(value: string): string {
  return value.length === 5 ? `${value}:00` : value
}

/** 'HH:mm:ss' from the API; the time input takes 'HH:mm'. */
function toInputTime(value: string): string {
  return value.slice(0, 5)
}

export default function CreateEditPosPromotionModal({
  promotion,
  isSaving,
  onSubmit,
  onClose,
}: {
  /** Null while creating. */
  promotion: PosPromotionApiDto | null
  isSaving: boolean
  onSubmit: (payload: PosPromotionPayload) => void
  onClose: () => void
}) {
  const { t } = useTranslation()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [name, setName] = useState('')
  const [badgeLabel, setBadgeLabel] = useState('')
  const [description, setDescription] = useState('')
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null)
  const [discountType, setDiscountType] = useState<PosServiceDiscountType>(PosServiceDiscountType.Percent)
  const [valueInput, setValueInput] = useState('')
  const [days, setDays] = useState<string[]>([])
  const [startTime, setStartTime] = useState(DEFAULT_START)
  const [endTime, setEndTime] = useState(DEFAULT_END)
  const [isActive, setIsActive] = useState(true)
  const [fieldErrors, setFieldErrors] = useState<PromotionErrors>({})

  useEffect(() => {
    setName(promotion?.name ?? '')
    setBadgeLabel(promotion?.badgeLabel ?? '')
    setDescription(promotion?.description ?? '')
    setPhotoFile(null)
    setPhotoPreviewUrl(promotion?.photoUrl ?? null)
    setDiscountType(
      promotion?.discountType === PosServiceDiscountType.Amount
        ? PosServiceDiscountType.Amount
        : PosServiceDiscountType.Percent,
    )
    setValueInput(promotion ? String(promotion.discountValue) : '')
    setDays(promotion?.daysOfWeek ?? [])
    setStartTime(promotion ? toInputTime(promotion.startTime) : DEFAULT_START)
    setEndTime(promotion ? toInputTime(promotion.endTime) : DEFAULT_END)
    setIsActive(promotion?.isActive ?? true)
    setFieldErrors({})
  }, [promotion])

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

    onSubmit({
      name: name.trim(),
      badgeLabel: badgeLabel.trim() || null,
      description: description.trim() || null,
      photo: photoFile,
      discountType,
      discountValue: parsedValue,
      daysOfWeek: days,
      startTime: toApiTime(startTime),
      endTime: toApiTime(endTime),
      isActive,
    })
  }

  const inputClass =
    'h-10 w-full rounded-lg border bg-white px-3 text-xs text-nexoraText outline-none border-nexoraBorder focus:border-nexoraBrand'
  const invalidInputClass =
    'h-10 w-full rounded-lg border bg-white px-3 text-xs text-nexoraText outline-none border-rose-400 focus:border-rose-400'
  const fieldClass = (field: PromotionField) => (fieldErrors[field] ? invalidInputClass : inputClass)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="nexora-modal-card flex w-full max-w-md flex-col rounded-2xl bg-nexoraSurface shadow-xl">
        <div className="flex items-center justify-between gap-3 border-b border-nexoraBorder px-4 py-3">
          <h2 className="text-sm font-bold text-nexoraText">
            {promotion ? t(`${K}.editTitle`) : t(`${K}.createTitle`)}
          </h2>
          <IconButton label={t(`${K}.cancel`)} onClick={onClose}>
            <X className="h-4 w-4" />
          </IconButton>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
          <div>
            <label className="mb-1 block text-[11px] font-semibold text-nexoraMuted">{t(`${K}.nameLabel`)}</label>
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
              className={fieldClass(PromotionField.Name)}
            />
            <FieldError message={fieldErrors.name} />
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-semibold text-nexoraMuted">{t(`${K}.badgeLabel`)}</label>
            <input
              type="text"
              value={badgeLabel}
              maxLength={50}
              onChange={(e) => setBadgeLabel(e.target.value)}
              placeholder={t(`${K}.badgePlaceholder`)}
              className={inputClass}
            />
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-semibold text-nexoraMuted">
              {t(`${K}.descriptionLabel`)}
            </label>
            <textarea
              value={description}
              maxLength={1000}
              rows={2}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t(`${K}.descriptionPlaceholder`)}
              className="w-full rounded-lg border border-nexoraBorder bg-white px-3 py-2 text-xs text-nexoraText outline-none focus:border-nexoraBrand"
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label={t(`${K}.photoLabel`)}
              onClick={() => fileInputRef.current?.click()}
              className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-dashed border-nexoraBorder bg-nexoraCanvas text-slate-400 hover:border-nexoraBrand hover:text-nexoraBrand"
            >
              {photoPreviewUrl ? (
                <img src={photoPreviewUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <ImagePlus className="h-5 w-5" />
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)}
            />
            <span className="text-[11px] text-nexoraMuted">{t(`${K}.photoLabel`)}</span>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-[11px] font-semibold text-nexoraMuted">{t(`${K}.typeLabel`)}</label>
              <div className="flex items-center gap-2">
                {[PosServiceDiscountType.Percent, PosServiceDiscountType.Amount].map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => {
                      setDiscountType(type)
                      clearFieldError(PromotionField.Value)
                    }}
                    className={`h-10 flex-1 rounded-lg border text-[11px] font-semibold transition-colors ${
                      discountType === type
                        ? 'border-nexoraBrand/50 bg-nexoraBrandSoft text-nexoraBrandDark'
                        : 'border-nexoraBorder bg-white text-nexoraText hover:border-nexoraBrand/50'
                    }`}
                  >
                    {t(`components.dashboard.views.pos.OrderDiscountSection.type.${type}`)}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div aria-hidden className="mb-1 h-[15px]" />
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-xs font-medium text-nexoraMuted">
                  {isPercent ? '%' : '$'}
                </span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={valueInput}
                  onChange={(e) => {
                    setValueInput(sanitizeDecimalInput(e.target.value))
                    clearFieldError(PromotionField.Value)
                  }}
                  placeholder={isPercent ? '15' : '10'}
                  aria-label={t(`${K}.valueLabel`)}
                  aria-invalid={Boolean(fieldErrors.value)}
                  className={`${fieldClass(PromotionField.Value)} pl-7`}
                />
              </div>
              <FieldError message={fieldErrors.value} />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-semibold text-nexoraMuted">{t(`${K}.daysLabel`)}</label>
            <div className="flex flex-wrap gap-1.5">
              {POS_WEEK_DAYS.map((day) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDay(day)}
                  className={`h-9 min-w-[44px] rounded-full border px-3 text-[11px] font-semibold transition-colors ${
                    days.includes(day)
                      ? 'border-nexoraBrand/50 bg-nexoraBrandSoft text-nexoraBrandDark'
                      : fieldErrors.days
                        ? 'border-rose-400 bg-white text-nexoraText'
                        : 'border-nexoraBorder bg-white text-nexoraText hover:border-nexoraBrand/50'
                  }`}
                >
                  {t(`components.dashboard.views.pos.OrderDiscountSection.dayShort.${day}`)}
                </button>
              ))}
            </div>
            <FieldError message={fieldErrors.days} />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-[11px] font-semibold text-nexoraMuted">{t(`${K}.startLabel`)}</label>
              <input
                type="time"
                lang={TWELVE_HOUR_INPUT_LANG}
                value={startTime}
                onChange={(e) => {
                  setStartTime(e.target.value)
                  clearFieldError(PromotionField.Window)
                }}
                aria-invalid={Boolean(fieldErrors.window)}
                className={fieldClass(PromotionField.Window)}
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-semibold text-nexoraMuted">{t(`${K}.endLabel`)}</label>
              <input
                type="time"
                lang={TWELVE_HOUR_INPUT_LANG}
                value={endTime}
                onChange={(e) => {
                  setEndTime(e.target.value)
                  clearFieldError(PromotionField.Window)
                }}
                aria-invalid={Boolean(fieldErrors.window)}
                className={fieldClass(PromotionField.Window)}
              />
            </div>
          </div>

          <FieldError message={fieldErrors.window} />

          <label className="flex items-center gap-2 text-xs font-semibold text-nexoraText">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-4 w-4 rounded border-nexoraBorder text-nexoraBrand"
            />
            {t(`${K}.activeLabel`)}
          </label>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-nexoraBorder px-4 py-3">
          <button
            type="button"
            onClick={onClose}
            className="h-10 rounded-lg border border-nexoraBorder px-4 text-xs font-semibold text-nexoraText hover:bg-nexoraCanvas"
          >
            {t(`${K}.cancel`)}
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSaving}
            className="h-10 rounded-lg bg-nexoraBrand px-4 text-xs font-bold text-white hover:bg-nexoraBrandDark disabled:opacity-60"
          >
            {t(`${K}.save`)}
          </button>
        </div>
      </div>
    </div>
  )
}
