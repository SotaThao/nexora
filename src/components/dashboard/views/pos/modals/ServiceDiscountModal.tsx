// ServiceDiscountModal — discounts one service on a ticket, and records who absorbs the cost.
//
// A popup rather than an in-row control because three decisions travel together (how much, who
// pays, why) and a wrong bearer moves real money out of a technician's pay.
//
// Nothing is computed here beyond the preview: the resolved dollar amount, the technician's share
// and any bearer fallback are all decided server-side, so this hands the raw entry back and lets
// the order detail refetch tell the truth.
import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { useTranslation } from '../../../../../contexts/LanguageContext'
import IconButton from '../../../../ui/IconButton'
import {
  MAX_DISCOUNT_PERCENT,
  POS_DISCOUNT_BEARER_OPTIONS,
  PosDiscountBearer,
  PosServiceDiscountType,
} from '../../../../../constants/posDiscount'
import { sanitizeDecimalInput } from '../../../../../utils/currencyInput'

const K = 'components.dashboard.views.pos.PosOrderWorkspace'

const DISCOUNT_VALUE_PLACEHOLDER_KEY = {
  [PosServiceDiscountType.Percent]: `${K}.discountPercentPlaceholder`,
  [PosServiceDiscountType.Amount]: `${K}.discountAmountPlaceholder`,
} as const

export interface ServiceDiscountTarget {
  serviceLineId: string
  serviceName: string
  lineTotal: number
  technicianName?: string
  canAssignDiscountToStaff: boolean
  discountType?: string | null
  discountValue?: number | null
  discountBearer?: string | null
  discountNote?: string | null
}

export interface ServiceDiscountSubmit {
  discountType: PosServiceDiscountType
  discountValue: number
  discountBearer: PosDiscountBearer
  discountNote: string | null
}

function resolvePreviewAmount(type: PosServiceDiscountType, value: number, lineTotal: number): number {
  const raw = type === PosServiceDiscountType.Percent ? (lineTotal * value) / 100 : value
  const rounded = Math.round(raw * 100) / 100
  return Math.min(Math.max(rounded, 0), lineTotal)
}

