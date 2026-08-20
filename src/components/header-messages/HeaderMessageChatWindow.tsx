import {
  ArrowLeft,
  Check,
  CheckCheck,
  ImagePlus,
  Lock,
  MessagesSquare,
  Minus,
  Phone,
  Reply,
  Send,
  Sparkles,
  User,
  Video,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type ChangeEvent, type ReactElement } from 'react'
import { createPortal } from 'react-dom'
import { CommunityChatType } from '../../constants/communityChat'
import {
  useCommunityChatMessages,
  useMarkCommunityChatSessionRead,
  useSendCommunityChatImage,
  useSendCommunityChatMessage,
} from '../../data/hooks/useCommunityChat'
import { sendCommunityChatHubMessage } from '../../lib/communityChatHub'
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
  HEADER_MESSAGE_REPLY_PREVIEW_MAX,
  HeaderChatMessageDirection,
  HeaderChatMessageReceiptStatus,
  HeaderMessageChatLayout,
  type HeaderChatMessageReplyTo,
  type HeaderChatThreadMessage,
  type HeaderMessageConversation,
} from './headerMessagesConstants'
import {
  joinCommunityChatHubSession,
  leaveCommunityChatHubSession,
  getCommunityChatHubConnection,
} from './communityChatRealtime'
import {
  mapCommunityChatMessageToThreadMessage,
  sortThreadMessagesForDisplay,
} from './headerMessagesMappers'
import {
  formatHeaderMessageChatTime,
  formatHeaderMessageDateTime,
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
  onToggleMinimize: () => void
  onClose: () => void
  onBack?: () => void
}

function truncatePreview(text: string, max = HEADER_MESSAGE_REPLY_PREVIEW_MAX): string {
  const trimmed = text.trim()
  if (trimmed.length <= max) return trimmed
  return `${trimmed.slice(0, max).trimEnd()}…`
}

interface HeaderChatReplyDraft {
  messageId: string
  senderName: string
  previewText: string
}

function getMessageBodyText(
  message: HeaderChatThreadMessage,
  t: (key: string) => string,
  chatTk: string,
): string {
  return message.bodyText || (message.bodyKey ? t(`${chatTk}.${message.bodyKey}`) : '')
}

function getMessagePreview(
  message: HeaderChatThreadMessage,
  t: (key: string) => string,
  chatTk: string,
): string {
  if (message.imageUrl) return t(`${chatTk}.imageReplyPreview`)
  return truncatePreview(getMessageBodyText(message, t, chatTk))
}

