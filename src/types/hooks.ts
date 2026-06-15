import type { PaymentMethodDto, ReviewRecord, TransactionRecord } from './domain'
import type {
  AcceptStaffInviteDto,
  PersonalOnboardingInput,
  PayoutConfigMap,
  StaffInviteParams,
  StaffReorderItem,
  UpdateStaffProfileDto,
} from './repositories'

export interface UpdatePaymentMethodVars {
  id: string
  accountInfo?: string | null
  imageUrl?: string | null
  /** When set, file is uploaded via POST /api/v1/images/upload before PUT payment-methods. */
  imageFile?: File | null
}

export interface SaveStaffAccountVars {
  staffId: string
  data: UpdateStaffProfileDto | LooseObject
}

export interface ResolveReviewVars {
  id: string
  dto?: LooseObject
}

export interface UpdateTransactionVars {
  id: string
  patch: LooseObject
}

export interface UpdateStaffStatusVars {
  staffLinkId: string
  status: string
}

export interface DownloadTouchpointQrVars {
  id: string
  format?: 'png' | 'pdf'
}

export interface CreateTouchpointVars {
  name: string
  type: string
  assignedStaffProfileId?: string
}

export interface CreateTipVars {
  touchPointId: string
  staffProfileId: string
  amount: number
  paymentMethod: string
  sessionId: string
}

export interface SkipTipVars {
  touchPointId: string
  staffProfileId: string
  sessionId: string
}

export interface CreateReviewVars {
  touchPointId: string
  tipId?: string
  staffProfileId: string
  rating: number
  comment?: string
  customerEmail?: string
  customerName?: string
}

export interface CreateMultiStaffTipVars {
  businessId: string
  touchPointId: string
  businessPaymentMethodId: string
  tipItems: Array<{ staffProfileId: string; amount: number }>
}

export interface CustomerTouchPageVars {
  businessSlug: string
  touchPointSlug: string
  sessionId: string
}

export type {
  AcceptStaffInviteDto,
  PersonalOnboardingInput,
  PayoutConfigMap,
  PaymentMethodDto,
  ReviewRecord,
  StaffInviteParams,
  StaffReorderItem,
  TransactionRecord,
}
