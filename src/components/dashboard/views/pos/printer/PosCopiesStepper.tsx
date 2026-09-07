/**
 * 0..3 copy picker.
 *
 * Buttons and a readout rather than a number input, deliberately: this lives on a POS iPad, where
 * focusing an input summons the on-screen keyboard over the settings the operator is editing. The
 * range is three values wide, so nothing is gained by allowing typing — and an input would also
 * pull in the placeholder requirements that apply to real text fields.
 */
import { Minus, Plus } from 'lucide-react'
import { RECEIPT_COPIES_MAX, RECEIPT_COPIES_MIN } from '../../../../../constants/posPrinter'

export default function PosCopiesStepper({
  value,
  onChange,
  label,
  decreaseLabel,
  increaseLabel,
  disabled = false,
}: {
  value: number
  onChange: (next: number) => void
  label: string
  decreaseLabel: string
  increaseLabel: string
  disabled?: boolean
}) {
  const atMin = value <= RECEIPT_COPIES_MIN
  const atMax = value >= RECEIPT_COPIES_MAX

  const buttonClass =
    'flex h-11 w-11 items-center justify-center rounded-lg border border-nexoraBorder text-nexoraText transition-colors hover:border-nexoraBrand disabled:opacity-40 disabled:hover:border-nexoraBorder'

  return (
    <div className="flex items-center gap-2" role="group" aria-label={label}>
      <button
        type="button"
        className={buttonClass}
        onClick={() => onChange(Math.max(RECEIPT_COPIES_MIN, value - 1))}
        disabled={disabled || atMin}
        aria-label={decreaseLabel}
      >
        <Minus className="h-4 w-4" aria-hidden="true" />
      </button>
      <span
        className="min-w-[2.5rem] text-center text-sm font-black tabular-nums text-nexoraText"
        aria-live="polite"
      >
        {value}
      </span>
      <button
        type="button"
        className={buttonClass}
        onClick={() => onChange(Math.min(RECEIPT_COPIES_MAX, value + 1))}
        disabled={disabled || atMax}
        aria-label={increaseLabel}
      >
        <Plus className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  )
}
