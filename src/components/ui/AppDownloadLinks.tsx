import type { ReactElement } from 'react'
import { useTranslation } from '../../contexts/LanguageContext'

export const GOOGLE_PLAY_URL = 'https://play.google.com/store/apps/details?id=net.vlinkgroup.nexora'
export const APP_STORE_URL = 'https://apps.apple.com/us/app/nexora-touch/id6775340468'

type StoreId = 'android' | 'ios'
type AppDownloadLinksSize = 'compact' | 'full'

interface StoreLogoProps {
  className: string
}

function GooglePlayLogo({ className }: StoreLogoProps) {
  return (
    <svg className={className} viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#00D95F" d="M6.2 4.8C5.4 5.3 5 6.2 5 7.4v33.2c0 1.2.4 2.1 1.2 2.6L25 24 6.2 4.8z" />
      <path fill="#00A1FF" d="M6.2 4.8 25 24l5.7-5.8L10.1 6.4C8.6 5.5 7.3 4.9 6.2 4.8z" />
      <path fill="#FFCE00" d="M25 24 6.2 43.2c1.1-.1 2.4-.7 3.9-1.6l20.6-11.8L25 24z" />
      <path fill="#F44336" d="M30.7 18.2 25 24l5.7 5.8 9.5-5.4c2.4-1.4 2.4-3.4 0-4.8l-9.5-5.4z" />
    </svg>
  )
}

function AppStoreLogo({ className }: StoreLogoProps) {
  return (
    <svg className={className} viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="currentColor"
        d="M31.6 25.3c-.1-5.1 4.2-7.6 4.4-7.7-2.4-3.5-6.1-4-7.4-4.1-3.1-.3-6.1 1.8-7.7 1.8-1.6 0-4-1.8-6.6-1.7-3.4.1-6.5 2-8.2 5-3.5 6.1-.9 15.1 2.5 20 1.7 2.4 3.7 5.1 6.3 5 2.5-.1 3.5-1.6 6.5-1.6s3.9 1.6 6.6 1.6c2.7-.1 4.4-2.5 6-4.9 1.9-2.8 2.7-5.5 2.7-5.6-.1 0-5.1-2-5.1-7.8zM26.5 10.2c1.4-1.7 2.3-4 2-6.3-2 .1-4.5 1.4-5.9 3-1.3 1.5-2.4 3.9-2.1 6.2 2.3.2 4.6-1.2 6-2.9z"
      />
    </svg>
  )
}

const items: Record<
  StoreId,
  {
    id: StoreId
    href: string
    eyebrowKey: string
    titleKey: string
    Logo: (props: StoreLogoProps) => ReactElement
  }
> = {
  android: {
    id: 'android',
    href: GOOGLE_PLAY_URL,
    eyebrowKey: 'dashboard.sidebar.google_play_badge_eyebrow',
    titleKey: 'dashboard.sidebar.google_play_badge_title',
    Logo: GooglePlayLogo,
  },
  ios: {
    id: 'ios',
    href: APP_STORE_URL,
    eyebrowKey: 'dashboard.sidebar.app_store_badge_eyebrow',
    titleKey: 'dashboard.sidebar.app_store_badge_title',
    Logo: AppStoreLogo,
  },
}

const defaultOrder: StoreId[] = ['android', 'ios']

const sizeClasses: Record<
  AppDownloadLinksSize,
  {
    wrapper: string
    link: string
    logo: string
    eyebrow: string
    title: string
  }
> = {
  compact: {
    wrapper: 'flex min-w-0 shrink items-center justify-end gap-2 sm:w-auto sm:flex-wrap sm:gap-3',
    link: 'flex h-9 w-[6.25rem] items-center gap-1.5 rounded-md bg-black px-2 text-white shadow-sm ring-1 ring-black/10 transition hover:bg-slate-900 sm:h-10 sm:w-36 sm:gap-2 sm:px-3',
    logo: 'h-4 w-4 shrink-0 sm:h-6 sm:w-6',
    eyebrow: 'block truncate text-[5.5px] font-bold uppercase tracking-wide text-white/80 sm:text-[7px]',
    title: 'mt-0.5 block truncate text-[10px] font-extrabold tracking-tight text-white sm:text-[15px]',
  },
  full: {
    wrapper: 'flex flex-wrap items-center justify-center gap-3',
    link: 'flex h-11 w-36 items-center gap-2 rounded-md bg-black px-3 text-white shadow-md ring-1 ring-black/10 transition hover:bg-slate-900 sm:h-12 sm:w-40',
    logo: 'h-6 w-6 shrink-0',
    eyebrow: 'block truncate text-[7px] font-bold uppercase tracking-wide text-white/80',
    title: 'mt-0.5 block truncate text-[15px] font-extrabold tracking-tight text-white',
  },
}

interface AppDownloadLinksProps {
  size?: AppDownloadLinksSize
  order?: StoreId[]
  className?: string
}

export default function AppDownloadLinks({
  size = 'compact',
  order = defaultOrder,
  className = '',
}: AppDownloadLinksProps) {
  const { t } = useTranslation()
  const classes = sizeClasses[size]
  const wrapperClassName = className ? `${classes.wrapper} ${className}` : classes.wrapper

  return (
    <div className={wrapperClassName}>
      {order.map((storeId) => {
        const { id, href, eyebrowKey, titleKey, Logo } = items[storeId]
        const logoClassName = id === 'ios' ? `${classes.logo} text-white` : classes.logo

        return (
          <a
            key={id}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${t(eyebrowKey)} ${t(titleKey)}`}
            className={classes.link}
          >
            <Logo className={logoClassName} />
            <span className="min-w-0 leading-none">
              <span className={classes.eyebrow}>
                {t(eyebrowKey)}
              </span>
              <span className={classes.title}>
                {t(titleKey)}
              </span>
            </span>
          </a>
        )
      })}
    </div>
  )
}
