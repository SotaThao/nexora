import httpClient from '../../lib/httpClient'
import type { PosOrderStatus } from '../../constants/posOrderStatus'
import type { PaymentMethodDto } from '../../types/domain'
import type {
  LocalStaffActiveWorkItem,
  LocalStaffApiDto,
  LocalStaffCreateParams,
  LocalStaffUpdateParams,
} from '../../types/repositories'
import { PAYOUT_UI_LABELS, payoutTypeToUiKey } from '../paymentMethodTypes'

type HttpClient = typeof httpClient

interface LocalStaffActiveWorkApiDto {
  orderId?: string
  orderNumber?: string
  customerName?: string
  status?: string
  isBooking?: boolean
  scheduledAt?: string | null
  source?: string | null
  checkedInAt?: string
}

interface LocalStaffPaymentMethodApiDto {
  id?: string
  type?: string
  accountInfo?: string | null
  accountName?: string | null
  imageUrl?: string | null
  isActive?: boolean
  isConfigured?: boolean
}

function toLocalStaffRequestBody(params: LocalStaffCreateParams) {
  return {
    displayName: params.displayName,
    position: params.position ?? null,
    bio: params.bio ?? null,
    photoUrl: params.photoUrl ?? null,
    phoneNumber: params.phoneNumber ?? null,
    email: params.email ?? null,
    firstName: params.firstName,
    lastName: params.lastName,
  }
}

// The one allowed place to touch the raw backend status literal — everything downstream
// compares against the PosOrderStatus enum.
function normalizeLocalStaffActiveWork(dto: LocalStaffActiveWorkApiDto): LocalStaffActiveWorkItem {
  return {
    orderId: dto.orderId ?? '',
    orderNumber: dto.orderNumber ?? '',
    customerName: dto.customerName ?? '',
    status: (dto.status ?? '') as PosOrderStatus,
    isBooking: Boolean(dto.isBooking),
    scheduledAt: dto.scheduledAt ?? null,
    source: dto.source ?? null,
    checkedInAt: dto.checkedInAt ?? '',
  }
}

function normalizeLocalStaffPaymentMethod(dto: LocalStaffPaymentMethodApiDto): PaymentMethodDto {
  const type = dto.type || ''
  const uiKey = payoutTypeToUiKey(type)
  return {
    id: dto.id,
    type,
    uiKey,
    name: PAYOUT_UI_LABELS[uiKey] || type,
    accountInfo: dto.accountInfo ?? null,
    accountName: dto.accountName ?? null,
    imageUrl: dto.imageUrl ?? null,
    isActive: Boolean(dto.isActive),
    isConfigured: Boolean(dto.isConfigured),
  }
}

export function createLocalStaffRepository(client: HttpClient = httpClient) {
  return {
    async create(params: LocalStaffCreateParams): Promise<LocalStaffApiDto> {
      return client.post<LocalStaffApiDto>('/api/v1/merchant/local-staff', toLocalStaffRequestBody(params))
    },

    async update(staffProfileId: string, params: LocalStaffUpdateParams): Promise<void> {
      await client.put(
        `/api/v1/merchant/local-staff/${encodeURIComponent(staffProfileId)}`,
        toLocalStaffRequestBody(params),
      )
    },

    async remove(staffProfileId: string): Promise<void> {
      await client.del(`/api/v1/merchant/local-staff/${encodeURIComponent(staffProfileId)}`)
    },

    async getActiveWork(staffProfileId: string): Promise<LocalStaffActiveWorkItem[]> {
      const res = await client.get<LocalStaffActiveWorkApiDto[]>(
        `/api/v1/merchant/local-staff/${encodeURIComponent(staffProfileId)}/active-work`,
      )
      return Array.isArray(res) ? res.map(normalizeLocalStaffActiveWork) : []
    },

    async getPaymentMethods(staffProfileId: string): Promise<PaymentMethodDto[]> {
      const res = await client.get<LocalStaffPaymentMethodApiDto[]>(
        `/api/v1/merchant/local-staff/${encodeURIComponent(staffProfileId)}/payment-methods`,
      )
      return Array.isArray(res) ? res.map(normalizeLocalStaffPaymentMethod) : []
    },

    async updatePaymentMethod(
      staffProfileId: string,
      paymentMethodId: string,
      dto: { accountInfo?: string | null; accountName?: string | null; imageUrl?: string | null },
    ): Promise<PaymentMethodDto> {
      const res = await client.put<LocalStaffPaymentMethodApiDto>(
        `/api/v1/merchant/local-staff/${encodeURIComponent(staffProfileId)}/payment-methods/${encodeURIComponent(paymentMethodId)}`,
        dto,
      )
      return normalizeLocalStaffPaymentMethod(res)
    },

    async togglePaymentMethod(staffProfileId: string, paymentMethodId: string): Promise<PaymentMethodDto> {
      const res = await client.patch<LocalStaffPaymentMethodApiDto>(
        `/api/v1/merchant/local-staff/${encodeURIComponent(staffProfileId)}/payment-methods/${encodeURIComponent(paymentMethodId)}/toggle`,
      )
      return normalizeLocalStaffPaymentMethod(res)
    },
  }
}

export const localStaffRepository = createLocalStaffRepository()
export default localStaffRepository
