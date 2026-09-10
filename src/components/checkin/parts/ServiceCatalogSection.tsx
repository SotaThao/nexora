// "Choose services" — the service menu in the main check-in column.
//
// The grid itself is CategoryGroupedCatalogPicker in its check-in mode, which the front desk and
// the kiosk already shared; what this card adds is the heading and a shell that reads the same on
// both surfaces. The visit note sits beside the running summary in FrontDeskNoteCard.
//
// Add-ons are not a special kind of service — the salon's catalog models them as a category
// ("Add-ons"), so they arrive here as ordinary cards under their own chip, with no extra badge and
// no "must accompany a main service" rule to enforce.
import { Sparkles } from 'lucide-react'
import { useMemo } from 'react'
import { useTranslation } from '../../../contexts/LanguageContext'
import CategoryGroupedCatalogPicker, {
  type CatalogPickerItem,
} from '../../dashboard/views/pos/CategoryGroupedCatalogPicker'
import { SkeletonList } from '../../ui/skeleton'
import type { CheckInService } from '../types'
import CheckInSectionCard from './CheckInSectionCard'

const K = 'components.checkin.ServiceCatalogSection'

export default function ServiceCatalogSection({
  services,
  isLoading,
  selectedServiceIds,
  onToggle,
}: {
  services: CheckInService[]
  isLoading: boolean
  selectedServiceIds: string[]
  onToggle: (serviceId: string) => void
}) {
  const { t } = useTranslation()

  const items = useMemo<CatalogPickerItem[]>(
    () =>
      services.map((service) => ({
        id: service.id,
        name: service.name,
        price: service.price,
        categories: service.categories,
        tags: service.tags,
        displayOrder: service.displayOrder,
        durationMinutes: service.durationMinutes,
        description: service.description,
        photoUrl: service.photoUrl,
      })),
    [services],
  )

  return (
    <CheckInSectionCard
      title={t(`${K}.title`)}
      subtitle={t(`${K}.subtitle`)}
      icon={Sparkles}
    >
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

    </CheckInSectionCard>
  )
}
