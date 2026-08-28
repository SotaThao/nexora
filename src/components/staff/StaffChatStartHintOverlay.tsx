import { useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Pointer } from 'lucide-react'
import { useTranslation } from '../../contexts/LanguageContext'
import { useIsMobileUI } from '../../hooks/useIsMobileUI'
import { STAFF_CHAT_I18N } from './constants'
import {
  getHintClusterPosition,
  resolveStaffChatStartHintPlacement,
  scrollStaffChatHintIntoView,
  STAFF_CHAT_START_HINT_ACTIVE_CLASS,
  STAFF_CHAT_START_HINT_BELOW_CLASS,
  STAFF_CHAT_START_HINT_CAPTION_CLASS,
  STAFF_CHAT_START_HINT_CLUSTER_CLASS,
  STAFF_CHAT_START_HINT_HAND_CLASS,
  STAFF_CHAT_START_HINT_TARGET_CLASS,
  StaffChatStartHintPlacement,
} from './staffChatStartHintLayout'
import './staffChatStartHint.css'

interface StaffChatStartHintOverlayProps {
  active: boolean
  children: ReactNode
  placement?: StaffChatStartHintPlacement
}

const CLUSTER_CLASS_BY_PLACEMENT: Record<StaffChatStartHintPlacement, string> = {
  [StaffChatStartHintPlacement.Above]: STAFF_CHAT_START_HINT_CLUSTER_CLASS,
  [StaffChatStartHintPlacement.Below]: `${STAFF_CHAT_START_HINT_CLUSTER_CLASS} ${STAFF_CHAT_START_HINT_BELOW_CLASS}`,
}

export default function StaffChatStartHintOverlay({
  active,
  children,
  placement,
}: StaffChatStartHintOverlayProps) {
  const { t } = useTranslation()
  const isMobile = useIsMobileUI()
  const resolvedPlacement = resolveStaffChatStartHintPlacement(placement, isMobile)
  const targetRef = useRef<HTMLSpanElement>(null)
  const [rect, setRect] = useState<DOMRect | null>(null)

  useLayoutEffect(() => {
    if (!active) {
      setRect(null)
      return
    }

    const el = targetRef.current
    if (!el) return

    const updatePosition = () => {
      setRect(el.getBoundingClientRect())
    }

    updatePosition()
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, { passive: true })
    const cancelScroll = scrollStaffChatHintIntoView(el, updatePosition)

    return () => {
      cancelScroll()
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition)
    }
  }, [active])

  const targetClassName = [
    STAFF_CHAT_START_HINT_TARGET_CLASS,
    active ? STAFF_CHAT_START_HINT_ACTIVE_CLASS : '',
  ].filter(Boolean).join(' ')

  return (
    <>
      <span
        ref={targetRef}
        className={targetClassName}
        data-staff-chat-start-hint=""
      >
        {children}
      </span>
      {active && rect
        ? createPortal(
            <div
              className={CLUSTER_CLASS_BY_PLACEMENT[resolvedPlacement]}
              style={getHintClusterPosition(rect, resolvedPlacement)}
              role="status"
            >
              <Pointer className={STAFF_CHAT_START_HINT_HAND_CLASS} aria-hidden="true" />
              <p className={STAFF_CHAT_START_HINT_CAPTION_CLASS}>
                {t(STAFF_CHAT_I18N.startHint)}
              </p>
            </div>,
            document.body,
          )
        : null}
    </>
  )
}
