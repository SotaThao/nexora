import type {
  ChannelKind,
  CommunityKind,
  CommunityVisibility,
  JoinRequestStatus,
  MemberRole,
  MemberStatus,
  NotificationType,
  ReactionType,
  ReportStatus,
  ReportTargetType,
} from '../../community/enums'

export type CursorDirection = 'forward' | 'backward'
export type CommunityMediaDeliveryType = 'upload' | 'authenticated'

export interface KeysetCursor {
  createdAt: string
  id: string
}

export interface KeysetPageRequest {
  cursor?: KeysetCursor | null
  direction?: CursorDirection
  limit?: number
}

export interface KeysetPage<T> {
  items: T[]
  nextCursor: KeysetCursor | null
  previousCursor: KeysetCursor | null
}

/** Provider-neutral media references; a repository resolves display URLs on demand. */
export interface MediaAsset {
  /** Cloudinary public ID, kept as a provider reference rather than a display URL. */
  path: string
  deliveryType: CommunityMediaDeliveryType
  format?: string | null
  contentType?: string | null
  altText?: string | null
}

export interface ProfileDto {
  id: string
  displayName: string
  avatarPath: string | null
  bio: string | null
  createdAt: string
  updatedAt: string
}

export interface CommunityDto {
  id: string
  name: string
  slug: string
  description: string | null
  kind: CommunityKind
  visibility: CommunityVisibility
  verified: boolean
  ownerId: string
  coverImagePath: string | null
  createdAt: string
  updatedAt: string
}

export interface CommunityMemberDto {
  id: string
  communityId: string
  userId: string
  role: MemberRole
  status: MemberStatus
  profile?: ProfileDto
  createdAt: string
  updatedAt: string
}

export interface PostDto {
  id: string
  communityId: string
  authorId: string
  body: string
  media: MediaAsset[]
  isAnnouncement: boolean
  author?: ProfileDto
  createdAt: string
  updatedAt: string
}

export interface CommentDto {
  id: string
  postId: string
  authorId: string
  body: string
  author?: ProfileDto
  createdAt: string
  updatedAt: string
}

export interface ReactionDto {
  id: string
  postId: string
  userId: string
  type: ReactionType
  createdAt: string
}

export interface InviteDto {
  id: string
  communityId: string
  createdBy: string
  expiresAt: string | null
  singleUse: boolean
  consumedBy: string | null
  consumedAt: string | null
  createdAt: string
}

export interface InvitePreviewDto {
  communityId: string
  communityName: string
  communitySlug: string
  expiresAt: string | null
}

export interface JoinRequestDto {
  id: string
  communityId: string
  userId: string
  message: string | null
  status: JoinRequestStatus
  reviewedBy: string | null
  reviewedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface ChannelDto {
  id: string
  communityId: string | null
  kind: ChannelKind
  name: string
  createdAt: string
}

/** Minimal public profile projection exposed to the open DM directory. */
export interface DirectMessageProfileDto {
  id: string
  displayName: string
  avatarPath: string | null
}

/** Backend-neutral 1:1 channel summary for the current actor. */
export interface DirectChannelDto {
  id: string
  kind: 'direct'
  name: string
  participantIds: string[]
  otherParticipant: DirectMessageProfileDto
  createdAt: string
}

export interface MessageDto {
  id: string
  channelId: string
  senderId: string
  body: string
  replyToMessageId: string | null
  sender?: ProfileDto
  createdAt: string
  updatedAt: string
}

export interface ReportDto {
  id: string
  communityId: string
  reporterId: string
  targetType: ReportTargetType
  targetId: string
  reason: string
  status: ReportStatus
  resolvedBy: string | null
  resolvedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface NotificationDto {
  id: string
  userId: string
  type: NotificationType
  payload: Record<string, unknown>
  readAt: string | null
  createdAt: string
}

export interface CreateCommunityInput {
  name: string
  slug: string
  description?: string | null
  kind: CommunityKind
  visibility: CommunityVisibility
  coverImagePath?: string | null
}

export interface UpdateCommunityInput {
  name?: string
  description?: string | null
  coverImagePath?: string | null
}

export interface CreatePostInput {
  /** Generated before media upload so provider paths are stable and scoped. */
  id?: string
  communityId: string
  body: string
  media?: MediaAsset[]
  isAnnouncement?: boolean
}

export interface UploadCommunityPostMediaInput {
  communityId: string
  postId: string
  visibility: CommunityVisibility
  file: File
  onProgress?: (progress: number) => void
}

export interface CreateCommentInput {
  postId: string
  body: string
}

export interface CreateInviteInput {
  communityId: string
  expiresAt?: string | null
  singleUse?: boolean
}

export interface CreateJoinRequestInput {
  communityId: string
  message?: string | null
}

export interface CreateMessageInput {
  channelId: string
  body: string
  replyToMessageId?: string | null
}

export interface CreateReportInput {
  communityId: string
  targetType: ReportTargetType
  targetId: string
  reason: string
}
