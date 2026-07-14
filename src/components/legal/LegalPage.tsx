import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from '../../contexts/LanguageContext'
import BackToHomeButton from '../ui/BackToHomeButton'
import LanguageSwitcher from '../ui/LanguageSwitcher'
import { getLegalSections, LegalSectionBody, LegalSectionList, type LegalDocType } from './legalContent'

const TITLE_KEYS: Record<LegalDocType, string> = {
  privacy: 'components.register.modals.TermsModal.privacyPolicy',
  terms: 'components.register.modals.TermsModal.termsOfService',
}

const TAGLINE_KEYS: Record<LegalDocType, string> = {
  privacy: 'register.legal.privacyTagline',
  terms: 'register.legal.termsTagline',
}

export default function LegalPage({ type }: { type: LegalDocType }) {
  const { t, currentLanguage } = useTranslation()
  const [searchParams] = useSearchParams()
  const sections = getLegalSections(type, currentLanguage)
  const title = t(TITLE_KEYS[type])
  const tagline = t(TAGLINE_KEYS[type])
  const effectiveDateLabel = t('register.legal.effectiveDateLabel')
  const lastUpdatedLabel = t('register.legal.lastUpdatedLabel')
  const effectiveDate = t('register.legal.effectiveDate')
  const lastUpdated = t('register.legal.lastUpdated')
  const returnTo = searchParams.get('returnTo') || ''
  const safeReturnTo = returnTo.startsWith('/') && !returnTo.startsWith('//') ? returnTo : ''

  // Router-level scrollToPageTop can fire before this lazy page commits, and the
  // global `scroll-behavior: smooth` lets that scroll get canceled mid-flight —
  // so force an instant scroll once the page content is actually mounted.
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [])

  useEffect(() => {
    const previousTitle = document.title
    const previousLang = document.documentElement.lang
    document.title = `${title} | NEXORA TOUCH`
    document.documentElement.lang = currentLanguage
    return () => {
      document.title = previousTitle
      document.documentElement.lang = previousLang
    }
  }, [title, currentLanguage])

  return (
    <main className="min-h-dvh bg-nexoraCanvas">
      <section className="relative overflow-hidden bg-nexoraSurface">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-flox-gradient-a opacity-20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-flox-gradient-b opacity-20 blur-3xl" />

        <div className="absolute left-[max(1rem,env(safe-area-inset-left,0px))] top-[max(1rem,env(safe-area-inset-top,0px))] z-50">
          <BackToHomeButton
            to={safeReturnTo || '/'}
            labelKey={safeReturnTo ? 'common.back' : 'common.back_to_home'}
          />
        </div>
        <div className="absolute right-[max(1rem,env(safe-area-inset-right,0px))] top-[max(1rem,env(safe-area-inset-top,0px))] z-50">
          <LanguageSwitcher />
        </div>

        <div className="relative mx-auto flex max-w-3xl flex-col items-center px-4 pb-12 pt-20 text-center sm:pb-16 sm:pt-24">
          <img
            src="/homepage/assets/images/logo-light-mode.png"
            alt="NEXORA TOUCH"
            className="h-10 w-auto sm:h-12"
          />
          <h1 className="mt-6 text-3xl font-extrabold text-nexoraText sm:text-4xl">{title}</h1>
          <div className="mt-6 flex flex-col items-center gap-1.5 text-xs text-nexoraMuted sm:mt-8 sm:text-sm">
            <span className="whitespace-nowrap">
              <span className="font-semibold text-nexoraText">{effectiveDateLabel}:</span> {effectiveDate}
            </span>
            <span className="whitespace-nowrap">
              <span className="font-semibold text-nexoraText">{lastUpdatedLabel}:</span> {lastUpdated}
            </span>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="space-y-8">
          {sections.map((section) => (
            <section key={section.title}>
              <h2 className="mb-2 text-lg font-bold text-nexoraText sm:text-xl">{section.title}</h2>
              <div className="space-y-2 text-sm leading-relaxed text-nexoraMuted sm:text-base">
                <LegalSectionBody text={section.body} />
                {section.items ? <LegalSectionList items={section.items} /> : null}
                {section.note ? <LegalSectionBody text={section.note} /> : null}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-12 flex justify-center border-t border-nexoraBorder pt-6">
          <BackToHomeButton
            to={safeReturnTo || '/'}
            labelKey={safeReturnTo ? 'common.back' : 'common.back_to_home'}
          />
        </div>
      </div>
    </main>
  )
}
