export type NewServiceDraft = {
  id: string
  categoryId: string
  name: string
  price: string
  duration: string
}

type EditableNewServiceDraftField = 'name' | 'price' | 'duration'

export type NewServiceDraftAction =
  | { type: 'add'; draft: NewServiceDraft }
  | {
      type: 'update'
      id: string
      field: EditableNewServiceDraftField
      value: string
    }
  | { type: 'remove'; id: string }

export type NewServiceDraftValidationMessages = {
  nameRequired: string
  priceInvalid: string
  durationInvalid: string
}

export function newServiceDraftReducer(
  state: NewServiceDraft[],
  action: NewServiceDraftAction,
): NewServiceDraft[] {
  switch (action.type) {
    case 'add':
      return [...state, action.draft]
    case 'update':
      return state.map((draft) =>
        draft.id === action.id
          ? { ...draft, [action.field]: action.value }
          : draft,
      )
    case 'remove':
      return state.filter((draft) => draft.id !== action.id)
    default:
      return state
  }
}

export function validateNewServiceDrafts(
  drafts: NewServiceDraft[],
  messages: NewServiceDraftValidationMessages,
): Record<string, string> {
  return drafts.reduce<Record<string, string>>((errors, draft) => {
    const price = Number(draft.price)
    const duration = Number(draft.duration)

    if (!draft.name.trim()) {
      errors[draft.id] = messages.nameRequired
    } else if (!draft.price.trim() || !Number.isFinite(price) || price < 0) {
      errors[draft.id] = messages.priceInvalid
    } else if (!draft.duration.trim() || !Number.isFinite(duration) || duration <= 0) {
      errors[draft.id] = messages.durationInvalid
    }

    return errors
  }, {})
}
