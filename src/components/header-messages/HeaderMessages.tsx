import { ArrowLeft, MessagesSquare, Plus, Search, Store, Users, X } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/useAuth'
import { useSessionRole } from '../../auth/useSessionRole'
import { useIsMobileUI } from '../../hooks/useIsMobileUI'
import { buildMerchantStaffListPath, resolveStaffRouteFamily } from '../dashboard/routes/staffRoutePaths'
import { buildStaffSalonsListPath } from '../staff-dashboard/staffSalonPaths'
import {
  CommunityChatType,
  isPendingCommunityChatSessionId,
} from '../../constants/communityChat'
import {
  useCommunityChatSession,
  useCommunityChatSessions,
  useCreateCommunityChatSession,
  useMarkCommunityChatSessionRead,
} from '../../data/hooks/useCommunityChat'
import { useHydrateCommunityChatLastMessagePreviews } from '../../data/hooks/useHydrateCommunityChatLastMessagePreviews'
import { useProfileSettings } from '../../data/hooks/useProfileSettings'
import { useStaffBusinesses } from '../../data/hooks/useStaffSelf'
import type { CommunityChatSession } from '../../types/communityChat'
import {
  dedupeCommunityChatSessions,
  isSameCommunityChatProfileId,
} from '../../data/communityChatSessionUtils'
import { useTranslation } from '../../contexts/LanguageContext'
import { useNotification } from '../../contexts/NotificationContext'
import {
  buildStaffChatConversation,
  findStaffCommunityChatSession,
  getStaffChatWindowKey,
  trimStaffChatId,
} from '../staff/staffCommunityChatUtils'
import { STAFF_CHAT_ENSURE_SESSION_PRECONDITION_ERROR } from '../staff/constants'
import IconButton from '../ui/IconButton'
import CreateCommunityChatGroupModal from './CreateCommunityChatGroupModal'
import HeaderMessageChatWindow from './HeaderMessageChatWindow'
import HeaderMessagesEmptyState from './HeaderMessagesEmptyState'
import HeaderMessagesListSkeleton from './HeaderMessagesListSkeleton'
import HeaderMessagesStaffChatCta from './HeaderMessagesStaffChatCta'
import {
  formatHeaderMessagesUnreadCount,
  getMessengerDirectoryCta,
  HEADER_MESSAGES_I18N,
  MESSENGER_DIRECTORY_CTA_I18N,
  MessengerDirectoryRole,
  resolveMessengerDirectoryRole,
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
  OPEN_STAFF_COMMUNITY_CHAT_EVENT,
  normalizeOpenStaffCommunityChatDetail,
  type OpenCommunityChatSessionDetail,
  type OpenStaffCommunityChatDetail,
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
  currentUserProfileId: string,
  t: (key: string, params?: Record<string, string | number>) => string,
): string {
  const chatTk = `${HEADER_MESSAGES_I18N}.chat`
  let preview = ''
  if (conversation.lastMessagePreviewText) {
    preview = conversation.lastMessagePreviewText
  } else if (conversation.lastMessagePreviewKey) {
    // Skip showing the previewKey fallback text (e.g. "Open 1:1 conversation")
    preview = ''
  } else if (conversation.updatedAt) {
    preview = t(`${chatTk}.lastMessageFallback`)
  }

  if (!preview) return ''

  if (isSameCommunityChatProfileId(conversation.lastMessageSenderId, currentUserProfileId)) {
    return `${t(`${chatTk}.you`)}: ${preview}`
  }
  return preview
}

const DIRECTORY_LIST_PATH: Record<
  MessengerDirectoryRole,
  (startChatHint: boolean, isMobile: boolean) => string
> = {
  [MessengerDirectoryRole.Owner]: (startChatHint, isMobile) => (
    buildMerchantStaffListPath({
      startChatHint,
      family: resolveStaffRouteFamily(isMobile),
    })
  ),
  [MessengerDirectoryRole.Staff]: (startChatHint) => (
    buildStaffSalonsListPath({ startChatHint })
  ),
}

