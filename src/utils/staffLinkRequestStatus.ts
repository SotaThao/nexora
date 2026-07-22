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
