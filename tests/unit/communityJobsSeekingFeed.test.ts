import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { SeekingExperience } from '../../src/constants/communityJobs'
import {
  JobPayType,
  JobPostingStatus,
  JobWorkType,
  RecruitmentSkill,
} from '../../src/constants/posRecruitment'
import {
  communityJobsMockClient,
  resetCommunityJobsMockStore,
} from '../../src/data/repositories/communityJobsMockClient'
import { communityJobsRepository } from '../../src/data/repositories/communityJobs'
import type { HiringFeedFilters, SeekingPostWriteDto } from '../../src/types/communityJobs'

const STAFF_A = 'staff-a'
const STAFF_B = 'staff-b'
const SEED_PREFIX = 'mock-seeking-seed-'

function makeWriteDto(overrides: Partial<SeekingPostWriteDto> = {}): SeekingPostWriteDto {
  return {
    title: 'Experienced nail technician seeking a position',
    skills: [RecruitmentSkill.Acrylic],
    experience: SeekingExperience.OneToThreeYears,
    workTypes: [JobWorkType.FullTime],
    city: 'Austin',
    state: 'TX',
    payType: JobPayType.Negotiable,
    payText: null,
    availableFrom: null,
    body: 'Reliable technician with a loyal client base, available to start soon.',
    displayName: 'Test Seeker',
    phone: '(555) 010-0000',
    visibility: { showFullName: true, showPhone: false },
    status: JobPostingStatus.Published,
    ...overrides,
  }
}

async function publish(staffKey: string, overrides: Partial<SeekingPostWriteDto> = {}, id?: string) {
  return communityJobsMockClient.writeSeekingPost(
    staffKey,
    makeWriteDto({ status: JobPostingStatus.Published, ...overrides }),
    id,
  )
}

async function feedIds(filters: HiringFeedFilters = {}): Promise<string[]> {
  const response = await communityJobsMockClient.listSeekingFeed(filters)
  return response.items.map((item) => item.id)
}

