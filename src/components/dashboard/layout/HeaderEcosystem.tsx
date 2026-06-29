import { useEffect, useMemo, useRef, useState, type SyntheticEvent } from 'react'
import { useAuth } from '../../../auth/useAuth'
import { useTranslation } from '../../../contexts/LanguageContext'
import { useEcosystemSignIn, useEcosystems } from '../../../data/hooks/useEcosystem'
import {
  buildEcosystemCatalog,
  closeWindowIfOpen,
  isComingSoonEcosystem,
  isValidEcosystemRedirectUrl,
  openUrlInNewTab,
  openWindowOrFallback,
  updateWindowUrl,
} from '../../../utils/ecosystem'
import type { EcosystemCatalogEntry } from '../../../utils/ecosystem'
import IconButton from '../../ui/IconButton'

export default function HeaderEcosystem() {
  const { t } = useTranslation()
  const { status } = useAuth()
  const isAuthenticated = status === 'authenticated'
  const wrapperRef = useRef<HTMLDivElement>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [selectedName, setSelectedName] = useState<string | null>(null)
  const [pulseName, setPulseName] = useState<string | null>(null)

  const { data: ecosystems = [], isLoading } = useEcosystems({ enabled: isOpen })
  const signInMutation = useEcosystemSignIn()

  const catalogItems = useMemo(() => buildEcosystemCatalog(ecosystems), [ecosystems])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (!isOpen) return undefined
    const isMobile = window.matchMedia('(max-width: 767px)').matches
    if (!isMobile) return undefined
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [isOpen])

  const handleLogoError = (event: SyntheticEvent<HTMLImageElement>) => {
    event.currentTarget.src = '/assets/images/default.png'
  }

  const handleEcosystemClick = async (ecosystem: EcosystemCatalogEntry) => {
    if (isComingSoonEcosystem(ecosystem)) return

    if (!isAuthenticated) {
      if (isValidEcosystemRedirectUrl(ecosystem.url)) {
        openUrlInNewTab(ecosystem.url)
      }
      return
    }

    if (!ecosystem.id) return

    setSelectedName(ecosystem.name)
    const newTab = openWindowOrFallback('about:blank')

    try {
      const response = await signInMutation.mutateAsync({ id: ecosystem.id })
      if (isValidEcosystemRedirectUrl(response.redirectUrl)) {
        if (newTab && !newTab.closed) {
          updateWindowUrl(newTab, response.redirectUrl)
        } else {
          openUrlInNewTab(response.redirectUrl)
        }
        return
      }
      closeWindowIfOpen(newTab)
    } catch {
      closeWindowIfOpen(newTab)
    } finally {
      setSelectedName(null)
    }
  }

  const handleActivate = (ecosystem: EcosystemCatalogEntry) => {
    setPulseName(ecosystem.name)
    window.setTimeout(() => setPulseName(null), 480)
    void handleEcosystemClick(ecosystem)
  }

  return (
    <div ref={wrapperRef} className="relative inline-flex">
      <IconButton
        label={t('dashboard.header.ecosystem')}
        onClick={() => setIsOpen((value) => !value)}
        className={isOpen ? 'bg-nexoraSurfaceMuted' : ''}
        aria-expanded={isOpen}
      >
        <img src="/assets/icon_eco.svg" alt="" className="h-[22px] w-[22px]" />
      </IconButton>

      {isOpen && (
        <>
          <button
            type="button"
            aria-label="Close ecosystem menu"
            className="fixed inset-0 z-40 bg-black/25 md:hidden"
            onClick={() => setIsOpen(false)}
          />

          <div className="fixed left-1/2 top-[4.5rem] z-50 flex w-[min(500px,calc(100vw-24px))] max-h-[min(80vh,calc(100dvh-5.5rem))] -translate-x-1/2 flex-col gap-3 overflow-y-auto rounded-xl border border-nexoraBorder bg-white px-3.5 pb-[18px] pt-4 shadow-2xl md:absolute md:left-auto md:right-0 md:top-[calc(100%+0.75rem)] md:max-h-none md:w-[min(500px,calc(100vw-20px))] md:max-w-[500px] md:translate-x-0 md:overflow-visible">
            <p className="text-left text-sm font-bold text-[#414141]">{t('dashboard.header.ecosystem')}</p>

            {isLoading ? (
              <div className="w-full py-4 text-center text-sm text-nexoraSubtle">
                {t('dashboard.header.ecosystem_loading')}
              </div>
            ) : (
              <div className="grid w-full grid-cols-3 gap-3 sm:grid-cols-5 sm:gap-2">
                {catalogItems.map((ecosystem) => {
                  const comingSoon = isComingSoonEcosystem(ecosystem)
                  const processing = selectedName === ecosystem.name

                  return (
                    <button
                      key={ecosystem.brandKey}
                      type="button"
                      disabled={comingSoon}
                      aria-disabled={comingSoon}
                      tabIndex={comingSoon ? -1 : undefined}
                      title={comingSoon ? t('dashboard.header.coming_soon_badge') : ecosystem.name}
                      onClick={() => handleActivate(ecosystem)}
                      style={{
                        opacity: comingSoon ? 0.6 : undefined,
                        cursor: comingSoon ? 'not-allowed' : undefined,
                        pointerEvents: comingSoon ? 'none' : undefined,
                      }}
                      className={`group relative flex min-w-0 flex-col items-center justify-start border-none bg-transparent p-0 text-center transition-transform duration-150 ${
                        processing ? 'pointer-events-none opacity-85' : ''
                      } ${pulseName === ecosystem.name ? 'animate-eco-pulse' : ''}`}
                    >
                      <span className="relative mx-auto flex aspect-square w-full max-w-[88px] items-center justify-center rounded-xl border border-transparent bg-white p-1 transition group-hover:border-[#bfdbfe] group-hover:bg-[#f8fbff] group-hover:shadow-[0_2px_8px_rgba(59,130,246,0.1)] group-focus-visible:border-[#bfdbfe] group-focus-visible:bg-[#f8fbff] group-focus-visible:shadow-[0_2px_8px_rgba(59,130,246,0.1)] sm:max-w-[80px]">
                        <img
                          src={ecosystem.logoUrl}
                          alt={ecosystem.name}
                          onError={handleLogoError}
                          className="block h-auto max-h-[72px] w-full object-contain transition group-hover:scale-[1.02] group-focus-visible:scale-[1.02]"
                        />
                        {processing && (
                          <span className="absolute inset-0 flex items-center justify-center rounded-lg bg-white/85">
                            <span className="h-6 w-6 animate-spin rounded-full border-[3px] border-[#e0e0e0] border-t-[#3366ff]" />
                          </span>
                        )}
                      </span>
                      {comingSoon && (
                        <span className="mt-1 inline-flex max-w-full items-center justify-center rounded-full border border-[#bfdbfe] bg-[#eef5ff] px-2 py-0.5 text-[0.58rem] font-medium leading-tight text-[#2563eb] shadow-[0_1px_3px_rgba(37,99,235,0.12)] sm:px-3 sm:py-1 sm:text-[0.62rem]">
                          {t('dashboard.header.coming_soon_badge')}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
