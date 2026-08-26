// PosCategoriesView — POS > Categories (US-016). Owner creates categories used
// to group Services/Products (e.g. "Manicures", "Retail") and drags to reorder
// them. Categories have no Active/Inactive state (BA doc) — hiding an item from
// customers happens on the Service/Product itself, not here.
//
// Sort/Filter (added post-integration): "Sort" is a view-only override of the
// persisted drag-and-drop order — it never calls the reorder API. Switching
// back to "Custom" restores the exact drag order. Both a non-Custom sort and
// an active search query disable drag-and-drop, since reordering a
// re-sorted/filtered subset wouldn't map cleanly back onto the canonical
// `items` order the reorder API expects.
import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react'
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Check, Edit2, GripVertical, Loader2, Plus, Search, Sparkles, Trash2, X } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { qk } from '../../../../data/queryKeys'
import { useTranslation } from '../../../../contexts/LanguageContext'
import { useNotification } from '../../../../contexts/NotificationContext'
import { getApiErrorCode } from '../../../../types/domain'
import { getErrorI18nKey } from '../../../../data/errorCodes'
import {
  useCreatePosCategory,
  useDeletePosCategory,
  usePosCategories,
  useReorderPosCategories,
  useUpdatePosCategory,
} from '../../../../data/hooks/usePosCategories'
import type { PosCategoryApiDto } from '../../../../types/repositories'
import { SkeletonList } from '../../../ui/skeleton'
import { seedPosCategoriesAndServices } from '../../../../data/seedPosDemoMenu'

type SortMode = 'custom' | 'name-asc' | 'name-desc'

