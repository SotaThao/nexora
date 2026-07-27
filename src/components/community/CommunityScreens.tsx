import {
  BadgeCheck,
  ChevronLeft,
  AlertCircle,
  Heart,
  Image as ImageIcon,
  Loader2,
  LockKeyhole,
  MessageCircle,
  MessagesSquare,
  Plus,
  Send,
  ShieldCheck,
  Sparkles,
  Store,
  Users,
  X,
} from 'lucide-react'
import { useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { Link, Outlet, useNavigate, useParams } from 'react-router-dom'
import type { CommunityDto, CommunityMemberDto, PostDto } from '../../data/repositories/community'
import type { ReactionType } from '../../data/community/enums'
import {
  useApproveJoinRequest,
  useCommunityBySlug,
  useCommunityComments,
  useCommunityDetail,
  useCommunityFeedPosts,
  useCommunityJoinRequests,
  useCommunityList,
  useCommunityMembers,
  useConsumeInvite,
  useCreateCommunity,
  useCreateCommunityComment,
  useInvitePreview,
  useMyCommunities,
  usePostReactions,
  useRejectJoinRequest,
  useToggleCommunityReaction,
} from '../../data/hooks/useCommunity'
import DemoStaffShell from './demo/DemoStaffShell'
import { CommunityAuthProvider, CommunityPersonaSwitcher, useCommunityAuth } from './CommunityAuth'
import { CommunityChatDock, CommunityChatDockProvider } from './CommunityChatDock'
import { CommunityNotificationBell, CommunityNotificationsProvider } from './CommunityNotifications'
import { CommunityPostComposer, CommunityPostMedia } from './CommunityPostMedia'
import { CommunityRightRail } from './CommunityRightRail'

const cardClass = 'overflow-hidden rounded-xl border border-nexoraBorder bg-nexoraSurface shadow-nexora-card'
const gradientClass = 'bg-gradient-to-br from-nexoraElectric to-nexoraViolet'

function initials(name?: string | null) {
  return (name || 'N').split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase()
}

function relativeTime(value: string) {
  const seconds = Math.max(0, Math.round((Date.now() - new Date(value).getTime()) / 1_000))
  if (seconds < 60) return 'Vừa xong'
  if (seconds < 3_600) return `${Math.floor(seconds / 60)} phút`
  if (seconds < 86_400) return `${Math.floor(seconds / 3_600)} giờ`
  return `${Math.floor(seconds / 86_400)} ngày`
}

function Avatar({ name, className = '' }: { name?: string | null; className?: string }) {
  return <span aria-hidden="true" className={`grid shrink-0 place-items-center rounded-full ${gradientClass} text-xs font-extrabold text-white ${className}`}>{initials(name)}</span>
}

function Verified() {
  return <BadgeCheck aria-label="Đã xác minh" className="h-4 w-4 shrink-0 text-nexoraSuccess" />
}

function LoadingState({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3" aria-label="Đang tải">
      {Array.from({ length: rows }, (_, index) => <div key={index} className="h-28 animate-pulse rounded-2xl bg-nexoraSurfaceMuted" />)}
    </div>
  )
}

function ErrorState({ error, onRetry }: { error: { message: string; retryable?: boolean }; onRetry: () => void }) {
  return (
    <section className={`${cardClass} px-5 py-8 text-center`} role="alert">
      <AlertCircle className="mx-auto h-7 w-7 text-nexoraDanger" aria-hidden="true" />
      <h2 className="mt-3 text-base font-extrabold text-nexoraText">Không tải được nội dung</h2>
      <p className="mt-2 text-sm leading-relaxed text-nexoraMuted">{error.message}</p>
      <button type="button" onClick={onRetry} className="mt-4 min-h-11 rounded-xl border border-nexoraBorder px-4 text-sm font-bold text-nexoraBrand hover:bg-nexoraBrandSoft">
        {error.retryable === false ? 'Thử lại' : 'Tải lại'}
      </button>
    </section>
  )
}

function EmptyState({ title, children }: { title: string; children: ReactNode }) {
  return <section className={`${cardClass} px-6 py-10 text-center`}><Sparkles className="mx-auto h-8 w-8 text-nexoraBrand" aria-hidden="true" /><h2 className="mt-3 text-base font-extrabold text-nexoraText">{title}</h2><p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-nexoraMuted">{children}</p></section>
}

function CommunityFrame({ children, containerClassName }: { children: ReactNode; containerClassName?: string }) {
  const navigate = useNavigate()
  return (
    <>
      <CommunityPersonaSwitcher />
      <DemoStaffShell onDemoNavigation={() => navigate('/community')}>
        <div className={containerClassName ?? 'mx-auto w-full max-w-[680px] space-y-4 pb-20'}>{children}</div>
      </DemoStaffShell>
    </>
  )
}

function CommunityStoryRings({ communities }: { communities: CommunityDto[] }) {
  return (
    <section className="overflow-hidden rounded-xl border border-nexoraBorder bg-nexoraSurface px-4 py-3 shadow-nexora-card" aria-label="Nhóm của bạn">
      <div className="flex gap-3 overflow-x-auto pb-1">
        {communities.map((community, index) => (
          <Link key={community.id} to={`/community/${community.id}`} className="w-16 shrink-0 text-center">
            <span className={`mx-auto block w-[62px] rounded-full p-[3px] ${index === 0 ? gradientClass : 'bg-nexoraRule'}`}>
              <Avatar name={community.name} className="h-14 w-14 border-2 border-white text-sm" />
            </span>
            <span className="mt-1 block truncate text-xs font-semibold text-nexoraMuted">{community.name}</span>
          </Link>
        ))}
        <Link to="/community/new" className="w-16 shrink-0 text-center">
          <span className="mx-auto grid h-[62px] w-[62px] place-items-center rounded-full border-2 border-dashed border-nexoraBrand bg-nexoraSurfaceMuted text-nexoraBrand"><Plus className="h-5 w-5" aria-hidden="true" /></span>
          <span className="mt-1 block text-xs font-semibold text-nexoraMuted">Khám phá</span>
        </Link>
      </div>
    </section>
  )
}

function PostComposer({ communityId, onClose }: { communityId: string; onClose: () => void }) {
  const community = useCommunityDetail(communityId)
  if (community.isLoading) return <div className="h-40 animate-pulse rounded-xl bg-nexoraSurfaceMuted" aria-label="Đang tải trình soạn bài" />
  if (!community.data) return null
  return <CommunityPostComposer community={community.data} onClose={onClose} />
}

function QuickComposer({ communityId, onOpen }: { communityId?: string; onOpen: () => void }) {
  const { isAnonymous, user } = useCommunityAuth()
  if (!communityId || isAnonymous) return null
  return <button type="button" onClick={onOpen} className="flex w-full items-center gap-3 rounded-xl border border-nexoraBorder bg-nexoraSurface px-4 py-3 text-left shadow-nexora-card"><Avatar name={user?.email} className="h-10 w-10" /><span className="flex min-h-11 flex-1 items-center rounded-full border border-nexoraBorder bg-nexoraSurfaceMuted px-4 text-sm text-nexoraSubtle">Bạn đang nghĩ gì?</span><ImageIcon className="h-5 w-5 text-nexoraBrand" aria-hidden="true" /></button>
}

function CommentThread({ post }: { post: PostDto }) {
  const { isAnonymous } = useCommunityAuth()
  const comments = useCommunityComments(post.id)
  const createComment = useCreateCommunityComment()
  const [body, setBody] = useState('')
  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (!body.trim()) return
    createComment.mutate({ postId: post.id, body }, { onSuccess: () => setBody('') })
  }
  const items = comments.data?.pages.flatMap((page) => page.items) ?? []
  return (
    <section className="border-t border-nexoraRule bg-nexoraSurfaceMuted/55 px-4 py-3">
      {comments.isLoading ? <div className="h-12 animate-pulse rounded-xl bg-nexoraSurfaceMuted" /> : null}
      {comments.error ? <p className="text-xs font-semibold text-nexoraDanger">{comments.error.message}</p> : null}
      <div className="space-y-2">{items.map((comment) => <div key={comment.id} className="flex gap-2"><Avatar name={comment.author?.displayName} className="h-8 w-8 text-[10px]" /><div className="min-w-0 rounded-xl bg-white px-3 py-2 text-sm"><b>{comment.author?.displayName || 'Thành viên'}</b><p className="mt-0.5 leading-relaxed text-nexoraMuted">{comment.body}</p></div></div>)}</div>
      {!isAnonymous ? <form onSubmit={submit} className="mt-3 flex gap-2"><input value={body} onChange={(event) => setBody(event.target.value)} maxLength={5_000} placeholder="Viết bình luận…" className="min-h-11 min-w-0 flex-1 rounded-xl border border-nexoraBorder bg-white px-3 text-sm outline-none focus:border-nexoraBrand" /><button aria-label="Gửi bình luận" disabled={!body.trim() || createComment.isPending} className={`grid h-11 w-11 place-items-center rounded-xl text-white ${gradientClass} disabled:opacity-50`}><Send className="h-4 w-4" aria-hidden="true" /></button></form> : <p className="mt-3 text-xs text-nexoraSubtle">Đăng nhập bằng persona demo để bình luận.</p>}
      {createComment.error ? <p className="mt-2 text-xs font-semibold text-nexoraDanger">{createComment.error.message}</p> : null}
    </section>
  )
}

