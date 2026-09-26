import { normalizeRecruitmentSearch } from '../../components/dashboard/views/pos/recruitment/recruitmentModel'
import {
  JobPayType,
  JobPayUnit,
  JobPosition,
  JobPostingStatus,
  JobVisibilityPreset,
  JobWorkType,
  RecruitmentSkill,
} from '../../constants/posRecruitment'
import { JobApplicationStatus, JobPostKind } from '../../constants/communityJobs'
import type { PaginatedResponse } from '../../types/domain'
import type { PosJobPostingDto } from '../../types/posRecruitment'
import type {
  HiringFeedFilters,
  JobApplicationDto,
  JobApplicationInput,
  SeekingPostDto,
  SeekingPostWriteDto,
} from '../../types/communityJobs'
import { readPosRecruitmentMockPostingsForFeed } from './posRecruitmentMockClient'

/**
 * Statuses an owner posting must have to appear on the staff hiring feed.
 * Declared ONLY here — Q1 decision lets a newly-Published owner posting (still
 * `Pending` in the owner's own mock) show up on staff's feed immediately.
 */
const FEED_VISIBLE_STATUSES: JobPostingStatus[] = [JobPostingStatus.Published, JobPostingStatus.Pending]

export interface CommunityJobsClient {
  listHiringFeed(filters: HiringFeedFilters): Promise<PaginatedResponse<PosJobPostingDto>>
  listMySeekingPosts(staffKey: string): Promise<PaginatedResponse<SeekingPostDto>>
  writeSeekingPost(staffKey: string, body: SeekingPostWriteDto, id?: string): Promise<SeekingPostDto>
  closeSeekingPost(staffKey: string, id: string): Promise<SeekingPostDto>
  applyToPosting(staffKey: string, input: JobApplicationInput): Promise<JobApplicationDto>
  listMyApplications(staffKey: string): Promise<PaginatedResponse<JobApplicationDto>>
}

interface StaffCommunityJobsStore {
  seekingPosts: SeekingPostDto[]
  applications: JobApplicationDto[]
}

const SEED_DATE = '2026-09-01T12:00:00.000Z'

/**
 * Fictional hiring seeds so the staff feed is never empty out of the box.
 * businessId is null — these salons don't exist as real businesses, so
 * "Nhắn tin" for these falls back to the community chat inbox (Q3).
 */
