import { useState, useMemo } from 'react'
import { AlertCircle, Plus, Trash2, User, QrCode, Eye, Link, Copy, X, Share2, Loader2 } from 'lucide-react'
import { useTranslation } from '../../../contexts/LanguageContext'
import { useNotification } from '../../../contexts/NotificationContext'
import { StatusFilter } from '../../../data/hooks/useMerchantStaff'
import { buildPublicInviteLink } from '../../../utils/inviteRef'
import { getWebUrlOrigin } from '../../../utils/webUrlBase'
import { buildPublicQrImageUrl } from '../../../data/repositories/publicQr'
import { PAYOUT_UI_DISPLAY_ORDER, PAYOUT_UI_LABELS } from '../../../data/paymentMethodTypes'
import IconButton from '../../ui/IconButton'
import CustomSelect from '../../CustomSelect'
import Pagination from '../../ui/Pagination'
import ToggleSwitch from '../../ui/ToggleSwitch'

function isPendingMember(member) {
  const status = member?.status
  return (
    status === StatusFilter.Pending ||
    status === 'Pending' ||
    status === 'Pending Setup' ||
    status === 'Pending Acceptance' ||
    status === 'WaitingStaffAcceptance'
  )
}

function isPendingInviteMember(member) {
  return member?.itemType === 'invite' && isPendingMember(member)
}

function isPendingLinkMember(member) {
  return (
    member?.itemType === 'link' &&
    (member?.status === 'Pending Acceptance' || member?.status === 'WaitingStaffAcceptance')
  )
}

function isWaitingStaffAcceptance(member) {
  return member?.apiStatus === 'WaitingStaffAcceptance' || member?.status === 'WaitingStaffAcceptance'
}

function isRejectedStaff(member) {
  return member?.status === 'StaffRejected' || member?.apiStatus === 'StaffRejected'
}

const PAYMENT_ACCOUNT_LABELS = {
  ...PAYOUT_UI_LABELS,
  vlinkpay: 'VLINKPAY',
}

