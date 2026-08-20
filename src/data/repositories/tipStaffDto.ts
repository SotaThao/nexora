/**
 * tipStaffDto — normalizes the tippable-staff block the public pages expose.
 *
 * Same shape on both sources today: the touch page
 * (GET /api/v1/touch/{businessSlug}/{touchPointSlug}) and the merchant payment
 * page (GET /api/v1/public/merchant/{businessId}/payment) return `staff[]` +
 * `tipConstraints`. The backend already filters to active, profile-complete
 * staff, so the client filter only drops rows that are explicitly hidden.
 */

import {
  TIP_MAX_TOTAL_AMOUNT,
  TIP_MIN_ITEM_AMOUNT,
} from '../../constants/tipPresets'
import type { PublicDirectPaymentStaff, TipConstraints } from '../../types/domain'

/** The one place the raw staff-status string is compared (repository mapping). */
const ACTIVE_STAFF_STATUS = 'active'

type LooseStaffRow = Record<string, unknown>

function readString(raw: LooseStaffRow, ...keys: string[]): string {
  for (const key of keys) {
    const value = raw[key]
    if (typeof value === 'string' && value.trim()) return value.trim()
  }
  return ''
}

function readStaffRows(page: Record<string, unknown> | null | undefined): LooseStaffRow[] {
  const staff = (page?.staff ?? page?.Staff) as unknown
  if (Array.isArray(staff)) return staff as LooseStaffRow[]
  if (staff && typeof staff === 'object') {
    const items = (staff as Record<string, unknown>).items ?? (staff as Record<string, unknown>).Items
    if (Array.isArray(items)) return items as LooseStaffRow[]
  }
  return []
}

function isTippable(row: LooseStaffRow): boolean {
  if (row.isActive === false || row.IsActive === false) return false
  if (row.showInTipsFlow === false || row.ShowInTipsFlow === false) return false
  const status = readString(row, 'status', 'Status')
  if (status && status.toLowerCase() !== ACTIVE_STAFF_STATUS) return false
  return true
}

function resolveDisplayName(row: LooseStaffRow): string {
  const displayName = readString(row, 'displayName', 'DisplayName')
  if (displayName) return displayName
  const nickname = readString(row, 'nicknameAtBusiness', 'NicknameAtBusiness', 'nickname')
  if (nickname) return nickname
  const fullName = [
    readString(row, 'firstName', 'FirstName'),
    readString(row, 'lastName', 'LastName'),
  ].filter(Boolean).join(' ')
  return fullName
}

/** Map a touch/payment page payload to the rows the tip picker renders. */
export function toTipStaffList(
  page: Record<string, unknown> | null | undefined,
): PublicDirectPaymentStaff[] {
  return readStaffRows(page)
    .filter(isTippable)
    .map((row) => {
      const id = readString(row, 'id', 'Id', 'staffProfileId', 'StaffProfileId')
      const displayName = resolveDisplayName(row)
      if (!id || !displayName) return null
      return {
        id,
        displayName,
        nickname: readString(row, 'nicknameAtBusiness', 'NicknameAtBusiness', 'nickname') || displayName,
        photoUrl: readString(row, 'photoUrl', 'PhotoUrl') || null,
        position: readString(row, 'position', 'Position') || null,
      }
    })
    .filter((row): row is PublicDirectPaymentStaff => Boolean(row))
}

function readBound(source: Record<string, unknown>, ...keys: string[]): number | null {
  for (const key of keys) {
    const value = Number(source[key])
    if (Number.isFinite(value) && value > 0) return value
  }
  return null
}

/** Server tip bounds when the API sends them, frontend defaults otherwise. */
export function toTipConstraints(
  page: Record<string, unknown> | null | undefined,
): TipConstraints {
  const source = ((page?.tipConstraints ?? page?.TipConstraints) ?? {}) as Record<string, unknown>
  return {
    minItemAmount:
      readBound(source, 'minItemAmount', 'MinItemAmount', 'minAmount', 'MinAmount')
      ?? TIP_MIN_ITEM_AMOUNT,
    maxTotalAmount:
      readBound(source, 'maxTotalAmount', 'MaxTotalAmount', 'maxAmount', 'MaxAmount')
      ?? TIP_MAX_TOTAL_AMOUNT,
  }
}
