import { useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '../../auth/useAuth'
import { useStaffCommunityChatSession } from '../../data/hooks/useStaffCommunityChatSession'
import { useNotification } from '../../contexts/NotificationContext'
import { useTranslation } from '../../contexts/LanguageContext'
import HeaderMessageChatWindow from '../header-messages/HeaderMessageChatWindow'
import { useCommunityChatRealtime } from '../header-messages/useCommunityChatRealtime'
import { useMobileMessengerScrollLock } from '../header-messages/useMobileMessengerScrollLock'
import { HeaderMessageChatLayout } from '../header-messages/headerMessagesConstants'
import {
  STAFF_CHAT_CLOSE_TOAST_BY_REASON,
  STAFF_CHAT_DESKTOP_MESSENGER_MEDIA_QUERY,
  StaffChatUnavailableReason,
} from './constants'
import {
  buildStaffChatConversation,
  getStaffChatDisplayName,
  resolveStaffChatWindowKey,
  type StaffChatMemberLike,
} from './staffCommunityChatUtils'

interface StaffCommunityChatModalProps {
  staffMember: StaffChatMemberLike
  onClose: () => void
  /** Desktop floating stack — fullscreen on mobile single-chat. */
  layout?: HeaderMessageChatLayout
  /** Controlled minimize (multi-window stack). Uncontrolled when omitted. */
  minimized?: boolean
  stackRightPx?: number
  stackIndex?: number
  isFocused?: boolean
  onToggleMinimize?: () => void
  onFocus?: () => void
}

function useIsDesktopMessengerViewport() {
  const [isDesktop, setIsDesktop] = useState(() => (
    typeof window !== 'undefined'
      ? window.matchMedia(STAFF_CHAT_DESKTOP_MESSENGER_MEDIA_QUERY).matches
      : true
  ))

  useEffect(() => {
    const media = window.matchMedia(STAFF_CHAT_DESKTOP_MESSENGER_MEDIA_QUERY)
    const onChange = () => setIsDesktop(media.matches)
    onChange()
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [])

  return isDesktop
}

function resolveStaffChatCloseReason(params: {
  sessionsError: boolean
  unavailableReason: StaffChatUnavailableReason | null
  isBootstrapping: boolean
  isReady: boolean
}): 'sessionsError' | StaffChatUnavailableReason | null {
  if (params.sessionsError) return 'sessionsError'
  if (params.isBootstrapping || params.isReady) return null
  if (
    params.unavailableReason === StaffChatUnavailableReason.NoUserProfile
    || params.unavailableReason === StaffChatUnavailableReason.Ineligible
  ) {
    return params.unavailableReason
  }
  return null
}

export default function StaffCommunityChatModal({
  staffMember,
  onClose,
  layout,
  minimized: minimizedProp,
  stackRightPx = 0,
  stackIndex = 0,
  isFocused = true,
  onToggleMinimize,
  onFocus,
}: StaffCommunityChatModalProps) {
  const { t } = useTranslation()
  const { showToast } = useNotification()
  const { session } = useAuth()
  const currentUserProfileId = session?.id ?? ''
  const isDesktopViewport = useIsDesktopMessengerViewport()
  const resolvedLayout = layout
    ?? (isDesktopViewport ? HeaderMessageChatLayout.Floating : HeaderMessageChatLayout.Fullscreen)
  const isFullscreen = resolvedLayout === HeaderMessageChatLayout.Fullscreen
  const [localMinimized, setLocalMinimized] = useState(false)
  const isControlledMinimize = typeof onToggleMinimize === 'function'
  const minimized = isControlledMinimize ? Boolean(minimizedProp) : localMinimized
  const closedForErrorRef = useRef(false)

  useCommunityChatRealtime()
  useMobileMessengerScrollLock(isFullscreen)

  const {
    chatSessionId,
    isReady,
    isBootstrapping,
    ensureSession,
    unavailableReason,
    sessionsError,
  } = useStaffCommunityChatSession(staffMember)

  const displayName = getStaffChatDisplayName(staffMember)
  const windowKey = resolveStaffChatWindowKey(staffMember)

  useEffect(() => {
    if (closedForErrorRef.current) return

    const closeReason = resolveStaffChatCloseReason({
      sessionsError,
      unavailableReason,
      isBootstrapping,
      isReady,
    })
    if (!closeReason) return

    const toast = STAFF_CHAT_CLOSE_TOAST_BY_REASON[closeReason]
    closedForErrorRef.current = true
    showToast(t(toast.messageKey), toast.tone)
    onClose()
  }, [
    isBootstrapping,
    isReady,
    onClose,
    sessionsError,
    showToast,
    t,
    unavailableReason,
  ])

  const conversation = useMemo(() => buildStaffChatConversation({
    chatSessionId,
    windowKey,
    displayName,
  }), [chatSessionId, displayName, windowKey])

  return (
    <HeaderMessageChatWindow
      key={windowKey}
      conversation={conversation}
      currentUserProfileId={currentUserProfileId}
      layout={resolvedLayout}
      minimized={isFullscreen ? false : minimized}
      stackRightPx={stackRightPx}
      stackIndex={stackIndex}
      isFocused={isFocused}
      isConversationLoading={isBootstrapping}
      ensureSessionId={ensureSession}
      onToggleMinimize={() => {
        onFocus?.()
        if (isControlledMinimize) onToggleMinimize?.()
        else setLocalMinimized((current) => !current)
      }}
      onClose={onClose}
      onBack={onClose}
    />
  )
}
