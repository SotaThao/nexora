/**
 * taxiqForm1099NecRepository — API implementation for Tax Center 1099-NEC (mục 21). Delivery
 * to the contractor reuses Share Link infra (mục 23) server-side — this repository only calls
 * Form1099NecController and returns the same ShareLinkDto shape as taxiqShareLinks.ts for the
 * send/resend responses, since the backend endpoint literally returns that DTO.
 */
import httpClient from '../../lib/httpClient'
import type { ShareLink, ShareLinkApiDto } from './taxiqShareLinks'

type HttpClient = typeof httpClient

export const FORM_1099NEC_EXPIRY_DAYS = [7, 15, 30] as const
export type Form1099NecExpiryDays = (typeof FORM_1099NEC_EXPIRY_DAYS)[number]

export interface Form1099NecListItem {
  id: string
  staffTaxYearId: string
  workerName: string
  workerEmail: string | null
  maskedTin: string | null
  serviceCommission: number
  box1bCashTips: number
  box1aTotal: number
  box1cTtoc: string
  box1dOvertime: number
  w9Status: string
  status: string
  deliveredAt: string | null
  efiledAt: string | null
}

export interface Form1099NecSummary {
  totalForms: number
  totalBox1a: number
  readyToFileCount: number
  w9OnFileCount: number
  items: Form1099NecListItem[]
}

interface Form1099NecSummaryApiDto {
  totalForms: number
  totalBox1a: number
  readyToFileCount: number
  w9OnFileCount: number
  items: Array<Omit<Form1099NecListItem, 'workerEmail' | 'maskedTin' | 'deliveredAt' | 'efiledAt'> & {
    workerEmail?: string | null
    maskedTin?: string | null
    deliveredAt?: string | null
    efiledAt?: string | null
  }>
}

function normalizeSummary(dto: Form1099NecSummaryApiDto): Form1099NecSummary {
  return {
    totalForms: dto.totalForms,
    totalBox1a: dto.totalBox1a,
    readyToFileCount: dto.readyToFileCount,
    w9OnFileCount: dto.w9OnFileCount,
    items: (dto.items ?? []).map((item) => ({
      ...item,
      workerEmail: item.workerEmail ?? null,
      maskedTin: item.maskedTin ?? null,
      deliveredAt: item.deliveredAt ?? null,
      efiledAt: item.efiledAt ?? null,
    })),
  }
}

export interface ScanForm1099NecResult {
  created: number
  updated: number
  skipped: number
}

export interface SendForm1099NecCopyParams {
  expiryDays: Form1099NecExpiryDays
  includePdf: boolean
  isCorrectedCopy: boolean
}

export interface ResendForm1099NecCopyParams {
  expiryDays: Form1099NecExpiryDays
  includePdf: boolean
}

export interface SendForm1099NecBatchParams {
  form1099NecIds: string[]
  expiryDays: Form1099NecExpiryDays
  includePdf: boolean
}

export interface SendForm1099NecBatchResult {
  sentCount: number
  failedIds: string[]
}

export interface Form1096Report {
  taxYear: number
  formCount: number
  totalServiceCommission: number
  totalBox1bCashTips: number
  totalBox1a: number
}

export interface EfileForm1099NecParams {
  form1099NecIds: string[]
  merchantApprovalConfirmed: boolean
  cpaReviewConfirmed: boolean
}

function normalizeShareLink(dto: ShareLinkApiDto): ShareLink {
  return {
    id: dto.id,
    accessToken: dto.accessToken,
    recipientName: dto.recipientName,
    recipientType: dto.recipientType,
    cpaEmail: dto.cpaEmail ?? null,
    accessMode: dto.accessMode,
    sharedDataBlocks: dto.sharedDataBlocks ?? [],
    downloadPermission: dto.downloadPermission,
    hasPasscode: dto.hasPasscode,
    status: dto.status,
    expiresAt: dto.expiresAt ?? null,
  }
}

export function createTaxiqForm1099NecRepository(client: HttpClient = httpClient) {
  return {
    async getSummary(ownerTaxYearId: string): Promise<Form1099NecSummary> {
      const data = await client.get<Form1099NecSummaryApiDto>(
        `/api/v1/taxiq/owner/form1099nec?ownerTaxYearId=${encodeURIComponent(ownerTaxYearId)}`
      )
      return normalizeSummary(data as Form1099NecSummaryApiDto)
    },

    async scan(ownerTaxYearId: string): Promise<ScanForm1099NecResult> {
      const data = await client.post<ScanForm1099NecResult>('/api/v1/taxiq/owner/form1099nec/scan', {
        ownerTaxYearId,
      })
      return data as ScanForm1099NecResult
    },

    async getWorksheetPdfBlob(id: string): Promise<Blob> {
      return client.getBlob(`/api/v1/taxiq/owner/form1099nec/${encodeURIComponent(id)}/worksheet-pdf`)
    },

    async send(id: string, params: SendForm1099NecCopyParams): Promise<ShareLink> {
      const data = await client.post<ShareLinkApiDto>(`/api/v1/taxiq/owner/form1099nec/${encodeURIComponent(id)}/send`, {
        expiryDays: params.expiryDays,
        includePdf: params.includePdf,
        isCorrectedCopy: params.isCorrectedCopy,
      })
      return normalizeShareLink(data as ShareLinkApiDto)
    },

    async resend(id: string, params: ResendForm1099NecCopyParams): Promise<ShareLink> {
      const data = await client.post<ShareLinkApiDto>(`/api/v1/taxiq/owner/form1099nec/${encodeURIComponent(id)}/resend`, {
        expiryDays: params.expiryDays,
        includePdf: params.includePdf,
      })
      return normalizeShareLink(data as ShareLinkApiDto)
    },

    async sendBatch(params: SendForm1099NecBatchParams): Promise<SendForm1099NecBatchResult> {
      const data = await client.post<SendForm1099NecBatchResult>('/api/v1/taxiq/owner/form1099nec/send-batch', {
        form1099NecIds: params.form1099NecIds,
        expiryDays: params.expiryDays,
        includePdf: params.includePdf,
      })
      return data as SendForm1099NecBatchResult
    },

    async get1096Report(ownerTaxYearId: string): Promise<Form1096Report> {
      const data = await client.get<Form1096Report>(
        `/api/v1/taxiq/owner/form1099nec/1096-report?ownerTaxYearId=${encodeURIComponent(ownerTaxYearId)}`
      )
      return data as Form1096Report
    },

    async efile(params: EfileForm1099NecParams): Promise<void> {
      await client.post<void>('/api/v1/taxiq/owner/form1099nec/efile', {
        form1099NecIds: params.form1099NecIds,
        merchantApprovalConfirmed: params.merchantApprovalConfirmed,
        cpaReviewConfirmed: params.cpaReviewConfirmed,
      })
    },
  }
}

export const taxiqForm1099NecRepository = createTaxiqForm1099NecRepository()
export default taxiqForm1099NecRepository
