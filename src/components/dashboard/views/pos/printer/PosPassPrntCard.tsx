/**
 * How receipts leave this device, and a way to prove it works.
 *
 * The HTML mockup for this screen drew a printer discovery list, a live status chip
 * (ready / paper low / cover open / connection lost), an "installed" tick, and Change printer /
 * Disconnect actions. None of those are buildable from a web app and they are omitted rather than
 * faked:
 *
 * - Discovery and pairing happen inside the PassPRNT app. The web has no API to enumerate
 *   Bluetooth or LAN printers, so this screen points the operator there instead.
 * - There is no status channel. The only signal we ever receive is the result code of a print that
 *   already ran, which is why the mockup's status panel became a "last test print" panel — the
 *   per-status copy it carried is now the per-error-code copy.
 * - iOS gives no way to probe whether an app is installed, so claiming "installed" would be a
 *   guess. Step 1 is a plain App Store link.
 * - No connection is owned here, so there is nothing to change or disconnect.
 *
 * Step 2 is intentionally instructions with no button: launching `starpassprnt://` with no print
 * data comes back as error 9, so a button there would look broken.
 */
import { CheckCircle2, ExternalLink, Printer, XCircle } from 'lucide-react'
import { useTranslation } from '../../../../../contexts/LanguageContext'
import {
  usePosPrinterProfile,
  useSavePosPrinterProfile,
} from '../../../../../data/hooks/usePosPrinterSettings'
import {
  PASSPRNT_APP_STORE_URL,
  POS_PRINTER_I18N_PREFIX as K,
  PassPrntCode,
  PosPrintTransport,
  RECEIPT_PAPER_WIDTH_DOTS,
} from '../../../../../constants/posPrinter'
import type { PosPrintTransportType } from '../../../../../constants/posPrinter'
import { getPassPrntErrorI18nKey } from '../receipt/passprntTransport'
import { formatPosDateTime } from '../posDateTime'

