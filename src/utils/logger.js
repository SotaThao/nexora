/**
 * Centralised logger utility.
 *
 * - Development  : passes through to the browser console so dev tools work normally
 * - Production   : silences all output (Vite sets import.meta.env.PROD = true on build)
 *
 * Usage:
 *   import { logger } from '@/utils/logger'   // or relative path
 *   logger.error('Something broke', err)
 *   logger.warn('Unexpected state', value)
 *   logger.info('Storage migrated')
 *   logger.debug('[DEBUG]', payload)          // strips out in prod automatically
 */

const isProd = import.meta.env.PROD

/* eslint-disable no-console */
export const logger = {
  log:   isProd ? () => {} : (...args) => console.log(...args),
  info:  isProd ? () => {} : (...args) => console.info(...args),
  warn:  isProd ? () => {} : (...args) => console.warn(...args),
  error: isProd ? () => {} : (...args) => console.error(...args),
  debug: isProd ? () => {} : (...args) => console.debug(...args),
}
/* eslint-enable no-console */
