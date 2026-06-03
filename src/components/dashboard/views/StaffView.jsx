import { useState, useMemo } from 'react'
import { AlertCircle, Plus, HelpCircle, Trash2, User, QrCode, Edit2, Link, Copy, X, Share2, Eye } from 'lucide-react'
import { useTranslation } from '../../../contexts/LanguageContext'
import { useNotification } from '../../../contexts/NotificationContext'
import { MOCK_NEXORA_STAFF_PROFILES } from '../data/mockData'
import IconButton from '../../ui/IconButton'
import CustomSelect from '../../CustomSelect'

function StaffView({
  staff,
  pendingStaff = [],
  allStaff = [],
  onApproveClick,
  onAdd,
  onEdit,
  onDelete,
  onQr,
  onToggle,
  onToggleTipsFlow,
  onViewDetail,
  onLinkStaff,
  onInviteStaff,
  businessName,
  onAcceptJoin,
  onDeclineJoin,
  onAcceptUnlink,
  onDeclineUnlink,
  onOpenInviteShare
}) {
  const { t, currentLanguage } = useTranslation()
  const { showToast } = useNotification()
  const [activeTab, setActiveTab] = useState('link') // 'link' | 'invite'
  const [largeJoinQrOpen, setLargeJoinQrOpen] = useState(false)
  const [sortBy, setSortBy] = useState('name-asc') // 'name-asc' | 'name-desc' | 'date-newest' | 'date-oldest' | 'status-active'

  // Option A (Link) states
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedRole, setSelectedRole] = useState('Nail Technician')
  const [searchResult, setSearchResult] = useState(null)
  const [searchError, setSearchError] = useState('')

    const sortedStaff = useMemo(() => {
    return [...staff].sort((a, b) => {
      if (sortBy === 'name-asc') {
        return a.fullName.localeCompare(b.fullName)
      }
      if (sortBy === 'name-desc') {
        return b.fullName.localeCompare(a.fullName)
      }
      if (sortBy === 'date-newest') {
        const dateA = a.joinedDate || '2026-05-15'
        const dateB = b.joinedDate || '2026-05-15'
        return dateB.localeCompare(dateA)
      }
      if (sortBy === 'date-oldest') {
        const dateA = a.joinedDate || '2026-05-15'
        const dateB = b.joinedDate || '2026-05-15'
        return dateA.localeCompare(dateB)
      }
      if (sortBy === 'status-active') {
        if (a.isActive && !b.isActive) return -1
        if (!a.isActive && b.isActive) return 1
        return 0
      }
      return 0
    })
  }, [staff, sortBy])

  const handleShare = () => {
    const url = `${window.location.origin}${window.location.pathname}?flow=staff-invite&biz=${encodeURIComponent(businessName)}`
    if (navigator.share) {
      navigator.share({
        title: 'Join Nexora Touch',
        text: `Join the team at ${businessName} on Nexora Touch!`,
        url: url
      }).catch(() => {})
    } else {
      navigator.clipboard.writeText(url)
      showToast(currentLanguage === 'vi' ? 'Đã sao chép liên kết để chia sẻ!' : 'Link copied to clipboard for sharing!', 'success')
    }
  }
  const [inviteName, setInviteName] = useState('')
  const [inviteContact, setInviteContact] = useState('')
  const [inviteRole, setInviteRole] = useState('Nail Technician')
  const [inviteMethod, setInviteMethod] = useState('SMS')

  // Calculate Metrics
  const totalLinked = allStaff.filter(s => s.status !== 'Pending Setup' && s.status !== 'Pending Acceptance').length
  const pendingCount = allStaff.filter(s => s.status === 'Pending Setup' || s.status === 'Pending Acceptance').length
  const paymentCompleteCount = allStaff.filter(s => {
    return Object.values(s.paymentAccounts || {}).some(val => val && val.trim() !== '')
  }).length
  const paymentCompletePct = allStaff.length ? Math.round((paymentCompleteCount / allStaff.length) * 100) : 100

  // Option A Search
  const handleSearch = () => {
    setSearchError('')
    setSearchResult(null)
    const query = searchQuery.trim().toLowerCase()
    if (!query) return

    // Search inside simulated global registry
    const match = Object.values(MOCK_NEXORA_STAFF_PROFILES).find(profile => {
      const globalId = Object.keys(MOCK_NEXORA_STAFF_PROFILES).find(key => MOCK_NEXORA_STAFF_PROFILES[key] === profile)
      return (
        globalId?.toLowerCase() === query ||
        profile.fullName.toLowerCase().includes(query) ||
        profile.email.toLowerCase() === query ||
        profile.phone.replace(/[^0-9]/g, '').includes(query.replace(/[^0-9]/g, ''))
      )
    })

    if (match) {
      const matchedId = Object.keys(MOCK_NEXORA_STAFF_PROFILES).find(key => MOCK_NEXORA_STAFF_PROFILES[key] === match)
      setSearchResult({ ...match, id: matchedId })
    } else {
      setSearchError(currentLanguage === 'vi' ? 'Không tìm thấy hồ sơ nhân viên phù hợp.' : 'No staff profile found matching that criteria.')
    }
  }

  // Option A Link Request
  const handleLinkRequest = () => {
    if (!searchResult) return
    onLinkStaff(searchResult, selectedRole)
    setSearchResult(null)
    setSearchQuery('')
  }

  // Option B Submit Invite
  const handleInviteSubmit = (e) => {
    e.preventDefault()
    if (!inviteName.trim() || !inviteContact.trim()) {
      showToast(currentLanguage === 'vi' ? 'Vui lòng điền đầy đủ Tên và phương thức liên hệ.' : 'Please enter both name and contact info.', 'warning')
      return
    }
    onInviteStaff(inviteName, inviteContact, inviteRole, inviteMethod)
    setInviteName('')
    setInviteContact('')
  }

  // Resend invite toast simulator
  const handleResendInvite = (member) => {
    showToast(currentLanguage === 'vi'
      ? `Đã gửi lại link thiết lập thành công tới ${member.fullName}!`
      : `Setup link successfully resent to ${member.fullName}!`,
      'success'
    )
  }

  // Helper to extract wallet labels
  const getWalletBadges = (member) => {
    const list = []
    if (member.paymentAccounts?.zelle) list.push('Zelle')
    if (member.paymentAccounts?.cashapp) list.push('Cash App')
    if (member.paymentAccounts?.venmo) list.push('Venmo')
    if (member.paymentAccounts?.vlinkpay) list.push('VLINKPAY')
    if (member.paymentAccounts?.paypal) list.push('PayPal')
    return list
  }

  return (
    <div className="space-y-6">
      {/* 1 & 2. Statistics & Referral Link Unified Row */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-stretch">
        {/* KPI Card 1: Total Staff Linked */}
        <div className="rounded-xl border border-nexoraBorder bg-white p-5 shadow-sm lg:col-span-1 flex flex-col justify-center">
          <small className="text-[10px] font-black uppercase text-nexoraMuted tracking-wider">
            {t('staff_invite.total_linked') || 'Total Staff Linked'}
          </small>
          <div className="mt-2 flex items-baseline justify-between">
            <h3 className="text-2xl font-black text-nexoraText">{totalLinked}</h3>
          </div>
        </div>

        {/* KPI Card 2: Pending Invites */}
        <div className="rounded-xl border border-nexoraBorder bg-white p-5 shadow-sm lg:col-span-1 flex flex-col justify-center">
          <small className="text-[10px] font-black uppercase text-nexoraMuted tracking-wider">
            {t('staff_invite.pending_invites') || 'Pending Invites'}
          </small>
          <div className="mt-2 flex items-baseline justify-between">
            <h3 className="text-2xl font-black text-nexoraText">{pendingCount}</h3>
          </div>
        </div>

        {/* Salon Join Link & QR Code Card */}
        <div className="rounded-xl border border-nexoraBorder bg-white p-5 shadow-sm flex flex-col md:flex-row items-center justify-between gap-5 lg:col-span-2">
          {/* Left Side: QR Code */}
          <div className="shrink-0 flex items-center justify-center">
            <div
              onClick={() => setLargeJoinQrOpen(true)}
              className="h-20 w-20 rounded-xl bg-slate-50 border border-slate-200 p-1 flex items-center justify-center shadow-inner bg-white cursor-zoom-in transition hover:scale-105 duration-200 group relative"
              title={currentLanguage === 'vi' ? 'Click để phóng to' : 'Click to enlarge'}
            >
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`${window.location.origin}${window.location.pathname}?flow=staff-invite&biz=${encodeURIComponent(businessName)}`)}`}
                alt="Scan to Join"
                className="h-full w-full object-contain"
              />
              {/* Magnifier icon overlay on hover */}
              <div className="absolute inset-0 bg-nexoraBrand/80 rounded-xl flex flex-col items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-white select-none">
                <QrCode className="h-5 w-5" />
                <span className="text-[9px] font-black uppercase tracking-wider">PREVIEW</span>
              </div>
            </div>
          </div>

          {/* Right Side: Text & Referral URL inputs */}
          <div className="space-y-3 flex-grow min-w-0">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
                <Link className="h-4 w-4" />
              </span>
              <div>
                <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider">
                  {currentLanguage === 'vi' ? 'LIÊN KẾT GIA NHẬP CHO THỢ (REFERRAL LINK)' : 'TECHNICIAN JOIN LINK & REFERRAL'}
                </h4>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5 leading-normal">
                  {currentLanguage === 'vi'
                    ? 'Chia sẻ liên kết này hoặc cho thợ quét mã QR để tự đăng ký/liên kết tài khoản vào tiệm.'
                    : 'Share this referral link or let technicians scan the QR code to self-register or link to your salon.'}
                </p>
              </div>
            </div>

            <div className="flex gap-2 max-w-xl flex-wrap">
              <input
                type="text"
                readOnly
                value={`${window.location.origin}${window.location.pathname}?flow=staff-invite&biz=${encodeURIComponent(businessName)}`}
                className="h-9 flex-grow bg-slate-50 border border-slate-200 rounded-lg px-3 text-xs text-slate-500 font-mono focus:outline-none min-w-[200px]"
              />
              <button
                onClick={() => {
                  const url = `${window.location.origin}${window.location.pathname}?flow=staff-invite&biz=${encodeURIComponent(businessName)}`
                  navigator.clipboard.writeText(url)
                  showToast(currentLanguage === 'vi' ? 'Đã sao chép liên kết gia nhập!' : 'Join link copied to clipboard!', 'success')
                }}
                className="h-9 px-3.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shrink-0 shadow-sm bg-white cursor-pointer"
              >
                <Copy className="h-3.5 w-3.5" />
                <span>{currentLanguage === 'vi' ? 'Sao chép' : 'Copy'}</span>
              </button>
              <button
                onClick={() => onOpenInviteShare && onOpenInviteShare()}
                className="h-9 px-3.5 bg-nexoraBrand text-white hover:bg-opacity-95 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shrink-0 shadow-sm cursor-pointer"
              >
                <Share2 className="h-3.5 w-3.5" />
                <span>{currentLanguage === 'vi' ? 'Chia sẻ' : 'Share'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2.5. Pending Join Requests Section */}
      {pendingStaff && pendingStaff.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/40 overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-amber-200 bg-amber-50 flex items-center justify-between">
            <h3 className="text-xs font-black uppercase text-amber-800 tracking-wider flex items-center gap-1.5 animate-pulse">
              <AlertCircle className="h-4 w-4 text-amber-700" />
              {currentLanguage === 'vi' ? 'Yêu cầu gia nhập chờ duyệt' : 'Pending Join Requests'} ({pendingStaff.length})
            </h3>
          </div>
          <div className="overflow-x-auto bg-white">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="bg-slate-50 text-[10px] font-extrabold uppercase text-nexoraMuted border-b border-nexoraRule">
                  <th className="px-5 py-3">{t('setup.col_staff') || 'Staff'}</th>
                  <th className="px-5 py-3">{t('staff_invite.col_flow') || 'Flow'}</th>
                  <th className="px-5 py-3">{t('setup.linked_wallets') || 'Payment Setup'}</th>
                  <th className="px-5 py-3 text-right">{t('dashboard.top_touchpoints.manage') || 'Actions'}</th>
                </tr>
              </thead>
              <tbody>
                {pendingStaff.map((member) => {
                  const wallets = getWalletBadges(member)
                  return (
                    <tr key={member.id} className="border-b border-nexoraRule last:border-0 hover:bg-slate-50/40 transition">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          {member.avatar ? (
                            <img src={member.avatar} alt="" className="h-10 w-10 rounded-full border border-nexoraBorder object-cover" />
                          ) : (
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-sm font-extrabold text-amber-700">
                              {member.nickname?.charAt(0) || member.fullName?.charAt(0) || 'N'}
                            </div>
                          )}
                          <div>
                            <div className="font-extrabold text-nexoraText">{member.fullName}</div>
                            <div className="text-xs text-nexoraMuted">{member.position}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-xs text-slate-500 font-semibold">
                          {member.flowType || (currentLanguage === 'vi' ? 'Khởi tạo trực tiếp' : 'Direct Addition')}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-1.5">
                          {wallets.length > 0 ? (
                            wallets.map((wallet) => (
                              <span key={wallet} className="rounded px-2 py-0.5 text-[10px] font-bold bg-nexoraCanvas text-nexoraBrand border border-nexoraBrand/10">{wallet}</span>
                            ))
                          ) : (
                            <span className="text-[10px] text-slate-400 font-bold italic">{currentLanguage === 'vi' ? 'Chưa cấu hình' : 'Pending'}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => onApproveClick && onApproveClick(member)}
                          className="px-3.5 py-1.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition shadow-sm mr-2"
                        >
                          {currentLanguage === 'vi' ? 'Xem & Duyệt' : 'Review & Approve'}
                        </button>
                        <button
                          onClick={() => onDeclineJoin && onDeclineJoin(member.id)}
                          className="px-3 py-1.5 text-xs font-bold border border-rose-200 bg-rose-50 text-rose-700 rounded-lg hover:bg-rose-100 transition shadow-sm"
                        >
                          {currentLanguage === 'vi' ? 'Từ chối' : 'Decline'}
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. Upgraded Staff Invite & Link Status Table */}
      <div className="rounded-xl border border-nexoraBorder bg-white overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-nexoraRule bg-slate-50/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h3 className="text-xs font-black uppercase text-slate-700 tracking-wider">
            {t('staff_invite.invite_status_table') || 'Staff Invite & Link Status'}
          </h3>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase text-slate-400 whitespace-nowrap">
                {currentLanguage === 'vi' ? 'Sắp xếp:' : 'Sort by:'}
              </span>
              <CustomSelect
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                options={[
                  { value: 'name-asc', label: currentLanguage === 'vi' ? 'Tên (A-Z)' : 'Name (A-Z)' },
                  { value: 'name-desc', label: currentLanguage === 'vi' ? 'Tên (Z-A)' : 'Name (Z-A)' },
                  { value: 'date-newest', label: currentLanguage === 'vi' ? 'Ngày: Mới nhất' : 'Date: Newest' },
                  { value: 'date-oldest', label: currentLanguage === 'vi' ? 'Ngày: Cũ nhất' : 'Date: Oldest' },
                  { value: 'status-active', label: currentLanguage === 'vi' ? 'Trạng thái hoạt động' : 'Status: Active' }
                ]}
                size="sm"
                className="w-44"
                buttonClass="h-8 text-xs font-bold text-slate-700 bg-white border-slate-200 rounded-lg"
              />
            </div>
            <button
              onClick={onAdd}
              className="px-4 py-2 bg-nexoraBrand text-white hover:bg-opacity-95 text-xs font-bold rounded-lg transition shadow-sm flex items-center gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>{t('setup.add_staff_title') || 'Add New Staff'}</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="bg-slate-50 text-[10px] font-extrabold uppercase text-nexoraMuted border-b border-nexoraRule">
                <th className="px-5 py-3">{t('setup.col_staff') || 'Staff'}</th>
                <th className="px-5 py-3">{t('staff_invite.col_flow') || 'Flow'}</th>
                <th className="px-5 py-3">{t('setup.linked_wallets') || 'Payment Setup'}</th>
                <th className="px-5 py-3">
                  <div className="flex items-center gap-1 group relative">
                    <span>{t('dashboard.activity_log.col_status') || 'Status'}</span>
                    <HelpCircle className="h-3 w-3 text-slate-400 cursor-help shrink-0" />
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1.5 hidden group-hover:block w-44 bg-slate-800 text-white text-[9px] font-bold p-2 rounded-lg shadow-lg pointer-events-none text-center normal-case leading-normal z-50">
                      {currentLanguage === 'vi' ? 'Nhấp vào chip để đổi trạng thái hoạt động' : 'Click pill to toggle active status'}
                    </div>
                  </div>
                </th>
                <th className="px-5 py-3">
                  <div className="flex items-center gap-1 group relative">
                    <span>{currentLanguage === 'vi' ? 'Tips Flow' : 'Tips Flow'}</span>
                    <HelpCircle className="h-3 w-3 text-slate-400 cursor-help shrink-0" />
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1.5 hidden group-hover:block w-44 bg-slate-800 text-white text-[9px] font-bold p-2 rounded-lg shadow-lg pointer-events-none text-center normal-case leading-normal z-50 font-sans">
                      {currentLanguage === 'vi' ? 'Nhấp vào chip để ẩn/hiển thị thợ trên QR tiệm' : 'Click pill to show/hide tech on general QR'}
                    </div>
                  </div>
                </th>
                <th className="px-5 py-3 text-right">{t('dashboard.top_touchpoints.manage') || 'Actions'}</th>
              </tr>
            </thead>
            <tbody>
              {sortedStaff.map((member) => {
                const wallets = getWalletBadges(member)
                const isPendingSetup = member.status === 'Pending Setup'
                const isPendingAcceptance = member.status === 'Pending Acceptance'
                const isPendingUnlink = member.status === 'Pending Unlink'
                const isPending = isPendingSetup || isPendingAcceptance || isPendingUnlink

                return (
                  <tr key={member.id} className="border-b border-nexoraRule last:border-0 hover:bg-slate-50/40 transition">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3 cursor-pointer group" onClick={() => onViewDetail(member.id)}>
                        {member.avatar ? (
                          <img src={member.avatar} alt="" className="h-10 w-10 rounded-full border border-nexoraBorder object-cover group-hover:opacity-85 transition" />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-50 text-sm font-extrabold text-indigo-600 group-hover:bg-indigo-100 transition">
                            {member.nickname.charAt(0)}
                          </div>
                        )}
                        <div>
                          <div className="font-extrabold text-nexoraText group-hover:text-nexoraBrand transition">{member.fullName}</div>
                          <div className="text-xs text-nexoraMuted">{member.position}</div>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <div className="text-xs text-slate-500 font-semibold leading-normal">
                        {member.flowType || (currentLanguage === 'vi' ? 'Khởi tạo trực tiếp' : 'Direct Addition')}
                      </div>
                      <div className="text-[10px] text-slate-400 font-bold mt-0.5 leading-normal">
                        {currentLanguage === 'vi' ? 'Ngày liên kết: ' : 'Linked Date: '}
                        {member.joinedDate || '2026-05-15'}
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      {isPendingSetup ? (
                        <span className="text-[10px] text-slate-400 font-bold italic">{currentLanguage === 'vi' ? 'Chưa cấu hình' : 'Pending'}</span>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {wallets.length > 0 ? (
                            wallets.map((wallet) => (
                              <span key={wallet} className="rounded px-2 py-0.5 text-[10px] font-bold bg-nexoraCanvas text-nexoraBrand border border-nexoraBrand/10">{wallet}</span>
                            ))
                          ) : (
                            <span className="text-[10px] text-slate-400 font-bold italic">{currentLanguage === 'vi' ? 'Không có ví' : 'No wallets'}</span>
                          )}
                        </div>
                      )}
                    </td>

                    <td className="px-5 py-4">
                      {isPendingSetup && (
                        <span className="inline-flex rounded-full bg-amber-50 text-amber-700 px-2.5 py-0.5 text-[10px] font-extrabold uppercase border border-amber-100">
                          {currentLanguage === 'vi' ? 'Chờ setup' : 'Pending Setup'}
                        </span>
                      )}
                      {isPendingAcceptance && (
                        <span className="inline-flex rounded-full bg-indigo-50 text-indigo-700 px-2.5 py-0.5 text-[10px] font-extrabold uppercase border border-indigo-100">
                          {currentLanguage === 'vi' ? 'Chờ chấp nhận' : 'Pending Acceptance'}
                        </span>
                      )}
                      {isPendingUnlink && (
                        <span className="inline-flex rounded-full bg-rose-50 text-rose-700 px-2.5 py-0.5 text-[10px] font-extrabold uppercase border border-rose-100">
                          {currentLanguage === 'vi' ? 'Chờ hủy liên kết' : 'Pending Unlink'}
                        </span>
                      )}
                      {!isPending && (
                        <button
                          onClick={() => onToggle(member.id)}
                          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            member.isActive ? 'bg-emerald-500' : 'bg-slate-300'
                          }`}
                          title={member.isActive ? t('common.active') : t('common.inactive')}
                        >
                          <span
                            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                              member.isActive ? 'translate-x-4' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      )}
                    </td>

                    <td className="px-5 py-4">
                      {!isPending && (
                        <button
                          onClick={() => onToggleTipsFlow(member.id)}
                          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            member.showInTipsFlow !== false ? 'bg-blue-500' : 'bg-slate-300'
                          }`}
                          title={member.showInTipsFlow !== false ? 'Show' : 'Hide'}
                        >
                          <span
                            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                              member.showInTipsFlow !== false ? 'translate-x-4' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      )}
                      {isPending && (
                        <span className="text-[10px] text-slate-400 font-bold italic">-</span>
                      )}
                    </td>

                    <td className="px-5 py-4 text-right">
                      {isPendingSetup && (
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleResendInvite(member)}
                            className="px-2.5 py-1 text-[10px] font-extrabold border border-nexoraBorder bg-white text-nexoraText rounded hover:bg-slate-50 transition"
                          >
                            {t('staff_invite.action_resend') || 'Resend Invite'}
                          </button>
                          <IconButton label={t('common.delete')} onClick={() => onDelete(member.id)} className="hover:text-rose-600">
                            <Trash2 className="h-4 w-4" />
                          </IconButton>
                        </div>
                      )}

                      {isPendingAcceptance && (
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => onAcceptJoin && onAcceptJoin(member.id)}
                            className="px-2.5 py-1 text-[10px] font-extrabold border border-emerald-200 bg-emerald-50 text-emerald-700 rounded hover:bg-emerald-100 transition"
                          >
                            {currentLanguage === 'vi' ? 'Chấp nhận' : 'Accept'}
                          </button>
                          <button
                            onClick={() => onDeclineJoin && onDeclineJoin(member.id)}
                            className="px-2.5 py-1 text-[10px] font-extrabold border border-rose-200 bg-rose-50 text-rose-700 rounded hover:bg-rose-100 transition"
                          >
                            {currentLanguage === 'vi' ? 'Từ chối' : 'Decline'}
                          </button>
                        </div>
                      )}

                      {isPendingUnlink && (
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => onAcceptUnlink && onAcceptUnlink(member.id)}
                            className="px-2.5 py-1 text-[10px] font-extrabold border border-rose-200 bg-rose-50 text-rose-700 rounded hover:bg-rose-100 transition cursor-pointer"
                          >
                            {currentLanguage === 'vi' ? 'Duyệt hủy' : 'Approve Unlink'}
                          </button>
                          <button
                            onClick={() => onDeclineUnlink && onDeclineUnlink(member.id)}
                            className="px-2.5 py-1 text-[10px] font-extrabold border border-slate-200 bg-white text-slate-700 rounded hover:bg-slate-50 transition cursor-pointer"
                          >
                            {currentLanguage === 'vi' ? 'Từ chối' : 'Reject'}
                          </button>
                        </div>
                      )}

                      {!isPending && (
                        <div className="flex justify-end gap-1.5">
                          <IconButton label={t('staff_detail.joined_gateway')} onClick={() => onViewDetail(member.id)} className="hover:text-nexoraBrand">
                            <User className="h-4 w-4" />
                          </IconButton>
                          <IconButton label={t('staff_detail.personal_qr')} onClick={() => onQr(member)}>
                            <QrCode className="h-4 w-4" />
                          </IconButton>
                          <IconButton label={t('common.edit')} onClick={() => onEdit(member)}>
                            <Edit2 className="h-4 w-4" />
                          </IconButton>
                          <IconButton label={t('common.delete')} onClick={() => onDelete(member.id)} className="hover:text-rose-600">
                            <Trash2 className="h-4 w-4" />
                          </IconButton>
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Large Join QR Modal */}
      {largeJoinQrOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 cursor-zoom-out"
          onClick={() => setLargeJoinQrOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border border-slate-100 flex flex-col items-center cursor-default animate-scaleUp"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full flex justify-between items-center mb-4">
              <h3 className="text-xs font-black uppercase text-slate-800 tracking-wider">
                {currentLanguage === 'vi' ? 'MÃ QR GIA NHẬP' : 'JOIN QR CODE'}
              </h3>
              <button
                onClick={() => setLargeJoinQrOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="h-64 w-64 rounded-2xl bg-slate-50 border border-slate-200 p-4 flex items-center justify-center shadow-inner bg-white mb-4">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(`${window.location.origin}${window.location.pathname}?flow=staff-invite&biz=${encodeURIComponent(businessName)}`)}`}
                alt="Scan to Join"
                className="h-full w-full object-contain"
              />
            </div>

            <p className="text-[11px] text-slate-500 font-medium text-center leading-relaxed max-w-xs mb-4">
              {currentLanguage === 'vi'
                ? 'Cho thợ quét mã này bằng camera điện thoại để tự đăng ký hoặc liên kết tài khoản vào tiệm.'
                : 'Have technicians scan this QR code with their mobile camera to self-register or link accounts.'}
            </p>

            <div className="w-full bg-slate-50 rounded-xl border border-slate-200 p-2.5 flex items-center justify-between gap-2">
              <span className="text-[10px] text-slate-400 font-mono truncate max-w-[210px]">
                {`${window.location.origin}${window.location.pathname}?flow=staff-invite&biz=${encodeURIComponent(businessName)}`}
              </span>
              <button
                onClick={() => {
                  const url = `${window.location.origin}${window.location.pathname}?flow=staff-invite&biz=${encodeURIComponent(businessName)}`
                  navigator.clipboard.writeText(url)
                  showToast(currentLanguage === 'vi' ? 'Đã sao chép liên kết gia nhập!' : 'Join link copied to clipboard!', 'success')
                }}
                className="h-7 px-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-[10px] font-bold transition flex items-center gap-1 shrink-0"
              >
                <Copy className="h-3 w-3" />
                <span>{currentLanguage === 'vi' ? 'Sao chép' : 'Copy'}</span>
              </button>
            </div>
          </div>
        </div>
      )}


    </div>
  )
}

export default StaffView
