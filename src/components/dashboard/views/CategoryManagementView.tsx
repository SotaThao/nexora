import { useState } from 'react'
import { Loader2, Pencil, Plus, Trash2 } from 'lucide-react'
import { useTranslation } from '../../../contexts/LanguageContext'
import { useNotification } from '../../../contexts/NotificationContext'
import { getErrorMessage } from '../../../data/errorCodes'
import {
  useCreateMerchantCategory,
  useDeleteMerchantCategory,
  useMerchantCategories,
  useUpdateMerchantCategory,
} from '../../../data/hooks/useTransactionCategories'
import type { TransactionCategory } from '../../../types/domain'
import PaymentsPayoutsHeader from '../PaymentsPayoutsHeader'
import AddEditCategoryModal from '../categories/AddEditCategoryModal'
import IncomeByCategoryPanel from '../charts/IncomeByCategoryPanel'

/**
 * Income/Payout Categories (issue #584) — Merchant's "Category management" screen: full CRUD
 * over the Business's own category set, plus the same Income by category breakdown shown on the
 * Payments & Payouts Overview tab.
 */
export default function CategoryManagementView() {
  const { t } = useTranslation()
  const { showToast } = useNotification()

  const { data: categories = [], isPending } = useMerchantCategories()
  const createMutation = useCreateMerchantCategory()
  const updateMutation = useUpdateMerchantCategory()
  const deleteMutation = useDeleteMerchantCategory()

  const [modalState, setModalState] = useState<{ mode: 'create' | 'edit'; category?: TransactionCategory } | null>(null)
  const [modalError, setModalError] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const handleSave = (name: string) => {
    if (modalState?.mode === 'edit' && modalState.category) {
      updateMutation.mutate(
        { categoryId: modalState.category.id, name },
        {
          onSuccess: () => {
            setModalState(null)
            setModalError(null)
          },
          onError: (err) => setModalError(getErrorMessage(err, t)),
        },
      )
      return
    }

    createMutation.mutate(name, {
      onSuccess: () => {
        setModalState(null)
        setModalError(null)
      },
      onError: (err) => setModalError(getErrorMessage(err, t)),
    })
  }

  const handleDelete = (categoryId: string) => {
    deleteMutation.mutate(categoryId, {
      onSuccess: () => setConfirmDeleteId(null),
      onError: (err) => {
        showToast(getErrorMessage(err, t), 'error')
        setConfirmDeleteId(null)
      },
    })
  }

  const isSaving = createMutation.isPending || updateMutation.isPending

  return (
    <div className="space-y-6">
      <PaymentsPayoutsHeader />

      <IncomeByCategoryPanel scope="merchant" />

      <div className="card-elevated p-4 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <h4 className="text-sm font-black uppercase tracking-wider text-inkBlue dark:text-white">
            {t('transaction_categories.management_title')}
          </h4>
          <button
            type="button"
            onClick={() => {
              setModalState({ mode: 'create' })
              setModalError(null)
            }}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-nexoraBrand px-3 text-xs font-black uppercase tracking-wider text-white transition hover:bg-nexoraBrand/90"
          >
            <Plus className="h-3.5 w-3.5" />
            {t('transaction_categories.add_category')}
          </button>
        </div>
        <p className="mt-1 text-xs text-nexoraMuted">{t('transaction_categories.management_subtitle_merchant')}</p>

        {isPending ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-nexoraBrand" />
          </div>
        ) : categories.length === 0 ? (
          <p className="py-8 text-center text-xs text-nexoraMuted">{t('transaction_categories.empty_list')}</p>
        ) : (
          <div className="mt-4 divide-y divide-nexoraBorder">
            {categories.map((category) => (
              <div key={category.id} className="flex items-center justify-between gap-3 py-3">
                <span className="truncate text-sm font-semibold text-nexoraText">{category.name}</span>
                {confirmDeleteId === category.id ? (
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="text-xs font-semibold text-nexoraMuted">
                      {t('transaction_categories.delete_confirm_title')}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDelete(category.id)}
                      disabled={deleteMutation.isPending}
                      className="h-8 rounded-lg bg-red-600 px-3 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {t('transaction_categories.delete_confirm_action')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(null)}
                      className="h-8 rounded-lg border border-nexoraBorder px-3 text-xs font-bold text-nexoraText"
                    >
                      {t('transaction_categories.modal_cancel')}
                    </button>
                  </div>
                ) : (
                  <div className="flex shrink-0 items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setModalState({ mode: 'edit', category })
                        setModalError(null)
                      }}
                      title={t('transaction_categories.edit_action')}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-nexoraBorder text-nexoraMuted transition hover:bg-slate-50 hover:text-nexoraText"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(category.id)}
                      title={t('transaction_categories.delete_action')}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-nexoraBorder text-nexoraMuted transition hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <AddEditCategoryModal
        open={modalState !== null}
        mode={modalState?.mode ?? 'create'}
        initialName={modalState?.category?.name ?? ''}
        onSave={handleSave}
        onClose={() => {
          setModalState(null)
          setModalError(null)
        }}
        isSaving={isSaving}
        errorMessage={modalError}
      />
    </div>
  )
}
