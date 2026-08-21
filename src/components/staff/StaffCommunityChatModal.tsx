import { Loader2 } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useAuth } from '../../auth/useAuth'
import { CommunityChatType } from '../../constants/communityChat'
import { useStaffCommunityChatSession } from '../../data/hooks/useStaffCommunityChatSession'
import { useNotification } from '../../contexts/NotificationContext'
import { useTranslation } from '../../contexts/LanguageContext'
import { resolveTranslatedApiError } from '../../utils/resolveTranslatedApiError'
import HeaderMessageChatWindow from '../header-messages/HeaderMessageChatWindow'
import { getHeaderMessageContactInitials } from '../header-messages/headerMessagesMappers'
import { useCommunityChatRealtime } from '../header-messages/useCommunityChatRealtime'
import { useMobileMessengerScrollLock } from '../header-messages/useMobileMessengerScrollLock'
import {
  HEADER_MESSAGE_DESKTOP_EDGE_INSET_PX,
  HeaderMessageChatLayout,
  HeaderMessageListPreviewKey,
  type HeaderMessageConversation,
} from '../header-messages/headerMessagesConstants'
import {
  getStaffChatDisplayName,
  type StaffChatMemberLike,
} from './staffCommunityChatUtils'

interface StaffCommunityChatModalProps {
  staffMember: StaffChatMemberLike
  onClose: () => void
}

function useIsDesktopMessengerViewport() {
  const [isDesktop, setIsDesktop] = useState(() => (
    typeof window !== 'undefined' ? window.matchMedia('(min-width: 640px)').matches : true
  ))

  useEffect(() => {
    const media = window.matchMedia('(min-width: 640px)')
    const onChange = () => setIsDesktop(media.matches)
    onChange()
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [])

  return isDesktop
}

export default function StaffCommunityChatModal({
  staffMember,
  onClose,
}: StaffCommunityChatModalProps) {
  const { t } = useTranslation()
  const { showToast } = useNotification()
  const { session } = useAuth()
  const currentUserProfileId = session?.id ?? ''
  const isDesktop = useIsDesktopMessengerViewport()
  const [minimized, setMinimized] = useState(false)
  const closedForErrorRef = useRef(false)

  useCommunityChatRealtime()
  useMobileMessengerScrollLock(!isDesktop)

  const {
    chatSessionId,
    isReady,
    isBootstrapping,
    bootstrapError,
    unavailableReason,
    sessionsError,
  } = useStaffCommunityChatSession(staffMember)

  const displayName = getStaffChatDisplayName(staffMember)

  useEffect(() => {
    if (closedForErrorRef.current) return

    if (sessionsError) {
      closedForErrorRef.current = true
      showToast(t('staff_detail.chat_load_error'), 'error')
      onClose()
      return
    }

    if (unavailableReason === 'no_user_profile' && !isBootstrapping && !isReady) {
      closedForErrorRef.current = true
      showToast(t('staff_detail.chat_no_user_profile'), 'warning')
      onClose()
      return
    }

    if (unavailableReason === 'ineligible' && !isBootstrapping && !isReady) {
      closedForErrorRef.current = true
      showToast(t('staff_detail.chat_unavailable'), 'warning')
      onClose()
      return
    }

    if (bootstrapError) {
      closedForErrorRef.current = true
      showToast(
        resolveTranslatedApiError(t, bootstrapError, 'staff_detail.chat_start_error'),
        'error',
      )
      onClose()
    }
  }, [
    bootstrapError,
    isBootstrapping,
    isReady,
    onClose,
    sessionsError,
    showToast,
    t,
    unavailableReason,
  ])

  const conversation = useMemo<HeaderMessageConversation | null>(() => {
    if (!chatSessionId) return null
    return {
      id: chatSessionId,
      name: displayName,
      initials: getHeaderMessageContactInitials(displayName),
      chatType: CommunityChatType.OneOnOne,
      previewKey: HeaderMessageListPreviewKey.Desktop,
      updatedAt: '',
      unreadCount: 0,
    }
  }, [chatSessionId, displayName])

  if (!conversation) {
    return createPortal(
      <div
        className="fixed bottom-4 z-[200] flex items-center gap-2 rounded-2xl border border-nexoraBorder bg-white px-4 py-3 text-sm font-semibold text-nexoraText shadow-xl"
        style={{ right: HEADER_MESSAGE_DESKTOP_EDGE_INSET_PX }}
        role="status"
        aria-live="polite"
      >
        <Loader2 className="h-4 w-4 animate-spin text-nexoraBrand" aria-hidden="true" />
        <span>{t('staff_detail.chat_loading')}</span>
      </div>,
      document.body,
    )
  }

  return (
    <HeaderMessageChatWindow
      key={conversation.id}
      conversation={conversation}
      currentUserProfileId={currentUserProfileId}
      layout={isDesktop ? HeaderMessageChatLayout.Floating : HeaderMessageChatLayout.Fullscreen}
      minimized={isDesktop ? minimized : false}
      stackRightPx={0}
      stackIndex={0}
      isFocused
      onToggleMinimize={() => setMinimized((current) => !current)}
      onClose={onClose}
      onBack={onClose}
    />
  )
}
