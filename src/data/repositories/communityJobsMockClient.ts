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
import { JobApplicationStatus, JobPostKind, SeekingExperience } from '../../constants/communityJobs'
import type { PaginatedResponse } from '../../types/domain'
import type { PosJobPostingDto } from '../../types/posRecruitment'
import type {
  HiringFeedFilters,
  JobApplicationDto,
  JobApplicationInput,
  PostingApplicant,
  SeekingPostDto,
  SeekingPostWriteDto,
} from '../../types/communityJobs'
import type { PublicTechnicianProfile } from '../../components/community/jobs/technicianProfileModel'
import { readPosRecruitmentMockPostingsForFeed } from './posRecruitmentMockClient'

/**
 * Statuses an owner posting must have to appear on the staff hiring feed.
 * Declared ONLY here — Q1 decision lets a newly-Published owner posting (still
 * `Pending` in the owner's own mock) show up on staff's feed immediately.
 */
const FEED_VISIBLE_STATUSES: JobPostingStatus[] = [JobPostingStatus.Published, JobPostingStatus.Pending]

export interface CommunityJobsClient {
  listHiringFeed(filters: HiringFeedFilters): Promise<PaginatedResponse<PosJobPostingDto>>
  listSeekingFeed(filters: HiringFeedFilters): Promise<PaginatedResponse<SeekingPostDto>>
  listMySeekingPosts(staffKey: string): Promise<PaginatedResponse<SeekingPostDto>>
  writeSeekingPost(staffKey: string, body: SeekingPostWriteDto, id?: string): Promise<SeekingPostDto>
  closeSeekingPost(staffKey: string, id: string): Promise<SeekingPostDto>
  applyToPosting(staffKey: string, input: JobApplicationInput): Promise<JobApplicationDto>
  listMyApplications(staffKey: string): Promise<PaginatedResponse<JobApplicationDto>>
  cancelApplication(staffKey: string, applicationId: string): Promise<void>
  reapplyApplication(staffKey: string, applicationId: string): Promise<JobApplicationDto>
  listPostingApplicants(postingIds: string[]): Promise<PostingApplicant[]>
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

/**
 * Fictional technician "seeking work" seeds so the mixed browse feed always has
 * both kinds of posts. Display names are invented; one post hides the phone.
 */
function createSeekingSeeds(): SeekingPostDto[] {
  return [
    {
      id: 'mock-seeking-seed-001',
      code: 'TV-SEED-001',
      postKind: JobPostKind.Seeking,
      title: 'Experienced acrylic & dip tech looking for full-time',
      skills: [RecruitmentSkill.Acrylic, RecruitmentSkill.Dip, RecruitmentSkill.Gel],
      experience: SeekingExperience.FivePlusYears,
      workTypes: [JobWorkType.FullTime],
      city: 'Houston',
      state: 'TX',
      payType: JobPayType.Commission,
      payAmount: null,
      payUnit: null,
      payText: '60/40 or better',
      availableFrom: '2026-10-01',
      body: 'Six years behind the table, fast and clean with acrylic and dip sets. Looking for a stable salon with steady walk-ins and a respectful team.',
      displayName: 'Linh Tran',
      phone: '(713) 555-0111',
      visibility: { showFullName: true, showPhone: true },
      status: JobPostingStatus.Published,
      createdAt: '2026-09-05T09:00:00.000Z',
      updatedAt: '2026-09-05T09:00:00.000Z',
      publishedAt: '2026-09-05T09:00:00.000Z',
    },
    {
      id: 'mock-seeking-seed-002',
      code: 'TV-SEED-002',
      postKind: JobPostKind.Seeking,
      title: 'Pedicure & manicure specialist, weekends available',
      skills: [RecruitmentSkill.Pedicure, RecruitmentSkill.Manicure, RecruitmentSkill.Waxing],
      experience: SeekingExperience.OneToThreeYears,
      workTypes: [JobWorkType.PartTime, JobWorkType.Flexible],
      city: 'San Jose',
      state: 'CA',
      payType: JobPayType.Fixed,
      payAmount: 20,
      payUnit: JobPayUnit.Hour,
      payText: null,
      availableFrom: '2026-09-20',
      body: 'Gentle and detail-oriented with spa pedicures. Prefer weekend and evening shifts while I finish my esthetics course.',
      displayName: 'Mai Nguyen',
      phone: '(408) 555-0122',
      visibility: { showFullName: false, showPhone: true },
      status: JobPostingStatus.Published,
      createdAt: '2026-09-04T09:00:00.000Z',
      updatedAt: '2026-09-04T09:00:00.000Z',
      publishedAt: '2026-09-04T09:00:00.000Z',
    },
    {
      id: 'mock-seeking-seed-003',
      code: 'TV-SEED-003',
      postKind: JobPostKind.Seeking,
      title: 'Nail artist - Gel-X, 3D art and custom designs',
      skills: [RecruitmentSkill.GelX, RecruitmentSkill.NailArt, RecruitmentSkill.ThreeDNailArt, RecruitmentSkill.French],
      experience: SeekingExperience.ThreeToFiveYears,
      workTypes: [JobWorkType.FullTime, JobWorkType.Flexible],
      city: 'Orlando',
      state: 'FL',
      payType: JobPayType.Negotiable,
      payAmount: null,
      payUnit: null,
      payText: null,
      availableFrom: null,
      body: 'Creative artist with a portfolio of hand-painted and 3D designs. Open to boutique studios that value custom work.',
      displayName: 'Hoa Pham',
      phone: '',
      visibility: { showFullName: true, showPhone: false },
      status: JobPostingStatus.Published,
      createdAt: '2026-09-03T09:00:00.000Z',
      updatedAt: '2026-09-03T09:00:00.000Z',
      publishedAt: '2026-09-03T09:00:00.000Z',
    },
    {
      id: 'mock-seeking-seed-004',
      code: 'TV-SEED-004',
      postKind: JobPostKind.Seeking,
      title: 'Beginner-friendly tech seeking training salon',
      skills: [RecruitmentSkill.Manicure, RecruitmentSkill.Gel],
      experience: SeekingExperience.UnderOneYear,
      workTypes: [JobWorkType.FullTime],
      city: 'Houston',
      state: 'TX',
      payType: JobPayType.Negotiable,
      payAmount: null,
      payUnit: null,
      payText: null,
      availableFrom: '2026-10-15',
      body: 'Recently licensed and eager to learn. Looking for a salon that offers mentoring on acrylic and dip while I build my speed.',
      displayName: 'Thu Le',
      phone: '(281) 555-0144',
      visibility: { showFullName: true, showPhone: true },
      status: JobPostingStatus.Published,
      createdAt: '2026-09-02T09:00:00.000Z',
      updatedAt: '2026-09-02T09:00:00.000Z',
      publishedAt: '2026-09-02T09:00:00.000Z',
    },
  ]
}

let hiringSeeds = createHiringSeeds()
let seekingSeeds = createSeekingSeeds()
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

/** Demo identities behind each store key — the owner view needs a name per applicant. */
const MOCK_APPLICANTS: Record<string, { name: string; phone: string; profile: PublicTechnicianProfile | null }> = {
  jessica: {
    name: 'Jessica Nguyen',
    phone: '(713) 555-0201',
    profile: {
      licenseVerified: true, displayName: 'Jessica Nguyen', experience: SeekingExperience.ThreeToFiveYears, city: 'Houston', languages: ['vi', 'en'],
      bio: 'Thợ nail 5 năm kinh nghiệm bột và dip, cẩn thận, hợp tác tốt với đồng nghiệp.',
      skills: [RecruitmentSkill.Acrylic, RecruitmentSkill.Dip, RecruitmentSkill.NailArt], licenseType: 'TX',
      portfolio: ['sample-1', 'sample-2', 'sample-3'], workTypes: [JobWorkType.FullTime], payPreferences: ['Commission'],
      desiredAmount: '60/40', lookingForWork: true, hideFromCurrentSalon: true, hidePhone: false,
    },
  },
  // Completion ladder (technicianProfileCompletion): hoa 10% → lan 45% → minh 75% → jessica / thao 100%.
  'demo-hoa': {
    name: 'Hoa Võ',
    phone: '(713) 555-0204',
    profile: {
      licenseVerified: false, displayName: 'Hoa Võ', experience: '', city: '', languages: ['vi'], bio: '', skills: [], licenseType: '',
      portfolio: [], workTypes: [], payPreferences: [], desiredAmount: '',
      lookingForWork: true, hideFromCurrentSalon: true, hidePhone: true,
    },
  },
  'demo-lan': {
    name: 'Lan Phạm',
    phone: '(713) 555-0203',
    profile: {
      licenseVerified: false, displayName: 'Lan Phạm', experience: SeekingExperience.UnderOneYear, city: 'Dallas', languages: ['vi'], bio: '',
      skills: [RecruitmentSkill.Manicure, RecruitmentSkill.Pedicure], licenseType: '',
      portfolio: [], workTypes: [], payPreferences: [], desiredAmount: '',
      lookingForWork: true, hideFromCurrentSalon: true, hidePhone: true,
    },
  },
  'demo-minh': {
    name: 'Minh Trần',
    phone: '(713) 555-0202',
    profile: {
      licenseVerified: false, displayName: 'Minh Trần', experience: 'FiveToTenYears', city: 'Houston', languages: ['vi', 'en'],
      bio: 'Chuyên dip và bột, có thể đi làm cuối tuần và thay ca.',
      skills: [RecruitmentSkill.Dip, RecruitmentSkill.Acrylic, RecruitmentSkill.GelX], licenseType: 'OtherState',
      portfolio: [], workTypes: [JobWorkType.PartTime, 'Weekend'], payPreferences: [], desiredAmount: '',
      lookingForWork: false, hideFromCurrentSalon: true, hidePhone: false,
    },
  },
  'demo-thao': {
    name: 'Thảo Nguyễn',
    phone: '(713) 555-0205',
    profile: {
      licenseVerified: true, displayName: 'Thảo Nguyễn', experience: 'OverTenYears', city: 'Austin', languages: ['vi', 'en', 'es'],
      bio: 'Hơn 10 năm làm nail ở Texas, từng quản lý ca và đào tạo thợ mới. Mạnh về nail art, gel-x và đắp bột, khách quen nhiều, làm việc nhanh gọn, sạch sẽ và luôn đúng giờ. Sẵn sàng làm toàn thời gian hoặc chia ca linh hoạt.',
      skills: [RecruitmentSkill.Acrylic, RecruitmentSkill.Dip, RecruitmentSkill.GelX, RecruitmentSkill.Gel, RecruitmentSkill.NailArt, RecruitmentSkill.Pedicure, RecruitmentSkill.Manicure, RecruitmentSkill.Waxing, RecruitmentSkill.Lash], licenseType: 'TX',
      portfolio: ['sample-1', 'sample-2', 'sample-3', 'sample-4', 'sample-5', 'sample-6', 'sample-7', 'sample-8', 'sample-9'],
      workTypes: [JobWorkType.FullTime, JobWorkType.PartTime, 'Weekend', 'Substitute'], payPreferences: ['Guaranteed', 'Commission', 'ChairRental', 'Negotiated'], desiredAmount: '$220/ngày hoặc 65/35',
      lookingForWork: true, hideFromCurrentSalon: true, hidePhone: false,
    },
  },
}

/** Owner's seeded posting (posRecruitmentMockClient) that the demo workers applied to. */
const OWNER_SEED_POSTING_ID = 'mock-posting-001'

function seedExtraApplicants(): void {
  getStore('jessica') // her seeded applications must show up for the owner even if she never opened the Applied tab
  const posting = findFeedPostingById(OWNER_SEED_POSTING_ID)
  if (!posting) return
  const extras: Array<{ key: string; note: string; sharePhone: boolean; createdAt: string }> = [
    { key: 'demo-minh', note: 'Làm dip và bột 4 năm, có đồ nghề riêng, có thể đi làm cuối tuần.', sharePhone: true, createdAt: '2026-09-05T10:30:00.000Z' },
    { key: 'demo-lan', note: 'Mới vào nghề, vui vẻ hòa đồng, muốn học hỏi thêm.', sharePhone: false, createdAt: '2026-09-06T14:15:00.000Z' },
    { key: 'demo-hoa', note: '', sharePhone: false, createdAt: '2026-09-07T08:00:00.000Z' },
    { key: 'demo-thao', note: 'Làm nhanh sạch sẽ, khách quen đông, có license TX và xe đi làm đúng giờ. Em có thể bắt đầu từ tuần sau.', sharePhone: true, createdAt: '2026-09-08T16:45:00.000Z' },
  ]
  for (const extra of extras) {
    if (storesByStaffKey.has(extra.key)) continue
    storesByStaffKey.set(extra.key, {
      seekingPosts: [],
      applications: [{
        id: `mock-application-${extra.key}`,
        postingId: OWNER_SEED_POSTING_ID,
        seekingPostId: null,
        note: extra.note,
        sharePhone: extra.sharePhone,
        status: JobApplicationStatus.Submitted,
        createdAt: extra.createdAt,
        posting: clone(posting),
      }],
    })
  }
}

/** Demo applications so the staff "Applied" tab has data (Details / Cancel) out of the box. */
function seedApplications(): JobApplicationDto[] {
  return ['mock-hiring-seed-001', OWNER_SEED_POSTING_ID].flatMap((postingId, index) => {
    const posting = findFeedPostingById(postingId)
    if (!posting) return []
    return [{
      id: `mock-application-seed-00${index + 1}`,
      postingId,
      seekingPostId: null,
      note: index === 0 ? 'Em có 3 năm kinh nghiệm, có thể bắt đầu ngay.' : '',
      sharePhone: index === 0,
      status: JobApplicationStatus.Submitted,
      createdAt: `2026-09-0${index + 3}T09:00:00.000Z`,
      posting: clone(posting),
    }]
  })
}

function getStore(staffKey: string): StaffCommunityJobsStore {
  let store = storesByStaffKey.get(staffKey)
  if (!store) {
    store = { seekingPosts: [], applications: seedApplications() }
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

function matchesSeekingFeedFilters(post: SeekingPostDto, filters: HiringFeedFilters): boolean {
  if (filters.workType && !post.workTypes.includes(filters.workType)) return false
  if (filters.skill && !post.skills.includes(filters.skill)) return false
  if (filters.city && normalizeRecruitmentSearch(post.city) !== normalizeRecruitmentSearch(filters.city)) {
    return false
  }
  if (filters.state && normalizeRecruitmentSearch(post.state) !== normalizeRecruitmentSearch(filters.state)) {
    return false
  }
  const keyword = filters.keyword?.trim()
  if (keyword) {
    const query = normalizeRecruitmentSearch(keyword)
    const haystack = normalizeRecruitmentSearch(`${post.title} ${post.skills.join(' ')} ${post.body} ${post.city}`)
    if (query && !haystack.includes(query)) return false
  }
  return true
}

function buildSeekingFeed(filters: HiringFeedFilters): SeekingPostDto[] {
  const storePosts = Array.from(storesByStaffKey.values()).flatMap((store) => store.seekingPosts)
  const combined = [...seekingSeeds, ...storePosts].filter((post) => post.status === JobPostingStatus.Published)
  const seenIds = new Set<string>()
  const deduped = combined.filter((post) => {
    if (seenIds.has(post.id)) return false
    seenIds.add(post.id)
    return true
  })
  return deduped
    .filter((post) => matchesSeekingFeedFilters(post, filters))
    .sort((a, b) => {
      if (!a.publishedAt && !b.publishedAt) return 0
      if (!a.publishedAt) return 1
      if (!b.publishedAt) return -1
      return b.publishedAt.localeCompare(a.publishedAt)
    })
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
  seekingSeeds = createSeekingSeeds()
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

  async listSeekingFeed(filters: HiringFeedFilters): Promise<PaginatedResponse<SeekingPostDto>> {
    await waitForLatency()
    const items = clone(buildSeekingFeed(filters))
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
    if (store.applications.some((application) => application.postingId === input.postingId && application.status !== JobApplicationStatus.Cancelled)) {
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
    // A fresh application replaces the cancelled one for the same posting.
    store.applications = [application, ...store.applications.filter((item) => item.postingId !== input.postingId)]
    return clone(application)
  },

  async cancelApplication(staffKey: string, applicationId: string): Promise<void> {
    await waitForLatency()
    const store = getStore(staffKey)
    if (!store.applications.some((application) => application.id === applicationId)) {
      throw new Error(`Application not found: ${applicationId}`)
    }
    store.applications = store.applications.map((application) => (
      application.id === applicationId ? { ...application, status: JobApplicationStatus.Cancelled } : application
    ))
  },

  async reapplyApplication(staffKey: string, applicationId: string): Promise<JobApplicationDto> {
    await waitForLatency()
    const store = getStore(staffKey)
    const existing = store.applications.find((application) => application.id === applicationId)
    if (!existing) throw new Error(`Application not found: ${applicationId}`)
    const reapplied: JobApplicationDto = { ...existing, status: JobApplicationStatus.Submitted, createdAt: new Date().toISOString() }
    store.applications = store.applications.map((application) => (application.id === applicationId ? reapplied : application))
    return clone(reapplied)
  },

  async listPostingApplicants(postingIds: string[]): Promise<PostingApplicant[]> {
    await waitForLatency()
    seedExtraApplicants()
    const wanted = new Set(postingIds)
    const applicants: PostingApplicant[] = []
    storesByStaffKey.forEach((store, staffKey) => {
      const identity = MOCK_APPLICANTS[staffKey]
      if (!identity) return
      for (const application of store.applications) {
        if (!wanted.has(application.postingId) || application.status === JobApplicationStatus.Cancelled) continue
        applicants.push({
          applicationId: application.id,
          postingId: application.postingId,
          applicantName: identity.name,
          note: application.note,
          phone: application.sharePhone ? identity.phone : null,
          profile: identity.profile,
          createdAt: application.createdAt,
        })
      }
    })
    return applicants.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
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
