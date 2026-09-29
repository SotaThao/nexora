/**
 * posTimeClockRepository — POS Front Desk: Time Clock tab.
 * Two audiences share this file: the merchant board (rotating QR, roster, day log, beep) and the
 * tech's own scan screen under /staff/clock. businessId is an explicit param on every merchant
 * call, same as the other POS ops repositories, because a Staff caller may work at more than one
 * salon.
 *
 * fromUtc/toUtc are always supplied by the caller: the board shows "today" in the salon's local
 * time, which only the device in the salon reliably knows.
 */
import httpClient from '../../lib/httpClient'
import type {
  BeepStaffResultApiDto,
  ClockQrTokenApiDto,
  ClockScanPreviewApiDto,
  ScanClockQrResultApiDto,
  StaffClockStatusApiDto,
  TimeClockLogEntryApiDto,
  TimeClockRosterApiDto,
} from '../../types/repositories'

type HttpClient = typeof httpClient

const EMPTY_ROSTER: TimeClockRosterApiDto = { onShiftCount: 0, rows: [] }

export function createPosTimeClockRepository(client: HttpClient = httpClient) {
  return {
    async getQrToken(businessId: string): Promise<ClockQrTokenApiDto | null> {
      const res = await client.get<ClockQrTokenApiDto>(
        `/api/v1/merchant/pos/${businessId}/time-clock/qr`,
      )
      return res ?? null
    },

    async getRoster(businessId: string, fromUtc: string, toUtc: string): Promise<TimeClockRosterApiDto> {
      const res = await client.get<TimeClockRosterApiDto>(
        `/api/v1/merchant/pos/${businessId}/time-clock/roster`,
        { params: { fromUtc, toUtc } },
      )
      if (!res) return EMPTY_ROSTER
      return { onShiftCount: res.onShiftCount ?? 0, rows: res.rows ?? [] }
    },

    async getLog(businessId: string, fromUtc: string, toUtc: string): Promise<TimeClockLogEntryApiDto[]> {
      const res = await client.get<TimeClockLogEntryApiDto[]>(
        `/api/v1/merchant/pos/${businessId}/time-clock/log`,
        { params: { fromUtc, toUtc } },
      )
      return res ?? []
    },

    // `message` is not yet in the live Swagger contract for this endpoint (path params only, no
    // body) — sent optimistically pending a BE field; the server currently ignores an unknown body.
    async beepStaff(
      businessId: string,
      posStaffProfileId: string,
      message?: string,
    ): Promise<BeepStaffResultApiDto> {
      return client.post<BeepStaffResultApiDto>(
        `/api/v1/merchant/pos/${businessId}/time-clock/${posStaffProfileId}/beep`,
        message ? { message } : undefined,
      )
    },

    // Front desk acting for a tech whose scan failed — reuses the existing staff clock endpoints,
    // which authorise Owner-or-self server-side.
    async clockIn(businessStaffLinkId: string): Promise<string> {
      return client.post<string>(`/api/v1/merchant/pos/staff-clock/${businessStaffLinkId}/clock-in`)
    },

    async clockOut(businessStaffLinkId: string): Promise<void> {
      await client.post(`/api/v1/merchant/pos/staff-clock/${businessStaffLinkId}/clock-out`)
    },

    async getStaffClockStatus(businessStaffLinkId: string): Promise<StaffClockStatusApiDto> {
      return client.get<StaffClockStatusApiDto>(
        `/api/v1/staff/clock/${encodeURIComponent(businessStaffLinkId)}/status`,
      )
    },

    // Tech's own screen after scanning the salon's QR.
    async getScanPreview(businessId: string, token: string): Promise<ClockScanPreviewApiDto> {
      return client.get<ClockScanPreviewApiDto>('/api/v1/staff/clock/scan-preview', {
        params: { businessId, token },
      })
    },

    async scan(businessId: string, token: string): Promise<ScanClockQrResultApiDto> {
      return client.post<ScanClockQrResultApiDto>('/api/v1/staff/clock/scan', { businessId, token })
    },
  }
}

export const posTimeClockRepository = createPosTimeClockRepository()
export default posTimeClockRepository
