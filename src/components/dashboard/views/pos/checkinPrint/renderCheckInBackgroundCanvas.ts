import QRCode from 'qrcode'

export interface BackgroundQrBox {
  /** Fractions of the ORIGINAL background image, before fitting it on the physical page. */
  x: number
  y: number
  width: number
  height: number
}
interface BackgroundLayoutInput {
  naturalWidth: number
  naturalHeight: number
  qrBox: BackgroundQrBox
  widthPt: number
  heightPt: number
  dpi?: number
}
export interface BackgroundBranding {
  name?: string
  logo?: HTMLImageElement
  color?: string
  fontFamily?: string
  area?: BackgroundQrBox
}
export interface BackgroundCanvasInput {
  background: HTMLImageElement
  qrUrl: string
  qrBox: BackgroundQrBox
  widthPt: number
  heightPt: number
  dpi?: number
  signal?: AbortSignal
  branding?: BackgroundBranding
}

/** Shared deterministic geometry; QR modules and their four-module border use whole pixels. */
export function computeCheckInBackgroundLayout(input: BackgroundLayoutInput, moduleCount: number) {
  const { naturalWidth, naturalHeight, widthPt, heightPt, qrBox, dpi = 300 } = input
  if (![naturalWidth, naturalHeight, widthPt, heightPt, dpi, moduleCount].every(value => Number.isFinite(value) && value > 0)) {
    throw new Error('Invalid background or page dimensions')
  }
  if (dpi > 300 || !Number.isInteger(moduleCount)) throw new Error('Invalid print resolution')
  if (![qrBox.x, qrBox.y, qrBox.width, qrBox.height].every(Number.isFinite)
      || qrBox.x < 0 || qrBox.y < 0 || qrBox.width <= 0 || qrBox.height <= 0
      || qrBox.x + qrBox.width > 1 || qrBox.y + qrBox.height > 1) {
    throw new Error('QR box must lie within the source image')
  }
  const widthPx = Math.round(widthPt / 72 * dpi)
  const heightPx = Math.round(heightPt / 72 * dpi)
  if (widthPx < 1 || heightPx < 1 || widthPx * heightPx > 12_000_000 || Math.max(widthPx, heightPx) > 5000) {
    throw new Error('Print canvas exceeds the supported size')
  }
  const scale = Math.min(widthPx / naturalWidth, heightPx / naturalHeight)
  const background = {
    x: (widthPx - naturalWidth * scale) / 2,
    y: (heightPx - naturalHeight * scale) / 2,
    width: naturalWidth * scale,
    height: naturalHeight * scale,
  }
  const left = background.x + qrBox.x * background.width
  const top = background.y + qrBox.y * background.height
  const boxWidth = qrBox.width * background.width
  const boxHeight = qrBox.height * background.height
  // A one-inch minimum prevents technically valid but impractically small printed QR codes.
  if (Math.min(boxWidth, boxHeight) < dpi) throw new Error('QR box must be at least one inch square on the page')
  const modulePx = Math.floor(Math.min(boxWidth, boxHeight) / (moduleCount + 8))
  if (modulePx < 2) throw new Error('QR destination is too dense for this print region')
  const qrSizePx = modulePx * (moduleCount + 8)
  return {
    widthPx, heightPx, background, modulePx, qrSizePx,
    qrX: Math.round(left + (boxWidth - qrSizePx) / 2),
    qrY: Math.round(top + (boxHeight - qrSizePx) / 2),
    // Expand outward by at most one pixel to erase the original placeholder completely.
    clearBox: { x: Math.floor(left), y: Math.floor(top), width: Math.ceil(left + boxWidth) - Math.floor(left), height: Math.ceil(top + boxHeight) - Math.floor(top) },
  }
}

function checkAbort(signal?: AbortSignal) {
  if (signal?.aborted) throw new DOMException('Print preparation was cancelled', 'AbortError')
}
async function decodeBackground(background: HTMLImageElement, signal?: AbortSignal) {
  checkAbort(signal)
  await new Promise<void>((resolve, reject) => {
    const aborted = () => reject(new DOMException('Print preparation was cancelled', 'AbortError'))
    signal?.addEventListener('abort', aborted, { once: true })
    background.decode().then(resolve, reject).finally(() => signal?.removeEventListener('abort', aborted))
  })
  checkAbort(signal)
  if (!background.naturalWidth || !background.naturalHeight) throw new Error('Background image could not be decoded')
}

export class CheckInBrandingOverflowError extends Error {
  constructor() {
    super('Salon name does not fit the background branding area')
    this.name = 'CheckInBrandingOverflowError'
  }
}

/** Fit at most two complete lines in the reserved top slot; never truncate a business name. */
export function fitCheckInBrandingName(name: string, width: number, height: number, baseSize: number, minSize: number, measure: (text: string, size: number) => number) {
  const normalized = name.normalize('NFC').trim().replace(/\s+/g, ' ')
  if (!normalized) return { lines: [] as string[], fontSize: baseSize }
  for (let step = 0; step <= 24; step++) {
    const fontSize = baseSize - (baseSize - minSize) * step / 24
    const lines: string[] = []
    let line = ''
    let tooWide = false
    for (const word of normalized.split(' ')) {
      if (measure(word, fontSize) > width) { tooWide = true; break }
      const candidate = line ? `${line} ${word}` : word
      if (measure(candidate, fontSize) <= width) line = candidate
      else { lines.push(line); line = word }
    }
    if (line) lines.push(line)
    if (!tooWide && lines.length <= 2 && lines.length * fontSize * 1.25 <= height) return { lines, fontSize }
  }
  throw new CheckInBrandingOverflowError()
}

