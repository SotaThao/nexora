// ChangeServiceModal — swaps the service on one ticket line.
//
// A popup rather than an in-row expander: the catalog is 50+ items with its own search and category
// chips, and unfolding that inside a line pushed the rest of the ticket off screen. The technician
// picker stays inline (it is a short grid) — only this one opens over the page.
//
// Nothing is persisted here: picking an item hands the id back and closes, and the caller makes the
// single UpdateOrderServiceLine call.
import { X } from 'lucide-react'
import { useTranslation } from '../../../../../contexts/LanguageContext'
import IconButton from '../../../../ui/IconButton'
import CategoryGroupedCatalogPicker from '../CategoryGroupedCatalogPicker'
import type { CheckoutServiceCatalogItemApiDto } from '../../../../../types/repositories'

const K = 'components.dashboard.views.pos.PosOrderWorkspace'

export default function ChangeServiceModal({
  open,
  serviceName,
  services,
  isPending = false,
  onSelect,
  onClose,
}: {
  open: boolean
  // The line's current service, shown in the title so the operator knows which row they opened.
  serviceName: string
  services: CheckoutServiceCatalogItemApiDto[]
  isPending?: boolean
  onSelect: (posServiceId: string) => void
  onClose: () => void
}) {
  const { t } = useTranslation()

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-nexoraText/70 p-4 backdrop-blur-sm">
      <div className="nexora-modal-card max-w-2xl">
        <div className="mb-4 flex shrink-0 items-center justify-between gap-3">
          <h2 className="min-w-0 truncate text-sm font-extrabold text-nexoraText">
            {t(`${K}.changeServiceModalTitle`, { serviceName })}
          </h2>
          <IconButton label={t(`${K}.changeServiceModalClose`)} onClick={onClose} disabled={isPending}>
            <X className="h-4 w-4" />
          </IconButton>
        </div>

        {/* The picker scrolls, the header above stays put — a 50-item catalog otherwise pushes the
            close button out of reach on a phone. */}
        <div className="flex-1 overflow-y-auto">
          <CategoryGroupedCatalogPicker
            items={services}
            onAdd={onSelect}
            isPending={isPending}
            addLabel={t(`${K}.selectServiceButton`)}
            emptyLabel={t(`${K}.noServicesInCategory`)}
            allCategoryLabel={t(`${K}.allCategories`)}
            uncategorizedLabel={t(`${K}.uncategorized`)}
            searchPlaceholder={t(`${K}.searchServicesPlaceholder`)}
          />
        </div>
      </div>
    </div>
  )
}
