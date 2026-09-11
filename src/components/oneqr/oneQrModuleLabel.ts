/**
 * Module tile labels — owned by the FE locale files, keyed by `moduleKey`.
 *
 * The backend sends a `label` / `defaultLabel` per module, but that string comes
 * from the admin-managed `OneQrModuleDefinition` table which has a single
 * `label` column — one language only. Customers scanning a Vietnamese shop's
 * QR would get English tiles. So the display label is resolved here instead:
 *
 *   1. `customLabel` — the merchant's own wording, always wins;
 *   2. `oneqr.modules.<ModuleKey>` from `en.json` / `vi.json`;
 *   3. the server's label — covers a key added by an admin before this build
 *      shipped a translation for it;
 *   4. the raw `moduleKey`, so a tile is never blank.
 *
 * CONSEQUENCE: when a new `OneQrModuleKey` is added, BOTH locale files need an
 * entry under `oneqr.modules` using the exact enum name (PascalCase). Missing
 * one is not fatal — step 3 keeps the tile readable — but it will show the
 * admin's single-language string to every viewer.
 */
import { isBuiltInOneQrModuleKey } from '../../constants/oneQr'
import { logger } from '../../utils/logger'

type TranslateFn = (key: string, vars?: Record<string, string | number>) => string

const LABEL_PREFIX = 'oneqr.modules.'

/** Warn once per key, so a missing translation is visible without log spam. */
const warnedKeys = new Set<string>()

function translateModuleKey(moduleKey: string, t: TranslateFn): string | null {
  const key = `${LABEL_PREFIX}${moduleKey}`
  const translated = t(key)
  // The app's `t()` echoes the key back when it is missing.
  if (!translated || translated === key) {
    // Only built-in keys are expected to have a translation. An admin can add
    // modules through the portal at any time, and those legitimately fall back
    // to the definition's label — warning about them would be noise.
    if (!warnedKeys.has(moduleKey) && isBuiltInOneQrModuleKey(moduleKey)) {
      warnedKeys.add(moduleKey)
      logger.warn(
        `[OneQR] Missing tile label for built-in module key "${moduleKey}". ` +
          `Add "${key}" to src/locales/en.json and vi.json.`,
      )
    }
    return null
  }
  return translated
}

export function resolveOneQrModuleLabel(
  {
    moduleKey,
    customLabel,
    serverLabel,
  }: {
    moduleKey: string
    /** Merchant override (`customLabel`). */
    customLabel?: string | null
    /** `label` / `defaultLabel` from the definition — fallback only. */
    serverLabel?: string | null
  },
  t: TranslateFn,
): string {
  const custom = customLabel?.trim()
  if (custom) return custom

  const translated = translateModuleKey(moduleKey, t)
  if (translated) return translated

  const fromServer = serverLabel?.trim()
  if (fromServer) return fromServer

  return moduleKey
}

/** Test seam — the warn-once cache would otherwise leak between cases. */
export function resetOneQrLabelWarnings(): void {
  warnedKeys.clear()
}
