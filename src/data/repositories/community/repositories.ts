import { mapSupabaseError, type SupabaseDisplayError } from '../../../lib/supabaseError'
import { supabaseClient } from '../../../lib/supabaseClient'
import { notImplemented } from './stub'
import type {
  ChannelDto,
  CommentDto,
  CommunityDto,
  CommunityMemberDto,
  CreateCommentInput,
  CreateCommunityInput,
  CreateInviteInput,
  CreateJoinRequestInput,
  CreateMessageInput,
  CreatePostInput,
  CreateReportInput,
  InviteDto,
  InvitePreviewDto,
  JoinRequestDto,
  KeysetCursor,
  KeysetPage,
  KeysetPageRequest,
  MediaAsset,
  CommunityMediaDeliveryType,
  MessageDto,
  NotificationDto,
  PostDto,
  ProfileDto,
  ReactionDto,
  ReportDto,
  UpdateCommunityInput,
  UploadCommunityMessageMediaInput,
  UploadCommunityPostMediaInput,
} from './types'
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
} from '../../community/enums'

export interface CommunitiesRepository {
  /** Lists discoverable communities with cursor/keyset pagination. */
  list(query?: KeysetPageRequest): Promise<KeysetPage<CommunityDto>>
  /** Lists active communities belonging to the current actor. */
  listMine(query?: KeysetPageRequest): Promise<KeysetPage<CommunityDto>>
  /** Reads a community by its stable ID. */
  getById(communityId: string): Promise<CommunityDto | null>
  /** Reads a community by its URL-safe slug. */
  getBySlug(slug: string): Promise<CommunityDto | null>
  /** Creates a community and its owner membership. */
  create(input: CreateCommunityInput): Promise<CommunityDto>
  /** Updates mutable community presentation fields only. */
  update(communityId: string, input: UpdateCommunityInput): Promise<CommunityDto>
}

export interface MembersRepository {
  /** Lists members of a community with cursor/keyset pagination. */
  list(communityId: string, query?: KeysetPageRequest): Promise<KeysetPage<CommunityMemberDto>>
  /** Finds one user's membership in a community. */
  get(communityId: string, userId: string): Promise<CommunityMemberDto | null>
  /** Changes a membership role through the backend's invariant-preserving operation. */
  changeRole(communityId: string, userId: string, newRole: MemberRole): Promise<CommunityMemberDto>
  /** Removes or leaves a membership through the backend moderation contract. */
  remove(communityId: string, userId: string): Promise<void>
}

export interface PostsRepository {
  /** Lists community posts with cursor/keyset pagination. */
  list(communityId: string, query?: KeysetPageRequest): Promise<KeysetPage<PostDto>>
  /** Gets one post if the current actor may read it. */
  getById(postId: string): Promise<PostDto | null>
  /** Creates a post. Media values are provider references, never signed URLs. */
  create(input: CreatePostInput): Promise<PostDto>
  /** Uploads one image through the Cloudinary signed-upload flow. */
  uploadMedia(input: UploadCommunityPostMediaInput): Promise<MediaAsset>
  /** Resolves a display-only URL without persisting it in a DTO. */
  resolveMediaUrl(asset: MediaAsset): Promise<string>
  /** Deletes a post when allowed by author or moderator policy. */
  remove(postId: string): Promise<void>
}

export interface CommentsRepository {
  /** Lists comments for a post with cursor/keyset pagination. */
  list(postId: string, query?: KeysetPageRequest): Promise<KeysetPage<CommentDto>>
  /** Adds a comment to a readable post. */
  create(input: CreateCommentInput): Promise<CommentDto>
  /** Deletes a comment when allowed by policy. */
  remove(commentId: string): Promise<void>
}

export interface ReactionsRepository {
  /** Lists reactions for one post. */
  list(postId: string): Promise<ReactionDto[]>
  /** Adds or replaces the caller's reaction for a post. */
  set(postId: string, type: ReactionType): Promise<ReactionDto>
  /** Removes the caller's reaction of the supplied type. */
  remove(postId: string, type: ReactionType): Promise<void>
}

export interface InvitesRepository {
  /** Creates an invite and returns the raw token exactly once. */
  create(input: CreateInviteInput): Promise<{ invite: InviteDto; token: string }>
  /** Returns safe invite preview data without consuming the invite. */
  validate(token: string): Promise<InvitePreviewDto | null>
  /** Consumes an invite atomically and returns the resulting membership. */
  consume(token: string): Promise<CommunityMemberDto>
  /** Revokes an unused invite. */
  revoke(inviteId: string): Promise<void>
}

export interface JoinRequestsRepository {
  /** Creates a join request for the current actor. */
  create(input: CreateJoinRequestInput): Promise<JoinRequestDto>
  /** Lists join requests visible to community moderators. */
  list(communityId: string, query?: KeysetPageRequest): Promise<KeysetPage<JoinRequestDto>>
  /** Approves a pending request atomically. */
  approve(requestId: string): Promise<JoinRequestDto>
  /** Rejects a pending request atomically. */
  reject(requestId: string): Promise<JoinRequestDto>
}

