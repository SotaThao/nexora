import { useNavigate } from 'react-router-dom'
import { useTranslation } from '../../../contexts/LanguageContext'
import {
  STAFF_HOME_PATH,
  WORK_ORDERS_I18N,
  WORK_ORDERS_LAYOUT_CLASS,
  staffWorkOrdersPath,
  type WorkOrderSalon,
} from './constants'
import WorkOrderSalonCard from './WorkOrderSalonCard'
import WorkOrderWorkspaceBack from './WorkOrderWorkspaceBack'

interface StaffWorkOrderSalonPickerProps {
  salons: WorkOrderSalon[]
}

export default function StaffWorkOrderSalonPicker({ salons }: StaffWorkOrderSalonPickerProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()

  return (
    <div>
      <WorkOrderWorkspaceBack
        onBack={() => navigate(STAFF_HOME_PATH)}
        trailing={t(WORK_ORDERS_I18N.breadcrumbSalon)}
      />
      <h2 className={WORK_ORDERS_LAYOUT_CLASS.title}>
        {t(WORK_ORDERS_I18N.chooseTitle)}
      </h2>
      <p className={WORK_ORDERS_LAYOUT_CLASS.subtitle}>
        {t(WORK_ORDERS_I18N.chooseSubtitle)}
      </p>
      {salons.length === 0 ? (
        <div className={WORK_ORDERS_LAYOUT_CLASS.ticketEmpty}>
          <p className={WORK_ORDERS_LAYOUT_CLASS.emptyTitle}>{t(WORK_ORDERS_I18N.emptySalons)}</p>
          <p className={WORK_ORDERS_LAYOUT_CLASS.emptyBody}>{t(WORK_ORDERS_I18N.emptySalonsBody)}</p>
        </div>
      ) : (
        <div className={WORK_ORDERS_LAYOUT_CLASS.list}>
          {salons.map((salon) => (
            <WorkOrderSalonCard
              key={salon.id}
              salon={salon}
              onSelect={() => navigate(staffWorkOrdersPath(salon.id))}
            />
          ))}
        </div>
      )}
    </div>
  )
}
