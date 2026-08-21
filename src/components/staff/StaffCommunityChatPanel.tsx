import { ImagePlus, MessagesSquare, Send } from 'lucide-react'
import { useMemo, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { useAuth } from '../../auth/useAuth'
import {
  COMMUNITY_CHAT_IMAGE_ACCEPT,
  isAllowedCommunityChatImageFile,
} from '../../constants/communityChat'
import {
  useSendCommunityChatImage,
  useSendCommunityChatMessage,
} from '../../data/hooks/useCommunityChat'
import { useCommunityChatMessagesInfinite } from '../../data/hooks/useCommunityChatMessageThread'
import { useStaffCommunityChatSession } from '../../data/hooks/useStaffCommunityChatSession'
import { sendCommunityChatHubMessage } from '../../lib/communityChatHub'
import { useNotification } from '../../contexts/NotificationContext'
import { useTranslation } from '../../contexts/LanguageContext'
import { resolveTranslatedApiError } from '../../utils/resolveTranslatedApiError'
import {
  ensureCommunityChatHubSessionJoined,
  getCommunityChatHubConnection,
} from '../header-messages/communityChatRealtime'
import HeaderMessageChatBubbleMenu from '../header-messages/HeaderMessageChatBubbleMenu'
import { useCommunityChatDeleteMessage } from '../header-messages/useCommunityChatDeleteMessage'
import { useCommunityChatHubSendErrorToast } from '../header-messages/useCommunityChatHubSendErrorToast'
import { useCommunityChatSessionOpen } from '../header-messages/useCommunityChatSessionOpen'
import { useCommunityChatThreadScroll } from '../header-messages/useCommunityChatThreadScroll'
import {
  mapCommunityChatMessageToThreadMessage,
  sortThreadMessagesForDisplay,
} from '../header-messages/headerMessagesMappers'
import { useCommunityChatRealtime } from '../header-messages/useCommunityChatRealtime'
import { formatHeaderMessageChatTime } from '../header-messages/headerMessagesFormatters'
import {
  HEADER_MESSAGES_CHAT_I18N,
  HeaderChatMessageDirection,
  type HeaderChatThreadMessage,
} from '../header-messages/headerMessagesConstants'
import { getStaffChatDisplayName, type StaffChatMemberLike } from './staffCommunityChatUtils'
import '../header-messages/header-messages.css'

interface StaffCommunityChatPanelProps {
  staffMember: StaffChatMemberLike
  enabled?: boolean
  compact?: boolean
}

export default function StaffCommunityChatPanel({
  staffMember,
  enabled = true,
  compact = false,
}: StaffCommunityChatPanelProps) {
  const { t, currentLanguage } = useTranslation()
  const { showToast } = useNotification()
  const { session } = useAuth()
  const currentUserProfileId = session?.id ?? ''
  const threadRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [draft, setDraft] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [menuMessageId, setMenuMessageId] = useState<string | null>(null)

  useCommunityChatRealtime()

  const {
    chatSessionId,
    chatAvailable,
    isReady,
    isBootstrapping,
    bootstrapError,
    unavailableReason,
    sessionsError,
  } = useStaffCommunityChatSession(staffMember, { enabled })

  const {
    messages: rawMessages,
    isLoading: isMessagesLoading,
    isError: isMessagesError,
    hasOlderMessages,
    isFetchingOlderMessages,
    fetchOlderMessages,
  } = useCommunityChatMessagesInfinite(chatSessionId, {
    enabled: enabled && isReady && Boolean(chatSessionId),
  })

  const sendMessageMutation = useSendCommunityChatMessage(chatSessionId ?? '')
  const sendImageMutation = useSendCommunityChatImage(chatSessionId ?? '')
  const { deletingMessageId, deleteMessage } = useCommunityChatDeleteMessage({
    sessionId: chatSessionId,
    onDeleted: () => setMenuMessageId(null),
  })

  useCommunityChatSessionOpen(chatSessionId, enabled && isReady && Boolean(chatSessionId))
  useCommunityChatHubSendErrorToast({ fallbackErrorKey: 'staff_detail.chat_send_error' })

  const chatTk = HEADER_MESSAGES_CHAT_I18N

  const messages = useMemo(
    () => sortThreadMessagesForDisplay(
      rawMessages.map((message) => (
        mapCommunityChatMessageToThreadMessage(message, currentUserProfileId)
      )),
    ),
    [currentUserProfileId, rawMessages],
  )

  const { handleThreadScroll } = useCommunityChatThreadScroll(threadRef, {
    enabled: enabled && isReady && Boolean(chatSessionId),
    threadKey: chatSessionId,
    messageCount: messages.length,
    hasOlderMessages,
    isFetchingOlderMessages,
    isInitialLoading: isMessagesLoading,
    onLoadOlder: fetchOlderMessages,
  })


  const handleSend = async (event?: FormEvent) => {
    event?.preventDefault()
    const text = draft.trim()
    if (!text || !chatSessionId || isSending) return

    setIsSending(true)
    try {
      await ensureCommunityChatHubSessionJoined(chatSessionId)
      const connection = await getCommunityChatHubConnection()
      if (connection?.state === 'Connected') {
        await sendCommunityChatHubMessage(connection, { sessionId: chatSessionId, content: text })
      } else {
        await sendMessageMutation.mutateAsync({ content: text })
      }
      setDraft('')
    } catch (error) {
      showToast(
        resolveTranslatedApiError(t, error, 'staff_detail.chat_send_error'),
        'error',
      )
    } finally {
      setIsSending(false)
    }
  }

  const handleImagePick = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file || !chatSessionId || isSending) return
    if (!isAllowedCommunityChatImageFile(file)) {
      showToast(t(`${chatTk}.imageInvalid`), 'error')
      return
    }

    setIsSending(true)
    try {
      await sendImageMutation.mutateAsync(file)
    } catch (error) {
      showToast(
        resolveTranslatedApiError(t, error, 'staff_detail.chat_send_error'),
        'error',
      )
    } finally {
      setIsSending(false)
    }
  }

  const renderMessage = (message: HeaderChatThreadMessage) => {
    const isOutgoing = message.direction === HeaderChatMessageDirection.Outgoing
    const bodyText = message.bodyText ?? ''
    const isImage = Boolean(message.imageUrl)

    return (
      <div
        key={message.id}
        className={`header-message-chat-row${isOutgoing ? ' is-outgoing' : ' is-incoming'}`}
      >
        {!isOutgoing ? (
          <span className="header-message-chat-row-avatar" aria-hidden="true">
            {getStaffChatDisplayName(staffMember).slice(0, 2).toUpperCase()}
          </span>
        ) : null}
        {isOutgoing ? (
          <HeaderMessageChatBubbleMenu
            open={menuMessageId === message.id}
            onOpenChange={(open) => setMenuMessageId(open ? message.id : null)}
            disabled={Boolean(deletingMessageId) || isSending}
            menuLabel={t(`${chatTk}.messageMenu`)}
            deleteLabel={t(`${chatTk}.delete`)}
            deletingLabel={t(`${chatTk}.deleting`)}
            isDeleting={deletingMessageId === message.id}
            onDelete={() => void deleteMessage(message)}
          />
        ) : null}
        <div
          className={[
            'header-message-chat-bubble',
            isOutgoing ? 'is-outgoing' : 'is-incoming',
            isImage ? 'is-image' : '',
          ].filter(Boolean).join(' ')}
        >
          {isImage ? (
            <img
              src={message.imageUrl}
              alt={t('staff_detail.chat_image_alt')}
              className="header-message-chat-image max-h-48 w-full object-cover"
            />
          ) : (
            <p className="header-message-chat-bubble-text">{bodyText}</p>
          )}
          <span className="header-message-chat-bubble-meta">
            {formatHeaderMessageChatTime(message.sentAt, currentLanguage)}
          </span>
        </div>
      </div>
    )
  }

  if (!chatAvailable) {
    return (
      <div className="rounded-xl border border-nexoraBorder bg-slate-50 px-4 py-3 text-sm text-nexoraMuted">
        {t('staff_detail.chat_unavailable')}
      </div>
    )
  }

  if (sessionsError) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700" role="alert">
        {t('staff_detail.chat_load_error')}
      </div>
    )
  }

  if (unavailableReason === 'no_user_profile' && !isBootstrapping && !isReady) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        {t('staff_detail.chat_no_user_profile')}
      </div>
    )
  }

  if (bootstrapError) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700" role="alert">
        {resolveTranslatedApiError(t, bootstrapError, 'staff_detail.chat_start_error')}
      </div>
    )
  }

  return (
    <div className={`nexora-card overflow-hidden shadow-sm${compact ? '' : ' p-0'}`}>
      <div className="flex items-center gap-2 border-b border-nexoraBorder px-4 py-3">
        <MessagesSquare className="h-4 w-4 text-nexoraBrand" aria-hidden="true" />
        <div>
          <h2 className="text-sm font-extrabold text-nexoraText">{t('staff_detail.chat_title')}</h2>
          <p className="text-xs text-nexoraMuted">
            {t('staff_detail.chat_subtitle', { name: getStaffChatDisplayName(staffMember) })}
          </p>
        </div>
      </div>

      <div
        ref={threadRef}
        className={`header-message-chat-thread bg-nexoraCanvas/40 px-3 py-3${compact ? ' max-h-72' : ' max-h-[28rem]'}`}
        aria-busy={isBootstrapping || isMessagesLoading || isFetchingOlderMessages}
        onScroll={handleThreadScroll}
      >
        {isBootstrapping || isMessagesLoading ? (
          <div className="flex h-32 items-center justify-center text-sm text-nexoraMuted">
            {t('staff_detail.chat_loading')}
          </div>
        ) : isMessagesError ? (
          <div className="text-sm text-rose-600" role="alert">
            {t('staff_detail.chat_load_error')}
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-32 flex-col items-center justify-center gap-1 text-center text-sm text-nexoraMuted">
            <p>{t('staff_detail.chat_empty_title')}</p>
            <p className="text-xs">{t('staff_detail.chat_empty_subtitle')}</p>
          </div>
        ) : (
          <>
            {isFetchingOlderMessages ? (
              <div className="header-message-chat-load-older" role="status">
                {t(`${chatTk}.loadingOlder`)}
              </div>
            ) : null}
            <div className="header-message-chat-thread-list space-y-2">
              {messages.map(renderMessage)}
            </div>
          </>
        )}
      </div>

      <form
        className="flex items-center gap-2 border-t border-nexoraBorder bg-white px-3 py-3"
        onSubmit={handleSend}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={COMMUNITY_CHAT_IMAGE_ACCEPT}
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
          onChange={handleImagePick}
        />
        <button
          type="button"
          className="header-message-chat-attach shrink-0"
          aria-label={t('staff_detail.chat_attach_image')}
          disabled={!isReady || isSending}
          onClick={() => fileInputRef.current?.click()}
        >
          <ImagePlus className="h-5 w-5" aria-hidden="true" />
        </button>
        <input
          type="text"
          className="header-message-chat-input min-w-0 flex-1"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder={t('staff_detail.chat_input_placeholder')}
          disabled={!isReady || isSending}
        />
        <button
          type="submit"
          className="header-message-chat-send shrink-0"
          aria-label={t('staff_detail.chat_send')}
          disabled={!draft.trim() || !isReady || isSending}
        >
          <Send className="h-4 w-4" aria-hidden="true" />
        </button>
      </form>
    </div>
  )
}
