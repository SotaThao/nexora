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
  packageCode: string
}

export interface InitializeCardPaymentResult {
  orderId: string
  referenceId: string
  clientSecret: string
  publishableKey: string
}

export interface SubscriptionPurchaseHistoryItem {
  orderId: string
  referenceId: string
  packageCode: string
  planName: string
  periodInMonths: number
  amount: number
  currency: string
  paymentStatus: 'Pending' | 'Paid' | 'Failed'
  createdAt: string
  paidAt: string | null
  validUntil: string | null
}

export interface SubscriptionPackage {
  id: string
  packageCode: string
  name: string
  featuresEn: string[]
  featuresVi: string[]
  price: number | null
  periodInMonths: number | null
}

export function createSubscriptionPaymentsRepository(client: HttpClient = httpClient) {
  return {
    async getPackages(): Promise<SubscriptionPackage[]> {
      const res = await client.get<SubscriptionPackage[]>('/api/v1/merchant/subscriptions/packages')
      return Array.isArray(res) ? res : []
    },

    async getPublicPackages(): Promise<SubscriptionPackage[]> {
      const res = await client.get<SubscriptionPackage[]>('/api/v1/public/subscription-packages')
      return Array.isArray(res) ? res : []
    },

    async getPaymentMethods(): Promise<SubscriptionPaymentMethod[]> {
      const res = await client.get<SubscriptionPaymentMethod[]>('/api/v1/merchant/subscriptions/payment-methods')
      return Array.isArray(res) ? res : []
    },

    async purchase(packageId: string, symbol: string): Promise<PurchaseSubscriptionResult> {
      return client.post<PurchaseSubscriptionResult>('/api/v1/merchant/subscriptions/purchase', { packageId, symbol })
    },

    async initializeCardPayment(packageId: string): Promise<InitializeCardPaymentResult> {
      return client.post<InitializeCardPaymentResult>(
        '/api/v1/merchant/subscriptions/purchase/card/initialize',
        { packageId },
      )
    },

    async getPurchaseHistory(): Promise<SubscriptionPurchaseHistoryItem[]> {
      const res = await client.get<SubscriptionPurchaseHistoryItem[]>(
        '/api/v1/merchant/subscriptions/purchase-history',
      )
      return Array.isArray(res) ? res : []
    },
  }
}

export const subscriptionPaymentsRepository = createSubscriptionPaymentsRepository()
export default subscriptionPaymentsRepository
