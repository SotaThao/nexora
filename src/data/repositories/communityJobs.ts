import { JobPostingStatus } from '../../constants/posRecruitment'
import type { PaginatedResponse } from '../../types/domain'
import type {
  HiringFeedFilters,
  JobApplication,
  JobApplicationDto,
  JobApplicationInput,
  SeekingPost,
  SeekingPostDto,
  SeekingPostUpsertInput,
  SeekingPostWriteDto,
} from '../../types/communityJobs'
import type { PosJobPosting } from '../../types/posRecruitment'
import { normalizePosting } from './posRecruitment'
import {
  communityJobsMockClient,
  type CommunityJobsClient,
} from './communityJobsMockClient'

export function normalizeSeekingPost(dto: SeekingPostDto): SeekingPost {
  return {
    id: String(dto.id ?? ''),
    code: String(dto.code ?? ''),
    postKind: dto.postKind,
    title: String(dto.title ?? '').trim(),
    skills: Array.isArray(dto.skills) ? [...dto.skills] : [],
    experience: dto.experience,
    workTypes: Array.isArray(dto.workTypes) ? [...dto.workTypes] : [],
    city: String(dto.city ?? ''),
    state: String(dto.state ?? ''),
    payType: dto.payType,
    payAmount: dto.payAmount == null ? null : Number(dto.payAmount),
    payUnit: dto.payUnit ?? null,
    payText: typeof dto.payText === 'string' && dto.payText.trim() ? dto.payText.trim() : null,
    availableFrom: dto.availableFrom ?? null,
    body: String(dto.body ?? ''),
    displayName: String(dto.displayName ?? ''),
    phone: String(dto.phone ?? ''),
    visibility: { ...dto.visibility },
    status: dto.status,
    createdAt: String(dto.createdAt ?? ''),
    updatedAt: String(dto.updatedAt ?? ''),
    publishedAt: dto.publishedAt ?? null,
  }
}

function normalizeJobApplication(dto: JobApplicationDto): JobApplication {
  return {
    id: String(dto.id ?? ''),
    postingId: String(dto.postingId ?? ''),
    seekingPostId: dto.seekingPostId ?? null,
    note: String(dto.note ?? ''),
    sharePhone: Boolean(dto.sharePhone),
    status: dto.status,
    createdAt: String(dto.createdAt ?? ''),
    posting: dto.posting ? normalizePosting(dto.posting) : null,
  }
}

function toSeekingWriteDto(input: SeekingPostUpsertInput, status: JobPostingStatus): SeekingPostWriteDto {
  return {
    ...input,
    skills: [...input.skills],
    workTypes: [...input.workTypes],
    visibility: { ...input.visibility },
    status,
  }
}

export function createCommunityJobsRepository(client: CommunityJobsClient = communityJobsMockClient) {
  const writeSeekingPost = async (
    staffKey: string,
    input: SeekingPostUpsertInput,
    status: JobPostingStatus,
    id?: string,
  ): Promise<SeekingPost> => {
    const body = toSeekingWriteDto(input, status)
    const dto = await client.writeSeekingPost(staffKey, body, id)
    return normalizeSeekingPost(dto)
  }

  return {
    async listHiringFeed(filters: HiringFeedFilters = {}): Promise<PaginatedResponse<PosJobPosting>> {
      const response = await client.listHiringFeed(filters)
      return {
        ...response,
        items: (response.items ?? []).map(normalizePosting),
      }
    },

    async listMySeekingPosts(staffKey: string): Promise<PaginatedResponse<SeekingPost>> {
      const response = await client.listMySeekingPosts(staffKey)
      return {
        ...response,
        items: (response.items ?? []).map(normalizeSeekingPost),
      }
    },

    saveSeekingDraft(staffKey: string, input: SeekingPostUpsertInput, id?: string): Promise<SeekingPost> {
      return writeSeekingPost(staffKey, input, JobPostingStatus.Draft, id)
    },

    publishSeekingPost(staffKey: string, input: SeekingPostUpsertInput, id?: string): Promise<SeekingPost> {
      return writeSeekingPost(staffKey, input, JobPostingStatus.Pending, id)
    },

    async closeSeekingPost(staffKey: string, id: string): Promise<SeekingPost> {
      const dto = await client.closeSeekingPost(staffKey, id)
      return normalizeSeekingPost(dto)
    },

    async applyToPosting(staffKey: string, input: JobApplicationInput): Promise<JobApplication> {
      const dto = await client.applyToPosting(staffKey, input)
      return normalizeJobApplication(dto)
    },

    async listMyApplications(staffKey: string): Promise<PaginatedResponse<JobApplication>> {
      const response = await client.listMyApplications(staffKey)
      return {
        ...response,
        items: (response.items ?? []).map(normalizeJobApplication),
      }
    },
  }
}

export const communityJobsRepository = createCommunityJobsRepository()
export default communityJobsRepository
