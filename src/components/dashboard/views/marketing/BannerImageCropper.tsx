import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react'
import {
  BANNER_ASPECT_RATIO,
  clampCropOffset,
  createCenteredCropOffset,
  exportCroppedBannerImage,
  type CropLayout,
} from './bannerImageCrop'

export interface BannerImageCropperHandle {
  exportCroppedFile: (fileName?: string, mimeType?: string) => Promise<File>
}

export interface BannerImageCropperProps {
  imageUrl: string
  fileName?: string
  mimeType?: string
  className?: string
}

type DragState = {
  pointerId: number
  startX: number
  startY: number
  originX: number
  originY: number
}

type LayoutMetrics = Omit<CropLayout, 'offsetX' | 'offsetY'>

export const BannerImageCropper = forwardRef<
  BannerImageCropperHandle,
  BannerImageCropperProps
>(function BannerImageCropper(
  { imageUrl, fileName, mimeType, className = '' },
  ref,
) {
  const containerRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const layoutRef = useRef<CropLayout | null>(null)
  const liveOffsetRef = useRef({ x: 0, y: 0 })
  const dragStateRef = useRef<DragState | null>(null)
  const isDraggingRef = useRef(false)

  const [layoutMetrics, setLayoutMetrics] = useState<LayoutMetrics | null>(null)
  const [isReady, setIsReady] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  const applyImageTransform = useCallback((offsetX: number, offsetY: number) => {
    const image = imageRef.current
    if (!image) return
    image.style.transform = `translate3d(${offsetX}px, ${offsetY}px, 0)`
  }, [])

  const syncLayout = useCallback(
    (resetOffset: boolean) => {
      if (isDraggingRef.current) return

      const container = containerRef.current
      const image = imageRef.current
      if (!container || !image || !image.naturalWidth || !image.naturalHeight) {
        return
      }

      const containerWidth = container.clientWidth
      const containerHeight = container.clientHeight
      const { scale, offsetX, offsetY } = createCenteredCropOffset(
        image.naturalWidth,
        image.naturalHeight,
        containerWidth,
        containerHeight,
      )

      const metrics: LayoutMetrics = {
        scale,
        containerWidth,
        containerHeight,
        naturalWidth: image.naturalWidth,
        naturalHeight: image.naturalHeight,
      }

      const scaledWidth = metrics.naturalWidth * metrics.scale
      const scaledHeight = metrics.naturalHeight * metrics.scale

      const nextOffset = resetOffset
        ? { x: offsetX, y: offsetY }
        : clampCropOffset(
            liveOffsetRef.current.x,
            liveOffsetRef.current.y,
            scaledWidth,
            scaledHeight,
            metrics.containerWidth,
            metrics.containerHeight,
          )

      liveOffsetRef.current = nextOffset
      applyImageTransform(nextOffset.x, nextOffset.y)

      layoutRef.current = {
        ...metrics,
        offsetX: nextOffset.x,
        offsetY: nextOffset.y,
      }

      setLayoutMetrics(metrics)
      setIsReady(true)
    },
    [applyImageTransform],
  )

  useEffect(() => {
    setIsReady(false)
    setLayoutMetrics(null)
    layoutRef.current = null
    liveOffsetRef.current = { x: 0, y: 0 }
  }, [imageUrl])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const observer = new ResizeObserver(() => {
      syncLayout(false)
    })

    observer.observe(container)
    return () => observer.disconnect()
  }, [syncLayout])

  useImperativeHandle(
    ref,
    () => ({
      exportCroppedFile: async (exportFileName, exportMimeType) => {
        const image = imageRef.current
        const metrics = layoutRef.current
        if (!image || !metrics) {
          throw new Error('Banner crop preview is not ready.')
        }

        const currentLayout: CropLayout = {
          ...metrics,
          offsetX: liveOffsetRef.current.x,
          offsetY: liveOffsetRef.current.y,
        }
        layoutRef.current = currentLayout

        return exportCroppedBannerImage(
          image,
          currentLayout,
          exportFileName ?? fileName ?? 'banner-cropped.jpg',
          exportMimeType ?? mimeType,
        )
      },
    }),
    [fileName, mimeType],
  )

  const commitLiveOffset = useCallback(
    (offsetX: number, offsetY: number) => {
      const metrics = layoutRef.current
      if (!metrics) return

      const scaledWidth = metrics.naturalWidth * metrics.scale
      const scaledHeight = metrics.naturalHeight * metrics.scale
      const clamped = clampCropOffset(
        offsetX,
        offsetY,
        scaledWidth,
        scaledHeight,
        metrics.containerWidth,
        metrics.containerHeight,
      )

      liveOffsetRef.current = clamped
      applyImageTransform(clamped.x, clamped.y)
      layoutRef.current = {
        ...metrics,
        offsetX: clamped.x,
        offsetY: clamped.y,
      }
    },
    [applyImageTransform],
  )

  const endDrag = useCallback(() => {
    const dragState = dragStateRef.current
    if (!dragState) return

    const container = containerRef.current
    if (container?.hasPointerCapture(dragState.pointerId)) {
      container.releasePointerCapture(dragState.pointerId)
    }

    dragStateRef.current = null
    isDraggingRef.current = false
    setIsDragging(false)
  }, [])

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    const metrics = layoutRef.current
    if (!metrics || event.button !== 0) return

    event.preventDefault()
    event.stopPropagation()

    const container = containerRef.current
    if (!container) return

    container.setPointerCapture(event.pointerId)
    dragStateRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: liveOffsetRef.current.x,
      originY: liveOffsetRef.current.y,
    }
    isDraggingRef.current = true
    setIsDragging(true)
  }

  useEffect(() => {
    if (!isDragging) return

    const handlePointerMove = (event: PointerEvent) => {
      const dragState = dragStateRef.current
      const metrics = layoutRef.current
      if (!dragState || !metrics || dragState.pointerId !== event.pointerId) {
        return
      }

      event.preventDefault()

      const deltaX = event.clientX - dragState.startX
      const deltaY = event.clientY - dragState.startY
      const scaledWidth = metrics.naturalWidth * metrics.scale
      const scaledHeight = metrics.naturalHeight * metrics.scale
      const clamped = clampCropOffset(
        dragState.originX + deltaX,
        dragState.originY + deltaY,
        scaledWidth,
        scaledHeight,
        metrics.containerWidth,
        metrics.containerHeight,
      )

      liveOffsetRef.current = clamped
      applyImageTransform(clamped.x, clamped.y)
    }

    const handlePointerEnd = (event: PointerEvent) => {
      const dragState = dragStateRef.current
      const metrics = layoutRef.current
      if (!dragState || !metrics || dragState.pointerId !== event.pointerId) {
        return
      }

      const deltaX = event.clientX - dragState.startX
      const deltaY = event.clientY - dragState.startY
      commitLiveOffset(
        dragState.originX + deltaX,
        dragState.originY + deltaY,
      )
      endDrag()
    }

    document.addEventListener('pointermove', handlePointerMove, {
      passive: false,
    })
    document.addEventListener('pointerup', handlePointerEnd)
    document.addEventListener('pointercancel', handlePointerEnd)

    return () => {
      document.removeEventListener('pointermove', handlePointerMove)
      document.removeEventListener('pointerup', handlePointerEnd)
      document.removeEventListener('pointercancel', handlePointerEnd)
    }
  }, [applyImageTransform, commitLiveOffset, endDrag, isDragging])

  const handleLostPointerCapture = (event: React.PointerEvent<HTMLDivElement>) => {
    const dragState = dragStateRef.current
    if (!dragState || dragState.pointerId !== event.pointerId) return
    endDrag()
  }

  const scaledWidth = layoutMetrics
    ? layoutMetrics.naturalWidth * layoutMetrics.scale
    : 0
  const scaledHeight = layoutMetrics
    ? layoutMetrics.naturalHeight * layoutMetrics.scale
    : 0

  const containerCursor = isDragging ? 'cursor-grabbing' : 'cursor-grab'
  const imageVisibility = !isReady ? 'opacity-0' : ''

  return (
    <div className={`space-y-2 ${className}`.trim()}>
      <div
        ref={containerRef}
        className={`relative aspect-[3/1] overflow-hidden rounded-2xl border border-slate-200 bg-slate-900 touch-none select-none ${containerCursor}`}
        onPointerDown={handlePointerDown}
        onLostPointerCapture={handleLostPointerCapture}
      >
        <img
          ref={imageRef}
          src={imageUrl}
          alt="Banner crop preview"
          draggable={false}
          onLoad={() => syncLayout(true)}
          className={`absolute left-0 top-0 max-w-none pointer-events-none will-change-transform ${imageVisibility}`}
          style={
            layoutMetrics
              ? {
                  width: scaledWidth,
                  height: scaledHeight,
                }
              : undefined
          }
        />

        <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/20" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/50 to-transparent px-3 py-2">
          <p className="text-[10px] font-semibold text-white/90">
            Drag to reposition · {BANNER_ASPECT_RATIO}:1 ratio crop
          </p>
        </div>
      </div>
    </div>
  )
})

export default BannerImageCropper
