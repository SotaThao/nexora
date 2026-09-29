/**
 * communityChatRepository — REST API for Community Chat (US-101 → US-107).
 */

import {
  COMMUNITY_CHAT_DEFAULT_PAGE_SIZE,
  COMMUNITY_CHAT_REST_BASE,
  CommunityChatMessageType,
  CommunityChatStatus,
  CommunityChatType,
} from '../../constants/communityChat'
import httpClient from '../../lib/httpClient'
import { parseApiUtcDateTime } from '../../utils/localDate'
import type {
  AddCommunityChatParticipantInput,
  CommunityChatMessage,
  CommunityChatMessageCallMetadata,
  CommunityChatMessagesPage,
  CommunityChatParticipant,
  CommunityChatSession,
  CreateCommunityChatSessionInput,
  RenameCommunityChatSessionInput,
  SendCommunityChatMessageInput,
} from '../../types/communityChat'

type HttpClient = typeof httpClient

/** API datetimes are UTC; normalize bare ISO to `...Z` so clients parse consistently. */
function normalizeCommunityChatTimestamp(value: string | null | undefined): string | null {
  if (value == null) return null
  const trimmed = String(value).trim()
  if (!trimmed) return null
  const date = parseApiUtcDateTime(trimmed)
  return date ? date.toISOString() : trimmed
}

interface CommunityChatParticipantApiDto {
  userProfileId?: string
  UserProfileId?: string
  fullName?: string | null
  FullName?: string | null
  avatarUrl?: string | null
  AvatarUrl?: string | null
  isActive?: boolean
  IsActive?: boolean
  joinedAt?: string | null
  JoinedAt?: string | null
  lastReadAt?: string | null
  LastReadAt?: string | null
}

interface CommunityChatSessionApiDto {
  id?: string
  businessId?: string
  title?: string | null
  chatType?: string
  status?: string
  createdByUserProfileId?: string
  lastMessageAt?: string | null
  lastMessagePreview?: string | null
  lastMessageType?: string | null
  lastMessageSenderId?: string | null
  unreadCount?: number
  participants?: CommunityChatParticipantApiDto[]
}

interface CommunityChatMessageApiDto {
  id?: string
  Id?: string
  chatSessionId?: string
  ChatSessionId?: string
  senderId?: string
  SenderId?: string
  senderName?: string | null
  SenderName?: string | null
  senderAvatarUrl?: string | null
  SenderAvatarUrl?: string | null
  content?: string
  Content?: string
  messageType?: string
  MessageType?: string
  sentAt?: string
  SentAt?: string
  editedAt?: string | null
  EditedAt?: string | null
  isDeleted?: boolean
  IsDeleted?: boolean
  /** JSON string (US-04 backend) — parsed by `normalizeCommunityChatMessageMetadata`. */
  metadata?: string | null
  Metadata?: string | null
}

interface CommunityChatMessagesPageApiDto {
  items?: CommunityChatMessageApiDto[]
  pageNumber?: number
  totalPages?: number
  totalCount?: number
  hasPreviousPage?: boolean
  hasNextPage?: boolean
}

function normalizeChatType(raw: string | undefined): CommunityChatType {
  if (raw === CommunityChatType.Group) return CommunityChatType.Group
  return CommunityChatType.OneOnOne
}

function normalizeChatStatus(raw: string | undefined): CommunityChatStatus {
  if (raw === CommunityChatStatus.Archived) return CommunityChatStatus.Archived
  return CommunityChatStatus.Active
}

function normalizeMessageType(raw: string | undefined): CommunityChatMessageType {
  switch (raw) {
    case CommunityChatMessageType.Image:
      return CommunityChatMessageType.Image
    case CommunityChatMessageType.File:
      return CommunityChatMessageType.File
    case CommunityChatMessageType.System:
      return CommunityChatMessageType.System
    case CommunityChatMessageType.Call:
      return CommunityChatMessageType.Call
    default:
      return CommunityChatMessageType.Text
  }
}

function normalizeOptionalMessageType(
  raw: string | null | undefined,
): CommunityChatMessageType | null {
  if (raw == null) return null
  const trimmed = String(raw).trim()
  if (!trimmed) return null
  return normalizeMessageType(trimmed)
}

