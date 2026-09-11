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
  addOnCount,
  services,
  isPending = false,
  onSelect,
  onPickCustom,
  onClose,
}: {
  open: boolean
  // The line's current service, shown in the title so the operator knows which row they opened.
  serviceName: string
  // Add-ons belong to one service, so swapping the service removes them. Warned about here rather
  // than discovered afterwards on the ticket.
  addOnCount: number
  services: CheckoutServiceCatalogItemApiDto[]
  isPending?: boolean
  onSelect: (posServiceId: string) => void
  // Hands the line over to the custom-service form, for work the menu genuinely does not cover.
  onPickCustom: () => void
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

        {addOnCount > 0 ? (
          <p className="mb-3 shrink-0 rounded-2xl border border-amber-200 bg-amber-50/60 px-3 py-2 text-[11px] font-bold leading-tight text-amber-800">
            {t(`${K}.changeServiceRemovesAddOns`, { count: addOnCount })}
          </p>
        ) : null}

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

        <div className="mt-3 shrink-0 border-t border-nexoraBorder pt-3">
          <button
            type="button"
            onClick={onPickCustom}
            disabled={isPending}
            className="h-9 w-full rounded-lg border border-nexoraBorder text-xs font-bold text-nexoraText hover:border-nexoraBrand disabled:opacity-60"
          >
            {t(`${K}.changeServiceToCustom`)}
          </button>
        </div>
      </div>
    </div>
  )
}
