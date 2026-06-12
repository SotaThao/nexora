/**
 * pendingAccountsRepository — registration queue (transitional).
 */
import { adapter as defaultAdapter } from '../adapters'

const KEY = 'nexora_pending_accounts'

type StorageAdapter = typeof defaultAdapter

export interface PendingAccount {
  email?: string
  role?: string
  staffId?: string
  fullName?: string
  [key: string]: unknown
}

export function createPendingAccountsRepository(a: StorageAdapter = defaultAdapter) {
  return {
    async list(): Promise<PendingAccount[]> {
      const raw = (await a.get(KEY)) as unknown
      return (raw as PendingAccount[] | null) ?? []
    },

    async add(account: PendingAccount): Promise<PendingAccount> {
      const list = ((await a.get(KEY)) as unknown as PendingAccount[] | null) ?? []
      const updated = [...list, account]
      await a.set(KEY, updated)
      return account
    },

    async findByEmail(email: string): Promise<PendingAccount | null> {
      const list = ((await a.get(KEY)) as unknown as PendingAccount[] | null) ?? []
      const lower = email.toLowerCase()
      return list.find((acc) => acc.email?.toLowerCase() === lower) ?? null
    },

    async replaceAll(list: PendingAccount[]): Promise<void> {
      await a.set(KEY, list)
    },
  }
}

export const pendingAccountsRepository = createPendingAccountsRepository()
export default pendingAccountsRepository
