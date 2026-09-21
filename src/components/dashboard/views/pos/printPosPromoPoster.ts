/**
 * Promo poster print.
 *
 * Match the on-screen preview exactly: clone the live art (theme card or uploaded photo),
 * bake colors/gradients as inline styles so Chrome cannot drop them when printing, then
 * print a dedicated host without mutating the dialog.
 *
 * Uploaded photos stay as the original <img> URL — never re-encode through canvas
 * (that washes saturation).
 */
import { printDomWithBodyClass } from './receipt/browserPrintTransport'
import type { PromoArtTheme } from './posPromotionTemplates'

const PRINT_BODY_CLASS = 'printing-pos-promo-poster'
const PRINT_HOST_ID = 'pos-promo-poster-print-host'

/** Same gradients/colors as `.promo-art.theme-*` in pos-promotions.css. */
const THEME_PRINT_STYLE: Record<PromoArtTheme, { background: string; color: string }> = {
  purple: { background: 'linear-gradient(115deg, #eeeefe, #f7f6fc)', color: '#4c4698' },
  gold: { background: 'linear-gradient(115deg, #fbf2df, #faf7ef)', color: '#84632e' },
  rose: { background: 'linear-gradient(115deg, #faebf0, #fbf5f6)', color: '#97546e' },
  teal: { background: 'linear-gradient(115deg, #e7f4f0, #f4f9f7)', color: '#326f64' },
  ocean: { background: 'linear-gradient(115deg, #eaf0fa, #f5f8fc)', color: '#416791' },
  sage: { background: 'linear-gradient(115deg, #eaf2e9, #f5f8f1)', color: '#4c6c43' },
  peach: { background: 'linear-gradient(115deg, #fff0e8, #fff8f3)', color: '#92512f' },
  slate: { background: 'linear-gradient(115deg, #edf0f4, #f7f8fa)', color: '#536174' },
}

function themeFromClassList(classList: DOMTokenList): PromoArtTheme | null {
  for (const theme of Object.keys(THEME_PRINT_STYLE) as PromoArtTheme[]) {
    if (classList.contains(`theme-${theme}`)) return theme
  }
  return null
}

async function waitForImage(img: HTMLImageElement): Promise<void> {
  if (img.complete && img.naturalWidth > 0) return
  await new Promise<void>((resolve) => {
    img.onload = () => resolve()
    img.onerror = () => resolve()
    void img.decode().then(() => resolve()).catch(() => resolve())
  })
}

function removePrintHost() {
  document.getElementById(PRINT_HOST_ID)?.remove()
}

/**
 * Clone the preview art and force the same colors Chrome shows on screen.
 * Inline styles + print-color-adjust beat the "drop background on print" quirk.
 */
function cloneThemeArtForPrint(liveArt: HTMLElement): HTMLElement {
  const clone = liveArt.cloneNode(true) as HTMLElement
  clone.classList.add('promo-art-print-clone')

  const computed = window.getComputedStyle(liveArt)
  const theme = themeFromClassList(liveArt.classList) ?? 'purple'
  const fallback = THEME_PRINT_STYLE[theme]

  // Prefer the live computed look (covers custom colorHex inline styles).
  const liveColor = computed.color?.trim()
  const liveBgImage = computed.backgroundImage?.trim()
  const liveBgColor = computed.backgroundColor?.trim()

  const background =
    liveBgImage && liveBgImage !== 'none'
      ? liveBgImage
      : liveBgColor && liveBgColor !== 'rgba(0, 0, 0, 0)' && liveBgColor !== 'transparent'
        ? liveBgColor
        : fallback.background

  clone.style.setProperty('background', background, 'important')
  clone.style.setProperty('color', liveColor || fallback.color, 'important')
  clone.style.setProperty('-webkit-print-color-adjust', 'exact', 'important')
  clone.style.setProperty('print-color-adjust', 'exact', 'important')
  clone.style.setProperty('color-adjust', 'exact', 'important')

  // Poster preview sizing — keep proportions close to the dialog card.
  clone.style.setProperty('min-height', '280px', 'important')
  clone.style.setProperty('padding', '28px', 'important')
  clone.style.setProperty('border-radius', '10px', 'important')
  clone.style.setProperty('box-sizing', 'border-box', 'important')
  clone.style.setProperty('width', '100%', 'important')

  const title = clone.querySelector('h3')
  if (title instanceof HTMLElement) {
    title.style.setProperty('font-size', '26px', 'important')
    title.style.setProperty('font-weight', '600', 'important')
    title.style.setProperty('color', 'inherit', 'important')
    title.style.setProperty('margin', '0', 'important')
  }

  const saving = clone.querySelector('.art-saving')
  if (saving instanceof HTMLElement) {
    saving.style.setProperty('font-size', '46px', 'important')
    saving.style.setProperty('font-weight', '600', 'important')
    saving.style.setProperty('font-family', 'inherit', 'important')
    saving.style.setProperty('color', 'inherit', 'important')
  }

  const badge = clone.querySelector('.art-badge')
  if (badge instanceof HTMLElement) {
    badge.style.setProperty('background', 'rgba(255, 255, 255, 0.7)', 'important')
    badge.style.setProperty('color', 'inherit', 'important')
    badge.style.setProperty('-webkit-print-color-adjust', 'exact', 'important')
    badge.style.setProperty('print-color-adjust', 'exact', 'important')
  }

  return clone
}

