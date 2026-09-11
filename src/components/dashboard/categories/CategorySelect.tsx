import { useTranslation } from '../../../contexts/LanguageContext'
import type { TransactionCategory } from '../../../types/domain'

const CREATE_NEW_VALUE = '__create_new__'

/**
 * Income/Payout Categories (issue #584) — category dropdown shared by every transaction detail
 * modal and the Category Management screens. Plain native `<select>`: this repo has no combobox
 * library (confirmed — see `src/components/ui/`).
 */
export default function CategorySelect({
  categories,
  value,
  onChange,
  onRequestCreateNew,
  disabled = false,
  className = '',
}: {
  categories: TransactionCategory[]
  value: string | null
  onChange: (categoryId: string | null) => void
  onRequestCreateNew: () => void
  disabled?: boolean
  className?: string
}) {
  const { t } = useTranslation()

  return (
    <select
      value={value ?? ''}
      disabled={disabled}
      onChange={(e) => {
        const next = e.target.value
        if (next === CREATE_NEW_VALUE) {
          onRequestCreateNew()
          return
        }
        onChange(next || null)
      }}
      className={`h-10 w-full rounded-lg border border-nexoraBorder bg-white px-3 text-sm font-semibold text-nexoraText disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
    >
      <option value="">{t('transaction_categories.uncategorized')}</option>
      {categories.map((category) => (
        <option key={category.id} value={category.id}>
          {category.name}
        </option>
      ))}
      <option value={CREATE_NEW_VALUE}>{t('transaction_categories.create_new_option')}</option>
    </select>
  )
}
