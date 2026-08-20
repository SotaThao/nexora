// RescheduleServicesEditor — lets Staff change which services/technicians are on an existing
// booking from the Booking tab's Reschedule modal (Ticket 9 risk-log follow-up: the backend
// RescheduleBookingCommand from Ticket 8 already supports this, but no UI previously exposed
// it). Mirrors NewBookingForm's service-picker + per-line technician-select pattern exactly.
import { Trash2 } from 'lucide-react'
import { useTranslation } from '../../../../../contexts/LanguageContext'
import { useCheckoutServiceCatalog } from '../../../../../data/hooks/usePosCheckout'
import CategoryGroupedCatalogPicker from '../CategoryGroupedCatalogPicker'
import { TechnicianSelect } from './NewBookingForm'
import { randomUuid } from '../../../../../utils/uuid'

export interface RescheduleLineDraft {
  key: string
  posServiceId: string
  serviceName: string
  posStaffProfileId?: string
}

export default function RescheduleServicesEditor({
  businessId,
  lines,
  onChange,
}: {
  businessId: string
  lines: RescheduleLineDraft[]
  onChange: (lines: RescheduleLineDraft[]) => void
}) {
  const { t } = useTranslation()
  const { data: serviceCatalog = [] } = useCheckoutServiceCatalog(businessId)
  const p = 'components.dashboard.views.pos.BookingTab.'
  const nb = 'components.dashboard.views.pos.NewBookingForm.'

  const handleAdd = (itemId: string) => {
    const service = serviceCatalog.find((s) => s.id === itemId)
    if (!service) return
    onChange([...lines, { key: randomUuid(), posServiceId: service.id, serviceName: service.name }])
  }

  const handleRemove = (key: string) => {
    onChange(lines.filter((l) => l.key !== key))
  }

  const handleStaffChange = (key: string, posStaffProfileId?: string) => {
    onChange(lines.map((l) => (l.key === key ? { ...l, posStaffProfileId } : l)))
  }

  return (
    <div className="space-y-2">
      <CategoryGroupedCatalogPicker
        items={serviceCatalog}
        onAdd={handleAdd}
        addLabel={t(nb + 'addButton')}
        emptyLabel={t(nb + 'noServicesInCategory')}
        allCategoryLabel={t(nb + 'allCategories')}
        uncategorizedLabel={t(nb + 'uncategorized')}
        searchPlaceholder={t(nb + 'searchServicesPlaceholder')}
      />
      {lines.length > 0 ? (
        <div className="space-y-2">
          {lines.map((line) => (
            <div key={line.key} className="flex items-center gap-2 rounded-lg border border-nexoraBorder p-2">
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-nexoraText">{line.serviceName}</p>
                <div className="mt-1">
                  <TechnicianSelect
                    businessId={businessId}
                    posServiceId={line.posServiceId}
                    value={line.posStaffProfileId}
                    onChange={(staffId) => handleStaffChange(line.key, staffId)}
                    unassignedLabel={t(nb + 'unassigned')}
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleRemove(line.key)}
                className="rounded-md p-1 text-nexoraMuted hover:text-rose-600"
                aria-label={t(p + 'removeServiceLine')}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-[11px] text-nexoraMuted">{t(p + 'rescheduleNoServices')}</p>
      )}
    </div>
  )
}
