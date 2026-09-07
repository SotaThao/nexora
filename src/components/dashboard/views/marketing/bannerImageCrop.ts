export const BANNER_ASPECT_RATIO = 3
export const BANNER_CROP_EXPORT_WIDTH = 1920
export const BANNER_CROP_EXPORT_HEIGHT = 640

export interface CropLayout {
  scale: number
  offsetX: number
  offsetY: number
  containerWidth: number
  containerHeight: number
  naturalWidth: number
  naturalHeight: number
}

export function computeCoverScale(
  naturalWidth: number,
  naturalHeight: number,
  containerWidth: number,
  containerHeight: number,
): number {
  return Math.max(containerWidth / naturalWidth, containerHeight / naturalHeight)
}

export function clampCropOffset(
  offsetX: number,
  offsetY: number,
  scaledWidth: number,
  scaledHeight: number,
  containerWidth: number,
  containerHeight: number,
): { x: number; y: number } {
  const minX = containerWidth - scaledWidth
  const minY = containerHeight - scaledHeight

  return {
    x: Math.min(0, Math.max(minX, offsetX)),
    y: Math.min(0, Math.max(minY, offsetY)),
  }
}

export function createCenteredCropOffset(
  naturalWidth: number,
  naturalHeight: number,
  containerWidth: number,
  containerHeight: number,
): { scale: number; offsetX: number; offsetY: number } {
  const scale = computeCoverScale(
    naturalWidth,
    naturalHeight,
    containerWidth,
    containerHeight,
  )
  const scaledWidth = naturalWidth * scale
  const scaledHeight = naturalHeight * scale

  return {
    scale,
    offsetX: (containerWidth - scaledWidth) / 2,
    offsetY: (containerHeight - scaledHeight) / 2,
  }
}

function resolveExportMimeType(mimeType?: string): {
  mimeType: string
  quality?: number
} {
  if (mimeType === 'image/png') {
    return { mimeType: 'image/png' }
  }
  if (mimeType === 'image/webp') {
    return { mimeType: 'image/webp', quality: 0.92 }
  }
  return { mimeType: 'image/jpeg', quality: 0.92 }
}

export async function exportCroppedBannerImage(
  image: HTMLImageElement,
  layout: CropLayout,
  fileName = 'banner-cropped.jpg',
  sourceMimeType?: string,
): Promise<File> {
  const canvas = document.createElement('canvas')
  canvas.width = BANNER_CROP_EXPORT_WIDTH
  canvas.height = BANNER_CROP_EXPORT_HEIGHT

  const context = canvas.getContext('2d')
  if (!context) {
    throw new Error('Canvas is not supported in this browser.')
  }

  const sourceX = -layout.offsetX / layout.scale
  const sourceY = -layout.offsetY / layout.scale
  const sourceWidth = layout.containerWidth / layout.scale
  const sourceHeight = layout.containerHeight / layout.scale

  context.drawImage(
    image,
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
    0,
    0,
    BANNER_CROP_EXPORT_WIDTH,
    BANNER_CROP_EXPORT_HEIGHT,
  )

  const { mimeType, quality } = resolveExportMimeType(sourceMimeType)

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) => {
        if (!result) {
          reject(new Error('Failed to export cropped banner image.'))
          return
        }
        resolve(result)
      },
      mimeType,
      quality,
    )
  })

  return new File([blob], fileName, { type: mimeType })
}
