/**
 * jurisdictionsRepository — API implementation for US-037 (TaxIQ Jurisdictions, mục 19).
 * Backend: EmployerController.GetRegistrationsSummary, route
 * `api/v1/taxiq/owner/employers/{id}/registrations/summary`. Read-only aggregator — editing a
 * registration still goes through the existing `taxiqEmployerRepository.upsertRegistration`.
 */
import httpClient from '../../lib/httpClient'

type HttpClient = typeof httpClient

export interface JurisdictionSummaryItem {
  id: string
  jurisdiction: string
  name: string
  accountNumberMasked: string | null
  agencyName: string | null
  registrationStatus: string
  depositSchedule: string
  nextDue: string | null
  registeredDate: string | null
  expirationDate: string | null
  employeeTaxYtd: number
  employerTaxYtd: number
  isDepositDueSoon: boolean
  isRegistrationExpiringSoon: boolean
}

export function createJurisdictionsRepository(client: HttpClient = httpClient) {
  return {
    async getJurisdictionSummary(employerId: string): Promise<JurisdictionSummaryItem[]> {
      const data = await client.get<JurisdictionSummaryItem[]>(
        `/api/v1/taxiq/owner/employers/${encodeURIComponent(employerId)}/registrations/summary`,
      )
      return data ?? []
    },
  }
}

export const jurisdictionsRepository = createJurisdictionsRepository()
export default jurisdictionsRepository
