import { useTranslation } from '../../contexts/LanguageContext'

function GooglePlayLogo() {
  return (
    <svg className="h-6 w-6 shrink-0" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#00D95F" d="M6.2 4.8C5.4 5.3 5 6.2 5 7.4v33.2c0 1.2.4 2.1 1.2 2.6L25 24 6.2 4.8z" />
      <path fill="#00A1FF" d="M6.2 4.8 25 24l5.7-5.8L10.1 6.4C8.6 5.5 7.3 4.9 6.2 4.8z" />
      <path fill="#FFCE00" d="M25 24 6.2 43.2c1.1-.1 2.4-.7 3.9-1.6l20.6-11.8L25 24z" />
      <path fill="#F44336" d="M30.7 18.2 25 24l5.7 5.8 9.5-5.4c2.4-1.4 2.4-3.4 0-4.8l-9.5-5.4z" />
    </svg>
  )
}

function AppStoreLogo() {
  return (
    <svg className="h-6 w-6 shrink-0 text-white" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="currentColor"
        d="M31.6 25.3c-.1-5.1 4.2-7.6 4.4-7.7-2.4-3.5-6.1-4-7.4-4.1-3.1-.3-6.1 1.8-7.7 1.8-1.6 0-4-1.8-6.6-1.7-3.4.1-6.5 2-8.2 5-3.5 6.1-.9 15.1 2.5 20 1.7 2.4 3.7 5.1 6.3 5 2.5-.1 3.5-1.6 6.5-1.6s3.9 1.6 6.6 1.6c2.7-.1 4.4-2.5 6-4.9 1.9-2.8 2.7-5.5 2.7-5.6-.1 0-5.1-2-5.1-7.8zM26.5 10.2c1.4-1.7 2.3-4 2-6.3-2 .1-4.5 1.4-5.9 3-1.3 1.5-2.4 3.9-2.1 6.2 2.3.2 4.6-1.2 6-2.9z"
      />
    </svg>
  )
}

const items = [
  {
    id: 'android',
    href: 'https://play.google.com/store/apps/details?id=net.vlinkgroup.nexora',
    eyebrowKey: 'dashboard.sidebar.google_play_badge_eyebrow',
    titleKey: 'dashboard.sidebar.google_play_badge_title',
    Logo: GooglePlayLogo,
  },
  {
    id: 'ios',
    href: 'https://apps.apple.com/us/app/nexora-touch/id6775340468',
    eyebrowKey: 'dashboard.sidebar.app_store_badge_eyebrow',
    titleKey: 'dashboard.sidebar.app_store_badge_title',
    Logo: AppStoreLogo,
  },
]

export default function AppDownloadLinks() {
  const { t } = useTranslation()

  return (
    <div className="flex flex-wrap items-center justify-center gap-3 sm:justify-end">
      {items.map(({ id, href, eyebrowKey, titleKey, Logo }) => (
        <a
          key={id}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${t(eyebrowKey)} ${t(titleKey)}`}
          className="flex h-11 w-40 items-center gap-2 rounded-md bg-black px-3 text-white shadow-sm ring-1 ring-black/10 transition hover:bg-slate-900 sm:h-10 sm:w-36"
        >
          <Logo />
          <span className="min-w-0 leading-none">
            <span className="block truncate text-[7px] font-bold uppercase tracking-wide text-white/80">
              {t(eyebrowKey)}
            </span>
            <span className="mt-0.5 block truncate text-[15px] font-extrabold tracking-tight text-white">
              {t(titleKey)}
            </span>
          </span>
        </a>
      ))}
    </div>
  )
}