function FeedPost({ post, communityName }: { post: PostDto; communityName: string }) {
  const { isAnonymous, user } = useCommunityAuth()
  const reactions = usePostReactions(post.id)
  const toggle = useToggleCommunityReaction()
  const [commentsOpen, setCommentsOpen] = useState(false)
  const likeType: ReactionType = 'like'
  const hasLiked = reactions.data?.some((reaction) => reaction.userId === user?.id && reaction.type === likeType) ?? false
  const isAnnouncement = post.isAnnouncement
  return (
    <article className={`${cardClass} ${isAnnouncement ? 'border-l-[3px] border-l-nexoraBrand !bg-nexoraBrandSoft/20' : ''}`}>
      {isAnnouncement ? <p className="px-4 pt-3 text-[10px] font-extrabold uppercase tracking-[0.08em] text-nexoraBrand">Thông báo · {communityName}</p> : null}
      <div className="flex items-center gap-3 px-4 pt-3"><Avatar name={post.author?.displayName} className="h-9 w-9" /><div className="min-w-0 flex-1"><p className="truncate text-sm font-extrabold text-nexoraText">{post.author?.displayName || 'Thành viên Nexora'}</p><p className="text-xs text-nexoraMuted">{communityName} · {relativeTime(post.createdAt)}</p></div>{post.isAnnouncement ? <ShieldCheck className="h-4 w-4 text-nexoraBrand" aria-label="Thông báo" /> : null}</div>
      <CommunityPostMedia media={post.media} authorName={post.author?.displayName} />
      {post.body ? <p className="whitespace-pre-wrap px-4 py-3 text-sm leading-relaxed text-nexoraText">{post.body}</p> : null}
      <div className="flex items-center gap-1 border-t border-nexoraRule px-2 py-1"><button type="button" aria-pressed={hasLiked} disabled={isAnonymous || toggle.isPending} onClick={() => user && toggle.mutate({ postId: post.id, type: likeType, userId: user.id })} className={`inline-flex min-h-11 items-center gap-1.5 rounded-lg px-3 text-sm font-bold disabled:opacity-50 ${hasLiked ? 'text-nexoraBrand' : 'text-nexoraMuted hover:bg-nexoraSurfaceMuted'}`}><Heart className={`h-4 w-4 ${hasLiked ? 'fill-current' : ''}`} aria-hidden="true" />{reactions.data?.length ?? 0}</button><button type="button" onClick={() => setCommentsOpen((open) => !open)} aria-expanded={commentsOpen} className="inline-flex min-h-11 items-center gap-1.5 rounded-lg px-3 text-sm font-bold text-nexoraMuted hover:bg-nexoraSurfaceMuted"><MessageCircle className="h-4 w-4" aria-hidden="true" />Bình luận</button></div>
      {reactions.error ? <p className="px-4 pb-2 text-xs font-semibold text-nexoraDanger">{reactions.error.message}</p> : null}
      {toggle.error ? <p className="px-4 pb-2 text-xs font-semibold text-nexoraDanger">{toggle.error.message}</p> : null}
      {commentsOpen ? <CommentThread post={post} /> : null}
    </article>
  )
}

