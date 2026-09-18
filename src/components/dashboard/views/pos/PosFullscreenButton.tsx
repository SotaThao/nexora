import { useEffect, useId, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { Maximize2, Minimize2 } from 'lucide-react'
import { useTranslation } from '../../../../contexts/LanguageContext'
import { storage } from '../../../../utils/storage'

const POSITION_KEY = 'pos_front_desk_fullscreen_button_position'
const BUTTON_SIZE = 48
const DRAG_THRESHOLD = 6
const K = 'components.dashboard.views.pos.PosFrontDeskView'
type Position = { x: number; y: number }
const clamp = (value: number) => Math.min(1, Math.max(0, value))

function readPosition(): Position {
  try {
    const saved = JSON.parse(storage.getItem(POSITION_KEY) ?? 'null')
    if (saved && typeof saved.x === 'number' && Number.isFinite(saved.x)
      && typeof saved.y === 'number' && Number.isFinite(saved.y)) {
      return { x: clamp(saved.x), y: clamp(saved.y) }
    }
  } catch { /* Position persistence is optional in private/embedded browsers. */ }
  return { x: 1, y: 0.68 }
}

function savePosition(position: Position) {
  try { storage.setItem(POSITION_KEY, JSON.stringify(position)) } catch { /* Keep dragging usable. */ }
}

function readViewport() {
  const viewport = window.visualViewport
  return {
    width: viewport?.width ?? window.innerWidth,
    height: viewport?.height ?? window.innerHeight,
    left: viewport?.offsetLeft ?? 0,
    top: viewport?.offsetTop ?? 0,
  }
}

export default function PosFullscreenButton({ isFullscreen, onToggle }: {
  isFullscreen: boolean
  onToggle: () => void
}) {
  const { t } = useTranslation()
  const descriptionId = useId()
  const [position, setPosition] = useState(readPosition)
  const positionRef = useRef(position)
  const [viewport, setViewport] = useState(readViewport)
  const [isDragging, setIsDragging] = useState(false)
  const suppressClick = useRef(false)
  const drag = useRef<{
    pointerId: number; clientX: number; clientY: number; left: number; top: number; moved: boolean
  } | null>(null)

  useEffect(() => {
    const update = () => setViewport(readViewport())
    window.addEventListener('resize', update)
    window.visualViewport?.addEventListener('resize', update)
    window.visualViewport?.addEventListener('scroll', update)
    return () => {
      window.removeEventListener('resize', update)
      window.visualViewport?.removeEventListener('resize', update)
      window.visualViewport?.removeEventListener('scroll', update)
    }
  }, [])

  const moveTo = (left: number, top: number) => {
    const currentViewport = readViewport()
    const next = {
      x: clamp((left - currentViewport.left) / Math.max(1, currentViewport.width - BUTTON_SIZE)),
      y: clamp((top - currentViewport.top) / Math.max(1, currentViewport.height - BUTTON_SIZE)),
    }
    positionRef.current = next
    setPosition(next)
    return next
  }

  const finishDrag = (event: ReactPointerEvent<HTMLButtonElement>, cancelled = false) => {
    const current = drag.current
    if (!current || current.pointerId !== event.pointerId) return
    drag.current = null
    suppressClick.current = current.moved || cancelled
    if (current.moved) savePosition(positionRef.current)
    setIsDragging(false)
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
  }

  const label = t(`${K}.${isFullscreen ? 'exitFullscreen' : 'enterFullscreen'}`)
  const Icon = isFullscreen ? Minimize2 : Maximize2
  const bottomClearance = !isFullscreen && viewport.width < 1024 ? 68 : 0

  return (
    <>
      {/* Keep the floating control above dashboard headers (40), below dialogs (50+). */}
      <button
        type="button"
        className="pos-fullscreen-control fixed z-[45] flex h-12 w-12 select-none items-center justify-center rounded-full border border-nexoraBrand/25 bg-nexoraSurface/85 text-nexoraBrandDark shadow-lg backdrop-blur-md"
        data-dragging={isDragging || undefined}
        aria-label={label}
        aria-pressed={isFullscreen}
        aria-describedby={descriptionId}
        title={label}
        style={{
          left: `clamp(max(12px, var(--app-safe-area-left)), ${viewport.left + position.x * Math.max(0, viewport.width - BUTTON_SIZE)}px, calc(100vw - 60px - var(--app-safe-area-right)))`,
          top: `clamp(max(12px, var(--app-safe-area-top)), ${viewport.top + position.y * Math.max(0, viewport.height - BUTTON_SIZE)}px, calc(100dvh - ${60 + bottomClearance}px - var(--app-safe-area-bottom)))`,
          touchAction: 'none',
          cursor: isDragging ? 'grabbing' : 'grab',
          translate: 'none',
          scale: '1',
        }}
        onPointerDown={(event) => {
          if (event.button !== 0 || event.isPrimary === false || drag.current) return
          const rect = event.currentTarget.getBoundingClientRect()
          suppressClick.current = false
          drag.current = {
            pointerId: event.pointerId, clientX: event.clientX, clientY: event.clientY,
            left: rect.left, top: rect.top, moved: false,
          }
          event.currentTarget.setPointerCapture?.(event.pointerId)
        }}
        onPointerMove={(event) => {
          const current = drag.current
          if (!current || current.pointerId !== event.pointerId) return
          const dx = event.clientX - current.clientX
          const dy = event.clientY - current.clientY
          if (!current.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD) return
          current.moved = true
          setIsDragging(true)
          moveTo(current.left + dx, current.top + dy)
        }}
        onPointerUp={(event) => finishDrag(event)}
        onPointerCancel={(event) => finishDrag(event, true)}
        onLostPointerCapture={(event) => finishDrag(event, true)}
        onClick={(event) => {
          if (suppressClick.current && event.detail !== 0) {
            suppressClick.current = false
            event.preventDefault()
            return
          }
          suppressClick.current = false
          onToggle()
        }}
        onKeyDown={(event) => {
          const offsets: Record<string, [number, number]> = {
            ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1],
          }
          const offset = offsets[event.key]
          if (!offset) return
          event.preventDefault()
          const rect = event.currentTarget.getBoundingClientRect()
          const step = event.shiftKey ? 40 : 10
          savePosition(moveTo(rect.left + offset[0] * step, rect.top + offset[1] * step))
        }}
      >
        <Icon className="h-5 w-5" aria-hidden="true" />
      </button>
      <span id={descriptionId} className="sr-only">{t(`${K}.moveFullscreenButton`)}</span>
    </>
  )
}
