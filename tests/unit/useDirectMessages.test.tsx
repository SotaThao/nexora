import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { useQueryClient } from '@tanstack/react-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  useDirectChannels,
  useFindOrCreateDirectChannel,
  useProfileSearch,
} from '../../src/data/hooks/useDirectMessages'
import { qk } from '../../src/data/queryKeys'

const mocks = vi.hoisted(() => ({
  auth: { authReady: true, isAnonymous: false },
  listDirectChannels: vi.fn(),
  findOrCreateDirectChannel: vi.fn(),
  searchProfiles: vi.fn(),
}))

vi.mock('../../src/components/community/CommunityAuth', () => ({
  useCommunityAuth: () => mocks.auth,
}))

vi.mock('../../src/data/repositories/community', () => ({
  directMessagesRepository: {
    listDirectChannels: mocks.listDirectChannels,
    findOrCreateDirectChannel: mocks.findOrCreateDirectChannel,
    searchProfiles: mocks.searchProfiles,
  },
}))

const createdChannel = {
  id: 'dm-2',
  kind: 'direct' as const,
  name: 'Direct',
  participantIds: ['kayla', 'linh'],
  otherParticipant: { id: 'linh', displayName: 'Linh Tran', avatarPath: null },
  createdAt: '2026-07-27T00:00:00.000Z',
}

function DirectMessageHarness() {
  const queryClient = useQueryClient()
  const channels = useDirectChannels()
  const create = useFindOrCreateDirectChannel()
  const cachedChannel = create.isSuccess
    ? queryClient.getQueryData<typeof createdChannel>(qk.communityDirectChannel(createdChannel.id))
    : undefined

  return (
    <div>
      <span data-testid="channel-count">{channels.data?.length ?? 0}</span>
      <span data-testid="cached-channel">{cachedChannel?.otherParticipant.displayName ?? ''}</span>
      <button type="button" onClick={() => create.mutate('linh')}>Create DM</button>
    </div>
  )
}

function ProfileSearchHarness({ query }: { query: string }) {
  const profiles = useProfileSearch(query)
  return <span data-testid="profile-count">{profiles.data?.length ?? 0}</span>
}

describe('useDirectMessages data boundary', () => {
  beforeEach(() => {
    mocks.auth.authReady = true
    mocks.auth.isAnonymous = false
    mocks.listDirectChannels.mockReset().mockResolvedValue([createdChannel])
    mocks.findOrCreateDirectChannel.mockReset().mockResolvedValue(createdChannel)
    mocks.searchProfiles.mockReset().mockResolvedValue([
      { id: 'jessica', displayName: 'Jessica Nguyen', avatarPath: null },
    ])
  })

  it('loads DM channels and refetches the active list after find-or-create succeeds', async () => {
    render(<DirectMessageHarness />)

    await waitFor(() => expect(screen.getByTestId('channel-count')).toHaveTextContent('1'))
    expect(mocks.listDirectChannels).toHaveBeenCalledTimes(1)

    fireEvent.click(screen.getByRole('button', { name: 'Create DM' }))

    await waitFor(() => expect(mocks.findOrCreateDirectChannel).toHaveBeenCalledWith('linh'))
    await waitFor(() => expect(mocks.listDirectChannels).toHaveBeenCalledTimes(2))
    expect(screen.getByTestId('cached-channel')).toHaveTextContent('Linh Tran')
  })

  it('does not search below the two-character threshold and trims an eligible query', async () => {
    const view = render(<ProfileSearchHarness query="J" />)
    expect(mocks.searchProfiles).not.toHaveBeenCalled()

    view.rerender(<ProfileSearchHarness query="  Jess  " />)
    await waitFor(() => expect(mocks.searchProfiles).toHaveBeenCalledWith('Jess'))
    await waitFor(() => expect(screen.getByTestId('profile-count')).toHaveTextContent('1'))
  })

  it('does not call the DM repository for an anonymous session', async () => {
    mocks.auth.isAnonymous = true
    render(<DirectMessageHarness />)

    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(mocks.listDirectChannels).not.toHaveBeenCalled()
  })
})
