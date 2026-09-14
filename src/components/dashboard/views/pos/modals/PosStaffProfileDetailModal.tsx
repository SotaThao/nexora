import TechnicianTinFields from '../../TechnicianTinFields'
import { TechnicianDialogHeader, TechnicianDialogActions } from '../../TechnicianDialogChrome'
// PosStaffProfileDetailModal — POS > Staff Profiles (US-019) detail popup: Tax Filing
// (shared with TaxIQ per CLAUDE.md's "Module Independence & Shared Data" principle),
// Role/Pay/Tips, Service Assignment, and Weekly Schedule.
import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown, Send } from 'lucide-react'
import { PersonCardIcon, ServicesListIcon, RolePayIcon, CalendarWeekIcon, TaxFilingIcon } from '../../TechnicianFormControls'
import TechnicianProfileFields from '../../TechnicianProfileFields'
import TechnicianPayFields from '../../TechnicianPayFields'
import TechnicianWeeklySchedule from '../../TechnicianWeeklySchedule'
import { useTranslation } from '../../../../../contexts/LanguageContext'
import { useNotification } from '../../../../../contexts/NotificationContext'
import { getApiErrorCode } from '../../../../../types/domain'
import { getErrorI18nKey } from '../../../../../data/errorCodes'
import { formatTurnCredit } from '../TurnGridView'
import { usePosRoles } from '../../../../../data/hooks/usePosRoles'
import { usePosStaffLevels } from '../../../../../data/hooks/usePosStaffLevels'
import { usePosCategories } from '../../../../../data/hooks/usePosCategories'
import { usePosServices } from '../../../../../data/hooks/usePosServices'
import {
  useSaveStaffPosProfile,
  useSaveStaffServiceAssignments,
  useSetStaffPosStatus,
  useStaffPosProfile,
  useStaffServiceAssignments,
  useStaffWeeklySchedule,
  useUpdateStaffPosContractType,
  useUpdateStaffWeeklySchedule,
} from '../../../../../data/hooks/usePosStaffProfile'
import { useSetStaffTin } from '../../../../../data/hooks/useTaxiqOwnerPayouts'
import { useOwnerTaxYearByBusiness } from '../../../../../data/hooks/useTaxiqOwnerTaxYear'
import '../../booking-hub.css'
import TechnicianServiceSelector from '../../TechnicianServiceSelector'
import { useUpdateLocalStaff } from '../../../../../data/hooks/useLocalStaff'
import { useSetMerchantStaffNickname } from '../../../../../data/hooks/useMerchantStaff'
import { splitFullName } from '../../../../../utils/staffName'
import { isValidPhoneE164, normalizePhoneE164, parsePhone } from '../../../../CountryCodeSelect'
import { SkeletonList } from '../../../../ui/skeleton'
import type { WeeklyScheduleEditorDay } from '../WeeklyScheduleEditor'
import StaffW4InviteModal from '../../taxiq/modals/StaffW4InviteModal'

const PAY_STRUCTURE_TYPES = ['Commission', 'WeeklySalary', 'AgreedAmount'] as const
type PayStructureType = (typeof PAY_STRUCTURE_TYPES)[number]
const SHOW_LOCAL_TAX_INVITE = false

// Booth Renter is a valid TaxIQ contract type but is deliberately not offered here (ticket AC).
const POS_CONTRACT_TYPES = ['W2', 'C1099'] as const
type PosContractType = (typeof POS_CONTRACT_TYPES)[number]

// Whether the staff member is on shift at all — independent of Turn Board's
// Empty/InService (which is about being busy with a customer right now).
const POS_STAFF_STATUSES = ['Active', 'Off', 'Locked'] as const
type PosStaffStatusType = (typeof POS_STAFF_STATUSES)[number]

// Weekly Schedule (US-09). dayOfWeek is "Sunday".."Saturday" (verified against the live
// API response — the same string form Business Hours/US-02 uses), reusing the same
// Sunday-first day order and i18n day-name keys.
const DAY_ORDER = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

// <input type="time"> works with "HH:mm"; the API uses TimeOnly ("HH:mm:ss").
const toApiScheduleTime = (hhmm: string): string | null => (hhmm ? `${hhmm}:00` : null)
const fromApiScheduleTime = (hhmmss?: string | null): string => (hhmmss ? hhmmss.slice(0, 5) : '')


