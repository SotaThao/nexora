/**
 * taxiqShareLinkViewerRepository — public, token-authenticated API for the Share Link
 * viewer page (mục 23). No JWT: every call passes `{ anonymous: true }`, same pattern as
 * taxiqCpaViewer.ts.
 */
import httpClient from '../../lib/httpClient'

type HttpClient = typeof httpClient

export interface ShareLinkTaxLedgerSummaryItem {
  jurisdiction: string
  type: string
  employeeAmount: number
  employerAmount: number
}

export interface ShareLinkReceiptIndexItem {
  id: string
  fileName: string
  aiExtractedVendor?: string | null
  aiExtractedDate?: string | null
  aiExtractedAmount?: number | null
  qualityStatus: string
}

export interface ShareLinkPayoutEvidenceItem {
  id: string
  periodStart: string
  periodEnd: string
  servicePayout: number
  totalTip: number
  bonus: number
  reimbursement: number
  status: string
}

export interface ShareLinkPublicProfile {
  name: string
  logoUrl?: string | null
  description?: string | null
  address?: string | null
  city?: string | null
  state?: string | null
  phone?: string | null
  website?: string | null
}

export interface ShareLinkContentApiDto {
  recipientName: string
  accessMode: string
  downloadPermission: string
  expiresAt?: string | null
  taxLedgerSummary?: ShareLinkTaxLedgerSummaryItem[] | null
  receiptIndex?: ShareLinkReceiptIndexItem[] | null
  payoutEvidence?: ShareLinkPayoutEvidenceItem[] | null
  publicProfile?: ShareLinkPublicProfile | null
}

export interface ShareLinkContent {
  recipientName: string
  accessMode: string
  downloadPermission: string
  expiresAt: string | null
  taxLedgerSummary: ShareLinkTaxLedgerSummaryItem[] | null
  receiptIndex: ShareLinkReceiptIndexItem[] | null
  payoutEvidence: ShareLinkPayoutEvidenceItem[] | null
  publicProfile: ShareLinkPublicProfile | null
}

function normalizeContent(dto: ShareLinkContentApiDto): ShareLinkContent {
  return {
    recipientName: dto.recipientName,
    accessMode: dto.accessMode,
    downloadPermission: dto.downloadPermission,
    expiresAt: dto.expiresAt ?? null,
    taxLedgerSummary: dto.taxLedgerSummary ?? null,
    receiptIndex: dto.receiptIndex ?? null,
    payoutEvidence: dto.payoutEvidence ?? null,
    publicProfile: dto.publicProfile ?? null,
  }
}

export function createTaxiqShareLinkViewerRepository(client: HttpClient = httpClient) {
  return {
    async verifyPasscode(token: string, passcode: string): Promise<boolean> {
      const data = await client.post<boolean>(
        `/api/v1/taxiq/share/${encodeURIComponent(token)}/verify-passcode`,
        passcode,
        { anonymous: true },
      )
      return !!data
    },

    async getContent(token: string, passcode?: string): Promise<ShareLinkContent> {
      const query = passcode ? `?passcode=${encodeURIComponent(passcode)}` : ''
      const data = await client.get<ShareLinkContentApiDto>(
        `/api/v1/taxiq/share/${encodeURIComponent(token)}${query}`,
        { anonymous: true },
      )
      return normalizeContent(data as ShareLinkContentApiDto)
    },

    async download(token: string, format: 'pdf' | 'csv', passcode?: string): Promise<Blob> {
      const query = new URLSearchParams({ format })
      if (passcode) query.set('passcode', passcode)
      return client.getBlob(`/api/v1/taxiq/share/${encodeURIComponent(token)}/download?${query.toString()}`, {
        anonymous: true,
      })
    },

    async upload(token: string, file: File, passcode?: string): Promise<string> {
      const query = passcode ? `?passcode=${encodeURIComponent(passcode)}` : ''
      const formData = new FormData()
      formData.append('file', file)
      const data = await client.upload<string>(
        `/api/v1/taxiq/share/${encodeURIComponent(token)}/upload${query}`,
        formData,
        'POST',
        { anonymous: true },
      )
      return data as string
    },
  }
}

export const taxiqShareLinkViewerRepository = createTaxiqShareLinkViewerRepository()
export default taxiqShareLinkViewerRepository
