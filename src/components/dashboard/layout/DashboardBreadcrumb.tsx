import { useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from '../../../contexts/LanguageContext'

const SECTION_LABEL_KEYS = {
  staff: 'dashboard.menu.staff',
  tips: 'dashboard.menu.tips',
  reviews: 'dashboard.menu.reviews',
  reports: 'dashboard.menu.transactions',
  touchpoints: 'dashboard.menu.touchpoints',
  analytics: 'dashboard.menu.analytics',
  settings: 'dashboard.menu.settings',
  support: 'dashboard.menu.support',
  subscriptions: 'dashboard.sidebar.manage_plan',
  payments: 'dashboard.menu.payments',
}

export default function DashboardBreadcrumb() {
  const location = useLocation()
  const navigate = useNavigate()
  const { t } = useTranslation()

  const pathSegments = location.pathname.split('/').filter(Boolean)
  const section = pathSegments[1]

  if (!section) {
    return null
  }

  const labelKey = SECTION_LABEL_KEYS[section]
  const currentLabel = labelKey ? t(labelKey) : section

  return (
    <nav aria-label={t('dashboard.breadcrumb.aria_label')} className="mb-5 text-xs font-semibold">
      <button
        type="button"
        onClick={() => navigate('/dashboard')}
        className="inline-flex items-center gap-1 text-nexoraMuted transition hover:text-nexoraBrand"
      >
        <span aria-hidden="true">←</span>
        <span>{t('dashboard.menu.dashboard')}</span>
      </button>
      <span className="mx-1.5 text-nexoraSubtle" aria-hidden="true">/</span>
      <span className="text-nexoraText">{currentLabel}</span>
    </nav>
  )
}
