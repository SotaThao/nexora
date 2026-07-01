import { useTranslation } from '../../../contexts/LanguageContext'
import ReportsView from '../../dashboard/views/ReportsView'

export default function StaffTransactions() {
  const { t } = useTranslation()

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-extrabold text-nexoraText">
          {t('staff_dashboard.transactions.title')}
        </h2>
        <p className="mt-1 text-xs text-nexoraMuted">
          {t('staff_dashboard.transactions.tips_subtitle')}
        </p>
      </div>

      <ReportsView audience="staff" showPageHeader={false} />
    </div>
  )
}
