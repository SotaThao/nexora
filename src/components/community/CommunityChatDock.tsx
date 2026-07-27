import { CheckCheck, Loader2, Maximize2, MessageSquare, MessagesSquare, Minus, Phone, Search, Send, Users, Video, X } from 'lucide-react'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import type { MediaAsset, MessageDto } from '../../data/repositories/community'
import { useCommunityChat } from '../../data/hooks/useCommunityChat'
import { useCommunityMediaUrl, useMyCommunities } from '../../data/hooks/useCommunity'
import { useDirectChannels } from '../../data/hooks/useDirectMessages'
import { formatJoinedDate } from '../../utils/localDate'
import { useCommunityAuth } from './CommunityAuth'

const gradientClass = 'bg-gradient-to-br from-nexoraElectric to-nexoraViolet'
const MAX_OPEN_WINDOWS = 2

type DockChatEntry = {
  key: string
  targetId: string
  kind: 'direct' | 'group'
  title: string
  minimized: boolean
}

type CommunityChatDockContextValue = {
  entries: DockChatEntry[]
  isInboxOpen: boolean
  toggleInbox: () => void
  closeInbox: () => void
  openDirectChat: (channel: { id: string; title: string }) => void
  openGroupChat: (community: { id: string; title: string }) => void
  close: (entryKey: string) => void
  toggleMinimize: (entryKey: string) => void
}

const CommunityChatDockContext = createContext<CommunityChatDockContextValue | null>(null)

export function CommunityChatDockProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<DockChatEntry[]>([])
  const [isInboxOpen, setIsInboxOpen] = useState(false)

  const toggleInbox = useCallback(() => setIsInboxOpen((current) => !current), [])
  const closeInbox = useCallback(() => setIsInboxOpen(false), [])

  const openChat = useCallback((entry: Omit<DockChatEntry, 'minimized'>) => {
    setIsInboxOpen(false)
    setEntries((current) => {
      const existing = current.find((item) => item.key === entry.key)
      if (existing) {
        const rest = current.filter((item) => item.key !== entry.key)
        return [...rest, { ...existing, title: entry.title, minimized: false }]
      }
      const openCount = current.filter((entry) => !entry.minimized).length
      const overflowIndex = openCount >= MAX_OPEN_WINDOWS ? current.findIndex((entry) => !entry.minimized) : -1
      const next = current.map((item, index) => (index === overflowIndex ? { ...item, minimized: true } : item))
      return [...next, { ...entry, minimized: false }]
    })
  }, [])

  const openDirectChat = useCallback((channel: { id: string; title: string }) => {
    openChat({ key: `direct:${channel.id}`, targetId: channel.id, kind: 'direct', title: channel.title })
  }, [openChat])

  const openGroupChat = useCallback((community: { id: string; title: string }) => {
    openChat({ key: `group:${community.id}`, targetId: community.id, kind: 'group', title: community.title })
  }, [openChat])

  const close = useCallback((entryKey: string) => {
    setEntries((current) => current.filter((entry) => entry.key !== entryKey))
  }, [])

  const toggleMinimize = useCallback((entryKey: string) => {
    setEntries((current) =>
      current.map((entry) => (entry.key === entryKey ? { ...entry, minimized: !entry.minimized } : entry)),
    )
  }, [])

  const value = useMemo(
    () => ({ entries, isInboxOpen, toggleInbox, closeInbox, openDirectChat, openGroupChat, close, toggleMinimize }),
    [entries, isInboxOpen, toggleInbox, closeInbox, openDirectChat, openGroupChat, close, toggleMinimize],
  )

  return <CommunityChatDockContext.Provider value={value}>{children}</CommunityChatDockContext.Provider>
}

export function useCommunityChatDock() {
  const context = useContext(CommunityChatDockContext)
  if (!context) throw new Error('useCommunityChatDock must be used within CommunityChatDockProvider')
  return context
}

function initials(name?: string | null) {
  return (name || 'N').split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase()
}

function Avatar({ name, className = 'h-8 w-8' }: { name?: string | null; className?: string }) {
  return (
    <span aria-hidden="true" className={`grid shrink-0 place-items-center rounded-full ${gradientClass} text-[10px] font-extrabold text-white ${className}`}>
      {initials(name)}
    </span>
  )
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat('vi-VN', { hour: '2-digit', minute: '2-digit' }).format(new Date(value))
}

