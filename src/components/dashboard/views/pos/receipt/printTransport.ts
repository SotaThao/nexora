/**
 * Shared vocabulary for the two print paths.
 *
 * These live under `views/pos/receipt/` rather than `src/lib/` for one concrete reason:
 * `vitest.config.ts` includes only `tests/unit/**`, `src/components/**` and `src/data/**`, so a
 * test placed beside a module in `src/lib` would silently never run. Nothing outside
 * `src/components` consumes these, so keeping them here inverts no boundary.
 */
import type { PosPrintTransportType } from '../../../../../constants/posPrinter'

/**
 * `handedOff` is the case that makes printing here unlike printing anywhere else: PassPRNT takes
 * over, the browser navigates away, and the outcome only arrives on a later page load. Nothing can
 * be awaited — the caller's job is to persist enough state to pick the job back up.
 */
export type PrintOutcome =
  | { status: 'completed'; transport: PosPrintTransportType }
  | { status: 'handedOff'; transport: PosPrintTransportType; jobId: string }
  | {
      status: 'failed'
      transport: PosPrintTransportType
      /** A PassPrntCode when one came back; absent when we refused to start. */
      code?: string
      /** i18n key describing the failure to the operator. */
      messageKey: string
    }
