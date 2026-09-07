import { CHECK_IN_FONT_FAMILIES } from '../../dashboard/views/pos/checkinPrint/CheckInPrintPreview'
import type { CheckInPrintDocument, PrintAssets } from '../../dashboard/views/pos/checkinPrint/checkInPrintTypes'

/** Render the same immutable document used by preview and PDF at 300 DPI. */
export async function createOneQrArtworkPng(document: CheckInPrintDocument, assets: PrintAssets): Promise<Blob> {
  const scale = 300 / 72
  const canvas = window.document.createElement('canvas')
  canvas.width = Math.round(document.widthPt * scale)
  canvas.height = Math.round(document.heightPt * scale)
  try {
    const context = canvas.getContext('2d')
    if (!context) throw new Error('Canvas is unavailable')
    context.fillStyle = '#ffffff'
    context.fillRect(0, 0, canvas.width, canvas.height)
    context.scale(scale, scale)
    for (const node of document.nodes) {
      if (node.kind === 'image') {
        const asset = assets.images[node.assetId]
        if (!asset) throw new Error('Missing artwork image')
        const image = new Image()
        image.src = asset.objectUrl
        await image.decode()
        const fit = Math.min(node.width / image.naturalWidth, node.height / image.naturalHeight)
        const width = image.naturalWidth * fit
        const height = image.naturalHeight * fit
        context.drawImage(image, node.x + (node.width - width) / 2, node.y + (node.height - height) / 2, width, height)
      } else if (node.kind === 'text') {
        context.fontKerning = 'none'
        for (const run of node.runs) {
          context.font = `${run.fontSize}px "${CHECK_IN_FONT_FAMILIES[run.fontId]}"`
          context.fillStyle = run.color
          context.fillText(run.text, run.x, run.baselineY)
        }
      } else if (node.kind === 'rect') {
        context.fillStyle = node.fill
        context.fillRect(node.x, node.y, node.width, node.height)
      } else if (node.kind === 'path') {
        context.save()
        context.translate(node.x, node.y)
        context.fillStyle = node.fill
        context.fill(new Path2D(node.d))
        context.restore()
      }
    }
    return await new Promise<Blob>((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('PNG export failed')), 'image/png'))
  } finally {
    canvas.width = 0
    canvas.height = 0
  }
}
