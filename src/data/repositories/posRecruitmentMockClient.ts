// Adapted for Community demo
import {
  JobPayType,
  JobPosition,
  JobPostingStatus,
  JobVisibilityPreset,
  JobWorkType,
  RecruitmentSkill,
  POS_RECRUITMENT_PATHS,
} from '../../constants/posRecruitment'
import type { PaginatedResponse } from '../../types/domain'
import type {
  PosJobPostingDto,
  PosJobPostingWriteDto,
  PosRecruitmentSalonContext,
} from '../../types/posRecruitment'

interface PosRecruitmentRequestConfig {
  recruitmentSalon?: PosRecruitmentSalonContext
  /** Owner's current businessId — stamped onto seeded/created postings (Q3: staff community feed chat wiring). */
  businessId?: string
}

export interface PosRecruitmentClient {
  get<T>(url: string, config?: PosRecruitmentRequestConfig): Promise<T>
  post<T>(url: string, body?: unknown): Promise<T>
  put<T>(url: string, body?: unknown): Promise<T>
  patch<T>(url: string, body?: unknown): Promise<T>
}

const SEED_DATE = '2026-09-13T15:00:00.000Z'

function createSeedPostings(salon: PosRecruitmentSalonContext, businessId: string | null = null): PosJobPostingDto[] {
  return [
    {
      id: 'mock-posting-001',
      code: 'MẪU-001',
      title: 'Cần tuyển thợ nail bột / Dip',
      position: JobPosition.NailTechnician,
      headcount: 2,
      workType: JobWorkType.FullTime,
      skills: [RecruitmentSkill.Acrylic, RecruitmentSkill.Dip],
      payType: JobPayType.Negotiable,
      payAmount: null,
      payUnit: null,
      payText: null,
      isUrgent: false,
      benefits: [],
      body: 'Tiệm cần tuyển thợ nail biết làm Acrylic và Dip. Ưu tiên người có kinh nghiệm, làm việc cẩn thận và có tinh thần hợp tác.',
      deadline: '2026-10-15',
      businessName: salon.name,
      address: salon.address,
      city: salon.city,
      state: salon.state,
      zipCode: salon.zipCode,
      contactName: 'Quản lý tiệm',
      phone: salon.phone,
      visibilityPreset: JobVisibilityPreset.ShowAll,
      visibility: {
        showBusinessName: true,
        showAddress: true,
        showContactName: true,
        showPhone: true,
      },
      selectedServices: [
        { posServiceId: 'mock-service-acrylic', name: 'Acrylic' },
        { posServiceId: 'mock-service-dip', name: 'Dip' },
      ],
      status: JobPostingStatus.Published,
      chatSessionIds: [],
      externalUrl: 'https://nailhub.ai/jobs/mock-posting-001',
      createdAt: SEED_DATE,
      updatedAt: SEED_DATE,
      publishedAt: SEED_DATE,
      businessId,
    },
    {
      id: 'mock-posting-002',
      code: 'MẪU-002',
      title: 'Tuyển thợ tay chân nước bán thời gian',
      position: JobPosition.NailTechnician,
      headcount: 1,
      workType: JobWorkType.PartTime,
      skills: [RecruitmentSkill.Manicure, RecruitmentSkill.Pedicure],
      payType: JobPayType.Negotiable,
      payAmount: null,
      payUnit: null,
      payText: null,
      isUrgent: false,
      benefits: [],
      body: 'Cần thợ manicure và pedicure bán thời gian. Lịch làm việc và thu nhập trao đổi trực tiếp.',
      deadline: '2026-10-20',
      businessName: salon.name,
      address: salon.address,
      city: salon.city,
      state: salon.state,
      zipCode: salon.zipCode,
      contactName: 'Quản lý tiệm',
      phone: salon.phone,
      visibilityPreset: JobVisibilityPreset.ChatOnly,
      visibility: {
        showBusinessName: true,
        showAddress: true,
        showContactName: false,
        showPhone: false,
      },
      selectedServices: [],
      status: JobPostingStatus.Draft,
      chatSessionIds: [],
      externalUrl: null,
      createdAt: SEED_DATE,
      updatedAt: SEED_DATE,
      publishedAt: null,
      businessId,
    },
  ]
}

const EMPTY_SALON: PosRecruitmentSalonContext = {
  name: '',
  address: '',
  city: '',
  state: '',
  zipCode: '',
  phone: '',
}

let activeSalonKey = JSON.stringify(EMPTY_SALON)
/** Owner's current businessId (Q3), stamped onto seeded/created postings so staff feed
 *  "Nhắn tin" can resolve a real 1:1 chat when the staff is linked to this business. */
let activeBusinessId: string | null = null
let postings = createSeedPostings(EMPTY_SALON, activeBusinessId)
let nextSequence = 3
let latencyMs = import.meta.env.VITEST ? 0 : 600

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

async function waitForLatency(): Promise<void> {
  if (latencyMs <= 0) return
  await new Promise((resolve) => window.setTimeout(resolve, latencyMs))
}

