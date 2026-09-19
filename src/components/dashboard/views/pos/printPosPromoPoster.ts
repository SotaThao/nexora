/**
 * Promo poster print.
 *
 * Chrome drops CSS theme backgrounds when printing. Uploaded photos must stay as the
 * original <img> bytes — redrawing them through canvas washes out reds/saturation.
 *
 * Never mutate the on-screen preview: build a dedicated print host, print it, then remove it.
 */
import { printDomWithBodyClass } from './receipt/browserPrintTransport'
import type { PromoArtTheme } from './posPromotionTemplates'

const PRINT_BODY_CLASS = 'printing-pos-promo-poster'
const PRINT_HOST_ID = 'pos-promo-poster-print-host'

const THEME_PRINT_FILL: Record<PromoArtTheme, { background: string; color: string }> = {
  purple: { background: '#eeeefe', color: '#4c4698' },
  gold: { background: '#fbf2df', color: '#84632e' },
  rose: { background: '#faebf0', color: '#97546e' },
  teal: { background: '#e7f4f0', color: '#326f64' },
  ocean: { background: '#eaf0fa', color: '#416791' },
  sage: { background: '#eaf2e9', color: '#4c6c43' },
  peach: { background: '#fff0e8', color: '#92512f' },
  slate: { background: '#edf0f4', color: '#536174' },
}

function themeFromClassList(classList: DOMTokenList): PromoArtTheme | null {
  for (const theme of Object.keys(THEME_PRINT_FILL) as PromoArtTheme[]) {
    if (classList.contains(`theme-${theme}`)) return theme
  }
  return null
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const radius = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.arcTo(x + w, y, x + w, y + h, radius)
  ctx.arcTo(x + w, y + h, x, y + h, radius)
  ctx.arcTo(x, y + h, x, y, radius)
  ctx.arcTo(x, y, x + w, y, radius)
  ctx.closePath()
}

function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/).filter(Boolean)
  if (words.length === 0) return []
  const lines: string[] = []
  let current = words[0]
  for (let i = 1; i < words.length; i += 1) {
    const next = `${current} ${words[i]}`
    if (ctx.measureText(next).width <= maxWidth) current = next
    else {
      lines.push(current)
      current = words[i]
    }
  }
  lines.push(current)
  return lines
}

async function waitForImage(img: HTMLImageElement): Promise<void> {
  if (img.complete && img.naturalWidth > 0) return
  await new Promise<void>((resolve) => {
    img.onload = () => resolve()
    img.onerror = () => resolve()
    void img.decode().then(() => resolve()).catch(() => resolve())
  })
}

function buildThemePng(art: HTMLElement): string | null {
  const width = 640
  const height = 420
  const scale = 2
  const canvas = document.createElement('canvas')
  canvas.width = width * scale
  canvas.height = height * scale
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  ctx.scale(scale, scale)

  const theme = themeFromClassList(art.classList) ?? 'purple'
  const fill = THEME_PRINT_FILL[theme]
  const badge = art.querySelector('.art-badge')?.textContent?.trim() ?? ''
  const title = art.querySelector('h3')?.textContent?.trim() ?? ''
  const saving = art.querySelector('.art-saving')?.textContent?.trim() ?? ''
  const pad = 28
  const maxText = width - pad * 2

  ctx.fillStyle = fill.background
  roundRect(ctx, 0, 0, width, height, 10)
  ctx.fill()

  let y = pad + 8
  ctx.textBaseline = 'top'
  ctx.fillStyle = fill.color

  if (badge) {
    ctx.font = '500 11px Inter, system-ui, sans-serif'
    const badgeWidth = Math.min(ctx.measureText(badge).width + 14, maxText)
    ctx.fillStyle = 'rgba(255,255,255,0.7)'
    roundRect(ctx, pad, y, badgeWidth, 22, 5)
    ctx.fill()
    ctx.fillStyle = fill.color
    ctx.fillText(badge, pad + 7, y + 5, maxText)
    y += 36
  }

  if (title) {
    ctx.font = '500 22px Inter, system-ui, sans-serif'
    wrapLines(ctx, title, maxText).forEach((line) => {
      ctx.fillText(line, pad, y, maxText)
      y += 28
    })
    y += 8
  }

  if (saving) {
    ctx.font = '400 40px Georgia, "Times New Roman", serif'
    wrapLines(ctx, saving, maxText).forEach((line) => {
      ctx.fillText(line, pad, y, maxText)
      y += 48
    })
  }

  return canvas.toDataURL('image/png')
}

function removePrintHost() {
  document.getElementById(PRINT_HOST_ID)?.remove()
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
    const source = liveArt.querySelector('img')
    if (!source?.src) return null
    await waitForImage(source)
    const img = document.createElement('img')
    // Same URL as the preview — do not re-encode through canvas (washes color).
    img.src = source.currentSrc || source.src
    img.alt = ''
    img.className = 'promo-art-print-raster'
    await waitForImage(img)
    output.appendChild(img)
  } else {
    const dataUrl = buildThemePng(liveArt)
    if (!dataUrl) return null
    const img = document.createElement('img')
    img.src = dataUrl
    img.alt = ''
    img.className = 'promo-art-print-raster'
    await waitForImage(img)
    output.appendChild(img)
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
    const liveRoot = document.querySelector('.pos-promo-poster-print-root:not(.pos-promo-poster-print-host)')
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
