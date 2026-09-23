import type { ApiError } from './api'
import type { LooseObject } from './domain'
import type { PosCheckInLayout } from '../constants/posCheckInLayout'
import type { PosOrderStatus } from '../constants/posOrderStatus'
import type { PosCheckoutPaymentMethodType } from '../constants/posCheckoutPaymentMethod'
import type { PosPrintTransportType } from '../constants/posPrinter'
import type {
  MerchantSetup,
  NotificationRecord,
  PaginatedResponse,
  PaymentMethodDto,
  PosPrintRestoreState,
  PosReceiptDocument,
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
export type { PosCheckInLayout } from '../constants/posCheckInLayout'
export type { PosCheckoutPaymentMethodType } from '../constants/posCheckoutPaymentMethod'

// --- API raw DTOs (Swagger-aligned, optional fields) ---

export interface BusinessApiDto {
  id?: string
  businessId?: string
  name?: string
  slug?: string
  businessSlug?: string
  businessType?: string
  address?: string
  city?: string
  state?: string
  zipCode?: string
  country?: string
  phone?: string
  website?: string
  timeZone?: string | null
  logoUrl?: string | null
  bookingNotificationPhone?: string
  salesTaxRatePercent?: number
  googleReviewUrl?: string
  yelpUrl?: string
  facebookUrl?: string
  instagramUrl?: string
  feedbackEmail?: string
  isPublic?: boolean
  onboardingStep?: number
  createdAt?: string | null
}

// POS Owner Setup — Business Hours (US-014)
export interface PosBusinessOperatingHourApiDto {
  dayOfWeek: string
  isOpen: boolean
  openTime?: string | null
  closeTime?: string | null
}

// POS Owner Setup — Roles & Permissions (US-015)
export interface PosPermissionApiDto {
  id: string
  key: string
  displayName: string
  description?: string | null
  isOwnerOnly: boolean
  isGranted: boolean
}

export interface PosPermissionAreaGroupApiDto {
  area: string
  permissions: PosPermissionApiDto[]
}

export interface PosRoleApiDto {
  id: string
  name: string
  isSystemDefault: boolean
  isOwnerRole: boolean
  permissionAreas: PosPermissionAreaGroupApiDto[]
}

// Shared catalog (Category/Service consolidation, 2026-08-01) — same table backs both POS
// Settings and Booking Hub Settings now; scoped by BusinessId, not TenantId.
export interface PosCategoryApiDto {
  id: string
  name: string
  description?: string | null
  displayOrder: number
}

/** Income/Payout Categories (issue #584) — GET/POST/PUT .../transaction-categories. */
export interface TransactionCategoryApiDto {
  id: string
  name: string
  displayOrder: number
}

export interface IncomeByCategoryStatApiDto {
  categoryId?: string | null
  categoryName?: string
  amount?: number
  transactionCount?: number
}

/** GET .../transaction-categories/stats */
export interface IncomeByCategoryStatsApiDto {
  items?: IncomeByCategoryStatApiDto[]
  totalAmount?: number
}

// POS Owner Setup — Services (US-017); shape now shared with Booking Hub's catalog.
export type PosServiceStatus = 'Active' | 'Inactive'

export interface PosServiceApiDto {
  id: string
  name: string
  price: number
  supplyFee: number
  durationMinutes: number
  description?: string | null
  icon?: string | null
  photoUrl?: string | null
  status: PosServiceStatus
  displayOrder: number
  categoryIds: string[]
  tags: string[]
  isRequiredApproval?: boolean
}

export interface PosTagApiDto {
  id: string
  name: string
}

// POS Owner Setup — Products (US-018)
export interface PosProductApiDto {
  id: string
  name: string
  price: number
  description?: string | null
  photoUrl?: string | null
  status: PosServiceStatus
  displayOrder: number
  categoryIds: string[]
  tags: string[]
}

// POS Owner Setup — Staff Weekly Schedule (US-09/US-021)
// Verified against live response (2026-07-16): despite System.DayOfWeek being a numeric
// enum, the API's global JsonStringEnumConverter serializes it as "Sunday".."Saturday" —
// same string form Business Hours (US-02) already uses, not the 0-6 originally assumed
// during backend research.
export interface StaffWeeklyScheduleDayApiDto {
  dayOfWeek: string // "Sunday".."Saturday"
  isDayOff: boolean
  startTime?: string | null
  endTime?: string | null
}

// POS Owner Setup — Staff Profile (US-019)
export interface PosStaffProfileApiDto {
  businessStaffLinkId: string
  staffProfileId: string
  displayName: string
  photoUrl?: string | null
  // null => local staff (no Nexora account) — TaxIQ data is structurally not applicable,
  // distinct from taxYearAvailable=false (has an account, TaxIQ just isn't set up yet).
  staffUserId?: string | null
  ssn?: string | null
  ein?: string | null
  taxYearAvailable: boolean
  contractType?: string | null
  posRoleId?: string | null
  posRoleName?: string | null
  // POS Staff Level (optional, business-defined lookup) — see PosStaffLevelApiDto.
  staffLevelId?: string | null
  staffLevelName?: string | null
  payStructureType: string
  commissionPercent?: number | null
  weeklySalaryAmount?: number | null
  agreedAmount?: number | null
  tipsEnabled: boolean
  // Active/Off/Locked — whether the staff member is currently on shift at all. Separate
  // from Turn Board's currentStatus (Empty/InService), which is about being busy with a
  // customer right now, not whether they're on shift.
  status: string
  // Count of PosOrderItems completed today for this staff member — computed inline server-side.
  turnsToday: number
  /** Today's turns weighted by what each service was worth — same figure the Turn Board shows. */
  weightedTurnsToday?: number
  /** The service dollars behind those turns. */
  serviceTotalToday?: number
}

// POS Staff Level — business-scoped lookup list (Basic/Advanced/Senior by default), optionally
// assigned to a PosStaffProfile. Managed in Salon Settings, modeled after PosRoleApiDto.
export interface PosStaffLevelApiDto {
  id: string
  name: string
  displayOrder: number
}

// POS Merchant Ops — Front Desk access self-check (US-12)
export interface PosAccessApiDto {
  canManageOperations?: boolean
  // Gated on its own `view_pos_report` permission, not on the Operations area — the report exposes
  // every technician's earnings, so operating the front desk does not imply reading it.
  canViewReport?: boolean
  // Reassigning the technician on a completed ticket moves earnings between two people, so it has
  // its own `reassign_completed_order_staff` permission rather than riding on Operations.
  canReassignCompletedOrderStaff?: boolean
}

// POS Merchant Ops — Check-in & Waitlist (US-12, refactored to Order in US-026)
/**
 * Service progress of one ticket, so a board does not have to be opened to read it.
 * Counts parent service lines only — an add-on has no lifecycle of its own.
 */
export interface PosServiceLineRollupApiDto {
  serviceLineCount: number
  completedServiceLineCount: number
  pendingAcceptanceCount: number
  /** Technicians who have not yet accepted their line on this ticket. */
  pendingAcceptanceTechnicianNames: string[]
}

export interface PosWaitlistOrderApiDto {
  id: string
  orderNumber: string
  customerName: string
  checkedInAt: string
  waitMinutes: number
  serviceNames: string[]
  serviceLines: PosServiceLineRollupApiDto
}

// US-17 — Order Workspace (Create mode) sends the whole draft (service + product lines,
// technician + note already chosen) in one call rather than posServiceIds only.
export interface CheckInOrderItemPayload {
  itemType: 'Service' | 'Product'
  // posServiceId or posProductId, depending on itemType.
  id: string
  quantity?: number
  // Service items only. Omitted means "Next Available" (skill-filtered auto-pick).
  posStaffProfileId?: string
  // Service items only.
  note?: string
}

// One line of the front desk's Assign Services confirmation. `posStaffProfileId` omitted is
// "First available" — the line goes back to the floor.
export interface SaveOrderServiceLineAssignmentPayload {
  serviceLineId: string
  posStaffProfileId?: string
  note?: string
}

export interface CheckInOrderPayload {
  customerName: string
  customerEmail?: string
  // Required as of the POS iPad redesign (Ticket 2) — backend now rejects a missing
  // phone (POS_ORDER_CUSTOMER_PHONE_REQUIRED). Enables the customer-lookup suggestion
  // below plus SMS Ticket QR/receipt later.
  customerPhone: string
  items: CheckInOrderItemPayload[]
}

// Check-in "returning customer" suggestion (Ticket 2) — most recent order for this phone
// at this business, regardless of status. `posServiceId`/`posStaffProfileId` let the FE
// re-add these exact lines to the new draft in one tap ("Use last visit"), but only if
// they still exist in the current catalog/staff roster — the FE is responsible for that
// check, this DTO doesn't guarantee it.
export interface CustomerLookupServiceLineApiDto {
  posServiceId: string
  serviceName: string
  posStaffProfileId?: string | null
  technicianName?: string | null
}

export interface CustomerLookupResultApiDto {
  customerName: string
  lastCheckedInAt: string
  serviceLines: CustomerLookupServiceLineApiDto[]
}

// POS Merchant Ops — Order List tab (US-17) — Waiting + InService combined.
export interface OrderListItemApiDto {
  id: string
  orderNumber: string
  customerName: string
  customerPhone?: string | null
  /** Dial code with a leading "+" when the backend resolved the number. */
  customerPhoneCountryCode?: string | null
  /** Full E.164 number when the backend resolved the number. */
  customerPhoneE164?: string | null
  status: string
  checkedInAt: string
  elapsedMinutes: number
  serviceNames: string[]
  technicianNames: string[]
  // Self check-in leaves these for the front desk to resolve: a customer who picked "First
  // Available" has no technician on the line, and one who skipped the menu has no service line at
  // all. Both are legitimate orders, and both need a person to finish them. Computed server-side
  // over every order, not just kiosk ones — a line the front desk itself cleared needs the same
  // flag.
  hasUnassignedService: boolean
  hasNoServiceLine: boolean
  serviceLines: PosServiceLineRollupApiDto
  /**
   * True when this guest has never completed a visit at this business.
   * The current open ticket does not count — that is their first visit in progress.
   */
  isNewCustomer: boolean
}

// POS Merchant Ops — Completed Orders panel (US-17 follow-up), paginated + filterable.
export interface CompletedOrderListItemApiDto {
  id: string
  orderNumber: string
  customerName: string
  /** National number only, digits without the country code. */
  customerPhone?: string | null
  /** Dial code with a leading "+" (e.g. "+1"). Null when the backend could not resolve the number. */
  customerPhoneCountryCode?: string | null
  /** Full E.164 number. Null when the backend could not resolve the number. */
  customerPhoneE164?: string | null
  completedAt?: string | null
  serviceNames: string[]
  technicianNames: string[]
  total: number
  /** The order-level discount frozen at checkout. Whatever part of it the technicians carried is
   *  inside staffDiscountTotal, not here. */
  orderDiscountAmount?: number
  appliedPromotionName?: string | null
  paymentMethodType?: string | null
  /** The methods a split payment was taken through, in the order the cashier entered them. Empty on
   *  a single-method payment; amounts are in the detail view, not the row. */
  paymentMethodTypes: string[]
}

export interface CompletedOrdersListQuery {
  pageNumber?: number
  pageSize?: number
  dateFrom?: string
  dateTo?: string
  customerName?: string
  customerPhone?: string
}

// Staff Work Orders (technician read-only view) — GET /api/v1/staff/pos/work-orders
export interface StaffWorkOrderListItemApiDto {
  id?: string
  orderNumber?: string
  customerName?: string
  status?: string
  /** Caller-local progress — see PosOrderStatus. Falls back to `status` when absent. */
  myStatus?: string
  checkedInAt?: string
  scheduledAt?: string | null
  serviceNames?: string[]
  technicianNames?: string[]
  stationNumber?: number | null
  beeper?: string | null
}

export interface StaffWorkOrderItemApiDto {
  id?: string
  /** Null on a custom (off-menu) line. */
  posServiceId?: string | null
  serviceName?: string
  unitPrice?: number
  lineTotal?: number
  durationMinutes?: number
  isAddOn?: boolean
  note?: string | null
  technicianName?: string | null
  posStaffProfileId?: string | null
  /** See PosOrderItemStatus — drives the Accept/Decline/Start/Complete buttons. */
  lineStatus?: string | null
  isRequiredApproval?: boolean
  isMine?: boolean
  acceptedAt?: string | null
  startedAt?: string | null
  completedAt?: string | null
}

export interface StaffWorkOrderDetailApiDto {
  id?: string
  businessId?: string
  orderNumber?: string
  customerName?: string
  status?: string
  /** Caller-local progress — see PosOrderStatus. Falls back to `status` when absent. */
  myStatus?: string
  checkedInAt?: string
  scheduledAt?: string | null
  stationNumber?: number | null
  beeper?: string | null
  customerNotes?: string | null
  completionNote?: string | null
  serviceTotal?: number
  canStartService?: boolean
  canCompleteService?: boolean
  items?: StaffWorkOrderItemApiDto[]
}

export interface StaffBookingCalendarItemApiDto {
  id?: string
  orderNumber?: string
  customerName?: string
  status?: string
  /** See PosOrderItemStatus — the caller's own lines, least advanced one. */
  myLineStatus?: string | null
  /** ISO with the salon's own offset — render the offset, never convert to browser local. */
  scheduledAt?: string
  myServiceNames?: string[]
  myDurationMinutes?: number
}

export interface StaffBookingCalendarApiDto {
  date?: string
  appointmentCount?: number
  totalDurationMinutes?: number
  items?: StaffBookingCalendarItemApiDto[]
}

export interface StaffBookingCalendarQuery {
  businessId: string
  date: string
}

export interface StaffWorkOrdersListQuery {
  businessId: string
  date: string
  status?: PosOrderStatus[]
}

export interface CompleteStaffWorkOrderServicePayload {
  note?: string | null
}

/** One line as the technician's screen has it after editing. No id means a new line. */
export interface SaveStaffWorkOrderServiceLinePayload {
  id?: string | null
  posServiceId?: string | null
  customServiceName?: string | null
  price?: number | null
  durationMinutes?: number | null
  note?: string | null
}

export interface SaveStaffWorkOrderServiceLinesPayload {
  customerPhoneLast4: string | null
  lines: SaveStaffWorkOrderServiceLinePayload[]
}

export interface StaffWorkOrderCatalogItemApiDto {
  id?: string
  name?: string
  price?: number
  durationMinutes?: number
  description?: string | null
  photoUrl?: string | null
  isRequiredApproval?: boolean
  categories?: { id?: string; name?: string }[]
}

export interface StaffWorkOrderCatalogCategoryApiDto {
  id?: string
  name?: string
  description?: string | null
  displayOrder?: number
}

export interface StaffWorkOrderServiceCatalogApiDto {
  categories?: StaffWorkOrderCatalogCategoryApiDto[]
  services?: StaffWorkOrderCatalogItemApiDto[]
}

export interface CompletedOrdersPage {
  items: CompletedOrderListItemApiDto[]
  pageNumber: number
  totalPages: number
  totalCount: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

// POS Front Desk — Customer tab (US-043). Read-only: list, detail, order/booking history.
export interface PosCustomerListItemApiDto {
  id: string
  name?: string | null
  /** National number only, digits without the country code. */
  phone: string
  /** Dial code with a leading "+" (e.g. "+1"). Null when the backend could not resolve the number. */
  phoneCountryCode?: string | null
  /** Full E.164 number. Null when the backend could not resolve the number. */
  phoneE164?: string | null
  status: string
  totalVisit: number
  lastVisit?: string | null
  createdAt: string
  /** True when this customer has never completed a POS visit. Bookings alone do not count. */
  isNewCustomer: boolean
}

export interface PosCustomerListQuery {
  pageNumber?: number
  pageSize?: number
  searchTerm?: string
  sortDescending?: boolean
}

export interface PosCustomerListPage {
  items: PosCustomerListItemApiDto[]
  pageNumber: number
  totalPages: number
  totalCount: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

export interface PosCustomerDetailApiDto {
  id: string
  name?: string | null
  /** National number only, digits without the country code. */
  phone: string
  /** Dial code with a leading "+" (e.g. "+1"). Null when the backend could not resolve the number. */
  phoneCountryCode?: string | null
  /** Full E.164 number. Null when the backend could not resolve the number. */
  phoneE164?: string | null
  email?: string | null
  address?: string | null
  dateOfBirth?: string | null
  type: string
  status: string
  source: string
  totalVisit: number
  lastVisit?: string | null
  createdAt: string
  /** True when this customer has never completed a POS visit. Bookings alone do not count. */
  isNewCustomer: boolean
}

// A history row can be a completed/waiting/in-service order OR a not-yet-checked-in booking
// (PosBooking is a TPT subtype of PosOrder on the backend) — isBooking + status distinguish them.
export interface PosCustomerOrderHistoryItemApiDto {
  id: string
  orderNumber: string
  isBooking: boolean
  status: string
  occurredAt: string
  serviceNames: string[]
  technicianNames: string[]
  total: number
  note?: string | null
}

export interface PosCustomerOrderHistoryQuery {
  pageNumber?: number
  pageSize?: number
}

export interface PosCustomerOrderHistoryPage {
  items: PosCustomerOrderHistoryItemApiDto[]
  pageNumber: number
  totalPages: number
  totalCount: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

/** US-112 — POS Customer Excel/CSV import. */
export type PosCustomerImportSkipCode =
  | 'ROW_PHONE_MISSING'
  | 'ROW_PHONE_INVALID'
  | 'ROW_DUPLICATE_IN_FILE'
  | 'ROW_DUPLICATE_IN_BUSINESS'
  | string

export interface PosCustomerImportColumnDto {
  index: number
  header: string
  sampleValues: string[]
}

export interface PosCustomerImportSuggestedMappingDto {
  customerNameColumnIndex?: number | null
  phoneNumberColumnIndex?: number | null
  emailColumnIndex?: number | null
  dateOfBirthColumnIndex?: number | null
  regisDateColumnIndex?: number | null
  lastVisitColumnIndex?: number | null
}

export interface PosCustomerImportPreviewDto {
  sheetNames: string[]
  selectedSheetName: string
  headerRow: number
  columns: PosCustomerImportColumnDto[]
  suggestedMapping: PosCustomerImportSuggestedMappingDto
}

export interface PosCustomerImportSkippedRowDto {
  rowNumber: number
  phone?: string | null
  code: PosCustomerImportSkipCode
  message: string
}

export interface PosCustomerImportResultDto {
  totalRows: number
  importedCount: number
  skippedDuplicateCount: number
  skippedInvalidCount: number
  skippedRows: PosCustomerImportSkippedRowDto[]
}

export interface PosCustomerImportPreviewRequest {
  file: File
  sheetName?: string
  headerRow?: number
}

export interface PosCustomerImportRequest {
  file: File
  sheetName: string
  headerRow: number
  phoneNumberColumnIndex: number
  customerNameColumnIndex?: number | null
  emailColumnIndex?: number | null
  dateOfBirthColumnIndex?: number | null
  regisDateColumnIndex?: number | null
  lastVisitColumnIndex?: number | null
}

export interface CheckInOverviewSummaryApiDto {
  totalCheckIns: number
  newGuests: number
  returningGuests: number
  averageWaitMinutes: number
}

export interface GuestSourceCountApiDto {
  source: string
  count: number
}

export interface CheckInOverviewItemApiDto {
  id: string
  orderNumber: string
  checkedInAt: string
  customerName: string
  customerPhone?: string | null
  isNewGuest: boolean
  source?: string | null
  serviceNames: string[]
  technicianNames: string[]
  status: string
}

// Separate endpoint from the list above (GET .../checkin-overview/{orderId}) — same shape today,
// kept as its own type since the two APIs are independent and may diverge later.
export type CheckInOverviewDetailApiDto = CheckInOverviewItemApiDto

export interface CheckInOverviewQuery {
  pageNumber?: number
  pageSize?: number
  status?: string
  searchTerm?: string
}

export interface CheckInOverviewItemsPage {
  items: CheckInOverviewItemApiDto[]
  pageNumber: number
  totalPages: number
  totalCount: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

export interface CheckInOverviewApiDto {
  summary: CheckInOverviewSummaryApiDto
  guestSources: GuestSourceCountApiDto[]
  items: CheckInOverviewItemsPage
}

// POS Merchant Ops — Turn Board Assign & Break (US-13, refactored in US-026)
export interface TurnBoardStationApiDto {
  posStaffProfileId: string
  displayName: string
  photoUrl?: string | null
  currentStatus: string
  currentOrderId?: string | null
  currentOrderNumber?: string | null
  currentCustomerName?: string | null
  currentCustomerPhone?: string | null
  currentServiceNames: string[]
  currentAddOnCount?: number
  assignedAt?: string | null
  /** See PosOrderItemStatus — the lifecycle of this technician's own line on the ticket above. */
  currentLineStatus?: string | null
  /** Lines across the whole salon still waiting for THIS technician to accept. */
  pendingAcceptanceCount?: number
  // Not in the live contract yet (BE is adding it) — optional so today's response (neither field
  // present) reads as "not local staff", not as a false positive block on every station's Beep.
  isLocalStaff?: boolean
  email?: string | null
  /** Whether this technician is on shift right now — the board also lists ones who have not clocked in. */
  isClockedIn?: boolean
  /** Services this technician is assigned to perform — the board's search matches these too. */
  serviceSkillNames?: string[]
  /** Today's turns weighted by what each service was worth. */
  weightedTurnsToday?: number
  /** The service dollars behind those turns. */
  serviceTotalToday?: number
  /** Today's turns one by one, oldest first — one Turn Grid cell per entry. */
  turnEntries?: TurnBoardEntryApiDto[]
}

export interface TurnBoardEntryApiDto {
  posOrderItemId: string
  posOrderId: string
  orderNumber: string
  serviceName: string
  turnCreditAmount: number
  turnCredit: number
  /** False while the visit is open: the credit is provisional and can still change. */
  isRecorded: boolean
  assignedAt?: string | null
  completedAt?: string | null
}

// POS Front Desk — Time Clock tab
export interface PosDevicePairingQrApiDto {
  businessId: string
  token: string
  rotationNumber: number
  issuedAt: string
  expiresAt: string
  // Full URL the tablet's camera opens. Carries the operator who generated it.
  pairingUrl: string
  // PNG data URI rendered server-side — the dashboard has no QR-drawing library.
  qrImageDataUri: string
}

export interface PosDevicePairingQrStatusApiDto {
  // Flips once a tablet pairs with this exact token, and never flips back — the dashboard stops
  // polling and asks for a fresh code the moment it does.
  used: boolean
}

export type PosDeviceStatusApi = 'Active' | 'Revoked' | 'Expired'

export interface PosDeviceListItemApiDto {
  id: string
  name: string
  // Sent computed by the server. Never re-derive "expired" from lastSeenAt on the client — the
  // nightly sweep owns that transition and the two would disagree for up to a day.
  status: PosDeviceStatusApi
  deviceType: string
  pairedAt: string
  pairedByName: string | null
  lastSeenAt: string
  userAgent: string | null
  revokedAt: string | null
  revokedByName: string | null
  expiredAt: string | null
  // True when the tablet signed itself out rather than an operator revoking it.
  signedOutOnDevice: boolean
}

// Self Check-In kiosk — everything below is served under the device token, never a user session.
export interface SelfCheckInContextApiDto {
  businessName: string
  logoUrl: string | null
  deviceName: string
  // The tablet has no merchant session, so the layout it should render rides along with the
  // branding it already fetches rather than coming from the settings endpoint.
  checkInLayout: PosCheckInLayout
}

export interface SelfCheckInServiceApiDto {
  id: string
  name: string
  price: number
  durationMinutes: number
  description: string | null
  photoUrl: string | null
  categories: { id: string; name: string }[]
}

export interface SelfCheckInTechnicianApiDto {
  posStaffProfileId: string
  displayName: string
  photoUrl: string | null
  // Services this technician is assigned to. Lets the kiosk decide on the spot whether the
  // technician the customer picked up front can actually do what they then chose — no round trip
  // per service, and the same data drives the per-service dropdown on the overview.
  serviceIds: string[]
  // Informational, never a block — a busy technician can still be asked for. Shown on both
  // surfaces since the one-page check-in renders the identical grid.
  isBusy: boolean
}

export interface SelfCheckInOrderResultApiDto {
  orderId: string
  orderNumber: string
}

// Front desk twin of SelfCheckInTechnicianApiDto — same rules, merchant session instead of a
// device token.
export interface CheckInTechnicianApiDto {
  posStaffProfileId: string
  displayName: string
  photoUrl: string | null
  serviceIds: string[]
  isBusy: boolean
  // Not in the live contract yet (BE is adding it) — optional so today's response (neither field
  // present) reads as "not local staff", not as a false positive block on every technician's Beep.
  isLocalStaff?: boolean
  email?: string | null
  // Not in the live contract yet either (CheckInTechnicianDto has no staffLevelName as of
  // 2026-09-09) — optional so the technician picker's Level badge starts working the moment
  // BE adds it, no FE change needed.
  staffLevelName?: string | null
  queueCount?: number
}

export interface CheckInActiveVisitApiDto {
  orderNumber: string
}

export interface PosCheckInSettingsApiDto {
  kioskCheckInLayout: PosCheckInLayout
  frontDeskCheckInLayout: PosCheckInLayout
  publicCheckInEnabled?: boolean
  publicCheckInLayout?: PosCheckInLayout
}

// Both front-desk check-in paths answer with this: a walk-in opening a new order and a booked
// guest converting their appointment.
export interface PosCheckInResultApiDto {
  orderId: string
  orderNumber: string
}

export interface SelfCheckInBookingItemApiDto {
  posServiceId: string
  posStaffProfileId: string | null
}

export interface SelfCheckInBookingApiDto {
  bookingId: string
  // Wall clock at the salon, already resolved server-side — the raw stored value means different
  // things depending on which flow created the booking.
  scheduledAt: string
  customerName: string
  items: SelfCheckInBookingItemApiDto[]
}

export interface ClockQrTokenApiDto {
  businessId: string
  token: string
  rotationNumber: number
  issuedAt: string
  expiresAt: string
  scanUrl: string
  // PNG data URI rendered server-side — the dashboard has no QR-drawing library.
  qrImageDataUri: string
}

export interface TimeClockRosterRowApiDto {
  posStaffProfileId: string
  businessStaffLinkId: string
  displayName: string
  roleName: string
  photoUrl?: string | null
  isClockedIn: boolean
  clockInAt?: string | null
  hoursToday: number
  // Null for anyone who has not clocked in today; fixed for the rest of the day once set.
  turnRank?: number | null
  /** Customers served today. Kept next to the weighted figure — they answer different questions. */
  turnsToday: number
  /** Today's turns weighted by what each service was worth. */
  weightedTurnsToday?: number
  /** The service dollars behind those turns. */
  serviceTotalToday?: number
  currentOrderId?: string | null
  currentOrderNumber?: string | null
  currentCustomerName?: string | null
  lastBeepAt?: string | null
  // Open shift started before today — forgot to clock out, nightly job has not run yet.
  hasForgottenEntry: boolean
  forgottenEntryClockInAt?: string | null
  // Not in the live contract yet (BE is adding it) — optional so today's response (neither field
  // present) reads as "not local staff", not as a false positive block on every row's Beep.
  isLocalStaff?: boolean
  email?: string | null
}

export interface TimeClockRosterApiDto {
  onShiftCount: number
  rows: TimeClockRosterRowApiDto[]
}

export interface TimeClockLogEntryApiDto {
  id: string
  posStaffProfileId: string
  displayName: string
  clockInAt: string
  clockOutAt?: string | null
  isOpen: boolean
  hours: number
  clockInSource: string
  clockOutSource?: string | null
}

export interface BeepStaffResultApiDto {
  beepedAt: string
  // False when the tech has no account to notify — the front desk still needs to know.
  delivered: boolean
}

// Two-way beep. The salon-side feed (GET .../time-clock/beeps) is the single source of truth for
// beep state on the front desk: the roster is one row per staff member and cannot carry three
// calls to the same tech, each with its own reply.
export interface PosBeepApiDto {
  beepId: string
  posStaffProfileId: string
  staffDisplayName: string
  staffPhotoUrl?: string | null
  // False for a tech added for payout only — explains a beep that will never be answered.
  hasAppAccount: boolean
  message?: string | null
  beepedAt: string
  // PosStaffBeepStatus. Effective value: Expired is computed server-side, never stored.
  status: string
  respondedAt?: string | null
  delayMinutes?: number | null
  responseNote?: string | null
  resolvedAt?: string | null
  resolvedByDisplayName?: string | null
  nudgeCount: number
  lastNudgedAt?: string | null
  sentByDisplayName?: string | null
  expiresAt: string
  nextNudgeAllowedAt: string
  // Server-computed so the front desk never re-implements the rules.
  canNudge: boolean
  canResolve: boolean
}

// The tech's own view. Spans every salon they are linked to, so businessName says which front desk
// is calling.
export interface ActiveStaffBeepApiDto {
  beepId: string
  businessId: string
  businessName: string
  businessStaffLinkId: string
  posStaffProfileId: string
  message?: string | null
  beepedAt: string
  expiresAt: string
  status: string
  respondedAt?: string | null
  delayMinutes?: number | null
  responseNote?: string | null
  nudgeCount: number
  lastNudgedAt?: string | null
}

export interface ActiveStaffBeepsApiDto {
  // Owned by the server so the Busy chips cannot drift from the validator.
  allowedDelayMinutes: number[]
  beeps: ActiveStaffBeepApiDto[]
}

export interface RespondToBeepRequest {
  // PosStaffBeepResponse
  response: string
  // Required for Busy, must be omitted otherwise.
  delayMinutes?: number
  note?: string
}

export interface StaffBeepResponseResultApiDto {
  beepId: string
  status: string
  respondedAt?: string | null
  delayMinutes?: number | null
  responseNote?: string | null
}

export interface ClockScanPreviewApiDto {
  businessId: string
  businessName: string
  businessStaffLinkId: string
  displayName: string
  isClockedIn: boolean
  clockInAt?: string | null
  hoursSoFar: number
}

export interface ScanClockQrResultApiDto {
  action: string
  businessName: string
  occurredAt: string
  hours: number
}

// POS Merchant Ops — Checkout (US-14 / US-025, refactored to Order + multi-staff + products in US-026)
export interface InServiceOrderApiDto {
  id: string
  orderNumber: string
  customerName: string
  technicianNames: string[]
  serviceNames: string[]
  firstAssignedAt?: string | null
}

export interface OrderServiceLineApiDto {
  id: string
  /** Null on a custom (off-menu) line — nothing in the catalog to qualify a technician against. */
  posServiceId: string | null
  serviceName: string
  unitPrice: number
  quantity: number
  /** Original price of the line, before any discount. Commission and tip weight use this. */
  lineTotal: number
  /** 'Percent' | 'Amount' — see PosServiceDiscountType. Null when the line is not discounted. */
  discountType?: string | null
  discountValue?: number | null
  discountAmount: number
  /** 'Salon' | 'Staff' | 'Split' — see PosDiscountBearer. */
  discountBearer?: string | null
  /** The part of discountAmount deducted from the technician's pay. */
  staffDiscountShare: number
  discountNote?: string | null
  /** What the customer pays for this line. */
  lineTotalAfterDiscount: number
  /** False when the assigned technician is on hourly/fixed pay, or nobody is assigned yet. */
  canAssignDiscountToStaff: boolean
  assignedPosStaffProfileId?: string | null
  technicianName?: string | null
  /** When the line was rung up — the reading order inside one technician's block. */
  addedAt: string
  /** When the technician was put on this line. Null while nobody is assigned. Restamped when the
   *  technician changes on an open ticket, deliberately kept on a completed one (turn counting). */
  assignedAt?: string | null
  note?: string | null
  /** See PosOrderItemStatus — Unassigned/PendingAcceptance/Assigned/Started/Completed. */
  lineStatus: string
  acceptedAt?: string | null
  startedAt?: string | null
  completedAt?: string | null
  /** Extras sold against this service, in the order they were rung up. */
  addOns: OrderServiceAddOnLineApiDto[]
}

/**
 * An extra sold against a service line. It carries no technician of its own — the technician is
 * always the parent service's — and no quantity: two of the same add-on are two lines.
 */
export interface OrderServiceAddOnLineApiDto {
  id: string
  serviceAddOnId: string
  addOnName: string
  unitPrice: number
  lineTotal: number
  /** 'Percent' | 'Amount'. Null when the add-on is not discounted. */
  discountType?: string | null
  discountValue?: number | null
  discountAmount: number
  /** 'Salon' | 'Staff' | 'Split'. */
  discountBearer?: string | null
  staffDiscountShare: number
  discountNote?: string | null
  lineTotalAfterDiscount: number
  canAssignDiscountToStaff: boolean
}

export interface OrderProductLineApiDto {
  id: string
  productName: string
  unitPrice: number
  quantity: number
  lineTotal: number
}

/**
 * One order-level discount slot. A promotionId wins: the backend then reads type/value from the
 * promotion and ignores what is sent here. Both null clears the discount.
 */
export interface SetOrderDiscountPayload {
  promotionId?: string | null
  /** 'Percent' | 'Amount'. Null with no promotionId clears the order-level discount. */
  discountType: string | null
  discountValue: number | null
  /** 'Salon' | 'Staff' | 'Split' — see PosDiscountBearer. Null falls back to the salon. */
  discountBearer?: string | null
  discountNote?: string | null
}

/** An offer this visit qualifies for, judged on its check-in time in salon-local time. */
export interface EligiblePromotionApiDto {
  id: string
  name: string
  badgeLabel?: string | null
  /** 'Percent' | 'Amount'. */
  discountType: string
  discountValue: number
  /** Day names, e.g. ['Monday', 'Tuesday']. */
  daysOfWeek: string[]
  /** 'HH:mm:ss' in salon-local time. */
  startTime: string
  endTime: string
}

/** One banner slot on a promotion detail (studio cover + extras). */
export interface PosPromotionBannerApiDto {
  colorHex?: string | null
  imageUrl?: string | null
  sortOrder: number
}

/** Multipart banner entry on create/update — exactly one of colorHex / image (or imageUrl to re-fetch). */
export interface PosPromotionBannerPayload {
  colorHex?: string | null
  image?: File | null
  /** Existing remote image — repository re-fetches and re-uploads on full-replace update. */
  imageUrl?: string | null
}

/**
 * List row from GET /merchant/pos/{businessId}/promotions (PosPromotionDto).
 * `photoUrl` remains as a legacy mirror of the primary banner image when present.
 */
export interface PosPromotionApiDto extends EligiblePromotionApiDto {
  isActive: boolean
  /** OneQR hero placement — show this promotion’s banners on OneQR. */
  showOnOneQrHero?: boolean
  /** Search Deals listing request (review happens outside this API). */
  submitToSearchDeals?: boolean
  /** False once a visit has used the promotion — it can only be deactivated from then on. */
  canDelete: boolean
  description?: string | null
  /** Studio template id when the offer was started from a template. */
  templateCode?: string | null
  /** Cover banner solid/tint color (e.g. `#4648D8`). */
  primaryBannerColorHex?: string | null
  /** Cover banner image URL when the primary banner is an upload. */
  primaryBannerImageUrl?: string | null
  /** Legacy alias of the primary banner image — prefer `primaryBannerImageUrl`. */
  photoUrl?: string | null
}

/** GET /merchant/pos/{businessId}/promotions/{id} — includes the full banner list. */
export interface PosPromotionDetailApiDto extends Omit<
  PosPromotionApiDto,
  'primaryBannerColorHex' | 'primaryBannerImageUrl' | 'photoUrl'
> {
  banners: PosPromotionBannerApiDto[]
}

/** One starter from GET /merchant/pos/promotion-templates. */
export interface PosPromotionTemplateApiDto {
  code: string
  name: string
  badgeLabel: string
  description: string
  discountType: string
  discountValue: number
  daysOfWeek: string[]
  startTime: string
  endTime: string
}

export interface PosPromotionStudioMetadataApiDto {
  templates: PosPromotionTemplateApiDto[]
}

export interface PosPromotionPayload {
  name: string
  badgeLabel: string | null
  description?: string | null
  /** Optional studio template code (e.g. from promotion-templates). */
  templateCode?: string | null
  /** Legacy single photo field — still accepted by the API alongside banners. */
  photo?: File | null
  /** Banner slots; index 0 is the cover used for list primaryBanner*. */
  banners?: PosPromotionBannerPayload[]
  discountType: string
  discountValue: number
  daysOfWeek: string[]
  startTime: string
  endTime: string
  isActive: boolean
  showOnOneQrHero?: boolean
  submitToSearchDeals?: boolean
}

export interface AddOrderCustomServiceLinePayload {
  customServiceName: string
  price: number
  note: string | null
  /** Null is "First available" — the line is left for someone on the floor to take. */
  posStaffProfileId: string | null
}

/** Exactly one target: a catalog service, or a custom name + price. */
export type UpdateOrderServiceLineTarget =
  | { posServiceId: string }
  | { customServiceName: string; price: number }

export interface SetOrderServiceLineDiscountPayload {
  /** 'Percent' | 'Amount'. Null clears the discount on the line. */
  discountType: string | null
  discountValue: number | null
  /** 'Salon' | 'Staff' | 'Split'. Required whenever discountType is set. */
  discountBearer: string | null
  discountNote: string | null
}

export interface OrderStaffTipShareApiDto {
  posStaffProfileId: string
  technicianName: string
  tipAmount: number
}

export interface OrderDetailApiDto {
  id: string
  orderNumber: string
  customerName: string
  customerEmail?: string | null
  /** National number only, digits without the country code. */
  customerPhone?: string | null
  /** Dial code with a leading "+" (e.g. "+1"). Null when the backend could not resolve the number. */
  customerPhoneCountryCode?: string | null
  /** Full E.164 number. Null when the backend could not resolve the number. */
  customerPhoneE164?: string | null
  status: string
  serviceLines: OrderServiceLineApiDto[]
  productLines: OrderProductLineApiDto[]
  servicesSubtotal: number
  productsSubtotal: number
  tipAmount: number
  /** Sum of every service-line discount on this order. */
  discountAmount: number
  /** 'Percent' | 'Amount'. Null when no order-level discount is applied. */
  orderDiscountType?: string | null
  orderDiscountValue?: number | null
  /** Resolved live while the order is open; the frozen snapshot once Completed. */
  orderDiscountAmount: number
  /** The most an order-level discount can still take off: servicesSubtotal less discountAmount. */
  orderDiscountCap: number
  orderDiscountNote?: string | null
  /** 'Salon' | 'Staff' | 'Split' — see PosDiscountBearer. Null when no discount is applied. */
  orderDiscountBearer?: string | null
  /** What the technicians on this ticket absorb of it in total, spread pro-rata across the
   *  services they performed. Live while the order is open, frozen once Completed. */
  orderDiscountStaffShare: number
  /** False when no technician on the ticket is on commission-style pay, so the salon is the only
   *  bearer the order-level discount can have. */
  canAssignOrderDiscountToStaff: boolean
  /** Null when the cashier typed the discount instead of picking a promotion. */
  appliedPromotionId?: string | null
  appliedPromotionName?: string | null
  /** servicesSubtotal less both discounts — the figure sales tax is charged on. */
  servicesNet: number
  salesTaxAmount: number
  total: number
  staffTipShares: OrderStaffTipShareApiDto[]
  paymentMethodType?: string | null
  /** The Split Pay portions. While the order is open this is the draft the cashier is building, so
   *  it can be empty or not yet add up to `total`; once Completed it is what was actually taken and
   *  is frozen. Empty on a single-method payment. */
  paymentAllocations: OrderPaymentAllocationApiDto[]
  receiptEmail?: string | null
  receiptPhone?: string | null
  completedAt?: string | null
  note?: string | null
  notePhotoUrls?: string[] | null
}

/** One option in the "+ Add-On" picker, scoped to the service line it was opened from. */
export interface ServiceLineAddOnOptionApiDto {
  id: string
  name: string
  price: number
}

/** Settings view of a service's own add-on list — includes retired ones so they can be re-enabled. */
export interface ServiceAddOnApiDto {
  id: string
  name: string
  price: number
  displayOrder: number
  isActive: boolean
  /** False once the add-on has been sold — it can then only be deactivated. */
  canDelete: boolean
}

/** A service that owns at least one add-on, offered as a copy source. */
export interface ServiceAddOnCopySourceApiDto {
  id: string
  name: string
  /** Includes inactive add-ons — the copy carries those over too. */
  addOnCount: number
}

export interface ServiceAddOnInput {
  name: string
  price: number
}

export interface UpdateServiceAddOnInput extends ServiceAddOnInput {
  displayOrder: number
  isActive: boolean
}

export interface CatalogCategoryApiDto {
  displayOrder?: number
  id: string
  name: string
}

export interface CheckoutServiceCatalogItemApiDto {
  tags?: string[]
  displayOrder?: number
  id: string
  name: string
  price: number
  durationMinutes: number
  description?: string | null
  photoUrl?: string | null
  isRequiredApproval?: boolean
  categories: CatalogCategoryApiDto[]
}

export interface CheckoutProductCatalogItemApiDto {
  id: string
  name: string
  price: number
  categories: CatalogCategoryApiDto[]
}

// Technician picker for a given service — only staff whose skill (PosStaffServiceAssignment)
// covers this service. isBusy is informational only: the caller can still pick a busy
// technician as an explicit override (see AssignStaffToServiceLineCommand, backend).
export interface AssignableStaffApiDto {
  posStaffProfileId: string
  displayName: string
  photoUrl?: string | null
  isBusy: boolean
}

// Technician picker for reassigning a completed ticket. Wider than AssignableStaffApiDto on
// purpose — the work is already done, so neither the skill list nor clock-in state narrows it —
// and there is no isBusy: nobody is busy with work that finished days ago.
export interface ReassignableStaffApiDto {
  posStaffProfileId: string
  displayName: string
  photoUrl?: string | null
}

// Pre-confirmation warning: the salon week this ticket falls into, plus whichever of the two
// technicians has already been paid for it. An empty list is the normal answer.
export interface ReassignPayrollWarningApiDto {
  weekStart: string
  weekEnd: string
  alreadyPaidStaff: { posStaffProfileId: string; displayName: string }[]
}

// One hand-over in a service line's history. Technicians are never notified when their earnings
// move, so this is what the salon shows them.
export interface ServiceLineReassignmentApiDto {
  reassignedAt: string
  reassignedByName?: string | null
  fromStaffName?: string | null
  toStaffName?: string | null
  tipMovedAmount: number
  reason?: string | null
}

// POS Booking — per-business booking rules (Ticket 2). Owner-configurable; Staff can
// read/write too when their PosRole grants the Operations permission, same access rule
// as Orders (see IPosOperationsAccessService, backend).
/** Salon-wide rules for how a ticket's service lines move through their own lifecycle. */
export interface PosOrderSettingsApiDto {
  requireStaffAcceptance: boolean
  warnOnServiceLineStatusMismatch: boolean
  allowStaffManageOwnServiceLines: boolean
}

/** One service-value band: `thresholdAmount` is the band's lower bound, in dollars. */
export interface PosTurnTierApiDto {
  thresholdAmount: number
  turnCredit: number
}

export interface PosTurnSettingsApiDto {
  bookingTurnCredit: number
  serviceTurnTiers: PosTurnTierApiDto[]
  /** Reading is open to the whole front desk; saving needs the Manage Turn Rules permission. */
  canManage: boolean
}

/** PUT payload — `canManage` is server-decided and never sent back. */
export type PosTurnSettingsUpdateApiDto = Omit<PosTurnSettingsApiDto, 'canManage'>

export interface PosBookingSettingsApiDto {
  autoConfirmEnabled: boolean
  minLeadTimeMinutes: number
  maxAdvanceDays: number
  reminderHoursBefore: number
  // Booking SMS Notifications — migrated from the Nexora Voice AI Hub settings.
  notifyCustomerSmsEnabled: boolean
  notifyBusinessSmsEnabled: boolean
  notifyAssignedStaffSmsEnabled: boolean
  holidayAutoNotifyEnabled: boolean
}

// POS Booking — Staff/Owner creates a booking directly (Ticket 3). Always Confirmed
// immediately on the backend, bypassing PosBookingSettingsApiDto.autoConfirmEnabled.
export interface CreateBookingItemPayload {
  posServiceId: string
  // Optional — unlike CheckInOrderItemPayload, leaving this out keeps the line
  // unassigned (no auto-pick) for the Owner to fill in later.
  posStaffProfileId?: string
  note?: string
}

export interface CreateBookingPayload {
  customerName: string
  customerPhone: string
  customerEmail?: string
  // ISO 8601 with offset (e.g. via `new Date(...).toISOString()`) — matches the
  // backend's DateTimeOffset ScheduledAt.
  scheduledAt: string
  items: CreateBookingItemPayload[]
}

// POS Booking — Staff/Owner Booking Management screen (Ticket 9)
export interface ReceiptServiceLineApiDto {
  serviceName: string
  // Null when the line was never assigned — the page shows its "First available" label.
  technicianName: string | null
  unitPrice: number
  quantity: number
  /** Original price of the line, before any discount. */
  lineTotal: number
  /** Zero when this line was not discounted. Who absorbed it is deliberately not on the receipt. */
  discountAmount: number
  /** What the customer paid for this line. */
  lineTotalAfterDiscount: number
  /** Extras performed as part of this service, each printed on its own indented line. */
  addOns: ReceiptAddOnLineApiDto[]
}

export interface ReceiptAddOnLineApiDto {
  addOnName: string
  lineTotal: number
  discountAmount: number
  lineTotalAfterDiscount: number
}

export interface ReceiptProductLineApiDto {
  productName: string
  unitPrice: number
  quantity: number
  lineTotal: number
}

export interface ReceiptApiDto {
  salonName: string
  ticketNumber: string
  // UTC instant; rendered in `timeZone` by the page.
  completedAt: string
  // The salon's IANA zone id, or null when the business has none set.
  timeZone: string | null
  customerName: string
  serviceLines: ReceiptServiceLineApiDto[]
  productLines: ReceiptProductLineApiDto[]
  servicesSubtotal: number
  productsSubtotal: number
  tipAmount: number
  discountAmount: number
  /** The order-level discount ("Discount all services"), frozen at checkout. */
  orderDiscountAmount: number
  /** 'Percent' | 'Amount'. Null when no order-level discount was applied. */
  orderDiscountType?: string | null
  orderDiscountValue?: number | null
  /** The promotion's name as it was when applied — a later rename never rewrites this receipt. */
  appliedPromotionName?: string | null
  salesTaxAmount: number
  total: number
  paymentMethodType: string | null
}

/**
 * What the public certificate verify endpoint returns — deliberately the smallest payload that
 * still proves a certificate is genuine. The certificate code printed on paper is sequential and
 * therefore guessable, so everything not needed to verify is withheld server-side: no recipient
 * email, no recipient user id, no internal notes, and no revoke reason.
 */
export interface CertificateVerificationApiDto {
  /** The code printed on the certificate, e.g. "NXT-CS-2026-0001". */
  certificateId: string
  /** Snapshot of the holder's name taken when the certificate was written, not re-derived later. */
  memberName: string
  programCode: string
  programName: string
  programDescription?: string | null
  /** Date-only (`YYYY-MM-DD`) — the date printed on the certificate, not the issue timestamp. */
  certificationDate: string
  /** Date-only. Null when the certificate does not expire. */
  expiryDate?: string | null
  /** `CertificateStatus` — the backend's effective status, so `Expired` arrives already computed. */
  status: string
  /** UTC instant the certificate was revoked. Null unless `status` is `Revoked`. */
  revokedAt?: string | null
  /**
   * Score from the certification exam, e.g. 94 for the "94 / 100" printed on the certificate.
   *
   * **Not implemented backend-side yet** — there is no score column on the `Certificate` entity and
   * no field for it in `CertificateVerificationDto` (verified against the live spec, 2026-09-08).
   * It is optional here so the page renders the column the moment the backend starts sending it and
   * simply omits it until then. See the "cần hỏi BE" section of US-048 for the shape to confirm.
   */
  examScore?: number | null
  /** Denominator for `examScore`. Falls back to CERTIFICATE_EXAM_SCORE_MAX_DEFAULT when absent. */
  examScoreMax?: number | null
}

export interface BookingListItemApiDto {
  bookingId: string
  customerName: string
  /** National number only, digits without the country code. */
  customerPhone?: string | null
  /** Dial code with a leading "+" (e.g. "+1"). Null when the backend could not resolve the number. */
  customerPhoneCountryCode?: string | null
  /** Full E.164 number. Null when the backend could not resolve the number. */
  customerPhoneE164?: string | null
  // ISO 8601, always read via UTC getters (see feedback_frontend_datetime_timezone_naive).
  createdAt: string
  // ISO 8601 with offset — always read via UTC getters (see feedback_frontend_datetime_timezone_naive).
  scheduledAt: string
  status: string
  source: string
  orderNumber?: string | null
  serviceNames: string[]
  technicianNames: string[]
}

export interface BookingListResultApiDto {
  items: BookingListItemApiDto[]
  totalCount: number
}

export interface BookingListFilters {
  posStaffProfileId?: string
  dateFrom?: string // "YYYY-MM-DD"
  dateTo?: string // "YYYY-MM-DD"
  status?: string
  page?: number
  pageSize?: number
}

export interface BookingDetailServiceApiDto {
  // Null when the service couldn't be resolved (e.g. a Voice call's free-text request with no
  // confident catalog match) — see the Note field for what the customer actually asked for.
  posServiceId?: string | null
  serviceName: string
  price: number
  note?: string | null
  posStaffProfileId?: string | null
  technicianName?: string | null
}

export interface BookingDetailApiDto {
  bookingId: string
  customerName: string
  /** National number only, digits without the country code. */
  customerPhone?: string | null
  /** Dial code with a leading "+" (e.g. "+1"). Null when the backend could not resolve the number. */
  customerPhoneCountryCode?: string | null
  /** Full E.164 number. Null when the backend could not resolve the number. */
  customerPhoneE164?: string | null
  customerEmail?: string | null
  // ISO 8601, always read via UTC getters (see feedback_frontend_datetime_timezone_naive).
  createdAt: string
  scheduledAt: string
  status: string
  source: string
  orderNumber?: string | null
  cancellationReason?: string | null
  services: BookingDetailServiceApiDto[]
}

export interface CancelBookingPayload {
  cancellationReason: string
}

export interface RescheduleBookingItemPayload {
  posServiceId: string
  posStaffProfileId?: string
  note?: string
}

export interface RescheduleBookingPayload {
  scheduledAt: string
  items: RescheduleBookingItemPayload[]
}

// POS Booking — Public Booking Page discovery (Ticket 4). Anonymous, no auth — resolved by
// Business.Slug. Technicians are filtered by employment status only (never real-time
// clock/busy state), per POS-Booking-Business.md.
export interface PublicBookingCategoryApiDto {
  id: string
  name: string
}

export interface PublicBookingServiceApiDto {
  id: string
  name: string
  price: number
  durationMinutes: number
  description?: string | null
  photoUrl?: string | null
  categories: PublicBookingCategoryApiDto[]
}

export interface PublicBookingTechnicianApiDto {
  id: string
  displayName: string
  photoUrl?: string | null
  serviceIds: string[]
}

export interface PublicBookingPageApiDto {
  businessName: string
  logoUrl?: string | null
  businessAddress?: string | null
  businessPhone?: string | null
  services: PublicBookingServiceApiDto[]
  technicians: PublicBookingTechnicianApiDto[]
}

export interface SmsConsentBusinessDto {
  businessSlug: string
  businessName: string
  logoUrl: string | null
  businessPhone: string | null
}

export interface LocalSmsConsentRecord {
  schemaVersion: 1
  businessSlug: string
  phoneE164: string
  transactional: boolean
  marketing: boolean
  disclosureVersion: string
  savedAt: string
}

// POS Booking — Public availability + submission (Ticket 5)
export interface PublicAvailabilityItemPayload {
  posServiceId: string
  posStaffProfileId?: string
}

export interface PublicAvailabilityRequestPayload {
  date: string // "YYYY-MM-DD"
  items: PublicAvailabilityItemPayload[]
  // Set only by the Manage-Booking reschedule flow (Ticket 8) so a booking's own existing
  // slot never shows as a conflict against itself while picking a new time for it.
  excludeBookingId?: string
}

export interface PublicAvailabilityApiDto {
  availableTimes: string[] // "HH:mm", local to the salon's own hours
  holidayReason?: string | null
  adjustedOpenTime?: string | null
  adjustedCloseTime?: string | null
}

export interface CreatePublicBookingItemPayload {
  posServiceId: string
  posStaffProfileId?: string
}

export interface CreatePublicBookingPayload {
  customerName: string
  customerPhone: string
  customerEmail?: string
  // ISO 8601 with offset — built via Date.UTC(...) so the picked wall-clock time travels
  // unshifted (see NewBookingForm.tsx / feedback_frontend_datetime_timezone_naive memory).
  scheduledAt: string
  items: CreatePublicBookingItemPayload[]
  // SMS consent (A2P 10DLC / TCPA). Both default false; the server records an append-only consent
  // event only for the scopes actually ticked. ipAddress / userAgent are captured server-side and
  // must not be sent from here.
  transactionalConsent: boolean
  marketingConsent: boolean
  disclosureVersion: string
  locale: string
  sourceUrl: string
}

/** Current SMS consent for the phone on a booking, read/written via the manage-booking token. */
export interface BookingConsentApiDto {
  transactionalGranted: boolean
  marketingGranted: boolean
}

export interface CreatePublicBookingResultApiDto {
  bookingId: string
  manageToken: string
  status: string
}

// POS Booking — customer self-service Manage Booking page (Ticket 8)
export interface ManageBookingServiceApiDto {
  posServiceId: string
  serviceName: string
  posStaffProfileId?: string | null
  technicianName?: string | null
}

export interface ManageBookingApiDto {
  bookingId: string
  businessName: string
  businessSlug: string
  customerName: string
  // ISO 8601 with offset — always read via UTC getters (see feedback_frontend_datetime_timezone_naive).
  scheduledAt: string
  status: string
  services: ManageBookingServiceApiDto[]
  canCancelOrReschedule: boolean
}

export interface ManageBookingReschedulePayload {
  scheduledAt: string
}

// ─── POS Public Check-In (customer's own phone, anonymous by businessSlug) ───────────────
// Mirrors the kiosk `SelfCheckIn*` DTOs in the live Swagger — the public handlers are
// documented as copies of them (POS-Public-Check-In-Technical.md §4/§10), so technicians
// carry `posStaffProfileId` here, not the `id` the public *booking* page uses.

export interface PublicCheckInCategoryApiDto {
  id: string
  name: string
}

export interface PublicCheckInServiceApiDto {
  id: string
  name: string
  price: number
  durationMinutes: number
  description?: string | null
  photoUrl?: string | null
  categories: PublicCheckInCategoryApiDto[]
}

export interface PublicCheckInTechnicianApiDto {
  posStaffProfileId: string
  displayName: string
  photoUrl?: string | null
  serviceIds: string[]
  /** Currently mid-service. Shown as a hint — it does not block picking the technician. */
  isBusy: boolean
}

export interface PublicCheckInPageApiDto {
  businessName: string
  logoUrl?: string | null
  businessAddress?: string | null
  businessPhone?: string | null
  /** Phase 1 renders SinglePage regardless of this value — Wizard is a deferred ticket. */
  layout: PosCheckInLayout
  services: PublicCheckInServiceApiDto[]
  technicians: PublicCheckInTechnicianApiDto[]
}

export interface PublicCheckInCustomerApiDto {
  displayName: string
}

/** Open `Waiting`/`InService` order already on file for this phone today, or null. */
export interface PublicCheckInActiveVisitApiDto {
  orderNumber: string
  /** Handle for the status page. Safe to return: the caller proved they know the phone
   *  number the visit was created with (POS-Public-Check-In-Technical.md §6). */
  receiptToken: string
}

export interface PublicCheckInBookingItemApiDto {
  posServiceId: string
  posStaffProfileId?: string | null
}

export interface PublicCheckInBookingApiDto {
  bookingId: string
  /** ISO 8601 with offset — read via UTC getters (feedback_frontend_datetime_timezone_naive). */
  scheduledAt: string
  customerName: string
  items: PublicCheckInBookingItemApiDto[]
  /** Inside the server's [ScheduledAt − 60′, ScheduledAt + 120′] convert window. */
  canCheckInNow: boolean
  earliestCheckInAt: string
}

export interface PublicCheckInOrderItemPayload {
  posServiceId: string
  posStaffProfileId?: string
  note?: string
}

export interface PublicCheckInOrderPayload {
  customerName?: string
  customerPhone: string
  items: PublicCheckInOrderItemPayload[]
  /**
   * Set only when the customer answered "check in another guest" on the active-visit
   * interstitial — bypasses the server's one-open-order-per-phone guard for the real
   * case of a group sharing one number (§8.2).
   */
  allowDuplicatePhone?: boolean
}

export interface PublicCheckInBookingPayload {
  bookingId: string
  customerName?: string
  items: PublicCheckInOrderItemPayload[]
}

export interface PublicCheckInOrderResultApiDto {
  orderId: string
  orderNumber: string
  /** `PosOrder.ReceiptToken` — the handle for the anonymous status page. */
  receiptToken: string
}

export interface PublicCheckInStatusApiDto {
  orderNumber: string
  status: PosOrderStatus
  peopleAhead: number
  businessName: string
}

export interface CompleteOrderPayload {
  paymentMethodType: PosCheckoutPaymentMethodType
  receiptEmail?: string
  receiptPhone?: string
}

/** Which VlinkPay payment page the cashier wants to open. Mirrors the backend enum. */
export const VlinkPayPaymentPage = {
  Crypto: 0,
  GiftCard: 1,
} as const
export type VlinkPayPaymentPageValue =
  (typeof VlinkPayPaymentPage)[keyof typeof VlinkPayPaymentPage]

export interface VlinkPayPaymentUrlPayload {
  page: VlinkPayPaymentPageValue
  /** Origin of this POS page. VlinkPay posts the result only here. */
  callbackOrigin: string
  /** Order total, pre-filled and locked so the cashier cannot mistype it. */
  amount?: number
}

export interface VlinkPayPaymentUrlApiDto {
  iframeUrl: string
}

export interface RecordVlinkPayPaymentPayload {
  /** Tip attributed to the VlinkPay portion. Only one method on an order may carry the tip. */
  tipAmount: number
}

export interface RecordVlinkPayPaymentResultApiDto {
  /** Amount VlinkPay confirms was collected — not the amount the browser reported. */
  amount: number
  txId?: string | null
  method?: string | null
}

export interface VlinkPayPaymentStatusApiDto {
  found: boolean
  txId?: string | null
  amount: number
  paidAt?: string | null
  /** 'crypto' | 'giftcard'; null when nothing was found. */
  method?: string | null
}

/** Result the embedded VlinkPay page posts back to this window. */
export interface VlinkPayEmbedResultMessage {
  type: 'VLINKPAY_PAYMENT_RESULT'
  externalRefId: string
  txId: string | null
  amount: number | null
  method: 'crypto' | 'giftcard'
  status: 'success' | 'failed' | 'cancelled'
}

export interface CompleteOrderResultApiDto {
  orderId: string
  servicesSubtotal: number
  productsSubtotal: number
  tipAmount: number
  /** Sum of the per-line discounts. */
  discountAmount: number
  /** Order-level discount (promotion or manual), separate from the per-line ones. Present on
   *  CompleteOrderResultDto in the live spec; it was missing here, so a receipt printed straight
   *  from the completion response could not show a promotion and would not add up. */
  orderDiscountAmount: number
  salesTaxAmount: number
  totalAmount: number
  status: string
  completedAt: string
}

export interface SetOrderStaffTipSplitPayload {
  shares: { posStaffProfileId: string; tipAmount: number }[]
}

/** One portion of a split payment: a method and what was taken through it. */
export interface OrderPaymentAllocationApiDto {
  /** A `PosCheckoutPaymentMethod` value — never `SplitPay`, which labels the order, not a portion. */
  paymentMethodType: string
  amount: number
  /** The order's tip attributed to this method. Non-zero on exactly one portion. */
  tipAmount: number
  /** What the customer handed over. Only ever set on a cash portion; display only. */
  cashReceived?: number | null
  /** Position on the Quick Split screen: 0 is "Payment 1". */
  displayOrder: number
}

/**
 * Replaces the whole split on an open order — this is the auto-save from Quick Split, so it fires
 * on every edit and an empty `allocations` array means Clear Split. Array order is the display
 * order, so no index is sent. An unbalanced set is accepted here on purpose; the backend only
 * enforces that it adds up to the amount due at Complete.
 */
export interface SetOrderPaymentAllocationsPayload {
  allocations: {
    paymentMethodType: string
    amount: number
    tipAmount: number
    cashReceived?: number | null
  }[]
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
  responseRate?: number
  responseRateLabel?: DashboardResponseRateLabel | string
}

export interface PlatformReviewsApiDto {
  googleAvgRating?: number | null
  googleReviewCount?: number | null
  yelpAvgRating?: number | null
  yelpReviewCount?: number | null
}

export interface CustomersSummaryApiDto {
  returningCustomerRate?: number
  returningCustomerRateChangeVsLastWeek?: number
}

// POS Booking (Ticket 10) — count of bookings made within the dashboard's date range.
export interface BookingsSummaryApiDto {
  totalCount?: number
}

export interface DashboardOverviewApiDto {
  tipsSummary?: TipsSummaryApiDto
  scansSummary?: ScansSummaryApiDto
  reviewsSummary?: ReviewsSummaryApiDto
  platformReviews?: PlatformReviewsApiDto
  customersSummary?: CustomersSummaryApiDto
  bookingsSummary?: BookingsSummaryApiDto
}

export type DashboardResponseRateLabel =
  | 'EXCELLENT'
  | 'GOOD'
  | 'FAIR'
  | 'NEEDS_IMPROVEMENT'
  | 'POOR'

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
  responseRate: number
  responseRateLabel: DashboardResponseRateLabel | string | null
  googleAvgRating: number | null
  googleReviewCount: number | null
  yelpAvgRating: number | null
  yelpReviewCount: number | null
  returningCustomerRate: number
  returningCustomerRateChangeVsLastWeek: number
  previousPeriodComparison: number | null
  totalBookings: number
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
  id: string
  name: string
  tips: number
  rating: number
  totalReviews: number
}

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

export interface DashboardAnalyticsOverviewApiDto {
  totalVolume?: number
  totalTransactionCount?: number
  feeSaved?: number
  averageTipAmount?: number
}

export interface DashboardAnalyticsLeaderboardItemApiDto {
  staffProfileId?: string
  displayName?: string
  nicknameAtBusiness?: string | null
  photoUrl?: string | null
  position?: string | null
  tipTotal?: number
  tipCount?: number
  avgTip?: number
  avgRating?: number
  reviewCount?: number
  selectionCount?: number
}

export interface DashboardAnalyticsTouchPointApiDto {
  touchPointId?: string
  name?: string
  type?: string
  scanCount?: number
  tipCount?: number
  tipTotal?: number
  ctr?: number
  avgRating?: number
}

export interface DashboardAnalyticsTipsMethodApiDto {
  method?: string
  amount?: number
  count?: number
}

/** @deprecated API may still return this; prefer `tipsMethods`. */
export type DashboardAnalyticsPayoutMethodApiDto = DashboardAnalyticsTipsMethodApiDto

export interface DashboardAnalyticsDirectPayoutApiDto {
  totalAmount?: number
  totalCount?: number
}

export interface DashboardAnalyticsTipRevenueBreakdownApiDto {
  amount?: number
  count?: number
}

export interface DashboardAnalyticsTipRevenueApiDto {
  totalRevenue?: number
  directTips?: DashboardAnalyticsTipRevenueBreakdownApiDto
  cardTips?: DashboardAnalyticsTipRevenueBreakdownApiDto
  cryptoTips?: DashboardAnalyticsTipRevenueBreakdownApiDto
}

export interface DashboardAnalyticsApiDto {
  overview?: DashboardAnalyticsOverviewApiDto
  tipRevenue?: DashboardAnalyticsTipRevenueApiDto
  leaderboard?: DashboardAnalyticsLeaderboardItemApiDto[]
  touchPoints?: DashboardAnalyticsTouchPointApiDto[]
  tipsMethods?: DashboardAnalyticsTipsMethodApiDto[]
  /** @deprecated Prefer `tipsMethods`. */
  payoutMethods?: DashboardAnalyticsTipsMethodApiDto[]
  directPayout?: DashboardAnalyticsDirectPayoutApiDto
}

export interface MerchantDashboardAnalyticsOverview {
  totalVolume: number
  totalTransactionCount: number
  feeSaved: number
  averageTipAmount: number
}

export interface MerchantDashboardAnalyticsLeaderboardItem {
  staffProfileId: string
  displayName: string
  nicknameAtBusiness: string | null
  photoUrl: string | null
  position: string | null
  tipTotal: number
  tipCount: number
  avgTip: number
  avgRating: number
  reviewCount: number
  selectionCount: number
}

export interface MerchantDashboardAnalyticsTouchPoint {
  touchPointId: string
  name: string
  type: string
  scanCount: number
  tipCount: number
  tipTotal: number
  ctr: number
  avgRating: number
}

export interface MerchantDashboardAnalyticsTipsMethod {
  method: string
  amount: number
  count: number
}

/** @deprecated Use `MerchantDashboardAnalyticsTipsMethod`. */
export type MerchantDashboardAnalyticsPayoutMethod = MerchantDashboardAnalyticsTipsMethod

export interface MerchantDashboardAnalyticsDirectPayout {
  totalAmount: number
  totalCount: number
}

export interface MerchantDashboardAnalyticsTipRevenueBreakdown {
  amount: number
  count: number
}

export interface MerchantDashboardAnalyticsTipRevenue {
  totalRevenue: number
  directTips: MerchantDashboardAnalyticsTipRevenueBreakdown
  cardTips: MerchantDashboardAnalyticsTipRevenueBreakdown
  cryptoTips: MerchantDashboardAnalyticsTipRevenueBreakdown
}

export interface MerchantDashboardAnalytics {
  overview: MerchantDashboardAnalyticsOverview
  tipRevenue: MerchantDashboardAnalyticsTipRevenue
  leaderboard: MerchantDashboardAnalyticsLeaderboardItem[]
  touchPoints: MerchantDashboardAnalyticsTouchPoint[]
  tipsMethods: MerchantDashboardAnalyticsTipsMethod[]
  directPayout: MerchantDashboardAnalyticsDirectPayout
}

export type DashboardReviewRoutingType = 'Public' | 'Private' | 'Skipped'

/**
 * Aggregate review stats for the reviews tab KPI/filter counts.
 * Sourced from GET /api/v1/merchant/dashboard/overview -> reviewsSummary
 * (all-time, not the current reviews list page).
 */
export interface DashboardReviewsSummary {
  totalReviews: number
  averageRating: number
  googleClicks: number
  yelpClicks: number
  count4To5Stars: number
  count1To3Stars: number
}

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

export interface StaffPaymentMethodCryptoAddressApiDto {
  network?: string
  symbol?: string
  address?: string
}

export interface StaffPaymentMethodApiDto {
  type?: string
  isActive?: boolean
  accountInfo?: string | null
  accountName?: string | null
  imageUrl?: string | null
  isConfigured?: boolean
  cryptoAddresses?: StaffPaymentMethodCryptoAddressApiDto[] | null
}

export interface StaffInviteSummaryApiDto {
  id?: string
  invitedAt?: string | null
  expiresAt?: string | null
  status?: string | null
}

export interface StaffListItemApiDto {
  id?: string
  linkId?: string
  inviteId?: string
  staffLinkId?: string
  staffProfileId?: string | null
  userProfileId?: string | null
  userId?: string | null
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
  nicknameAtBusiness?: string | null
  photoUrl?: string | null
  status?: string
  position?: string | null
  roleAtBusiness?: string | null
  // Not yet returned by GET /api/v1/merchant/staff (StaffListItemDto) as of 2026-09-09 — added
  // speculatively so the Staff table's Level column starts working the moment BE adds it.
  staffLevelName?: string | null
  bio?: string | null
  invitedEmail?: string | null
  invitedPhone?: string | null
  phoneNumber?: string | null
  joinDate?: string | null
  email?: string | null
  phone?: string | null
  firstName?: string | null
  lastName?: string | null
  fullName?: string | null
  paymentMethods?: StaffPaymentMethodApiDto[]
  invites?: StaffInviteSummaryApiDto[]
  isLocalStaff?: boolean
  staffProfile?: { phoneNumber?: string; phone?: string; email?: string }
  user?: { id?: string; userProfileId?: string; phoneNumber?: string; phone?: string; email?: string }
}

/**
 * `GET /api/v1/merchant/staff/{staffCode}` — StaffDetailByCodeDto.
 * Includes `userProfileId` and paymentMethods with optional VlinkPay `cryptoAddresses`.
 */
export interface StaffDetailByCodeApiDto extends StaffListItemApiDto {
  linkId: string
  itemType: string
  staffProfileId: string
  userProfileId: string | null
  staffCode: string
  displayName: string
  nicknameAtBusiness: string | null
  photoUrl: string | null
  position: string | null
  bio: string | null
  roleAtBusiness: string | null
  status: string
  sortOrder: number
  isProfileComplete: boolean
  isLocalStaff: boolean
  tipCount: number
  averageRating: number
  email: string | null
  phoneNumber: string | null
  firstName: string | null
  lastName: string | null
  joinDate: string | null
  invites: StaffInviteSummaryApiDto[]
  paymentMethods: StaffPaymentMethodApiDto[]
}

export interface LocalStaffApiDto {
  id: string
  staffCode?: string | null
  displayName: string
  position?: string | null
  bio?: string | null
  photoUrl?: string | null
  phoneNumber?: string | null
  email?: string | null
  isProfileComplete?: boolean
  isLocalStaff?: boolean
}

export interface LocalStaffCreateParams {
  displayName: string
  position?: string | null
  bio?: string | null
  photoUrl?: string | null
  phoneNumber?: string | null
  email?: string | null
  firstName: string
  lastName: string
}

export interface LocalStaffUpdateParams extends LocalStaffCreateParams {}

/**
 * One order/booking still open against a local staff member, blocking their deletion
 * (backend LOCAL_STAFF_HAS_ACTIVE_WORK). `scheduledAt` is set only when `isBooking`.
 */
export interface LocalStaffActiveWorkItem {
  orderId: string
  orderNumber: string
  customerName: string
  status: PosOrderStatus
  isBooking: boolean
  scheduledAt: string | null
  source: string | null
  checkedInAt: string
}

export interface StaffSearchResultApiDto {
  staffProfileId: string
  staffCode?: string | null
  displayName?: string | null
  fullName?: string | null
  photoUrl?: string | null
  position?: string | null
  paymentMethods?: StaffPaymentMethodApiDto[]
}

/** `GET /merchant/staff/{staffProfileId}/stats` — API DTOs. */
export interface StaffTipsTrendPointApiDto {
  date?: string
  totalAmount?: number
  tipCount?: number
}

export interface StaffAllTimeStatsApiDto {
  tipsCollected?: number
  tipCount?: number
  averageRating?: number
  totalReviews?: number
  reviewsRouted?: number
  totalQrScans?: number
  qrToTipConversionRate?: number
}

export interface StaffPeriodStatsApiDto extends StaffAllTimeStatsApiDto {
  tipsChangePercent?: number
  tipsTrend?: StaffTipsTrendPointApiDto[]
}

export interface StaffRecentTipApiDto {
  id?: string
  amount?: number
  totalAmount?: number
  paymentMethod?: string
  isMultiStaff?: boolean
  touchPointName?: string
  createdAt?: string
}

export interface StaffRecentReviewApiDto {
  id?: string
  rating?: number
  comment?: string | null
  customerName?: string | null
  routingType?: string
  createdAt?: string
}

export interface MerchantStaffDetailStatsApiDto {
  allTime?: StaffAllTimeStatsApiDto
  period?: StaffPeriodStatsApiDto
  recentTips?: StaffRecentTipApiDto[]
  recentReviews?: StaffRecentReviewApiDto[]
}

export interface StaffStatsDateParams {
  dateFrom?: string
  dateTo?: string
}

export interface StaffTipsTrendPoint {
  date: string
  totalAmount: number
  tipCount: number
}

export interface StaffAllTimeStats {
  tipsCollected: number
  tipCount: number
  averageRating: number
  totalReviews: number
  reviewsRouted: number
  totalQrScans: number
  qrToTipConversionRate: number
}

export interface StaffPeriodStats extends StaffAllTimeStats {
  tipsChangePercent: number
  tipsTrend: StaffTipsTrendPoint[]
}

export interface MerchantStaffDetailStats {
  allTime: StaffAllTimeStats
  period: StaffPeriodStats
  recentTips: TransactionRecord[]
  recentReviews: ReviewRecord[]
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
  statusLabel?: string | null
  paymentMethod?: string
  staffName?: string
  staffProfileId?: string | null
  staffCode?: string | null
  touchPointName?: string
  touchPointId?: string | null
  createdAt?: string
  confirmedAt?: string | null
  staffConfirmedAt?: string | null
  merchantConfirmedAt?: string | null
  isMultiStaff?: boolean
  isLocalStaff?: boolean
  tipItems?: unknown[]
  /** Income/Payout Categories (issue #584) — Staff-assigned category on this Tip. */
  categoryId?: string | null
  categoryName?: string | null
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
  businessId?: string
  businessName?: string
  businessLogoUrl?: string | null
  businessRole?: string | null
  requestedAt?: string | null
  status?: string | null
  roleAtBusiness?: string | null
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

export interface TouchpointApiDto {
  id?: string
  name?: string
  slug?: string | null
  type?: string
  url?: string | null
  qrImageUrl?: string | null
  isActive?: boolean
  assignedStaffProfileId?: string | null
  createdAt?: string | null
  totalScans?: number
  totalRevenue?: number
  deviceId?: string | null
}

export interface PhysicalCardApiDto {
  id?: string
  cardCode?: string
  helpCode?: string | null
  linkedTouchPointId?: string | null
  touchPointName?: string | null
  linkedAt?: string | null
}

export interface LinkPhysicalCardResult {
  cardCode: string
  linkedTouchPointId: string
  touchPointName: string
  linkedAt: string
}

export interface UnlinkPhysicalCardResult {
  cardCode: string
  unlinkedAt: string
}

export interface PhysicalCardDetailApiDto {
  id?: string
  cardCode?: string
  helpCode?: string
  isActive?: boolean
  linkedTouchPointId?: string | null
  touchPointName?: string | null
  touchPointUrl?: string | null
  linkedAt?: string | null
}

export interface QrTouchPointApiDto {
  id?: string
  name?: string
  slug?: string
  type?: string
  businessId?: string
  businessName?: string
  businessSlug?: string
}

export interface ResolveQrCodeResult {
  status?: string
  touchPoint?: QrTouchPointApiDto | null
}

export interface SendPhysicalCardSupportResult {
  supportRequestId: string
  submittedAt: string
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
  roleAtBusiness?: string | null
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
  firstName?: string
  lastName?: string
  phone?: string
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
  payoutConfigs: Record<string, { enabled?: boolean; value?: string; accountName?: string }>
  skipProfileUpdates?: boolean
}

export interface PayoutConfigMap {
  [uiKey: string]: { enabled?: boolean; value?: string; qrCode?: string; accountName?: string }
}

export type {
  MerchantSetup,
  NotificationRecord,
  PaginatedResponse,
  PosPrintRestoreState,
  PosReceiptDocument,
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

/* ── POS receipt printing — device-local records (US-047) ─────────────────────────────────────
 *
 * Not API DTOs: there is no printer endpoint on the backend, and there should not be one for the
 * connection half — the printer is physically attached to a single iPad. These are persisted by
 * `posPrinterSettings.ts` through `storage.ts` and are the only device-scoped records in the app
 * besides the paired-device token.
 */

export interface PosPrinterProfile {
  transport: PosPrintTransportType
  /** Whether the device has explicitly chosen a print method. */
  transportConfigured?: boolean
  /** Printer dots — see RECEIPT_PAPER_WIDTH_DOTS. */
  paperWidthDots: number
  /** ISO timestamp of the last test print, or null when never tested. */
  lastTestAt: string | null
  /** The PassPRNT code that test returned; null when never tested. */
  lastTestCode: string | null
}

export interface PosReceiptSettings {
  /** Include retail product lines on the receipt. */
  printProducts: boolean
  /** Group services in a consistent order rather than ticket order. */
  sortServices: boolean
  /** Receipts printed after a card payment, 0..3. */
  cardCopies: number
  /** Receipts printed for cash and every other method, 0..3. */
  otherCopies: number
}

/**
 * A print in flight. PassPRNT prints one document per invocation and each invocation leaves the
 * web app, so a multi-copy print is a queue that has to survive a full page load: the callback
 * comes back into a freshly mounted app.
 *
 * The resolved document is stored rather than rebuilt so copy 2 is identical to copy 1 even when
 * the order query cache is cold after the remount.
 */
export interface PosPendingPrintJob {
  jobId: string
  kind: 'receipt' | 'testPrint'
  /** ISO timestamp — a job with no callback past PASSPRNT_JOB_STALE_MS never started. */
  createdAt: string
  copiesTotal: number
  copiesDone: number
  /** Capped at 1 per copy, so a looping callback can never spin. */
  firedAttempts: number
  /** Null for a test print, which builds its own sample. */
  document: PosReceiptDocument | null
  restore: PosPrintRestoreState | null
  /** The editor was already recovered without a result; do not reopen it on later visits. */
  workspaceRestored?: boolean
  /** Unique invocation ID carried in the callback path, including each individual copy. */
  attemptId?: string
  /** Canonical owner/staff salon route that owns this print job. */
  backPath?: string
  ticketPrint?: { businessId: string; orderId: string }
}
