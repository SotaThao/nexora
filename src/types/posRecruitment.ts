import type {
  JobPayType,
  JobPayUnit,
  JobPosition,
  JobPostingStatus,
  JobVisibilityPreset,
  JobWorkType,
  RecruitmentBenefit,
  RecruitmentSkill,
} from '../constants/posRecruitment'

export interface JobPostingVisibility {
  showBusinessName: boolean
  showAddress: boolean
  showContactName: boolean
  showPhone: boolean
}

export interface JobPostingSelectedService {
  posServiceId: string
  name: string
}

export interface PosRecruitmentSalonContext {
  name: string
  address: string
  city: string
  state: string
  zipCode: string
  phone: string
}

export interface PosJobPostingDto {
  id: string
  code: string
  title: string
  position: JobPosition
  headcount: number
  workType: JobWorkType
  skills: RecruitmentSkill[]
  payType: JobPayType
  payAmount?: number | null
  payUnit?: JobPayUnit | null
  payText: string | null
  isUrgent: boolean
  benefits: RecruitmentBenefit[]
  body: string
  deadline: string
  businessName: string
  address: string
  city: string
  state: string
  zipCode: string
  contactName: string
  phone: string
  visibilityPreset: JobVisibilityPreset
  visibility: JobPostingVisibility
  selectedServices: JobPostingSelectedService[]
  status: JobPostingStatus
  chatSessionIds?: string[]
  externalUrl?: string | null
  createdAt: string
  updatedAt: string
  publishedAt?: string | null
  businessId?: string | null
}

export interface PosJobPosting {
  id: string
  code: string
  title: string
  position: JobPosition
  headcount: number
  workType: JobWorkType
  skills: RecruitmentSkill[]
  payType: JobPayType
  payAmount: number | null
  payUnit: JobPayUnit | null
  payText: string | null
  isUrgent: boolean
  benefits: RecruitmentBenefit[]
  body: string
  deadline: string
  businessName: string
  address: string
  city: string
  state: string
  zipCode: string
  contactName: string
  phone: string
  visibilityPreset: JobVisibilityPreset
  visibility: JobPostingVisibility
  selectedServices: JobPostingSelectedService[]
  status: JobPostingStatus
  chatSessionIds?: string[]
  externalUrl: string | null
  createdAt: string
  updatedAt: string
  publishedAt: string | null
  businessId?: string | null
}

export interface PosJobPostingUpsertInput {
  title: string
  position: JobPosition
  headcount: number
  workType: JobWorkType
  skills: RecruitmentSkill[]
  payType: JobPayType
  payAmount: number | null
  payUnit: JobPayUnit | null
  payText: string | null
  isUrgent: boolean
  benefits: RecruitmentBenefit[]
  body: string
  deadline: string
  businessName: string
  address: string
  city: string
  state: string
  zipCode: string
  contactName: string
  phone: string
  visibilityPreset: JobVisibilityPreset
  visibility: JobPostingVisibility
  selectedServices: JobPostingSelectedService[]
}

export interface PosJobPostingWriteDto extends PosJobPostingUpsertInput {
  status: JobPostingStatus
}
