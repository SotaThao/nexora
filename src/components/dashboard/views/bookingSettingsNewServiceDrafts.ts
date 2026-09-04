export type NewServiceDraft = {
  id: string
  categoryId: string
  name: string
  price: string
  duration: string
}

export type EditableNewServiceDraftField = 'name' | 'price' | 'duration'

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

/**
 * `fields` lists every input on the row that's currently invalid — a row with an
 * empty price AND an empty duration marks both, not just the first one found.
 * It's empty only when a row failed for a reason unrelated to a specific input
 * (e.g. the save API call itself rejected the row) — in that case every field is
 * marked invalid, since there's no single field to point at.
 */
export type NewServiceDraftError = {
  fields: EditableNewServiceDraftField[]
  message: string
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
): Record<string, NewServiceDraftError> {
  return drafts.reduce<Record<string, NewServiceDraftError>>((errors, draft) => {
    const price = Number(draft.price)
    const duration = Number(draft.duration)
    const fields: EditableNewServiceDraftField[] = []
    const rowMessages: string[] = []

    if (!draft.name.trim()) {
      fields.push('name')
      rowMessages.push(messages.nameRequired)
    }
    if (!draft.price.trim() || !Number.isFinite(price) || price < 0) {
      fields.push('price')
      rowMessages.push(messages.priceInvalid)
    }
    if (!draft.duration.trim() || !Number.isFinite(duration) || duration <= 0) {
      fields.push('duration')
      rowMessages.push(messages.durationInvalid)
    }

    if (fields.length > 0) {
      errors[draft.id] = { fields, message: rowMessages.join(' ') }
    }

    return errors
  }, {})
}
