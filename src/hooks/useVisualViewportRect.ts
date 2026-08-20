import { useEffect, useState } from 'react'

export interface VisualViewportRect {
  /** Height of the area actually visible — excludes the on-screen keyboard. */
  height: number
  /** How far the visual viewport is scrolled inside the layout viewport. */
  offsetTop: number
}

/**
 * Tracks the visual viewport so a fixed overlay can sit above the on-screen
 * keyboard.
 *
 * iOS Safari does NOT shrink the layout viewport when the keyboard opens — and
 * `100dvh` does not account for it either — so a `fixed inset-0` overlay keeps
 * its full height and everything below the keyboard line becomes unreachable.
 * Returns null where the API is missing (older browsers, jsdom); callers keep
 * their CSS-only sizing in that case.
 */
export default function useVisualViewportRect(enabled = true): VisualViewportRect | null {
  const [rect, setRect] = useState<VisualViewportRect | null>(null)

  useEffect(() => {
    if (!enabled) {
      setRect(null)
      return
    }
    const viewport = typeof window === 'undefined' ? null : window.visualViewport
    if (!viewport) return

    const update = () => {
      setRect({ height: viewport.height, offsetTop: viewport.offsetTop })
    }

    update()
    viewport.addEventListener('resize', update)
    viewport.addEventListener('scroll', update)
    return () => {
      viewport.removeEventListener('resize', update)
      viewport.removeEventListener('scroll', update)
    }
  }, [enabled])

  return rect
}
