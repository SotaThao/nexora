/**
 * Mirrors of the backend `PosServiceIncomeReportMode` / `PosServiceIncomeRowType` enums plus the
 * chart parameters for the Service Income report. Backend enum values must never be written as
 * inline literals in a component, hook, or repository — import from here (see AGENTS.md).
 */

export const PosServiceIncomeReportMode = {
  Day: 'Day',
  Week: 'Week',
  Month: 'Month',
  Range: 'Range',
} as const

export type PosServiceIncomeReportMode =
  (typeof PosServiceIncomeReportMode)[keyof typeof PosServiceIncomeReportMode]

export const PosServiceIncomeRowType = {
  Service: 'Service',
  AddOn: 'AddOn',
  Custom: 'Custom',
} as const

export type PosServiceIncomeRowType =
  (typeof PosServiceIncomeRowType)[keyof typeof PosServiceIncomeRowType]

/** Same ceiling the backend enforces for `mode = Range`; kept here so the picker can reject early. */
export const POS_SERVICE_INCOME_MAX_RANGE_DAYS = 366

/** Both charts show this many bars until the reader expands to the full row set. */
export const POS_SERVICE_INCOME_TOP_ROWS = 10

export const POS_SERVICE_INCOME_LINES_PAGE_SIZE = 20

/**
 * Bar colours are derived from the row name rather than listed here — see
 * `views/pos/report/serviceIncomeSeriesColor.ts`. A fixed palette indexed by position cannot work
 * for this report: the two charts sort independently, so the same service would take two different
 * colours, and a salon with more services than the palette has slots would leave rows uncoloured.
 */
