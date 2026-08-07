/**
 * taxiqStaffLogsRepository — API implementation for the Staff Mileage Log (US-12, BE US-09
 * `StaffLogsController`). Cash tip logging moved to `taxiqTipLedger.ts` (mục 26) — the old
 * `cash-tips` endpoints were replaced by the richer TipLedgerEntry API. `StaffLogsController`
 * returns bare arrays (not `{items}`) — normalize handles both shapes defensively, matching the
 * pattern used in `taxiqStaffTaxYear.ts` for the same BE team's list endpoints.
 */
import httpClient from '../../lib/httpClient'

type HttpClient = typeof httpClient

export interface MileageLogApiDto {
  id: string
  staffTaxYearId: string
  date: string
  purpose: string
  startLocation: string
  endLocation: string
  miles: number
  vehicleInfo?: string | null
  status: string
  createdAt?: string | null
  lastModified?: string | null
}

export interface MileageLogRecord {
  id: string
  staffTaxYearId: string
  date: string
  purpose: string
  startLocation: string
  endLocation: string
  miles: number
  vehicleInfo: string
  status: string
  createdAt: string | null
  lastModified: string | null
}

export interface CreateMileageLogParams {
  staffTaxYearId: string
  date: string
  purpose?: string | null
  startLocation?: string | null
  endLocation?: string | null
  miles: number
  vehicleInfo?: string | null
}

export interface UpdateMileageLogParams {
  date: string
  purpose?: string | null
  startLocation?: string | null
  endLocation?: string | null
  miles: number
  vehicleInfo?: string | null
}

function normalizeMileageLog(dto: MileageLogApiDto): MileageLogRecord {
  return {
    id: dto.id,
    staffTaxYearId: dto.staffTaxYearId,
    date: dto.date,
    purpose: dto.purpose ?? '',
    startLocation: dto.startLocation ?? '',
    endLocation: dto.endLocation ?? '',
    miles: dto.miles ?? 0,
    vehicleInfo: dto.vehicleInfo ?? '',
    status: dto.status,
    createdAt: dto.createdAt ?? null,
    lastModified: dto.lastModified ?? null,
  }
}

function toArray<T>(data: T[] | { items?: T[] } | null | undefined): T[] {
  if (Array.isArray(data)) return data
  return data?.items ?? []
}

export function createTaxiqStaffLogsRepository(client: HttpClient = httpClient) {
  return {
    async listMileageLogs(staffTaxYearId: string): Promise<MileageLogRecord[]> {
      const query = new URLSearchParams({ staffTaxYearId })
      const data = await client.get<MileageLogApiDto[] | { items: MileageLogApiDto[] }>(
        `/api/v1/taxiq/staff/mileage?${query.toString()}`,
      )
      return toArray(data).map(normalizeMileageLog)
    },

    async createMileageLog(params: CreateMileageLogParams): Promise<string> {
      return await client.post<string>('/api/v1/taxiq/staff/mileage', {
        staffTaxYearId: params.staffTaxYearId,
        date: params.date,
        purpose: params.purpose ?? null,
        startLocation: params.startLocation ?? null,
        endLocation: params.endLocation ?? null,
        miles: params.miles,
        vehicleInfo: params.vehicleInfo ?? null,
      })
    },

    async updateMileageLog(id: string, params: UpdateMileageLogParams): Promise<void> {
      await client.put(`/api/v1/taxiq/staff/mileage/${encodeURIComponent(id)}`, {
        date: params.date,
        purpose: params.purpose ?? null,
        startLocation: params.startLocation ?? null,
        endLocation: params.endLocation ?? null,
        miles: params.miles,
        vehicleInfo: params.vehicleInfo ?? null,
      })
    },

    async deleteMileageLog(id: string): Promise<void> {
      await client.del(`/api/v1/taxiq/staff/mileage/${encodeURIComponent(id)}`)
    },
  }
}

export const taxiqStaffLogsRepository = createTaxiqStaffLogsRepository()
export default taxiqStaffLogsRepository
