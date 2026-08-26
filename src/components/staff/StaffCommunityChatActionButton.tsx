import { MessagesSquare } from 'lucide-react'
import { useTranslation } from '../../contexts/LanguageContext'
import IconButton from '../ui/IconButton'
import { openStaffCommunityChat } from '../header-messages/openCommunityChatSession'
import { STAFF_CHAT_UNREAD_DOT_CLASS } from './constants'
import {
  getStaffChatDisplayName,
  type StaffChatMemberLike,
} from './staffCommunityChatUtils'

interface StaffCommunityChatActionButtonProps {
  member: StaffChatMemberLike
  unreadCount?: number
}

export default function StaffCommunityChatActionButton({
  member,
  unreadCount = 0,
}: StaffCommunityChatActionButtonProps) {
  const { t } = useTranslation()
  const hasUnread = unreadCount > 0
  const label = hasUnread
    ? t('components.dashboard.views.StaffView.manage_chat_unread', { count: unreadCount })
    : t('components.dashboard.views.StaffView.manage_chat')

  return (
    <IconButton
      label={label}
      onClick={() => openStaffCommunityChat({
        peerUserProfileId: String(member.userProfileId ?? '').trim(),
        displayName: getStaffChatDisplayName(member),
      })}
      className="relative hover:text-nexoraBrand"
    >
      <MessagesSquare className="h-4 w-4" aria-hidden="true" />
      {hasUnread ? (
        <span className={STAFF_CHAT_UNREAD_DOT_CLASS} aria-hidden="true" />
      ) : null}
    </IconButton>
  )
}
