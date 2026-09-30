import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { useTranslation } from '../../../../../contexts/LanguageContext'
import { useNotification } from '../../../../../contexts/NotificationContext'
import { useUpdatePosSmsLinkSettings } from '../../../../../data/hooks/usePosSmsSettings'
import { getErrorMessage } from '../../../../../data/errorCodes'
import { TOAST_SNACK_DURATION_MS } from '../../../../../constants/toast'

const K = 'components.dashboard.views.pos.PosSmsSettings'

type Props = {
  businessId: string
  visitLinkTtlDays: number
  options: number[]
}

export default function PosSmsLinkSettingsPanel({ businessId, visitLinkTtlDays, options }: Props) {
  const { t } = useTranslation()
  const { showToast: notify } = useNotification()
  const updateLinkSettings = useUpdatePosSmsLinkSettings(businessId)
  const [ttlDays, setTtlDays] = useState(visitLinkTtlDays)

  const dayLabel = (days: number) => t(days === 1 ? `${K}.link.oneDay` : `${K}.link.days`, { count: days })

  const save = () => {
    if (updateLinkSettings.isPending) return
    updateLinkSettings.mutate(ttlDays, {
      onSuccess: () =>
        notify(t('components.settings.hooks.useSettingsForm.settingsUpdatedSuccessfully'), 'success', TOAST_SNACK_DURATION_MS),
      onError: (err) => notify(getErrorMessage(err, t), 'error', TOAST_SNACK_DURATION_MS),
    })
  }

  return (
    <section className="flex flex-col gap-3 rounded-xl border border-nexoraBorder bg-white p-4 shadow-sm sm:p-5">
      <h3 className="text-sm font-extrabold text-nexoraText">{t(`${K}.link.title`)}</h3>
      <p className="text-[11px] text-nexoraText">{t(`${K}.link.description`)}</p>
      <p className="text-[11px] text-nexoraText">{t(`${K}.link.descriptionLinks`)}</p>

      <div className="flex flex-col gap-1">
        <label htmlFor="pos-sms-link-ttl" className="text-[10px] font-extrabold uppercase tracking-wide text-nexoraMuted">
          {t(`${K}.link.availabilityLabel`)}
        </label>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative sm:w-52">
            <select
              id="pos-sms-link-ttl"
              value={ttlDays}
              onChange={(e) => setTtlDays(Number(e.target.value))}
              className="h-10 w-full appearance-none rounded-lg border border-nexoraBorder bg-white pl-3 pr-9 text-xs font-semibold text-nexoraText outline-none focus:border-nexoraBrand"
            >
              {options.map((days) => (
                <option key={days} value={days}>
                  {t(`${K}.link.afterCheckoutOption`, { period: dayLabel(days) })}
                </option>
              ))}
            </select>
            <ChevronDown
              className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-nexoraMuted"
              aria-hidden
            />
          </div>
          <button
            type="button"
            onClick={save}
            disabled={updateLinkSettings.isPending}
            className="inline-flex h-9 items-center justify-center rounded-lg bg-nexoraBrand px-4 text-xs font-bold text-white transition hover:bg-nexoraBrandDark disabled:opacity-60"
          >
            {t(`${K}.link.save`)}
          </button>
        </div>
      </div>

      <p className="text-[11px] text-nexoraText">
        {ttlDays === 1 ? t(`${K}.link.exampleOneDay`) : t(`${K}.link.exampleDays`, { count: ttlDays })}
      </p>
    </section>
  )
}
