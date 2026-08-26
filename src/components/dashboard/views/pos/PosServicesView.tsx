import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import {
  DndContext,
  PointerSensor,
  TouchSensor,
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
import {
  Check,
  CornerDownRight,
  Crown,
  Edit2,
  ExternalLink,
  Eye,
  GripVertical,
  Layers,
  MoreVertical,
  Plus,
  Scissors,
  Search,
  Settings2,
  Sparkles,
  Star,
  Trash2,
  X,
} from 'lucide-react'
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
import { usePosTags } from '../../../../data/hooks/usePosTags'
import {
  useCreatePosService,
  useDeletePosService,
  usePosServices,
  useReorderPosServices,
  useUpdatePosService,
} from '../../../../data/hooks/usePosServices'
import type { PosServiceInput } from '../../../../data/repositories/posServices'
import type { PosCategoryApiDto, PosServiceApiDto } from '../../../../types/repositories'
import { SkeletonList } from '../../../ui/skeleton'
import CreateEditPosServiceModal, {
  extractMemberPriceFromService,
} from './modals/CreateEditPosServiceModal'
import CategoryManageSheet from './modals/CategoryManageSheet'


export function parseLinkedAddons(
  service: PosServiceApiDto,
  allServices: PosServiceApiDto[] = []
): Array<{ id: string; name: string; price: number }> {
  if (!service.description) return []
  const match = service.description.match(/\[ADDONS:(.*?)\]/i)
  if (!match || !match[1]) return []

  const rawEntries = match[1].split(',').map((s) => s.trim()).filter(Boolean)
  return rawEntries.map((entry) => {
    if (entry.includes('|')) {
      const parts = entry.split('|')
      return { id: parts[0], name: parts[1] || parts[0], price: Number(parts[2]) || 0 }
    }
    const matched = allServices.find((s) => s.id === entry || s.name.toLowerCase() === entry.toLowerCase())
    if (matched) return { id: matched.id, name: matched.name, price: matched.price }
    const defaultAddonMap: Record<string, { name: string; price: number }> = {
      'addon-1': { name: 'Callus Removal', price: 10 },
      'addon-2': { name: 'Sugar Scrub Exfoliation', price: 8 },
      'addon-3': { name: 'Smooth Feet Combo', price: 15 },
      'addon-4': { name: 'Refill (2 weeks)', price: 0 },
      'addon-5': { name: 'Hot Stone Foot Massage (15m)', price: 18 },
      'addon-6': { name: 'Paraffin Wax Treatment', price: 15 },
    }
    if (defaultAddonMap[entry]) {
      return { id: entry, name: defaultAddonMap[entry].name, price: defaultAddonMap[entry].price }
    }
    return { id: entry, name: entry, price: 0 }
  })
}

function toServiceInput(service: PosServiceApiDto): PosServiceInput {
  return {
    name: service.name,
    price: service.price,
    durationMinutes: service.durationMinutes,
    description: service.description ?? undefined,
    categoryIds: service.categoryIds,
    tags: service.tags,
    status: service.status,
  }
}

export default function PosServicesView() {
  const { t } = useTranslation()
  const { showToast, showConfirm } = useNotification()
  const queryClient = useQueryClient()

  // Data queries & mutations
  const { data: categories, isLoading: isCategoriesLoading } = usePosCategories()
  const { data: services, isLoading: isServicesLoading } = usePosServices()
  const { data: tags } = usePosTags()

  const createCategory = useCreatePosCategory()
  const updateCategory = useUpdatePosCategory()
  const deleteCategory = useDeletePosCategory()
  const reorderCategories = useReorderPosCategories()

  const createService = useCreatePosService()
  const updateService = useUpdatePosService()
  const deleteService = useDeletePosService()
  const reorderServices = useReorderPosServices()

  // Local state
  const [categoryItems, setCategoryItems] = useState<PosCategoryApiDto[]>([])
  const [serviceItems, setServiceItems] = useState<PosServiceApiDto[]>([])
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  // Category management modals/inputs
  const [isAddingCategory, setIsAddingCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null)
  const [editingCategoryName, setEditingCategoryName] = useState('')
  const [isCategorySheetOpen, setIsCategorySheetOpen] = useState(false)

  // Service modal state
  const [isCustomerPreviewOpen, setIsCustomerPreviewOpen] = useState(false)
  const [modalState, setModalState] = useState<{ open: boolean; service: PosServiceApiDto | null }>({
    open: false,
    service: null,
  })

  // Sync categories
  useEffect(() => {
    const list = categories ?? []
    setCategoryItems(list)
    if (list.length > 0 && selectedCategoryId === null) {
      setSelectedCategoryId(list[0].id)
    }
  }, [categories, selectedCategoryId])

  // Sync services
  useEffect(() => {
    setServiceItems(services ?? [])
  }, [services])

  // Touch-optimized sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
  )

  // Service count per category map
  const serviceCountMap = useMemo(() => {
    const map = new Map<string, number>()
    serviceItems.forEach((s) => {
      s.categoryIds.forEach((catId) => {
        map.set(catId, (map.get(catId) || 0) + 1)
      })
    })
    return map
  }, [serviceItems])

  // Filtered Services for Right Column
  const visibleServices = useMemo(() => {
    let list = serviceItems
    if (selectedCategoryId) {
      list = list.filter((s) => s.categoryIds.includes(selectedCategoryId))
    }
    const query = searchQuery.trim().toLowerCase()
    if (query) {
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(query) ||
          (s.description && s.description.toLowerCase().includes(query)) ||
          s.tags.some((tg) => tg.toLowerCase().includes(query)),
      )
    }
    return list
  }, [serviceItems, selectedCategoryId, searchQuery])

  // Handle Category Drag End
  const handleCategoryDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = categoryItems.findIndex((c) => c.id === active.id)
    const newIndex = categoryItems.findIndex((c) => c.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return

    const reordered = arrayMove(categoryItems, oldIndex, newIndex)
    setCategoryItems(reordered)
    reorderCategories.mutate(
      reordered.map((c, index) => ({ categoryId: c.id, sortOrder: index })),
      {
        onError: () => {
          showToast(t('components.dashboard.views.pos.PosCategoriesView.reorderFailed'), 'error')
        },
      },
    )
  }

  // Handle Category Creation
  const handleCreateCategory = async (e: FormEvent) => {
    e.preventDefault()
    const trimmed = newCategoryName.trim()
    if (!trimmed) return
    try {
      const newId = await createCategory.mutateAsync(trimmed)
      setNewCategoryName('')
      setIsAddingCategory(false)
      if (newId) setSelectedCategoryId(newId)
      showToast('Đã thêm danh mục mới thành công!', 'success')
    } catch (err) {
      showToast(t(getErrorI18nKey(getApiErrorCode(err))), 'error')
    }
  }

  // Handle Category Rename
  const handleUpdateCategory = async (categoryId: string) => {
    const trimmed = editingCategoryName.trim()
    if (!trimmed) return
    try {
      await updateCategory.mutateAsync({ categoryId, name: trimmed })
      setEditingCategoryId(null)
      showToast('Đã cập nhật tên danh mục!', 'success')
    } catch (err) {
      showToast(t(getErrorI18nKey(getApiErrorCode(err))), 'error')
    }
  }

  // Handle Category Deletion
  const handleDeleteCategory = async (category: PosCategoryApiDto, e: React.MouseEvent) => {
    e.stopPropagation()
    const confirmed = await showConfirm(
      `Bạn có chắc chắn muốn xóa danh mục "${category.name}" không? Các dịch vụ thuộc danh mục này sẽ không bị xóa.`,
      'Xác nhận xóa danh mục',
    )
    if (!confirmed) return
    try {
      await deleteCategory.mutateAsync(category.id)
      if (selectedCategoryId === category.id) {
        const remaining = categoryItems.filter((c) => c.id !== category.id)
        setSelectedCategoryId(remaining[0]?.id || null)
      }
      showToast('Đã xóa danh mục thành công!', 'success')
    } catch (err) {
      showToast(t(getErrorI18nKey(getApiErrorCode(err))), 'error')
    }
  }

  // Handle Service Drag End
  const handleServiceDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = serviceItems.findIndex((s) => s.id === active.id)
    const newIndex = serviceItems.findIndex((s) => s.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return

    const reordered = arrayMove(serviceItems, oldIndex, newIndex)
    setServiceItems(reordered)
    reorderServices.mutate(
      reordered.map((s, index) => ({ serviceId: s.id, sortOrder: index })),
      {
        onError: () => {
          showToast(t('components.dashboard.views.pos.PosServicesView.reorderFailed'), 'error')
        },
      },
    )
  }

  // Handle Service Toggle Status
  const handleToggleServiceStatus = async (service: PosServiceApiDto) => {
    try {
      await updateService.mutateAsync({
        serviceId: service.id,
        input: { ...toServiceInput(service), status: service.status === 'Active' ? 'Inactive' : 'Active' },
      })
      showToast('Đã cập nhật trạng thái dịch vụ!', 'success')
    } catch (err) {
      showToast(t(getErrorI18nKey(getApiErrorCode(err))), 'error')
    }
  }

  // Handle Service Delete
  const handleDeleteService = async (service: PosServiceApiDto) => {
    const confirmed = await showConfirm(
      `Bạn có chắc chắn muốn xóa dịch vụ "${service.name}" không?`,
      'Xác nhận xóa dịch vụ',
    )
    if (!confirmed) return
    try {
      await deleteService.mutateAsync(service.id)
      showToast('Đã xóa dịch vụ thành công!', 'success')
    } catch (err) {
      showToast(t(getErrorI18nKey(getApiErrorCode(err))), 'error')
    }
  }

  // Handle Service Create/Update Submission
  const handleCreateOrUpdateService = async (input: PosServiceInput) => {
    try {
      if (modalState.service) {
        await updateService.mutateAsync({ serviceId: modalState.service.id, input })
        setServiceItems((prev) =>
          prev.map((item) =>
            item.id === modalState.service!.id
              ? {
                  ...item,
                  name: input.name,
                  price: input.price,
                  durationMinutes: input.durationMinutes,
                  description: input.description ?? null,
                  categoryIds: input.categoryIds,
                  tags: input.tags,
                  status: input.status,
                }
              : item,
          ),
        )
        showToast(t('components.dashboard.views.pos.PosServicesView.updatedSuccess'), 'success')
      } else {
        const finalInput = {
          ...input,
          categoryIds:
            input.categoryIds.length > 0
              ? input.categoryIds
              : selectedCategoryId
                ? [selectedCategoryId]
                : [],
        }
        await createService.mutateAsync(finalInput)
        showToast(t('components.dashboard.views.pos.PosServicesView.createdSuccess'), 'success')
      }
      setModalState({ open: false, service: null })
    } catch (err) {
      showToast(t(getErrorI18nKey(getApiErrorCode(err))), 'error')
    }
  }

  const categoryIds = useMemo(() => categoryItems.map((c) => c.id), [categoryItems])
  const serviceIds = useMemo(() => visibleServices.map((s) => s.id), [visibleServices])

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="border-b border-nexoraBorder pb-3.5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-nexoraBrandSoft text-nexoraBrand border border-nexoraBrand/20 shadow-sm shrink-0">
            <Scissors className="h-5 w-5 rotate-90" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-nexoraText">Services</h1>
            <p className="text-xs text-nexoraMuted font-medium">
              Quản lý danh mục, bảng giá dịch vụ và các món Add-on phục vụ tại quầy POS
            </p>
          </div>
        </div>
      </div>

      {/* Main Unified View */}
      <div className="space-y-4">
        {/* 📱 TABLET & MOBILE VIEW (< xl: 1200px): Horizontal Scrollable Category Bar */}
        <div className="block xl:hidden space-y-2.5">
          <div className="flex items-center justify-between px-0.5">
            <span className="text-xs font-bold uppercase tracking-wider text-nexoraMuted">Danh mục (Categories)</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsCategorySheetOpen(true)}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-nexoraBrand hover:underline min-h-[32px] px-1"
              >
                <Settings2 className="h-3.5 w-3.5" />
                <span>Quản lý danh mục</span>
              </button>
              <button
                type="button"
                onClick={() => setIsAddingCategory(!isAddingCategory)}
                className="inline-flex items-center gap-1 rounded-lg border border-nexoraBorder bg-white px-2.5 py-1 text-[11px] font-bold text-nexoraBrand hover:bg-nexoraBrandSoft/40 min-h-[32px]"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Thêm</span>
              </button>
            </div>
          </div>

          {/* Quick Add Form on Tablet Portrait */}
          {isAddingCategory && (
            <form
              onSubmit={handleCreateCategory}
              className="flex items-center gap-2 rounded-xl border border-nexoraBrand/30 bg-nexoraBrandSoft/20 p-2 animate-fadeIn"
            >
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Tên danh mục mới..."
                className="flex-1 rounded-lg border border-nexoraBorder bg-white px-3 py-1.5 text-xs font-medium text-nexoraText outline-none focus:border-nexoraBrand"
                autoFocus
              />
              <button
                type="submit"
                disabled={createCategory.isPending || !newCategoryName.trim()}
                className="rounded-lg bg-nexoraBrand px-3 py-1.5 text-xs font-bold text-white hover:bg-nexoraBrandDark disabled:opacity-50 min-h-[36px]"
              >
                Lưu
              </button>
              <button
                type="button"
                onClick={() => setIsAddingCategory(false)}
                className="rounded-lg px-2.5 py-1.5 text-xs font-bold text-nexoraMuted hover:bg-nexoraSurfaceMuted min-h-[36px]"
              >
                Hủy
              </button>
            </form>
          )}

          {/* Horizontal Scrollable Category Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1.5 pt-0.5 scrollbar-none snap-x">
            {/* All Categories Pill */}
            <button
              type="button"
              onClick={() => setSelectedCategoryId(null)}
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition min-h-[40px] snap-start ${
                selectedCategoryId === null
                  ? 'bg-nexoraBrand text-white shadow-md shadow-nexoraBrand/25'
                  : 'bg-white border border-nexoraBorder text-nexoraText hover:border-nexoraBrand/40 hover:bg-nexoraSurfaceMuted/60'
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              <span>Tất cả</span>
              <span className={`ml-0.5 rounded-full px-1.5 py-0.2 text-[10px] font-extrabold ${
                selectedCategoryId === null ? 'bg-white/20 text-white' : 'bg-nexoraSurfaceMuted text-nexoraMuted'
              }`}>
                {serviceItems.length}
              </span>
            </button>

            {categoryItems.map((cat) => {
              const isSelected = selectedCategoryId === cat.id
              const count = serviceCountMap.get(cat.id) || 0

              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategoryId(cat.id)}
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition min-h-[40px] snap-start ${
                    isSelected
                      ? 'bg-nexoraBrand text-white shadow-md shadow-nexoraBrand/25'
                      : 'bg-white border border-nexoraBorder text-nexoraText hover:border-nexoraBrand/40 hover:bg-nexoraSurfaceMuted/60'
                  }`}
                >
                  <span>{cat.name}</span>
                  <span className={`ml-0.5 rounded-full px-1.5 py-0.2 text-[10px] font-extrabold ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-nexoraSurfaceMuted text-nexoraMuted'
                  }`}>
                    {count}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* 💻 DESKTOP LAYOUT (>= xl: 1200px) */}
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
          {/* Left Column: Categories List (3 cols on xl) — visible on desktop */}
          <div className="hidden xl:block xl:col-span-3 space-y-3">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-base font-bold text-nexoraText">Categories</h2>
              <button
                type="button"
                onClick={() => setIsAddingCategory(!isAddingCategory)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-nexoraBorder bg-white px-2.5 py-1 text-xs font-bold text-nexoraBrand hover:bg-nexoraBrandSoft/40 transition shadow-sm min-h-[36px]"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add New</span>
              </button>
            </div>

            {/* Quick Add Category Form */}
            {isAddingCategory && (
              <form
                onSubmit={handleCreateCategory}
                className="rounded-xl border border-nexoraBrand/30 bg-nexoraBrandSoft/20 p-3 space-y-2 animate-fadeIn"
              >
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="Tên danh mục mới (vd: Dipping Powder)..."
                  className="w-full rounded-lg border border-nexoraBorder bg-white px-3 py-1.5 text-xs font-medium text-nexoraText outline-none focus:border-nexoraBrand"
                  autoFocus
                />
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingCategory(false)
                      setNewCategoryName('')
                    }}
                    className="rounded-lg px-2.5 py-1 text-[11px] font-bold text-nexoraMuted hover:bg-nexoraSurfaceMuted min-h-[32px]"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={createCategory.isPending || !newCategoryName.trim()}
                    className="rounded-lg bg-nexoraBrand px-3 py-1 text-[11px] font-bold text-white hover:bg-nexoraBrandDark disabled:opacity-50 min-h-[32px]"
                  >
                    {createCategory.isPending ? 'Đang lưu...' : 'Lưu'}
                  </button>
                </div>
              </form>
            )}

            {/* Categories Sortable List */}
            {isCategoriesLoading ? (
              <div className="space-y-2">
                <SkeletonList count={5} lines={1} />
              </div>
            ) : categoryItems.length === 0 ? (
              <div className="rounded-xl border border-nexoraBorder bg-white p-6 text-center text-xs text-nexoraSubtle">
                Chưa có danh mục nào.
              </div>
            ) : (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleCategoryDragEnd}>
                <SortableContext items={categoryIds} strategy={verticalListSortingStrategy}>
                  <div className="space-y-1.5 max-h-[70vh] overflow-y-auto pr-1">
                    {categoryItems.map((cat) => {
                      const isSelected = selectedCategoryId === cat.id
                      const isEditing = editingCategoryId === cat.id

                      return (
                        <SortableCategoryItem
                          key={cat.id}
                          category={cat}
                          isSelected={isSelected}
                          isEditing={isEditing}
                          editingName={editingCategoryName}
                          onSelect={() => setSelectedCategoryId(cat.id)}
                          onStartEdit={(e) => {
                            e.stopPropagation()
                            setEditingCategoryId(cat.id)
                            setEditingCategoryName(cat.name)
                          }}
                          onCancelEdit={() => setEditingCategoryId(null)}
                          onSaveEdit={() => handleUpdateCategory(cat.id)}
                          onEditingNameChange={setEditingCategoryName}
                          onDelete={(e) => handleDeleteCategory(cat, e)}
                        />
                      )
                    })}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </div>

          {/* Right Column / Main Table View (9 cols on xl, full width on < xl) */}
          <div className="col-span-1 xl:col-span-9 space-y-3.5">
            {/* Search Bar & Action Toolbar (Responsive Inline) */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
              <div className="relative flex-1 min-w-[180px]">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-nexoraSubtle" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search services..."
                  className="h-10 w-full rounded-xl border border-nexoraBorder bg-white pl-10 pr-10 text-xs font-medium text-nexoraText placeholder-nexoraSubtle shadow-sm outline-none transition focus:border-nexoraBrand focus:ring-2 focus:ring-nexoraBrand/10"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-nexoraSubtle hover:text-nexoraText p-1"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    window.open('/preview/menu', '_blank');
                  }}
                  className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl border border-nexoraBrand/40 bg-nexoraBrandSoft/50 px-3 py-2 text-xs font-bold text-nexoraBrand hover:bg-nexoraBrandSoft shadow-2xs transition min-h-[40px]"
                  title="Xem trước giao diện đặt lịch khách hàng & thanh Upsell Add-on bằng React Engine thực tế"
                >
                  <Eye className="h-4 w-4 shrink-0" />
                  <span className="hidden sm:inline">Live Upsell Preview</span>
                  <span className="inline sm:hidden">Live Preview</span>
                  <ExternalLink className="h-3 w-3 opacity-60 ml-0.5 shrink-0" />
                </button>

                <button
                  type="button"
                  onClick={() => setModalState({ open: true, service: null })}
                  className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-nexoraBrand px-3.5 py-2 text-xs font-bold text-white shadow-md hover:bg-nexoraBrandDark transition active:scale-95 min-h-[40px]"
                >
                  <Plus className="h-4 w-4 shrink-0" />
                  <span className="hidden sm:inline">Add New Service</span>
                  <span className="inline sm:hidden">Add Service</span>
                </button>
              </div>
            </div>

            {/* Table Card with Sticky Header */}
            <div className="rounded-2xl border border-nexoraBorder bg-white shadow-sm overflow-hidden">
              <div className="overflow-x-auto max-h-[72vh] overflow-y-auto">
                <table className="w-full text-left text-xs">
                  {/* Table Header (Sticky on Scroll) */}
                  <thead className="sticky top-0 z-10 border-b border-nexoraBorder bg-nexoraSurfaceMuted text-[11px] font-bold uppercase tracking-wider text-nexoraMuted shadow-xs">
                    <tr>
                      <th className="py-3.5 pl-4 pr-2 font-bold min-w-[200px]">SERVICE NAME</th>
                      <th className="px-3 py-3.5 font-bold min-w-[85px] whitespace-nowrap">REG. PRICE</th>
                      <th className="px-3 py-3.5 font-bold text-nexoraBrand min-w-[125px] whitespace-nowrap">
                        <span className="inline-flex items-center gap-1">
                          <Crown className="h-3 w-3 text-amber-500 shrink-0" />
                          <span>MEMBER PRICE</span>
                        </span>
                      </th>
                      <th className="px-3 py-3.5 font-bold min-w-[95px] whitespace-nowrap">STATUS</th>
                      <th className="py-3.5 pl-2 pr-4 font-bold text-right min-w-[75px] whitespace-nowrap">ACTIONS</th>
                    </tr>
                  </thead>

                  {/* Table Body */}
                  <tbody className="divide-y divide-nexoraRule">
                    {isServicesLoading ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center">
                          <SkeletonList count={4} lines={1} />
                        </td>
                      </tr>
                    ) : visibleServices.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-10 text-center text-nexoraSubtle">
                          <p className="text-sm font-semibold text-nexoraMuted">Chưa có dịch vụ nào trong danh mục này.</p>
                          <p className="text-xs text-nexoraSubtle mt-1">
                            Bấm nút <strong>+ Add New Service</strong> để thêm dịch vụ mới.
                          </p>
                        </td>
                      </tr>
                    ) : (
                      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleServiceDragEnd}>
                        <SortableContext items={serviceIds} strategy={verticalListSortingStrategy}>
                          {visibleServices.map((service) => (
                            <SortableServiceRowItem
                              key={service.id}
                              service={service}
                              allServices={serviceItems}
                              onEdit={() => setModalState({ open: true, service })}
                              onDelete={() => handleDeleteService(service)}
                              onToggleStatus={() => handleToggleServiceStatus(service)}
                            />
                          ))}
                        </SortableContext>
                      </DndContext>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add / Edit Service Modal */}
      <CustomerUpsellPreviewModal
        open={isCustomerPreviewOpen}
        onClose={() => setIsCustomerPreviewOpen(false)}
        services={serviceItems}
        categories={categoryItems}
      />

      <CreateEditPosServiceModal
        open={modalState.open}
        onClose={() => setModalState({ open: false, service: null })}
        onSubmit={handleCreateOrUpdateService}
        isSubmitting={createService.isPending || updateService.isPending}
        categories={categoryItems}
        tagSuggestions={tags ?? []}
        service={modalState.service}
        allServices={serviceItems}
      />

      {/* Tablet Category Management Sheet */}
      <CategoryManageSheet
        open={isCategorySheetOpen}
        onClose={() => setIsCategorySheetOpen(false)}
        categories={categoryItems}
      />
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Subcomponents: Category Row
// ─────────────────────────────────────────────────────────────────────────────
function SortableCategoryItem({
  category,
  isSelected,
  isEditing,
  editingName,
  onSelect,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onEditingNameChange,
  onDelete,
}: {
  category: PosCategoryApiDto
  isSelected: boolean
  isEditing: boolean
  editingName: string
  onSelect: () => void
  onStartEdit: (e: React.MouseEvent) => void
  onCancelEdit: () => void
  onSaveEdit: () => void
  onEditingNameChange: (val: string) => void
  onDelete: (e: React.MouseEvent) => void
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: category.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  useEffect(() => {
    if (!isMenuOpen) return
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isMenuOpen])

  if (isEditing) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="flex items-center gap-1.5 rounded-xl border border-nexoraBrand bg-white p-2 shadow-sm"
      >
        <input
          type="text"
          value={editingName}
          onChange={(e) => onEditingNameChange(e.target.value)}
          className="flex-1 rounded-lg border border-nexoraBorder px-2.5 py-1.5 text-xs font-bold text-nexoraText outline-none focus:border-nexoraBrand"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === 'Enter') onSaveEdit()
            if (e.key === 'Escape') onCancelEdit()
          }}
        />
        <button
          type="button"
          onClick={onSaveEdit}
          className="rounded p-1.5 text-nexoraSuccess hover:bg-emerald-50 min-h-[36px] min-w-[36px] flex items-center justify-center"
          title="Lưu"
        >
          <Check className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={onCancelEdit}
          className="rounded p-1.5 text-nexoraSubtle hover:bg-nexoraSurfaceMuted min-h-[36px] min-w-[36px] flex items-center justify-center"
          title="Hủy"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    )
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={onSelect}
      className={`group relative flex items-center justify-between rounded-xl px-3 py-2.5 text-xs transition cursor-pointer select-none min-h-[44px] ${
        isDragging ? 'opacity-40 shadow-lg' : ''
      } ${
        isSelected
          ? 'bg-nexoraBrand text-white font-bold shadow-md shadow-nexoraBrand/25'
          : 'bg-white border border-nexoraBorder text-nexoraText font-semibold hover:border-nexoraBrand/40 hover:bg-nexoraSurfaceMuted/60'
      }`}
    >
      <div className="flex items-center gap-2 min-w-0 flex-1 pr-1">
        <button
          type="button"
          {...attributes}
          {...listeners}
          className={`cursor-grab active:cursor-grabbing p-1 rounded-md touch-none shrink-0 flex items-center justify-center ${
            isSelected ? 'text-white/80 hover:text-white' : 'text-nexoraSubtle hover:text-nexoraText'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <span className="text-xs font-semibold leading-snug break-words flex-1 py-0.5">
          {category.name}
        </span>
      </div>

      {/* Action Menu (...) */}
      <div className="relative shrink-0" ref={menuRef}>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            setIsMenuOpen(!isMenuOpen)
          }}
          className={`p-1.5 rounded-lg transition flex items-center justify-center ${
            isSelected
              ? 'text-white hover:bg-white/20'
              : 'text-nexoraSubtle hover:bg-nexoraSurfaceMuted hover:text-nexoraText'
          } ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
          title="Tùy chọn danh mục"
        >
          <MoreVertical className="h-4 w-4" />
        </button>

        {isMenuOpen && (
          <div
            className="absolute right-0 top-full mt-1 z-30 w-36 rounded-xl border border-nexoraBorder bg-white py-1 shadow-lg animate-fadeIn text-xs"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={(e) => {
                setIsMenuOpen(false)
                onStartEdit(e)
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left font-medium text-nexoraText hover:bg-nexoraSurfaceMuted transition"
            >
              <Edit2 className="h-3.5 w-3.5 text-nexoraSubtle" />
              <span>Sửa tên</span>
            </button>
            <button
              type="button"
              onClick={(e) => {
                setIsMenuOpen(false)
                onDelete(e)
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left font-medium text-nexoraDanger hover:bg-rose-50 transition"
            >
              <Trash2 className="h-3.5 w-3.5 text-nexoraDanger" />
              <span>Xóa danh mục</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Subcomponents: Service Row Item
// ─────────────────────────────────────────────────────────────────────────────
function SortableServiceRowItem({
  service,
  allServices = [],
  onEdit,
  onDelete,
  onToggleStatus,
}: {
  service: PosServiceApiDto
  allServices?: PosServiceApiDto[]
  onEdit: () => void
  onDelete: () => void
  onToggleStatus: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: service.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const isAddon = service.tags.some((t) => t.toLowerCase().includes('add-on') || t.toLowerCase().includes('addon'))
  const isOwnerRecommended = service.tags.some((t) => t.toLowerCase() === 'owner recommended')
  const linkedAddons = parseLinkedAddons(service, allServices)
  const isActive = service.status === 'Active'

  // Extract member price
  const rawMemberPrice = extractMemberPriceFromService(service)
  const memberPriceNum = Number(rawMemberPrice)
  const hasMemberPrice = Number.isFinite(memberPriceNum) && memberPriceNum > 0

  // Check for featured / upsell badge
  const promoBadge = service.tags.find((t) => {
    const lower = t.toLowerCase()
    return (
      lower === 'vip' ||
      lower === 'best value' ||
      lower === 'bestseller' ||
      lower.startsWith('save $') ||
      lower === 'combo'
    )
  })

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={`group hover:bg-nexoraSurfaceMuted/60 transition ${isDragging ? 'opacity-30 bg-nexoraBrandSoft/30' : ''}`}
    >
      {/* Service Name */}
      <td className="py-3 pl-4 pr-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing text-nexoraSubtle/50 hover:text-nexoraText p-1.5 rounded-lg touch-none min-h-[36px] min-w-[36px] flex items-center justify-center"
          >
            <GripVertical className="h-4 w-4" />
          </button>

          {isAddon ? (
            <div className="flex items-center gap-1.5 pl-3 sm:pl-4 text-nexoraMuted">
              <CornerDownRight className="h-3.5 w-3.5 text-nexoraSubtle shrink-0" />
              <span className="font-semibold">{service.name}</span>
            </div>
          ) : (
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-nexoraText">{service.name}</span>
                {isOwnerRecommended && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-300 px-2 py-0.2 text-[10px] font-black text-amber-800 shadow-2xs">
                    <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                    <span>Owner Recommended</span>
                  </span>
                )}
                {promoBadge && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 border border-indigo-200 px-2 py-0.2 text-[10px] font-black text-indigo-700">
                    <Sparkles className="h-2.5 w-2.5 text-indigo-600" />
                    <span>{promoBadge}</span>
                  </span>
                )}
              </div>

              {/* Linked Upsell Add-ons Pills */}
              {linkedAddons.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                  <span className="text-[10px] font-bold text-nexoraMuted uppercase tracking-wider">
                    Add-ons:
                  </span>
                  {linkedAddons.map((add) => (
                    <span
                      key={add.id}
                      className="inline-flex items-center gap-1 rounded-md bg-nexoraBrandSoft/80 border border-nexoraBrand/30 px-2 py-0.5 text-[10px] font-bold text-nexoraBrand"
                    >
                      <Sparkles className="h-2.5 w-2.5 text-nexoraBrand shrink-0" />
                      <span>{add.name}</span>
                      <span className="text-nexoraBrandDark font-black">(+${add.price})</span>
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </td>

      {/* Reg Price */}
      <td className="px-3 py-3 font-bold text-nexoraText whitespace-nowrap">
        ${Number(service.price).toFixed(0)}
      </td>

      {/* Member Price */}
      <td className="px-3 py-3 whitespace-nowrap">
        {hasMemberPrice ? (
          <div className="inline-flex items-center gap-1 rounded-md bg-indigo-50/80 px-2 py-0.5 border border-indigo-100">
            <Crown className="h-3 w-3 text-indigo-600" />
            <span className="font-bold text-indigo-700 text-xs">${memberPriceNum.toFixed(0)}</span>
          </div>
        ) : (
          <span className="font-medium text-nexoraSubtle">-</span>
        )}
      </td>

      {/* Status Switch (>=44px touch target) */}
      <td className="px-3 py-3">
        <button
          type="button"
          onClick={onToggleStatus}
          className="flex items-center gap-2 text-xs font-semibold focus:outline-none select-none group/toggle py-1 min-h-[44px]"
        >
          <div
            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
              isActive ? 'bg-nexoraSuccess' : 'bg-slate-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                isActive ? 'translate-x-4' : 'translate-x-0'
              }`}
            />
          </div>
          <span className={`hidden sm:inline ${isActive ? 'text-nexoraSuccess font-bold' : 'text-nexoraSubtle'}`}>
            {isActive ? 'Active' : 'Inactive'}
          </span>
        </button>
      </td>

      {/* Actions (Direct 1-Click Touch Buttons — 100% immune to clipping bugs) */}
      <td className="py-2.5 pl-2 pr-4 text-right whitespace-nowrap">
        <div className="flex items-center justify-end gap-1">
          <button
            type="button"
            onClick={onEdit}
            className="p-2 rounded-lg text-nexoraSubtle hover:bg-nexoraBrandSoft/40 hover:text-nexoraBrand transition min-h-[38px] min-w-[38px] flex items-center justify-center"
            title="Sửa dịch vụ"
          >
            <Edit2 className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="p-2 rounded-lg text-nexoraSubtle hover:bg-rose-50 hover:text-nexoraDanger transition min-h-[38px] min-w-[38px] flex items-center justify-center"
            title="Xóa dịch vụ"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </td>
    </tr>
  )
}


