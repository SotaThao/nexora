// Tooltip — lightweight hover/focus tooltip with an info-icon trigger.
// Renders the popup in a portal so it is not clipped by overflow or covered
// by sibling elements (e.g. textarea below a label).
import { useCallback, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Info } from 'lucide-react'

const VIEWPORT_PAD = 8
const GAP = 6
const TOOLTIP_WIDTH = 224

type TooltipProps = {
  content: ReactNode
  children?: ReactNode
  className?: string
  ariaLabel?: string
  align?: 'start' | 'center' | 'end'
  placement?: 'top' | 'bottom'
}

export default function Tooltip({
  content,
  children,
  className = '',
  ariaLabel = 'More information',
  align = 'center',
  placement = 'bottom',
}: TooltipProps) {
  const [open, setOpen] = useState(false)
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const tooltipRef = useRef<HTMLSpanElement>(null)

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current
    const tooltip = tooltipRef.current
    if (!trigger || !tooltip) return

    const rect = trigger.getBoundingClientRect()
    const tooltipRect = tooltip.getBoundingClientRect()
    const width = Math.min(TOOLTIP_WIDTH, window.innerWidth - VIEWPORT_PAD * 2)

    let left =
      align === 'start'
        ? rect.left
        : align === 'end'
          ? rect.right - width
          : rect.left + rect.width / 2 - width / 2

    left = Math.max(VIEWPORT_PAD, Math.min(left, window.innerWidth - width - VIEWPORT_PAD))

    const preferTop = placement === 'top'
    const topBelow = rect.bottom + GAP
    const topAbove = rect.top - tooltipRect.height - GAP
    const fitsBelow = topBelow + tooltipRect.height <= window.innerHeight - VIEWPORT_PAD
    const fitsAbove = topAbove >= VIEWPORT_PAD

    let top = preferTop
      ? (fitsAbove ? topAbove : topBelow)
      : (fitsBelow ? topBelow : topAbove)

    top = Math.max(VIEWPORT_PAD, Math.min(top, window.innerHeight - tooltipRect.height - VIEWPORT_PAD))

    setCoords({ top, left })
  }, [align, placement])

  useLayoutEffect(() => {
    if (!open) {
      setCoords(null)
      return undefined
    }

    updatePosition()
    window.addEventListener('scroll', updatePosition, true)
    window.addEventListener('resize', updatePosition)
    return () => {
      window.removeEventListener('scroll', updatePosition, true)
      window.removeEventListener('resize', updatePosition)
    }
  }, [open, content, updatePosition])

  if (!content) return null

  const popup = open
    ? createPortal(
        <span
          ref={tooltipRef}
          role="tooltip"
          style={{
            position: 'fixed',
            top: coords?.top ?? -9999,
            left: coords?.left ?? -9999,
            width: Math.min(TOOLTIP_WIDTH, window.innerWidth - VIEWPORT_PAD * 2),
            zIndex: 9999,
            visibility: coords ? 'visible' : 'hidden',
          }}
          className="rounded-lg border border-nexoraBorder bg-nexoraSurface px-3 py-2 text-[11px] font-medium leading-snug text-nexoraText shadow-lg"
          onMouseEnter={() => setOpen(true)}
          onMouseLeave={() => setOpen(false)}
        >
          {content}
        </span>,
        document.body,
      )
    : null

  return (
    <span
      className={`relative inline-flex ${className}`}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        ref={triggerRef}
        type="button"
        aria-label={ariaLabel}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onClick={(e) => {
          e.preventDefault()
          setOpen((v) => !v)
        }}
        className="inline-flex h-4 w-4 shrink-0 items-center justify-center text-nexoraMuted transition hover:text-nexoraText"
      >
        {children || <Info className="h-3.5 w-3.5" />}
      </button>
      {popup}
    </span>
  )
}
