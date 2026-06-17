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
  id?: string
  businessId?: string
  name?: string
  slug?: string
  businessSlug?: string
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

export interface TipsSummaryApiDto {
  totalAmount?: number
  totalCount?: number
  avgAmount?: number
  previousPeriodComparison?: number | null
}

export interface ScansSummaryApiDto {
  totalPageViews?: number
  conversionRate?: number
}

export interface ReviewsSummaryApiDto {
  totalCount?: number
  avgRating?: number
  count4To5Stars?: number
  count1To3Stars?: number
  googleClickCount?: number
  yelpClickCount?: number
}

export interface DashboardOverviewApiDto {
  tipsSummary?: TipsSummaryApiDto
  scansSummary?: ScansSummaryApiDto
  reviewsSummary?: ReviewsSummaryApiDto
}

export interface DashboardOverviewMetrics {
  totalTips: number
  totalTransactions: number
  averageTip: number
  totalReviews: number
  scans: number
  conversionRate: number
  averageRating: number
  googleClicks: number
  yelpClicks: number
  count4To5Stars: number
  count1To3Stars: number
  previousPeriodComparison: number | null
}

export interface DashboardKpiDeltas {
  totalTips: number | null
  totalTransactions: number | null
  averageTip: number | null
  totalReviews: number | null
}

export interface DashboardStaffMetricApiDto {
  staffProfileId?: string
  staffId?: string
  id?: string
  displayName?: string
  staffName?: string
  name?: string
  tipTotal?: number
  tipsCollected?: number
  tips?: number
  avgRating?: number
  rating?: number
  reviewCount?: number
  totalReviews?: number
}

export interface StaffLeaderboardRow {

export interface DashboardTipsChartApiDto {
  date: string
  totalAmount: number
  tipCount: number
  avgAmount: number
}

export interface TipsChartDayMetric {
  date: string
  totalAmount: number
  tipCount: number
  avgAmount: number
}

export type DashboardReviewRoutingType = 'Public' | 'Private' | 'Skipped'

export interface DashboardReviewApiDto {
  id?: string
  rating?: number
  comment?: string
  staffName?: string
  touchPointName?: string
  routingType?: DashboardReviewRoutingType | string
  googleClickedAt?: string | null
  yelpClickedAt?: string | null
  isResolved?: boolean
  customerEmail?: string
  customerName?: string
  createdAt?: string
}

export interface DashboardReviewsPage {
  items: ReviewRecord[]
  pageNumber: number
  totalPages: number
  totalCount: number
  hasPreviousPage: boolean
  hasNextPage: boolean
}

export interface DashboardReviewsQuery {
  startDate?: string
  endDate?: string
  dateFrom?: string
  dateTo?: string
  routingType?: DashboardReviewRoutingType | null
  pageNumber?: number
  pageSize?: number
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
  refCode?: string | null
  source?: string | null
  inviteSource?: string | null
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
  joinDate?: string | null
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

/** v3.3 — `GET /merchant/staff/invites` item (StaffInviteListItemDto). */
export interface StaffInviteListItemApiDto {
  id?: string
  invitedName?: string
  invitedEmail?: string | null
  invitedPhone?: string | null
  invitedPosition?: string | null
  status?: string
  expiresAt?: string | null
  invitedAt?: string | null
  acceptedAt?: string | null
}

/** v3.3 — `GET /merchant/staff/invites/{inviteId}` (StaffInviteDetailDto). */
export interface StaffInviteDetailApiDto extends StaffInviteListItemApiDto {
  acceptedByUserProfileId?: string | null
}

/** v3.3 — normalized merchant invite (camelCase domain shape). */
export interface MerchantStaffInvite {
  inviteId: string | null
  invitedName: string
  invitedEmail: string | null
  invitedPhone: string | null
  invitedPosition: string | null
  status: string | null
  expiresAt: string | null
  invitedAt: string | null
  acceptedAt: string | null
  acceptedByUserProfileId: string | null
}

/** v3.3 — `GET /merchant/staff/invites` query params. */
export interface StaffInvitesQuery {
  keyword?: string
  statusFilter?: string
  pageNumber?: number
  pageSize?: number
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
  readAt?: string | null
  createdAt?: string
  /** @deprecated legacy mock shape */
  read?: boolean
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
  invitedEmail?: string | null
  businessName?: string
  businessAddress?: string | null
  businessId?: string | null
  businessSlug?: string | null
  refCode?: string | null
  source?: string | null
}

/**
 * `GET /api/v1/public/merchant-invite?ref={referralCode}` → MerchantPublicInviteDto.
 * Field names tolerant pending exact DTO confirmation against live Swagger
 * (components/schemas/MerchantPublicInviteDto). Endpoint + `ref` query param verified.
 */
export interface MerchantPublicInviteApiDto {
  businessName?: string
  name?: string
  businessAddress?: string | null
  address?: string | null
  businessId?: string | null
  businessSlug?: string | null
  slug?: string | null
  logoUrl?: string | null
  referralCode?: string | null
  isEnabled?: boolean
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
  token?: string
  inviteLink?: string
  invitedEmail?: string | null
}

export interface StaffLinkRequestParams {
  staffProfileId: string
  staffCode?: string | null
}

export interface InviteLinkSettingDto {
  isEnabled: boolean
  referralCode: string
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
  state?: string
  country?: string
  zipCode?: string
  address?: string
  website?: string
  youtube?: string
  instagram?: string
  facebook?: string
  twitter?: string
  tiktok?: string
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
}

export interface JoinPublicInviteDto {
  referralCode: string
  displayName: string
  phoneNumber?: string | null
  position?: string | null
  bio?: string | null
  photoUrl?: string | null
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
