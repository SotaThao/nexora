import {
  CommunityChatType,
  buildPendingCommunityChatSessionId,
} from '../../constants/communityChat'
import {
  getOneOnOnePeerParticipant,
  isSameCommunityChatProfileId,
  preferCommunityChatSession,
} from '../../data/communityChatSessionUtils'
import type { CommunityChatSession } from '../../types/communityChat'
import {
  HeaderMessageListPreviewKey,
  type HeaderMessageConversation,
} from '../header-messages/headerMessagesConstants'
import { getHeaderMessageContactInitials } from '../header-messages/headerMessagesMappers'
import {
  STAFF_CHAT_BLOCKED_STATUSES,
  STAFF_CHAT_FALLBACK_DISPLAY_NAME,
  STAFF_CHAT_WINDOW_KEY_FALLBACK,
  StaffChatUnavailableReason,
} from './constants'

export {
  STAFF_CHAT_BLOCKED_STATUSES,
  STAFF_CHAT_FALLBACK_DISPLAY_NAME,
  STAFF_CHAT_WINDOW_KEY_FALLBACK,
  StaffChatUnavailableReason,
} from './constants'

export {
  isPendingCommunityChatSessionId as isPendingStaffChatSessionId,
  buildPendingCommunityChatSessionId as buildPendingStaffChatSessionId,
} from '../../constants/communityChat'

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

/** Stable key for multi-window staff chat (dedupe open windows). */
export function getStaffChatWindowKey(member: StaffChatMemberLike | null | undefined): string {
  if (!member) return ''
  return String(
    member.userProfileId
      || member.staffCode
      || member.staffProfileId
      || member.id
      || '',
  ).trim()
}

export function resolveStaffChatWindowKey(
  member: StaffChatMemberLike | null | undefined,
): string {
  return getStaffChatWindowKey(member) || STAFF_CHAT_WINDOW_KEY_FALLBACK
}

export function buildStaffChatConversation(params: {
  chatSessionId: string | null | undefined
  windowKey: string
  displayName: string
}): HeaderMessageConversation {
  const displayName = params.displayName
  return {
    id: params.chatSessionId || buildPendingCommunityChatSessionId(params.windowKey),
    name: displayName,
    initials: getHeaderMessageContactInitials(displayName),
    chatType: CommunityChatType.OneOnOne,
    previewKey: HeaderMessageListPreviewKey.Desktop,
    updatedAt: '',
    unreadCount: 0,
  }
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
  return !STAFF_CHAT_BLOCKED_STATUSES.has(status)
}

export function resolveStaffChatUnavailableReason(params: {
  chatAvailable: boolean
  participantUserProfileId: string | null
  hasExistingSession: boolean
}): StaffChatUnavailableReason | null {
  if (!params.chatAvailable) return StaffChatUnavailableReason.Ineligible
  if (!params.participantUserProfileId && !params.hasExistingSession) {
    return StaffChatUnavailableReason.NoUserProfile
  }
  return null
}

/**
 * Prefer detail fields; if detail omits `userProfileId`, fill from list/cache match.
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
