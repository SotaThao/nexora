import { Sparkles } from 'lucide-react'
import { useTranslation } from '../../../contexts/LanguageContext'

function ComingSoon({ activeMenu, onBack }) {
  const { t } = useTranslation()
  const copyMap = {
    analytics: [t('coming_soon.analytics_title'), t('coming_soon.analytics_desc')],
    subscriptions: [t('coming_soon.subscriptions_title'), t('coming_soon.subscriptions_desc')],
    settings: [t('coming_soon.settings_title'), t('coming_soon.settings_desc')],
  }
  const copy = copyMap[activeMenu] || [t('coming_soon.default_title'), t('coming_soon.default_desc')]

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
