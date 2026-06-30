/** Mobile web + native app (iPhone/Android Capacitor). */
export function isMobileScrollContext(): boolean {
  if (typeof window === 'undefined') return false
  // Set by initNativeShell on Capacitor builds.
  if (document.documentElement.dataset.capacitorPlatform) return true
  return window.matchMedia('(max-width: 1023px)').matches
}

function scrollElementToTop(el: Element) {
  if (!(el instanceof HTMLElement)) return
  el.scrollTop = 0
  el.scrollLeft = 0
}

/** Walk ancestors and reset any scrollable container (not only window). */
function scrollScrollableAncestors(origin: HTMLElement | null) {
  let el: HTMLElement | null = origin
  while (el) {
    const { overflowY } = window.getComputedStyle(el)
    if (overflowY === 'auto' || overflowY === 'scroll' || overflowY === 'overlay') {
      scrollElementToTop(el)
    }
    el = el.parentElement
  }
}

/**
 * Scroll the page back to the top after pagination on mobile.
 * Uses instant scroll + deferred passes for iOS WebView / Capacitor.
 */
export function scrollToPageTop(origin?: HTMLElement | null) {
  if (typeof window === 'undefined') return

  const run = () => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
    scrollElementToTop(document.documentElement)
    scrollElementToTop(document.body)

    const root = document.getElementById('root')
    if (root) scrollElementToTop(root)

    scrollScrollableAncestors(origin ?? null)

    const main = document.querySelector('main')
    if (main instanceof HTMLElement) {
      main.scrollIntoView({ block: 'start', behavior: 'auto' })
    }
  }

  run()
  requestAnimationFrame(run)
  window.setTimeout(run, 0)
}
