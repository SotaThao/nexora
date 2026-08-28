import { useCallback, useEffect, useMemo, useState } from 'react'
import { ChevronDown, Loader2, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from '../../../contexts/LanguageContext'
import { useNotification } from '../../../contexts/NotificationContext'
import {
  useSetStaffBusinessNickname,
  useStaffBusinesses,
  useStaffLinkRequestsList,
  useStaffProfile,
  useUnlinkStaffBusiness,
  useStaffWorkSkillCategories,
  useStaffWorkSkillServices,
  useStaffWorkSkillAssignments,
  useSaveStaffWorkSkillAssignments,
} from '../../../data/hooks/useStaffSelf'
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
import StaffLinkRequestCard from './StaffLinkRequestCard'
import StaffCommunityChatActionButton from '../../staff/StaffCommunityChatActionButton'
import { STAFF_CHAT_I18N } from '../../staff/constants'
import { useStaffListChatStartHint } from '../../staff/useStaffChatStartHint'
import { useStaffCommunityChatUnreadByPeerId } from '../../staff/useStaffCommunityChatUnreadByPeerId'
import type { StaffChatMemberLike } from '../../staff/staffCommunityChatUtils'
import {
  getSalonChatMemberByBusinessId,
  SALON_CARD_PADDING_CLASS,
  SALON_CHAT_START_HINT_PLACEMENT,
} from '../utils/staffSalonChat'
import type { WorkSkillCategory, WorkSkillService } from '../../../data/repositories/staffSelf'

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

interface SkillCatalogGroup {
  key: string
  label: string
  services: { id: string; name: string }[]
}

function buildSkillCatalog(
  t: TFunction,
  categories: WorkSkillCategory[],
  services: WorkSkillService[],
): SkillCatalogGroup[] {
  const catMap = new Map<string, SkillCatalogGroup>()
  for (const cat of categories) {
    catMap.set(cat.id, { key: cat.id, label: cat.name, services: [] })
  }
  const uncategorized: { id: string; name: string }[] = []
  for (const svc of services) {
    let placed = false
    for (const catId of svc.categoryIds ?? []) {
      const group = catMap.get(catId)
      if (group) { group.services.push({ id: svc.id, name: svc.name }); placed = true }
    }
    if (!placed) uncategorized.push({ id: svc.id, name: svc.name })
  }
  const result = [...catMap.values()].filter((g) => g.services.length > 0)
  if (uncategorized.length > 0) {
    result.push({ key: '__uncategorized__', label: t('staff_salons.skill_other'), services: uncategorized })
  }
  return result
}

function SkillTreeSkeleton() {
  return (
    <div className="animate-pulse space-y-2">
      {[1, 2, 3].map((i) => (
        <div key={i} className="rounded-[10px] border border-nexoraBorder/50 bg-white p-2.5">
          <div className="h-3 w-1/3 rounded bg-nexoraBorder/40" />
          <div className="mt-2 grid grid-cols-2 gap-1.5">
            {[1, 2, 3, 4].map((j) => (
              <div key={j} className="h-[34px] rounded-[9px] bg-nexoraBorder/30" />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function EditWorkSkillModal({
  open,
  onClose,
  businessId,
  salonName,
  t,
}: {
  open: boolean
  onClose: () => void
  businessId: string
  salonName: string
  t: TFunction
}) {
  const { showToast } = useNotification()
  const categoriesQuery = useStaffWorkSkillCategories(open ? businessId : undefined)
  const servicesQuery = useStaffWorkSkillServices(open ? businessId : undefined)
  const assignmentsQuery = useStaffWorkSkillAssignments(open ? businessId : undefined)
  const saveMutation = useSaveStaffWorkSkillAssignments()

  const isLoading = categoriesQuery.isPending || servicesQuery.isPending || assignmentsQuery.isPending
  const isError = categoriesQuery.isError || servicesQuery.isError || assignmentsQuery.isError
  const catalog = useMemo(() => {
    if (!categoriesQuery.data || !servicesQuery.data) return []
    return buildSkillCatalog(t, categoriesQuery.data, servicesQuery.data)
  }, [categoriesQuery.data, servicesQuery.data, t])
  const totalServices = useMemo(() => catalog.reduce((sum, g) => sum + g.services.length, 0), [catalog])
  const isEmpty = !isLoading && !isError && totalServices === 0

  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set())
  const [initialized, setInitialized] = useState(false)

  // Sync selection from API once data loads (effect avoids setState-during-render)
  useEffect(() => {
    if (!initialized && assignmentsQuery.data && catalog.length > 0) {
      setSelected(new Set(assignmentsQuery.data))
      setOpenGroups(new Set())
      setInitialized(true)
    }
  }, [initialized, assignmentsQuery.data, catalog.length])

  // Reset state when modal closes
  const handleClose = useCallback(() => {
    setInitialized(false)
    onClose()
  }, [onClose])

  const toggleService = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const toggleCategory = useCallback((catKey: string, checked: boolean) => {
    const cat = catalog.find((c) => c.key === catKey)
    if (!cat) return
    setSelected((prev) => {
      const next = new Set(prev)
      for (const s of cat.services) {
        if (checked) next.add(s.id)
        else next.delete(s.id)
      }
      return next
    })
  }, [catalog])

  const toggleAll = useCallback((checked: boolean) => {
    if (checked) {
      setSelected(new Set(catalog.flatMap((c) => c.services.map((s) => s.id))))
    } else {
      setSelected(new Set())
    }
  }, [catalog])

  const toggleGroup = useCallback((key: string) => {
    setOpenGroups((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }, [])

  const handleSave = useCallback(() => {
    saveMutation.mutate(
      { businessId, posServiceIds: Array.from(selected) },
      {
        onSuccess: () => {
          showToast(t('staff_salons.skill_save_success'), 'success')
          handleClose()
        },
        onError: (err) => {
          const apiErr = isApiError(err) ? err : null
          const errorCode = apiErr?.errorCode
          const mappedKey = errorCode && Object.prototype.hasOwnProperty.call(errorCodeToI18nKey, errorCode)
            ? errorCodeToI18nKey[errorCode as keyof typeof errorCodeToI18nKey]
            : null
          const message = mappedKey ? t(mappedKey) : t('staff_salons.skill_save_error')
          showToast(message, 'error')
        },
      },
    )
  }, [businessId, selected, saveMutation, showToast, t, handleClose])

  const allChecked = totalServices > 0 && selected.size === totalServices
  const anyChecked = selected.size > 0

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-900/55 p-5"
      role="presentation"
    >
      <div
        className="flex w-full max-w-[420px] flex-col rounded-[20px] bg-white shadow-2xl"
        style={{ maxHeight: 'calc(100vh - 40px)' }}
        role="dialog"
        aria-modal="true"
        aria-label={`${t('staff_salons.edit_work_skill')} — ${salonName}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-6 pb-0 pt-6">
          <h2 className="text-lg font-extrabold text-nexoraText">{t('staff_salons.edit_work_skill')}</h2>
          <button
            type="button"
            onClick={handleClose}
            className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-nexoraSubtle transition hover:bg-nexoraSurfaceMuted hover:text-nexoraText"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mx-6 my-4 h-px bg-nexoraBorder/60" />

        {/* Skill tree */}
        <div className="flex-1 overflow-y-auto px-6" style={{ maxHeight: 340 }}>
          {isLoading ? (
            <SkillTreeSkeleton />
          ) : isError ? (
            <div className="rounded-[9px] border border-dashed border-nexoraBorder bg-white px-3.5 py-4 text-center text-xs font-bold text-nexoraDanger">
              {t('staff_salons.skill_error')}
            </div>
          ) : isEmpty ? (
            <div className="rounded-[9px] border border-dashed border-nexoraBorder bg-white px-3.5 py-4 text-center text-xs font-bold text-nexoraMuted">
              {t('staff_salons.skill_empty')}
            </div>
          ) : (
            <>
              {/* Select all toolbar */}
              <button
                type="button"
                onClick={() => toggleAll(!allChecked)}
                className="mb-2 flex w-full cursor-pointer items-center justify-between gap-2 rounded-[9px] border border-nexoraBrand/28 bg-nexoraBrand/5 px-2.5 py-2 text-[11px] font-black text-nexoraText"
              >
                <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                  <input
                    type="checkbox"
                    className="pointer-events-none h-3.5 w-3.5 accent-nexoraBrand"
                    checked={allChecked}
                    ref={(el) => { if (el) el.indeterminate = !allChecked && anyChecked }}
                    readOnly
                  />
                  <span>{t('staff_salons.skill_select_all')}</span>
                </span>
                <span className="shrink-0 rounded-full bg-[#e9edff] px-1.5 py-0.5 text-[10px] font-extrabold text-nexoraBrand">
                  {totalServices}
                </span>
              </button>

              {/* Category groups */}
              {catalog.map((cat) => {
                const catCheckedCount = cat.services.filter((s) => selected.has(s.id)).length
                const catAllChecked = catCheckedCount === cat.services.length
                const catPartial = catCheckedCount > 0 && !catAllChecked
                const isOpen = openGroups.has(cat.key)

                return (
                  <div key={cat.key} className="mb-2 overflow-hidden rounded-[10px] border border-nexoraBorder bg-white last:mb-0">
                    <button
                      type="button"
                      onClick={() => toggleGroup(cat.key)}
                      className="flex w-full items-center gap-2 bg-[#f8faff] px-2.5 py-2"
                    >
                      <input
                        type="checkbox"
                        className="h-3.5 w-3.5 shrink-0 accent-nexoraBrand"
                        checked={catAllChecked}
                        ref={(el) => { if (el) el.indeterminate = catPartial }}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => toggleCategory(cat.key, e.target.checked)}
                      />
                      <span className="min-w-0 truncate text-[10px] font-black uppercase tracking-wider text-nexoraText">
                        {cat.label}
                      </span>
                      <span className="shrink-0 rounded-full bg-[#e9edff] px-1.5 py-0.5 text-[10px] font-extrabold text-nexoraBrand">
                        {cat.services.length}
                      </span>
                      <ChevronDown
                        className={`ml-auto h-3.5 w-3.5 shrink-0 text-nexoraSubtle transition-transform duration-150 ${isOpen ? '' : '-rotate-90'}`}
                      />
                    </button>

                    <div
                      className="overflow-hidden transition-[grid-template-rows] duration-200 ease-in-out"
                      style={{ display: 'grid', gridTemplateRows: isOpen ? '1fr' : '0fr' }}
                    >
                      <div className="min-h-0">
                        <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-1.5 border-t border-nexoraBorder/50 p-2">
                          {cat.services.map((service) => {
                            const checked = selected.has(service.id)
                            return (
                              <label
                                key={service.id}
                                className={`flex min-h-[34px] cursor-pointer items-center gap-1.5 rounded-[9px] border px-2 py-1.5 text-[11px] font-bold transition ${
                                  checked
                                    ? 'border-nexoraBrand/40 bg-nexoraBrand/[.07] text-nexoraText'
                                    : 'border-nexoraBorder bg-white text-nexoraMuted'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  className="h-3.5 w-3.5 shrink-0 accent-nexoraBrand"
                                  checked={checked}
                                  onChange={() => toggleService(service.id)}
                                />
                                <span>{service.name}</span>
                              </label>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </>
          )}
        </div>

        <div className="mx-6 my-4 h-px bg-nexoraBorder/60" />

        {/* Footer */}
        <div className="flex items-center justify-end gap-2.5 px-6 pb-6">
          <button
            type="button"
            onClick={handleClose}
            className="inline-flex h-10 items-center justify-center rounded-[10px] border border-nexoraBorder bg-white px-5 text-[13px] font-bold text-nexoraMuted transition hover:bg-nexoraSurfaceMuted hover:text-nexoraText"
          >
            {t('staff_salons.skill_cancel')}
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saveMutation.isPending || isLoading || isEmpty}
            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-[10px] border border-transparent bg-nexoraBrand px-5 text-[13px] font-bold text-white shadow-md transition hover:bg-nexoraBrand/90 hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saveMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {t('staff_salons.skill_save')}
          </button>
        </div>
      </div>
    </div>
  )
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
  chatMember = null,
  chatUnreadCount = 0,
  showChatStartHint = false,
  onChatStartHintDismiss,
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
  chatMember?: StaffChatMemberLike | null
  chatUnreadCount?: number
  showChatStartHint?: boolean
  onChatStartHintDismiss?: () => void
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
    <div className={`w-full rounded-2xl border border-nexoraBorder/80 bg-white text-left shadow-sm transition hover:border-nexoraBrand/20 hover:shadow-md ${showChatStartHint ? SALON_CARD_PADDING_CLASS.withChatStartHint : SALON_CARD_PADDING_CLASS.default}`}>
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
          {location ? (
            <p className="truncate text-xs font-medium text-nexoraMuted">{location}</p>
          ) : null}
          <div className="flex items-center justify-between gap-2 pt-0.5">
            {canUnlink ? (
              <button
                type="button"
                onClick={() => onUnlink?.()}
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
          <div className="flex min-w-0 flex-1 items-center gap-2 py-1">
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
          <div className="flex shrink-0 items-center gap-1">
            {chatMember ? (
              <StaffCommunityChatActionButton
                member={chatMember}
                unreadCount={chatUnreadCount}
                showStartHint={showChatStartHint}
                onStartHintDismiss={onChatStartHintDismiss}
                manageLabelKey={STAFF_CHAT_I18N.salonManage}
                manageUnreadLabelKey={STAFF_CHAT_I18N.salonManageUnread}
                hintPlacement={SALON_CHAT_START_HINT_PLACEMENT}
              />
            ) : null}
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
        </div>
      ) : null}
    </div>
  )
}

export default function StaffMySalons() {
  const { t, currentLanguage } = useTranslation()
  const navigate = useNavigate()
  const { showToast, showConfirm } = useNotification()
  const { data: staffProfile } = useStaffProfile()
  const setNicknameMutation = useSetStaffBusinessNickname()
  const { data: pendingLinkRequests = [] } = useStaffLinkRequestsList()
  const unlinkBusiness = useUnlinkStaffBusiness()
  const [unlinkError, setUnlinkError] = useState<{ title: string; message: string } | null>(null)
  const { data: businesses = [], isPending, refetch: refetchBusinesses } = useStaffBusinesses()
  const salons = useMemo(() => {
    const visibleBusinesses = businesses.filter((business) => {
      const statusLabel = resolveStaffBusinessLinkStatusLabel(business).trim().toLowerCase()
      const isPreviousOrInactive = (
        statusLabel === STAFF_BUSINESS_LINK_STATUS.inactive
        || statusLabel === STAFF_BUSINESS_LINK_STATUS.previous
        || statusLabel.includes(STAFF_BUSINESS_LINK_STATUS.inactive)
        || statusLabel.includes(STAFF_BUSINESS_LINK_STATUS.previous)
      )
      return !isPreviousOrInactive
    })
    return sortSalonBusinesses(visibleBusinesses)
  }, [businesses])
  const salonChatMemberById = useMemo(
    () => getSalonChatMemberByBusinessId(salons),
    [salons],
  )
  const chatPeers = useMemo(
    () => Object.values(salonChatMemberById),
    [salonChatMemberById],
  )
  const { showStartHintForMember, dismissChatStartHint } = useStaffListChatStartHint(chatPeers)
  const { getUnreadCount: getSalonChatUnreadCount } = useStaffCommunityChatUnreadByPeerId({
    enabled: chatPeers.length > 0,
  })
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

      {pendingLinkRequests.length > 0 && (
        <section className="rounded-2xl border border-nexoraBorder bg-nexoraSurface p-4 shadow-sm">
          <h3 className="mb-3 text-base font-extrabold text-nexoraText">
            {t('staff_dashboard.qr.link_requests_title')}
          </h3>
          <div className="space-y-2">
            {pendingLinkRequests.map((request) => (
              <StaffLinkRequestCard key={request.id} request={request} />
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
          {salons.map((business, index) => {
            const chatMember = salonChatMemberById[business.businessId] ?? null
            return (
            <SalonCard
              key={business.businessId}
              business={business}
              index={index}
              currentLanguage={currentLanguage}
              t={t}
              originalName={originalName}
              chatMember={chatMember}
              chatUnreadCount={chatMember ? getSalonChatUnreadCount(chatMember) : 0}
              showChatStartHint={Boolean(chatMember && showStartHintForMember(chatMember))}
              onChatStartHintDismiss={dismissChatStartHint}
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
            )
          })}
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
