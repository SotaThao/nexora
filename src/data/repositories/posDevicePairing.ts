/**
 * posDevicePairingRepository — the tablet's own side of Check-In Devices.
 *
 * Goes through posDeviceHttpClient, not the shared httpClient: these calls carry a device token
 * (or none at all, for pairing) and must never attach a user's bearer token.
 */
import posDeviceHttpClient from '../../lib/posDeviceHttpClient'

type Client = typeof posDeviceHttpClient

export interface PairPosDeviceRequest {
  businessId: string
  userProfileId: string
  token: string
  deviceName: string
  pin: string
}

export interface PairPosDeviceResult {
  deviceId: string
  // Returned exactly once. Store it immediately — it cannot be fetched again.
  accessToken: string
  businessName: string
}

export function createPosDevicePairingRepository(client: Client = posDeviceHttpClient) {
  return {
    async pair(payload: PairPosDeviceRequest): Promise<PairPosDeviceResult> {
      const res = await client.post<PairPosDeviceResult>('/api/v1/pos-device/pair', payload, {
        anonymous: true,
      })
      if (!res) throw new Error('Pairing returned no result')
      return res
    },

    // Gate for the tablet's own Settings screen. Rejection comes back as a 400, which the caller
    // surfaces as one generic "wrong PIN" — never as a hint about length or which digit was off.
    async verifyPin(pin: string): Promise<void> {
      await client.post('/api/v1/pos-device/settings/verify-pin', { pin })
    },

    // Revokes this device server-side. The local token is cleared by the caller: the request must
    // succeed first, otherwise a network blip would strand a still-valid tablet with no token.
    async signOut(): Promise<void> {
      await client.post('/api/v1/pos-device/sign-out')
    },
  }
}

const posDevicePairingRepository = createPosDevicePairingRepository()
export default posDevicePairingRepository
