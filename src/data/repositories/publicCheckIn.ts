/**
 * publicCheckInRepository — POS Public Check-In (customer scans the QR at the door and
 * checks in from their own phone). Anonymous, resolved by Business.Slug, same convention
 * as publicBooking.ts.
 *
 * Contract: POS-Public-Check-In-Technical.md §6. These routes are not on the deployed
 * Swagger yet (verified 2026-09-01 against test-api and localhost:5005) — the shapes here
 * mirror the kiosk `/api/v1/pos-device/self-checkin/*` DTOs the public handlers are copied
 * from, plus the three fields the doc adds (`receiptToken`, `canCheckInNow`,
 * `allowDuplicatePhone`). Re-check the live spec once BE ships.
 */
import httpClient from '../../lib/httpClient'
import type {
  PosPromotionApiDto,
  PublicCheckInActiveVisitApiDto,
  PublicCheckInBookingApiDto,
  PublicCheckInBookingPayload,
  PublicCheckInCustomerApiDto,
  PublicCheckInOrderPayload,
  PublicCheckInOrderResultApiDto,
  PublicCheckInPageApiDto,
  PublicCheckInStatusApiDto,
} from '../../types/repositories'
import { normalizePosPromotion } from './posPromotions'

type HttpClient = typeof httpClient

const basePath = (businessSlug: string) => `/api/v1/checkin/${encodeURIComponent(businessSlug)}`

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {}
}

function normalizeCheckInPage(raw: unknown): PublicCheckInPageApiDto {
  const dto = asRecord(raw)
  const promotionsRaw = dto.promotions ?? dto.Promotions
  const promotions: PosPromotionApiDto[] = Array.isArray(promotionsRaw)
    ? promotionsRaw.map(normalizePosPromotion).filter((p) => Boolean(p.id) && Boolean(p.name))
    : []

  return {
    ...(raw as PublicCheckInPageApiDto),
    promotions,
  }
}

export function createPublicCheckInRepository(client: HttpClient = httpClient) {
  return {
    /** Salon branding + service catalog + technicians + active promotions. 404 covers "no such
     * slug", "not public" and "public check-in disabled" alike — the server does not distinguish
     * (§6). */
    async getCheckInPage(businessSlug: string): Promise<PublicCheckInPageApiDto> {
      const raw = await client.get<unknown>(basePath(businessSlug), { anonymous: true })
      return normalizeCheckInPage(raw)
    },

    async getCustomerLookup(businessSlug: string, phone: string): Promise<PublicCheckInCustomerApiDto | null> {
      const res = await client.get<PublicCheckInCustomerApiDto | null>(
        `${basePath(businessSlug)}/customer-lookup`,
        { anonymous: true, params: { phone } },
      )
      return res ?? null
    },

    async getActiveVisit(businessSlug: string, phone: string): Promise<PublicCheckInActiveVisitApiDto | null> {
      const res = await client.get<PublicCheckInActiveVisitApiDto | null>(
        `${basePath(businessSlug)}/active-visit`,
        { anonymous: true, params: { phone } },
      )
      return res ?? null
    },

    async getBooking(businessSlug: string, phone: string): Promise<PublicCheckInBookingApiDto | null> {
      const res = await client.get<PublicCheckInBookingApiDto | null>(
        `${basePath(businessSlug)}/booking`,
        { anonymous: true, params: { phone } },
      )
      return res ?? null
    },

    async createOrder(
      businessSlug: string,
      payload: PublicCheckInOrderPayload,
    ): Promise<PublicCheckInOrderResultApiDto> {
      return await client.post<PublicCheckInOrderResultApiDto>(
        `${basePath(businessSlug)}/orders`,
        payload,
        { anonymous: true },
      )
    },

    /** Converts today's booking into a Waiting order instead of creating a second one. */
    async checkInBooking(
      businessSlug: string,
      payload: PublicCheckInBookingPayload,
    ): Promise<PublicCheckInOrderResultApiDto> {
      return await client.post<PublicCheckInOrderResultApiDto>(
        `${basePath(businessSlug)}/bookings/check-in`,
        payload,
        { anonymous: true },
      )
    },

    /** Status page handle. Not slug-scoped — the receipt token identifies the order alone. */
    async getStatus(receiptToken: string): Promise<PublicCheckInStatusApiDto> {
      return await client.get<PublicCheckInStatusApiDto>(
        `/api/v1/checkin/status/${encodeURIComponent(receiptToken)}`,
        { anonymous: true },
      )
    },
  }
}

export const publicCheckInRepository = createPublicCheckInRepository()
export default publicCheckInRepository
