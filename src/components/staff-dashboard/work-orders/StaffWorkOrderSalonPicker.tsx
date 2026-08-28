import { useNavigate } from 'react-router-dom'
import { useTranslation } from '../../../contexts/LanguageContext'
import {
  WORK_ORDERS_BREADCRUMB_SEPARATOR,
  WORK_ORDERS_I18N,
  WORK_ORDERS_LAYOUT_CLASS,
  staffWorkOrdersPath,
} from './constants'
import { WORK_ORDER_SALON_MOCKS } from './workOrderMocks'
import WorkOrderSalonCard from './WorkOrderSalonCard'

export default function StaffWorkOrderSalonPicker() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  return (
    <div>
      <p className={WORK_ORDERS_LAYOUT_CLASS.breadcrumb}>
        {t(WORK_ORDERS_I18N.breadcrumbWorkspace)}
        {WORK_ORDERS_BREADCRUMB_SEPARATOR}
        {t(WORK_ORDERS_I18N.breadcrumbSalon)}
      </p>
      <h2 className={WORK_ORDERS_LAYOUT_CLASS.title}>
        {t(WORK_ORDERS_I18N.chooseTitle)}
      </h2>
      <p className={WORK_ORDERS_LAYOUT_CLASS.subtitle}>
        {t(WORK_ORDERS_I18N.chooseSubtitle)}
      </p>
      <div className={WORK_ORDERS_LAYOUT_CLASS.list}>
        {WORK_ORDER_SALON_MOCKS.map((salon) => (
          <WorkOrderSalonCard
            key={salon.id}
            salon={salon}
            onSelect={() => navigate(staffWorkOrdersPath(salon.id))}
          />
        ))}
      </div>
    </div>
  )
}
