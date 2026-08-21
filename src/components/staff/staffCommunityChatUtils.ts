import { CommunityChatType } from '../../constants/communityChat'
import {
  getOneOnOnePeerParticipant,
  isSameCommunityChatProfileId,
  preferCommunityChatSession,
} from '../../data/communityChatSessionUtils'
import type { CommunityChatSession } from '../../types/communityChat'

/** Fallback when staff nickname/displayName/fullName are all empty. */
export const STAFF_CHAT_FALLBACK_DISPLAY_NAME = 'Staff' as const

/** Staff statuses that cannot open community chat yet. */
export const STAFF_CHAT_BLOCKED_STATUSES = new Set([
  'Pending',
  'Pending Setup',
  'Pending Acceptance',
  'WaitingStaffAcceptance',
  'StaffRejected',
])

export interface StaffChatMemberLike {
  id?: string
  staffProfileId?: string | null
  userProfileId?: string | null
  staffCode?: string | null
  fullName?: string
  nickname?: string
  displayName?: string
  isLocalStaff?: boolean
  isActive?: boolean
  status?: string | null
  apiStatus?: string | null
  itemType?: string | null
}

export function getStaffChatDisplayName(member: StaffChatMemberLike): string {
  return String(member.nickname || member.displayName || member.fullName || '').trim()
    || STAFF_CHAT_FALLBACK_DISPLAY_NAME
}

function normalizeStaffDisplayName(member: StaffChatMemberLike): string {
  return getStaffChatDisplayName(member).toLowerCase()
}

/**
 * Soft gate for UI chat affordance.
 * Local staff (no Nexora account) and members without userProfileId cannot chat.
 */
export function canStaffMemberUseCommunityChat(member: StaffChatMemberLike | null | undefined): boolean {
  if (!member) return false
  if (member.itemType === 'invite') return false
  if (member.isLocalStaff) return false
  if (!String(member.userProfileId ?? '').trim()) return false

  const status = String(member.status ?? member.apiStatus ?? '').trim()
  if (STAFF_CHAT_BLOCKED_STATUSES.has(status)) return false

  return true
}

/**
 * StaffDetailByCodeDto does not include `userProfileId` (list DTO does).
 * Prefer detail fields, but fill chat identity from a list/cache match when missing.
 */
export function enrichStaffMemberChatIdentity<T extends StaffChatMemberLike>(
  detail: T | null | undefined,
  listItem: StaffChatMemberLike | null | undefined,
): T | StaffChatMemberLike | null {
  if (!detail && !listItem) return null
  if (!detail) return listItem ?? null
  if (!listItem) return detail

  const detailUserProfileId = String(detail.userProfileId ?? '').trim()
  const listUserProfileId = String(listItem.userProfileId ?? '').trim()

  return {
    ...listItem,
    ...detail,
    userProfileId: detailUserProfileId || listUserProfileId || null,
    isLocalStaff: detail.isLocalStaff ?? listItem.isLocalStaff ?? false,
  }
}

/** `userProfileId` from GET /merchant/staff — required by POST /community/chat/sessions. */
export function resolveStaffChatParticipantUserProfileId(
  member: StaffChatMemberLike,
): string | null {
  const userProfileId = String(member.userProfileId ?? '').trim()
  return userProfileId || null
}

/** @deprecated Use resolveStaffChatParticipantUserProfileId — sessions expect userProfileId, not staffProfileId. */
export function resolveStaffChatParticipantStaffProfileId(
  member: StaffChatMemberLike,
): string | null {
  return resolveStaffChatParticipantUserProfileId(member)
}

export function findStaffCommunityChatSession(
  member: StaffChatMemberLike,
  sessions: CommunityChatSession[],
  currentUserProfileId: string,
): CommunityChatSession | null {
  const participantUserProfileId = resolveStaffChatParticipantUserProfileId(member)
  const staffName = normalizeStaffDisplayName(member)
  if (!participantUserProfileId && !staffName) return null

  const matches = sessions.filter((session) => {
    if (session.chatType !== CommunityChatType.OneOnOne) return false
    const other = getOneOnOnePeerParticipant(session, currentUserProfileId)
    if (!other) return false
    if (participantUserProfileId) {
      return isSameCommunityChatProfileId(other.userProfileId, participantUserProfileId)
    }
    return normalizeStaffDisplayName({ fullName: other.fullName }) === staffName
  })

  if (matches.length === 0) return null
  return matches.reduce(preferCommunityChatSession)
}
