// PosStaffProfileView — POS > Staff Profiles (US-019). Master-detail: picker of
// Active staff on the left (reuses the existing merchant staff list hook — no new
// staff-listing endpoint), POS profile form on the right split into two independently
// saved sections: "Tax Filing" (SSN/EIN — fill in only when empty — and W-2/1099
// contract type, both shared with TaxIQ per CLAUDE.md's "Module Independence & Shared
// Data" principle) and "Role, Pay & Tips" (role/pay-structure/tips, never depends on
// TaxIQ setup state).
import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useTranslation } from '../../../../contexts/LanguageContext'
import { useNotification } from '../../../../contexts/NotificationContext'
import { getApiErrorCode } from '../../../../types/domain'
import { getErrorI18nKey } from '../../../../data/errorCodes'
import { useMerchantStaff } from '../../../../data/hooks/useMerchantStaff'
import { usePosRoles } from '../../../../data/hooks/usePosRoles'
import { usePosCategories } from '../../../../data/hooks/usePosCategories'
import { usePosServices } from '../../../../data/hooks/usePosServices'
import {
  useSaveStaffPosProfile,
  useSaveStaffServiceAssignments,
  useSetStaffPosStatus,
  useStaffPosProfile,
  useStaffServiceAssignments,
  useStaffWeeklySchedule,
  useUpdateStaffPosContractType,
  useUpdateStaffWeeklySchedule,
} from '../../../../data/hooks/usePosStaffProfile'
import { useSetStaffTin } from '../../../../data/hooks/useTaxiqOwnerPayouts'
import type { SetStaffTinParams } from '../../../../data/repositories/taxiqOwnerPayouts'
import ToggleSwitch from '../../../ui/ToggleSwitch'
import { SkeletonList } from '../../../ui/skeleton'
import WeeklyScheduleEditor, { type WeeklyScheduleEditorDay } from './WeeklyScheduleEditor'

const PAY_STRUCTURE_TYPES = ['Commission', 'WeeklySalary', 'AgreedAmount'] as const
type PayStructureType = (typeof PAY_STRUCTURE_TYPES)[number]

// Booth Renter is a valid TaxIQ contract type but is deliberately not offered here (ticket AC).
const POS_CONTRACT_TYPES = ['W2', 'C1099'] as const
type PosContractType = (typeof POS_CONTRACT_TYPES)[number]

// Whether the staff member is on shift at all — independent of Turn Board's
// Empty/InService (which is about being busy with a customer right now).
const POS_STAFF_STATUSES = ['Active', 'Off', 'Locked'] as const
type PosStaffStatusType = (typeof POS_STAFF_STATUSES)[number]

// FE-only preset action, never sent to the backend — BE only ever stores the flat,
// fully-resolved PosServiceId list (see ticket US-08's design deviation from BA doc Rule 4).
const ASSIGNMENT_MODES = ['Specific', 'Category', 'All'] as const
type AssignmentMode = (typeof ASSIGNMENT_MODES)[number]

// Weekly Schedule (US-09). dayOfWeek is "Sunday".."Saturday" (verified against the live
// API response — the same string form Business Hours/US-02 uses), reusing the same
// Sunday-first day order and i18n day-name keys.
const DAY_ORDER = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

// <input type="time"> works with "HH:mm"; the API uses TimeOnly ("HH:mm:ss").
const toApiScheduleTime = (hhmm: string): string | null => (hhmm ? `${hhmm}:00` : null)
const fromApiScheduleTime = (hhmmss?: string | null): string => (hhmmss ? hhmmss.slice(0, 5) : '')

interface StaffPickerItem {
  linkId: string | null
  fullName: string
  avatar: string | null
}

