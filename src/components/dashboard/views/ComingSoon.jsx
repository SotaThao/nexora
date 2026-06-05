import { Sparkles } from 'lucide-react'
import { useTranslation } from '../../../contexts/LanguageContext'

function ComingSoon({ activeMenu, onBack }) {
  const { t } = useTranslation()
  const copy = {
    analytics: ['Advanced Analytics', 'Device conversion, return customer cohorts, and AI review summaries are planned for phase 3.'],
    subscriptions: ['Subscriptions', 'Manage NFC stand orders, renewal plans, and hardware add-ons from this workspace soon.'],
    settings: ['Settings', 'Shop preferences, webhook keys, and review destinations will be configured here.']
  }[activeMenu] || ['Feature In Progress', 'This module is being prepared for the Nexora Touch merchant dashboard.']

  return (
    <div className="flex min-h-[520px] items-center justify-center">
      <div className="max-w-md text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl border border-nexoraBorder bg-white text-nexoraBrand">
          <Sparkles className="h-9 w-9" />
        </div>
        <h2 className="mt-5 text-xl font-extrabold text-nexoraText">{copy[0]}</h2>
        <p className="mt-2 text-sm text-nexoraMuted">{copy[1]}</p>
        <button onClick={onBack} className="mt-5 rounded-lg bg-nexoraBrand px-5 py-2 text-xs font-bold text-white">
          {t('staff_detail.back_to_directory')}
        </button>
      </div>
    </div>
  )
}

export default ComingSoon
