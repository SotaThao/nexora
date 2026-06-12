// PageTitle — dashboard page heading + subtitle (i18n). Shared UI atom.
import { useTranslation } from '../../contexts/LanguageContext'

export default function PageTitle() {
  const { t } = useTranslation()
  return (
    <div>
      <h1 className="text-2xl font-extrabold tracking-normal text-nexoraText sm:text-3xl">{t('dashboard.title')}</h1>
      <p className="mt-2 text-sm font-medium text-nexoraMuted sm:text-base">
        {t('dashboard.subtitle')}
      </p>
    </div>
  )
}
