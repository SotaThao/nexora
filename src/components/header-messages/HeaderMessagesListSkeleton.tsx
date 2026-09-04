import {
  HEADER_MESSAGES_I18N,
  HEADER_MESSAGES_LIST_SKELETON_COUNT,
} from './headerMessagesConstants'

interface HeaderMessagesListSkeletonProps {
  count?: number
  t: (key: string) => string
}

export default function HeaderMessagesListSkeleton({
  count = HEADER_MESSAGES_LIST_SKELETON_COUNT,
  t,
}: HeaderMessagesListSkeletonProps) {
  return (
    <div
      className="header-messages-list-skeleton"
      role="status"
      aria-label={t(`${HEADER_MESSAGES_I18N}.loading`)}
    >
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="header-messages-skeleton-item" aria-hidden="true">
          <span className="header-messages-skeleton-avatar" />
          <span className="header-messages-skeleton-main">
            <span className="header-messages-skeleton-row">
              <span className="header-messages-skeleton-name" />
              <span className="header-messages-skeleton-time" />
            </span>
            <span className="header-messages-skeleton-preview" />
          </span>
        </div>
      ))}
    </div>
  )
}
