import {
  ALL_PAYOUT_METHOD_TYPES,
  PayoutMethodType,
  PayoutStatus,
  PayoutType,
  payoutTypesFromMask,
  type PayoutMethodTypeValue,
  type PayoutStatusValue,
  type PayoutTypeFlag,
} from '../data/payoutConstants'
import type { PayoutRecord, StaffMember } from '../types/domain'

export function resolvePayoutStaffProfileId(
  payout: Pick<PayoutRecord, 'staffProfileId' | 'staffCode' | 'staffDisplayName'>,
  staffList: StaffMember[],
): string {
  if (payout.staffProfileId?.trim()) {
    return payout.staffProfileId.trim()
  }

  const staffCode = payout.staffCode?.trim()
  const displayName = payout.staffDisplayName?.trim().toLowerCase()

  const match = staffList.find((member) => {
    if (!member.staffProfileId) return false
    if (staffCode && member.staffCode === staffCode) return true
    const memberName = (member.displayName || member.fullName || member.nickname || '')
      .trim()
      .toLowerCase()
    return Boolean(displayName && memberName && memberName === displayName)
  })

  return match?.staffProfileId ?? ''
}

const METHOD_UI_KEY: Record<PayoutMethodTypeValue, string> = {
  [PayoutMethodType.Cash]: 'cash',
  [PayoutMethodType.BankTransfer]: 'bankwire',
  [PayoutMethodType.Zelle]: 'zelle',
  [PayoutMethodType.CashApp]: 'cashapp',
  [PayoutMethodType.Venmo]: 'venmo',
  [PayoutMethodType.Other]: 'other',
}

const PAYOUT_TYPE_I18N_KEY: Record<PayoutTypeFlag, string> = {
  [PayoutType.Tip]: 'dashboard.tips.payouts_manager.type_tip',
  [PayoutType.Salary]: 'dashboard.tips.payouts_manager.type_salary',
  [PayoutType.Bonus]: 'dashboard.tips.payouts_manager.type_bonus',
  [PayoutType.Other]: 'dashboard.tips.payouts_manager.type_other',
}

const STATUS_I18N_KEY: Record<PayoutStatusValue, string> = {
  [PayoutStatus.Draft]: 'dashboard.tips.payouts_manager.status_draft',
  [PayoutStatus.Pending]: 'dashboard.tips.payouts_manager.status_pending',
  [PayoutStatus.Confirmed]: 'dashboard.tips.payouts_manager.status_confirmed',
  [PayoutStatus.Cancelled]: 'dashboard.tips.payouts_manager.status_cancelled',
}

export function payoutMethodToUiKey(method: string): string {
  return METHOD_UI_KEY[method as PayoutMethodTypeValue] ?? method.toLowerCase().replace(/\s+/g, '')
}

function readStaffPayoutMethodState(
  staff: StaffMember,
  uiKey: string,
): { hasValue: boolean; enabled: boolean } {
  const configs = staff.payoutConfigs as Record<string, { enabled?: boolean; value?: string }> | undefined
  const accounts = staff.paymentAccounts as Record<string, string> | undefined
  const accountValue = accounts?.[uiKey]?.trim() || ''
  const configValue = configs?.[uiKey]?.value?.trim() || ''
  const value = accountValue || configValue

  // Merchant payout uses configured wallets (non-empty account), not customer-tip
  // visibility (`payoutConfigs.enabled` / API `isActive`). Placeholder config entries
  // must not block methods that only appear in `paymentAccounts`.
  const isConfigured = Boolean(value)
  return { hasValue: isConfigured, enabled: isConfigured }
}

/** Whether a payout method can be selected for the given staff member. */
export function isStaffPayoutMethodAvailable(
  staff: StaffMember | null | undefined,
  method: PayoutMethodTypeValue,
): boolean {
  if (!staff) return false

  // Cash is always available — physical handoff does not require a staff wallet.
  if (method === PayoutMethodType.Cash) {
    return true
  }

  if (method === PayoutMethodType.Other) {
    return false
  }

  const { hasValue, enabled } = readStaffPayoutMethodState(staff, payoutMethodToUiKey(method))
  return hasValue && enabled
}

export function getStaffAvailablePayoutMethods(
  staff: StaffMember | null | undefined,
): PayoutMethodTypeValue[] {
  return ALL_PAYOUT_METHOD_TYPES.filter((method) => isStaffPayoutMethodAvailable(staff, method))
}

export function getPayoutStatusI18nKey(status: number): string {
  return STATUS_I18N_KEY[status as PayoutStatusValue] ?? STATUS_I18N_KEY[PayoutStatus.Pending]
}

export function getPayoutTypeI18nKeys(mask: number): string[] {
  return payoutTypesFromMask(mask).map((flag) => PAYOUT_TYPE_I18N_KEY[flag])
}

export function formatPayoutPeriodRange(
  periodStart: string,
  periodEnd: string,
  locale: string,
): string {
  if (!periodStart || !periodEnd) return '—'
  const fmt = new Intl.DateTimeFormat(locale === 'vi' ? 'vi-VN' : 'en-US', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
  const start = fmt.format(new Date(`${periodStart}T00:00:00`))
  const end = fmt.format(new Date(`${periodEnd}T00:00:00`))
  return `${start} – ${end}`
}

export function staffInitials(name: string): string {
  const trimmed = (name || '').trim()
  if (!trimmed) return '?'
  return trimmed.charAt(0).toUpperCase()
}

export function isPayoutPending(status: number): boolean {
  return status === PayoutStatus.Pending
}

export function isPayoutEditable(status: number): boolean {
  return status === PayoutStatus.Pending
}
