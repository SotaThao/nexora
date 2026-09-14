import { useState } from 'react'
import { CreditCard, CheckCircle, Loader2, X } from 'lucide-react'
import { useTranslation } from '../../../contexts/LanguageContext'
import { useNotification } from '../../../contexts/NotificationContext'
import { WalletLogos } from '../../dashboard/constants'
import { formatCurrency, formatTransactionDateTime } from '../../dashboard/utils'
import type { StaffPaymentRecord } from '../../../types/domain'
import { PaymentStatus } from '../../../types/domain'
import { getErrorMessage } from '../../../data/errorCodes'
import DirectPaymentAccountField from '../../payout/DirectPaymentAccountField'
import { DirectPaymentStatusBadge } from '../../dashboard/direct-payments/DirectPaymentStatusBadge'
import {
  getDirectPaymentStatusDescKey,
  isStaffDirectPaymentRecordCompleted,
  needsStaffAcknowledge,
  canForceComplete,
  normalizePaymentStatusValue,
} from '../../../utils/directPaymentStatus'
import CategorySelect from '../../dashboard/categories/CategorySelect'
import AddEditCategoryModal from '../../dashboard/categories/AddEditCategoryModal'
import { useCreateStaffCategory, useStaffCategories } from '../../../data/hooks/useTransactionCategories'
import { useSetStaffPaymentCategory } from '../../../data/hooks/useStaffPayments'

function getPaymentMethodLogo(method: string) {
  const norm = (method || '').toLowerCase().replace(/\s+/g, '')
  const logo = WalletLogos[norm as keyof typeof WalletLogos]
  if (logo) return logo
  return <CreditCard className="h-[18px] w-[18px] text-slate-500" />
}

function truncateMid(str: string, head = 8, tail = 6): string {
  if (!str || str.length <= head + tail + 3) return str
  return `${str.slice(0, head)}…${str.slice(-tail)}`
}

