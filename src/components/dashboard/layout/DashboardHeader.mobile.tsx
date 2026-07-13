// DashboardHeader — top bar: search w/ suggestions, language switch, notifications, profile menu.
// Extracted from Dashboard.jsx (Group 2 refactor).
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AlertTriangle,
  Bell,
  ClipboardList,
  LogOut,
  Menu,
  Plus,
  Pointer,
  Search,
  Star,
  UserCheck,
  Users,
  Wallet
} from 'lucide-react'
import { useTranslation } from '../../../contexts/LanguageContext'
import { formatNotificationDateTime } from '../utils'
import IconButton from '../../ui/IconButton'
import LanguageSwitcher from '../../ui/LanguageSwitcher'
import { truncateTransactionId } from '../../ui/CopyableTransactionId'
import HeaderEcosystem from './HeaderEcosystem'

export default function DashboardHeader({
  searchQuery,
  setSearchQuery,
  onAddTouchpoint,
  profile,
  businessName,
  onNavigateSettingsTab,
  onLogout,
  notifications,
  setNotifications,
  onMarkAllNotificationsRead,
  isMarkAllNotificationsReadPending = false,
  unreadCount = 0,
  isNotiDropdownOpen,
  setIsNotiDropdownOpen,
  isNotificationsLoading = false,
  onNavigateMenu,
  staff,
  transactions,
  reviews,
  touchpoints,
  onViewStaffDetail,
  onApproveStaff,
  userRole = 'owner',
  onOpenMobileMenu
}) {
  const { t, currentLanguage } = useTranslation()
  const navigate = useNavigate()
  const dropdownRef = useRef(null)
  const mobileDropdownRef = useRef(null)
  const searchRef = useRef(null)
  const headerDropdownRef = useRef(null)
  const mobileAvatarRef = useRef(null)
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const [isHeaderDropdownOpen, setIsHeaderDropdownOpen] = useState(false)

  useEffect(() => {
    function handleClickOutside(event) {
      const insideNoti = (dropdownRef.current && dropdownRef.current.contains(event.target)) ||
                         (mobileDropdownRef.current && mobileDropdownRef.current.contains(event.target))
      if (!insideNoti) setIsNotiDropdownOpen(false)

      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsSearchFocused(false)
      }

      const insideAvatar = (headerDropdownRef.current && headerDropdownRef.current.contains(event.target)) ||
                           (mobileAvatarRef.current && mobileAvatarRef.current.contains(event.target))
      if (!insideAvatar) setIsHeaderDropdownOpen(false)
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [setIsNotiDropdownOpen, setIsSearchFocused, setIsHeaderDropdownOpen])

  const handleMarkAllAsRead = () => {
    onMarkAllNotificationsRead?.()
  }

  const handleNotificationClick = (item) => {
    const updated = notifications.map((n) => n.id === item.id ? { ...n, read: true } : n)
    setNotifications(updated)
    setIsNotiDropdownOpen(false)
    if (item.linkTab === 'staff' && item.staffId) {
      const sid = item.staffId.trim().toUpperCase()
      const member = staff.find(s =>
        s.id?.trim().toUpperCase() === sid ||
        s.staffProfileId?.trim().toUpperCase() === sid ||
        s.staffLinkId?.trim().toUpperCase() === sid ||
        s.staffCode?.trim().toUpperCase() === sid
      )
      onNavigateMenu(item.linkTab)
      if (member && typeof onApproveStaff === 'function') {
        onApproveStaff(member)
      }
    } else if (item.paymentId) {
      const params = new URLSearchParams({
        tab: 'direct_payments',
        paymentId: String(item.paymentId),
      })
      navigate(`/dashboard/reports?${params.toString()}`)
    } else if (item.linkTab) {
      onNavigateMenu(item.linkTab)
    }
  }

  // Calculate search suggestions
  const suggestions = useMemo(() => {
    const query = searchQuery.toLowerCase().trim()
    const normalize = (value) =>
      String(value ?? '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[\s_-]+/g, '')
    const normalizedQuery = normalize(query)
    if (!query) return null

    const matchedStaff = (staff || []).filter(s =>
      s.fullName.toLowerCase().includes(query) ||
      s.nickname.toLowerCase().includes(query) ||
      s.position.toLowerCase().includes(query)
    ).slice(0, 3)

    const matchedTxs = (transactions || []).filter(tx =>
      tx.id.toLowerCase().includes(query) ||
      tx.staffName.toLowerCase().includes(query) ||
      tx.touchpoint.toLowerCase().includes(query) ||
      String(tx.amount).includes(query)
    ).slice(0, 3)

    const matchedReviews = (reviews || []).filter(r =>
      r.comment.toLowerCase().includes(query) ||
      r.staffName.toLowerCase().includes(query) ||
      String(r.rating).includes(query)
    ).slice(0, 3)

    const matchedTps = (touchpoints || []).filter((tp) => {
      const name = String(tp?.name ?? '')
      const type = String(tp?.type ?? '')
      const deviceId = String(tp?.deviceId ?? '')
      const slug = String(tp?.slug ?? '')
      return (
        name.toLowerCase().includes(query) ||
        type.toLowerCase().includes(query) ||
        deviceId.toLowerCase().includes(query) ||
        slug.toLowerCase().includes(query) ||
        normalize(name).includes(normalizedQuery) ||
        normalize(type).includes(normalizedQuery)
      )
    }).slice(0, 3)

    const totalCount = matchedStaff.length + matchedTxs.length + matchedReviews.length + matchedTps.length

    return {
      staff: matchedStaff,
      transactions: matchedTxs,
      reviews: matchedReviews,
      touchpoints: matchedTps,
      totalCount
    }
  }, [searchQuery, staff, transactions, reviews, touchpoints])

  const notificationPanel = isNotiDropdownOpen && (
    <div className="absolute right-0 top-full mt-2 w-80 max-w-[calc(100vw-32px)] max-h-[460px] flex flex-col rounded-xl border border-nexoraBorder bg-white shadow-2xl z-50 animate-fadeIn overflow-hidden">
      <div className="flex items-center justify-between border-b border-nexoraBorder px-4 py-3 bg-nexoraSurfaceMuted">
        <span className="text-xs font-black uppercase text-nexoraText tracking-wider">
          {t('dashboard.notifications.title')} ({unreadCount})
        </span>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={handleMarkAllAsRead}
            disabled={isMarkAllNotificationsReadPending}
            className="text-[10px] font-bold text-nexoraBrand hover:underline disabled:opacity-50"
          >
            {t('dashboard.notifications.mark_all_read')}
          </button>
        )}
      </div>
      <div className="flex-grow overflow-y-auto max-h-[380px] divide-y divide-nexoraBorder">
        {isNotificationsLoading ? (
          <div className="py-12 text-center text-nexoraSubtle flex flex-col items-center justify-center">
            <Bell className="h-8 w-8 text-nexoraBorder mb-2 animate-pulse" />
            <p className="text-xs font-semibold">{t('common.loading')}</p>
          </div>
        ) : notifications && notifications.length > 0 ? (
          notifications.map((item) => {
            const typeLower = (item.type || '').toLowerCase().replace(/[\s_-]+/g, '')
            const IconComponent = {
              tip_success: Wallet,
              feedback_alert: AlertTriangle,
              review_good: Star,
              staff_accepted_invite: UserCheck,
              staffacceptedinvite: UserCheck,
              stafflinkrequest: UserCheck,
              staff_link_request: UserCheck,
              staff_joined: UserCheck,
              staffjoined: UserCheck,
              staffinviteaccepted: UserCheck,
              staffpublicjoinrequest: UserCheck,
            }[typeLower] || Bell

            const iconColor = {
              tip_success: 'bg-emerald-500 text-white',
              feedback_alert: 'bg-amber-500 text-white',
              review_good: 'bg-luxuryGold text-white',
              staff_accepted_invite: 'bg-nexoraBrand text-white',
              staffacceptedinvite: 'bg-nexoraBrand text-white',
              stafflinkrequest: 'bg-nexoraBrand text-white',
              staff_link_request: 'bg-nexoraBrand text-white',
              staff_joined: 'bg-nexoraBrand text-white',
              staffjoined: 'bg-nexoraBrand text-white',
              staffinviteaccepted: 'bg-nexoraBrand text-white',
              staffpublicjoinrequest: 'bg-nexoraBrand text-white',
            }[typeLower] || 'bg-nexoraBrand text-white'

            const isUnread = !item.read
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNotificationClick(item)}
                className={`w-full text-left p-3.5 hover:bg-nexoraCanvas transition-colors flex gap-3 items-start border-b border-nexoraBorder/50 last:border-0 relative ${
                  isUnread ? 'bg-nexoraBrandSoft/40' : 'bg-white'
                }`}
              >
                <span className={`flex h-8 w-8 items-center justify-center rounded-lg shrink-0 ${iconColor} ${
                  !isUnread ? 'opacity-60' : ''
                }`}>
                  <IconComponent className="h-4 w-4" />
                </span>
                <div className="flex-grow min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-xs truncate ${
                      isUnread ? 'font-extrabold text-nexoraText' : 'font-bold text-nexoraMuted'
                    }`}>
                      {item.title}
                    </span>
                    <span className="text-[10px] text-nexoraSubtle shrink-0 font-medium">
                      {formatNotificationDateTime(item.createdAt || item.time, currentLanguage)}
                    </span>
                  </div>
                  <p className={`text-[11px] leading-normal mt-1 break-words ${
                    isUnread ? 'font-semibold text-nexoraText' : 'font-medium text-nexoraMuted'
                  }`}>
                    {item.message}
                  </p>
                </div>
              </button>
            )
          })
        ) : (
          <div className="py-12 text-center text-nexoraSubtle flex flex-col items-center justify-center">
            <Bell className="h-8 w-8 text-nexoraBorder mb-2" />
            <p className="text-xs font-semibold">{t('dashboard.notifications.empty')}</p>
          </div>
        )}
      </div>
    </div>
  )

  const avatarInner = (
    <>
      {profile.avatar && !profile.avatar.includes('unsplash.com') ? (
        <img src={profile.avatar} alt="" className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-nexoraElectric to-nexoraViolet text-sm font-bold text-white uppercase">
          {(businessName || profile.email || '').slice(0, 2).toUpperCase() || '?'}
        </div>
      )}
    </>
  )

  const avatarDropdown = isHeaderDropdownOpen && (
    <div
      className="absolute right-0 top-full mt-2 w-64 rounded-xl border border-nexoraBorder bg-white shadow-2xl z-50 py-2 divide-y divide-nexoraRule animate-fadeIn"
      id="header-profile-dropdown"
    >
      <div className="px-4 py-2.5">
        <div className="text-xs font-black text-nexoraText truncate">{profile.fullName || profile.email || businessName}</div>
        <div className="text-[10px] text-nexoraMuted truncate mt-0.5">{profile.email}</div>
      </div>
      {userRole !== 'staff' && (
        <div className="py-1">
          <button
            type="button"
            onClick={() => { onNavigateSettingsTab('profile'); setIsHeaderDropdownOpen(false) }}
            className="flex w-full items-center px-4 py-2 text-xs font-bold text-nexoraText hover:bg-nexoraSurfaceMuted transition text-left"
          >
            {t('dashboard.menu.business_setting')}
          </button>
        </div>
      )}
      <div className="py-1">
        <button
          type="button"
          onClick={() => { setIsHeaderDropdownOpen(false); onLogout() }}
          className="flex w-full items-center px-4 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 transition text-left"
        >
          <LogOut className="h-3.5 w-3.5 mr-2 shrink-0" />
          {t('dashboard.sidebar.sign_out')}
        </button>
      </div>
    </div>
  )

  return (
    <header className="safe-area-top sticky top-0 z-20 border-b border-nexoraBorder bg-nexoraSurface/90 backdrop-blur-md">

      {/* ── Mobile header ──────────────────────────────────────────────────── */}
      <div className="flex min-h-16 items-center justify-between px-4 lg:hidden">
        {/* Left: hamburger + logo */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenMobileMenu}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-nexoraBorder bg-white text-nexoraText shadow-nexora-soft transition hover:bg-nexoraSurfaceMuted"
            aria-label="Open navigation menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <img src="/assets/nexora-logo.png" alt="Nexora Logo" className="h-9 w-9 shrink-0 object-contain" />
        </div>

        {/* Right: lang + bell + avatar */}
        <div className="flex items-center gap-2">
          <LanguageSwitcher />

          <HeaderEcosystem />

          <div className="relative" ref={mobileDropdownRef}>
            <button
              type="button"
              onClick={() => setIsNotiDropdownOpen(!isNotiDropdownOpen)}
              className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-nexoraBorder bg-white text-nexoraText shadow-nexora-soft transition hover:bg-nexoraSurfaceMuted"
              aria-label="Notifications"
            >
              <img
                src="/assets/menu/notification.png"
                alt=""
                className="h-5 w-5 object-contain"
                aria-hidden="true"
              />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-0.5 rounded-full flex items-center justify-center text-[9px] font-black text-white bg-red-500 ring-2 ring-white">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>
            {notificationPanel}
          </div>

          <div className="relative" ref={mobileAvatarRef}>
            <button
              type="button"
              onClick={() => setIsHeaderDropdownOpen(!isHeaderDropdownOpen)}
              className="relative flex h-10 w-10 items-center justify-center rounded-full border border-nexoraBorder overflow-hidden shadow-nexora-soft transition hover:opacity-90 focus:outline-none"
              aria-label="Account menu"
            >
              {avatarInner}
            </button>
            <span className="absolute bottom-0 right-0 z-10 h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-white pointer-events-none" />
            {avatarDropdown}
          </div>
        </div>
      </div>

      {/* ── Desktop header ─────────────────────────────────────────────────── */}
      <div className="hidden lg:flex min-h-16 items-center justify-between gap-3 px-5">
        {/* Search Input with Suggestions Dropdown */}
        <div className="relative w-full max-w-[385px]" ref={searchRef}>
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-nexoraMuted" />
          <input
            className="nexora-search-input"
            placeholder={t('dashboard.header.search_placeholder')}
            value={searchQuery}
            onChange={(event) => {
              setSearchQuery(event.target.value)
              setIsSearchFocused(true)
            }}
            onFocus={() => setIsSearchFocused(true)}
            onKeyDown={(event) => {
              if (event.key !== 'Enter') return
              if (suggestions?.touchpoints?.length > 0) {
                onNavigateMenu('touchpoints')
                setIsSearchFocused(false)
              }
            }}
          />

          {isSearchFocused && searchQuery.trim() !== '' && (
            <div className="absolute left-0 right-0 mt-2 max-h-[380px] overflow-y-auto rounded-xl border border-nexoraBorder bg-white shadow-2xl z-50 py-2 divide-y divide-nexoraBorder animate-fadeIn">
              {suggestions?.staff?.length > 0 && (
                <div className="py-2">
                  <div className="px-4 py-1 text-[10px] font-black uppercase tracking-wider text-nexoraSubtle">{t('dashboard.header.search_group_staff')}</div>
                  {suggestions.staff.map(member => (
                    <button key={member.id} type="button"
                      onClick={() => { onViewStaffDetail(member.id); onNavigateMenu('staff'); setIsSearchFocused(false); setSearchQuery('') }}
                      className="w-full text-left px-4 py-2 hover:bg-nexoraCanvas flex items-center justify-between text-xs transition"
                    >
                      <div className="flex items-center gap-2">
                        <Users className="h-3.5 w-3.5 text-nexoraBrand shrink-0" />
                        <span className="font-bold text-nexoraText">{member.fullName}</span>
                        <span className="text-[10px] text-nexoraMuted">({member.position})</span>
                      </div>
                      <span className="text-[10px] font-bold text-nexoraBrand uppercase tracking-wider">{t('dashboard.header.search_view_detail')}</span>
                    </button>
                  ))}
                </div>
              )}
              {suggestions?.transactions?.length > 0 && (
                <div className="py-2">
                  <div className="px-4 py-1 text-[10px] font-black uppercase tracking-wider text-nexoraSubtle">{t('dashboard.header.search_group_transactions')}</div>
                  {suggestions.transactions.map(tx => (
                    <button key={tx.id} type="button"
                      onClick={() => { onNavigateMenu('reports'); setIsSearchFocused(false); setSearchQuery('') }}
                      className="w-full text-left px-4 py-2 hover:bg-nexoraCanvas flex items-center justify-between text-xs transition"
                    >
                      <div className="flex items-center gap-2">
                        <ClipboardList className="h-3.5 w-3.5 text-nexoraBrand shrink-0" />
                        <span className="font-bold text-nexoraText font-mono" title={tx.id}>
                          {truncateTransactionId(tx.id)}
                        </span>
                        <span className="text-[10px] text-nexoraMuted">({tx.staffName} - ${tx.amount})</span>
                      </div>
                      <span className="text-[10px] font-bold text-nexoraBrand uppercase tracking-wider">{t('dashboard.header.search_view_transaction')}</span>
                    </button>
                  ))}
                </div>
              )}
              {suggestions?.reviews?.length > 0 && (
                <div className="py-2">
                  <div className="px-4 py-1 text-[10px] font-black uppercase tracking-wider text-nexoraSubtle">{t('dashboard.header.search_group_reviews')}</div>
                  {suggestions.reviews.map(rev => (
                    <button key={rev.id} type="button"
                      onClick={() => { onNavigateMenu('reviews'); setIsSearchFocused(false); setSearchQuery('') }}
                      className="w-full text-left px-4 py-2 hover:bg-nexoraCanvas flex items-center justify-between text-xs transition"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500 shrink-0" />
                        <span className="font-bold text-nexoraText">{rev.rating}★</span>
                        <span className="text-[10px] text-nexoraMuted truncate">"{rev.comment}"</span>
                      </div>
                      <span className="text-[10px] font-bold text-nexoraBrand uppercase tracking-wider shrink-0 ml-2">{t('dashboard.header.search_view')}</span>
                    </button>
                  ))}
                </div>
              )}
              {suggestions?.touchpoints?.length > 0 && (
                <div className="py-2">
                  <div className="px-4 py-1 text-[10px] font-black uppercase tracking-wider text-nexoraSubtle">{t('dashboard.header.search_group_touchpoints')}</div>
                  {suggestions.touchpoints.map(tp => (
                    <button key={tp.id} type="button"
                      onClick={() => { onNavigateMenu('touchpoints'); setIsSearchFocused(false); setSearchQuery('') }}
                      className="w-full text-left px-4 py-2 hover:bg-nexoraCanvas flex items-center justify-between text-xs transition"
                    >
                      <div className="flex items-center gap-2">
                        <Pointer className="h-3.5 w-3.5 text-nexoraBrand shrink-0" />
                        <span className="font-bold text-nexoraText">{tp.name}</span>
                        <span className="text-[10px] text-nexoraMuted">({tp.type})</span>
                      </div>
                      <span className="text-[10px] font-bold text-nexoraBrand uppercase tracking-wider">{t('dashboard.header.search_view')}</span>
                    </button>
                  ))}
                </div>
              )}
              {suggestions?.totalCount === 0 && (
                <div className="py-6 text-center text-xs text-nexoraSubtle">
                  {t('dashboard.header.search_no_results')}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-4">
          <LanguageSwitcher />

          <HeaderEcosystem />

          {/* Notifications */}
          <div className="relative" ref={dropdownRef}>
            <IconButton
              label="Notifications"
              onClick={() => setIsNotiDropdownOpen(!isNotiDropdownOpen)}
              className="relative"
            >
              <img
                src="/assets/menu/notification.png"
                alt=""
                className="h-5 w-5 object-contain"
                aria-hidden="true"
              />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center text-[9px] font-black text-white bg-red-500 ring-2 ring-white shadow-sm">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </IconButton>
            {notificationPanel}
          </div>

          {/* Profile */}
          <div className="relative" ref={headerDropdownRef}>
            <button
              type="button"
              onClick={() => setIsHeaderDropdownOpen(!isHeaderDropdownOpen)}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-nexoraBorder overflow-hidden shadow-nexora-soft transition hover:opacity-90 focus:outline-none"
              aria-label="Account menu"
              title="Account menu"
              id="header-profile-menu-btn"
            >
              {avatarInner}
            </button>
            {avatarDropdown}
          </div>

          {userRole !== 'staff' && (
            <button onClick={onAddTouchpoint} className="nexora-primary-button">
              <Plus className="h-4 w-4" />
              <span>{t('dashboard.header.add_tp')}</span>
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
