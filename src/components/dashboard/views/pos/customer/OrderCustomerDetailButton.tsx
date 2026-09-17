import { useRef, useState } from 'react'
import { Eye, Loader2 } from 'lucide-react'
import { useTranslation } from '../../../../../contexts/LanguageContext'
import { useNotification } from '../../../../../contexts/NotificationContext'
import { usePosOrderCustomerId } from '../../../../../data/hooks/usePosCustomers'
import CustomerDetailModal from './CustomerDetailModal'

const TK = 'components.dashboard.views.pos.PosOrderWorkspace.'

export default function OrderCustomerDetailButton({
  businessId,
  orderId,
  phoneE164,
}: {
  businessId: string
  orderId: string
  phoneE164?: string | null
}) {
  const { t } = useTranslation()
  const { showToast } = useNotification()
  const triggerRef = useRef<HTMLButtonElement>(null)
  const openingRef = useRef(false)
  const [customerId, setCustomerId] = useState<string | null>(null)
  const { refetch, isFetching } = usePosOrderCustomerId(businessId, orderId, phoneE164 ?? undefined)

  const openCustomerDetail = async () => {
    if (openingRef.current || !phoneE164) return
    openingRef.current = true
    try {
      const result = await refetch()
      if (result.isError) {
        showToast(t(TK + 'customerDetailsLoadFailed'), 'error', 5000)
      } else if (result.data) {
        setCustomerId(result.data)
      } else {
        showToast(t(TK + 'customerDetailsUnavailable'), 'info', 5000)
      }
    } finally {
      openingRef.current = false
    }
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={openCustomerDetail}
        disabled={!phoneE164 || isFetching}
        aria-haspopup="dialog"
        aria-busy={isFetching}
        title={!phoneE164 ? t(TK + 'customerDetailsUnavailable') : undefined}
        className="inline-flex h-6 shrink-0 items-center gap-1 rounded-lg px-1 text-xs font-medium text-nexoraMuted underline decoration-nexoraMuted/40 underline-offset-4 hover:text-nexoraBrand hover:decoration-nexoraBrand hover:!shadow-none hover:![translate:0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nexoraBrand disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isFetching ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
        ) : (
          <Eye className="h-3.5 w-3.5" aria-hidden="true" />
        )}
        {t('common.view')}
      </button>
      {customerId ? (
        <CustomerDetailModal
          businessId={businessId}
          customerId={customerId}
          onClose={() => {
            setCustomerId(null)
            triggerRef.current?.focus()
          }}
        />
      ) : null}
    </>
  )
}
