/**
 * posCustomersRepository — POS Front Desk "Customer" tab (US-043 / US-112).
 * businessId is an explicit param on every call — Staff may be linked to more than one business.
 */
import { parsePhoneNumberFromString } from 'libphonenumber-js'
import httpClient from '../../lib/httpClient'
import type {
  PosCustomerDetailApiDto,
  PosCustomerImportPreviewDto,
  PosCustomerImportPreviewRequest,
  PosCustomerImportRequest,
  PosCustomerImportResultDto,
  PosCustomerListPage,
  PosCustomerListQuery,
  PosCustomerOrderHistoryPage,
  PosCustomerOrderHistoryQuery,
} from '../../types/repositories'

type HttpClient = typeof httpClient

const CUSTOMER_LOOKUP_PAGE_SIZE = 100

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

function withVisitFlag<T extends { isNewCustomer?: boolean }>(item: T): T & { isNewCustomer: boolean } {
  return { ...item, isNewCustomer: item.isNewCustomer === true }
}

function normalizeInternationalPhone(value?: string | null): string | null {
  const phone = value?.trim() ?? ''
  if (!phone.startsWith('+')) return null
  const parsed = parsePhoneNumberFromString(phone, { extract: false })
  return parsed?.isPossible() && !parsed.ext ? parsed.number : null
}

function appendOptionalIndex(formData: FormData, key: string, value?: number | null) {
  if (value == null || !Number.isFinite(value) || value <= 0) return
  formData.append(key, String(value))
}

function buildPreviewFormData(input: PosCustomerImportPreviewRequest): FormData {
  const formData = new FormData()
  formData.append('file', input.file)
  if (input.sheetName) formData.append('sheetName', input.sheetName)
  if (input.headerRow != null) formData.append('headerRow', String(input.headerRow))
  return formData
}

function buildImportFormData(input: PosCustomerImportRequest): FormData {
  const formData = new FormData()
  formData.append('file', input.file)
  formData.append('sheetName', input.sheetName)
  formData.append('headerRow', String(input.headerRow))
  formData.append('phoneNumberColumnIndex', String(input.phoneNumberColumnIndex))
  appendOptionalIndex(formData, 'customerNameColumnIndex', input.customerNameColumnIndex)
  appendOptionalIndex(formData, 'emailColumnIndex', input.emailColumnIndex)
  appendOptionalIndex(formData, 'dateOfBirthColumnIndex', input.dateOfBirthColumnIndex)
  appendOptionalIndex(formData, 'regisDateColumnIndex', input.regisDateColumnIndex)
  appendOptionalIndex(formData, 'lastVisitColumnIndex', input.lastVisitColumnIndex)
  return formData
}

export function createPosCustomersRepository(client: HttpClient = httpClient) {
  const repository = {
    async getCustomerList(businessId: string, query: PosCustomerListQuery = {}): Promise<PosCustomerListPage> {
      const res = await client.get<PosCustomerListPage>(
        `/api/v1/merchant/pos/${businessId}/customers`,
        { params: buildCustomerListParams(query) },
      )
      const page = res ?? EMPTY_CUSTOMER_LIST_PAGE
      return { ...page, items: (page.items ?? []).map(withVisitFlag) }
    },

    async getCustomerDetail(businessId: string, customerId: string): Promise<PosCustomerDetailApiDto | null> {
      const res = await client.get<PosCustomerDetailApiDto>(
        `/api/v1/merchant/pos/${businessId}/customers/${customerId}`,
      )
      return res == null ? null : withVisitFlag(res)
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

    async getCustomerIdForOrder(businessId: string, orderId: string, phoneE164: string): Promise<string | null> {
      const phone = normalizeInternationalPhone(phoneE164)
      if (!businessId || !orderId || !phone) return null

      for (let pageNumber = 1; ; pageNumber += 1) {
        const customers = await repository.getCustomerList(businessId, {
          searchTerm: phone,
          pageNumber,
          pageSize: CUSTOMER_LOOKUP_PAGE_SIZE,
        })

        for (const customer of customers.items) {
          const customerPhone = normalizeInternationalPhone(
            customer.phoneE164 || `${customer.phoneCountryCode ?? ''}${customer.phone}`,
          )
          if (customerPhone !== phone) continue

          for (let historyPageNumber = 1; ; historyPageNumber += 1) {
            const history = await repository.getCustomerOrderHistory(businessId, customer.id, {
              pageNumber: historyPageNumber,
              pageSize: CUSTOMER_LOOKUP_PAGE_SIZE,
            })
            if (history.items.some((order) => order.id === orderId)) return customer.id
            if (!history.hasNextPage) break
          }
        }

        if (!customers.hasNextPage) return null
      }
    },

    async previewCustomerImport(
      businessId: string,
      input: PosCustomerImportPreviewRequest,
    ): Promise<PosCustomerImportPreviewDto> {
      const res = await client.upload<PosCustomerImportPreviewDto>(
        `/api/v1/merchant/pos/${businessId}/customers/import/preview`,
        buildPreviewFormData(input),
      )
      if (!res) throw new Error('Empty preview response')
      return {
        ...res,
        sheetNames: res.sheetNames ?? [],
        columns: res.columns ?? [],
        suggestedMapping: res.suggestedMapping ?? {},
      }
    },

    async importCustomers(
      businessId: string,
      input: PosCustomerImportRequest,
    ): Promise<PosCustomerImportResultDto> {
      const res = await client.upload<PosCustomerImportResultDto>(
        `/api/v1/merchant/pos/${businessId}/customers/import`,
        buildImportFormData(input),
      )
      if (!res) throw new Error('Empty import response')
      return {
        ...res,
        skippedRows: res.skippedRows ?? [],
      }
    },
  }

  return repository
}

export const posCustomersRepository = createPosCustomersRepository()
export default posCustomersRepository
