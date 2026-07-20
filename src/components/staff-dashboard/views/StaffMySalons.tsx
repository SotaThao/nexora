import { Loader2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from '../../../contexts/LanguageContext'
import {
  useSetStaffBusinessNickname,
  useStaffBusinesses,
  useStaffProfile,
} from '../../../data/hooks/useStaffSelf'
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
  onOpen,
  originalName,
  onRefreshNickname,
  onSaveNickname,
}: {
  business: StaffBusinessLink
  index: number
  currentLanguage: string
  t: TFunction
  onOpen: () => void
  originalName: string
  onRefreshNickname: () => Promise<string | null>
  onSaveNickname: (nickname: string | null) => Promise<NicknameEditorSaveResult>
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

  return (
    <div className="w-full rounded-2xl border border-nexoraBorder/80 bg-white p-4 text-left shadow-sm transition hover:border-nexoraBrand/20 hover:shadow-md">
      <div
        role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(event) => {
        if (event.key === ' ') {
          event.preventDefault()
        }
        if (event.key === 'Enter') {
          event.preventDefault()
          onOpen()
        }
      }}
      onKeyUp={(event) => {
        if (event.key === ' ') {
          event.preventDefault()
          onOpen()
        }
      }}
        className="flex w-full gap-3 rounded-lg text-left transition active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-nexoraBrand/30"
      >
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
            <span
              onClick={(event) => event.stopPropagation()}
              onKeyDown={(event) => event.stopPropagation()}
              onKeyUp={(event) => event.stopPropagation()}
            >
              <Tooltip
                content={statusHelp}
                ariaLabel={t('staff_salons.status_help_aria')}
                align="end"
                placement="top"
              />
            </span>
          </span>
        </div>
        <p className="truncate text-xs font-medium text-nexoraMuted">{location}</p>
        {timeline ? (
          <p className="pt-0.5 text-left text-[11px] font-semibold text-nexoraMuted">{timeline}</p>
        ) : null}
      </div>
      </div>
      {isActive ? (
        <div className="mt-2 flex min-w-0 items-center gap-2">
          <div
            role="button"
            tabIndex={0}
            onClick={onOpen}
            onKeyDown={(event) => {
              if (event.key === ' ') event.preventDefault()
              if (event.key === 'Enter') {
                event.preventDefault()
                onOpen()
              }
            }}
            onKeyUp={(event) => {
              if (event.key === ' ') {
                event.preventDefault()
                onOpen()
              }
            }}
            className="flex min-w-0 flex-1 items-center gap-2 rounded-lg py-1 text-left focus:outline-none focus:ring-2 focus:ring-nexoraBrand/30"
          >
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
            stopPropagation
          />
        </div>
      ) : null}
    </div>
  )
}

export default function StaffMySalons() {
  const { t, currentLanguage } = useTranslation()
  const navigate = useNavigate()
  const {
    data: businesses = [],
    isPending,
    refetch: refetchBusinesses,
  } = useStaffBusinesses()
  const { data: staffProfile } = useStaffProfile()
  const setNicknameMutation = useSetStaffBusinessNickname()
  const salons = sortSalonBusinesses(businesses)
  const isLoading = isPending && businesses.length === 0
  const originalName = staffProfile?.displayName?.trim()
    || `${staffProfile?.firstName ?? ''} ${staffProfile?.lastName ?? ''}`.trim()

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-extrabold text-nexoraText">{t('staff_salons.title')}</h2>
        <p className="mt-1 text-xs leading-relaxed text-nexoraMuted">{t('staff_salons.subtitle')}</p>
      </div>

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
              onOpen={() => navigate('/staff/qr?tab=tipping')}
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
            />
          ))}
        </div>
      )}
    </div>
  )
}