function CommunityFeed({ community, withComposer = false }: { community: CommunityDto; withComposer?: boolean }) {
  const feed = useCommunityFeedPosts(community.id)
  const [isComposing, setIsComposing] = useState(false)
  const posts = feed.data?.pages.flatMap((page) => page.items) ?? []
  if (feed.isLoading) return <LoadingState rows={2} />
  if (feed.error) return <ErrorState error={feed.error} onRetry={() => void feed.refetch()} />
  return <section className="space-y-3">{withComposer ? <>{isComposing ? <PostComposer communityId={community.id} onClose={() => setIsComposing(false)} /> : <QuickComposer communityId={community.id} onOpen={() => setIsComposing(true)} />}</> : null}{posts.map((post) => <FeedPost key={post.id} post={post} communityName={community.name} />)}{posts.length === 0 ? <EmptyState title="Chưa có bài viết">Hãy là người đầu tiên chia sẻ một mẹo nail hoặc thông báo cho nhóm.</EmptyState> : null}{feed.hasNextPage ? <button type="button" onClick={() => void feed.fetchNextPage()} disabled={feed.isFetchingNextPage} className="mx-auto block min-h-11 rounded-xl px-4 text-sm font-bold text-nexoraBrand">{feed.isFetchingNextPage ? 'Đang tải…' : 'Xem thêm bài viết'}</button> : null}</section>
}

