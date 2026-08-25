import type { HubConnection } from '@microsoft/signalr'
import type { QueryClient } from '@tanstack/react-query'
import { isSameCommunityChatProfileId } from '../../data/communityChatSessionUtils'
import {
  createCommunityChatHubConnection,
  joinCommunityChatSession,
  leaveCommunityChatSession,
} from '../../lib/communityChatHub'
import {
  patchCommunityChatMessagesCache,
  patchCommunityChatSessionLastMessage,
} from '../../data/communityChatCache'
import { normalizeCommunityChatMessage } from '../../data/repositories/communityChat'
import type { CommunityChatMessage } from '../../types/communityChat'
import { logger } from '../../utils/logger'

export const COMMUNITY_CHAT_HUB_MESSAGE_ERROR_EVENT = 'nexora:community-chat-message-error' as const

let hubConnection: HubConnection | null = null
let hubStartPromise: Promise<void> | null = null
let hubSubscriberCount = 0
let queryClientRef: QueryClient | null = null
let currentUserProfileIdRef = ''

/** Ref-count of UI surfaces that need a session's SignalR group. */
const joinedSessionRefCounts = new Map<string, number>()

function handleIncomingMessage(rawMessage: CommunityChatMessage) {
  const message = normalizeCommunityChatMessage(rawMessage)
  const sessionId = message.chatSessionId
  if (!sessionId || !queryClientRef) return

  // Message updates (including deletions via isDeleted flag) are patched into cache
  patchCommunityChatMessagesCache(queryClientRef, message)

  const isOwnMessage = isSameCommunityChatProfileId(message.senderId, currentUserProfileIdRef)
  const sessionIsOpen = (joinedSessionRefCounts.get(sessionId) ?? 0) > 0

  // Keep list preview fresh without invalidating sessions (avoids refetch storms).
  // Only bump unread for someone else's message on a session that is not currently open.
  patchCommunityChatSessionLastMessage(queryClientRef, message, {
    bumpUnread: !isOwnMessage && !sessionIsOpen,
  })
}

function emitHubMessageError(message: string) {
  const text = String(message ?? '').trim()
  if (!text || typeof window === 'undefined') return
  window.dispatchEvent(
    new CustomEvent(COMMUNITY_CHAT_HUB_MESSAGE_ERROR_EVENT, { detail: { message: text } }),
  )
}

async function ensureHubStarted(): Promise<HubConnection | null> {
  if (hubConnection?.state === 'Connected') return hubConnection

  if (!hubConnection) {
    hubConnection = createCommunityChatHubConnection({
      handlers: {
        onReceiveMessage: handleIncomingMessage,
        onMessageError: (message) => {
          logger.warn('Community chat hub send error', message)
          emitHubMessageError(message)
        },
      },
    })
  }

  if (!hubStartPromise) {
    hubStartPromise = hubConnection.start().catch((error) => {
      hubStartPromise = null
      logger.error('Community chat hub failed to start', error)
      throw error
    })
  }

  await hubStartPromise
  return hubConnection
}

async function stopHubIfIdle() {
  if (hubSubscriberCount > 0) return

  hubStartPromise = null
  joinedSessionRefCounts.clear()

  if (!hubConnection) return

  try {
    await hubConnection.stop()
  } catch (error) {
    logger.warn('Community chat hub stop failed', error)
  } finally {
    hubConnection = null
  }
}

export function setCommunityChatQueryClient(queryClient: QueryClient | null) {
  if (queryClient) {
    queryClientRef = queryClient
    return
  }
  // Only clear when no subscribers remain — avoid wiping shared client on modal unmount.
  if (hubSubscriberCount <= 0) {
    queryClientRef = null
  }
}

export function setCommunityChatCurrentUserProfileId(userProfileId: string | null | undefined) {
  currentUserProfileIdRef = String(userProfileId ?? '').trim()
}

export function subscribeCommunityChatHub(): () => void {
  hubSubscriberCount += 1

  void ensureHubStarted().catch(() => {
    // Connection errors are logged in ensureHubStarted.
  })

  return () => {
    hubSubscriberCount = Math.max(0, hubSubscriberCount - 1)
    void stopHubIfIdle()
  }
}

function rollbackJoinRefCount(sessionId: string) {
  const count = joinedSessionRefCounts.get(sessionId) ?? 0
  if (count <= 1) {
    joinedSessionRefCounts.delete(sessionId)
    return
  }
  joinedSessionRefCounts.set(sessionId, count - 1)
}

export async function joinCommunityChatHubSession(sessionId: string): Promise<void> {
  const id = String(sessionId ?? '').trim()
  if (!id) return

  const previousCount = joinedSessionRefCounts.get(id) ?? 0
  joinedSessionRefCounts.set(id, previousCount + 1)
  if (previousCount > 0) return

  let connection: HubConnection | null
  try {
    connection = await ensureHubStarted()
  } catch (error) {
    rollbackJoinRefCount(id)
    throw error
  }

  if (!connection) {
    rollbackJoinRefCount(id)
    return
  }

  try {
    await joinCommunityChatSession(connection, id)
  } catch (error) {
    rollbackJoinRefCount(id)
    throw error
  }
}

/**
 * Ensure the hub group is joined without changing UI ref-counts when already open.
 * Safe to call before SendMessage.
 */
export async function ensureCommunityChatHubSessionJoined(sessionId: string): Promise<void> {
  const id = String(sessionId ?? '').trim()
  if (!id) return

  if ((joinedSessionRefCounts.get(id) ?? 0) > 0) {
    const connection = await ensureHubStarted()
    if (!connection || connection.state !== 'Connected') return
    await joinCommunityChatSession(connection, id)
    return
  }

  await joinCommunityChatHubSession(id)
}

export async function leaveCommunityChatHubSession(sessionId: string): Promise<void> {
  const id = String(sessionId ?? '').trim()
  if (!id) return

  const previousCount = joinedSessionRefCounts.get(id) ?? 0
  if (previousCount <= 0) return

  const nextCount = previousCount - 1
  if (nextCount > 0) {
    joinedSessionRefCounts.set(id, nextCount)
    return
  }

  joinedSessionRefCounts.delete(id)

  if (!hubConnection || hubConnection.state !== 'Connected') return

  try {
    await leaveCommunityChatSession(hubConnection, id)
  } catch (error) {
    logger.warn('Community chat hub leave failed', error)
  }

  // Remount/expand may have joined again while Leave was in flight — restore group membership.
  if ((joinedSessionRefCounts.get(id) ?? 0) > 0 && hubConnection?.state === 'Connected') {
    try {
      await joinCommunityChatSession(hubConnection, id)
    } catch (error) {
      logger.warn('Community chat hub re-join after leave race failed', error)
    }
  }
}

export async function getCommunityChatHubConnection(): Promise<HubConnection | null> {
  try {
    return await ensureHubStarted()
  } catch {
    return null
  }
}

export { CommunityChatHubEvent } from '../../lib/communityChatHub'
