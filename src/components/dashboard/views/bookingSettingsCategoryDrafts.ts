export type EditableCategoryDraft = {
  id: string | null
  name: string
  isSystem: boolean
}

export type CategoryDraftChangeMessages = {
  nameRequired: string
  duplicateName: string
}

export type CategoryDraftChangePlan = {
  error: { draftIndex: number; message: string } | null
  creates: Array<{ draftIndex: number; name: string }>
  updates: Array<{ draftIndex: number; id: string; name: string }>
}

export function moveCategoryDrafts<TCategory extends { sortKey: string }>(
  categories: readonly TCategory[],
  activeKey: string,
  overKey: string,
): TCategory[] {
  const activeIndex = categories.findIndex((category) => category.sortKey === activeKey)
  const overIndex = categories.findIndex((category) => category.sortKey === overKey)
  if (activeIndex < 0 || overIndex < 0 || activeIndex === overIndex) return [...categories]

  const next = [...categories]
  const [activeCategory] = next.splice(activeIndex, 1)
  next.splice(overIndex, 0, activeCategory)
  return next
}

export function buildCategoryOrderItems<
  TDraft extends { id: string | null; name: string },
  TPersisted extends { id: string; name: string },
>(drafts: readonly TDraft[], persisted: readonly TPersisted[]) {
  const persistedIdByName = new Map(
    persisted.map((category) => [category.name.trim().toLowerCase(), category.id]),
  )
  const desiredIds = drafts
    .map(
      (draft) =>
        draft.id ?? persistedIdByName.get(draft.name.trim().toLowerCase()) ?? null,
    )
    .filter((id): id is string => Boolean(id))
  const desiredIdSet = new Set(desiredIds)

  persisted.forEach((category) => {
    if (desiredIdSet.has(category.id)) return
    desiredIds.push(category.id)
    desiredIdSet.add(category.id)
  })

  return desiredIds.map((categoryId, sortOrder) => ({ categoryId, sortOrder }))
}

export function planCategoryDraftChanges(
  drafts: EditableCategoryDraft[],
  originals: EditableCategoryDraft[],
  messages: CategoryDraftChangeMessages,
): CategoryDraftChangePlan {
  const seenNames = new Set<string>()

  for (let draftIndex = 0; draftIndex < drafts.length; draftIndex += 1) {
    const draft = drafts[draftIndex]
    const name = draft.name.trim()

    if (!draft.isSystem && draft.id && !name) {
      return {
        error: { draftIndex, message: messages.nameRequired },
        creates: [],
        updates: [],
      }
    }

    const normalizedName = name.toLowerCase()
    if (normalizedName && seenNames.has(normalizedName)) {
      return {
        error: { draftIndex, message: messages.duplicateName },
        creates: [],
        updates: [],
      }
    }
    if (normalizedName) seenNames.add(normalizedName)
  }

  const originalById = new Map(
    originals
      .filter((category): category is EditableCategoryDraft & { id: string } =>
        Boolean(category.id),
      )
      .map((category) => [category.id, category]),
  )
  const creates: CategoryDraftChangePlan['creates'] = []
  const updates: CategoryDraftChangePlan['updates'] = []

  drafts.forEach((draft, draftIndex) => {
    if (draft.isSystem) return
    const name = draft.name.trim()
    if (!draft.id) {
      if (name) creates.push({ draftIndex, name })
      return
    }

    const original = originalById.get(draft.id)
    if (original && original.name.trim() !== name) {
      updates.push({ draftIndex, id: draft.id, name })
    }
  })

  return { error: null, creates, updates }
}
