/** Match Booking Today compact / mobile breakpoint. */
export const AI_HUB_MOBILE_MEDIA_QUERY = '(max-width: 767px)' as const

/** Mark form fields so validation can resolve viewport vs below-fold. */
export const AI_HUB_FIELD_ATTR = 'data-ai-hub-field' as const

/** Invalid / required field markers used across AI Hub dialogs (after paint). */
export const AI_HUB_INVALID_FIELD_SELECTOR =
  '.has-error, [aria-invalid="true"], .field-error, .cust-field-error, .settings-field-error, .trial-field.has-error' as const

const BELOW_FOLD_PAD_PX = 24

export function isAiHubMobileViewport(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false
  }
  return window.matchMedia(AI_HUB_MOBILE_MEDIA_QUERY).matches
}

function findScrollParent(el: Element): Element | null {
  let node: Element | null = el.parentElement
  while (node && node !== document.body) {
    const style = window.getComputedStyle(node)
    const overflowY = style.overflowY
    const canScroll =
      (overflowY === 'auto' || overflowY === 'scroll' || overflowY === 'overlay')
      && node.scrollHeight > node.clientHeight + 1
    if (canScroll) return node
    node = node.parentElement
  }
  return null
}

/** True when the field’s top sits at/below the visible clip (viewport ∩ scroll parent). */
export function isAiHubFieldBelowVisibleFold(el: Element): boolean {
  const rect = el.getBoundingClientRect()
  const vv = window.visualViewport
  let clipBottom = vv ? vv.offsetTop + vv.height : window.innerHeight

  const scrollParent = findScrollParent(el)
  if (scrollParent) {
    clipBottom = Math.min(clipBottom, scrollParent.getBoundingClientRect().bottom)
  }

  return rect.top > clipBottom - BELOW_FOLD_PAD_PX
}

export function resolveAiHubFieldElement(
  root: ParentNode | null | undefined,
  fieldKey: string,
): HTMLElement | null {
  if (!root || !fieldKey) return null
  const escaped =
    typeof CSS !== 'undefined' && typeof CSS.escape === 'function'
      ? CSS.escape(fieldKey)
      : fieldKey.replace(/"/g, '\\"')
  return root.querySelector<HTMLElement>(`[${AI_HUB_FIELD_ATTR}="${escaped}"]`)
}

export function queryAiHubInvalidFields(
  root: ParentNode | null | undefined,
): HTMLElement[] {
  if (!root) return []
  return Array.from(
    root.querySelectorAll<HTMLElement>(AI_HUB_INVALID_FIELD_SELECTOR),
  )
}

type ErrorMap = Record<string, string | undefined>

/**
 * Show in-viewport invalid fields first.
 * Only reveal below-fold errors (for scroll/toast) once viewport requireds are clean.
 */
export function pickAiHubViewportFirstErrors<T extends ErrorMap>(
  allErrors: T,
  root: ParentNode | null | undefined,
): {
  errorsToShow: T
  shouldRevealOffscreen: boolean
  revealedFieldKeys: string[]
} {
  const entries = Object.entries(allErrors).filter(
    (entry): entry is [string, string] => Boolean(entry[1]),
  )
  if (entries.length === 0) {
    return {
      errorsToShow: {} as T,
      shouldRevealOffscreen: false,
      revealedFieldKeys: [],
    }
  }

  const located = entries.map(([key, message]) => {
    const el = resolveAiHubFieldElement(root, key)
    // Unmarked fields stay "in viewport" so we never hide their errors.
    const below = el ? isAiHubFieldBelowVisibleFold(el) : false
    return { key, message, below }
  })

  const inViewport = located.filter((item) => !item.below)
  if (inViewport.length > 0) {
    return {
      errorsToShow: Object.fromEntries(
        inViewport.map((item) => [item.key, item.message]),
      ) as T,
      shouldRevealOffscreen: false,
      revealedFieldKeys: inViewport.map((item) => item.key),
    }
  }

  return {
    errorsToShow: Object.fromEntries(
      located.map((item) => [item.key, item.message]),
    ) as T,
    shouldRevealOffscreen: true,
    revealedFieldKeys: located.map((item) => item.key),
  }
}

/** Join human labels for toast copy (dedupe, skip blanks). */
export function formatAiHubFieldLabelList(
  fieldKeys: ReadonlyArray<string>,
  fieldLabels: Record<string, string> | undefined,
): string {
  const labels: string[] = []
  const seen = new Set<string>()
  for (const key of fieldKeys) {
    const raw = (fieldLabels?.[key] || key).trim()
    const label = raw.replace(/\s*\*\s*$/, '').trim()
    if (!label || seen.has(label)) continue
    seen.add(label)
    labels.push(label)
  }
  return labels.join(', ')
}

/** Toast copy: "{Date} is required…" / "{Date, Time} are required…". */
export function buildAiHubRequiredFieldsToast(
  t: (key: string, vars?: Record<string, string | number>) => string,
  hubTk: string,
  fieldsLabel: string,
  fieldCount: number,
): string {
  if (!fieldsLabel) return t(`${hubTk}.requiredFieldsToastGeneric`)
  return t(
    fieldCount <= 1
      ? `${hubTk}.requiredFieldsToastOne`
      : `${hubTk}.requiredFieldsToastMany`,
    { fields: fieldsLabel },
  )
}

type NotifyOptions = {
  root: ParentNode | null | undefined
  showToast: (message: string, type?: string) => void
  message: string
  /** When false, field errors are in-viewport — no toast / scroll. */
  revealOffscreen?: boolean
  scrollIntoView?: boolean
  toast?: boolean
}

/**
 * After painting the progressive error set:
 * - viewport-only → field errors only (no toast, no scroll)
 * - offscreen reveal → scroll to first invalid + toast naming those fields
 */
export function notifyAiHubRequiredFieldsOffscreen(options: NotifyOptions): void {
  const {
    root,
    showToast,
    message,
    revealOffscreen = true,
    scrollIntoView = true,
    toast = true,
  } = options

  if (typeof window === 'undefined') return

  // In-viewport errors are already visible on the form — do not toast.
  if (!revealOffscreen) return

  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => {
      const targets = queryAiHubInvalidFields(root)
      const focusEl =
        targets.find(isAiHubFieldBelowVisibleFold)
        ?? targets[0]
        ?? null

      if (scrollIntoView && focusEl) {
        focusEl.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }

      if (toast && message) showToast(message, 'warning')
    })
  })
}

