import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'

// Bottom sheet for the <768px "Bộ lọc" button (CommunityJobDetail.tsx's
// CommunityJobsPanel toolbar). Follows PostJobModal's overlay pattern in that
// file (fixed inset-0 z-[150] overlay + slide-up panel). Filters here are
// staged locally — nothing is dispatched to the panel's reducer until the
// primary button is pressed; Esc, an overlay click, or the "Đóng" button
// discard the staged change and leave the panel's real filter state untouched.
export function JobFilterSheet({
  locations,
  defaultLocation,
  currentLocation,
  jobsCountForLocation,
  onApply,
  onClose,
}: {
  locations: string[]
  defaultLocation: string
  currentLocation: string
  // Reuses the panel's own filterJobsForState (via a projected state) instead
  // of duplicating filter logic here — see CommunityJobDetail.tsx's
  // `jobsCountForLocation` closure.
  jobsCountForLocation: (location: string) => number
  onApply: (location: string) => void
  onClose: () => void
}) {
  const [stagedLocation, setStagedLocation] = useState(currentLocation)
  const panelRef = useRef<HTMLDivElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  // Focus moves into the sheet on open (onto its close button, the first
  // focusable control) — returning focus to the "Bộ lọc" trigger on close is
  // the caller's responsibility (it still owns that button after this
  // component unmounts).
  useEffect(() => {
    closeButtonRef.current?.focus()
  }, [])

  // Lock body scroll while the sheet is open.
  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
        return
      }
      // Minimal focus trap: keep Tab cycling inside the sheet.
      if (event.key === 'Tab' && panelRef.current) {
        const focusable = panelRef.current.querySelectorAll<HTMLElement>(
          'button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
        if (focusable.length === 0) return
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault()
          last.focus()
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault()
          first.focus()
        }
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const stagedCount = jobsCountForLocation(stagedLocation)
  const hasResults = stagedCount > 0

  const handlePrimaryAction = () => {
    if (!hasResults) {
      // "Không có tin" state: reset the staged pick instead of applying a
      // zero-result filter — keeps the sheet open so the user can pick again.
      setStagedLocation(defaultLocation)
      return
    }
    onApply(stagedLocation)
  }

  return (
    <div
      className="fixed inset-0 z-[150] flex items-end bg-nexoraText/40"
      onClick={onClose}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="job-filter-sheet-heading"
        onClick={(event) => event.stopPropagation()}
        className="w-full rounded-t-2xl bg-nexoraSurface p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]"
      >
        <div className="flex items-center justify-between">
          <h2 id="job-filter-sheet-heading" className="text-base font-extrabold text-nexoraText">Bộ lọc</h2>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="grid min-h-11 min-w-11 place-items-center rounded-full text-nexoraMuted hover:bg-nexoraSurfaceMuted focus-visible:ring-2 focus-visible:ring-nexoraBrand"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wide text-nexoraSubtle">Khu vực</p>
            <button
              type="button"
              onClick={() => setStagedLocation(defaultLocation)}
              className="text-xs font-bold text-nexoraBrand hover:underline"
            >
              Xoá tất cả
            </button>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {locations.map((location) => {
              const selected = stagedLocation === location
              return (
                <button
                  key={location}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setStagedLocation(location)}
                  className={`min-h-11 rounded-full border px-3 text-sm font-bold focus-visible:ring-2 focus-visible:ring-nexoraBrand ${
                    selected
                      ? 'border-nexoraBrand bg-nexoraBrandSoft text-nexoraBrand'
                      : 'border-nexoraBorder text-nexoraMuted hover:bg-nexoraSurfaceMuted'
                  }`}
                >
                  {location}
                </button>
              )
            })}
          </div>
        </div>

        <button
          type="button"
          onClick={handlePrimaryAction}
          className={`mt-5 min-h-11 w-full rounded-xl text-sm font-extrabold text-white ${hasResults ? 'bg-nexoraBrand' : 'bg-nexoraDanger'}`}
        >
          {hasResults ? `Xem ${stagedCount} tin` : 'Không có tin — Xoá bộ lọc'}
        </button>
      </div>
    </div>
  )
}
