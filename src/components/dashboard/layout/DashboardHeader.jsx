// DashboardHeader — top bar: search w/ suggestions, language switch, notifications, profile menu.
// Extracted from Dashboard.jsx (Group 2 refactor).
import { useEffect, useMemo, useRef, useState } from 'react'
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
  Users,
  Wallet
} from 'lucide-react'
import { useTranslation } from '../../../contexts/LanguageContext'
import { storage } from '../../../utils/storage'
import IconButton from '../../ui/IconButton'

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
  isNotiDropdownOpen,
  setIsNotiDropdownOpen,
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
  const { currentLanguage, setLanguage, t } = useTranslation()
  const dropdownRef = useRef(null)
  const searchRef = useRef(null)
  const headerDropdownRef = useRef(null)
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const [isHeaderDropdownOpen, setIsHeaderDropdownOpen] = useState(false)

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsNotiDropdownOpen(false)
      }
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsSearchFocused(false)
      }
      if (headerDropdownRef.current && !headerDropdownRef.current.contains(event.target)) {
        setIsHeaderDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [setIsNotiDropdownOpen, setIsSearchFocused, setIsHeaderDropdownOpen])

  const unreadCount = notifications ? notifications.filter((n) => !n.read).length : 0

  const handleMarkAllAsRead = () => {
    const updated = notifications.map((n) => ({ ...n, read: true }))
    setNotifications(updated)
    storage.setItem('nexora_notifications', JSON.stringify(updated))
  }

  const handleNotificationClick = (item) => {
    const updated = notifications.map((n) => n.id === item.id ? { ...n, read: true } : n)
    setNotifications(updated)
    storage.setItem('nexora_notifications', JSON.stringify(updated))
    setIsNotiDropdownOpen(false)
    if (item.linkTab === 'staff' && item.staffId) {
      const member = staff.find(s => s.id === item.staffId)
      if (member) {
        onNavigateMenu(item.linkTab)
        if (typeof onApproveStaff === 'function') {
          onApproveStaff(member)
        }
      } else {
        onNavigateMenu(item.linkTab)
      }
    } else if (item.linkTab) {
      onNavigateMenu(item.linkTab)
    }
  }

  // Calculate search suggestions
  const suggestions = useMemo(() => {
    const query = searchQuery.toLowerCase().trim()
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

    const matchedTps = (touchpoints || []).filter(tp =>
      tp.name.toLowerCase().includes(query) ||
      tp.type.toLowerCase().includes(query)
    ).slice(0, 3)

    const totalCount = matchedStaff.length + matchedTxs.length + matchedReviews.length + matchedTps.length

    return {
      staff: matchedStaff,
      transactions: matchedTxs,
      reviews: matchedReviews,
      touchpoints: matchedTps,
      totalCount
    }
  }, [searchQuery, staff, transactions, reviews, touchpoints])

  return (
    <header className="sticky top-0 z-20 flex min-h-16 items-center justify-between gap-3 border-b border-nexoraBorder bg-nexoraSurface px-4 sm:px-5">
      <div className="flex min-w-0 items-center gap-3 lg:hidden">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-nexoraBorder bg-white text-nexoraText shadow-nexora-soft transition hover:bg-nexoraSurfaceMuted"
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <img src="/assets/nexora-logo.png" alt="Nexora Logo" className="h-9 w-9 shrink-0 object-contain" />
      </div>

      {/* Search Input with Suggestions Dropdown */}
      <div className="relative hidden w-full max-w-[385px] sm:block" ref={searchRef}>
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
        />

        {isSearchFocused && searchQuery.trim() !== '' && (
          <div className="absolute left-0 right-0 mt-2 max-h-[380px] overflow-y-auto rounded-xl border border-nexoraBorder bg-white shadow-2xl z-50 py-2 divide-y divide-nexoraBorder animate-fadeIn">

            {/* Staff Group */}
            {suggestions?.staff?.length > 0 && (
              <div className="py-2">
                <div className="px-4 py-1 text-[10px] font-black uppercase tracking-wider text-nexoraSubtle">
                  Staff / Kỹ thuật viên
                </div>
                {suggestions.staff.map(member => (
                  <button
                    key={member.id}
                    type="button"
                    onClick={() => {
                      onViewStaffDetail(member.id)
                      onNavigateMenu('staff')
                      setIsSearchFocused(false)
                      setSearchQuery('')
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-nexoraCanvas flex items-center justify-between text-xs transition"
                  >
                    <div className="flex items-center gap-2">
                      <Users className="h-3.5 w-3.5 text-nexoraBrand shrink-0" />
                      <span className="font-bold text-nexoraText">{member.fullName}</span>
                      <span className="text-[10px] text-nexoraMuted">({member.position})</span>
                    </div>
                    <span className="text-[10px] font-bold text-nexoraBrand uppercase tracking-wider">Xem Chi Tiết ›</span>
                  </button>
                ))}
              </div>
            )}

            {/* Transactions Group */}
            {suggestions?.transactions?.length > 0 && (
              <div className="py-2">
                <div className="px-4 py-1 text-[10px] font-black uppercase tracking-wider text-nexoraSubtle">
                  Transactions / Giao dịch
                </div>
                {suggestions.transactions.map(tx => (
                  <button
                    key={tx.id}
                    type="button"
                    onClick={() => {
                      onNavigateMenu('reports')
                      setIsSearchFocused(false)
                      setSearchQuery('')
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-nexoraCanvas flex items-center justify-between text-xs transition"
                  >
                    <div className="flex items-center gap-2">
                      <ClipboardList className="h-3.5 w-3.5 text-nexoraBrand shrink-0" />
                      <span className="font-bold text-nexoraText">{tx.id}</span>
                      <span className="text-[10px] text-nexoraMuted">({tx.staffName} - ${tx.amount})</span>
                    </div>
                    <span className="text-[10px] font-bold text-nexoraBrand uppercase tracking-wider">Xem GD ›</span>
                  </button>
                ))}
              </div>
            )}

            {/* Reviews Group */}
            {suggestions?.reviews?.length > 0 && (
              <div className="py-2">
                <div className="px-4 py-1 text-[10px] font-black uppercase tracking-wider text-nexoraSubtle">
                  Reviews / Đánh giá
                </div>
                {suggestions.reviews.map(rev => (
                  <button
                    key={rev.id}
                    type="button"
                    onClick={() => {
                      onNavigateMenu('reviews')
                      setIsSearchFocused(false)
                      setSearchQuery('')
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-nexoraCanvas flex items-center justify-between text-xs transition"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500 shrink-0" />
                      <span className="font-bold text-nexoraText">{rev.rating}★</span>
                      <span className="text-[10px] text-nexoraMuted truncate">"{rev.comment}"</span>
                    </div>
                    <span className="text-[10px] font-bold text-nexoraBrand uppercase tracking-wider shrink-0 ml-2">Xem ›</span>
                  </button>
                ))}
              </div>
            )}

            {/* Touchpoints Group */}
            {suggestions?.touchpoints?.length > 0 && (
              <div className="py-2">
                <div className="px-4 py-1 text-[10px] font-black uppercase tracking-wider text-nexoraSubtle">
                  Touchpoints / Điểm chạm
                </div>
                {suggestions.touchpoints.map(tp => (
                  <button
                    key={tp.id}
                    type="button"
                    onClick={() => {
                      onNavigateMenu('touchpoints')
                      setIsSearchFocused(false)
                      setSearchQuery('')
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-nexoraCanvas flex items-center justify-between text-xs transition"
                  >
                    <div className="flex items-center gap-2">
                      <Pointer className="h-3.5 w-3.5 text-nexoraBrand shrink-0" />
                      <span className="font-bold text-nexoraText">{tp.name}</span>
                      <span className="text-[10px] text-nexoraMuted">({tp.type})</span>
                    </div>
                    <span className="text-[10px] font-bold text-nexoraBrand uppercase tracking-wider">Xem ›</span>
                  </button>
                ))}
              </div>
            )}

            {suggestions?.totalCount === 0 && (
              <div className="py-6 text-center text-xs text-nexoraSubtle">
                Không tìm thấy kết quả nào trùng khớp.
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:gap-4">
        {/* Language Switcher */}
        <div className="flex items-center gap-1 bg-nexoraSurfaceMuted border border-nexoraBorder px-2.5 py-1 rounded-lg">
          <button
            type="button"
            onClick={() => setLanguage('vi')}
            className={`text-[10px] font-bold px-1.5 py-0.5 rounded transition ${currentLanguage === 'vi' ? 'bg-nexoraBrand text-white' : 'text-nexoraMuted hover:text-nexoraText'}`}
          >
            VI
          </button>
          <span className="text-nexoraBorder text-[10px]">|</span>
          <button
            type="button"
            onClick={() => setLanguage('en')}
            className={`text-[10px] font-bold px-1.5 py-0.5 rounded transition ${currentLanguage === 'en' ? 'bg-nexoraBrand text-white' : 'text-nexoraMuted hover:text-nexoraText'}`}
          >
            EN
          </button>
        </div>

        {/* Notifications Icon and Dropdown */}
        <div className="relative hidden sm:inline-flex" ref={dropdownRef}>
          <IconButton
            label="Notifications"
            onClick={() => setIsNotiDropdownOpen(!isNotiDropdownOpen)}
            className="relative"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center text-[9px] font-black text-white bg-red-500 ring-2 ring-white shadow-sm">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </IconButton>

          {isNotiDropdownOpen && (
            <div className="absolute right-0 mt-12 w-80 max-h-[460px] flex flex-col rounded-xl border border-nexoraBorder bg-white shadow-2xl z-50 animate-fadeIn overflow-hidden">
              <div className="flex items-center justify-between border-b border-nexoraBorder px-4 py-3 bg-nexoraSurfaceMuted">
                <span className="text-xs font-black uppercase text-nexoraText tracking-wider">
                  {t('dashboard.notifications.title') || 'Thông báo'} ({unreadCount})
                </span>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={handleMarkAllAsRead}
                    className="text-[10px] font-bold text-nexoraBrand hover:underline"
                  >
                    {t('dashboard.notifications.mark_all_read') || 'Đọc tất cả'}
                  </button>
                )}
              </div>
              <div className="flex-grow overflow-y-auto max-h-[380px] divide-y divide-nexoraBorder">
                {notifications && notifications.length > 0 ? (
                  notifications.map((item) => {
                    const IconComponent = {
                      tip_success: Wallet,
                      feedback_alert: AlertTriangle,
                      review_good: Star
                    }[item.type] || Bell

                    const iconColor = {
                      tip_success: 'bg-emerald-500 text-white',
                      feedback_alert: 'bg-amber-500 text-white',
                      review_good: 'bg-luxuryGold text-white'
                    }[item.type] || 'bg-nexoraBrand text-white'

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
                            <span className="text-[10px] text-nexoraSubtle shrink-0 font-medium">{item.time}</span>
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
                    <p className="text-xs font-semibold">{t('dashboard.notifications.empty') || 'Không có thông báo mới.'}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Profile Dropdown */}
        <div className="relative hidden sm:inline-flex" ref={headerDropdownRef}>
          <button
            type="button"
            onClick={() => setIsHeaderDropdownOpen(!isHeaderDropdownOpen)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-nexoraBorder overflow-hidden shadow-nexora-soft transition hover:opacity-90 focus:outline-none"
            aria-label="Profile menu"
            title="Profile menu"
            id="header-profile-menu-btn"
          >
            {profile.avatar ? (
              <img src={profile.avatar} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-nexoraBrand text-sm font-bold text-white">
                {profile.fullName ? profile.fullName.charAt(0) : 'A'}
              </div>
            )}
          </button>

          {isHeaderDropdownOpen && (
            <div
              className="absolute right-0 mt-12 w-64 rounded-xl border border-nexoraBorder bg-white shadow-2xl z-50 py-2 divide-y divide-nexoraRule animate-fadeIn"
              id="header-profile-dropdown"
            >
              <div className="px-4 py-2.5">
                <div className="text-xs font-black text-nexoraText truncate">{profile.fullName || businessName}</div>
                <div className="text-[10px] text-nexoraMuted truncate mt-0.5">{profile.email}</div>
              </div>
              {userRole !== 'staff' && (
                <div className="py-1">
                  <button
                    type="button"
                    onClick={() => {
                      onNavigateSettingsTab('profile')
                      setIsHeaderDropdownOpen(false)
                    }}
                    className="flex w-full items-center px-4 py-2 text-xs font-bold text-nexoraText hover:bg-nexoraSurfaceMuted transition text-left"
                  >
                    {t('dashboard.menu.business_setting') || 'Business Setting'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onNavigateSettingsTab('kyb')
                      setIsHeaderDropdownOpen(false)
                    }}
                    className="flex w-full items-center px-4 py-2 text-xs font-bold text-nexoraText hover:bg-nexoraSurfaceMuted transition text-left"
                  >
                    {t('dashboard.menu.kyb') || 'Business Verification'}
                  </button>
                </div>
              )}
              <div className="py-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsHeaderDropdownOpen(false)
                    onLogout()
                  }}
                  className="flex w-full items-center px-4 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 transition text-left"
                >
                  <LogOut className="h-3.5 w-3.5 mr-2 shrink-0" />
                  {t('dashboard.sidebar.sign_out') || 'Sign out'}
                </button>
              </div>
            </div>
          )}
        </div>
        {userRole !== 'staff' && (
          <button onClick={onAddTouchpoint} className="nexora-primary-button">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">{t('dashboard.header.add_tp')}</span>
          </button>
        )}
      </div>
    </header>
  )
}