describe('communityJobsMockClient.listSeekingFeed', () => {
  beforeEach(() => {
    resetCommunityJobsMockStore()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('envelope and seeds', () => {
    it('returns seed posts for empty filters in a single-page envelope', async () => {
      const response = await communityJobsMockClient.listSeekingFeed({})

      expect(response.items.length).toBeGreaterThanOrEqual(3)
      expect(response.pageNumber).toBe(1)
      expect(response.totalPages).toBe(1)
      expect(response.totalCount).toBe(response.items.length)
      expect(response.hasNextPage).toBe(false)
      expect(response.hasPreviousPage).toBe(false)
    })

    it('uses fictional seed ids and only Published seeds', async () => {
      const response = await communityJobsMockClient.listSeekingFeed({})

      for (const item of response.items) {
        expect(item.id.startsWith(SEED_PREFIX)).toBe(true)
        expect(item.status).toBe(JobPostingStatus.Published)
      }
    })

    it('returns the same seeds after a reset', async () => {
      const before = await feedIds({})
      await publish(STAFF_A)
      resetCommunityJobsMockStore()
      expect(await feedIds({})).toEqual(before)
    })
  })

  describe('which posts appear', () => {
    it('includes published posts from two different staffKeys', async () => {
      const a = await publish(STAFF_A, { title: 'Post from A' })
      const b = await publish(STAFF_B, { title: 'Post from B' })

      const ids = await feedIds({})
      expect(ids).toContain(a.id)
      expect(ids).toContain(b.id)
      expect(ids.filter((id) => id.startsWith(SEED_PREFIX)).length).toBeGreaterThanOrEqual(3)
    })

    it('excludes draft posts', async () => {
      const draft = await communityJobsMockClient.writeSeekingPost(
        STAFF_A,
        makeWriteDto({ status: JobPostingStatus.Draft }),
      )

      expect(await feedIds({})).not.toContain(draft.id)
    })

    it('excludes posts that are not Published (Pending)', async () => {
      const pending = await communityJobsMockClient.writeSeekingPost(
        STAFF_A,
        makeWriteDto({ status: JobPostingStatus.Pending }),
      )

      expect(await feedIds({})).not.toContain(pending.id)
    })

    it('excludes a post after it is closed', async () => {
      const post = await publish(STAFF_A)
      expect(await feedIds({})).toContain(post.id)

      await communityJobsMockClient.closeSeekingPost(STAFF_A, post.id)

      expect(await feedIds({})).not.toContain(post.id)
    })

    it('does not duplicate a post when it is edited (same id)', async () => {
      const post = await publish(STAFF_A, { title: 'Original title' })
      await publish(STAFF_A, { title: 'Edited title' }, post.id)

      const response = await communityJobsMockClient.listSeekingFeed({})
      const matches = response.items.filter((item) => item.id === post.id)
      expect(matches).toHaveLength(1)
      expect(matches[0].title).toBe('Edited title')
      expect(new Set(response.items.map((item) => item.id)).size).toBe(response.items.length)
    })

    it('drops a published post from the feed when it is edited back to draft', async () => {
      const post = await publish(STAFF_A)
      await communityJobsMockClient.writeSeekingPost(
        STAFF_A,
        makeWriteDto({ status: JobPostingStatus.Draft }),
        post.id,
      )

      expect(await feedIds({})).not.toContain(post.id)
    })

    it('keeps totalCount equal to items length after publishing', async () => {
      await publish(STAFF_A)
      await publish(STAFF_B)
      const response = await communityJobsMockClient.listSeekingFeed({})
      expect(response.totalCount).toBe(response.items.length)
    })
  })

  describe('sorting', () => {
    it('sorts by publishedAt descending, newest published first', async () => {
      vi.useFakeTimers({ toFake: ['Date'] })

      vi.setSystemTime(new Date('2031-01-01T10:00:00.000Z'))
      const older = await publish(STAFF_A, { title: 'Older post' })
      vi.setSystemTime(new Date('2031-01-02T10:00:00.000Z'))
      const newer = await publish(STAFF_B, { title: 'Newer post' })

      const response = await communityJobsMockClient.listSeekingFeed({})
      const ids = response.items.map((item) => item.id)

      expect(ids[0]).toBe(newer.id)
      expect(ids[1]).toBe(older.id)
      expect(ids.indexOf(newer.id)).toBeLessThan(ids.indexOf(older.id))

      const stamps = response.items.map((item) => item.publishedAt ?? '')
      expect(stamps).toEqual([...stamps].sort((x, y) => y.localeCompare(x)))
    })
  })

  describe('filters', () => {
    it('filters by workType', async () => {
      const partTime = await publish(STAFF_A, { workTypes: [JobWorkType.PartTime] })
      const fullOnly = await publish(STAFF_A, { workTypes: [JobWorkType.FullTime] })
      const multi = await publish(STAFF_B, { workTypes: [JobWorkType.FullTime, JobWorkType.Flexible] })

      const response = await communityJobsMockClient.listSeekingFeed({ workType: JobWorkType.Flexible })
      const ids = response.items.map((item) => item.id)

      expect(ids).toContain(multi.id)
      expect(ids).not.toContain(partTime.id)
      expect(ids).not.toContain(fullOnly.id)
      for (const item of response.items) {
        expect(item.workTypes).toContain(JobWorkType.Flexible)
      }
      expect(response.totalCount).toBe(response.items.length)
    })

    it('filters by skill', async () => {
      const withLash = await publish(STAFF_A, { skills: [RecruitmentSkill.Acrylic, RecruitmentSkill.Lash] })
      const withoutLash = await publish(STAFF_B, { skills: [RecruitmentSkill.Dip] })

      const response = await communityJobsMockClient.listSeekingFeed({ skill: RecruitmentSkill.Lash })
      const ids = response.items.map((item) => item.id)

      expect(ids).toContain(withLash.id)
      expect(ids).not.toContain(withoutLash.id)
      for (const item of response.items) {
        expect(item.skills).toContain(RecruitmentSkill.Lash)
      }
    })

    it('treats null workType and skill as no filter', async () => {
      const all = await feedIds({})
      expect(await feedIds({ workType: null, skill: null })).toEqual(all)
    })

    it('filters by city case-insensitively', async () => {
      const houston = await publish(STAFF_A, { city: 'Houston' })
      const dallas = await publish(STAFF_A, { city: 'Dallas' })

      const ids = await feedIds({ city: 'houston' })
      expect(ids).toContain(houston.id)
      expect(ids).not.toContain(dallas.id)

      expect(await feedIds({ city: 'HOUSTON' })).toContain(houston.id)
    })

    it('filters by city ignoring diacritics', async () => {
      const danang = await publish(STAFF_A, { city: 'Đà Nẵng' })
      const other = await publish(STAFF_A, { city: 'Hue' })

      const ids = await feedIds({ city: 'da nang' })
      expect(ids).toContain(danang.id)
      expect(ids).not.toContain(other.id)

      const reverse = await publish(STAFF_B, { city: 'San Jose' })
      expect(await feedIds({ city: 'SAN JOSÉ' })).toContain(reverse.id)
    })

    it('uses equality for city, not substring', async () => {
      const post = await publish(STAFF_A, { city: 'Houston' })
      expect(await feedIds({ city: 'Hous' })).not.toContain(post.id)
    })

    it('filters by state case-insensitively', async () => {
      const wa = await publish(STAFF_A, { state: 'WA' })
      const tx = await publish(STAFF_A, { state: 'TX' })

      const ids = await feedIds({ state: 'wa' })
      expect(ids).toContain(wa.id)
      expect(ids).not.toContain(tx.id)
    })

    it('filters by keyword in the title', async () => {
      const hit = await publish(STAFF_A, { title: 'Zebrafish stylist wanted placement' })
      const miss = await publish(STAFF_A, { title: 'Ordinary title' })

      const ids = await feedIds({ keyword: 'zebrafish' })
      expect(ids).toContain(hit.id)
      expect(ids).not.toContain(miss.id)
    })

    it('filters by keyword in the body', async () => {
      const hit = await publish(STAFF_A, { body: 'I specialize in quokkaglaze finishing for years.' })
      const miss = await publish(STAFF_A, { body: 'Generic description with nothing special.' })

      const ids = await feedIds({ keyword: 'QuokkaGlaze' })
      expect(ids).toContain(hit.id)
      expect(ids).not.toContain(miss.id)
    })

    it('filters by keyword in the skills', async () => {
      const hit = await publish(STAFF_A, { skills: [RecruitmentSkill.HeadSpa] })
      const miss = await publish(STAFF_A, { skills: [RecruitmentSkill.Dip] })

      const ids = await feedIds({ keyword: 'headspa' })
      expect(ids).toContain(hit.id)
      expect(ids).not.toContain(miss.id)
    })

    it('filters by keyword in the city', async () => {
      const hit = await publish(STAFF_A, { city: 'Tucson' })
      const miss = await publish(STAFF_A, { city: 'Boise' })

      const ids = await feedIds({ keyword: 'tucson' })
      expect(ids).toContain(hit.id)
      expect(ids).not.toContain(miss.id)
    })

    it('matches keywords ignoring diacritics and case', async () => {
      const hit = await publish(STAFF_A, { title: 'Thợ nail chuyên nghiệp' })

      expect(await feedIds({ keyword: 'THO NAIL' })).toContain(hit.id)
      expect(await feedIds({ keyword: 'chuyên nghiệp' })).toContain(hit.id)
    })

    it('does not search fields outside title, skills, body and city', async () => {
      const post = await publish(STAFF_A, { displayName: 'Xylophonia Quillbert' })
      expect(await feedIds({ keyword: 'xylophonia' })).not.toContain(post.id)
    })

    it('treats a whitespace-only keyword as no filter', async () => {
      await publish(STAFF_A)
      const all = await feedIds({})

      expect(await feedIds({ keyword: '   ' })).toEqual(all)
      expect(await feedIds({ keyword: '' })).toEqual(all)
    })

    it('trims surrounding whitespace on keywords', async () => {
      const hit = await publish(STAFF_A, { title: 'Marmalade technician profile' })
      expect(await feedIds({ keyword: '  marmalade  ' })).toContain(hit.id)
    })

    it('returns an empty list with totalCount 0 when nothing matches', async () => {
      await publish(STAFF_A)

      const byKeyword = await communityJobsMockClient.listSeekingFeed({ keyword: 'zzqxjnomatch' })
      expect(byKeyword.items).toEqual([])
      expect(byKeyword.totalCount).toBe(0)

      const byCity = await communityJobsMockClient.listSeekingFeed({ city: 'Atlantis' })
      expect(byCity.items).toEqual([])
      expect(byCity.totalCount).toBe(0)

      const byState = await communityJobsMockClient.listSeekingFeed({ state: 'ZZ' })
      expect(byState.items).toEqual([])
      expect(byState.totalCount).toBe(0)
      expect(byState.hasNextPage).toBe(false)
    })

    it('ANDs combined filters together', async () => {
      const target = await publish(STAFF_A, {
        city: 'Houston',
        state: 'TX',
        workTypes: [JobWorkType.PartTime],
        skills: [RecruitmentSkill.Waxing],
        title: 'Waxing specialist crimsonfox',
      })
      const wrongCity = await publish(STAFF_A, {
        city: 'Dallas',
        state: 'TX',
        workTypes: [JobWorkType.PartTime],
        skills: [RecruitmentSkill.Waxing],
        title: 'Waxing specialist crimsonfox',
      })
      const wrongWork = await publish(STAFF_B, {
        city: 'Houston',
        state: 'TX',
        workTypes: [JobWorkType.FullTime],
        skills: [RecruitmentSkill.Waxing],
        title: 'Waxing specialist crimsonfox',
      })
      const wrongSkill = await publish(STAFF_B, {
        city: 'Houston',
        state: 'TX',
        workTypes: [JobWorkType.PartTime],
        skills: [RecruitmentSkill.Dip],
        title: 'Waxing specialist crimsonfox',
      })
      const wrongKeyword = await publish(STAFF_B, {
        city: 'Houston',
        state: 'TX',
        workTypes: [JobWorkType.PartTime],
        skills: [RecruitmentSkill.Waxing],
        title: 'Something else entirely',
      })

      const response = await communityJobsMockClient.listSeekingFeed({
        city: 'houston',
        state: 'tx',
        workType: JobWorkType.PartTime,
        skill: RecruitmentSkill.Waxing,
        keyword: 'crimsonfox',
      })

      expect(response.items.map((item) => item.id)).toEqual([target.id])
      expect(response.totalCount).toBe(1)
      const ids = response.items.map((item) => item.id)
      for (const excluded of [wrongCity, wrongWork, wrongSkill, wrongKeyword]) {
        expect(ids).not.toContain(excluded.id)
      }
    })

    it('returns empty when combined filters have no common match', async () => {
      await publish(STAFF_A, { city: 'Houston', workTypes: [JobWorkType.FullTime] })
      await publish(STAFF_B, { city: 'Dallas', workTypes: [JobWorkType.PartTime] })

      const response = await communityJobsMockClient.listSeekingFeed({
        city: 'Houston',
        workType: JobWorkType.PartTime,
        keyword: 'zzqxjnomatch',
      })
      expect(response.items).toEqual([])
      expect(response.totalCount).toBe(0)
    })

    it('does not mutate the input filters object', async () => {
      await publish(STAFF_A)
      const filters: HiringFeedFilters = Object.freeze({
        keyword: '  Nail  ',
        city: 'Austin',
        state: 'TX',
        workType: JobWorkType.FullTime,
        skill: RecruitmentSkill.Acrylic,
      })
      const snapshot = JSON.parse(JSON.stringify(filters))

      await communityJobsMockClient.listSeekingFeed(filters)

      expect(filters).toEqual(snapshot)
    })
  })

  describe('cloning', () => {
    it('returns deep clones: mutating results does not affect the next call', async () => {
      const post = await publish(STAFF_A, { title: 'Pristine title' })

      const first = await communityJobsMockClient.listSeekingFeed({})
      const firstSnapshot = JSON.parse(JSON.stringify(first.items))
      const mine = first.items.find((item) => item.id === post.id)!
      mine.title = 'Mutated'
      mine.skills.push(RecruitmentSkill.Lash)
      mine.workTypes.length = 0
      mine.visibility.showPhone = true
      for (const seed of first.items.filter((item) => item.id.startsWith(SEED_PREFIX))) {
        seed.title = 'Mutated seed'
        seed.skills.length = 0
      }
      first.items.pop()
      first.items.length = 0

      const second = await communityJobsMockClient.listSeekingFeed({})
      expect(second.items).toEqual(firstSnapshot)
      expect(second.totalCount).toBe(firstSnapshot.length)
    })

    it('does not leak mutation into the owner list either', async () => {
      const post = await publish(STAFF_A, { title: 'Owner title' })
      const feed = await communityJobsMockClient.listSeekingFeed({})
      feed.items.find((item) => item.id === post.id)!.title = 'Mutated'

      const mine = await communityJobsMockClient.listMySeekingPosts(STAFF_A)
      expect(mine.items.find((item) => item.id === post.id)?.title).toBe('Owner title')
    })
  })
})

describe('communityJobsRepository.listSeekingFeed', () => {
  beforeEach(() => {
    resetCommunityJobsMockStore()
  })

  it('returns a normalized envelope containing seeds', async () => {
    const response = await communityJobsRepository.listSeekingFeed({})

    expect(response.items.length).toBeGreaterThanOrEqual(3)
    expect(response.totalCount).toBe(response.items.length)
    expect(response.pageNumber).toBe(1)
    expect(response.totalPages).toBe(1)
    expect(response.hasNextPage).toBe(false)
    expect(response.hasPreviousPage).toBe(false)
  })

  it('normalizes every item (payAmount/payUnit never undefined, publishedAt is a string)', async () => {
    await publish(STAFF_A)
    const response = await communityJobsRepository.listSeekingFeed({})

    for (const item of response.items) {
      expect(item.payAmount === null || typeof item.payAmount === 'number').toBe(true)
      expect(item.payUnit === undefined).toBe(false)
      expect(typeof item.publishedAt).toBe('string')
      expect(Array.isArray(item.skills)).toBe(true)
      expect(Array.isArray(item.workTypes)).toBe(true)
      expect(item.status).toBe(JobPostingStatus.Published)
    }
  })

  it('maps absent payAmount/payUnit on a published post to null', async () => {
    const post = await publish(STAFF_A, { title: 'No explicit pay' })

    const response = await communityJobsRepository.listSeekingFeed({})
    const found = response.items.find((item) => item.id === post.id)

    expect(found).toBeDefined()
    expect(found!.payAmount).toBeNull()
    expect(found!.payUnit).toBeNull()
    expect(typeof found!.publishedAt).toBe('string')
    expect(found!.title).toBe('No explicit pay')
  })

  it('passes filters through and returns posts from different staffKeys', async () => {
    const a = await publish(STAFF_A, { city: 'Houston', title: 'Repo filter A' })
    const b = await publish(STAFF_B, { city: 'Houston', title: 'Repo filter B' })
    const c = await publish(STAFF_B, { city: 'Dallas', title: 'Repo filter C' })

    const response = await communityJobsRepository.listSeekingFeed({ city: 'houston' })
    const ids = response.items.map((item) => item.id)

    expect(ids).toContain(a.id)
    expect(ids).toContain(b.id)
    expect(ids).not.toContain(c.id)
    expect(response.totalCount).toBe(response.items.length)
  })

  it('returns an empty list when nothing matches', async () => {
    const response = await communityJobsRepository.listSeekingFeed({ keyword: 'zzqxjnomatch' })
    expect(response.items).toEqual([])
    expect(response.totalCount).toBe(0)
  })

  it('excludes drafts and closed posts', async () => {
    const draft = await communityJobsMockClient.writeSeekingPost(
      STAFF_A,
      makeWriteDto({ status: JobPostingStatus.Draft }),
    )
    const closed = await publish(STAFF_A)
    await communityJobsMockClient.closeSeekingPost(STAFF_A, closed.id)

    const ids = (await communityJobsRepository.listSeekingFeed({})).items.map((item) => item.id)
    expect(ids).not.toContain(draft.id)
    expect(ids).not.toContain(closed.id)
  })

  it('returns independent copies on each call', async () => {
    const post = await publish(STAFF_A, { title: 'Repo pristine' })

    const first = await communityJobsRepository.listSeekingFeed({})
    const snapshot = JSON.parse(JSON.stringify(first.items))
    const mine = first.items.find((item) => item.id === post.id)!
    mine.title = 'Mutated'
    mine.skills.push(RecruitmentSkill.Lash)
    first.items.length = 0

    const second = await communityJobsRepository.listSeekingFeed({})
    expect(second.items).toEqual(snapshot)
  })
})
