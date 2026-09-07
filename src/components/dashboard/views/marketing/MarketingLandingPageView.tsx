import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { ArrowRight, Check, Eye, Image, Link as LinkIcon, Save } from 'lucide-react'
import { useTranslation } from '../../../../contexts/LanguageContext'
import { useNotification } from '../../../../contexts/NotificationContext'
import {
  useMarketingLandingPages,
  useSaveMarketingLandingPage,
} from '../../../../data/hooks/useMarketingLandingPages'
import {
  MARKETING_DEMO_IMAGES,
  validateLandingContent,
  type LandingPageContent,
  type MarketingLandingPage,
} from '../../../../data/repositories/marketingLandingPages'
import {
  formatNationalNumber,
  getNationalPhonePlaceholder,
  PhoneDialCode,
} from '../../../CountryCodeSelect'
import LandingPagePreview from './LandingPagePreview'

export interface MarketingBannerSelection {
  imageUrl: string
  name: string
  selectionId: number
}
export interface MarketingLandingPageViewHandle {
  createNew: () => void
}
interface Props {
  banner: MarketingBannerSelection | null
  onUseInCampaign: (id: string) => void
  onDirtyChange: (dirty: boolean) => void
  onPendingChange: (pending: boolean) => void
}

const fieldClass =
  'min-h-11 w-full rounded-xl border border-nexoraBorder bg-nexoraCanvas px-3 py-2.5 text-sm text-nexoraText placeholder:text-nexoraSubtle disabled:opacity-60'
const buttonClass =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-nexoraBorder px-4 py-2.5 text-sm font-semibold text-nexoraText transition hover:bg-nexoraSurfaceMuted disabled:cursor-not-allowed disabled:opacity-50'
const blankContent = (): LandingPageContent => ({
  name: '',
  title: '',
  subtitle: '',
  offer: '',
  imageUrl: MARKETING_DEMO_IMAGES[0],
  bookingEnabled: false,
  bookingUrl: '',
  callEnabled: false,
  phone: '',
  expiresOn: '',
  countdownEnabled: false,
})

