/**
 * publicTouchRepository — Public customer touch API integration.
 */

import httpClient from '../../lib/httpClient'
import type { CreateReviewVars, CreateTipVars, SkipTipVars } from '../../types/hooks'
import type { PaymentMethodDto } from '../../types/domain'
import { normalizeTouchPageData } from './normalizeTouchPage'
import { normalizePaymentMethodDto } from './paymentMethodDto'

type HttpClient = typeof httpClient

const PAYMENT_METHOD_MAP: Record<string, string> = {
  CashApp: 'CashApp',
  Venmo: 'Venmo',
  Zelle: 'Zelle',
  PayPal: 'PayPal',
  AppleCash: 'AppleCash',
  BankWire: 'BankWire',
  bankwire: 'BankWire',
  VlinkPay: 'VlinkPay',
  vlinkpay: 'VlinkPay',
}

function toWireMethod(uiMethod: string): string {
  return PAYMENT_METHOD_MAP[uiMethod] ?? uiMethod
}

export function createPublicTouchRepository(client: HttpClient = httpClient) {
  return {
    async getTouchPage({
      businessSlug,
      touchPointSlug,
      sessionId,
    }: {
      businessSlug: string
      touchPointSlug: string
      sessionId: string
    }) {
      const raw = await client.get<LooseObject>(
        `/api/v1/touch/${encodeURIComponent(businessSlug)}/${encodeURIComponent(touchPointSlug)}`,
        { anonymous: true, params: { sessionId } },
      )
      return normalizeTouchPageData(raw)
    },

    async getTipPaymentMethods(tipId: string): Promise<PaymentMethodDto[]> {
      const raw = await client.get<Array<Record<string, unknown>>>(
        `/api/v1/tips/${encodeURIComponent(tipId)}/payment-methods`,
        { anonymous: true },
      )
      if (!Array.isArray(raw)) return []
      return raw.map((item) => normalizePaymentMethodDto(item as Parameters<typeof normalizePaymentMethodDto>[0]))
    },

    async getPaymentLink({
      staffId,
      method,
      amount,
      cryptoSymbol,
    }: {
      staffId: string
      method: string
      amount: number
      /** Required when method is VlinkPay. */
      cryptoSymbol?: string
    }) {
      const params: Record<string, string | number> = {
        staffId,
        method: toWireMethod(method),
        amount,
      }
      const symbol = String(cryptoSymbol || '').trim()
      if (symbol) params.cryptoSymbol = symbol
      return client.get<LooseObject>('/api/v1/touch/payment-link', {
        anonymous: true,
        params,
      })
    },

    async createTip(args: CreateTipVars) {
      const body: Record<string, unknown> = {
        touchPointId: args.touchPointId,
        staffProfileId: args.staffProfileId,
        amount: args.amount,
        paymentMethod: toWireMethod(args.paymentMethod),
        sessionId: args.sessionId,
      }
      const symbol = String(args.cryptoSymbol || '').trim()
      if (symbol) body.cryptoSymbol = symbol
      return client.post<LooseObject>('/api/v1/touch/tip', body, { anonymous: true })
    },

    async confirmTip(tipId: string) {
      return client.post<LooseObject>(
        `/api/v1/touch/tip/${encodeURIComponent(tipId)}/confirm`,
        {},
        { anonymous: true },
      )
    },

    async skipTip(args: SkipTipVars) {
      return client.post<LooseObject>(
        '/api/v1/touch/tip/skip',
        args,
        { anonymous: true },
      )
    },

    async createReview(args: CreateReviewVars) {
      return client.post<LooseObject>(
        '/api/v1/touch/review',
        args,
        { anonymous: true },
      )
    },

    async trackGoogle(reviewId: string) {
      return client.post<LooseObject>(
        `/api/v1/touch/review/${encodeURIComponent(reviewId)}/track-google`,
        {},
        { anonymous: true },
      )
    },

    async trackYelp(reviewId: string) {
      return client.post<LooseObject>(
        `/api/v1/touch/review/${encodeURIComponent(reviewId)}/track-yelp`,
        {},
        { anonymous: true },
      )
    },
  }
}

export const publicTouchRepository = createPublicTouchRepository()
export default publicTouchRepository