/**
 * Progressive validation: set viewport errors first; only scroll when revealing offscreen.
 * @returns true when submit should stop (has errors to show).
 */
export function applyAiHubProgressiveValidation<T extends ErrorMap>(options: {
  allErrors: T
  root: ParentNode | null | undefined
  setErrors: (errors: T) => void
  showToast: (message: string, type?: string) => void
  /** fieldKey → display label for the offscreen toast. */
  fieldLabels?: Record<string, string>
  /** Build toast when revealing offscreen fields. Receives joined labels + keys. */
  formatScrollMessage?: (fieldsLabel: string, fieldKeys: string[]) => string
  /** i18n prefix for default required-fields toast (`…BookingHubView`). */
  hubTk?: string
  t?: (key: string, vars?: Record<string, string | number>) => string
  /** Fallback when labels are empty. */
  scrollMessageFallback?: string
}): boolean {
  const {
    allErrors,
    root,
    setErrors,
    showToast,
    fieldLabels,
    formatScrollMessage,
    hubTk,
    t,
    scrollMessageFallback,
  } = options

  const hasAny = Object.values(allErrors).some(Boolean)
  if (!hasAny) {
    setErrors({} as T)
    return false
  }

  const { errorsToShow, shouldRevealOffscreen, revealedFieldKeys } =
    pickAiHubViewportFirstErrors(allErrors, root)
  setErrors(errorsToShow)

  const fieldsLabel = formatAiHubFieldLabelList(revealedFieldKeys, fieldLabels)
  let scrollMessage = ''
  if (shouldRevealOffscreen) {
    if (formatScrollMessage) {
      scrollMessage = fieldsLabel
        ? formatScrollMessage(fieldsLabel, revealedFieldKeys)
        : (scrollMessageFallback
          || formatScrollMessage(revealedFieldKeys.join(', '), revealedFieldKeys))
    } else if (t && hubTk) {
      scrollMessage = buildAiHubRequiredFieldsToast(
        t,
        hubTk,
        fieldsLabel,
        revealedFieldKeys.length,
      )
    } else {
      scrollMessage = scrollMessageFallback || fieldsLabel
    }
  }

  notifyAiHubRequiredFieldsOffscreen({
    root,
    showToast,
    message: scrollMessage,
    revealOffscreen: shouldRevealOffscreen,
  })
  return true
}
