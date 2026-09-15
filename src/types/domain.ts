import type { ApiError } from './api'

/** Escape hatch for legacy form/state blobs during incremental typing. */
export type LooseObject = Record<string, any>

/** Shared loose domain shapes — tighten incrementally per repository. */
export interface MerchantBusinessInfo {
  id?: string
  businessId?: string
  name?: string
  slug?: string
  industry?: string
  address?: string
  city?: string
  state?: string
  zipCode?: string
  country?: string
  phone?: string
  website?: string
  timeZone?: string | null
  logo?: string | null
  bookingNotificationPhone?: string
  salesTaxRatePercent?: number
  createdAt?: string | null
  [key: string]: unknown
}

// POS Owner Setup — Business Hours (US-014). dayOfWeek/openTime/closeTime mirror
// the API shape 1:1 (string enum "Sunday".."Saturday", "HH:mm:ss" time strings) —
// no normalization needed at the repository boundary for this simple shape.
export interface BusinessHourEntry {
  dayOfWeek: string
  isOpen: boolean
  openTime?: string | null
  closeTime?: string | null
}

export interface StaffMember {
  id?: string
  fullName?: string
  nickname?: string
  nicknameAtBusiness?: string | null
  email?: string
  phone?: string
  isActive?: boolean
  showInTipsFlow?: boolean
  refCode?: string | null
  source?: string | null
  paymentAccounts?: Record<string, string>
  /** POS Staff Level name assigned at this business, when the backend returns one. */
  staffLevelName?: string | null
  [key: string]: unknown
}

export interface ReviewLinks {
  googleReview?: string
  yelpReview?: string
  facebookReview?: string
  instagramReview?: string
  feedbackEmail?: string
}

export interface MerchantSetup {
  businessInfo?: MerchantBusinessInfo
  reviewLinks?: ReviewLinks
  staffList?: StaffMember[]
  touchPoints?: DomainEntity[]
  touchpoints?: DomainEntity[]
  [key: string]: unknown
}

