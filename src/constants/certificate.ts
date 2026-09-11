/**
 * NEXORA TOUCH certificate status — mirrors the backend `CertificateStatus` enum, which is
 * serialized as a string (`JsonStringEnumConverter`).
 *
 * `Draft` never reaches this app: the public verify query filters drafts out server-side so an
 * unissued certificate and a made-up code return the same not-found, and the endpoint cannot be
 * used to probe certificates that are still being prepared. It is listed here to keep the mirror
 * complete rather than to be rendered.
 *
 * `Expired` is never persisted either — the backend computes it from `ExpiryDate` on read
 * (`Certificate.EffectiveStatus`), so a lapsed certificate reads as expired the moment it lapses,
 * with no scheduled job in between.
 */
export const CertificateStatus = {
  Draft: 'Draft',
  Active: 'Active',
  Revoked: 'Revoked',
  Expired: 'Expired',
} as const

export type CertificateStatusValue = (typeof CertificateStatus)[keyof typeof CertificateStatus]

/**
 * Denominator the printed certificate uses for the exam score ("94 / 100"). Only a fallback: if the
 * backend ever sends its own `examScoreMax`, that wins, because a programme could be marked out of
 * something other than 100 and a hard-coded 100 would then misreport a pass as a failure.
 */
export const CERTIFICATE_EXAM_SCORE_MAX_DEFAULT = 100
