import type { HubConnection } from '@microsoft/signalr'
import type { QueryClient } from '@tanstack/react-query'
import { qk } from '../../data/queryKeys'
import {
  CommunityChatHubEvent,
  createCommunityChatHubConnection,
  joinCommunityChatSession,
  leaveCommunityChatSession,
} from '../../lib/communityChatHub'
import { normalizeCommunityChatMessage } from '../../data/repositories/communityChat'
import type { CommunityChatMessage } from '../../types/communityChat'
import { logger } from '../../utils/logger'

let hubConnection: HubConnection | null = null
let hubStartPromise: Promise<void> | null = null
let hubSubscriberCount = 0
let queryClientRef: QueryClient | null = null
const joinedSessionIds = new Set<string>()

function handleIncomingMessage(rawMessage: CommunityChatMessage) {
  const message = normalizeCommunityChatMessage(rawMessage)
  const sessionId = message.chatSessionId
  if (!sessionId || !queryClientRef) return

  queryClientRef.setQueriesData(
    { queryKey: qk.communityChatMessagesRoot(sessionId) },
    (current: { items?: CommunityChatMessage[]; totalCount?: number } | undefined) => {
      if (!current?.items) return current
      if (current.items.some((item) => item.id === message.id)) return current
      return {
        ...current,
        items: [message, ...current.items],
        totalCount: (current.totalCount ?? current.items.length) + 1,
      }
    },
  )

  queryClientRef.invalidateQueries({ queryKey: qk.communityChatSessions() })
  queryClientRef.invalidateQueries({ queryKey: qk.communityChatSession(sessionId) })
}

async function ensureHubStarted(): Promise<HubConnection | null> {
  if (hubConnection?.state === 'Connected') return hubConnection

  if (!hubConnection) {
    hubConnection = createCommunityChatHubConnection({
      handlers: {
        onReceiveMessage: handleIncomingMessage,
        onMessageError: (message) => {
          logger.warn('Community chat hub send error', message)
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
  joinedSessionIds.clear()

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
  queryClientRef = queryClient
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

export async function joinCommunityChatHubSession(sessionId: string): Promise<void> {
  if (!sessionId || joinedSessionIds.has(sessionId)) return

  const connection = await ensureHubStarted()
  if (!connection) return

  await joinCommunityChatSession(connection, sessionId)
  joinedSessionIds.add(sessionId)
}

export async function leaveCommunityChatHubSession(sessionId: string): Promise<void> {
  if (!sessionId || !joinedSessionIds.has(sessionId)) return

  joinedSessionIds.delete(sessionId)

  if (!hubConnection || hubConnection.state !== 'Connected') return

  try {
    await leaveCommunityChatSession(hubConnection, sessionId)
  } catch (error) {
    logger.warn('Community chat hub leave failed', error)
  }
}

export async function getCommunityChatHubConnection(): Promise<HubConnection | null> {
  try {
    return await ensureHubStarted()
  } catch {
    return null
  }
}

export { CommunityChatHubEvent }