function createHiringSeeds(): PosJobPostingDto[] {
  return [
    {
      id: 'mock-hiring-seed-001',
      code: 'SEED-001',
      title: 'Nail Technician wanted — busy Houston salon',
      position: JobPosition.NailTechnician,
      headcount: 2,
      workType: JobWorkType.FullTime,
      skills: [RecruitmentSkill.Acrylic, RecruitmentSkill.Dip, RecruitmentSkill.Gel],
      payType: JobPayType.Commission,
      payAmount: null,
      payUnit: null,
      payText: '60/40 commission split',
      isUrgent: true,
      benefits: [],
      body: 'Sunshine Nails is looking for an experienced acrylic/dip technician to join our busy team. Great clientele, flexible schedule, and a supportive environment.',
      deadline: '2026-11-30',
      businessName: 'Sunshine Nails & Spa',
      address: '4820 Westheimer Rd',
      city: 'Houston',
      state: 'TX',
      zipCode: '77027',
      contactName: 'Salon manager',
      phone: '(713) 555-0142',
      visibilityPreset: JobVisibilityPreset.ShowAll,
      visibility: {
        showBusinessName: true,
        showAddress: true,
        showContactName: true,
        showPhone: true,
      },
      selectedServices: [],
      status: JobPostingStatus.Published,
      chatSessionIds: [],
      externalUrl: null,
      createdAt: SEED_DATE,
      updatedAt: SEED_DATE,
      publishedAt: SEED_DATE,
      businessId: null,
    },
    {
      id: 'mock-hiring-seed-002',
      code: 'SEED-002',
      title: 'Part-time pedicure specialist',
      position: JobPosition.ManicurePedicureTechnician,
      headcount: 1,
      workType: JobWorkType.PartTime,
      skills: [RecruitmentSkill.Pedicure, RecruitmentSkill.Manicure],
      payType: JobPayType.Fixed,
      payAmount: 22,
      payUnit: JobPayUnit.Hour,
      payText: null,
      isUrgent: false,
      benefits: [],
      body: 'Looking for a friendly, detail-oriented pedicure specialist for weekend shifts. Training provided for our signature spa pedicure menu.',
      deadline: '2026-12-15',
      businessName: 'Lotus Nail Studio',
      address: '1290 Blossom Hill Rd',
      city: 'San Jose',
      state: 'CA',
      zipCode: '95123',
      contactName: 'Salon manager',
      phone: '(408) 555-0198',
      visibilityPreset: JobVisibilityPreset.ShowAll,
      visibility: {
        showBusinessName: true,
        showAddress: true,
        showContactName: true,
        showPhone: true,
      },
      selectedServices: [],
      status: JobPostingStatus.Published,
      chatSessionIds: [],
      externalUrl: null,
      createdAt: SEED_DATE,
      updatedAt: SEED_DATE,
      publishedAt: SEED_DATE,
      businessId: null,
    },
    {
      id: 'mock-hiring-seed-003',
      code: 'SEED-003',
      title: 'Gel-X & nail art artist — flexible hours',
      position: JobPosition.NailTechnician,
      headcount: 1,
      workType: JobWorkType.Flexible,
      skills: [RecruitmentSkill.GelX, RecruitmentSkill.NailArt, RecruitmentSkill.ThreeDNailArt],
      payType: JobPayType.Negotiable,
      payAmount: null,
      payUnit: null,
      payText: null,
      isUrgent: false,
      benefits: [],
      body: 'Creative nail artist needed for a boutique studio specializing in Gel-X extensions and custom nail art. Portfolio a plus.',
      deadline: '2026-11-10',
      businessName: 'Bloom Nail Bar',
      address: '210 E Colonial Dr',
      city: 'Orlando',
      state: 'FL',
      zipCode: '32803',
      contactName: 'Salon manager',
      phone: '(407) 555-0176',
      visibilityPreset: JobVisibilityPreset.ChatOnly,
      visibility: {
        showBusinessName: true,
        showAddress: true,
        showContactName: false,
        showPhone: false,
      },
      selectedServices: [],
      status: JobPostingStatus.Published,
      chatSessionIds: [],
      externalUrl: null,
      createdAt: SEED_DATE,
      updatedAt: SEED_DATE,
      publishedAt: SEED_DATE,
      businessId: null,
    },
    {
      id: 'mock-hiring-seed-004',
      code: 'SEED-004',
      title: 'Full-time technician — head spa & lash add-on skills a plus',
      position: JobPosition.NailTechnician,
      headcount: 3,
      workType: JobWorkType.FullTime,
      skills: [RecruitmentSkill.HeadSpa, RecruitmentSkill.Lash, RecruitmentSkill.Waxing],
      payType: JobPayType.Commission,
      payAmount: null,
      payUnit: null,
      payText: '50/50 commission, tips included',
      isUrgent: true,
      benefits: [],
      body: 'Growing salon expanding our services menu. Looking for technicians comfortable cross-training into head spa, lash, and waxing add-ons.',
      deadline: '2026-12-01',
      businessName: 'Serenity Nails & Wellness',
      address: '9021 Aurora Ave N',
      city: 'Seattle',
      state: 'WA',
      zipCode: '98103',
      contactName: 'Salon manager',
      phone: '(206) 555-0163',
      visibilityPreset: JobVisibilityPreset.ShowAll,
      visibility: {
        showBusinessName: true,
        showAddress: true,
        showContactName: true,
        showPhone: true,
      },
      selectedServices: [],
      status: JobPostingStatus.Published,
      chatSessionIds: [],
      externalUrl: null,
      createdAt: SEED_DATE,
      updatedAt: SEED_DATE,
      publishedAt: SEED_DATE,
      businessId: null,
    },
  ]
}

let hiringSeeds = createHiringSeeds()
let storesByStaffKey = new Map<string, StaffCommunityJobsStore>()
let nextSeekingSequence = 1
let latencyMs = import.meta.env.VITEST ? 0 : 600

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

async function waitForLatency(): Promise<void> {
  if (latencyMs <= 0) return
  await new Promise((resolve) => window.setTimeout(resolve, latencyMs))
}

function getStore(staffKey: string): StaffCommunityJobsStore {
  let store = storesByStaffKey.get(staffKey)
  if (!store) {
    store = { seekingPosts: [], applications: [] }
    storesByStaffKey.set(staffKey, store)
  }
  return store
}

function matchesFeedFilters(dto: PosJobPostingDto, filters: HiringFeedFilters): boolean {
  if (filters.workType && dto.workType !== filters.workType) return false
  if (filters.skill && !dto.skills.includes(filters.skill)) return false
  if (filters.city && normalizeRecruitmentSearch(dto.city) !== normalizeRecruitmentSearch(filters.city)) {
    return false
  }
  if (filters.state && normalizeRecruitmentSearch(dto.state) !== normalizeRecruitmentSearch(filters.state)) {
    return false
  }
  const keyword = filters.keyword?.trim()
  if (keyword) {
    const query = normalizeRecruitmentSearch(keyword)
    const haystack = normalizeRecruitmentSearch(`${dto.title} ${dto.skills.join(' ')} ${dto.body}`)
    if (query && !haystack.includes(query)) return false
  }
  return true
}

