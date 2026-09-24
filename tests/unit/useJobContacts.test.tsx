import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useMyJobContacts, useRecordJobContact } from '../../src/data/hooks/useJobContacts'

const mocks = vi.hoisted(() => ({
  auth: { authReady: true, isAnonymous: false },
  listMyJobContacts: vi.fn(),
  recordJobContact: vi.fn(),
  warn: vi.fn(),
}))

vi.mock('../../src/components/community/CommunityAuth', () => ({
  useCommunityAuth: () => mocks.auth,
}))

vi.mock('../../src/data/repositories/community', () => ({
  jobContactsRepository: {
    listMyJobContacts: mocks.listMyJobContacts,
    recordJobContact: mocks.recordJobContact,
  },
}))

vi.mock('../../src/utils/logger', () => ({
  logger: { warn: mocks.warn },
}))

function JobContactsHarness({ enabled }: { enabled: boolean }) {
  const contacts = useMyJobContacts({ enabled })
  const record = useRecordJobContact()

  return (
    <div>
      <span data-testid="contact-count">{contacts.data?.length ?? 0}</span>
      <button
        type="button"
        onClick={() => record.mutate({ jobId: 'j3', channelId: 'dm-3' })}
      >
        Record contact
      </button>
    </div>
  )
}

describe('useJobContacts data boundary', () => {
  beforeEach(() => {
    mocks.auth.authReady = true
    mocks.auth.isAnonymous = false
    mocks.listMyJobContacts.mockReset().mockResolvedValue([
      { jobId: 'j2', channelId: 'dm-2', lastContactedAt: '2026-09-24T10:00:00.000Z' },
    ])
    mocks.recordJobContact.mockReset().mockResolvedValue(undefined)
    mocks.warn.mockReset()
  })

  it('does not call the repository when the query is disabled', async () => {
    render(<JobContactsHarness enabled={false} />)

    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(mocks.listMyJobContacts).not.toHaveBeenCalled()
  })

  it('invalidates and refetches contacts after a successful record', async () => {
    render(<JobContactsHarness enabled />)

    await waitFor(() => expect(screen.getByTestId('contact-count')).toHaveTextContent('1'))
    expect(mocks.listMyJobContacts).toHaveBeenCalledTimes(1)

    fireEvent.click(screen.getByRole('button', { name: 'Record contact' }))

    await waitFor(() => expect(mocks.recordJobContact).toHaveBeenCalledWith('j3', 'dm-3'))
    await waitFor(() => expect(mocks.listMyJobContacts).toHaveBeenCalledTimes(2))
  })

  it('logs a record failure from the hook after the calling component unmounts', async () => {
    const error = { message: 'write failed', retryable: true, isMissingTable: false }
    mocks.recordJobContact.mockRejectedValueOnce(error)
    const view = render(<JobContactsHarness enabled />)

    fireEvent.click(screen.getByRole('button', { name: 'Record contact' }))
    view.unmount()

    await waitFor(() => {
      expect(mocks.warn).toHaveBeenCalledWith(
        '[CommunityJobs] Failed to record job contact',
        error,
      )
    })
  })
})
