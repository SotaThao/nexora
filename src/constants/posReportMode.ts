/**
 * Mirrors backend enum `PosReportMode` (Domain/Enums/Pos/PosReportMode.cs). The API accepts the
 * name, so these values are sent as-is on the query string.
 */
export enum PosReportMode {
  Daily = 'Daily',
  Weekly = 'Weekly',
  Monthly = 'Monthly',
}

export const POS_REPORT_MODE_OPTIONS = [
  PosReportMode.Daily,
  PosReportMode.Weekly,
  PosReportMode.Monthly,
] as const
