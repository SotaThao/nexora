/**
 * communityCallRepository — REST API for Community Call (US-02/US-05).
 */

import { COMMUNITY_CALL_REST_BASE } from '../../constants/communityCall'
import httpClient from '../../lib/httpClient'

type HttpClient = typeof httpClient

interface IceServerEntryApiDto {
  urls?: string[]
  Urls?: string[]
  username?: string | null
  Username?: string | null
  credential?: string | null
  Credential?: string | null
}

interface IceServerCredentialsApiDto {
  iceServers?: IceServerEntryApiDto[]
  IceServers?: IceServerEntryApiDto[]
}

function normalizeIceServerEntry(dto: IceServerEntryApiDto): RTCIceServer {
  const urls = dto.urls ?? dto.Urls ?? []
  const username = dto.username ?? dto.Username ?? undefined
  const credential = dto.credential ?? dto.Credential ?? undefined
  return {
    urls,
    ...(username ? { username } : {}),
    ...(credential ? { credential } : {}),
  }
}

export function normalizeIceServerCredentials(dto: IceServerCredentialsApiDto): RTCIceServer[] {
  const entries = dto.iceServers ?? dto.IceServers ?? []
  return entries.map(normalizeIceServerEntry).filter((entry) => entry.urls.length > 0)
}

export function createCommunityCallRepository(client: HttpClient = httpClient) {
  return {
    /** `RTCConfiguration.iceServers` — must be fetched fresh before each call (US-02 TTL is credential-scoped, not shared). */
    async getIceServers(): Promise<RTCIceServer[]> {
      const data = await client.get<IceServerCredentialsApiDto>(
        `${COMMUNITY_CALL_REST_BASE}/ice-servers`,
      )
      return normalizeIceServerCredentials(data ?? {})
    },
  }
}

export const communityCallRepository = createCommunityCallRepository()
export default communityCallRepository
