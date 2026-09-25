import { useEffect, useState } from 'react'

/** Keep in sync with open keyframe duration in index.css */
export const MOBILE_SIDEBAR_DURATION_MS = 360
/** Keep in sync with exit keyframe duration in index.css */
export const MOBILE_SIDEBAR_EXIT_MS = 280

export type DrawerPresencePhase = 'open' | 'closing'

/**
 * Keeps a drawer mounted through its exit animation.
 * Opens during render so the node mounts with `.is-open` and CSS keyframes
 * start on the first paint (smooth on mobile Safari).
 */
export default function useDrawerPresence(
  isOpen: boolean,
  exitMs = MOBILE_SIDEBAR_EXIT_MS,
): { mounted: boolean; phase: DrawerPresencePhase } {
  const [mounted, setMounted] = useState(isOpen)
  const [phase, setPhase] = useState<DrawerPresencePhase>(isOpen ? 'open' : 'closing')

  // Adjust state during render when opening — mounts with `.is-open` immediately.
  if (isOpen && (!mounted || phase !== 'open')) {
    setMounted(true)
    setPhase('open')
  }

  useEffect(() => {
    if (isOpen) return undefined
    if (!mounted) return undefined

    const reduceMotion =
      typeof window !== 'undefined'
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const exitDelay = reduceMotion ? 1 : exitMs

    setPhase('closing')
    const timer = window.setTimeout(() => setMounted(false), exitDelay)
    return () => window.clearTimeout(timer)
  }, [isOpen, exitMs, mounted])

  return { mounted, phase }
}