export interface ChannelsRepository {
  /** Lists the channels available in a community. */
  list(communityId: string): Promise<ChannelDto[]>
  /** Gets the sole main channel for a community. */
  getMain(communityId: string): Promise<ChannelDto | null>
}

export interface MessagesRepository {
  /** Lists channel messages with cursor/keyset pagination. */
  list(channelId: string, query?: KeysetPageRequest): Promise<KeysetPage<MessageDto>>
  /** Uploads one chat image through the shared Cloudinary signed-upload flow. */
  uploadMedia(input: UploadCommunityMessageMediaInput): Promise<MediaAsset>
  /** Sends a message as the current actor. */
  send(input: CreateMessageInput): Promise<MessageDto>
  /** Maps a Postgres Changes INSERT row at the repository boundary. */
  fromRealtime(row: unknown): MessageDto | null
}

export interface ReportsRepository {
  /** Creates a report against a post, comment, or member. */
  create(input: CreateReportInput): Promise<ReportDto>
  /** Lists reports available to community owners and admins. */
  list(communityId: string, query?: KeysetPageRequest): Promise<KeysetPage<ReportDto>>
  /** Resolves or dismisses a report through the moderation contract. */
  updateStatus(reportId: string, status: Exclude<ReportStatus, 'open'>): Promise<ReportDto>
}

export interface NotificationsRepository {
  /** Lists current-user notifications with cursor/keyset pagination. */
  list(query?: KeysetPageRequest): Promise<KeysetPage<NotificationDto>>
  /** Counts current-user unread notifications. */
  getUnreadCount(): Promise<number>
  /** Marks a notification as read. */
  markRead(notificationId: string): Promise<NotificationDto>
  /** Marks every current-user notification as read. */
  markAllRead(): Promise<void>
  /** Filters current-user notifications by producer type. */
  listByType(type: NotificationType, query?: KeysetPageRequest): Promise<KeysetPage<NotificationDto>>
  /** Maps a Postgres Changes INSERT row at the repository boundary. */
  fromRealtime(row: unknown): NotificationDto | null
}

export interface ProfilesRepository {
  /** Reads a profile visible to the current actor. */
  getById(profileId: string): Promise<ProfileDto | null>
  /** Reads the current actor's profile. */
  getMe(): Promise<ProfileDto | null>
  /** Updates the current actor's mutable profile fields. */
  updateMe(input: Pick<ProfileDto, 'displayName' | 'avatarPath' | 'bio'>): Promise<ProfileDto>
}

type ProfileRow = {
  id: string
  display_name: string
  avatar_path: string | null
  bio: string | null
  created_at: string
  updated_at: string
}

type CommunityRow = {
  id: string
  name: string
  slug: string
  description: string | null
  kind: CommunityKind
  visibility: CommunityVisibility
  verified: boolean
  owner_id: string
  cover_image_path: string | null
  created_at: string
  updated_at: string
}

type MemberRow = {
  id: string
  community_id: string
  user_id: string
  role: MemberRole
  status: MemberStatus
  created_at: string
  updated_at: string
  profile?: ProfileRow | null
  community?: CommunityRow | null
}

type PostRow = {
  id: string
  community_id: string
  author_id: string
  body: string
  media_paths: unknown
  is_announcement: boolean
  created_at: string
  updated_at: string
  author?: ProfileRow | null
  community?: { media_visibility: CommunityVisibility } | null
}

type CommentRow = {
  id: string
  post_id: string
  author_id: string
  body: string
  created_at: string
  updated_at: string
  author?: ProfileRow | null
}

type ReactionRow = {
  id: string
  post_id: string
  user_id: string
  type: ReactionType
  created_at: string
}

type InviteRow = {
  id: string
  community_id: string
  created_by: string
  expires_at: string | null
  single_use: boolean
  consumed_by: string | null
  consumed_at: string | null
  created_at: string
}

type JoinRequestRow = {
  id: string
  community_id: string
  user_id: string
  message: string | null
  status: JoinRequestStatus
  reviewed_by: string | null
  reviewed_at: string | null
  created_at: string
  updated_at: string
}

type ChannelRow = {
  id: string
  community_id: string | null
  kind: ChannelKind
  name: string
  created_at: string
}

type MessageRow = {
  id: string
  channel_id: string
  sender_id: string
  body: string
  media_paths?: unknown
  reply_to_message_id: string | null
  created_at: string
  updated_at: string
  sender?: ProfileRow | null
  channel?: { community?: { media_visibility: CommunityVisibility } | null } | null
}

type NotificationRow = {
  id: string
  user_id: string
  type: NotificationType
  payload: unknown
  read_at: string | null
  created_at: string
}

type InvitePreviewRow = {
  community_id: string
  community_name: string
  community_slug: string
  expires_at: string | null
}

type CursorRow = { id: string; created_at: string }

const DEFAULT_PAGE_SIZE = 20

function throwIfSupabaseError(error: unknown): void {
  if (error) throw mapSupabaseError(error)
}

function authError(message: string): SupabaseDisplayError {
  return mapSupabaseError({ name: 'AuthApiError', status: 401, message })
}

