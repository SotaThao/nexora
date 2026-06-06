import { describe, it, expect, beforeEach, vi } from 'vitest'
import { tokenStore } from '../tokenStore'

describe('tokenStore', () => {
  beforeEach(() => {
    tokenStore.clear()
    vi.restoreAllMocks()
  })

  it('should persist and restore tokens', () => {
    const mockTokens = {
      accessToken: 'access-token-123',
      refreshToken: 'refresh-token-456',
      tokenType: 'Bearer',
      expiresIn: 3600,
    }

    tokenStore.set(mockTokens)
    expect(tokenStore.get()).toEqual(mockTokens)
  })

  it('should return null if no tokens are stored', () => {
    expect(tokenStore.get()).toBeNull()
  })

  it('should clear tokens', () => {
    const mockTokens = {
      accessToken: 'access-token-123',
      refreshToken: 'refresh-token-456',
    }

    tokenStore.set(mockTokens)
    expect(tokenStore.get()).toEqual(mockTokens)

    tokenStore.clear()
    expect(tokenStore.get()).toBeNull()
  })

  it('should call subscribers on clear', () => {
    const callback1 = vi.fn()
    const callback2 = vi.fn()

    const unsub1 = tokenStore.subscribe(callback1)
    const unsub2 = tokenStore.subscribe(callback2)

    tokenStore.clear()

    expect(callback1).toHaveBeenCalledTimes(1)
    expect(callback2).toHaveBeenCalledTimes(1)

    unsub1()
    unsub2()
  })

  it('should call subscribers on set and clear', () => {
    const callback = vi.fn()
    const unsubscribe = tokenStore.subscribe(callback)

    const mockTokens = { accessToken: '123', refreshToken: '456' }
    tokenStore.set(mockTokens)
    expect(callback).toHaveBeenLastCalledWith(mockTokens)

    tokenStore.clear()
    expect(callback).toHaveBeenLastCalledWith(null)

    unsubscribe()
  })

  it('should unsubscribe and not call removed listener', () => {
    const callback = vi.fn()
    const unsubscribe = tokenStore.subscribe(callback)

    unsubscribe()
    tokenStore.clear()

    expect(callback).not.toHaveBeenCalled()
  })
})
