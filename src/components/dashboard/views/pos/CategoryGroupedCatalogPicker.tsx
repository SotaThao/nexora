// Shared category-filterable, searchable catalog picker for POS Service/Product selection
// — used by the Order Workspace's Services/Products catalog browser (US-17), and by the
// Booking service pickers (NewBookingForm/RescheduleServicesEditor). Categories are derived
// from catalog items so staff do not need access to the owner-only categories endpoint.
//
// The grid variant is shared by Checkout/Edit POS and Estimate: compact service cards,
// bordered category filters, and sticky section headings inside a scrollable list.
// Booking uses the list variant; check-in uses the selected-item accordion.
import { useEffect, useMemo, useRef, useState } from 'react'
import { Check, ChevronDown, Plus, Search, X } from 'lucide-react'
import IconButton from '../../../ui/IconButton'

// Sentinel category id for "Others" (items with zero real categories) in Check-in Step
// 2's accordion — that mode has no "All" section to fall back on, so without an explicit
// category, an uncategorized service becomes permanently unreachable.
const UNCATEGORIZED_CHIP_ID = '__uncategorized__'

export interface CatalogPickerItem {
  id: string
  name: string
  price: number
  categories: { id: string; name: string; displayOrder?: number }[]
  displayOrder?: number
  tags?: string[]
  // Check-in Step 2's service card redesign only (see selectedItemIds) — every other
  // caller's DTO either doesn't carry these or they're simply unused there.
  durationMinutes?: number
  description?: string | null
  photoUrl?: string | null
}

const normalizeSearch = (text: string) => text.toLocaleLowerCase()
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd')

const matchesSearch = (item: CatalogPickerItem, query: string) =>
  normalizeSearch(`${item.name} ${item.description ?? ''} ${(item.tags ?? []).join(' ')}`).includes(query)

