import { mapSupabaseError, type SupabaseDisplayError } from '../../../lib/supabaseError'
import { supabaseClient } from '../../../lib/supabaseClient'
import type { DirectChannelDto, DirectMessageProfileDto } from './types'

export interface DirectMessagesRepository {
  /** Resolves the canonical 1:1 channel for the caller and another user. */
  findOrCreateDirectChannel(otherUserId: string): Promise<DirectChannelDto>
  /** Lists direct channels visible to the current caller. */
  listDirectChannels(): Promise<DirectChannelDto[]>
  /** Searches the minimal, open DM profile directory. */
  searchProfiles(query: string, limit?: number): Promise<DirectMessageProfileDto[]>
}

type DirectMessageProfileRow = {
  id: string
  display_name: string
  avatar_path: string | null
}

type DirectChannelParticipantRow = {
  user_id: string
  profile?: DirectMessageProfileRow | DirectMessageProfileRow[] | null
}

type DirectChannelRow = {
  id: string
  kind: 'direct'
  name: string
  created_at: string
  participants?: DirectChannelParticipantRow[] | null
}

type DirectChannelRpcRow = Omit<DirectChannelRow, 'participants'> & {
  community_id: null
}

const directChannelSelect = `
  id,
  kind,
  name,
  created_at,
  participants:direct_channel_participants (
    user_id,
    profile:profiles!direct_channel_participants_user_id_fkey (
      id,
      display_name,
      avatar_path
    )
  )
`

function throwIfSupabaseError(error: unknown): void {
  if (error) throw mapSupabaseError(error)
}

function missingDirectChannelError(): SupabaseDisplayError {
  return mapSupabaseError({ code: 'PGRST116', message: 'Direct channel was not found' })
}

async function requireCurrentUserId(): Promise<string> {
  const { data, error } = await supabaseClient.auth.getUser()
  throwIfSupabaseError(error)
  if (!data.user) throw mapSupabaseError({ name: 'AuthApiError', status: 401, message: 'Authentication is required' })
  return data.user.id
}

function mapProfile(row: DirectMessageProfileRow): DirectMessageProfileDto {
  return {
    id: row.id,
    displayName: row.display_name,
    avatarPath: row.avatar_path,
  }
}

function mapDirectChannel(row: DirectChannelRow, currentUserId: string): DirectChannelDto {
  const participants = row.participants ?? []
  const profileRelation = participants.find((participant) => participant.user_id !== currentUserId)?.profile
  const otherProfile = Array.isArray(profileRelation) ? profileRelation[0] : profileRelation
  if (!otherProfile) throw missingDirectChannelError()
  return {
    id: row.id,
    kind: 'direct',
    name: row.name,
    participantIds: participants.map((participant) => participant.user_id),
    otherParticipant: mapProfile(otherProfile),
    createdAt: row.created_at,
  }
}

async function getDirectChannel(channelId: string, currentUserId: string): Promise<DirectChannelDto> {
  const { data, error } = await supabaseClient
    .from('channels')
    .select(directChannelSelect)
    .eq('id', channelId)
    .eq('kind', 'direct')
    .maybeSingle()
  throwIfSupabaseError(error)
  if (!data) throw missingDirectChannelError()
  return mapDirectChannel(data as DirectChannelRow, currentUserId)
}

function escapeIlikePattern(value: string): string {
  return value.replace(/[\\%_]/g, (character) => `\\${character}`)
}

export function createDirectMessagesRepository(): DirectMessagesRepository {
  return {
    async findOrCreateDirectChannel(otherUserId) {
      const currentUserId = await requireCurrentUserId()
      const { data, error } = await supabaseClient.rpc('find_or_create_direct_channel', {
        p_other_user_id: otherUserId,
      })
      throwIfSupabaseError(error)
      const channel = data as DirectChannelRpcRow | null
      if (!channel?.id) throw missingDirectChannelError()
      return getDirectChannel(channel.id, currentUserId)
    },

    async listDirectChannels() {
      const currentUserId = await requireCurrentUserId()
      const { data, error } = await supabaseClient
        .from('channels')
        .select(directChannelSelect)
        .eq('kind', 'direct')
        .order('created_at', { ascending: false })
      throwIfSupabaseError(error)
      return ((data ?? []) as DirectChannelRow[]).map((row) => mapDirectChannel(row, currentUserId))
    },

    async searchProfiles(query, limit = 20) {
      const normalizedQuery = query.trim()
      if (!normalizedQuery) return []
      const currentUserId = await requireCurrentUserId()
      const safeLimit = Math.min(Math.max(limit, 1), 50)
      const { data, error } = await supabaseClient
        .from('dm_profile_directory')
        .select('id,display_name,avatar_path')
        .neq('id', currentUserId)
        .ilike('display_name', `%${escapeIlikePattern(normalizedQuery)}%`)
        .order('display_name', { ascending: true })
        .limit(safeLimit)
      throwIfSupabaseError(error)
      return ((data ?? []) as DirectMessageProfileRow[]).map(mapProfile)
    },
  }
}

export const directMessagesRepository = createDirectMessagesRepository()
