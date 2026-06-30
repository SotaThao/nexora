/** Map VlinkPay UserVerifyStatus (/verified-status) to Nexora KYB session status. */
export function mapUserVerifyStatusToKybStatus(
  status: string | number | null | undefined,
): string | null {
  const normalized = String(status ?? '').trim()
  if (!normalized) return null

  switch (normalized) {
    case 'Verified':
      return 'kyb_approved'
    case 'Review':
      return 'kyb_pending'
    case 'Rejected':
      return 'kyb_rejected'
    case 'None':
      return 'basic'
    default:
      return null
  }
}

export function resolveEffectiveKybStatus(
  sessionStatus: string,
  liveVerifyStatus: string | undefined,
): string {
  const liveMapped = mapUserVerifyStatusToKybStatus(liveVerifyStatus)
  if (liveMapped && liveMapped !== 'basic') return liveMapped
  return sessionStatus
}
