import { MessagesSquare, Users, type LucideIcon } from 'lucide-react'
import { HEADER_MESSAGES_I18N, HeaderMessagesEmptyVariant } from './headerMessagesConstants'

interface HeaderMessagesEmptyStateProps {
  variant: HeaderMessagesEmptyVariant
  t: (key: string) => string
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
}: HeaderMessagesEmptyStateProps) {
  const { Icon, titleKey, descriptionKey } = EMPTY_STATE_CONFIG[variant]

  return (
    <div className="header-messages-empty-state" role="status">
      <Icon className="header-messages-empty-icon" aria-hidden="true" />
      <p className="header-messages-empty-title">{t(titleKey)}</p>
      {descriptionKey ? (
        <p className="header-messages-empty-desc">{t(descriptionKey)}</p>
      ) : null}
    </div>
  )
}
