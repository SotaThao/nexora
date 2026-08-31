// OrderDiscountSection — "Discount all services": one discount off the whole visit, entered as a
// dollar amount or a percentage, or picked from the offers this visit qualifies for.
//
// Built as an inline panel next to Tip rather than a modal because it is the same kind of decision
// as a tip: one number at order level, applied on tap with no Save step. The salon always absorbs
// it, so unlike the per-service discount there is no cost bearer to choose.
//
// Nothing here is the source of truth. The value is sent as typed and the resolved figure comes back
// from the order refetch — the preview math exists only to keep the panel responsive between the two.
import { useEffect, useState } from 'react'
import { Info } from 'lucide-react'
import { useTranslation } from '../../../../contexts/LanguageContext'
import {
  MAX_DISCOUNT_PERCENT,
  ORDER_DISCOUNT_AMOUNT_CHIPS,
  ORDER_DISCOUNT_PERCENT_CHIPS,
  PosServiceDiscountType,
} from '../../../../constants/posDiscount'
import {
  formatUsdInputAmount,
  parseDirectPaymentAmountInput,
  sanitizeDecimalInput,
  sanitizeDirectPaymentAmountInput,
} from '../../../../utils/currencyInput'
import { isOrderDiscountCapped } from '../../../../utils/posOrderDiscount'
import type { EligiblePromotionApiDto, OrderDetailApiDto, SetOrderDiscountPayload } from '../../../../types/repositories'
import { formatPromotionDays, formatPromotionRate, formatPromotionWindow } from './posPromotionDisplay'

const K = 'components.dashboard.views.pos.OrderDiscountSection'

