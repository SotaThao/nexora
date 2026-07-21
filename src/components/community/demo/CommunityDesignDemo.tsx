// DEMO ONLY — production version must use i18n community.* keys per Product Doc.
import {
  BarChart3,
  Bookmark,
  EyeOff,
  Flag,
  Image as ImageIcon,
  MessageCircle,
  MoreHorizontal,
  Share2,
  ThumbsUp,
} from 'lucide-react'
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import DemoStaffShell from './DemoStaffShell'
import DemoStateBar from './DemoStateBar'

type DemoState = 'groups' | 'first-run'
type AvatarTone = 'gold' | 'violet' | 'teal' | 'brand'

const panelClass =
  'overflow-hidden rounded-2xl border border-nexoraBorder bg-nexoraSurface shadow-nexora-card'
const motionClass =
  'motion-safe:transition-colors motion-safe:duration-200 motion-reduce:transition-none'
const primaryClass =
  'inline-flex items-center justify-center rounded-full bg-gradient-to-r from-nexoraElectric to-nexoraViolet font-extrabold text-white shadow-nexora-soft hover:opacity-90 ' +
  motionClass

const reportReasons = [
  'Spam hoặc lừa đảo',
  'Mạo danh salon hoặc cá nhân',
  'Quấy rối hoặc thù ghét',
  'Lý do khác…',
]

