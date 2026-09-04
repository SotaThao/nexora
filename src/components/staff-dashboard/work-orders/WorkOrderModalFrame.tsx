import { useEffect, type ReactNode } from 'react'
import { X } from 'lucide-react'
import useBodyScrollLock from '../../../hooks/useBodyScrollLock'
import useVisualViewportRect from '../../../hooks/useVisualViewportRect'
import { WORK_ORDER_KEYBOARD, WORK_ORDERS_LAYOUT_CLASS } from './constants'

interface WorkOrderModalFrameProps {
  titleId: string
  title: string
  subtitle?: string
  closeLabel: string
  wide?: boolean
  onClose: () => void
  children: ReactNode
  footer: ReactNode
}

export default function WorkOrderModalFrame({
  titleId,
  title,
  subtitle,
  closeLabel,
  wide = false,
  onClose,
  children,
  footer,
}: WorkOrderModalFrameProps) {
  const viewport = useVisualViewportRect()
  useBodyScrollLock(true)

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== WORK_ORDER_KEYBOARD.escape) return
      onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  const overlayStyle = viewport
    ? { height: `${viewport.height}px`, transform: `translateY(${viewport.offsetTop}px)` }
    : undefined
  const cardStyle = viewport ? { maxHeight: '100%' } : undefined

  return (
    <div
      style={overlayStyle}
      className={WORK_ORDERS_LAYOUT_CLASS.modalOverlay}
      onClick={onClose}
    >
      <div
        style={cardStyle}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={wide ? WORK_ORDERS_LAYOUT_CLASS.modalCardWide : WORK_ORDERS_LAYOUT_CLASS.modalCard}
        onClick={(event) => event.stopPropagation()}
      >
        <div className={WORK_ORDERS_LAYOUT_CLASS.modalHeader}>
          <div className={WORK_ORDERS_LAYOUT_CLASS.grow}>
            <h2 id={titleId} className={WORK_ORDERS_LAYOUT_CLASS.modalTitle}>
              {title}
            </h2>
            {subtitle ? (
              <p className={WORK_ORDERS_LAYOUT_CLASS.modalSubtitle}>{subtitle}</p>
            ) : null}
          </div>
          <button
            type="button"
            className={WORK_ORDERS_LAYOUT_CLASS.modalClose}
            aria-label={closeLabel}
            onClick={onClose}
          >
            <X className={WORK_ORDERS_LAYOUT_CLASS.iconMd} aria-hidden="true" />
          </button>
        </div>
        <div className={WORK_ORDERS_LAYOUT_CLASS.modalBody}>{children}</div>
        <div className={WORK_ORDERS_LAYOUT_CLASS.modalFooter}>{footer}</div>
      </div>
    </div>
  )
}
