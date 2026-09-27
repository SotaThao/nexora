// Adapted for Community demo
import {
  JobPostingStatus,
  POS_RECRUITMENT_PATHS,
} from '../../constants/posRecruitment'
import { formatNationalNumber, PhoneDialCode } from '../../components/CountryCodeSelect'
import type { MerchantBusinessInfo, PaginatedResponse } from '../../types/domain'
import type {
  PosJobPosting,
  PosJobPostingDto,
  PosJobPostingUpsertInput,
  PosJobPostingWriteDto,
  PosRecruitmentSalonContext,
} from '../../types/posRecruitment'
import {
  posRecruitmentMockClient,
  type PosRecruitmentClient,
} from './posRecruitmentMockClient'

export function normalizePosting(dto: PosJobPostingDto): PosJobPosting {
  return {
    id: String(dto.id ?? ''),
    code: String(dto.code ?? ''),
    title: String(dto.title ?? '').trim(),
    position: dto.position,
    headcount: Number(dto.headcount ?? 0),
    workType: dto.workType,
    skills: Array.isArray(dto.skills) ? [...dto.skills] : [],
    payType: dto.payType,
    payAmount: dto.payAmount == null ? null : Number(dto.payAmount),
    payUnit: dto.payUnit ?? null,
    payText: typeof dto.payText === 'string' && dto.payText.trim() ? dto.payText.trim() : null,
    isUrgent: Boolean(dto.isUrgent),
    benefits: Array.isArray(dto.benefits) ? [...dto.benefits] : [],
    body: String(dto.body ?? ''),
    deadline: String(dto.deadline ?? ''),
    businessName: String(dto.businessName ?? ''),
    address: String(dto.address ?? ''),
    city: String(dto.city ?? ''),
    state: String(dto.state ?? ''),
    zipCode: String(dto.zipCode ?? ''),
    contactName: String(dto.contactName ?? ''),
    phone: String(dto.phone ?? ''),
    visibilityPreset: dto.visibilityPreset,
    visibility: { ...dto.visibility },
    selectedServices: Array.isArray(dto.selectedServices)
      ? dto.selectedServices.map((service) => ({ ...service }))
      : [],
    status: dto.status,
    chatSessionIds: Array.isArray(dto.chatSessionIds)
      ? dto.chatSessionIds.map((sessionId) => String(sessionId)).filter(Boolean)
      : [],
    externalUrl: dto.externalUrl ?? null,
    createdAt: String(dto.createdAt ?? ''),
    updatedAt: String(dto.updatedAt ?? ''),
    publishedAt: dto.publishedAt ?? null,
    businessId: dto.businessId ?? null,
  }
}

function toWriteDto(input: PosJobPostingUpsertInput, status: JobPostingStatus): PosJobPostingWriteDto {
  return {
    ...input,
    skills: [...input.skills],
    benefits: [...input.benefits],
    selectedServices: input.selectedServices.map((service) => ({ ...service })),
    visibility: { ...input.visibility },
    status,
  }
}

export function toRecruitmentSalon(businessInfo: MerchantBusinessInfo = {}): PosRecruitmentSalonContext {
  const text = (value: unknown) => typeof value === 'string' ? value.trim() : ''
  const rawPhoneDigits = text(businessInfo.phone).replace(/\D/g, '')
  const nationalPhoneDigits = rawPhoneDigits.length === 11 && rawPhoneDigits.startsWith('1')
    ? rawPhoneDigits.slice(1)
    : rawPhoneDigits
  return {
    name: text(businessInfo.name),
    address: text(businessInfo.address),
    city: text(businessInfo.city),
    state: text(businessInfo.state),
    zipCode: text(businessInfo.zipCode),
    phone: formatNationalNumber(nationalPhoneDigits, PhoneDialCode.US),
  }
}

export function createPosRecruitmentRepository(client: PosRecruitmentClient = posRecruitmentMockClient) {
  const write = async (
    input: PosJobPostingUpsertInput,
    status: JobPostingStatus,
    id?: string | null,
  ): Promise<PosJobPosting> => {
    const body = toWriteDto(input, status)
    const dto = id
      ? await client.put<PosJobPostingDto>(`${POS_RECRUITMENT_PATHS.postings}/${id}`, body)
      : await client.post<PosJobPostingDto>(POS_RECRUITMENT_PATHS.postings, body)
    return normalizePosting(dto)
  }

  return {
    async listMyPostings(
      businessInfo?: MerchantBusinessInfo,
      businessId?: string,
    ): Promise<PaginatedResponse<PosJobPosting>> {
      const response = await client.get<PaginatedResponse<PosJobPostingDto>>(
        POS_RECRUITMENT_PATHS.list,
        { recruitmentSalon: toRecruitmentSalon(businessInfo), businessId },
      )
      return {
        ...response,
        items: (response.items ?? []).map(normalizePosting),
      }
    },

    saveDraft(input: PosJobPostingUpsertInput, id?: string | null): Promise<PosJobPosting> {
      return write(input, JobPostingStatus.Draft, id)
    },

    publish(input: PosJobPostingUpsertInput, id?: string | null): Promise<PosJobPosting> {
      return write(input, JobPostingStatus.Pending, id)
    },

    async closePosting(id: string): Promise<PosJobPosting> {
      const dto = await client.patch<PosJobPostingDto>(
        `${POS_RECRUITMENT_PATHS.postings}/${id}/status`,
        { status: JobPostingStatus.Closed },
      )
      return normalizePosting(dto)
    },
  }
}

export const posRecruitmentRepository = createPosRecruitmentRepository()
export default posRecruitmentRepository