export default function PosStaffProfileDetailModal({
  businessId,
  linkId,
  staffLabel,
  staffAvatar,
  staffPosition,
  staffContact,
  staffInfo,
  onClose,
}: {
  businessId?: string
  linkId: string
  staffLabel: string
  staffAvatar?: string | null
  staffPosition?: string | null
  staffContact?: string | null
  staffInfo?: {
    staffProfileId?: string | null
    staffCode?: string | null
    isLocalStaff?: boolean
    fullName: string
    displayName: string | null
    phone: string | null
    email: string | null
    position: string | null
    bio?: string | null
    avatar: string | null
  }
  onClose: () => void
}) {
  const { t } = useTranslation()
  const { showToast } = useNotification()

  const updateLocalStaff = useUpdateLocalStaff()
  const setStaffNickname = useSetMerchantStaffNickname()
  const [draftName, setDraftName] = useState(staffInfo?.displayName || staffInfo?.fullName || staffLabel)
  const [draftPhone, setDraftPhone] = useState(staffInfo?.phone || '')
  const [draftEmail, setDraftEmail] = useState(staffInfo?.email || '')
  const contactHydrated = useRef(Boolean(staffInfo))
  const canEditLocalContact = Boolean(staffInfo?.isLocalStaff && staffInfo.staffProfileId)
  const canEditLinkedNickname = staffInfo?.isLocalStaff === false
  const canEditName = canEditLocalContact || canEditLinkedNickname
  const parsedPhone = parsePhone(draftPhone)
  useEffect(() => {
    if (!staffInfo || contactHydrated.current) return
    contactHydrated.current = true
    setDraftName(staffInfo.displayName || staffInfo.fullName)
    setDraftPhone(staffInfo.phone || '')
    setDraftEmail(staffInfo.email || '')
  }, [staffInfo])

  const rolesQuery = usePosRoles()
  const levelsQuery = usePosStaffLevels()
  const profileQuery = useStaffPosProfile(linkId)
  const saveProfile = useSaveStaffPosProfile()
  const updateContractType = useUpdateStaffPosContractType()
  const setTin = useSetStaffTin()
  const [taxDraft, setTaxDraft] = useState<{ field: 'ssn' | 'ein'; value: string }>({ field: 'ssn', value: '' })
  const [contractTypeDirty, setContractTypeDirty] = useState(false)
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const savingRef = useRef(false)
  const hydrated = useRef({ profile: false, assignments: false, schedule: false })
  const setStaffStatus = useSetStaffPosStatus()

  const categoriesQuery = usePosCategories()
  const servicesQuery = usePosServices()
  const assignmentsQuery = useStaffServiceAssignments(linkId)
  const saveAssignments = useSaveStaffServiceAssignments()

  const profile = profileQuery.data
  const isLocalStaff = profile != null && profile.staffUserId == null
  const currentTaxYearQuery = useOwnerTaxYearByBusiness(
    isLocalStaff && SHOW_LOCAL_TAX_INVITE ? businessId : undefined,
    new Date().getFullYear(),
  )
  const currentOwnerTaxYear = currentTaxYearQuery.data?.items?.[0]
  const hasSavedLocalEmail = Boolean(staffInfo?.email?.trim())
  const [isTaxInviteOpen, setIsTaxInviteOpen] = useState(false)
  const categories = categoriesQuery.data ?? []
  const services = servicesQuery.data ?? []
  const assignments = assignmentsQuery.data
  // Profile row only exists once "Role, Pay & Tips" has been saved at least once — the
  // backend requires an existing PosStaffProfile before it will accept a services PUT.
  const hasSavedProfile = profile?.posRoleId != null

  // Unlike useStaffServiceAssignments (backend returns [] gracefully when no profile
  // exists yet), GetStaffWeeklyScheduleQuery throws POS_STAFF_PROFILE_NOT_FOUND — so this
  // query must not fire until hasSavedProfile, or every unselected/not-yet-set-up staff
  // logs a 404 network error even though the UI already hides the section.
  const scheduleQuery = useStaffWeeklySchedule(hasSavedProfile ? linkId : undefined)
  const saveSchedule = useUpdateStaffWeeklySchedule()

  const serviceSections = useMemo(() => {
    const sections = categories.map((category) => ({
      id: category.id, name: category.name,
      services: services.filter((service) => service.categoryIds.includes(category.id)),
    })).filter((section) => section.services.length > 0)
    const categoryIds = new Set(categories.map((category) => category.id))
    const other = services.filter((service) => !service.categoryIds.some((id) => categoryIds.has(id)))
    if (other.length) sections.push({ id: 'uncategorized', name: t('components.dashboard.views.pos.PosServicesView.otherServices'), services: other })
    return sections
  }, [categories, services, t])

  const [posRoleId, setPosRoleId] = useState('')
  const [staffLevelId, setStaffLevelId] = useState('')
  const [payStructureType, setPayStructureType] = useState<PayStructureType>('Commission')
  const [commissionPercent, setCommissionPercent] = useState('')
  const [weeklySalaryAmount, setWeeklySalaryAmount] = useState('')
  const [agreedAmount, setAgreedAmount] = useState('')
  const [tipsEnabled, setTipsEnabled] = useState(false)
  const [contractType, setContractType] = useState<PosContractType>('W2')
  const [status, setStatus] = useState<PosStaffStatusType>('Active')

  const [checkedServiceIds, setCheckedServiceIds] = useState<Set<string>>(new Set())

  const [scheduleForm, setScheduleForm] = useState<WeeklyScheduleEditorDay[]>(() => DAY_ORDER.map((dayOfWeek) => ({ dayOfWeek, isWorking: false, startTime: '09:00', endTime: '19:00' })))
  const [scheduleErrors, setScheduleErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!assignments || hydrated.current.assignments) return
    hydrated.current.assignments = true
    setCheckedServiceIds(new Set(assignments))
  }, [assignments])

  useEffect(() => {
    const data = scheduleQuery.data
    if (!data || hydrated.current.schedule) return
    hydrated.current.schedule = true
    setScheduleForm(
      [...data]
        .sort((a, b) => DAY_ORDER.indexOf(a.dayOfWeek) - DAY_ORDER.indexOf(b.dayOfWeek))
        .map((day) => ({
          dayOfWeek: day.dayOfWeek,
          isWorking: !day.isDayOff,
          startTime: fromApiScheduleTime(day.startTime),
          endTime: fromApiScheduleTime(day.endTime),
        })),
    )
  }, [scheduleQuery.data])

  useEffect(() => {
    if (!profile || hydrated.current.profile) return
    hydrated.current.profile = true
    setPosRoleId(profile.posRoleId ?? '')
    setStaffLevelId(profile.staffLevelId ?? '')
    setPayStructureType(
      PAY_STRUCTURE_TYPES.includes(profile.payStructureType as PayStructureType)
        ? (profile.payStructureType as PayStructureType)
        : 'Commission',
    )
    setCommissionPercent(profile.commissionPercent != null ? String(profile.commissionPercent) : '')
    setWeeklySalaryAmount(profile.weeklySalaryAmount != null ? String(profile.weeklySalaryAmount) : '')
    setAgreedAmount(profile.agreedAmount != null ? String(profile.agreedAmount) : '')
    setTipsEnabled(profile.tipsEnabled)
    if (POS_CONTRACT_TYPES.includes(profile.contractType as PosContractType)) {
      setContractType(profile.contractType as PosContractType)
    }
    if (POS_STAFF_STATUSES.includes(profile.status as PosStaffStatusType)) {
      setStatus(profile.status as PosStaffStatusType)
    }
  }, [profile])

  const handleSaveAll = async () => {
    if (!posRoleId || savingRef.current) return
    if (canEditName && !draftName.trim()) {
      showToast(t('components.dashboard.views.BookingHubView.team.technicianNameRequired'), 'error')
      return
    }
    if (canEditLocalContact && draftEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draftEmail.trim())) {
      showToast(t('components.dashboard.views.BookingHubView.team.invalidEmail'), 'error')
      return
    }
    if (canEditLocalContact && parsedPhone.nationalNumber.replace(/\D/g, '') && !isValidPhoneE164(draftPhone, parsedPhone.countryCode)) {
      showToast(t('setup.errors.staff_phone_invalid'), 'error')
      return
    }
    const errors: Record<string, string> = {}
    scheduleForm.forEach((day) => {
      if (!day.isWorking) return
      if (!day.startTime || !day.endTime) errors[day.dayOfWeek] = 'required'
      else if (day.endTime <= day.startTime) errors[day.dayOfWeek] = 'invalidRange'
    })
    setScheduleErrors(errors)
    if (Object.keys(errors).length > 0) return
    const payAmount = payStructureType === 'Commission' ? commissionPercent : payStructureType === 'WeeklySalary' ? weeklySalaryAmount : agreedAmount
    if (!payAmount.trim() || !Number.isFinite(Number(payAmount)) || Number(payAmount) < 0 || (payStructureType === 'Commission' && Number(payAmount) > 100)) {
      showToast(t(payStructureType === 'Commission' ? 'errors.pos_staff_commission_percent_invalid' : 'errors.pos_staff_pay_amount_invalid'), 'error')
      return
    }
    const tinValue = taxDraft.value.trim()
    if (tinValue && tinValue.replace(/\D/g, '').length !== 9) {
      showToast(t(`taxiq.taxProfile.errors.${taxDraft.field}Format`), 'error')
      return
    }
    const taxPayload = profile?.staffUserId && tinValue && !profile[taxDraft.field]
      ? { staffUserId: profile.staffUserId, [taxDraft.field]: tinValue }
      : null
    const shouldSaveContract = contractTypeDirty && profile?.staffUserId && profile.taxYearAvailable
    const nextContractType = contractType
    savingRef.current = true
    setIsSavingProfile(true)
    try {
      const currentDisplayName = staffInfo?.displayName || staffInfo?.fullName || ''
      if (canEditLocalContact && staffInfo && (draftName !== currentDisplayName || draftPhone !== (staffInfo.phone || '') || draftEmail !== (staffInfo.email || ''))) {
        await updateLocalStaff.mutateAsync({
          staffProfileId: staffInfo.staffProfileId!,
          params: {
            displayName: draftName.trim(),
            ...splitFullName(draftName === (staffInfo.displayName || staffInfo.fullName) ? staffInfo.fullName : draftName.trim()),
            phoneNumber: parsedPhone.nationalNumber.replace(/\D/g, '') ? normalizePhoneE164(draftPhone, parsedPhone.countryCode) : null,
            email: draftEmail.trim() || null,
            position: staffInfo.position,
            bio: staffInfo.bio ?? null,
            photoUrl: staffInfo.avatar,
          },
        })
      }
      if (canEditLinkedNickname && staffInfo && draftName !== currentDisplayName) {
        await setStaffNickname.mutateAsync({
          staffLinkId: linkId,
          staffCode: staffInfo.staffCode || '',
          nickname: draftName.trim(),
        })
      }
      await saveProfile.mutateAsync({
        businessStaffLinkId: linkId,
        posRoleId,
        staffLevelId: staffLevelId || null,
        payStructureType,
        commissionPercent: payStructureType === 'Commission' ? Number(commissionPercent) : null,
        weeklySalaryAmount: payStructureType === 'WeeklySalary' ? Number(weeklySalaryAmount) : null,
        agreedAmount: payStructureType === 'AgreedAmount' ? Number(agreedAmount) : null,
        tipsEnabled,
      })
      if (taxPayload) await setTin.mutateAsync(taxPayload)
      if (shouldSaveContract) {
        await updateContractType.mutateAsync({ businessStaffLinkId: linkId, contractType: nextContractType })
        setContractTypeDirty(false)
      }
      await saveAssignments.mutateAsync({ businessStaffLinkId: linkId, posServiceIds: Array.from(checkedServiceIds) })
      await saveSchedule.mutateAsync({
        businessStaffLinkId: linkId,
        days: scheduleForm.map((day) => ({
          dayOfWeek: day.dayOfWeek,
          isDayOff: !day.isWorking,
          startTime: day.isWorking ? toApiScheduleTime(day.startTime) : null,
          endTime: day.isWorking ? toApiScheduleTime(day.endTime) : null,
        })),
      })
      if (hasSavedProfile && status !== profile?.status) {
        await setStaffStatus.mutateAsync({ businessStaffLinkId: linkId, status })
      }
      showToast(t('components.dashboard.views.pos.PosStaffProfileView.profileSavedSuccess'), 'success')
      onClose()
    } catch (err) {
      showToast(t(getErrorI18nKey(getApiErrorCode(err))), 'error')
    } finally {
      savingRef.current = false
      setIsSavingProfile(false)
    }
  }

  const handleToggleScheduleDay = (dayOfWeek: string) => {
    setScheduleForm((current) =>
      current.map((day) => (day.dayOfWeek === dayOfWeek ? { ...day, isWorking: !day.isWorking } : day)),
    )
    setScheduleErrors((current) => {
      if (!current[dayOfWeek]) return current
      const next = { ...current }
      delete next[dayOfWeek]
      return next
    })
  }

  const handleChangeScheduleStart = (dayOfWeek: string, value: string) => {
    setScheduleForm((current) =>
      current.map((day) => (day.dayOfWeek === dayOfWeek ? { ...day, startTime: value } : day)),
    )
  }

  const handleChangeScheduleEnd = (dayOfWeek: string, value: string) => {
    setScheduleForm((current) =>
      current.map((day) => (day.dayOfWeek === dayOfWeek ? { ...day, endTime: value } : day)),
    )
  }

  return (
    <div className="booking-hub-view fixed inset-0 z-[120]">
      <div className="tech-modal" data-tech-mode="edit">
        <div
          className="tech-dialog"
          role="dialog"
          aria-modal="true"
          aria-busy={isSavingProfile}
          aria-labelledby="pos-technician-info-title"
        >
          <TechnicianDialogHeader
            title={t('components.dashboard.views.BookingHubView.team.modalTitleEdit')}
            subtitle={t('components.dashboard.views.BookingHubView.team.modalSubEdit', { name: draftName || staffLabel })}
            titleId="pos-technician-info-title"
            isSaving={isSavingProfile}
            onClose={onClose}
          />

          <div className="tech-modal-body"
            ref={(element) => { if (element) element.inert = isSavingProfile }}>
            {profileQuery.isLoading ? (
              <SkeletonList count={3} lines={2} />
            ) : profile ? (
              <>
                <div className="tech-modal-section tech-pos-profile-section">
                  <h3 className="tech-modal-section-title">
                    <PersonCardIcon />
                    {t('components.dashboard.views.BookingHubView.team.profileDetails')}
                  </h3>
                  <TechnicianProfileFields
                    draft={{ name: draftName, phone: draftPhone, email: draftEmail }}
                    readOnlyFields={{
                      name: !canEditName,
                      phone: !canEditLocalContact,
                      email: !canEditLocalContact,
                    }}
                    onChange={(patch) => {
                      if (patch.name !== undefined) setDraftName(patch.name)
                      if (patch.phone !== undefined) setDraftPhone(patch.phone)
                      if (patch.email !== undefined) setDraftEmail(patch.email)
                    }}
                  />
                  {!canEditLocalContact && (
                    <p className="mt-2 rounded-lg border border-nexoraBorder bg-nexoraCanvas px-3 py-2 text-xs leading-relaxed text-nexoraMuted" role="note">
                      {t('components.dashboard.views.pos.PosStaffProfileView.accountContactManagedByStaff')}
                    </p>
                  )}
                  {hasSavedProfile && (
                    <div className="mt-2 flex flex-wrap items-end gap-x-8 gap-y-3">
                      <div>
                        <span id="pos-staff-status-label" className="settings-label">
                          {t('components.dashboard.views.pos.PosStaffProfileView.statusLabel')}
                        </span>
                        <div
                          role="group"
                          aria-labelledby="pos-staff-status-label"
                          className="mt-1.5 grid w-fit max-w-full grid-cols-3 gap-1 rounded-xl border border-nexoraBorder bg-nexoraCanvas p-1"
                        >
                          {POS_STAFF_STATUSES.map((option) => (
                            <button
                              key={option}
                              type="button"
                              aria-pressed={status === option}
                              onClick={() => setStatus(option)}
                              disabled={setStaffStatus.isPending}
                              className={`min-h-9 rounded-lg px-4 py-2 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nexoraBrand focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${
                                status === option
                                  ? 'bg-nexoraBrand text-white shadow-sm'
                                  : 'text-nexoraMuted hover:bg-white hover:text-nexoraText'
                              }`}
                            >
                              {t(`components.dashboard.views.pos.PosStaffProfileView.staffStatus.${option}`)}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <span className="settings-label">
                          {t('components.dashboard.views.pos.PosStaffProfileView.turnsTodayLabel')}
                        </span>
                        <div className="mt-1.5 min-h-9 content-center text-sm font-bold text-nexoraText">
                          {`${formatTurnCredit(profile.weightedTurnsToday)}T`}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div className="tech-modal-section tech-pos-pay-section">
                  <h3 className="tech-modal-section-title">
                    <RolePayIcon />
                    {t('components.dashboard.views.pos.PosStaffProfileView.rolePayTipsTitle')}
                  </h3>

                  <TechnicianPayFields
                    draft={{ roleId: posRoleId, staffLevelId, payStructureType, commissionPercent, weeklySalaryAmount, agreedAmount, tipsEnabled }}
                    roles={rolesQuery.data ?? []}
                    levels={levelsQuery.data ?? []}
                    onChange={(patch) => {
                      if (patch.roleId !== undefined) setPosRoleId(patch.roleId)
                      if (patch.staffLevelId !== undefined) setStaffLevelId(patch.staffLevelId)
                      if (patch.payStructureType !== undefined) setPayStructureType(patch.payStructureType)
                      if (patch.commissionPercent !== undefined) setCommissionPercent(patch.commissionPercent)
                      if (patch.weeklySalaryAmount !== undefined) setWeeklySalaryAmount(patch.weeklySalaryAmount)
                      if (patch.agreedAmount !== undefined) setAgreedAmount(patch.agreedAmount)
                      if (patch.tipsEnabled !== undefined) setTipsEnabled(patch.tipsEnabled)
                    }}
                  />



                </div>

                <div className="tech-modal-section">
                  <h3 className="tech-modal-section-title">
                    <TaxFilingIcon />
                    {t('components.dashboard.views.pos.PosStaffProfileView.taxFilingTitle')}
                  </h3>
                  {profile.staffUserId == null ? (
                    <div className="space-y-3">
                      <p className="text-xs leading-relaxed text-nexoraMuted">
                        {t('components.dashboard.views.pos.PosStaffProfileView.taxFilingSecureInvitationRequired')}
                      </p>
                      {SHOW_LOCAL_TAX_INVITE ? (
                        <>
                          <p className="text-xs leading-relaxed text-nexoraMuted">
                            {t('components.dashboard.views.pos.PosStaffProfileView.taxFilingAccountRequired')}
                          </p>
                          <button
                            type="button"
                            disabled={!currentOwnerTaxYear || !hasSavedLocalEmail || currentTaxYearQuery.isLoading}
                            aria-describedby={!hasSavedLocalEmail ? 'pos-tax-invite-email-required' : !currentOwnerTaxYear && !currentTaxYearQuery.isLoading ? 'pos-tax-invite-year-required' : undefined}
                            onClick={() => setIsTaxInviteOpen(true)}
                            className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-nexoraBrand px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-nexoraBrandDark disabled:cursor-not-allowed disabled:bg-nexoraCanvas disabled:text-nexoraMuted"
                          >
                            <Send aria-hidden="true" className="h-4 w-4" />
                            {t('taxiq.w4Invite.form.inviteButton')}
                          </button>
                          {!hasSavedLocalEmail ? (
                            <p id="pos-tax-invite-email-required" className="text-xs text-nexoraMuted">
                              {t('components.dashboard.views.pos.PosStaffProfileView.taxInviteEmailRequired')}
                            </p>
                          ) : !currentOwnerTaxYear && !currentTaxYearQuery.isLoading ? (
                            <p id="pos-tax-invite-year-required" className="text-xs text-nexoraMuted">
                              {t('components.dashboard.views.pos.PosStaffProfileView.taxInviteTaxYearRequired')}
                            </p>
                          ) : null}
                        </>
                      ) : null}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 items-start gap-3 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
                      <TechnicianTinFields
                        key={profile.staffUserId}
                        ssn={profile.ssn}
                        ein={profile.ein}
                        staffKey={linkId}
                        disabled={isSavingProfile}
                        onDraftChange={setTaxDraft}
                      />

                      <div className="min-w-0">
                          <label className="settings-label mb-2 block" htmlFor="pos-staff-contract-type">
                            {t('components.dashboard.views.pos.PosStaffProfileView.contractTypeLabel')}
                          </label>
                          <div className="relative">
                          <select
                            id="pos-staff-contract-type"
                            value={contractType}
                            disabled={!profile.taxYearAvailable || isSavingProfile}
                            aria-describedby={!profile.taxYearAvailable ? 'pos-contract-unavailable' : undefined}
                            onChange={(e) => {
                              setContractType(e.target.value as PosContractType)
                              setContractTypeDirty(true)
                            }}
                            className="block h-[42px] w-full appearance-none rounded-lg border border-nexoraBorder bg-white pl-3 pr-9 text-sm font-semibold text-nexoraText focus:border-nexoraBrand focus:outline-none focus:ring-2 focus:ring-nexoraBrand/20 disabled:cursor-not-allowed disabled:bg-nexoraCanvas disabled:opacity-60"
                          >
                            {POS_CONTRACT_TYPES.map((type) => (
                              <option key={type} value={type}>
                                {t(`taxiq.payoutCenter.contractTypes.${type}`)}
                              </option>
                            ))}
                          </select>
                          <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-nexoraMuted" />
                          </div>
                        {!profile.taxYearAvailable && (
                          <p id="pos-contract-unavailable" className="mt-2 text-xs text-nexoraMuted">
                            {t('components.dashboard.views.pos.PosStaffProfileView.contractTypeUnavailableNotice')}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="tech-modal-section tech-services-section">
                  <h3 className="tech-modal-section-title">
                    <ServicesListIcon />
                    {t('components.dashboard.views.BookingHubView.team.services')}
                  </h3>
                  {assignmentsQuery.isLoading || servicesQuery.isLoading || categoriesQuery.isLoading ? (
                    <SkeletonList count={3} lines={1} />
                  ) : serviceSections.length ? (
                    <TechnicianServiceSelector serviceSections={serviceSections} selectedIds={checkedServiceIds} onChange={setCheckedServiceIds} />
                  ) : (
                    <div className="tech-service-empty">{t('components.dashboard.views.BookingHubView.team.servicesEmpty')}</div>
                  )}
                </div>

                <div className="tech-modal-section" data-tech-schedule-section>
                  <h3 className="tech-modal-section-title">
                    <CalendarWeekIcon />
                    {t('components.dashboard.views.pos.PosStaffProfileView.weeklyScheduleTitle')}
                  </h3>

                  {hasSavedProfile && scheduleQuery.isLoading ? (
                    <SkeletonList count={3} lines={1} />
                  ) : (
                    <>
                      <TechnicianWeeklySchedule
                        days={[...scheduleForm].sort((a, b) => ((DAY_ORDER.indexOf(a.dayOfWeek) + 6) % 7) - ((DAY_ORDER.indexOf(b.dayOfWeek) + 6) % 7)).map((day) => ({
                          id: day.dayOfWeek,
                          label: t(`components.dashboard.views.BookingHubView.team.days.${day.dayOfWeek.slice(0, 3).toLowerCase()}`),
                          dayOff: !day.isWorking,
                          start: day.startTime,
                          end: day.endTime,
                          error: scheduleErrors[day.dayOfWeek] ? t(`components.settings.tabs.ProfileTab.validation.${scheduleErrors[day.dayOfWeek]}`) : undefined,
                        }))}
                        onDayOffChange={(day) => handleToggleScheduleDay(day)}
                        onTimeChange={(day, field, value) => field === 'start' ? handleChangeScheduleStart(day, value) : handleChangeScheduleEnd(day, value)}
                      />

                    </>
                  )}
                </div>
              </>
            ) : null}
          </div>
          <TechnicianDialogActions
            isSaving={isSavingProfile}
            saveDisabled={!posRoleId || profileQuery.isLoading || profileQuery.isError || assignmentsQuery.isLoading || assignmentsQuery.isError || servicesQuery.isLoading || (hasSavedProfile && (scheduleQuery.isLoading || scheduleQuery.isError))}
            onClose={onClose}
            onSave={() => void handleSaveAll()}
          />
        </div>
      </div>
      {SHOW_LOCAL_TAX_INVITE && currentOwnerTaxYear ? (
        <StaffW4InviteModal
          open={isTaxInviteOpen}
          onClose={() => setIsTaxInviteOpen(false)}
          ownerTaxYearId={currentOwnerTaxYear.id}
          businessStaffLinkId={linkId}
          staffDisplayName={draftName.trim() || staffLabel}
        />
      ) : null}
    </div>
  )
}
