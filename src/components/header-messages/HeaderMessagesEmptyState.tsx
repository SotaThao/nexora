import { MessagesSquare, Users, type LucideIcon } from 'lucide-react'
import {
  HEADER_MESSAGES_I18N,
  HeaderMessagesEmptyVariant,
  MERCHANT_STAFF_EMPTY_CTA,
} from './headerMessagesConstants'
import HeaderMessagesStaffChatCta from './HeaderMessagesStaffChatCta'

interface HeaderMessagesEmptyStateProps {
  variant: HeaderMessagesEmptyVariant
  t: (key: string) => string
  descriptionKey?: string
  actionLabel?: string
  onAction?: () => void
}

const EMPTY_STATE_CONFIG: Record<
  HeaderMessagesEmptyVariant,
  { Icon: LucideIcon; titleKey: string; descriptionKey?: string }
> = {
  [HeaderMessagesEmptyVariant.Groups]: {
    Icon: Users,
    titleKey: `${HEADER_MESSAGES_I18N}.groupsEmptyTitle`,
  },
  [HeaderMessagesEmptyVariant.Search]: {
    Icon: MessagesSquare,
    titleKey: `${HEADER_MESSAGES_I18N}.emptySearch`,
  },
  [HeaderMessagesEmptyVariant.Messages]: {
    Icon: MessagesSquare,
    titleKey: `${HEADER_MESSAGES_I18N}.emptyTitle`,
    descriptionKey: `${HEADER_MESSAGES_I18N}.emptyDescription`,
  },
}

export default function HeaderMessagesEmptyState({
  variant,
  t,
  descriptionKey: descriptionKeyOverride,
  actionLabel,
  onAction,
}: HeaderMessagesEmptyStateProps) {
  const { Icon, titleKey, descriptionKey } = EMPTY_STATE_CONFIG[variant]
  const resolvedDescriptionKey = descriptionKeyOverride ?? descriptionKey

  return (
    <div className="header-messages-empty-state">
      <div className="flex w-full flex-col items-center" role="status">
        <Icon className="header-messages-empty-icon" aria-hidden="true" />
        <p className="header-messages-empty-title">{t(titleKey)}</p>
        {resolvedDescriptionKey ? (
          <p className="header-messages-empty-desc">{t(resolvedDescriptionKey)}</p>
        ) : null}
      </div>
      {actionLabel && onAction ? (
        <HeaderMessagesStaffChatCta
          variant={MERCHANT_STAFF_EMPTY_CTA.variant}
          label={actionLabel}
          onClick={onAction}
        />
      ) : null}
    </div>
  )
}
