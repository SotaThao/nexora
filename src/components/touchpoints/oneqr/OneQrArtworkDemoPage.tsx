import { OneQrArtworkEditor } from './OneQrArtworkPage'
import { useTranslation } from '../../../contexts/LanguageContext'
import LanguageSwitcher from '../../ui/LanguageSwitcher'
import type { BusinessHourEntry } from '../../../types/domain'

const SAMPLE_HOURS: BusinessHourEntry[] = [
  { dayOfWeek: 'Monday', isOpen: true, openTime: '09:00:00', closeTime: '18:00:00' },
  { dayOfWeek: 'Tuesday', isOpen: true, openTime: '09:00:00', closeTime: '18:00:00' },
  { dayOfWeek: 'Wednesday', isOpen: true, openTime: '09:00:00', closeTime: '18:00:00' },
  { dayOfWeek: 'Thursday', isOpen: true, openTime: '09:00:00', closeTime: '18:00:00' },
  { dayOfWeek: 'Friday', isOpen: true, openTime: '09:00:00', closeTime: '18:00:00' },
  { dayOfWeek: 'Saturday', isOpen: true, openTime: '10:00:00', closeTime: '16:00:00' },
  { dayOfWeek: 'Sunday', isOpen: false },
]

export default function OneQrArtworkDemoPage() {
  const { t } = useTranslation()
  const sampleUrl = new URL('/preview/oneqr', window.location.origin).href

  return <main className="mx-auto w-full max-w-7xl space-y-5 px-4 py-6 sm:px-6">
    <div className="flex items-start justify-between gap-4">
      <div>
        <h1 className="text-xl font-black text-nexoraText">{t('oneqr.artwork.title')}</h1>
        <p className="mt-1 text-sm text-nexoraMuted">{t('oneqr.artwork.description')}</p>
      </div>
      <LanguageSwitcher />
    </div>
    <p role="note" className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950">
      {t('oneqr.artwork.demoNotice')}
    </p>
    <OneQrArtworkEditor
      url={sampleUrl}
      fileSlug="oneqr-sample-demo"
      businessName={t('oneqr.artwork.demoBusinessName')}
      isDemo
      hours={{ entries: SAMPLE_HOURS, isPending: false, isFetching: false, isError: false }}
    />
  </main>
}
