// Shown when a ticket-level action runs ahead of the work actually recorded on its services:
// starting a ticket nobody has taken, checking out with services still open, or cancelling one
// where work was already done.
//
// Advisory only — the salon can switch it off (PosOrderSettings.warnOnServiceLineStatusMismatch),
// and the backend does the same thing either way. The one rule that is NOT here is a service with
// no technician blocking checkout: that is about money, so it stays a hard server-side error.
import { useTranslation } from '../../../../../contexts/LanguageContext'

const K = 'components.dashboard.views.pos.serviceLineStatus'

export type ServiceLineMismatchKind = 'start' | 'checkout' | 'cancel'

export interface ServiceLineMismatchWarningProps {
  kind: ServiceLineMismatchKind
  /** "Gel Manicure — Anna" style lines, already resolved by the caller. Empty for 'start'. */
  affectedLines: string[]
  isBusy?: boolean
  onConfirm: () => void
  onCancel: () => void
}

const TITLE_KEY: Record<ServiceLineMismatchKind, string> = {
  start: `${K}.warnStartTitle`,
  checkout: `${K}.warnCheckoutTitle`,
  cancel: `${K}.warnCancelTitle`,
}

const BODY_KEY: Record<ServiceLineMismatchKind, string> = {
  start: `${K}.warnStartBody`,
  checkout: `${K}.warnCheckoutBody`,
  cancel: `${K}.warnCancelBody`,
}

export default function ServiceLineMismatchWarningModal({
  kind,
  affectedLines,
  isBusy = false,
  onConfirm,
  onCancel,
}: ServiceLineMismatchWarningProps) {
  const { t } = useTranslation()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div
        role="alertdialog"
        aria-modal="true"
        aria-label={t(TITLE_KEY[kind])}
        className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl"
      >
        <h3 className="text-sm font-black text-nexoraText">{t(TITLE_KEY[kind])}</h3>
        <p className="mt-2 text-xs leading-relaxed text-nexoraMuted">{t(BODY_KEY[kind])}</p>

        {affectedLines.length > 0 ? (
          <ul className="mt-3 max-h-40 space-y-1 overflow-y-auto rounded-lg bg-nexoraCanvas/70 p-2">
            {affectedLines.map((label) => (
              <li key={label} className="truncate text-[11px] font-semibold text-nexoraText">
                {label}
              </li>
            ))}
          </ul>
        ) : null}

        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="h-9 rounded-lg border border-slate-200 px-3 text-[11px] font-bold text-slate-600 hover:bg-slate-50"
          >
            {t(`${K}.warnGoBack`)}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isBusy}
            className="h-9 rounded-lg bg-nexoraBrand px-3 text-[11px] font-bold text-white hover:bg-nexoraBrandDark disabled:opacity-60"
          >
            {t(`${K}.warnContinue`)}
          </button>
        </div>
      </div>
    </div>
  )
}
