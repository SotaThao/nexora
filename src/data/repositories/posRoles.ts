/**
 * posRolesRepository — POS Owner Setup: Roles & Permissions (US-015).
 */
import httpClient from '../../lib/httpClient'
import type { PosRoleApiDto } from '../../types/repositories'

type HttpClient = typeof httpClient

export function createPosRolesRepository(client: HttpClient = httpClient) {
  return {
    async getPosRoles(): Promise<PosRoleApiDto[]> {
      const res = await client.get<PosRoleApiDto[]>('/api/v1/merchant/pos/roles')
      return res ?? []
    },

    async createPosRole(name: string): Promise<string> {
      return await client.post<string>('/api/v1/merchant/pos/roles', { name })
    },

    async updateRolePermissions(roleId: string, permissionDefinitionIds: string[]): Promise<boolean> {
      return await client.put<boolean>(`/api/v1/merchant/pos/roles/${roleId}/permissions`, {
        permissionDefinitionIds,
      })
    },

    async deletePosRole(roleId: string): Promise<boolean> {
      return await client.del<boolean>(`/api/v1/merchant/pos/roles/${roleId}`)
    },
  }
}

export const posRolesRepository = createPosRolesRepository()
export default posRolesRepository