function CreateSheet({ onClose, onPost, onGroup }: { onClose: () => void; onPost: () => void; onGroup: () => void }) {
  return <div className="fixed inset-0 z-[120] flex flex-col justify-end bg-nexoraText/45" role="dialog" aria-modal="true" aria-label="Tạo mới"><button type="button" aria-label="Đóng bảng tạo mới" onClick={onClose} className="absolute inset-0" /><div className="relative rounded-t-[22px] bg-white px-4 pb-6 pt-2"><div className="mx-auto my-2 h-1 w-10 rounded-full bg-nexoraBorder" /><button type="button" onClick={onPost} className="flex min-h-[72px] w-full items-center gap-3 rounded-2xl px-3 text-left hover:bg-nexoraSurfaceMuted"><span className={`grid h-11 w-11 place-items-center rounded-xl text-white ${gradientClass}`}><Send className="h-5 w-5" aria-hidden="true" /></span><span><b className="block text-sm">Đăng bài</b><span className="text-xs text-nexoraSubtle">Chia sẻ với một nhóm của bạn</span></span></button><button type="button" onClick={onGroup} className="flex min-h-[72px] w-full items-center gap-3 rounded-2xl px-3 text-left hover:bg-nexoraSurfaceMuted"><span className="grid h-11 w-11 place-items-center rounded-xl bg-nexoraBrandSoft text-nexoraBrand"><Users className="h-5 w-5" aria-hidden="true" /></span><span><b className="block text-sm">Tạo nhóm</b><span className="text-xs text-nexoraSubtle">Bắt đầu một cộng đồng mới</span></span></button><button type="button" onClick={onClose} className="mt-2 min-h-11 w-full rounded-xl bg-nexoraSurfaceMuted text-sm font-bold text-nexoraMuted">Hủy</button></div></div>
}

export function CommunityHome() {
  const { user, isLoading } = useCommunityAuth()
  const myCommunities = useMyCommunities({ enabled: Boolean(user) })
  const communities = useCommunityList({ enabled: Boolean(user) })
  const [sheetOpen, setSheetOpen] = useState(false)
  const [composerCommunityId, setComposerCommunityId] = useState<string | null>(null)
  const ringCommunities = myCommunities.data?.items.length ? myCommunities.data.items : (communities.data?.items ?? [])
  const feedCommunities = (myCommunities.data?.items.length ? myCommunities.data.items : communities.data?.items ?? []).slice(0, 3)
  return (
    <CommunityFrame containerClassName="mx-auto w-full max-w-[1040px] pb-20">
      <header className="mx-auto mb-4 flex w-full max-w-[680px] items-center justify-between gap-3 2xl:max-w-none">
        <div><p className="text-xs font-bold uppercase tracking-[0.12em] text-nexoraBrand">Nexora</p><h1 className="text-xl font-extrabold text-nexoraText">Cộng đồng</h1></div>
        <div className="flex items-center gap-2"><CommunityNotificationBell /><Link to="/community/chat" aria-label="Mở Chat inbox" className="grid h-11 w-11 place-items-center rounded-xl border border-nexoraBorder bg-nexoraSurface text-nexoraBrand hover:bg-nexoraBrandSoft"><MessagesSquare className="h-5 w-5" aria-hidden="true" /></Link><Link to="/community/new" className={`inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-extrabold text-white ${gradientClass}`}><Plus className="h-4 w-4" aria-hidden="true" />Tạo nhóm</Link></div>
      </header>
      <div className="flex flex-col gap-6 2xl:flex-row 2xl:items-start">
        <div className="mx-auto w-full max-w-[680px] flex-1 space-y-4 2xl:mx-0">
          {isLoading || myCommunities.isLoading || communities.isLoading ? <LoadingState rows={4} /> : null}
          {myCommunities.error ? <ErrorState error={myCommunities.error} onRetry={() => void myCommunities.refetch()} /> : null}
          {communities.error ? <ErrorState error={communities.error} onRetry={() => void communities.refetch()} /> : null}
          {composerCommunityId ? <PostComposer communityId={composerCommunityId} onClose={() => setComposerCommunityId(null)} /> : <QuickComposer communityId={feedCommunities[0]?.id} onOpen={() => setComposerCommunityId(feedCommunities[0]?.id ?? null)} />}
          {ringCommunities.length ? <CommunityStoryRings communities={ringCommunities} /> : <EmptyState title="Chào mừng đến Community">Chọn một persona demo để vào nhóm hoặc tạo nhóm đầu tiên của bạn.</EmptyState>}
          {feedCommunities.map((community) => <CommunityFeed key={community.id} community={community} />)}
          <button type="button" onClick={() => setSheetOpen(true)} aria-label="Tạo mới" className={`fixed bottom-24 right-5 z-40 grid h-14 w-14 place-items-center rounded-full text-white shadow-xl lg:hidden ${gradientClass}`}><Plus className="h-6 w-6" aria-hidden="true" /></button>
          {sheetOpen ? <CreateSheet onClose={() => setSheetOpen(false)} onPost={() => { setComposerCommunityId(feedCommunities[0]?.id ?? null); setSheetOpen(false) }} onGroup={() => setSheetOpen(false)} /> : null}
        </div>
        <div className="hidden w-[336px] shrink-0 2xl:sticky 2xl:top-[132px] 2xl:block 2xl:self-start">
          <CommunityRightRail />
        </div>
      </div>
    </CommunityFrame>
  )
}

