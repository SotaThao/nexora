import httpClient from '../../lib/httpClient'

type HttpClient = typeof httpClient

export interface SubscriptionPaymentMethod {
  name: string
  symbol: string
  balance: number
  rate: number
  icon: string
}

export type PurchasableSubscriptionPlan = 'Starter' | 'Pro'

export interface PurchaseSubscriptionResult {
  orderId: string
  referenceId: string
  paymentStatus: 'Pending' | 'Paid' | 'Failed'
  plan: PurchasableSubscriptionPlan
}

export function createSubscriptionPaymentsRepository(client: HttpClient = httpClient) {
  return {
    async getPaymentMethods(): Promise<SubscriptionPaymentMethod[]> {
      const res = await client.get<SubscriptionPaymentMethod[]>('/api/v1/merchant/subscriptions/payment-methods')
      return Array.isArray(res) ? res : []
    },

    async purchase(plan: PurchasableSubscriptionPlan, symbol: string): Promise<PurchaseSubscriptionResult> {
      return client.post<PurchaseSubscriptionResult>('/api/v1/merchant/subscriptions/purchase', { plan, symbol })
    },
  }
}

export const subscriptionPaymentsRepository = createSubscriptionPaymentsRepository()
export default subscriptionPaymentsRepository
