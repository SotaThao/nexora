// PhoneCheckInStep — Check-in Step 1 (POS iPad redesign, phone-first re-scope). Standalone,
// self-contained phone-entry screen with a large numeric keypad — deliberately has no
// dependency on PosOrderWorkspace/CustomerHeaderBar state so it can be dropped into the
// not-yet-built customer self-checkin kiosk screen unchanged (PO requirement: staff and
// customer check-in must use the identical component). Auto-advances the instant the 10th
// digit is entered — no separate "Continue" button, matching the reference kiosk mockup.
import { useEffect, useState } from 'react'
import { useTranslation } from '../../../../contexts/LanguageContext'
import { formatNationalNumber, PhoneDialCode } from '../../../CountryCodeSelect'

const KEYPAD_ROWS = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
] as const

const PHONE_NATIONAL_DIGITS = 10
const PHONE_GROUP_SIZES = [3, 3, 4] as const

function renderDigitSlots(digits: string) {
  const groups: string[] = []
  let cursor = 0
  for (const size of PHONE_GROUP_SIZES) {
    groups.push(digits.slice(cursor, cursor + size).padEnd(size, '_'))
    cursor += size
  }
  return groups.join('-')
}

export default function PhoneCheckInStep({
  businessName,
  initialDigits = '',
  onSubmit,
}: {
  businessName?: string
  initialDigits?: string
  onSubmit: (formattedPhone: string) => void
}) {
  const { t } = useTranslation()
  const [digits, setDigits] = useState(initialDigits.replace(/\D/g, '').slice(0, PHONE_NATIONAL_DIGITS))

  const handleDigitPress = (digit: string) => {
    if (digits.length >= PHONE_NATIONAL_DIGITS) return
    const next = digits + digit
    setDigits(next)
    if (next.length === PHONE_NATIONAL_DIGITS) {
      onSubmit(formatNationalNumber(next, PhoneDialCode.US))
    }
  }

  const handleBackspace = () => setDigits((prev) => prev.slice(0, -1))
  const handleClear = () => setDigits('')

  // Physical/Bluetooth keyboard support — this screen has no visible text input (the
  // digit slots below are a display, not a focusable field), so a global listener is the
  // only way to accept typed digits. Skips keys typed into an actual input/textarea
  // elsewhere on the page (e.g. the dashboard's top search bar) so this doesn't hijack
  // unrelated typing while this step happens to be mounted.
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return
      }
      if (event.key >= '0' && event.key <= '9') {
        event.preventDefault()
        handleDigitPress(event.key)
      } else if (event.key === 'Backspace') {
        event.preventDefault()
        handleBackspace()
      } else if (event.key === 'Escape') {
        event.preventDefault()
        handleClear()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [digits])

  return (
    <div className="mx-auto w-full max-w-sm space-y-6 rounded-2xl border border-posFdBorder bg-posFdSurface p-6 text-center">
      <div>
        <h1 className="text-xl font-black text-posFdText">
          {businessName
            ? t('components.dashboard.views.pos.PhoneCheckInStep.welcomeTitleWithBusiness', { businessName })
            : t('components.dashboard.views.pos.PhoneCheckInStep.welcomeTitleGeneric')}
        </h1>
        <p className="mt-1 text-sm text-nexoraMuted">
          {t('components.dashboard.views.pos.PhoneCheckInStep.subtitle')}
        </p>
      </div>

      <div className="border-b-2 border-posFdAccent pb-3">
        <span className="font-mono text-2xl font-bold tracking-widest text-posFdText">
          {renderDigitSlots(digits)}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {KEYPAD_ROWS.flat().map((digit) => (
          <button
            key={digit}
            type="button"
            onClick={() => handleDigitPress(digit)}
            className="h-16 rounded-xl border border-posFdBorder bg-white text-2xl font-bold text-posFdText hover:border-posFdAccent active:bg-posFdCanvas"
          >
            {digit}
          </button>
        ))}
        <button
          type="button"
          onClick={handleClear}
          className="h-16 rounded-xl border border-posFdBorder bg-white text-sm font-bold text-nexoraMuted hover:border-posFdAccent active:bg-posFdCanvas"
        >
          {t('components.dashboard.views.pos.PhoneCheckInStep.clearButton')}
        </button>
        <button
          type="button"
          onClick={() => handleDigitPress('0')}
          className="h-16 rounded-xl border border-posFdBorder bg-white text-2xl font-bold text-posFdText hover:border-posFdAccent active:bg-posFdCanvas"
        >
          0
        </button>
        <button
          type="button"
          onClick={handleBackspace}
          className="h-16 rounded-xl border border-posFdBorder bg-white text-xl font-bold text-posFdText hover:border-posFdAccent active:bg-posFdCanvas"
        >
          ⌫
        </button>
      </div>
    </div>
  )
}
