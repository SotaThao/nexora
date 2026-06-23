/**
 * ecosystemRepository — VlinkPay ecosystem list + SSO sign-in.
 *
 * Mirrors vlinkpay-web-app CustomerService:
 *   GET  /customers/ecosystems/webs
 *   POST /customers/ecosystems/sign-in  { name }
 */

import vlinkPayHttpClient from '../../lib/vlinkPayHttpClient'
import type { EcosystemItem, EcosystemSignInResult } from '../../types/domain'
import { resolveEcosystemBrandKey } from '../../utils/ecosystem'

interface VlinkPayEcosystemDto {
  name?: string
  url?: string | null
}

interface VlinkPayEcosystemSignInResponseDto {
  redirectUrl?: string | null
}

function normalizeEcosystem(raw: VlinkPayEcosystemDto): EcosystemItem | null {
  const name = raw.name?.trim()
  if (!name) return null

  return {
    id: name,
    name,
    url: raw.url?.trim() ?? '',
    logoUrl: null,
  }
}

export function createEcosystemRepository(client = vlinkPayHttpClient) {
  return {
    async list(): Promise<EcosystemItem[]> {
      const response = await client.get<VlinkPayEcosystemDto[]>('/customers/ecosystems/webs')
      if (!Array.isArray(response)) return []
      return response
        .map(normalizeEcosystem)
        .filter((item): item is EcosystemItem => item !== null)
    },

    async signIn(params: { name: string; path?: string | null }): Promise<EcosystemSignInResult> {
      const brandKey = resolveEcosystemBrandKey(params.name) ?? params.name.trim().toLowerCase()
      const response = await client.post<VlinkPayEcosystemSignInResponseDto>(
        '/customers/ecosystems/sign-in',
        {
          name: brandKey,
          ...(params.path ? { path: params.path } : {}),
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
