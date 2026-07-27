import {
  AlertCircle,
  ArrowLeft,
  CheckCheck,
  Loader2,
  Reply,
  Send,
  UserCheck,
  WifiOff,
  X,
} from 'lucide-react'
import { useMemo, useState, type FormEvent } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import type { MessageDto } from '../../data/repositories/community'
import { useCommunityChat } from '../../data/hooks/useCommunityChat'
import { useDirectChannels } from '../../data/hooks/useDirectMessages'
import { CommunityPersonaSwitcher, useCommunityAuth } from './CommunityAuth'
import DemoStaffShell from './demo/DemoStaffShell'
import { formatJoinedDate } from '../../utils/localDate'

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

function Avatar({ name }: { name?: string | null }) {
  return (
    <span
      aria-hidden="true"
      className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${gradientClass} text-xs font-extrabold text-white`}
    >
      {initials(name)}
    </span>
  )
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat('vi-VN', { hour: '2-digit', minute: '2-digit' }).format(
    new Date(value),
  )
}

function dayKey(value: string) {
  const date = new Date(value)
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
}

function DirectChatBubble({
  message,
  messagesById,
  currentUserId,
  recipientName,
  isFirstInRun,
  isLastInRun,
  onReply,
}: {
  message: MessageDto
  messagesById: Map<string, MessageDto>
  currentUserId?: string
  recipientName: string
  isFirstInRun: boolean
  isLastInRun: boolean
  onReply: (message: MessageDto) => void
}) {
  const isOwn = message.senderId === currentUserId
  const senderName = isOwn ? 'Bạn' : recipientName
  const quoted = message.replyToMessageId ? messagesById.get(message.replyToMessageId) : undefined
  const quotedName = quoted ? (quoted.senderId === currentUserId ? 'Bạn' : recipientName) : 'Tin nhắn'
  const groupedCornerClass = isOwn
    ? `${isFirstInRun ? '' : 'rounded-tr-md'} ${isLastInRun ? '' : 'rounded-br-md'}`
    : `${isFirstInRun ? '' : 'rounded-tl-md'} ${isLastInRun ? '' : 'rounded-bl-md'}`

  return (
    <article className={`flex max-w-[86%] items-end gap-2 sm:max-w-[78%] ${isOwn ? 'ml-auto flex-row-reverse' : ''}`}>
      {!isOwn ? (isLastInRun ? <Avatar name={senderName} /> : <span aria-hidden="true" className="h-9 w-9 shrink-0" />) : null}
      <div
        className={`min-w-0 rounded-2xl px-3 py-2 shadow-[0_1px_2px_rgba(11,18,32,0.06)] ${groupedCornerClass} ${
          isOwn ? 'bg-nexoraBrand' : 'bg-nexoraSurfaceMuted'
        }`}
      >
        {!isOwn && isFirstInRun ? <p className="mb-0.5 text-xs font-extrabold text-nexoraViolet">{senderName}</p> : null}
        {message.replyToMessageId ? (
          <div className={`mb-1.5 rounded-md border-l-[3px] px-2 py-1 text-xs leading-snug ${isOwn ? 'border-white/70 bg-white/10 text-white/80' : 'border-nexoraBrand bg-nexoraBrandSoft text-nexoraMuted'}`}>
            <b className={`block text-[11px] ${isOwn ? 'text-white' : 'text-nexoraBrand'}`}>{quotedName}</b>
            <span className="line-clamp-2">{quoted?.body || 'Tin nhắn gốc'}</span>
          </div>
        ) : null}
        <p className={`whitespace-pre-wrap break-words text-[13.5px] leading-relaxed ${isOwn ? 'text-white' : 'text-nexoraText'}`}>
          {message.body}
        </p>
        {isLastInRun || isOwn ? <div className={`mt-1 flex items-center justify-end gap-1 text-[10.5px] ${isOwn ? 'text-white/70' : 'text-nexoraSubtle'}`}>
          {isLastInRun ? <time dateTime={message.createdAt}>{formatTime(message.createdAt)}</time> : null}
          {isOwn ? <CheckCheck className="h-3.5 w-3.5 text-white/80" aria-label="Đã gửi" /> : null}
        </div> : null}
        <button
          type="button"
          onClick={() => onReply(message)}
          className={`mt-1 inline-flex min-h-7 items-center gap-1 text-[11px] font-bold ${isOwn ? 'text-white/80 hover:text-white' : 'text-nexoraMuted hover:text-nexoraBrand'}`}
          aria-label={`Trả lời ${senderName}`}
        >
          <Reply className="h-3.5 w-3.5" aria-hidden="true" /> Trả lời
        </button>
      </div>
    </article>
  )
}

export function CommunityDirectChat() {
  const location = useLocation()
  const { channelId = '' } = useParams()
  const navigate = useNavigate()
  const { user } = useCommunityAuth()
  const directChannels = useDirectChannels({ enabled: Boolean(user) })

  const currentChannel = useMemo(
    () => directChannels.data?.find((ch) => ch.id === channelId),
    [directChannels.data, channelId],
  )

  const chat = useCommunityChat(null, { directChannelId: channelId })
  const [body, setBody] = useState('')
  const [replyTo, setReplyTo] = useState<MessageDto | null>(null)

  const recipientName = currentChannel?.otherParticipant.displayName || 'Người dùng Nexora'
  const messagesById = useMemo(
    () => new Map(chat.messages.map((message) => [message.id, message])),
    [chat.messages],
  )

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!body.trim() || chat.isSending) return
    try {
      await chat.sendMessage({ channelId, body, replyToMessageId: replyTo?.id ?? null })
      setBody('')
      setReplyTo(null)
    } catch {
      // Error handled by mutation
    }
  }

  const renderTimeline = () => {
    if (chat.isLoading) {
      return (
        <div className="space-y-3 px-4 py-5" aria-label="Đang tải tin nhắn">
          <div className="h-16 w-4/5 animate-pulse rounded-xl bg-nexoraSurfaceMuted" />
          <div className="ml-auto h-20 w-3/5 animate-pulse rounded-xl bg-nexoraBrandSoft" />
        </div>
      )
    }
    if (!chat.messages.length) {
      return (
        <div className="flex min-h-[280px] items-center justify-center px-6 text-center">
          <div>
            <Send className="mx-auto h-8 w-8 text-nexoraBrand" aria-hidden="true" />
            <h2 className="mt-3 text-base font-extrabold text-nexoraText">Cuộc trò chuyện mới</h2>
            <p className="mt-1 text-sm text-nexoraMuted">Gửi tin nhắn để bắt đầu trò chuyện với {recipientName}.</p>
          </div>
        </div>
      )
    }
    return (
      <div className="px-3 py-4">
        {chat.hasOlderMessages ? (
          <button
            type="button"
            onClick={() => void chat.loadOlder()}
            disabled={chat.isLoadingOlder}
            className="mx-auto mb-3 flex min-h-9 items-center gap-2 rounded-full bg-nexoraSurfaceMuted px-3 text-xs font-bold text-nexoraMuted hover:bg-nexoraBrandSoft disabled:opacity-60"
          >
            {chat.isLoadingOlder ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
            ) : null}
            Tải tin nhắn cũ hơn
          </button>
        ) : null}
        {chat.messages.map((message, index) => {
          const previous = chat.messages[index - 1]
          const next = chat.messages[index + 1]
          const startsNewDay = !previous || dayKey(previous.createdAt) !== dayKey(message.createdAt)
          const isFirstInRun = !previous || previous.senderId !== message.senderId || startsNewDay
          const isLastInRun = !next || next.senderId !== message.senderId || dayKey(next.createdAt) !== dayKey(message.createdAt)
          return (
            <div key={message.id} className={`${isFirstInRun ? 'mt-3' : 'mt-0.5'} first:mt-0`}>
              {startsNewDay ? (
                <p className="mx-auto mb-3 w-fit rounded-full bg-nexoraSurfaceMuted px-3 py-1 text-[11px] font-semibold text-nexoraSubtle">
                  {formatJoinedDate(message.createdAt)}
                </p>
              ) : null}
              <DirectChatBubble
                message={message}
                messagesById={messagesById}
                currentUserId={user?.id}
                recipientName={recipientName}
                isFirstInRun={isFirstInRun}
                isLastInRun={isLastInRun}
                onReply={setReplyTo}
              />
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <>
      <CommunityPersonaSwitcher />
      <DemoStaffShell onDemoNavigation={() => navigate('/community')}>
        <main className="mx-auto flex h-full min-h-0 w-full max-w-[720px] flex-col overflow-hidden border-x border-nexoraBorder bg-nexoraCanvas font-sans shadow-nexora-card lg:h-auto lg:min-h-[calc(100vh-120px)]">
          <header className="flex items-center gap-3 border-b border-nexoraBorder bg-nexoraSurface px-3 py-3">
            <button
              type="button"
              onClick={() => {
                if (location.key === 'default') {
                  navigate('/community/chat')
                  return
                }
                navigate(-1)
              }}
              className="grid h-10 w-10 place-items-center rounded-full text-nexoraMuted hover:bg-nexoraSurfaceMuted"
              aria-label="Quay lại danh sách nhắn tin"
            >
              <ArrowLeft className="h-5 w-5" aria-hidden="true" />
            </button>
            <Avatar name={recipientName} />
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-sm font-extrabold text-nexoraText">{recipientName}</h1>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-nexoraBrand">
                <UserCheck className="h-3 w-3" /> Trò chuyện 1:1
              </span>
            </div>
            {chat.isReconnecting ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-nexoraWarning/10 px-2 py-1 text-[10px] font-bold text-nexoraWarning">
                <WifiOff className="h-3 w-3" aria-hidden="true" /> Kết nối lại
              </span>
            ) : null}
          </header>

          {chat.error ? (
            <div
              className="mx-3 mt-3 flex items-start gap-2 rounded-xl border border-nexoraDanger/30 bg-red-50 px-3 py-2 text-xs text-nexoraDanger"
              role="alert"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <p className="flex-1 leading-relaxed">{chat.error.message}</p>
              <button
                type="button"
                onClick={chat.retry}
                className="min-h-8 rounded-lg px-2 font-extrabold hover:bg-red-100"
              >
                Thử lại
              </button>
            </div>
          ) : null}

          <section className="min-h-0 flex-1 overflow-y-auto">{renderTimeline()}</section>

          <form onSubmit={(event) => void submit(event)} className="shrink-0 border-t border-nexoraBorder bg-nexoraSurface p-3">
            {replyTo ? (
              <div className="mb-2 flex items-center gap-2 rounded-lg border-l-[3px] border-nexoraBrand bg-nexoraBrandSoft px-2 py-1.5 text-xs text-nexoraMuted">
                <Reply className="h-4 w-4 shrink-0 text-nexoraBrand" aria-hidden="true" />
                <p className="min-w-0 flex-1 truncate">
                  <b className="text-nexoraBrand">Đang trả lời</b> · {replyTo.body}
                </p>
                <button
                  type="button"
                  onClick={() => setReplyTo(null)}
                  className="grid h-7 w-7 place-items-center rounded-full hover:bg-white/70"
                  aria-label="Hủy trả lời"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            ) : null}
            {chat.sendError ? (
              <p className="mb-2 text-xs font-semibold text-nexoraDanger" role="alert">
                {chat.sendError.message}
              </p>
            ) : null}
            <div className="flex items-center gap-2">
              <input
                value={body}
                onChange={(event) => setBody(event.target.value)}
                maxLength={5000}
                disabled={chat.isSending}
                placeholder="Nhắn tin..."
                aria-label="Nội dung tin nhắn"
                className="min-h-11 min-w-0 flex-1 rounded-full border border-nexoraBorder bg-nexoraSurfaceMuted px-4 text-sm text-nexoraText outline-none placeholder:text-nexoraSubtle focus:border-nexoraBrand disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={!body.trim() || chat.isSending}
                className={`grid h-11 w-11 shrink-0 place-items-center rounded-full text-white ${gradientClass} disabled:cursor-not-allowed disabled:opacity-50`}
                aria-label="Gửi tin nhắn"
              >
                {chat.isSending ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Send className="h-4 w-4" aria-hidden="true" />
                )}
              </button>
            </div>
          </form>
        </main>
      </DemoStaffShell>
    </>
  )
}
