import httpClient from '../../lib/httpClient'
import { payoutTypeToUiKey } from '../paymentMethodTypes'

type HttpClient = typeof httpClient

interface SupportedPaymentMethodApiDto {
  type?: string
  Type?: string
  sortOrder?: number
  SortOrder?: number
}

export interface SupportedPaymentMethod {
  type: string
  uiKey: string
  sortOrder: number
}

function readField<T>(raw: Record<string, unknown>, camel: string, pascal: string): T | undefined {
  if (raw[camel] !== undefined && raw[camel] !== null) return raw[camel] as T
  if (raw[pascal] !== undefined && raw[pascal] !== null) return raw[pascal] as T
  return undefined
}

function normalizeSupportedPaymentMethod(
  dto: SupportedPaymentMethodApiDto,
): SupportedPaymentMethod | null {
  const raw = dto as Record<string, unknown>
  const type = String(readField<string>(raw, 'type', 'Type') ?? '').trim()
  if (!type) return null
  const sortOrderRaw = readField<number>(raw, 'sortOrder', 'SortOrder')
  const sortOrder = Number(sortOrderRaw)
  return {
    type,
    uiKey: payoutTypeToUiKey(type),
    sortOrder: Number.isFinite(sortOrder) ? sortOrder : 0,
  }
}

export function createSupportedPaymentMethodsRepository(client: HttpClient = httpClient) {
  return {
    async getSupported(): Promise<SupportedPaymentMethod[]> {
      const res = await client.get<SupportedPaymentMethodApiDto[]>(
        '/api/v1/payment-methods/supported',
      )
      const items = Array.isArray(res)
        ? res
            .map(normalizeSupportedPaymentMethod)
            .filter((item): item is SupportedPaymentMethod => item != null)
        : []
      return items.sort((a, b) => a.sortOrder - b.sortOrder)
    },
  }
}

export const supportedPaymentMethodsRepository = createSupportedPaymentMethodsRepository()
export default supportedPaymentMethodsRepository
