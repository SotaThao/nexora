import { ChevronLeft } from 'lucide-react'
import { useTranslation } from '../../../contexts/LanguageContext'
import {
  WORK_ORDERS_BREADCRUMB_SEPARATOR,
  WORK_ORDERS_I18N,
  WORK_ORDERS_LAYOUT_CLASS,
} from './constants'

interface WorkOrderWorkspaceBackProps {
  onBack: () => void
  trailing?: string
}

export default function WorkOrderWorkspaceBack({ onBack, trailing }: WorkOrderWorkspaceBackProps) {
  const { t } = useTranslation()

  return (
    <div className={WORK_ORDERS_LAYOUT_CLASS.breadcrumbRow}>
      <button
        type="button"
        className={WORK_ORDERS_LAYOUT_CLASS.breadcrumbBack}
        onClick={onBack}
      >
        {trailing ? (
          <ChevronLeft className={WORK_ORDERS_LAYOUT_CLASS.breadcrumbIcon} aria-hidden="true" />
        ) : null}
        <span>{t(WORK_ORDERS_I18N.breadcrumbWorkspace)}</span>
      </button>
      {trailing ? (
        <>
          <span aria-hidden="true">{WORK_ORDERS_BREADCRUMB_SEPARATOR}</span>
          <span className={WORK_ORDERS_LAYOUT_CLASS.breadcrumbCurrent}>{trailing}</span>
        </>
      ) : null}
    </div>
  )
}
