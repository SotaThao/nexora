/** Local sentinel for a link request whose record no longer exists server-side (404). */
export const STAFF_LINK_REQUEST_GONE_STATUS = '__gone__'

const RESOLVED_STAFF_LINK_REQUEST_STATUSES = new Set([
  'active',
  'accepted',
  'cancelled',
  'canceled',
  'declined',
  'expired',
  'inactive',
  'rejected',
  'staffrejected',
  STAFF_LINK_REQUEST_GONE_STATUS,
])

/**
 * Whether a staff link request can still be approved or rejected.
 *
 * The link-request endpoint exposes `status` as an open string, so new waiting
 * status values must remain actionable until the server explicitly marks the
 * request as resolved.
 */
export function isStaffLinkRequestActionable(status: string | null | undefined): boolean {
  const normalizedStatus = status?.trim().toLowerCase()
  return !normalizedStatus || !RESOLVED_STAFF_LINK_REQUEST_STATUSES.has(normalizedStatus)
}

export function isLoadedStaffLinkRequestActionable(
  isSuccess: boolean,
  detail: { status?: string | null } | null | undefined,
): boolean {
  return isSuccess && Boolean(detail) && isStaffLinkRequestActionable(detail?.status)
}
