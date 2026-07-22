import { useMemo, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from '../../../contexts/LanguageContext'
import { useNotification } from '../../../contexts/NotificationContext'
import {
  useSetStaffBusinessNickname,
  useStaffBusinesses,
  useStaffProfile,
  useUnlinkStaffBusiness,
} from '../../../data/hooks/useStaffSelf'
import { useMarkNotificationRead, useNotifications } from '../../../data/hooks/useNotifications'
import errorCodeToI18nKey from '../../../data/errorCodes'
import { isApiError } from '../../../types/domain'
import type { StaffBusinessLink } from '../../../types/domain'
import type { TFunction } from '../../../types/contexts'
import {
  formatSalonLocation,
  formatSalonTimeline,
  getSalonAvatarClass,
  getSalonDisplayStatus,
  getSalonInitials,
  sortSalonBusinesses,
} from '../utils/staffSalonDisplay'
import {
  resolveStaffBusinessLinkStatusLabel,
  STAFF_BUSINESS_LINK_STATUS,
} from '../../../utils/staffBusinessLinkStatus'
import Tooltip from '../../ui/Tooltip'
import NicknameEditor, { type NicknameEditorSaveResult } from '../../NicknameEditor'
import StaffLinkRequestCard, { getStaffLinkRequestId } from './StaffLinkRequestCard'

function getSalonStatusHelp(
  statusLabel: string,
  t: TFunction,
) {
  const normalized = statusLabel.trim().toLowerCase()

  if (normalized.includes(STAFF_BUSINESS_LINK_STATUS.pendingUnlink)) {
    return t('staff_salons.status_help.pending_unlink')
  }
  if (normalized.includes(STAFF_BUSINESS_LINK_STATUS.pendingApproval)) {
    return t('staff_salons.status_help.pending_approval')
  }
  if (
    normalized === STAFF_BUSINESS_LINK_STATUS.pending
    || normalized.includes(STAFF_BUSINESS_LINK_STATUS.pendingLink)
  ) {
    return t('staff_salons.status_help.pending')
  }
  if (
    normalized === STAFF_BUSINESS_LINK_STATUS.rejected
    || normalized.includes(STAFF_BUSINESS_LINK_STATUS.rejected)
  ) {
    return t('staff_salons.status_help.rejected')
  }
  if (
    normalized === STAFF_BUSINESS_LINK_STATUS.inactive
    || normalized === STAFF_BUSINESS_LINK_STATUS.previous
    || normalized.includes(STAFF_BUSINESS_LINK_STATUS.inactive)
  ) {
    return t('staff_salons.status_help.previous')
  }
  if (normalized === STAFF_BUSINESS_LINK_STATUS.active) {
    return t('staff_salons.status_help.active')
  }

  return t('staff_salons.status_help.default')
}

function SalonCard({
  business,
  index,
  currentLanguage,
  t,
  originalName,
  onRefreshNickname,
  onSaveNickname,
  onUnlink,
  isUnlinking = false,
}: {
  business: StaffBusinessLink
  index: number
  currentLanguage: string
  t: TFunction
  originalName: string
  onRefreshNickname: () => Promise<string | null>
  onSaveNickname: (nickname: string | null) => Promise<NicknameEditorSaveResult>
  onUnlink?: () => void
  isUnlinking?: boolean
}) {
  const statusLabel = resolveStaffBusinessLinkStatusLabel(business)
  const status = getSalonDisplayStatus(business, t)
  const statusHelp = getSalonStatusHelp(statusLabel, t)
  const timeline = formatSalonTimeline(business, statusLabel, t, currentLanguage)
  const location = formatSalonLocation(business)
  const initials = business.logoUrl ? null : getSalonInitials(business.businessName)
  const isActive = statusLabel.trim().toLowerCase() === STAFF_BUSINESS_LINK_STATUS.active
  const nicknameValue = business.nicknameAtBusiness?.trim() ?? ''
  const nicknameDisplayValue = nicknameValue || t('staff_salons.nickname_not_set')
  const canUnlink = isActive && typeof onUnlink === 'function'

  return (
    <div className="w-full rounded-2xl border border-nexoraBorder/80 bg-white p-4 text-left shadow-sm">
      <div className="flex w-full gap-3 text-left">
      {business.logoUrl ? (
        <img
          src={business.logoUrl}
          alt=""
          className="h-12 w-12 shrink-0 rounded-full object-cover"
        />
      ) : (
        <span
          className={`grid h-12 w-12 shrink-0 place-items-center rounded-full text-xs font-extrabold ${getSalonAvatarClass(index)}`}
        >
          {initials}
        </span>
      )}

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="truncate text-sm font-extrabold uppercase tracking-wide text-nexoraText">
            {business.businessName}
          </h3>
          <span className="flex shrink-0 items-center gap-1">
            <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${status.className}`}>
              {status.label}
            </span>
            <Tooltip
              content={statusHelp}
              ariaLabel={t('staff_salons.status_help_aria')}
              align="end"
              placement="top"
            />
          </span>
        </div>
        <p className="truncate text-xs font-medium text-nexoraMuted">{location}</p>
        <div className="flex items-center justify-between gap-2 pt-0.5">
          {canUnlink ? (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation()
                onUnlink?.()
              }}
              onKeyDown={(event) => event.stopPropagation()}
              onKeyUp={(event) => event.stopPropagation()}
              disabled={isUnlinking}
              className="shrink-0 rounded-lg border border-nexoraDanger/25 bg-white px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide text-nexoraDanger transition hover:bg-nexoraDanger/5 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {t('staff_salons.unlink_button')}
            </button>
          ) : (
            <span />
          )}
          {timeline ? (
            <p className="text-right text-[11px] font-semibold text-nexoraMuted">{timeline}</p>
          ) : null}
        </div>
      </div>
      </div>
      {isActive ? (
        <div className="mt-2 flex min-w-0 items-center gap-2">
          <div className="flex min-w-0 flex-1 items-center gap-2 rounded-lg py-1 text-left">
            <span className="shrink-0 rounded-full border border-dashed border-nexoraLavender bg-nexoraBrandSoft px-2 py-0.5 text-[10px] font-extrabold uppercase text-nexoraBrand">
              {t('staff_salons.nickname_badge')}
            </span>
            <span
              className={`min-w-0 flex-1 truncate text-xs text-nexoraText ${nicknameValue ? 'font-semibold' : 'italic text-nexoraMuted'}`}
              title={nicknameDisplayValue}
              aria-label={nicknameDisplayValue}
            >
              {nicknameDisplayValue}
            </span>
          </div>
          <NicknameEditor
            value={business.nicknameAtBusiness}
            originalName={originalName}
            triggerLabel={t('staff_salons.nickname_edit_action')}
            fieldLabel={t('staff_salons.nickname_badge')}
            helperText={t('staff_salons.nickname_helper_staff')}
            onRefresh={onRefreshNickname}
            onSave={onSaveNickname}
            triggerVariant="icon"
            containerClassName="shrink-0"
          />
        </div>
      ) : null}
    </div>
  )
}

export default function StaffMySalons() {
  const { t, currentLanguage } = useTranslation()
  const navigate = useNavigate()
  const { showToast, showConfirm } = useNotification()
  const {
    data: businesses = [],
    isPending,
    refetch: refetchBusinesses,
  } = useStaffBusinesses()
  const { data: staffProfile } = useStaffProfile()
  const setNicknameMutation = useSetStaffBusinessNickname()
  const { data: notifications = [] } = useNotifications()
  const markNotificationRead = useMarkNotificationRead()
  const unlinkBusiness = useUnlinkStaffBusiness()
  const [unlinkError, setUnlinkError] = useState<{ title: string; message: string } | null>(null)
  const pendingLinkRequestNotifications = useMemo(() => {
    const seenLinkIds = new Set<string>()

    return notifications.flatMap((notification) => {
      if (notification.type !== 'StaffLinkRequest') return []
      if (notification.read || notification.isRead) return []

      const linkId = getStaffLinkRequestId(notification)
      if (!linkId || seenLinkIds.has(linkId)) return []

      seenLinkIds.add(linkId)
      return [notification]
    })
  }, [notifications])
  const salons = useMemo(() => {
    const activeAndPendingBusinesses = businesses.filter((business) => {
      const statusLabel = resolveStaffBusinessLinkStatusLabel(business).trim().toLowerCase()
      const rawStatus = String(business.status ?? business.linkStatus ?? '').trim().toLowerCase()
      const isPrevious = (
        statusLabel === STAFF_BUSINESS_LINK_STATUS.inactive
        || statusLabel === STAFF_BUSINESS_LINK_STATUS.previous
        || statusLabel.includes(STAFF_BUSINESS_LINK_STATUS.inactive)
        || statusLabel.includes(STAFF_BUSINESS_LINK_STATUS.previous)
        || rawStatus === '2'
        || rawStatus === '5'
        || rawStatus === 'inactive'
        || rawStatus === 'previous'
      )
      return !isPrevious
    })
    return sortSalonBusinesses(activeAndPendingBusinesses)
  }, [businesses])
  const isLoading = isPending && businesses.length === 0
  const originalName = staffProfile?.displayName?.trim()
    || `${staffProfile?.firstName ?? ''} ${staffProfile?.lastName ?? ''}`.trim()

  const handleUnlink = async (business: StaffBusinessLink) => {
    const confirmed = await showConfirm(
      t('staff_salons.unlink_confirm_message', { business: business.businessName }),
      t('staff_salons.unlink_confirm_title'),
    )
    if (!confirmed) return

    unlinkBusiness.mutate(business.businessId, {
      onSuccess: () => {
        showToast(t('staff_salons.unlink_success', { business: business.businessName }), 'success')
      },
      onError: (err) => {
        const errorCode = isApiError(err) ? err.errorCode : null
        const mappedKey = errorCode === 'STAFF_LINK_HAS_OUTSTANDING_DEBT'
          ? 'errors.staff_unlink_has_outstanding_debt'
          : errorCode && Object.prototype.hasOwnProperty.call(errorCodeToI18nKey, errorCode)
            ? errorCodeToI18nKey[errorCode as keyof typeof errorCodeToI18nKey]
            : null
        const rawMessage = isApiError(err) ? err.message?.trim() : ''
        const message = mappedKey
          ? t(mappedKey)
          : rawMessage || t('errors.staff_unlink_failed')
        setUnlinkError({ title: t('staff_salons.unlink_error_title'), message })
      },
    })
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-extrabold text-nexoraText">{t('staff_salons.title')}</h2>
        <p className="mt-1 text-xs leading-relaxed text-nexoraMuted">{t('staff_salons.subtitle')}</p>
      </div>

      {pendingLinkRequestNotifications.length > 0 && (
        <section className="rounded-2xl border border-nexoraBorder bg-nexoraSurface p-4 shadow-sm">
          <h3 className="mb-3 text-base font-extrabold text-nexoraText">
            {t('staff_dashboard.qr.link_requests_title')}
          </h3>
          <div className="space-y-2">
            {pendingLinkRequestNotifications.map((notification) => (
              <StaffLinkRequestCard
                key={notification.id}
                notification={notification}
                onResolved={(id) => markNotificationRead.mutate(id)}
              />
            ))}
          </div>
        </section>
      )}

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-nexoraBrand" />
        </div>
      ) : salons.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-nexoraBorder bg-white px-4 py-12 text-center">
          <p className="text-sm font-semibold text-nexoraText">{t('staff_salons.empty_title')}</p>
          <p className="mt-1 text-xs text-nexoraMuted">{t('staff_dashboard.qr.no_linked_businesses')}</p>
          <button
            type="button"
            onClick={() => navigate('/staff/qr?tab=tipping')}
            className="mt-4 inline-flex h-9 items-center justify-center rounded-lg bg-nexoraBrand px-4 text-xs font-bold text-white"
          >
            {t('staff_salons.link_salon_cta')}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {salons.map((business, index) => (
            <SalonCard
              key={business.businessId}
              business={business}
              index={index}
              currentLanguage={currentLanguage}
              t={t}
              originalName={originalName}
              onRefreshNickname={async () => {
                const result = await refetchBusinesses({ throwOnError: true })
                return result.data?.find(
                  (item) => item.businessId === business.businessId,
                )?.nicknameAtBusiness ?? null
              }}
              onSaveNickname={(nickname) => setNicknameMutation.mutateAsync({
                businessId: business.businessId,
                nickname,
              })}
              onUnlink={() => handleUnlink(business)}
              isUnlinking={unlinkBusiness.isPending}
            />
          ))}
        </div>
      )}

      {unlinkError && (
        <div
          className="fixed inset-0 z-[99998] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
          role="alertdialog"
          aria-modal="true" aria-labelledby="staff-unlink-error-title" aria-describedby="staff-unlink-error-message"
        >
          <div className="w-full max-w-sm overflow-hidden rounded-2xl border border-slate-100 bg-white p-6 shadow-2xl">
            <h4 id="staff-unlink-error-title" className="mb-2 text-sm font-black uppercase tracking-wide text-slate-900">
              {unlinkError.title}
            </h4>
            <p id="staff-unlink-error-message" className="mb-6 text-xs font-semibold leading-relaxed text-slate-600">
              {unlinkError.message}
            </p>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setUnlinkError(null)}
                className="rounded-xl bg-nexoraBrand px-4.5 py-2.5 text-[10px] font-extrabold uppercase tracking-wider text-white shadow-sm transition-colors hover:bg-nexoraBrand/90"
              >
                {t('common.confirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
