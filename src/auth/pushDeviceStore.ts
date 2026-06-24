import { storage } from '../utils/storage'

export type PushDevicePlatform = 'ios' | 'android'

export type PushDeviceRecord = {
  playerId: string
  pushToken: string | null
  onesignalUserId: string | null
  platform: PushDevicePlatform
  updatedAt: string
  lastSyncedPlayerId: string | null
  lastSyncedAt: string | null
}

const STORAGE_KEY = 'nexora_push_device'

function readRecord(): PushDeviceRecord | null {
  const raw = storage.getItem(STORAGE_KEY)
  if (!raw) return null

  try {
    return JSON.parse(raw) as PushDeviceRecord
  } catch {
    return null
  }
}

export const pushDeviceStore = {
  get(): PushDeviceRecord | null {
    return readRecord()
  },

  save(next: Omit<PushDeviceRecord, 'lastSyncedPlayerId' | 'lastSyncedAt' | 'updatedAt'> & {
    lastSyncedPlayerId?: string | null
    lastSyncedAt?: string | null
    updatedAt?: string
  }): PushDeviceRecord {
    const current = readRecord()
    const record: PushDeviceRecord = {
      playerId: next.playerId,
      pushToken: next.pushToken ?? null,
      onesignalUserId: next.onesignalUserId ?? null,
      platform: next.platform,
      updatedAt: next.updatedAt ?? new Date().toISOString(),
      lastSyncedPlayerId: next.lastSyncedPlayerId ?? current?.lastSyncedPlayerId ?? null,
      lastSyncedAt: next.lastSyncedAt ?? current?.lastSyncedAt ?? null,
    }

    storage.setItem(STORAGE_KEY, JSON.stringify(record))
    return record
  },

  markSynced(playerId: string): void {
    const current = readRecord()
    if (!current) return

    storage.setItem(STORAGE_KEY, JSON.stringify({
      ...current,
      lastSyncedPlayerId: playerId,
      lastSyncedAt: new Date().toISOString(),
    } satisfies PushDeviceRecord))
  },

  needsSync(): boolean {
    const current = readRecord()
    if (!current?.playerId) return false
    return current.playerId !== current.lastSyncedPlayerId
  },

  clearSyncState(): void {
    const current = readRecord()
    if (!current) return

    storage.setItem(STORAGE_KEY, JSON.stringify({
      ...current,
      lastSyncedPlayerId: null,
      lastSyncedAt: null,
    } satisfies PushDeviceRecord))
  },
}

export default pushDeviceStore
