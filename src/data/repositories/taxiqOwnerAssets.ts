/**
 * taxiqOwnerAssetsRepository — API implementation for US-07 (Equipment, Gift Card
 * Liability, Membership Credit trackers). Mirrors taxiqOwnerDeductions.ts.
 * OwnerAssetsController exposes Create/List/Update/Delete for all three modules;
 * Update/Delete are only accepted while the owner tax year is Active (not yet
 * Locked/Exported) — corrections after locking go through the Adjustment Record flow.
 */
import httpClient from '../../lib/httpClient'

type HttpClient = typeof httpClient

export interface EquipmentAssetApiDto {
  id: string
  ownerTaxYearId: string
  assetName: string
  purchaseDate: string
  inServiceDate?: string | null
  amount: number
  businessUsePercent: number
  aiSuggestion: string
  aiExplanation?: string | null
  isHighPriority: boolean
  receiptId?: string | null
  createdAt: string
  lastModified?: string | null
}

export interface EquipmentAsset {
  id: string
  ownerTaxYearId: string
  assetName: string
  purchaseDate: string
  inServiceDate: string | null
  amount: number
  businessUsePercent: number
  aiSuggestion: string
  aiExplanation: string | null
  isHighPriority: boolean
  receiptId: string | null
  createdAt: string
  lastModified: string | null
}

export interface CreateEquipmentAssetParams {
  ownerTaxYearId: string
  assetName: string
  purchaseDate: string
  inServiceDate?: string | null
  amount: number
  businessUsePercent: number
  isRenovation: boolean
  receiptId?: string | null
}

export interface UpdateEquipmentAssetParams {
  id: string
  assetName: string
  purchaseDate: string
  inServiceDate?: string | null
  amount: number
  businessUsePercent: number
  isRenovation: boolean
  receiptId?: string | null
}

function normalizeEquipmentAsset(dto: EquipmentAssetApiDto): EquipmentAsset {
  return {
    id: dto.id,
    ownerTaxYearId: dto.ownerTaxYearId,
    assetName: dto.assetName,
    purchaseDate: dto.purchaseDate,
    inServiceDate: dto.inServiceDate ?? null,
    amount: dto.amount,
    businessUsePercent: dto.businessUsePercent,
    aiSuggestion: dto.aiSuggestion,
    aiExplanation: dto.aiExplanation ?? null,
    isHighPriority: dto.isHighPriority,
    receiptId: dto.receiptId ?? null,
    createdAt: dto.createdAt,
    lastModified: dto.lastModified ?? null,
  }
}

export interface GiftCardLiabilityApiDto {
  id: string
  ownerTaxYearId: string
  period: string
  totalSold: number
  totalRedeemed: number
  outstandingBalance: number
  dataSource: string
  status: string
  createdAt: string
  lastModified?: string | null
}

export interface GiftCardLiability {
  id: string
  ownerTaxYearId: string
  period: string
  totalSold: number
  totalRedeemed: number
  outstandingBalance: number
  dataSource: string
  status: string
  createdAt: string
  lastModified: string | null
}

export interface CreateGiftCardLiabilityParams {
  ownerTaxYearId: string
  period: string
  totalSold: number
  totalRedeemed: number
  dataSource?: string | null
}

export interface UpdateGiftCardLiabilityParams {
  id: string
  period: string
  totalSold: number
  totalRedeemed: number
  dataSource?: string | null
}

function normalizeGiftCardLiability(dto: GiftCardLiabilityApiDto): GiftCardLiability {
  return {
    id: dto.id,
    ownerTaxYearId: dto.ownerTaxYearId,
    period: dto.period,
    totalSold: dto.totalSold,
    totalRedeemed: dto.totalRedeemed,
    outstandingBalance: dto.outstandingBalance,
    dataSource: dto.dataSource ?? '',
    status: dto.status,
    createdAt: dto.createdAt,
    lastModified: dto.lastModified ?? null,
  }
}

export interface MembershipCreditApiDto {
  id: string
  ownerTaxYearId: string
  period: string
  creditsIssued: number
  creditsUsed: number
  creditsExpired: number
  expiryPolicy?: string | null
  status: string
  createdAt: string
  lastModified?: string | null
}

export interface MembershipCredit {
  id: string
  ownerTaxYearId: string
  period: string
  creditsIssued: number
  creditsUsed: number
  creditsExpired: number
  expiryPolicy: string | null
  status: string
  createdAt: string
  lastModified: string | null
}

export interface CreateMembershipCreditParams {
  ownerTaxYearId: string
  period: string
  creditsIssued: number
  creditsUsed: number
  creditsExpired: number
  expiryPolicy?: string | null
}

export interface UpdateMembershipCreditParams {
  id: string
  period: string
  creditsIssued: number
  creditsUsed: number
  creditsExpired: number
  expiryPolicy?: string | null
}