export function CommunityChatInboxTrigger() {
  const { user, isAnonymous } = useCommunityAuth()
  const { isInboxOpen, toggleInbox, closeInbox, openDirectChat, openGroupChat } = useCommunityChatDock()
  const location = useLocation()
  const [activeTab, setActiveTab] = useState<'dm' | 'groups'>('dm')
  const [searchQuery, setSearchQuery] = useState('')
  const isInboxVisible = isInboxOpen && location.pathname === '/community'
  const directChannels = useDirectChannels({ enabled: Boolean(user) && !isAnonymous })
  const myCommunities = useMyCommunities({ enabled: Boolean(user) && !isAnonymous })
  const normalizedQuery = searchQuery.trim().toLocaleLowerCase('vi')
  const visibleDirectChannels = (directChannels.data ?? []).filter((channel) =>
    channel.otherParticipant.displayName.toLocaleLowerCase('vi').includes(normalizedQuery),
  )
  const visibleCommunities = (myCommunities.data?.items ?? []).filter((community) =>
    community.name.toLocaleLowerCase('vi').includes(normalizedQuery),
  )

  useEffect(() => {
    if (!isInboxVisible) return
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target
      // Mobile and desktop header variants are mounted together. Treat either
      // Messenger root as inside so the hidden variant cannot cancel a click.
      if (target instanceof Element && target.closest('[data-community-chat-inbox-root]')) return
      closeInbox()
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeInbox()
    }
    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [closeInbox, isInboxVisible])

  return (
    <div data-community-chat-inbox-root className="relative">
      <button
        type="button"
        onClick={toggleInbox}
        aria-label="Mở Messenger"
        aria-expanded={isInboxVisible}
        aria-haspopup="dialog"
        className={`hidden h-11 w-11 place-items-center rounded-xl border bg-nexoraSurface text-nexoraBrand transition-colors hover:bg-nexoraBrandSoft lg:grid ${
          isInboxVisible ? 'border-nexoraBrand bg-nexoraBrandSoft' : 'border-nexoraBorder'
        }`}
      >
        <MessagesSquare className="h-5 w-5" aria-hidden="true" />
      </button>
      <Link
        to="/community/chat"
        onClick={closeInbox}
        aria-label="Mở ứng dụng Chat"
        className="grid h-11 w-11 place-items-center rounded-xl border border-nexoraBorder bg-nexoraSurface text-nexoraBrand hover:bg-nexoraBrandSoft lg:hidden"
      >
        <MessagesSquare className="h-5 w-5" aria-hidden="true" />
      </Link>

      {isInboxVisible ? (
        <section
          role="dialog"
          aria-label="Messenger"
          className="absolute right-0 top-[calc(100%+10px)] z-[90] hidden max-h-[min(620px,calc(100dvh-150px))] w-[min(380px,calc(100vw-2rem))] flex-col overflow-hidden rounded-xl border border-nexoraBorder bg-nexoraSurface text-left shadow-2xl lg:flex"
        >
          <header className="flex shrink-0 items-center gap-3 px-4 pb-2 pt-4">
            <span className={`grid h-10 w-10 place-items-center rounded-full text-white ${gradientClass}`}>
              <MessagesSquare className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-extrabold text-nexoraText">Tin nhắn</h2>
              <p className="text-xs text-nexoraMuted">Messenger trên Community</p>
            </div>
            <button
              type="button"
              onClick={closeInbox}
              aria-label="Đóng Messenger"
              className="grid h-9 w-9 place-items-center rounded-full text-nexoraMuted hover:bg-nexoraSurfaceMuted"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </header>

          <div className="relative mx-3 mb-3 shrink-0">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-nexoraSubtle" aria-hidden="true" />
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Tìm cuộc trò chuyện"
              aria-label="Tìm cuộc trò chuyện"
              className="min-h-9 w-full rounded-full border border-nexoraBorder bg-nexoraSurfaceMuted pl-9 pr-3 text-sm text-nexoraText outline-none placeholder:text-nexoraSubtle focus:border-nexoraBrand"
            />
          </div>

          <div className="flex shrink-0 border-b border-nexoraRule px-3">
            <button
              type="button"
              onClick={() => setActiveTab('dm')}
              aria-pressed={activeTab === 'dm'}
              className={`flex min-h-10 flex-1 items-center justify-center gap-1.5 border-b-2 text-xs font-extrabold ${
                activeTab === 'dm' ? 'border-nexoraBrand text-nexoraBrand' : 'border-transparent text-nexoraMuted'
              }`}
            >
              <MessageSquare className="h-4 w-4" aria-hidden="true" />
              Tin nhắn ({directChannels.data?.length ?? 0})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('groups')}
              aria-pressed={activeTab === 'groups'}
              className={`flex min-h-10 flex-1 items-center justify-center gap-1.5 border-b-2 text-xs font-extrabold ${
                activeTab === 'groups' ? 'border-nexoraBrand text-nexoraBrand' : 'border-transparent text-nexoraMuted'
              }`}
            >
              <Users className="h-4 w-4" aria-hidden="true" />
              Nhóm ({myCommunities.data?.items.length ?? 0})
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-2">
            {activeTab === 'dm' ? (
              directChannels.isLoading ? (
                <div className="grid min-h-36 place-items-center">
                  <Loader2 className="h-6 w-6 animate-spin text-nexoraBrand" aria-label="Đang tải tin nhắn" />
                </div>
              ) : visibleDirectChannels.length ? (
                visibleDirectChannels.map((channel) => (
                  <button
                    key={channel.id}
                    type="button"
                    onClick={() => openDirectChat({ id: channel.id, title: channel.otherParticipant.displayName })}
                    className="flex min-h-[64px] w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left hover:bg-nexoraBrandSoft/45"
                  >
                    <Avatar name={channel.otherParticipant.displayName} className="h-11 w-11 text-xs" />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2">
                        <b className="truncate text-sm text-nexoraText">{channel.otherParticipant.displayName}</b>
                        <time className="shrink-0 text-[11px] text-nexoraSubtle">{formatJoinedDate(channel.createdAt)}</time>
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-nexoraMuted">Mở cuộc trò chuyện 1:1</span>
                    </span>
                  </button>
                ))
              ) : (
                <div className="px-6 py-10 text-center">
                  <MessagesSquare className="mx-auto h-7 w-7 text-nexoraSubtle" aria-hidden="true" />
                  <p className="mt-2 text-sm font-bold text-nexoraText">Không có cuộc trò chuyện</p>
                  <p className="mt-1 text-xs text-nexoraMuted">Mở ứng dụng Chat trên mobile để tìm người dùng mới.</p>
                </div>
              )
            ) : myCommunities.isLoading ? (
              <div className="grid min-h-36 place-items-center">
                <Loader2 className="h-6 w-6 animate-spin text-nexoraBrand" aria-label="Đang tải nhóm" />
              </div>
            ) : visibleCommunities.length ? (
              visibleCommunities.map((community) => (
                <button
                  key={community.id}
                  type="button"
                  onClick={() => openGroupChat({ id: community.id, title: community.name })}
                  className="flex min-h-[64px] w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left hover:bg-nexoraBrandSoft/45"
                >
                  <Avatar name={community.name} className="h-11 w-11 text-xs" />
                  <span className="min-w-0 flex-1">
                    <b className="block truncate text-sm text-nexoraText">{community.name}</b>
                    <span className="mt-0.5 block truncate text-xs text-nexoraMuted">
                      {community.kind === 'salon' ? 'Salon Group' : 'Nhóm Community'}
                    </span>
                  </span>
                </button>
              ))
            ) : (
              <div className="px-6 py-10 text-center">
                <Users className="mx-auto h-7 w-7 text-nexoraSubtle" aria-hidden="true" />
                <p className="mt-2 text-sm font-bold text-nexoraText">Không tìm thấy nhóm</p>
              </div>
            )}
          </div>
        </section>
      ) : null}
    </div>
  )
}

