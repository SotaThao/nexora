import { MoreVertical, Trash2 } from 'lucide-react'
import { useEffect, useId, useLayoutEffect, useRef, useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import {
  HEADER_MESSAGE_CHAT_MENU_GAP_PX,
  HEADER_MESSAGE_CHAT_MENU_OPEN_ABOVE_MIN_TOP_PX,
  HEADER_MESSAGE_CHAT_MENU_PANEL_WIDTH_PX,
  HEADER_MESSAGE_CHAT_MENU_Z_INDEX,
} from './headerMessagesConstants'

export interface HeaderMessageChatBubbleMenuProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  disabled?: boolean
  menuLabel: string
  deleteLabel: string
  deletingLabel: string
  isDeleting?: boolean
  onDelete: () => void
}

function buildMenuPanelStyle(triggerRect: DOMRect): CSSProperties {
  const preferAlignEnd = triggerRect.left > window.innerWidth / 2
  const left = preferAlignEnd
    ? Math.max(8, triggerRect.right - HEADER_MESSAGE_CHAT_MENU_PANEL_WIDTH_PX)
    : Math.min(
      window.innerWidth - HEADER_MESSAGE_CHAT_MENU_PANEL_WIDTH_PX - 8,
      triggerRect.left,
    )
  const openAbove = triggerRect.top > HEADER_MESSAGE_CHAT_MENU_OPEN_ABOVE_MIN_TOP_PX

  return {
    position: 'fixed',
    top: openAbove ? undefined : triggerRect.bottom + HEADER_MESSAGE_CHAT_MENU_GAP_PX,
    bottom: openAbove
      ? window.innerHeight - triggerRect.top + HEADER_MESSAGE_CHAT_MENU_GAP_PX
      : undefined,
    left,
    width: HEADER_MESSAGE_CHAT_MENU_PANEL_WIDTH_PX,
    zIndex: HEADER_MESSAGE_CHAT_MENU_Z_INDEX,
  }
}

export default function HeaderMessageChatBubbleMenu({
  open,
  onOpenChange,
  disabled = false,
  menuLabel,
  deleteLabel,
  deletingLabel,
  isDeleting = false,
  onDelete,
}: HeaderMessageChatBubbleMenuProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const menuId = useId()
  const [panelStyle, setPanelStyle] = useState<CSSProperties | null>(null)

  useLayoutEffect(() => {
    if (!open || !rootRef.current) {
      setPanelStyle(null)
      return
    }
    setPanelStyle(buildMenuPanelStyle(rootRef.current.getBoundingClientRect()))
  }, [open])

  useEffect(() => {
    if (!open) return undefined

    function handlePointerDown(event: MouseEvent | TouchEvent) {
      const target = event.target as Node | null
      if (
        rootRef.current?.contains(target)
        || panelRef.current?.contains(target)
      ) {
        return
      }
      onOpenChange(false)
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') onOpenChange(false)
    }

    function handleReposition() {
      if (!rootRef.current) return
      setPanelStyle(buildMenuPanelStyle(rootRef.current.getBoundingClientRect()))
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('touchstart', handlePointerDown)
    document.addEventListener('keydown', handleEscape)
    window.addEventListener('resize', handleReposition)
    window.addEventListener('scroll', handleReposition, true)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('touchstart', handlePointerDown)
      document.removeEventListener('keydown', handleEscape)
      window.removeEventListener('resize', handleReposition)
      window.removeEventListener('scroll', handleReposition, true)
    }
  }, [onOpenChange, open])

  return (
    <div ref={rootRef} className={`header-message-chat-menu${open ? ' is-open' : ''}`}>
      <button
        type="button"
        className="header-message-chat-menu-trigger"
        aria-label={menuLabel}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        disabled={disabled}
        onClick={() => onOpenChange(!open)}
      >
        <MoreVertical className="h-4 w-4" aria-hidden="true" />
      </button>

      {open && panelStyle
        ? createPortal(
          <div
            ref={panelRef}
            id={menuId}
            className="header-message-chat-menu-panel is-portal"
            role="menu"
            style={panelStyle}
          >
            <button
              type="button"
              role="menuitem"
              className="header-message-chat-menu-item is-danger"
              disabled={disabled || isDeleting}
              onClick={() => {
                onOpenChange(false)
                onDelete()
              }}
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{isDeleting ? deletingLabel : deleteLabel}</span>
            </button>
          </div>,
          document.body,
        )
        : null}
    </div>
  )
}
