import { useCallback, useEffect, useRef, useState } from 'react'

const BODY_CLASS = 'pos-front-desk-fullscreen'

function hasOpenModal() {
  return Array.from(document.querySelectorAll<HTMLElement>(':is([role="dialog"], [role="alertdialog"])[aria-modal="true"], .nexora-modal-card'))
    .some(dialog => {
      if (dialog.closest('[hidden], [aria-hidden="true"], [inert]')) return false
      for (let ancestor: HTMLElement | null = dialog; ancestor; ancestor = ancestor.parentElement) {
        const style = getComputedStyle(ancestor)
        if (style.display === 'none' || style.visibility === 'hidden' || style.visibility === 'collapse') return false
      }
      return true
    })
}

/** Native fullscreen is optional: the body class also provides an immersive view on iOS. */
export default function usePosFullscreen() {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const mounted = useRef(false)
  const active = useRef(false)
  const addedBodyClass = useRef(false)
  const ownsNative = useRef(false)
  const requestPending = useRef(false)
  const exitPending = useRef(false)
  const hadNativeFullscreen = useRef(false)

  const exitOwnedNative = useCallback(() => {
    if (!ownsNative.current || exitPending.current) return
    ownsNative.current = false
    if (document.fullscreenElement !== document.documentElement || !document.exitFullscreen) return
    exitPending.current = true
    try {
      Promise.resolve(document.exitFullscreen())
        .catch(() => { /* Keep the restored page usable if the browser declines the exit. */ })
        .finally(() => { exitPending.current = false })
    } catch {
      exitPending.current = false
    }
  }, [])

  const leaveFullscreen = useCallback(() => {
    active.current = false
    hadNativeFullscreen.current = false
    if (addedBodyClass.current) {
      document.body.classList.remove(BODY_CLASS)
      addedBodyClass.current = false
    }
    if (mounted.current) setIsFullscreen(false)
    exitOwnedNative()
  }, [exitOwnedNative])

  const toggleFullscreen = useCallback(() => {
    if (active.current) {
      leaveFullscreen()
      return
    }

    active.current = true
    hadNativeFullscreen.current = Boolean(document.fullscreenElement)
    if (!document.body.classList.contains(BODY_CLASS)) {
      document.body.classList.add(BODY_CLASS)
      addedBodyClass.current = true
    }
    setIsFullscreen(true)

    const target = document.documentElement
    if (document.fullscreenElement || requestPending.current || !target.requestFullscreen) return
    requestPending.current = true
    try {
      // Call synchronously within the user's click so browsers retain the required user activation.
      Promise.resolve(target.requestFullscreen()).then(() => {
        requestPending.current = false
        if (document.fullscreenElement === target) {
          ownsNative.current = true
          hadNativeFullscreen.current = true
          // A request may complete after the user has exited or navigated away.
          if (!active.current || !mounted.current) exitOwnedNative()
        }
      }, () => { requestPending.current = false })
    } catch {
      requestPending.current = false
    }
  }, [exitOwnedNative, leaveFullscreen])

  useEffect(() => {
    if (!isFullscreen) return
    const surface = document.querySelector<HTMLElement>('.pos-front-desk-expanded')
    const shell = surface?.closest<HTMLElement>('[data-dashboard-shell]')
    if (!surface || !shell) return

    const previous = new Map<HTMLElement, boolean>()
    const parents: HTMLElement[] = []
    let branch: HTMLElement = surface
    while (branch !== shell && branch.parentElement) {
      parents.push(branch.parentElement)
      branch = branch.parentElement
    }

    // Disable only covered shell siblings. Global notifications and body portals
    // remain outside this boundary, including confirmations without dialog roles.
    const coverShell = () => {
      if (!surface.isConnected || !shell.contains(surface)) {
        leaveFullscreen()
        return
      }
      for (const parent of parents) {
        for (const child of Array.from(parent.children)) {
          if (!(child instanceof HTMLElement) || child === surface || child.contains(surface)) continue
          if (!previous.has(child)) previous.set(child, child.hasAttribute('inert'))
          child.setAttribute('inert', '')
        }
      }
    }
    coverShell()
    const observer = new MutationObserver(coverShell)
    for (const parent of parents) observer.observe(parent, { childList: true })
    return () => {
      observer.disconnect()
      for (const [element, wasInert] of previous) {
        if (!wasInert) element.removeAttribute('inert')
      }
    }
  }, [isFullscreen, leaveFullscreen])

  useEffect(() => {
    mounted.current = true

    const onFullscreenChange = () => {
      const nativeElement = document.fullscreenElement
      if (requestPending.current && nativeElement === document.documentElement) {
        ownsNative.current = true
        hadNativeFullscreen.current = true
        if (!active.current) exitOwnedNative()
        return
      }

      if (ownsNative.current && nativeElement !== document.documentElement) {
        ownsNative.current = false
        if (active.current) leaveFullscreen()
      } else if (active.current && hadNativeFullscreen.current && !nativeElement && !exitPending.current) {
        leaveFullscreen()
      }
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || event.defaultPrevented || !active.current || hasOpenModal()) return
      leaveFullscreen()
    }

    document.addEventListener('fullscreenchange', onFullscreenChange)
    window.addEventListener('keydown', onKeyDown)
    return () => {
      mounted.current = false
      document.removeEventListener('fullscreenchange', onFullscreenChange)
      window.removeEventListener('keydown', onKeyDown)
      leaveFullscreen()
    }
  }, [exitOwnedNative, leaveFullscreen])

  return { isFullscreen, toggleFullscreen }
}
