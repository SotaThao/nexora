import { MessagesSquare } from 'lucide-react'
import { useTranslation } from '../../contexts/LanguageContext'
import { openStaffCommunityChat } from '../header-messages/openCommunityChatSession'
import StaffChatStartHintOverlay from './StaffChatStartHintOverlay'
import {
  STAFF_CHAT_I18N,
  STAFF_CHAT_UNREAD_DOT_CLASS,
} from './constants'
import type { StaffChatStartHintPlacement } from './staffChatStartHintLayout'
import {
  getStaffChatDisplayName,
  trimStaffChatId,
  type StaffChatMemberLike,
} from './staffCommunityChatUtils'

interface StaffCommunityChatActionButtonProps {
  member: StaffChatMemberLike
  unreadCount?: number
  showStartHint?: boolean
  onStartHintDismiss?: () => void
  manageLabelKey?: string
  manageUnreadLabelKey?: string
  hintPlacement?: StaffChatStartHintPlacement
}

export default function StaffCommunityChatActionButton({
  member,
  unreadCount = 0,
  showStartHint = false,
  onStartHintDismiss,
  manageLabelKey = STAFF_CHAT_I18N.manage,
  manageUnreadLabelKey = STAFF_CHAT_I18N.manageUnread,
  hintPlacement,
}: StaffCommunityChatActionButtonProps) {
  const { t } = useTranslation()
  const hasUnread = unreadCount > 0
  const label = hasUnread
    ? t(manageUnreadLabelKey, { count: unreadCount })
    : t(manageLabelKey)

  const openChat = () => {
    if (showStartHint) onStartHintDismiss?.()
    openStaffCommunityChat({
      peerUserProfileId: trimStaffChatId(member.userProfileId) || undefined,
      displayName: getStaffChatDisplayName(member),
      businessId: trimStaffChatId(member.businessId) || undefined,
    })
  }

  const button = (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={openChat}
      className="nexora-icon-button relative w-auto gap-1 px-2 text-xs font-medium"
    >
      <MessagesSquare className="h-4 w-4" aria-hidden="true" />
      <span>{t(STAFF_CHAT_I18N.open)}</span>
      {hasUnread ? (
        <span className={STAFF_CHAT_UNREAD_DOT_CLASS} aria-hidden="true" />
      ) : null}
    </button>
  )

  if (!showStartHint) return button

  return (
    <StaffChatStartHintOverlay active placement={hintPlacement}>
      {button}
    </StaffChatStartHintOverlay>
  )
}
