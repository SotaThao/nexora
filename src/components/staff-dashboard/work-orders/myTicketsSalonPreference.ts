import { PosOrderStatus } from '../../../constants/posOrderStatus'
import type { StaffWorkOrderListItem } from '../../../data/repositories/staffWorkOrders'
import { isWorkOrderAssignedStatus } from './workOrderTickets'
import type { WorkOrderSalon } from './constants'

/** Remembers clock-in / last-visited salon as fallback when no tickets are assigned today. */

const CLOCKED_IN_SALON_KEY = 'staff.myTickets.clockedInSalonId'
const LAST_SALON_KEY = 'staff.myTickets.lastSalonId'

function readSalonId(key: string): string | null {
  try {
    const value = sessionStorage.getItem(key)?.trim()
    return value || null
  } catch {
    return null
  }
}

function writeSalonId(key: string, businessId: string | null) {
  try {
    if (!businessId?.trim()) {
      sessionStorage.removeItem(key)
      return
    }
    sessionStorage.setItem(key, businessId.trim())
  } catch {
    // Ignore quota / private-mode failures — preference is best-effort.
  }
}

export function getStaffClockedInSalonId(): string | null {
  return readSalonId(CLOCKED_IN_SALON_KEY)
}

export function setStaffClockedInSalonId(businessId: string | null) {
  writeSalonId(CLOCKED_IN_SALON_KEY, businessId)
}

export function getStaffLastWorkOrderSalonId(): string | null {
  return readSalonId(LAST_SALON_KEY)
}

export function setStaffLastWorkOrderSalonId(businessId: string) {
  writeSalonId(LAST_SALON_KEY, businessId)
}

/** Prefer the "nearest" salon when nothing is on the floor: clocked-in, then last opened, then first linked. */
export function resolveFallbackMyTicketsSalonId(salonIds: readonly string[]): string | null {
  const activeIds = salonIds.map((id) => id.trim()).filter(Boolean)
  if (!activeIds.length) return null

  const clockedIn = getStaffClockedInSalonId()
  if (clockedIn && activeIds.includes(clockedIn)) return clockedIn

  const last = getStaffLastWorkOrderSalonId()
  if (last && activeIds.includes(last)) return last

  return activeIds[0] ?? null
}

/** In Service first (already at the chair), then Assigned FIFO by arrival time. */
export function myTicketsStatusRank(status: PosOrderStatus): number {
  if (status === PosOrderStatus.InService) return 0
  if (isWorkOrderAssignedStatus(status)) return 1
  return 2
}

/** Absolute arrival instant — scheduled wall clock when present, otherwise check-in. */
export function myTicketsArrivalMs(ticket: Pick<StaffWorkOrderListItem, 'scheduledAt' | 'checkedInAt'>): number {
  const scheduled = ticket.scheduledAt?.trim()
  if (scheduled) {
    const scheduledMs = Date.parse(scheduled)
    if (Number.isFinite(scheduledMs)) return scheduledMs
  }
  const checkedInMs = Date.parse(ticket.checkedInAt)
  return Number.isFinite(checkedInMs) ? checkedInMs : Number.MAX_SAFE_INTEGER
}

export type MyTicketsSalonCandidate = {
  salonId: string
  ticket: StaffWorkOrderListItem
}

/**
 * Across salons, pick the salon owning the highest-priority open ticket:
 * In Service > Assigned, and within the same band earliest arrival (first come, first served).
 */
export function resolvePriorityMyTicketsSalonId(
  candidates: readonly MyTicketsSalonCandidate[],
): string | null {
  let best: MyTicketsSalonCandidate | null = null
  let bestStatusRank = Number.POSITIVE_INFINITY
  let bestArrivalMs = Number.POSITIVE_INFINITY

  for (const candidate of candidates) {
    if (!candidate.salonId.trim()) continue
    const statusRank = myTicketsStatusRank(candidate.ticket.myStatus)
    const arrivalMs = myTicketsArrivalMs(candidate.ticket)
    if (
      statusRank < bestStatusRank
      || (statusRank === bestStatusRank && arrivalMs < bestArrivalMs)
    ) {
      best = candidate
      bestStatusRank = statusRank
      bestArrivalMs = arrivalMs
    }
  }

  return best?.salonId ?? null
}

export function resolveMyTicketsSalonId(
  salons: readonly WorkOrderSalon[],
  ticketsBySalonId: ReadonlyMap<string, readonly StaffWorkOrderListItem[]>,
): string | null {
  const candidates: MyTicketsSalonCandidate[] = []
  for (const salon of salons) {
    const tickets = ticketsBySalonId.get(salon.id) ?? []
    for (const ticket of tickets) {
      if (myTicketsStatusRank(ticket.myStatus) > 1) continue
      candidates.push({ salonId: salon.id, ticket })
    }
  }

  return resolvePriorityMyTicketsSalonId(candidates)
    ?? resolveFallbackMyTicketsSalonId(salons.map((salon) => salon.id))
}

/** @deprecated Use resolveFallbackMyTicketsSalonId — kept for older imports/tests. */
export const resolvePreferredMyTicketsSalonId = resolveFallbackMyTicketsSalonId