function DockMessageImage({ asset }: { asset: MediaAsset }) {
  const mediaUrl = useCommunityMediaUrl(asset)
  if (mediaUrl.isLoading) return <div className="h-28 w-40 animate-pulse rounded-lg bg-nexoraSurfaceMuted" aria-label="Đang tải ảnh" />
  if (mediaUrl.error || !mediaUrl.data) return null
  return <img src={mediaUrl.data} alt={asset.altText || 'Ảnh trong tin nhắn'} className="max-h-48 w-full rounded-lg object-cover" loading="lazy" />
}

function DockBubble({
  message,
  currentUserId,
  recipientName,
  isFirstInRun,
  isLastInRun,
}: {
  message: MessageDto
  currentUserId?: string
  recipientName: string
  isFirstInRun: boolean
  isLastInRun: boolean
}) {
  const isOwn = message.senderId === currentUserId
  const groupedCornerClass = isOwn
    ? `${isFirstInRun ? '' : 'rounded-tr-md'} ${isLastInRun ? '' : 'rounded-br-md'}`
    : `${isFirstInRun ? '' : 'rounded-tl-md'} ${isLastInRun ? '' : 'rounded-bl-md'}`

  return (
    <article className={`flex max-w-[85%] items-end gap-1.5 ${isOwn ? 'ml-auto flex-row-reverse' : ''}`}>
      {!isOwn ? (isLastInRun ? <Avatar name={recipientName} className="h-6 w-6" /> : <span aria-hidden="true" className="h-6 w-6 shrink-0" />) : null}
      <div className={`min-w-0 rounded-2xl px-2.5 py-1.5 ${groupedCornerClass} ${isOwn ? 'bg-nexoraBrand' : 'bg-nexoraSurfaceMuted'}`}>
        {message.media.length ? <div className="mb-1 grid gap-1">{message.media.map((asset) => <DockMessageImage key={`${message.id}:${asset.path}`} asset={asset} />)}</div> : null}
        {message.body ? <p className={`whitespace-pre-wrap break-words text-[12.5px] leading-snug ${isOwn ? 'text-white' : 'text-nexoraText'}`}>{message.body}</p> : null}
        {isLastInRun ? (
          <div className={`mt-0.5 flex items-center justify-end gap-1 text-[9.5px] ${isOwn ? 'text-white/70' : 'text-nexoraSubtle'}`}>
            <time dateTime={message.createdAt}>{formatTime(message.createdAt)}</time>
            {isOwn ? <CheckCheck className="h-3 w-3 text-white/80" aria-label="Đã gửi" /> : null}
          </div>
        ) : null}
      </div>
    </article>
  )
}

