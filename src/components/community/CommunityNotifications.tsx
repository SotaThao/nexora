import { AlertCircle, BellRing, CheckCheck, Clock3, Loader2, MessageCircle, RefreshCw, ShieldCheck, Sparkles, UserCheck, Users } from 'lucide-react'
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { useNotification } from '../../contexts/NotificationContext'
import { useCommunityNotifications } from '../../data/hooks/useCommunityNotifications'
import type { NotificationDto } from '../../data/repositories/community'

type CommunityNotificationsValue = ReturnType<typeof useCommunityNotifications>

const CommunityNotificationsContext = createContext<CommunityNotificationsValue | null>(null)

function notificationCopy(notification: NotificationDto) {
  switch (notification.type) {
    case 'join_request': return 'Có yêu cầu mới muốn tham gia nhóm của bạn.'
    case 'join_approved': return 'Yêu cầu tham gia nhóm của bạn đã được duyệt.'
    case 'comment': return 'Có bình luận mới trên bài viết của bạn.'
    case 'mention': return 'Bạn được nhắc đến trong Community.'
    case 'invite': return 'Bạn nhận được lời mời tham gia nhóm.'
    case 'moderation': return 'Có cập nhật kiểm duyệt trong nhóm của bạn.'
    default: return 'Bạn có một thông báo mới từ Community.'
  }
}

function NotificationIcon({ type }: Pick<NotificationDto, 'type'>) {
  const Icon = type === 'comment' || type === 'mention'
    ? MessageCircle
    : type === 'join_request'
      ? Users
      : type === 'join_approved'
        ? UserCheck
        : type === 'moderation'
          ? ShieldCheck
          : BellRing
  return <Icon className="h-4 w-4" aria-hidden="true" />
}

function relativeTime(value: string) {
  const seconds = Math.max(0, Math.round((Date.now() - new Date(value).getTime()) / 1_000))
  if (seconds < 60) return 'Vừa xong'
  if (seconds < 3_600) return `${Math.floor(seconds / 60)} phút`
  if (seconds < 86_400) return `${Math.floor(seconds / 3_600)} giờ`
  return `${Math.floor(seconds / 86_400)} ngày`
}

export function CommunityNotificationsProvider({ children }: { children: ReactNode }) {
  const { showToast } = useNotification()
  const onNewNotification = useCallback((notification: NotificationDto) => {
    showToast(notificationCopy(notification), notification.type === 'join_approved' ? 'success' : 'info', 5_000)
  }, [showToast])
  const value = useCommunityNotifications({ onNewNotification })
  return <CommunityNotificationsContext.Provider value={value}>{children}</CommunityNotificationsContext.Provider>
}

export function useCommunityNotificationCenter(): CommunityNotificationsValue {
  const context = useContext(CommunityNotificationsContext)
  if (!context) throw new Error('useCommunityNotificationCenter must be used inside CommunityNotificationsProvider')
  return context
}

