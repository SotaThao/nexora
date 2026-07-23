import { AlertCircle, Bell, BellRing, CheckCheck, Clock3, Loader2, MessageCircle, RefreshCw, ShieldCheck, Sparkles, UserCheck, Users } from 'lucide-react'
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
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
  const notifications = useCommunityNotificationCenter()
  const [isOpen, setIsOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return
    const closeOnOutsidePress = (event: MouseEvent) => {
      if (!panelRef.current?.contains(event.target as Node)) setIsOpen(false)
    }
    document.addEventListener('mousedown', closeOnOutsidePress)
    return () => document.removeEventListener('mousedown', closeOnOutsidePress)
  }, [isOpen])

  const markAsRead = (notification: NotificationDto) => {
    if (!notification.readAt) void notifications.markRead(notification.id)
  }

  return (
    <div ref={panelRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
        aria-label={notifications.unreadCount ? `${notifications.unreadCount} thông báo chưa đọc` : 'Thông báo'}
        className="relative grid h-11 w-11 place-items-center rounded-xl border border-nexoraBorder bg-white text-nexoraMuted transition hover:bg-nexoraBrandSoft hover:text-nexoraBrand"
      >
        <Bell className="h-5 w-5" aria-hidden="true" />
        {notifications.unreadCount ? <span className="absolute -right-1 -top-1 grid min-h-5 min-w-5 place-items-center rounded-full border-2 border-white bg-nexoraBrand px-1 text-[10px] font-extrabold text-white">{notifications.unreadCount > 99 ? '99+' : notifications.unreadCount}</span> : null}
      </button>

      {isOpen ? <section className="absolute right-0 z-[90] mt-2 w-[min(23rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-nexoraBorder bg-nexoraSurface shadow-xl" aria-label="Danh sách thông báo">
        <header className="flex items-center justify-between border-b border-nexoraRule px-4 py-3">
          <div><h2 className="text-sm font-extrabold text-nexoraText">Thông báo</h2><p className="text-[11px] text-nexoraSubtle">{notifications.unreadCount ? `${notifications.unreadCount} chưa đọc` : 'Bạn đã xem hết'}</p></div>
          {notifications.unreadCount ? <button type="button" onClick={() => void notifications.markAllRead()} disabled={notifications.isMarkingAllRead} className="inline-flex min-h-9 items-center gap-1 rounded-lg px-2 text-xs font-extrabold text-nexoraBrand hover:bg-nexoraBrandSoft disabled:opacity-50"><CheckCheck className="h-4 w-4" aria-hidden="true" />Đọc hết</button> : null}
        </header>

        {notifications.isReconnecting ? <p className="flex items-center gap-1.5 border-b border-nexoraRule px-4 py-2 text-[11px] font-semibold text-nexoraMuted"><Loader2 className="h-3.5 w-3.5 animate-spin text-nexoraBrand" aria-hidden="true" />Đang kết nối lại thông báo…</p> : null}
        {notifications.isLoading ? <div className="space-y-2 p-4" aria-label="Đang tải thông báo">{Array.from({ length: 3 }, (_, index) => <div key={index} className="h-16 animate-pulse rounded-xl bg-nexoraSurfaceMuted" />)}</div> : null}
        {!notifications.isLoading && notifications.error ? <div className="p-4 text-center" role="alert"><AlertCircle className="mx-auto h-5 w-5 text-nexoraDanger" aria-hidden="true" /><p className="mt-2 text-xs font-semibold text-nexoraDanger">{notifications.error.message}</p><button type="button" onClick={notifications.retry} className="mt-3 inline-flex min-h-9 items-center gap-1 rounded-lg border border-nexoraBorder px-3 text-xs font-extrabold text-nexoraBrand"><RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />Thử lại</button></div> : null}
        {!notifications.isLoading && !notifications.error && notifications.notifications.length === 0 ? <div className="px-5 py-9 text-center"><Sparkles className="mx-auto h-6 w-6 text-nexoraBrand" aria-hidden="true" /><p className="mt-2 text-sm font-extrabold text-nexoraText">Chưa có thông báo</p><p className="mt-1 text-xs text-nexoraSubtle">Hoạt động mới trong nhóm sẽ hiện ở đây.</p></div> : null}
        {!notifications.isLoading && !notifications.error && notifications.notifications.length ? <div className="max-h-[min(60vh,28rem)] overflow-y-auto p-2">{notifications.notifications.map((notification) => <button key={notification.id} type="button" onClick={() => markAsRead(notification)} disabled={notifications.isMarkingRead} className={`flex w-full items-start gap-3 rounded-xl p-3 text-left transition hover:bg-nexoraSurfaceMuted disabled:opacity-60 ${notification.readAt ? '' : 'bg-nexoraBrandSoft/45'}`}><span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${notification.readAt ? 'bg-nexoraSurfaceMuted text-nexoraMuted' : 'bg-nexoraBrandSoft text-nexoraBrand'}`}><NotificationIcon type={notification.type} /></span><span className="min-w-0 flex-1"><b className="block text-xs leading-relaxed text-nexoraText">{notificationCopy(notification)}</b><span className="mt-1 inline-flex items-center gap-1 text-[11px] text-nexoraSubtle"><Clock3 className="h-3 w-3" aria-hidden="true" />{relativeTime(notification.createdAt)}</span></span>{!notification.readAt ? <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-nexoraBrand" aria-label="Chưa đọc" /> : null}</button>)}</div> : null}
        {notifications.hasMore && !notifications.error ? <div className="border-t border-nexoraRule p-2 text-center"><button type="button" onClick={() => void notifications.loadMore()} disabled={notifications.isLoadingMore} className="inline-flex min-h-9 items-center gap-1 rounded-lg px-3 text-xs font-extrabold text-nexoraBrand hover:bg-nexoraBrandSoft disabled:opacity-50">{notifications.isLoadingMore ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> : null}{notifications.isLoadingMore ? 'Đang tải…' : 'Xem thêm'}</button></div> : null}
        {notifications.markReadError ? <p className="border-t border-nexoraRule px-4 py-2 text-center text-xs font-semibold text-nexoraDanger">{notifications.markReadError.message}</p> : null}
      </section> : null}
    </div>
  )
}
