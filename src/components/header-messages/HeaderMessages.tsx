import { ArrowLeft, MessagesSquare, Search, Users, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useAuth } from '../../auth/useAuth'
import { useSessionRole } from '../../auth/useSessionRole'
import { CommunityChatType } from '../../constants/communityChat'
import { useCommunityChatSession, useCommunityChatSessions, useMarkCommunityChatSessionRead } from '../../data/hooks/useCommunityChat'
import { useHydrateCommunityChatLastMessagePreviews } from '../../data/hooks/useHydrateCommunityChatLastMessagePreviews'
import { useProfileSettings } from '../../data/hooks/useProfileSettings'
import { useStaffBusinesses } from '../../data/hooks/useStaffSelf'
import { dedupeCommunityChatSessions } from '../../data/communityChatSessionUtils'
import { useTranslation } from '../../contexts/LanguageContext'
import { useNotification } from '../../contexts/NotificationContext'
import IconButton from '../ui/IconButton'
import HeaderMessageChatWindow from './HeaderMessageChatWindow'
import HeaderMessagesEmptyState from './HeaderMessagesEmptyState'
import HeaderMessagesListSkeleton from './HeaderMessagesListSkeleton'
import {
  formatHeaderMessagesUnreadCount,
  HEADER_MESSAGES_I18N,
  HEADER_MESSAGE_CHAT_ROOT_SELECTOR,
  HeaderMessageChatLayout,
  HeaderMessageListPreviewKey,
  HeaderMessagesEmptyVariant,
  HeaderMessagesTab,
  HeaderMessagesVariant,
  getHeaderMessageChatStackRightPx,
  type HeaderMessageConversation,
} from './headerMessagesConstants'
import { formatHeaderMessageDateTime } from './headerMessagesFormatters'
import {
  mapCommunityChatSessionToConversation,
} from './headerMessagesMappers'
import {
  OPEN_COMMUNITY_CHAT_SESSION_EVENT,
  type OpenCommunityChatSessionDetail,
} from './openCommunityChatSession'
import { useCommunityChatRealtime } from './useCommunityChatRealtime'
import { useDesktopChatSessions } from './useDesktopChatSessions'
import './header-messages.css'
import { useMobileMessengerScrollLock } from './useMobileMessengerScrollLock'

interface HeaderMessagesProps {
  variant: HeaderMessagesVariant
}

function getConversationPreview(
  conversation: HeaderMessageConversation,
  t: (key: string) => string,
): string {
  if (conversation.lastMessagePreviewText) {
    return conversation.lastMessagePreviewText
  }
  if (conversation.lastMessagePreviewKey) {
    return t(`${HEADER_MESSAGES_I18N}.chat.${conversation.lastMessagePreviewKey}`)
  }
  return ''
}