const DIRECTORY_CTA_ICON = {
  [MessengerDirectoryRole.Owner]: Users,
  [MessengerDirectoryRole.Staff]: Store,
} as const

export default function HeaderMessages({ variant }: HeaderMessagesProps) {
  const { t, currentLanguage } = useTranslation()
  const { showToast } = useNotification()
  const navigate = useNavigate()
  const { session, status } = useAuth()
  const containerRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<HeaderMessagesTab>(HeaderMessagesTab.Messages)
  const [searchQuery, setSearchQuery] = useState('')
  const [mobileActiveConversation, setMobileActiveConversation] = useState<HeaderMessageConversation | null>(null)
  const [pendingOpenSessionId, setPendingOpenSessionId] = useState<string | null>(null)
  const [pendingStaffChat, setPendingStaffChat] = useState<OpenStaffCommunityChatDetail | null>(null)
  /** Mobile staff/non-header open → true edge-to-edge chat (covers app header). */
  const [mobileImmersiveChat, setMobileImmersiveChat] = useState(false)
  /** US-111 — "Create group" staff picker (Merchant Owner only, see canCreateGroup below). */
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false)

  const currentUserProfileId = session?.id ?? ''
  const isAuthenticated = status === 'authenticated'
  const { isOwner, isStaff } = useSessionRole()
  const directoryRole = resolveMessengerDirectoryRole(isOwner, isStaff)
  // US-111 V1 — only Merchant Owner can create groups; Staff-Manager parity needs a
  // "list my business coworkers" endpoint the Staff API doesn't expose yet (see US-111 Out of Scope).
  const canCreateGroup = directoryRole === MessengerDirectoryRole.Owner
  const canRenameGroup = directoryRole === MessengerDirectoryRole.Owner
  const isDesktop = variant === HeaderMessagesVariant.Desktop
  const isMobileUI = useIsMobileUI()
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
    || Boolean(pendingStaffChat)
    || desktopChatSessions.length > 0
  )

  // Always load sessions when authenticated to show unread badge immediately
  const shouldLoadSessionList = isAuthenticated

  // Enable realtime connection when authenticated to receive unread count updates
  useCommunityChatRealtime({ enabled: isAuthenticated })

  const {
    data: chatSessions = [],
    isLoading: isSessionsLoading,
    isError: isSessionsError,
  } = useCommunityChatSessions({ enabled: shouldLoadSessionList })

  const { data: pendingSession, isError: isPendingSessionError, isFetched: isPendingSessionFetched } = useCommunityChatSession(
    pendingOpenSessionId,
    { enabled: Boolean(pendingOpenSessionId) },
  )

  const { data: staffBusinesses = [] } = useStaffBusinesses({
    enabled: isAuthenticated && isStaff,
  })
  const { data: profile } = useProfileSettings({
    enabled: isAuthenticated && !isStaff,
  })

  const createSessionMutation = useCreateCommunityChatSession()
  const merchantBusinessId = String(
    profile?.business?.businessId ?? profile?.business?.id ?? '',
  ).trim()

  const { businessNameById, salonOwnerIdByBusinessId } = useMemo(() => {
    const businessNameById = new Map<string, string>()
    const salonOwnerIdByBusinessId = new Map<string, string>()

    staffBusinesses.forEach((business) => {
      const id = trimStaffChatId(business.businessId)
      if (!id) return
      const name = String(business.businessName ?? '').trim()
      if (name) businessNameById.set(id, name)
      const ownerId = trimStaffChatId(business.ownerUserProfileId)
      if (ownerId) salonOwnerIdByBusinessId.set(id, ownerId)
    })

    const merchantId = String(
      profile?.business?.businessId ?? profile?.business?.id ?? '',
    ).trim()
    const merchantBusinessName = String(
      profile?.business?.businessName ?? profile?.business?.name ?? '',
    ).trim()
    if (merchantId && merchantBusinessName) {
      businessNameById.set(merchantId, merchantBusinessName)
    }

    return { businessNameById, salonOwnerIdByBusinessId }
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

  const conversationById = useMemo(
    () => new Map(conversations.map((conversation) => [conversation.id, conversation])),
    [conversations],
  )

  // Open windows hold a snapshot taken when opened — take the title from the (refetched) session
  // list so a group rename shows up in the window header.
  const withLiveTitle = useCallback((conversation: HeaderMessageConversation): HeaderMessageConversation => {
    const live = conversationById.get(conversation.id)
    if (!live || live.name === conversation.name) return conversation
    return { ...conversation, name: live.name, initials: live.initials }
  }, [conversationById])

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
    function isDesktopViewport(): boolean {
      return window.matchMedia('(min-width: 1024px)').matches
    }

    function handleOpenStaffCommunityChat(event: Event) {
      // Mobile + desktop HeaderMessages can both be mounted; only the
      // viewport-matching instance should open.
      if (isDesktop !== isDesktopViewport()) return

      const detail = normalizeOpenStaffCommunityChatDetail(
        (event as CustomEvent<OpenStaffCommunityChatDetail>).detail,
      )
      if (!detail) return

      const optimistic = buildStaffChatConversation({
        chatSessionId: null,
        windowKey: getStaffChatWindowKey({
          userProfileId: detail.peerUserProfileId,
          businessId: detail.businessId,
        }),
        displayName: detail.displayName,
        peerUserProfileId: detail.peerUserProfileId,
        businessId: detail.businessId,
      })

      if (isDesktop) {
        // Desktop: floating messenger window (same as header conversation open).
        ensureDesktopConversationOpen(optimistic)
      } else {
        // Non-header entry (staff page, etc.): true fullscreen over app chrome.
        setMobileImmersiveChat(true)
        setMobileActiveConversation(optimistic)
        setOpen(true)
        setActiveTab(HeaderMessagesTab.Messages)
      }
      setPendingStaffChat(detail)
    }

    window.addEventListener(OPEN_STAFF_COMMUNITY_CHAT_EVENT, handleOpenStaffCommunityChat)
    return () => {
      window.removeEventListener(OPEN_STAFF_COMMUNITY_CHAT_EVENT, handleOpenStaffCommunityChat)
    }
  }, [ensureDesktopConversationOpen, isDesktop])

  useEffect(() => {
    if (!pendingStaffChat) return
    if (isSessionsLoading) return

    const existing = findStaffCommunityChatSession(
      {
        userProfileId: pendingStaffChat.peerUserProfileId,
        fullName: pendingStaffChat.displayName,
        businessId: pendingStaffChat.businessId,
      },
      dedupedChatSessions,
      currentUserProfileId,
    )

    if (existing?.id) {
      const conversation = mapCommunityChatSessionToConversation(
        existing,
        currentUserProfileId,
        listPreviewKey,
        titleMapOptions,
      )
      markSessionReadMutation.mutate(conversation.id)
      if (isDesktop) {
        ensureDesktopConversationOpen(conversation)
      } else {
        setMobileActiveConversation(conversation)
      }
    }

    setPendingStaffChat(null)
    // Intentionally omit markSessionReadMutation — use .mutate only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    currentUserProfileId,
    dedupedChatSessions,
    ensureDesktopConversationOpen,
    isDesktop,
    isSessionsLoading,
    listPreviewKey,
    pendingStaffChat,
    titleMapOptions,
  ])

  const ensureStaffPeerSession = useCallback(async (conversation: HeaderMessageConversation) => {
    if (!isPendingCommunityChatSessionId(conversation.id)) return conversation.id
    const businessId = trimStaffChatId(conversation.businessId) || merchantBusinessId
    const existing = findStaffCommunityChatSession(
      {
        userProfileId: conversation.peerUserProfileId,
        fullName: conversation.name,
        businessId,
      },
      dedupedChatSessions,
      currentUserProfileId,
    )
    if (existing?.id) return existing.id

    const peerUserProfileId = trimStaffChatId(conversation.peerUserProfileId)
      || salonOwnerIdByBusinessId.get(businessId)
      || ''
    if (!peerUserProfileId || !businessId) {
      throw new Error(STAFF_CHAT_ENSURE_SESSION_PRECONDITION_ERROR)
    }

    const session = await createSessionMutation.mutateAsync({
      businessId,
      participantUserProfileIds: [peerUserProfileId],
    })

    const nextConversation: HeaderMessageConversation = {
      ...conversation,
      id: session.id,
      peerUserProfileId: null,
    }

    if (isDesktop) {
      ensureDesktopConversationOpen(nextConversation)
    } else {
      setMobileActiveConversation(nextConversation)
    }
    return session.id
  }, [
    createSessionMutation,
    currentUserProfileId,
    dedupedChatSessions,
    ensureDesktopConversationOpen,
    isDesktop,
    merchantBusinessId,
    salonOwnerIdByBusinessId,
  ])

  const handleGroupCreated = useCallback((session: CommunityChatSession) => {
    const conversation = mapCommunityChatSessionToConversation(
      session,
      currentUserProfileId,
      listPreviewKey,
      titleMapOptions,
    )

    if (isDesktop) {
      ensureDesktopConversationOpen(conversation)
    } else {
      setMobileActiveConversation(conversation)
      setOpen(true)
    }

    setActiveTab(HeaderMessagesTab.Groups)
    setIsCreateGroupOpen(false)
  }, [currentUserProfileId, ensureDesktopConversationOpen, isDesktop, listPreviewKey, titleMapOptions])

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
    setMobileImmersiveChat(false)
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
      setMobileImmersiveChat(false)
      if (mobileActiveConversation?.id === conversation.id) {
        setMobileActiveConversation(null)
        return
      }
      setMobileActiveConversation(conversation)
      return
    }

    // Close the messages panel when opening a conversation on desktop
    setOpen(false)
    openDesktopConversation(conversation)
  }

  const backToConversationList = () => {
    if (mobileImmersiveChat) {
      closePanel()
      return
    }
    setMobileActiveConversation(null)
  }

  const closeMobileConversation = () => {
    if (mobileImmersiveChat) {
      closePanel()
      return
    }
    setMobileActiveConversation(null)
  }

  const togglePanel = () => {
    if (open) {
      closePanel()
      return
    }
    setMobileImmersiveChat(false)
    setOpen(true)
  }

  const emptyListVariant = searchQuery.trim()
    ? HeaderMessagesEmptyVariant.Search
    : activeTab === HeaderMessagesTab.Groups
      ? HeaderMessagesEmptyVariant.Groups
      : HeaderMessagesEmptyVariant.Messages

  const goToDirectory = (startChatHint: boolean) => {
    if (!directoryRole) return
    closePanel()
    navigate(DIRECTORY_LIST_PATH[directoryRole](startChatHint, isMobileUI))
  }

  const directoryUi = directoryRole
    ? {
        cta: getMessengerDirectoryCta(directoryRole, filteredConversations.length > 0),
        Icon: DIRECTORY_CTA_ICON[directoryRole],
        emptyDescriptionKey: MESSENGER_DIRECTORY_CTA_I18N[directoryRole].emptyDescription,
      }
    : null

  const showDirectoryEmptyCta = Boolean(directoryUi)
    && emptyListVariant === HeaderMessagesEmptyVariant.Messages

  const showDirectoryFooterCta = Boolean(directoryUi)
    && activeTab === HeaderMessagesTab.Messages
    && !searchQuery.trim()
    && !isSessionsLoading
    && !isSessionsError
    && (filteredConversations.length > 0 || !isDesktop)

  const directoryCtaFooter = showDirectoryFooterCta && directoryUi ? (
    <div className="header-messages-staff-cta-footer">
      <HeaderMessagesStaffChatCta
        variant={directoryUi.cta.variant}
        label={t(directoryUi.cta.labelKey)}
        Icon={directoryUi.Icon}
        onClick={() => goToDirectory(directoryUi.cta.startChatHint)}
      />
    </div>
  ) : null

  const conversationList = isSessionsLoading ? (
    <HeaderMessagesListSkeleton t={t} />
  ) : isSessionsError ? (
    <div className="header-messages-list-error" role="alert">
      {t(`${HEADER_MESSAGES_I18N}.loadError`)}
    </div>
  ) : filteredConversations.length > 0 ? (
    filteredConversations.map((conversation) => {
      const rowUnread = conversation.unreadCount ?? 0
      const preview = getConversationPreview(conversation, currentUserProfileId, t)
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
    <HeaderMessagesEmptyState
      variant={emptyListVariant}
      t={t}
      descriptionKey={showDirectoryEmptyCta ? directoryUi?.emptyDescriptionKey : undefined}
      actionLabel={showDirectoryEmptyCta && isDesktop && directoryUi ? t(directoryUi.cta.labelKey) : undefined}
      actionIcon={directoryUi?.Icon}
      onAction={showDirectoryEmptyCta && isDesktop && directoryUi ? () => goToDirectory(true) : undefined}
    />
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

  const createGroupRow = activeTab === HeaderMessagesTab.Groups && canCreateGroup ? (
    <div className="header-messages-create-group-row">
      <button
        type="button"
        className="header-messages-create-group-btn"
        onClick={() => setIsCreateGroupOpen(true)}
      >
        <Plus className="h-3.5 w-3.5" aria-hidden="true" />
        <span>{t(`${HEADER_MESSAGES_I18N}.createGroup`)}</span>
      </button>
    </div>
  ) : null

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
      {createGroupRow}
      <div className={`header-messages-list${listIsEmpty ? ' header-messages-list--empty' : ''}`}>{conversationList}</div>
      {directoryCtaFooter}
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
      {createGroupRow}
      <div className={`header-messages-list header-messages-list--mobile${listIsEmpty ? ' header-messages-list--empty' : ''}`}>{conversationList}</div>
      {directoryCtaFooter}
    </div>
  )

  const mobilePanel = open && !isDesktop
    ? createPortal(
        mobileActiveConversation ? (
          <HeaderMessageChatWindow
            key={mobileActiveConversation.id}
            conversation={withLiveTitle(mobileActiveConversation)}
            canRenameGroup={canRenameGroup}
            currentUserProfileId={currentUserProfileId}
            layout={HeaderMessageChatLayout.Fullscreen}
            immersive={mobileImmersiveChat}
            isConversationLoading={
              Boolean(pendingStaffChat)
              && isSessionsLoading
              && isPendingCommunityChatSessionId(mobileActiveConversation.id)
            }
            ensureSessionId={
              isPendingCommunityChatSessionId(mobileActiveConversation.id)
                ? () => ensureStaffPeerSession(mobileActiveConversation)
                : undefined
            }
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
    ? desktopChatSessions.map((sessionItem, sessionIndex) => {
      const conversation = sessionItem.conversation
      const isPendingPeer = isPendingCommunityChatSessionId(conversation.id)
      return (
        <HeaderMessageChatWindow
          key={conversation.id}
          conversation={withLiveTitle(conversation)}
          canRenameGroup={canRenameGroup}
          currentUserProfileId={currentUserProfileId}
          layout={HeaderMessageChatLayout.Floating}
          minimized={sessionItem.minimized}
          stackRightPx={getHeaderMessageChatStackRightPx(desktopChatSessions, sessionIndex)}
          stackIndex={sessionIndex}
          isFocused={desktopChatFocusId === conversation.id}
          isConversationLoading={Boolean(pendingStaffChat) && isSessionsLoading && isPendingPeer}
          ensureSessionId={
            isPendingPeer
              ? () => ensureStaffPeerSession(conversation)
              : undefined
          }
          onToggleMinimize={() => toggleDesktopChatMinimize(conversation.id)}
          onClose={() => closeDesktopChat(conversation.id)}
        />
      )
    })
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
      {canCreateGroup && (
        <CreateCommunityChatGroupModal
          open={isCreateGroupOpen}
          businessId={merchantBusinessId}
          onClose={() => setIsCreateGroupOpen(false)}
          onCreated={handleGroupCreated}
        />
      )}
    </>
  )
}