function getMessageSenderName(
  message: HeaderChatThreadMessage,
  conversation: HeaderMessageConversation,
  t: (key: string) => string,
  chatTk: string,
): string {
  if (message.direction === HeaderChatMessageDirection.Incoming) return conversation.name
  return t(`${chatTk}.you`)
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
  const [replyDraft, setReplyDraft] = useState<HeaderChatReplyDraft | null>(null)

  const sessionId = conversation.id
  const isGroupChat = conversation.chatType === CommunityChatType.Group

  const {
    data: messagesPage,
    isLoading,
    isError: isMessagesError,
  } = useCommunityChatMessages(sessionId, { pageNumber: 1, pageSize: 50 }, {
    enabled: Boolean(sessionId) && !minimized,
  })

  const sendMessageMutation = useSendCommunityChatMessage(sessionId)
  const sendImageMutation = useSendCommunityChatImage(sessionId)
  const markReadMutation = useMarkCommunityChatSessionRead()

  const chatTk = HEADER_MESSAGES_CHAT_I18N
  const isFloating = layout === HeaderMessageChatLayout.Floating
  const isMobileFullscreen = layout === HeaderMessageChatLayout.Fullscreen

  const localMessages = useMemo(
    () => sortThreadMessagesForDisplay(
      (messagesPage?.items ?? []).map((message) => (
        mapCommunityChatMessageToThreadMessage(message, currentUserProfileId)
      )),
    ),
    [currentUserProfileId, messagesPage?.items],
  )

  useEffect(() => {
    if (!sessionId || minimized) return undefined

    void joinCommunityChatHubSession(sessionId)
    markReadMutation.mutate(sessionId)

    return () => {
      void leaveCommunityChatHubSession(sessionId)
    }
  }, [minimized, sessionId])

  useEffect(() => {
    setReplyDraft(null)
    setDraft('')
    setPreviewImageUrl(null)
  }, [conversation.id])

  useEffect(() => {
    if (isLoading || minimized) return
    const node = threadRef.current
    if (!node) return
    node.scrollTop = localMessages.length === 0 ? 0 : node.scrollHeight
  }, [isLoading, localMessages, minimized, replyDraft])

  useEffect(() => {
    if (!previewImageUrl) return

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setPreviewImageUrl(null)
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [previewImageUrl])

  const clearReply = () => {
    setReplyDraft(null)
  }

  const pickStarterMessage = (text: string) => {
    setDraft(text)
  }

  const startReply = (message: HeaderChatThreadMessage) => {
    setReplyDraft({
      messageId: message.id,
      senderName: getMessageSenderName(message, conversation, t, chatTk),
      previewText: getMessagePreview(message, t, chatTk),
    })
  }

  const handleSend = async () => {
    const text = draft.trim()
    if (!text || isLoading || isSending) return

    setIsSending(true)
    try {
      const connection = await getCommunityChatHubConnection()
      if (connection?.state === 'Connected') {
        await sendCommunityChatHubMessage(connection, { sessionId, content: text })
      } else {
        await sendMessageMutation.mutateAsync({ content: text })
      }
      setDraft('')
      clearReply()
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
    if (!file || isLoading || isSending || !file.type.startsWith('image/')) return

    setIsSending(true)
    try {
      await sendImageMutation.mutateAsync(file)
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
    if (message.imageUrl) {
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

    return <p className="header-message-chat-bubble-text">{bodyText}</p>
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
    if (isImage) {
      return (
        <span className="header-message-chat-bubble-meta header-message-chat-bubble-meta--image">
          <span>{formatHeaderMessageChatTime(message.sentAt, currentLanguage)}</span>
          {isOutgoing ? renderReceiptIndicator(message) : null}
        </span>
      )
    }

    return (
      <div className="header-message-chat-bubble-foot">
        <button
          type="button"
          className="header-message-chat-reply"
          onClick={() => startReply(message)}
        >
          <Reply className="h-3.5 w-3.5" aria-hidden="true" />
          <span>{t(`${chatTk}.reply`)}</span>
        </button>
        <span className="header-message-chat-bubble-meta">
          <span>{formatHeaderMessageChatTime(message.sentAt, currentLanguage)}</span>
          {isOutgoing ? renderReceiptIndicator(message) : null}
        </span>
      </div>
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
          {renderMessageBubble(message)}
        </div>
      )
    }),
    [chatTk, conversation.initials, conversation.name, currentLanguage, localMessages, t],
  )

  const mobileMessageNodes = useMemo(() => {
    const nodes: ReactElement[] = []
    let lastDayKey = ''

    localMessages.forEach((message, index) => {
      const dayKey = message.sentAt.slice(0, 10)
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
          {renderMessageBubble(message, { mobile: true })}
        </div>,
      )
    })

    return nodes
  }, [chatTk, conversation.initials, conversation.name, currentLanguage, localMessages, t])

  const isThreadEmpty = !isLoading && !isMessagesError && localMessages.length === 0
  const chatSubtitleKey = isGroupChat ? 'groupChatSubtitle' : 'directChatSubtitle'

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
      ].join(' ')}
      style={floatingStackStyle}
      {...{ [HEADER_MESSAGE_CHAT_ROOT_ATTR]: '' }}
      role="dialog"
      aria-busy={isLoading}
      aria-label={conversation.name}
    >
      <div className={`header-message-chat-head${isMobileFullscreen ? ' header-message-chat-head--mobile' : ''}`}>
        <div className="header-message-chat-head-main">
          {isMobileFullscreen && onBack ? (
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
            <span className="header-message-chat-head-subtitle">
              <User className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{t(`${chatTk}.${chatSubtitleKey}`)}</span>
            </span>
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
        ) : null}
      </div>

      <div
        className={[
          'header-message-chat-thread',
          isMobileFullscreen ? 'header-message-chat-thread--mobile' : '',
          isThreadEmpty ? 'header-message-chat-thread--empty' : '',
        ].filter(Boolean).join(' ')}
        ref={threadRef}
      >
        {isLoading ? (
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
        {replyDraft ? (
          <div className="header-message-chat-reply-banner">
            <Reply className="header-message-chat-reply-banner-icon" aria-hidden="true" />
            <p className="header-message-chat-reply-banner-text">
              <span className="header-message-chat-reply-banner-label">
                {t(`${chatTk}.replyingTo`)}
              </span>
              <span aria-hidden="true"> · </span>
              <span className="header-message-chat-reply-banner-preview">{replyDraft.previewText}</span>
            </p>
            <button
              type="button"
              className="header-message-chat-reply-banner-close"
              aria-label={t(`${chatTk}.cancelReply`)}
              onClick={clearReply}
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        ) : null}

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
          accept="image/*"
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
          onChange={handleImagePick}
        />
        <button
          type="button"
          className="header-message-chat-attach"
          aria-label={t(`${chatTk}.attachImage`)}
          disabled={isLoading || isSending}
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
          disabled={isLoading || isSending}
        />
        <button
          type="submit"
          className="header-message-chat-send"
          aria-label={t(`${chatTk}.send`)}
          disabled={!draft.trim() || isLoading || isSending}
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
