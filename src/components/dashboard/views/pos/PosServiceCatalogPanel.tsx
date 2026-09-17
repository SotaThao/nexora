import type { ReactNode } from 'react'
import { useTranslation } from '../../../../contexts/LanguageContext'
import CategoryGroupedCatalogPicker, { type CatalogPickerItem } from './CategoryGroupedCatalogPicker'

const K = 'components.dashboard.views.pos.PosOrderWorkspace'

export default function PosServiceCatalogPanel({
  items,
  onAdd,
  isPending,
  missingPriceLabel,
  scrollInParentOnTablet,
  className,
  statusContent,
}: {
  items: CatalogPickerItem[]
  onAdd: (itemId: string) => void
  isPending?: boolean
  missingPriceLabel?: string
  scrollInParentOnTablet?: boolean
  className?: string
  statusContent?: ReactNode
}) {
  const { t } = useTranslation()
  const title = t(`${K}.tabServices`)

  return (
    <section aria-label={title} className={`nexora-card min-w-0 p-4${className ? ` ${className}` : ''}`}>
      {statusContent ? (
        <div className="space-y-3">
          <h3 className="text-xs font-black uppercase tracking-wider text-nexoraMuted">{title}</h3>
          {statusContent}
        </div>
      ) : (
        <CategoryGroupedCatalogPicker
          title={title}
          variant="grid"
          showDuration
          scrollInParentOnTablet={scrollInParentOnTablet}
          items={items}
          isPending={isPending}
          missingPriceLabel={missingPriceLabel}
          onAdd={onAdd}
          addLabel={t(`${K}.addButton`)}
          emptyLabel={t(`${K}.noServicesInCategory`)}
          allCategoryLabel={t(`${K}.allCategories`)}
          uncategorizedLabel={t(`${K}.uncategorized`)}
          searchPlaceholder={t(`${K}.searchServicesPlaceholder`)}
        />
      )}
    </section>
  )
}
