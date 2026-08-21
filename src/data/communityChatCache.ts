import type { InfiniteData, QueryClient } from '@tanstack/react-query'
import type { CommunityChatMessage, CommunityChatMessagesPage, CommunityChatSession } from '../types/communityChat'
import { applyLastMessageToSession } from './communityChatSessionUtils'
import { qk } from './queryKeys'

function insertMessageNewestFirst(
  items: CommunityChatMessage[],
  message: CommunityChatMessage,
): CommunityChatMessage[] {
  if (items.some((item) => item.id === message.id)) return items
  return [message, ...items]
}

function patchMessagesPage(
  page: CommunityChatMessagesPage,
  message: CommunityChatMessage,
): CommunityChatMessagesPage {
  const items = insertMessageNewestFirst(page.items ?? [], message)
  if (items === page.items) return page
  return {
    ...page,
    items,
    totalCount: (page.totalCount ?? page.items.length) + 1,
  }
}

function isInfiniteMessagesData(
  value: unknown,
): value is InfiniteData<CommunityChatMessagesPage> {
  return Boolean(
    value
    && typeof value === 'object'
    && Array.isArray((value as InfiniteData<CommunityChatMessagesPage>).pages),
  )
}

/** Insert a realtime/sent message into single-page or infinite message caches. */
export function patchCommunityChatMessagesCache(
  queryClient: QueryClient,
  message: CommunityChatMessage,
) {
  const sessionId = message.chatSessionId
  if (!sessionId) return

  queryClient.setQueriesData(
    { queryKey: qk.communityChatMessagesRoot(sessionId) },
    (current: unknown) => {
      if (!current) return current

      if (isInfiniteMessagesData(current)) {
        if (current.pages.some((page) => page.items?.some((item) => item.id === message.id))) {
          return current
        }
        const [firstPage, ...restPages] = current.pages
        if (!firstPage) {
          return {
            ...current,
            pages: [{
              items: [message],
              pageNumber: 1,
              totalPages: 1,
              totalCount: 1,
              hasPreviousPage: false,
              hasNextPage: false,
            }],
          }
        }
        return {
          ...current,
          pages: [patchMessagesPage(firstPage, message), ...restPages],
        }
      }

      const page = current as CommunityChatMessagesPage
      if (!Array.isArray(page.items)) return current
      return patchMessagesPage(page, message)
    },
  )
}

export function patchCommunityChatSessionLastMessage(
  queryClient: QueryClient,
  message: CommunityChatMessage,
  { bumpUnread = false }: { bumpUnread?: boolean } = {},
) {
  const sessionId = message.chatSessionId
  if (!sessionId) return

  queryClient.setQueryData<CommunityChatSession[]>(
    qk.communityChatSessions(),
    (current) => (
      current
        ? current.map((session) => {
          if (session.id !== sessionId) return session
          const next = applyLastMessageToSession(session, message)
          if (!bumpUnread) return next
          return { ...next, unreadCount: (session.unreadCount ?? 0) + 1 }
        })
        : current
    ),
  )

  queryClient.setQueryData<CommunityChatSession>(
    qk.communityChatSession(sessionId),
    (current) => {
      if (!current) return current
      const next = applyLastMessageToSession(current, message)
      if (!bumpUnread) return next
      return { ...next, unreadCount: (current.unreadCount ?? 0) + 1 }
    },
  )
}

/** Keep client-enriched last-message fields across sessions list refetches. */
export function mergeCommunityChatSessionPreviews(
  fresh: CommunityChatSession[],
  previous: CommunityChatSession[] | undefined,
): CommunityChatSession[] {
  if (!previous?.length) return fresh

  const previewById = new Map(
    previous
      .filter((session) => session.lastMessageContent != null || session.lastMessageType != null)
      .map((session) => [
        session.id,
        {
          lastMessageContent: session.lastMessageContent,
          lastMessageType: session.lastMessageType,
        },
      ]),
  )

  return fresh.map((session) => {
    const preview = previewById.get(session.id)
    return preview ? { ...session, ...preview } : session
  })
}

function removeMessageFromItems(
  items: CommunityChatMessage[],
  messageId: string,
): CommunityChatMessage[] | null {
  const next = items.filter((item) => item.id !== messageId)
  return next.length === items.length ? null : next
}

function collectNewestMessageFromCache(
  queryClient: QueryClient,
  sessionId: string,
): CommunityChatMessage | null {
  const caches = queryClient.getQueriesData({
    queryKey: qk.communityChatMessagesRoot(sessionId),
  })

  let newest: CommunityChatMessage | null = null
  for (const [, data] of caches) {
    if (!data) continue
    const pages = isInfiniteMessagesData(data)
      ? data.pages
      : Array.isArray((data as CommunityChatMessagesPage).items)
        ? [data as CommunityChatMessagesPage]
        : []

    for (const page of pages) {
      for (const message of page.items ?? []) {
        if (!newest) {
          newest = message
          continue
        }
        const newestAt = Date.parse(newest.sentAt || '') || 0
        const messageAt = Date.parse(message.sentAt || '') || 0
        if (messageAt > newestAt) newest = message
      }
    }
  }
  return newest
}

function clearSessionLastMessage(
  session: CommunityChatSession,
): CommunityChatSession {
  return {
    ...session,
    lastMessageAt: null,
    lastMessageContent: null,
    lastMessageType: null,
  }
}

function syncSessionPreviewAfterDelete(
  queryClient: QueryClient,
  sessionId: string,
) {
  const newest = collectNewestMessageFromCache(queryClient, sessionId)

  queryClient.setQueryData<CommunityChatSession[]>(
    qk.communityChatSessions(),
    (current) => (
      current
        ? current.map((session) => {
          if (session.id !== sessionId) return session
          return newest
            ? applyLastMessageToSession(session, newest)
            : clearSessionLastMessage(session)
        })
        : current
    ),
  )

  queryClient.setQueryData<CommunityChatSession>(
    qk.communityChatSession(sessionId),
    (current) => {
      if (!current) return current
      return newest
        ? applyLastMessageToSession(current, newest)
        : clearSessionLastMessage(current)
    },
  )
}

/** Soft-delete: drop a message from single-page / infinite caches and refresh list preview. */
export function removeCommunityChatMessageFromCache(
  queryClient: QueryClient,
  sessionId: string,
  messageId: string,
) {
  if (!sessionId || !messageId) return

  queryClient.setQueriesData(
    { queryKey: qk.communityChatMessagesRoot(sessionId) },
    (current: unknown) => {
      if (!current) return current

      if (isInfiniteMessagesData(current)) {
        let changed = false
        const pages = current.pages.map((page) => {
          const items = removeMessageFromItems(page.items ?? [], messageId)
          if (!items) return page
          changed = true
          return {
            ...page,
            items,
            totalCount: Math.max(0, (page.totalCount ?? page.items.length) - 1),
          }
        })
        return changed ? { ...current, pages } : current
      }

      const page = current as CommunityChatMessagesPage
      if (!Array.isArray(page.items)) return current
      const items = removeMessageFromItems(page.items, messageId)
      if (!items) return current
      return {
        ...page,
        items,
        totalCount: Math.max(0, (page.totalCount ?? page.items.length) - 1),
      }
    },
  )

  syncSessionPreviewAfterDelete(queryClient, sessionId)
}
