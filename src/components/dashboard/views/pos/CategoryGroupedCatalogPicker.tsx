// Shared category-filterable, searchable catalog picker for POS Service/Product selection
// — used by the Order Workspace's Services/Products catalog browser (US-17). Categories are
// derived from the items themselves (each catalog item already carries its own
// Categories: {id,name}[]) rather than a separate categories fetch, since
// GetPosCategoriesQuery is Owner-only and this picker must also work for a Staff caller
// with Operations access.
import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'

export interface CatalogPickerItem {
  id: string
  name: string
  price: number
  categories: { id: string; name: string }[]
}

export default function CategoryGroupedCatalogPicker({
  items,
  onAdd,
  isPending,
  addLabel,
  emptyLabel,
  allCategoryLabel,
  uncategorizedLabel,
  searchPlaceholder,
}: {
  items: CatalogPickerItem[]
  onAdd: (itemId: string) => void
  isPending?: boolean
  addLabel: string
  emptyLabel: string
  allCategoryLabel: string
  // Header shown for items with zero categories when "All" is selected — without this,
  // an item with no PosCategory link would never appear in any grouped section.
  uncategorizedLabel: string
  searchPlaceholder?: string
}) {
  const [selectedCategoryId, setSelectedCategoryId] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  const categories = useMemo(() => {
    const byId = new Map<string, string>()
    items.forEach((item) => item.categories.forEach((c) => byId.set(c.id, c.name)))
    return Array.from(byId, ([id, name]) => ({ id, name }))
  }, [items])

  const searchedItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    return query === '' ? items : items.filter((item) => item.name.toLowerCase().includes(query))
  }, [items, searchQuery])

  const renderItemRow = (item: CatalogPickerItem) => (
    <div
      key={item.id}
      className="flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-xs hover:bg-nexoraCanvas"
    >
      <span className="truncate font-semibold text-nexoraText">
        {item.name} — ${item.price.toFixed(2)}
      </span>
      <button
        type="button"
        onClick={() => onAdd(item.id)}
        disabled={isPending}
        className="shrink-0 rounded-lg bg-nexoraBrand px-2.5 py-1 text-[10px] font-bold text-white hover:bg-nexoraBrandDark disabled:opacity-60"
      >
        {addLabel}
      </button>
    </div>
  )

  const groupedSections = useMemo(() => {
    if (selectedCategoryId !== '') return null
    const sections = categories
      .map((category) => ({
        category,
        items: searchedItems.filter((item) => item.categories.some((c) => c.id === category.id)),
      }))
      .filter((section) => section.items.length > 0)

    // Items with no category link at all must still show up somewhere in the "All" view —
    // otherwise an uncategorized item silently disappears from the picker entirely.
    const uncategorizedItems = searchedItems.filter((item) => item.categories.length === 0)
    if (uncategorizedItems.length > 0) {
      sections.push({ category: { id: '', name: uncategorizedLabel }, items: uncategorizedItems })
    }
    return sections
  }, [categories, searchedItems, selectedCategoryId, uncategorizedLabel])

  const flatItems =
    selectedCategoryId === ''
      ? searchedItems
      : searchedItems.filter((item) => item.categories.some((c) => c.id === selectedCategoryId))

  const isEmpty =
    selectedCategoryId === '' ? (groupedSections?.length ?? 0) === 0 : flatItems.length === 0

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-nexoraMuted" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={searchPlaceholder}
          className="h-8 w-full rounded-lg border border-nexoraBorder bg-white pl-8 pr-2.5 text-[11px] text-nexoraText outline-none focus:border-nexoraBrand"
        />
      </div>

      {categories.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setSelectedCategoryId('')}
            className={`rounded-full px-2.5 py-1 text-[10px] font-bold transition ${
              selectedCategoryId === ''
                ? 'bg-nexoraBrand text-white'
                : 'bg-nexoraCanvas text-nexoraMuted hover:text-nexoraText'
            }`}
          >
            {allCategoryLabel}
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => setSelectedCategoryId(category.id)}
              className={`rounded-full px-2.5 py-1 text-[10px] font-bold transition ${
                selectedCategoryId === category.id
                  ? 'bg-nexoraBrand text-white'
                  : 'bg-nexoraCanvas text-nexoraMuted hover:text-nexoraText'
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>
      )}

      {isEmpty ? (
        <p className="text-[11px] text-nexoraMuted">{emptyLabel}</p>
      ) : selectedCategoryId === '' ? (
        <div className="max-h-72 space-y-3 overflow-y-auto rounded-lg border border-nexoraBorder p-1.5">
          {groupedSections!.map((section) => (
            <div key={section.category.id}>
              <h4 className="mb-1 px-1.5 text-[10px] font-black uppercase tracking-wider text-nexoraMuted">
                {section.category.name}
              </h4>
              <div className="space-y-1">{section.items.map(renderItemRow)}</div>
            </div>
          ))}
        </div>
      ) : (
        <div className="max-h-72 space-y-1 overflow-y-auto rounded-lg border border-nexoraBorder p-1.5">
          {flatItems.map(renderItemRow)}
        </div>
      )}
    </div>
  )
}
