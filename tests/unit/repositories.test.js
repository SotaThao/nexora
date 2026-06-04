/**
 * Unit tests for all 7 repositories.
 *
 * Each test uses a fresh in-memory fake adapter injected via the
 * createXxxRepository(fakeAdapter) factory — no real storage is touched.
 *
 * Fake adapter shape mirrors storageAdapter: { get, set, remove } returning
 * Promises, with data held in a plain JS object (store).
 */
import { describe, it, expect, beforeEach } from 'vitest'

import { createTransactionsRepository }   from '../../src/data/repositories/transactions'
import { createMerchantsRepository }      from '../../src/data/repositories/merchants'
import { createProfileSettingsRepository } from '../../src/data/repositories/profileSettings'
import { createReviewsRepository }        from '../../src/data/repositories/reviews'
import { createNotificationsRepository }  from '../../src/data/repositories/notifications'
import { createStaffAccountsRepository }  from '../../src/data/repositories/staffAccounts'
import { createPendingAccountsRepository } from '../../src/data/repositories/pendingAccounts'

// ---------------------------------------------------------------------------
// Fake adapter factory — creates an isolated in-memory store per test.
// ---------------------------------------------------------------------------
function makeFakeAdapter(initial = {}) {
  const store = { ...initial }
  return {
    async get(key) {
      return store[key] ?? null
    },
    async set(key, value) {
      store[key] = value
    },
    async remove(key) {
      delete store[key]
    },
    // Expose the raw store for assertions (test-only, not part of the adapter interface)
    _store: store,
  }
}

// ---------------------------------------------------------------------------
// transactionsRepository
// ---------------------------------------------------------------------------
describe('transactionsRepository', () => {
  let repo
  let fa

  beforeEach(() => {
    fa = makeFakeAdapter()
    repo = createTransactionsRepository(fa)
  })

  it('list() returns [] when key is absent', async () => {
    expect(await repo.list()).toEqual([])
  })

  it('add() appends a transaction and returns it', async () => {
    const tx = { id: 'TX-1', amount: 50 }
    const result = await repo.add(tx)
    expect(result).toEqual(tx)
    expect(await repo.list()).toEqual([tx])
  })

  it('add() appends multiple transactions in order', async () => {
    const tx1 = { id: 'TX-1', amount: 10 }
    const tx2 = { id: 'TX-2', amount: 20 }
    await repo.add(tx1)
    await repo.add(tx2)
    expect(await repo.list()).toEqual([tx1, tx2])
  })

  it('update() merges patch into matching transaction', async () => {
    await repo.add({ id: 'TX-1', amount: 50, status: 'Pending' })
    await repo.update('TX-1', { status: 'Success' })
    const [tx] = await repo.list()
    expect(tx.status).toBe('Success')
    expect(tx.amount).toBe(50) // unchanged field preserved
  })

  it('update() is a no-op for a non-existent id', async () => {
    await repo.add({ id: 'TX-1', amount: 50 })
    await repo.update('TX-UNKNOWN', { status: 'Failed' })
    const list = await repo.list()
    expect(list).toHaveLength(1)
    expect(list[0].status).toBeUndefined()
  })

  it('round-trip: data persisted by set is returned by list', async () => {
    const txList = [{ id: 'TX-A' }, { id: 'TX-B' }]
    await fa.set('nexora_transactions', txList)
    expect(await repo.list()).toEqual(txList)
  })
})