function normalizeOptionalPreview(raw: string | null | undefined): string | null {
  if (raw == null) return null
  const trimmed = String(raw).trim()
  return trimmed || null
}

/** `metadata` is a JSON string on the wire (US-04 backend) — parse defensively, never throw. */
function normalizeCommunityChatMessageMetadata(
  raw: string | null | undefined,
): CommunityChatMessageCallMetadata | null {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as Partial<CommunityChatMessageCallMetadata>
    if (!parsed || typeof parsed !== 'object') return null
    return {
      callSessionId: String(parsed.callSessionId ?? '').trim(),
      callType: String(parsed.callType ?? '').trim(),
      endReason: String(parsed.endReason ?? '').trim(),
      durationSeconds: Number(parsed.durationSeconds) || 0,
    }
  } catch {
    return null
  }
}

export function normalizeCommunityChatParticipant(
  dto: CommunityChatParticipantApiDto,
): CommunityChatParticipant {
  return {
    userProfileId: String(dto.userProfileId ?? dto.UserProfileId ?? '').trim(),
    fullName: String(dto.fullName ?? dto.FullName ?? '').trim(),
    avatarUrl: dto.avatarUrl ?? dto.AvatarUrl ?? null,
    isActive: (dto.isActive ?? dto.IsActive) !== false,
    joinedAt: normalizeCommunityChatTimestamp(dto.joinedAt ?? dto.JoinedAt),
    lastReadAt: normalizeCommunityChatTimestamp(dto.lastReadAt ?? dto.LastReadAt),
  }
}

export function normalizeCommunityChatSession(
  dto: CommunityChatSessionApiDto,
): CommunityChatSession {
  return {
    id: dto.id ?? '',
    businessId: dto.businessId ?? '',
    title: dto.title ?? null,
    chatType: normalizeChatType(dto.chatType),
    status: normalizeChatStatus(dto.status),
    createdByUserProfileId: dto.createdByUserProfileId ?? '',
    lastMessageAt: normalizeCommunityChatTimestamp(dto.lastMessageAt),
    lastMessagePreview: normalizeOptionalPreview(dto.lastMessagePreview),
    lastMessageType: normalizeOptionalMessageType(dto.lastMessageType),
    lastMessageSenderId: String(dto.lastMessageSenderId ?? '').trim() || null,
    unreadCount: dto.unreadCount ?? 0,
    participants: (dto.participants ?? []).map(normalizeCommunityChatParticipant),
  }
}

export function normalizeCommunityChatMessage(
  dto: CommunityChatMessageApiDto,
): CommunityChatMessage {
  return {
    id: String(dto.id ?? dto.Id ?? '').trim(),
    chatSessionId: String(dto.chatSessionId ?? dto.ChatSessionId ?? '').trim(),
    senderId: String(dto.senderId ?? dto.SenderId ?? '').trim(),
    senderName: String(dto.senderName ?? dto.SenderName ?? '').trim() || null,
    senderAvatarUrl: String(dto.senderAvatarUrl ?? dto.SenderAvatarUrl ?? '').trim() || null,
    content: String(dto.content ?? dto.Content ?? ''),
    messageType: normalizeMessageType(dto.messageType ?? dto.MessageType),
    sentAt: normalizeCommunityChatTimestamp(dto.sentAt ?? dto.SentAt) ?? '',
    editedAt: normalizeCommunityChatTimestamp(dto.editedAt ?? dto.EditedAt),
    isDeleted: Boolean(dto.isDeleted ?? dto.IsDeleted),
    metadata: normalizeCommunityChatMessageMetadata(dto.metadata ?? dto.Metadata),
  }
}

function normalizeMessagesPage(
  dto: CommunityChatMessagesPageApiDto,
): CommunityChatMessagesPage {
  return {
    items: (dto.items ?? []).map(normalizeCommunityChatMessage),
    pageNumber: dto.pageNumber ?? 1,
    totalPages: dto.totalPages ?? 1,
    totalCount: dto.totalCount ?? 0,
    hasPreviousPage: dto.hasPreviousPage ?? false,
    hasNextPage: dto.hasNextPage ?? false,
  }
}

export interface ListCommunityChatMessagesParams {
  pageNumber?: number
  pageSize?: number
}

