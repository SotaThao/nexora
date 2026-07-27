import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createDirectMessagesRepository } from './directMessages'

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  from: vi.fn(),
}))

vi.mock('../../../lib/supabaseClient', () => ({
  supabaseClient: {
    auth: { getUser: mocks.getUser },
    from: mocks.from,
    rpc: vi.fn(),
  },
}))

function channelQuery(data: unknown[]) {
  const chain = {
    select: vi.fn(),
    eq: vi.fn(),
    order: vi.fn(),
  }
  chain.select.mockReturnValue(chain)
  chain.eq.mockReturnValue(chain)
  chain.order.mockResolvedValue({ data, error: null })
  return chain
}

function profileQuery(data: unknown[]) {
  const chain = {
    select: vi.fn(),
    neq: vi.fn(),
    ilike: vi.fn(),
    order: vi.fn(),
    limit: vi.fn(),
  }
  chain.select.mockReturnValue(chain)
  chain.neq.mockReturnValue(chain)
  chain.ilike.mockReturnValue(chain)
  chain.order.mockReturnValue(chain)
  chain.limit.mockResolvedValue({ data, error: null })
  return chain
}

describe('directMessagesRepository', () => {
  beforeEach(() => {
    mocks.getUser.mockReset().mockResolvedValue({ data: { user: { id: 'kayla' } }, error: null })
    mocks.from.mockReset()
  })

  it('normalizes channel rows into the public DirectChannelDto shape', async () => {
    const query = channelQuery([
      {
        id: 'dm-1',
        kind: 'direct',
        name: 'Direct',
        created_at: '2026-07-22T22:31:00.000Z',
        participants: [
          {
            user_id: 'kayla',
            profile: { id: 'kayla', display_name: 'Kayla Le', avatar_path: null },
          },
          {
            user_id: 'jessica',
            profile: { id: 'jessica', display_name: 'Jessica Nguyen', avatar_path: 'avatars/jessica.jpg' },
          },
        ],
      },
    ])
    mocks.from.mockReturnValue(query)

    const result = await createDirectMessagesRepository().listDirectChannels()

    expect(mocks.from).toHaveBeenCalledWith('channels')
    expect(query.eq).toHaveBeenCalledWith('kind', 'direct')
    expect(query.order).toHaveBeenCalledWith('created_at', { ascending: false })
    expect(result).toEqual([
      {
        id: 'dm-1',
        kind: 'direct',
        name: 'Direct',
        participantIds: ['kayla', 'jessica'],
        otherParticipant: {
          id: 'jessica',
          displayName: 'Jessica Nguyen',
          avatarPath: 'avatars/jessica.jpg',
        },
        createdAt: '2026-07-22T22:31:00.000Z',
      },
    ])
  })

  it('escapes profile search wildcards and clamps the result limit', async () => {
    const query = profileQuery([
      { id: 'jessica', display_name: 'Jessica Nguyen', avatar_path: null },
    ])
    mocks.from.mockReturnValue(query)

    const result = await createDirectMessagesRepository().searchProfiles('  Jess%_  ', 100)

    expect(mocks.from).toHaveBeenCalledWith('dm_profile_directory')
    expect(query.neq).toHaveBeenCalledWith('id', 'kayla')
    expect(query.ilike).toHaveBeenCalledWith('display_name', '%Jess\\%\\_%')
    expect(query.limit).toHaveBeenCalledWith(50)
    expect(result).toEqual([
      { id: 'jessica', displayName: 'Jessica Nguyen', avatarPath: null },
    ])
  })
})
