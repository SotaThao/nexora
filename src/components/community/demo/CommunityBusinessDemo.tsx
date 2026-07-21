// DEMO ONLY — production version must use i18n community.* keys per Product Doc.
import {
  BadgeCheck,
  Ban,
  CalendarDays,
  EyeOff,
  Flag,
  MessageCircle,
  MoreHorizontal,
  Pin,
  Settings,
  ShieldCheck,
  ThumbsUp,
  Trash2,
  UserCheck,
  UserMinus,
  Users,
  VolumeX,
  type LucideIcon,
} from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import DemoMerchantShell from './DemoMerchantShell'
import DemoStateBar from './DemoStateBar'

type BusinessDemoState = 'group' | 'cold-start'
type AvatarTone = 'gold' | 'violet' | 'teal' | 'brand'
type PostId = 'announcement' | 'member-post'

type JoinRequest = {
  id: string
  initials: string
  name: string
  tone: AvatarTone
  meta: string
}

const initialJoinRequests: JoinRequest[] = [
  {
    id: 'trang',
    initials: 'TP',
    name: 'Trang P.',
    tone: 'violet',
    meta: 'Thợ nail · Houston · 2 giờ trước',
  },
  {
    id: 'mai',
    initials: 'MN',
    name: 'Mai N.',
    tone: 'teal',
    meta: 'Thợ nail · Houston · 4 giờ trước',
  },
  {
    id: 'duc',
    initials: 'ĐL',
    name: 'Đức L.',
    tone: 'brand',
    meta: 'Thợ nail · Houston · 1 ngày trước',
  },
]

const panelClass =
  'rounded-2xl border border-nexoraBorder bg-nexoraSurface shadow-nexora-card'
const motionClass =
  'motion-safe:transition-all motion-safe:duration-200 motion-reduce:transition-none'
const primaryClass =
  'inline-flex items-center justify-center rounded-full bg-gradient-to-r from-nexoraElectric to-nexoraViolet font-extrabold text-white shadow-nexora-soft hover:opacity-90 ' +
  motionClass

function Avatar({ initials, tone }: { initials: string; tone: AvatarTone }) {
  const toneClass = {
    gold: 'from-[#d4af37] to-[#aa7c11]',
    violet: 'from-nexoraElectricMid to-nexoraViolet',
    teal: 'from-nexoraTeal to-nexoraTealAlt',
    brand: 'from-nexoraElectric to-nexoraViolet',
  }[tone]

  return (
    <span
      aria-hidden="true"
      className={'grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br text-[11px] font-extrabold text-white shadow-sm ' + toneClass}
    >
      {initials}
    </span>
  )
}

function VerifiedBadge() {
  return (
    <span className="inline-flex rounded-full bg-nexoraSuccess/10 px-2 py-0.5 text-[10px] font-bold text-nexoraSuccess">
      ✓ Đã xác minh
    </span>
  )
}

function PageHeading() {
  return (
    <div className="flex min-h-14 items-center gap-2">
      <h1 className="text-[22px] font-extrabold tracking-tight text-nexoraText">Community</h1>
      <span className="rounded-full bg-gradient-to-r from-nexoraElectric to-nexoraViolet px-2 py-1 text-[9px] font-extrabold tracking-wide text-white">
        NEW
      </span>
    </div>
  )
}

function SectionHeading({
  title,
  count,
  id,
}: {
  title: string
  count?: number
  id?: string
}) {
  return (
    <div className="flex min-h-11 items-center gap-2 px-0.5">
      <h2 id={id} className="text-[13px] font-extrabold text-nexoraText">{title}</h2>
      {typeof count === 'number' ? (
        <span className="grid h-5 min-w-5 place-items-center rounded-full bg-nexoraBrandSoft px-1.5 text-[10px] font-extrabold text-nexoraBrand">
          {count}
        </span>
      ) : null}
    </div>
  )
}

