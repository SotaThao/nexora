/**
 * transactionsRepository — API integration for tips / transaction data.
 *
 * Backend endpoint (confirmed 2026-06-06):
 *   GET /api/v1/merchant/dashboard/tips → paginated tip list
 *
 * Response shape from API:
 *   {
 *     items: [{ id, amount, status, paymentMethod, isMultiStaff,
 *               touchPointId, touchPointName, staffProfileId, staffName,
 *               tipItems: [{ staffProfileId, staffName, amount }],
 *               createdAt, confirmedAt }],
 *     pageNumber, totalPages, totalCount, hasPreviousPage, hasNextPage
 *   }
 *
 * UI components expect flat array of:
 *   { id, amount, status, paymentMethod, staffName, touchpoint, dateTime,
 *     isMultiStaff, tipItems, staffProfileId, touchPointId, confirmedAt }
 */

import httpClient from '../../lib/httpClient'

/**
 * Normalize a single tip item from the API into the shape UI components expect.
 * @param {object} tip - Raw tip from API
 * @returns {object} Normalized transaction object
 */
function normalizeTip(tip) {
  return {
    id: tip.id,
    amount: tip.amount ?? 0,
    status: tip.status ?? 'Initiated',
    paymentMethod: tip.paymentMethod ?? '',
    staffName: tip.staffName ?? '',
    staffProfileId: tip.staffProfileId ?? null,
    touchpoint: tip.touchPointName ?? '',
    touchPointId: tip.touchPointId ?? null,
    dateTime: tip.createdAt ?? '',
    confirmedAt: tip.confirmedAt ?? null,
    isMultiStaff: tip.isMultiStaff ?? false,
    tipItems: tip.tipItems ?? [],
  }
}

export function createTransactionsRepository(client = httpClient) {
  return {
    /**
     * Fetch tips / transaction list from the dashboard tips endpoint.
     * Returns a flat array of normalized transactions (unpaginated).
     *
     * @param {object} [params]
     * @param {number} [params.pageNumber] - Page number (default: 1)
     * @param {number} [params.pageSize]   - Page size (default: 100)
     * @param {string} [params.startDate]  - ISO date string filter
     * @param {string} [params.endDate]    - ISO date string filter
     * @returns {Promise<Array>} Normalized transaction list
     */
    async list(params = {}) {
      try {
        const response = await client.get('/api/v1/merchant/dashboard/tips', { params })
        // API returns paginated { items, pageNumber, totalPages, ... }
        const items = response?.items ?? (Array.isArray(response) ? response : [])
        return items.map(normalizeTip)
      } catch (err) {
        if (err?.status === 404 || err?.response?.status === 404) {
          return []
        }
        throw err
      }
    },

    /**
     * Fetch tips with full pagination metadata.
     * Use this when you need page controls.
     *
     * @param {object} [params]
     * @returns {Promise<{items: Array, pageNumber: number, totalPages: number, totalCount: number, hasNextPage: boolean, hasPreviousPage: boolean}>}
     */
    async listPaginated(params = {}) {
      try {
        const response = await client.get('/api/v1/merchant/dashboard/tips', { params })
        return {
          items: (response?.items ?? []).map(normalizeTip),
          pageNumber: response?.pageNumber ?? 0,
          totalPages: response?.totalPages ?? 0,
          totalCount: response?.totalCount ?? 0,
          hasNextPage: response?.hasNextPage ?? false,
          hasPreviousPage: response?.hasPreviousPage ?? false,
        }
      } catch (err) {
        if (err?.status === 404 || err?.response?.status === 404) {
          return { items: [], pageNumber: 0, totalPages: 0, totalCount: 0, hasNextPage: false, hasPreviousPage: false }
        }
        throw err
      }
    },

    /**
     * @param {object} tx
     * @returns {Promise<object>} the created transaction
     */
    async add(tx) {
      // TODO: Backend has not deployed POST /merchant/transactions yet (404)
      return await client.post('/api/v1/merchant/transactions', tx)
    },

    /**
     * @param {string} id
     * @param {object} patch
     * @returns {Promise<object>}
     */
    async update(id, patch) {
      // TODO: Backend has not deployed PATCH /merchant/transactions/:id yet (404)
      return await client.patch(`/api/v1/merchant/transactions/${id}`, patch)
    },
  }
}

export const transactionsRepository = createTransactionsRepository()
export default transactionsRepository
