import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createJobContactsRepository } from './jobContacts'

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  from: vi.fn(),
}))

vi.mock('../../../lib/supabaseClient', () => ({
  supabaseClient: {
    auth: { getUser: mocks.getUser },
    from: mocks.from,
  },
}))

function listQuery(data: unknown[], error: unknown = null) {
  const chain = {
    select: vi.fn(),
    order: vi.fn(),
  }
  chain.select.mockReturnValue(chain)
  chain.order.mockResolvedValue({ data, error })
  return chain
}

function upsertQuery(error: unknown = null) {
  return {
    upsert: vi.fn().mockResolvedValue({ error }),
  }
}

describe('jobContactsRepository', () => {
  beforeEach(() => {
    mocks.getUser.mockReset().mockResolvedValue({ data: { user: { id: 'kayla' } }, error: null })
    mocks.from.mockReset()
  })

  it('maps persisted rows and requests newest contacts first', async () => {
    const query = listQuery([
      {
        job_id: 'j14',
        channel_id: 'dm-14',
        last_contacted_at: '2026-09-24T10:30:00.000Z',
      },
      {
        job_id: 'j11',
        channel_id: 'dm-11',
        last_contacted_at: '2026-09-23T08:00:00.000Z',
      },
    ])
    mocks.from.mockReturnValue(query)

    const result = await createJobContactsRepository().listMyJobContacts()

    expect(mocks.from).toHaveBeenCalledWith('community_job_contacts')
    expect(query.select).toHaveBeenCalledWith('job_id,channel_id,last_contacted_at')
    expect(query.order).toHaveBeenCalledWith('last_contacted_at', { ascending: false })
    expect(result).toEqual([
      { jobId: 'j14', channelId: 'dm-14', lastContactedAt: '2026-09-24T10:30:00.000Z' },
      { jobId: 'j11', channelId: 'dm-11', lastContactedAt: '2026-09-23T08:00:00.000Z' },
    ])
  })

  it('upserts only the caller and contact fields so the database owns timestamps', async () => {
    const query = upsertQuery()
    mocks.from.mockReturnValue(query)

    await createJobContactsRepository().recordJobContact('j3', 'dm-3')

    expect(mocks.from).toHaveBeenCalledWith('community_job_contacts')
    expect(query.upsert).toHaveBeenCalledWith(
      {
        user_id: 'kayla',
        job_id: 'j3',
        channel_id: 'dm-3',
      },
      { onConflict: 'user_id,job_id' },
    )
  })

  it.each(['PGRST205', '42P01'])('classifies missing-table error %s', async (code) => {
    mocks.from.mockReturnValue(listQuery([], { code, message: 'relation does not exist' }))

    await expect(createJobContactsRepository().listMyJobContacts()).rejects.toMatchObject({
      code,
      isMissingTable: true,
    })
  })

  it('maps generic Supabase errors without classifying them as a missing table', async () => {
    mocks.from.mockReturnValue(listQuery([], { code: '42501', message: 'permission denied' }))

    await expect(createJobContactsRepository().listMyJobContacts()).rejects.toMatchObject({
      code: '42501',
      retryable: false,
      isMissingTable: false,
    })
  })
})
