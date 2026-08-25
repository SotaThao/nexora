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
  removeCommunityChatMessageFromCache,
} from '../../data/communityChatCache'
import { normalizeCommunityChatMessage } from '../../data/repositories/communityChat'
import type { CommunityChatMessage, CommunityChatMessageDeletedEvent } from '../../types/communityChat'
import { logger } from '../../utils/logger'

export const COMMUNITY_CHAT_HUB_MESSAGE_ERROR_EVENT = 'nexora:community-chat-message-error' as const

let hubConnection: HubConnection | null = null
let hubStartPromise: Promise<void> | null = null
let hubSubscriberCount = 0
let queryClientRef: QueryClient | null = null
let currentUserProfileIdRef = ''

/** Ref-count of UI surfaces that need a session's SignalR group. */
const joinedSessionRefCounts = new Map<string, number>()

/** Track sessions that have been joined (including temp joins from ensureJoined). */
const actuallyJoinedSessions = new Set<string>()

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

function handleMessageDeleted(event: CommunityChatMessageDeletedEvent) {
  if (!event.chatSessionId || !event.messageId || !queryClientRef) return

  // Remove message from cache for real-time deletion across all clients
  removeCommunityChatMessageFromCache(queryClientRef, event.chatSessionId, event.messageId)
}

function emitHubMessageError(message: string) {
  const text = String(message ?? '').trim()
  if (!text || typeof window === 'undefined') return
  window.dispatchEvent(
    new CustomEvent(COMMUNITY_CHAT_HUB_MESSAGE_ERROR_EVENT, { detail: { message: text } }),
  )
}

/**
 * Rejoin all active sessions after reconnection.
 * SignalR automatically reconnects but does NOT restore group memberships.
 */
async function handleReconnected() {
  logger.info('Community chat hub reconnected, rejoining sessions...')
  
  if (!hubConnection || hubConnection.state !== 'Connected') {
    logger.warn('Cannot rejoin sessions: hub not connected')
    return
  }

  // SignalR reconnect loses group memberships; clear join-tracking so
  // future joins are not skipped.
  actuallyJoinedSessions.clear()

  // Rejoin all sessions that have active UI references
  const sessionsToRejoin = Array.from(joinedSessionRefCounts.keys())
  
  if (sessionsToRejoin.length === 0) {
    logger.info('No sessions to rejoin')
    return
  }

  logger.info(`Rejoining ${sessionsToRejoin.length} active sessions`)
  
  for (const sessionId of sessionsToRejoin) {
    try {
      await joinCommunityChatSession(hubConnection, sessionId)
      logger.info(`Rejoined session: ${sessionId}`)
    } catch (error) {
      logger.error(`Failed to rejoin session ${sessionId}`, error)
    }
  }
}

async function ensureHubStarted(): Promise<HubConnection | null> {
  if (hubConnection?.state === 'Connected') return hubConnection

  if (!hubConnection) {
    hubConnection = createCommunityChatHubConnection({
      handlers: {
        onReceiveMessage: handleIncomingMessage,
        onMessageDeleted: handleMessageDeleted,
        onMessageError: (message) => {
          logger.warn('Community chat hub send error', message)
          emitHubMessageError(message)
        },
        onReconnected: () => {
          void handleReconnected()
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

  // Wait for connection to be fully ready (state === 'Connected')
  // This handles the case where start() completes but connection is still transitioning
  const maxWaitMs = 5000
  const startTime = Date.now()
  while (hubConnection.state !== 'Connected' && Date.now() - startTime < maxWaitMs) {
    if (hubConnection.state === 'Disconnected') {
      throw new Error('Hub connection disconnected during startup')
    }
    await new Promise(resolve => setTimeout(resolve, 100))
  }

  if (hubConnection.state !== 'Connected') {
    logger.warn('Hub connection not ready after timeout, state:', hubConnection.state)
  }

  return hubConnection
}

async function stopHubIfIdle() {
  if (hubSubscriberCount > 0) return

  hubStartPromise = null
  joinedSessionRefCounts.clear()
  actuallyJoinedSessions.clear()

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
  
  // If already joined (either from previous UI ref or temp join), just increment ref count
  if (previousCount > 0 || actuallyJoinedSessions.has(id)) return

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
    actuallyJoinedSessions.add(id)
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

  // If already joined (either from UI or previous temp join), we're done
  if (actuallyJoinedSessions.has(id)) {
    return
  }

  // Not yet joined - join now without incrementing UI ref count (temp join for sending message)
  const connection = await ensureHubStarted()
  if (!connection) return

  try {
    await joinCommunityChatSession(connection, id)
    actuallyJoinedSessions.add(id)
  } catch (error) {
    logger.warn('ensureCommunityChatHubSessionJoined failed', error)
    throw error
  }
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
    actuallyJoinedSessions.delete(id)
  } catch (error) {
    logger.warn('Community chat hub leave failed', error)
  }

  // Remount/expand may have joined again while Leave was in flight — restore group membership.
  if ((joinedSessionRefCounts.get(id) ?? 0) > 0 && hubConnection?.state === 'Connected') {
    try {
      await joinCommunityChatSession(hubConnection, id)
      actuallyJoinedSessions.add(id)
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
