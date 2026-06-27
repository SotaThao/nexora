import httpClient from '../../lib/httpClient'
import type { MerchantPaymentQr } from '../../types/domain'

type HttpClient = typeof httpClient

function readField<T>(raw: Record<string, unknown>, camel: string, pascal: string): T | undefined {
  return (raw[camel] ?? raw[pascal]) as T | undefined
}

function normalizeMerchantPaymentQr(raw: Record<string, unknown> | null | undefined): MerchantPaymentQr {
  const paymentUrl = readField<string>(raw ?? {}, 'paymentUrl', 'PaymentUrl') ?? ''
  const businessId = readField<string>(raw ?? {}, 'businessId', 'BusinessId') ?? ''
  return { paymentUrl, businessId }
}

export function createMerchantPaymentsRepository(client: HttpClient = httpClient) {
  return {
    async getPaymentQr(): Promise<MerchantPaymentQr> {
      const res = await client.get<Record<string, unknown>>('/api/v1/merchant/payments/qr')
      return normalizeMerchantPaymentQr(res)
    },
  }
}

export const merchantPaymentsRepository = createMerchantPaymentsRepository()
export default merchantPaymentsRepository
