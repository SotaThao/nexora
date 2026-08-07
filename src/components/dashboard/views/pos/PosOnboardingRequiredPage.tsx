import { useNavigate } from 'react-router-dom'
import { AlertCircle, ArrowRight, Rocket } from 'lucide-react'
import { useTranslation } from '../../../../contexts/LanguageContext'

/**
 * Sole content rendered for every POS route while the merchant has not
 * finished onboarding — replaces the actual POS screen entirely (see
 * PosOnboardingLayout). POS submenu items are hidden for the same reason
 * (DashboardSidebar.tsx / MobileMenuDrawer.tsx), so this is the only POS
 * surface reachable until onboarding completes.
 */
export default function PosOnboardingRequiredPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <div className="relative max-w-md overflow-hidden rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-amber-50/50 p-8 text-center shadow-sm">
        <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
          <AlertCircle className="h-6 w-6 text-amber-700" />
        </span>

        <h2 className="text-lg font-black text-nexoraText">
          {t('components.dashboard.views.pos.PosOnboardingRequiredPage.title')}
        </h2>
        <p className="mt-2 text-sm text-nexoraMuted">
          {t('components.dashboard.views.pos.PosOnboardingRequiredPage.description')}
        </p>

        <button
          type="button"
          onClick={() => navigate('/onboarding')}
          className="group mt-6 inline-flex items-center gap-2 rounded-xl bg-amber-600 px-6 py-3 text-xs font-bold uppercase tracking-wider text-white shadow-sm transition-all hover:bg-amber-700 active:scale-95"
        >
          <Rocket className="h-4 w-4" />
          <span>{t('components.dashboard.views.pos.PosOnboardingRequiredPage.cta')}</span>
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </button>
      </div>
    </div>
  )
}
