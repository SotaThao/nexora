/**
 * taxiqShareLinksRepository — API implementation for Share Links (mục 23), owner-side
 * management (create/list/publish/revoke/QR). Backend: ShareLinksController, built by
 * generalizing CpaAccessGrant (mục 25 CPA Access) rather than a new entity — see backend
 * project memory. List/create resolve the current business from the JWT server-side, so
 * no businessId param is needed here.
 */
import httpClient from '../../lib/httpClient'

type HttpClient = typeof httpClient

export const SHARE_LINK_RECIPIENT_TYPES = ['Cpa', 'Technician', 'FriendReferral', 'ExternalReviewer'] as const
export type ShareLinkRecipientType = (typeof SHARE_LINK_RECIPIENT_TYPES)[number]

export const SHARE_LINK_ACCESS_MODES = ['ReviewOnly', 'UploadOnly', 'ReviewAndUpload'] as const
export type ShareLinkAccessMode = (typeof SHARE_LINK_ACCESS_MODES)[number]

export const SHARE_LINK_DATA_BLOCKS = ['TaxLedgerSummary', 'ReceiptIndex', 'PayoutEvidence', 'PublicProfile'] as const
export type ShareLinkDataBlock = (typeof SHARE_LINK_DATA_BLOCKS)[number]

export const SHARE_LINK_DOWNLOAD_PERMISSIONS = ['Disabled', 'PdfOnly', 'PdfAndCsv'] as const
export type ShareLinkDownloadPermission = (typeof SHARE_LINK_DOWNLOAD_PERMISSIONS)[number]

export const SHARE_LINK_EXPIRY_DAYS = [7, 15, 30] as const
export type ShareLinkExpiryDays = (typeof SHARE_LINK_EXPIRY_DAYS)[number]

export interface ShareLinkListItemApiDto {
  id: string
  accessToken: string
  recipientName: string
  recipientType: string
  accessMode: string
  sharedDataBlocks: string[]
  downloadPermission: string
  hasPasscode: boolean
  status: string
  isExpired: boolean
  expiresAt?: string | null
  revokedAt?: string | null
  createdAt: string
}

export interface ShareLinkListItem {
  id: string
  accessToken: string
  recipientName: string
  recipientType: string
  accessMode: string
  sharedDataBlocks: string[]
  downloadPermission: string
  hasPasscode: boolean
  status: string
  isExpired: boolean
  expiresAt: string | null
  revokedAt: string | null
  createdAt: string
}

function normalizeListItem(dto: ShareLinkListItemApiDto): ShareLinkListItem {
  return {
    id: dto.id,
    accessToken: dto.accessToken,
    recipientName: dto.recipientName,
    recipientType: dto.recipientType,
    accessMode: dto.accessMode,
    sharedDataBlocks: dto.sharedDataBlocks ?? [],
    downloadPermission: dto.downloadPermission,
    hasPasscode: dto.hasPasscode,
    status: dto.status,
    isExpired: dto.isExpired,
    expiresAt: dto.expiresAt ?? null,
    revokedAt: dto.revokedAt ?? null,
    createdAt: dto.createdAt,
  }
}

export interface CreateShareLinkParams {
  recipientName: string
  recipientType: ShareLinkRecipientType
  cpaEmail?: string | null
  accessMode: ShareLinkAccessMode
  sharedDataBlocks: ShareLinkDataBlock[]
  downloadPermission: ShareLinkDownloadPermission
  passcode?: string | null
  expiryDays: ShareLinkExpiryDays | null
  ownerTaxYearId?: string
  staffTaxYearId?: string
  saveAsDraft: boolean
}

export interface ShareLinkApiDto {
  id: string
  accessToken: string
  recipientName: string
  recipientType: string
  cpaEmail?: string | null
  accessMode: string
  sharedDataBlocks: string[]
  downloadPermission: string
  hasPasscode: boolean
  status: string
  expiresAt?: string | null
}

export interface ShareLink {
  id: string
  accessToken: string
  recipientName: string
  recipientType: string
  cpaEmail: string | null
  accessMode: string
  sharedDataBlocks: string[]
  downloadPermission: string
  hasPasscode: boolean
  status: string
  expiresAt: string | null
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

export function createTaxiqShareLinksRepository(client: HttpClient = httpClient) {
  return {
    async list(): Promise<ShareLinkListItem[]> {
      const data = await client.get<{ items: ShareLinkListItemApiDto[] }>('/api/v1/taxiq/owner/share-links')
      return (data?.items ?? []).map(normalizeListItem)
    },

    async create(params: CreateShareLinkParams): Promise<ShareLink> {
      const data = await client.post<ShareLinkApiDto>('/api/v1/taxiq/owner/share-links', {
        recipientName: params.recipientName,
        recipientType: params.recipientType,
        cpaEmail: params.cpaEmail ?? null,
        accessMode: params.accessMode,
        sharedDataBlocks: params.sharedDataBlocks,
        downloadPermission: params.downloadPermission,
        passcode: params.passcode ?? null,
        expiryDays: params.expiryDays,
        ownerTaxYearId: params.ownerTaxYearId ?? null,
        staffTaxYearId: params.staffTaxYearId ?? null,
        saveAsDraft: params.saveAsDraft,
      })
      return normalizeShareLink(data as ShareLinkApiDto)
    },

    async publish(id: string): Promise<void> {
      await client.post<void>(`/api/v1/taxiq/owner/share-links/${encodeURIComponent(id)}/publish`)
    },

    async revoke(id: string, revokeReason?: string): Promise<void> {
      const query = revokeReason ? `?revokeReason=${encodeURIComponent(revokeReason)}` : ''
      await client.del<void>(`/api/v1/taxiq/owner/share-links/${encodeURIComponent(id)}${query}`)
    },

    async getQrBlob(id: string): Promise<Blob> {
      return client.getBlob(`/api/v1/taxiq/owner/share-links/${encodeURIComponent(id)}/qr`)
    },
  }
}

export const taxiqShareLinksRepository = createTaxiqShareLinksRepository()
export default taxiqShareLinksRepository