function Avatar({ initials, tone, className = '' }: { initials: string; tone: AvatarTone; className?: string }) {
  const toneClass = {
    gold: 'from-[#d4af37] to-[#aa7c11]',
    violet: 'from-nexoraElectricMid to-nexoraViolet',
    teal: 'from-nexoraTeal to-nexoraTealAlt',
    brand: 'from-nexoraElectric to-nexoraViolet',
  }[tone]

  return (
    <span
      aria-hidden="true"
      className={'grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br text-[11px] font-extrabold text-white shadow-sm ' + toneClass + ' ' + className}
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

function GroupRow({
  initials,
  tone,
  title,
  meta,
  verified = false,
  unread,
  action,
}: {
  initials: string
  tone: AvatarTone
  title: string
  meta: string
  verified?: boolean
  unread?: string
  action?: ReactNode
}) {
  return (
    <div className="flex min-h-[76px] items-center gap-3 px-3 py-3 sm:px-4">
      <Avatar initials={initials} tone={tone} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <h3 className="text-[13px] font-extrabold leading-tight text-nexoraText">{title}</h3>
          {verified ? <VerifiedBadge /> : null}
        </div>
        <p className="mt-1 text-[11.5px] leading-[1.45] text-nexoraSubtle">{meta}</p>
      </div>
      {unread ? (
        <span className="grid h-5 min-w-5 shrink-0 place-items-center rounded-full bg-nexoraDanger px-1.5 text-[10px] font-extrabold text-white">
          {unread}
        </span>
      ) : null}
      {action}
    </div>
  )
}

function MyGroupsSection() {
  return (
    <section aria-labelledby="my-groups-title">
      <div className="flex min-h-11 items-center justify-between gap-3 px-0.5">
        <h2 id="my-groups-title" className="text-[13px] font-extrabold text-nexoraText">
          Nhóm của bạn
        </h2>
        <button
          type="button"
          className={'min-h-11 rounded-lg px-1 text-[12px] font-bold text-nexoraBrand hover:text-nexoraBrandDark ' + motionClass}
        >
          Tất cả ›
        </button>
      </div>
      <div className={panelClass}>
        <div className="divide-y divide-nexoraRule">
          <GroupRow
            initials="BN"
            tone="gold"
            title="Bitcoin Nail Bar Team"
            verified
            meta="Salon Group · 12 thành viên · Lịch training mới 2 giờ trước"
            unread="3"
          />
          <GroupRow
            initials="HP"
            tone="violet"
            title="Houston Nail Pros"
            meta="Nhóm riêng tư · 120 thành viên · 5 bài mới hôm nay"
            unread="12"
          />
          <button
            type="button"
            className={'flex min-h-[68px] w-full items-center gap-3 px-3 py-3 text-left hover:bg-nexoraSurfaceMuted sm:px-4 ' + motionClass}
          >
            <span
              aria-hidden="true"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-dashed border-nexoraBrand text-xl font-bold text-nexoraBrand"
            >
              ＋
            </span>
            <span className="text-[12px] font-bold leading-[1.45] text-nexoraBrand">
              Tạo nhóm — mời thợ bằng link hoặc QR trong 2 phút
            </span>
          </button>
        </div>
      </div>
    </section>
  )
}

function JoinButton({
  groupName,
  joined,
  label,
  joinedLabel = '✓ Đã tham gia',
  onClick,
}: {
  groupName: string
  joined: boolean
  label: string
  joinedLabel?: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      aria-label={joined ? groupName + ' — đã tham gia' : label + ' ' + groupName}
      aria-pressed={joined}
      onClick={onClick}
      className={
        'min-h-11 shrink-0 rounded-full border px-3 text-[11px] font-extrabold ' +
        motionClass +
        (joined
          ? ' border-nexoraSuccess/30 bg-nexoraSuccess/10 text-nexoraSuccess'
          : ' border-nexoraBrand bg-white text-nexoraBrand hover:bg-nexoraBrandSoft')
      }
    >
      {joined ? joinedLabel : label}
    </button>
  )
}

function RequestButton({
  groupName,
  pending,
  onClick,
}: {
  groupName: string
  pending: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      aria-label={pending ? 'Hủy yêu cầu tham gia ' + groupName : 'Gửi yêu cầu tham gia ' + groupName}
      aria-pressed={pending}
      onClick={onClick}
      className={
        'min-h-11 shrink-0 rounded-full border px-3 text-[11px] font-extrabold ' +
        motionClass +
        (pending
          ? ' border-nexoraBorder bg-nexoraSurfaceMuted text-nexoraMuted hover:text-nexoraDanger'
          : ' border-nexoraBrand bg-white text-nexoraBrand hover:bg-nexoraBrandSoft')
      }
    >
      {pending ? 'Chờ duyệt · Hủy' : 'Gửi yêu cầu'}
    </button>
  )
}

function HomeDiscoverSection({
  headingId,
  aiJoined,
  onAiJoin,
  gelPending,
  onGelRequest,
}: {
  headingId: string
  aiJoined: boolean
  onAiJoin: () => void
  gelPending: boolean
  onGelRequest: () => void
}) {
  return (
    <section aria-labelledby={headingId}>
      <div className="flex min-h-11 items-center justify-between gap-3 px-0.5">
        <h2 id={headingId} className="text-[13px] font-extrabold text-nexoraText">
          Khám phá nhóm
        </h2>
        <button
          type="button"
          className={'min-h-11 rounded-lg px-1 text-[12px] font-bold text-nexoraBrand hover:text-nexoraBrandDark ' + motionClass}
        >
          Houston, TX ›
        </button>
      </div>
      <div className={panelClass}>
        <div className="divide-y divide-nexoraRule">
          <GroupRow
            initials="AI"
            tone="teal"
            title="AI for Nail Biz"
            meta="Công khai · 1.2k thành viên · Phổ biến trong ngành của bạn"
            action={
              <JoinButton
                groupName="AI for Nail Biz"
                label="Tham gia"
                joined={aiJoined}
                onClick={onAiJoin}
              />
            }
          />
          <GroupRow
            initials="GX"
            tone="brand"
            title="Gel-X Education Hub"
            meta="Riêng tư · 3.4k thành viên · Nhiều thợ gần bạn tham gia"
            action={
              <RequestButton
                groupName="Gel-X Education Hub"
                pending={gelPending}
                onClick={onGelRequest}
              />
            }
          />
        </div>
      </div>
    </section>
  )
}

function NearbyGroupsSection({
  headingId,
  houstonPending,
  onHoustonRequest,
  gelJoined,
  onGelJoin,
}: {
  headingId: string
  houstonPending: boolean
  onHoustonRequest: () => void
  gelJoined: boolean
  onGelJoin: () => void
}) {
  return (
    <section aria-labelledby={headingId}>
      <div className="flex min-h-11 items-center justify-between gap-3 px-0.5">
        <h2 id={headingId} className="text-[13px] font-extrabold text-nexoraText">
          Nhóm nghề gần bạn
        </h2>
        <button
          type="button"
          className={'min-h-11 rounded-lg px-1 text-[12px] font-bold text-nexoraBrand hover:text-nexoraBrandDark ' + motionClass}
        >
          Houston ›
        </button>
      </div>
      <div className={panelClass}>
        <div className="divide-y divide-nexoraRule">
          <GroupRow
            initials="HP"
            tone="violet"
            title="Houston Nail Pros"
            meta="Riêng tư · 120 thành viên · cần duyệt"
            action={
              <RequestButton
                groupName="Houston Nail Pros"
                pending={houstonPending}
                onClick={onHoustonRequest}
              />
            }
          />
          <GroupRow
            initials="GX"
            tone="brand"
            title="Gel-X Education Hub"
            meta="Công khai · 3.4k thành viên · Nhóm đào tạo nghề"
            action={
              <JoinButton
                groupName="Gel-X Education Hub"
                label="Tham gia"
                joined={gelJoined}
                onClick={onGelJoin}
              />
            }
          />
        </div>
      </div>
    </section>
  )
}

function OwnerPrompt() {
  return (
    <section className="rounded-2xl border border-nexoraBorder bg-nexoraSurfaceMuted px-5 py-4 text-center text-[13px] leading-relaxed text-nexoraMuted">
      Là chủ salon?{' '}
      <button
        type="button"
        className={'min-h-11 rounded-lg px-1 font-bold text-nexoraBrand hover:text-nexoraBrandDark ' + motionClass}
      >
        Tạo nhóm cho tiệm của bạn
      </button>{' '}
      — mời thợ bằng link hoặc QR trong 2 phút.
    </section>
  )
}

function Composer() {
  return (
    <div className="flex items-center gap-2 border-b border-nexoraRule px-3 py-3 sm:px-4">
      <Avatar initials="KL" tone="violet" />
      <button
        type="button"
        className={'min-h-11 min-w-0 flex-1 truncate rounded-full bg-nexoraSurfaceMuted px-4 text-left text-[12px] font-medium text-nexoraSubtle hover:bg-nexoraBorder/70 ' + motionClass}
      >
        Đăng bài trong nhóm…
      </button>
      <button
        type="button"
        aria-label="Thêm hình ảnh"
        className={'grid h-11 w-11 shrink-0 place-items-center rounded-full text-nexoraMuted hover:bg-nexoraSurfaceMuted hover:text-nexoraBrand ' + motionClass}
      >
        <ImageIcon className="h-[18px] w-[18px]" aria-hidden="true" />
      </button>
      <button
        type="button"
        aria-label="Tạo bình chọn"
        className={'grid h-11 w-11 shrink-0 place-items-center rounded-full text-nexoraMuted hover:bg-nexoraSurfaceMuted hover:text-nexoraBrand ' + motionClass}
      >
        <BarChart3 className="h-[18px] w-[18px]" aria-hidden="true" />
      </button>
    </div>
  )
}

function ActionButton({ icon, label, ariaLabel }: { icon: ReactNode; label?: string; ariaLabel?: string }) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      className={'inline-flex h-11 min-w-11 items-center justify-center gap-1.5 rounded-lg px-2 text-[12px] font-bold text-nexoraMuted hover:bg-nexoraSurfaceMuted hover:text-nexoraBrand ' + motionClass}
    >
      {icon}
      {label ? <span>{label}</span> : null}
    </button>
  )
}

