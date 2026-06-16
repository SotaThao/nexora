export interface ApiError {
  status: number
  errorCode: string
  message: string
  errors: Record<string, string[]>
  retryAfter: number | string | null
}

export interface HttpRequestInit extends RequestInit {
  anonymous?: boolean
  _isRefresh?: boolean
  params?: Record<string, string | number | boolean | null | undefined>
}

export type RequestInterceptor = (init: HttpRequestInit) => HttpRequestInit
export type ResponseInterceptor = (response: Response) => void
