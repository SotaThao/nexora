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
  scrollInParentOnPhone,
  scrollInParent,
  className,
  statusContent,
  // The "Add services" modal on checkout renders this same picker without the surrounding
  // nexora-card — the modal already has its own border, so a card inside a card would double up.
  // The title, search bar and grid below stay identical between the two either way.
  showCard = true,
}: {
  items: CatalogPickerItem[]
  onAdd: (itemId: string) => void
  isPending?: boolean
  missingPriceLabel?: string
  scrollInParentOnTablet?: boolean
  scrollInParentOnPhone?: boolean
  scrollInParent?: boolean
  className?: string
  statusContent?: ReactNode
  showCard?: boolean
}) {
  const { t } = useTranslation()
  const title = t(`${K}.tabServices`)

  const content = statusContent ? (
    <div className="space-y-3">
      {showCard ? (
        <h3 className="text-xs font-black uppercase tracking-wider text-nexoraMuted">{title}</h3>
      ) : null}
      {statusContent}
    </div>
  ) : (
    <CategoryGroupedCatalogPicker
      title={title}
      hideTitleText={!showCard}
      variant="grid"
      showDuration
      scrollInParentOnTablet={scrollInParentOnTablet}
      scrollInParentOnPhone={scrollInParentOnPhone}
      scrollInParent={scrollInParent}
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
  )

  if (!showCard) return content

  return (
    <section aria-label={title} className={`nexora-card min-w-0 p-4${className ? ` ${className}` : ''}`}>
      {content}
    </section>
  )
}