export default function HeaderMessages({ variant }: HeaderMessagesProps) {
  const { t, currentLanguage } = useTranslation()
  const { showToast } = useNotification()
  const { session, status } = useAuth()
  const containerRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<HeaderMessagesTab>(HeaderMessagesTab.Messages)
  const [searchQuery, setSearchQuery] = useState('')
  const [mobileActiveConversation, setMobileActiveConversation] = useState<HeaderMessageConversation | null>(null)
  const [pendingOpenSessionId, setPendingOpenSessionId] = useState<string | null>(null)

  const currentUserProfileId = session?.id ?? ''
  const isAuthenticated = status === 'authenticated'
  const { isStaff } = useSessionRole()
  const isDesktop = variant === HeaderMessagesVariant.Desktop
  const {
    sessions: desktopChatSessions,
    focusConversationId: desktopChatFocusId,
    openConversation: openDesktopConversation,
    ensureConversationOpen: ensureDesktopConversationOpen,
    toggleMinimize: toggleDesktopChatMinimize,
    closeConversation: closeDesktopChat,
  } = useDesktopChatSessions({
    enabled: isDesktop,
    messagesPanelOpen: open,
  })

  const canLoadMessenger = isAuthenticated && (
    open
    || Boolean(pendingOpenSessionId)
    || desktopChatSessions.length > 0
  )

  useCommunityChatRealtime({ enabled: canLoadMessenger })

  const {
    data: chatSessions = [],
    isLoading: isSessionsLoading,
    isError: isSessionsError,
  } = useCommunityChatSessions({ enabled: canLoadMessenger && open })

  const { data: pendingSession, isError: isPendingSessionError, isFetched: isPendingSessionFetched } = useCommunityChatSession(
    pendingOpenSessionId,
    { enabled: Boolean(pendingOpenSessionId) },
  )

  const { data: staffBusinesses = [] } = useStaffBusinesses({
    enabled: canLoadMessenger && isStaff,
  })
  const { data: profile } = useProfileSettings({
    enabled: canLoadMessenger && !isStaff,
  })

  const businessNameById = useMemo(() => {
    const map = new Map<string, string>()

    staffBusinesses.forEach((business) => {
      const id = String(business.businessId ?? '').trim()
      const name = String(business.businessName ?? '').trim()
      if (id && name) map.set(id, name)
    })

    const merchantBusinessId = String(
      profile?.business?.businessId ?? profile?.business?.id ?? '',
    ).trim()
    const merchantBusinessName = String(
      profile?.business?.businessName ?? profile?.business?.name ?? '',
    ).trim()
    if (merchantBusinessId && merchantBusinessName) {
      map.set(merchantBusinessId, merchantBusinessName)
    }

    return map
  }, [staffBusinesses, profile?.business])

  const titleMapOptions = useMemo(() => ({
    businessNameById,
    untitledDirectLabel: t(`${HEADER_MESSAGES_I18N}.untitledDirectChat`),
    untitledGroupLabel: t(`${HEADER_MESSAGES_I18N}.untitledGroupChat`),
  }), [businessNameById, t])

  const dedupedChatSessions = useMemo(
    () => dedupeCommunityChatSessions(chatSessions, currentUserProfileId),
    [chatSessions, currentUserProfileId],
  )

  useHydrateCommunityChatLastMessagePreviews(dedupedChatSessions, {
    enabled: canLoadMessenger && open,
  })

  const markSessionReadMutation = useMarkCommunityChatSessionRead()

  const listPreviewKey = isDesktop
    ? HeaderMessageListPreviewKey.Desktop
    : HeaderMessageListPreviewKey.Mobile

  const conversations = useMemo(
    () => dedupedChatSessions.map((chatSession) => (
      mapCommunityChatSessionToConversation(
        chatSession,
        currentUserProfileId,
        listPreviewKey,
        titleMapOptions,
      )
    )),
    [dedupedChatSessions, currentUserProfileId, listPreviewKey, titleMapOptions],
  )

  useEffect(() => {
    function isDesktopViewport(): boolean {
      return window.matchMedia('(min-width: 1024px)').matches
    }

    function handleOpenCommunityChatSession(event: Event) {
      // Mobile + desktop HeaderMessages can both be mounted; only the
      // viewport-matching instance should open the session.
      if (isDesktop !== isDesktopViewport()) return

      const detail = (event as CustomEvent<OpenCommunityChatSessionDetail>).detail
      const sessionId = String(detail?.sessionId ?? '').trim()
      if (!sessionId) return
      setPendingOpenSessionId(sessionId)
      if (!isDesktop) setOpen(true)
    }

    window.addEventListener(OPEN_COMMUNITY_CHAT_SESSION_EVENT, handleOpenCommunityChatSession)
    return () => {
      window.removeEventListener(OPEN_COMMUNITY_CHAT_SESSION_EVENT, handleOpenCommunityChatSession)
    }
  }, [isDesktop])

  useEffect(() => {
    if (!pendingOpenSessionId) return

    if (isPendingSessionError && isPendingSessionFetched) {
      showToast(t(`${HEADER_MESSAGES_I18N}.chat.openSessionError`), 'error')
      setPendingOpenSessionId(null)
      return
    }

    const fromList = dedupedChatSessions.find((sessionItem) => sessionItem.id === pendingOpenSessionId)
    const sessionToOpen = fromList ?? pendingSession
    if (!sessionToOpen?.id) return

    const conversation = mapCommunityChatSessionToConversation(
      sessionToOpen,
      currentUserProfileId,
      listPreviewKey,
      titleMapOptions,
    )

    markSessionReadMutation.mutate(conversation.id)

    if (isDesktop) {
      ensureDesktopConversationOpen(conversation)
    } else {
      setMobileActiveConversation(conversation)
      setOpen(true)
    }

    setPendingOpenSessionId(null)
    // Intentionally omit markSessionReadMutation — use .mutate only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    currentUserProfileId,
    dedupedChatSessions,
    ensureDesktopConversationOpen,
    isDesktop,
    isPendingSessionError,
    isPendingSessionFetched,
    listPreviewKey,
    pendingOpenSessionId,
    pendingSession,
    showToast,
    t,
    titleMapOptions,
  ])

  const directConversations = useMemo(
    () => conversations.filter((conversation) => (
      conversation.chatType !== CommunityChatType.Group
    )),
    [conversations],
  )

  const groupConversations = useMemo(
    () => conversations.filter((conversation) => (
      conversation.chatType === CommunityChatType.Group
    )),
    [conversations],
  )

  const expandedDesktopChatIds = useMemo(
    () => new Set(
      desktopChatSessions
        .filter((sessionItem) => !sessionItem.minimized)
        .map((sessionItem) => sessionItem.conversation.id),
    ),
    [desktopChatSessions],
  )

  const isConversationActive = (conversationId: string) => (
    isDesktop
      ? expandedDesktopChatIds.has(conversationId)
      : mobileActiveConversation?.id === conversationId
  )

  const activeTabConversations = activeTab === HeaderMessagesTab.Groups
    ? groupConversations
    : directConversations

  const messageCount = directConversations.length
  const groupCount = groupConversations.length

  const totalUnread = useMemo(
    () => conversations.reduce((sum, conversation) => sum + (conversation.unreadCount ?? 0), 0),
    [conversations],
  )

  const messagesButtonLabel = totalUnread > 0
    ? t(`${HEADER_MESSAGES_I18N}.openWithUnread`, { count: totalUnread })
    : t(`${HEADER_MESSAGES_I18N}.open`)
  const unreadBadgeClass = isDesktop
    ? 'absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center text-[9px] font-black text-white bg-red-500 ring-2 ring-white shadow-sm'
    : 'absolute -top-1 -right-1 min-w-[16px] h-4 px-0.5 rounded-full flex items-center justify-center text-[9px] font-black text-white bg-red-500 ring-2 ring-white'

  useEffect(() => {
    if (!open || !isDesktop) return

    function handleClickOutside(event: MouseEvent) {
      const target = event.target
      if (!(target instanceof Node)) return
      if (containerRef.current?.contains(target)) return
      if (target instanceof Element && target.closest(HEADER_MESSAGE_CHAT_ROOT_SELECTOR)) return
      setOpen(false)
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open, isDesktop])

  useMobileMessengerScrollLock(open && !isDesktop)

  const filteredConversations = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return activeTabConversations
    return activeTabConversations.filter((conversation) =>
      conversation.name.toLowerCase().includes(query),
    )
  }, [activeTabConversations, searchQuery])

  const closePanel = () => {
    setOpen(false)
    setSearchQuery('')
    if (!isDesktop) {
      setMobileActiveConversation(null)
    }
  }

  const markConversationRead = (conversationId: string) => {
    markSessionReadMutation.mutate(conversationId)
  }

  const openConversation = (conversation: HeaderMessageConversation) => {
    markConversationRead(conversation.id)

    if (!isDesktop) {
      if (mobileActiveConversation?.id === conversation.id) {
        setMobileActiveConversation(null)
        return
      }
      setMobileActiveConversation(conversation)
      return
    }

    openDesktopConversation(conversation)
  }

  const backToConversationList = () => {
    setMobileActiveConversation(null)
  }

  const closeMobileConversation = () => {
    setMobileActiveConversation(null)
  }

  const togglePanel = () => {
    if (open) {
      closePanel()
      return
    }
    setOpen(true)
  }

  const emptyListVariant = searchQuery.trim()
    ? HeaderMessagesEmptyVariant.Search
    : activeTab === HeaderMessagesTab.Groups
      ? HeaderMessagesEmptyVariant.Groups
      : HeaderMessagesEmptyVariant.Messages

  const conversationList = isSessionsLoading ? (
    <HeaderMessagesListSkeleton t={t} />
  ) : isSessionsError ? (
    <div className="header-messages-list-error" role="alert">
      {t(`${HEADER_MESSAGES_I18N}.loadError`)}
    </div>
  ) : filteredConversations.length > 0 ? (
    filteredConversations.map((conversation) => {
      const rowUnread = conversation.unreadCount ?? 0
      const preview = getConversationPreview(conversation, t)
      const hasPreview = Boolean(preview.trim())
      return (
        <button
          key={conversation.id}
          type="button"
          className={[
            'header-messages-item',
            hasPreview ? '' : 'is-name-only',
            rowUnread > 0 ? 'is-unread' : '',
            (isConversationActive(conversation.id) ? 'is-active' : ''),
          ].filter(Boolean).join(' ')}
          onClick={() => openConversation(conversation)}
        >
          <span className="header-messages-item-avatar" aria-hidden="true">
            {conversation.initials}
          </span>
          <span className="header-messages-item-main">
            <span className="header-messages-item-row">
              <span className="header-messages-item-name">{conversation.name}</span>
              {conversation.updatedAt ? (
                <span className="header-messages-item-time">
                  {formatHeaderMessageDateTime(conversation.updatedAt, currentLanguage)}
                </span>
              ) : null}
            </span>
            {hasPreview ? (
              <span className="header-messages-item-preview">{preview}</span>
            ) : null}
          </span>
          {rowUnread > 0 && (
            <span className="header-messages-item-unread-badge" aria-hidden="true">
              {formatHeaderMessagesUnreadCount(rowUnread)}
            </span>
          )}
        </button>
      )
    })
  ) : (
    <HeaderMessagesEmptyState variant={emptyListVariant} t={t} />
  )

  const listIsEmpty = !isSessionsLoading && !isSessionsError && filteredConversations.length === 0

  const tabs = (
    <div className="header-messages-tabs" role="tablist" aria-label={t(`${HEADER_MESSAGES_I18N}.title`)}>
      <button
        type="button"
        role="tab"
        aria-selected={activeTab === HeaderMessagesTab.Messages}
        className={`header-messages-tab${activeTab === HeaderMessagesTab.Messages ? ' is-active' : ''}`}
        onClick={() => setActiveTab(HeaderMessagesTab.Messages)}
      >
        <MessagesSquare className="header-messages-tab-icon" aria-hidden="true" />
        <span>{t(`${HEADER_MESSAGES_I18N}.tabMessages`)} ({messageCount})</span>
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={activeTab === HeaderMessagesTab.Groups}
        className={`header-messages-tab${activeTab === HeaderMessagesTab.Groups ? ' is-active' : ''}`}
        onClick={() => setActiveTab(HeaderMessagesTab.Groups)}
      >
        <Users className="header-messages-tab-icon" aria-hidden="true" />
        <span>{t(`${HEADER_MESSAGES_I18N}.tabGroups`)} ({groupCount})</span>
      </button>
    </div>
  )

  const searchPlaceholder = t(
    isDesktop ? `${HEADER_MESSAGES_I18N}.searchDesktop` : `${HEADER_MESSAGES_I18N}.searchMobile`,
  )

  const searchField = (
    <div
      className={`header-messages-search-wrap${isDesktop ? ' header-messages-search-wrap--desktop' : ''}`}
    >
      <Search className="header-messages-search-icon" aria-hidden="true" />
      <input
        type="search"
        className="header-messages-search"
        value={searchQuery}
        onChange={(event) => setSearchQuery(event.target.value)}
        placeholder={searchPlaceholder}
        aria-label={searchPlaceholder}
      />
    </div>
  )

  const desktopPanel = open && isDesktop ? (
    <div className="header-messages-panel header-messages-panel--desktop">
      <div className="header-messages-desktop-head">
        <div className="flex items-start gap-3">
          <span className="header-messages-brand-icon" aria-hidden="true">
            <MessagesSquare className="h-5 w-5" />
          </span>
          <div>
            <div className="header-messages-title">{t(`${HEADER_MESSAGES_I18N}.title`)}</div>
            <div className="header-messages-subtitle">{t(`${HEADER_MESSAGES_I18N}.subtitle`)}</div>
          </div>
        </div>
        <button
          type="button"
          className="header-messages-close"
          aria-label={t(`${HEADER_MESSAGES_I18N}.close`)}
          onClick={closePanel}
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
      {searchField}
      {tabs}
      <div className={`header-messages-list${listIsEmpty ? ' header-messages-list--empty' : ''}`}>{conversationList}</div>
    </div>
  ) : null

  const mobileListPage = (
    <div className="header-messages-panel header-messages-panel--mobile">
      <div className="header-messages-mobile-top">
        <button
          type="button"
          className="header-messages-back"
          aria-label={t(`${HEADER_MESSAGES_I18N}.close`)}
          onClick={closePanel}
        >
          <ArrowLeft className="h-5 w-5" aria-hidden="true" />
        </button>
        {searchField}
      </div>
      {tabs}
      <div className={`header-messages-list header-messages-list--mobile${listIsEmpty ? ' header-messages-list--empty' : ''}`}>{conversationList}</div>
    </div>
  )

  const mobilePanel = open && !isDesktop
    ? createPortal(
        mobileActiveConversation ? (
          <HeaderMessageChatWindow
            key={mobileActiveConversation.id}
            conversation={mobileActiveConversation}
            currentUserProfileId={currentUserProfileId}
            layout={HeaderMessageChatLayout.Fullscreen}
            onToggleMinimize={() => undefined}
            onClose={closeMobileConversation}
            onBack={backToConversationList}
          />
        ) : (
          mobileListPage
        ),
        document.body,
      )
    : null

  const desktopChatWindows = isDesktop
    ? desktopChatSessions.map((sessionItem, sessionIndex) => (
      <HeaderMessageChatWindow
        key={sessionItem.conversation.id}
        conversation={sessionItem.conversation}
        currentUserProfileId={currentUserProfileId}
        layout={HeaderMessageChatLayout.Floating}
        minimized={sessionItem.minimized}
        stackRightPx={getHeaderMessageChatStackRightPx(desktopChatSessions, sessionIndex)}
        stackIndex={sessionIndex}
        isFocused={desktopChatFocusId === sessionItem.conversation.id}
        onToggleMinimize={() => toggleDesktopChatMinimize(sessionItem.conversation.id)}
        onClose={() => closeDesktopChat(sessionItem.conversation.id)}
      />
    ))
    : null

  return (
    <>
      <div
        className={isDesktop ? 'relative hidden overflow-visible sm:inline-flex' : 'relative overflow-visible'}
        ref={containerRef}
      >
        <IconButton
          label={messagesButtonLabel}
          aria-expanded={open}
          onClick={togglePanel}
          className={[
            !isDesktop ? 'rounded-xl hover:bg-nexoraCanvas' : '',
            open && !isDesktop ? 'bg-nexoraCanvas text-nexoraBrand' : '',
          ].filter(Boolean).join(' ')}
        >
          <MessagesSquare className="h-5 w-5" aria-hidden="true" />
        </IconButton>
        {totalUnread > 0 && (
          <span className={`${unreadBadgeClass} z-20 pointer-events-none`}>
            {formatHeaderMessagesUnreadCount(totalUnread)}
          </span>
        )}
        {desktopPanel}
      </div>
      {mobilePanel}
      {desktopChatWindows}
    </>
  )
}
