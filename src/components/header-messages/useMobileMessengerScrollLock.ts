import { useEffect } from 'react'

/** Prevent the dashboard page from scrolling behind the mobile messenger overlay. */
export function useMobileMessengerScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return

    const html = document.documentElement
    const body = document.body
    const scrollY = window.scrollY

    html.classList.add('header-messages-mobile-open')
    body.style.position = 'fixed'
    body.style.top = `-${scrollY}px`
    body.style.left = '0'
    body.style.right = '0'
    body.style.width = '100%'
    body.style.overflow = 'hidden'

    return () => {
      html.classList.remove('header-messages-mobile-open')
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
