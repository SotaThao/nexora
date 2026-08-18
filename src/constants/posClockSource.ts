/**
 * PosClockSource — matches backend Nexora.Domain.Enums.Pos.PosClockSource.
 * AutoClose is written by the nightly job when a tech forgets to clock out, so a log row
 * carrying it is a shift the system ended, not the tech.
 */
export enum PosClockSource {
  Manual = 'Manual',
  QrScan = 'QrScan',
  AutoClose = 'AutoClose',
}

/** Matches backend ScanClockAction — which direction a QR scan resolved to. */
export enum ScanClockAction {
  ClockedIn = 'ClockedIn',
  ClockedOut = 'ClockedOut',
}
