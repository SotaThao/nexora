import type { ApiError } from './api'
import type { LooseObject } from './domain'
import type {
  MerchantSetup,
  NotificationRecord,
  PaginatedResponse,
  PaymentMethodDto,
  ReviewRecord,
  StaffAccountView,
  StaffBusinessLink,
  StaffInviteInfo,
  StaffLinkRequestDetail,
  StaffMember,
  StaffSearchResult,
  TouchpointPage,
  TouchpointRecord,
  TransactionRecord,
  UserProfile,
} from './domain'

export type { ApiError }

// --- API raw DTOs (Swagger-aligned, optional fields) ---

export interface BusinessApiDto {
  name?: string
  businessType?: string
  address?: string
  phone?: string
  website?: string
  logoUrl?: string | null
  googleReviewUrl?: string
  yelpUrl?: string
  facebookUrl?: string
  feedbackEmail?: string
}

export interface DashboardOverviewApiDto {
  totalTipAmount?: number
  totalTips?: number
  tipCount?: number
  totalTransactions?: number
  averageTip?: number
  totalReviews?: number
  totalScans?: number
  conversionRate?: number
  publicReviews?: number
  privateReviews?: number
  averageRating?: number
  googleClicks?: number
  yelpClicks?: number
  googleRating?: number
  googleReviews?: number
  yelpRating?: number
  yelpReviews?: number
  responseRate?: number
  returningCustomers?: number
  returningCustomersDelta?: number
}

export interface DashboardStaffMetricApiDto {
  staffId?: string
  id?: string
  staffName?: string
  name?: string
  tipsCollected?: number
  tips?: number
  avgRating?: number
  rating?: number
  totalReviews?: number
}

export interface DashboardOverviewMetrics {
  totalTips: number
  totalTransactions: number
  averageTip: number
  totalReviews: number
  scans: number
  conversionRate: number
  publicReviews: number
  privateReviews: number
  averageRating: number
  googleClicks: number
  yelpClicks: number
  googleRating: number
  googleReviews: number
  yelpRating: number
  yelpReviews: number
  responseRate: number
  returningCustomers: number
  returningCustomersDelta: number
}

export interface StaffLeaderboardRow {
  id: string
  name: string
  tips: number
  rating: number
  totalReviews: number
}

export interface StaffPaymentMethodApiDto {
  type?: string
  isActive?: boolean
  accountInfo?: string
  imageUrl?: string
}

export interface StaffListItemApiDto {
  id?: string
  linkId?: string
  inviteId?: string
  staffLinkId?: string
  staffProfileId?: string | null
  staffCode?: string | null
  itemType?: string
  sortOrder?: number
  isProfileComplete?: boolean
  tipCount?: number
  averageRating?: number
  displayName?: string
  photoUrl?: string | null
  status?: string
  position?: string | null
  bio?: string | null
  invitedEmail?: string | null
  invitedPhone?: string | null
  phoneNumber?: string | null
  email?: string | null
  phone?: string | null
  paymentMethods?: StaffPaymentMethodApiDto[]
  staffProfile?: { phoneNumber?: string; phone?: string; email?: string }
  user?: { phoneNumber?: string; phone?: string; email?: string }
}

export interface StaffSearchResultApiDto {
  staffProfileId: string
  staffCode?: string | null
  displayName?: string
  photoUrl?: string | null
  position?: string | null
}

export interface TipApiDto {
  id?: string
  amount?: number
  status?: string
  paymentMethod?: string
  staffName?: string
  staffProfileId?: string | null
  touchPointName?: string
  touchPointId?: string | null
  createdAt?: string
  confirmedAt?: string | null
  isMultiStaff?: boolean
  tipItems?: unknown[]
}

export interface TipsPaginatedApiDto {
  items?: TipApiDto[]
  pageNumber?: number
  totalPages?: number
  totalCount?: number
  hasNextPage?: boolean
  hasPreviousPage?: boolean
}

export interface NotificationApiDto {
  id?: string
  type?: string
  title?: string
  body?: string
  message?: string
  actionUrl?: string | null
  referenceId?: string | null
  isRead?: boolean
  read?: boolean
  createdAt?: string
}

export interface StaffLinkRequestDetailApiDto {
  id?: string
  businessName?: string
  businessLogoUrl?: string | null
  businessRole?: string | null
  requestedAt?: string | null
  status?: string | null
}

export interface InviteInfoApiDto {
  invitedName?: string
  invitedPosition?: string | null
  businessName?: string
}

export interface SlugCheckResult {
  isAvailable: boolean
  suggestion: string | null
}

export interface CreateBusinessResult {
  businessId: string
  slug: string
}

export interface ImageUploadResult {
  imageUrl?: string
  fileUrl?: string
}

export interface TouchpointCreateResult {
  touchPointId: string
  qrImageUrl: string
}

export interface StaffInviteParams {
  name: string
  email?: string
  phone?: string
  position?: string
}

export interface StaffInviteResult {
  inviteId: string
}

export interface StaffReorderItem {
  staffLinkId: string
  sortOrder: number
}

export interface UpdateUserProfileDto {
  firstName: string
  lastName: string
  phoneNumber: string
  profileImageUrl?: string
  city?: string
}

export interface UpdateStaffProfileDto {
  displayName: string
  position?: string
  bio?: string
  photoUrl?: string
}

export interface AcceptStaffInviteDto {
  token: string
  displayName: string
  position?: string | null
  bio?: string | null
  photoUrl?: string | null
  password?: string | null
}

export interface JoinPublicInviteDto {
  referralCode: string
  displayName: string
  phoneNumber?: string | null
  position?: string | null
  bio?: string | null
}

export interface PersonalOnboardingInput {
  accountData: LooseObject
  paymentAccounts: LooseObject
  payoutConfigs: Record<string, { enabled?: boolean; value?: string }>
}

export interface PayoutConfigMap {
  [uiKey: string]: { enabled?: boolean; value?: string; qrCode?: string; accountName?: string }
}

export type {
  MerchantSetup,
  NotificationRecord,
  PaginatedResponse,
  PaymentMethodDto,
  ReviewRecord,
  StaffAccountView,
  StaffBusinessLink,
  StaffInviteInfo,
  StaffLinkRequestDetail,
  StaffMember,
  StaffSearchResult,
  TouchpointPage,
  TouchpointRecord,
  TransactionRecord,
  UserProfile,
}
