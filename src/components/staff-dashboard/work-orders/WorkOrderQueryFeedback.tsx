import { useTranslation } from '../../../contexts/LanguageContext'
import { WORK_ORDERS_I18N, WORK_ORDERS_LAYOUT_CLASS } from './constants'

interface WorkOrderErrorCardProps {
  message?: string
  actionLabel?: string
  onAction: () => void
}

export function WorkOrderErrorCard({ message, actionLabel, onAction }: WorkOrderErrorCardProps) {
  const { t } = useTranslation()

  return (
    <div className={WORK_ORDERS_LAYOUT_CLASS.errorCard} role="alert">
      <p className={WORK_ORDERS_LAYOUT_CLASS.errorText}>
        {message ?? t(WORK_ORDERS_I18N.loadError)}
      </p>
      <button
        type="button"
        className={WORK_ORDERS_LAYOUT_CLASS.retryButton}
        onClick={onAction}
      >
        {actionLabel ?? t(WORK_ORDERS_I18N.retry)}
      </button>
    </div>
  )
}