function GroupHeaderPanel({ onToast }: { onToast: (message: string) => void }) {
  return (
    <section className={panelClass + ' p-4 sm:p-5'} aria-label="Thông tin Salon Group">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar initials="BN" tone="gold" />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-extrabold text-nexoraText">Bitcoin Nail Bar Team</h2>
              <VerifiedBadge />
            </div>
            <p className="mt-1 text-[12px] text-nexoraSubtle">Salon Group · 12 thành viên · Tạo 03/2026</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => onToast('Mở panel mời — link / QR / danh bạ')}
            className={'min-h-11 rounded-full border border-nexoraBrand bg-white px-4 text-[12px] font-extrabold text-nexoraBrand hover:bg-nexoraBrandSoft ' + motionClass}
          >
            Mời thành viên
          </button>
          <button
            type="button"
            aria-label="Cài đặt nhóm"
            onClick={() => onToast('Mở cài đặt nhóm')}
            className={'grid h-11 w-11 place-items-center rounded-full border border-nexoraBorder text-nexoraMuted hover:bg-nexoraSurfaceMuted hover:text-nexoraBrand ' + motionClass}
          >
            <Settings className="h-[18px] w-[18px]" aria-hidden="true" />
          </button>
        </div>
      </div>
    </section>
  )
}

