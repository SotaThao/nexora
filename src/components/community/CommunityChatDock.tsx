import { CheckCheck, Loader2, Maximize2, Minus, Phone, Send, Video, X } from 'lucide-react'
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
import { useLocation, useNavigate } from 'react-router-dom'
import type { MediaAsset, MessageDto } from '../../data/repositories/community'
import { useCommunityChat } from '../../data/hooks/useCommunityChat'
import { useCommunityMediaUrl } from '../../data/hooks/useCommunity'
import { useCommunityAuth } from './CommunityAuth'

const gradientClass = 'bg-gradient-to-br from-nexoraElectric to-nexoraViolet'
const MAX_OPEN_WINDOWS = 2

type DockChatEntry = {
  channelId: string
  title: string
  minimized: boolean
}

type CommunityChatDockContextValue = {
  entries: DockChatEntry[]
  openDirectChat: (channel: { id: string; title: string }) => void
  close: (channelId: string) => void
  toggleMinimize: (channelId: string) => void
}

const CommunityChatDockContext = createContext<CommunityChatDockContextValue | null>(null)

export function CommunityChatDockProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<DockChatEntry[]>([])

  const openDirectChat = useCallback((channel: { id: string; title: string }) => {
    setEntries((current) => {
      const existing = current.find((entry) => entry.channelId === channel.id)
      if (existing) {
        const rest = current.filter((entry) => entry.channelId !== channel.id)
        return [...rest, { ...existing, title: channel.title, minimized: false }]
      }
      const openCount = current.filter((entry) => !entry.minimized).length
      const overflowIndex = openCount >= MAX_OPEN_WINDOWS ? current.findIndex((entry) => !entry.minimized) : -1
      const next = current.map((entry, index) => (index === overflowIndex ? { ...entry, minimized: true } : entry))
      return [...next, { channelId: channel.id, title: channel.title, minimized: false }]
    })
  }, [])

  const close = useCallback((channelId: string) => {
    setEntries((current) => current.filter((entry) => entry.channelId !== channelId))
  }, [])

  const toggleMinimize = useCallback((channelId: string) => {
    setEntries((current) =>
      current.map((entry) => (entry.channelId === channelId ? { ...entry, minimized: !entry.minimized } : entry)),
    )
  }, [])

  const value = useMemo(
    () => ({ entries, openDirectChat, close, toggleMinimize }),
    [entries, openDirectChat, close, toggleMinimize],
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
  const chat = useCommunityChat(null, { directChannelId: entry.channelId })
  const [body, setBody] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
  }, [chat.messages.length])

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!body.trim() || chat.isSending || !chat.channel) return
    chat
      .sendMessage({ channelId: entry.channelId, body })
      .then(() => setBody(''))
      .catch(() => undefined)
  }

  const expand = () => navigate(`/community/chat/dm/${entry.channelId}`)

  return (
    <div className="flex h-[430px] w-[340px] flex-col overflow-hidden rounded-t-2xl border border-nexoraBorder bg-white font-sans shadow-2xl">
      <header className="flex shrink-0 items-center gap-1 border-b border-nexoraBorder bg-nexoraSurface px-3 py-2.5">
        <Avatar name={entry.title} className="h-9 w-9 text-xs" />
        <h2 className="min-w-0 flex-1 truncate text-sm font-extrabold text-nexoraText">{entry.title}</h2>
        <button type="button" disabled aria-label="Gọi thoại" title="Chưa hỗ trợ gọi thoại trong bản demo" className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-nexoraSubtle opacity-40 cursor-not-allowed"><Phone className="h-3 w-3" aria-hidden="true" /></button>
        <button type="button" disabled aria-label="Gọi video" title="Chưa hỗ trợ gọi video trong bản demo" className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-nexoraSubtle opacity-40 cursor-not-allowed"><Video className="h-3 w-3" aria-hidden="true" /></button>
        <button type="button" onClick={expand} aria-label="Mở toàn màn hình" className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-nexoraMuted hover:bg-nexoraSurfaceMuted"><Maximize2 className="h-3.5 w-3.5" aria-hidden="true" /></button>
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
  const fullPageChannelId = useMemo(() => {
    const match = location.pathname.match(/^\/community\/chat\/dm\/([^/]+)$/)
    return match?.[1]
  }, [location.pathname])

  const visible = entries.filter((entry) => entry.channelId !== fullPageChannelId)
  if (!visible.length) return null

  const open = visible.filter((entry) => !entry.minimized)
  const minimized = visible.filter((entry) => entry.minimized)

  return (
    <div className="pointer-events-none fixed bottom-0 right-4 z-40 hidden items-end gap-3 lg:flex" role="complementary" aria-label="Đoạn chat đang mở">
      {minimized.length ? (
        <div className="pointer-events-auto flex flex-col-reverse gap-2 pb-2">
          {minimized.map((entry) => (
            <DockHead key={entry.channelId} entry={entry} onOpen={() => toggleMinimize(entry.channelId)} onClose={() => close(entry.channelId)} />
          ))}
        </div>
      ) : null}
      {open.map((entry) => (
        <div key={entry.channelId} className="pointer-events-auto">
          <DockWindow entry={entry} onClose={() => close(entry.channelId)} onMinimize={() => toggleMinimize(entry.channelId)} />
        </div>
      ))}
    </div>
  )
}