export function createCommunityChatRepository(client: HttpClient = httpClient) {
  return {
  async createSession(input: CreateCommunityChatSessionInput): Promise<CommunityChatSession> {
    const data = await client.post<CommunityChatSessionApiDto>(
      `${COMMUNITY_CHAT_REST_BASE}/sessions`,
      {
        businessId: input.businessId,
        participantUserProfileIds: input.participantUserProfileIds,
        title: input.title ?? null,
      },
    )
    return normalizeCommunityChatSession(data)
  },

  async listSessions(): Promise<CommunityChatSession[]> {
    const data = await client.get<CommunityChatSessionApiDto[]>(
      `${COMMUNITY_CHAT_REST_BASE}/sessions`,
    )
    return (data ?? []).map(normalizeCommunityChatSession)
  },

  async getSession(sessionId: string): Promise<CommunityChatSession> {
    const data = await client.get<CommunityChatSessionApiDto>(
      `${COMMUNITY_CHAT_REST_BASE}/sessions/${encodeURIComponent(sessionId)}`,
    )
    return normalizeCommunityChatSession(data)
  },

  async addParticipant(
    sessionId: string,
    input: AddCommunityChatParticipantInput,
  ): Promise<void> {
    await client.post(
      `${COMMUNITY_CHAT_REST_BASE}/sessions/${encodeURIComponent(sessionId)}/participants`,
      { userProfileId: input.userProfileId },
    )
  },

  async removeParticipant(sessionId: string, userProfileId: string): Promise<void> {
    await client.del(
      `${COMMUNITY_CHAT_REST_BASE}/sessions/${encodeURIComponent(sessionId)}/participants/${encodeURIComponent(userProfileId)}`,
    )
  },

  async leaveSession(sessionId: string): Promise<void> {
    await client.post(
      `${COMMUNITY_CHAT_REST_BASE}/sessions/${encodeURIComponent(sessionId)}/leave`,
    )
  },

  async renameSession(
    sessionId: string,
    input: RenameCommunityChatSessionInput,
  ): Promise<void> {
    await client.put(
      `${COMMUNITY_CHAT_REST_BASE}/sessions/${encodeURIComponent(sessionId)}`,
      { title: input.title },
    )
  },

  async sendMessage(
    sessionId: string,
    input: SendCommunityChatMessageInput,
  ): Promise<CommunityChatMessage> {
    const data = await client.post<CommunityChatMessageApiDto>(
      `${COMMUNITY_CHAT_REST_BASE}/sessions/${encodeURIComponent(sessionId)}/messages`,
      { content: input.content },
    )
    return normalizeCommunityChatMessage(data)
  },

  async listMessages(
    sessionId: string,
    params: ListCommunityChatMessagesParams = {},
  ): Promise<CommunityChatMessagesPage> {
    const pageNumber = params.pageNumber ?? 1
    const pageSize = params.pageSize ?? COMMUNITY_CHAT_DEFAULT_PAGE_SIZE
    const query = new URLSearchParams({
      pageNumber: String(pageNumber),
      pageSize: String(pageSize),
    })
    const data = await client.get<CommunityChatMessagesPageApiDto>(
      `${COMMUNITY_CHAT_REST_BASE}/sessions/${encodeURIComponent(sessionId)}/messages?${query}`,
    )
    return normalizeMessagesPage(data)
  },

  async markSessionRead(sessionId: string): Promise<void> {
    await client.post(
      `${COMMUNITY_CHAT_REST_BASE}/sessions/${encodeURIComponent(sessionId)}/mark-read`,
    )
  },

  async deleteMessage(messageId: string): Promise<void> {
    await client.del(
      `${COMMUNITY_CHAT_REST_BASE}/messages/${encodeURIComponent(messageId)}`,
    )
  },

  async sendImage(chatSessionId: string, file: File): Promise<CommunityChatMessage> {
    const formData = new FormData()
    formData.append('chatSessionId', chatSessionId)
    formData.append('file', file)
    const data = await client.upload<CommunityChatMessageApiDto>(
      `${COMMUNITY_CHAT_REST_BASE}/send-image`,
      formData,
      'POST',
    )
    return normalizeCommunityChatMessage(data)
  },
  }
}

export const communityChatRepository = createCommunityChatRepository()

export default communityChatRepository