function DockWindow({ entry, onClose, onMinimize }: { entry: DockChatEntry; onClose: () => void; onMinimize: () => void }) {
  const navigate = useNavigate()
  const { user } = useCommunityAuth()
  const chat = useCommunityChat(entry.kind === 'group' ? entry.targetId : null, {
    directChannelId: entry.kind === 'direct' ? entry.targetId : null,
  })
  const [body, setBody] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
  }, [chat.messages.length])

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!body.trim() || chat.isSending || !chat.channel) return
    chat
      .sendMessage({ channelId: chat.channel.id, body })
      .then(() => setBody(''))
      .catch(() => undefined)
  }

  const expand = () => navigate(`/community/chat/dm/${entry.targetId}`)

  return (
    <div className="flex h-[430px] w-[340px] flex-col overflow-hidden rounded-t-2xl border border-nexoraBorder bg-white font-sans shadow-2xl">
      <header className="flex shrink-0 items-center gap-1 border-b border-nexoraBorder bg-nexoraSurface px-3 py-2.5">
        <Avatar name={entry.title} className="h-9 w-9 text-xs" />
        <h2 className="min-w-0 flex-1 truncate text-sm font-extrabold text-nexoraText">{entry.title}</h2>
        <button type="button" disabled aria-label="Gọi thoại" title="Chưa hỗ trợ gọi thoại trong bản demo" className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-nexoraSubtle opacity-40 cursor-not-allowed"><Phone className="h-3 w-3" aria-hidden="true" /></button>
        <button type="button" disabled aria-label="Gọi video" title="Chưa hỗ trợ gọi video trong bản demo" className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-nexoraSubtle opacity-40 cursor-not-allowed"><Video className="h-3 w-3" aria-hidden="true" /></button>
        {entry.kind === 'direct' ? <button type="button" onClick={expand} aria-label="Mở toàn màn hình" className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-nexoraMuted hover:bg-nexoraSurfaceMuted"><Maximize2 className="h-3.5 w-3.5" aria-hidden="true" /></button> : null}
        <button type="button" onClick={onMinimize} aria-label="Thu nhỏ" className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-nexoraMuted hover:bg-nexoraSurfaceMuted"><Minus className="h-3.5 w-3.5" aria-hidden="true" /></button>
        <button type="button" onClick={onClose} aria-label="Đóng đoạn chat" className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-nexoraMuted hover:bg-nexoraSurfaceMuted"><X className="h-4 w-4" aria-hidden="true" /></button>
      </header>

      <section ref={scrollRef} className="min-h-0 flex-1 space-y-1 overflow-y-auto px-2.5 py-3">
        {chat.isLoading ? (
          <div className="space-y-2" aria-label="Đang tải tin nhắn">
            <div className="h-10 w-3/4 animate-pulse rounded-xl bg-nexoraSurfaceMuted" />
            <div className="ml-auto h-12 w-2/3 animate-pulse rounded-xl bg-nexoraBrandSoft" />
          </div>
        ) : chat.messages.length ? (
          chat.messages.map((message, index) => {
            const previous = chat.messages[index - 1]
            const next = chat.messages[index + 1]
            const isFirstInRun = !previous || previous.senderId !== message.senderId
            const isLastInRun = !next || next.senderId !== message.senderId
            return (
              <DockBubble
                key={message.id}
                message={message}
                currentUserId={user?.id}
                recipientName={entry.title}
                isFirstInRun={isFirstInRun}
                isLastInRun={isLastInRun}
              />
            )
          })
        ) : (
          <p className="py-8 text-center text-xs text-nexoraSubtle">Gửi tin nhắn để bắt đầu trò chuyện với {entry.title}.</p>
        )}
        {chat.error ? <p className="text-center text-[11px] font-semibold text-nexoraDanger">{chat.error.message}</p> : null}
      </section>

      <form onSubmit={submit} className="flex shrink-0 items-center gap-1.5 border-t border-nexoraBorder bg-nexoraSurface p-2">
        <input
          value={body}
          onChange={(event) => setBody(event.target.value)}
          maxLength={5000}
          disabled={chat.isSending}
          placeholder="Nhắn tin…"
          aria-label={`Nhắn tin cho ${entry.title}`}
          className="min-h-9 min-w-0 flex-1 rounded-full border border-nexoraBorder bg-nexoraSurfaceMuted px-3 text-xs text-nexoraText outline-none placeholder:text-nexoraSubtle focus:border-nexoraBrand disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={!body.trim() || chat.isSending}
          className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-white ${gradientClass} disabled:cursor-not-allowed disabled:opacity-50`}
          aria-label="Gửi tin nhắn"
        >
          {chat.isSending ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> : <Send className="h-3.5 w-3.5" aria-hidden="true" />}
        </button>
      </form>
    </div>
  )
}

function DockHead({ entry, onOpen, onClose }: { entry: DockChatEntry; onOpen: () => void; onClose: () => void }) {
  return (
    <div className="group relative">
      <button type="button" onClick={onOpen} aria-label={`Mở lại đoạn chat với ${entry.title}`} className="grid h-14 w-14 place-items-center rounded-full border border-nexoraBorder bg-white shadow-lg hover:brightness-95">
        <Avatar name={entry.title} className="h-11 w-11 text-sm" />
      </button>
      <button
        type="button"
        onClick={onClose}
        aria-label={`Đóng đoạn chat với ${entry.title}`}
        className="absolute -right-1 -top-1 hidden h-5 w-5 place-items-center rounded-full bg-nexoraText text-white group-hover:grid"
      >
        <X className="h-3 w-3" aria-hidden="true" />
      </button>
    </div>
  )
}

export function CommunityChatDock() {
  const { entries, close, toggleMinimize } = useCommunityChatDock()
  const location = useLocation()
  const fullPageEntryKey = useMemo(() => {
    const directMatch = location.pathname.match(/^\/community\/chat\/dm\/([^/]+)$/)
    if (directMatch?.[1]) return `direct:${directMatch[1]}`
    const groupMatch = location.pathname.match(/^\/community\/([^/]+)\/chat\/?$/)
    return groupMatch?.[1] ? `group:${groupMatch[1]}` : undefined
  }, [location.pathname])

  const visible = entries.filter((entry) => entry.key !== fullPageEntryKey)
  if (location.pathname !== '/community' || !visible.length) return null

  const open = visible.filter((entry) => !entry.minimized)
  const minimized = visible.filter((entry) => entry.minimized)

  return (
    <div className="pointer-events-none fixed bottom-0 right-4 z-40 hidden items-end gap-3 lg:flex" role="complementary" aria-label="Đoạn chat đang mở">
      {minimized.length ? (
        <div className="pointer-events-auto flex flex-col-reverse gap-2 pb-2">
          {minimized.map((entry) => (
            <DockHead key={entry.key} entry={entry} onOpen={() => toggleMinimize(entry.key)} onClose={() => close(entry.key)} />
          ))}
        </div>
      ) : null}
      {open.map((entry) => (
        <div key={entry.key} className="pointer-events-auto">
          <DockWindow entry={entry} onClose={() => close(entry.key)} onMinimize={() => toggleMinimize(entry.key)} />
        </div>
      ))}
    </div>
  )
}