export default function ServiceDiscountModal({
  target,
  isSaving,
  onSubmit,
  onRemove,
  onClose,
}: {
  target: ServiceDiscountTarget | null
  isSaving: boolean
  onSubmit: (payload: ServiceDiscountSubmit) => void
  onRemove: () => void
  onClose: () => void
}) {
  const { t } = useTranslation()
  const [discountType, setDiscountType] = useState<PosServiceDiscountType>(PosServiceDiscountType.Amount)
  const [valueInput, setValueInput] = useState('')
  const [bearer, setBearer] = useState<PosDiscountBearer>(PosDiscountBearer.Salon)
  const [note, setNote] = useState('')

  // Re-seeded per line rather than once on mount: the same modal instance opens for a different
  // service the moment the operator picks another row.
  useEffect(() => {
    if (!target) return
    setDiscountType(
      target.discountType === PosServiceDiscountType.Percent
        ? PosServiceDiscountType.Percent
        : PosServiceDiscountType.Amount,
    )
    setValueInput(target.discountValue != null ? String(target.discountValue) : '')
    // A bearer the line can no longer carry (technician swapped for an hourly one) reads back as
    // Salon, which is also what the backend would have forced.
    const existingBearer = POS_DISCOUNT_BEARER_OPTIONS.find((b) => b === target.discountBearer)
    setBearer(
      existingBearer && (target.canAssignDiscountToStaff || existingBearer === PosDiscountBearer.Salon)
        ? existingBearer
        : PosDiscountBearer.Salon,
    )
    setNote(target.discountNote ?? '')
  }, [target])

  if (!target) return null

  const parsedValue = Number(valueInput)
  const hasNumber = valueInput.trim() !== '' && Number.isFinite(parsedValue)
  const isOverPercentLimit = discountType === PosServiceDiscountType.Percent && parsedValue > MAX_DISCOUNT_PERCENT
  // A discount larger than the line itself is a typo, not a giveaway — the backend clamps it to the
  // price, which would silently save a different number than the one that was typed.
  const isOverLineTotal = discountType === PosServiceDiscountType.Amount && parsedValue > target.lineTotal
  const hasValidValue = hasNumber && parsedValue > 0 && !isOverPercentLimit && !isOverLineTotal

  // Only once something has actually been typed — an empty field is "not filled in yet", not wrong.
  const validationMessage = !hasNumber
    ? null
    : isOverPercentLimit
      ? t(`${K}.discountPercentTooHigh`, { max: MAX_DISCOUNT_PERCENT })
      : isOverLineTotal
        ? t(`${K}.discountAmountTooHigh`, { max: target.lineTotal.toFixed(2) })
        : parsedValue <= 0
          ? t(`${K}.discountValueMustBePositive`)
          : null

  const previewAmount = hasValidValue ? resolvePreviewAmount(discountType, parsedValue, target.lineTotal) : 0
  // Halved in whole cents, not in dollars: (1.16 / 2) * 100 is 57.99999999999999 in binary
  // floating point, so flooring dollars showed $0.57 for a split the backend stores as $0.58.
  // PosServiceDiscountResolver.ResolveStaffShare runs on decimal and rounds toward zero — matched
  // here by flooring the integer cent count, which is exact.
  const previewStaffShare =
    bearer === PosDiscountBearer.Staff
      ? previewAmount
      : bearer === PosDiscountBearer.Split
        ? Math.floor(Math.round(previewAmount * 100) / 2) / 100
        : 0

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-nexoraText/70 p-4 backdrop-blur-sm">
      <div className="nexora-modal-card max-w-md">
        <div className="mb-4 flex shrink-0 items-center justify-between gap-3">
          <h2 className="min-w-0 truncate text-sm font-extrabold text-nexoraText">
            {t(`${K}.discountModalTitle`, { serviceName: target.serviceName })}
          </h2>
          <IconButton label={t(`${K}.discountModalClose`)} onClick={onClose} disabled={isSaving}>
            <X className="h-4 w-4" />
          </IconButton>
        </div>

        <div className="relative flex-1 space-y-4 overflow-y-auto">
          <p className="text-[11px] text-nexoraMuted">
            {t(`${K}.discountOriginalPrice`, { amount: target.lineTotal.toFixed(2) })}
          </p>

          <div className="space-y-1.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-nexoraMuted">
              {t(`${K}.discountTypeLabel`)}
            </span>
            <div className="flex gap-2">
              {[PosServiceDiscountType.Amount, PosServiceDiscountType.Percent].map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setDiscountType(option)}
                  disabled={isSaving}
                  className={`h-9 flex-1 rounded-lg border text-xs font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                    discountType === option
                      ? 'border-nexoraBrand bg-nexoraBrandSoft/60 text-nexoraBrandDark'
                      : 'border-nexoraBorder bg-white text-nexoraText hover:border-nexoraBrand/50'
                  }`}
                >
                  {t(`${K}.discountType${option}`)}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="service-discount-value"
              className="text-[10px] font-black uppercase tracking-wider text-nexoraMuted"
            >
              {t(`${K}.discountValueLabel`)}
            </label>
            {/* Deliberately a text input: type="number" accepts "e"/"E"/"+"/"-" as valid
                keystrokes, so those characters reach the field regardless of min/max. inputMode
                still brings up the numeric keypad on the iPad. */}
            <input
              id="service-discount-value"
              type="text"
              inputMode="decimal"
              autoComplete="off"
              value={valueInput}
              onChange={(event) => setValueInput(sanitizeDecimalInput(event.target.value))}
              disabled={isSaving}
              placeholder={t(DISCOUNT_VALUE_PLACEHOLDER_KEY[discountType])}
              aria-invalid={validationMessage !== null}
              aria-describedby={validationMessage ? 'service-discount-value-error' : undefined}
              className={`h-10 w-full rounded-lg border px-3 text-sm font-semibold text-nexoraText focus:outline-none disabled:cursor-not-allowed disabled:opacity-60 ${
                validationMessage
                  ? 'border-nexoraDanger focus:border-nexoraDanger'
                  : 'border-nexoraBorder focus:border-nexoraBrand'
              }`}
            />
            {validationMessage ? (
              <p id="service-discount-value-error" role="alert" className="text-[11px] font-bold text-nexoraDanger">
                {validationMessage}
              </p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-nexoraMuted">
              {t(`${K}.discountBearerLabel`)}
            </span>
            <div className="grid grid-cols-3 gap-2">
              {POS_DISCOUNT_BEARER_OPTIONS.map((option) => {
                const isLocked = option !== PosDiscountBearer.Salon && !target.canAssignDiscountToStaff
                return (
                  <button
                    key={option}
                    type="button"
                    disabled={isLocked || isSaving}
                    title={isLocked ? t(`${K}.discountBearerLockedHint`) : undefined}
                    onClick={() => setBearer(option)}
                    className={`h-9 rounded-lg border text-[11px] font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                      bearer === option
                        ? 'border-nexoraBrand bg-nexoraBrandSoft/60 text-nexoraBrandDark'
                        : 'border-nexoraBorder bg-white text-nexoraText hover:border-nexoraBrand/50'
                    }`}
                  >
                    {t(`${K}.discountBearer${option}`)}
                  </button>
                )
              })}
            </div>
            {!target.canAssignDiscountToStaff ? (
              <p className="text-[11px] text-amber-600">{t(`${K}.discountBearerLockedHint`)}</p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="service-discount-note"
              className="text-[10px] font-black uppercase tracking-wider text-nexoraMuted"
            >
              {t(`${K}.discountNoteLabel`)}
            </label>
            <input
              id="service-discount-note"
              type="text"
              maxLength={200}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              disabled={isSaving}
              placeholder={t(`${K}.discountNotePlaceholder`)}
              className="h-10 w-full rounded-lg border border-nexoraBorder px-3 text-sm text-nexoraText focus:border-nexoraBrand focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
            />
          </div>

          {hasValidValue ? (
            <div className="space-y-0.5 rounded-xl bg-nexoraCanvas p-3 text-[11px] text-nexoraText">
              <p>{t(`${K}.discountPreviewCustomer`, { amount: (target.lineTotal - previewAmount).toFixed(2) })}</p>
              <p>{t(`${K}.discountPreviewDiscount`, { amount: previewAmount.toFixed(2) })}</p>
              <p>
                {t(`${K}.discountPreviewSplit`, {
                  staff: previewStaffShare.toFixed(2),
                  salon: (previewAmount - previewStaffShare).toFixed(2),
                })}
              </p>
            </div>
          ) : null}
        </div>

        <div className="mt-4 flex shrink-0 gap-2">
          {target.discountType ? (
            <button
              type="button"
              onClick={onRemove}
              disabled={isSaving}
              className="h-10 rounded-lg border border-rose-200 px-3 text-xs font-bold text-rose-500 hover:bg-rose-50/70 disabled:opacity-60"
            >
              {t(`${K}.discountRemoveButton`)}
            </button>
          ) : null}
          <button
            type="button"
            onClick={() =>
              onSubmit({
                discountType,
                discountValue: parsedValue,
                discountBearer: bearer,
                discountNote: note.trim() === '' ? null : note.trim(),
              })
            }
            disabled={!hasValidValue || isSaving}
            className="h-10 flex-1 rounded-lg bg-nexoraBrand text-xs font-bold text-white hover:bg-nexoraBrandDark disabled:opacity-60"
          >
            {t(`${K}.discountSaveButton`)}
          </button>
        </div>
      </div>
    </div>
  )
}
