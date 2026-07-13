import { useTranslation } from '../../../contexts/LanguageContext'
import { buildPublicQrImageUrl } from '../../../utils/qrUtils'
import AppDownloadLinks, {
  APP_STORE_URL,
  GOOGLE_PLAY_URL,
} from '../../ui/AppDownloadLinks'
import {
  homepageTranslations,
  type HomePageTranslationKey,
} from '../i18n/homepageTranslations'

type DownloadQrItem = {
  id: 'ios' | 'android'
  href: string
  altKey: HomePageTranslationKey
  labelKey: HomePageTranslationKey
}

const downloadQrItems: DownloadQrItem[] = [
  {
    id: 'ios',
    href: APP_STORE_URL,
    altKey: 'download-app-ios-qr-alt',
    labelKey: 'download-app-ios-qr-label',
  },
  {
    id: 'android',
    href: GOOGLE_PLAY_URL,
    altKey: 'download-app-android-qr-alt',
    labelKey: 'download-app-android-qr-label',
  },
]

function getHomepageCopy(lang: 'en' | 'vi', key: HomePageTranslationKey) {
  return homepageTranslations[lang]?.[key] || homepageTranslations.en[key] || key
}

export default function HomePageDownloadAppSection() {
  const { currentLanguage } = useTranslation()
  const copy = (key: HomePageTranslationKey) => getHomepageCopy(currentLanguage, key)

  return (
    <section
      className="ds-section bg-gradient-to-br from-brandCyan via-blue to-nexoraElectric py-16 sm:py-20 lg:py-24"
      id="download-app"
    >
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:px-8">
        <div className="mx-auto max-w-xl text-center lg:mx-0 lg:text-left">
          <h2
            className="text-3xl font-black leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl"
            data-i18n="download-app-title"
          >
            {copy('download-app-title')}
          </h2>
          <p
            className="mt-5 text-sm font-semibold leading-relaxed text-white/90 sm:text-base"
            data-i18n="download-app-desc"
          >
            {copy('download-app-desc')}
          </p>
        </div>

        <div className="mx-auto grid w-full max-w-sm grid-cols-2 items-start gap-5 sm:max-w-md sm:gap-6 lg:mx-0">
          {downloadQrItems.map((item) => (
            <div key={item.id} className="flex min-w-0 flex-col items-center gap-3">
              <a
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={copy(item.labelKey)}
                className="rounded-2xl bg-white p-3 shadow-lg ring-1 ring-black/10 transition hover:-translate-y-0.5 hover:shadow-xl"
              >
                <img
                  src={buildPublicQrImageUrl(item.href, 240)}
                  alt={copy(item.altKey)}
                  className="h-32 w-32 object-contain sm:h-40 sm:w-40"
                  loading="lazy"
                  decoding="async"
                />
              </a>
              <AppDownloadLinks
                size="full"
                order={[item.id]}
                className="w-full justify-center"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
