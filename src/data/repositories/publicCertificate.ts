/**
 * publicCertificateRepository — verifies a NEXORA TOUCH certificate from the code printed on it.
 *
 * Anonymous: the certificate code in the URL is the only credential, same convention as
 * publicReceipt.ts. The endpoint is rate limited server-side (10 requests/minute per IP) because
 * the code is sequential and therefore guessable, so callers must treat 429 as a real outcome and
 * not retry through it.
 */
import httpClient from '../../lib/httpClient'
import type { CertificateVerificationApiDto } from '../../types/repositories'

type HttpClient = typeof httpClient

/**
 * A score of 0 is a real result, so this cannot use `|| null` — only a genuinely absent, non-numeric
 * or negative value becomes null. Null is what tells the page to leave the column out entirely.
 */
function normalizeScore(raw: unknown): number | null {
  if (raw === null || raw === undefined || raw === '') return null
  const value = Number(raw)
  return Number.isFinite(value) && value >= 0 ? value : null
}

function normalizeCertificate(raw: CertificateVerificationApiDto): CertificateVerificationApiDto {
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
    // A max of 0 would make the score unreadable ("94 / 0"), so it has to be positive to be used.
    examScoreMax: normalizeScore(raw?.examScoreMax) || null,
  }
}

export function createPublicCertificateRepository(client: HttpClient = httpClient) {
  return {
    async verifyCertificate(certificateId: string): Promise<CertificateVerificationApiDto> {
      const raw = await client.get<CertificateVerificationApiDto>(
        `/api/v1/public/certifications/${encodeURIComponent(certificateId)}`,
        { anonymous: true },
      )
      return normalizeCertificate(raw)
    },
  }
}

export const publicCertificateRepository = createPublicCertificateRepository()
export default publicCertificateRepository
