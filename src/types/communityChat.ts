import type {
  CommunityChatMessageType,
  CommunityChatStatus,
  CommunityChatType,
} from '../constants/communityChat'
import type { PaginatedResponse } from './domain'

export interface CommunityChatParticipant {
  userProfileId: string
  fullName: string
  avatarUrl: string | null
  isActive: boolean
  joinedAt: string | null
  lastReadAt: string | null
}

export interface CommunityChatSession {
  id: string
  businessId: string
  title: string | null
  chatType: CommunityChatType
  status: CommunityChatStatus
  createdByUserProfileId: string
  lastMessageAt: string | null
  /** Server list preview (text / “Sent a photo” / deleted, etc.). */
  lastMessagePreview: string | null
  lastMessageType: CommunityChatMessageType | null
  lastMessageSenderId: string | null
  unreadCount: number
  participants: CommunityChatParticipant[]
}

export interface CommunityChatMessage {
  id: string
  chatSessionId: string
  senderId: string
  content: string
  messageType: CommunityChatMessageType
  sentAt: string
  editedAt: string | null
  isDeleted?: boolean
}

export type CommunityChatMessagesPage = PaginatedResponse<CommunityChatMessage>

export interface CreateCommunityChatSessionInput {
  businessId: string
  participantUserProfileIds: string[]
  title?: string | null
}

export interface SendCommunityChatMessageInput {
  content: string
}

export interface RenameCommunityChatSessionInput {
  title: string
}

export interface AddCommunityChatParticipantInput {
  userProfileId: string
}

/** Hub RPC payload for SendMessage. */
export interface CommunityChatHubSendMessagePayload {
  sessionId: string
  content: string
}

/** Server → client: ReceiveMessage event. */
export type CommunityChatReceiveMessageEvent = CommunityChatMessage

/** Server → client: UserStatusChanged event (global presence). */
export interface CommunityChatUserStatusChangedEvent {
  userId: string
  isOnline: boolean
}

/** Server → client: typing indicator events. */
export interface CommunityChatTypingEvent {
  userId: string
  chatSessionId: string
}

/** Server → client: MessageDeleted event. */
export interface CommunityChatMessageDeletedEvent {
  messageId: string
  chatSessionId: string
  deletedByUserId: string
}
