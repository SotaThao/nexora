/**
 * publicOneQrRepository — the page a scanner lands on (`/o/{businessSlug}`).
 *
 * Contract verified against the live backend Swagger on 2026-08-31
 * (`OneQrLandingDto`). The endpoint is `[AllowAnonymous]` but role-aware: it
 * *reads* the Authorization header when one exists to decide Customer vs Staff
 * vs Owner. So this is NOT an unconditionally-anonymous repository like
 * `publicTouch` — callers pass `anonymous` based on whether a token is stored.
 * An expired or invalid token never yields a 401 here; the backend downgrades
 * the scanner to Customer.
 */

import httpClient from '../../lib/httpClient'
import { ONEQR_ROUTE, type OneQrAudience } from '../../constants/oneQr'
import { toOneQrAudience, toOneQrModuleKey } from './merchantOneQr'
import type {
  OneQrLanding,
  OneQrLandingModule,
  OneQrLandingStatus,
} from '../../types/oneQr'

type HttpClient = typeof httpClient
type Raw = Record<string, unknown>

const BASE = '/api/v1/oneqr'

function str(value: unknown): string {
  return value == null ? '' : String(value)
}

function nullableStr(value: unknown): string | null {
  if (value == null) return null
  const trimmed = String(value).trim()
  return trimmed === '' ? null : trimmed
}

/**
 * `status` is a plain string on the wire with no enum to pin it down, so match
 * loosely and default to `active`. Defaulting the other way would show a
 * "paused" screen for an unrecognised value — worse, because the QR is printed
 * and out in the world.
 */
function toLandingStatus(value: unknown): OneQrLandingStatus {
  const raw = str(value).trim().toLowerCase()
  if (!raw) return 'active'
  if (raw.includes('notfound') || raw.includes('not_found') || raw.includes('missing')) {
    return 'notFound'
  }
  if (raw.includes('paus') || raw.includes('inactive') || raw.includes('disabled')) {
    return 'paused'
  }
  return 'active'
}

function normalizeModule(raw: Raw): OneQrLandingModule {
  return {
    moduleKey: toOneQrModuleKey(raw.moduleKey),
    label: str(raw.label),
    icon: nullableStr(raw.icon),
    url: str(raw.url),
  }
}

export function normalizeOneQrLanding(raw: unknown): OneQrLanding | null {
  if (!raw || typeof raw !== 'object') return null
  const source =
    (raw as Raw).data && typeof (raw as Raw).data === 'object'
      ? ((raw as Raw).data as Raw)
      : (raw as Raw)

  const business =
    source.business && typeof source.business === 'object'
      ? (source.business as Raw)
      : {}

  // Server order is the display order — the DTO carries no sortOrder.
  const modules = Array.isArray(source.modules)
    ? (source.modules as Raw[])
        .map(normalizeModule)
        // A tile with no destination would render as a dead link.
        .filter((module) => Boolean(module.url))
    : []

  return {
    status: toLandingStatus(source.status),
    business: {
      id: str(business.id),
      name: str(business.name),
      slug: str(business.slug),
      logoUrl: nullableStr(business.logoUrl),
    },
    requiresAuth: source.requiresAuth === true,
    audience: toOneQrAudience(source.audience),
    welcomeMessage: nullableStr(source.welcomeMessage),
    canViewAsCustomer: source.canViewAsCustomer === true,
    modules,
  }
}

export function createPublicOneQrRepository(client: HttpClient = httpClient) {
  return {
    async getLanding({
      businessSlug,
      sessionId,
      asCustomer = false,
      anonymous = true,
    }: {
      businessSlug: string
      sessionId: string
      /** Backs the "View as customer" button — forces the Customer view. */
      asCustomer?: boolean
      anonymous?: boolean
    }): Promise<OneQrLanding | null> {
      const params: Record<string, string> = { sessionId }
      if (asCustomer) params[ONEQR_ROUTE.asQuery] = ONEQR_ROUTE.asCustomerValue

      const raw = await client.get<Raw>(
        `${BASE}/${encodeURIComponent(businessSlug)}`,
        { anonymous, params },
      )
      return normalizeOneQrLanding(raw)
    },

    /**
     * Fire-and-forget tile-click tracking — it must never block navigation, so
     * the caller ignores rejection. Dedupe by (sessionId, moduleKey) happens
     * server-side inside a 5s window.
     */
    async trackModuleClick({
      businessSlug,
      moduleKey,
      sessionId,
      audience,
      anonymous = true,
    }: {
      businessSlug: string
      moduleKey: string
      sessionId: string
      audience: OneQrAudience
      anonymous?: boolean
    }): Promise<void> {
      await client.post(
        `${BASE}/${encodeURIComponent(businessSlug)}/track`,
        // `businessSlug` is in the command body as well as the route.
        { businessSlug, moduleKey, audience, sessionId },
        { anonymous },
      )
    },
  }
}

export const publicOneQrRepository = createPublicOneQrRepository()
export default publicOneQrRepository
