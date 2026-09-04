// The frame every check-in step wears, on the customer kiosk and at the front desk alike.
//
// It exists because the two screens have to look identical and kept drifting when each one owned
// its own card, heading and footer markup. Sharing the frame makes them identical by construction:
// a change to the card, the heading weight or the 1:2 footer lands on both at once.
//
// What it deliberately does NOT own is the content. The kiosk asks a customer for their own name;
// the front desk also takes an email and offers "use last visit". Those differences are real, so
// each caller passes its own children — only the frame is shared.
import type { ReactNode } from 'react'
import { Loader2 } from 'lucide-react'

export default function CheckInStepFrame({
  title,
  subtitle,
  children,
  backLabel,
  onBack,
  primaryLabel,
  onPrimary,
  primaryDisabled,
  isSubmitting,
  secondaryLabel,
  onSecondary,
  // Front desk only: the tab already frames the content, and a card inside a card reads as two
  // panels. The kiosk owns the whole screen, so it keeps the border.
  bare = false,
}: {
  title: string
  subtitle?: string
  children: ReactNode
  backLabel: ReactNode
  onBack: () => void
  primaryLabel: string
  onPrimary: () => void
  primaryDisabled?: boolean
  isSubmitting?: boolean
  // A third action that is not "go back one step" — Cancel on the front desk's last step, which
  // throws the whole draft away.
  secondaryLabel?: string
  onSecondary?: () => void
  bare?: boolean
}) {
  return (
    <div
      className={
        bare
          ? 'w-full space-y-4'
          : 'mx-auto w-full max-w-2xl space-y-4 rounded-2xl border border-nexoraBrand/20 bg-nexoraSurface p-6 shadow-sm'
      }
    >
      <div className="text-center">
        <h1 className="text-lg font-black leading-6 text-nexoraText">{title}</h1>
        {subtitle ? <p className="mt-1 text-xs leading-4 text-nexoraMuted">{subtitle}</p> : null}
      </div>

      {children}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onBack}
          disabled={isSubmitting}
          className="flex h-14 flex-1 items-center justify-center gap-1.5 rounded-lg border border-nexoraBorder text-base font-bold text-nexoraText hover:border-nexoraBrand disabled:opacity-60"
        >
          {backLabel}
        </button>
        {secondaryLabel && onSecondary ? (
          <button
            type="button"
            onClick={onSecondary}
            disabled={isSubmitting}
            className="h-14 rounded-lg border border-nexoraBorder px-4 text-base font-bold text-nexoraMuted hover:border-nexoraBrand disabled:opacity-60"
          >
            {secondaryLabel}
          </button>
        ) : null}
        <button
          type="button"
          onClick={onPrimary}
          disabled={primaryDisabled || isSubmitting}
          className="flex h-14 flex-[2] items-center justify-center gap-2 rounded-lg bg-nexoraBrand text-base font-bold text-white hover:bg-nexoraBrandDark disabled:opacity-60"
        >
          {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
          {primaryLabel}
        </button>
      </div>
    </div>
  )
}
