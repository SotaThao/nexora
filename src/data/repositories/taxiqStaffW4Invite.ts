/**
 * taxiqStaffW4InviteRepository — API for US-028 (secure-link W-4 submission for local
 * staff, no login account). Create/resend is Owner-authenticated; context + submit are
 * public/anonymous — every anonymous call passes `{ anonymous: true }` so httpClient
 * skips the Bearer token and the 401-refresh retry loop, mirroring taxiqCpaViewer.ts.
 */
import httpClient from '../../lib/httpClient'

type HttpClient = typeof httpClient

export const STAFF_W4_INVITE_EXPIRY_DAYS = [7, 15, 30] as const
export type StaffW4InviteExpiryDays = (typeof STAFF_W4_INVITE_EXPIRY_DAYS)[number]

export const STAFF_W4_INVITE_REMINDER_CADENCES = ['Every3Days', 'Once', 'Every7Days'] as const
export type StaffW4InviteReminderCadence = (typeof STAFF_W4_INVITE_REMINDER_CADENCES)[number]

export interface CreateStaffW4InviteParams {
  businessStaffLinkId: string
  ownerTaxYearId: string
  expiryDays: StaffW4InviteExpiryDays
  reminderCadence: StaffW4InviteReminderCadence
}

export interface StaffW4InviteApiDto {
  id: string
  businessStaffLinkId: string
  ownerTaxYearId: string
  accessToken: string
  expiresAt: string
  reminderCadence: string
}

export interface StaffW4Invite {
  id: string
  businessStaffLinkId: string
  ownerTaxYearId: string
  accessToken: string
  expiresAt: string
  reminderCadence: string
}

function normalizeStaffW4Invite(dto: StaffW4InviteApiDto): StaffW4Invite {
  return {
    id: dto.id,
    businessStaffLinkId: dto.businessStaffLinkId,
    ownerTaxYearId: dto.ownerTaxYearId,
    accessToken: dto.accessToken,
    expiresAt: dto.expiresAt,
    reminderCadence: dto.reminderCadence,
  }
}

export interface StaffW4InviteContextApiDto {
  businessName: string
  staffDisplayName: string
  taxYear: number
  expiresAt: string
}

export interface StaffW4InviteContext {
  businessName: string
  staffDisplayName: string
  taxYear: number
  expiresAt: string
}

function normalizeStaffW4InviteContext(dto: StaffW4InviteContextApiDto): StaffW4InviteContext {
  return {
    businessName: dto.businessName,
    staffDisplayName: dto.staffDisplayName,
    taxYear: dto.taxYear,
    expiresAt: dto.expiresAt,
  }
}

export interface SubmitStaffW4ViaInviteParams {
  accessToken: string
  ssn?: string
  ein?: string
  w4TaxYear: number
  filingStatus: string
  dependentsClaimed: number
  extraWithholdingPerPayPeriod: number
  residenceState: string
  workState: string
  stateExtraWithholding: number
}

export function createTaxiqStaffW4InviteRepository(client: HttpClient = httpClient) {
  return {
    // Also serves as "resend": calling again for the same (businessStaffLinkId,
    // ownerTaxYearId) pair revokes the previous still-active link server-side.
    async createOrResendInvite(params: CreateStaffW4InviteParams): Promise<StaffW4Invite> {
      const dto = await client.post<StaffW4InviteApiDto>('/api/v1/taxiq/staff-w4-invites', {
        businessStaffLinkId: params.businessStaffLinkId,
        ownerTaxYearId: params.ownerTaxYearId,
        expiryDays: params.expiryDays,
        reminderCadence: params.reminderCadence,
      })
      return normalizeStaffW4Invite(dto)
    },

    async getContext(token: string): Promise<StaffW4InviteContext> {
      const dto = await client.get<StaffW4InviteContextApiDto>(
        `/api/v1/taxiq/staff-w4-invites/context?token=${encodeURIComponent(token)}`,
        { anonymous: true },
      )
      return normalizeStaffW4InviteContext(dto)
    },

    async submit(params: SubmitStaffW4ViaInviteParams): Promise<void> {
      await client.post<void>(
        '/api/v1/taxiq/staff-w4-invites/submit',
        {
          accessToken: params.accessToken,
          ssn: params.ssn,
          ein: params.ein,
          w4TaxYear: params.w4TaxYear,
          filingStatus: params.filingStatus,
          dependentsClaimed: params.dependentsClaimed,
          extraWithholdingPerPayPeriod: params.extraWithholdingPerPayPeriod,
          residenceState: params.residenceState,
          workState: params.workState,
          stateExtraWithholding: params.stateExtraWithholding,
        },
        { anonymous: true },
      )
    },
  }
}

export const taxiqStaffW4InviteRepository = createTaxiqStaffW4InviteRepository()
export default taxiqStaffW4InviteRepository
