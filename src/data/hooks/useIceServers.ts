import { useQuery } from '@tanstack/react-query'
import { qk } from '../queryKeys'
import { communityCallRepository } from '../repositories/communityCall'

/**
 * ICE server credentials (STUN/TURN) for `RTCPeerConnection` — real server-state with a TTL
 * (US-02 mints per-user Cloudflare Calls TURN credentials), unlike `src/calls/callState.ts`
 * which is ephemeral runtime state and intentionally does not use React Query.
 */
export function useIceServers({ enabled = true } = {}) {
  return useQuery({
    queryKey: qk.communityCallIceServers(),
    queryFn: () => communityCallRepository.getIceServers(),
    enabled,
    // Credentials are minted with a 24h TTL server-side (US-02) but a call may be started well
    // into that window — refetch somewhat eagerly rather than risk stale/expired TURN creds.
    staleTime: 1000 * 60 * 10,
    retry: 1,
  })
}

export default useIceServers
