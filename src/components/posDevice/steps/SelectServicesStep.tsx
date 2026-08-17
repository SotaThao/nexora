// Step 3 — what the customer came in for.
//
// Reuses CategoryGroupedCatalogPicker in its check-in mode (grid cards, per-category counts,
// tap-to-toggle) so the kiosk and the front desk present the same menu the same way. Selecting
// nothing is a supported outcome — "just get me in the queue, I'll explain in person" — so the
// primary button changes label rather than being disabled.
import { useMemo } from 'react'
import { Loader2 } from 'lucide-react'
import { useTranslation } from '../../../contexts/LanguageContext'
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
  onToggle,
  onBack,
  onContinue,
}: {
  services: SelfCheckInServiceApiDto[]
  isLoading: boolean
  selectedServiceIds: string[]
  isSubmitting: boolean
  errorMessage: string | null
  onToggle: (serviceId: string) => void
  onBack: () => void
  onContinue: () => void
}) {
  const { t } = useTranslation()

  const items = useMemo<CatalogPickerItem[]>(
    () =>
      services.map((s) => ({
        id: s.id,
        name: s.name,
        price: s.price,
        categories: s.categories,
        durationMinutes: s.durationMinutes,
        description: s.description,
        photoUrl: s.photoUrl,
      })),
    [services],
  )

  const selectedCount = selectedServiceIds.length

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4 rounded-2xl border border-nexoraBorder bg-nexoraSurface p-6">
      <div className="text-center">
        <h1 className="text-xl font-black text-nexoraText">{t(`${K}.servicesTitle`)}</h1>
        <p className="mt-1 text-sm text-nexoraMuted">{t(`${K}.servicesSubtitle`)}</p>
      </div>

      {isLoading ? (
        <SkeletonList count={6} lines={2} />
      ) : (
        <CategoryGroupedCatalogPicker
          items={items}
          onAdd={onToggle}
          variant="grid"
          selectedItemIds={selectedServiceIds}
          addLabel={t(`${K}.catalogAdd`)}
          emptyLabel={t(`${K}.catalogEmpty`)}
          allCategoryLabel={t(`${K}.catalogAll`)}
          uncategorizedLabel={t(`${K}.catalogUncategorized`)}
          searchPlaceholder={t(`${K}.catalogSearchPlaceholder`)}
          viewDetailsLabel={t(`${K}.catalogViewDetails`)}
          closeDetailsLabel={t(`${K}.catalogCloseDetails`)}
        />
      )}

      {errorMessage ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-nexoraDanger">{errorMessage}</p>
      ) : null}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onBack}
          disabled={isSubmitting}
          className="h-14 flex-1 rounded-lg border border-nexoraBorder text-base font-bold text-nexoraText hover:border-nexoraBrand disabled:opacity-60"
        >
          {t(`${K}.back`)}
        </button>
        <button
          type="button"
          onClick={onContinue}
          disabled={isSubmitting}
          className="flex h-14 flex-[2] items-center justify-center gap-2 rounded-lg bg-nexoraBrand text-base font-bold text-white hover:bg-nexoraBrandDark disabled:opacity-60"
        >
          {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
          {selectedCount === 0
            ? t(`${K}.servicesSkip`)
            : t(`${K}.servicesContinue`, { count: String(selectedCount) })}
        </button>
      </div>
    </div>
  )
}
