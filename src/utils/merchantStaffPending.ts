import type { StaffMember } from '../types/domain'

const RESOLVED_STATUSES = new Set([
  'Active',
  'Accepted',
  'Inactive',
  'InActive',
  'Rejected',
  'StaffRejected',
  'Expired',
  'Cancelled',
])

const PENDING_API_STATUSES = new Set(['Pending', 'WaitingStaffAcceptance'])
const PENDING_DISPLAY_STATUSES = new Set([
  'Pending',
  'Pending Setup',
  'Pending Acceptance',
  'WaitingStaffAcceptance',
])

export function isWaitingStaffAcceptance(member?: StaffMember | null): boolean {
  if (!member) return false
  return (
    member.apiStatus === 'WaitingStaffAcceptance' ||
    member.status === 'WaitingStaffAcceptance' ||
    member.isWaitingStaffAcceptance === true
  )
}

/** Staff link / invite rows that are still unresolved (any pending workflow). */
export function isPendingStaffMember(member?: StaffMember | null): boolean {
  if (!member) return false
  if (member.itemType !== 'link' && member.itemType !== 'invite') return false

  const apiStatus = String(member.apiStatus || '')
  const status = String(member.status || '')

  if (RESOLVED_STATUSES.has(apiStatus) || RESOLVED_STATUSES.has(status)) return false
  if (member.isActive && apiStatus !== 'Pending' && status !== 'Pending Acceptance') return false

  return PENDING_API_STATUSES.has(apiStatus) || PENDING_DISPLAY_STATUSES.has(status)
}

/**
 * Merchant overview queue — pending link requests the salon owner can approve now.
 * Excludes invites waiting for staff signup and links waiting for staff acceptance.
 */
export function isMerchantConfirmablePending(member?: StaffMember | null): boolean {
  if (!isPendingStaffMember(member)) return false
  if (isWaitingStaffAcceptance(member)) return false
  if (member?.itemType === 'invite') return false
  return member?.itemType === 'link'
}

export function staffMemberMatchesAnyId(
  member: StaffMember,
  targetId: string,
): boolean {
  const ids = [member.id, member.linkId, member.staffLinkId, member.inviteId].filter(Boolean)
  return ids.some((id) => String(id) === String(targetId))
}
