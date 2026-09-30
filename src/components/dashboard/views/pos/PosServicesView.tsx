// PosServicesView — POS > Salon Setting > Services (US-017).
// The catalog presentation is shared with AI Hub. POS supplies its own API
// adapter/controller and enriches each row with photos, tags, and status.
import { useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { LayoutGrid, List, Search } from 'lucide-react'
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
  useReorderPosServices,
  usePosServices,
  useUpdatePosService,
} from '../../../../data/hooks/usePosServices'
import type { PosServiceInput } from '../../../../data/repositories/posServices'
import type { PosServiceApiDto } from '../../../../types/repositories'
import { SkeletonList } from '../../../ui/skeleton'
import ServicesPricingPanel, {
  ServicesPricingCategoryManager,
  ServicesPricingServiceSection,
} from '../services/ServicesPricingPanel'
import {
  ServicesPricingServiceRow,
  type ServicesPricingServiceField,
} from '../services/ServicesPricingServiceEditor'
import {
  newServiceDraftReducer,
  validateNewServiceDrafts,
  type NewServiceDraft,
  type NewServiceDraftError,
} from '../bookingSettingsNewServiceDrafts'
import { CheckCircleFillIcon } from '../BookingHubIcons'
import CreateEditPosServiceModal from './modals/CreateEditPosServiceModal'
import PosServicesCardView, { type PosServiceSection } from './PosServicesCardView'
import { TOAST_SNACK_DURATION_MS } from '../../../../constants/toast'
import { PosServiceStatus } from '../../../../constants/posServiceStatus'

type PosCategoryDraft = {
  id: string | null
  draftKey: string
  name: string
  originalName: string
  isNew: boolean
}

type PosInlineServiceDraft = {
  name: string
  price: string
  duration: string
}

const TK = 'components.dashboard.views.pos.PosServicesView'
const AI_TK = 'components.dashboard.views.BookingHubView.settings'
const OTHER_SERVICES_SECTION_ID = 'pos-other-services'

function buildInlineServiceDraft(service: PosServiceApiDto): PosInlineServiceDraft {
  return {
    name: service.name,
    price: String(service.price),
    duration: String(service.durationMinutes),
  }
}

function toServiceInput(service: PosServiceApiDto): PosServiceInput {
  return {
    name: service.name,
    price: service.price,
    supplyFee: service.supplyFee,
    durationMinutes: service.durationMinutes,
    description: service.description ?? undefined,
    categoryIds: service.categoryIds,
    tags: service.tags,
    status: service.status,
    isRequiredApproval: Boolean(service.isRequiredApproval),
  }
}

function toApprovalBadge(required: boolean, label: string) {
  return { required, label }
}

function groupServicesByCategory(
  services: PosServiceApiDto[],
  categories: { id: string; name: string }[],
  otherSectionId: string,
  otherSectionName: string,
): PosServiceSection[] {
  const sections = categories.map((category) => ({
    id: category.id,
    name: category.name,
    services: [] as PosServiceApiDto[],
  }))
  const sectionById = new Map(sections.map((section) => [section.id, section]))
  const otherServices: PosServiceApiDto[] = []

  services.forEach((service) => {
    const matchedCategoryIds = [...new Set(service.categoryIds)].filter((categoryId) =>
      sectionById.has(categoryId),
    )
    if (matchedCategoryIds.length === 0) {
      otherServices.push(service)
      return
    }
    matchedCategoryIds.forEach((categoryId) => {
      const section = sectionById.get(categoryId)
      if (!section || section.services.some((row) => row.id === service.id)) return
      section.services.push(service)
    })
  })

  if (otherServices.length > 0) {
    sections.push({
      id: otherSectionId,
      name: otherSectionName,
      services: otherServices,
    })
  }

  return sections
}