export function CommunityNotificationBell() {
  const community = useCommunityNotificationCenter()
  const { pathname } = useLocation()
  const [isOpen, setIsOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const unreadCount = community.unreadCount
  const isChatRoute =
    pathname === '/community/chat' ||
    pathname.startsWith('/community/chat/') ||
    /^\/community\/[^/]+\/chat\/?$/.test(pathname)

  useEffect(() => {
    if (!isOpen) return
    const closeOnOutsidePress = (event: MouseEvent) => {
      if (!panelRef.current?.contains(event.target as Node)) setIsOpen(false)
    }
    document.addEventListener('mousedown', closeOnOutsidePress)
    return () => document.removeEventListener('mousedown', closeOnOutsidePress)
  }, [isOpen])

  const markAsRead = (notification: NotificationDto) => {
    if (!notification.readAt) void community.markRead(notification.id)
  }

  const markAllAsRead = () => {
    if (community.unreadCount) void community.markAllRead()
  }

  return (
    <div ref={panelRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
        aria-label={unreadCount ? `${unreadCount} thông báo chưa đọc` : 'Thông báo'}
        className={`relative grid h-11 w-11 place-items-center rounded-full border bg-white text-nexoraMuted transition hover:bg-nexoraCanvas ${isOpen ? 'border-nexoraBrand ring-2 ring-nexoraBrand/30' : 'border-nexoraBorder'}`}
      >
        <img src="/assets/menu/notification.png" alt="" className="h-5 w-5 object-contain" aria-hidden="true" />
        {unreadCount ? <span className="absolute -right-1 -top-1 grid min-h-5 min-w-5 place-items-center rounded-full border-2 border-white bg-red-500 px-1 text-[10px] font-extrabold text-white">{unreadCount > 99 ? '99+' : unreadCount}</span> : null}
      </button>

      {isOpen ? <section className={`fixed inset-x-4 z-[90] w-auto overflow-hidden rounded-xl border border-nexoraBorder bg-nexoraSurface shadow-2xl lg:absolute lg:inset-x-auto lg:right-0 lg:top-full lg:mt-2 lg:w-[23rem] ${isChatRoute ? 'top-[76px]' : 'top-[128px]'}`} aria-label="Danh sách thông báo">
        <header className="flex items-center justify-between border-b border-nexoraRule px-4 py-3">
          <div><h2 className="text-sm font-extrabold text-nexoraText">Thông báo</h2><p className="text-[11px] text-nexoraSubtle">{unreadCount ? `${unreadCount} chưa đọc · Community` : 'Bạn đã xem hết'}</p></div>
          {unreadCount ? <button type="button" onClick={markAllAsRead} disabled={community.isMarkingAllRead} className="inline-flex min-h-9 items-center gap-1 rounded-lg px-2 text-xs font-extrabold text-nexoraBrand hover:bg-nexoraBrandSoft disabled:opacity-50"><CheckCheck className="h-4 w-4" aria-hidden="true" />Đọc hết</button> : null}
        </header>

        {community.isReconnecting ? <p className="flex items-center gap-1.5 border-b border-nexoraRule px-4 py-2 text-[11px] font-semibold text-nexoraMuted"><Loader2 className="h-3.5 w-3.5 animate-spin text-nexoraBrand" aria-hidden="true" />Đang kết nối lại thông báo Community…</p> : null}
        {community.isLoading ? <div className="space-y-2 p-4" aria-label="Đang tải thông báo">{Array.from({ length: 3 }, (_, index) => <div key={index} className="h-16 animate-pulse rounded-xl bg-nexoraSurfaceMuted" />)}</div> : null}
        {!community.isLoading && community.error ? <div className="flex items-center justify-between gap-3 border-b border-nexoraRule px-4 py-2" role="alert"><span className="flex min-w-0 items-center gap-2 text-xs font-semibold text-nexoraDanger"><AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" /><span className="truncate">Community: {community.error.message}</span></span><button type="button" onClick={community.retry} className="shrink-0 text-xs font-extrabold text-nexoraBrand"><RefreshCw className="inline h-3.5 w-3.5" aria-hidden="true" /> Thử lại</button></div> : null}
        {!community.isLoading && community.notifications.length === 0 ? <div className="px-5 py-9 text-center"><Sparkles className="mx-auto h-6 w-6 text-nexoraBrand" aria-hidden="true" /><p className="mt-2 text-sm font-extrabold text-nexoraText">Chưa có thông báo</p><p className="mt-1 text-xs text-nexoraSubtle">Thông báo Community sẽ hiện ở đây.</p></div> : null}
        {!community.isLoading && community.notifications.length ? <div className="max-h-[min(60vh,28rem)] divide-y divide-nexoraRule overflow-y-auto">{community.notifications.map((notification) => <button key={notification.id} type="button" onClick={() => markAsRead(notification)} disabled={community.isMarkingRead} className={`flex w-full items-start gap-3 p-3.5 text-left transition hover:bg-nexoraSurfaceMuted disabled:opacity-60 ${!notification.readAt ? 'bg-nexoraBrandSoft/40' : ''}`}><span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${!notification.readAt ? 'bg-nexoraBrand text-white' : 'bg-nexoraSurfaceMuted text-nexoraMuted'}`}><NotificationIcon type={notification.type} /></span><span className="min-w-0 flex-1"><span className="flex items-center justify-between gap-2"><b className="truncate text-xs text-nexoraText">Community</b><span className="shrink-0 text-[10px] font-bold uppercase tracking-wide text-nexoraBrand">Community</span></span><span className="mt-1 block text-[11px] font-medium leading-normal text-nexoraMuted">{notificationCopy(notification)}</span><span className="mt-1 inline-flex items-center gap-1 text-[10px] text-nexoraSubtle"><Clock3 className="h-3 w-3" aria-hidden="true" />{relativeTime(notification.createdAt)}</span></span>{!notification.readAt ? <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-nexoraBrand" aria-label="Chưa đọc" /> : null}</button>)}</div> : null}
        {community.hasMore && !community.error ? <div className="border-t border-nexoraRule p-2 text-center"><button type="button" onClick={() => void community.loadMore()} disabled={community.isLoadingMore} className="inline-flex min-h-9 items-center gap-1 rounded-lg px-3 text-xs font-extrabold text-nexoraBrand hover:bg-nexoraBrandSoft disabled:opacity-50">{community.isLoadingMore ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> : null}{community.isLoadingMore ? 'Đang tải…' : 'Xem thêm Community'}</button></div> : null}
        {community.markReadError ? <p className="border-t border-nexoraRule px-4 py-2 text-center text-xs font-semibold text-nexoraDanger">{community.markReadError.message}</p> : null}
      </section> : null}
    </div>
  )
}
