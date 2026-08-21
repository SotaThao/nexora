import { useEffect } from 'react'

/**
 * Freezes the page behind a modal so only the modal itself scrolls.
 *
 * iOS Safari ignores `overflow: hidden` on its own — the page keeps scrolling
 * (and keeps showing its own scrollbar) behind the overlay — so the body is
 * pinned with `position: fixed` at the current offset and restored on close.
 * Same recipe as the booking modals; extracted so new modals reuse it.
 */
export default function useBodyScrollLock(enabled: boolean): void {
  useEffect(() => {
    if (!enabled || typeof document === 'undefined') return undefined

    const scrollY = window.scrollY
    const { body } = document
    const previous = {
      overflow: body.style.overflow,
      position: body.style.position,
      top: body.style.top,
      width: body.style.width,
    }

    body.style.overflow = 'hidden'
    body.style.position = 'fixed'
    body.style.top = `-${scrollY}px`
    body.style.width = '100%'

    return () => {
      body.style.overflow = previous.overflow
      body.style.position = previous.position
      body.style.top = previous.top
      body.style.width = previous.width
      window.scrollTo(0, scrollY)
    }
  }, [enabled])
}
