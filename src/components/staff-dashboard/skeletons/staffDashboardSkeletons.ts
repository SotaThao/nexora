import type { SkeletonBlockConfig } from '../../ui/skeleton'

/** `/staff` home — KPI grid + pending list + linked businesses. */
export const STAFF_HOME_SKELETON: SkeletonBlockConfig[] = [
  { type: 'kpi-grid', count: 4, columns: 2 },
  {
    type: 'panel',
    rows: 2,
    listProps: { showAction: true, lines: 2 },
  },
  {
    type: 'panel',
    rows: 3,
    listProps: { lines: 2 },
  },
]

/** `/staff/tips` — activity list panel. */
export const STAFF_TIPS_SKELETON: SkeletonBlockConfig[] = [
  { type: 'panel', rows: 5, listProps: { lines: 2 } },
  { type: 'panel', rows: 2, listProps: { lines: 1 } },
]

/** `/staff/reviews` — summary + review cards. */
export const STAFF_REVIEWS_SKELETON: SkeletonBlockConfig[] = [
  { type: 'kpi-grid', count: 3, columns: 3 },
  { type: 'panel', rows: 4, listProps: { lines: 3 } },
]

/** `/staff/notifications` — feed + push preference toggles. */
export const STAFF_NOTIFICATIONS_SKELETON: SkeletonBlockConfig[] = [
  { type: 'panel', rows: 4, listProps: { lines: 2 } },
  { type: 'panel', rows: 3, listProps: { lines: 1 } },
]