// ---------------------------------------------------------------------------
// merchantsRepository
// ---------------------------------------------------------------------------
describe('merchantsRepository', () => {
  let repo
  let fa

  beforeEach(() => {
    fa = makeFakeAdapter()
    repo = createMerchantsRepository(fa)
  })

  it('getSetup() returns null when key is absent', async () => {
    expect(await repo.getSetup()).toBeNull()
  })

  it('saveSetup() persists and getSetup() reads back', async () => {
    const setup = { businessInfo: { name: 'Spa' }, staffList: [] }
    await repo.saveSetup(setup)
    expect(await repo.getSetup()).toEqual(setup)
  })

  it('getStaffList() returns [] when setup is absent', async () => {
    expect(await repo.getStaffList()).toEqual([])
  })

  it('getStaffList() returns [] when staffList key missing from setup', async () => {
    await fa.set('nexora_merchant_setup', { businessInfo: { name: 'Spa' } })
    expect(await repo.getStaffList()).toEqual([])
  })

  it('getStaffList() returns the stored list', async () => {
    const staff = [{ id: 's-1', fullName: 'Mia' }]
    await fa.set('nexora_merchant_setup', { staffList: staff })
    expect(await repo.getStaffList()).toEqual(staff)
  })

  it('saveStaffList() merges into existing setup, preserving other fields', async () => {
    await fa.set('nexora_merchant_setup', { businessInfo: { name: 'Spa' }, touchPoints: [] })
    const newStaff = [{ id: 's-2', fullName: 'Leo' }]
    await repo.saveStaffList(newStaff)
    const setup = await repo.getSetup()
    expect(setup.staffList).toEqual(newStaff)
    expect(setup.businessInfo.name).toBe('Spa') // untouched
    expect(setup.touchPoints).toEqual([])       // untouched
  })

  it('saveStaffList() creates a minimal setup object when none exists', async () => {
    await repo.saveStaffList([{ id: 's-1' }])
    const setup = await repo.getSetup()
    expect(setup.staffList).toHaveLength(1)
  })
})

// ---------------------------------------------------------------------------
// profileSettingsRepository
// ---------------------------------------------------------------------------
describe('profileSettingsRepository', () => {
  let repo
  let fa

  beforeEach(() => {
    fa = makeFakeAdapter()
    repo = createProfileSettingsRepository(fa)
  })

  it('get() returns null when key is absent', async () => {
    expect(await repo.get()).toBeNull()
  })

  it('save() persists and get() reads back', async () => {
    const settings = { theme: 'dark', language: 'vi' }
    await repo.save(settings)
    expect(await repo.get()).toEqual(settings)
  })

  it('save() overwrites previous value', async () => {
    await repo.save({ theme: 'light' })
    await repo.save({ theme: 'dark' })
    expect((await repo.get()).theme).toBe('dark')
  })
})

// ---------------------------------------------------------------------------
// reviewsRepository
// ---------------------------------------------------------------------------
describe('reviewsRepository', () => {
  let repo
  let fa

  beforeEach(() => {
    fa = makeFakeAdapter()
    repo = createReviewsRepository(fa)
  })

  it('list() returns [] when key is absent', async () => {
    expect(await repo.list()).toEqual([])
  })

  it('add() appends and returns the review', async () => {
    const review = { id: 'R-1', rating: 5, text: 'Great!' }
    const result = await repo.add(review)
    expect(result).toEqual(review)
    expect(await repo.list()).toHaveLength(1)
  })

  it('update() merges patch by id', async () => {
    await repo.add({ id: 'R-1', rating: 4 })
    await repo.update('R-1', { rating: 5 })
    const [r] = await repo.list()
    expect(r.rating).toBe(5)
  })

  it('update() is a no-op for unknown id', async () => {
    await repo.add({ id: 'R-1', rating: 4 })
    await repo.update('R-UNKNOWN', { rating: 1 })
    expect((await repo.list())[0].rating).toBe(4)
  })
})

// ---------------------------------------------------------------------------
// notificationsRepository
// ---------------------------------------------------------------------------
describe('notificationsRepository', () => {
  let repo
  let fa

  beforeEach(() => {
    fa = makeFakeAdapter()
    repo = createNotificationsRepository(fa)
  })

  it('list() returns [] when key is absent', async () => {
    expect(await repo.list()).toEqual([])
  })

  it('add() appends and returns the notification', async () => {
    const n = { id: 'N-1', message: 'Hello', read: false }
    const result = await repo.add(n)
    expect(result).toEqual(n)
    expect(await repo.list()).toHaveLength(1)
  })

  it('markRead() sets read:true on matching id', async () => {
    await repo.add({ id: 'N-1', read: false })
    await repo.markRead('N-1')
    const [n] = await repo.list()
    expect(n.read).toBe(true)
  })

  it('markRead() does not affect other notifications', async () => {
    await repo.add({ id: 'N-1', read: false })
    await repo.add({ id: 'N-2', read: false })
    await repo.markRead('N-1')
    const list = await repo.list()
    expect(list.find((n) => n.id === 'N-2').read).toBe(false)
  })

  it('replaceAll() overwrites the entire list', async () => {
    await repo.add({ id: 'N-1' })
    const newList = [{ id: 'N-10' }, { id: 'N-11' }]
    await repo.replaceAll(newList)
    expect(await repo.list()).toEqual(newList)
  })
})

