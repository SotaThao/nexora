/**
 * What prints on a receipt and how many copies come out.
 *
 * Saved per device rather than per business: the copy counts follow the printer, and a salon with
 * two stations should be able to give the front desk two card copies while the back office prints
 * none. Same card shell and save affordance as PosCheckInSettingsPanel.
 *
 * Note `printProducts` is currently inert — retail products are hidden from POS checkout, so no
 * order carries product lines yet. The toggle ships because the receipt honours it the moment they
 * come back, and because leaving it out would make this screen disagree with the agreed design.
 */
import { useEffect, useRef, useState } from 'react'
import { Receipt } from 'lucide-react'
import { useTranslation } from '../../../../../contexts/LanguageContext'
import { useNotification } from '../../../../../contexts/NotificationContext'
import ToggleSwitch from '../../../../ui/ToggleSwitch'
import {
  usePosReceiptSettings,
  useSavePosReceiptSettings,
} from '../../../../../data/hooks/usePosPrinterSettings'
import {
  DEFAULT_POS_RECEIPT_SETTINGS,
  POS_PRINTER_I18N_PREFIX as K,
} from '../../../../../constants/posPrinter'
import type { PosReceiptSettings } from '../../../../../types/repositories'
import PosCopiesStepper from './PosCopiesStepper'
import { TOAST_SNACK_DURATION_MS } from '../../../../../constants/toast'

function isSame(a: PosReceiptSettings, b: PosReceiptSettings): boolean {
  return (
    a.printProducts === b.printProducts &&
    a.sortServices === b.sortServices &&
    a.cardCopies === b.cardCopies &&
    a.otherCopies === b.otherCopies
  )
}

export default function PosReceiptSettingsCard() {
  const { t } = useTranslation()
  const { showToast } = useNotification()
  const settingsQuery = usePosReceiptSettings()
  const saveSettings = useSavePosReceiptSettings()

  const saved = settingsQuery.data ?? DEFAULT_POS_RECEIPT_SETTINGS
  const [form, setForm] = useState<PosReceiptSettings>(saved)

  // The card renders immediately with defaults while the device read resolves, so an operator can
  // realistically toggle something before the value arrives. Seeding unconditionally would then
  // overwrite that edit a frame later, and the change would just silently vanish.
  const touchedRef = useRef(false)
  const updateForm = (next: (prev: PosReceiptSettings) => PosReceiptSettings) => {
    touchedRef.current = true
    setForm(next)
  }
  useEffect(() => {
    if (touchedRef.current || !settingsQuery.data) return
    setForm(settingsQuery.data)
  }, [settingsQuery.data])

  const dirty = !isSame(form, saved)

  const save = (event: { preventDefault: () => void }) => {
    event.preventDefault()
    saveSettings.mutate(form, {
      onSuccess: () => {
        showToast(t('components.settings.hooks.useSettingsForm.settingsUpdatedSuccessfully'), 'success', TOAST_SNACK_DURATION_MS)
      },
    })
  }

  const row = (title: string, hint: string, control: React.ReactNode) => (
    <div className="grid grid-cols-1 gap-2 border-t border-slate-50 py-3 first:border-t-0 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
      <div>
        <p className="text-xs font-bold text-nexoraText">{title}</p>
        <p className="text-[11px] text-nexoraMuted">{hint}</p>
      </div>
      <div className="sm:justify-self-end">{control}</div>
    </div>
  )

  return (
    <div className="rounded-xl border border-nexoraBorder bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between border-b border-nexoraBorder pb-3">
        <h4 className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-nexoraText">
          <Receipt className="h-4 w-4 text-amber-500" aria-hidden="true" />
          {t(`${K}.receiptSettingsTitle`)}
        </h4>
      </div>

      <p className="mb-2 text-[11px] text-nexoraMuted">{t(`${K}.receiptSettingsSubtitle`)}</p>

      <form onSubmit={save} noValidate>
        {row(
          t(`${K}.printProductsTitle`),
          t(`${K}.printProductsHint`),
          <ToggleSwitch
            checked={form.printProducts}
            onChange={() => updateForm((prev) => ({ ...prev, printProducts: !prev.printProducts }))}
            activeColor="bg-nexoraBrand"
            ariaLabel={t(`${K}.printProductsTitle`)}
          />,
        )}
        {row(
          t(`${K}.sortServicesTitle`),
          t(`${K}.sortServicesHint`),
          <ToggleSwitch
            checked={form.sortServices}
            onChange={() => updateForm((prev) => ({ ...prev, sortServices: !prev.sortServices }))}
            activeColor="bg-nexoraBrand"
            ariaLabel={t(`${K}.sortServicesTitle`)}
          />,
        )}
        {row(
          t(`${K}.cardCopiesTitle`),
          t(`${K}.cardCopiesHint`),
          <PosCopiesStepper
            value={form.cardCopies}
            onChange={(cardCopies) => updateForm((prev) => ({ ...prev, cardCopies }))}
            label={t(`${K}.cardCopiesTitle`)}
            decreaseLabel={t(`${K}.decreaseCopies`, { label: t(`${K}.cardCopiesTitle`) })}
            increaseLabel={t(`${K}.increaseCopies`, { label: t(`${K}.cardCopiesTitle`) })}
          />,
        )}
        {row(
          t(`${K}.otherCopiesTitle`),
          t(`${K}.otherCopiesHint`),
          <PosCopiesStepper
            value={form.otherCopies}
            onChange={(otherCopies) => updateForm((prev) => ({ ...prev, otherCopies }))}
            label={t(`${K}.otherCopiesTitle`)}
            decreaseLabel={t(`${K}.decreaseCopies`, { label: t(`${K}.otherCopiesTitle`) })}
            increaseLabel={t(`${K}.increaseCopies`, { label: t(`${K}.otherCopiesTitle`) })}
          />,
        )}

        <div className="mt-4 flex items-center justify-between gap-3 border-t border-nexoraBorder pt-3">
          <span className="text-[11px] font-bold text-nexoraMuted">
            {dirty ? t(`${K}.unsavedChanges`) : t(`${K}.allChangesSaved`)}
          </span>
          <button
            type="submit"
            disabled={!dirty || saveSettings.isPending}
            className="rounded-lg bg-nexoraBrand px-4 py-2 text-[11px] font-bold text-white hover:bg-nexoraBrandDark disabled:opacity-60"
          >
            {t(`${K}.saveSettings`)}
          </button>
        </div>
      </form>
    </div>
  )
}
