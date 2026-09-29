// TipModal — how a tip gets set on the checkout screen.
//
// A single technician gets one Amount/Percent value entry, the same shape as the "Discount all
// services" modal (DISCOUNT AS + VALUE). Two or more technicians add a "Chia đều" / "Tip riêng
// từng thợ" toggle above it: "Chia đều" reuses that same value entry (the order gets one tip,
// split evenly server-side); "Tip riêng từng thợ" swaps it for a row per technician instead.
import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import { useTranslation } from '../../../../../contexts/LanguageContext'
import IconButton from '../../../../ui/IconButton'
import {
  formatUsdInputAmount,
  parseDirectPaymentAmountInput,
  sanitizeDecimalInput,
  sanitizeDirectPaymentAmountInput,
} from '../../../../../utils/currencyInput'
import type { TipMode, TipPanelMode } from '../PosOrderWorkspace'

const K = 'components.dashboard.views.pos.PosOrderWorkspace'

// Cycled by row index so each technician reads as a distinct chip at a glance — this is a display
// aid only, not a per-technician identity, so it does not need to be stable across reorders.
const AVATAR_COLORS = [
  'bg-violet-500',
  'bg-sky-500',
  'bg-rose-500',
  'bg-emerald-500',
  'bg-amber-500',
  'bg-indigo-500',
]

const PER_STAFF_QUICK_AMOUNTS = [5, 10, 15, 20]
// Same figures as ORDER_AMOUNT_DISCOUNT_PRESETS / PERCENT_DISCOUNT_PRESETS in ServiceDiscountModal
// — the two value-entry modals read as one family rather than each inventing its own scale.
const AMOUNT_PRESETS = [5, 10, 15, 20]
const PERCENT_PRESETS = [5, 10, 15, 20]

type TipValueType = 'amount' | 'percent'

const round2 = (value: number) => Math.round(value * 100) / 100

