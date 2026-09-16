import type { PaymentMethodDto, ReviewRecord, TransactionRecord } from './domain'
import type {
  AcceptStaffInviteDto,
  PersonalOnboardingInput,
  PayoutConfigMap,
  StaffInviteParams,
  StaffLinkRequestParams,
  StaffReorderItem,
  UpdateStaffProfileDto,
} from './repositories'

export interface UpdatePaymentMethodVars {
  id: string
  accountInfo?: string | null
  /** Only sent for methods in ACCOUNT_NAME_UI_KEYS; undefined omits the key from the payload. */
  accountName?: string | null
  /** VlinkPay only (US-98). When set, sent instead of accountInfo for crypto receive addresses. */
  cryptoAddresses?: Array<{ network: string; symbol: string; address: string }> | null
  imageUrl?: string | null
  /** When set, file is uploaded via POST /api/v1/images/upload before PUT payment-methods. */
  imageFile?: File | null
  /**
   * VlinkPay only (US-1488) — pending per-coin QR image, keyed by uppercase symbol (USDV/USDT).
   * Resolved (uploaded if a file, kept if a url) and merged onto the matching cryptoAddresses entry.
   */
  cryptoAddressImages?: Record<string, { file?: File | null; url?: string | null }> | null
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

export interface SetMerchantStaffNicknameVars {
  staffLinkId: string
  staffCode: string
  nickname: string | null
}

export interface UpdateMerchantStaffRoleVars {
  staffLinkId: string
  staffCode: string
  roleAtBusiness: string
}

export interface SetStaffBusinessNicknameVars {
  businessId: string
  nickname: string | null
}

export interface UpdateStaffBusinessRoleVars {
  businessId: string
  roleAtBusiness: string
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
  /** Required when paymentMethod is VlinkPay — resolves CryptoAddresses by symbol. */
  cryptoSymbol?: string
}

export interface CreateDirectPaymentVars {
  businessId: string
  businessPaymentMethodId: string
  amount: number
  /** Required when the selected method is VlinkPay. */
  cryptoSymbol?: string
}

export interface CreateStaffDirectPaymentVars {
  staffProfileId: string
  staffPaymentMethodId: string
  amount: number
  /** Required when the selected method is VlinkPay. */
  cryptoSymbol?: string
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
  /** Sent as 1 when the customer tipped a single person, so BE relaxes TIP_MINIMUM_STAFF_COUNT. */
  minStaffCount?: number
  /** Required when business payment method is VlinkPay — resolves CryptoAddresses by symbol. */
  cryptoSymbol?: string
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
  StaffLinkRequestParams,
  StaffReorderItem,
  TransactionRecord,
}