function buildHiringFeed(filters: HiringFeedFilters): PosJobPostingDto[] {
  const ownerPostings = readPosRecruitmentMockPostingsForFeed().filter((posting) =>
    FEED_VISIBLE_STATUSES.includes(posting.status),
  )
  const combined = [...hiringSeeds, ...ownerPostings]
  const seenIds = new Set<string>()
  const deduped = combined.filter((posting) => {
    if (seenIds.has(posting.id)) return false
    seenIds.add(posting.id)
    return true
  })
  return deduped
    .filter((posting) => matchesFeedFilters(posting, filters))
    .sort((a, b) => (b.publishedAt ?? '').localeCompare(a.publishedAt ?? ''))
}

function findFeedPostingById(postingId: string): PosJobPostingDto | null {
  return buildHiringFeed({}).find((posting) => posting.id === postingId) ?? null
}

function buildSeekingPost(body: SeekingPostWriteDto, id: string | undefined, existing: SeekingPostDto | undefined): SeekingPostDto {
  const now = new Date().toISOString()
  const code = existing?.code ?? `TV-${String(nextSeekingSequence++).padStart(3, '0')}`
  return {
    ...clone(body),
    id: existing?.id ?? `mock-seeking-${crypto.randomUUID()}`,
    code,
    postKind: JobPostKind.Seeking,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    publishedAt: body.status === JobPostingStatus.Draft ? existing?.publishedAt ?? null : now,
  }
}

export function resetCommunityJobsMockStore(): void {
  hiringSeeds = createHiringSeeds()
  storesByStaffKey = new Map<string, StaffCommunityJobsStore>()
  nextSeekingSequence = 1
}

export function setCommunityJobsMockLatency(ms: number): void {
  latencyMs = Math.max(0, ms)
}

export const communityJobsMockClient: CommunityJobsClient = {
  async listHiringFeed(filters: HiringFeedFilters): Promise<PaginatedResponse<PosJobPostingDto>> {
    await waitForLatency()
    const items = clone(buildHiringFeed(filters))
    return {
      items,
      pageNumber: 1,
      totalPages: 1,
      totalCount: items.length,
      hasNextPage: false,
      hasPreviousPage: false,
    }
  },

  async listMySeekingPosts(staffKey: string): Promise<PaginatedResponse<SeekingPostDto>> {
    await waitForLatency()
    const store = getStore(staffKey)
    const items = clone(store.seekingPosts)
    return {
      items,
      pageNumber: 1,
      totalPages: 1,
      totalCount: items.length,
      hasNextPage: false,
      hasPreviousPage: false,
    }
  },

  async writeSeekingPost(staffKey: string, body: SeekingPostWriteDto, id?: string): Promise<SeekingPostDto> {
    await waitForLatency()
    const store = getStore(staffKey)
    const existing = id ? store.seekingPosts.find((post) => post.id === id) : undefined
    if (id && !existing) throw new Error(`Seeking post not found: ${id}`)
    const post = buildSeekingPost(body, id, existing)
    store.seekingPosts = [post, ...store.seekingPosts.filter((item) => item.id !== post.id)]
    return clone(post)
  },

  async closeSeekingPost(staffKey: string, id: string): Promise<SeekingPostDto> {
    await waitForLatency()
    const store = getStore(staffKey)
    const existing = store.seekingPosts.find((post) => post.id === id)
    if (!existing) throw new Error(`Seeking post not found: ${id}`)
    const updated: SeekingPostDto = { ...existing, status: JobPostingStatus.Closed, updatedAt: new Date().toISOString() }
    store.seekingPosts = [updated, ...store.seekingPosts.filter((item) => item.id !== id)]
    return clone(updated)
  },

  async applyToPosting(staffKey: string, input: JobApplicationInput): Promise<JobApplicationDto> {
    await waitForLatency()
    const store = getStore(staffKey)
    if (store.applications.some((application) => application.postingId === input.postingId)) {
      throw Object.assign(new Error('You have already applied to this posting.'), {
        errorCode: 'ALREADY_APPLIED',
      })
    }
    const postingSnapshot = findFeedPostingById(input.postingId)
    const application: JobApplicationDto = {
      id: `mock-application-${crypto.randomUUID()}`,
      postingId: input.postingId,
      seekingPostId: input.seekingPostId ?? null,
      note: input.note,
      sharePhone: Boolean(input.sharePhone),
      status: JobApplicationStatus.Submitted,
      createdAt: new Date().toISOString(),
      posting: postingSnapshot ? clone(postingSnapshot) : null,
    }
    store.applications = [application, ...store.applications]
    return clone(application)
  },

  async listMyApplications(staffKey: string): Promise<PaginatedResponse<JobApplicationDto>> {
    await waitForLatency()
    const store = getStore(staffKey)
    const items = clone(store.applications)
    return {
      items,
      pageNumber: 1,
      totalPages: 1,
      totalCount: items.length,
      hasNextPage: false,
      hasPreviousPage: false,
    }
  },
}

export const COMMUNITY_JOBS_IS_SIMULATED = true
