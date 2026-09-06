import { useCallback, useEffect, useState } from 'react'
import type { CHECK_IN_FONT_FAMILIES } from './CheckInPrintPreview'
import { CHECK_IN_DESIGN_SIZES } from './checkInPrintCatalog'
import { renderCheckInBackgroundCanvas } from './renderCheckInBackgroundCanvas'
import type { CheckInPrintDocument, DesignSizeId, PrintAssets } from './checkInPrintTypes'

export interface CheckInBackgroundTemplate {
  id: string
  imageUrl: string
  thumbnailUrl?: string
  brandingArea?: { x: number; y: number; width: number; height: number }
  brandingColor?: string
  brandingFont?: keyof typeof CHECK_IN_FONT_FAMILIES
  /** The interior placeholder area, relative to the original image dimensions. */
  qrBox: { x: number; y: number; width: number; height: number }
}
export interface BackgroundBrandingOptions {
  name?: string
  logoUrl?: string | null
  assets?: PrintAssets | null
  ready: boolean
}
interface PreparedBackground {
  key: string
  status: 'loading' | 'ready' | 'error'
  error: 'brandingOverflow' | 'image' | null
  document: CheckInPrintDocument | null
  assets: PrintAssets | null
}

/** Prepare one immutable canvas image shared by preview, print, and PDF export. */
export function useCheckInBackgroundPrint(template: CheckInBackgroundTemplate | null, qrUrl: string, sizeId: DesignSizeId, branding: BackgroundBrandingOptions = { ready: true }) {
  const logoAsset = branding.logoUrl ? branding.assets?.images.logo : undefined
  const key = JSON.stringify([template, qrUrl, sizeId, branding.name, branding.logoUrl, branding.ready, logoAsset?.objectUrl])
  const [attempt, setAttempt] = useState(0)
  const [state, setState] = useState<PreparedBackground>({ key, status: 'loading', error: null, document: null, assets: null })
  const retry = useCallback(() => setAttempt(value => value + 1), [])

  useEffect(() => {
    if (!template || !branding.ready) return
    const controller = new AbortController()
    const image = new Image()
    image.crossOrigin = 'anonymous'
    setState({ key, status: 'loading', error: null, document: null, assets: null })
    void (async () => {
      try {
        image.src = template.imageUrl
        await image.decode()
        if (controller.signal.aborted) return
        const dimensions = CHECK_IN_DESIGN_SIZES[sizeId]
        let logo: HTMLImageElement | undefined
        if (branding.logoUrl) {
          if (!logoAsset) throw new Error('Selected salon logo is unavailable')
          logo = new Image()
          logo.src = logoAsset.objectUrl
          await logo.decode()
          if (controller.signal.aborted) return
        }
        const result = await renderCheckInBackgroundCanvas({ background: image, qrUrl, qrBox: template.qrBox, ...dimensions, signal: controller.signal,
          branding: { name: branding.name, logo, area: template.brandingArea, color: template.brandingColor, fontFamily: '"Times New Roman", Times, serif' },
        })
        if (controller.signal.aborted) return
        const composedImage = new Image()
        composedImage.src = result.dataUrl
        await composedImage.decode()
        if (controller.signal.aborted) return
        const response = await fetch(result.dataUrl, { signal: controller.signal })
        const bytes = new Uint8Array(await response.arrayBuffer())
        if (controller.signal.aborted) return
        setState({
          key, status: 'ready', error: null,
          document: { ...dimensions, qrUrl, assetIds: ['poster'], nodes: [{ kind: 'image', assetId: 'poster', x: 0, y: 0, width: dimensions.widthPt, height: dimensions.heightPt }] },
          assets: { images: { poster: { bytes, mimeType: 'image/png', objectUrl: result.dataUrl } }, fonts: {}, measureText: () => 0 },
        })
      } catch (error) {
        if (!controller.signal.aborted) setState({ key, status: 'error', error: error instanceof Error && error.name === 'CheckInBrandingOverflowError' ? 'brandingOverflow' : 'image', document: null, assets: null })
      }
    })()
    return () => { controller.abort(); image.src = '' }
  }, [key, attempt])

  // Neither a previous salon's QR nor a previous template may be exposed while preparing.
  return { ...(template && branding.ready && state.key === key ? state : { key, status: 'loading' as const, error: null, document: null, assets: null }), retry }
}
