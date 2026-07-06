import { logger } from '../utils/logger'

const TRACE_ENABLED = import.meta.env.VITE_PUSH_DEVICE_TRACE === 'true'
  || import.meta.env.MODE === 'test'
  || import.meta.env.DEV

/** Step-by-step push-device diagnostics (visible in native WebView logcat / Safari). */
export function pushDeviceTrace(step: string, details?: Record<string, unknown>) {
  const payload = details ? { step, ...details } : { step }
  logger.info('[PushDevice]', payload)

  if (!TRACE_ENABLED) return

  const line = details
    ? `[PushDevice] ${step} ${JSON.stringify(details)}`
    : `[PushDevice] ${step}`

  // eslint-disable-next-line no-console -- gated by VITE_PUSH_DEVICE_TRACE / test mode
  console.warn(line)
}

export default pushDeviceTrace
