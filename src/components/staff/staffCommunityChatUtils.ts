import { CommunityChatType } from '../../constants/communityChat'
import type { CommunityChatSession } from '../../types/communityChat'

export interface StaffChatMemberLike {
  id?: string
  staffProfileId?: string | null
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

function normalizeStaffDisplayName(member: StaffChatMemberLike): string {
  return String(member.nickname || member.displayName || member.fullName || '').trim().toLowerCase()
}

export function getStaffChatDisplayName(member: StaffChatMemberLike): string {
  return String(member.nickname || member.displayName || member.fullName || '').trim() || 'Staff'
}

/** Soft gate for UI — only block invites / pending. API decides account eligibility. */
export function canStaffMemberUseCommunityChat(member: StaffChatMemberLike | null | undefined): boolean {
  if (!member) return false
  if (member.itemType === 'invite') return false

  const status = String(member.status ?? member.apiStatus ?? '').trim()
  if (
    status === 'Pending'
    || status === 'Pending Setup'
    || status === 'Pending Acceptance'
    || status === 'WaitingStaffAcceptance'
    || status === 'StaffRejected'
  ) {
    return false
  }

  return Boolean(String(member.staffProfileId ?? '').trim())
}

export function resolveStaffChatParticipantStaffProfileId(
  member: StaffChatMemberLike,
): string | null {
  const staffProfileId = String(member.staffProfileId ?? '').trim()
  return staffProfileId || null
}

export function findStaffCommunityChatSession(
  member: StaffChatMemberLike,
  sessions: CommunityChatSession[],
  currentUserProfileId: string,
): CommunityChatSession | null {
  const staffName = normalizeStaffDisplayName(member)
  if (!staffName) return null

  return sessions.find((session) => {
    if (session.chatType !== CommunityChatType.OneOnOne) return false
    const other = session.participants.find(
      (participant) => participant.isActive && participant.userProfileId !== currentUserProfileId,
    )
    if (!other) return false
    return normalizeStaffDisplayName({ fullName: other.fullName }) === staffName
  }) ?? null
}