function AnnouncementPost({
  menuOpen,
  onToggleMenu,
  onCloseMenu,
  onReport,
}: {
  menuOpen: boolean
  onToggleMenu: () => void
  onCloseMenu: () => void
  onReport: () => void
}) {
  return (
    <article className="relative px-4 py-4">
      <div className="flex items-start gap-3">
        <Avatar initials="BN" tone="gold" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <h3 className="text-[13px] font-extrabold text-nexoraText">Bitcoin Nail Bar Team</h3>
            <span aria-label="Đã xác minh" className="text-[12px] font-extrabold text-nexoraSuccess">
              ✓
            </span>
            <span className="rounded-full bg-nexoraBrandSoft px-2 py-0.5 text-[10px] font-extrabold text-nexoraBrand">
              Thông báo
            </span>
          </div>
          <p className="mt-0.5 text-[11px] text-nexoraSubtle">📌 Đã ghim · Salon Group · 2 giờ trước</p>
        </div>
      </div>
      <p className="mt-3 text-[13px] leading-[1.62] text-nexoraText">
        Lịch training gel-x tuần này dời sang thứ Năm 7pm. Các bạn thợ mới nhớ mang kit riêng nhé — tiệm chuẩn bị sẵn form và mẫu thực hành cho từng người.
      </p>
      <div className="mt-2 flex items-center gap-0.5">
        <ActionButton icon={<ThumbsUp className="h-4 w-4" aria-hidden="true" />} label="28" />
        <ActionButton icon={<MessageCircle className="h-4 w-4" aria-hidden="true" />} label="15" />
        <ActionButton
          icon={<Share2 className="h-4 w-4" aria-hidden="true" />}
          ariaLabel="Chia sẻ bài đăng"
        />
        <button
          type="button"
          aria-label="Mở tùy chọn bài đăng"
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          aria-controls="community-post-menu"
          onClick={onToggleMenu}
          className={'ml-auto grid h-11 w-11 place-items-center rounded-lg text-nexoraMuted hover:bg-nexoraSurfaceMuted hover:text-nexoraText ' + motionClass}
        >
          <MoreHorizontal className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>

      {menuOpen ? (
        <div
          id="community-post-menu"
          role="menu"
          aria-label="Tùy chọn bài đăng"
          className="absolute bottom-14 right-4 z-20 w-52 overflow-hidden rounded-xl border border-nexoraBorder bg-white p-1.5 shadow-xl"
        >
          <button
            type="button"
            role="menuitem"
            onClick={onCloseMenu}
            className={'flex min-h-11 w-full items-center gap-2 rounded-lg px-3 text-left text-[12px] font-bold text-nexoraText hover:bg-nexoraSurfaceMuted ' + motionClass}
          >
            <Bookmark className="h-4 w-4" aria-hidden="true" />
            Lưu bài đăng
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={onCloseMenu}
            className={'flex min-h-11 w-full items-center gap-2 rounded-lg px-3 text-left text-[12px] font-bold text-nexoraText hover:bg-nexoraSurfaceMuted ' + motionClass}
          >
            <EyeOff className="h-4 w-4" aria-hidden="true" />
            Ẩn bài này
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={onReport}
            className={'flex min-h-11 w-full items-center gap-2 rounded-lg px-3 text-left text-[12px] font-extrabold text-nexoraDanger hover:bg-nexoraDanger/10 ' + motionClass}
          >
            <Flag className="h-4 w-4" aria-hidden="true" />
            Báo cáo
          </button>
        </div>
      ) : null}
    </article>
  )
}