function normalizeMembershipCredit(dto: MembershipCreditApiDto): MembershipCredit {
  return {
    id: dto.id,
    ownerTaxYearId: dto.ownerTaxYearId,
    period: dto.period,
    creditsIssued: dto.creditsIssued,
    creditsUsed: dto.creditsUsed,
    creditsExpired: dto.creditsExpired,
    expiryPolicy: dto.expiryPolicy ?? null,
    status: dto.status,
    createdAt: dto.createdAt,
    lastModified: dto.lastModified ?? null,
  }
}

export function createTaxiqOwnerAssetsRepository(client: HttpClient = httpClient) {
  return {
    async listEquipment(ownerTaxYearId: string): Promise<EquipmentAsset[]> {
      const data = await client.get<EquipmentAssetApiDto[]>(
        `/api/v1/taxiq/owner/equipment?ownerTaxYearId=${encodeURIComponent(ownerTaxYearId)}`,
      )
      return (data ?? []).map(normalizeEquipmentAsset)
    },

    async createEquipment(params: CreateEquipmentAssetParams): Promise<string> {
      return await client.post<string>('/api/v1/taxiq/owner/equipment', {
        ownerTaxYearId: params.ownerTaxYearId,
        assetName: params.assetName,
        purchaseDate: params.purchaseDate,
        inServiceDate: params.inServiceDate ?? null,
        amount: params.amount,
        businessUsePercent: params.businessUsePercent,
        isRenovation: params.isRenovation,
        receiptId: params.receiptId ?? null,
      })
    },

    async updateEquipment(params: UpdateEquipmentAssetParams): Promise<void> {
      await client.put(`/api/v1/taxiq/owner/equipment/${encodeURIComponent(params.id)}`, {
        assetName: params.assetName,
        purchaseDate: params.purchaseDate,
        inServiceDate: params.inServiceDate ?? null,
        amount: params.amount,
        businessUsePercent: params.businessUsePercent,
        isRenovation: params.isRenovation,
        receiptId: params.receiptId ?? null,
      })
    },

    async deleteEquipment(id: string): Promise<void> {
      await client.del(`/api/v1/taxiq/owner/equipment/${encodeURIComponent(id)}`)
    },

    async listGiftCardLiabilities(ownerTaxYearId: string): Promise<GiftCardLiability[]> {
      const data = await client.get<GiftCardLiabilityApiDto[]>(
        `/api/v1/taxiq/owner/gift-card-liabilities?ownerTaxYearId=${encodeURIComponent(ownerTaxYearId)}`,
      )
      return (data ?? []).map(normalizeGiftCardLiability)
    },

    async createGiftCardLiability(params: CreateGiftCardLiabilityParams): Promise<string> {
      return await client.post<string>('/api/v1/taxiq/owner/gift-card-liabilities', {
        ownerTaxYearId: params.ownerTaxYearId,
        period: params.period,
        totalSold: params.totalSold,
        totalRedeemed: params.totalRedeemed,
        dataSource: params.dataSource ?? null,
      })
    },

    async updateGiftCardLiability(params: UpdateGiftCardLiabilityParams): Promise<void> {
      await client.put(`/api/v1/taxiq/owner/gift-card-liabilities/${encodeURIComponent(params.id)}`, {
        period: params.period,
        totalSold: params.totalSold,
        totalRedeemed: params.totalRedeemed,
        dataSource: params.dataSource ?? null,
      })
    },

    async deleteGiftCardLiability(id: string): Promise<void> {
      await client.del(`/api/v1/taxiq/owner/gift-card-liabilities/${encodeURIComponent(id)}`)
    },

    async listMembershipCredits(ownerTaxYearId: string): Promise<MembershipCredit[]> {
      const data = await client.get<MembershipCreditApiDto[]>(
        `/api/v1/taxiq/owner/membership-credits?ownerTaxYearId=${encodeURIComponent(ownerTaxYearId)}`,
      )
      return (data ?? []).map(normalizeMembershipCredit)
    },

    async createMembershipCredit(params: CreateMembershipCreditParams): Promise<string> {
      return await client.post<string>('/api/v1/taxiq/owner/membership-credits', {
        ownerTaxYearId: params.ownerTaxYearId,
        period: params.period,
        creditsIssued: params.creditsIssued,
        creditsUsed: params.creditsUsed,
        creditsExpired: params.creditsExpired,
        expiryPolicy: params.expiryPolicy ?? null,
      })
    },

    async updateMembershipCredit(params: UpdateMembershipCreditParams): Promise<void> {
      await client.put(`/api/v1/taxiq/owner/membership-credits/${encodeURIComponent(params.id)}`, {
        period: params.period,
        creditsIssued: params.creditsIssued,
        creditsUsed: params.creditsUsed,
        creditsExpired: params.creditsExpired,
        expiryPolicy: params.expiryPolicy ?? null,
      })
    },

    async deleteMembershipCredit(id: string): Promise<void> {
      await client.del(`/api/v1/taxiq/owner/membership-credits/${encodeURIComponent(id)}`)
    },
  }
}

export const taxiqOwnerAssetsRepository = createTaxiqOwnerAssetsRepository()
export default taxiqOwnerAssetsRepository
