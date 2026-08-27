import { HEADER_MESSAGES_MOBILE_OPEN_CLASS } from '../header-messages/headerMessagesConstants'

const HINT_CAPTION_HALF_PX = 92
const HINT_VIEWPORT_PAD_PX = 16
const HINT_MOBILE_CLUSTER_GAP_PX = 6
const HINT_MOBILE_CLUSTER_WIDTH_PX = 196
const HINT_UNLOCK_WAIT_MS = 150
const HINT_LOCK_POLL_MS = 50
const HINT_SCROLL_MIN_MS = 420
const HINT_SCROLL_MAX_MS = 900
const HINT_SCROLL_MS_PER_PX = 0.55
const HINT_SCROLL_SNAP_PX = 2

const STICKY_HEADER_SELECTOR = 'header.sticky'
const MOBILE_BOTTOM_NAV_SELECTOR = '[data-mobile-bottom-nav]'

export const STAFF_CHAT_START_HINT_TARGET_CLASS = 'staff-chat-start-hint-target'
export const STAFF_CHAT_START_HINT_CLUSTER_CLASS = 'staff-chat-start-hint-cluster'
export const STAFF_CHAT_START_HINT_CAPTION_CLASS = 'staff-chat-start-hint-caption'
export const STAFF_CHAT_START_HINT_HAND_CLASS = 'staff-chat-start-hint-hand'
export const STAFF_CHAT_START_HINT_ACTIVE_CLASS = 'is-active'
export const STAFF_CHAT_START_HINT_MOBILE_CLASS = 'is-mobile'

function clampHintAnchorX(centerX: number): number {
  const minX = HINT_VIEWPORT_PAD_PX + HINT_CAPTION_HALF_PX
  const maxX = window.innerWidth - HINT_VIEWPORT_PAD_PX - HINT_CAPTION_HALF_PX
  if (maxX <= minX) return centerX
  return Math.min(Math.max(centerX, minX), maxX)
}

function getMobileHintClusterPosition(rect: DOMRect): { top: number; left: number } {
  const maxLeft = window.innerWidth - HINT_VIEWPORT_PAD_PX - HINT_MOBILE_CLUSTER_WIDTH_PX
  return {
    top: rect.bottom + HINT_MOBILE_CLUSTER_GAP_PX,
    left: Math.min(rect.left, Math.max(HINT_VIEWPORT_PAD_PX, maxLeft)),
  }
}

export function getHintClusterPosition(
  rect: DOMRect,
  isMobile: boolean,
): { top: number; left: number } {
  if (isMobile) return getMobileHintClusterPosition(rect)
  return {
    top: rect.top,
    left: clampHintAnchorX(rect.left + rect.width / 2),
  }
}

function prefersReducedMotion(): boolean {
  return Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)
}

function isPageScrollLocked(): boolean {
  return document.documentElement.classList.contains(HEADER_MESSAGES_MOBILE_OPEN_CLASS)
    || document.body.classList.contains(HEADER_MESSAGES_MOBILE_OPEN_CLASS)
    || document.body.style.position === 'fixed'
}

function getWindowScrollTop(): number {
  return window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0
}

function getVisibleViewportCenterY(): number {
  const header = document.querySelector(STICKY_HEADER_SELECTOR)
  const nav = document.querySelector(MOBILE_BOTTOM_NAV_SELECTOR)
  const top = header instanceof HTMLElement ? header.getBoundingClientRect().bottom : 0
  const navRect = nav instanceof HTMLElement ? nav.getBoundingClientRect() : null
  const bottom = navRect && navRect.height > 0 ? navRect.top : window.innerHeight
  return (top + bottom) / 2
}

function getTargetWindowScrollTop(el: HTMLElement): number {
  const rect = el.getBoundingClientRect()
  const delta = (rect.top + rect.height / 2) - getVisibleViewportCenterY()
  const max = Math.max(
    0,
    (document.scrollingElement?.scrollHeight ?? document.documentElement.scrollHeight) - window.innerHeight,
  )
  return Math.min(max, Math.max(0, getWindowScrollTop() + delta))
}

function hintScrollDurationMs(distance: number): number {
  return Math.min(
    HINT_SCROLL_MAX_MS,
    Math.max(HINT_SCROLL_MIN_MS, Math.round(Math.abs(distance) * HINT_SCROLL_MS_PER_PX)),
  )
}

function animateWindowScrollTo(to: number, onTick: () => void): () => void {
  const from = getWindowScrollTop()
  const distance = to - from
  if (Math.abs(distance) < HINT_SCROLL_SNAP_PX || prefersReducedMotion()) {
    window.scrollTo(0, to)
    onTick()
    return () => {}
  }

  const durationMs = hintScrollDurationMs(distance)
  const start = performance.now()
  let raf = 0
  let cancelled = false
  const easeOutCubic = (t: number) => 1 - ((1 - t) ** 3)

  const tick = (now: number) => {
    if (cancelled) return
    const t = Math.min(1, (now - start) / durationMs)
    window.scrollTo(0, from + (distance * easeOutCubic(t)))
    onTick()
    if (t < 1) raf = window.requestAnimationFrame(tick)
  }

  raf = window.requestAnimationFrame(tick)
  return () => {
    cancelled = true
    window.cancelAnimationFrame(raf)
  }
}

function whenPageCanScroll(onReady: () => void): () => void {
  let cancelled = false
  let timeoutId = 0

  const tryReady = () => {
    if (cancelled) return
    if (isPageScrollLocked()) {
      timeoutId = window.setTimeout(tryReady, HINT_LOCK_POLL_MS)
      return
    }
    timeoutId = window.setTimeout(() => {
      if (!cancelled) onReady()
    }, HINT_UNLOCK_WAIT_MS)
  }

  timeoutId = window.setTimeout(tryReady, 0)
  return () => {
    cancelled = true
    window.clearTimeout(timeoutId)
  }
}

export function scrollStaffChatHintIntoView(
  el: HTMLElement,
  onTick: () => void,
): () => void {
  let stopScroll: (() => void) | undefined
  const cancelWait = whenPageCanScroll(() => {
    window.scrollTo(0, 0)
    window.requestAnimationFrame(() => {
      onTick()
      stopScroll = animateWindowScrollTo(getTargetWindowScrollTop(el), onTick)
    })
  })

  return () => {
    cancelWait()
    stopScroll?.()
  }
}