export default function StaffPaymentDetailModal({
  payment,
  isLoading = false,
  onClose,
  onAcknowledge,
  isAcknowledging = false,
}: {
  payment: StaffPaymentRecord | null
  isLoading?: boolean
  onClose: () => void
  onAcknowledge?: (paymentId: string, options?: { isForce?: boolean }) => void
  isAcknowledging?: boolean
}) {
  const { t, currentLanguage } = useTranslation()
  const { showToast } = useNotification()
  const { data: categories = [] } = useStaffCategories()
  const setCategoryMutation = useSetStaffPaymentCategory()
  const createCategoryMutation = useCreateStaffCategory()
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false)
  const [addCategoryError, setAddCategoryError] = useState<string | null>(null)

  if (!payment && !isLoading) return null

  const handleCategoryChange = (categoryId: string | null) => {
    if (!payment?.id) return
    setCategoryMutation.mutate(
      { paymentId: payment.id, categoryId },
      { onError: (err) => showToast(getErrorMessage(err, t), 'error') },
    )
  }

  const handleCreateCategory = (name: string) => {
    createCategoryMutation.mutate(name, {
      onSuccess: (category) => {
        setIsAddCategoryOpen(false)
        setAddCategoryError(null)
        if (payment?.id) {
          setCategoryMutation.mutate(
            { paymentId: payment.id, categoryId: category.id },
            { onError: (err) => showToast(getErrorMessage(err, t), 'error') },
          )
        }
      },
      onError: (err) => setAddCategoryError(getErrorMessage(err, t)),
    })
  }

  const paymentStatus = payment ? normalizePaymentStatusValue(payment.status) : PaymentStatus.Initiated
  const awaitingAck = payment ? needsStaffAcknowledge(payment) : false
  const completed = payment ? isStaffDirectPaymentRecordCompleted(payment) : false
  const canForce = payment ? canForceComplete(payment) : false
  const waitingCustomer = payment
    ? paymentStatus === PaymentStatus.Initiated && !payment.customerConfirmedAt
    : false

  const handleAcknowledge = () => {
    if (!payment?.id || isAcknowledging || !onAcknowledge) return
    onAcknowledge(payment.id)
  }

  const handleForceAcknowledge = () => {
    if (!payment?.id || isAcknowledging || !onAcknowledge) return
    onAcknowledge(payment.id, { isForce: true })
  }

  return (
    <>
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/60 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="relative max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-t-2xl border border-nexoraBorder bg-white p-4 shadow-2xl sm:rounded-2xl sm:p-6">
        <div className="mb-4 flex items-center justify-between border-b border-nexoraBorder pb-4">
          <div>
            <span className="text-sm font-black uppercase tracking-wider text-nexoraMuted">
              {t('staff_payments.detail_title')}
            </span>
            <p className="mt-0.5 text-sm text-nexoraMuted">{t('staff_payments.detail_desc')}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-nexoraMuted transition-colors hover:bg-slate-100 hover:text-nexoraText"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-nexoraBrand" />
          </div>
        ) : payment ? (
          <div className="space-y-5">
            <div className="flex flex-col items-center justify-center rounded-xl border border-slate-100 bg-slate-50 py-4">
              <span className="text-sm font-bold uppercase tracking-wider text-nexoraMuted">
                {t('dashboard.activity_log.col_amount')}
              </span>
              <h3 className="mt-1 text-xl font-semibold tabular-nums text-nexoraText sm:text-3xl sm:font-black">{formatCurrency(payment.amount)}</h3>
              <div className="mt-2 flex flex-col items-center gap-1">
                <DirectPaymentStatusBadge status={paymentStatus} t={t} size="md" variant="staff" className="mt-0" />
                {!completed ? (
                  <p className="max-w-xs text-center text-sm leading-relaxed text-nexoraMuted">
                    {t(getDirectPaymentStatusDescKey(paymentStatus, 'staff'))}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-x-4 gap-y-4 border-t border-nexoraBorder pt-4 text-sm">
              <div>
                <span className="block text-sm font-bold text-nexoraMuted">
                  {t('dashboard.activity_log.col_id')}
                </span>
                <span className="mt-0.5 block font-mono text-sm font-semibold text-nexoraText" title={payment.id}>
                  {truncateMid(payment.id)}
                </span>
              </div>
              <div>
                <span className="block text-sm font-bold text-nexoraMuted">
                  {t('dashboard.activity_log.col_time')}
                </span>
                <span className="mt-0.5 block font-semibold text-nexoraText">
                  {formatTransactionDateTime(payment.createdAt, currentLanguage)}
                </span>
              </div>
              <div>
                <span className="block text-sm font-bold text-nexoraMuted">
                  {t('staff_payments.col_method')}
                </span>
                <div className="mt-1 flex items-center gap-1.5">
                  {getPaymentMethodLogo(payment.paymentMethodType)}
                  <span className="font-semibold text-nexoraText">{payment.paymentMethodType || '—'}</span>
                </div>
              </div>
              <DirectPaymentAccountField
                accountLabel={t('staff_payments.account_info')}
                assetLabel={t('staff_payments.asset')}
                accountInfo={payment.accountInfo}
                cryptoWallet={payment.cryptoWallet}
              />
              {payment.customerConfirmedAt || payment.staffConfirmedAt ? (
                <>
                  <div>
                    <span className="block text-sm font-bold text-nexoraMuted">
                      {t('staff_payments.customer_confirmed_at')}
                    </span>
                    <span className="mt-0.5 block font-semibold text-nexoraText">
                      {payment.customerConfirmedAt
                        ? formatTransactionDateTime(payment.customerConfirmedAt, currentLanguage)
                        : '—'}
                    </span>
                  </div>
                  <div>
                    <span className="block text-sm font-bold text-nexoraMuted">
                      {t('staff_payments.staff_confirmed_at')}
                    </span>
                    <span className="mt-0.5 block font-semibold text-nexoraText">
                      {payment.staffConfirmedAt
                        ? formatTransactionDateTime(payment.staffConfirmedAt, currentLanguage)
                        : '—'}
                    </span>
                  </div>
                </>
              ) : null}
            </div>

            <div className="border-t border-nexoraBorder pt-4">
              <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-nexoraMuted">
                {t('transaction_categories.category_label')}
              </span>
              <CategorySelect
                categories={categories}
                value={payment.categoryId ?? null}
                onChange={handleCategoryChange}
                onRequestCreateNew={() => setIsAddCategoryOpen(true)}
                disabled={setCategoryMutation.isPending}
              />
            </div>

            {canForce && onAcknowledge ? (
              <div className="space-y-3 rounded-xl border border-amber-200 bg-amber-50/70 p-4">
                <p className="text-sm font-semibold leading-normal text-amber-800">
                  {t('staff_payments.force_confirm_warning')}
                </p>
                <button
                  type="button"
                  onClick={handleForceAcknowledge}
                  disabled={isAcknowledging}
                  className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-amber-600 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-white transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isAcknowledging ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle className="h-4 w-4" />
                  )}
                  {t('staff_payments.force_confirm_receipt')}
                </button>
              </div>
            ) : waitingCustomer ? (
              <div className="flex items-center gap-2 rounded-xl border border-amber-100 bg-amber-50/70 px-3 py-2.5">
                <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-amber-600" />
                <p className="text-sm leading-normal text-amber-800">
                  {t('staff_payments.waiting_customer_confirm')}
                </p>
              </div>
            ) : null}

            {awaitingAck && onAcknowledge ? (
              <div className="space-y-3 rounded-xl border border-violet-100 bg-violet-50/50 p-4">
                <p className="text-sm leading-normal text-violet-700">
                  {t('staff_payments.confirm_receipt_help')}
                </p>
                <button
                  type="button"
                  onClick={handleAcknowledge}
                  disabled={isAcknowledging}
                  className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-nexoraBrand px-4 py-3 text-xs font-semibold uppercase tracking-wider text-white transition hover:bg-nexoraBrand/90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isAcknowledging ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle className="h-4 w-4" />
                  )}
                  {t('staff_payments.confirm_receipt')}
                </button>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
    <AddEditCategoryModal
      open={isAddCategoryOpen}
      mode="create"
      onSave={handleCreateCategory}
      onClose={() => {
        setIsAddCategoryOpen(false)
        setAddCategoryError(null)
      }}
      isSaving={createCategoryMutation.isPending}
      errorMessage={addCategoryError}
    />
    </>
  )
}
