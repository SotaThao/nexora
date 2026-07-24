import { MessageSquare, Sparkles, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import {
  useCommunityList,
  useCommunityMembers,
  useMyCommunities,
} from '../../data/hooks/useCommunity'
import { useDirectChannels } from '../../data/hooks/useDirectMessages'
import { useCommunityAuth } from './CommunityAuth'
import { useCommunityChatDock } from './CommunityChatDock'
import { formatJoinedDate } from '../../utils/localDate'

const cardClass =
  'overflow-hidden rounded-2xl border border-nexoraBorder bg-nexoraSurface p-4 shadow-nexora-card'
const gradientClass = 'bg-gradient-to-br from-nexoraElectric to-nexoraViolet'

function initials(name?: string | null) {
  return (name || 'N')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}

function Avatar({ name, className = 'h-9 w-9' }: { name?: string | null; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`grid shrink-0 place-items-center rounded-full ${gradientClass} text-xs font-extrabold text-white ${className}`}
    >
      {initials(name)}
    </span>
  )
}

export function CommunityRightRail() {
  const { user, isAnonymous } = useCommunityAuth()
  const dock = useCommunityChatDock()
  const myCommunities = useMyCommunities({ enabled: Boolean(user) })
  const communities = useCommunityList({ enabled: Boolean(user) })

  const userCommunities = myCommunities.data?.items.length
    ? myCommunities.data.items
    : communities.data?.items ?? []

  const primaryCommunityId = userCommunities[0]?.id
  const membersQuery = useCommunityMembers(primaryCommunityId, {
    enabled: Boolean(primaryCommunityId),
  })

  const memberItems = (membersQuery.data?.pages.flatMap((page) => page.items) ?? []).slice(0, 8)

  const directChannels = useDirectChannels({ enabled: Boolean(user) && !isAnonymous })

  return (
    <aside className="sticky top-[68px] space-y-4 font-sans">
      {/* 1. Người đang hoạt động */}
      <section className={cardClass}>
        <div className="flex items-center justify-between border-b border-nexoraRule pb-3">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-nexoraBrand" aria-hidden="true" />
            <h2 className="text-sm font-extrabold text-nexoraText">Người đang hoạt động</h2>
          </div>
          {memberItems.length > 0 && (
            <span className="flex items-center gap-1 text-[11px] font-bold text-nexoraSuccess">
              <span className="h-2 w-2 animate-pulse rounded-full bg-nexoraSuccess" />
              Online
            </span>
          )}
        </div>

        <div className="mt-3 space-y-2">
          {membersQuery.isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 animate-pulse">
                  <div className="h-9 w-9 rounded-full bg-nexoraSurfaceMuted" />
                  <div className="flex-1 space-y-1">
                    <div className="h-3.5 w-24 rounded bg-nexoraSurfaceMuted" />
                    <div className="h-2.5 w-16 rounded bg-nexoraSurfaceMuted" />
                  </div>
                </div>
              ))}
            </div>
          ) : memberItems.length > 0 ? (
            memberItems.map((member) => {
              const displayName = member.profile?.displayName || 'Thành viên'
              const roleText =
                member.role === 'owner'
                  ? 'Chủ nhóm'
                  : member.role === 'admin'
                  ? 'Quản lý'
                  : member.role === 'moderator'
                  ? 'Điều hành'
                  : 'Đang hoạt động'

              return (
                <div
                  key={member.id}
                  className="flex items-center gap-3 rounded-xl p-1.5 transition-colors hover:bg-nexoraSurfaceMuted"
                >
                  <div className="relative shrink-0">
                    <Avatar name={displayName} className="h-9 w-9" />
                    <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-nexoraSuccess ring-2 ring-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-bold text-nexoraText">{displayName}</p>
                    <p className="truncate text-[11px] text-nexoraSubtle">{roleText}</p>
                  </div>
                </div>
              )
            })
          ) : (
            <p className="py-2 text-center text-xs text-nexoraSubtle">Chưa có thông tin thành viên.</p>
          )}
        </div>
      </section>

      {/* 2. Nhóm của bạn */}
      <section className={cardClass}>
        <div className="flex items-center justify-between border-b border-nexoraRule pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-nexoraBrand" aria-hidden="true" />
            <h2 className="text-sm font-extrabold text-nexoraText">Nhóm của bạn</h2>
          </div>
          <span className="rounded-full bg-nexoraBrandSoft px-2 py-0.5 text-xs font-extrabold text-nexoraBrand">
            {userCommunities.length}
          </span>
        </div>

        <div className="mt-3 space-y-1">
          {myCommunities.isLoading || communities.isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-10 animate-pulse rounded-xl bg-nexoraSurfaceMuted" />
              ))}
            </div>
          ) : userCommunities.length > 0 ? (
            userCommunities.slice(0, 5).map((community) => (
              <Link
                key={community.id}
                to={`/community/${community.id}`}
                className="flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-nexoraBrandSoft/50"
              >
                <Avatar name={community.name} className="h-9 w-9" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold text-nexoraText">{community.name}</p>
                  <p className="truncate text-[11px] text-nexoraSubtle">
                    {community.kind === 'salon'
                      ? 'Salon Group'
                      : community.visibility === 'private'
                      ? 'Nhóm riêng tư'
                      : 'Cộng đồng công khai'}
                  </p>
                </div>
              </Link>
            ))
          ) : (
            <p className="py-2 text-center text-xs text-nexoraSubtle">Bạn chưa tham gia nhóm nào.</p>
          )}
        </div>
      </section>

      {/* 3. Tin nhắn (Chỉ hiển thị nếu có DM) */}
      {directChannels.data && directChannels.data.length > 0 ? (
        <section className={cardClass}>
          <div className="flex items-center justify-between border-b border-nexoraRule pb-3">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-nexoraBrand" aria-hidden="true" />
              <h2 className="text-sm font-extrabold text-nexoraText">Tin nhắn</h2>
            </div>
            <Link
              to="/community/chat"
              className="text-xs font-bold text-nexoraBrand hover:underline"
            >
              Xem tất cả
            </Link>
          </div>

          <div className="mt-3 space-y-1">
            {directChannels.data.slice(0, 5).map((channel) => (
              <button
                key={channel.id}
                type="button"
                onClick={() => dock.openDirectChat({ id: channel.id, title: channel.otherParticipant.displayName })}
                className="flex w-full items-center gap-3 rounded-xl p-2 text-left transition-colors hover:bg-nexoraBrandSoft/50"
              >
                <Avatar name={channel.otherParticipant.displayName} className="h-9 w-9" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <p className="truncate text-xs font-bold text-nexoraText">
                      {channel.otherParticipant.displayName}
                    </p>
                    <time className="shrink-0 text-[10px] text-nexoraSubtle">
                      {formatJoinedDate(channel.createdAt)}
                    </time>
                  </div>
                  <p className="truncate text-[11px] text-nexoraSubtle">Chat 1:1</p>
                </div>
              </button>
            ))}
          </div>
        </section>
      ) : null}
    </aside>
  )
}
