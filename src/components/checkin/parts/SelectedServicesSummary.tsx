// Group repeated selections for quantity editing while retaining each occurrence's line ID.
import { ClipboardCheck, Minus, Plus } from 'lucide-react'
import { useTranslation } from '../../../contexts/LanguageContext'
import type { CheckInSelectedService } from '../types'
import CheckInSectionCard from './CheckInSectionCard'

const K = 'components.checkin.SelectedServicesSummary'

export default function SelectedServicesSummary({
  services,
  totalPrice,
  onAdd,
  onRemove,
  onRemoveGroup,
  isSubmitting = false,
}: {
  services: CheckInSelectedService[]
  totalPrice: number
  onAdd: (serviceId: string) => void
  onRemove: (lineId: string) => void
  onRemoveGroup: (serviceId: string) => void
  isSubmitting?: boolean
}) {
  const { t } = useTranslation()
  const groups = new Map<string, { service: CheckInSelectedService; lineIds: string[] }>()
  for (const service of services) {
    const group = groups.get(service.id)
    if (group) group.lineIds.push(service.lineId)
    else groups.set(service.id, { service, lineIds: [service.lineId] })
  }

  return (
    <CheckInSectionCard
      title={t(`${K}.title`)}
      icon={ClipboardCheck}
      headingAs="h3"
    >
      {services.length === 0 ? (
        <p className="text-xs text-nexoraMuted">{t(`${K}.empty`)}</p>
      ) : (
        <div>
          <table className="block w-full text-left sm:table">
            <thead className="hidden sm:table-header-group">
              <tr className="border-b border-dashed border-nexoraBorder">
                <th scope="col" className="pb-3 pr-2 text-[11px] font-bold text-nexoraMuted">{t(`${K}.service`)}</th>
                <th scope="col" className="whitespace-nowrap pb-3 pr-3 text-right text-[11px] font-bold text-nexoraMuted">{t(`${K}.unitPrice`)}</th>
                <th scope="col" className="pb-3 text-center text-[11px] font-bold text-nexoraMuted">{t(`${K}.quantity`)}</th>
                <th scope="col"><span className="sr-only">{t(`${K}.removeButton`)}</span></th>
              </tr>
            </thead>
            <tbody className="block sm:table-row-group">
              {Array.from(groups.values(), ({ service, lineIds }) => (
                <tr key={service.id} className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-dashed border-nexoraBorder py-3 last:border-0 sm:table-row sm:py-0">
                  <th scope="row" className="min-w-0 basis-full break-words pr-2 text-sm font-bold text-nexoraText sm:py-3">{service.name}</th>
                  <td className="mr-auto whitespace-nowrap text-sm tabular-nums text-nexoraMuted sm:py-3 sm:pr-3 sm:text-right">
                    <span className="block text-[10px] sm:hidden">{t(`${K}.unitPrice`)}</span>
                    ${service.price.toFixed(2)}
                  </td>
                  <td className="sm:py-3">
                    <div className="flex w-fit items-center rounded-lg border border-nexoraBorder">
                      <button
                        type="button"
                        onClick={() => onRemove(lineIds[lineIds.length - 1])}
                        disabled={isSubmitting || lineIds.length <= 1}
                        aria-label={t(`${K}.decreaseQuantity`, { serviceName: service.name })}
                        className="flex h-7 w-6 shrink-0 items-center justify-center rounded-l-lg text-nexoraMuted hover:bg-nexoraCanvas focus-visible:outline focus-visible:outline-2 focus-visible:outline-nexoraBrand disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <Minus aria-hidden="true" className="h-3 w-3" />
                      </button>
                      <span aria-live="polite" className="min-w-5 px-1 text-center text-xs font-bold tabular-nums text-nexoraText">{lineIds.length}</span>
                      <button
                        type="button"
                        onClick={() => onAdd(service.id)}
                        disabled={isSubmitting}
                        aria-label={t(`${K}.increaseQuantity`, { serviceName: service.name })}
                        className="flex h-7 w-6 shrink-0 items-center justify-center rounded-r-lg text-nexoraMuted hover:bg-nexoraCanvas focus-visible:outline focus-visible:outline-2 focus-visible:outline-nexoraBrand disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <Plus aria-hidden="true" className="h-3 w-3" />
                      </button>
                    </div>
                  </td>
                  <td className="sm:py-3 sm:pl-1">
                    <button
                      type="button"
                      onClick={() => onRemoveGroup(service.id)}
                      disabled={isSubmitting}
                      aria-label={t(`${K}.remove`, { serviceName: service.name })}
                      className="flex h-9 items-center justify-center whitespace-nowrap rounded-lg px-2 text-xs font-semibold text-nexoraMuted hover:bg-red-50 hover:text-nexoraDanger focus-visible:outline focus-visible:outline-2 focus-visible:outline-nexoraBrand disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {t(`${K}.removeButton`)}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
