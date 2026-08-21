// What has been picked so far, as removable chips, with the three numbers that answer "how long
// will this take and what will it cost".
//
// Separate from the catalog above it because the catalog scrolls and this must not: the running
// answer is what the guest and the operator both glance at while still tapping through the menu.
import { X } from 'lucide-react'
import { useTranslation } from '../../../contexts/LanguageContext'
import type { CheckInService } from '../types'

const K = 'components.checkin.SelectedServicesSummary'

export default function SelectedServicesSummary({
  services,
  totalMinutes,
  totalPrice,
  onRemove,
}: {
  services: CheckInService[]
  totalMinutes: number
  totalPrice: number
  onRemove: (serviceId: string) => void
}) {
  const { t } = useTranslation()

  return (
    <section className="space-y-3 rounded-2xl border border-nexoraBorder bg-nexoraSurface p-4">
      <h3 className="text-[11px] font-black uppercase tracking-wider text-nexoraMuted">
        {t(`${K}.title`)}
      </h3>

      {services.length === 0 ? (
        <p className="text-xs text-nexoraMuted">{t(`${K}.empty`)}</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {services.map((service) => (
            <span
              key={service.id}
              className="flex items-center gap-1.5 rounded-full border border-nexoraBorder bg-nexoraCanvas px-3 py-1.5 text-xs font-bold text-nexoraText"
            >
              {service.name}
              <button
                type="button"
                onClick={() => onRemove(service.id)}
                aria-label={t(`${K}.remove`, { serviceName: service.name })}
                className="text-nexoraMuted hover:text-nexoraDanger"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </span>
          ))}
        </div>
      )}

      <dl className="grid grid-cols-3 gap-2 border-t border-nexoraBorder pt-3 text-center">
        <div>
          <dt className="text-[10px] font-black uppercase tracking-wider text-nexoraMuted">
            {t(`${K}.servicesCount`)}
          </dt>
          <dd className="text-sm font-black text-nexoraText">{services.length}</dd>
        </div>
        <div>
          <dt className="text-[10px] font-black uppercase tracking-wider text-nexoraMuted">
            {t(`${K}.totalTime`)}
          </dt>
          <dd className="text-sm font-black text-nexoraText">
            {t(`${K}.minutes`, { minutes: String(totalMinutes) })}
          </dd>
        </div>
        <div>
          <dt className="text-[10px] font-black uppercase tracking-wider text-nexoraMuted">
            {t(`${K}.total`)}
          </dt>
          <dd className="text-sm font-black text-nexoraText">${totalPrice.toFixed(2)}</dd>
        </div>
      </dl>
    </section>
  )
}
