import { useMemo } from 'react'
import { useAuth } from '../../auth/useAuth'
import { useCommunityChatSessions } from '../../data/hooks/useCommunityChat'
import {
  buildStaffChatUnreadCountByPeerId,
  getStaffMemberChatUnreadCount,
  type StaffChatMemberLike,
} from './staffCommunityChatUtils'
import { useCommunityChatRealtime } from '../header-messages/useCommunityChatRealtime'

/**
 * Unread 1:1 community-chat counts keyed by peer userProfileId (normalized).
 * Loads sessions + hub so the staff roster unread dot stays live.
 */
export function useStaffCommunityChatUnreadByPeerId({ enabled = true } = {}) {
  const { session, status } = useAuth()
  const currentUserProfileId = session?.id ?? ''
  const canLoad = enabled && status === 'authenticated'

  useCommunityChatRealtime({ enabled: canLoad })
  const sessionsQuery = useCommunityChatSessions({ enabled: canLoad })

  const unreadByPeerId = useMemo(
    () => buildStaffChatUnreadCountByPeerId(
      sessionsQuery.data ?? [],
      currentUserProfileId,
    ),
    [currentUserProfileId, sessionsQuery.data],
  )

  return {
    unreadByPeerId,
    getUnreadCount: (member: StaffChatMemberLike | null | undefined) => (
      getStaffMemberChatUnreadCount(unreadByPeerId, member)
    ),
  }
}