function groupItemsByTag(items: CatalogPickerItem[]) {
  const tagged = new Map<string, { tag: string | null; items: CatalogPickerItem[] }>()
  const untagged: CatalogPickerItem[] = []
  for (const item of items) {
    const tags = (item.tags ?? []).filter((tag) => typeof tag === 'string').map((tag) => tag.trim()).filter(Boolean)
    if (!tags.length) {
      untagged.push(item)
      continue
    }
    for (const tag of tags) {
      const key = tag.toLowerCase()
      if (!tagged.has(key)) tagged.set(key, { tag, items: [] })
      const group = tagged.get(key)!
      if (!group.items.some(member => member.id === item.id)) group.items.push(item)
    }
  }
  return [...tagged.values(), ...(untagged.length ? [{ tag: null, items: untagged }] : [])]
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
  selectedItemIds,
  allowRepeatedItems = false,
  disabledItemIds,
  viewDetailsLabel,
  closeDetailsLabel,
  showDuration = false,
  missingPriceLabel = '—',
  scrollInParentOnTablet = false,
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
  // Check-in Step 2's technician-first flow (grid variant only) — when provided, this
  // switches on the whole "enhanced service card" treatment (top-right toggle circle,
  // duration next to price, compact category accordion, defaulting to the first category
  // instead of "All", and a "View details" button when the item has a description/photo).
  // Omitted by every other caller (Update-mode catalog, Products, Booking pickers), which
  // keep the original plain "+ Add" card and "All"-first category behavior untouched.
  selectedItemIds?: string[]
  // Repeat mode keeps selected service cards additive and shows their current quantity.
  // Omitted callers retain the existing selected/unselected toggle behavior.
  allowRepeatedItems?: boolean
  // Cards for these ids render disabled (e.g. a service the chosen technician can't
  // perform) — grid variant only, omitted elsewhere.
  disabledItemIds?: string[]
  // Required (in practice) alongside selectedItemIds to show the "View details" button —
  // optional in the type only so callers that never pass selectedItemIds don't need it.
  viewDetailsLabel?: string
  closeDetailsLabel?: string
  showDuration?: boolean
  missingPriceLabel?: string
  // Estimate caps the whole card on tablet; avoid a second scroll area inside it.
  scrollInParentOnTablet?: boolean
}) {
  const [selectedCategoryId, setSelectedCategoryId] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [detailItem, setDetailItem] = useState<CatalogPickerItem | null>(null)

  const isCheckinServiceMode = selectedItemIds !== undefined
  const selectedItemCounts = useMemo(() => {
    const counts = new Map<string, number>()
    for (const itemId of selectedItemIds ?? []) counts.set(itemId, (counts.get(itemId) ?? 0) + 1)
    return counts
  }, [selectedItemIds])
  const disabledIdSet = useMemo(() => new Set(disabledItemIds ?? []), [disabledItemIds])

  const categories = useMemo(() => {
    const byId = new Map<string, { name: string; count: number; displayOrder?: number }>()
    items.forEach((item) =>
      item.categories.forEach((c) => {
        const existing = byId.get(c.id)
        byId.set(c.id, { name: c.name, displayOrder: c.displayOrder, count: (existing?.count ?? 0) + 1 })
      }),
    )
    const result = Array.from(byId, ([id, v]) => ({ id, ...v }))
      .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
    if (isCheckinServiceMode) {
      const uncategorizedCount = items.filter((item) => item.categories.length === 0).length
      if (uncategorizedCount > 0) {
        result.push({ id: UNCATEGORIZED_CHIP_ID, name: uncategorizedLabel, count: uncategorizedCount })
      }
    }
    return result
  }, [items, isCheckinServiceMode, uncategorizedLabel])

  // Check-in opens the first category initially to match the reference. This only runs once;
  // after that, the operator can collapse all categories or switch between them freely.
  const hasDefaultedCategoryRef = useRef(false)
  useEffect(() => {
    if (!isCheckinServiceMode || hasDefaultedCategoryRef.current || categories.length === 0) return
    hasDefaultedCategoryRef.current = true
    setSelectedCategoryId(categories[0].id)
  }, [isCheckinServiceMode, categories])

  const searchedItems = useMemo(() => {
    const query = normalizeSearch(searchQuery.trim())
    const sorted = [...items].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
    return query === '' ? sorted : sorted.filter((item) => matchesSearch(item, query))
  }, [items, searchQuery])

  const isGrid = variant === 'grid'

  const renderItemRow = (item: CatalogPickerItem) => (
    <div
      key={item.id}
      className="flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-xs hover:bg-nexoraCanvas"
    >
      <span className="truncate font-semibold text-nexoraText">
        {item.name} — {item.price == null ? missingPriceLabel : `$${item.price.toFixed(2)}`}
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
  // but big enough to tap comfortably.
  const renderItemCard = (item: CatalogPickerItem) => {
    const selectedCount = selectedItemCounts.get(item.id) ?? 0
    const isSelected = selectedCount > 0
    // Toggle mode keeps an already-selected card enabled so it can be removed after the
    // default technician changes. Repeat mode is always additive, so an explicitly
    // unavailable service stays disabled even when that service is already in the order.
    const isDisabled = Boolean(isPending) || (disabledIdSet.has(item.id) && (allowRepeatedItems || !isSelected))
    const hasDetails = Boolean(viewDetailsLabel && (item.description || item.photoUrl))

    if (isCheckinServiceMode) {
      return (
        <div
          key={item.id}
          data-pos-hover-surface="card"
          className={`flex flex-col gap-1 rounded-xl border bg-white p-2.5 shadow-sm transition-all ${
            isDisabled ? 'opacity-40' : 'hover:-translate-y-0.5 hover:shadow-md'
          } ${isSelected ? 'border-nexoraBrand bg-nexoraBrand/5' : 'border-nexoraBorder hover:border-nexoraBrand/40'}`}
        >
          <button
            type="button"
            onClick={() => onAdd(item.id)}
            disabled={isDisabled}
            aria-label={allowRepeatedItems ? `${addLabel} ${item.name}` : undefined}
            className="flex w-full flex-col gap-1 text-left disabled:cursor-not-allowed"
          >
            <div className="flex items-start justify-between gap-2">
              <span className="line-clamp-2 text-[13px] font-bold leading-tight text-nexoraText">{item.name}</span>
              {allowRepeatedItems ? (
                <span className="flex shrink-0 items-center gap-1">
                  {selectedCount > 0 ? (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-nexoraBrandSoft px-1 text-[10px] font-black text-nexoraBrandDark">
                      {selectedCount}
                    </span>
                  ) : null}
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-nexoraBrand text-sm font-bold leading-none text-white">
                    +
                  </span>
                </span>
              ) : (
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                    isSelected ? 'border-nexoraBrand bg-nexoraBrand text-white' : 'border-nexoraBorder'
                  }`}
                >
                  {isSelected ? <Check className="h-3 w-3" /> : null}
                </span>
              )}
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-[13px] font-bold text-nexoraText">{item.price == null ? missingPriceLabel : `$${item.price.toFixed(2)}`}</span>
              {item.durationMinutes ? (
                <span className="text-[10px] text-nexoraMuted">· {item.durationMinutes} min</span>
              ) : null}
            </div>
          </button>
          {hasDetails ? (
            <button
              type="button"
              onClick={() => setDetailItem(item)}
              className="self-start text-[10px] font-bold text-nexoraBrandDark hover:underline"
            >
              {viewDetailsLabel}
            </button>
          ) : null}
        </div>
      )
    }

    return (
      <button
        key={item.id}
        type="button"
        onClick={() => onAdd(item.id)}
        disabled={isDisabled}
        className={`group/service flex min-h-14 flex-col justify-center gap-1 rounded-lg border bg-nexoraSurface px-3 py-2.5 text-left transition-colors duration-150 disabled:opacity-40 ${
          isSelected ? 'border-nexoraBrand bg-nexoraBrand/5' : 'border-nexoraBorder enabled:hover:border-nexoraBrand/35 enabled:hover:bg-nexoraBrandSoft/20'
        }`}
      >
        <div className="grid w-full grid-cols-[minmax(0,1fr)_auto_auto] items-start gap-2">
          <span className="min-w-0 break-words pt-1 text-xs font-bold leading-tight text-nexoraText">{item.name}</span>
          <span className="whitespace-nowrap pt-0.5 text-xs font-bold tabular-nums leading-5 text-nexoraText">{item.price == null ? missingPriceLabel : `$${item.price.toFixed(2)}`}</span>
          <span aria-hidden="true" className="flex h-6 w-6 items-center justify-center rounded-lg bg-nexoraBrandSoft/60 text-nexoraBrand ring-1 ring-inset ring-nexoraBrand/15 transition-colors duration-150 group-[:enabled:hover]/service:bg-nexoraBrandSoft group-[:enabled:hover]/service:text-nexoraBrandDark group-[:enabled:hover]/service:ring-nexoraBrand/25">
            <Plus className="h-4 w-4" strokeWidth={2.5} />
          </span>
        </div>
        {showDuration && item.durationMinutes != null ? (
          <span className="text-[11px] font-semibold leading-tight text-nexoraMuted">{item.durationMinutes} min</span>
        ) : null}
      </button>
    )
  }

  const renderServices = (services: CatalogPickerItem[], layout: string) => {
    const tagGroups = groupItemsByTag(services)
    const renderItem = isGrid ? renderItemCard : renderItemRow
    if (tagGroups.every((group) => group.tag === null)) {
      return <div className={layout}>{services.map(renderItem)}</div>
    }
    return (
      <div className="space-y-3">
        {tagGroups.map((group) => (
          <section key={group.tag === null ? 'untagged' : `tag:${group.tag.toLowerCase()}`} aria-label={group.tag ?? undefined}>
            {group.tag !== null ? <h5 className="mb-1.5 px-1 text-xs font-bold text-nexoraBrandDark">{group.tag}</h5> : null}
            <div className={layout}>{group.items.map(renderItem)}</div>
          </section>
        ))}
      </div>
    )
  }

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
      sections.push({ category: { id: '', name: uncategorizedLabel, count: uncategorizedItems.length }, items: uncategorizedItems })
    }
    return sections
  }, [categories, searchedItems, selectedCategoryId, uncategorizedLabel])

  const itemsForCategory = (categoryId: string) => {
    return categoryId === UNCATEGORIZED_CHIP_ID
      ? searchedItems.filter((item) => item.categories.length === 0)
      : searchedItems.filter((item) => item.categories.some((category) => category.id === categoryId))
  }

  const flatItems = selectedCategoryId === '' ? searchedItems : itemsForCategory(selectedCategoryId)
  const isEmpty = selectedCategoryId === '' ? (groupedSections?.length ?? 0) === 0 : flatItems.length === 0

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search
          className={`pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 ${
            isGrid ? 'text-nexoraMuted' : 'text-nexoraMuted'
          }`}
        />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={searchPlaceholder}
          className={
            isGrid
              ? `${isCheckinServiceMode ? 'h-9 text-xs' : 'h-11 text-xs'} w-full rounded-lg border border-nexoraBorder bg-nexoraCanvas pl-8 pr-2.5 text-nexoraText outline-none focus:border-nexoraBrand`
              : 'h-8 w-full rounded-lg border border-nexoraBorder bg-white pl-8 pr-2.5 text-[11px] text-nexoraText outline-none focus:border-nexoraBrand'
          }
        />
      </div>

      {isCheckinServiceMode ? (
        categories.length === 0 ? (
          <p className="text-xs text-nexoraMuted">{emptyLabel}</p>
        ) : (
          <div className="space-y-1.5">
            {categories.map((category, index) => {
              const isOpen = selectedCategoryId === category.id
              const categoryItems = itemsForCategory(category.id)
              const headerId = `checkin-service-category-${index}`
              const panelId = `${headerId}-panel`

              return (
                <div
                  key={category.id}
                  className={`overflow-hidden rounded-xl border ${
                    isOpen ? 'border-nexoraBrand/40 bg-nexoraBrand/5' : 'border-nexoraBorder bg-nexoraSurface'
                  }`}
                >
                  <button
                    id={headerId}
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    onClick={() => setSelectedCategoryId((current) => (current === category.id ? '' : category.id))}
                    className="flex min-h-10 w-full items-center gap-2 px-3 py-2 text-left"
                  >
                    <span
                      className={`min-w-0 flex-1 truncate text-[11px] font-black uppercase tracking-wide ${
                        isOpen ? 'text-nexoraBrandDark' : 'text-nexoraText'
                      }`}
                    >
                      {category.name}
                    </span>
                    <span className="shrink-0 rounded-full bg-nexoraBrandSoft px-2 py-0.5 text-[10px] font-bold text-nexoraBrandDark">
                      {category.count}
                    </span>
                    <ChevronDown
                      className={`h-4 w-4 shrink-0 text-nexoraMuted transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    />
                  </button>

                  {isOpen ? (
                    <div
                      id={panelId}
                      role="region"
                      aria-labelledby={headerId}
                      className="border-t border-nexoraBorder/80 bg-nexoraSurface p-1.5"
                    >
                      {categoryItems.length === 0 ? (
                        <p className="px-2 py-1.5 text-xs text-nexoraMuted">{emptyLabel}</p>
                      ) : (
                        <div className="max-h-[320px] overflow-y-auto">
                          {renderServices(categoryItems, "grid grid-cols-2 gap-1.5 sm:grid-cols-4")}
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>
              )
            })}
          </div>
        )
      ) : (
        <>
          {categories.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setSelectedCategoryId('')}
                aria-pressed={selectedCategoryId === ''}
                className={
                  isGrid
                    ? `min-h-8 rounded-lg border px-2.5 py-1.5 text-[11px] font-bold transition-colors ${
                        selectedCategoryId === ''
                          ? 'border-nexoraBrand/50 bg-nexoraBrandSoft/50 text-nexoraBrand'
                          : 'border-nexoraBorder bg-nexoraSurface text-nexoraMuted hover:border-nexoraBrand/50 hover:text-nexoraText'
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
                  aria-pressed={selectedCategoryId === category.id}
                  className={
                    isGrid
                      ? `min-h-8 rounded-lg border px-2.5 py-1.5 text-[11px] font-bold transition-colors ${
                          selectedCategoryId === category.id
                            ? 'border-nexoraBrand/50 bg-nexoraBrandSoft/50 text-nexoraBrand'
                            : 'border-nexoraBorder bg-nexoraSurface text-nexoraMuted hover:border-nexoraBrand/50 hover:text-nexoraText'
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
          ) : null}

          {isEmpty ? (
            <p className={isGrid ? 'text-xs text-nexoraMuted' : 'text-[11px] text-nexoraMuted'}>{emptyLabel}</p>
          ) : selectedCategoryId === '' ? (
            isGrid ? (
              <div className={`max-h-[min(70dvh,744px)] space-y-4 overflow-y-auto overscroll-contain pr-1 [scrollbar-gutter:stable] ${scrollInParentOnTablet ? 'md:max-h-none md:overflow-visible' : ''}`}>
                {groupedSections!.map((section) => (
                  <div key={section.category.id}>
                    <h4 className="sticky top-0 z-[1] mb-2 rounded-md bg-nexoraCanvas px-3 py-2 text-[10px] font-black uppercase text-nexoraMuted">
                      {section.category.name}
                    </h4>
                    {renderServices(section.items, "grid grid-cols-1 gap-2 sm:grid-cols-2")}
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
                    {renderServices(section.items, "space-y-1")}
                  </div>
                ))}
              </div>
            )
          ) : isGrid ? (
            <div className={`max-h-[min(70dvh,744px)] overflow-y-auto overscroll-contain pr-1 [scrollbar-gutter:stable] ${scrollInParentOnTablet ? 'md:max-h-none md:overflow-visible' : ''}`}>
              <h4 className="sticky top-0 z-[1] mb-2 rounded-md bg-nexoraCanvas px-3 py-2 text-[10px] font-black uppercase text-nexoraMuted">
                {categories.find(category => category.id === selectedCategoryId)?.name}
              </h4>
              {renderServices(flatItems, "grid grid-cols-1 gap-2 sm:grid-cols-2")}
            </div>
          ) : (
            <div className="max-h-72 space-y-1 overflow-y-auto rounded-lg border border-nexoraBorder p-1.5 pr-3">
              {renderServices(flatItems, "space-y-1")}
            </div>
          )}
        </>
      )}

      {detailItem ? (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-nexoraText/70 p-4"
          onClick={() => setDetailItem(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-nexoraSurface"
          >
            <div className="flex shrink-0 items-center justify-between border-b border-nexoraBorder p-4">
              <h3 className="text-sm font-extrabold text-nexoraText">{detailItem.name}</h3>
              <IconButton label={closeDetailsLabel ?? ''} onClick={() => setDetailItem(null)}>
                <X className="h-4 w-4" />
              </IconButton>
            </div>
            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              {detailItem.photoUrl ? (
                <img src={detailItem.photoUrl} alt="" className="h-40 w-full rounded-xl object-cover" />
              ) : null}
              <div className="flex items-baseline gap-1.5">
                <span className="text-base font-bold text-nexoraText">${detailItem.price.toFixed(2)}</span>
                {detailItem.durationMinutes ? (
                  <span className="text-xs text-nexoraMuted">· {detailItem.durationMinutes} min</span>
                ) : null}
              </div>
              {detailItem.description ? <p className="whitespace-pre-wrap break-words text-sm text-nexoraText">{detailItem.description}</p> : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