function buildPosting(body: PosJobPostingWriteDto, id?: string): PosJobPostingDto {
  const now = new Date().toISOString()
  const existing = id ? postings.find((posting) => posting.id === id) : undefined
  const sequence = existing?.code ?? `MẪU-${String(nextSequence++).padStart(3, '0')}`
  return {
    ...clone(body),
    id: existing?.id ?? `mock-posting-${crypto.randomUUID()}`,
    code: sequence,
    externalUrl: body.status === JobPostingStatus.Draft
      ? existing?.externalUrl ?? null
      : `https://nailhub.ai/jobs/${existing?.id ?? 'pending'}`,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    publishedAt: body.status === JobPostingStatus.Draft ? existing?.publishedAt ?? null : now,
    businessId: existing?.businessId ?? activeBusinessId,
  }
}

function postingIdFromUrl(url: string): string | null {
  const match = url.match(/^\/api\/v1\/community\/job-postings\/([^/]+)(?:\/status)?$/)
  return match?.[1] ?? null
}

function useRecruitmentSalon(salon: PosRecruitmentSalonContext, businessId: string | null = null): void {
  activeBusinessId = businessId
  const key = JSON.stringify(salon)
  if (key === activeSalonKey) return
  activeSalonKey = key
  postings = createSeedPostings(salon, activeBusinessId)
  nextSequence = 3
}

/**
 * Prime the owner mock store for the Community demo without going through the POS
 * hook's useRecruitmentSalon (that path only runs from inside usePosRecruitment).
 * Same logic as useRecruitmentSalon, inlined so a demo provider can seed the store
 * synchronously at render time.
 */
export function primePosRecruitmentMockSalon(salon: PosRecruitmentSalonContext, businessId: string | null = null): void {
  activeBusinessId = businessId
  const key = JSON.stringify(salon)
  if (key === activeSalonKey) return
  activeSalonKey = key
  postings = createSeedPostings(salon, activeBusinessId)
  nextSequence = 3
}

export function resetPosRecruitmentMockStore(salon: PosRecruitmentSalonContext = EMPTY_SALON): void {
  activeSalonKey = JSON.stringify(salon)
  activeBusinessId = null
  postings = createSeedPostings(salon, activeBusinessId)
  nextSequence = 3
}

export function setPosRecruitmentMockLatency(ms: number): void {
  latencyMs = Math.max(0, ms)
}

/**
 * Read-only snapshot of the owner's mock postings for the staff community feed.
 * Never resets/reseeds the owner mock store.
 */
export function readPosRecruitmentMockPostingsForFeed(): PosJobPostingDto[] {
  if (activeSalonKey === JSON.stringify(EMPTY_SALON)) return []
  return clone(postings)
}

export const posRecruitmentMockClient: PosRecruitmentClient = {
  async get<T>(url: string, config?: PosRecruitmentRequestConfig): Promise<T> {
    await waitForLatency()
    if (url !== POS_RECRUITMENT_PATHS.list) throw new Error(`Unsupported mock GET: ${url}`)
    if (config?.recruitmentSalon) useRecruitmentSalon(config.recruitmentSalon, config.businessId ?? null)
    const result: PaginatedResponse<PosJobPostingDto> = {
      items: clone(postings),
      pageNumber: 1,
      totalPages: 1,
      totalCount: postings.length,
      hasNextPage: false,
      hasPreviousPage: false,
    }
    return result as T
  },

  async post<T>(url: string, body?: unknown): Promise<T> {
    await waitForLatency()
    if (url !== POS_RECRUITMENT_PATHS.postings) throw new Error(`Unsupported mock POST: ${url}`)
    const posting = buildPosting(body as PosJobPostingWriteDto)
    postings = [posting, ...postings]
    return clone(posting) as T
  },

  async put<T>(url: string, body?: unknown): Promise<T> {
    await waitForLatency()
    const id = postingIdFromUrl(url)
    if (!id) throw new Error(`Unsupported mock PUT: ${url}`)
    if (!postings.some((posting) => posting.id === id)) throw new Error(`Posting not found: ${id}`)
    const posting = buildPosting(body as PosJobPostingWriteDto, id)
    postings = [posting, ...postings.filter((item) => item.id !== id)]
    return clone(posting) as T
  },

  async patch<T>(url: string, body?: unknown): Promise<T> {
    await waitForLatency()
    const id = postingIdFromUrl(url)
    if (!id || !url.endsWith('/status')) throw new Error(`Unsupported mock PATCH: ${url}`)
    const posting = postings.find((item) => item.id === id)
    if (!posting) throw new Error(`Posting not found: ${id}`)
    const status = (body as { status: JobPostingStatus }).status
    const updated = { ...posting, status, updatedAt: new Date().toISOString() }
    postings = [updated, ...postings.filter((item) => item.id !== id)]
    return clone(updated) as T
  },
}

export const POS_RECRUITMENT_IS_SIMULATED = true
