// Shared category-filterable, searchable catalog picker for POS Service/Product selection
// — used by the Order Workspace's Services/Products catalog browser (US-17), and by the
// Booking service pickers (NewBookingForm/RescheduleServicesEditor). Categories are derived
// from the items themselves (each catalog item already carries its own Categories:
// {id,name}[]) rather than a separate categories fetch, since GetPosCategoriesQuery is
// Owner-only and this picker must also work for a Staff caller with Operations access.
//
// `variant="grid"` (POS iPad redesign — Order Workspace only) swaps the thin item-row list
// for a touch-sized card grid with sticky category headers, on the posFd color tokens —
// approved after 4 rounds of wireframe review (see project memory). `variant="list"`
// (default) is untouched and keeps the Booking pickers pixel-identical, since they weren't
// part of that review and live inside more space-constrained modals.
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
  variant = 'list',
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
  variant?: 'list' | 'grid'
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

  const isGrid = variant === 'grid'

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

  // Touch-sized card (POS iPad redesign) — compact enough that a long catalog still fits
  // several rows per screen (the whole point of this redesign was cutting scroll distance),
  // but big enough to tap comfortably. No duration/subtitle line: the real catalog DTOs
  // (CheckoutServiceCatalogItemApiDto/CheckoutProductCatalogItemApiDto) don't carry one.
  const renderItemCard = (item: CatalogPickerItem) => (
    <button
      key={item.id}
      type="button"
      onClick={() => onAdd(item.id)}
      disabled={isPending}
      className="flex min-h-[76px] flex-col justify-between gap-2 rounded-2xl border border-posFdBorder bg-posFdSurface p-3 text-left hover:border-posFdAccent disabled:opacity-60"
    >
      <span className="line-clamp-2 text-sm font-bold leading-snug text-posFdText">{item.name}</span>
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-posFdText">${item.price.toFixed(2)}</span>
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-posFdCanvas text-base font-bold text-posFdAccentDark">
          +
        </span>
      </div>
    </button>
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
        <Search
          className={`pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 ${
            isGrid ? 'text-posFdMuted' : 'text-nexoraMuted'
          }`}
        />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={searchPlaceholder}
          className={
            isGrid
              ? 'h-11 w-full rounded-xl border border-posFdBorder bg-white pl-8 pr-2.5 text-sm text-posFdText outline-none focus:border-posFdAccent'
              : 'h-8 w-full rounded-lg border border-nexoraBorder bg-white pl-8 pr-2.5 text-[11px] text-nexoraText outline-none focus:border-nexoraBrand'
          }
        />
      </div>

      {categories.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setSelectedCategoryId('')}
            className={
              isGrid
                ? `rounded-full px-3.5 py-2 text-xs font-bold transition ${
                    selectedCategoryId === ''
                      ? 'bg-posFdAccent text-white'
                      : 'bg-posFdCanvas text-posFdMuted hover:text-posFdText'
                  }`
                : `rounded-full px-2.5 py-1 text-[10px] font-bold transition ${
                    selectedCategoryId === ''
                      ? 'bg-nexoraBrand text-white'
                      : 'bg-nexoraCanvas text-nexoraMuted hover:text-nexoraText'
                  }`
            }
          >
            {allCategoryLabel}
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => setSelectedCategoryId(category.id)}
              className={
                isGrid
                  ? `rounded-full px-3.5 py-2 text-xs font-bold transition ${
                      selectedCategoryId === category.id
                        ? 'bg-posFdAccent text-white'
                        : 'bg-posFdCanvas text-posFdMuted hover:text-posFdText'
                    }`
                  : `rounded-full px-2.5 py-1 text-[10px] font-bold transition ${
                      selectedCategoryId === category.id
                        ? 'bg-nexoraBrand text-white'
                        : 'bg-nexoraCanvas text-nexoraMuted hover:text-nexoraText'
                    }`
              }
            >
              {category.name}
            </button>
          ))}
        </div>
      )}

      {isEmpty ? (
        <p className={isGrid ? 'text-xs text-posFdMuted' : 'text-[11px] text-nexoraMuted'}>{emptyLabel}</p>
      ) : selectedCategoryId === '' ? (
        isGrid ? (
          <div className="max-h-[480px] overflow-y-auto rounded-xl border border-posFdBorder">
            {groupedSections!.map((section) => (
              <div key={section.category.id}>
                <h4 className="sticky top-0 z-[1] border-b border-posFdBorder bg-posFdCanvas px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-posFdMuted">
                  {section.category.name}
                </h4>
                <div className="grid grid-cols-2 gap-2 p-2 sm:grid-cols-3">{section.items.map(renderItemCard)}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="max-h-72 space-y-3 overflow-y-auto rounded-lg border border-nexoraBorder p-1.5 pr-3">
            {groupedSections!.map((section) => (
              <div key={section.category.id}>
                <h4 className="mb-1 px-1.5 text-[10px] font-black uppercase tracking-wider text-nexoraMuted">
                  {section.category.name}
                </h4>
                <div className="space-y-1">{section.items.map(renderItemRow)}</div>
              </div>
            ))}
          </div>
        )
      ) : isGrid ? (
        <div className="grid max-h-[480px] grid-cols-2 gap-2 overflow-y-auto rounded-xl border border-posFdBorder p-2 sm:grid-cols-3">
          {flatItems.map(renderItemCard)}
        </div>
      ) : (
        <div className="max-h-72 space-y-1 overflow-y-auto rounded-lg border border-nexoraBorder p-1.5 pr-3">
          {flatItems.map(renderItemRow)}
        </div>
      )}
    </div>
  )
}