function JoinRequestsSection({
  requests,
  exitingId,
  onHandle,
}: {
  requests: JoinRequest[]
  exitingId: string | null
  onHandle: (request: JoinRequest, approve: boolean) => void
}) {
  return (
    <section aria-labelledby="business-join-requests-title">
      <div className="flex min-h-11 items-center gap-2 px-0.5">
        <h2 id="business-join-requests-title" className="text-[13px] font-extrabold text-nexoraText">
          Yêu cầu tham gia
        </h2>
        <span className="grid h-5 min-w-5 place-items-center rounded-full bg-nexoraBrandSoft px-1.5 text-[10px] font-extrabold text-nexoraBrand">
          {requests.length}
        </span>
      </div>
      <div className={panelClass + ' overflow-hidden'}>
        {requests.length === 0 ? (
          <p className="px-4 py-8 text-center text-[13px] font-semibold text-nexoraSubtle">
            Không có yêu cầu chờ duyệt
          </p>
        ) : (
          <div className="divide-y divide-nexoraRule">
            {requests.map((request) => {
              const exiting = exitingId === request.id
              return (
                <div
                  key={request.id}
                  className={
                    'flex min-h-[78px] flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center ' +
                    'motion-safe:transition-all motion-safe:duration-[180ms] motion-reduce:transition-none ' +
                    (exiting ? '-translate-x-2 opacity-0' : 'translate-x-0 opacity-100')
                  }
                >
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <Avatar initials={request.initials} tone={request.tone} />
                    <div className="min-w-0">
                      <h3 className="text-[13px] font-extrabold text-nexoraText">{request.name}</h3>
                      <p className="mt-1 text-[11.5px] text-nexoraSubtle">{request.meta}</p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2 pl-[52px] sm:pl-0">
                    <button
                      type="button"
                      disabled={Boolean(exitingId)}
                      onClick={() => onHandle(request, true)}
                      className={primaryClass + ' min-h-11 px-4 text-[11px] disabled:cursor-not-allowed disabled:opacity-50'}
                    >
                      Duyệt
                    </button>
                    <button
                      type="button"
                      disabled={Boolean(exitingId)}
                      onClick={() => onHandle(request, false)}
                      className={'min-h-11 rounded-full px-3 text-[11px] font-extrabold text-nexoraMuted hover:bg-nexoraSurfaceMuted hover:text-nexoraDanger disabled:cursor-not-allowed disabled:opacity-50 ' + motionClass}
                    >
                      Từ chối
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}

function AnnouncementComposer({ onToast }: { onToast: (message: string) => void }) {
  const [announcement, setAnnouncement] = useState('')
  const [pinned, setPinned] = useState(true)

  return (
    <section aria-labelledby="business-announcement-title">
      <SectionHeading id="business-announcement-title" title="Đăng thông báo" />
      <div className={panelClass + ' p-4'}>
        <textarea
          value={announcement}
          onChange={(event) => setAnnouncement(event.target.value)}
          placeholder="Thông báo tới 12 thành viên…"
          rows={3}
          className="min-h-24 w-full resize-none rounded-xl border border-nexoraBorder bg-nexoraSurfaceMuted px-4 py-3 text-sm text-nexoraText outline-none placeholder:text-nexoraSubtle focus:border-nexoraBrand"
        />
        <div className="mt-3 flex items-center justify-between gap-3">
          <button
            type="button"
            aria-pressed={pinned}
            onClick={() => setPinned((current) => !current)}
            className={
              'min-h-11 rounded-full px-3 text-[11px] font-extrabold ' +
              motionClass +
              (pinned
                ? ' bg-nexoraBrandSoft text-nexoraBrand'
                : ' border border-nexoraBorder bg-white text-nexoraMuted hover:bg-nexoraSurfaceMuted')
            }
          >
            📌 Ghim
          </button>
          <button
            type="button"
            onClick={() => onToast('Đã đăng thông báo tới nhóm')}
            className={primaryClass + ' min-h-11 px-5 text-[12px]'}
          >
            Đăng thông báo
          </button>
        </div>
      </div>
    </section>
  )
}

function FeedAction({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <button
      type="button"
      className={'inline-flex h-11 min-w-11 items-center justify-center gap-1.5 rounded-lg px-2 text-[12px] font-bold text-nexoraMuted hover:bg-nexoraSurfaceMuted hover:text-nexoraBrand ' + motionClass}
    >
      {icon}
      <span>{label}</span>
    </button>
  )
}

function OwnerPostMenu({
  postId,
  pinned,
  onPinToggle,
  onToast,
  onClose,
}: {
  postId: PostId
  pinned: boolean
  onPinToggle: () => void
  onToast: (message: string) => void
  onClose: () => void
}) {
  const handleAction = (message: string) => {
    onToast(message)
    onClose()
  }

  return (
    <div
      role="menu"
      aria-label={postId === 'announcement' ? 'Quản lý thông báo' : 'Quản lý bài viết của Jessica M.'}
      className="absolute bottom-12 right-0 z-30 w-52 overflow-hidden rounded-xl border border-nexoraBorder bg-white p-1.5 shadow-xl"
    >
      <button
        type="button"
        role="menuitem"
        onClick={() => {
          onPinToggle()
          handleAction(pinned ? 'Đã bỏ ghim bài viết' : 'Đã ghim bài viết')
        }}
        className={'flex min-h-11 w-full items-center gap-2 rounded-lg px-3 text-left text-[12px] font-bold text-nexoraText hover:bg-nexoraSurfaceMuted ' + motionClass}
      >
        <Pin className="h-4 w-4" aria-hidden="true" />
        {pinned ? 'Bỏ ghim' : 'Ghim'}
      </button>
      <button
        type="button"
        role="menuitem"
        onClick={() => handleAction('Đã ẩn bài viết')}
        className={'flex min-h-11 w-full items-center gap-2 rounded-lg px-3 text-left text-[12px] font-bold text-nexoraText hover:bg-nexoraSurfaceMuted ' + motionClass}
      >
        <EyeOff className="h-4 w-4" aria-hidden="true" />
        Ẩn bài
      </button>
      <button
        type="button"
        role="menuitem"
        onClick={() => handleAction('Đã xóa bài viết')}
        className={'flex min-h-11 w-full items-center gap-2 rounded-lg px-3 text-left text-[12px] font-extrabold text-nexoraDanger hover:bg-nexoraDanger/10 ' + motionClass}
      >
        <Trash2 className="h-4 w-4" aria-hidden="true" />
        Xóa bài
      </button>
      <button
        type="button"
        role="menuitem"
        onClick={() => handleAction('Đã gửi báo cáo — đội moderation sẽ xem xét')}
        className={'flex min-h-11 w-full items-center gap-2 rounded-lg px-3 text-left text-[12px] font-extrabold text-nexoraDanger hover:bg-nexoraDanger/10 ' + motionClass}
      >
        <Flag className="h-4 w-4" aria-hidden="true" />
        Báo cáo
      </button>
    </div>
  )
}

function OwnerPost({
  postId,
  initials,
  tone,
  name,
  meta,
  body,
  likes,
  comments,
  announcement = false,
  pinned,
  menuOpen,
  onMenuToggle,
  onPinToggle,
  onToast,
}: {
  postId: PostId
  initials: string
  tone: AvatarTone
  name: string
  meta: string
  body: string
  likes: string
  comments: string
  announcement?: boolean
  pinned: boolean
  menuOpen: boolean
  onMenuToggle: () => void
  onPinToggle: () => void
  onToast: (message: string) => void
}) {
  return (
    <article className="relative px-4 py-4">
      <div className="flex items-start gap-3">
        <Avatar initials={initials} tone={tone} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <h3 className="text-[13px] font-extrabold text-nexoraText">{name}</h3>
            {announcement ? (
              <>
                <span aria-label="Đã xác minh" className="text-[12px] font-extrabold text-nexoraSuccess">✓</span>
                <span className="rounded-full bg-nexoraBrandSoft px-2 py-0.5 text-[10px] font-extrabold text-nexoraBrand">
                  Thông báo
                </span>
              </>
            ) : null}
          </div>
          <p className="mt-0.5 text-[11px] text-nexoraSubtle">
            {pinned ? '📌 Đã ghim · ' : ''}{meta}
          </p>
        </div>
      </div>
      <p className="mt-3 text-[13px] leading-[1.62] text-nexoraText">{body}</p>
      <div className="mt-2 flex items-center gap-0.5">
        <FeedAction icon={<ThumbsUp className="h-4 w-4" aria-hidden="true" />} label={likes} />
        <FeedAction icon={<MessageCircle className="h-4 w-4" aria-hidden="true" />} label={comments} />
        <div className="relative ml-auto">
          <button
            type="button"
            aria-label={'Mở menu quản lý ' + (announcement ? 'thông báo' : 'bài viết của Jessica M.')}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            onClick={onMenuToggle}
            className={'grid h-11 w-11 place-items-center rounded-lg text-nexoraMuted hover:bg-nexoraSurfaceMuted hover:text-nexoraText ' + motionClass}
          >
            <MoreHorizontal className="h-5 w-5" aria-hidden="true" />
          </button>
          {menuOpen ? (
            <OwnerPostMenu
              postId={postId}
              pinned={pinned}
              onPinToggle={onPinToggle}
              onToast={onToast}
              onClose={onMenuToggle}
            />
          ) : null}
        </div>
      </div>
    </article>
  )
}

function GroupFeedSection({ onToast }: { onToast: (message: string) => void }) {
  const [openMenu, setOpenMenu] = useState<PostId | null>(null)
  const [pinnedPosts, setPinnedPosts] = useState<Record<PostId, boolean>>({
    announcement: true,
    'member-post': false,
  })

  const togglePinned = (postId: PostId) => {
    setPinnedPosts((current) => ({ ...current, [postId]: !current[postId] }))
  }

  return (
    <section aria-labelledby="business-feed-title">
      <div className="flex min-h-11 items-center px-0.5">
        <h2 id="business-feed-title" className="text-[13px] font-extrabold text-nexoraText">Bảng tin nhóm</h2>
      </div>
      <div className={panelClass}>
        <div className="divide-y divide-nexoraRule">
          <OwnerPost
            postId="announcement"
            initials="BN"
            tone="gold"
            name="Bitcoin Nail Bar Team"
            meta="Salon Group · 2 giờ trước"
            body="Lịch training gel-x tuần này dời sang thứ Năm 7pm. Các bạn thợ mới nhớ mang kit riêng nhé — tiệm chuẩn bị sẵn form và mẫu thực hành cho từng người."
            likes="28"
            comments="15"
            announcement
            pinned={pinnedPosts.announcement}
            menuOpen={openMenu === 'announcement'}
            onMenuToggle={() => setOpenMenu((current) => current === 'announcement' ? null : 'announcement')}
            onPinToggle={() => togglePinned('announcement')}
            onToast={onToast}
          />
          <OwnerPost
            postId="member-post"
            initials="JM"
            tone="violet"
            name="Jessica M."
            meta="Houston Nail Pros · 5 giờ trước"
            body="Khách yêu cầu design phức tạp mất gần gấp đôi thời gian — mọi người đang tính phụ phí thế nào cho hợp lý? Mình đang cân nhắc bảng giá theo tầng nhưng sợ khách quen phản ứng."
            likes="12"
            comments="8"
            pinned={pinnedPosts['member-post']}
            menuOpen={openMenu === 'member-post'}
            onMenuToggle={() => setOpenMenu((current) => current === 'member-post' ? null : 'member-post')}
            onPinToggle={() => togglePinned('member-post')}
            onToast={onToast}
          />
        </div>
      </div>
    </section>
  )
}

type Member = {
  id: string
  initials: string
  name: string
  role: 'Chủ nhóm' | 'Quản lý' | 'Thành viên'
  tone: AvatarTone
}

const members: Member[] = [
  { id: 'kayla', initials: 'KL', name: 'Kayla Le', role: 'Chủ nhóm', tone: 'brand' },
  { id: 'jessica', initials: 'JM', name: 'Jessica M.', role: 'Quản lý', tone: 'violet' },
  { id: 'trang', initials: 'TP', name: 'Trang P.', role: 'Thành viên', tone: 'teal' },
  { id: 'mai', initials: 'MN', name: 'Mai N.', role: 'Thành viên', tone: 'gold' },
]

function MemberMenu({ member, onToast, onClose }: { member: Member; onToast: (message: string) => void; onClose: () => void }) {
  const action = (message: string) => {
    onToast(message)
    onClose()
  }

  return (
    <div
      role="menu"
      aria-label={'Quản lý thành viên ' + member.name}
      className="absolute right-3 top-14 z-30 w-56 overflow-hidden rounded-xl border border-nexoraBorder bg-white p-1.5 shadow-xl"
    >
      <button type="button" role="menuitem" onClick={() => action(member.name + ' đã được thăng Quản lý')} className={'flex min-h-11 w-full items-center gap-2 rounded-lg px-3 text-left text-[12px] font-bold text-nexoraText hover:bg-nexoraSurfaceMuted ' + motionClass}>
        <ShieldCheck className="h-4 w-4" aria-hidden="true" /> Thăng Quản lý
      </button>
      <button type="button" role="menuitem" onClick={() => action('Đã tắt tiếng ' + member.name + ' trong 7 ngày')} className={'flex min-h-11 w-full items-center gap-2 rounded-lg px-3 text-left text-[12px] font-bold text-nexoraText hover:bg-nexoraSurfaceMuted ' + motionClass}>
        <VolumeX className="h-4 w-4" aria-hidden="true" /> Tắt tiếng 7 ngày
      </button>
      <button type="button" role="menuitem" onClick={() => action('Đã chặn ' + member.name)} className={'flex min-h-11 w-full items-center gap-2 rounded-lg px-3 text-left text-[12px] font-bold text-nexoraText hover:bg-nexoraSurfaceMuted ' + motionClass}>
        <Ban className="h-4 w-4" aria-hidden="true" /> Chặn
      </button>
      <button type="button" role="menuitem" onClick={() => action('Đã xóa ' + member.name + ' khỏi nhóm')} className={'flex min-h-11 w-full items-center gap-2 rounded-lg px-3 text-left text-[12px] font-extrabold text-nexoraDanger hover:bg-nexoraDanger/10 ' + motionClass}>
        <UserMinus className="h-4 w-4" aria-hidden="true" /> Xóa khỏi nhóm
      </button>
    </div>
  )
}

function MembersSection({ onToast }: { onToast: (message: string) => void }) {
  const [openMenu, setOpenMenu] = useState<string | null>(null)

  return (
    <section aria-labelledby="business-members-title">
      <div className="flex min-h-11 items-center px-0.5">
        <h2 id="business-members-title" className="text-[13px] font-extrabold text-nexoraText">Thành viên (12)</h2>
      </div>
      <div className={panelClass}>
        <div className="divide-y divide-nexoraRule">
          {members.map((member) => {
            const owner = member.role === 'Chủ nhóm'
            const roleClass = owner
              ? 'bg-nexoraBrandSoft text-nexoraBrand'
              : member.role === 'Quản lý'
                ? 'bg-nexoraSuccess/10 text-nexoraSuccess'
                : 'bg-nexoraSurfaceMuted text-nexoraMuted'
            return (
              <div key={member.id} className="relative flex min-h-[72px] items-center gap-3 px-4 py-3">
                <Avatar initials={member.initials} tone={member.tone} />
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-[13px] font-extrabold text-nexoraText">{member.name}</h3>
                  <span className={'mt-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ' + roleClass}>
                    {member.role}
                  </span>
                </div>
                {!owner ? (
                  <button
                    type="button"
                    aria-label={'Mở menu thành viên ' + member.name}
                    aria-haspopup="menu"
                    aria-expanded={openMenu === member.id}
                    onClick={() => setOpenMenu((current) => current === member.id ? null : member.id)}
                    className={'grid h-11 w-11 shrink-0 place-items-center rounded-lg text-nexoraMuted hover:bg-nexoraSurfaceMuted hover:text-nexoraText ' + motionClass}
                  >
                    <MoreHorizontal className="h-5 w-5" aria-hidden="true" />
                  </button>
                ) : null}
                {openMenu === member.id ? (
                  <MemberMenu member={member} onToast={onToast} onClose={() => setOpenMenu(null)} />
                ) : null}
              </div>
            )
          })}
        </div>
        <button
          type="button"
          onClick={() => onToast('Mở danh sách đầy đủ 12 thành viên')}
          className={'flex min-h-11 w-full items-center justify-center border-t border-nexoraRule px-4 text-[12px] font-extrabold text-nexoraBrand hover:bg-nexoraBrandSoft/50 ' + motionClass}
        >
          Xem tất cả 12 thành viên ›
        </button>
      </div>
    </section>
  )
}

function BenefitRow({ icon: Icon, children }: { icon: LucideIcon; children: ReactNode }) {
  return (
    <div className="flex min-h-[72px] items-center gap-3 px-4 py-3">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-nexoraBrandSoft text-nexoraBrand">
        <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
      </span>
      <p className="text-[13px] font-semibold leading-relaxed text-nexoraText">{children}</p>
    </div>
  )
}

function BusinessColdStart({ onToast }: { onToast: (message: string) => void }) {
  return (
    <>
      <section className={panelClass + ' px-5 py-8 text-center sm:px-8 sm:py-10'}>
        <span role="img" aria-label="Cửa hàng" className="text-4xl">🏪</span>
        <h2 className="mx-auto mt-3 max-w-xl text-xl font-extrabold leading-snug text-nexoraText sm:text-2xl">
          Tạo không gian riêng cho Bitcoin Nail Bar
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-[13px] leading-relaxed text-nexoraMuted">
          Kết nối thợ và khách VIP của tiệm — đăng lịch làm, training, thông báo trong một nhóm được xác minh.
        </p>
        <button
          type="button"
          onClick={() => onToast('Mở wizard Tạo nhóm (6 bước)')}
          className={primaryClass + ' mt-5 min-h-12 w-full px-6 text-[13px] sm:w-auto sm:min-w-[250px]'}
        >
          Tạo Salon Group ✓
        </button>
        <p className="mx-auto mt-3 max-w-lg text-[11px] font-semibold leading-relaxed text-nexoraSuccess">
          Tiệm của bạn đã xác minh (KYB) — nhóm sẽ có badge ✓ ngay khi tạo
        </p>
      </section>

      <section aria-labelledby="business-benefits-title">
        <div className="flex min-h-11 items-center px-0.5">
          <h2 id="business-benefits-title" className="text-[13px] font-extrabold text-nexoraText">Vì sao nên tạo?</h2>
        </div>
        <div className={panelClass + ' overflow-hidden'}>
          <div className="divide-y divide-nexoraRule">
            <BenefitRow icon={CalendarDays}>Thông báo lịch làm &amp; training tới cả tiệm</BenefitRow>
            <BenefitRow icon={UserCheck}>Duyệt thành viên — chỉ thợ và khách bạn chọn</BenefitRow>
            <BenefitRow icon={BadgeCheck}>Badge ✓ Đã xác minh — khách nhận diện tiệm thật</BenefitRow>
          </div>
        </div>
      </section>
    </>
  )
}

export default function CommunityBusinessDemo() {
  const [demoState, setDemoState] = useState<BusinessDemoState>('group')
  const [requests, setRequests] = useState(initialJoinRequests)
  const [exitingRequestId, setExitingRequestId] = useState<string | null>(null)
  const [toast, setToast] = useState('')

  useEffect(() => {
    if (!toast) return undefined
    const timeout = window.setTimeout(() => setToast(''), 3200)
    return () => window.clearTimeout(timeout)
  }, [toast])

  const handleRequest = (request: JoinRequest, approve: boolean) => {
    setExitingRequestId(request.id)
    setToast(approve ? 'Đã duyệt — ' + request.name + ' đã vào nhóm' : 'Đã từ chối yêu cầu')
    window.setTimeout(() => {
      setRequests((current) => current.filter((item) => item.id !== request.id))
      setExitingRequestId(null)
    }, 180)
  }

  return (
    <div className="min-h-dvh bg-nexoraCanvas font-sans text-nexoraText antialiased">
      <DemoStateBar
        value={demoState}
        options={[
          { id: 'group', label: 'Đã có Salon Group' },
          { id: 'cold-start', label: 'Chưa tạo nhóm' },
        ]}
        onChange={(value) => setDemoState(value as BusinessDemoState)}
        crossLinkLabel="Xem phía thợ →"
        crossLinkTo="/design-demo/community"
      />

      <DemoMerchantShell onDemoNavigation={() => setToast('Bản demo — chỉ màn Community hoạt động')}>
        <div className="mx-auto w-full max-w-5xl space-y-5">
          <PageHeading />
          {demoState === 'group' ? (
            <>
              <GroupHeaderPanel onToast={setToast} />
              <JoinRequestsSection requests={requests} exitingId={exitingRequestId} onHandle={handleRequest} />
              <AnnouncementComposer onToast={setToast} />
              <GroupFeedSection onToast={setToast} />
              <MembersSection onToast={setToast} />
            </>
          ) : (
            <BusinessColdStart onToast={setToast} />
          )}
        </div>
      </DemoMerchantShell>

      {toast ? (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-24 left-1/2 z-[115] w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 rounded-full bg-nexoraText px-4 py-3 text-center text-[12px] font-bold text-white shadow-xl lg:bottom-6 lg:left-[calc(50%+9rem)]"
        >
          {toast}
        </div>
      ) : null}
    </div>
  )
}
