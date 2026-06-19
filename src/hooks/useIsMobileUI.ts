import { useState, useEffect } from 'react'

// Decides which dashboard UI tree to render:
//   true  -> app-master "mobile" UI (narrow viewport / mobile web)
//   false -> dev "desktop" UI (wide viewport)
// Web-only: keyed to a max-width: 1023px media query (Tailwind `lg` breakpoint)
// and reacts to live resizes. (The native app is built from a separate repo.)
const MOBILE_QUERY = '(max-width: 1023px)'

function getIsMobileUI(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) {
    return false
  }
  return window.matchMedia(MOBILE_QUERY).matches
}

export function useIsMobileUI(): boolean {
  const [isMobile, setIsMobile] = useState<boolean>(getIsMobileUI)

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) {
      return
    }
    const mql = window.matchMedia(MOBILE_QUERY)
    const handleChange = (event: MediaQueryListEvent) => setIsMobile(event.matches)
    mql.addEventListener('change', handleChange)
    return () => mql.removeEventListener('change', handleChange)
  }, [])

  return isMobile
}

export default useIsMobileUI
