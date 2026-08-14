import httpClient from '../../lib/httpClient'
import type {
  CreateDirectPaymentResult,
  PublicDirectPaymentMethod,
  PublicStaffDirectPaymentPage,
} from '../../types/domain'
import { toVlinkpayCryptoSymbolWire } from '../../components/payout/vlinkpayWallet'
import publicDirectPaymentRepository, {
  normalizeCreatePaymentResult,
  normalizePublicPaymentMethod,
} from './publicDirectPayment'

type HttpClient = typeof httpClient

function readField<T>(raw: Record<string, unknown>, camel: string, pascal: string): T | undefined {
  return (raw[camel] ?? raw[pascal]) as T | undefined
}

function normalizeStaffPaymentPage(raw: Record<string, unknown> | null | undefined): PublicStaffDirectPaymentPage {
  const source = raw ?? {}
  const methodsRaw = (source.paymentMethods ?? source.PaymentMethods ?? []) as Record<string, unknown>[]
  const paymentMethods = methodsRaw
    .map((item) => normalizePublicPaymentMethod(item))
    .filter((item): item is PublicDirectPaymentMethod => Boolean(item))

  return {
    staffProfileId: readField<string>(source, 'staffProfileId', 'StaffProfileId') ?? '',
    displayName: readField<string>(source, 'displayName', 'DisplayName') ?? '',
    photoUrl: readField<string | null>(source, 'photoUrl', 'PhotoUrl') ?? null,
    paymentUrl: readField<string>(source, 'paymentUrl', 'PaymentUrl') ?? '',
    paymentMethods,
  }
}

export function createPublicStaffPaymentRepository(client: HttpClient = httpClient) {
  return {
    async getPaymentPage(staffProfileId: string): Promise<PublicStaffDirectPaymentPage> {
      const res = await client.get<Record<string, unknown>>(
        `/api/v1/public/staff/${encodeURIComponent(staffProfileId)}/payment`,
        { anonymous: true },
      )
      return normalizeStaffPaymentPage(res)
    },

    async createPayment(
      staffProfileId: string,
      payload: { staffPaymentMethodId: string; amount: number; cryptoSymbol?: string },
    ): Promise<CreateDirectPaymentResult> {
      const body: Record<string, unknown> = {
        staffPaymentMethodId: payload.staffPaymentMethodId,
        amount: payload.amount,
      }
      const cryptoSymbol = toVlinkpayCryptoSymbolWire(payload.cryptoSymbol)
      if (cryptoSymbol) body.cryptoSymbol = cryptoSymbol
      const res = await client.post<Record<string, unknown>>(
        `/api/v1/public/staff/${encodeURIComponent(staffProfileId)}/payments`,
        body,
        { anonymous: true },
      )
      return normalizeCreatePaymentResult(res)
    },

    confirmPayment(paymentId: string): Promise<void> {
      return publicDirectPaymentRepository.confirmPayment(paymentId)
    },
  }
}

export const publicStaffPaymentRepository = createPublicStaffPaymentRepository()
export default publicStaffPaymentRepository
