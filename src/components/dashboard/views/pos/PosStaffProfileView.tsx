// PosStaffProfileView — POS > Staff Profiles (US-019). Master-detail: picker of
// Active staff on the left (reuses the existing merchant staff list hook — no new
// staff-listing endpoint), POS profile form on the right split into two independently
// saved sections: "Tax Filing" (SSN/EIN — fill in only when empty — and W-2/1099
// contract type, both shared with TaxIQ per CLAUDE.md's "Module Independence & Shared
// Data" principle) and "Role, Pay & Tips" (role/pay-structure/tips, never depends on
// TaxIQ setup state).
import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useTranslation } from '../../../../contexts/LanguageContext'
import { useNotification } from '../../../../contexts/NotificationContext'
import { getApiErrorCode } from '../../../../types/domain'
import { getErrorI18nKey } from '../../../../data/errorCodes'
import { useMerchantStaff } from '../../../../data/hooks/useMerchantStaff'
import { usePosRoles } from '../../../../data/hooks/usePosRoles'
import {
  useSaveStaffPosProfile,
  useStaffPosProfile,
  useUpdateStaffPosContractType,
} from '../../../../data/hooks/usePosStaffProfile'
import { useSetStaffTin } from '../../../../data/hooks/useTaxiqOwnerPayouts'
import type { SetStaffTinParams } from '../../../../data/repositories/taxiqOwnerPayouts'
import ToggleSwitch from '../../../ui/ToggleSwitch'
import { SkeletonList } from '../../../ui/skeleton'

const PAY_STRUCTURE_TYPES = ['Commission', 'WeeklySalary', 'AgreedAmount'] as const
type PayStructureType = (typeof PAY_STRUCTURE_TYPES)[number]

// Booth Renter is a valid TaxIQ contract type but is deliberately not offered here (ticket AC).
const POS_CONTRACT_TYPES = ['W2', 'C1099'] as const
type PosContractType = (typeof POS_CONTRACT_TYPES)[number]

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

  const staffItems = (staffListQuery.data?.items ?? []) as unknown as StaffPickerItem[]
  const profile = profileQuery.data

  const [posRoleId, setPosRoleId] = useState('')
  const [payStructureType, setPayStructureType] = useState<PayStructureType>('Commission')
  const [commissionPercent, setCommissionPercent] = useState('')
  const [weeklySalaryAmount, setWeeklySalaryAmount] = useState('')
  const [agreedAmount, setAgreedAmount] = useState('')
  const [tipsEnabled, setTipsEnabled] = useState(false)
  const [contractType, setContractType] = useState<PosContractType>('W2')

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

  const handleSaveContractType = async () => {
    if (!selectedLinkId) return
    try {
      await updateContractType.mutateAsync({ businessStaffLinkId: selectedLinkId, contractType })
      showToast(t('components.dashboard.views.pos.PosStaffProfileView.contractTypeSavedSuccess'), 'success')
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
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