const MarketingLandingPageView = forwardRef<MarketingLandingPageViewHandle, Props>(function MarketingLandingPageView(
  { banner, onUseInCampaign, onDirtyChange, onPendingChange },
  ref,
) {
  const { t } = useTranslation()
  const { showToast } = useNotification()
  const pagesQuery = useMarketingLandingPages()
  const saveMutation = useSaveMarketingLandingPage()
  const [selectedId, setSelectedId] = useState<string | undefined>()
  const [content, setContent] = useState<LandingPageContent>(blankContent)
  const [initialized, setInitialized] = useState(false)
  const [previewVersion, setPreviewVersion] = useState<'draft' | 'published'>('draft')
  const [previewWidth, setPreviewWidth] = useState<'mobile' | 'desktop'>('mobile')
  const [error, setError] = useState<string | null>(null)
  const previewRef = useRef<HTMLDivElement>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const saveLock = useRef(false)
  const lastBanner = useRef<number | null>(null)
  const pages = pagesQuery.data ?? []
  const selectedPage = pages.find((page) => page.id === selectedId)
  const previewContent =
    previewVersion === 'published' && selectedPage?.published ? selectedPage.published : content
  const dirty = JSON.stringify(content) !== JSON.stringify(selectedPage?.draft ?? blankContent())
  const hasUnpublishedChanges =
    selectedPage?.published && JSON.stringify(content) !== JSON.stringify(selectedPage.published)

  useEffect(() => {
    onDirtyChange(dirty)
  }, [dirty, onDirtyChange])

  useEffect(() => {
    onPendingChange(saveMutation.isPending)
  }, [saveMutation.isPending, onPendingChange])

  useEffect(() => {
    if (banner && lastBanner.current !== banner.selectionId) {
      lastBanner.current = banner.selectionId
      setSelectedId(undefined)
      setContent({
        ...blankContent(),
        imageUrl: banner.imageUrl,
        name: banner.name || t('marketingSuite.newLanding'),
        title: t('marketingSuite.defaultTitle'),
        subtitle: t('marketingSuite.defaultSubtitle'),
        offer: t('marketingSuite.defaultOffer'),
      })
      setPreviewVersion('draft')
      setError(null)
      setInitialized(true)
    } else if (!initialized && pages[0]) {
      setSelectedId(pages[0].id)
      setContent({ ...pages[0].draft })
      setInitialized(true)
    }
  }, [banner, initialized, pages, t])

  const update = <K extends keyof LandingPageContent>(key: K, value: LandingPageContent[K]) => {
    setContent((current) => ({ ...current, [key]: value }))
    setPreviewVersion('draft')
    setError(null)
  }

  const save = async (publish: boolean): Promise<MarketingLandingPage | undefined> => {
    if (saveLock.current) return
    const validation = publish
      ? validateLandingContent(content)
      : !content.name.trim()
        ? 'nameRequired'
        : null
    if (validation) {
      setError(t(`marketingSuite.errors.${validation}`))
      formRef.current?.scrollIntoView({ block: 'start', behavior: 'smooth' })
      return
    }
    saveLock.current = true
    setError(null)
    try {
      const page = await saveMutation.mutateAsync({ id: selectedId, content, publish })
      setSelectedId(page.id)
      setContent({ ...page.draft })
      setPreviewVersion(publish ? 'published' : 'draft')
      showToast(t(publish ? 'marketingSuite.publishedSuccess' : 'marketingSuite.savedSuccess'))
      return page
    } catch {
      setError(t('marketingSuite.errors.saveFailed'))
    } finally {
      saveLock.current = false
    }
  }

  const selectPage = (page: MarketingLandingPage, version: 'draft' | 'published' = 'draft') => {
    setSelectedId(page.id)
    setContent({ ...page.draft })
    setPreviewVersion(version)
    setError(null)
    if (version === 'published')
      previewRef.current?.scrollIntoView({ block: 'start', behavior: 'smooth' })
  }

  const createNew = () => {
    setSelectedId(undefined)
    setContent({
      ...blankContent(),
      name: t('marketingSuite.newLanding'),
      title: t('marketingSuite.defaultTitle'),
      subtitle: t('marketingSuite.defaultSubtitle'),
      offer: t('marketingSuite.defaultOffer'),
    })
    setInitialized(true)
    setPreviewVersion('draft')
    setError(null)
  }

  useImperativeHandle(ref, () => ({ createNew }), [createNew])

  if (pagesQuery.isLoading)
    return (
      <p role="status" className="py-10 text-nexoraMuted">
        {t('marketingSuite.loading')}
      </p>
    )
  if (pagesQuery.isError)
    return (
      <div role="alert" className="space-y-3">
        <p>{t('marketingSuite.errors.loadFailed')}</p>
        <button type="button" className={buttonClass} onClick={() => pagesQuery.refetch()}>
          {t('marketingSuite.retry')}
        </button>
      </div>
    )

  return (
    <section className="space-y-6" aria-label={t('marketingSuite.landingPages')}>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {pages.map((page) => (
          <div
            key={page.id}
            className={`min-w-0 rounded-xl border bg-nexoraSurface p-4 ${selectedId === page.id ? 'border-nexoraBrand ring-1 ring-nexoraBrand' : 'border-nexoraBorder'}`}
          >
            <div className="flex items-start gap-3">
              <img
                src={page.draft.imageUrl}
                alt=""
                className="h-14 w-20 shrink-0 rounded-lg object-cover"
                width={80}
                height={56}
                loading="lazy"
              />
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-nexoraText">{page.draft.name}</p>
                <span className="mt-1 inline-flex rounded-full bg-nexoraSurfaceMuted px-2 py-1 text-xs font-semibold text-nexoraMuted">
                  {t(page.published ? 'marketingSuite.publishedDemo' : 'marketingSuite.draft')}
                </span>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                className={`${buttonClass} flex-1`}
                disabled={saveMutation.isPending || dirty}
                onClick={() => selectPage(page)}
              >
                {t('marketingSuite.editDraft')}
              </button>
              <button
                type="button"
                className={`${buttonClass} flex-1`}
                disabled={saveMutation.isPending || dirty}
                onClick={() => {
                  selectPage(page, page.published ? 'published' : 'draft')
                  previewRef.current?.scrollIntoView({ block: 'start', behavior: 'smooth' })
                }}
              >
                <Eye className="h-4 w-4" aria-hidden="true" />
                {t('marketingSuite.preview')}
              </button>
            </div>
          </div>
        ))}
      </div>
      {dirty && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl bg-nexoraSurfaceMuted px-4 py-3 text-sm text-nexoraMuted">
          <span>{t('marketingSuite.unsavedChanges')}</span>
          <button
            type="button"
            disabled={saveMutation.isPending}
            className="min-h-11 font-semibold text-nexoraBrand hover:underline"
            onClick={() => {
              setContent(selectedPage ? { ...selectedPage.draft } : blankContent())
              setError(null)
            }}
          >
            {t('marketingSuite.discardChanges')}
          </button>
        </div>
      )}
      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-2">
        <form
          ref={formRef}
          className="nexora-card space-y-5 p-5 sm:p-6"
          onSubmit={(event) => {
            event.preventDefault()
            void save(false)
          }}
          noValidate
        >
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-base font-bold text-nexoraText">{t('marketingSuite.content')}</h3>
            <span className="text-xs text-nexoraMuted">{t('marketingSuite.draftEditor')}</span>
          </div>
          {error && (
            <p
              role="alert"
              className="rounded-lg border border-nexoraDanger/30 bg-nexoraDanger/5 p-3 text-sm text-nexoraDanger"
            >
              {error}
            </p>
          )}
          <fieldset disabled={saveMutation.isPending} className="min-w-0 space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="landing-name" className="text-sm font-semibold text-nexoraText">
                {t('marketingSuite.pageName')} *
              </label>
              <input
                id="landing-name"
                className={fieldClass}
                value={content.name}
                onChange={(event) => update('name', event.target.value)}
                placeholder={t('marketingSuite.namePlaceholder')}
                maxLength={80}
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="landing-title" className="text-sm font-semibold text-nexoraText">
                {t('marketingSuite.title')} *
              </label>
              <input
                id="landing-title"
                className={fieldClass}
                value={content.title}
                onChange={(event) => update('title', event.target.value)}
                placeholder={t('marketingSuite.titlePlaceholder')}
                maxLength={120}
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="landing-subtitle" className="text-sm font-semibold text-nexoraText">
                {t('marketingSuite.subtitle')}
              </label>
              <textarea
                id="landing-subtitle"
                className={fieldClass}
                value={content.subtitle}
                onChange={(event) => update('subtitle', event.target.value)}
                placeholder={t('marketingSuite.subtitlePlaceholder')}
                rows={2}
                maxLength={300}
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="landing-offer" className="text-sm font-semibold text-nexoraText">
                {t('marketingSuite.offer')}
              </label>
              <textarea
                id="landing-offer"
                className={fieldClass}
                value={content.offer}
                onChange={(event) => update('offer', event.target.value)}
                placeholder={t('marketingSuite.offerPlaceholder')}
                rows={4}
                maxLength={1000}
              />
            </div>
            <fieldset className="space-y-2">
              <legend className="mb-2 text-sm font-semibold text-nexoraText">
                {t('marketingSuite.banner')}
              </legend>
              <div className="grid grid-cols-3 gap-3">
                {Array.from(
                  new Set([content.imageUrl, ...MARKETING_DEMO_IMAGES].filter(Boolean)),
                ).map((url, index) => (
                  <button
                    key={url}
                    type="button"
                    aria-label={t('marketingSuite.selectBanner', { number: index + 1 })}
                    aria-pressed={content.imageUrl === url}
                    onClick={() => update('imageUrl', url)}
                    className={`relative min-h-11 overflow-hidden rounded-xl border-2 transition ${content.imageUrl === url ? 'border-nexoraBrand' : 'border-transparent hover:border-nexoraBorder'}`}
                  >
                    <img
                      src={url}
                      alt=""
                      className="aspect-[4/3] w-full object-cover"
                      width={160}
                      height={120}
                      loading="lazy"
                    />
                    {content.imageUrl === url && (
                      <span className="absolute bottom-1 right-1 rounded-full bg-nexoraBrand p-1 text-white">
                        <Check className="h-3 w-3" aria-hidden="true" />
                      </span>
                    )}
                  </button>
                ))}
              </div>
              <p className="flex items-center gap-1 text-xs text-nexoraMuted">
                <Image className="h-3 w-3" aria-hidden="true" />
                {t('marketingSuite.bannerHint')}
              </p>
            </fieldset>
            <div className="space-y-3 border-t border-nexoraRule pt-4">
              <h4 className="text-sm font-bold text-nexoraText">
                {t('marketingSuite.ctaSettings')}
              </h4>
              <label className="flex min-h-11 cursor-pointer items-center justify-between gap-3 text-sm text-nexoraText">
                <span>{t('marketingSuite.bookingButton')}</span>
                <input
                  type="checkbox"
                  className="h-5 w-5 accent-nexoraBrand"
                  checked={content.bookingEnabled}
                  onChange={(event) => update('bookingEnabled', event.target.checked)}
                />
              </label>
              {content.bookingEnabled && (
                <div className="space-y-1.5">
                  <label
                    htmlFor="landing-booking-url"
                    className="text-sm font-semibold text-nexoraText"
                  >
                    {t('marketingSuite.bookingUrl')} *
                  </label>
                  <input
                    id="landing-booking-url"
                    type="url"
                    className={fieldClass}
                    placeholder={t('marketingSuite.urlPlaceholder')}
                    value={content.bookingUrl}
                    onChange={(event) => update('bookingUrl', event.target.value)}
                  />
                  <p className="text-xs text-nexoraMuted">{t('marketingSuite.urlHint')}</p>
                </div>
              )}
              <label className="flex min-h-11 cursor-pointer items-center justify-between gap-3 text-sm text-nexoraText">
                <span>{t('marketingSuite.callButton')}</span>
                <input
                  type="checkbox"
                  className="h-5 w-5 accent-nexoraBrand"
                  checked={content.callEnabled}
                  onChange={(event) => update('callEnabled', event.target.checked)}
                />
              </label>
              {content.callEnabled && (
                <div className="space-y-1.5">
                  <label htmlFor="landing-phone" className="text-sm font-semibold text-nexoraText">
                    {t('marketingSuite.phone')} *
                  </label>
                  <input
                    id="landing-phone"
                    type="tel"
                    autoComplete="tel-national"
                    inputMode="tel"
                    className={fieldClass}
                    placeholder={getNationalPhonePlaceholder(PhoneDialCode.US)}
                    value={content.phone}
                    onChange={(event) =>
                      update('phone', formatNationalNumber(event.target.value, PhoneDialCode.US))
                    }
                  />
                </div>
              )}
            </div>
            <div className="space-y-2 border-t border-nexoraRule pt-4">
              <label htmlFor="landing-expiry" className="text-sm font-semibold text-nexoraText">
                {t('marketingSuite.expiry')}
              </label>
              <input
                id="landing-expiry"
                type="date"
                className={fieldClass}
                value={content.expiresOn}
                onChange={(event) => update('expiresOn', event.target.value)}
              />
              <p className="text-xs text-nexoraMuted">{t('marketingSuite.expiryHint')}</p>
              <label className="flex min-h-11 cursor-pointer items-center justify-between gap-3 text-sm text-nexoraText">
                <span>{t('marketingSuite.showCountdown')}</span>
                <input
                  type="checkbox"
                  className="h-5 w-5 accent-nexoraBrand"
                  checked={content.countdownEnabled}
                  onChange={(event) => update('countdownEnabled', event.target.checked)}
                />
              </label>
            </div>
          </fieldset>
          <div className="grid grid-cols-1 gap-3 border-t border-nexoraRule pt-5 sm:grid-cols-2">
            <button type="submit" disabled={saveMutation.isPending} className={buttonClass}>
              <Save className="h-4 w-4" aria-hidden="true" />
              {t(saveMutation.isPending ? 'marketingSuite.saving' : 'marketingSuite.saveDraft')}
            </button>
            <button
              type="button"
              disabled={saveMutation.isPending}
              onClick={() => void save(true)}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-nexoraBrand px-4 py-3 text-sm font-bold text-white transition hover:bg-nexoraBrandDark disabled:cursor-not-allowed disabled:opacity-50"
            >
              {t('marketingSuite.publishDemo')}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
          <button
            type="button"
            disabled={saveMutation.isPending}
            onClick={async () => {
              const page =
                dirty || !selectedPage?.published || hasUnpublishedChanges
                  ? await save(true)
                  : selectedPage
              if (page) onUseInCampaign(page.id)
            }}
            className={`${buttonClass} w-full`}
          >
            {t(
              dirty || !selectedPage?.published || hasUnpublishedChanges
                ? 'marketingSuite.publishAndUse'
                : 'marketingSuite.useInCampaign',
            )}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </form>
        <div ref={previewRef} className="min-w-0 space-y-3 xl:sticky xl:top-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-nexoraText">
              <Eye className="h-4 w-4" aria-hidden="true" />
              {t(
                previewVersion === 'published'
                  ? 'marketingSuite.publishedPreview'
                  : 'marketingSuite.livePreview',
              )}
            </h3>
            <div className="flex gap-1 rounded-lg bg-nexoraSurfaceMuted p-1">
              {(['mobile', 'desktop'] as const).map((width) => (
                <button
                  key={width}
                  type="button"
                  aria-pressed={previewWidth === width}
                  onClick={() => setPreviewWidth(width)}
                  className={`min-h-11 rounded-lg px-3 text-xs font-semibold ${previewWidth === width ? 'bg-nexoraSurface text-nexoraBrand shadow-sm' : 'text-nexoraMuted'}`}
                >
                  {t(`marketingSuite.${width}`)}
                </button>
              ))}
            </div>
          </div>
          {selectedPage?.published && (
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <button
                type="button"
                aria-pressed={previewVersion === 'draft'}
                className={`${buttonClass} flex-1`}
                onClick={() => setPreviewVersion('draft')}
              >
                {t('marketingSuite.draftPreview')}
              </button>
              <button
                type="button"
                aria-pressed={previewVersion === 'published'}
                className={`${buttonClass} flex-1`}
                onClick={() => setPreviewVersion('published')}
              >
                {t('marketingSuite.publishedPreview')}
              </button>
            </div>
          )}
          {selectedPage?.published && (
            <button
              type="button"
              className={`${buttonClass} w-full`}
              onClick={async () => {
                const url = `${window.location.origin}/marketing/preview/${selectedPage.id}`
                try {
                  await navigator.clipboard.writeText(url)
                } catch {
                  // clipboard API unavailable — fall through, toast still shows the URL
                }
                showToast(t('marketingSuite.publicLinkCopied', { url }))
              }}
            >
              <LinkIcon className="h-4 w-4" aria-hidden="true" />
              {t('marketingSuite.copyPublicLink')}
            </button>
          )}
          {hasUnpublishedChanges && (
            <p className="rounded-lg bg-nexoraBrandSoft px-3 py-2 text-xs leading-relaxed text-nexoraBrand">
              {t('marketingSuite.unpublishedChanges')}
            </p>
          )}
          <div className={previewWidth === 'mobile' ? 'mx-auto w-full max-w-sm' : 'w-full'}>
            <LandingPagePreview content={previewContent} />
          </div>
        </div>
      </div>
    </section>
  )
})

export default MarketingLandingPageView