export { CommunityChatInbox } from './CommunityChatInbox'
export { CommunityChatInbox as CommunityChatInboxPlaceholder } from './CommunityChatInbox'

function MemberList({ members, canModerate, communityId }: { members: CommunityMemberDto[]; canModerate: boolean; communityId: string }) {
  const requests = useCommunityJoinRequests(communityId, { enabled: canModerate })
  const approve = useApproveJoinRequest()
  const reject = useRejectJoinRequest()
  const pending = requests.data?.pages.flatMap((page) => page.items).filter((request) => request.status === 'pending') ?? []
  return <section className="space-y-3">{canModerate ? <section className={cardClass}><div className="flex items-center justify-between border-b border-nexoraRule px-4 py-3"><h2 className="text-sm font-extrabold">Yêu cầu tham gia</h2><span className="rounded-full bg-nexoraBrandSoft px-2 py-0.5 text-xs font-bold text-nexoraBrand">{pending.length}</span></div>{requests.isLoading ? <div className="p-4"><LoadingState rows={1} /></div> : pending.length ? pending.map((request) => <div key={request.id} className="flex items-center gap-3 px-4 py-3"><Avatar name={request.userId} className="h-9 w-9" /><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">Thành viên mới</p><p className="truncate text-xs text-nexoraSubtle">{request.message || 'Muốn tham gia cộng đồng'}</p></div><button type="button" onClick={() => approve.mutate(request.id)} disabled={approve.isPending} className="min-h-11 rounded-lg bg-nexoraSuccess/10 px-3 text-xs font-extrabold text-nexoraSuccess">Duyệt</button><button type="button" onClick={() => reject.mutate(request.id)} disabled={reject.isPending} className="min-h-11 rounded-lg px-2 text-xs font-extrabold text-nexoraDanger">Từ chối</button></div>) : <p className="px-4 py-5 text-sm text-nexoraSubtle">Không có yêu cầu đang chờ.</p>}{approve.error || reject.error ? <p className="px-4 pb-3 text-xs font-semibold text-nexoraDanger">{(approve.error || reject.error)?.message}</p> : null}</section> : null}<section className={cardClass}><div className="border-b border-nexoraRule px-4 py-3"><h2 className="text-sm font-extrabold">Thành viên ({members.length})</h2></div>{members.map((member) => <div key={member.id} className="flex min-h-[68px] items-center gap-3 border-b border-nexoraRule px-4 last:border-none"><Avatar name={member.profile?.displayName} className="h-10 w-10" /><div className="min-w-0 flex-1"><p className="truncate text-sm font-extrabold">{member.profile?.displayName || 'Thành viên'}</p><span className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${member.role === 'owner' ? 'bg-nexoraBrandSoft text-nexoraBrand' : member.role === 'admin' ? 'bg-nexoraSuccess/10 text-nexoraSuccess' : 'bg-nexoraSurfaceMuted text-nexoraMuted'}`}>{member.role === 'owner' ? 'Chủ nhóm' : member.role === 'admin' ? 'Quản lý' : member.role === 'moderator' ? 'Điều hành' : 'Thành viên'}</span></div></div>)}</section></section>
}

export function CommunityDetail() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { user } = useCommunityAuth()
  const detail = useCommunityDetail(id)
  const members = useCommunityMembers(id)
  const [tab, setTab] = useState<'posts' | 'members'>('posts')
  const memberItems = members.data?.pages.flatMap((page) => page.items) ?? []
  const ownMembership = memberItems.find((member) => member.userId === user?.id)
  const canModerate = ownMembership?.role === 'owner' || ownMembership?.role === 'admin'

  if (detail.isLoading || members.isLoading) return <CommunityFrame><LoadingState rows={4} /></CommunityFrame>
  if (detail.error) return <CommunityFrame><ErrorState error={detail.error} onRetry={() => void detail.refetch()} /></CommunityFrame>
  if (!detail.data) return <CommunityFrame><EmptyState title="Không tìm thấy nhóm">Nhóm này không còn tồn tại hoặc bạn không có quyền xem.</EmptyState></CommunityFrame>

  const community = detail.data
  return (
    <CommunityFrame>
      <button type="button" onClick={() => navigate(-1)} className="inline-flex min-h-11 items-center gap-1 text-sm font-bold text-nexoraMuted"><ChevronLeft className="h-5 w-5" aria-hidden="true" />Quay lại</button>
      <section className={`${cardClass} overflow-hidden`}>
        <div className={`h-32 ${gradientClass}`} />
        <div className="-mt-10 flex items-end gap-3 px-5">
          <Avatar name={community.name} className="h-20 w-20 border-4 border-white text-2xl" />
          <div className="mb-1 min-w-0 flex-1 text-right">
            <Link to={`/community/${community.id}/chat`} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-nexoraBorder bg-white px-3 text-xs font-bold text-nexoraBrand hover:bg-nexoraBrandSoft" aria-label={`Mở chat nhóm ${community.name}`}><MessageCircle className="h-4 w-4" aria-hidden="true" />Chat nhóm</Link>
          </div>
        </div>
        <div className="px-5 pb-4 pt-3">
          <div className="flex items-center gap-1"><h1 className="truncate text-xl font-extrabold">{community.name}</h1>{community.verified ? <Verified /> : null}</div>
          <p className="mt-1 text-sm text-nexoraMuted">{community.kind === 'salon' ? 'Salon Group' : community.visibility === 'private' ? 'Nhóm riêng tư' : 'Cộng đồng công khai'} · {community.description || 'Cộng đồng của Nexora'}</p>
          <div className="mt-3 flex gap-6"><p><b className="block text-base">{memberItems.length}</b><span className="text-xs text-nexoraSubtle">Thành viên</span></p><p><b className="block text-base">{community.verified ? '✓' : '—'}</b><span className="text-xs text-nexoraSubtle">Xác minh</span></p></div>
        </div>
        <div className="flex border-t border-nexoraBorder"><button type="button" aria-pressed={tab === 'posts'} onClick={() => setTab('posts')} className={`min-h-11 flex-1 text-sm font-bold ${tab === 'posts' ? 'border-b-2 border-nexoraBrand text-nexoraBrand' : 'text-nexoraSubtle'}`}>Bài viết</button><button type="button" aria-pressed={tab === 'members'} onClick={() => setTab('members')} className={`min-h-11 flex-1 text-sm font-bold ${tab === 'members' ? 'border-b-2 border-nexoraBrand text-nexoraBrand' : 'text-nexoraSubtle'}`}>Thành viên</button></div>
      </section>
      {members.error ? <ErrorState error={members.error} onRetry={() => void members.refetch()} /> : null}
      {tab === 'posts' ? <CommunityFeed community={community} withComposer={Boolean(ownMembership)} /> : <MemberList members={memberItems} canModerate={canModerate} communityId={community.id} />}
    </CommunityFrame>
  )
}

export function CommunityJoinPreview() {
  const { token = '' } = useParams()
  const navigate = useNavigate()
  const preview = useInvitePreview(token)
  const community = useCommunityBySlug(preview.data?.communitySlug, { enabled: Boolean(preview.data?.communitySlug) })
  const consume = useConsumeInvite()
  const join = () => consume.mutate(token, { onSuccess: (membership) => navigate(`/community/${membership.communityId}`, { replace: true }) })
  return <CommunityFrame>{preview.isLoading ? <LoadingState rows={3} /> : null}{preview.error ? <ErrorState error={preview.error} onRetry={() => void preview.refetch()} /> : null}{!preview.isLoading && !preview.error && !preview.data ? <section className={`${cardClass} text-center`}><div className={`h-32 ${gradientClass}`} /><div className="-mt-10"><Avatar name="Nexora" className="mx-auto h-20 w-20 border-4 border-white text-2xl" /></div><div className="px-6 pb-7 pt-4"><Loader2 className="mx-auto h-7 w-7 text-nexoraWarning" aria-hidden="true" /><h1 className="mt-3 text-xl font-extrabold">Lời mời không còn hiệu lực</h1><p className="mt-2 text-sm leading-relaxed text-nexoraMuted">Liên hệ người mời để nhận link mới.</p><Link to="/community" className="mt-5 inline-flex min-h-11 items-center rounded-xl border border-nexoraBorder px-4 text-sm font-bold text-nexoraBrand">Về trang cộng đồng</Link></div></section> : null}{preview.data ? <section className={`${cardClass} text-center`}><div className={`relative h-36 ${gradientClass}`}><span className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full bg-nexoraText/25 px-3 py-1 text-xs font-bold text-white"><LockKeyhole className="h-3 w-3" aria-hidden="true" />Lời mời riêng tư</span></div><div className="-mt-11"><Avatar name={preview.data.communityName} className="mx-auto h-[88px] w-[88px] border-4 border-white text-3xl shadow-lg" /></div><div className="px-6 pb-6 pt-4"><div className="flex justify-center gap-1"><h1 className="text-xl font-extrabold">{preview.data.communityName}</h1>{community.data?.verified ? <Verified /> : null}</div><p className="mt-1 text-sm text-nexoraMuted">{community.data?.kind === 'salon' ? 'Salon Group' : 'Cộng đồng Nexora'} · {community.data?.visibility === 'private' ? 'Riêng tư' : 'Theo lời mời'}</p><div className="mt-4 rounded-xl bg-nexoraSurfaceMuted px-4 py-3 text-left text-sm leading-relaxed text-nexoraMuted"><b className="text-nexoraText">Bạn được mời tham gia</b><br />Thông tin thành viên và người mời được bảo vệ cho đến khi bạn tham gia nhóm.</div><p className="mt-4 text-left text-sm leading-relaxed text-nexoraMuted">{community.data?.description || 'Một cộng đồng được mời trên Nexora. Bạn sẽ tham gia với vai trò Thành viên.'}</p>{consume.error ? <p className="mt-3 text-sm font-semibold text-nexoraDanger">{consume.error.message}</p> : null}<button type="button" onClick={join} disabled={consume.isPending} className={`mt-5 min-h-12 w-full rounded-xl text-sm font-extrabold text-white ${gradientClass} disabled:opacity-50`}>{consume.isPending ? 'Đang tham gia…' : 'Tham gia nhóm'}</button></div></section> : null}</CommunityFrame>
}

function slugify(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/đ/g, 'd').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

export function CommunityCreateWizard() {
  const navigate = useNavigate()
  const { user, isAnonymous } = useCommunityAuth()
  const mine = useMyCommunities({ enabled: Boolean(user) && !isAnonymous })
  const create = useCreateCommunity()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [kind, setKind] = useState<'public' | 'private' | 'salon'>('public')
  const [visibility, setVisibility] = useState<'public' | 'private'>('public')
  const hasClaimedBusiness = mine.data?.items.some((community) => community.kind === 'salon' && community.verified && community.ownerId === user?.id) ?? false
  const chooseKind = (next: 'public' | 'private' | 'salon') => { if (next !== 'salon' || hasClaimedBusiness) { setKind(next); if (next === 'salon') setVisibility('private') } }
  const submit = (event: FormEvent) => { event.preventDefault(); if (!name.trim() || isAnonymous) return; create.mutate({ name, slug: slugify(name), description, kind, visibility }, { onSuccess: (community) => navigate(`/community/${community.id}`, { replace: true }) }) }
  return <CommunityFrame><button type="button" onClick={() => navigate(-1)} className="inline-flex min-h-11 items-center gap-1 text-sm font-bold text-nexoraMuted"><ChevronLeft className="h-5 w-5" aria-hidden="true" />Quay lại</button><form onSubmit={submit} className={cardClass}><div className="flex gap-1 px-5 pt-5"><span className="h-1 flex-1 rounded bg-nexoraElectric" /><span className="h-1 flex-1 rounded bg-nexoraBrand" /><span className="h-1 flex-1 rounded bg-nexoraRule" /></div><div className="px-5 pb-5 pt-4"><p className="text-xs font-bold text-nexoraSubtle">Bước 2 / 3</p><h1 className="mt-1 text-xl font-extrabold">Tạo cộng đồng</h1><p className="mt-2 text-sm leading-relaxed text-nexoraMuted">Chọn loại nhóm phù hợp trước khi hoàn tất.</p><label className="mt-5 block text-sm font-bold">Tên nhóm<input value={name} onChange={(event) => setName(event.target.value)} maxLength={100} required placeholder="Ví dụ: Nail Houston" className="mt-2 min-h-11 w-full rounded-xl border border-nexoraBorder px-3 outline-none focus:border-nexoraBrand" /></label><label className="mt-3 block text-sm font-bold">Mô tả<textarea value={description} onChange={(event) => setDescription(event.target.value)} maxLength={2_000} placeholder="Nhóm này dành cho ai?" className="mt-2 min-h-20 w-full resize-none rounded-xl border border-nexoraBorder p-3 text-sm font-normal outline-none focus:border-nexoraBrand" /></label><p className="mt-5 text-sm font-bold">Loại cộng đồng</p>{([['public', 'Cộng đồng công khai', 'Ai trên Nexora cũng có thể khám phá và tham gia.', Users], ['private', 'Nhóm riêng tư', 'Chỉ thành viên được xem nội dung bên trong.', LockKeyhole], ['salon', 'Salon Group', 'Nhóm đã xác minh cho salon đã được claim.', Store]] as const).map(([value, title, text, Icon]) => { const locked = value === 'salon' && !hasClaimedBusiness; return <button key={value} type="button" disabled={locked} onClick={() => chooseKind(value)} className={`mt-3 flex min-h-[84px] w-full items-start gap-3 rounded-2xl border p-3 text-left ${kind === value ? 'border-nexoraBrand bg-nexoraBrandSoft' : locked ? 'cursor-not-allowed border-dashed border-nexoraBorder bg-nexoraSurfaceMuted opacity-70' : 'border-nexoraBorder bg-white'}`}><span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${locked ? 'bg-nexoraBorder text-nexoraMuted' : `${gradientClass} text-white`}`}><Icon className="h-5 w-5" aria-hidden="true" /></span><span className="min-w-0 flex-1"><b className="flex items-center gap-1 text-sm">{title}{locked ? <LockKeyhole className="h-3.5 w-3.5" aria-label="Bị khóa" /> : null}</b><span className="mt-1 block text-xs leading-relaxed text-nexoraMuted">{text}</span></span><span className={`mt-1 h-5 w-5 rounded-full border-2 ${kind === value ? 'border-nexoraBrand bg-nexoraBrand ring-4 ring-white' : 'border-nexoraBorder'}`} /></button> })}{!hasClaimedBusiness ? <p className="mt-3 rounded-xl border border-nexoraWarning/40 bg-[#fff7ea] px-3 py-3 text-xs leading-relaxed text-[#8a5a00]">Salon Group chỉ mở sau khi bạn có tín hiệu doanh nghiệp đã claim. Trong demo, hãy chọn persona Kayla để xem trạng thái đã mở.</p> : null}<label className="mt-4 block text-sm font-bold">Quyền riêng tư<select value={visibility} disabled={kind === 'salon'} onChange={(event) => setVisibility(event.target.value as 'public' | 'private')} className="mt-2 min-h-11 w-full rounded-xl border border-nexoraBorder bg-white px-3 text-sm font-normal outline-none focus:border-nexoraBrand"><option value="public">Công khai</option><option value="private">Riêng tư</option></select></label>{isAnonymous ? <p className="mt-3 text-sm font-semibold text-nexoraDanger">Khách ẩn danh không thể tạo nhóm. Chọn một persona demo ở thanh trên.</p> : null}{create.error ? <p className="mt-3 text-sm font-semibold text-nexoraDanger">{create.error.message}</p> : null}<div className="mt-5 flex justify-end gap-2 border-t border-nexoraRule pt-4"><button type="button" onClick={() => navigate(-1)} className="min-h-11 rounded-xl border border-nexoraBorder px-4 text-sm font-bold text-nexoraMuted">Hủy</button><button type="submit" disabled={!name.trim() || isAnonymous || create.isPending} className={`min-h-11 rounded-xl px-4 text-sm font-extrabold text-white ${gradientClass} disabled:opacity-50`}>{create.isPending ? 'Đang tạo…' : 'Tạo nhóm'}</button></div></div></form></CommunityFrame>
}

function CommunityAuthGate() {
  const navigate = useNavigate()
  const { authReady, error } = useCommunityAuth()

  if (authReady) return <><Outlet /><CommunityChatDock /></>

  return (
    <>
      <CommunityPersonaSwitcher />
      <DemoStaffShell onDemoNavigation={() => navigate('/community')}>
        <div className="mx-auto flex min-h-[320px] w-full max-w-[680px] items-center justify-center px-5 text-center">
          <div>
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-nexoraBrand" aria-hidden="true" />
            <h1 className="mt-3 text-base font-extrabold text-nexoraText">Đang khôi phục phiên Community</h1>
            <p className="mt-2 text-sm text-nexoraMuted">{error?.message || 'Đang xác thực để tải dữ liệu của nhóm.'}</p>
          </div>
        </div>
      </DemoStaffShell>
    </>
  )
}

export function CommunityRouteRoot() {
  return <CommunityAuthProvider><CommunityNotificationsProvider><CommunityChatDockProvider><CommunityAuthGate /></CommunityChatDockProvider></CommunityNotificationsProvider></CommunityAuthProvider>
}
