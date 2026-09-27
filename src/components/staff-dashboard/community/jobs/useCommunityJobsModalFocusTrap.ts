import { useEffect, type RefObject } from 'react'

/**
 * Shared focus-trap + Escape-to-close behavior for the community/jobs modals —
 * same approach as QuickPostModal.tsx (owner recruitment) so keyboard behavior
 * matches the rest of the dashboard.
 */
export function useCommunityJobsModalFocusTrap(
  active: boolean,
  dialogRef: RefObject<HTMLElement>,
  onEscape: () => void,
  initialFocusRef?: RefObject<HTMLElement>,
) {
  useEffect(() => {
    if (!active) return
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const dialog = dialogRef.current
    const focusable = () => Array.from(
      dialog?.querySelectorAll<HTMLElement>(
        'button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])',
      ) ?? [],
    )
    const focusFrame = window.requestAnimationFrame(() => {
      (initialFocusRef?.current ?? focusable()[0])?.focus()
    })
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onEscape()
        return
      }
      if (event.key !== 'Tab') return
      const items = focusable()
      if (items.length === 0) return
      const first = items[0]
      const last = items[items.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      window.cancelAnimationFrame(focusFrame)
      document.removeEventListener('keydown', handleKeyDown)
      previousFocus?.focus()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active])
}
