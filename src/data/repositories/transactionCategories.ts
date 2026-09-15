/**
 * transactionCategoriesRepository — Income/Payout Categories (issue #584).
 *
 * Verified 2026-09-10 against the backend source (sibling repo `vlink-nexora`,
 * `feature/584-category` branch, now running locally on `https://localhost:5005` per
 * `.env.development`): `MerchantTransactionCategoriesController`/`StaffTransactionCategoriesController`,
 * `GetTransactionCategoriesQuery`, `GetIncomeByCategoryStatsQuery`, `CreateTransactionCategoryCommand`,
 * `UpdateTransactionCategoryCommand`. Not yet on the shared `test-api.nexoratouch.com` Swagger.
 *
 * `list`/`getIncomeStats` still fall back to empty on 404, matching `myCertificates.ts` — the
 * environment that has no server at all yet and one with a server but zero rows should look the
 * same to a viewer.
 */
import httpClient from '../../lib/httpClient'
import { isApiError } from '../../types/domain'
import type { IncomeByCategoryStats, TransactionCategory } from '../../types/domain'
import type {
  IncomeByCategoryStatsApiDto,
  TransactionCategoryApiDto,
} from '../../types/repositories'
import type { IncomeCategoryPeriodValue } from '../../constants/incomeCategoryPeriod'

type HttpClient = typeof httpClient

/** Matches `GetIncomeByCategoryStatsQuery` exactly — no single opaque `periodValue`. */
export interface IncomeByCategoryStatsQuery {
  period: IncomeCategoryPeriodValue
  year?: number
  month?: number
  /** ISO-8601 week number. */
  week?: number
}

function isNotFound(err: unknown): boolean {
  if (isApiError(err) && err.status === 404) return true
  if (typeof err === 'object' && err !== null && 'response' in err) {
    return (err as { response?: { status?: number } }).response?.status === 404
  }
  return false
}

function normalizeCategory(raw: TransactionCategoryApiDto): TransactionCategory {
  return {
    id: String(raw?.id ?? ''),
    name: String(raw?.name ?? ''),
    displayOrder: Number(raw?.displayOrder ?? 0),
  }
}

function normalizeStats(raw: IncomeByCategoryStatsApiDto | null | undefined): IncomeByCategoryStats {
  const items = Array.isArray(raw?.items) ? raw!.items : []
  return {
    items: items.map((item) => ({
      categoryId: item?.categoryId ?? null,
      categoryName: item?.categoryName ?? '',
      amount: Number(item?.amount ?? 0),
      transactionCount: Number(item?.transactionCount ?? 0),
    })),
    totalAmount: Number(raw?.totalAmount ?? 0),
  }
}

const EMPTY_STATS: IncomeByCategoryStats = { items: [], totalAmount: 0 }

function buildStatsParams(query: IncomeByCategoryStatsQuery) {
  const params: Record<string, string | number> = { period: query.period }
  if (query.year != null) params.year = query.year
  if (query.month != null) params.month = query.month
  if (query.week != null) params.week = query.week
  return params
}

export function createTransactionCategoriesRepository(client: HttpClient, basePath: string) {
  return {
    async list(): Promise<TransactionCategory[]> {
      try {
        const res = await client.get<TransactionCategoryApiDto[]>(basePath)
        return (res ?? []).map(normalizeCategory)
      } catch (err: unknown) {
        if (isNotFound(err)) return []
        throw err
      }
    },

    /** `CreateTransactionCategoryCommand` returns just the new id (201 `Guid`), not the full DTO. */
    async create(name: string): Promise<{ id: string }> {
      const id = await client.post<string>(basePath, { name })
      return { id: String(id) }
    },

    /** `UpdateTransactionCategoryCommand` returns `bool` (200), not the full DTO. */
    async update(categoryId: string, name: string): Promise<boolean> {
      return await client.put<boolean>(`${basePath}/${encodeURIComponent(categoryId)}`, { name })
    },

    async remove(categoryId: string): Promise<void> {
      await client.del<boolean>(`${basePath}/${encodeURIComponent(categoryId)}`)
    },

    async getIncomeStats(query: IncomeByCategoryStatsQuery): Promise<IncomeByCategoryStats> {
      try {
        const res = await client.get<IncomeByCategoryStatsApiDto>(`${basePath}/stats`, {
          params: buildStatsParams(query),
        })
        return normalizeStats(res)
      } catch (err: unknown) {
        if (isNotFound(err)) return EMPTY_STATS
        throw err
      }
    },
  }
}

export const merchantTransactionCategoriesRepository = createTransactionCategoriesRepository(
  httpClient,
  '/api/v1/merchant/transaction-categories',
)
export const staffTransactionCategoriesRepository = createTransactionCategoriesRepository(
  httpClient,
  '/api/v1/staff/transaction-categories',
)
