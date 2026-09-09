/**
 * myCertificatesRepository — the certificates issued to the signed-in account.
 *
 * **The endpoint does not exist yet.** The backend has admin-only certificate endpoints
 * (`api/v1/Admin/certifications`, gated on the Admin policy, so a member cannot call them) and one
 * anonymous verify-by-id endpoint. A "mine" list is named in the technical spec's out-of-scope
 * section: *"Màn hình 'chứng chỉ của tôi' cho member — RecipientUserProfileId đã có sẵn để query,
 * chưa có UI"*. The path below is the FE's proposal; see US-048's "cần hỏi BE" section.
 *
 * Until it ships, a 404/403 from here surfaces as the empty state rather than an error screen — a
 * member with no certificates and a member whose endpoint is not deployed look the same, which is
 * the right outcome for both.
 */
import httpClient from '../../lib/httpClient'
import type { CertificateVerificationApiDto } from '../../types/repositories'

type HttpClient = typeof httpClient

/** A score of 0 is a real result, so absence — not falsiness — is what makes this null. */
function normalizeScore(raw: unknown): number | null {
  if (raw === null || raw === undefined || raw === '') return null
  const value = Number(raw)
  return Number.isFinite(value) && value >= 0 ? value : null
}

export function normalizeMyCertificate(raw: any): CertificateVerificationApiDto {
  return {
    certificateId: String(raw?.certificateId ?? ''),
    memberName: String(raw?.memberName ?? ''),
    programCode: String(raw?.programCode ?? ''),
    programName: String(raw?.programName ?? ''),
    programDescription: raw?.programDescription ?? null,
    certificationDate: String(raw?.certificationDate ?? ''),
    expiryDate: raw?.expiryDate ?? null,
    status: String(raw?.status ?? ''),
    revokedAt: raw?.revokedAt ?? null,
    examScore: normalizeScore(raw?.examScore),
    examScoreMax: normalizeScore(raw?.examScoreMax) || null,
  }
}

/**
 * Accepts either a bare array or the `PaginatedList` wrapper the admin certificate endpoints use,
 * because which one a "mine" endpoint returns is exactly the sort of thing that gets decided after
 * this code is written.
 */
export function extractCertificateList(payload: unknown): CertificateVerificationApiDto[] {
  const rows = Array.isArray(payload)
    ? payload
    : Array.isArray((payload as { items?: unknown })?.items)
      ? (payload as { items: unknown[] }).items
      : Array.isArray((payload as { data?: unknown })?.data)
        ? (payload as { data: unknown[] }).data
        : []
  return rows.map(normalizeMyCertificate).filter((row) => row.certificateId)
}

export function createMyCertificatesRepository(client: HttpClient = httpClient) {
  return {
    async listMyCertificates(): Promise<CertificateVerificationApiDto[]> {
      const payload = await client.get<unknown>('/api/v1/certifications/me')
      return extractCertificateList(payload)
    },
  }
}

export const myCertificatesRepository = createMyCertificatesRepository()
export default myCertificatesRepository
