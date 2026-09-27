import type {
  JobApplicationStatus,
  JobPostKind,
  SeekingExperience,
} from '../constants/communityJobs'
import type {
  JobPayType,
  JobPayUnit,
  JobPostingStatus,
  JobWorkType,
  RecruitmentSkill,
} from '../constants/posRecruitment'
import type { PosJobPosting, PosJobPostingDto } from './posRecruitment'

export interface SeekingPostVisibility {
  showFullName: boolean
  showPhone: boolean
}

export interface SeekingPostUpsertInput {
  title: string
  skills: RecruitmentSkill[]
  experience: SeekingExperience
  workTypes: JobWorkType[]
  city: string
  state: string
  payType: JobPayType
  payAmount?: number | null
  payUnit?: JobPayUnit | null
  payText: string | null
  availableFrom: string | null
  body: string
  displayName: string
  phone: string
  visibility: SeekingPostVisibility
}

export interface SeekingPostDto extends SeekingPostUpsertInput {
  id: string
  code: string
  postKind: JobPostKind
  status: JobPostingStatus
  createdAt: string
  updatedAt: string
  publishedAt?: string | null
}

export interface SeekingPost extends Omit<SeekingPostUpsertInput, 'payAmount' | 'payUnit'> {
  id: string
  code: string
  postKind: JobPostKind
  payAmount: number | null
  payUnit: JobPayUnit | null
  status: JobPostingStatus
  createdAt: string
  updatedAt: string
  publishedAt: string | null
}

export interface SeekingPostWriteDto extends SeekingPostUpsertInput {
  status: JobPostingStatus
}

export interface HiringFeedFilters {
  keyword?: string
  city?: string
  state?: string
  workType?: JobWorkType | null
  skill?: RecruitmentSkill | null
}

export interface JobApplicationInput {
  postingId: string
  note: string
  seekingPostId: string | null
  sharePhone: boolean
}

export interface JobApplicationDto {
  id: string
  postingId: string
  seekingPostId?: string | null
  note: string
  sharePhone: boolean
  status: JobApplicationStatus
  createdAt: string
  posting?: PosJobPostingDto | null
}

export interface JobApplication {
  id: string
  postingId: string
  seekingPostId: string | null
  note: string
  sharePhone: boolean
  status: JobApplicationStatus
  createdAt: string
  posting: PosJobPosting | null
}
