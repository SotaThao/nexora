import type { CheckInPalette } from './checkInPrintCatalog'
import type { PrintNode, TemplateId } from './checkInPrintTypes'

/** Print artwork in physical points: fine rules and restrained architectural framing. */
export function createCheckInPrintDecoration(template: TemplateId, width: number, height: number, palette: CheckInPalette): PrintNode[] {
  const nodes: PrintNode[] = []
  if (template === 'simple') return nodes

  const accent = palette.accent
  const inset = Math.min(width, height) * .035
  const rule = .45
  const rect = (x: number, y: number, w: number, h: number, fill = accent) => {
    nodes.push({ kind: 'rect', x, y, width: w, height: h, fill })
  }
  const frame = (offset: number, weight = rule, fill = accent) => {
    rect(offset, offset, width - offset * 2, weight, fill)
    rect(offset, height - offset - weight, width - offset * 2, weight, fill)
    rect(offset, offset, weight, height - offset * 2, fill)
    rect(width - offset - weight, offset, weight, height - offset * 2, fill)
  }
  const diagonal = (x: number, y: number, length: number, mirror: boolean, fill: string) => {
    const direction = mirror ? -1 : 1
    nodes.push({ kind: 'path', x, y, fill,
      d: `M 0 0 L ${direction * length} 0 L 0 ${direction * length} Z` })
  }

  if (template === 'classic-gold') {
    // An ivory invitation-style frame. Foil accents stay at the trim, away from text.
    frame(inset, rule)
    frame(inset + 3, .25)
    const corner = width * .10
    diagonal(0, 0, corner, false, accent)
    diagonal(width, height, corner, true, accent)
    diagonal(0, 0, corner * .79, false, palette.background)
    diagonal(width, height, corner * .79, true, palette.background)
    rect(inset, inset, width * .19, 1.1)
    rect(width - inset - width * .19, height - inset - 1.1, width * .19, 1.1)
  }

  if (template === 'modern-navy') {
    // Architectural double rules; no simulated marble, brush strokes or clip-art curves.
    frame(inset, .4)
    const length = Math.min(width, height) * .16
    for (const offset of [inset + 3, inset + 6]) {
      rect(offset, offset, length, .3)
      rect(offset, offset, .3, length)
      rect(width - offset - length, height - offset, length, .3)
      rect(width - offset, height - offset - length, .3, length)
    }
    rect(width * .44, inset - .65, width * .12, 1.3)
    rect(width * .44, height - inset - .65, width * .12, 1.3)
  }

  if (template === 'minimal-clean') {
    // Editorial crop-like corner rules keep the central field entirely clear.
    const length = width * .12
    const quiet = palette.id === 'gold' ? '#ded5c5' : '#cbd3d8'
    for (const [x, y, direction] of [[inset, inset, 1], [width - inset, height - inset, -1]]) {
      rect(direction > 0 ? x : x - length, y, length, .55, quiet)
      rect(x, direction > 0 ? y : y - length, .55, length, quiet)
    }
    rect(width * .46, inset, width * .08, .75)
  }

  if (template === 'wide-counter') {
    const split = width * .51
    rect(split, 0, width - split, height, palette.id === 'navy' ? '#0c192b' : '#f3f3ee')
    frame(inset, .45)
    rect(split, inset, .45, height - inset * 2)
    // A pair of short horizontal rules anchors the two panels without competing with QR.
    rect(inset, inset, width * .12, 1.1)
    rect(width - inset - width * .12, height - inset - 1.1, width * .12, 1.1)
  }
  return nodes
}