// ---------------------------------------------------------------------------
// staffAccountsRepository
// ---------------------------------------------------------------------------
describe('staffAccountsRepository', () => {
  let repo
  let fa

  beforeEach(() => {
    fa = makeFakeAdapter()
    repo = createStaffAccountsRepository(fa)
  })

  it('getAll() returns {} when key is absent', async () => {
    expect(await repo.getAll()).toEqual({})
  })

  it('get() returns null for unknown staffId', async () => {
    expect(await repo.get('s-UNKNOWN')).toBeNull()
  })

  it('save() creates an account blob for a new staffId', async () => {
    await repo.save('s-1', { fullName: 'Mia', pin: '1234' })
    expect(await repo.get('s-1')).toEqual({ fullName: 'Mia', pin: '1234' })
  })

  it('save() merges data into an existing account blob', async () => {
    await repo.save('s-1', { fullName: 'Mia' })
    await repo.save('s-1', { pin: '9999' })
    const account = await repo.get('s-1')
    expect(account.fullName).toBe('Mia') // preserved
    expect(account.pin).toBe('9999')     // merged
  })

  it('save() does not overwrite other staffIds', async () => {
    await repo.save('s-1', { fullName: 'Mia' })
    await repo.save('s-2', { fullName: 'Leo' })
    expect((await repo.get('s-1')).fullName).toBe('Mia')
    expect((await repo.get('s-2')).fullName).toBe('Leo')
  })

  it('getAll() round-trip returns all accounts', async () => {
    await repo.save('s-1', { fullName: 'Mia' })
    await repo.save('s-2', { fullName: 'Leo' })
    const all = await repo.getAll()
    expect(Object.keys(all)).toHaveLength(2)
  })
})

// ---------------------------------------------------------------------------
// pendingAccountsRepository
// ---------------------------------------------------------------------------
describe('pendingAccountsRepository', () => {
  let repo
  let fa

  beforeEach(() => {
    fa = makeFakeAdapter()
    repo = createPendingAccountsRepository(fa)
  })

  it('list() returns [] when key is absent', async () => {
    expect(await repo.list()).toEqual([])
  })

  it('add() appends and returns the account', async () => {
    const acc = { email: 'owner@test.com', password: 'pw' }
    const result = await repo.add(acc)
    expect(result).toEqual(acc)
    expect(await repo.list()).toHaveLength(1)
  })

  it('findByEmail() returns matching account (case-insensitive)', async () => {
    await repo.add({ email: 'Owner@Test.com', role: 'admin' })
    const found = await repo.findByEmail('owner@test.com')
    expect(found).not.toBeNull()
    expect(found.role).toBe('admin')
  })

  it('findByEmail() returns null when no match', async () => {
    await repo.add({ email: 'other@test.com' })
    expect(await repo.findByEmail('nobody@test.com')).toBeNull()
  })

  it('replaceAll() overwrites the list', async () => {
    await repo.add({ email: 'a@test.com' })
    const newList = [{ email: 'b@test.com' }, { email: 'c@test.com' }]
    await repo.replaceAll(newList)
    expect(await repo.list()).toEqual(newList)
  })

  it('round-trip: data written directly to adapter is readable via list()', async () => {
    const data = [{ email: 'direct@test.com' }]
    await fa.set('nexora_pending_accounts', data)
    expect(await repo.list()).toEqual(data)
  })
})
