/**
 * PosOrderItemStatus — matches backend Nexora.Domain.Enums.Pos.PosOrderItemStatus.
 * The work lifecycle of ONE service line, tracked separately from the ticket's own
 * PosOrderStatus because a ticket's services finish at different times.
 *
 * Only a parent service line carries this — add-ons follow the service they extend and
 * products are never worked on, so both always read as Unassigned and must be ignored.
 */
export enum PosOrderItemStatus {
  Unassigned = 'Unassigned',
  PendingAcceptance = 'PendingAcceptance',
  Assigned = 'Assigned',
  Started = 'Started',
  Completed = 'Completed',
}

/** The chain, in order. Index position is what "further along" means. */
export const POS_ORDER_ITEM_STATUS_CHAIN = [
  PosOrderItemStatus.Unassigned,
  PosOrderItemStatus.PendingAcceptance,
  PosOrderItemStatus.Assigned,
  PosOrderItemStatus.Started,
  PosOrderItemStatus.Completed,
] as const

export function isLineAtOrPast(
  current: string | null | undefined,
  target: PosOrderItemStatus,
): boolean {
  const currentIndex = POS_ORDER_ITEM_STATUS_CHAIN.indexOf(current as PosOrderItemStatus)
  if (currentIndex < 0) return false
  return currentIndex >= POS_ORDER_ITEM_STATUS_CHAIN.indexOf(target)
}

export function isLineStarted(status: string | null | undefined): boolean {
  return status === PosOrderItemStatus.Started
}

export function isLinePendingAcceptance(status: string | null | undefined): boolean {
  return status === PosOrderItemStatus.PendingAcceptance
}

const LINE_STATUS_I18N_PREFIX = 'components.dashboard.views.pos.serviceLineStatus'

/** i18n key for the badge label of a line status. */
export function posOrderItemStatusLabelKey(status: string | null | undefined): string {
  switch (status) {
    case PosOrderItemStatus.PendingAcceptance:
      return `${LINE_STATUS_I18N_PREFIX}.pendingAcceptance`
    case PosOrderItemStatus.Assigned:
      return `${LINE_STATUS_I18N_PREFIX}.assigned`
    case PosOrderItemStatus.Started:
      return `${LINE_STATUS_I18N_PREFIX}.started`
    case PosOrderItemStatus.Completed:
      return `${LINE_STATUS_I18N_PREFIX}.completed`
    default:
      return `${LINE_STATUS_I18N_PREFIX}.unassigned`
  }
}