function StandardPost() {
  return (
    <article className="px-4 py-4">
      <div className="flex items-start gap-3">
        <Avatar initials="JM" tone="violet" />
        <div className="min-w-0 flex-1">
          <h3 className="text-[13px] font-extrabold text-nexoraText">Jessica M.</h3>
          <p className="mt-0.5 text-[11px] text-nexoraSubtle">Houston Nail Pros · 5 giờ trước</p>
        </div>
      </div>
      <p className="mt-3 text-[13px] leading-[1.62] text-nexoraText">
        Khách yêu cầu design phức tạp mất gần gấp đôi thời gian — mọi người đang tính phụ phí thế nào cho hợp lý? Mình đang cân nhắc bảng giá theo tầng nhưng sợ khách quen phản ứng.
      </p>
      <div className="mt-2 flex items-center gap-0.5">
        <ActionButton icon={<ThumbsUp className="h-4 w-4" aria-hidden="true" />} label="12" />
        <ActionButton icon={<MessageCircle className="h-4 w-4" aria-hidden="true" />} label="8" />
      </div>
    </article>
  )
}

function FeedSection({
  filter,
  onFilterChange,
  menuOpen,
  onToggleMenu,
  onCloseMenu,
  onReport,
}: {
  filter: 'all' | 'announcements'
  onFilterChange: (filter: 'all' | 'announcements') => void
  menuOpen: boolean
  onToggleMenu: () => void
  onCloseMenu: () => void
  onReport: () => void
}) {
  return (
    <section aria-labelledby="feed-title">
      <div className="flex min-h-11 items-center justify-between gap-3 px-0.5">
        <h2 id="feed-title" className="text-[13px] font-extrabold text-nexoraText">
          Bảng tin
        </h2>
        <div className="flex gap-1.5" aria-label="Lọc bảng tin">
          <button
            type="button"
            aria-pressed={filter === 'all'}
            onClick={() => onFilterChange('all')}
            className={
              'min-h-11 rounded-full px-3 text-[11px] font-extrabold ' +
              motionClass +
              (filter === 'all'
                ? ' bg-nexoraBrand text-white'
                : ' border border-nexoraBorder bg-white text-nexoraMuted hover:bg-nexoraSurfaceMuted')
            }
          >
            Tất cả
          </button>
          <button
            type="button"
            aria-pressed={filter === 'announcements'}
            onClick={() => onFilterChange('announcements')}
            className={
              'min-h-11 rounded-full px-3 text-[11px] font-extrabold ' +
              motionClass +
              (filter === 'announcements'
                ? ' bg-nexoraBrand text-white'
                : ' border border-nexoraBorder bg-white text-nexoraMuted hover:bg-nexoraSurfaceMuted')
            }
          >
            Thông báo
          </button>
        </div>
      </div>
      <div className={panelClass}>
        <Composer />
        <div className="divide-y divide-nexoraRule">
          <AnnouncementPost
            menuOpen={menuOpen}
            onToggleMenu={onToggleMenu}
            onCloseMenu={onCloseMenu}
            onReport={onReport}
          />
          {filter === 'all' ? <StandardPost /> : null}
        </div>
      </div>
    </section>
  )
}