function TinField({
  label,
  value,
  staffUserId,
  field,
}: {
  label: string
  value: string | null | undefined
  staffUserId: string
  field: 'ssn' | 'ein'
}) {
  const { t } = useTranslation()
  const { showToast } = useNotification()
  const setTin = useSetStaffTin()
  const [inputValue, setInputValue] = useState('')

  const handleSave = async () => {
    const trimmed = inputValue.trim()
    if (!trimmed) return
    const payload: SetStaffTinParams = { staffUserId }
    if (field === 'ssn') payload.ssn = trimmed
    else payload.ein = trimmed
    try {
      await setTin.mutateAsync(payload)
      setInputValue('')
      showToast(t('components.dashboard.views.pos.PosStaffProfileView.tinSavedSuccess'), 'success')
    } catch (err) {
      showToast(t(getErrorI18nKey(getApiErrorCode(err))), 'error')
    }
  }

  return (
    <div>
      <span className="text-[10px] font-bold uppercase tracking-wide text-nexoraMuted">{label}</span>
      {value ? (
        <div className="font-mono text-sm text-nexoraText">{value}</div>
      ) : (
        <div className="mt-1 flex items-center gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={t('components.dashboard.views.pos.PosStaffProfileView.tinPlaceholder')}
            className="rounded-lg border border-nexoraBorder px-3 py-1.5 text-xs"
          />
          <button
            type="button"
            onClick={handleSave}
            disabled={setTin.isPending || !inputValue.trim()}
            className="inline-flex items-center gap-1 rounded-lg bg-nexoraBrand px-3 py-1.5 text-[11px] font-bold text-white disabled:opacity-60"
          >
            {setTin.isPending && <Loader2 className="h-3 w-3 animate-spin" />}
            {t('components.dashboard.views.pos.PosStaffProfileView.setButton')}
          </button>
        </div>
      )}
    </div>
  )
}

