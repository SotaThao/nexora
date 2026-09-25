import { mapSupabaseError, type SupabaseDisplayError } from '../../../lib/supabaseError'
import { supabaseClient } from '../../../lib/supabaseClient'

export interface JobContactDto {
  jobId: string
  channelId: string
  lastContactedAt: string
}

export interface JobContactsRepositoryError extends SupabaseDisplayError {
  isMissingTable: boolean
}

export interface JobContactsRepository {
  /** Lists the caller's contacted jobs, newest contact first. */
  listMyJobContacts(): Promise<JobContactDto[]>
  /** Records or refreshes the caller's direct-message channel for a job. */
  recordJobContact(jobId: string, channelId: string): Promise<void>
}

type JobContactRow = {
  job_id: string
  channel_id: string
  last_contacted_at: string
}

function mapJobContactsError(error: unknown): JobContactsRepositoryError {
  const mapped = mapSupabaseError(error)
  return {
    ...mapped,
    isMissingTable: mapped.code === 'PGRST205' || mapped.code === '42P01',
  }
}

function throwIfSupabaseError(error: unknown): void {
  if (error) throw mapJobContactsError(error)
}

async function requireCurrentUserId(): Promise<string> {
  const { data, error } = await supabaseClient.auth.getUser()
  throwIfSupabaseError(error)
  if (!data.user) {
    throw mapJobContactsError({ name: 'AuthApiError', status: 401, message: 'Authentication is required' })
  }
  return data.user.id
}

function mapJobContact(row: JobContactRow): JobContactDto {
  return {
    jobId: row.job_id,
    channelId: row.channel_id,
    lastContactedAt: row.last_contacted_at,
  }
}

export function createJobContactsRepository(): JobContactsRepository {
  return {
    async listMyJobContacts() {
      const { data, error } = await supabaseClient
        .from('community_job_contacts')
        .select('job_id,channel_id,last_contacted_at')
        .order('last_contacted_at', { ascending: false })
      throwIfSupabaseError(error)
      return ((data ?? []) as JobContactRow[]).map(mapJobContact)
    },

    async recordJobContact(jobId, channelId) {
      const userId = await requireCurrentUserId()
      const { error } = await supabaseClient
        .from('community_job_contacts')
        .upsert(
          {
            user_id: userId,
            job_id: jobId,
            channel_id: channelId,
          },
          { onConflict: 'user_id,job_id' },
        )
      throwIfSupabaseError(error)
    },
  }
}

export const jobContactsRepository = createJobContactsRepository()
