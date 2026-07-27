import {
  AlertCircle,
  ArrowLeft,
  BadgeCheck,
  CheckCheck,
  ImagePlus,
  Loader2,
  Pin,
  Reply,
  Send,
  Users,
  WifiOff,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import type { CommunityMemberDto, MediaAsset, MessageDto } from '../../data/repositories/community'
import { useCommunityChat } from '../../data/hooks/useCommunityChat'
import { useCommunityDetail, useCommunityFeedPosts, useCommunityMediaUrl, useCommunityMembers } from '../../data/hooks/useCommunity'
import { mapSupabaseError, type SupabaseDisplayError } from '../../lib/supabaseError'
import { CommunityPersonaSwitcher, useCommunityAuth } from './CommunityAuth'
import { CommunityChatMemberActionsSheet } from './CommunityChatMemberActionsSheet'
import DemoStaffShell from './demo/DemoStaffShell'

const gradientClass = 'bg-gradient-to-br from-nexoraElectric to-nexoraViolet'
const MAX_CHAT_IMAGE_SIZE = 5 * 1024 * 1024
type MediaPhase = 'idle' | 'compressing' | 'uploading' | 'failed'

async function compressChatImage(file: File): Promise<File> {
  if (file.type === 'image/gif') return file
  const bitmap = await createImageBitmap(file)
  try {
    const scale = Math.min(1, 2048 / Math.max(bitmap.width, bitmap.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(bitmap.width * scale))
    canvas.height = Math.max(1, Math.round(bitmap.height * scale))
    const context = canvas.getContext('2d')
    if (!context) throw new Error('Không thể xử lý ảnh đã chọn.')
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((value) => value ? resolve(value) : reject(new Error('Không thể nén ảnh đã chọn.')), 'image/webp', 0.84)
    })
    if (blob.size >= file.size) return file
    return new File([blob], `${file.name.replace(/\.[^.]+$/, '') || 'chat-image'}.webp`, { type: 'image/webp' })
  } finally {
    bitmap.close()
  }
}

function asMediaError(error: unknown): SupabaseDisplayError {
  if (error && typeof error === 'object') {
    const value = error as Partial<SupabaseDisplayError>
    if (typeof value.message === 'string' && typeof value.retryable === 'boolean') return value as SupabaseDisplayError
  }
  return mapSupabaseError(error)
}

function initials(name?: string | null) {
  return (name || 'N').split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase()
}

