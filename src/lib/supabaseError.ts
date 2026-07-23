export interface SupabaseDisplayError {
  message: string
  retryable: boolean
  code?: string
}

interface SupabaseErrorLike {
  code?: unknown
  message?: unknown
  name?: unknown
  status?: unknown
  statusCode?: unknown
}

function isErrorLike(value: unknown): value is SupabaseErrorLike {
  return typeof value === 'object' && value !== null
}

function readString(value: unknown): string | undefined {
  return typeof value === 'string' && value ? value : undefined
}

function readStatus(error: SupabaseErrorLike): number | undefined {
  const status = error.status ?? error.statusCode
  return typeof status === 'number' ? status : undefined
}

/**
 * Converts Supabase REST, Auth, Storage, and Realtime failures into the one
 * render-only shape used by Community UI consumers.
 */
export function mapSupabaseError(error: unknown): SupabaseDisplayError {
  if (!isErrorLike(error)) {
    return { message: 'Đã xảy ra lỗi không xác định. Vui lòng thử lại.', retryable: false }
  }

  const code = readString(error.code)
  const name = readString(error.name)
  const message = readString(error.message)?.toLowerCase() ?? ''
  const status = readStatus(error)

  if (code === '23505') {
    return { message: 'Dữ liệu này đã tồn tại.', retryable: false, code }
  }
  if (code === '23503') {
    return { message: 'Dữ liệu liên quan không còn tồn tại.', retryable: false, code }
  }
  if (code === '42501' || status === 401 || status === 403) {
    return { message: 'Bạn không có quyền thực hiện thao tác này.', retryable: false, code }
  }
  if (code === 'PGRST116') {
    return { message: 'Không tìm thấy dữ liệu.', retryable: false, code }
  }
  if (code?.startsWith('PGRST')) {
    return { message: 'Không thể truy vấn dữ liệu lúc này. Vui lòng thử lại.', retryable: true, code }
  }

  if (name === 'AuthApiError' || message.includes('auth')) {
    if (status === 429 || message.includes('rate limit')) {
      return { message: 'Bạn đã thao tác quá nhiều lần. Vui lòng thử lại sau.', retryable: true, code }
    }
    return { message: 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.', retryable: false, code }
  }

  if (name === 'StorageApiError' || message.includes('storage')) {
    if (status !== undefined && status >= 500) {
      return { message: 'Không thể xử lý tệp lúc này. Vui lòng thử lại.', retryable: true, code }
    }
    return { message: 'Không thể tải tệp lên hoặc truy cập tệp này.', retryable: false, code }
  }

  if (name === 'RealtimeChannelError' || name === 'RealtimePresenceError' || message.includes('realtime')) {
    return { message: 'Kết nối thời gian thực bị gián đoạn. Đang thử kết nối lại.', retryable: true, code }
  }

  if (status === 408 || status === 429 || (status !== undefined && status >= 500)) {
    return { message: 'Dịch vụ đang tạm thời không khả dụng. Vui lòng thử lại.', retryable: true, code }
  }

  return { message: 'Không thể hoàn tất thao tác. Vui lòng thử lại.', retryable: false, code }
}

export default mapSupabaseError