export default function OrderDiscountSection({
  order,
  promotions,
  isSaving,
  onApply,
}: {
  order: OrderDetailApiDto
  promotions: EligiblePromotionApiDto[]
  isSaving: boolean
  onApply: (payload: SetOrderDiscountPayload) => void
}) {
  const { t, currentLanguage } = useTranslation()
  const [discountType, setDiscountType] = useState<PosServiceDiscountType>(PosServiceDiscountType.Amount)
  const [customInput, setCustomInput] = useState('')
  const [customError, setCustomError] = useState<string | null>(null)

  // A different visit starts the panel over; anything else keeps whichever tab the operator is on.
  useEffect(() => {
    setDiscountType(
      order.orderDiscountType === PosServiceDiscountType.Percent
        ? PosServiceDiscountType.Percent
        : PosServiceDiscountType.Amount,
    )
    setCustomInput('')
    setCustomError(null)
  }, [order.id])

  // Adopt the server's answer only while a discount actually exists. Clearing must NOT drag the tab
  // back to Amount: switching Amount -> Percent clears the old value first, and re-seeding from the
  // now-empty order would land the operator back on the tab they just left.
  useEffect(() => {
    if (!order.orderDiscountType) return

    setDiscountType(
      order.orderDiscountType === PosServiceDiscountType.Percent
        ? PosServiceDiscountType.Percent
        : PosServiceDiscountType.Amount,
    )
    const value = order.orderDiscountValue
    const isChipValue =
      value != null &&
      (order.orderDiscountType === PosServiceDiscountType.Percent
        ? ORDER_DISCOUNT_PERCENT_CHIPS.some((chip) => chip === value)
        : ORDER_DISCOUNT_AMOUNT_CHIPS.some((chip) => chip === value))
    setCustomInput(
      value != null && !isChipValue
        ? order.orderDiscountType === PosServiceDiscountType.Percent
          ? String(value)
          : formatUsdInputAmount(value)
        : '',
    )
    setCustomError(null)
  }, [order.orderDiscountType, order.orderDiscountValue])

  const isPercent = discountType === PosServiceDiscountType.Percent
  const chips: readonly number[] = isPercent ? ORDER_DISCOUNT_PERCENT_CHIPS : ORDER_DISCOUNT_AMOUNT_CHIPS
  const activeValue = order.orderDiscountType === discountType ? order.orderDiscountValue ?? null : null
  const lineDiscountTotal = order.discountAmount

  const wasCapped = isOrderDiscountCapped(
    order.orderDiscountType,
    order.orderDiscountValue,
    order.servicesSubtotal,
    order.orderDiscountCap,
  )

  const applyValue = (value: number) => {
    setCustomError(null)
    onApply({ discountType, discountValue: value, promotionId: null })
  }

  const handleTypeChange = (next: PosServiceDiscountType) => {
    setDiscountType(next)
    setCustomInput('')
    setCustomError(null)
    // Switching Amount <-> Percent while a discount is applied would otherwise leave "$15" reading
    // as "15%" until the next tap, which is a real money difference on screen.
    if (order.orderDiscountType && order.orderDiscountType !== next) {
      onApply({ discountType: null, discountValue: null, promotionId: null })
    }
  }

  // 0 is not a discount the backend can store (SetOrderDiscount requires a value above 0) and it is
  // not a request to remove one either — Remove is its own button. Saying so beats the old silent
  // return, which left the previous discount applied with nothing on screen explaining why.
  const handleCustomCommit = () => {
    if (!customInput) {
      setCustomError(null)
      return
    }
    const parsed = parseDirectPaymentAmountInput(customInput)
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setCustomError(t(`${K}.customMustBePositive`))
      return
    }
    setCustomError(null)
    applyValue(isPercent && parsed > MAX_DISCOUNT_PERCENT ? MAX_DISCOUNT_PERCENT : parsed)
  }

  const handleClear = () => {
    setCustomInput('')
    setCustomError(null)
    onApply({ discountType: null, discountValue: null, promotionId: null })
  }

  const hasDiscount = Boolean(order.orderDiscountType)

  return (
    <div className="space-y-3 rounded-xl border border-nexoraBorder/70 bg-nexoraSurface p-3 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <h3 className="text-[10px] font-bold uppercase tracking-wide text-nexoraMuted">{t(`${K}.title`)}</h3>
          <span
            role="img"
            aria-label={t(`${K}.formulaTooltip`)}
            title={t(`${K}.formulaTooltip`)}
            className="inline-flex cursor-help text-nexoraMuted"
          >
            <Info className="h-3.5 w-3.5" />
          </span>
        </div>
        {hasDiscount ? (
          <button
            type="button"
            onClick={handleClear}
            disabled={isSaving}
            className="rounded-lg border border-nexoraBorder/70 px-2.5 py-1 text-[10px] font-semibold text-nexoraText transition-colors hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-60"
          >
            {t(`${K}.clearButton`)}
          </button>
        ) : null}
      </div>

      <div className="flex items-center gap-2">
        {[PosServiceDiscountType.Amount, PosServiceDiscountType.Percent].map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => handleTypeChange(type)}
            disabled={isSaving}
            className={`h-8 flex-1 rounded-lg border text-[11px] font-semibold transition-colors disabled:opacity-60 ${
              discountType === type
                ? 'border-nexoraBrand/50 bg-nexoraBrandSoft text-nexoraBrandDark'
                : 'border-nexoraBorder/70 bg-white text-nexoraText hover:border-nexoraBrand/50 hover:bg-nexoraBrandSoft/40'
            }`}
          >
            {t(`${K}.type.${type}`)}
          </button>
        ))}
      </div>

      <div className="flex flex-nowrap items-center gap-1.5">
        {chips.map((chip) => (
          <button
            key={chip}
            type="button"
            onClick={() => applyValue(chip)}
            disabled={isSaving}
            className={`inline-flex h-8 min-w-0 flex-1 items-center justify-center whitespace-nowrap rounded-lg border px-1 text-[11px] font-semibold transition-colors disabled:opacity-60 ${
              activeValue === chip
                ? 'border-nexoraBrand/50 bg-nexoraBrandSoft text-nexoraBrandDark'
                : 'border-nexoraBorder/70 bg-white text-nexoraText hover:border-nexoraBrand/50 hover:bg-nexoraBrandSoft/40'
            }`}
          >
            {isPercent ? `${chip}%` : `$${chip}`}
          </button>
        ))}
        <div className="min-w-0 flex-[1.8_1_0%]">
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-xs font-medium text-nexoraMuted">
              {isPercent ? '%' : '$'}
            </span>
            <input
              type="text"
              inputMode="decimal"
              value={customInput}
              onChange={(e) => {
                setCustomInput(
                  isPercent
                    ? sanitizeDecimalInput(e.target.value)
                    : sanitizeDirectPaymentAmountInput(e.target.value, Number.MAX_SAFE_INTEGER),
                )
                setCustomError(null)
              }}
              onBlur={handleCustomCommit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleCustomCommit()
                }
              }}
              placeholder={t(`${K}.customPlaceholder`)}
              aria-invalid={customError !== null}
              className={`h-8 w-full min-w-0 rounded-lg border bg-nexoraCanvas/30 pl-7 pr-2 text-xs text-nexoraText outline-none transition-colors ${
                customError
                  ? 'border-rose-400'
                  : customInput
                    ? 'border-nexoraBrand/60 bg-nexoraBrandSoft/20'
                    : 'border-nexoraBorder/70'
              }`}
            />
          </div>
        </div>
      </div>

      {customError ? (
        <p role="alert" aria-live="polite" className="text-[10px] font-bold text-rose-600">
          {customError}
        </p>
      ) : null}

      {hasDiscount ? (
        <p className="text-[10px] font-semibold text-nexoraMuted">
          {t(`${K}.appliedAmount`, { amount: order.orderDiscountAmount.toFixed(2) })}
        </p>
      ) : null}

      {wasCapped ? (
        <p className="text-[10px] font-bold text-amber-600">
          {t(`${K}.cappedNotice`, {
            cap: order.orderDiscountCap.toFixed(2),
            lineDiscount: lineDiscountTotal.toFixed(2),
          })}
        </p>
      ) : null}

      {promotions.length > 0 ? (
        <div className="space-y-1.5 border-t border-nexoraBorder/70 pt-2.5">
          <h4 className="text-[10px] font-bold uppercase tracking-wide text-nexoraMuted">{t(`${K}.promotionsTitle`)}</h4>
          {promotions.map((promotion) => {
            const isApplied = order.appliedPromotionId === promotion.id
            return (
              <button
                key={promotion.id}
                type="button"
                onClick={() => onApply({ promotionId: promotion.id, discountType: null, discountValue: null })}
                disabled={isSaving}
                className={`flex w-full items-center justify-between gap-3 rounded-lg border p-2.5 text-left transition-colors disabled:opacity-60 ${
                  isApplied
                    ? 'border-nexoraBrand/50 bg-nexoraBrandSoft'
                    : 'border-nexoraBorder/70 bg-white hover:border-nexoraBrand/50 hover:bg-nexoraBrandSoft/40'
                }`}
              >
                <span className="min-w-0">
                  {promotion.badgeLabel ? (
                    <span className="mb-1 inline-flex rounded-md bg-indigo-50 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-indigo-600">
                      {promotion.badgeLabel}
                    </span>
                  ) : null}
                  <span className="block break-words text-xs font-bold text-nexoraText">{promotion.name}</span>
                  <span className="block truncate text-[10px] text-nexoraMuted">
                    {formatPromotionDays(promotion.daysOfWeek, (day) => t(`${K}.dayShort.${day}`))} ·{' '}
                    {formatPromotionWindow(promotion.startTime, promotion.endTime, currentLanguage)}
                  </span>
                </span>
                <span className="shrink-0 text-xs font-black text-nexoraBrandDark">
                  {t(`${K}.promotionRate`, {
                    rate: formatPromotionRate(promotion.discountType, promotion.discountValue),
                  })}
                </span>
              </button>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}
