import {
  ArrowLeft,
  Loader2,
  MessageSquare,
  MessagesSquare,
  PictureInPicture,
  Search,
  Send,
  UserPlus,
  Users,
} from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  useDirectChannels,
  useFindOrCreateDirectChannel,
  useProfileSearch,
} from '../../data/hooks/useDirectMessages'
import { useMyCommunities } from '../../data/hooks/useCommunity'
import { CommunityPersonaSwitcher, useCommunityAuth } from './CommunityAuth'
import { useCommunityChatDock } from './CommunityChatDock'
import DemoStaffShell from './demo/DemoStaffShell'
import { formatJoinedDate } from '../../utils/localDate'

const gradientClass = 'bg-gradient-to-br from-nexoraElectric to-nexoraViolet'
const cardClass = 'overflow-hidden rounded-2xl border border-nexoraBorder bg-nexoraSurface shadow-nexora-card'

function initials(name?: string | null) {
  return (name || 'N')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}

function UserAvatar({ name, className = 'h-10 w-10' }: { name?: string | null; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`grid shrink-0 place-items-center rounded-full ${gradientClass} text-xs font-extrabold text-white ${className}`}
    >
      {initials(name)}
    </span>
  )
}

export function CommunityChatInbox() {
  const navigate = useNavigate()
  const { user, isAnonymous } = useCommunityAuth()
  const dock = useCommunityChatDock()
  const [activeTab, setActiveTab] = useState<'dm' | 'groups'>('dm')
  const [searchQuery, setSearchQuery] = useState('')

  const directChannels = useDirectChannels({ enabled: Boolean(user) && !isAnonymous })
  const profileSearch = useProfileSearch(searchQuery, { enabled: Boolean(user) && !isAnonymous })
  const findOrCreateChannel = useFindOrCreateDirectChannel()
  const myCommunities = useMyCommunities({ enabled: Boolean(user) && !isAnonymous })

  const handleStartDm = (targetUserId: string) => {
    findOrCreateChannel.mutate(targetUserId, {
      onSuccess: (channel) => {
        setSearchQuery('')
        navigate(`/community/chat/dm/${channel.id}`)
      },
    })
  }

  const isSearching = searchQuery.trim().length >= 2

  return (
    <>
      <CommunityPersonaSwitcher />
      <DemoStaffShell onDemoNavigation={() => navigate('/community')}>
        <main className="mx-auto flex h-full min-h-0 w-full max-w-[680px] flex-col overflow-hidden border-x border-nexoraBorder bg-nexoraCanvas font-sans shadow-nexora-card lg:h-auto lg:min-h-[calc(100vh-120px)]">
          <header className="border-b border-nexoraBorder bg-nexoraSurface px-4 py-3">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => navigate('/community')}
                className="grid h-10 w-10 place-items-center rounded-full text-nexoraMuted hover:bg-nexoraSurfaceMuted"
                aria-label="Quay lại Community"
              >
                <ArrowLeft className="h-5 w-5" aria-hidden="true" />
              </button>
              <div>
                <h1 className="text-lg font-extrabold text-nexoraText">Hộp thư nhắn tin</h1>
                <p className="text-xs text-nexoraSubtle">Trò chuyện 1:1 và Chat nhóm Nexora</p>
              </div>
            </div>

            {/* Profile search input */}
            <div className="relative mt-3">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-nexoraSubtle" aria-hidden="true" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm người dùng Nexora để nhắn tin (nhập từ 2 ký tự)..."
                aria-label="Tìm kiếm người dùng"
                className="min-h-10 w-full rounded-xl border border-nexoraBorder bg-nexoraSurfaceMuted pl-10 pr-4 text-sm text-nexoraText outline-none placeholder:text-nexoraSubtle focus:border-nexoraBrand"
              />
            </div>
          </header>

          {/* Search results view */}
          {isSearching ? (
            <section className="flex-1 overflow-y-auto p-4">
              <h2 className="mb-3 text-xs font-extrabold uppercase tracking-wider text-nexoraSubtle">
                Kết quả tìm kiếm ({profileSearch.data?.length ?? 0})
              </h2>
              {profileSearch.isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-nexoraBrand" />
                </div>
              ) : profileSearch.data?.length ? (
                <div className="space-y-2">
                  {profileSearch.data.map((profile) => (
                    <article
                      key={profile.id}
                      className="flex items-center gap-3 rounded-2xl border border-nexoraRule bg-nexoraSurface p-3 shadow-sm hover:border-nexoraBrand"
                    >
                      <UserAvatar name={profile.displayName} />
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate text-sm font-extrabold text-nexoraText">
                          {profile.displayName}
                        </h3>
                        <p className="text-xs text-nexoraSubtle">Người dùng Nexora</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleStartDm(profile.id)}
                        disabled={findOrCreateChannel.isPending}
                        className={`inline-flex min-h-9 items-center gap-1.5 rounded-xl px-3 text-xs font-extrabold text-white ${gradientClass} disabled:opacity-50`}
                      >
                        {findOrCreateChannel.isPending ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Send className="h-3.5 w-3.5" />
                        )}
                        Nhắn tin
                      </button>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center">
                  <UserPlus className="mx-auto h-8 w-8 text-nexoraSubtle" />
                  <p className="mt-2 text-sm font-bold text-nexoraMuted">Không tìm thấy người dùng</p>
                  <p className="mt-1 text-xs text-nexoraSubtle">
                    Thử tìm với từ khóa hoặc tên hiển thị khác.
                  </p>
                </div>
              )}
            </section>
          ) : (
            <>
              {/* Tabs */}
              <div className="flex border-b border-nexoraBorder bg-nexoraSurface">
                <button
                  type="button"
                  onClick={() => setActiveTab('dm')}
                  aria-pressed={activeTab === 'dm'}
                  className={`flex min-h-11 flex-1 items-center justify-center gap-2 text-sm font-bold ${
                    activeTab === 'dm'
                      ? 'border-b-2 border-nexoraBrand text-nexoraBrand'
                      : 'text-nexoraSubtle hover:text-nexoraMuted'
                  }`}
                >
                  <MessageSquare className="h-4 w-4" />
                  Tin nhắn ({directChannels.data?.length ?? 0})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('groups')}
                  aria-pressed={activeTab === 'groups'}
                  className={`flex min-h-11 flex-1 items-center justify-center gap-2 text-sm font-bold ${
                    activeTab === 'groups'
                      ? 'border-b-2 border-nexoraBrand text-nexoraBrand'
                      : 'text-nexoraSubtle hover:text-nexoraMuted'
                  }`}
                >
                  <Users className="h-4 w-4" />
                  Nhóm Community ({myCommunities.data?.items.length ?? 0})
                </button>
              </div>

              {/* Main Content Area */}
              <section className="flex-1 overflow-y-auto p-4">
                {activeTab === 'dm' ? (
                  directChannels.isLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-6 w-6 animate-spin text-nexoraBrand" />
                    </div>
                  ) : directChannels.data?.length ? (
                    <div className="space-y-2">
                      {directChannels.data.map((channel) => (
                        <div
                          key={channel.id}
                          className="flex items-center gap-1 rounded-2xl border border-nexoraRule bg-nexoraSurface p-1 shadow-sm hover:border-nexoraBrand"
                        >
                          <Link
                            to={`/community/chat/dm/${channel.id}`}
                            className="flex min-w-0 flex-1 items-center gap-3 rounded-xl p-2"
                          >
                            <UserAvatar name={channel.otherParticipant.displayName} />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-2">
                                <h3 className="truncate text-sm font-extrabold text-nexoraText">
                                  {channel.otherParticipant.displayName}
                                </h3>
                                <time className="shrink-0 text-[11px] text-nexoraSubtle">
                                  {formatJoinedDate(channel.createdAt)}
                                </time>
                              </div>
                              <p className="mt-0.5 truncate text-xs text-nexoraMuted">
                                Cuộc trò chuyện trực tiếp 1:1
                              </p>
                            </div>
                          </Link>
                          <button
                            type="button"
                            onClick={() => dock.openDirectChat({ id: channel.id, title: channel.otherParticipant.displayName })}
                            aria-label={`Mở đoạn chat với ${channel.otherParticipant.displayName} dạng cửa sổ nổi`}
                            className="hidden h-10 w-10 shrink-0 place-items-center rounded-full text-nexoraMuted hover:bg-nexoraSurfaceMuted lg:grid"
                          >
                            <PictureInPicture className="h-4 w-4" aria-hidden="true" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className={`${cardClass} px-6 py-12 text-center`}>
                      <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-nexoraBrandSoft text-nexoraBrand">
                        <MessagesSquare className="h-7 w-7" aria-hidden="true" />
                      </span>
                      <h2 className="mt-4 text-base font-extrabold text-nexoraText">
                        Chưa có tin nhắn trực tiếp
                      </h2>
                      <p className="mx-auto mt-2 max-w-sm text-xs leading-relaxed text-nexoraMuted">
                        Tìm kiếm người dùng ở thanh tìm kiếm phía trên để bắt đầu trò chuyện 1:1.
                      </p>
                    </div>
                  )
                ) : myCommunities.isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-nexoraBrand" />
                  </div>
                ) : myCommunities.data?.items.length ? (
                  <div className="space-y-2">
                    {myCommunities.data.items.map((community) => (
                      <Link
                        key={community.id}
                        to={`/community/${community.id}/chat`}
                        className="flex items-center gap-3 rounded-2xl border border-nexoraRule bg-nexoraSurface p-3 shadow-sm hover:border-nexoraBrand"
                      >
                        <UserAvatar name={community.name} />
                        <div className="min-w-0 flex-1">
                          <h3 className="truncate text-sm font-extrabold text-nexoraText">
                            {community.name}
                          </h3>
                          <p className="mt-0.5 text-xs text-nexoraSubtle">
                            {community.kind === 'salon' ? 'Salon Group' : 'Nhóm Community'}
                          </p>
                        </div>
                        <span className="rounded-xl border border-nexoraBorder bg-nexoraSurfaceMuted px-3 py-1.5 text-xs font-bold text-nexoraBrand">
                          Vào Chat
                        </span>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className={`${cardClass} px-6 py-12 text-center`}>
                    <Users className="mx-auto h-8 w-8 text-nexoraSubtle" />
                    <h2 className="mt-3 text-base font-extrabold text-nexoraText">
                      Chưa tham gia nhóm nào
                    </h2>
                    <p className="mt-1 text-xs text-nexoraMuted">
                      Khám phá các cộng đồng trên Nexora để tham gia và chat nhóm.
                    </p>
                    <Link
                      to="/community"
                      className="mt-4 inline-flex min-h-10 items-center rounded-xl border border-nexoraBorder px-4 text-xs font-bold text-nexoraBrand"
                    >
                      Khám phá cộng đồng
                    </Link>
                  </div>
                )}
              </section>
            </>
          )}
        </main>
      </DemoStaffShell>
    </>
  )
}
