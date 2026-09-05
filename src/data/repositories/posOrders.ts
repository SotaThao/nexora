/**
 * posOrdersRepository — POS Merchant Ops: Check-in & Waitlist (US-12, refactored to
 * Order in US-026). Unlike the POS Owner Setup repositories, businessId is an explicit
 * param on every call (not inferred server-side from the caller) because a Staff caller
 * may be linked to more than one business.
 */
import httpClient from '../../lib/httpClient'
import { unlessOptimisticId } from '../../utils/uuid'
import type {
  AssignableStaffApiDto,
  CheckInOrderPayload,
  CompletedOrdersListQuery,
  CompletedOrdersPage,
  CustomerLookupResultApiDto,
  OrderListItemApiDto,
  PosCheckInResultApiDto,
  PosWaitlistOrderApiDto,
} from '../../types/repositories'

type HttpClient = typeof httpClient

const EMPTY_COMPLETED_ORDERS_PAGE: CompletedOrdersPage = {
  items: [],
  pageNumber: 0,
  totalPages: 0,
  totalCount: 0,
  hasNextPage: false,
  hasPreviousPage: false,
}

function buildCompletedOrdersParams(query: CompletedOrdersListQuery = {}) {
  const params: Record<string, string | number> = {}
  if (query.pageNumber != null) params.PageNumber = query.pageNumber
  if (query.pageSize != null) params.PageSize = query.pageSize
  if (query.dateFrom) params.DateFrom = query.dateFrom
  if (query.dateTo) params.DateTo = query.dateTo
  if (query.customerName) params.CustomerName = query.customerName
  if (query.customerPhone) params.CustomerPhone = query.customerPhone
  return params
}

export function createPosOrdersRepository(client: HttpClient = httpClient) {
  return {
    async getWaitlist(businessId: string): Promise<PosWaitlistOrderApiDto[]> {
      const res = await client.get<PosWaitlistOrderApiDto[]>(
        `/api/v1/merchant/pos/${businessId}/orders/waitlist`,
      )
      return res ?? []
    },

    // Order List tab (US-17) — Waiting + InService combined.
    async getOrderList(businessId: string): Promise<OrderListItemApiDto[]> {
      const res = await client.get<OrderListItemApiDto[]>(
        `/api/v1/merchant/pos/${businessId}/orders`,
      )
      return res ?? []
    },

    // Completed Orders panel (US-17 follow-up) — paginated, filterable by CompletedAt
    // date range + customer name/phone.
    async getCompletedOrders(businessId: string, query: CompletedOrdersListQuery = {}): Promise<CompletedOrdersPage> {
      const res = await client.get<CompletedOrdersPage>(
        `/api/v1/merchant/pos/${businessId}/orders/completed`,
        { params: buildCompletedOrdersParams(query) },
      )
      return res ?? EMPTY_COMPLETED_ORDERS_PAGE
    },

    // Answers with the order number as well as the id — the thank-you screen shows it the instant
    // check-in succeeds, and the guest is standing there while it loads.
    async checkInOrder(businessId: string, payload: CheckInOrderPayload): Promise<PosCheckInResultApiDto> {
      return await client.post<PosCheckInResultApiDto>(`/api/v1/merchant/pos/${businessId}/orders`, payload)
    },

    // Check-in "returning customer" suggestion (Ticket 2) — null means no prior order
    // exists for this phone at this business (not an error).
    async getCustomerLookupByPhone(businessId: string, phone: string): Promise<CustomerLookupResultApiDto | null> {
      const res = await client.get<CustomerLookupResultApiDto | null>(
        `/api/v1/merchant/pos/${businessId}/orders/customer-lookup`,
        { params: { phone } },
      )
      return res ?? null
    },

    async cancelOrder(businessId: string, orderId: string): Promise<boolean> {
      return await client.post<boolean>(`/api/v1/merchant/pos/${businessId}/orders/${orderId}/cancel`)
    },

    // Assigns one staff member + an optional Note to one service line — not the whole
    // order (US-026, note added US-17). A specific serviceLineId is required;
    // posStaffProfileId omitted = auto-pick. Callable more than once on the same line
    // (e.g. Select Technicians modal's Edit path) to change the technician or note.
    async assignStaffToServiceLine(
      businessId: string,
      orderId: string,
      serviceLineId: string,
      posStaffProfileId?: string,
      note?: string,
    ): Promise<boolean> {
      return unlessOptimisticId(
        serviceLineId,
        () =>
          client.post<boolean>(
            `/api/v1/merchant/pos/${businessId}/orders/${orderId}/services/${serviceLineId}/assign`,
            { posStaffProfileId, note },
          ),
        false,
      )
    },

    // Explicit manual Waiting -> InService transition, requires at least one service
    // line already assigned (US-026) — no longer a side effect of assigning staff.
    async startOrderService(businessId: string, orderId: string): Promise<boolean> {
      return await client.post<boolean>(
        `/api/v1/merchant/pos/${businessId}/orders/${orderId}/start-service`,
      )
    },

    // Accept / decline / start one service line. Callable by the front desk OR by the technician
    // the line is assigned to — the backend resolves which of the two is calling. All three are
    // idempotent forwards: a line already further along answers 200 without changing anything,
    // because the board these buttons sit on is up to 15s stale.
    async acceptServiceLine(businessId: string, orderId: string, serviceLineId: string): Promise<boolean> {
      return unlessOptimisticId(
        serviceLineId,
        () =>
          client.post<boolean>(
            `/api/v1/merchant/pos/${businessId}/orders/${orderId}/services/${serviceLineId}/accept`,
          ),
        false,
      )
    },

    async rejectServiceLine(businessId: string, orderId: string, serviceLineId: string): Promise<boolean> {
      return unlessOptimisticId(
        serviceLineId,
        () =>
          client.post<boolean>(
            `/api/v1/merchant/pos/${businessId}/orders/${orderId}/services/${serviceLineId}/reject`,
          ),
        false,
      )
    },

    async startServiceLine(businessId: string, orderId: string, serviceLineId: string): Promise<boolean> {
      return unlessOptimisticId(
        serviceLineId,
        () =>
          client.post<boolean>(
            `/api/v1/merchant/pos/${businessId}/orders/${orderId}/services/${serviceLineId}/start`,
          ),
        false,
      )
    },

    // Frees the assigned staff on this line immediately, independent of the rest of the
    // order (US-026) — callable by the staff member themselves or a manager/cashier.
    async markServiceLineDone(businessId: string, orderId: string, serviceLineId: string): Promise<boolean> {
      return unlessOptimisticId(
        serviceLineId,
        () =>
          client.post<boolean>(
            `/api/v1/merchant/pos/${businessId}/orders/${orderId}/services/${serviceLineId}/complete`,
          ),
        false,
      )
    },

    // Technician picker filtered by skill (PosStaffServiceAssignment) for one service —
    // includes busy staff (isBusy flag) since a manager may still pick them as an override.
    async getAssignableStaffForService(businessId: string, posServiceId: string): Promise<AssignableStaffApiDto[]> {
      const res = await client.get<AssignableStaffApiDto[]>(
        `/api/v1/merchant/pos/${businessId}/orders/services/${posServiceId}/assignable-staff`,
      )
      return res ?? []
    },
  }
}

export const posOrdersRepository = createPosOrdersRepository()
export default posOrdersRepository
