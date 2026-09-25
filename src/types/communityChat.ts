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

/** Parsed `CommunityChatMessage.metadata` for `messageType === Call` (US-04 backend, JSON string on the wire). */
export interface CommunityChatMessageCallMetadata {
  callSessionId: string
  callType: string
  endReason: string
  durationSeconds: number
}

export interface CommunityChatMessage {
  id: string
  chatSessionId: string
  senderId: string
  senderName?: string | null
  senderAvatarUrl?: string | null
  content: string
  messageType: CommunityChatMessageType
  sentAt: string
  editedAt: string | null
  isDeleted?: boolean
  /** Only present when `messageType === Call`; null/undefined otherwise. */
  metadata?: CommunityChatMessageCallMetadata | null
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

/**
 * Server → client: ReceiveMessage event — raw wire shape, distinct from the normalized
 * `CommunityChatMessage` (metadata arrives as a JSON string here; see US-04 backend and
 * `normalizeCommunityChatMessage`, which parses it into `CommunityChatMessageCallMetadata`).
 */
export interface CommunityChatReceiveMessageEvent {
  id: string
  chatSessionId: string
  senderId: string
  senderName?: string | null
  senderAvatarUrl?: string | null
  content: string
  messageType: string
  sentAt: string
  editedAt: string | null
  isDeleted?: boolean
  metadata?: string | null
}

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

// ---------------------------------------------------------------------------
// Voice/video call signaling (US-03 backend, US-05 FE foundation).
// ---------------------------------------------------------------------------

/** Server → client: IncomingCall event (sent to the callee's group only). */
export interface IncomingCallEvent {
  id: string
  chatSessionId: string
  callType: string
  callerUserProfileId: string
  callerName: string | null
  callerAvatarUrl: string | null
}

/** Server → client: CallAnswered (to caller) / shared shape for CallRejected. */
export interface CallIdEvent {
  callId: string
}

/** Server → client: CallAnsweredElsewhere (to every callee tab, including the winner). */
export interface CallAnsweredElsewhereEvent {
  callId: string
  winningTabToken: string
}

/** Server → client: CallCanceled (to callee, caller hung up before answer). */
export interface CallCanceledEvent {
  callId: string
  endReason: string
}

/** Server → client: CallEnded (to both caller and callee groups). */
export interface CallEndedEvent {
  callId: string
  endReason: string
  durationSeconds: number
}

/** Server → client: ReceiveSdpOffer / ReceiveSdpAnswer payload. */
export interface SdpPayload {
  callId: string
  sdp: string
}

/** Server → client: ReceiveIceCandidate payload — candidateJson is `JSON.stringify(RTCIceCandidateInit)`. */
export interface IceCandidatePayload {
  callId: string
  candidateJson: string
}

/** Return value of the `InitiateCall` hub invoke — matches backend `CommunityCallSessionDto`. */
export interface CommunityCallSessionDto {
  id: string
  chatSessionId: string
  businessId: string
  callerUserProfileId: string
  calleeUserProfileId: string
  callType: string
  status: string
  answeredAt: string | null
  endedAt: string | null
  endReason: string | null
  durationSeconds: number
  callerName: string | null
  callerAvatarUrl: string | null
}

/** Return value of AnswerCall/RejectCall/CancelCall/EndCall hub invokes — matches backend `CommunityCallActionResultDto`. */
export interface CommunityCallActionResultDto {
  success: boolean
  callId: string
  callerUserProfileId: string
  calleeUserProfileId: string
  durationSeconds: number
}
