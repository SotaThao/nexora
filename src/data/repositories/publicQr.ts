/**
 * publicQrRepository — Public QR resolver for physical card deep links.
 */
import httpClient from '../../lib/httpClient'
import type { ResolveQrCodePayload } from '../../types/domain'
import type { QrTouchPointApiDto, ResolveQrCodeResult } from '../../types/repositories'

type HttpClient = typeof httpClient

function readField<T>(dto: Record<string, unknown>, camel: string, pascal: string): T | undefined {
  return (dto[camel] ?? dto[pascal]) as T | undefined
}

function normalizeQrTouchPoint(dto: QrTouchPointApiDto | null | undefined) {
  if (!dto) return null
  const raw = dto as QrTouchPointApiDto & Record<string, unknown>
  const businessSlug = readField<string>(raw, 'businessSlug', 'BusinessSlug') ?? ''
  const slug = readField<string>(raw, 'slug', 'Slug') ?? ''
  if (!businessSlug || !slug) return null

  return {
    id: readField<string>(raw, 'id', 'Id') ?? '',
    name: readField<string>(raw, 'name', 'Name') ?? '',
    slug,
    type: readField<string>(raw, 'type', 'Type'),
    businessId: readField<string>(raw, 'businessId', 'BusinessId'),
    businessName: readField<string>(raw, 'businessName', 'BusinessName'),
    businessSlug,
  }
}

function normalizeResolveQrCodeResult(res: ResolveQrCodeResult | null | undefined): ResolveQrCodePayload {
  const raw = (res ?? {}) as ResolveQrCodeResult & Record<string, unknown>
  const status = readField<string>(raw, 'status', 'Status') ?? 'unknown'
  const touchPointSource = raw.touchPoint ?? raw.TouchPoint
  return {
    status,
    touchPoint: normalizeQrTouchPoint(touchPointSource as QrTouchPointApiDto | null | undefined),
  }
}

export function createPublicQrRepository(client: HttpClient = httpClient) {
  return {
    async resolveQrCode(cardCode: string): Promise<ResolveQrCodePayload> {
      const res = await client.get<ResolveQrCodeResult>(
        `/qr/${encodeURIComponent(cardCode)}`,
        { anonymous: true },
      )
      return normalizeResolveQrCodeResult(res)
    },

    /** GET /api/v1/public/qr — generates QR image bytes for arbitrary content. */
    async generateQrCode(content: string, size = 300): Promise<Blob> {
      return client.getBlob('/api/v1/public/qr', {
        anonymous: true,
        params: { content, size },
      })
    },
  }
}

const apiBaseUrl = (import.meta.env?.VITE_API_BASE_URL ?? '').replace(/\/$/, '')

/** Public QR image URL for use in `<img src>` (anonymous GET). */
export function buildPublicQrImageUrl(content: string, size = 300): string {
  const params = new URLSearchParams({ content, size: String(size) })
  return `${apiBaseUrl}/api/v1/public/qr?${params.toString()}`
}

export const publicQrRepository = createPublicQrRepository()
export default publicQrRepository
