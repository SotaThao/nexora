/**
 * posDevicesRepository — POS > Check-In Devices.
 *
 * The tablets customers use to check themselves in. businessId is an explicit param on every call,
 * same as the other POS ops repositories, because a caller may work at more than one salon.
 *
 * Access is narrower than the rest of POS: the server gates these on the manage_checkin_devices
 * permission, which the Owner holds by default and only the Owner can grant to another role.
 */
import httpClient from '../../lib/httpClient'
import type {
  PosDeviceListItemApiDto,
  PosDevicePairingQrApiDto,
  PosDevicePairingQrStatusApiDto,
} from '../../types/repositories'

type HttpClient = typeof httpClient

export type PosDeviceStatusFilter = 'All' | 'Active' | 'Revoked' | 'Expired'

export function createPosDevicesRepository(client: HttpClient = httpClient) {
  return {
    // `excludeTokens` is comma-separated: the codes the operator has already replaced, so the
    // server hands out a spare it has not shown them yet.
    async getPairingQr(
      businessId: string,
      excludeTokens?: string,
    ): Promise<PosDevicePairingQrApiDto | null> {
      const res = await client.get<PosDevicePairingQrApiDto>(
        `/api/v1/merchant/pos/${businessId}/devices/pairing-qr`,
        excludeTokens ? { params: { excludeTokens } } : undefined,
      )
      return res ?? null
    },

    async getPairingQrStatus(businessId: string, token: string): Promise<boolean> {
      const res = await client.get<PosDevicePairingQrStatusApiDto>(
        `/api/v1/merchant/pos/${businessId}/devices/pairing-qr/status`,
        { params: { token } },
      )
      return res?.used ?? false
    },

    async getDevices(
      businessId: string,
      status: PosDeviceStatusFilter = 'All',
    ): Promise<PosDeviceListItemApiDto[]> {
      const res = await client.get<PosDeviceListItemApiDto[]>(
        `/api/v1/merchant/pos/${businessId}/devices`,
        { params: { status } },
      )
      return res ?? []
    },

    // Both fields are optional server-side; send only what changed.
    async updateDevice(
      businessId: string,
      deviceId: string,
      payload: { name?: string; pin?: string },
    ): Promise<void> {
      await client.put(`/api/v1/merchant/pos/${businessId}/devices/${deviceId}`, payload)
    },

    async revokeDevice(businessId: string, deviceId: string): Promise<void> {
      await client.post(`/api/v1/merchant/pos/${businessId}/devices/${deviceId}/revoke`)
    },
  }
}

const posDevicesRepository = createPosDevicesRepository()
export default posDevicesRepository