function drawBranding(context: CanvasRenderingContext2D, bounds: {x:number;y:number;width:number;height:number}, branding?: BackgroundBranding) {
  if (!branding) return
  const name = branding.name?.normalize('NFC').trim() ?? ''
  const { logo } = branding
  const area = branding.area ?? { x: .2, y: .065, width: .6, height: .105 }
  const left = bounds.x + bounds.width * area.x
  const top = bounds.y + bounds.height * area.y
  const width = bounds.width * area.width
  const height = bounds.height * area.height
  const centerX = left + width / 2
  if (logo) {
    const logoSlotHeight = height * (name ? .44 : .85)
    const logoSlotWidth = width * .65
    const scale = Math.min(logoSlotWidth / logo.naturalWidth, logoSlotHeight / logo.naturalHeight)
    const logoWidth = logo.naturalWidth * scale
    const logoHeight = logo.naturalHeight * scale
    context.drawImage(logo, centerX - logoWidth / 2, top + (name ? 0 : (height - logoSlotHeight) / 2) + (logoSlotHeight - logoHeight) / 2, logoWidth, logoHeight)
  }
  if (!name) return
  context.save()
  try {
    const family = branding.fontFamily || 'sans-serif'
    const nameTop = top + (logo ? height * .53 : 0)
    const slotHeight = height * (logo ? .47 : 1)
    const slotWidth = width
    const fit = fitCheckInBrandingName(name, slotWidth, slotHeight, bounds.width * (logo ? .043 : .052), bounds.width * .018, (text, size) => {
      context.font = `600 ${size}px ${family}`
      return context.measureText(text).width
    })
    context.font = `600 ${fit.fontSize}px ${family}`
    context.fillStyle = branding.color || '#0b1220'
    context.textAlign = 'center'
    context.textBaseline = 'alphabetic'
    const metrics = fit.lines.map(line => context.measureText(line))
    const ascent = Math.max(...metrics.map(metric => metric.actualBoundingBoxAscent))
    const descent = Math.max(...metrics.map(metric => metric.actualBoundingBoxDescent))
    const lineHeight = Math.max(fit.fontSize * 1.25, ascent + descent)
    const inkHeight = (fit.lines.length - 1) * lineHeight + ascent + descent
    if (inkHeight > slotHeight) throw new CheckInBrandingOverflowError()
    const baseline = nameTop + (slotHeight - inkHeight) / 2 + ascent
    fit.lines.forEach((line, index) => context.fillText(line, centerX, baseline + index * lineHeight))
  } finally { context.restore() }
}

export async function renderCheckInBackgroundCanvas(input: BackgroundCanvasInput): Promise<{ dataUrl: string; widthPx: number; heightPx: number }> {
  const { background, qrUrl, qrBox, widthPt, heightPt, dpi = 300, signal } = input
  checkAbort(signal)
  let url: URL
  try { url = new URL(qrUrl) } catch { throw new Error('Invalid check-in URL') }
  if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) throw new Error('Invalid check-in URL')
  const qr = QRCode.create(qrUrl, { errorCorrectionLevel: 'M' })
  await decodeBackground(background, signal)
  if (input.branding?.logo) await decodeBackground(input.branding.logo, signal)
  const layout = computeCheckInBackgroundLayout({ naturalWidth: background.naturalWidth, naturalHeight: background.naturalHeight, qrBox, widthPt, heightPt, dpi }, qr.modules.size)
  const canvas = document.createElement('canvas')
  canvas.width = layout.widthPx
  canvas.height = layout.heightPx
  try {
    const context = canvas.getContext('2d', { alpha: false })
    if (!context) throw new Error('Canvas rendering is unavailable')
    context.fillStyle = '#ffffff'
    context.fillRect(0, 0, canvas.width, canvas.height)
    context.imageSmoothingEnabled = true
    context.imageSmoothingQuality = 'high'
    context.drawImage(background, layout.background.x, layout.background.y, layout.background.width, layout.background.height)
    drawBranding(context, layout.background, input.branding)
    context.fillStyle = '#ffffff'
    context.fillRect(layout.clearBox.x, layout.clearBox.y, layout.clearBox.width, layout.clearBox.height)
    context.imageSmoothingEnabled = false
    context.fillStyle = '#000000'
    for (let row = 0; row < qr.modules.size; row++) {
      checkAbort(signal)
      for (let column = 0; column < qr.modules.size; column++) {
        if (qr.modules.get(row, column)) context.fillRect(layout.qrX + (column + 4) * layout.modulePx, layout.qrY + (row + 4) * layout.modulePx, layout.modulePx, layout.modulePx)
      }
    }
    checkAbort(signal)
    const dataUrl = canvas.toDataURL('image/png')
    if (!dataUrl.startsWith('data:image/png;base64,')) throw new Error('Canvas export failed')
    return { dataUrl, widthPx: layout.widthPx, heightPx: layout.heightPx }
  } finally {
    // The returned PNG owns its bytes; release the large temporary backing buffer promptly.
    canvas.width = 0
    canvas.height = 0
  }
}
