import { useEffect, useState } from 'react'
import { Loader2, X } from 'lucide-react'
import { useTranslation } from '../../../contexts/LanguageContext'

/** Matches `CreateTransactionCategoryCommandValidator.Name` (`MaximumLength(200)`) on the backend. */
const CATEGORY_NAME_MAX_LENGTH = 200

/**
 * Income/Payout Categories (issue #584) — single reusable modal for creating a new category or
 * renaming an existing one, used both inline from a transaction detail's "+ Create new" flow and
 * from the Category Management screens.
 */
export default function AddEditCategoryModal({
  open,
  mode,
  initialName = '',
  onSave,
  onClose,
  isSaving = false,
  errorMessage = null,
}: {
  open: boolean
  mode: 'create' | 'edit'
  initialName?: string
  onSave: (name: string) => void
  onClose: () => void
  isSaving?: boolean
  errorMessage?: string | null
}) {
  const { t } = useTranslation()
  const [name, setName] = useState(initialName)

  useEffect(() => {
    if (open) setName(initialName)
  }, [open, initialName])

  if (!open) return null

  const trimmed = name.trim()
  const canSave = trimmed.length > 0 && !isSaving

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSave) return
    onSave(trimmed)
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center bg-slate-900/60 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <form
        onSubmit={handleSubmit}
        className="flex max-h-[92dvh] w-full flex-col overflow-y-auto rounded-t-2xl border border-nexoraBorder bg-white p-4 shadow-2xl sm:max-w-sm sm:rounded-2xl sm:p-6"
      >
        <div className="mb-4 flex items-center justify-between border-b border-nexoraBorder pb-4">
          <span className="text-[10px] font-black uppercase tracking-wider text-nexoraMuted">
            {t(mode === 'create' ? 'transaction_categories.modal_add_title' : 'transaction_categories.modal_edit_title')}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-nexoraMuted transition-colors hover:bg-slate-100 hover:text-nexoraText"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <label className="text-xs font-bold text-nexoraMuted" htmlFor="category-name-input">
          {t('transaction_categories.modal_name_label')}
        </label>
        <input
          id="category-name-input"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t('transaction_categories.modal_name_placeholder')}
          maxLength={CATEGORY_NAME_MAX_LENGTH}
          disabled={isSaving}
          autoFocus
          className="mt-1.5 h-10 w-full rounded-lg border border-nexoraBorder bg-white px-3 text-sm font-semibold text-nexoraText disabled:cursor-not-allowed disabled:opacity-60"
        />
        {errorMessage ? <p className="mt-2 text-xs font-semibold text-red-600">{errorMessage}</p> : null}

        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="h-10 flex-1 cursor-pointer rounded-lg border border-nexoraBorder text-xs font-bold text-nexoraText transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {t('transaction_categories.modal_cancel')}
          </button>
          <button
            type="submit"
            disabled={!canSave}
            className="flex h-10 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-nexoraBrand text-xs font-black uppercase tracking-wider text-white transition hover:bg-nexoraBrand/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? <Loader2 className="h-4 w-4 shrink-0 animate-spin" /> : null}
            <span className="truncate">
              {isSaving ? t('transaction_categories.modal_saving') : t('transaction_categories.modal_save')}
            </span>
          </button>
        </div>
      </form>
    </div>
  )
}
