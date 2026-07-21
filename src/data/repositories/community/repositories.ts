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
  MessageDto,
  NotificationDto,
  PostDto,
  ProfileDto,
  ReactionDto,
  ReportDto,
  UpdateCommunityInput,
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
  /** Creates a post. Media values are storage paths, never signed URLs. */
  create(input: CreatePostInput): Promise<PostDto>
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
}

export interface ProfilesRepository {
  /** Reads a profile visible to the current actor. */
  getById(profileId: string): Promise<ProfileDto | null>
  /** Reads the current actor's profile. */
  getMe(): Promise<ProfileDto | null>
  /** Updates the current actor's mutable profile fields. */
  updateMe(input: Pick<ProfileDto, 'displayName' | 'avatarPath' | 'bio'>): Promise<ProfileDto>
  /** Resolves one stored media path to a public or signed URL at the repository boundary. */
  resolveMediaUrl(asset: MediaAsset): Promise<string>
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
  community_id: string
  kind: ChannelKind
  name: string
  created_at: string
}

type MessageRow = {
  id: string
  channel_id: string
  sender_id: string
  body: string
  reply_to_message_id: string | null
  created_at: string
  updated_at: string
  sender?: ProfileRow | null
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

function mapMedia(paths: unknown, visibility: CommunityVisibility = 'public'): MediaAsset[] {
  if (!Array.isArray(paths)) return []
  const bucket = visibility === 'private' ? 'community-private' : 'community-public'
  return paths.filter((path): path is string => typeof path === 'string').map((path) => ({ bucket, path }))
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
    media: mapMedia(row.media_paths),
    isAnnouncement: row.is_announcement,
    author: row.author ? mapProfile(row.author) : undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
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
    replyToMessageId: row.reply_to_message_id,
    sender: row.sender ? mapProfile(row.sender) : undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
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
        .select('*,author:profiles!posts_author_id_fkey(*)')
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
        .select('*,author:profiles!posts_author_id_fkey(*)')
        .eq('id', postId)
        .maybeSingle()
      throwIfSupabaseError(error)
      return data ? mapPost(data as PostRow) : null
    },
    async create(input) {
      const authorId = await requireCurrentUserId()
      const { data, error } = await supabaseClient
        .from('posts')
        .insert({
          community_id: input.communityId,
          author_id: authorId,
          body: input.body.trim(),
          media_paths: (input.media ?? []).map((asset) => asset.path),
          is_announcement: input.isAnnouncement ?? false,
        })
        .select('*,author:profiles!posts_author_id_fkey(*)')
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
        .select('*,sender:profiles!messages_sender_id_fkey(*)')
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
    async send(input) {
      const senderId = await requireCurrentUserId()
      const { data, error } = await supabaseClient
        .from('messages')
        .insert({
          channel_id: input.channelId,
          sender_id: senderId,
          body: input.body.trim(),
          reply_to_message_id: input.replyToMessageId ?? null,
        })
        .select('*,sender:profiles!messages_sender_id_fkey(*)')
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
    list: () => notImplemented('notificationsRepository', 'list'),
    getUnreadCount: () => notImplemented('notificationsRepository', 'getUnreadCount'),
    markRead: () => notImplemented('notificationsRepository', 'markRead'),
    markAllRead: () => notImplemented('notificationsRepository', 'markAllRead'),
    listByType: () => notImplemented('notificationsRepository', 'listByType'),
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
    async resolveMediaUrl(asset) {
      if (asset.bucket === 'community-public') {
        return supabaseClient.storage.from(asset.bucket).getPublicUrl(asset.path).data.publicUrl
      }
      const { data, error } = await supabaseClient.storage.from(asset.bucket).createSignedUrl(asset.path, 60 * 10)
      throwIfSupabaseError(error)
      if (!data?.signedUrl) throw mapSupabaseError({ message: 'Storage URL unavailable', status: 500 })
      return data.signedUrl
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
