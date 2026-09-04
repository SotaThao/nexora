// What has been picked so far, as removable chips, with the service count and running total.
//
// Separate from the catalog above it because the catalog scrolls and this must not: the running
// answer is what the guest and the operator both glance at while still tapping through the menu.
import { ClipboardCheck, X } from 'lucide-react'
import { useTranslation } from '../../../contexts/LanguageContext'
import type { CheckInService } from '../types'
import CheckInSectionCard from './CheckInSectionCard'

const K = 'components.checkin.SelectedServicesSummary'

export default function SelectedServicesSummary({
  services,
  totalPrice,
  onRemove,
}: {
  services: CheckInService[]
  totalPrice: number
  onRemove: (serviceId: string) => void
}) {
  const { t } = useTranslation()

  return (
    <CheckInSectionCard
      title={t(`${K}.title`)}
      icon={ClipboardCheck}
      headingAs="h3"
    >
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

      <dl className="grid grid-cols-2 gap-2 border-t border-nexoraBorder pt-3 text-center">
        <div>
          <dt className="text-[10px] font-black uppercase tracking-wider text-nexoraMuted">
            {t(`${K}.servicesCount`)}
          </dt>
          <dd className="text-sm font-black text-nexoraText">{services.length}</dd>
        </div>
        <div>
          <dt className="text-[10px] font-black uppercase tracking-wider text-nexoraMuted">
            {t(`${K}.total`)}
          </dt>
          <dd className="text-sm font-black text-nexoraText">${totalPrice.toFixed(2)}</dd>
        </div>
      </dl>
    </CheckInSectionCard>
  )
}
