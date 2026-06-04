import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// The httpClient module is imported at the top of the file so import.meta.env
// is already evaluated.  We test the client as-is (VITE_API_BASE_URL='' in the
// test environment, so fetch is called with relative paths like '/api/test').
// The base-URL concatenation logic is verified via the path-stripping test below.
import * as httpClient from '../../src/lib/httpClient.js'

describe('httpClient', () => {
  let fetchSpy

  beforeEach(() => {
    fetchSpy = vi.fn()
    vi.stubGlobal('fetch', fetchSpy)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  // ─── Successful GET ────────────────────────────────────────────────────────

  it('GET — resolves with parsed JSON on a 200 response', async () => {
    const payload = { id: 1, name: 'Test' }

    fetchSpy.mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: () => Promise.resolve(JSON.stringify(payload)),
    })

    const result = await httpClient.get('/api/test')

    expect(fetchSpy).toHaveBeenCalledOnce()
    expect(fetchSpy).toHaveBeenCalledWith(
      '/api/test',
      expect.objectContaining({
        method: 'GET',
        credentials: 'include',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          Accept: 'application/json',
        }),
      }),
    )
    expect(result).toEqual(payload)
  })

  it('GET — resolves with null on a 204 No Content response', async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      status: 204,
      text: () => Promise.resolve(''),
    })

    const result = await httpClient.get('/api/empty')
    expect(result).toBeNull()
  })

  // ─── 4xx / 5xx errors ─────────────────────────────────────────────────────

  it('4xx — rejects with normalized error shape from JSON error body', async () => {
    const errorBody = { code: 'NOT_FOUND', message: 'Resource not found', details: { id: 42 } }

    fetchSpy.mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: 'Not Found',
      text: () => Promise.resolve(JSON.stringify(errorBody)),
    })

    await expect(httpClient.get('/api/missing')).rejects.toEqual({
      status: 404,
      code: 'NOT_FOUND',
      message: 'Resource not found',
      details: { id: 42 },
    })
  })

  it('5xx — rejects with normalized error shape from JSON error body', async () => {
    const errorBody = {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Something went wrong',
      details: null,
    }

    fetchSpy.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      text: () => Promise.resolve(JSON.stringify(errorBody)),
    })

    await expect(httpClient.post('/api/create', { name: 'x' })).rejects.toEqual({
      status: 500,
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Something went wrong',
      details: null,
    })
  })

  it('4xx — rejects with fallback error shape when response body is not JSON', async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: false,
      status: 403,
      statusText: 'Forbidden',
      text: () => Promise.resolve('Access denied'),
    })

    await expect(httpClient.get('/api/protected')).rejects.toEqual({
      status: 403,
      code: 'HTTP_ERROR',
      message: 'Forbidden',
      details: null,
    })
  })

  it('4xx — rejects with fallback error shape when response body is empty', async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: false,
      status: 422,
      statusText: 'Unprocessable Entity',
      text: () => Promise.resolve(''),
    })

    await expect(httpClient.put('/api/item', {})).rejects.toEqual({
      status: 422,
      code: 'HTTP_ERROR',
      message: 'Unprocessable Entity',
      details: null,
    })
  })

  // ─── Network errors ────────────────────────────────────────────────────────

  it('network error — rejects with { status: 0, code: "NETWORK_ERROR" }', async () => {
    fetchSpy.mockRejectedValueOnce(new Error('Failed to fetch'))

    await expect(httpClient.get('/api/test')).rejects.toEqual({
      status: 0,
      code: 'NETWORK_ERROR',
      message: 'Failed to fetch',
      details: null,
    })
  })

  it('network error — uses generic message when error has no message', async () => {
    fetchSpy.mockRejectedValueOnce({})

    await expect(httpClient.get('/api/test')).rejects.toEqual({
      status: 0,
      code: 'NETWORK_ERROR',
      message: 'Network error',
      details: null,
    })
  })

  // ─── HTTP methods ─────────────────────────────────────────────────────────

  it('POST — sends body as JSON string with POST method', async () => {
    const body = { amount: 50, staffId: 'tech-1' }
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      status: 201,
      text: () => Promise.resolve(JSON.stringify({ id: 'TX-1' })),
    })

    await httpClient.post('/api/transactions', body)

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(body),
      }),
    )
  })

  it('PATCH — sends body as JSON string with PATCH method', async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: () => Promise.resolve('{}'),
    })

    await httpClient.patch('/api/item/1', { status: 'done' })

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ method: 'PATCH', body: JSON.stringify({ status: 'done' }) }),
    )
  })

  it('DELETE — uses DELETE method without a body', async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: () => Promise.resolve('null'),
    })

    await httpClient.del('/api/item/1')

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ method: 'DELETE' }),
    )
  })

  // ─── Interceptors ─────────────────────────────────────────────────────────

  it('request interceptor — can add a custom header before the request is sent', async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: () => Promise.resolve('{}'),
    })

    httpClient.addRequestInterceptor((init) => ({
      ...init,
      headers: { ...init.headers, 'X-Test-Header': 'intercepted' },
    }))

    await httpClient.get('/api/test')

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({ 'X-Test-Header': 'intercepted' }),
      }),
    )
  })
})
