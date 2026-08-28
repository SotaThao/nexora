// CreateEditPosPromotionModal — one offer: what it is called, how much it takes off, which days it
// runs and the daily window it runs in.
//
// One window per promotion by design: a different window on Saturday is a second offer with its own
// name, which is also how the front desk reads the cards at the counter.
import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
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
  const [name, setName] = useState('')
  const [badgeLabel, setBadgeLabel] = useState('')
  const [discountType, setDiscountType] = useState<PosServiceDiscountType>(PosServiceDiscountType.Percent)
  const [valueInput, setValueInput] = useState('')
  const [days, setDays] = useState<string[]>([])
  const [startTime, setStartTime] = useState(DEFAULT_START)
  const [endTime, setEndTime] = useState(DEFAULT_END)
  const [isActive, setIsActive] = useState(true)

  useEffect(() => {
    setName(promotion?.name ?? '')
    setBadgeLabel(promotion?.badgeLabel ?? '')
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
  }, [promotion])

  const parsedValue = Number(valueInput)
  const isPercent = discountType === PosServiceDiscountType.Percent
  const isValueValid =
    Boolean(valueInput) &&
    Number.isFinite(parsedValue) &&
    parsedValue > 0 &&
    (!isPercent || parsedValue <= MAX_DISCOUNT_PERCENT)
  const isWindowValid = Boolean(startTime) && Boolean(endTime) && endTime > startTime
  const canSubmit = Boolean(name.trim()) && isValueValid && days.length > 0 && isWindowValid && !isSaving

  const toggleDay = (day: string) => {
    setDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]))
  }

  const handleSubmit = () => {
    if (!canSubmit) return
    onSubmit({
      name: name.trim(),
      badgeLabel: badgeLabel.trim() || null,
      discountType,
      discountValue: parsedValue,
      daysOfWeek: days,
      startTime: toApiTime(startTime),
      endTime: toApiTime(endTime),
      isActive,
    })
  }

  const inputClass =
    'h-10 w-full rounded-lg border border-nexoraBorder bg-white px-3 text-xs text-nexoraText outline-none focus:border-nexoraBrand'

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
              onChange={(e) => setName(e.target.value)}
              placeholder={t(`${K}.namePlaceholder`)}
              className={inputClass}
            />
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

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-[11px] font-semibold text-nexoraMuted">{t(`${K}.typeLabel`)}</label>
              <div className="flex items-center gap-2">
                {[PosServiceDiscountType.Percent, PosServiceDiscountType.Amount].map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setDiscountType(type)}
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
              <label className="mb-1 block text-[11px] font-semibold text-nexoraMuted">{t(`${K}.valueLabel`)}</label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-xs font-medium text-nexoraMuted">
                  {isPercent ? '%' : '$'}
                </span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={valueInput}
                  onChange={(e) => setValueInput(sanitizeDecimalInput(e.target.value))}
                  placeholder={isPercent ? '15' : '10'}
                  className={`${inputClass} pl-7`}
                />
              </div>
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
                      : 'border-nexoraBorder bg-white text-nexoraText hover:border-nexoraBrand/50'
                  }`}
                >
                  {t(`components.dashboard.views.pos.OrderDiscountSection.dayShort.${day}`)}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-[11px] font-semibold text-nexoraMuted">{t(`${K}.startLabel`)}</label>
              <input
                type="time"
                lang={TWELVE_HOUR_INPUT_LANG}
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-semibold text-nexoraMuted">{t(`${K}.endLabel`)}</label>
              <input
                type="time"
                lang={TWELVE_HOUR_INPUT_LANG}
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          {!isWindowValid && startTime && endTime ? (
            <p className="text-[11px] font-bold text-rose-600">{t(`${K}.windowInvalid`)}</p>
          ) : null}

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
            disabled={!canSubmit}
            className="h-10 rounded-lg bg-nexoraBrand px-4 text-xs font-bold text-white hover:bg-nexoraBrandDark disabled:opacity-60"
          >
            {t(`${K}.save`)}
          </button>
        </div>
      </div>
    </div>
  )
}
