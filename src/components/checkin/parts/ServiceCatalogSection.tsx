// "Choose services" — the menu, plus the one free-text note that travels with the whole visit.
//
// The grid itself is CategoryGroupedCatalogPicker in its check-in mode, which the front desk and
// the kiosk already shared; what this card adds is the heading, the collapsible note and a shell
// that reads the same on both surfaces.
//
// Add-ons are not a special kind of service — the salon's catalog models them as a category
// ("Add-ons"), so they arrive here as ordinary cards under their own chip, with no extra badge and
// no "must accompany a main service" rule to enforce.
import { ChevronDown } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from '../../../contexts/LanguageContext'
import CategoryGroupedCatalogPicker, {
  type CatalogPickerItem,
} from '../../dashboard/views/pos/CategoryGroupedCatalogPicker'
import { SkeletonList } from '../../ui/skeleton'
import type { CheckInService } from '../types'

const K = 'components.checkin.ServiceCatalogSection'

const NOTE_MAX_LENGTH = 500

export default function ServiceCatalogSection({
  services,
  isLoading,
  selectedServiceIds,
  onToggle,
  note,
  onChangeNote,
}: {
  services: CheckInService[]
  isLoading: boolean
  selectedServiceIds: string[]
  onToggle: (serviceId: string) => void
  note: string
  onChangeNote: (next: string) => void
}) {
  const { t } = useTranslation()
  const [isNoteExpanded, setIsNoteExpanded] = useState(false)

  const items = useMemo<CatalogPickerItem[]>(
    () =>
      services.map((service) => ({
        id: service.id,
        name: service.name,
        price: service.price,
        categories: service.categories,
        durationMinutes: service.durationMinutes,
        description: service.description,
        photoUrl: service.photoUrl,
      })),
    [services],
  )

  return (
    <section className="space-y-3 rounded-2xl border border-nexoraBorder bg-nexoraSurface p-4">
      <div>
        <h2 className="text-lg font-black text-nexoraText">{t(`${K}.title`)}</h2>
        <p className="text-sm text-nexoraMuted">{t(`${K}.subtitle`)}</p>
      </div>

      {isLoading ? (
        <SkeletonList count={6} lines={2} />
      ) : (
        <CategoryGroupedCatalogPicker
          items={items}
          onAdd={onToggle}
          variant="grid"
          selectedItemIds={selectedServiceIds}
          addLabel={t(`${K}.add`)}
          emptyLabel={t(`${K}.empty`)}
          allCategoryLabel={t(`${K}.allCategories`)}
          uncategorizedLabel={t(`${K}.uncategorized`)}
          searchPlaceholder={t(`${K}.searchPlaceholder`)}
          viewDetailsLabel={t(`${K}.viewDetails`)}
          closeDetailsLabel={t(`${K}.closeDetails`)}
        />
      )}

      {/* Collapsed by default: most visits have nothing to say here, and an open textarea would
          push the selected-services summary and the CTA below the fold on a tablet. */}
      <div className="rounded-xl border border-nexoraBorder">
        <button
          type="button"
          onClick={() => setIsNoteExpanded((prev) => !prev)}
          className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left"
        >
          <span className="min-w-0 truncate text-xs font-bold text-nexoraText">
            {t(`${K}.noteLabel`)}
            {note.trim() ? ` · ${note.trim()}` : ''}
          </span>
          <ChevronDown
            className={`h-4 w-4 shrink-0 text-nexoraMuted transition ${isNoteExpanded ? 'rotate-180' : ''}`}
          />
        </button>
        {isNoteExpanded ? (
          <textarea
            value={note}
            onChange={(e) => onChangeNote(e.target.value)}
            maxLength={NOTE_MAX_LENGTH}
            rows={2}
            placeholder={t(`${K}.notePlaceholder`)}
            className="w-full rounded-b-xl border-t border-nexoraBorder bg-white px-3 py-2 text-xs text-nexoraText outline-none focus:border-nexoraBrand"
          />
        ) : null}
      </div>
    </section>
  )
}
