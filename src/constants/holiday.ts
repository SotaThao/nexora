export const HOLIDAY_TYPE = {
  CLOSED: 'Closed',
  ADJUSTED: 'Adjusted',
} as const

export type HolidayType = typeof HOLIDAY_TYPE[keyof typeof HOLIDAY_TYPE]
