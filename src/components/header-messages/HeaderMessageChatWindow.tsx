import {
  ArrowLeft,
  Check,
  CheckCheck,
  ImagePlus,
  Lock,
  MessagesSquare,
  Minus,
  Phone,
  Send,
  Sparkles,
  User,
  Video,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type ChangeEvent, type ReactElement } from 'react'
import { createPortal } from 'react-dom'
import {
  CommunityChatType,
  COMMUNITY_CHAT_IMAGE_ACCEPT,
  COMMUNITY_CHAT_MAX_MESSAGE_LENGTH,
  isAllowedCommunityChatImageFile,
  isPendingCommunityChatSessionId,
} from '../../constants/communityChat'
import { useCommunityChatMessagesInfinite } from '../../data/hooks/useCommunityChatMessageThread'
import {
  useSendCommunityChatImage,
  useSendCommunityChatMessage,
} from '../../data/hooks/useCommunityChat'
import { useNotification } from '../../contexts/NotificationContext'
import { useTranslation } from '../../contexts/LanguageContext'
import { resolveTranslatedApiError } from '../../utils/resolveTranslatedApiError'
import {
  HEADER_MESSAGES_CHAT_I18N,
  HEADER_MESSAGES_I18N,
  HEADER_MESSAGE_CHAT_ROOT_ATTR,
  HEADER_MESSAGE_DESKTOP_CHAT_Z_BASE,
  HEADER_MESSAGE_DESKTOP_CHAT_Z_FOCUSED,
  HEADER_MESSAGE_DESKTOP_EDGE_INSET_PX,
  HEADER_MESSAGE_NEW_CHAT_STARTER_KEYS,
  HeaderChatMessageDirection,
  HeaderChatMessageReceiptStatus,
  HeaderMessageChatLayout,
  type HeaderChatMessageReplyTo,
  type HeaderChatThreadMessage,
  type HeaderMessageConversation,
} from './headerMessagesConstants'
import HeaderMessageChatBubbleMenu from './HeaderMessageChatBubbleMenu'
import { useCommunityChatDeleteMessage } from './useCommunityChatDeleteMessage'
import { useCommunityChatHubSendErrorToast } from './useCommunityChatHubSendErrorToast'
import { useCommunityChatSessionOpen } from './useCommunityChatSessionOpen'
import { useCommunityChatThreadScroll } from './useCommunityChatThreadScroll'
import { sendCommunityChatOutboundText } from './sendCommunityChatOutboundText'
import {
  mapCommunityChatMessageToThreadMessage,
  sortThreadMessagesForDisplay,
} from './headerMessagesMappers'
import {
  formatHeaderMessageChatTime,
  formatHeaderMessageDateTime,
  formatHeaderMessageLocalDayKey,
} from './headerMessagesFormatters'
import './header-messages.css'

interface HeaderMessageChatWindowProps {
  conversation: HeaderMessageConversation
  currentUserProfileId: string
  layout: HeaderMessageChatLayout
  minimized?: boolean
  stackRightPx?: number
  stackIndex?: number
  isFocused?: boolean
  /** Show thread bubble skeleton while session/bootstrap resolves (staff open). */
  isConversationLoading?: boolean
  /** Lazy-create session before first send (new staff chats with no prior thread). */
  ensureSessionId?: () => Promise<string>
  /** Cover the whole viewport including app header (staff page open on mobile). */
  immersive?: boolean
  onToggleMinimize: () => void
  onClose: () => void
  onBack?: () => void
}


function getMessageBodyText(
  message: HeaderChatThreadMessage,
  t: (key: string) => string,
  chatTk: string,
): string {
  if (message.isDeleted) {
    return t(`${chatTk}.messageDeleted`)
  }
  return message.bodyText || (message.bodyKey ? t(`${chatTk}.${message.bodyKey}`) : '')
}



function getOutgoingReceiptStatus(
  message: HeaderChatThreadMessage,
): HeaderChatMessageReceiptStatus {
  return message.receiptStatus ?? HeaderChatMessageReceiptStatus.Sent
}

function MessageReceiptIndicator({
  status,
  label,
}: {
  status: HeaderChatMessageReceiptStatus
  label: string
}) {
  if (status === HeaderChatMessageReceiptStatus.Sent) {
    return (
      <Check
        className="header-message-chat-receipt is-sent"
        aria-label={label}
      />
    )
  }

  return (
    <CheckCheck
      className="header-message-chat-receipt is-read"
      aria-label={label}
    />
  )
}