// ─────────────────────────────────────────────────────────────────────────────
// Subcomponents: Customer Live Upsell Preview Modal
// ─────────────────────────────────────────────────────────────────────────────
function CustomerUpsellPreviewModal({
  open,
  onClose,
  services,
  categories,
}: {
  open: boolean
  onClose: () => void
  services: PosServiceApiDto[]
  categories: PosCategoryApiDto[]
}) {
  const [selectedServiceId, setSelectedServiceId] = useState<string>('')
  const [selectedAddons, setSelectedAddons] = useState<Set<string>>(new Set())
  const [isVipMember, setIsVipMember] = useState(false)

  // Initialize selected service
  useEffect(() => {
    if (!open) return
    const firstMainService = services.find((s) => !s.tags?.some((t) => t.toLowerCase().includes('add-on'))) || services[0]
    if (firstMainService) {
      setSelectedServiceId(firstMainService.id)
    }
    setSelectedAddons(new Set())
    setIsVipMember(false)
  }, [open, services])

  if (!open) return null

  const currentService = services.find((s) => s.id === selectedServiceId) || services[0]
  if (!currentService) return null

  // Extract member price
  const memberPriceStr = extractMemberPriceFromService(currentService)
  const memberPriceNum = Number(memberPriceStr)
  const hasMemberPrice = Number.isFinite(memberPriceNum) && memberPriceNum > 0

  // Linked addons or catalog addons
  const availableAddonServices = services.filter((s) =>
    s.id !== currentService.id && (s.tags?.some((t) => t.toLowerCase().includes('add-on')) || s.price <= 20),
  )

  const toggleAddon = (id: string) => {
    setSelectedAddons((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // Calculate totals
  const basePrice = isVipMember && hasMemberPrice ? memberPriceNum : currentService.price
  const addonsTotal = Array.from(selectedAddons).reduce((sum, addId) => {
    const item = availableAddonServices.find((a) => a.id === addId)
    return sum + (item?.price || 0)
  }, 0)
  const grandTotal = basePrice + addonsTotal

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-nexoraText/75 p-4 backdrop-blur-sm animate-fadeIn">
      <div className="relative flex flex-col w-full max-w-2xl max-h-[92vh] rounded-3xl border border-nexoraBorder bg-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-nexoraBorder px-6 py-4 bg-gradient-to-r from-nexoraBrandSoft/40 via-white to-amber-50/40">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-nexoraBrand text-white shadow-sm">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-nexoraText">Live Customer & POS Upsell Preview</h2>
                <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-black text-emerald-800">
                  LIVE SIMULATION
                </span>
              </div>
              <p className="text-xs text-nexoraMuted">Trải nghiệm màn hình chọn món & Upsell từ góc nhìn khách hàng / quầy thu ngân</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-nexoraSubtle hover:bg-white hover:text-nexoraText transition shadow-2xs"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* 1. Service Selector (Simulate selecting a service) */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-nexoraMuted block mb-2">
              1. Chọn dịch vụ chính đang phục vụ:
            </label>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {services
                .filter((s) => !s.tags?.some((t) => t.toLowerCase().includes('add-on')))
                .slice(0, 5)
                .map((srv) => {
                  const isSel = srv.id === currentService.id
                  return (
                    <button
                      key={srv.id}
                      type="button"
                      onClick={() => {
                        setSelectedServiceId(srv.id)
                        setSelectedAddons(new Set())
                      }}
                      className={`shrink-0 rounded-2xl p-3.5 text-left border transition w-48 ${
                        isSel
                          ? 'border-nexoraBrand bg-nexoraBrandSoft/40 ring-2 ring-nexoraBrand/20 shadow-sm'
                          : 'border-nexoraBorder bg-white hover:bg-slate-50'
                      }`}
                    >
                      <span className="text-xs font-bold text-nexoraText block truncate">{srv.name}</span>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs font-extrabold text-nexoraBrand">$${srv.price}</span>
                        <span className="text-[11px] text-nexoraMuted">{srv.durationMinutes} min</span>
                      </div>
                    </button>
                  )
                })}
            </div>
          </div>

          {/* 2. Selected Service Card + VIP Member Pricing Toggle */}
          <div className="rounded-2xl border border-nexoraBorder bg-nexoraSurfaceMuted/60 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs text-nexoraMuted font-bold">Dịch vụ đang chọn:</span>
                <h3 className="text-base font-bold text-nexoraText">{currentService.name}</h3>
              </div>
              <div className="text-right">
                <span className="text-lg font-black text-nexoraText">$${basePrice.toFixed(2)}</span>
                {hasMemberPrice && (
                  <span className="text-xs line-through text-slate-400 block font-semibold">
                    $${currentService.price.toFixed(2)}
                  </span>
                )}
              </div>
            </div>

            {/* VIP Member Toggle Banner */}
            {hasMemberPrice ? (
              <div className="flex items-center justify-between rounded-xl border border-indigo-200 bg-indigo-50/80 p-3">
                <div className="flex items-center gap-2">
                  <Crown className="h-4 w-4 text-indigo-600 shrink-0" />
                  <div>
                    <span className="text-xs font-bold text-indigo-950 block">Khách hàng thành viên VIP (Member Price)</span>
                    <span className="text-[11px] text-indigo-800/80 block">
                      Ưu đãi chỉ còn $${memberPriceNum.toFixed(2)} (Tiết kiệm $${(currentService.price - memberPriceNum).toFixed(2)})
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsVipMember(!isVipMember)}
                  className={`rounded-xl px-3 py-1.5 text-xs font-bold transition shadow-xs ${
                    isVipMember
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white border border-indigo-200 text-indigo-900 hover:bg-indigo-100'
                  }`}
                >
                  {isVipMember ? '✓ Đang áp dụng VIP' : 'Áp dụng VIP'}
                </button>
              </div>
            ) : null}
          </div>

          {/* 3. The 15s UPSELL ADD-ONS BAR */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-500" />
                <span className="text-xs font-bold text-nexoraText uppercase tracking-wider">
                  Gợi ý món Add-on bán kèm (Upsell Recommendations)
                </span>
              </div>
              <span className="text-[11px] text-nexoraBrand font-bold">
                +{selectedAddons.size} món đã chọn
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {availableAddonServices.map((addon) => {
                const isChecked = selectedAddons.has(addon.id)
                return (
                  <button
                    key={addon.id}
                    type="button"
                    onClick={() => toggleAddon(addon.id)}
                    className={`flex items-center justify-between rounded-xl p-3 text-left border transition ${
                      isChecked
                        ? 'border-nexoraBrand bg-nexoraBrandSoft/40 ring-1 ring-nexoraBrand shadow-2xs'
                        : 'border-nexoraBorder bg-white hover:bg-nexoraSurfaceMuted/60'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 pr-2">
                      <div
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-lg border transition ${
                          isChecked
                            ? 'border-nexoraBrand bg-nexoraBrand text-white'
                            : 'border-slate-300 bg-white'
                        }`}
                      >
                        {isChecked && <Check className="h-3.5 w-3.5" />}
                      </div>
                      <div className="min-w-0 truncate">
                        <span className="text-xs font-bold text-nexoraText block truncate">{addon.name}</span>
                        <span className="text-[10px] text-nexoraMuted">Thêm vào liệu trình</span>
                      </div>
                    </div>

                    <span className="text-xs font-extrabold text-nexoraBrand shrink-0">
                      +$${addon.price}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* 4. Live Total Bill Summary */}
          <div className="rounded-2xl border border-nexoraBorder bg-gradient-to-br from-slate-900 to-slate-800 p-5 text-white shadow-xl space-y-3">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <span className="text-xs text-slate-300 font-medium">Chi tiết vé thanh toán:</span>
              <span className="text-xs font-bold text-emerald-400">
                {selectedAddons.size > 0 ? `Đã tăng thêm +$${addonsTotal} doanh số Upsell` : 'Chưa chọn Upsell'}
              </span>
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-300">
                <span>{currentService.name}</span>
                <span>$${basePrice.toFixed(2)}</span>
              </div>

              {Array.from(selectedAddons).map((addId) => {
                const addObj = availableAddonServices.find((a) => a.id === addId)
                if (!addObj) return null
                return (
                  <div key={addId} className="flex justify-between text-amber-300">
                    <span>+ {addObj.name} (Add-on)</span>
                    <span>+$${addObj.price.toFixed(2)}</span>
                  </div>
                )
              })}
            </div>

            <div className="flex items-center justify-between border-t border-white/10 pt-3 text-base font-black">
              <span>TỔNG TIỀN THANH TOÁN (TOTAL):</span>
              <span className="text-xl text-emerald-400">$${grandTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex shrink-0 items-center justify-end border-t border-nexoraBorder bg-nexoraSurfaceMuted/40 px-6 py-3.5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-nexoraBrand px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-nexoraBrandDark transition"
          >
            Đóng xem trước
          </button>
        </div>
      </div>
    </div>
  )
}