export default function PosPassPrntCard({
  onTestPrint,
  isPrinting,
}: {
  onTestPrint: () => void
  isPrinting: boolean
}) {
  const { t, currentLanguage } = useTranslation()
  const profileQuery = usePosPrinterProfile()
  const saveProfile = useSavePosPrinterProfile()

  const profile = profileQuery.data
  const transport = profile?.transportConfigured ? profile.transport : undefined
  const isPassPrnt = transport === PosPrintTransport.PassPrnt
  const isBusy = isPrinting || saveProfile.isPending || profileQuery.isPending

  const selectTransport = (next: PosPrintTransportType) => {
    if (next === transport || isBusy) return
    saveProfile.mutate({ transport: next })
  }

  const methodOption = (
    value: PosPrintTransportType,
    title: string,
    hint: string,
  ) => {
    const active = transport === value
    return (
      <button
        key={value}
        type="button"
        role="radio"
        aria-checked={active}
        disabled={isBusy}
        onClick={() => selectTransport(value)}
        className={`min-h-20 rounded-xl border p-4 text-left transition-colors disabled:opacity-60 ${
          active
            ? 'border-nexoraBrand bg-nexoraBrandSoft'
            : 'border-nexoraBorder hover:border-nexoraBrand'
        }`}
      >
        <span className="block text-sm font-bold text-nexoraText">{title}</span>
        <span className="mt-1 block text-xs leading-relaxed text-nexoraMuted">{hint}</span>
      </button>
    )
  }

  const testPrintButton = (
    <button
      type="button"
      onClick={onTestPrint}
      disabled={isBusy}
      className="min-h-11 rounded-lg bg-nexoraBrand px-4 py-2 text-xs font-bold text-white hover:bg-nexoraBrandDark disabled:opacity-60"
    >
      {isPrinting ? t(`${K}.testPrinting`) : t(`${K}.step3Action`)}
    </button>
  )

  const step = (index: number, title: string, hint: string, action?: React.ReactNode) => (
    <div className="grid grid-cols-1 gap-2 border-t border-slate-50 py-3 first:border-t-0 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center">
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-nexoraCanvas text-[11px] font-black text-nexoraText">
        {index}
      </span>
      <div>
        <p className="text-xs font-bold text-nexoraText">{title}</p>
        <p className="text-[11px] text-nexoraMuted">{hint}</p>
      </div>
      {action ? <div className="sm:justify-self-end">{action}</div> : <span />}
    </div>
  )

  const lastTest = () => {
    if (!profile?.lastTestAt || !profile.lastTestCode) {
      return <p className="text-[11px] text-nexoraMuted">{t(`${K}.lastTestNever`)}</p>
    }
    const ok = profile.lastTestCode === PassPrntCode.Success
    return (
      <div className="flex items-start gap-2">
        {ok ? (
          <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-500" aria-hidden="true" />
        ) : (
          <XCircle className="mt-0.5 h-4 w-4 text-rose-500" aria-hidden="true" />
        )}
        <div>
          <p className="text-xs font-bold text-nexoraText">
            {ok ? t(`${K}.lastTestSuccess`) : t(`${K}.lastTestFailed`)}
          </p>
          {!ok ? (
            <p className="text-[11px] text-nexoraMuted">
              {t(getPassPrntErrorI18nKey(profile.lastTestCode))}
            </p>
          ) : null}
          <p className="text-[11px] text-nexoraMuted">
            {formatPosDateTime(profile.lastTestAt, currentLanguage)}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-nexoraBorder bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between border-b border-nexoraBorder pb-3">
        <h4 className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-nexoraText">
          <Printer className="h-4 w-4 text-amber-500" aria-hidden="true" />
          {t(`${K}.connectionTitle`)}
        </h4>
      </div>

      <p className="mb-3 text-sm font-bold text-nexoraText">{t(`${K}.connectionSubtitle`)}</p>

      <div role="radiogroup" aria-label={t(`${K}.methodLabel`)} className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {methodOption(
          PosPrintTransport.Browser,
          t(`${K}.methodBrowser`),
          t(`${K}.methodBrowserHint`),
        )}
        {methodOption(
          PosPrintTransport.PassPrnt,
          t(`${K}.methodPassPrnt`),
          t(`${K}.methodPassPrntHint`),
        )}
      </div>

      <p className="mt-3 text-xs leading-relaxed text-nexoraMuted">{t(`${K}.compatibilityNote`)}</p>

      {profileQuery.isPending ? (
        <p className="mt-4 text-xs text-nexoraMuted" role="status">{t(`${K}.loadingMethod`)}</p>
      ) : !transport ? (
        <p className="mt-4 text-sm text-nexoraMuted">{t(`${K}.chooseMethodHint`)}</p>
      ) : null}
      {saveProfile.isError || profileQuery.isError ? (
        <p className="mt-3 text-xs text-nexoraText" role="alert">{t(`${K}.methodError`)}</p>
      ) : null}

      {transport === PosPrintTransport.Browser ? (
        <div className="mt-5">
          <h5 className="text-sm font-bold text-nexoraText">{t(`${K}.browserStepsTitle`)}</h5>
          <div className="mt-1">
            {step(1, t(`${K}.browserStep1Title`), t(`${K}.browserStep1Hint`))}
            {step(2, t(`${K}.browserStep2Title`), t(`${K}.browserStep2Hint`))}
            {step(3, t(`${K}.step3Title`), t(`${K}.browserStep3Hint`), testPrintButton)}
          </div>
          <p className="mt-3 rounded-xl bg-nexoraCanvas p-3 text-xs leading-relaxed text-nexoraMuted">
            {t(`${K}.browserTestNote`)}
          </p>
        </div>
      ) : null}

      {isPassPrnt ? (
        <>
          <h5 className="mt-5 text-[11px] font-black uppercase tracking-wider text-nexoraMuted">
            {t(`${K}.stepsTitle`)}
          </h5>
          <div className="mt-1">
            {step(
              1,
              t(`${K}.step1Title`),
              t(`${K}.step1Hint`),
              <a
                href={PASSPRNT_APP_STORE_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-11 items-center gap-1.5 rounded-lg border border-nexoraBorder px-3 text-[11px] font-bold text-nexoraText hover:border-nexoraBrand"
              >
                <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                {t(`${K}.step1Action`)}
              </a>,
            )}
            {step(2, t(`${K}.step2Title`), t(`${K}.step2Hint`))}
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-[11px] font-bold text-nexoraText">
                  {t(`${K}.paperWidthLabel`)}
                </span>
                <select
                  className="h-11 w-full rounded-lg border border-nexoraBorder px-3 text-xs font-bold text-nexoraText"
                  value={profile?.paperWidthDots ?? RECEIPT_PAPER_WIDTH_DOTS.Roll80mm}
                  disabled={isBusy}
                  onChange={(event) =>
                    saveProfile.mutate({ paperWidthDots: Number(event.target.value) })
                  }
                >
                  <option value={RECEIPT_PAPER_WIDTH_DOTS.Roll80mm}>{t(`${K}.paperWidth80`)}</option>
                  <option value={RECEIPT_PAPER_WIDTH_DOTS.Roll58mm}>{t(`${K}.paperWidth58`)}</option>
                </select>
              </label>
            </div>
            {step(
              3,
              t(`${K}.step3Title`),
              t(`${K}.step3Hint`),
              testPrintButton,
            )}
          </div>

          <div className="mt-4 rounded-xl border border-nexoraBorder bg-nexoraCanvas p-3">
            <p className="mb-1 text-[10px] font-black uppercase tracking-wider text-nexoraMuted">
              {t(`${K}.lastTestTitle`)}
            </p>
            {lastTest()}
          </div>

          <details className="mt-4 rounded-xl border border-nexoraBorder bg-nexoraBrandSoft p-4">
            <summary className="min-h-11 cursor-pointer content-center text-sm font-bold text-nexoraText">
              {t(`${K}.appRequiredTitle`)}
            </summary>
            <p className="mt-2 text-xs leading-relaxed text-nexoraMuted">{t(`${K}.appRequiredHint`)}</p>
            <p className="mt-2 text-xs leading-relaxed text-nexoraMuted">{t(`${K}.appOptionalHint`)}</p>
          </details>
        </>
      ) : null}

      <details className="mt-4 rounded-xl border border-nexoraBorder bg-nexoraCanvas p-4">
        <summary className="min-h-11 cursor-pointer content-center text-sm font-bold text-nexoraText">
          {t(`${K}.otherPrinterTitle`)}
        </summary>
        <div className="mt-2 space-y-3 text-xs leading-relaxed text-nexoraMuted">
          <p>{t(`${K}.otherPrinterIntro`)}</p>
          <ul className="list-disc space-y-2 pl-5">
            <li>{t(`${K}.otherPrinterIpad`)}</li>
            <li>{t(`${K}.otherPrinterComputer`)}</li>
            <li>{t(`${K}.otherPrinterUnsupported`)}</li>
          </ul>
          <div className="border-t border-nexoraBorder pt-3">
            <p className="font-bold text-nexoraText">{t(`${K}.compatibilityCheckTitle`)}</p>
            <p className="mt-1">{t(`${K}.compatibilityCheckHint`)}</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>{t(`${K}.compatibilityCheckModel`)}</li>
              <li>{t(`${K}.compatibilityCheckConnection`)}</li>
              <li>{t(`${K}.compatibilityCheckDevice`)}</li>
            </ul>
          </div>
        </div>
      </details>
    </div>
  )
}
