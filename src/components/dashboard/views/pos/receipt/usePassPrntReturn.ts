/**
 * The return leg of a PassPRNT print.
 *
 * Printing navigates out of the app, so this runs on a fresh mount with `?passprnt_code=…` in the
 * URL. It advances the copy queue, restores the screen the operator left, and reports failures.
 *
 * Guards, all of them load-bearing:
 *
 * - A job is advanced only when a callback code is present. A manual reload carries none, so it
 *   can never reprint.
 * - The handled callback URL is recorded in a ref before anything else, and the callback params are
 *   stripped with a history replace, so a double render or a back-button press is a no-op.
 * - Each copy is fired at most once (`firedAttempts`), so even a callback loop cannot spin.
 * - A failure clears the job outright. There is no automatic retry: a printer that is off or out
 *   of paper will fail identically on the next attempt, and a retry storm on a physical device is
 *   worse than a message asking the operator to look at it.
 * - A pending job with no callback and no recent activity is swept. That is the only signal
 *   available that PassPRNT never opened — iOS reports nothing when a URL scheme has no handler.
 */
import { useCallback, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from '../../../../../contexts/LanguageContext'
import { useNotification } from '../../../../../contexts/NotificationContext'
import posPrinterSettingsRepository from '../../../../../data/repositories/posPrinterSettings'
import {
  PASSPRNT_JOB_STALE_MS,
  POS_PRINTER_I18N_PREFIX,
  PassPrntCode,
} from '../../../../../constants/posPrinter'
import type { PosPrintRestoreState } from '../../../../../types/domain'
import type { PosPendingPrintJob } from '../../../../../types/repositories'
import { logger } from '../../../../../utils/logger'
import {
  buildPassPrntBackUrl,
  buildPassPrntUrl,
  firePassPrnt,
  getPassPrntErrorI18nKey,
  parsePassPrntCallback,
  stripPassPrntCallbackParams,
} from './passprntTransport'
import { buildPosReceiptHtml } from './posReceiptHtml'
import { usePosPrinterProfile } from '../../../../../data/hooks/usePosPrinterSettings'

export interface UsePassPrntReturnOptions {
  surface: 'frontDesk' | 'printerSetup'
  /** Path PassPRNT should return to for the next copy. No query string. */
  backPath: string
  onRestore?: (restore: PosPrintRestoreState) => void
  /**
   * A receipt print failed at the printer. The caller is expected to offer the browser as a way
   * out: the customer is standing there, and telling the operator to go change a setting on
   * another screen is not an answer.
   */
  onPrintFailed?: (job: PosPendingPrintJob) => void
}

export function usePassPrntReturn({ surface, backPath, onRestore, onPrintFailed }: UsePassPrntReturnOptions) {
  const [searchParams, setSearchParams] = useSearchParams()
  const { t } = useTranslation()
  const { showToast } = useNotification()
  const { data: profile } = usePosPrinterProfile()
  const handledRef = useRef<string | null>(null)

  const restore = useCallback(
    (state: PosPrintRestoreState | null) => {
      if (state && state.surface === surface) onRestore?.(state)
    },
    [surface, onRestore],
  )

  useEffect(() => {
    const callback = parsePassPrntCallback(searchParams)
    const job = posPrinterSettingsRepository.getPendingPrintJob()

    if (!callback) {
      // No result in the URL. If a job has been sitting here since before the staleness window,
      // the companion app never took it — most often because it is not installed.
      if (job && Date.now() - new Date(job.createdAt).getTime() > PASSPRNT_JOB_STALE_MS) {
        posPrinterSettingsRepository.clearPendingPrintJob()
        showToast(t(`${POS_PRINTER_I18N_PREFIX}.printNotStarted`), 'error')
      }
      return
    }

    // The persisted job advances below. Keying this guard on copiesDone would turn an
    // effect replay for the same URL into a second acknowledgement and duplicate print.
    const callbackKey = searchParams.toString()
    if (handledRef.current === callbackKey) return
    handledRef.current = callbackKey

    // Strip first: whatever happens next, this URL must not read as a print result again.
    setSearchParams(stripPassPrntCallbackParams(searchParams), { replace: true })

    if (!job) {
      logger.warn('[usePassPrntReturn] callback with no pending job', callback.code)
      return
    }

    if (callback.code !== PassPrntCode.Success) {
      posPrinterSettingsRepository.clearPendingPrintJob()
      logger.error('[usePassPrntReturn] print failed', callback.code, callback.message)
      showToast(t(getPassPrntErrorI18nKey(callback.code)), 'error')
      if (job.kind === 'testPrint') {
        posPrinterSettingsRepository.savePrinterProfile({
          lastTestAt: new Date().toISOString(),
          lastTestCode: callback.code,
        })
      }
      // Hand the caller the job so it can fall back to the browser dialog. Test prints are
      // excluded: the setup screen already reports the failure in its last-test panel.
      if (job.kind === 'receipt') onPrintFailed?.(job)
      restore(job.restore)
      return
    }

    const copiesDone = job.copiesDone + 1

    if (job.kind === 'testPrint') {
      posPrinterSettingsRepository.savePrinterProfile({
        lastTestAt: new Date().toISOString(),
        lastTestCode: PassPrntCode.Success,
      })
    }

    if (copiesDone >= job.copiesTotal || !job.document) {
      posPrinterSettingsRepository.clearPendingPrintJob()
      showToast(t(`${POS_PRINTER_I18N_PREFIX}.printQueueFinished`), 'success')
      restore(job.restore)
      return
    }

    // More copies to go. Re-fire from the document stored with the job, never from a fresh build:
    // the order query may not even be warm yet on this mount, and copy 2 has to match copy 1.
    const widthDots = profile?.paperWidthDots ?? 576
    const built = buildPassPrntUrl({
      html: buildPosReceiptHtml(job.document, { widthDots }),
      backUrl: buildPassPrntBackUrl(window.location.origin, backPath),
      widthDots,
    })

    if ('tooLarge' in built) {
      posPrinterSettingsRepository.clearPendingPrintJob()
      showToast(t(`${POS_PRINTER_I18N_PREFIX}.printTooLarge`), 'error')
      restore(job.restore)
      return
    }

    posPrinterSettingsRepository.savePendingPrintJob({
      ...job,
      copiesDone,
      firedAttempts: 1,
    })
    showToast(
      t(`${POS_PRINTER_I18N_PREFIX}.printingCopy`, {
        current: String(copiesDone + 1),
        total: String(job.copiesTotal),
      }),
      'info',
    )
    restore(job.restore)
    firePassPrnt(built.url)
  }, [searchParams, setSearchParams, showToast, t, restore, profile?.paperWidthDots, backPath, onPrintFailed])
}