function getReceiptLabel(
  status: HeaderChatMessageReceiptStatus,
  t: (key: string) => string,
  chatTk: string,
): string {
  return status === HeaderChatMessageReceiptStatus.Sent
    ? t(`${chatTk}.receiptSent`)
    : t(`${chatTk}.receiptRead`)
}

function ChatThreadSkeleton({ mobile = false }: { mobile?: boolean }) {
  if (mobile) {
    return (
      <div className="header-message-chat-skeleton header-message-chat-skeleton--mobile" aria-hidden="true">
        <span className="header-message-chat-date-sep-skeleton" />
        <div className="header-message-chat-skeleton-row is-incoming">
          <span className="header-message-chat-skeleton-avatar" />
          <span className="header-message-chat-skeleton-bubble is-wide" />
        </div>
        <span className="header-message-chat-date-sep-skeleton" />
        <div className="header-message-chat-skeleton-row is-outgoing">
          <span className="header-message-chat-skeleton-bubble is-medium" />
        </div>
      </div>
    )
  }

  return (
    <div className="header-message-chat-skeleton" aria-hidden="true">
      <div className="header-message-chat-skeleton-row is-incoming">
        <span className="header-message-chat-skeleton-avatar" />
        <span className="header-message-chat-skeleton-bubble is-wide" />
      </div>
      <div className="header-message-chat-skeleton-row is-outgoing">
        <span className="header-message-chat-skeleton-bubble is-medium" />
      </div>
      <div className="header-message-chat-skeleton-row is-incoming">
        <span className="header-message-chat-skeleton-avatar" />
        <span className="header-message-chat-skeleton-bubble is-narrow" />
      </div>
      <div className="header-message-chat-skeleton-row is-outgoing">
        <span className="header-message-chat-skeleton-bubble is-wide" />
      </div>
      <div className="header-message-chat-skeleton-row is-incoming">
        <span className="header-message-chat-skeleton-avatar" />
        <span className="header-message-chat-skeleton-bubble is-medium" />
      </div>
    </div>
  )
}

function NewDirectChatWelcome({
  conversation,
  t,
  chatTk,
  onPickStarter,
}: {
  conversation: HeaderMessageConversation
  t: (key: string, vars?: Record<string, string | number>) => string
  chatTk: string
  onPickStarter: (text: string) => void
}) {
  const nameVars = { name: conversation.name }

  return (
    <div className="header-message-chat-new-welcome" role="status">
      <span className="header-message-chat-new-avatar" aria-hidden="true">
        {conversation.initials}
      </span>

      <p className="header-message-chat-new-title">
        {t(`${chatTk}.newChatWelcomeTitle`, nameVars)}
      </p>
      <p className="header-message-chat-new-subtitle">
        {t(`${chatTk}.newChatWelcomeSubtitle`)}
      </p>

      <div className="header-message-chat-new-badge">
        <User className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <span>{t(`${chatTk}.directChatSubtitle`)}</span>
      </div>

      <p className="header-message-chat-new-hint">
        <Sparkles className="h-3.5 w-3.5 shrink-0 text-nexoraBrand" aria-hidden="true" />
        <span>{t(`${chatTk}.newChatHint`)}</span>
      </p>

      <div className="header-message-chat-starter-list" role="list">
        {HEADER_MESSAGE_NEW_CHAT_STARTER_KEYS.map((starterKey) => {
          const starterText = t(`${chatTk}.${starterKey}`, nameVars)
          return (
            <button
              key={starterKey}
              type="button"
              role="listitem"
              className="header-message-chat-starter-chip"
              onClick={() => onPickStarter(starterText)}
            >
              <MessagesSquare className="h-3.5 w-3.5 shrink-0 text-nexoraBrand" aria-hidden="true" />
              <span>{starterText}</span>
            </button>
          )
        })}
      </div>

      <p className="header-message-chat-new-privacy">
        <Lock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <span>{t(`${chatTk}.newChatPrivacy`, nameVars)}</span>
      </p>
    </div>
  )
}