function WelcomePanel({ joined, onJoin }: { joined: boolean; onJoin: () => void }) {
  return (
    <section className={panelClass + ' px-5 py-7 text-center sm:px-8 sm:py-9'}>
      <span role="img" aria-label="Vẫy tay" className="text-4xl">
        👋
      </span>
      <h2 className="mx-auto mt-3 max-w-lg text-lg font-extrabold leading-snug text-nexoraText sm:text-xl">
        Chào Kayla — cộng đồng của bạn bắt đầu ở đây
      </h2>
      <p className="mx-auto mt-3 max-w-lg text-[13px] leading-relaxed text-nexoraMuted">
        Salon bạn đang làm việc đã có nhóm trên Nexora. Tham gia để nhận lịch làm, thông báo training và cập nhật tip từ chủ tiệm — tất cả ở một chỗ.
      </p>
      <button
        type="button"
        aria-label={joined ? 'Bitcoin Nail Bar — đã tham gia' : 'Tham gia Bitcoin Nail Bar'}
        aria-pressed={joined}
        onClick={onJoin}
        className={primaryClass + ' mt-5 min-h-12 w-full px-5 text-[13px] sm:w-auto sm:min-w-[280px]'}
      >
        {joined ? '✓ Đã tham gia Bitcoin Nail Bar' : 'Tham gia Bitcoin Nail Bar ✓'}
      </button>
    </section>
  )
}

function MobileCommunityHeading() {
  return (
    <div className="flex min-h-14 items-center justify-between gap-3 lg:hidden">
      <div className="flex min-w-0 items-center gap-2">
        <h1 className="truncate text-[22px] font-extrabold tracking-tight text-nexoraText">Community</h1>
        <span className="rounded-full bg-gradient-to-r from-nexoraElectric to-nexoraViolet px-2 py-1 text-[9px] font-extrabold tracking-wide text-white">
          NEW
        </span>
      </div>
      <button type="button" className={primaryClass + ' min-h-11 shrink-0 px-4 text-[12px]'}>
        ＋ Tạo nhóm
      </button>
    </div>
  )
}

