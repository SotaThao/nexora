/**
 * publicTouchRepository — Public customer touch API integration.
 */

import httpClient from '../../lib/httpClient'
import type { CreateReviewVars, CreateTipVars, SkipTipVars } from '../../types/hooks'
import { normalizeTouchPageData } from './normalizeTouchPage'

type HttpClient = typeof httpClient

const PAYMENT_METHOD_MAP: Record<string, string> = {
  CashApp: 'CashApp',
  Venmo: 'Venmo',
  Zelle: 'Zelle',
  PayPal: 'PayPal',
  AppleCash: 'AppleCash',
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

    async getPaymentLink({
      staffId,
      method,
      amount,
    }: {
      staffId: string
      method: string
      amount: number
    }) {
      return client.get<LooseObject>('/api/v1/touch/payment-link', {
        anonymous: true,
        params: { staffId, method: toWireMethod(method), amount },
      })
    },

    async createTip(args: CreateTipVars) {
      return client.post<LooseObject>(
        '/api/v1/touch/tip',
        {
          touchPointId: args.touchPointId,
          staffProfileId: args.staffProfileId,
          amount: args.amount,
          paymentMethod: toWireMethod(args.paymentMethod),
          sessionId: args.sessionId,
        },
        { anonymous: true },
      )
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