async function requireCurrentUserId(): Promise<string> {
  const { data, error } = await supabaseClient.auth.getUser()
  throwIfSupabaseError(error)
  if (!data.user) throw authError('Authentication is required')
  return data.user.id
}

function pageSize(query?: KeysetPageRequest): number {
  return Math.min(Math.max(query?.limit ?? DEFAULT_PAGE_SIZE, 1), 100)
}

function cursorFilter(cursor: KeysetCursor | null | undefined, query?: KeysetPageRequest, ascending = false): string | null {
  if (!cursor) return null
  const forward = query?.direction !== 'backward'
  const useGreaterThan = ascending ? forward : !forward
  const comparator = useGreaterThan ? 'gt' : 'lt'
  return `created_at.${comparator}.${cursor.createdAt},and(created_at.eq.${cursor.createdAt},id.${comparator}.${cursor.id})`
}

function mapPage<T extends CursorRow, D>(rows: T[] | null, limit: number, map: (row: T) => D): KeysetPage<D> {
  const values = rows ?? []
  const hasMore = values.length > limit
  const items = values.slice(0, limit)
  return {
    items: items.map(map),
    nextCursor: hasMore && items.length ? { createdAt: items[items.length - 1].created_at, id: items[items.length - 1].id } : null,
    previousCursor: items.length ? { createdAt: items[0].created_at, id: items[0].id } : null,
  }
}

