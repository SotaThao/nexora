import { useState, useEffect } from 'react'

function getMatches(query: string): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) {
    return false
  }
  return window.matchMedia(query).matches
}

/** Subscribe to a CSS media query and update on change. */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => getMatches(query))

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) {
      return undefined
    }
    const mql = window.matchMedia(query)
    const handleChange = (event: MediaQueryListEvent) => setMatches(event.matches)
    setMatches(mql.matches)

    // Safari < 14 only supports deprecated addListener/removeListener.
    if (typeof mql.addEventListener === 'function') {
      mql.addEventListener('change', handleChange)
      return () => mql.removeEventListener('change', handleChange)
    }

    const legacyMql = mql as MediaQueryList & {
      addListener: (listener: (event: MediaQueryListEvent) => void) => void
      removeListener: (listener: (event: MediaQueryListEvent) => void) => void
    }
    legacyMql.addListener(handleChange)
    return () => legacyMql.removeListener(handleChange)
  }, [query])

  return matches
}

export default useMediaQuery