export default function PosStaffProfileView() {
  const { t } = useTranslation()
  const { showToast } = useNotification()
  const [searchParams, setSearchParams] = useSearchParams()
  const selectedLinkId = searchParams.get('staff') ?? undefined

  const staffListQuery = useMerchantStaff({ statusFilter: 'Active', pageSize: 200 })
  const rolesQuery = usePosRoles()
  const profileQuery = useStaffPosProfile(selectedLinkId)
  const saveProfile = useSaveStaffPosProfile()
  const updateContractType = useUpdateStaffPosContractType()
  const setStaffStatus = useSetStaffPosStatus()

  const categoriesQuery = usePosCategories()
  const servicesQuery = usePosServices()
  const assignmentsQuery = useStaffServiceAssignments(selectedLinkId)
  const saveAssignments = useSaveStaffServiceAssignments()

  const staffItems = (staffListQuery.data?.items ?? []) as unknown as StaffPickerItem[]
  const profile = profileQuery.data
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
  const scheduleQuery = useStaffWeeklySchedule(hasSavedProfile ? selectedLinkId : undefined)
  const saveSchedule = useUpdateStaffWeeklySchedule()

  const categoryNameById = useMemo(() => new Map(categories.map((c) => [c.id, c.name])), [categories])

  const [posRoleId, setPosRoleId] = useState('')
  const [payStructureType, setPayStructureType] = useState<PayStructureType>('Commission')
  const [commissionPercent, setCommissionPercent] = useState('')
  const [weeklySalaryAmount, setWeeklySalaryAmount] = useState('')
  const [agreedAmount, setAgreedAmount] = useState('')
  const [tipsEnabled, setTipsEnabled] = useState(false)
  const [contractType, setContractType] = useState<PosContractType>('W2')
  const [status, setStatus] = useState<PosStaffStatusType>('Active')

  const [assignmentMode, setAssignmentMode] = useState<AssignmentMode>('Specific')
  const [selectedCategoryId, setSelectedCategoryId] = useState('')
  const [checkedServiceIds, setCheckedServiceIds] = useState<Set<string>>(new Set())

  const [scheduleForm, setScheduleForm] = useState<WeeklyScheduleEditorDay[]>([])
  const [scheduleErrors, setScheduleErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!assignments) return
    setCheckedServiceIds(new Set(assignments))
  }, [assignments])

  useEffect(() => {
    setAssignmentMode('Specific')
    setSelectedCategoryId('')
    setScheduleErrors({})
  }, [selectedLinkId])

  useEffect(() => {
    const data = scheduleQuery.data
    if (!data) return
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
    if (!profile) return
    setPosRoleId(profile.posRoleId ?? '')
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

  const handleSelect = (linkId: string) => {
    setSearchParams({ staff: linkId })
  }

  const handleSaveProfile = async () => {
    if (!selectedLinkId || !posRoleId) return
    try {
      await saveProfile.mutateAsync({
        businessStaffLinkId: selectedLinkId,
        posRoleId,
        payStructureType,
        commissionPercent: payStructureType === 'Commission' ? Number(commissionPercent) : null,
        weeklySalaryAmount: payStructureType === 'WeeklySalary' ? Number(weeklySalaryAmount) : null,
        agreedAmount: payStructureType === 'AgreedAmount' ? Number(agreedAmount) : null,
        tipsEnabled,
      })
      showToast(t('components.dashboard.views.pos.PosStaffProfileView.profileSavedSuccess'), 'success')
    } catch (err) {
      showToast(t(getErrorI18nKey(getApiErrorCode(err))), 'error')
    }
  }

  const handleChangeStatus = async (newStatus: PosStaffStatusType) => {
    if (!selectedLinkId || newStatus === status) return
    const previousStatus = status
    setStatus(newStatus)
    try {
      await setStaffStatus.mutateAsync({ businessStaffLinkId: selectedLinkId, status: newStatus })
      showToast(t('components.dashboard.views.pos.PosStaffProfileView.statusSavedSuccess'), 'success')
    } catch (err) {
      setStatus(previousStatus)
      showToast(t(getErrorI18nKey(getApiErrorCode(err))), 'error')
    }
  }

  const handleSaveContractType = async () => {
    if (!selectedLinkId) return
    try {
      await updateContractType.mutateAsync({ businessStaffLinkId: selectedLinkId, contractType })
      showToast(t('components.dashboard.views.pos.PosStaffProfileView.contractTypeSavedSuccess'), 'success')
    } catch (err) {
      showToast(t(getErrorI18nKey(getApiErrorCode(err))), 'error')
    }
  }

  const toggleServiceChecked = (serviceId: string) => {
    setCheckedServiceIds((prev) => {
      const next = new Set(prev)
      if (next.has(serviceId)) next.delete(serviceId)
      else next.add(serviceId)
      return next
    })
  }

  const handleAssignmentModeChange = (mode: AssignmentMode) => {
    setAssignmentMode(mode)
    if (mode === 'All') {
      setCheckedServiceIds(new Set(services.filter((s) => s.status === 'Active').map((s) => s.id)))
    }
  }

  const handleCategoryPresetChange = (categoryId: string) => {
    setSelectedCategoryId(categoryId)
    if (!categoryId) return
    setCheckedServiceIds(
      new Set(services.filter((s) => s.status === 'Active' && s.categoryIds.includes(categoryId)).map((s) => s.id)),
    )
  }

  const handleSaveServiceAssignments = async () => {
    if (!selectedLinkId) return
    try {
      await saveAssignments.mutateAsync({
        businessStaffLinkId: selectedLinkId,
        posServiceIds: Array.from(checkedServiceIds),
      })
      showToast(t('components.dashboard.views.pos.PosStaffProfileView.servicesSavedSuccess'), 'success')
    } catch (err) {
      showToast(t(getErrorI18nKey(getApiErrorCode(err))), 'error')
    }
  }

  const dayLabel = (dayOfWeek: string) =>
    t(`components.settings.tabs.ProfileTab.businessHours.days.${dayOfWeek.toLowerCase()}`)

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

  const handleSaveSchedule = async () => {
    if (!selectedLinkId) return

    const errors: Record<string, string> = {}
    scheduleForm.forEach((day) => {
      if (!day.isWorking) return
      if (!day.startTime || !day.endTime) errors[day.dayOfWeek] = 'required'
      else if (day.endTime <= day.startTime) errors[day.dayOfWeek] = 'invalidRange'
    })
    setScheduleErrors(errors)
    if (Object.keys(errors).length > 0) return

    try {
      await saveSchedule.mutateAsync({
        businessStaffLinkId: selectedLinkId,
        days: scheduleForm.map((day) => ({
          dayOfWeek: day.dayOfWeek,
          isDayOff: !day.isWorking,
          startTime: day.isWorking ? toApiScheduleTime(day.startTime) : null,
          endTime: day.isWorking ? toApiScheduleTime(day.endTime) : null,
        })),
      })
      showToast(t('components.dashboard.views.pos.PosStaffProfileView.scheduleSavedSuccess'), 'success')
    } catch (err) {
      showToast(t(getErrorI18nKey(getApiErrorCode(err))), 'error')
    }
  }

  return (
    <div className="space-y-6">
      <section className="space-y-1 px-0.5">
        <h1 className="text-base font-semibold leading-tight text-nexoraText">{t('dashboard.menu.pos_staff')}</h1>
        <p className="text-xs text-nexoraMuted">
          {t('components.dashboard.views.pos.PosStaffProfileView.description')}
        </p>
      </section>

      <div className="grid grid-cols-1 gap-4 lg:items-start lg:grid-cols-[260px_1fr]">
        <div className="nexora-card min-h-[420px] divide-y divide-nexoraRule overflow-hidden p-0">
          {staffListQuery.isLoading ? (
            <div className="p-4">
              <SkeletonList count={4} lines={1} />
            </div>
          ) : staffItems.length === 0 ? (
            <div className="p-4 text-xs text-nexoraMuted">
              {t('components.dashboard.views.pos.PosStaffProfileView.pickerEmpty')}
            </div>
          ) : (
            staffItems.map((member, index) => {
              const linkId = member.linkId ?? ''
              const isSelected = linkId !== '' && linkId === selectedLinkId
              return (
                <button
                  key={linkId || index}
                  type="button"
                  onClick={() => linkId && handleSelect(linkId)}
                  className={`flex w-full items-center gap-2 px-3 py-2.5 text-left text-xs font-semibold transition ${
                    isSelected ? 'bg-nexoraBrand/10 text-nexoraBrand' : 'text-nexoraText hover:bg-nexoraCanvas'
                  }`}
                >
                  {member.avatar ? (
                    <img src={member.avatar} alt="" className="h-6 w-6 rounded-full object-cover" />
                  ) : (
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-nexoraCanvas text-[10px] font-bold text-nexoraMuted">
                      {(member.fullName || '?').slice(0, 1).toUpperCase()}
                    </span>
                  )}
                  <span className="truncate">{member.fullName}</span>
                </button>
              )
            })
          )}
        </div>

        <div className="min-h-[420px] space-y-4">
          {!selectedLinkId ? (
            <div className="nexora-card flex min-h-[420px] items-center justify-center p-6 text-xs text-nexoraMuted">
              {t('components.dashboard.views.pos.PosStaffProfileView.selectStaffPrompt')}
            </div>
          ) : profileQuery.isLoading ? (
            <div className="nexora-card min-h-[420px] p-6">
              <SkeletonList count={3} lines={2} />
            </div>
          ) : profile ? (
            <div className="space-y-4">
              <div className="nexora-card space-y-3 p-5">
                <h3 className="text-xs font-black uppercase tracking-wider text-nexoraText">
                  {t('components.dashboard.views.pos.PosStaffProfileView.taxFilingTitle')}
                </h3>

                {profile.staffUserId == null ? (
                  <p className="text-xs text-nexoraMuted">
                    {t('components.dashboard.views.pos.PosStaffProfileView.noLinkedAccountNotice')}
                  </p>
                ) : (
                  <>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <TinField
                        label={t('components.dashboard.views.pos.PosStaffProfileView.ssnLabel')}
                        value={profile.ssn}
                        staffUserId={profile.staffUserId}
                        field="ssn"
                      />
                      <TinField
                        label={t('components.dashboard.views.pos.PosStaffProfileView.einLabel')}
                        value={profile.ein}
                        staffUserId={profile.staffUserId}
                        field="ein"
                      />
                    </div>

                    {!profile.taxYearAvailable && (
                      <p className="text-xs text-nexoraMuted">
                        {t('components.dashboard.views.pos.PosStaffProfileView.taxYearNotAvailableNotice')}
                      </p>
                    )}

                    <div className="flex flex-wrap items-end gap-2">
                      <div>
                        <label className="text-[10px] font-bold uppercase text-nexoraMuted">
                          {t('components.dashboard.views.pos.PosStaffProfileView.contractTypeLabel')}
                        </label>
                        <select
                          value={contractType}
                          disabled={!profile.taxYearAvailable}
                          onChange={(e) => setContractType(e.target.value as PosContractType)}
                          className="mt-1 block rounded-lg border border-nexoraBorder px-2 py-1.5 text-xs font-semibold disabled:opacity-60"
                        >
                          {POS_CONTRACT_TYPES.map((type) => (
                            <option key={type} value={type}>
                              {t(`taxiq.payoutCenter.contractTypes.${type}`)}
                            </option>
                          ))}
                        </select>
                      </div>
                      <button
                        type="button"
                        onClick={handleSaveContractType}
                        disabled={!profile.taxYearAvailable || updateContractType.isPending}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-nexoraBrand px-3.5 py-2 text-xs font-bold text-white disabled:opacity-60"
                      >
                        {updateContractType.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                        {t('components.dashboard.views.pos.PosStaffProfileView.saveContractType')}
                      </button>
                    </div>
                  </>
                )}
              </div>

              <div className="nexora-card space-y-3 p-5">
                <h3 className="text-xs font-black uppercase tracking-wider text-nexoraText">
                  {t('components.dashboard.views.pos.PosStaffProfileView.rolePayTipsTitle')}
                </h3>

                {hasSavedProfile && (
                  <div>
                    <span className="text-[10px] font-bold uppercase text-nexoraMuted">
                      {t('components.dashboard.views.pos.PosStaffProfileView.statusLabel')}
                    </span>
                    <div className="mt-1 flex w-fit overflow-hidden rounded-lg border border-nexoraBorder">
                      {POS_STAFF_STATUSES.map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => handleChangeStatus(option)}
                          disabled={setStaffStatus.isPending}
                          className={`px-3 py-1.5 text-xs font-semibold transition disabled:opacity-60 ${
                            status === option
                              ? 'bg-nexoraBrand text-white'
                              : 'bg-white text-nexoraText hover:bg-nexoraCanvas'
                          }`}
                        >
                          {t(`components.dashboard.views.pos.PosStaffProfileView.staffStatus.${option}`)}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-[10px] font-bold uppercase text-nexoraMuted">
                    {t('components.dashboard.views.pos.PosStaffProfileView.roleLabel')}
                  </label>
                  <select
                    value={posRoleId}
                    onChange={(e) => setPosRoleId(e.target.value)}
                    className="mt-1 block w-full rounded-lg border border-nexoraBorder px-2 py-1.5 text-xs font-semibold sm:w-64"
                  >
                    <option value="" disabled>
                      —
                    </option>
                    {(rolesQuery.data ?? []).map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-wrap items-end gap-3">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-nexoraMuted">
                      {t('components.dashboard.views.pos.PosStaffProfileView.payStructureLabel')}
                    </label>
                    <select
                      value={payStructureType}
                      onChange={(e) => setPayStructureType(e.target.value as PayStructureType)}
                      className="mt-1 block rounded-lg border border-nexoraBorder px-2 py-1.5 text-xs font-semibold"
                    >
                      {PAY_STRUCTURE_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {t(`components.dashboard.views.pos.PosStaffProfileView.payStructureTypes.${type}`)}
                        </option>
                      ))}
                    </select>
                  </div>

                  {payStructureType === 'Commission' && (
                    <div>
                      <label className="text-[10px] font-bold uppercase text-nexoraMuted">
                        {t('components.dashboard.views.pos.PosStaffProfileView.commissionPercentLabel')}
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={commissionPercent}
                        onChange={(e) => setCommissionPercent(e.target.value)}
                        className="mt-1 block w-28 rounded-lg border border-nexoraBorder px-2 py-1.5 text-xs"
                      />
                    </div>
                  )}
                  {payStructureType === 'WeeklySalary' && (
                    <div>
                      <label className="text-[10px] font-bold uppercase text-nexoraMuted">
                        {t('components.dashboard.views.pos.PosStaffProfileView.weeklySalaryAmountLabel')}
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={weeklySalaryAmount}
                        onChange={(e) => setWeeklySalaryAmount(e.target.value)}
                        className="mt-1 block w-28 rounded-lg border border-nexoraBorder px-2 py-1.5 text-xs"
                      />
                    </div>
                  )}
                  {payStructureType === 'AgreedAmount' && (
                    <div>
                      <label className="text-[10px] font-bold uppercase text-nexoraMuted">
                        {t('components.dashboard.views.pos.PosStaffProfileView.agreedAmountLabel')}
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={agreedAmount}
                        onChange={(e) => setAgreedAmount(e.target.value)}
                        className="mt-1 block w-28 rounded-lg border border-nexoraBorder px-2 py-1.5 text-xs"
                      />
                    </div>
                  )}
                </div>

                <label className="flex items-center gap-2 text-xs font-semibold text-nexoraText">
                  <ToggleSwitch checked={tipsEnabled} onChange={() => setTipsEnabled((v) => !v)} />
                  {t('components.dashboard.views.pos.PosStaffProfileView.tipsEnabledLabel')}
                </label>

                <button
                  type="button"
                  onClick={handleSaveProfile}
                  disabled={saveProfile.isPending || !posRoleId}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-nexoraBrand px-4 py-2 text-xs font-bold text-white disabled:opacity-60"
                >
                  {saveProfile.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  {t('components.dashboard.views.pos.PosStaffProfileView.save')}
                </button>
              </div>

              <div className="nexora-card space-y-3 p-5">
                <h3 className="text-xs font-black uppercase tracking-wider text-nexoraText">
                  {t('components.dashboard.views.pos.PosStaffProfileView.serviceAssignmentTitle')}
                </h3>

                {!hasSavedProfile ? (
                  <p className="text-xs text-nexoraMuted">
                    {t('components.dashboard.views.pos.PosStaffProfileView.serviceAssignmentDisabledNotice')}
                  </p>
                ) : assignmentsQuery.isLoading || servicesQuery.isLoading ? (
                  <SkeletonList count={3} lines={1} />
                ) : (
                  <>
                    <div>
                      <span className="text-[10px] font-bold uppercase text-nexoraMuted">
                        {t('components.dashboard.views.pos.PosStaffProfileView.assignmentModeLabel')}
                      </span>
                      <div className="mt-1 flex w-fit overflow-hidden rounded-lg border border-nexoraBorder">
                        {ASSIGNMENT_MODES.map((mode) => (
                          <button
                            key={mode}
                            type="button"
                            onClick={() => handleAssignmentModeChange(mode)}
                            className={`px-3 py-1.5 text-xs font-semibold transition ${
                              assignmentMode === mode
                                ? 'bg-nexoraBrand text-white'
                                : 'bg-white text-nexoraText hover:bg-nexoraCanvas'
                            }`}
                          >
                            {t(`components.dashboard.views.pos.PosStaffProfileView.assignmentMode${mode}`)}
                          </button>
                        ))}
                      </div>
                    </div>

                    {assignmentMode === 'Category' && (
                      <div>
                        <label className="text-[10px] font-bold uppercase text-nexoraMuted">
                          {t('components.dashboard.views.pos.PosStaffProfileView.categoryPickerLabel')}
                        </label>
                        <select
                          value={selectedCategoryId}
                          onChange={(e) => handleCategoryPresetChange(e.target.value)}
                          className="mt-1 block w-full rounded-lg border border-nexoraBorder px-2 py-1.5 text-xs font-semibold sm:w-64"
                        >
                          <option value="">
                            {t('components.dashboard.views.pos.PosStaffProfileView.categoryPickerPlaceholder')}
                          </option>
                          {categories.map((category) => (
                            <option key={category.id} value={category.id}>
                              {category.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {assignmentMode === 'All' && (
                      <button
                        type="button"
                        onClick={() => handleAssignmentModeChange('All')}
                        className="inline-flex items-center rounded-lg border border-nexoraBorder px-3 py-1.5 text-xs font-semibold text-nexoraText hover:bg-nexoraCanvas"
                      >
                        {t('components.dashboard.views.pos.PosStaffProfileView.applyAllServicesButton')}
                      </button>
                    )}

                    {services.length === 0 ? (
                      <p className="text-xs text-nexoraMuted">
                        {t('components.dashboard.views.pos.PosStaffProfileView.noServicesNotice')}
                      </p>
                    ) : (
                      <div className="max-h-72 space-y-1 overflow-y-auto rounded-lg border border-nexoraBorder p-2">
                        {services.map((service) => (
                          <label
                            key={service.id}
                            className="flex items-center gap-2 rounded-md px-2 py-1.5 text-xs hover:bg-nexoraCanvas"
                          >
                            <input
                              type="checkbox"
                              checked={checkedServiceIds.has(service.id)}
                              onChange={() => toggleServiceChecked(service.id)}
                            />
                            <span className="flex-1 truncate font-semibold text-nexoraText">{service.name}</span>
                            {service.categoryIds.length > 0 && (
                              <span className="truncate text-[10px] text-nexoraMuted">
                                {service.categoryIds
                                  .map((id) => categoryNameById.get(id))
                                  .filter(Boolean)
                                  .join(', ')}
                              </span>
                            )}
                            {service.status === 'Inactive' && (
                              <span className="rounded-full bg-nexoraCanvas px-2 py-0.5 text-[10px] font-bold uppercase text-nexoraMuted">
                                {t('components.dashboard.views.pos.PosStaffProfileView.inactiveBadge')}
                              </span>
                            )}
                          </label>
                        ))}
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={handleSaveServiceAssignments}
                      disabled={saveAssignments.isPending}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-nexoraBrand px-4 py-2 text-xs font-bold text-white disabled:opacity-60"
                    >
                      {saveAssignments.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                      {t('components.dashboard.views.pos.PosStaffProfileView.saveServices')}
                    </button>
                  </>
                )}
              </div>

              <div className="nexora-card space-y-3 p-5">
                <h3 className="text-xs font-black uppercase tracking-wider text-nexoraText">
                  {t('components.dashboard.views.pos.PosStaffProfileView.weeklyScheduleTitle')}
                </h3>

                {!hasSavedProfile ? (
                  <p className="text-xs text-nexoraMuted">
                    {t('components.dashboard.views.pos.PosStaffProfileView.weeklyScheduleDisabledNotice')}
                  </p>
                ) : scheduleQuery.isLoading ? (
                  <SkeletonList count={3} lines={1} />
                ) : (
                  <>
                    <WeeklyScheduleEditor
                      days={scheduleForm.map((day) => ({ ...day, error: scheduleErrors[day.dayOfWeek] }))}
                      dayLabel={dayLabel}
                      offLabel={t('components.dashboard.views.pos.PosStaffProfileView.dayOffLabel')}
                      errorMessage={(error) => t(`components.settings.tabs.ProfileTab.validation.${error}`)}
                      onToggleWorking={handleToggleScheduleDay}
                      onChangeStart={handleChangeScheduleStart}
                      onChangeEnd={handleChangeScheduleEnd}
                    />
                    <button
                      type="button"
                      onClick={handleSaveSchedule}
                      disabled={saveSchedule.isPending}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-nexoraBrand px-4 py-2 text-xs font-bold text-white disabled:opacity-60"
                    >
                      {saveSchedule.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                      {t('components.dashboard.views.pos.PosStaffProfileView.saveSchedule')}
                    </button>
                  </>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
