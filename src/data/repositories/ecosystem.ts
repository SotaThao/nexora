/**
 * ecosystemRepository — VlinkPay ecosystem list + SSO sign-in.
 *
 * Mirrors Client ecosystem APIs:
 *   GET  /api/v1/Client/ecosystem
 *   POST /api/v1/Client/ecosystem/signin  { id }
 */

import httpClient from '../../lib/httpClient'
import type { EcosystemItem, EcosystemSignInResult } from '../../types/domain'

interface VlinkPayEcosystemDto {
  id?: string
  name?: string
  url?: string | null
  logoUrl?: string | null
}

interface VlinkPayEcosystemSignInResponseDto {
  redirectUrl?: string | null
}

function normalizeEcosystem(raw: VlinkPayEcosystemDto): EcosystemItem | null {
  const id = raw.id?.trim()
  const name = raw.name?.trim()
  if (!id || !name) return null

  return {
    id,
    name,
    url: raw.url?.trim() ?? '',
    logoUrl: raw.logoUrl?.trim() ?? null,
  }
}

export function createEcosystemRepository(client = httpClient) {
  return {
    async list(): Promise<EcosystemItem[]> {
      const response = await client.get<VlinkPayEcosystemDto[]>('/api/v1/Client/ecosystem')
      if (!Array.isArray(response)) return []
      return response
        .map(normalizeEcosystem)
        .filter((item): item is EcosystemItem => item !== null)
    },

    async signIn(params: {
      id: string
      path?: string | null
      pageName?: string | null
    }): Promise<EcosystemSignInResult> {
      const response = await client.post<VlinkPayEcosystemSignInResponseDto>(
        '/api/v1/Client/ecosystem/signin',
        {
          id: params.id,
          ...(params.path ? { path: params.path } : {}),
          ...(params.pageName ? { pageName: params.pageName } : {}),
        },
      )
      return {
        redirectUrl: response?.redirectUrl?.trim() ?? null,
      }
    },
  }
}

const ecosystemRepository = createEcosystemRepository()
export default ecosystemRepository