export default function PosCategoriesView() {
  const { t } = useTranslation()
  const { showToast, showConfirm } = useNotification()
  const queryClient = useQueryClient()
  const { data: categories, isLoading } = usePosCategories()
  const createCategory = useCreatePosCategory()
  const reorderCategories = useReorderPosCategories()
  const deleteCategory = useDeletePosCategory()

  const [name, setName] = useState('')
  const [items, setItems] = useState<PosCategoryApiDto[]>([])
  const [isSeeding, setIsSeeding] = useState(false)
  const [sortMode, setSortMode] = useState<SortMode>('custom')
  const [searchQuery, setSearchQuery] = useState('')

  const handleSeed = async () => {
    setIsSeeding(true)
    try {
      const res = await seedPosCategoriesAndServices()
      await queryClient.invalidateQueries({ queryKey: qk.merchantPosCategories() })
      await queryClient.invalidateQueries({ queryKey: qk.merchantPosServices() })
      await queryClient.invalidateQueries({ queryKey: qk.merchantPosTags() })
      showToast(
        `✨ Đã nạp thành công ${res.createdCategories} danh mục và ${res.createdServices} dịch vụ mẫu!`,
        'success',
      )
    } catch (e) {
      showToast('Không thể nạp dữ liệu mẫu. Vui lòng thử lại!', 'error')
    } finally {
      setIsSeeding(false)
    }
  }

  useEffect(() => {
    setItems(categories ?? [])
  }, [categories])

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  const isReorderable = sortMode === 'custom' && searchQuery.trim() === ''

  const visibleItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    const filtered = query ? items.filter((c) => c.name.toLowerCase().includes(query)) : items
    if (sortMode === 'name-asc') return [...filtered].sort((a, b) => a.name.localeCompare(b.name))
    if (sortMode === 'name-desc') return [...filtered].sort((a, b) => b.name.localeCompare(a.name))
    return filtered
  }, [items, sortMode, searchQuery])

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    try {
      await createCategory.mutateAsync(trimmed)
      setName('')
      showToast(t('components.dashboard.views.pos.PosCategoriesView.createdSuccess'), 'success')
    } catch (err) {
      showToast(t(getErrorI18nKey(getApiErrorCode(err))), 'error')
    }
  }

  const handleDelete = async (category: PosCategoryApiDto) => {
    const confirmed = await showConfirm(
      t('components.dashboard.views.pos.PosCategoriesView.deleteConfirmBody', { name: category.name }),
      t('components.dashboard.views.pos.PosCategoriesView.deleteConfirmTitle'),
    )
    if (!confirmed) return
    try {
      await deleteCategory.mutateAsync(category.id)
      showToast(t('components.dashboard.views.pos.PosCategoriesView.deletedSuccess'), 'success')
    } catch (err) {
      showToast(t(getErrorI18nKey(getApiErrorCode(err))), 'error')
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = items.findIndex((c) => c.id === active.id)
    const newIndex = items.findIndex((c) => c.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return

    const reordered = arrayMove(items, oldIndex, newIndex)
    setItems(reordered)
    reorderCategories.mutate(
      reordered.map((c, index) => ({ categoryId: c.id, sortOrder: index })),
      {
        onError: () => {
          showToast(t('components.dashboard.views.pos.PosCategoriesView.reorderFailed'), 'error')
        },
      },
    )
  }

  const categoryIds = useMemo(() => visibleItems.map((c) => c.id), [visibleItems])

  return (
    <div className="space-y-6">
      <section className="flex items-start justify-between gap-3 px-0.5">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold leading-tight text-nexoraText">
            {t('dashboard.menu.pos_categories')}
          </h1>
          <p className="text-sm font-medium text-nexoraMuted">
            {t('components.dashboard.views.pos.PosCategoriesView.description')}
          </p>
        </div>
        <button
          type="button"
          onClick={handleSeed}
          disabled={isSeeding}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition disabled:opacity-50"
          title="Tự động nạp danh sách 8 Danh mục & 18 Dịch vụ mẫu cho Nail Salon"
        >
          {isSeeding ? <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-600" /> : <Sparkles className="h-3.5 w-3.5 text-indigo-600" />}
          <span>{isSeeding ? 'Đang nạp...' : 'Nạp dữ liệu mẫu'}</span>
        </button>
      </section>

      <form onSubmit={handleCreate} className="flex items-center gap-2">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={100}
          placeholder={t('components.dashboard.views.pos.PosCategoriesView.namePlaceholder')}
          className="h-10 flex-1 rounded-lg border border-nexoraBorder bg-white px-3.5 text-xs text-nexoraText outline-none focus:border-nexoraBrand"
        />
        <button
          type="submit"
          disabled={createCategory.isPending || !name.trim()}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-nexoraBrand px-3.5 py-2 text-xs font-bold text-white hover:bg-nexoraBrandDark disabled:opacity-60"
        >
          {createCategory.isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Plus className="h-3.5 w-3.5" />
          )}
          {t('components.dashboard.views.pos.PosCategoriesView.addCategory')}
        </button>
      </form>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('components.dashboard.views.pos.PosCategoriesView.searchPlaceholder')}
            className="h-9 w-full rounded-lg border border-nexoraBorder bg-white pl-8 pr-3 text-xs text-nexoraText outline-none focus:border-nexoraBrand"
          />
        </div>
        <label className="flex items-center gap-2 text-xs text-nexoraMuted">
          <span className="font-semibold">
            {t('components.dashboard.views.pos.PosCategoriesView.sortLabel')}
          </span>
          <select
            value={sortMode}
            onChange={(e) => setSortMode(e.target.value as SortMode)}
            className="h-9 rounded-lg border border-nexoraBorder bg-white px-2 text-xs text-nexoraText outline-none focus:border-nexoraBrand"
          >
            <option value="custom">
              {t('components.dashboard.views.pos.PosCategoriesView.sortCustom')}
            </option>
            <option value="name-asc">
              {t('components.dashboard.views.pos.PosCategoriesView.sortNameAsc')}
            </option>
            <option value="name-desc">
              {t('components.dashboard.views.pos.PosCategoriesView.sortNameDesc')}
            </option>
          </select>
        </label>
      </div>

      {!isReorderable && items.length > 0 && (
        <p className="px-0.5 text-[11px] italic text-nexoraMuted">
          {t('components.dashboard.views.pos.PosCategoriesView.dragDisabledHint')}
        </p>
      )}

      {isLoading ? (
        <div className="nexora-card p-6">
          <SkeletonList count={4} lines={1} />
        </div>
      ) : items.length === 0 ? (
        <div className="nexora-card p-6 text-xs text-nexoraMuted">
          {t('components.dashboard.views.pos.PosCategoriesView.noCategories')}
        </div>
      ) : visibleItems.length === 0 ? (
        <div className="nexora-card p-6 text-xs text-nexoraMuted">
          {t('components.dashboard.views.pos.PosCategoriesView.noResults')}
        </div>
      ) : isReorderable ? (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={categoryIds} strategy={verticalListSortingStrategy}>
            <ul className="space-y-2">
              {visibleItems.map((category) => (
                <SortableCategoryRow
                  key={category.id}
                  category={category}
                  onDelete={() => handleDelete(category)}
                  isDeleting={deleteCategory.isPending}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      ) : (
        <ul className="space-y-2">
          {visibleItems.map((category) => (
            <StaticCategoryRow
              key={category.id}
              category={category}
              onDelete={() => handleDelete(category)}
              isDeleting={deleteCategory.isPending}
            />
          ))}
        </ul>
      )}
    </div>
  )
}

function useCategoryRowEditing(category: PosCategoryApiDto) {
  const { t } = useTranslation()
  const { showToast } = useNotification()
  const updateCategory = useUpdatePosCategory()

  const [isEditing, setIsEditing] = useState(false)
  const [draftName, setDraftName] = useState(category.name)

  const startEdit = () => {
    setDraftName(category.name)
    setIsEditing(true)
  }

  const handleSave = async () => {
    const trimmed = draftName.trim()
    if (!trimmed || trimmed === category.name) {
      setIsEditing(false)
      return
    }
    try {
      await updateCategory.mutateAsync({ categoryId: category.id, name: trimmed })
      showToast(t('components.dashboard.views.pos.PosCategoriesView.updatedSuccess'), 'success')
      setIsEditing(false)
    } catch (err) {
      showToast(t(getErrorI18nKey(getApiErrorCode(err))), 'error')
    }
  }

  return { isEditing, setIsEditing, draftName, setDraftName, startEdit, handleSave, updateCategory }
}

function CategoryRowShell({
  containerRef,
  style,
  className,
  children,
}: {
  containerRef?: (el: HTMLLIElement | null) => void
  style?: React.CSSProperties
  className: string
  children: ReactNode
}) {
  return (
    <li ref={containerRef} style={style} className={className}>
      {children}
    </li>
  )
}

function CategoryRowBody({
  category,
  onDelete,
  isDeleting,
  gripProps,
}: {
  category: PosCategoryApiDto
  onDelete: () => void
  isDeleting: boolean
  gripProps: { disabled: boolean; attributes?: object; listeners?: object }
}) {
  const { t } = useTranslation()
  const { isEditing, setIsEditing, draftName, setDraftName, startEdit, handleSave, updateCategory } =
    useCategoryRowEditing(category)

  return (
    <>
      <button
        type="button"
        aria-label={t('components.dashboard.views.pos.PosCategoriesView.dragHandle')}
        disabled={isEditing || gripProps.disabled}
        className="cursor-grab touch-none p-1 text-slate-300 hover:text-slate-500 active:cursor-grabbing disabled:cursor-not-allowed disabled:opacity-40"
        {...(gripProps.attributes ?? {})}
        {...(isEditing || gripProps.disabled ? {} : gripProps.listeners ?? {})}
      >
        <GripVertical className="h-4 w-4" />
      </button>

      {isEditing ? (
        <input
          type="text"
          autoFocus
          value={draftName}
          onChange={(e) => setDraftName(e.target.value)}
          maxLength={100}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSave()
            if (e.key === 'Escape') setIsEditing(false)
          }}
          className="h-8 flex-1 rounded border border-nexoraBorder bg-nexoraCanvas px-2 text-xs text-nexoraText outline-none focus:border-nexoraBrand focus:bg-white"
        />
      ) : (
        <span className="flex-1 text-xs font-semibold text-nexoraText">{category.name}</span>
      )}

      {isEditing ? (
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setIsEditing(false)}
            aria-label={t('components.dashboard.views.pos.PosCategoriesView.cancel')}
            className="p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 rounded"
          >
            <X className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={updateCategory.isPending || !draftName.trim()}
            aria-label={t('components.dashboard.views.pos.PosCategoriesView.save')}
            className="p-1.5 text-slate-400 transition hover:bg-emerald-50 hover:text-emerald-600 rounded disabled:opacity-60"
          >
            {updateCategory.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Check className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={startEdit}
            aria-label={t('components.dashboard.views.pos.PosCategoriesView.editCategory')}
            className="p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-nexoraBrand rounded"
          >
            <Edit2 className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            disabled={isDeleting}
            aria-label="Delete category"
            className="p-1.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 rounded disabled:opacity-60"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </>
  )
}

function SortableCategoryRow({
  category,
  onDelete,
  isDeleting,
}: {
  category: PosCategoryApiDto
  onDelete: () => void
  isDeleting: boolean
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: category.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <CategoryRowShell
      containerRef={setNodeRef}
      style={style}
      className={`flex items-center gap-2 rounded-xl border border-nexoraBorder bg-white px-3 py-2.5 shadow-sm ${
        isDragging ? 'opacity-60' : ''
      }`}
    >
      <CategoryRowBody
        category={category}
        onDelete={onDelete}
        isDeleting={isDeleting}
        gripProps={{ disabled: false, attributes, listeners }}
      />
    </CategoryRowShell>
  )
}

function StaticCategoryRow({
  category,
  onDelete,
  isDeleting,
}: {
  category: PosCategoryApiDto
  onDelete: () => void
  isDeleting: boolean
}) {
  return (
    <CategoryRowShell className="flex items-center gap-2 rounded-xl border border-nexoraBorder bg-white px-3 py-2.5 shadow-sm">
      <CategoryRowBody
        category={category}
        onDelete={onDelete}
        isDeleting={isDeleting}
        gripProps={{ disabled: true }}
      />
    </CategoryRowShell>
  )
}
