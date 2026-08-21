/**
 * Community Chat SignalR hub client factory.
 * Hub URL: {VITE_API_BASE_URL}/hubs/community-chat
 */

import * as signalR from '@microsoft/signalr'
import { tokenStore } from '../auth/tokenStore'
import { COMMUNITY_CHAT_HUB_PATH } from '../constants/communityChat'
import type {
  CommunityChatHubSendMessagePayload,
  CommunityChatReceiveMessageEvent,
  CommunityChatTypingEvent,
  CommunityChatUserStatusChangedEvent,
} from '../types/communityChat'

/** Client → Server hub method names. */
export const CommunityChatHubMethod = {
  JoinChatSession: 'JoinChatSession',
  LeaveChatSession: 'LeaveChatSession',
  SendMessage: 'SendMessage',
  StartTyping: 'StartTyping',
  StopTyping: 'StopTyping',
} as const

/** Server → Client hub event names. */
export const CommunityChatHubEvent = {
  ReceiveMessage: 'ReceiveMessage',
  UserStatusChanged: 'UserStatusChanged',
  UserStartedTyping: 'UserStartedTyping',
  UserStoppedTyping: 'UserStoppedTyping',
  MessageError: 'MessageError',
} as const

export function getCommunityChatHubUrl(): string {
  const baseUrl = (import.meta.env?.VITE_API_BASE_URL ?? '').replace(/\/$/, '')
  return `${baseUrl}${COMMUNITY_CHAT_HUB_PATH}`
}

export interface CommunityChatHubHandlers {
  onReceiveMessage?: (message: CommunityChatReceiveMessageEvent) => void
  onUserStatusChanged?: (event: CommunityChatUserStatusChangedEvent) => void
  onUserStartedTyping?: (event: CommunityChatTypingEvent) => void
  onUserStoppedTyping?: (event: CommunityChatTypingEvent) => void
  onMessageError?: (message: string) => void
  onReconnecting?: (error?: Error) => void
  onReconnected?: (connectionId?: string) => void
  onClose?: (error?: Error) => void
}

export interface CreateCommunityChatHubConnectionOptions {
  handlers?: CommunityChatHubHandlers
  /** Override hub URL (tests). */
  hubUrl?: string
}

function getAccessToken(): string {
  return tokenStore.get()?.accessToken ?? ''
}

/**
 * Builds a SignalR HubConnection with JWT via accessTokenFactory.
 * Caller owns lifecycle: `await connection.start()` and `connection.stop()`.
 */
export function createCommunityChatHubConnection(
  options: CreateCommunityChatHubConnectionOptions = {},
): signalR.HubConnection {
  const { handlers = {}, hubUrl = getCommunityChatHubUrl() } = options

  const connection = new signalR.HubConnectionBuilder()
    .withUrl(hubUrl, {
      accessTokenFactory: getAccessToken,
    })
    .withAutomaticReconnect()
    .build()

  if (handlers.onReceiveMessage) {
    connection.on(CommunityChatHubEvent.ReceiveMessage, handlers.onReceiveMessage)
  }
  if (handlers.onUserStatusChanged) {
    connection.on(CommunityChatHubEvent.UserStatusChanged, handlers.onUserStatusChanged)
  }
  if (handlers.onUserStartedTyping) {
    connection.on(CommunityChatHubEvent.UserStartedTyping, handlers.onUserStartedTyping)
  }
  if (handlers.onUserStoppedTyping) {
    connection.on(CommunityChatHubEvent.UserStoppedTyping, handlers.onUserStoppedTyping)
  }
  if (handlers.onMessageError) {
    connection.on(CommunityChatHubEvent.MessageError, handlers.onMessageError)
  }
  if (handlers.onReconnecting) {
    connection.onreconnecting(handlers.onReconnecting)
  }
  if (handlers.onReconnected) {
    connection.onreconnected(handlers.onReconnected)
  }
  if (handlers.onClose) {
    connection.onclose(handlers.onClose)
  }

  return connection
}

export async function joinCommunityChatSession(
  connection: signalR.HubConnection,
  sessionId: string,
): Promise<void> {
  await connection.invoke(CommunityChatHubMethod.JoinChatSession, sessionId)
}

export async function leaveCommunityChatSession(
  connection: signalR.HubConnection,
  sessionId: string,
): Promise<void> {
  await connection.invoke(CommunityChatHubMethod.LeaveChatSession, sessionId)
}

export async function sendCommunityChatHubMessage(
  connection: signalR.HubConnection,
  payload: CommunityChatHubSendMessagePayload,
): Promise<void> {
  await connection.invoke(CommunityChatHubMethod.SendMessage, payload)
}

export async function startCommunityChatTyping(
  connection: signalR.HubConnection,
  sessionId: string,
): Promise<void> {
  await connection.invoke(CommunityChatHubMethod.StartTyping, sessionId)
}

export async function stopCommunityChatTyping(
  connection: signalR.HubConnection,
  sessionId: string,
): Promise<void> {
  await connection.invoke(CommunityChatHubMethod.StopTyping, sessionId)
}
