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
  const transport = profile?.transport ?? PosPrintTransport.Browser
  const isPassPrnt = transport === PosPrintTransport.PassPrnt

  const selectTransport = (next: PosPrintTransportType) => {
    if (next === transport) return
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
        onClick={() => selectTransport(value)}
        className={`rounded-xl border p-3 text-left transition-colors ${
          active
            ? 'border-nexoraBrand bg-nexoraBrandSoft'
            : 'border-nexoraBorder hover:border-nexoraBrand'
        }`}
      >
        <span className="block text-xs font-bold text-nexoraText">{title}</span>
        <span className="mt-1 block text-[11px] text-nexoraMuted">{hint}</span>
      </button>
    )
  }

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

      <p className="mb-3 text-[11px] text-nexoraMuted">{t(`${K}.connectionSubtitle`)}</p>

      <div role="radiogroup" aria-label={t(`${K}.methodLabel`)} className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {methodOption(
          PosPrintTransport.PassPrnt,
          t(`${K}.methodPassPrnt`),
          t(`${K}.methodPassPrntHint`),
        )}
        {methodOption(
          PosPrintTransport.Browser,
          t(`${K}.methodBrowser`),
          t(`${K}.methodBrowserHint`),
        )}
      </div>

      {isPassPrnt ? (
        <>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-[11px] font-bold text-nexoraText">
                {t(`${K}.paperWidthLabel`)}
              </span>
              <select
                className="h-11 w-full rounded-lg border border-nexoraBorder px-3 text-xs font-bold text-nexoraText"
                value={profile?.paperWidthDots ?? RECEIPT_PAPER_WIDTH_DOTS.Roll80mm}
                onChange={(event) =>
                  saveProfile.mutate({ paperWidthDots: Number(event.target.value) })
                }
              >
                <option value={RECEIPT_PAPER_WIDTH_DOTS.Roll80mm}>{t(`${K}.paperWidth80`)}</option>
                <option value={RECEIPT_PAPER_WIDTH_DOTS.Roll58mm}>{t(`${K}.paperWidth58`)}</option>
              </select>
            </label>
          </div>

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
            {step(
              3,
              t(`${K}.step3Title`),
              t(`${K}.step3Hint`),
              <button
                type="button"
                onClick={onTestPrint}
                disabled={isPrinting}
                className="h-11 rounded-lg bg-nexoraBrand px-4 text-[11px] font-bold text-white hover:bg-nexoraBrandDark disabled:opacity-60"
              >
                {isPrinting ? t(`${K}.testPrinting`) : t(`${K}.step3Action`)}
              </button>,
            )}
          </div>

          <div className="mt-4 rounded-xl border border-nexoraBorder bg-nexoraCanvas p-3">
            <p className="mb-1 text-[10px] font-black uppercase tracking-wider text-nexoraMuted">
              {t(`${K}.lastTestTitle`)}
            </p>
            {lastTest()}
          </div>
        </>
      ) : null}
    </div>
  )
}
