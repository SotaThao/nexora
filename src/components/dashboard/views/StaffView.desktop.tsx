import { useState, useMemo } from 'react'
import { AlertCircle, Plus, HelpCircle, Trash2, User, QrCode, Eye, Link, Copy, X, Share2, Loader2 } from 'lucide-react'
import { useTranslation } from '../../../contexts/LanguageContext'
import { useNotification } from '../../../contexts/NotificationContext'
import { buildPublicInviteLink } from '../../../utils/inviteRef'
import { getWebUrlOrigin } from '../../../utils/webUrlBase'
import { buildPublicQrImageUrl } from '../../../data/repositories/publicQr'
import { PAYOUT_UI_DISPLAY_ORDER, PAYOUT_UI_LABELS } from '../../../data/paymentMethodTypes'
import IconButton from '../../ui/IconButton'
import CustomSelect from '../../CustomSelect'
import Pagination from '../../ui/Pagination'
import ToggleSwitch from '../../ui/ToggleSwitch'

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

function StaffView({
  staff,
  pendingStaff = [],
  allStaff = [],
  isLoading = false,
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
  isFetching = false,
  pageNumber = 1,
  pageSize = 10,
  totalPages = 1,
  totalCount = 0,
  hasNextPage = false,
  hasPreviousPage = false,
  onPageChange,
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

  const sortedStaff = useMemo(() => {
    return [...(staff || []).filter((member) => !isRejectedStaff(member))].sort((a, b) => {
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
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-stretch">
        {/* KPI Card 1: Total Staff Linked */}
        <div className="rounded-xl border border-nexoraBorder bg-white p-5 shadow-sm lg:col-span-1 flex flex-col justify-center">
          <small className="text-[10px] font-black uppercase text-nexoraMuted tracking-wider">
            {t('staff_invite.total_linked')}
          </small>
          <div className="mt-2 flex items-baseline justify-between">
            <h3 className="text-2xl font-black text-nexoraText">{totalLinked}</h3>
          </div>
        </div>

        {/* KPI Card 2: Pending Invites */}
        <div className="rounded-xl border border-nexoraBorder bg-white p-5 shadow-sm lg:col-span-1 flex flex-col justify-center">
          <small className="text-[10px] font-black uppercase text-nexoraMuted tracking-wider">
            {t('staff_invite.pending_invites')}
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
              {/* Magnifier icon overlay on hover */}
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

            <div className="flex gap-2 max-w-xl flex-wrap">
              <input
                type="text"
                readOnly
                value={publicInviteEnabled ? publicInviteLink : publicInviteUnavailableText}
                className="h-9 flex-grow bg-slate-50 border border-slate-200 rounded-lg px-3 text-xs text-slate-500 font-mono focus:outline-none min-w-[200px]"
              />
              <button
                disabled={!publicInviteEnabled}
                onClick={() => {
                  if (!publicInviteEnabled) return
                  navigator.clipboard.writeText(publicInviteLink)
                  showToast(t('components.dashboard.views.StaffView.joinLinkCopiedTo'), 'success')
                }}
                className={`h-9 px-3.5 border border-slate-200 text-slate-700 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shrink-0 shadow-sm bg-white ${publicInviteEnabled ? 'hover:bg-slate-50 cursor-pointer' : 'cursor-not-allowed opacity-50'}`}
              >
                <Copy className="h-3.5 w-3.5" />
                <span>{t('components.dashboard.views.StaffView.copy')}</span>
              </button>
              <button
                onClick={() => publicInviteEnabled && onOpenInviteShare && onOpenInviteShare()}
                disabled={!publicInviteEnabled}
                className={`h-9 px-3.5 bg-nexoraBrand text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shrink-0 shadow-sm ${publicInviteEnabled ? 'hover:bg-opacity-95 cursor-pointer' : 'cursor-not-allowed opacity-50'}`}
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
                              {t('components.dashboard.views.StaffView.reviewAndApprove')}
                            </button>
                            <button
                              type="button"
                              onClick={() => onDeclineJoin && onDeclineJoin(member)}
                              className="whitespace-nowrap px-3 py-1.5 text-xs font-bold border border-rose-200 bg-rose-50 text-rose-700 rounded-lg hover:bg-rose-100 transition shadow-sm"
                            >
                              {t('components.dashboard.views.StaffView.decline')}
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

      {/* 3. Upgraded Staff Invite & Link Status Table */}
      <div className="rounded-xl border border-nexoraBorder bg-white overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-nexoraRule bg-slate-50/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h3 className="text-xs font-black uppercase text-slate-700 tracking-wider">
            {t('staff_invite.invite_status_table')}
          </h3>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase text-slate-400 whitespace-nowrap">
                {t('components.dashboard.views.StaffView.sortBy')}
              </span>
              <CustomSelect
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                options={[
                  { value: 'name-asc', label: t('components.dashboard.views.StaffView.nameAZ') },
                  { value: 'name-desc', label: t('components.dashboard.views.StaffView.nameZA') },
                  { value: 'date-newest', label: t('components.dashboard.views.StaffView.dateNewest') },
                  { value: 'date-oldest', label: t('components.dashboard.views.StaffView.dateOldest') },
                  { value: 'status-active', label: t('components.dashboard.views.StaffView.statusActive') }
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
              <span>{t('setup.add_staff_title')}</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto relative">
          {isFetching && sortedStaff.length > 0 && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60">
              <Loader2 className="h-6 w-6 animate-spin text-nexoraBrand" />
            </div>
          )}
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="bg-slate-50 text-[10px] font-extrabold uppercase text-nexoraMuted border-b border-nexoraRule">
                <th className="px-5 py-3">{t('setup.col_staff')}</th>
                <th className="px-5 py-3">{t('staff_invite.col_flow')}</th>
                <th className="px-5 py-3">{t('setup.linked_wallets')}</th>
                <th className="px-5 py-3">
                  <div className="flex items-center gap-1 group relative">
                    <span>{t('dashboard.activity_log.col_status')}</span>
                    <HelpCircle className="h-3 w-3 text-slate-400 cursor-help shrink-0" />
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1.5 hidden group-hover:block w-44 bg-slate-800 text-white text-[9px] font-bold p-2 rounded-lg shadow-lg pointer-events-none text-center normal-case leading-normal z-50">
                      {t('components.dashboard.views.StaffView.clickPillToToggle')}
                    </div>
                  </div>
                </th>
                <th className="px-5 py-3">
                  <div className="flex items-center gap-1 group relative">
                    <span>{t('components.dashboard.views.StaffView.tipsFlow')}</span>
                    <HelpCircle className="h-3 w-3 text-slate-400 cursor-help shrink-0" />
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1.5 hidden group-hover:block w-44 bg-slate-800 text-white text-[9px] font-bold p-2 rounded-lg shadow-lg pointer-events-none text-center normal-case leading-normal z-50 font-sans">
                      {t('components.dashboard.views.StaffView.clickPillToShow')}
                    </div>
                  </div>
                </th>
                <th className="px-5 py-3 text-right">{t('dashboard.top_touchpoints.manage')}</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && sortedStaff.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-nexoraBrand" />
                  </td>
                </tr>
              ) : sortedStaff.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12">
                    <div className="flex flex-col items-center justify-center gap-2 text-center">
                      <User className="h-8 w-8 text-nexoraSubtle" />
                      <p className="text-sm font-extrabold text-nexoraMuted">
                        {t('components.dashboard.views.StaffView.noStaffProfileFound')}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : sortedStaff.map((member, index) => {
                const wallets = getWalletBadges(member)
                const isPendingSetup = member.status === 'Pending Setup'
                const isPendingAcceptance = member.status === 'Pending Acceptance'
                const waitingStaffResponse = isWaitingStaffAcceptance(member)
                const isPendingUnlink = member.status === 'Pending Unlink'
                const isPending = isPendingSetup || isPendingAcceptance || isPendingUnlink
                const isToggling = togglingStaffId === member.id

                return (
                  <tr key={member.id || index} className="border-b border-nexoraRule last:border-0 hover:bg-slate-50/40 transition">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3 cursor-pointer group" onClick={() => onViewDetail(member)}>
                        {member.avatar ? (
                          <img src={member.avatar} alt="" className="h-10 w-10 rounded-full border border-nexoraBorder object-cover group-hover:opacity-85 transition" />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-50 text-sm font-extrabold text-indigo-600 group-hover:bg-indigo-100 transition">
                            {member.nickname?.charAt(0) || member.fullName?.charAt(0) || '?'}
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
                        {member.flowType || (t('components.dashboard.views.StaffView.directAddition'))}
                      </div>
                      {member.joinedDate && (
                        <div className="text-[10px] text-slate-400 font-bold mt-0.5 leading-normal">
                          {t('components.dashboard.views.StaffView.linkedDate')}
                          {member.joinedDate}
                        </div>
                      )}
                    </td>

                    <td className="px-5 py-4">
                      {isPendingSetup ? (
                        <span className="text-[10px] text-slate-400 font-bold italic">{t('components.dashboard.views.StaffView.pending')}</span>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {wallets.length > 0 ? (
                            wallets.map((wallet) => (
                              <span key={wallet} className="rounded px-2 py-0.5 text-[10px] font-bold bg-nexoraCanvas text-nexoraBrand border border-nexoraBrand/10">{wallet}</span>
                            ))
                          ) : (
                            <span className="text-[10px] text-slate-400 font-bold italic">{t('components.dashboard.views.StaffView.noWallets')}</span>
                          )}
                        </div>
                      )}
                    </td>

                    <td className="px-5 py-4">
                      {isPendingSetup && (
                        <span className="inline-flex rounded-full bg-amber-50 text-amber-700 px-2.5 py-0.5 text-[10px] font-extrabold uppercase border border-amber-100">
                          {t('components.dashboard.views.StaffView.pendingSetup')}
                        </span>
                      )}
                      {isPendingAcceptance && (
                        <span className="inline-flex rounded-full bg-indigo-50 text-indigo-700 px-2.5 py-0.5 text-[10px] font-extrabold uppercase border border-indigo-100">
                          {t('components.dashboard.views.StaffView.pendingAcceptance')}
                        </span>
                      )}
                      {isPendingUnlink && (
                        <span className="inline-flex rounded-full bg-rose-50 text-rose-700 px-2.5 py-0.5 text-[10px] font-extrabold uppercase border border-rose-100">
                          {t('components.dashboard.views.StaffView.pendingUnlink')}
                        </span>
                      )}
                      {!isPending && (
                        <ToggleSwitch
                          checked={Boolean(member.isActive)}
                          onChange={() => onToggle(member.id)}
                          disabled={isToggling}
                          title={member.isActive ? t('common.active') : t('common.inactive')}
                        />
                      )}
                    </td>

                    <td className="px-5 py-4">
                      {!isPending && (
                        <ToggleSwitch
                          checked={member.showInTipsFlow !== false}
                          onChange={() => onToggleTipsFlow(member.id)}
                          activeColor="bg-blue-500"
                          disabled={isToggling}
                          title={member.showInTipsFlow !== false ? 'Show' : 'Hide'}
                        />
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
                            {t('staff_invite.action_resend')}
                          </button>
                          <IconButton label={t('common.delete')} onClick={() => onDelete(member.id)} className="hover:text-rose-600">
                            <Trash2 className="h-4 w-4" />
                          </IconButton>
                        </div>
                      )}

                      {isPendingAcceptance && !waitingStaffResponse && (
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => onAcceptJoin && onAcceptJoin(member)}
                            className="px-2.5 py-1 text-[10px] font-extrabold border border-emerald-200 bg-emerald-50 text-emerald-700 rounded hover:bg-emerald-100 transition"
                          >
                            {t('components.dashboard.views.StaffView.accept')}
                          </button>
                          <button
                            onClick={() => onDeclineJoin && onDeclineJoin(member)}
                            className="px-2.5 py-1 text-[10px] font-extrabold border border-rose-200 bg-rose-50 text-rose-700 rounded hover:bg-rose-100 transition"
                          >
                            {t('components.dashboard.views.StaffView.decline')}
                          </button>
                        </div>
                      )}
                      {isPendingAcceptance && waitingStaffResponse && (
                        <span className="text-[10px] font-bold text-slate-500 italic">
                          {t('components.dashboard.views.StaffView.pendingAcceptance')}
                        </span>
                      )}

                      {isPendingUnlink && (
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => onAcceptUnlink && onAcceptUnlink(member)}
                            className="px-2.5 py-1 text-[10px] font-extrabold border border-rose-200 bg-rose-50 text-rose-700 rounded hover:bg-rose-100 transition cursor-pointer"
                          >
                            {t('components.dashboard.views.StaffView.approveUnlink')}
                          </button>
                          <button
                            onClick={() => onDeclineUnlink && onDeclineUnlink(member)}
                            className="px-2.5 py-1 text-[10px] font-extrabold border border-slate-200 bg-white text-slate-700 rounded hover:bg-slate-50 transition cursor-pointer"
                          >
                            {t('components.dashboard.views.StaffView.reject')}
                          </button>
                        </div>
                      )}

                      {!isPending && (
                        <div className="flex justify-end gap-1.5">
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
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {totalCount > 0 && totalPages > 1 ? (
          <Pagination
            pageNumber={pageNumber}
            pageSize={pageSize}
            totalPages={totalPages}
            totalCount={totalCount}
            hasNextPage={hasNextPage}
            hasPreviousPage={hasPreviousPage}
            onPageChange={onPageChange}
            isLoading={isFetching}
            className="mt-0 border-t-0"
          />
        ) : null}
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