export default function PosServicesView({ embedded = false }: { embedded?: boolean }) {
  const { t } = useTranslation()
  const { showToast, showConfirm } = useNotification()
  const { data: services, isLoading, isError, refetch } = usePosServices()
  const { data: categories, isLoading: categoriesLoading, isError: categoriesError, refetch: refetchCategories } = usePosCategories()
  const { data: tags } = usePosTags()
  const createService = useCreatePosService()
  const updateService = useUpdatePosService()
  const deleteService = useDeletePosService()
  const reorderServices = useReorderPosServices()
  const createCategory = useCreatePosCategory()
  const updateCategory = useUpdatePosCategory()
  const deleteCategory = useDeletePosCategory()
  const reorderCategories = useReorderPosCategories()

  const [items, setItems] = useState<PosServiceApiDto[]>([])
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card')
  const [search, setSearch] = useState('')
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  const [inlineServiceDrafts, setInlineServiceDrafts] = useState<
    Record<string, PosInlineServiceDraft>
  >({})
  const [inlineServiceErrors, setInlineServiceErrors] = useState<Record<string, string>>({})
  const [isSavingAllServices, setIsSavingAllServices] = useState(false)
  const [newServiceDrafts, dispatchNewServiceDraft] = useReducer(newServiceDraftReducer, [])
  const [newServiceDraftErrors, setNewServiceDraftErrors] = useState<
    Record<string, NewServiceDraftError>
  >({})
  const [modalState, setModalState] = useState<{
    open: boolean
    service: PosServiceApiDto | null
    defaultCategoryId: string | null
  }>({ open: false, service: null, defaultCategoryId: null })
  const [openSectionIds, setOpenSectionIds] = useState<Set<string>>(new Set())
  const [categoryManagerOpen, setCategoryManagerOpen] = useState(false)
  const [categoryDrafts, setCategoryDrafts] = useState<PosCategoryDraft[]>([])
  const [deletedCategoryIds, setDeletedCategoryIds] = useState<string[]>([])
  const [categoryError, setCategoryError] = useState('')
  const [categoryErrorIndex, setCategoryErrorIndex] = useState<number | null>(null)
  const categoryDraftIdRef = useRef(0)
  const newServiceDraftIdRef = useRef(0)

  useEffect(() => {
    setItems(services ?? [])
    const serviceIds = new Set((services ?? []).map((service) => service.id))
    setInlineServiceDrafts((previous) =>
      Object.fromEntries(Object.entries(previous).filter(([serviceId]) => serviceIds.has(serviceId))),
    )
    setInlineServiceErrors((previous) =>
      Object.fromEntries(Object.entries(previous).filter(([serviceId]) => serviceIds.has(serviceId))),
    )
  }, [services])

  const serviceSections = useMemo<PosServiceSection[]>(
    () =>
      groupServicesByCategory(
        items,
        categories ?? [],
        OTHER_SERVICES_SECTION_ID,
        t(`${TK}.otherServices`),
      ),
    [categories, items, t],
  )

  const serviceMutationBusy =
    isSavingAllServices ||
    deleteService.isPending ||
    createService.isPending ||
    updateService.isPending ||
    reorderServices.isPending
  const categoryMutationBusy =
    createCategory.isPending ||
    updateCategory.isPending ||
    deleteCategory.isPending ||
    reorderCategories.isPending

  const toggleSection = (sectionId: string) => {
    setOpenSectionIds((previous) => {
      const next = new Set(previous)
      if (next.has(sectionId)) next.delete(sectionId)
      else next.add(sectionId)
      return next
    })
  }

  const addNewServiceDraft = (categoryId: string) => {
    newServiceDraftIdRef.current += 1
    dispatchNewServiceDraft({
      type: 'add',
      draft: {
        id: `new-pos-service-${newServiceDraftIdRef.current}`,
        categoryId,
        name: '',
        price: '',
        duration: '',
      },
    })
    setOpenSectionIds((previous) => {
      const next = new Set(previous)
      next.add(categoryId)
      return next
    })
  }

  const updateNewServiceDraft = (
    draft: NewServiceDraft,
    field: ServicesPricingServiceField,
    value: string,
  ) => {
    dispatchNewServiceDraft({ type: 'update', id: draft.id, field, value })
    setNewServiceDraftErrors((previous) => {
      if (!previous[draft.id]) return previous
      const next = { ...previous }
      delete next[draft.id]
      return next
    })
  }

  const cancelNewServiceDraft = (draft: NewServiceDraft) => {
    dispatchNewServiceDraft({ type: 'remove', id: draft.id })
    setNewServiceDraftErrors((previous) => {
      if (!previous[draft.id]) return previous
      const next = { ...previous }
      delete next[draft.id]
      return next
    })
  }

  const openCategoryManager = () => {
    setCategoryDrafts(
      (categories ?? []).map((category) => ({
        id: category.id,
        draftKey: category.id,
        name: category.name,
        originalName: category.name,
        isNew: false,
      })),
    )
    setDeletedCategoryIds([])
    setCategoryError('')
    setCategoryErrorIndex(null)
    setCategoryManagerOpen(true)
  }

  const handleCreateOrUpdate = async (input: PosServiceInput) => {
    try {
      if (modalState.service) {
        await updateService.mutateAsync({ serviceId: modalState.service.id, input })
      } else {
        await createService.mutateAsync(input)
        const successMessage =
          input.categoryIds.length > 0
            ? `${t(`${TK}.createdSuccess`)} ${t(`${TK}.revisitAssignmentNudge`)}`
            : t(`${TK}.createdSuccess`)
        showToast(successMessage, 'success', TOAST_SNACK_DURATION_MS)
      }
      setModalState({ open: false, service: null, defaultCategoryId: null })
    } catch (error) {
      showToast(t(getErrorI18nKey(getApiErrorCode(error))), 'error')
    }
  }

  const updateInlineServiceDraft = (
    service: PosServiceApiDto,
    field: ServicesPricingServiceField,
    value: string,
  ) => {
    setInlineServiceDrafts((previous) => ({
      ...previous,
      [service.id]: {
        ...(previous[service.id] ?? buildInlineServiceDraft(service)),
        [field]: value,
      },
    }))
    setInlineServiceErrors((previous) => {
      if (!previous[service.id]) return previous
      const next = { ...previous }
      delete next[service.id]
      return next
    })
  }

  const isInlineServiceDraftDirty = (
    service: PosServiceApiDto,
    draft: PosInlineServiceDraft,
  ) =>
    draft.name !== service.name ||
    draft.price !== String(service.price) ||
    draft.duration !== String(service.durationMinutes)

  const dirtyServices = items.filter((service) => {
    const draft = inlineServiceDrafts[service.id]
    return draft ? isInlineServiceDraftDirty(service, draft) : false
  })
  const hasUnsavedServices = dirtyServices.length > 0 || newServiceDrafts.length > 0
  const activeCategoryId = serviceSections.some((section) => section.id === selectedCategoryId)
    ? selectedCategoryId
    : null
  const searchTerm = search.trim().toLocaleLowerCase()
  const hasFilters = Boolean(searchTerm || activeCategoryId)
  const visibleSections = serviceSections
    .filter((section) => !activeCategoryId || section.id === activeCategoryId)
    .map((section) => ({
      ...section,
      services: section.services.filter((service) => service.name.toLocaleLowerCase().includes(searchTerm)),
    }))
    .filter((section) => !searchTerm || section.services.length > 0)

  const clearFilters = () => {
    setSearch('')
    setSelectedCategoryId(null)
  }

  const saveAllServices = async () => {
    const existingUpdates = dirtyServices.map((service) => {
      const draft = inlineServiceDrafts[service.id] ?? buildInlineServiceDraft(service)
      return {
        service,
        draft,
        name: draft.name.trim(),
        price: Number(draft.price),
        durationMinutes: Number(draft.duration),
      }
    })
    const existingErrors: Record<string, string> = {}
    existingUpdates.forEach(({ service, draft, name, price, durationMinutes }) => {
      if (!name) existingErrors[service.id] = t(`${AI_TK}.serviceModalNameRequired`)
      else if (
        draft.price.trim() === '' ||
        !Number.isFinite(price) ||
        price < 0 ||
        price > 1_000_000
      ) {
        existingErrors[service.id] = t(`${AI_TK}.serviceModalPriceInvalid`)
      } else if (
        !Number.isFinite(durationMinutes) ||
        durationMinutes <= 0 ||
        durationMinutes > 720
      ) {
        existingErrors[service.id] = t(`${AI_TK}.serviceModalDurationInvalid`)
      }
    })
    const draftErrors = validateNewServiceDrafts(newServiceDrafts, {
      nameRequired: t(`${AI_TK}.serviceModalNameRequired`),
      priceInvalid: t(`${AI_TK}.serviceModalPriceInvalid`),
      durationInvalid: t(`${AI_TK}.serviceModalDurationInvalid`),
    })

    setInlineServiceErrors(existingErrors)
    setNewServiceDraftErrors(draftErrors)
    if (Object.keys(existingErrors).length > 0 || Object.keys(draftErrors).length > 0) return

    const savedExisting: typeof existingUpdates = []
    const savedNewIds: string[] = []
    const failedExisting: Record<string, string> = {}
    const failedNew: Record<string, NewServiceDraftError> = {}
    let firstFailure = ''

    setIsSavingAllServices(true)
    try {
      for (const update of existingUpdates) {
        try {
          await updateService.mutateAsync({
            serviceId: update.service.id,
            input: {
              ...toServiceInput(update.service),
              name: update.name,
              price: update.price,
              durationMinutes: update.durationMinutes,
            },
          })
          savedExisting.push(update)
        } catch (error) {
          const message = t(getErrorI18nKey(getApiErrorCode(error)))
          failedExisting[update.service.id] = message
          firstFailure ||= message
        }
      }

      for (const draft of newServiceDrafts) {
        try {
          await createService.mutateAsync({
            name: draft.name.trim(),
            price: Number(draft.price),
            supplyFee: 0,
            durationMinutes: Number(draft.duration),
            categoryIds:
              draft.categoryId === OTHER_SERVICES_SECTION_ID ? [] : [draft.categoryId],
            tags: [],
            status: PosServiceStatus.Active,
          })
          savedNewIds.push(draft.id)
        } catch (error) {
          const message = t(getErrorI18nKey(getApiErrorCode(error)))
          failedNew[draft.id] = { fields: [], message }
          firstFailure ||= message
        }
      }

      if (savedExisting.length > 0) {
        const savedById = new Map(savedExisting.map((update) => [update.service.id, update]))
        setItems((previous) =>
          previous.map((service) => {
            const saved = savedById.get(service.id)
            return saved
              ? {
                  ...service,
                  name: saved.name,
                  price: saved.price,
                  durationMinutes: saved.durationMinutes,
                }
              : service
          }),
        )
        setInlineServiceDrafts((previous) => {
          const next = { ...previous }
          savedExisting.forEach(({ service }) => delete next[service.id])
          return next
        })
      }
      savedNewIds.forEach((draftId) =>
        dispatchNewServiceDraft({ type: 'remove', id: draftId }),
      )
      setInlineServiceErrors(failedExisting)
      setNewServiceDraftErrors(failedNew)

      if (firstFailure) showToast(firstFailure, 'error')
      else showToast(t(`${TK}.updatedSuccess`), 'success', TOAST_SNACK_DURATION_MS)
    } finally {
      setIsSavingAllServices(false)
    }
  }

  const handleDelete = async (service: PosServiceApiDto, categoryId: string) => {
    const belongsToMultipleCategories =
      categoryId !== OTHER_SERVICES_SECTION_ID &&
      service.categoryIds.includes(categoryId) &&
      service.categoryIds.length > 1

    if (belongsToMultipleCategories) {
      const categoryName =
        (categories ?? []).find((category) => category.id === categoryId)?.name ?? ''
      const confirmed = await showConfirm(
        t(`${TK}.removeFromCategoryConfirmBody`, {
          name: service.name,
          category: categoryName,
        }),
        t(`${TK}.removeFromCategoryConfirmTitle`),
      )
      if (!confirmed) return
      try {
        await updateService.mutateAsync({
          serviceId: service.id,
          input: {
            ...toServiceInput(service),
            categoryIds: service.categoryIds.filter((id) => id !== categoryId),
          },
        })
        showToast(
          t(`${TK}.removedFromCategorySuccess`, {
            name: service.name,
            category: categoryName,
          }),
          'success',
          TOAST_SNACK_DURATION_MS,
        )
      } catch (error) {
        showToast(t(getErrorI18nKey(getApiErrorCode(error))), 'error')
      }
      return
    }

    const confirmed = await showConfirm(
      t(`${TK}.deleteConfirmBody`, { name: service.name }),
      t(`${TK}.deleteConfirmTitle`),
    )
    if (!confirmed) return
    try {
      await deleteService.mutateAsync(service.id)
      showToast(t(`${TK}.deletedSuccess`), 'success', TOAST_SNACK_DURATION_MS)
    } catch (error) {
      showToast(t(getErrorI18nKey(getApiErrorCode(error))), 'error')
    }
  }

  const reorderServicesForCategory = async (orderedCategoryServices: PosServiceApiDto[]) => {
    const previous = items
    const orderedIds = new Set(orderedCategoryServices.map((service) => service.id))
    let orderedIndex = 0
    const next = previous.map((service) => {
      if (!orderedIds.has(service.id)) return service
      const replacement = orderedCategoryServices[orderedIndex]
      orderedIndex += 1
      return replacement ?? service
    })

    setItems(next)
    try {
      await reorderServices.mutateAsync(
        next.map((service, sortOrder) => ({ serviceId: service.id, sortOrder })),
      )
    } catch {
      setItems(previous)
      showToast(t(`${TK}.reorderFailed`), 'error')
    }
  }

  const handleDeleteCategoryDraft = async (index: number) => {
    const draft = categoryDrafts[index]
    if (!draft) return
    if (draft.id) {
      const confirmed = await showConfirm(
        t(`${TK}.deleteCategoryConfirmBody`, {
          name: draft.name,
        }),
        t('components.dashboard.views.pos.PosCategoriesView.deleteConfirmTitle'),
      )
      if (!confirmed) return
      setDeletedCategoryIds((previous) => [...previous, draft.id as string])
    }
    setCategoryDrafts((previous) => previous.filter((_, draftIndex) => draftIndex !== index))
    setCategoryError('')
    setCategoryErrorIndex(null)
  }

  const saveCategoryManager = async () => {
    const normalizedNames = categoryDrafts.map((draft) => draft.name.trim())
    const missingNameIndex = normalizedNames.findIndex((name) => !name)
    if (missingNameIndex >= 0) {
      setCategoryError(t(`${TK}.categoryNameRequired`))
      setCategoryErrorIndex(missingNameIndex)
      return
    }
    const lowerNames = normalizedNames.map((name) => name.toLocaleLowerCase())
    const duplicateIndex = lowerNames.findIndex(
      (name, index) => lowerNames.indexOf(name) !== index,
    )
    if (duplicateIndex >= 0) {
      setCategoryError(t(`${TK}.categoryDuplicate`))
      setCategoryErrorIndex(duplicateIndex)
      return
    }

    setCategoryError('')
    setCategoryErrorIndex(null)
    try {
      for (const categoryId of deletedCategoryIds) {
        await deleteCategory.mutateAsync(categoryId)
      }

      const savedDrafts: PosCategoryDraft[] = []
      for (let index = 0; index < categoryDrafts.length; index += 1) {
        const draft = categoryDrafts[index]
        const name = normalizedNames[index]
        let categoryId = draft.id
        if (draft.id) {
          if (name !== draft.originalName) {
            await updateCategory.mutateAsync({ categoryId: draft.id, name })
          }
        } else {
          categoryId = await createCategory.mutateAsync(name)
        }
        savedDrafts.push({
          id: categoryId,
          draftKey: categoryId,
          name,
          originalName: name,
          isNew: false,
        })
      }

      const orderedCategoryIds = savedDrafts.map((draft) => draft.id as string)
      if (orderedCategoryIds.length > 0) {
        await reorderCategories.mutateAsync(
          orderedCategoryIds.map((categoryId, sortOrder) => ({ categoryId, sortOrder })),
        )
      }
      setCategoryDrafts(savedDrafts)
      setDeletedCategoryIds([])
      setCategoryManagerOpen(false)
      showToast(t('components.dashboard.views.pos.PosCategoriesView.updatedSuccess'), 'success', TOAST_SNACK_DURATION_MS)
    } catch (error) {
      setCategoryError(t(getErrorI18nKey(getApiErrorCode(error))))
      showToast(t(`${TK}.categorySaveFailed`), 'error')
    }
  }

  return (
    <div className="space-y-6">
      {!embedded ? (
        <section className="space-y-1 px-0.5">
          <h1 className="text-2xl font-bold leading-tight text-nexoraText">{t(`${TK}.title`)}</h1>
          <p className="text-sm font-medium text-nexoraMuted">{t(`${TK}.description`)}</p>
        </section>
      ) : null}

      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full min-w-0 sm:w-[28rem] sm:max-w-full">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-nexoraMuted" aria-hidden="true" />
            <input
              type="search"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value)
                setOpenSectionIds(new Set(serviceSections.map((section) => section.id)))
              }}
              placeholder={t(`${TK}.searchServices`)}
              aria-label={t(`${TK}.searchServices`)}
              className="min-h-11 w-full rounded-lg border border-nexoraBorder bg-nexoraSurface py-2 pl-9 pr-3 text-sm text-nexoraText focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nexoraBrand"
            />
          </div>
          <div role="group" aria-label={t(`${TK}.viewMode`)} className="inline-flex rounded-lg border border-nexoraBorder bg-nexoraSurface p-1 sm:ml-auto">
            {([{ mode: 'card', label: 'cardView', Icon: LayoutGrid }, { mode: 'list', label: 'listView', Icon: List }] as const).map(({ mode, label, Icon }) => (
              <button
                key={mode}
                type="button"
                aria-pressed={viewMode === mode}
                disabled={mode === 'card' && hasUnsavedServices}
                aria-describedby={mode === 'card' && hasUnsavedServices ? 'pos-services-unsaved-hint' : undefined}
                onClick={() => setViewMode(mode)}
                className={`inline-flex min-h-11 items-center gap-2 rounded-md px-3 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nexoraBrand disabled:opacity-50 ${viewMode === mode ? 'bg-nexoraBrand text-white' : 'text-nexoraMuted hover:bg-nexoraSurfaceMuted'}`}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {t(`${TK}.${label}`)}
              </button>
            ))}
          </div>
        </div>
        {hasUnsavedServices ? <p id="pos-services-unsaved-hint" className="text-sm text-nexoraMuted">{t(`${TK}.unsavedViewHint`)}</p> : null}
        {serviceSections.length > 1 ? (
          <div role="group" aria-label={t(`${TK}.categoriesLabel`)} className="flex flex-wrap gap-2">
            {[{ id: null, name: t(`${TK}.allCategories`) }, ...serviceSections].map((category) => (
              <button
                key={category.id ?? 'all'}
                type="button"
                aria-pressed={activeCategoryId === category.id}
                onClick={() => {
                  setSelectedCategoryId(category.id)
                  setOpenSectionIds(new Set(serviceSections.map((section) => section.id)))
                }}
                className={`min-h-9 max-w-full break-words rounded-lg border px-2.5 py-1.5 text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nexoraBrand ${activeCategoryId === category.id ? 'border-nexoraBrand bg-nexoraBrandSoft text-nexoraBrand' : 'border-nexoraBorder bg-nexoraSurface text-nexoraMuted hover:bg-nexoraSurfaceMuted'}`}
              >
                {category.name}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {isLoading || categoriesLoading ? (
        <div className="nexora-card p-6">
          <SkeletonList count={4} lines={2} />
        </div>
      ) : isError || categoriesError ? (
        <div role="alert" className="nexora-card space-y-3 p-6 text-sm text-nexoraDanger">
          <p>{t(`${TK}.loadError`)}</p>
          <button type="button" className="min-h-11 rounded-lg border border-nexoraBorder px-3 text-nexoraText" onClick={() => { void refetch(); void refetchCategories() }}>
            {t(`${TK}.retry`)}
          </button>
        </div>
      ) : hasFilters && visibleSections.length === 0 ? (
        <div role="status" className="nexora-card space-y-3 p-6 text-center text-sm text-nexoraMuted">
          <p>{t(`${TK}.noSearchResults`)}</p>
          <button type="button" onClick={clearFilters} className="min-h-11 rounded-lg border border-nexoraBorder px-3 font-semibold text-nexoraBrand">
            {t(`${TK}.clearFilters`)}
          </button>
        </div>
      ) : viewMode === 'card' ? (
        <PosServicesCardView
          sections={visibleSections}
          disabled={serviceMutationBusy || categoryMutationBusy}
          onManageCategories={openCategoryManager}
          onAdd={(categoryId) => setModalState({ open: true, service: null, defaultCategoryId: categoryId === OTHER_SERVICES_SECTION_ID ? null : categoryId })}
          onEdit={(service) => setModalState({ open: true, service, defaultCategoryId: null })}
          onDelete={(service, categoryId) => void handleDelete(service, categoryId)}
          onReorder={reorderServicesForCategory}
        />
      ) : (
        <ServicesPricingPanel
          sections={visibleSections}
          adapter={{
            getId: (section) => section.id,
            getName: (section) => section.name,
            getCount: (section) => section.services.length,
          }}
          controller={{
            isOpen: (sectionId) => openSectionIds.has(sectionId),
            onToggleSection: toggleSection,
            onAddService: (sectionId) => {
              if (sectionId) addNewServiceDraft(sectionId)
              else {
                setModalState({
                  open: true,
                  service: null,
                  defaultCategoryId: null,
                })
              }
            },
            onManageCategories: openCategoryManager,
            isBusy: serviceMutationBusy,
          }}
          labels={{
            manageCategories: t(`${TK}.manageCategories`),
            addService: t(`${TK}.addService`),
            empty: t(`${TK}.noServices`),
            emptyAction: t(`${TK}.addService`),
            formatCount: (count) => t(`${TK}.${count === 1 ? 'serviceCountOne' : 'serviceCount'}`, { count }),
          }}
          toolbarActions={
            <button
              className="booking-primary-button settings-service-save-all"
              type="button"
              disabled={!hasUnsavedServices || serviceMutationBusy}
              onClick={() => void saveAllServices()}
            >
              <CheckCircleFillIcon />
              {t(`${TK}.save`)}
            </button>
          }
          renderSection={(section) => (
            <ServicesPricingServiceSection
              items={section.services}
              getId={(service) => service.id}
              onReorder={reorderServicesForCategory}
              dragHandleLabel={t(`${TK}.serviceDragHandle`)}
                  disabled={serviceMutationBusy}
              labels={{
                service: t(`${TK}.serviceColumn`),
                price: t(`${TK}.priceColumn`),
                duration: t(`${TK}.durationColumn`),
                status: t(`${TK}.statusColumn`),
                approval: t(`${TK}.approvalColumn`),
                approvalTooltip: t(`${TK}.approvalTooltip`),
                approvalTooltipAriaLabel: t(`${TK}.approvalTooltipAriaLabel`),
                empty: t(`${TK}.categoryEmpty`),
              }}
              renderItem={(service, dragHandle) => {
                    const draft = inlineServiceDrafts[service.id] ?? buildInlineServiceDraft(service)
                    const isDeleting =
                      deleteService.isPending && deleteService.variables === service.id

                    return (
                      <ServicesPricingServiceRow
                        item={service}
                        dragHandle={dragHandle}
                        adapter={{
                          getId: (item) => item.id,
                          getName: () => draft.name,
                          getPrice: () => draft.price,
                          getDuration: () => draft.duration,
                          getPhotoUrl: (item) => item.photoUrl,
                          getStatus: (item) => ({
                            label: t(
                              `${TK}.${item.status === PosServiceStatus.Active ? 'activeBadge' : 'inactiveBadge'}`,
                            ),
                            tone: item.status === PosServiceStatus.Active ? 'active' : 'inactive',
                          }),
                          getApproval: (item) => item.isRequiredApproval
                            ? toApprovalBadge(true, t(`${TK}.approvalRequired`))
                            : null,
                        }}
                        controller={{
                          onChange: updateInlineServiceDraft,
                          onEdit: (item) =>
                            setModalState({ open: true, service: item, defaultCategoryId: null }),
                          onRemove: (item) => handleDelete(item, section.id),
                          isDirty: () => isInlineServiceDraftDirty(service, draft),
                          isPending: () => isDeleting,
                        }}
                        labels={{
                          name: t(`${AI_TK}.serviceNameAria`),
                          namePlaceholder: t(`${AI_TK}.placeholderServiceName`),
                          price: t(`${AI_TK}.servicePriceAria`),
                          pricePlaceholder: t(`${AI_TK}.placeholderServicePrice`),
                          duration: t(`${AI_TK}.serviceDurationAria`),
                          durationPlaceholder: t(`${AI_TK}.placeholderServiceDuration`),
                          durationUnit: t(`${AI_TK}.durationUnit`),
                          edit: t(`${TK}.editService`),
                          editAction: t(`${TK}.editAction`),
                          remove: t(`${TK}.deleteService`),
                          removeAction: t(`${TK}.deleteAction`),
                          save: t(`${TK}.save`),
                        }}
                        actionsAsText
                        error={inlineServiceErrors[service.id]}
                      />
                    )
              }}
              extensionRows={newServiceDrafts
                .filter((draft) => draft.categoryId === section.id)
                .map((draft) => (
                  <ServicesPricingServiceRow
                    key={draft.id}
                    item={draft}
                    dragHandle={<span aria-hidden="true" />}
                    adapter={{
                      getId: (item) => item.id,
                      getName: (item) => item.name,
                      getPrice: (item) => item.price,
                      getDuration: (item) => item.duration,
                      getPhotoUrl: () => null,
                      getStatus: () => ({
                        label: t(`${TK}.activeBadge`),
                        tone: 'active',
                      }),
                      getApproval: () => null,
                    }}
                    controller={{
                      onChange: updateNewServiceDraft,
                      onRemove: cancelNewServiceDraft,
                      isDirty: () => true,
                      isPending: () => createService.isPending,
                    }}
                      labels={{
                      name: t(`${AI_TK}.serviceNameAria`),
                      namePlaceholder: t(`${AI_TK}.placeholderServiceName`),
                      price: t(`${AI_TK}.servicePriceAria`),
                      pricePlaceholder: t(`${AI_TK}.placeholderServicePrice`),
                      duration: t(`${AI_TK}.serviceDurationAria`),
                      durationPlaceholder: t(`${AI_TK}.placeholderServiceDuration`),
                      durationUnit: t(`${AI_TK}.durationUnit`),
                        edit: t(`${TK}.editService`),
                        editAction: t(`${TK}.editAction`),
                        remove: t(`${AI_TK}.serviceModalCancel`),
                        removeAction: t(`${AI_TK}.serviceModalCancel`),
                        save: t(`${TK}.save`),
                      }}
                      actionsAsText
                    error={newServiceDraftErrors[draft.id]?.message}
                    invalidFields={newServiceDraftErrors[draft.id]?.fields}
                    isNew
                    autoFocusName
                  />
                ))}
            />
          )}
        />
      )}

      <CreateEditPosServiceModal
        open={modalState.open}
        onClose={() => setModalState({ open: false, service: null, defaultCategoryId: null })}
        onSubmit={handleCreateOrUpdate}
        isSubmitting={createService.isPending || updateService.isPending}
        categories={categories ?? []}
        tagSuggestions={tags ?? []}
        service={modalState.service}
        defaultCategoryId={modalState.defaultCategoryId}
      />

      <ServicesPricingCategoryManager
        open={categoryManagerOpen}
        categories={categoryDrafts}
        adapter={{
          getKey: (draft) => draft.draftKey,
          getId: (draft) => draft.id,
          getName: (draft) => draft.name,
          getCount: (draft) =>
            draft.id
              ? items.filter((service) => service.categoryIds.includes(draft.id as string)).length
              : 0,
          isSystem: () => false,
          isNew: (draft) => draft.isNew,
        }}
        controller={{
          onClose: () => setCategoryManagerOpen(false),
          onAdd: () => {
            categoryDraftIdRef.current += 1
            setCategoryDrafts((previous) => [
              ...previous,
              {
                id: null,
                draftKey: `new-pos-category-${categoryDraftIdRef.current}`,
                name: '',
                originalName: '',
                isNew: true,
              },
            ])
            setCategoryError('')
            setCategoryErrorIndex(null)
          },
          onNameChange: (index, name) => {
            setCategoryDrafts((previous) =>
              previous.map((draft, draftIndex) =>
                draftIndex === index ? { ...draft, name } : draft,
              ),
            )
            setCategoryError('')
            setCategoryErrorIndex(null)
          },
          onDelete: handleDeleteCategoryDraft,
          onSave: saveCategoryManager,
          onReorder: setCategoryDrafts,
          isBusy: categoryMutationBusy,
        }}
        labels={{
          title: t(`${TK}.categoryManagerTitle`),
          subtitle: t(`${TK}.categoryManagerSubtitle`),
          categories: t(`${TK}.categoryManagerCategories`),
          categoriesSubtitle: t(`${TK}.categoryManagerCategoriesSubtitle`),
          addCategory: t(`${TK}.addCategory`),
          close: t(`${TK}.closeCategoryManager`),
          cancel: t(`${TK}.cancel`),
          save: t(`${TK}.save`),
          empty: t(`${TK}.categoryManagerEmpty`),
          namePlaceholder: t(`${TK}.categoryNamePlaceholder`),
          nameAriaLabel: t(`${TK}.categoryNameAriaLabel`),
          deleteAriaLabel: t(`${TK}.deleteCategory`),
          dragHandle: t(`${TK}.categoryDragHandle`),
          formatCount: (count) => t(`${TK}.${count === 1 ? 'serviceCountOne' : 'serviceCount'}`, { count }),
        }}
        error={categoryError}
        errorIndex={categoryErrorIndex}
      />
    </div>
  )
}