function Avatar({ name }: { name?: string | null }) {
  return <span aria-hidden="true" className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ${gradientClass} text-[10px] font-extrabold text-white`}>{initials(name)}</span>
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat('vi-VN', { hour: '2-digit', minute: '2-digit' }).format(new Date(value))
}

function dayKey(value: string) {
  const date = new Date(value)
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
}

function formatDay(value: string) {
  const date = new Date(value)
  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(today.getDate() - 1)
  if (dayKey(value) === dayKey(today.toISOString())) return 'Hôm nay'
  if (dayKey(value) === dayKey(yesterday.toISOString())) return 'Hôm qua'
  return new Intl.DateTimeFormat('vi-VN', { day: 'numeric', month: 'long', year: 'numeric' }).format(date)
}

function memberName(message: MessageDto, members: Map<string, CommunityMemberDto>) {
  return message.sender?.displayName || members.get(message.senderId)?.profile?.displayName || 'Thành viên Nexora'
}

function ChatMessageImage({ asset }: { asset: MediaAsset }) {
  const mediaUrl = useCommunityMediaUrl(asset)
  if (mediaUrl.isLoading) {
    return <div className="h-44 w-56 animate-pulse rounded-lg bg-nexoraSurfaceMuted" aria-label="Đang tải ảnh" />
  }
  if (mediaUrl.error || !mediaUrl.data) {
    return <div className="grid h-28 w-52 place-items-center rounded-lg bg-nexoraSurfaceMuted px-3 text-center text-xs font-semibold text-nexoraDanger">Không thể tải ảnh</div>
  }
  return <img src={mediaUrl.data} alt={asset.altText || 'Ảnh trong tin nhắn'} className="max-h-[360px] w-full min-w-[210px] rounded-lg object-cover" loading="lazy" />
}

function ChatBubble({
  message,
  members,
  messagesById,
  currentUserId,
  isFirstInRun,
  isLastInRun,
  onReply,
}: {
  message: MessageDto
  members: Map<string, CommunityMemberDto>
  messagesById: Map<string, MessageDto>
  currentUserId?: string
  isFirstInRun: boolean
  isLastInRun: boolean
  onReply: (message: MessageDto) => void
}) {
  const isOwn = message.senderId === currentUserId
  const senderName = memberName(message, members)
  const quoted = message.replyToMessageId ? messagesById.get(message.replyToMessageId) : undefined
  const quotedName = quoted ? memberName(quoted, members) : 'Tin nhắn gốc'
  const groupedCornerClass = isOwn
    ? `${isFirstInRun ? '' : 'rounded-tr-md'} ${isLastInRun ? '' : 'rounded-br-md'}`
    : `${isFirstInRun ? '' : 'rounded-tl-md'} ${isLastInRun ? '' : 'rounded-bl-md'}`

  return (
    <article className={`flex max-w-[86%] items-end gap-2 sm:max-w-[78%] ${isOwn ? 'ml-auto flex-row-reverse' : ''}`}>
      {!isOwn ? (isLastInRun ? <Avatar name={senderName} /> : <span aria-hidden="true" className="h-8 w-8 shrink-0" />) : null}
      <div className={`min-w-0 rounded-2xl px-3 py-2 shadow-[0_1px_2px_rgba(11,18,32,0.06)] ${groupedCornerClass} ${isOwn ? 'bg-nexoraBrand' : 'bg-nexoraSurfaceMuted'}`}>
        {!isOwn && isFirstInRun ? <p className="mb-0.5 text-xs font-extrabold text-nexoraViolet">{senderName}</p> : null}
        {message.replyToMessageId ? (
          <div className={`mb-1.5 rounded-md border-l-[3px] px-2 py-1 text-xs leading-snug ${isOwn ? 'border-white/70 bg-white/10 text-white/80' : 'border-nexoraBrand bg-nexoraBrandSoft text-nexoraMuted'}`}>
            <b className={`block text-[11px] ${isOwn ? 'text-white' : 'text-nexoraBrand'}`}>{quotedName}</b>
            <span className="line-clamp-2">{quoted?.body || (quoted?.media.length ? 'Ảnh' : 'Tin nhắn này không còn trong lịch sử đã tải.')}</span>
          </div>
        ) : null}
        {message.media.length ? <div className="mb-1.5 grid gap-1.5">{message.media.map((asset) => <ChatMessageImage key={`${message.id}:${asset.path}`} asset={asset} />)}</div> : null}
        {message.body ? <p className={`whitespace-pre-wrap break-words text-[13.5px] leading-relaxed ${isOwn ? 'text-white' : 'text-nexoraText'}`}>{message.body}</p> : null}
        {isLastInRun || isOwn ? <div className={`mt-1 flex items-center justify-end gap-1 text-[10.5px] ${isOwn ? 'text-white/70' : 'text-nexoraSubtle'}`}>
          {isLastInRun ? <time dateTime={message.createdAt}>{formatTime(message.createdAt)}</time> : null}
          {isOwn ? <CheckCheck className="h-3.5 w-3.5 text-white/80" aria-label="Đã gửi" /> : null}
        </div> : null}
        <button type="button" onClick={() => onReply(message)} className={`mt-1 inline-flex min-h-7 items-center gap-1 text-[11px] font-bold ${isOwn ? 'text-white/80 hover:text-white' : 'text-nexoraMuted hover:text-nexoraBrand'}`} aria-label={`Trả lời ${senderName}`}>
          <Reply className="h-3.5 w-3.5" aria-hidden="true" />Trả lời
        </button>
      </div>
    </article>
  )
}

function ChatSkeleton() {
  return <div className="space-y-3 px-4 py-5" aria-label="Đang tải tin nhắn"><div className="h-16 w-4/5 animate-pulse rounded-xl bg-nexoraSurfaceMuted" /><div className="ml-auto h-20 w-3/5 animate-pulse rounded-xl bg-nexoraBrandSoft" /><div className="h-14 w-2/3 animate-pulse rounded-xl bg-nexoraSurfaceMuted" /></div>
}

export function CommunityChat() {
  const { id = '' } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useCommunityAuth()
  const detail = useCommunityDetail(id)
  const membersQuery = useCommunityMembers(id)
  const postsQuery = useCommunityFeedPosts(id)
  const chat = useCommunityChat(id)
  const [body, setBody] = useState('')
  const [replyTo, setReplyTo] = useState<MessageDto | null>(null)
  const [memberSheetOpen, setMemberSheetOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [uploadedMedia, setUploadedMedia] = useState<MediaAsset | null>(null)
  const [mediaMessageId, setMediaMessageId] = useState<string | null>(null)
  const [mediaPhase, setMediaPhase] = useState<MediaPhase>('idle')
  const [uploadProgress, setUploadProgress] = useState(0)
  const [mediaError, setMediaError] = useState<SupabaseDisplayError | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
  }, [previewUrl])

  const goBack = () => {
    if (location.key === 'default') {
      navigate(`/community/${id}`)
      return
    }
    navigate(-1)
  }

  const members = useMemo(() => membersQuery.data?.pages.flatMap((page) => page.items) ?? [], [membersQuery.data])
  const membersByUserId = useMemo(() => new Map(members.map((member) => [member.userId, member])), [members])
  const messagesById = useMemo(() => new Map(chat.messages.map((message) => [message.id, message])), [chat.messages])
  const announcement = postsQuery.data?.pages.flatMap((page) => page.items).find((post) => post.isAnnouncement)
  const retryError = chat.error || detail.error || membersQuery.error
  const composerBusy = chat.isSending || chat.isUploadingMedia || mediaPhase === 'compressing' || mediaPhase === 'uploading'
  const composerError = mediaError || chat.uploadError || chat.sendError

  const clearMedia = () => {
    setSelectedFile(null)
    setPreviewUrl(null)
    setUploadedMedia(null)
    setMediaMessageId(null)
    setMediaPhase('idle')
    setUploadProgress(0)
    setMediaError(null)
    chat.resetMediaUpload()
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const selectImage = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    clearMedia()
    if (!file.type.startsWith('image/')) {
      setMediaError({ message: 'Vui lòng chọn một tệp ảnh.', retryable: false })
      return
    }
    setSelectedFile(file)
    setPreviewUrl(URL.createObjectURL(file))
    setMediaMessageId(crypto.randomUUID())
  }

  const ensureMediaUploaded = async () => {
    if (uploadedMedia) return uploadedMedia
    if (!selectedFile || !mediaMessageId || !detail.data) return null
    setMediaError(null)
    chat.resetMediaUpload()
    try {
      setMediaPhase('compressing')
      setUploadProgress(0.03)
      const compressed = await compressChatImage(selectedFile)
      if (compressed.size > MAX_CHAT_IMAGE_SIZE) {
        throw { message: 'Ảnh sau khi nén vẫn vượt quá 5 MB.', retryable: false } satisfies SupabaseDisplayError
      }
      setMediaPhase('uploading')
      const media = await chat.uploadMessageMedia({
        communityId: id,
        messageId: mediaMessageId,
        visibility: detail.data.visibility,
        file: compressed,
        onProgress: setUploadProgress,
      })
      setUploadedMedia(media)
      setMediaPhase('idle')
      return media
    } catch (error) {
      setMediaPhase('failed')
      setMediaError(asMediaError(error))
      throw error
    }
  }

  const sendCurrentMessage = async () => {
    if ((!body.trim() && !selectedFile && !uploadedMedia) || !chat.channel || chat.isSending || chat.isUploadingMedia) return
    try {
      const media = await ensureMediaUploaded()
      if ((selectedFile || uploadedMedia) && !media) return
      await chat.sendMessage({
        ...(mediaMessageId ? { id: mediaMessageId } : {}),
        channelId: chat.channel.id,
        body,
        media: media ? [media] : undefined,
        replyToMessageId: replyTo?.id ?? null,
      })
      setBody('')
      setReplyTo(null)
      clearMedia()
    } catch {
      // Upload and send errors remain visible with retryable composer state.
    }
  }

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    void sendCurrentMessage()
  }

  const retry = () => {
    chat.retry()
    void detail.refetch()
    void membersQuery.refetch()
  }

  const renderTimeline = () => {
    if (chat.isLoading) return <ChatSkeleton />
    if (!chat.messages.length) return <div className="flex min-h-[280px] items-center justify-center px-6 text-center"><div><Send className="mx-auto h-8 w-8 text-nexoraBrand" aria-hidden="true" /><h2 className="mt-3 text-base font-extrabold text-nexoraText">Bắt đầu cuộc trò chuyện</h2><p className="mt-1 text-sm text-nexoraMuted">Gửi một tin nhắn để chào mọi người trong nhóm.</p></div></div>
    return <div className="px-3 py-4">{chat.hasOlderMessages ? <button type="button" onClick={() => void chat.loadOlder()} disabled={chat.isLoadingOlder} className="mx-auto mb-3 flex min-h-9 items-center gap-2 rounded-full bg-nexoraSurfaceMuted px-3 text-xs font-bold text-nexoraMuted hover:bg-nexoraBrandSoft disabled:opacity-60">{chat.isLoadingOlder ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> : null}Tải tin nhắn cũ hơn</button> : null}{chat.messages.map((message, index) => {
      const previous = chat.messages[index - 1]
      const next = chat.messages[index + 1]
      const startsNewDay = !previous || dayKey(previous.createdAt) !== dayKey(message.createdAt)
      const isFirstInRun = !previous || previous.senderId !== message.senderId || startsNewDay
      const isLastInRun = !next || next.senderId !== message.senderId || dayKey(next.createdAt) !== dayKey(message.createdAt)
      return <div key={message.id} className={`${isFirstInRun ? 'mt-3' : 'mt-0.5'} first:mt-0`}>{startsNewDay ? <p className="mx-auto mb-3 w-fit rounded-full bg-nexoraSurfaceMuted px-3 py-1 text-[11px] font-semibold text-nexoraSubtle">{formatDay(message.createdAt)}</p> : null}<ChatBubble message={message} members={membersByUserId} messagesById={messagesById} currentUserId={user?.id} isFirstInRun={isFirstInRun} isLastInRun={isLastInRun} onReply={setReplyTo} /></div>
    })}</div>
  }

  return (
    <>
      <CommunityPersonaSwitcher />
      <DemoStaffShell onDemoNavigation={() => navigate('/community')}>
        <main className="mx-auto flex h-full min-h-0 w-full max-w-[720px] flex-col overflow-hidden border-x border-nexoraBorder bg-nexoraCanvas font-sans shadow-nexora-card lg:h-auto lg:min-h-[calc(100vh-120px)]">
          <header className="flex items-center gap-3 border-b border-nexoraBorder bg-nexoraSurface px-3 py-3">
            <button type="button" onClick={goBack} className="grid h-11 w-11 place-items-center rounded-full text-nexoraMuted hover:bg-nexoraSurfaceMuted" aria-label="Quay lại nhóm"><ArrowLeft className="h-5 w-5" aria-hidden="true" /></button>
            <Avatar name={detail.data?.name} />
            <div className="min-w-0 flex-1"><div className="flex items-center gap-1"><h1 className="truncate text-sm font-extrabold text-nexoraText">{detail.data?.name || 'Nhóm Community'}</h1>{detail.data?.verified ? <BadgeCheck className="h-4 w-4 shrink-0 text-nexoraSuccess" aria-label="Đã xác minh" /> : null}</div><p className="text-[11px] text-nexoraSubtle">{members.length} thành viên</p></div>
            <button type="button" onClick={() => setMemberSheetOpen(true)} className="grid h-10 w-10 place-items-center rounded-full text-nexoraMuted hover:bg-nexoraSurfaceMuted" aria-label="Mở danh sách thành viên"><Users className="h-5 w-5" aria-hidden="true" /></button>
            {chat.isReconnecting ? <span className="inline-flex items-center gap-1 rounded-full bg-nexoraWarning/10 px-2 py-1 text-[10px] font-bold text-nexoraWarning"><WifiOff className="h-3 w-3" aria-hidden="true" />Đang kết nối lại</span> : null}
          </header>

          <section className="flex items-center gap-2 border-b border-nexoraBorder bg-nexoraBrandSoft px-3 py-2 text-xs" aria-label="Thông báo ghim">
            <span className="h-7 w-[3px] rounded-full bg-nexoraBrand" aria-hidden="true" />
            <Pin className="h-4 w-4 shrink-0 text-nexoraBrand" aria-label="Ghim" />
            <p className="min-w-0 truncate text-nexoraMuted"><b className="mr-1 text-nexoraBrand">Ghim</b>{announcement?.body || 'Chưa có thông báo ghim từ chủ nhóm.'}</p>
          </section>

          {retryError ? <div className="mx-3 mt-3 flex items-start gap-2 rounded-xl border border-nexoraDanger/30 bg-red-50 px-3 py-2 text-xs text-nexoraDanger" role="alert"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" /><p className="flex-1 leading-relaxed">{retryError.message}</p><button type="button" onClick={retry} className="min-h-8 rounded-lg px-2 font-extrabold hover:bg-red-100">Thử lại</button></div> : null}

          <section className="min-h-0 flex-1 overflow-y-auto">{renderTimeline()}</section>

          <form onSubmit={(event) => void submit(event)} className="shrink-0 border-t border-nexoraBorder bg-nexoraSurface p-3">
            {replyTo ? <div className="mb-2 flex items-center gap-2 rounded-lg border-l-[3px] border-nexoraBrand bg-nexoraBrandSoft px-2 py-1.5 text-xs text-nexoraMuted"><Reply className="h-4 w-4 shrink-0 text-nexoraBrand" aria-hidden="true" /><p className="min-w-0 flex-1 truncate"><b className="text-nexoraBrand">Đang trả lời</b> · {replyTo.body || (replyTo.media.length ? 'Ảnh' : 'Tin nhắn')}</p><button type="button" onClick={() => setReplyTo(null)} className="grid h-7 w-7 place-items-center rounded-full hover:bg-white/70" aria-label="Hủy trả lời"><X className="h-4 w-4" aria-hidden="true" /></button></div> : null}
            {previewUrl ? (
              <div className="mb-2 flex items-center gap-3 rounded-xl border border-nexoraBorder bg-nexoraSurfaceMuted p-2">
                <img src={previewUrl} alt="Ảnh sắp gửi" className="h-16 w-16 rounded-lg object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold text-nexoraText">{selectedFile?.name || 'Ảnh đã tải lên'}</p>
                  <p className="mt-0.5 text-[11px] text-nexoraMuted">{mediaPhase === 'compressing' ? 'Đang nén ảnh…' : mediaPhase === 'uploading' ? `Đang tải lên ${Math.round(uploadProgress * 100)}%` : uploadedMedia ? 'Sẵn sàng gửi' : mediaPhase === 'failed' ? 'Tải ảnh thất bại' : 'Ảnh sẽ được nén trước khi gửi'}</p>
                  {(mediaPhase === 'compressing' || mediaPhase === 'uploading') ? <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-nexoraBorder"><span className="block h-full rounded-full bg-nexoraBrand transition-[width]" style={{ width: `${Math.max(4, Math.round(uploadProgress * 100))}%` }} /></div> : null}
                  {mediaPhase === 'failed' ? <button type="button" onClick={() => void ensureMediaUploaded().catch(() => undefined)} className="mt-1 text-[11px] font-extrabold text-nexoraBrand hover:text-nexoraViolet">Thử lại tải ảnh</button> : null}
                </div>
                <button type="button" onClick={clearMedia} disabled={composerBusy} className="grid h-8 w-8 place-items-center rounded-full text-nexoraMuted hover:bg-white disabled:opacity-50" aria-label="Bỏ ảnh đã chọn"><X className="h-4 w-4" aria-hidden="true" /></button>
              </div>
            ) : null}
            {composerError ? <p className="mb-2 text-xs font-semibold text-nexoraDanger" role="alert">{composerError.message}</p> : null}
            <div className="flex items-center gap-2">
              <input ref={fileInputRef} type="file" accept="image/*" onChange={selectImage} className="sr-only" aria-label="Chọn ảnh gửi trong tin nhắn" />
              <button type="button" onClick={() => fileInputRef.current?.click()} disabled={!chat.channel || composerBusy} className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-nexoraBrand hover:bg-nexoraBrandSoft disabled:cursor-not-allowed disabled:opacity-50" aria-label="Đính kèm ảnh"><ImagePlus className="h-5 w-5" aria-hidden="true" /></button>
              <input value={body} onChange={(event) => setBody(event.target.value)} maxLength={5_000} disabled={!chat.channel || composerBusy} placeholder="Nhắn tin…" aria-label="Nội dung tin nhắn" className="min-h-11 min-w-0 flex-1 rounded-full border border-nexoraBorder bg-nexoraSurfaceMuted px-4 text-sm text-nexoraText outline-none placeholder:text-nexoraSubtle focus:border-nexoraBrand disabled:opacity-60" />
              <button type="submit" disabled={(!body.trim() && !selectedFile && !uploadedMedia) || !chat.channel || composerBusy} className={`grid h-11 w-11 shrink-0 place-items-center rounded-full text-white ${gradientClass} disabled:cursor-not-allowed disabled:opacity-50`} aria-label="Gửi tin nhắn">{composerBusy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Send className="h-4 w-4" aria-hidden="true" />}</button>
            </div>
          </form>
        </main>
        <CommunityChatMemberActionsSheet open={memberSheetOpen} onClose={() => setMemberSheetOpen(false)} communityId={id} members={members} currentUserId={user?.id} />
      </DemoStaffShell>
    </>
  )
}