function StaffMemberCard({
  member,
  wallets,
  isPendingInvite,
  isPendingLink,
  isPendingUnlink,
  isPending,
  t,
  onViewDetail,
  onToggle,
  onToggleTipsFlow,
  isToggling = false,
  onResendInvite,
  onDelete,
  onApproveClick,
  onAcceptJoin,
  onDeclineJoin,
  onAcceptUnlink,
  onDeclineUnlink,
  onQr,
  onViewStaff
}) {
  const waitingStaffResponse = isWaitingStaffAcceptance(member)
  const stripClass = isPendingInvite
    ? 'bg-amber-400'
    : isPendingLink
      ? 'bg-indigo-400'
      : isPendingUnlink
        ? 'bg-rose-400'
        : member.isActive
          ? 'bg-gradient-to-r from-nexoraBrand to-nexoraElectricMid'
          : 'bg-slate-300'

  return (
    <div className="relative flex flex-col rounded-xl border border-nexoraBorder bg-white shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
      <div className={`absolute top-0 left-0 right-0 h-1 ${stripClass}`} />

      <div className="p-4 flex flex-col gap-3">
        <div className="flex items-start gap-3 pt-1">
          <button
            type="button"
            onClick={() => onViewDetail(member)}
            className="flex items-center gap-3 flex-1 min-w-0 text-left group"
          >
            {member.avatar ? (
              <img
                src={member.avatar}
                alt=""
                className="h-11 w-11 rounded-full border border-nexoraBorder object-cover group-hover:opacity-85 transition shrink-0"
              />
            ) : (
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-sm font-extrabold text-indigo-600 group-hover:bg-indigo-100 transition">
                {member.nickname?.charAt(0) || member.fullName?.charAt(0) || '?'}
              </div>
            )}
            <div className="min-w-0">
              <p className="font-extrabold text-nexoraText truncate group-hover:text-nexoraBrand transition">
                {member.fullName}
              </p>
              <p className="text-xs text-nexoraMuted truncate">{member.position}</p>
            </div>
          </button>
          {isPendingInvite && (
            <span className="shrink-0 inline-flex rounded-full bg-amber-50 text-amber-700 px-2 py-0.5 text-[9px] font-extrabold uppercase border border-amber-100">
              {t('components.dashboard.views.StaffView.pendingSetup')}
            </span>
          )}
          {isPendingLink && (
            <span className="shrink-0 inline-flex rounded-full bg-indigo-50 text-indigo-700 px-2 py-0.5 text-[9px] font-extrabold uppercase border border-indigo-100">
              {t('components.dashboard.views.StaffView.pendingAcceptance')}
            </span>
          )}
          {isPendingUnlink && (
            <span className="shrink-0 inline-flex rounded-full bg-rose-50 text-rose-700 px-2 py-0.5 text-[9px] font-extrabold uppercase border border-rose-100">
              {t('components.dashboard.views.StaffView.pendingUnlink')}
            </span>
          )}
        </div>

        <div className="rounded-lg bg-slate-50/80 border border-nexoraRule px-3 py-2">
          <p className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wide">
            {t('staff_invite.col_flow')}
          </p>
          <p className="text-xs text-slate-600 font-semibold mt-0.5">
            {member.flowType || t('components.dashboard.views.StaffView.directAddition')}
          </p>
          <p className="text-[10px] text-slate-400 font-bold mt-1">
            {t('components.dashboard.views.StaffView.linkedDate')}
            {member.joinedDate || '2026-05-15'}
          </p>
        </div>

        <div>
          <p className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wide mb-1.5">
            {t('setup.linked_wallets')}
          </p>
          {isPendingInvite ? (
            <span className="text-[10px] text-slate-400 font-bold italic">
              {t('components.dashboard.views.StaffView.pending')}
            </span>
          ) : wallets.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {wallets.map((wallet) => (
                <span
                  key={wallet}
                  className="rounded px-2 py-0.5 text-[10px] font-bold bg-nexoraCanvas text-nexoraBrand border border-nexoraBrand/10"
                >
                  {wallet}
                </span>
              ))}
            </div>
          ) : (
            <span className="text-[10px] text-slate-400 font-bold italic">
              {t('components.dashboard.views.StaffView.noWallets')}
            </span>
          )}
        </div>

        {!isPending && (
          <div className="flex items-center justify-between gap-3 pt-1 border-t border-nexoraRule">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase text-slate-400">
                {t('dashboard.activity_log.col_status')}
              </span>
              <ToggleSwitch
                checked={member.isActive}
                onChange={() => onToggle(member.id)}
                disabled={isToggling}
                title={member.isActive ? t('common.active') : t('common.inactive')}
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase text-slate-400">
                {t('components.dashboard.views.StaffView.tipsFlow')}
              </span>
              <ToggleSwitch
                checked={member.showInTipsFlow !== false}
                onChange={() => onToggleTipsFlow(member.id)}
                disabled={isToggling}
                activeColor="bg-blue-500"
                title={member.showInTipsFlow !== false ? 'Show' : 'Hide'}
              />
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-end gap-1.5 pt-1 border-t border-nexoraRule">
          {isPendingInvite && (
            <>
              <button
                type="button"
                onClick={() => {
                  if (onApproveClick) {
                    onApproveClick(member)
                  } else if (onAcceptJoin) {
                    onAcceptJoin(member)
                  }
                }}
                className="px-2.5 py-1.5 text-[10px] font-extrabold border border-emerald-200 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition"
              >
                {t('components.dashboard.views.StaffView.approve')}
              </button>
              <button
                type="button"
                onClick={() => onDeclineJoin && onDeclineJoin(member)}
                className="px-2.5 py-1.5 text-[10px] font-extrabold border border-rose-200 bg-rose-50 text-rose-700 rounded-lg hover:bg-rose-100 transition"
              >
                {t('components.dashboard.views.StaffView.reject')}
              </button>
              <button
                type="button"
                onClick={() => onResendInvite(member)}
                className="px-2.5 py-1.5 text-[10px] font-extrabold border border-nexoraBorder bg-white text-nexoraText rounded-lg hover:bg-slate-50 transition"
              >
                {t('staff_invite.action_resend')}
              </button>
            </>
          )}
          {isPendingLink && !waitingStaffResponse && (
            <>
              <button
                type="button"
                onClick={() => {
                  if (onApproveClick) {
                    onApproveClick(member)
                  } else if (onAcceptJoin) {
                    onAcceptJoin(member)
                  }
                }}
                className="px-2.5 py-1.5 text-[10px] font-extrabold border border-emerald-200 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition"
              >
                {t('components.dashboard.views.StaffView.approve')}
              </button>
              <button
                type="button"
                onClick={() => onDeclineJoin && onDeclineJoin(member)}
                className="px-2.5 py-1.5 text-[10px] font-extrabold border border-rose-200 bg-rose-50 text-rose-700 rounded-lg hover:bg-rose-100 transition"
              >
                {t('components.dashboard.views.StaffView.reject')}
              </button>
            </>
          )}
          {isPendingLink && waitingStaffResponse && (
            <span className="text-[10px] font-bold text-slate-500 italic">
              {t('components.dashboard.views.StaffView.pendingAcceptance')}
            </span>
          )}
          {isPendingUnlink && (
            <>
              <button
                type="button"
                onClick={() => onAcceptUnlink && onAcceptUnlink(member)}
                className="px-2.5 py-1.5 text-[10px] font-extrabold border border-rose-200 bg-rose-50 text-rose-700 rounded-lg hover:bg-rose-100 transition"
              >
                {t('components.dashboard.views.StaffView.approveUnlink')}
              </button>
              <button
                type="button"
                onClick={() => onDeclineUnlink && onDeclineUnlink(member)}
                className="px-2.5 py-1.5 text-[10px] font-extrabold border border-slate-200 bg-white text-slate-700 rounded-lg hover:bg-slate-50 transition"
              >
                {t('components.dashboard.views.StaffView.reject')}
              </button>
            </>
          )}
          {!isPending && (
            <>
              <IconButton label={t('staff_detail.joined_gateway')} onClick={() => onViewDetail(member)} className="hover:text-nexoraBrand">
                <User className="h-4 w-4" />
              </IconButton>
              <IconButton label={t('staff_detail.personal_qr')} onClick={() => onQr(member)}>
                <QrCode className="h-4 w-4" />
              </IconButton>
              <IconButton label={t('common.view_detail')} onClick={() => onViewStaff(member)}>
                <Eye className="h-4 w-4" />
              </IconButton>
              <IconButton label={t('common.delete')} onClick={() => onDelete(member.id)} className="hover:text-rose-600">
                <Trash2 className="h-4 w-4" />
              </IconButton>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function StaffView({
  staff,
  pendingStaff = [],
  allStaff = [],
  isLoading = false,
  isFetching = false,
  onApproveClick,
  onAdd,
  onViewStaff,
  onDelete,
  onQr,
  onToggle,
  onToggleTipsFlow,
  onViewDetail,
  onResendInvite,
  businessName,
  businessSlug,
  inviteLinkSetting,
  isInviteLinkSettingLoading = false,
  onAcceptJoin,
  onDeclineJoin,
  onAcceptUnlink,
  onDeclineUnlink,
  onOpenInviteShare,
  // Pagination props
  pageNumber = 1,
  totalPages = 1,
  totalCount = 0,
  hasNextPage = false,
  hasPreviousPage = false,
  onPageChange,
  pageSize = 10,
  togglingStaffId = null,
}) {
  const { t } = useTranslation()
  const { showToast } = useNotification()
  const [largeJoinQrOpen, setLargeJoinQrOpen] = useState(false)
  const [sortBy, setSortBy] = useState('name-asc') // 'name-asc' | 'name-desc' | 'date-newest' | 'date-oldest' | 'status-active'

  const publicInviteEnabled = Boolean(inviteLinkSetting?.isEnabled && inviteLinkSetting?.referralCode)
  const publicInviteLink = useMemo(
    () => publicInviteEnabled
      ? buildPublicInviteLink({
        origin: getWebUrlOrigin(),
        businessName,
        businessSlug,
        referralCode: inviteLinkSetting?.referralCode ?? '',
      })
      : '',
    [businessName, businessSlug, inviteLinkSetting?.referralCode, publicInviteEnabled],
  )
  const publicInviteQrSrc = useMemo(
    () => (publicInviteEnabled && publicInviteLink ? buildPublicQrImageUrl(publicInviteLink, 150) : ''),
    [publicInviteEnabled, publicInviteLink],
  )
  const publicInviteQrLargeSrc = useMemo(
    () => (publicInviteEnabled && publicInviteLink ? buildPublicQrImageUrl(publicInviteLink, 300) : ''),
    [publicInviteEnabled, publicInviteLink],
  )
  const publicInviteUnavailableText = isInviteLinkSettingLoading
    ? t('components.dashboard.views.StaffView.inviteLinkLoading')
    : t('components.dashboard.views.StaffView.inviteLinkDisabled')

  const rejectedStaff = useMemo(
    () => (staff || []).filter((member) => isRejectedStaff(member)),
    [staff],
  )

  const sortedStaff = useMemo(() => {
    return [...(staff ?? []).filter((member) => !isRejectedStaff(member))].sort((a, b) => {
      if (sortBy === 'name-asc') {
        return a.fullName.localeCompare(b.fullName)
      }
      if (sortBy === 'name-desc') {
        return b.fullName.localeCompare(a.fullName)
      }
      if (sortBy === 'date-newest') {
        const dateA = a.joinedDate || ''
        const dateB = b.joinedDate || ''
        return dateB.localeCompare(dateA)
      }
      if (sortBy === 'date-oldest') {
        const dateA = a.joinedDate || ''
        const dateB = b.joinedDate || ''
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
    if (!publicInviteEnabled) {
      showToast(publicInviteUnavailableText, 'warning')
      return
    }
    if (navigator.share) {
      navigator.share({
        title: t('components.dashboard.views.StaffView.shareTitle'),
        text: t('components.dashboard.views.StaffView.shareText', { businessName }),
        url: publicInviteLink
      }).catch(() => {})
    } else {
      navigator.clipboard.writeText(publicInviteLink)
      showToast(t('components.dashboard.views.StaffView.linkCopiedToClipboard'), 'success')
    }
  }
  // Calculate Metrics
  const totalLinked = staff ? staff.length : 0
  const pendingCount = pendingStaff ? pendingStaff.length : 0
  const activeStaffCount = sortedStaff.filter((member) => member.isActive).length

  // Resend invite - calls API via mutation prop
  const handleResendInvite = (member) => {
    if (onResendInvite) {
      onResendInvite(member)
    }
  }

  const sortOptions = [
    { value: 'name-asc', label: t('components.dashboard.views.StaffView.nameAZ') },
    { value: 'name-desc', label: t('components.dashboard.views.StaffView.nameZA') },
    { value: 'date-newest', label: t('components.dashboard.views.StaffView.dateNewest') },
    { value: 'date-oldest', label: t('components.dashboard.views.StaffView.dateOldest') },
    { value: 'status-active', label: t('components.dashboard.views.StaffView.statusActive') }
  ]

  // Helper to extract wallet labels
  const getWalletBadges = (member) => {
    const accounts = member?.paymentAccounts || {}
    return Object.entries(accounts)
      .filter(([, value]) => Boolean(value))
      .map(([key]) => key.toLowerCase())
      .sort((a, b) => {
        const ai = PAYOUT_UI_DISPLAY_ORDER.indexOf(a)
        const bi = PAYOUT_UI_DISPLAY_ORDER.indexOf(b)
        return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi)
      })
      .map((key) => PAYMENT_ACCOUNT_LABELS[key] || key)
  }

  return (
    <div className="space-y-6">
      {/* 1 & 2. Statistics & Referral Link Unified Row */}
      <div className="grid grid-cols-2 gap-3">
        {/* KPI Card 1: Total Staff Linked */}
        <div className="rounded-2xl bg-white border border-nexoraBorder p-5 shadow-sm flex flex-col items-center text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 mb-3">
            <User className="h-5 w-5 text-emerald-500" />
          </span>
          <small className="text-[10px] font-black uppercase text-nexoraMuted tracking-wider">
            {t('staff_invite.total_linked')}
          </small>
          <h3 className="mt-1 text-2xl font-black text-nexoraText">{totalLinked}</h3>
          <p className="text-[11px] text-nexoraSubtle mt-1">{t('staff_invite.connected_label')}</p>
        </div>

        {/* KPI Card 2: Pending Invites */}
        <div className="rounded-2xl bg-white border border-nexoraBorder p-5 shadow-sm flex flex-col items-center text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 mb-3">
            <AlertCircle className="h-5 w-5 text-amber-500" />
          </span>
          <small className="text-[10px] font-black uppercase text-nexoraMuted tracking-wider">
            {t('staff_invite.pending_invites')}
          </small>
          <h3 className="mt-1 text-2xl font-black text-nexoraText">{pendingCount}</h3>
          <p className="text-[11px] text-nexoraSubtle mt-1">{t('staff_invite.awaiting_label')}</p>
        </div>
      </div>

      {/* Salon Join Link & QR Code Card */}
      <div className="rounded-2xl border border-nexoraBorder bg-white p-5 shadow-sm flex flex-col md:flex-row items-center justify-between gap-5">
        {/* Left Side: QR Code */}
        <div className="shrink-0 flex items-center justify-center">
          <div
            onClick={() => publicInviteEnabled && setLargeJoinQrOpen(true)}
            className={`h-20 w-20 rounded-xl bg-slate-50 border border-slate-200 p-1 flex items-center justify-center shadow-inner bg-white transition duration-200 group relative ${publicInviteEnabled ? 'cursor-zoom-in hover:scale-105' : 'cursor-not-allowed opacity-60'}`}
            title={t('components.dashboard.views.StaffView.clickToEnlarge')}
          >
            {publicInviteEnabled ? (
              <img
                src={publicInviteQrSrc}
                alt={t('components.dashboard.views.StaffView.scanToJoinAlt')}
                className="h-full w-full object-contain"
              />
            ) : (
              <QrCode className="h-8 w-8 text-slate-300" />
            )}
            <div className="absolute inset-0 bg-nexoraBrand/80 rounded-xl flex flex-col items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-white select-none">
              <QrCode className="h-5 w-5" />
              <span className="text-[9px] font-black uppercase tracking-wider">{t('components.dashboard.views.StaffView.preview')}</span>
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
                {t('components.dashboard.views.StaffView.technicianJoinLinkAnd')}
              </h4>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5 leading-normal">
                {t('components.dashboard.views.StaffView.shareThisReferralLink')}
              </p>
            </div>
          </div>

          <div className="w-full max-w-xl space-y-2">
            <input
              type="text"
              readOnly
              value={publicInviteEnabled ? publicInviteLink : publicInviteUnavailableText}
              className="h-9 w-full bg-slate-50 border border-slate-200 rounded-lg px-3 text-xs text-slate-500 font-mono focus:outline-none"
            />
            <div className="flex justify-center items-center gap-2">
              <button
                type="button"
                disabled={!publicInviteEnabled}
                onClick={() => {
                  if (!publicInviteEnabled) return
                  navigator.clipboard.writeText(publicInviteLink)
                  showToast(t('components.dashboard.views.StaffView.joinLinkCopiedTo'), 'success')
                }}
                className={`h-9 px-4 border border-slate-200 text-slate-700 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-sm bg-white ${publicInviteEnabled ? 'hover:bg-slate-50 cursor-pointer' : 'cursor-not-allowed opacity-50'}`}
              >
                <Copy className="h-3.5 w-3.5" />
                <span>{t('components.dashboard.views.StaffView.copy')}</span>
              </button>
              <button
                type="button"
                onClick={() => publicInviteEnabled && onOpenInviteShare && onOpenInviteShare()}
                disabled={!publicInviteEnabled}
                className={`h-9 px-4 bg-nexoraBrand text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-sm ${publicInviteEnabled ? 'hover:bg-opacity-95 cursor-pointer' : 'cursor-not-allowed opacity-50'}`}
              >
                <Share2 className="h-3.5 w-3.5" />
                <span>{t('components.dashboard.views.StaffView.share')}</span>
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
              {t('components.dashboard.views.StaffView.pendingJoinRequests')} ({pendingStaff.length})
            </h3>
          </div>
          <div className="overflow-x-auto bg-white">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="bg-slate-50 text-[10px] font-extrabold uppercase text-nexoraMuted border-b border-nexoraRule">
                  <th className="px-5 py-3">{t('setup.col_staff')}</th>
                  <th className="px-5 py-3">{t('staff_invite.col_flow')}</th>
                  <th className="px-5 py-3">{t('setup.linked_wallets')}</th>
                  <th className="px-5 py-3 text-right">{t('dashboard.top_touchpoints.manage')}</th>
                </tr>
              </thead>
              <tbody>
                {pendingStaff.map((member, index) => {
                  const wallets = getWalletBadges(member)
                  const waitingStaffResponse = isWaitingStaffAcceptance(member)
                  return (
                    <tr key={member.id || index} className="border-b border-nexoraRule last:border-0 hover:bg-slate-50/40 transition">
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
                          {member.flowType || (t('components.dashboard.views.StaffView.directAddition'))}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-1.5">
                          {wallets.length > 0 ? (
                            wallets.map((wallet) => (
                              <span key={wallet} className="rounded px-2 py-0.5 text-[10px] font-bold bg-nexoraCanvas text-nexoraBrand border border-nexoraBrand/10">{wallet}</span>
                            ))
                          ) : (
                            <span className="text-[10px] text-slate-400 font-bold italic">{t('components.dashboard.views.StaffView.pending')}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        {waitingStaffResponse ? (
                          <span className="block text-[10px] font-bold text-slate-500 italic text-right">
                            {t('components.dashboard.views.StaffView.pendingAcceptance')}
                          </span>
                        ) : (
                          <div className="flex flex-wrap items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => onApproveClick && onApproveClick(member)}
                              className="whitespace-nowrap px-3.5 py-1.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition shadow-sm"
                            >
                              {t('components.dashboard.views.StaffView.approve')}
                            </button>
                            <button
                              type="button"
                              onClick={() => onDeclineJoin && onDeclineJoin(member)}
                              className="whitespace-nowrap px-3 py-1.5 text-xs font-bold border border-rose-200 bg-rose-50 text-rose-700 rounded-lg hover:bg-rose-100 transition shadow-sm"
                            >
                              {t('components.dashboard.views.StaffView.reject')}
                            </button>
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
      )}

      {/* Rejected Staff Section */}
      {rejectedStaff.length > 0 && (
        <div className="rounded-xl border border-rose-200 bg-rose-50/40 overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-rose-200 bg-rose-50 flex items-center justify-between">
            <h3 className="text-xs font-black uppercase text-rose-800 tracking-wider flex items-center gap-1.5">
              <AlertCircle className="h-4 w-4 text-rose-700" />
              {t('components.dashboard.views.StaffView.rejectedStaff')} ({rejectedStaff.length})
            </h3>
          </div>
          <div className="p-4 space-y-3">
            {rejectedStaff.map((member) => (
              <div key={member.id} className="rounded-xl border border-rose-100 bg-white p-3.5 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0 flex items-center gap-3">
                    {member.avatar ? (
                      <img src={member.avatar} alt="" className="h-10 w-10 rounded-full border border-nexoraBorder object-cover" />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-100 text-sm font-extrabold text-rose-700">
                        {member.nickname?.charAt(0) || member.fullName?.charAt(0) || 'N'}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="truncate font-extrabold text-nexoraText">{member.fullName}</p>
                      <p className="truncate text-xs text-nexoraMuted">{member.position}</p>
                    </div>
                  </div>
                  <span className="inline-flex shrink-0 rounded-full bg-rose-50 text-rose-700 px-2.5 py-0.5 text-[10px] font-extrabold uppercase border border-rose-100">
                    {t('components.dashboard.views.StaffView.rejected')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Upgraded Staff Invite & Link Status Table */}
      <div className="rounded-xl border border-nexoraBorder bg-white overflow-hidden shadow-sm">
        <div className="px-4 sm:px-5 py-3.5 sm:py-4 border-b border-nexoraRule bg-slate-50/50">
          <div className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-3 sm:gap-y-0 items-center">
            <div className="col-start-1 row-start-1 flex flex-col sm:flex-row sm:items-center sm:gap-4 min-w-0">
              <h3 className="text-[11px] sm:text-xs font-black uppercase text-slate-700 tracking-wide leading-snug">
                {t('staff_invite.invite_status_table')}
              </h3>
              <div className="hidden sm:flex items-center gap-2 min-w-0">
                <span className="text-[10px] font-extrabold uppercase text-slate-400 whitespace-nowrap">
                  {t('components.dashboard.views.StaffView.sortBy')}
                </span>
                <CustomSelect
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  options={sortOptions}
                  size="sm"
                  className="w-44"
                  buttonClass="h-8 text-xs font-bold text-slate-700 bg-white border-slate-200 rounded-lg"
                />
              </div>
            </div>
            <button
              type="button"
              onClick={onAdd}
              className="col-start-2 row-start-1 self-center px-3.5 sm:px-4 py-2 bg-nexoraBrand text-white hover:bg-opacity-95 text-xs font-bold rounded-lg transition shadow-sm flex items-center gap-1.5 shrink-0"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>{t('setup.add_staff_title')}</span>
            </button>
            <div className="col-start-1 row-start-2 flex sm:hidden items-center gap-2 min-w-0">
              <span className="text-[10px] font-extrabold uppercase text-slate-400 whitespace-nowrap shrink-0">
                {t('components.dashboard.views.StaffView.sortBy')}
              </span>
              <CustomSelect
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                options={sortOptions}
                size="sm"
                className="flex-1 min-w-0"
                buttonClass="h-8 text-xs font-bold text-slate-700 bg-white border-slate-200 rounded-lg w-full"
              />
            </div>
          </div>
        </div>

        <div className="p-4">
          {isLoading && sortedStaff.length === 0 ? (
            <div className="flex items-center justify-center py-12 text-nexoraMuted">
              <Loader2 className="h-6 w-6 animate-spin text-nexoraBrand" />
            </div>
          ) : sortedStaff.length === 0 ? (
            <div className="rounded-xl border border-dashed border-nexoraBorder bg-slate-50/50 py-12 text-center">
              <User className="h-8 w-8 text-nexoraSubtle mx-auto mb-2" />
              <p className="text-sm font-extrabold text-nexoraMuted">
                {t('components.dashboard.views.StaffView.noStaffProfileFound')}
              </p>
            </div>
          ) : (
            <div className={`relative ${isFetching ? 'opacity-60 pointer-events-none' : ''}`}>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {sortedStaff.map((member) => {
                const wallets = getWalletBadges(member)
                const isPendingInvite = isPendingInviteMember(member)
                const isPendingLink = isPendingLinkMember(member)
                const isPendingUnlink = member.status === 'Pending Unlink'
                const isPending = isPendingInvite || isPendingLink || isPendingUnlink

                return (
                  <StaffMemberCard
                    key={member.id}
                    member={member}
                    wallets={wallets}
                    isPendingInvite={isPendingInvite}
                    isPendingLink={isPendingLink}
                    isPendingUnlink={isPendingUnlink}
                    isPending={isPending}
                    t={t}
                    onViewDetail={onViewDetail}
                    onToggle={onToggle}
                    onToggleTipsFlow={onToggleTipsFlow}
                    isToggling={togglingStaffId === member.id}
                    onResendInvite={handleResendInvite}
                    onDelete={onDelete}
                    onApproveClick={onApproveClick}
                    onAcceptJoin={onAcceptJoin}
                    onDeclineJoin={onDeclineJoin}
                    onAcceptUnlink={onAcceptUnlink}
                    onDeclineUnlink={onDeclineUnlink}
                    onQr={onQr}
                    onViewStaff={onViewStaff}
                  />
                )
              })}
            </div>
            {isFetching && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-nexoraBrand" />
              </div>
            )}
            </div>
          )}

          {activeStaffCount > 0 ? (
            <Pagination
              pageNumber={pageNumber}
              pageSize={pageSize}
              totalPages={totalPages}
              totalCount={activeStaffCount}
              hasNextPage={hasNextPage}
              hasPreviousPage={hasPreviousPage}
              onPageChange={onPageChange}
              isLoading={isFetching}
              className="mt-6"
            />
          ) : null}
        </div>
      </div>

      {/* Large Join QR Modal */}
      {largeJoinQrOpen && publicInviteEnabled && (
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
                {t('components.dashboard.views.StaffView.joinQrCode')}
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
                src={publicInviteQrLargeSrc}
                alt={t('components.dashboard.views.StaffView.scanToJoinAlt')}
                className="h-full w-full object-contain"
              />
            </div>

            <p className="text-[11px] text-slate-500 font-medium text-center leading-relaxed max-w-xs mb-4">
              {t('components.dashboard.views.StaffView.haveTechniciansScanThis')}
            </p>

            <div className="w-full bg-slate-50 rounded-xl border border-slate-200 p-2.5 flex items-center justify-between gap-2">
              <span className="text-[10px] text-slate-400 font-mono truncate max-w-[210px]">
                {publicInviteLink}
              </span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(publicInviteLink)
                  showToast(t('components.dashboard.views.StaffView.joinLinkCopiedTo'), 'success')
                }}
                className="h-7 px-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-[10px] font-bold transition flex items-center gap-1 shrink-0"
              >
                <Copy className="h-3 w-3" />
                <span>{t('components.dashboard.views.StaffView.copy')}</span>
              </button>
            </div>
          </div>
        </div>
      )}


    </div>
  )
}

export default StaffView