function HeaderMessageChatWindow({
  conversation,
  currentUserProfileId,
  layout,
  minimized = false,
  stackRightPx = 0,
  stackIndex = 0,
  isFocused = false,
  isConversationLoading = false,
  ensureSessionId,
  immersive = false,
  onToggleMinimize,
  onClose,
  onBack,
}: HeaderMessageChatWindowProps) {
  const { t, currentLanguage } = useTranslation()
  const { showToast } = useNotification()
  const threadRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [draft, setDraft] = useState('')
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null)
  const [isSending, setIsSending] = useState(false)
  const [menuMessageId, setMenuMessageId] = useState<string | null>(null)

  const sessionId = conversation.id
  const isPendingSession = isPendingCommunityChatSessionId(sessionId)
  const isGroupChat = conversation.chatType === CommunityChatType.Group

  const {
    messages: rawMessages,
    isLoading,
    isError: isMessagesError,
    hasOlderMessages,
    isFetchingOlderMessages,
    fetchOlderMessages,
  } = useCommunityChatMessagesInfinite(isPendingSession ? null : sessionId, {
    enabled: Boolean(sessionId) && !isPendingSession && !minimized && !isConversationLoading,
  })

  const sendMessageMutation = useSendCommunityChatMessage(isPendingSession ? '' : sessionId)
  const sendImageMutation = useSendCommunityChatImage(isPendingSession ? '' : sessionId)
  const { deletingMessageId, deleteMessage } = useCommunityChatDeleteMessage({
    sessionId: isPendingSession ? null : sessionId,
    onDeleted: () => setMenuMessageId(null),
  })

  useCommunityChatSessionOpen(
    isPendingSession ? null : sessionId,
    Boolean(sessionId) && !isPendingSession && !minimized && !isConversationLoading,
  )
  useCommunityChatHubSendErrorToast()

  const chatTk = HEADER_MESSAGES_CHAT_I18N
  const isFloating = layout === HeaderMessageChatLayout.Floating
  const isMobileFullscreen = layout === HeaderMessageChatLayout.Fullscreen
  const isThreadLoading = isConversationLoading || isLoading

  const localMessages = useMemo(
    () => sortThreadMessagesForDisplay(
      rawMessages.map((message) => (
        mapCommunityChatMessageToThreadMessage(message, currentUserProfileId)
      )),
    ),
    [currentUserProfileId, rawMessages],
  )

  const { handleThreadScroll } = useCommunityChatThreadScroll(threadRef, {
    enabled: Boolean(sessionId) && !isPendingSession && !minimized && !isConversationLoading,
    threadKey: sessionId,
    messageCount: localMessages.length,
    hasOlderMessages,
    isFetchingOlderMessages,
    isInitialLoading: isThreadLoading,
    onLoadOlder: fetchOlderMessages,
  })

  const previousConversationIdRef = useRef(conversation.id)

  useEffect(() => {
    const previousId = previousConversationIdRef.current
    previousConversationIdRef.current = conversation.id
    // Keep composer text when a pending new chat receives its real session id.
    if (isPendingCommunityChatSessionId(previousId) && !isPendingCommunityChatSessionId(conversation.id)) {
      return
    }
    setDraft('')
    setPreviewImageUrl(null)
    setMenuMessageId(null)
  }, [conversation.id])

  useEffect(() => {
    if (!previewImageUrl) return

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setPreviewImageUrl(null)
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [previewImageUrl])

  const pickStarterMessage = (text: string) => {
    setDraft(text)
  }

  const resolveActiveSessionId = async () => {
    if (ensureSessionId) return ensureSessionId()
    return sessionId
  }

  const handleSend = async () => {
    const text = draft.trim()
    if (!text || isThreadLoading || isSending) return

    // Validate message length before sending
    if (text.length > COMMUNITY_CHAT_MAX_MESSAGE_LENGTH) {
      showToast(
        t(`${chatTk}.messageTooLong`, { maxLength: COMMUNITY_CHAT_MAX_MESSAGE_LENGTH }),
        'error',
      )
      return
    }

    setIsSending(true)
    try {
      const activeSessionId = await resolveActiveSessionId()
      await sendCommunityChatOutboundText({
        sessionId: activeSessionId,
        content: text,
        sendViaRest: (input) => sendMessageMutation.mutateAsync(input),
      })
      setDraft('')
    } catch (error) {
      showToast(
        resolveTranslatedApiError(t, error, `${chatTk}.sendError`),
        'error',
      )
    } finally {
      setIsSending(false)
    }
  }

  const handleImagePick = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file || isThreadLoading || isSending) return
    if (!isAllowedCommunityChatImageFile(file)) {
      showToast(t(`${chatTk}.imageInvalid`), 'error')
      return
    }

    setIsSending(true)
    try {
      const activeSessionId = await resolveActiveSessionId()
      await sendImageMutation.mutateAsync({ file, sessionId: activeSessionId })
    } catch (error) {
      showToast(
        resolveTranslatedApiError(t, error, `${chatTk}.sendError`),
        'error',
      )
    } finally {
      setIsSending(false)
    }
  }

  const renderBubbleBody = (message: HeaderChatThreadMessage, bodyText: string) => {
    if (message.imageUrl && !message.isDeleted) {
      return (
        <button
          type="button"
          className="header-message-chat-image-btn"
          aria-label={t(`${chatTk}.previewImage`)}
          onClick={() => setPreviewImageUrl(message.imageUrl ?? null)}
        >
          <img
            src={message.imageUrl}
            alt={t(`${chatTk}.attachedImageAlt`)}
            className="header-message-chat-image"
          />
        </button>
      )
    }

    const className = message.isDeleted
      ? 'header-message-chat-bubble-text is-deleted'
      : 'header-message-chat-bubble-text'

    return <p className={className}>{bodyText}</p>
  }

  const renderQuote = (replyTo: HeaderChatMessageReplyTo) => (
    <div className="header-message-chat-quote">
      <span className="header-message-chat-quote-name">{replyTo.senderName}</span>
      <span className="header-message-chat-quote-text">{replyTo.previewText}</span>
    </div>
  )

  const renderReceiptIndicator = (message: HeaderChatThreadMessage) => {
    const status = getOutgoingReceiptStatus(message)
    return (
      <MessageReceiptIndicator
        status={status}
        label={getReceiptLabel(status, t, chatTk)}
      />
    )
  }

  const renderBubbleFooter = (
    message: HeaderChatThreadMessage,
    isOutgoing: boolean,
    isImage: boolean,
  ) => {
    // Reply UI is hidden until the API supports replyToMessageId (PDF has no reply field).
    return (
      <span className={`header-message-chat-bubble-meta${isImage ? ' header-message-chat-bubble-meta--image' : ''}`}>
        <span>{formatHeaderMessageChatTime(message.sentAt, currentLanguage)}</span>
        {isOutgoing ? renderReceiptIndicator(message) : null}
      </span>
    )
  }

  const renderMessageMenu = (message: HeaderChatThreadMessage) => {
    if (message.direction !== HeaderChatMessageDirection.Outgoing) return null
    if (message.isDeleted) return null

    return (
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
    )
  }

  const renderMessageBubble = (
    message: HeaderChatThreadMessage,
    options: { mobile?: boolean } = {},
  ) => {
    const mobile = Boolean(options.mobile)
    const isOutgoing = message.direction === HeaderChatMessageDirection.Outgoing
    const bodyText = getMessageBodyText(message, t, chatTk)
    const isImage = Boolean(message.imageUrl)

    return (
      <div
        className={[
          'header-message-chat-bubble',
          mobile ? 'header-message-chat-bubble--mobile' : '',
          isOutgoing ? 'is-outgoing' : 'is-incoming',
          isImage ? 'is-image' : '',
        ].filter(Boolean).join(' ')}
      >
        {!isOutgoing && !isImage && mobile ? (
          <span className="header-message-chat-bubble-sender">{conversation.name}</span>
        ) : null}
        {message.replyTo ? renderQuote(message.replyTo) : null}
        {renderBubbleBody(message, bodyText)}
        {renderBubbleFooter(message, isOutgoing, isImage)}
      </div>
    )
  }

  const desktopMessageNodes = useMemo(
    () => localMessages.map((message, index) => {
      const isOutgoing = message.direction === HeaderChatMessageDirection.Outgoing
      const showAvatar = !isOutgoing
        && (index === 0 || localMessages[index - 1]?.direction !== HeaderChatMessageDirection.Incoming)

      return (
        <div
          key={message.id}
          className={`header-message-chat-row${isOutgoing ? ' is-outgoing' : ' is-incoming'}`}
        >
          {!isOutgoing && (
            <span
              className={`header-message-chat-row-avatar${showAvatar ? '' : ' is-spacer'}`}
              aria-hidden="true"
            >
              {showAvatar ? conversation.initials : ''}
            </span>
          )}
          {isOutgoing ? renderMessageMenu(message) : null}
          {renderMessageBubble(message)}
        </div>
      )
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [chatTk, conversation.initials, conversation.name, currentLanguage, deletingMessageId, isSending, localMessages, menuMessageId, t],
  )

  const mobileMessageNodes = useMemo(() => {
    const nodes: ReactElement[] = []
    let lastDayKey = ''

    localMessages.forEach((message, index) => {
      const dayKey = formatHeaderMessageLocalDayKey(message.sentAt)
      if (dayKey !== lastDayKey) {
        lastDayKey = dayKey
        nodes.push(
          <div key={`sep-${dayKey}-${index}`} className="header-message-chat-date-sep">
            {formatHeaderMessageDateTime(message.sentAt, currentLanguage)}
          </div>,
        )
      }

      const isOutgoing = message.direction === HeaderChatMessageDirection.Outgoing
      const showAvatar = !isOutgoing
        && (index === 0 || localMessages[index - 1]?.direction !== HeaderChatMessageDirection.Incoming)

      nodes.push(
        <div
          key={message.id}
          className={`header-message-chat-row header-message-chat-row--mobile${isOutgoing ? ' is-outgoing' : ' is-incoming'}`}
        >
          {!isOutgoing && (
            <span
              className={`header-message-chat-row-avatar${showAvatar ? '' : ' is-spacer'}`}
              aria-hidden="true"
            >
              {showAvatar ? conversation.initials : ''}
            </span>
          )}
          {isOutgoing ? renderMessageMenu(message) : null}
          {renderMessageBubble(message, { mobile: true })}
        </div>,
      )
    })

    return nodes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatTk, conversation.initials, conversation.name, currentLanguage, deletingMessageId, isSending, localMessages, menuMessageId, t])

  const isThreadEmpty = !isThreadLoading && !isMessagesError && localMessages.length === 0

  const floatingStackStyle = isFloating
    ? {
        right: `calc(${HEADER_MESSAGE_DESKTOP_EDGE_INSET_PX}px + ${stackRightPx}px)`,
        zIndex: (isFocused ? HEADER_MESSAGE_DESKTOP_CHAT_Z_FOCUSED : HEADER_MESSAGE_DESKTOP_CHAT_Z_BASE) + stackIndex,
      }
    : undefined

  if (isFloating && minimized) {
    return createPortal(
      <div
        className="header-message-chat-fab-wrap"
        style={floatingStackStyle}
        {...{ [HEADER_MESSAGE_CHAT_ROOT_ATTR]: '' }}
      >
        <button
          type="button"
          className="header-message-chat-fab"
          aria-label={t(`${chatTk}.restore`, { name: conversation.name })}
          onClick={(event) => {
            event.stopPropagation()
            onToggleMinimize()
          }}
        >
          <span className="header-message-chat-fab-avatar" aria-hidden="true">
            {conversation.initials}
          </span>
        </button>
        <button
          type="button"
          className="header-message-chat-fab-close"
          aria-label={t(`${chatTk}.close`)}
          onClick={(event) => {
            event.stopPropagation()
            onClose()
          }}
        >
          <X className="h-3 w-3" aria-hidden="true" />
        </button>
      </div>,
      document.body,
    )
  }

  const imagePreview = previewImageUrl
    ? createPortal(
        <div
          className="header-message-chat-preview"
          role="dialog"
          aria-modal="true"
          aria-label={t(`${chatTk}.previewImage`)}
        >
          <button
            type="button"
            className="header-message-chat-preview-backdrop"
            aria-label={t(`${chatTk}.closePreview`)}
            onClick={() => setPreviewImageUrl(null)}
          />
          <div className="header-message-chat-preview-card">
            <button
              type="button"
              className="header-message-chat-preview-close"
              aria-label={t(`${chatTk}.closePreview`)}
              onClick={() => setPreviewImageUrl(null)}
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
            <img
              src={previewImageUrl}
              alt={t(`${chatTk}.attachedImageAlt`)}
              className="header-message-chat-preview-image"
            />
          </div>
        </div>,
        document.body,
      )
    : null

  const panel = (
    <div
      className={[
        'header-message-chat',
        isFloating ? 'header-message-chat--floating' : 'header-message-chat--fullscreen',
        !isFloating && immersive ? 'is-immersive' : '',
      ].filter(Boolean).join(' ')}
      style={floatingStackStyle}
      {...{ [HEADER_MESSAGE_CHAT_ROOT_ATTR]: '' }}
      role="dialog"
        aria-busy={isThreadLoading}
      aria-label={conversation.name}
    >
      <div className={`header-message-chat-head${isMobileFullscreen ? ' header-message-chat-head--mobile' : ''}`}>
        <div className="header-message-chat-head-main">
          {isMobileFullscreen && onBack && !immersive ? (
            <button
              type="button"
              className="header-message-chat-back"
              aria-label={t(`${HEADER_MESSAGES_I18N}.backToList`)}
              onClick={onBack}
            >
              <ArrowLeft className="h-5 w-5" aria-hidden="true" />
            </button>
          ) : null}
          <span className="header-message-chat-head-avatar" aria-hidden="true">
            {conversation.initials}
          </span>
          <div className="header-message-chat-head-copy">
            <span className="header-message-chat-head-name">{conversation.name}</span>
          </div>
        </div>

        {isFloating ? (
          <div className="header-message-chat-head-actions">
            <button
              type="button"
              className="header-message-chat-icon-btn"
              aria-label={t(`${chatTk}.callUnavailable`)}
              title={t(`${chatTk}.callUnavailable`)}
              disabled
            >
              <Phone className="h-4 w-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              className="header-message-chat-icon-btn"
              aria-label={t(`${chatTk}.videoCallUnavailable`)}
              title={t(`${chatTk}.videoCallUnavailable`)}
              disabled
            >
              <Video className="h-4 w-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              className="header-message-chat-icon-btn"
              aria-label={t(`${chatTk}.minimize`)}
              onClick={onToggleMinimize}
            >
              <Minus className="h-4 w-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              className="header-message-chat-icon-btn"
              aria-label={t(`${chatTk}.close`)}
              onClick={onClose}
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        ) : immersive ? (
          <div className="header-message-chat-head-actions">
            <button
              type="button"
              className="header-message-chat-icon-btn header-message-chat-icon-btn--close"
              aria-label={t(`${chatTk}.close`)}
              onClick={onClose}
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        ) : null}
      </div>

      <div
        className={[
          'header-message-chat-thread',
          isMobileFullscreen ? 'header-message-chat-thread--mobile' : '',
          isThreadEmpty ? 'header-message-chat-thread--empty' : '',
        ].filter(Boolean).join(' ')}
        ref={threadRef}
        onScroll={handleThreadScroll}
      >
        {isThreadLoading ? (
          <ChatThreadSkeleton mobile={isMobileFullscreen} />
        ) : isMessagesError ? (
          <div className="header-message-chat-error" role="alert">
            {t(`${chatTk}.loadError`)}
          </div>
        ) : isThreadEmpty ? (
          <NewDirectChatWelcome
            conversation={conversation}
            t={t}
            chatTk={chatTk}
            onPickStarter={pickStarterMessage}
          />
        ) : (
          <>
            {isFetchingOlderMessages ? (
              <div className="header-message-chat-load-older" role="status">
                {t(`${chatTk}.loadingOlder`)}
              </div>
            ) : null}
            <div className="header-message-chat-thread-list">
              {isMobileFullscreen ? mobileMessageNodes : desktopMessageNodes}
            </div>
            <span className="sr-only" aria-live="polite">
              {t(`${chatTk}.loaded`, { count: localMessages.length })}
            </span>
          </>
        )}
      </div>

      <div
        className={`header-message-chat-composer-wrap${isMobileFullscreen ? ' header-message-chat-composer-wrap--mobile' : ''}`}
      >


        <form
          className={`header-message-chat-composer${isMobileFullscreen ? ' header-message-chat-composer--mobile' : ''}`}
          onSubmit={(event) => {
            event.preventDefault()
            handleSend()
          }}
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
          className="header-message-chat-attach"
          aria-label={t(`${chatTk}.attachImage`)}
          disabled={isThreadLoading || isSending}
          onClick={() => fileInputRef.current?.click()}
        >
          <ImagePlus className="h-5 w-5" aria-hidden="true" />
        </button>
        <input
          type="text"
          className="header-message-chat-input"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder={t(`${chatTk}.inputPlaceholder`)}
          aria-label={t(`${chatTk}.inputPlaceholder`)}
          disabled={isThreadLoading || isSending}
        />
        <button
          type="submit"
          className="header-message-chat-send"
          aria-label={t(`${chatTk}.send`)}
          disabled={!draft.trim() || isThreadLoading || isSending}
        >
          <Send className="h-4 w-4" aria-hidden="true" />
        </button>
        </form>
      </div>
    </div>
  )

  if (isFloating || isMobileFullscreen) {
    return (
      <>
        {createPortal(panel, document.body)}
        {imagePreview}
      </>
    )
  }

  return (
    <>
      {panel}
      {imagePreview}
    </>
  )
}

export default HeaderMessageChatWindow