async function cloneImageArtForPrint(liveArt: HTMLElement): Promise<HTMLElement | null> {
  const source = liveArt.querySelector('img')
  if (!source?.src) return null
  await waitForImage(source)

  const wrap = document.createElement('div')
  wrap.className = 'promo-art image-art promo-art-print-clone'
  wrap.style.setProperty('background', '#edf0f6', 'important')
  wrap.style.setProperty('border-radius', '10px', 'important')
  wrap.style.setProperty('overflow', 'hidden', 'important')
  wrap.style.setProperty('padding', '0', 'important')
  wrap.style.setProperty('-webkit-print-color-adjust', 'exact', 'important')
  wrap.style.setProperty('print-color-adjust', 'exact', 'important')

  const img = document.createElement('img')
  img.src = source.currentSrc || source.src
  img.alt = ''
  img.className = 'promo-art-print-raster'
  await waitForImage(img)
  wrap.appendChild(img)
  return wrap
}

async function buildPrintHost(liveRoot: Element): Promise<HTMLElement | null> {
  const liveArt = liveRoot.querySelector<HTMLElement>('.poster-output .promo-art')
  const liveDetails = liveRoot.querySelector('.poster-details')
  if (!liveArt) return null

  removePrintHost()

  const host = document.createElement('div')
  host.id = PRINT_HOST_ID
  host.className = 'pos-promo-poster-print-host pos-promo-poster-print-root'
  host.setAttribute('aria-hidden', 'true')

  const output = document.createElement('div')
  output.className = 'poster-output'

  if (liveArt.classList.contains('image-art')) {
    const imageClone = await cloneImageArtForPrint(liveArt)
    if (!imageClone) return null
    output.appendChild(imageClone)
  } else {
    output.appendChild(cloneThemeArtForPrint(liveArt))
  }

  host.appendChild(output)

  if (liveDetails) {
    const details = liveDetails.cloneNode(true) as HTMLElement
    details.classList.add('poster-details')
    host.appendChild(details)
  }

  document.body.appendChild(host)
  return host
}

/** Print the open promo poster without altering the on-screen preview. */
export function printPosPromoPoster(): void {
  void (async () => {
    const liveRoot = document.querySelector(
      '.pos-promo-poster-print-root:not(.pos-promo-poster-print-host)',
    )
    if (!liveRoot) return

    const host = await buildPrintHost(liveRoot)
    if (!host) return

    const cleanup = () => removePrintHost()
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
    })

    const handle = printDomWithBodyClass(PRINT_BODY_CLASS, cleanup)
    window.addEventListener('afterprint', cleanup, { once: true })
    window.setTimeout(() => {
      cleanup()
      handle.cancel()
    }, 60_000)
  })()
}
