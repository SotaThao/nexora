// PhoneCheckInStep — Check-in Step 1 (POS iPad redesign, phone-first re-scope). Standalone,
// self-contained phone-entry screen with a large numeric keypad — deliberately has no
// dependency on PosOrderWorkspace/CustomerHeaderBar state so it can be dropped into the
// not-yet-built customer self-checkin kiosk screen unchanged (PO requirement: staff and
// customer check-in must use the identical component). Auto-advances the instant the 10th
// digit is entered — no separate "Continue" button, matching the reference kiosk mockup.
import { useEffect, useRef, useState } from 'react'
import { ShieldCheck, X } from 'lucide-react'
import { useTranslation } from '../../../../contexts/LanguageContext'
import { formatNationalNumber, PhoneDialCode } from '../../../CountryCodeSelect'

const KEYPAD_ROWS = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
] as const

const PHONE_NATIONAL_DIGITS = 10
const PHONE_GROUP_SIZES = [3, 3, 4] as const
const TK = 'components.dashboard.views.pos.PhoneCheckInStep'

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
  appearance = 'default',
}: {
  businessName?: string
  initialDigits?: string
  onSubmit: (formattedPhone: string) => void
  appearance?: 'default' | 'public'
}) {
  const { t } = useTranslation()
  const rootRef = useRef<HTMLDivElement>(null)
  const [digits, setDigits] = useState(initialDigits.replace(/\D/g, '').slice(0, PHONE_NATIONAL_DIGITS))
  const isPublic = appearance === 'public'

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
  // unrelated typing while this step happens to be mounted. A persisted check-in
  // draft can be hidden when another POS tab is active; it must not consume keys.
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey || event.isComposing) return
      if (!/^[0-9]$/.test(event.key) && event.key !== 'Backspace' && event.key !== 'Escape') return
      const root = rootRef.current
      if (!root || root.closest('[hidden], [aria-hidden="true"], [inert]')) return
      const target = event.target instanceof HTMLElement ? event.target : document.activeElement
      if (target instanceof HTMLElement && (
        target.matches('input, textarea, select') || target.isContentEditable
        || (!root.contains(target) && target.closest('[role="dialog"], [role="alertdialog"], .nexora-modal-card'))
        || (event.key === 'Escape' && target !== document.body && target !== document.documentElement && !root.contains(target))
      )) {
        return
      }
      for (let ancestor: HTMLElement | null = root; ancestor; ancestor = ancestor.parentElement) {
        const style = getComputedStyle(ancestor)
        if (style.display === 'none' || style.visibility === 'hidden' || style.visibility === 'collapse') return
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

  const keypad = (
    <div className={`grid grid-cols-3 ${isPublic ? 'gap-2 sm:gap-3' : 'gap-3'}`}>
      {KEYPAD_ROWS.flat().map((digit) => (
        <button
          key={digit}
          type="button"
          onClick={() => handleDigitPress(digit)}
          className={
            isPublic
              ? 'public-checkin-key'
              : 'h-16 rounded-xl border border-nexoraBorder bg-white text-2xl font-bold text-nexoraText hover:border-nexoraBrand active:bg-nexoraCanvas'
          }
        >
          {digit}
        </button>
      ))}
      <button
        type="button"
        onClick={handleClear}
        className={
          isPublic
            ? 'public-checkin-key text-base font-semibold text-[#ff5ec8]'
            : 'h-16 rounded-xl border border-nexoraBorder bg-white text-sm font-bold text-nexoraMuted hover:border-nexoraBrand active:bg-nexoraCanvas'
        }
      >
        {t(`${TK}.clearButton`)}
      </button>
      <button
        type="button"
        onClick={() => handleDigitPress('0')}
        className={
          isPublic
            ? 'public-checkin-key'
            : 'h-16 rounded-xl border border-nexoraBorder bg-white text-2xl font-bold text-nexoraText hover:border-nexoraBrand active:bg-nexoraCanvas'
        }
      >
        0
      </button>
      <button
        type="button"
        onClick={handleBackspace}
        aria-label={t(`${TK}.backspaceButton`)}
        className={
          isPublic
            ? 'public-checkin-key'
            : 'h-16 rounded-xl border border-nexoraBorder bg-white text-xl font-bold text-nexoraText hover:border-nexoraBrand active:bg-nexoraCanvas'
        }
      >
        {isPublic ? (
          <span className="flex h-7 w-8 items-center justify-center rounded-md border-2 border-[#8ea2ff]">
            <X className="h-3.5 w-3.5 text-[#c4b5ff]" strokeWidth={2.5} />
          </span>
        ) : (
          '⌫'
        )}
      </button>
    </div>
  )

  if (isPublic) {
    return (
      <div ref={rootRef} className="public-checkin-card">
        {businessName ? (
          <p className="bg-gradient-to-r from-[#4ecbff] via-[#7b8cff] to-[#c084fc] bg-clip-text text-xl font-extrabold text-transparent sm:text-2xl">
            {businessName}
          </p>
        ) : null}

        <h1 className="mt-1.5 text-xl font-extrabold text-white sm:mt-2 sm:text-2xl">
          {t(`${TK}.welcomeTitlePublic`)}
        </h1>
        <p className="mt-1 text-sm text-white/65 sm:mt-1.5">{t(`${TK}.subtitle`)}</p>

        <div className="mt-3 sm:mt-5">
          <span className="font-mono text-xl font-medium tracking-[0.28em] text-white/80 sm:text-2xl sm:tracking-[0.35em]">
            {renderDigitSlots(digits)}
          </span>
          <div className="mx-auto mt-2 h-[2px] w-full bg-gradient-to-r from-brandCyan via-[#7c5cff] to-floxVividRose sm:mt-3" />
        </div>

        <div className="mt-3 sm:mt-5">{keypad}</div>

        <div className="mt-3 flex flex-col items-center gap-1 sm:mt-6">
          <p className="flex items-center gap-1.5 text-sm font-semibold text-white">
            <ShieldCheck className="h-4 w-4 text-brandCyan" />
            {t(`${TK}.secureTitle`)}
          </p>
          <p className="text-xs text-white/55">{t(`${TK}.secureDesc`)}</p>
        </div>
      </div>
    )
  }

  return (
    <div ref={rootRef} className="mx-auto w-full max-w-sm space-y-6 rounded-2xl border border-nexoraBorder bg-nexoraSurface p-6 text-center">
      <div>
        <h1 className="text-xl font-black text-nexoraText">
          {businessName
            ? t(`${TK}.welcomeTitleWithBusiness`, { businessName })
            : t(`${TK}.welcomeTitleGeneric`)}
        </h1>
        <p className="mt-1 text-sm text-nexoraMuted">{t(`${TK}.subtitle`)}</p>
      </div>

      <div className="border-b-2 border-nexoraBrand pb-3">
        <span className="font-mono text-2xl font-bold tracking-widest text-nexoraText">
          {renderDigitSlots(digits)}
        </span>
      </div>

      {keypad}
    </div>
  )
}
