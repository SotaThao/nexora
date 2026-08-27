import { useEffect } from 'react'
import { HEADER_MESSAGES_MOBILE_OPEN_CLASS } from './headerMessagesConstants'

/** Regions that may scroll while the mobile messenger overlay is open. */
const MOBILE_MESSENGER_SCROLLABLE_SELECTOR = [
  '.header-messages-list--mobile',
  '.header-message-chat-thread--mobile',
].join(', ')

const MOBILE_MESSENGER_ROOT_SELECTOR = [
  '.header-messages-panel--mobile',
  '.header-message-chat--fullscreen',
  '[data-header-message-chat-root]',
].join(', ')

/**
 * Prevent the dashboard page from scrolling behind the mobile messenger overlay.
 * Locks body + blocks touchmove outside the messenger's own scroll areas (iOS overscroll).
 */
export function useMobileMessengerScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return

    const html = document.documentElement
    const body = document.body
    const scrollY = window.scrollY

    html.classList.add(HEADER_MESSAGES_MOBILE_OPEN_CLASS)
    body.classList.add(HEADER_MESSAGES_MOBILE_OPEN_CLASS)
    body.style.position = 'fixed'
    body.style.top = `-${scrollY}px`
    body.style.left = '0'
    body.style.right = '0'
    body.style.width = '100%'
    body.style.overflow = 'hidden'

    function isScrollableMessengerTarget(target: EventTarget | null): boolean {
      if (!(target instanceof Element)) return false
      return Boolean(target.closest(MOBILE_MESSENGER_SCROLLABLE_SELECTOR))
    }

    function onTouchMove(event: TouchEvent) {
      if (event.touches.length > 1) return
      if (isScrollableMessengerTarget(event.target)) return
      // Non-scroll chrome inside the overlay (header/composer) must not drag the page.
      if (event.target instanceof Element && event.target.closest(MOBILE_MESSENGER_ROOT_SELECTOR)) {
        event.preventDefault()
        return
      }
      event.preventDefault()
    }

    document.addEventListener('touchmove', onTouchMove, { passive: false })

    return () => {
      document.removeEventListener('touchmove', onTouchMove)
      html.classList.remove(HEADER_MESSAGES_MOBILE_OPEN_CLASS)
      body.classList.remove(HEADER_MESSAGES_MOBILE_OPEN_CLASS)
      body.style.position = ''
      body.style.top = ''
      body.style.left = ''
      body.style.right = ''
      body.style.width = ''
      body.style.overflow = ''
      window.scrollTo(0, scrollY)
    }
  }, [active])
}
