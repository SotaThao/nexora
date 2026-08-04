import { useEffect, type RefObject } from 'react'

type UseCheckoutModalLockArgs = {
  open: boolean
  onClose: () => void
  /** When true, Escape is ignored (e.g. submitting). */
  locked?: boolean
  /** Keep body scroll locked after close (another modal still open). */
  preserveBodyLock?: boolean
  closeButtonRef: RefObject<HTMLButtonElement | null>
}

/** Shared body-scroll + Escape handling for credit/plan checkout overlays. */
export function useCheckoutModalLock({
  open,
  onClose,
  locked = false,
  preserveBodyLock = false,
  closeButtonRef,
}: UseCheckoutModalLockArgs) {
  useEffect(() => {
    if (!open) {
      if (!preserveBodyLock) document.body.style.overflow = ''
      return undefined
    }

    document.body.style.overflow = 'hidden'

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || locked) return
      event.stopImmediatePropagation()
      onClose()
    }
    window.addEventListener('keydown', onKeyDown, true)
    requestAnimationFrame(() => closeButtonRef.current?.focus())

    return () => {
      if (!preserveBodyLock) document.body.style.overflow = ''
      window.removeEventListener('keydown', onKeyDown, true)
    }
  }, [open, onClose, locked, preserveBodyLock, closeButtonRef])
}
