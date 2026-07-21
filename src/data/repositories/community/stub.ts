export function notImplemented<T>(repository: string, method: string): Promise<T> {
  return Promise.reject(new Error(`NotImplemented: ${repository}.${method}`))
}
