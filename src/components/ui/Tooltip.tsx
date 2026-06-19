// Tooltip — lightweight hover/focus tooltip with an info-icon trigger.
// Reveals `content` on hover, focus, or tap. Pass custom trigger children to
// override the default info icon.
import { useState } from 'react'
import { Info } from 'lucide-react'

export default function Tooltip({ content, children, className = '', ariaLabel = 'More information' }) {
  const [open, setOpen] = useState(false)

  if (!content) return null

  return (
    <span
      className={`relative inline-flex ${className}`}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        aria-label={ariaLabel}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onClick={(e) => { e.preventDefault(); setOpen((v) => !v) }}
        className="inline-flex h-4 w-4 items-center justify-center text-nexoraMuted transition hover:text-nexoraText"
      >
        {children || <Info className="h-3.5 w-3.5" />}
      </button>
      {open && (
        <span
          role="tooltip"
          className="absolute left-1/2 top-full z-50 mt-1.5 w-56 -translate-x-1/2 rounded-lg border border-nexoraBorder bg-nexoraSurface px-3 py-2 text-[11px] font-medium leading-snug text-nexoraText shadow-lg"
        >
          {content}
        </span>
      )}
    </span>
  )
}
