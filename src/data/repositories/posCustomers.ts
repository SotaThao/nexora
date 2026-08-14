/**
 * posCustomersRepository — POS Front Desk "Customer" tab (US-043). Read-only: list, detail,
 * order/booking history against the shared Customer entity. businessId is an explicit param
 * on every call, same convention as posOrdersRepository/posBookingRepository, since a Staff
 * caller may be linked to more than one business.
 */
import httpClient from '../../lib/httpClient'
import type {
  PosCustomerDetailApiDto,
  PosCustomerListPage,
  PosCustomerListQuery,
  PosCustomerOrderHistoryPage,
  PosCustomerOrderHistoryQuery,
} from '../../types/repositories'

type HttpClient = typeof httpClient

const EMPTY_CUSTOMER_LIST_PAGE: PosCustomerListPage = {
  items: [],
  pageNumber: 0,
  totalPages: 0,
  totalCount: 0,
  hasNextPage: false,
  hasPreviousPage: false,
}

const EMPTY_CUSTOMER_ORDER_HISTORY_PAGE: PosCustomerOrderHistoryPage = {
  items: [],
  pageNumber: 0,
  totalPages: 0,
  totalCount: 0,
  hasNextPage: false,
  hasPreviousPage: false,
}

function buildCustomerListParams(query: PosCustomerListQuery = {}) {
  const params: Record<string, string | number | boolean> = {}
  if (query.pageNumber != null) params.PageNumber = query.pageNumber
  if (query.pageSize != null) params.PageSize = query.pageSize
  if (query.searchTerm) params.SearchTerm = query.searchTerm
  if (query.sortDescending != null) params.SortDescending = query.sortDescending
  return params
}

function buildOrderHistoryParams(query: PosCustomerOrderHistoryQuery = {}) {
  const params: Record<string, number> = {}
  if (query.pageNumber != null) params.PageNumber = query.pageNumber
  if (query.pageSize != null) params.PageSize = query.pageSize
  return params
}

export function createPosCustomersRepository(client: HttpClient = httpClient) {
  return {
    async getCustomerList(businessId: string, query: PosCustomerListQuery = {}): Promise<PosCustomerListPage> {
      const res = await client.get<PosCustomerListPage>(
        `/api/v1/merchant/pos/${businessId}/customers`,
        { params: buildCustomerListParams(query) },
      )
      return res ?? EMPTY_CUSTOMER_LIST_PAGE
    },

    async getCustomerDetail(businessId: string, customerId: string): Promise<PosCustomerDetailApiDto> {
      return await client.get<PosCustomerDetailApiDto>(
        `/api/v1/merchant/pos/${businessId}/customers/${customerId}`,
      )
    },

    async getCustomerOrderHistory(
      businessId: string,
      customerId: string,
      query: PosCustomerOrderHistoryQuery = {},
    ): Promise<PosCustomerOrderHistoryPage> {
      const res = await client.get<PosCustomerOrderHistoryPage>(
        `/api/v1/merchant/pos/${businessId}/customers/${customerId}/orders`,
        { params: buildOrderHistoryParams(query) },
      )
      return res ?? EMPTY_CUSTOMER_ORDER_HISTORY_PAGE
    },
  }
}

export const posCustomersRepository = createPosCustomersRepository()
export default posCustomersRepository
