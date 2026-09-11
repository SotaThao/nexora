import type { CheckInPrintDocument, PrintAssets } from '../../dashboard/views/pos/checkinPrint/checkInPrintTypes'

/** Overlay one uppercase line inside the poster without resizing its artwork or QR. */
export function withOneQrArtworkHours(document: CheckInPrintDocument, assets: PrintAssets, hours: string, color = '#152238'): CheckInPrintDocument {
  const text = hours.toUpperCase()
  const maxWidth = document.widthPt - 48
  const baseFontSize = 10
  const naturalWidth = assets.measureText('inter', text, baseFontSize)
  const fontSize = naturalWidth > maxWidth ? baseFontSize * maxWidth / naturalWidth : baseFontSize
  const textWidth = assets.measureText('inter', text, fontSize)
  const x = (document.widthPt - textWidth) / 2
  const baselineY = document.heightPt - 16
  return {
    ...document,
    nodes: [
      ...document.nodes,
      { kind: 'text', runs: [{ text, x, baselineY, fontId: 'inter', fontSize, color }] },
    ],
  }
}