function ReportDialog({ open, onClose, onSubmit }: { open: boolean; onClose: () => void; onSubmit: () => void }) {
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return undefined

    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const focusFrame = window.requestAnimationFrame(() => {
      dialogRef.current?.querySelector<HTMLElement>('[data-autofocus]')?.focus()
    })

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
        return
      }

      if (event.key !== 'Tab' || !dialogRef.current) return

      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ) as HTMLElement[]
      if (focusable.length === 0) {
        event.preventDefault()
        return
      }

      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (!dialogRef.current.contains(document.activeElement)) {
        event.preventDefault()
        ;(event.shiftKey ? last : first).focus()
        return
      }
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      window.cancelAnimationFrame(focusFrame)
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = previousOverflow
      previouslyFocused?.focus()
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-x-0 bottom-0 top-[52px] z-[110] flex items-end justify-center bg-nexoraText/60 backdrop-blur-[2px] lg:left-72">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="report-dialog-title"
        aria-describedby="report-dialog-description"
        className="w-full max-w-lg rounded-t-2xl border border-b-0 border-nexoraBorder bg-white px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-3 shadow-2xl sm:px-6"
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-nexoraBorder" />
        <h2 id="report-dialog-title" className="text-lg font-extrabold text-nexoraText">
          Báo cáo nội dung này
        </h2>
        <p id="report-dialog-description" className="mt-1 text-[12px] leading-relaxed text-nexoraMuted">
          Chọn lý do phù hợp nhất. Người đăng sẽ không biết ai đã gửi báo cáo.
        </p>
        <div className="mt-4 space-y-2">
          {reportReasons.map((reason, index) => (
            <button
              key={reason}
              type="button"
              data-autofocus={index === 0 ? 'true' : undefined}
              onClick={onSubmit}
              className={'flex min-h-12 w-full items-center justify-between rounded-xl border border-nexoraBorder px-4 text-left text-[13px] font-bold text-nexoraText hover:border-nexoraBrand hover:bg-nexoraBrandSoft/50 ' + motionClass}
            >
              {reason}
              <span aria-hidden="true" className="text-nexoraSubtle">
                ›
              </span>
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={onClose}
          className={'mt-3 min-h-12 w-full rounded-xl text-[13px] font-extrabold text-nexoraMuted hover:bg-nexoraSurfaceMuted ' + motionClass}
        >
          Hủy
        </button>
      </div>
    </div>
  )
}

export default function CommunityDesignDemo() {
  const [demoState, setDemoState] = useState<DemoState>('groups')
  const [feedFilter, setFeedFilter] = useState<'all' | 'announcements'>('all')
  const [aiJoined, setAiJoined] = useState(false)
  const [gelPending, setGelPending] = useState(false)
  const [houstonPending, setHoustonPending] = useState(false)
  const [nearbyGelJoined, setNearbyGelJoined] = useState(false)
  const [welcomeJoined, setWelcomeJoined] = useState(false)
  const [postMenuOpen, setPostMenuOpen] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)
  const [toast, setToast] = useState('')

  useEffect(() => {
    if (!toast) return undefined
    const timeout = window.setTimeout(() => setToast(''), 3200)
    return () => window.clearTimeout(timeout)
  }, [toast])

  const closeReport = useCallback(() => setReportOpen(false), [])
  const submitReport = () => {
    setReportOpen(false)
    setToast('Đã gửi báo cáo — đội moderation sẽ xem xét')
  }

  return (
    <div className="min-h-dvh bg-nexoraCanvas font-sans text-nexoraText antialiased">
      <DemoStateBar
        value={demoState}
        options={[
          { id: 'groups', label: 'Đã có nhóm' },
          { id: 'first-run', label: 'First-run (0 nhóm)' },
        ]}
        onChange={(value) => setDemoState(value as DemoState)}
        crossLinkLabel="Xem phía chủ tiệm →"
        crossLinkTo="/design-demo/community-business"
      />
      <DemoStaffShell
        onDemoNavigation={() => setToast('Bản demo — chỉ màn Community hoạt động')}
      >
        <div className="space-y-5">
          <MobileCommunityHeading />
          {demoState === 'groups' ? (
            <>
              <MyGroupsSection />
              <HomeDiscoverSection
                headingId="discover-title"
                aiJoined={aiJoined}
                onAiJoin={() => setAiJoined(true)}
                gelPending={gelPending}
                onGelRequest={() => setGelPending((current) => !current)}
              />
              <FeedSection
                filter={feedFilter}
                onFilterChange={setFeedFilter}
                menuOpen={postMenuOpen}
                onToggleMenu={() => setPostMenuOpen((current) => !current)}
                onCloseMenu={() => setPostMenuOpen(false)}
                onReport={() => {
                  setPostMenuOpen(false)
                  setReportOpen(true)
                }}
              />
              <div className="hidden lg:block">
                <OwnerPrompt />
              </div>
            </>
          ) : (
            <>
              <WelcomePanel joined={welcomeJoined} onJoin={() => setWelcomeJoined(true)} />
              <NearbyGroupsSection
                headingId="nearby-title"
                houstonPending={houstonPending}
                onHoustonRequest={() => setHoustonPending((current) => !current)}
                gelJoined={nearbyGelJoined}
                onGelJoin={() => setNearbyGelJoined(true)}
              />
              <OwnerPrompt />
            </>
          )}
        </div>
      </DemoStaffShell>

      <ReportDialog open={reportOpen} onClose={closeReport} onSubmit={submitReport} />
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