function mapProfile(row: ProfileRow): ProfileDto {
  return {
    id: row.id,
    displayName: row.display_name,
    avatarPath: row.avatar_path,
    bio: row.bio,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function mapCommunity(row: CommunityRow): CommunityDto {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    kind: row.kind,
    visibility: row.visibility,
    verified: row.verified,
    ownerId: row.owner_id,
    coverImagePath: row.cover_image_path,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

type StoredMediaReference = {
  publicId?: unknown
  type?: unknown
  format?: unknown
  contentType?: unknown
  altText?: unknown
}

type CloudinaryUploadSignature = {
  cloudName: string
  apiKey: string
  timestamp: number
  signature: string
  folder: string
  publicIdPrefix: string
  type: CommunityMediaDeliveryType
  uploadUrl: string
}

type CloudinaryUploadResponse = {
  public_id?: unknown
  type?: unknown
  format?: unknown
}

type CloudinarySignedUrl = { url?: unknown }

function mediaDeliveryTypeForVisibility(visibility: CommunityVisibility): CommunityMediaDeliveryType {
  return visibility === 'private' ? 'authenticated' : 'upload'
}

function mapMedia(paths: unknown, visibility?: CommunityVisibility): MediaAsset[] {
  if (!Array.isArray(paths)) return []

  return paths.flatMap((value): MediaAsset[] => {
    const stored = value && typeof value === 'object' ? value as StoredMediaReference : null
    const path = typeof value === 'string' ? value : typeof stored?.publicId === 'string' ? stored.publicId : null
    if (!path) return []
    const storedDeliveryType = stored?.type === 'authenticated' || stored?.type === 'upload'
      ? stored.type
      : 'upload'
    return [{
      path,
      // Community visibility is authoritative when joined; realtime rows fall back to the stored type.
      deliveryType: visibility ? mediaDeliveryTypeForVisibility(visibility) : storedDeliveryType,
      format: typeof stored?.format === 'string' ? stored.format : null,
      contentType: typeof stored?.contentType === 'string' ? stored.contentType : null,
      altText: typeof stored?.altText === 'string' ? stored.altText : null,
    }]
  })
}

function mapMember(row: MemberRow): CommunityMemberDto {
  return {
    id: row.id,
    communityId: row.community_id,
    userId: row.user_id,
    role: row.role,
    status: row.status,
    profile: row.profile ? mapProfile(row.profile) : undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function mapPost(row: PostRow): PostDto {
  return {
    id: row.id,
    communityId: row.community_id,
    authorId: row.author_id,
    body: row.body,
    media: mapMedia(row.media_paths, row.community?.media_visibility),
    isAnnouncement: row.is_announcement,
    author: row.author ? mapProfile(row.author) : undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function cloudinaryConfigError(message: string): SupabaseDisplayError {
  return mapSupabaseError({ message, status: 500 })
}

function cloudinaryCloudName(): string {
  const cloudName = (import.meta.env as Record<string, string | undefined>).VITE_CLOUDINARY_CLOUD_NAME?.trim()
  if (!cloudName) throw cloudinaryConfigError('Cloudinary is not configured. Set VITE_CLOUDINARY_CLOUD_NAME.')
  return cloudName
}

function cloudinaryPublicUrl(cloudName: string, publicId: string): string {
  const safePublicId = publicId.split('/').map(encodeURIComponent).join('/')
  return `https://res.cloudinary.com/${encodeURIComponent(cloudName)}/image/upload/${safePublicId}`
}

function isCloudinaryUploadSignature(value: unknown): value is CloudinaryUploadSignature {
  if (!value || typeof value !== 'object') return false
  const data = value as Record<string, unknown>
  return typeof data.cloudName === 'string'
    && typeof data.apiKey === 'string'
    && typeof data.timestamp === 'number'
    && typeof data.signature === 'string'
    && typeof data.folder === 'string'
    && typeof data.publicIdPrefix === 'string'
    && (data.type === 'upload' || data.type === 'authenticated')
    && typeof data.uploadUrl === 'string'
}

function uploadToCloudinary(
  signature: CloudinaryUploadSignature,
  file: File,
  onProgress?: (progress: number) => void,
): Promise<CloudinaryUploadResponse> {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest()
    const form = new FormData()
    form.append('file', file)
    form.append('api_key', signature.apiKey)
    form.append('timestamp', String(signature.timestamp))
    form.append('signature', signature.signature)
    form.append('folder', signature.folder)
    form.append('public_id_prefix', signature.publicIdPrefix)
    form.append('type', signature.type)

    request.open('POST', signature.uploadUrl)
    request.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress?.(event.loaded / event.total)
    }
    request.onerror = () => reject(mapSupabaseError({ status: request.status || 503, message: 'Không thể tải ảnh lên Cloudinary.' }))
    request.onload = () => {
      let response: CloudinaryUploadResponse & { error?: { message?: unknown } } = {}
      try {
        response = JSON.parse(request.responseText) as CloudinaryUploadResponse & { error?: { message?: unknown } }
      } catch {
        // The HTTP status below produces the mapped error for malformed responses.
      }
      if (request.status < 200 || request.status >= 300) {
        reject(mapSupabaseError({
          status: request.status,
          message: typeof response.error?.message === 'string' ? response.error.message : 'Không thể tải ảnh lên Cloudinary.',
        }))
        return
      }
      resolve(response)
    }
    request.send(form)
  })
}

type UploadCommunityMediaInput = {
  communityId: string
  containerId: string
  visibility: CommunityVisibility
  file: File
  onProgress?: (progress: number) => void
}

function serializeMediaAssets(media: MediaAsset[] | undefined): StoredMediaReference[] {
  return (media ?? []).map((asset) => ({
    publicId: asset.path,
    type: asset.deliveryType,
    format: asset.format ?? null,
    contentType: asset.contentType ?? null,
    altText: asset.altText ?? null,
  }))
}

async function uploadCommunityMedia(input: UploadCommunityMediaInput): Promise<MediaAsset> {
  const { data, error } = await supabaseClient.functions.invoke('cloudinary-media', {
    body: {
      action: 'sign-upload',
      communityId: input.communityId,
      // The signing contract calls this postId, but accepts any stable media container UUID.
      postId: input.containerId,
      visibility: input.visibility,
    },
  })
  throwIfSupabaseError(error)
  if (!isCloudinaryUploadSignature(data)) throw cloudinaryConfigError('Cloudinary upload signature unavailable.')

  input.onProgress?.(0.05)
  const uploaded = await uploadToCloudinary(data, input.file, input.onProgress)
  if (typeof uploaded.public_id !== 'string' || !uploaded.public_id.startsWith(`${data.folder}/`)) {
    throw cloudinaryConfigError('Cloudinary returned an invalid community media reference.')
  }
  if (uploaded.type !== data.type) throw cloudinaryConfigError('Cloudinary returned an unexpected media delivery type.')

  input.onProgress?.(1)
  return {
    path: uploaded.public_id,
    deliveryType: data.type,
    format: typeof uploaded.format === 'string' ? uploaded.format : null,
    contentType: input.file.type || null,
  }
}

async function resolveCommunityMediaUrl(asset: MediaAsset): Promise<string> {
  if (asset.deliveryType === 'upload') {
    return cloudinaryPublicUrl(cloudinaryCloudName(), asset.path)
  }
  const format = asset.format || asset.path.split('.').pop() || 'png'
  const { data, error } = await supabaseClient.functions.invoke('cloudinary-media', {
    body: {
      action: 'sign-url',
      publicId: asset.path,
      visibility: 'private',
      format,
    },
  })
  throwIfSupabaseError(error)
  const signedUrl = data as CloudinarySignedUrl | null
  if (!signedUrl || typeof signedUrl.url !== 'string') throw cloudinaryConfigError('Cloudinary media URL unavailable.')
  return signedUrl.url
}

function mapComment(row: CommentRow): CommentDto {
  return {
    id: row.id,
    postId: row.post_id,
    authorId: row.author_id,
    body: row.body,
    author: row.author ? mapProfile(row.author) : undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function mapReaction(row: ReactionRow): ReactionDto {
  return { id: row.id, postId: row.post_id, userId: row.user_id, type: row.type, createdAt: row.created_at }
}

function mapInvite(row: InviteRow): InviteDto {
  return {
    id: row.id,
    communityId: row.community_id,
    createdBy: row.created_by,
    expiresAt: row.expires_at,
    singleUse: row.single_use,
    consumedBy: row.consumed_by,
    consumedAt: row.consumed_at,
    createdAt: row.created_at,
  }
}

function mapJoinRequest(row: JoinRequestRow): JoinRequestDto {
  return {
    id: row.id,
    communityId: row.community_id,
    userId: row.user_id,
    message: row.message,
    status: row.status,
    reviewedBy: row.reviewed_by,
    reviewedAt: row.reviewed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function mapChannel(row: ChannelRow): ChannelDto {
  return {
    id: row.id,
    communityId: row.community_id,
    kind: row.kind,
    name: row.name,
    createdAt: row.created_at,
  }
}

function mapMessage(row: MessageRow): MessageDto {
  return {
    id: row.id,
    channelId: row.channel_id,
    senderId: row.sender_id,
    body: row.body,
    media: mapMedia(row.media_paths, row.channel?.community?.media_visibility),
    replyToMessageId: row.reply_to_message_id,
    sender: row.sender ? mapProfile(row.sender) : undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function mapNotification(row: NotificationRow): NotificationDto {
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type,
    payload: row.payload && typeof row.payload === 'object' && !Array.isArray(row.payload)
      ? row.payload as Record<string, unknown>
      : {},
    readAt: row.read_at,
    createdAt: row.created_at,
  }
}

function isRealtimeMessageRow(row: unknown): row is MessageRow {
  if (!row || typeof row !== 'object') return false
  const value = row as Record<string, unknown>
  return typeof value.id === 'string'
    && typeof value.channel_id === 'string'
    && typeof value.sender_id === 'string'
    && typeof value.body === 'string'
    && (typeof value.reply_to_message_id === 'string' || value.reply_to_message_id === null)
    && typeof value.created_at === 'string'
    && typeof value.updated_at === 'string'
}

function isRealtimeNotificationRow(row: unknown): row is NotificationRow {
  if (!row || typeof row !== 'object') return false
  const value = row as Record<string, unknown>
  return typeof value.id === 'string'
    && typeof value.user_id === 'string'
    && typeof value.type === 'string'
    && value.payload !== null
    && typeof value.payload === 'object'
    && !Array.isArray(value.payload)
    && (typeof value.read_at === 'string' || value.read_at === null)
    && typeof value.created_at === 'string'
}

async function sha256(value: string): Promise<string> {
  const digest = await globalThis.crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

export function createCommunitiesRepository(): CommunitiesRepository {
  return {
    async list(query) {
      const limit = pageSize(query)
      const filter = cursorFilter(query?.cursor, query)
      let request = supabaseClient.from('communities').select('*').order('created_at', { ascending: false }).order('id', { ascending: false })
      if (filter) request = request.or(filter)
      const { data, error } = await request.limit(limit + 1)
      throwIfSupabaseError(error)
      return mapPage(data as CommunityRow[] | null, limit, mapCommunity)
    },
    async listMine(query) {
      const userId = await requireCurrentUserId()
      const limit = pageSize(query)
      const filter = cursorFilter(query?.cursor, query)
      let request = supabaseClient
        .from('community_members')
        .select('created_at,id,community:communities!community_members_community_id_fkey(*)')
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .order('id', { ascending: false })
      if (filter) request = request.or(filter)
      const { data, error } = await request.limit(limit + 1)
      throwIfSupabaseError(error)
      const rows = (data ?? []) as unknown as MemberRow[]
      const values = rows.filter((row) => row.community)
      const hasMore = values.length > limit
      const items = values.slice(0, limit)
      return {
        items: items.map((row) => mapCommunity(row.community!)),
        nextCursor: hasMore && items.length ? { createdAt: items[items.length - 1].created_at, id: items[items.length - 1].id } : null,
        previousCursor: items.length ? { createdAt: items[0].created_at, id: items[0].id } : null,
      }
    },
    async getById(communityId) {
      const { data, error } = await supabaseClient.from('communities').select('*').eq('id', communityId).maybeSingle()
      throwIfSupabaseError(error)
      return data ? mapCommunity(data as CommunityRow) : null
    },
    async getBySlug(slug) {
      const { data, error } = await supabaseClient.from('communities').select('*').eq('slug', slug).maybeSingle()
      throwIfSupabaseError(error)
      return data ? mapCommunity(data as CommunityRow) : null
    },
    async create(input) {
      const ownerId = await requireCurrentUserId()
      const { data, error } = await supabaseClient
        .from('communities')
        .insert({
          name: input.name.trim(),
          slug: input.slug.trim().toLowerCase(),
          description: input.description?.trim() || null,
          kind: input.kind,
          visibility: input.visibility,
          media_visibility: input.visibility,
          cover_image_path: input.coverImagePath ?? null,
          owner_id: ownerId,
        })
        .select('*')
        .single()
      throwIfSupabaseError(error)
      return mapCommunity(data as CommunityRow)
    },
    async update(communityId, input) {
      const { data, error } = await supabaseClient
        .from('communities')
        .update({
          ...(input.name === undefined ? {} : { name: input.name.trim() }),
          ...(input.description === undefined ? {} : { description: input.description?.trim() || null }),
          ...(input.coverImagePath === undefined ? {} : { cover_image_path: input.coverImagePath }),
        })
        .eq('id', communityId)
        .select('*')
        .single()
      throwIfSupabaseError(error)
      return mapCommunity(data as CommunityRow)
    },
  }
}

export function createMembersRepository(): MembersRepository {
  return {
    async list(communityId, query) {
      const limit = pageSize(query)
      const filter = cursorFilter(query?.cursor, query)
      let request = supabaseClient
        .from('community_members')
        .select('*,profile:profiles!community_members_user_id_fkey(*)')
        .eq('community_id', communityId)
        .order('created_at', { ascending: false })
        .order('id', { ascending: false })
      if (filter) request = request.or(filter)
      const { data, error } = await request.limit(limit + 1)
      throwIfSupabaseError(error)
      return mapPage(data as MemberRow[] | null, limit, mapMember)
    },
    async get(communityId, userId) {
      const { data, error } = await supabaseClient
        .from('community_members')
        .select('*,profile:profiles!community_members_user_id_fkey(*)')
        .eq('community_id', communityId)
        .eq('user_id', userId)
        .maybeSingle()
      throwIfSupabaseError(error)
      return data ? mapMember(data as MemberRow) : null
    },
    async changeRole(communityId, userId, newRole) {
      const { data, error } = await supabaseClient.rpc('change_role', {
        p_community_id: communityId,
        p_user_id: userId,
        p_new_role: newRole,
      })
      throwIfSupabaseError(error)
      return mapMember(data as MemberRow)
    },
    async remove(communityId, userId) {
      const member = await this.get(communityId, userId)
      if (!member) return
      const { error } = await supabaseClient.rpc('moderate', {
        p_community_id: communityId,
        p_action: 'remove_member',
        p_target_id: member.id,
        p_reason: null,
      })
      throwIfSupabaseError(error)
    },
  }
}

export function createPostsRepository(): PostsRepository {
  return {
    async list(communityId, query) {
      const limit = pageSize(query)
      const filter = cursorFilter(query?.cursor, query)
      let request = supabaseClient
        .from('posts')
        .select('*,author:profiles!posts_author_id_fkey(*),community:communities!posts_community_id_fkey(media_visibility)')
        .eq('community_id', communityId)
        .order('created_at', { ascending: false })
        .order('id', { ascending: false })
      if (filter) request = request.or(filter)
      const { data, error } = await request.limit(limit + 1)
      throwIfSupabaseError(error)
      return mapPage(data as PostRow[] | null, limit, mapPost)
    },
    async getById(postId) {
      const { data, error } = await supabaseClient
        .from('posts')
        .select('*,author:profiles!posts_author_id_fkey(*),community:communities!posts_community_id_fkey(media_visibility)')
        .eq('id', postId)
        .maybeSingle()
      throwIfSupabaseError(error)
      return data ? mapPost(data as PostRow) : null
    },
    async uploadMedia(input) {
      return uploadCommunityMedia({
        communityId: input.communityId,
        containerId: input.postId,
        visibility: input.visibility,
        file: input.file,
        onProgress: input.onProgress,
      })
    },
    async resolveMediaUrl(asset) {
      return resolveCommunityMediaUrl(asset)
    },
    async create(input) {
      const authorId = await requireCurrentUserId()
      const { data, error } = await supabaseClient
        .from('posts')
        .insert({
          ...(input.id ? { id: input.id } : {}),
          community_id: input.communityId,
          author_id: authorId,
          body: input.body.trim(),
          media_paths: serializeMediaAssets(input.media),
          is_announcement: input.isAnnouncement ?? false,
        })
        .select('*,author:profiles!posts_author_id_fkey(*),community:communities!posts_community_id_fkey(media_visibility)')
        .single()
      throwIfSupabaseError(error)
      return mapPost(data as PostRow)
    },
    async remove(postId) {
      const { error } = await supabaseClient.from('posts').delete().eq('id', postId)
      throwIfSupabaseError(error)
    },
  }
}

export function createCommentsRepository(): CommentsRepository {
  return {
    async list(postId, query) {
      const limit = pageSize(query)
      const filter = cursorFilter(query?.cursor, query, true)
      let request = supabaseClient
        .from('comments')
        .select('*,author:profiles!comments_author_id_fkey(*)')
        .eq('post_id', postId)
        .order('created_at', { ascending: true })
        .order('id', { ascending: true })
      if (filter) request = request.or(filter)
      const { data, error } = await request.limit(limit + 1)
      throwIfSupabaseError(error)
      return mapPage(data as CommentRow[] | null, limit, mapComment)
    },
    async create(input) {
      const authorId = await requireCurrentUserId()
      const { data, error } = await supabaseClient
        .from('comments')
        .insert({ post_id: input.postId, author_id: authorId, body: input.body.trim() })
        .select('*,author:profiles!comments_author_id_fkey(*)')
        .single()
      throwIfSupabaseError(error)
      return mapComment(data as CommentRow)
    },
    async remove(commentId) {
      const { error } = await supabaseClient.from('comments').delete().eq('id', commentId)
      throwIfSupabaseError(error)
    },
  }
}

export function createReactionsRepository(): ReactionsRepository {
  return {
    async list(postId) {
      const { data, error } = await supabaseClient.from('reactions').select('*').eq('post_id', postId).order('created_at', { ascending: true })
      throwIfSupabaseError(error)
      return ((data ?? []) as ReactionRow[]).map(mapReaction)
    },
    async set(postId, type) {
      const userId = await requireCurrentUserId()
      const { error: deleteError } = await supabaseClient.from('reactions').delete().eq('post_id', postId).eq('user_id', userId)
      throwIfSupabaseError(deleteError)
      const { data, error } = await supabaseClient
        .from('reactions')
        .insert({ post_id: postId, user_id: userId, type })
        .select('*')
        .single()
      throwIfSupabaseError(error)
      return mapReaction(data as ReactionRow)
    },
    async remove(postId, type) {
      const userId = await requireCurrentUserId()
      const { error } = await supabaseClient.from('reactions').delete().eq('post_id', postId).eq('user_id', userId).eq('type', type)
      throwIfSupabaseError(error)
    },
  }
}

export function createInvitesRepository(): InvitesRepository {
  return {
    async create(input) {
      const createdBy = await requireCurrentUserId()
      const token = `${globalThis.crypto.randomUUID()}${globalThis.crypto.randomUUID()}`
      const tokenHash = await sha256(token)
      const { data, error } = await supabaseClient
        .from('invites')
        .insert({
          community_id: input.communityId,
          created_by: createdBy,
          token_hash: tokenHash,
          expires_at: input.expiresAt ?? null,
          single_use: input.singleUse ?? true,
        })
        .select('*')
        .single()
      throwIfSupabaseError(error)
      return { invite: mapInvite(data as InviteRow), token }
    },
    async validate(token) {
      const { data, error } = await supabaseClient.rpc('validate_invite', { p_token: token })
      throwIfSupabaseError(error)
      const preview = (data as InvitePreviewRow[] | null)?.[0]
      return preview
        ? {
            communityId: preview.community_id,
            communityName: preview.community_name,
            communitySlug: preview.community_slug,
            expiresAt: preview.expires_at,
          }
        : null
    },
    async consume(token) {
      const { data, error } = await supabaseClient.rpc('consume_invite', { p_token: token })
      throwIfSupabaseError(error)
      return mapMember(data as MemberRow)
    },
    async revoke(inviteId) {
      const { error } = await supabaseClient.from('invites').update({ revoked_at: new Date().toISOString() }).eq('id', inviteId)
      throwIfSupabaseError(error)
    },
  }
}

export function createJoinRequestsRepository(): JoinRequestsRepository {
  return {
    async create(input) {
      const userId = await requireCurrentUserId()
      const { data, error } = await supabaseClient
        .from('join_requests')
        .insert({ community_id: input.communityId, user_id: userId, message: input.message?.trim() || null })
        .select('*')
        .single()
      throwIfSupabaseError(error)
      return mapJoinRequest(data as JoinRequestRow)
    },
    async list(communityId, query) {
      const limit = pageSize(query)
      const filter = cursorFilter(query?.cursor, query)
      let request = supabaseClient
        .from('join_requests')
        .select('*')
        .eq('community_id', communityId)
        .order('created_at', { ascending: false })
        .order('id', { ascending: false })
      if (filter) request = request.or(filter)
      const { data, error } = await request.limit(limit + 1)
      throwIfSupabaseError(error)
      return mapPage(data as JoinRequestRow[] | null, limit, mapJoinRequest)
    },
    async approve(requestId) {
      const { data, error } = await supabaseClient.rpc('approve_join', { p_request_id: requestId })
      throwIfSupabaseError(error)
      return mapJoinRequest(data as JoinRequestRow)
    },
    async reject(requestId) {
      const { data, error } = await supabaseClient.rpc('reject_join', { p_request_id: requestId })
      throwIfSupabaseError(error)
      return mapJoinRequest(data as JoinRequestRow)
    },
  }
}

export function createChannelsRepository(): ChannelsRepository {
  return {
    async list(communityId) {
      const { data, error } = await supabaseClient
        .from('channels')
        .select('*')
        .eq('community_id', communityId)
        .order('created_at', { ascending: true })
      throwIfSupabaseError(error)
      return ((data ?? []) as ChannelRow[]).map(mapChannel)
    },
    async getMain(communityId) {
      const { data, error } = await supabaseClient
        .from('channels')
        .select('*')
        .eq('community_id', communityId)
        .eq('kind', 'main')
        .maybeSingle()
      throwIfSupabaseError(error)
      return data ? mapChannel(data as ChannelRow) : null
    },
  }
}

export function createMessagesRepository(): MessagesRepository {
  return {
    async list(channelId, query) {
      const limit = pageSize(query)
      const isOlderHistory = query?.direction !== 'forward'
      const cursor = query?.cursor
      const cursorFilter = !cursor
        ? null
        : isOlderHistory
          ? `created_at.lt.${cursor.createdAt},and(created_at.eq.${cursor.createdAt},id.lt.${cursor.id})`
          : `created_at.gt.${cursor.createdAt},and(created_at.eq.${cursor.createdAt},id.gt.${cursor.id})`
      let request = supabaseClient
        .from('messages')
        .select('*,sender:profiles!messages_sender_id_fkey(*),channel:channels!messages_channel_id_fkey(community:communities!channels_community_id_fkey(media_visibility))')
        .eq('channel_id', channelId)
        .order('created_at', { ascending: !isOlderHistory })
        .order('id', { ascending: !isOlderHistory })
      if (cursorFilter) request = request.or(cursorFilter)
      const { data, error } = await request.limit(limit + 1)
      throwIfSupabaseError(error)

      const rows = (data ?? []) as MessageRow[]
      const hasMore = rows.length > limit
      const pageRows = rows.slice(0, limit)
      const chronologicalRows = isOlderHistory ? pageRows.reverse() : pageRows
      const oldest = chronologicalRows[0]
      const newest = chronologicalRows[chronologicalRows.length - 1]
      return {
        items: chronologicalRows.map(mapMessage),
        nextCursor: hasMore && (isOlderHistory ? oldest : newest)
          ? {
              createdAt: (isOlderHistory ? oldest : newest).created_at,
              id: (isOlderHistory ? oldest : newest).id,
            }
          : null,
        previousCursor: oldest ? { createdAt: oldest.created_at, id: oldest.id } : null,
      }
    },
    async uploadMedia(input) {
      return uploadCommunityMedia({
        communityId: input.communityId,
        containerId: input.messageId,
        visibility: input.visibility,
        file: input.file,
        onProgress: input.onProgress,
      })
    },
    async send(input) {
      const senderId = await requireCurrentUserId()
      const { data, error } = await supabaseClient
        .from('messages')
        .insert({
          ...(input.id ? { id: input.id } : {}),
          channel_id: input.channelId,
          sender_id: senderId,
          body: input.body.trim(),
          ...(input.media?.length ? { media_paths: serializeMediaAssets(input.media) } : {}),
          reply_to_message_id: input.replyToMessageId ?? null,
        })
        .select('*,sender:profiles!messages_sender_id_fkey(*),channel:channels!messages_channel_id_fkey(community:communities!channels_community_id_fkey(media_visibility))')
        .single()
      throwIfSupabaseError(error)
      return mapMessage(data as MessageRow)
    },
    fromRealtime(row) {
      return isRealtimeMessageRow(row) ? mapMessage(row) : null
    },
  }
}

export function createReportsRepository(): ReportsRepository {
  return {
    create: () => notImplemented('reportsRepository', 'create'),
    list: () => notImplemented('reportsRepository', 'list'),
    updateStatus: () => notImplemented('reportsRepository', 'updateStatus'),
  }
}

export function createNotificationsRepository(): NotificationsRepository {
  return {
    async list(query) {
      const limit = pageSize(query)
      const filter = cursorFilter(query?.cursor, query)
      let request = supabaseClient
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .order('id', { ascending: false })
      if (filter) request = request.or(filter)
      const { data, error } = await request.limit(limit + 1)
      throwIfSupabaseError(error)
      return mapPage(data as NotificationRow[] | null, limit, mapNotification)
    },
    async getUnreadCount() {
      const { count, error } = await supabaseClient
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .is('read_at', null)
      throwIfSupabaseError(error)
      return count ?? 0
    },
    async markRead(notificationId) {
      const { data, error } = await supabaseClient
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('id', notificationId)
        .select('*')
        .single()
      throwIfSupabaseError(error)
      return mapNotification(data as NotificationRow)
    },
    async markAllRead() {
      const { error } = await supabaseClient
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .is('read_at', null)
      throwIfSupabaseError(error)
    },
    async listByType(type, query) {
      const limit = pageSize(query)
      const filter = cursorFilter(query?.cursor, query)
      let request = supabaseClient
        .from('notifications')
        .select('*')
        .eq('type', type)
        .order('created_at', { ascending: false })
        .order('id', { ascending: false })
      if (filter) request = request.or(filter)
      const { data, error } = await request.limit(limit + 1)
      throwIfSupabaseError(error)
      return mapPage(data as NotificationRow[] | null, limit, mapNotification)
    },
    fromRealtime(row) {
      return isRealtimeNotificationRow(row) ? mapNotification(row) : null
    },
  }
}

export function createProfilesRepository(): ProfilesRepository {
  return {
    async getById(profileId) {
      const { data, error } = await supabaseClient.from('profiles').select('*').eq('id', profileId).maybeSingle()
      throwIfSupabaseError(error)
      return data ? mapProfile(data as ProfileRow) : null
    },
    async getMe() {
      return this.getById(await requireCurrentUserId())
    },
    async updateMe(input) {
      const userId = await requireCurrentUserId()
      const { data, error } = await supabaseClient
        .from('profiles')
        .update({ display_name: input.displayName, avatar_path: input.avatarPath, bio: input.bio })
        .eq('id', userId)
        .select('*')
        .single()
      throwIfSupabaseError(error)
      return mapProfile(data as ProfileRow)
    },
  }
}

export const communitiesRepository = createCommunitiesRepository()
export const membersRepository = createMembersRepository()
export const postsRepository = createPostsRepository()
export const commentsRepository = createCommentsRepository()
export const reactionsRepository = createReactionsRepository()
export const invitesRepository = createInvitesRepository()
export const joinRequestsRepository = createJoinRequestsRepository()
export const channelsRepository = createChannelsRepository()
export const messagesRepository = createMessagesRepository()
export const reportsRepository = createReportsRepository()
export const notificationsRepository = createNotificationsRepository()
export const profilesRepository = createProfilesRepository()