export interface PaginatedResponse<T> {
  items: T[]
  pageNumber: number
  totalPages: number
  totalCount: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

/** VlinkPay crypto receive address row (US-98). */
export interface PaymentMethodCryptoAddressDto {
  network: string
  symbol: string
  address: string
  /** Per-coin QR image (US-1488). */
  imageUrl?: string | null
}

export interface PaymentMethodDto {
  id?: string
  type: string
  /** Normalized key for logos / payout modals (e.g. cashapp, zelle). */
  uiKey?: string
  accountInfo: string | null
  imageUrl?: string | null
  accountName?: string | null
  /** Present for VlinkPay only — source of truth for isConfigured when accountInfo is null. */
  cryptoAddresses?: PaymentMethodCryptoAddressDto[] | null
  isActive: boolean
  isConfigured?: boolean
  businessKybStatus?: string | null
  name?: string
}

/** Merchant direct-payment QR — GET /api/v1/merchant/payments/qr */
export interface MerchantPaymentQr {
  paymentUrl: string
  businessId: string
}

/** Staff direct-payment QR — GET /api/v1/staff/payments/qr */
export interface StaffPaymentQr {
  paymentUrl: string
  staffProfileId: string
}

/** Public direct-payment page — GET /api/v1/public/merchant/{businessId}/payment */
export interface PublicDirectPaymentMethod {
  id: string
  type: string
  uiKey?: string
  accountInfo: string
  accountName?: string | null
  imageUrl?: string | null
  cryptoAddresses?: PaymentMethodCryptoAddressDto[] | null
}

/** Tippable staff row rendered by the payment/touch tip pickers. */
export interface PublicDirectPaymentStaff {
  id: string
  displayName: string
  /** Nickname at this business when set, display name otherwise (avatar initial). */
  nickname: string
  photoUrl: string | null
  position: string | null
}

/** Tip bounds — server tipConstraints when sent, frontend defaults otherwise. */
export interface TipConstraints {
  /** Minimum each staff member may receive after the even split. */
  minItemAmount: number
  /** Maximum tip total on one payment. */
  maxTotalAmount: number
}

export interface PublicDirectPaymentPage {
  businessId: string
  businessName: string
  logoUrl?: string | null
  paymentUrl: string
  paymentMethods: PublicDirectPaymentMethod[]
  /** Required by POST /api/v1/tips/multi-staff — null until BE exposes it here. */
  touchPointId: string | null
  /** Touch slugs, when BE sends them — fallback source for the tippable staff list. */
  businessSlug: string | null
  touchPointSlug: string | null
  /** Tippable staff for the "Who served you today?" picker. */
  staff: PublicDirectPaymentStaff[]
  tipConstraints: TipConstraints
}

/** Public staff direct-payment page — GET /api/v1/public/staff/{staffProfileId}/payment */
export interface PublicStaffDirectPaymentPage {
  staffProfileId: string
  displayName: string
  photoUrl?: string | null
  paymentUrl: string
  paymentMethods: PublicDirectPaymentMethod[]
}

export interface CreateDirectPaymentResult {
  paymentId: string
  amount: number
  type: number
  paymentMethod: PublicDirectPaymentMethod
}

/** GET /api/v1/public/payments/{paymentId}/status — lightweight status poll */
export interface DirectPaymentStatusSnapshot {
  paymentId: string
  status: PaymentStatusValue
  type: number
  amount: number
  createdAt: string
  customerConfirmedAt?: string | null
  merchantConfirmedAt?: string | null
}

/** PaymentType enum — DirectPayment = 0, StaffDirectPayment = 1 per direct-payment QR specs. */
export const PaymentType = {
  DirectPayment: 0,
  StaffDirectPayment: 1,
} as const

/** PaymentStatus enum — direct-payment-qr-flow state machine. */
export const PaymentStatus = {
  Initiated: 0,
  Confirmed: 1,
  Completed: 2,
} as const

export type PaymentTypeValue = (typeof PaymentType)[keyof typeof PaymentType]
export type PaymentStatusValue = (typeof PaymentStatus)[keyof typeof PaymentStatus]

/** VlinkPay receive wallet on GET merchant/staff payments/{id}. */
export interface PaymentCryptoWallet {
  network: string
  symbol: string
  address: string
}

/** Merchant payment ledger item — GET /api/v1/merchant/payments */
export interface MerchantPaymentRecord {
  id: string
  type: number
  amount: number
  status: PaymentStatusValue
  paymentMethodType: string
  createdAt: string
  customerConfirmedAt?: string | null
  merchantConfirmedAt?: string | null
  accountInfo?: string | null
  imageUrl?: string | null
  cryptoWallet?: PaymentCryptoWallet | null
  /** Income/Payout Categories (issue #584) — Merchant-assigned category (DirectPayment only). */
  categoryId?: string | null
  categoryName?: string | null
}

export interface MerchantPaymentsListPage {
  items: MerchantPaymentRecord[]
  pageNumber: number
  pageSize: number
  totalPages: number
  totalCount: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

export interface MerchantPaymentStatusBucket {
  count: number
  totalAmount: number
}

export interface MerchantPaymentMethodStat {
  method: string
  count: number
  totalAmount: number
}

/** GET /api/v1/merchant/payments/stats */
export interface MerchantPaymentStats {
  totalCount: number
  totalAmount: number
  averageAmount: number
  conversionRate: number
  mostUsedMethod: string | null
  byStatus: {
    initiated: MerchantPaymentStatusBucket
    confirmed: MerchantPaymentStatusBucket
    completed: MerchantPaymentStatusBucket
  }
  paymentPending: MerchantPaymentStatusBucket
  paymentCompleted: MerchantPaymentStatusBucket
  byPaymentMethod: MerchantPaymentMethodStat[]
}

/** Staff payment ledger item — GET /api/v1/staff/payments */
export interface StaffPaymentRecord {
  id: string
  type: number
  amount: number
  status: PaymentStatusValue
  paymentMethodType: string
  createdAt: string
  customerConfirmedAt?: string | null
  staffConfirmedAt?: string | null
  accountInfo?: string | null
  imageUrl?: string | null
  cryptoWallet?: PaymentCryptoWallet | null
  /** Income/Payout Categories (issue #584) — Staff-assigned category. */
  categoryId?: string | null
  categoryName?: string | null
}

export interface StaffPaymentsListPage {
  items: StaffPaymentRecord[]
  pageNumber: number
  pageSize: number
  totalPages: number
  totalCount: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

export interface TouchpointRecord {
  id?: string
  name?: string
  slug?: string | null
  type?: string
  url?: string | null
  qrImageUrl?: string | null
  isActive?: boolean
  assignedStaffProfileId?: string | null
  createdAt?: string | null
  /** Normalized from API `totalScans` */
  scans?: number
  /** Normalized from API `totalRevenue` */
  revenue?: number
  deviceId?: string | null
  [key: string]: unknown
}

export interface PhysicalCardRecord {
  id: string
  cardCode: string
  helpCode?: string | null
  linkedTouchPointId?: string | null
  touchPointName?: string | null
  linkedAt?: string | null
}

export interface PhysicalCardDetail {
  id: string
  cardCode: string
  helpCode: string
  isActive: boolean
  linkedTouchPointId?: string | null
  touchPointName?: string | null
  touchPointUrl?: string | null
  linkedAt?: string | null
}

export interface QrTouchPointRef {
  id: string
  name: string
  slug: string
  type?: string
  businessId?: string
  businessName?: string
  businessSlug: string
}

/**
 * A physical card points at exactly one destination: a TouchPoint or a OneQR.
 * Mirrors `QrOneQrDto`.
 */
export interface QrOneQrRef {
  id: string
  name: string
  isActive: boolean
  businessId: string
  businessName: string
  businessSlug: string
}

export interface ResolveQrCodePayload {
  status: string
  touchPoint: QrTouchPointRef | null
  oneQr: QrOneQrRef | null
}

export type PhysicalCardPage = PaginatedResponse<PhysicalCardRecord>

export type TouchpointPage = PaginatedResponse<TouchpointRecord>

export interface NotificationRecord {
  id: string
  type: string
  title: string
  message: string
  actionUrl?: string | null
  isRead?: boolean
  read: boolean
  readAt?: string | null
  referenceId?: string | null
  createdAt?: string
  /** Alias of message for legacy UI */
  body?: string
  time: string
  staffId?: string
  linkTab?: string
  /** Sub-tab within the 'reports' linkTab: 'tips' | 'direct_payments'. */
  reportsTab?: string
  paymentId?: string
  /** Tip transaction id (referenceId) to auto-open in the Tips list modal. */
  transactionId?: string
  /** Community chat session id for CommunityNewChatMessage notifications. */
  chatSessionId?: string
  [key: string]: unknown
}

export interface NotificationsPage {
  items: NotificationRecord[]
  pageNumber: number
  totalPages: number
  totalCount: number
  hasPreviousPage: boolean
  hasNextPage: boolean
}

export interface StaffInviteInfo {
  invitedName: string
  invitedPosition: string | null
  invitedEmail?: string | null
  businessName: string
  businessAddress: string | null
  businessId?: string | null
  businessSlug?: string | null
  refCode?: string | null
  source?: string | null
}

export interface StaffSearchResult {
  staffProfileId: string
  staffCode: string | null
  fullName: string
  avatar: string | null
  position: string | null
  paymentMethods: PaymentMethodDto[]
}

export interface StaffBusinessLink {
  businessId: string
  businessName: string
  nicknameAtBusiness: string | null
  address: string | null
  city: string | null
  state: string | null
  logoUrl: string | null
  role: string | null
  roleLabel: string | null
  roleAtBusiness: string | null
  // POS Staff Level assigned to this staff member at this salon (business-defined,
  // optional — see PosStaffLevelApiDto). Not yet returned by the backend's
  // GET /api/v1/staff/businesses; renders only once BE adds it.
  staffLevelId?: string | null
  staffLevelName?: string | null
  linkStatus: string | null
  linkStatusLabel: string | null
  linkedAt: string | null
  /** Canonical business slug for /touch/{businessSlug}/… (from API when available). */
  businessSlug?: string | null
  /** Business touch-point slug (e.g. master-store / FrontDesk), from API. */
  touchPointSlug?: string | null
  masterTouchPointSlug?: string | null
  /** Full customer tipping URL (from API when available). */
  tipUrl?: string | null
  /** Hosted QR PNG from touchpoint API (from API when available). */
  qrImageUrl?: string | null
  /** True when BE returned touchPoints: [] and no touchpoint slug/URL is available yet. */
  touchPointsMissing?: boolean
  /** Business owner userProfileId — peer for staff-initiated community chat. */
  ownerUserProfileId?: string | null
  /** IANA timezone of the salon (e.g. America/Chicago). */
  timeZone?: string | null
}

export interface StaffBusinessTipQr {
  businessId: string
  businessName: string
  displayName?: string | null
  businessSlug: string
  touchPointSlug: string
  tipUrl: string | null
  qrImageUrl: string | null
  linkStatus: string | null
  linkStatusLabel: string | null
  roleLabel: string | null
  roleAtBusiness: string | null
  logoUrl: string | null
  /** True when the business has no touchpoint data to build a tipping link. */
  tipLinkIncomplete?: boolean
}

export interface TipCountAmount {
  count: number
  totalAmount: number
}

export interface StaffDashboardSummary {
  todayTips: TipCountAmount
  thisMonthTips: TipCountAmount
  pendingTips: TipCountAmount
  averageRating: number
  totalReviews: number
}

export interface StaffStatisticsCategory {
  category: string
  amount: number
  percentageOfTotal: number
}

export interface StaffDashboardStatistics {
  availableBalance: number
  pending: number
  lifetimeEarnings: number
  categories: StaffStatisticsCategory[]
}

export interface StaffReviewDistribution {
  star1: number
  star2: number
  star3: number
  star4: number
  star5: number
}

export interface StaffReviewsSummary {
  totalReviews: number
  averageRating: number
  distribution: StaffReviewDistribution
}

export interface StaffReviewItem {
  id: string
  rating: number
  comment: string | null
  customerName: string | null
  businessName: string | null
  createdAt: string | null
}

export interface StaffReviewsPage {
  summary: StaffReviewsSummary
  items: StaffReviewItem[]
  pageNumber: number
  totalPages: number
  totalCount: number
}

import type { TipStatusValue } from '../constants/tipStatus'

export type StaffTipStatus = TipStatusValue | string

export interface StaffTipItem {
  id: string
  amount: number
  totalAmount: number
  status: StaffTipStatus
  statusLabel: string | null
  paymentMethod: string | null
  isMultiStaff: boolean
  touchPointName: string | null
  businessName: string | null
  createdAt: string | null
  confirmedAt: string | null
  staffConfirmedAt: string | null
  merchantConfirmedAt: string | null
  /** Income/Payout Categories (issue #584) — this staff member's own category for their share. */
  categoryId?: string | null
  categoryName?: string | null
}

export interface StaffTipsPage {
  items: StaffTipItem[]
  pageNumber: number
  totalPages: number
  totalCount: number
  hasPreviousPage: boolean
  hasNextPage: boolean
}

export interface StaffTipsConfirmReceiptResult {
  confirmedCount: number
  failedIds: string[]
}

export interface StaffLinkRequestDetail {
  id: string
  businessId: string | null
  businessName: string
  businessLogoUrl: string | null
  businessRole: string | null
  requestedAt: string | null
  status: string | null
  roleAtBusiness: string | null
}

export interface StaffAccountView {
  id?: string
  profile: UserProfile
  paymentMethods: PaymentMethodDto[]
  tips: unknown[]
  staffReviews: unknown[]
  kpis: {
    totalTips: number
    averageTip: number
    totalTransactions: number
    averageRating: number
    isPending: boolean
  }
  staffCode?: string
  payoutMethods?: Record<string, {
    enabled?: boolean
    value?: string
    qrCode?: string
    accountName?: string
  }>
  defaultDisplayName?: string
  phone?: string
  email?: string
  bio?: string
  avatar?: string
}

export interface DomainEntity {
  id?: string
  name?: string
  status?: string
  amount?: number
  email?: string
  phone?: string
  fullName?: string
  [key: string]: unknown
}

export interface TransactionRecord extends DomainEntity {
  amount?: number
  status?: string
  statusLabel?: string | null
  staff?: StaffMember | string
  staffId?: string
  staffName?: string
  staffProfileId?: string | null
  businessName?: string
  paymentMethod?: string
  dateTime?: string
  touchpoint?: string
  touchPointId?: string | null
  confirmedAt?: string | null
  staffConfirmedAt?: string | null
  merchantConfirmedAt?: string | null
  isMultiStaff?: boolean
  isLocalStaff?: boolean
  tipItems?: unknown[]
  /** Income/Payout Categories (issue #584) — Staff-assigned category on a Tip (staff audience only). */
  categoryId?: string | null
  categoryName?: string | null
  [key: string]: unknown
}

/** Result of POST /api/v1/merchant/tips/confirm-receipt (see US-025). */
export interface MerchantTipsConfirmReceiptResult {
  confirmedCount: number
  failedIds: string[]
}

export interface ReviewRecord extends DomainEntity {
  rating?: number
  comment?: string
  [key: string]: unknown
}

/** One row from GET /api/v1/userprofile/me → `business.subscriptions[]`. */
export interface UserSubscription {
  /** Wire: TipPlatform | VoiceAI */
  packageType?: string
  packageCode?: string
  name?: string
  status?: string
  trialEndsAt?: string | null
  currentPeriodEnd?: string | null
}

export interface UserProfile {
  id?: string
  /** Nested business summary from GET /api/v1/userprofile/me (BusinessSummaryDto). */
  business?: MerchantBusinessInfo | null
  fullName?: string
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
  phoneNumber?: string
  profileImage?: {
    id?: string | null
    title?: string | null
    imageUrl?: string | null
    thumbnailUrl?: string | null
    url?: string
  } | string
  profileImageUrl?: string
  userType?: string
  profileType?: string
  status?: string
  staffCode?: string
  staffProfileId?: string
  staffId?: string
  hasCompletedOnboarding?: boolean
  referralCode?: string
  /**
   * TipPlatform subscription (sidebar / Touch plans).
   * Prefer reading `subscriptions` + packageType when multiple products exist.
   */
  subscription?: UserSubscription | null
  /** Normalized `business.subscriptions` from /userprofile/me. */
  subscriptions?: UserSubscription[]
  createdAt?: string | null
  [key: string]: unknown
}

export interface StaffProfile {
  id?: string
  staffCode?: string
  displayName?: string
  position?: string
  bio?: string
  photo?: string
  photoUrl?: string
  firstName?: string
  lastName?: string
  phone?: string
  isProfileComplete?: boolean
  createdAt?: string | null
  [key: string]: unknown
}

export interface StaffAccountBlob {
  fullName?: string
  phone?: string
  defaultDisplayName?: string
  bio?: string
  displayNamesByBusiness?: Record<string, string>
  pushPreferences?: Record<string, boolean>
  notificationsRead?: string[]
  confirmedTipIds?: string[]
  payoutMethods?: DomainEntity[]
  [key: string]: unknown
}

export interface FormErrors {
  [field: string]: string | undefined
}

export interface RegisterFormState {
  email?: string
  confirmEmail?: string
  password?: string
  confirmPassword?: string
  firstName?: string
  lastName?: string
  terms?: boolean
  [key: string]: unknown
}

export function isApiError(err: unknown): err is ApiError {
  return (
    typeof err === 'object' &&
    err !== null &&
    'errorCode' in err &&
    typeof (err as ApiError).errorCode === 'string'
  )
}

export interface EcosystemItem {
  id: string
  name: string
  url: string
  logoUrl?: string | null
  /** Whether this entry should show in the ecosystem dropdown list. */
  isEcosystem?: boolean
  /** API hint for "coming soon" display (UI may still derive from url/name). */
  isComingSoon?: boolean
}

export interface EcosystemSignInResult {
  redirectUrl: string | null
}

export type BannerTarget = 'Redirect' | 'OpenNewTab' | 'Open New Tab' | string

export interface BannerTranslation {
  languageCode: string
  webUrl?: string | null
  mobileUrl?: string | null
  tabletUrl?: string | null
}

export interface Banner {
  id: string
  title: string
  webActionUrl?: string | null
  androidActionUrl?: string | null
  iosActionUrl?: string | null
  target: BannerTarget
  ordering: number
  status: string
  translations: BannerTranslation[]
}

export interface HomePageBannerSlide {
  id: string
  image: string
  alt: string
  link: string
  target: '_blank' | '_self'
}

/** US-55 — Payout ledger item (merchant + staff list). */
export interface PayoutRecord {
  id: string
  payoutCode: string
  /** Present on staff payout lists — identifies the business that issued the payout. */
  businessId?: string
  businessName?: string
  businessLogoUrl?: string | null
  staffProfileId: string
  staffDisplayName: string
  staffCode: string
  staffPhotoUrl: string | null
  amount: number
  payoutMethodType: string
  payoutMethodTypeName?: string | null
  payoutTypes: number
  periodStart: string
  periodEnd: string
  evidenceCount: number
  evidenceUrls: string[]
  notes: string | null
  status: number
  staffConfirmedAt: string | null
  createdAt: string
  lastModified: string | null
  /** Present on payout detail — snapshot of staff wallet at payout time. */
  staffPaymentAccountInfo?: string | null
  /** Income/Payout Categories (issue #584) — Staff-assigned category, null/absent = Uncategorized. */
  categoryId?: string | null
  categoryName?: string | null
}

/** GET /api/v1/staff/payouts/{id} — full detail for staff viewer. */
export interface StaffPayoutDetailRecord {
  id: string
  payoutCode: string
  createdAt: string
  businessId: string
  businessName: string
  businessLogoUrl: string | null
  payoutMethodType: string
  payoutMethodTypeName?: string | null
  staffPaymentAccountInfo: string | null
  amount: number
  payoutTypes: number
  periodStart: string
  periodEnd: string
  notes: string | null
  evidenceUrls: string[]
  status: number
  staffConfirmedAt: string | null
  /** Income/Payout Categories (issue #584) — Staff-assigned category, null/absent = Uncategorized. */
  categoryId?: string | null
  categoryName?: string | null
}

/**
 * Income/Payout Categories (issue #584) — a Merchant's or Staff's self-defined label
 * ("Rent", "Salary", ...) attached to a money transaction. `categoryId: null` on a
 * transaction/stat row means "Uncategorized" — a virtual value, never a real row here.
 */
export interface TransactionCategory {
  id: string
  name: string
  displayOrder: number
}

export interface IncomeByCategoryStat {
  categoryId: string | null
  categoryName: string
  amount: number
  transactionCount: number
}

/** GET .../transaction-categories/stats — verified against IncomeByCategoryStatsDto (backend). */
export interface IncomeByCategoryStats {
  items: IncomeByCategoryStat[]
  totalAmount: number
}

/** GET /api/v1/merchant/payouts/staff/{staffProfileId}/debt */
export interface StaffDebtRecord {
  staffProfileId: string
  staffDisplayName: string
  staffCode: string
  staffPhotoUrl: string | null
  balance: number
  lastUpdatedAt: string | null
}

export interface PayoutsListPage {
  items: PayoutRecord[]
  pageNumber: number
  pageSize: number
  totalPages: number
  totalCount: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

export interface PayoutMethodBreakdownStat {
  method: string
  amount: number
  count: number
}

/** GET /api/v1/merchant/payouts/stats */
export interface MerchantPayoutStats {
  totalPaidAllTime: number
  totalPaidThisMonth: number
  totalPendingAmount: number
  totalPendingCount: number
  totalUnpaidDebt: number
  staffWithDebt: number
  cancelledThisMonth: number
  methodBreakdown: PayoutMethodBreakdownStat[]
}

/** GET /api/v1/staff/payouts/stats */
export interface StaffPayoutStats {
  totalReceivedAllTime: number
  totalReceivedThisMonth: number
  totalPendingAmount: number
  totalPendingCount: number
  currentDebtBalance: number
}

export interface UnpaidTipDebtRecord {
  payoutDebtId: string
  staffProfileId: string
  staffDisplayName: string
  staffCode: string
  staffPhotoUrl: string | null
  balance: number
  lastUpdatedAt: string
}

export interface UnpaidTipDebtsPage {
  items: UnpaidTipDebtRecord[]
  totalCount: number
}

export interface StaffUnpaidDebtRecord {
  payoutDebtId: string
  businessId: string
  businessName: string
  balance: number
  lastUpdatedAt: string
}

export interface StaffUnpaidDebtsPage {
  items: StaffUnpaidDebtRecord[]
  totalCount: number
}

export interface PayoutDebtHistoryRecord {
  id: string
  amount: number
  transactionType: number
  referenceId: string
  description: string | null
  createdAt: string
}

export interface PayoutDebtHistoryPage {
  items: PayoutDebtHistoryRecord[]
  totalCount: number
}

export interface MerchantPayoutStaffStatRecord {
  staffProfileId: string
  staffDisplayName: string
  staffCode: string
  staffPhotoUrl: string | null
  totalPaid: number
  totalPending: number
  currentDebt: number
  payoutCount: number
}

export interface MerchantPayoutStatsByStaffPage {
  items: MerchantPayoutStaffStatRecord[]
  totalCount: number
}

export function getApiErrorCode(err: unknown, fallback = 'HTTP_ERROR'): string {
  return isApiError(err) ? err.errorCode : fallback
}

export function asRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>
  }
  return {}
}

/* ── POS receipt printing (US-047) ────────────────────────────────────────────────────────────
 *
 * A receipt is rendered twice — as JSX for the on-screen preview, and as a standalone HTML
 * document for the Star PassPRNT companion app. Two independent renderers of the same receipt
 * drift, and the failure mode is silent: the preview looks right while the paper is missing a
 * line. So both consume one already-resolved document.
 *
 * "Resolved" is the point: every string here is translated and formatted, every amount is a plain
 * number. Nothing downstream needs `t`, a locale, or the order query — which is also what lets a
 * document be persisted with a print job and replayed for copy 2 after a full app remount.
 *
 * These live in domain types rather than beside the builder because the print-job repository
 * stores one, and a repository importing from `components/` would invert the data boundary.
 */

export interface PosReceiptRow {
  id: string
  /** `group` is a technician (or Products) heading; `addOn` renders indented under its line. */
  kind: 'group' | 'line' | 'addOn'
  label: string
  /** Absent on group headings. */
  amount?: number
  /** Pre-formatted badge, e.g. "-20%" — already localized. */
  discountLabel?: string
}

export interface PosReceiptTotalRow {
  id: string
  label: string
  amount: number
  /** Render as a deduction, e.g. "-$5.00". */
  negative?: boolean
  /** The Total line. */
  emphasis?: boolean
}

/** Static receipt copy, resolved once so the pure builders stay free of `t`. */
export interface PosReceiptLabels {
  ticket: string
  customer: string
  phone: string
  paidWith: string
  thankYou: string
  noLines: string
}

export interface PosTechnicianReportPrint {
  name: string
  heading: string
  period: string
  columns: [string, string, string]
  emptyLabel: string
  entries: Array<{
    id: string
    label: string
    amount: string
    tips: string
    time?: string
    services?: string[]
    discount?: { label: string; value: string }
  }>
  totals: Array<{ label: string; value: string; isDeduction?: boolean }>
}

export interface PosReceiptDocument {
  technicianReport?: PosTechnicianReportPrint
  /** Separate technician tickets, retained for browser printing and PassPRNT retries. */
  pages?: PosReceiptDocument[]
  footerNotes?: { heading: string; lines: string[] }
  /** Bumped when the persisted shape changes; a stored job of another version is discarded. */
  version: 1
  orderNumber: string
  customerName: string
  customerPhone: string
  completedAtLabel: string
  businessName: string
  businessAddress: string
  businessPhone: string
  rows: PosReceiptRow[]
  totals: PosReceiptTotalRow[]
  /** Empty until the order is paid. */
  paidWithLabel: string
  isPaid: boolean
  labels: PosReceiptLabels
}

/**
 * Where to send the operator after PassPRNT hands control back. Printing leaves the web app
 * entirely, so the return leg re-enters through a fresh page load and has to rebuild the screen
 * the operator left.
 */
export type PosPrintRestoreState =
  | {
      surface: 'frontDesk'
      tab: string
      /** Absent when the print did not come from an open order — a re-print from the completed
       *  list, whose detail modal is local state with no URL representation to restore. */
      orderId?: string
      mode?: 'edit' | 'checkout' | 'success'
      receiptMode?: string
      /** Unsaved Edit Ticket note, retained across the external print app round trip. */
      ticketNote?: string
    }
  | { surface: 'printerSetup' }
