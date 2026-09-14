// Step 3 — what the customer came in for.
//
// Reuses CategoryGroupedCatalogPicker in its check-in mode (grid cards, per-category counts,
// tap-to-add) so the kiosk and the front desk present the same menu the same way. Selecting
// nothing is a supported outcome — "just get me in the queue, I'll explain in person" — so the
// primary button changes label rather than being disabled.
import { useMemo, type ReactNode } from 'react'
import { useTranslation } from '../../../contexts/LanguageContext'
import CheckInStepFrame from '../../checkin/parts/CheckInStepFrame'
import CategoryGroupedCatalogPicker, {
  type CatalogPickerItem,
} from '../../dashboard/views/pos/CategoryGroupedCatalogPicker'
import { SkeletonList } from '../../ui/skeleton'
import type { SelfCheckInServiceApiDto } from '../../../types/repositories'

const K = 'components.posDevice.SelfCheckInFlow'

export default function SelectServicesStep({
  services,
  isLoading,
  selectedServiceIds,
  // Set only when the customer skipped straight past this step — with no services chosen there is
  // no technician step to fail on, so the submit error has to land back here.
  isSubmitting,
  errorMessage,
  onAdd,
  onBack,
  onContinue,
  header,
  footerNote,
  disabledItemIds,
  primaryLabel,
}: {
  services: (SelfCheckInServiceApiDto & { tags?: string[]; displayOrder?: number })[]
  isLoading: boolean
  selectedServiceIds: string[]
  isSubmitting: boolean
  errorMessage: string | null
  onAdd: (serviceId: string) => void
  onBack: () => void
  onContinue: () => void
  // Front desk only: a Services/Products tab strip above the same picker, and a running total
  // below it. The kiosk sells no products and shows no totals, so it passes neither.
  header?: ReactNode
  footerNote?: ReactNode
  disabledItemIds?: string[]
  primaryLabel?: string
}) {
  const { t } = useTranslation()

  const items = useMemo<CatalogPickerItem[]>(
    () =>
      services.map((s) => ({
        id: s.id,
        name: s.name,
        price: s.price,
        categories: s.categories,
        tags: s.tags,
        displayOrder: s.displayOrder,
        durationMinutes: s.durationMinutes,
        description: s.description,
        photoUrl: s.photoUrl,
      })),
    [services],
  )

  const selectedCount = selectedServiceIds.length

  return (
    <CheckInStepFrame
      title={t(`${K}.servicesTitle`)}
      subtitle={t(`${K}.servicesSubtitle`)}
      backLabel={t(`${K}.back`)}
      onBack={onBack}
      primaryLabel={
        primaryLabel ??
        (selectedCount === 0
          ? t(`${K}.servicesSkip`)
          : t(`${K}.servicesContinue`, { count: String(selectedCount) }))
      }
      onPrimary={onContinue}
      isSubmitting={isSubmitting}
    >
      {header}

      {isLoading ? (
        <SkeletonList count={6} lines={2} />
      ) : (
        <CategoryGroupedCatalogPicker
          items={items}
          onAdd={onAdd}
          isPending={isSubmitting}
          variant="grid"
          selectedItemIds={selectedServiceIds}
          allowRepeatedItems
          disabledItemIds={disabledItemIds}
          addLabel={t(`${K}.catalogAdd`)}
          emptyLabel={t(`${K}.catalogEmpty`)}
          allCategoryLabel={t(`${K}.catalogAll`)}
          uncategorizedLabel={t(`${K}.catalogUncategorized`)}
          searchPlaceholder={t(`${K}.catalogSearchPlaceholder`)}
          viewDetailsLabel={t(`${K}.catalogViewDetails`)}
          closeDetailsLabel={t(`${K}.catalogCloseDetails`)}
        />
      )}

      {footerNote}

      {errorMessage ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-nexoraDanger">{errorMessage}</p>
      ) : null}
    </CheckInStepFrame>
  )
}