export default function TipModal({
  open,
  onClose,
  panelMode,
  onSelectPanelMode,
  technicians,
  servicesSubtotal,
  orderTipAmount,
  onApplyTip,
  tipSplitInputs,
  onTipSplitInputChange,
  tipSplitTotal,
  onSavePerStaffTip,
  isBusy,
}: {
  open: boolean
  onClose: () => void
  panelMode: TipPanelMode
  onSelectPanelMode: (mode: TipPanelMode) => void
  technicians: { posStaffProfileId: string; technicianName: string; photoUrl?: string | null }[]
  servicesSubtotal: number
  orderTipAmount: number
  onApplyTip: (mode: TipMode, amount: number) => void
  tipSplitInputs: Record<string, string>
  onTipSplitInputChange: (posStaffProfileId: string, value: string) => void
  tipSplitTotal: number
  onSavePerStaffTip: () => void
  isBusy: boolean
}) {
  const { t } = useTranslation()
  const [valueType, setValueType] = useState<TipValueType>('amount')
  const [valueInput, setValueInput] = useState('')
  // "Hand to customer" does not leave this modal for a separate screen any more — it just grows
  // this same dialog full-screen so the device can be turned around, everything else unchanged.
  const [isCustomerFacing, setIsCustomerFacing] = useState(false)

  // Seeded once per open (not on every order refetch) so a save's own optimistic update doesn't
  // yank the field out from under whatever the cashier is mid-edit on.
  const wasOpenRef = useRef(false)
  useEffect(() => {
    if (open && !wasOpenRef.current) {
      setValueType('amount')
      setValueInput(orderTipAmount > 0 ? formatUsdInputAmount(orderTipAmount) : '')
      setIsCustomerFacing(false)
    }
    wasOpenRef.current = open
  }, [open, orderTipAmount])

  if (!open) return null

  const hasMultipleStaff = technicians.length > 1
  const activeTab: TipPanelMode = panelMode === 'perStaff' && hasMultipleStaff ? 'perStaff' : 'even'

  const parsedValue = parseDirectPaymentAmountInput(valueInput)
  const hasValidValue = valueInput.trim() !== '' && Number.isFinite(parsedValue) && parsedValue > 0
  const resolvedAmount = hasValidValue
    ? valueType === 'percent'
      ? round2((servicesSubtotal * parsedValue) / 100)
      : round2(parsedValue)
    : 0

  const handleSaveValue = () => {
    if (!hasValidValue) return
    onApplyTip('custom', resolvedAmount)
    onClose()
  }

  const segmentClass = (active: boolean) =>
    `flex-1 rounded-md px-2 py-1.5 text-[11px] font-bold transition-colors ${
      active ? 'bg-white text-nexoraBrandDark shadow-sm' : 'text-nexoraMuted hover:text-nexoraText'
    }`

  const valueEntry = (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <span className="text-[10px] font-black uppercase tracking-wider text-nexoraMuted">
          {t(`${K}.tipValueTypeLabel`)}
        </span>
        <div className="flex gap-2">
          {(['amount', 'percent'] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => {
                setValueType(option)
                setValueInput((current) => (
                  option === 'amount'
                    ? sanitizeDirectPaymentAmountInput(current, Number.MAX_SAFE_INTEGER)
                    : sanitizeDecimalInput(current)
                ))
              }}
              disabled={isBusy}
              aria-pressed={valueType === option}
              className={`h-9 flex-1 rounded-lg border text-xs font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                valueType === option
                  ? 'border-nexoraBrand bg-nexoraBrandSoft/60 text-nexoraBrandDark'
                  : 'border-nexoraBorder bg-white text-nexoraText hover:border-nexoraBrand/50'
              }`}
            >
              {t(`${K}.tipValueType.${option}`)}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <span className="text-[10px] font-black uppercase tracking-wider text-nexoraMuted">
          {t(`${K}.tipValueLabel`)}
        </span>
        <div className="flex flex-wrap items-center gap-2">
          {(valueType === 'amount' ? AMOUNT_PRESETS : PERCENT_PRESETS).map((preset) => {
            const selected = hasValidValue && parsedValue === preset
            return (
              <button
                key={preset}
                type="button"
                onClick={() => setValueInput(String(preset))}
                disabled={isBusy}
                aria-pressed={selected}
                className={`inline-flex h-9 min-w-[48px] flex-[1_1_auto] items-center justify-center whitespace-nowrap rounded-lg border px-3 text-xs font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                  selected
                    ? 'border-nexoraBrand bg-nexoraBrandSoft/60 text-nexoraBrandDark'
                    : 'border-nexoraBorder bg-white text-nexoraText hover:border-nexoraBrand/50'
                }`}
              >
                {valueType === 'amount' ? `$${preset}` : `${preset}%`}
              </button>
            )
          })}
          <div className="flex h-9 min-w-[120px] flex-[2_1_120px] overflow-hidden rounded-lg border border-nexoraBorder bg-white focus-within:border-nexoraBrand">
            <span className="flex w-9 shrink-0 items-center justify-center border-r border-nexoraBorder bg-nexoraCanvas text-sm font-bold text-nexoraMuted">
              {valueType === 'amount' ? '$' : '%'}
            </span>
            <input
              type="text"
              inputMode="decimal"
              autoComplete="off"
              value={valueInput}
              onChange={(e) =>
                setValueInput(
                  valueType === 'amount'
                    ? sanitizeDirectPaymentAmountInput(e.target.value, Number.MAX_SAFE_INTEGER)
                    : sanitizeDecimalInput(e.target.value),
                )
              }
              disabled={isBusy}
              placeholder={t(`${K}.customTipPlaceholder`)}
              className="min-w-0 flex-1 border-0 px-3 text-sm font-semibold text-nexoraText outline-none disabled:cursor-not-allowed disabled:opacity-60"
            />
          </div>
        </div>
      </div>

      {/* In Percent mode the typed number is not a dollar figure — this is the only place the
          actual tip amount is visible before Save. Same TOTAL row style as the per-technician
          tab's footer, so the two tabs read as one modal rather than two different ones. */}
      {hasValidValue ? (
        <div className="space-y-1.5 border-t border-nexoraBorder/70 pt-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-nexoraMuted">
              {t(`${K}.tipSplitGrandTotal`)}
            </span>
            <span className="text-sm font-black text-nexoraText">${resolvedAmount.toFixed(2)}</span>
          </div>
          {/* Only means something once the tip is actually shared — a single-technician ticket has
              nowhere for a per-person figure to add information. */}
          {hasMultipleStaff ? (
            <p className="text-xs font-bold text-nexoraBrandDark">
              {t(`${K}.tipEvenPerPerson`, {
                amount: round2(resolvedAmount / technicians.length).toFixed(2),
              })}
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="flex gap-2 pt-1">
        {orderTipAmount > 0 ? (
          <button
            type="button"
            onClick={() => {
              onApplyTip('noTip', 0)
              setValueInput('')
            }}
            disabled={isBusy}
            className="h-10 rounded-lg border border-rose-600 bg-rose-600 px-3 text-xs font-bold text-white hover:bg-rose-700 disabled:opacity-60"
          >
            {t(`${K}.noTipButton`)}
          </button>
        ) : null}
        <button
          type="button"
          onClick={handleSaveValue}
          disabled={!hasValidValue || isBusy}
          className="h-10 flex-1 rounded-lg bg-nexoraBrand text-xs font-bold text-white hover:bg-nexoraBrandDark disabled:opacity-60"
        >
          {t(`${K}.saveTipButton`)}
        </button>
      </div>
    </div>
  )

  return (
    <div
      className={
        isCustomerFacing
          ? 'fixed inset-0 z-[70] flex items-center justify-center bg-nexoraSurface p-6'
          : 'fixed inset-0 z-[60] flex items-center justify-center bg-nexoraText/70 p-4 backdrop-blur-sm'
      }
    >
      <div className={isCustomerFacing ? 'flex h-full w-full max-w-2xl flex-col' : 'nexora-modal-card max-w-xl'}>
        <div className="mb-4 flex shrink-0 items-center justify-between gap-3">
          <h2 className="text-sm font-extrabold text-nexoraText">{t(`${K}.tipModalTitle`)}</h2>
          <div className="flex items-center gap-2">
            {isCustomerFacing ? (
              <button
                type="button"
                onClick={() => setIsCustomerFacing(false)}
                className="rounded-lg border border-nexoraBorder px-2.5 py-1 text-[10px] font-semibold text-nexoraText transition-colors hover:border-nexoraBrand/50"
              >
                {t(`${K}.backToStaffButton`)}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsCustomerFacing(true)}
                className="rounded-lg border border-nexoraBrand/40 bg-nexoraBrandSoft/40 px-2.5 py-1 text-[10px] font-semibold text-nexoraBrandDark transition-colors hover:bg-nexoraBrandSoft"
              >
                {t(`${K}.turnToCustomerButton`)}
              </button>
            )}
            {isCustomerFacing ? null : (
              <IconButton label={t(`${K}.tipModalClose`)} onClick={onClose}>
                <X className="h-4 w-4" />
              </IconButton>
            )}
          </div>
        </div>

        {isCustomerFacing ? (
          <div className="mb-4 shrink-0 text-center">
            <p className="text-lg font-bold text-nexoraText">{t(`${K}.customerFacingTitle`)}</p>
            <p className="text-xs text-nexoraMuted">{t(`${K}.customerFacingSubtitle`)}</p>
          </div>
        ) : null}

        <div className="flex-1 space-y-3 overflow-y-auto">
          {hasMultipleStaff ? (
            <div className="grid grid-cols-2 gap-1 rounded-lg bg-nexoraCanvas p-1">
              <button
                type="button"
                onClick={() => onSelectPanelMode('even')}
                className={segmentClass(activeTab === 'even')}
              >
                {t(`${K}.tipOptionEven`)}
              </button>
              <button
                type="button"
                onClick={() => onSelectPanelMode('perStaff')}
                className={segmentClass(activeTab === 'perStaff')}
              >
                {t(`${K}.tipOptionPerStaff`)}
              </button>
            </div>
          ) : null}

          {activeTab === 'even' ? valueEntry : null}

          {activeTab === 'perStaff' && hasMultipleStaff ? (
            <div className="space-y-2">
              {technicians.map((share, index) => {
                const currentValue = parseDirectPaymentAmountInput(tipSplitInputs[share.posStaffProfileId] ?? '')
                return (
                  <div
                    key={share.posStaffProfileId}
                    className="flex flex-wrap items-center gap-2 rounded-lg border border-nexoraBorder/60 bg-nexoraCanvas/40 p-2.5"
                  >
                    <span
                      aria-hidden="true"
                      className={`flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full text-[11px] font-black text-white ${AVATAR_COLORS[index % AVATAR_COLORS.length]}`}
                    >
                      {share.photoUrl ? (
                        <img src={share.photoUrl} alt="" className="h-full w-full object-cover" />
                      ) : (
                        share.technicianName.charAt(0).toUpperCase()
                      )}
                    </span>
                    <span className="min-w-[64px] flex-1 truncate text-xs font-semibold text-nexoraText">
                      {share.technicianName}
                    </span>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {PER_STAFF_QUICK_AMOUNTS.map((amount) => (
                        <button
                          key={amount}
                          type="button"
                          onClick={() => onTipSplitInputChange(share.posStaffProfileId, String(amount))}
                          disabled={isBusy}
                          className={`h-9 rounded-lg border px-2.5 text-xs font-bold transition-colors disabled:opacity-60 ${
                            currentValue === amount
                              ? 'border-nexoraBrand/50 bg-nexoraBrandSoft text-nexoraBrandDark'
                              : 'border-nexoraBorder/70 bg-white text-nexoraText hover:border-nexoraBrand/50'
                          }`}
                        >
                          ${amount}
                        </button>
                      ))}
                      <div className="relative w-24">
                        <span className="pointer-events-none absolute inset-y-0 left-2.5 flex items-center text-xs font-medium text-nexoraMuted">
                          $
                        </span>
                        <input
                          type="text"
                          inputMode="decimal"
                          value={tipSplitInputs[share.posStaffProfileId] ?? ''}
                          onChange={(e) =>
                            onTipSplitInputChange(
                              share.posStaffProfileId,
                              sanitizeDirectPaymentAmountInput(e.target.value, Number.MAX_SAFE_INTEGER),
                            )
                          }
                          disabled={isBusy}
                          className="h-9 w-full rounded-lg border border-nexoraBorder/70 bg-white pl-6 pr-2 text-xs text-nexoraText outline-none transition-colors focus:border-nexoraBrand/60 disabled:opacity-60"
                        />
                      </div>
                    </div>
                  </div>
                )
              })}

              <div className="flex items-center gap-2 border-t border-nexoraBorder/70 pt-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-nexoraMuted">
                  {t(`${K}.tipSplitGrandTotal`)}
                </span>
                <span className="text-sm font-black text-nexoraText">${round2(tipSplitTotal).toFixed(2)}</span>
              </div>

              <div className="flex gap-2">
                {orderTipAmount > 0 ? (
                  <button
                    type="button"
                    onClick={() => {
                      onApplyTip('noTip', 0)
                      technicians.forEach(({ posStaffProfileId }) => onTipSplitInputChange(posStaffProfileId, ''))
                    }}
                    disabled={isBusy}
                    className="h-10 rounded-lg border border-rose-600 bg-rose-600 px-3 text-xs font-bold text-white hover:bg-rose-700 disabled:opacity-60"
                  >
                    {t(`${K}.noTipButton`)}
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => {
                    onSavePerStaffTip()
                    onClose()
                  }}
                  disabled={isBusy || round2(tipSplitTotal) === round2(orderTipAmount)}
                  className="h-10 flex-1 rounded-lg bg-nexoraBrand text-xs font-bold text-white hover:bg-nexoraBrandDark disabled:opacity-60"
                >
                  {t(`${K}.saveTipSplitButton`)}
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
