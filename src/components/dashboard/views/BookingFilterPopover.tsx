import React, { useEffect, useId, useRef } from 'react'
import { FunnelIcon } from './BookingHubIcons'

type BookingFilterPopoverProps = {
  title: string
  toggleLabel: string
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
}

/**
 * Collapsed filter trigger + popover (booking-book-phase-1.html).
 * Same "start compact" idea as Reports Tips `defaultCollapsed` filters.
 */
export default function BookingFilterPopover({
  title,
  toggleLabel,
  isOpen,
  onOpenChange,
  children,
}: BookingFilterPopoverProps) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const menuId = useId()

  useEffect(() => {
    if (!isOpen) return undefined

    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node | null
      if (target && wrapRef.current && !wrapRef.current.contains(target)) {
        onOpenChange(false)
      }
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onOpenChange(false)
    }

    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [isOpen, onOpenChange])

  return (
    <div className="booking-filter-wrap" ref={wrapRef}>
      <button
        className={`booking-secondary-button booking-filter-toggle${isOpen ? ' is-active' : ''}`}
        type="button"
        aria-controls={menuId}
        aria-expanded={isOpen}
        onClick={() => onOpenChange(!isOpen)}
      >
        <FunnelIcon />
        <span>{toggleLabel}</span>
      </button>
      <div
        className="booking-filter-popover"
        id={menuId}
        hidden={!isOpen}
        role="dialog"
        aria-label={title}
      >
        <div className="booking-filter-popover-head">
          <span>{title}</span>
        </div>
        {children}
      </div>
    </div>
  )
}
