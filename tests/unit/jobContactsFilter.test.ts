import { describe, expect, it } from 'vitest'

import { filterJobsForState } from '../../src/components/community/CommunityJobDetail'
import { demoJobs } from '../../src/components/community/communityDemoContent'
import { createInitialPanelState } from '../../src/components/community/communityJobsReducer'
import type { JobContactDto } from '../../src/data/hooks/useJobContacts'
import type { PanelState } from '../../src/components/community/communityJobsReducer'

const contacts: JobContactDto[] = [
  { jobId: 'j11', channelId: 'dm-11', lastContactedAt: '2026-09-24T09:00:00.000Z' },
  { jobId: 'j14', channelId: 'dm-14', lastContactedAt: '2026-09-24T11:00:00.000Z' },
  { jobId: 'j1', channelId: 'dm-1', lastContactedAt: '2026-09-24T10:00:00.000Z' },
]

function panelState(overrides: Partial<PanelState>): PanelState {
  return { ...createInitialPanelState(), ...overrides }
}

describe('filterJobsForState contacted view', () => {
  it('includes closed and filled contacted jobs, excludes the rest, and orders newest first', () => {
    const result = filterJobsForState(
      demoJobs,
      panelState({ viewTab: 'contacted' }),
      null,
      contacts,
    )

    expect(result.map((job) => job.id)).toEqual(['j14', 'j1', 'j11'])
    expect(result.find((job) => job.id === 'j14')?.status).toBe('closed')
    expect(result.find((job) => job.id === 'j11')?.status).toBe('filled')
  })

  it('still applies kind, location, and search filters', () => {
    const result = filterJobsForState(
      demoJobs,
      panelState({
        viewTab: 'contacted',
        kindFilter: 'hiring',
        locationFilter: 'Austin, TX',
        query: 'The Domain',
      }),
      null,
      contacts,
    )

    expect(result.map((job) => job.id)).toEqual(['j11'])
  })

  it('leaves browse behavior open-only', () => {
    const result = filterJobsForState(
      demoJobs,
      panelState({ viewTab: 'browse' }),
      null,
      contacts,
    )

    expect(result.length).toBeGreaterThan(0)
    expect(result.every((job) => job.status === 'open')).toBe(true)
    expect(result.map((job) => job.id)).toContain('j1')
    expect(result.map((job) => job.id)).not.toContain('j11')
    expect(result.map((job) => job.id)).not.toContain('j14')
  })
})
