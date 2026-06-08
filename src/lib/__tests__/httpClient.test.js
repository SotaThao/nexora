import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { tokenStore } from '../../auth/tokenStore'

describe('httpClient', () => {
  let httpClient

  beforeEach(async () => {
    vi.resetModules()
    vi.stubEnv('VITE_DATA_SOURCE', 'api')
    vi.stubEnv('VITE_API_BASE_URL', 'https://api.test')
    httpClient = await import('../httpClient')

    // Clear tokenStore
    tokenStore.clear()

    // Mock global fetch
    globalThis.fetch = vi.fn()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllEnvs()
  })

  it('should parse RFC-9110 ProblemDetails on HTTP errors', async () => {
    const errorResponse = {
      errorCode: 'USER_LOGIN_INVALID_USERNAME_OR_PASSWORD',
      errors: { password: ['Incorrect password'] },
      retryAfter: 60,
    }

    globalThis.fetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      headers: new Headers(),
      text: async () => JSON.stringify(errorResponse),
    })

    await expect(httpClient.get('/auth/login')).rejects.toEqual({
      status: 400,
      errorCode: 'USER_LOGIN_INVALID_USERNAME_OR_PASSWORD',
      errors: { password: ['Incorrect password'] },
      retryAfter: 60,
    })
  })

  it('should normalize network failure exceptions', async () => {
    globalThis.fetch.mockRejectedValueOnce(new TypeError('Failed to fetch'))

    await expect(httpClient.get('/some-endpoint')).rejects.toEqual({
      status: 0,
      errorCode: 'NETWORK_ERROR',
      errors: {},
      retryAfter: null,
    })
  })

  it('should inject Bearer token from tokenStore if not anonymous', async () => {
    tokenStore.set({ accessToken: 'test-token', refreshToken: 'ref-token' })

    globalThis.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ success: true }),
    })

    await httpClient.get('/protected-endpoint')

    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://api.test/protected-endpoint',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer test-token',
        }),
      })
    )
  })

  it('should NOT inject Bearer token if request is anonymous', async () => {
    tokenStore.set({ accessToken: 'test-token', refreshToken: 'ref-token' })

    globalThis.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ success: true }),
    })

    await httpClient.get('/public-endpoint', { anonymous: true })

    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://api.test/public-endpoint',
      expect.not.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer test-token',
        }),
      })
    )
  })

  it('should send FormData without setting Content-Type', async () => {
    const formData = new FormData()
    formData.append('file', new Blob(['test'], { type: 'image/png' }))

    globalThis.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ url: 'http://test.image' }),
    })

    await httpClient.upload('/upload', formData)

    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://api.test/upload',
      expect.objectContaining({
        method: 'POST',
        body: formData,
      })
    )

    const fetchCall = globalThis.fetch.mock.calls[0]
    const headers = fetchCall[1].headers
    expect(headers['Content-Type']).toBeUndefined()
  })

  it('should send FormData using PUT method if specified', async () => {
    const formData = new FormData()

    globalThis.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: async () => null,
    })

    await httpClient.upload('/upload-put', formData, 'PUT')

    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://api.test/upload-put',
      expect.objectContaining({
        method: 'PUT',
        body: formData,
      })
    )
  })

  it('should handle single-flight 401 token refresh and retry', async () => {
    tokenStore.set({ accessToken: 'expired-access', refreshToken: 'good-refresh' })

    // First call to /protected fails with 401
    globalThis.fetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      headers: new Headers(),
      text: async () => '',
    })

    // Token refresh call returns new tokens
    const newTokens = {
      accessToken: 'new-access',
      refreshToken: 'new-refresh',
      tokenType: 'Bearer',
      expiresIn: 3600,
    }
    globalThis.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: async () => JSON.stringify(newTokens),
    })

    // Retried call succeeds
    globalThis.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ data: 'secret' }),
    })

    const result = await httpClient.get('/protected')
    expect(result).toEqual({ data: 'secret' })

    // Verify tokenStore got updated
    expect(tokenStore.get()).toEqual(newTokens)

    // Verify calls
    expect(globalThis.fetch).toHaveBeenCalledTimes(3)
    // First call: check headers
    expect(globalThis.fetch.mock.calls[0][1].headers.Authorization).toBe('Bearer expired-access')
    // Second call: check refresh request
    expect(globalThis.fetch.mock.calls[1][0]).toBe('https://api.test/api/v1/authentication/refresh-token')
    expect(globalThis.fetch.mock.calls[1][1].method).toBe('POST')
    expect(JSON.parse(globalThis.fetch.mock.calls[1][1].body)).toEqual({ refreshToken: 'good-refresh' })
    // Third call: check retried headers
    expect(globalThis.fetch.mock.calls[2][1].headers.Authorization).toBe('Bearer new-access')
  })

  it('should queue concurrent 401 requests and only trigger refresh once', async () => {
    tokenStore.set({ accessToken: 'expired-access', refreshToken: 'good-refresh' })

    // Concurrent request 1 fails with 401
    globalThis.fetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      headers: new Headers(),
      text: async () => '',
    })
    // Concurrent request 2 fails with 401
    globalThis.fetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      headers: new Headers(),
      text: async () => '',
    })

    // Token refresh call returns new tokens
    const newTokens = {
      accessToken: 'new-access',
      refreshToken: 'new-refresh',
    }
    globalThis.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: async () => JSON.stringify(newTokens),
    })

    // Retried request 1 succeeds
    globalThis.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ data: 'secret1' }),
    })
    // Retried request 2 succeeds
    globalThis.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ data: 'secret2' }),
    })

    // Run both concurrently
    const [res1, res2] = await Promise.all([httpClient.get('/protected-1'), httpClient.get('/protected-2')])

    expect(res1).toEqual({ data: 'secret1' })
    expect(res2).toEqual({ data: 'secret2' })

    // Verify tokenStore got updated
    expect(tokenStore.get()).toEqual(newTokens)

    // Total fetch calls should be 5
    expect(globalThis.fetch).toHaveBeenCalledTimes(5)

    // Let's count how many times POST /refresh-token was called
    const refreshCalls = globalThis.fetch.mock.calls.filter(
      (call) => call[0] === 'https://api.test/api/v1/authentication/refresh-token'
    )
    expect(refreshCalls.length).toBe(1)
  })
})
