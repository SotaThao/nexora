import { useEffect, useRef, useState } from 'react'
import { ArrowRight, Cake, Check, Clock3, FileText, HeartHandshake, Save } from 'lucide-react'
import { useTranslation } from '../../../../contexts/LanguageContext'
import { useNotification } from '../../../../contexts/NotificationContext'
import {
  useMarketingCampaignDrafts,
  useMarketingLandingPages,
  useSaveMarketingCampaignDraft,
} from '../../../../data/hooks/useMarketingLandingPages'
import {
  MARKETING_DEMO_IMAGES,
  type MarketingCampaignDraft,
  type MarketingCampaignTemplate,
} from '../../../../data/repositories/marketingLandingPages'
import LandingPagePreview from './LandingPagePreview'

export interface CampaignLandingSelection {
  id: string
  selectionId: number
}
interface Props {
  landingSelection: CampaignLandingSelection | null
  onCreateLanding: () => void
  onDirtyChange: (dirty: boolean) => void
}
type CampaignForm = Omit<MarketingCampaignDraft, 'updatedAt' | 'id'> & { id?: string }
const templates = [
  { id: 'winBack', icon: HeartHandshake },
  { id: 'birthday', icon: Cake },
  { id: 'quietSlots', icon: Clock3 },
] as const
const fieldClass =
  'min-h-11 w-full rounded-xl border border-nexoraBorder bg-nexoraCanvas px-3 py-2.5 text-sm text-nexoraText placeholder:text-nexoraSubtle'
const buttonClass =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-nexoraBorder px-4 py-2.5 text-sm font-semibold text-nexoraText transition hover:bg-nexoraSurfaceMuted disabled:cursor-not-allowed disabled:opacity-50'

export default function MarketingCampaignView({
  landingSelection,
  onCreateLanding,
  onDirtyChange,
}: Props) {
  const { t } = useTranslation()
  const { showToast } = useNotification()
  const pagesQuery = useMarketingLandingPages()
  const campaignsQuery = useMarketingCampaignDrafts()
  const saveMutation = useSaveMarketingCampaignDraft()
  const [form, setForm] = useState<CampaignForm | null>(null)
  const [dirty, setDirty] = useState(false)
  const [showLanding, setShowLanding] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const handoffRef = useRef<number | null>(null)
  const saveLock = useRef(false)
  const editorRef = useRef<HTMLDivElement>(null)
  const pages = (pagesQuery.data ?? []).filter((page) => page.published)
  const landing = pages.find((page) => page.id === form?.landingPageId)
  const linkedContent = landing?.published

  useEffect(() => {
    onDirtyChange(dirty)
  }, [dirty, onDirtyChange])

  const createDraft = (template: MarketingCampaignTemplate, landingId?: string) => {
    const page = pages.find((item) => item.id === landingId) ?? pages[0]
    setForm({
      template,
      name: t(`marketingSuite.templates.${template}.title`),
      landingPageId: page?.id ?? '',
      imageUrl: (page?.published ?? page?.draft)?.imageUrl ?? MARKETING_DEMO_IMAGES[0],
      message: t(`marketingSuite.templates.${template}.copy`),
    })
    setDirty(true)
    setError(null)
    setShowLanding(false)
  }

  useEffect(() => {
    if (
      landingSelection &&
      handoffRef.current !== landingSelection.selectionId &&
      pages.some((page) => page.id === landingSelection.id)
    ) {
      handoffRef.current = landingSelection.selectionId
      createDraft('winBack', landingSelection.id)
    }
  }, [landingSelection, pages])

  const update = <K extends keyof CampaignForm>(key: K, value: CampaignForm[K]) => {
    setForm((current) => (current ? { ...current, [key]: value } : current))
    setDirty(true)
    setError(null)
  }

  const save = async () => {
    if (!form || saveLock.current) return
    if (!form.name.trim() || !form.message.trim()) {
      setError(t('marketingSuite.errors.campaignRequired'))
      return
    }
    if (!landing) {
      setError(t('marketingSuite.errors.landingRequired'))
      return
    }
    saveLock.current = true
    setError(null)
    try {
      const saved = await saveMutation.mutateAsync(form)
      setForm(saved)
      setDirty(false)
      showToast(t('marketingSuite.campaignSaved'))
    } catch {
      setError(t('marketingSuite.errors.saveFailed'))
    } finally {
      saveLock.current = false
    }
  }

  if (pagesQuery.isLoading || campaignsQuery.isLoading)
    return (
      <p role="status" className="py-10 text-nexoraMuted">
        {t('marketingSuite.loading')}
      </p>
    )
  if (pagesQuery.isError || campaignsQuery.isError)
    return (
      <div role="alert" className="space-y-3">
        <p>{t('marketingSuite.errors.loadFailed')}</p>
        <button
          type="button"
          className={buttonClass}
          onClick={() => {
            void pagesQuery.refetch()
            void campaignsQuery.refetch()
          }}
        >
          {t('marketingSuite.retry')}
        </button>
      </div>
    )

  return (
    <section className="space-y-6" aria-label={t('marketingSuite.campaign')}>
      <div>
        <h2 className="text-xl font-bold text-nexoraText">{t('marketingSuite.campaignHeading')}</h2>
        <p className="mt-1 text-sm text-nexoraMuted">{t('marketingSuite.campaignDescription')}</p>
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {templates.map(({ id, icon: Icon }) => (
          <article key={id} className="nexora-card flex flex-col gap-4 p-5">
            <div className="flex items-center gap-3">
              <span className="rounded-xl bg-nexoraBrandSoft p-3 text-nexoraBrand">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <h3 className="text-base font-bold text-nexoraText">
                {t(`marketingSuite.templates.${id}.title`)}
              </h3>
            </div>
            <p className="text-sm leading-relaxed text-nexoraMuted">
              {t(`marketingSuite.templates.${id}.description`)}
            </p>
            <p className="rounded-lg bg-nexoraSurfaceMuted px-3 py-2 text-xs leading-relaxed text-nexoraMuted">
              {t(`marketingSuite.templates.${id}.audience`)}
            </p>
            <button
              type="button"
              disabled={saveMutation.isPending || dirty}
              className={`${buttonClass} mt-auto w-full text-nexoraBrand`}
              onClick={() => {
                createDraft(id)
                window.requestAnimationFrame(() =>
                  editorRef.current?.scrollIntoView({ block: 'start', behavior: 'smooth' }),
                )
              }}
            >
              {t('marketingSuite.createCampaignDraft')}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </article>
        ))}
      </div>
      {dirty && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl bg-nexoraSurfaceMuted px-4 py-3 text-sm text-nexoraMuted">
          <span>{t('marketingSuite.unsavedCampaign')}</span>
          <button
            type="button"
            disabled={saveMutation.isPending}
            className="min-h-11 font-semibold text-nexoraBrand hover:underline"
            onClick={() => {
              setForm(null)
              setDirty(false)
              setError(null)
            }}
          >
            {t('marketingSuite.discardChanges')}
          </button>
        </div>
      )}
      {form && (
        <div ref={editorRef} className="grid grid-cols-1 items-start gap-6 xl:grid-cols-2">
          <form
            className="nexora-card space-y-5 p-5 sm:p-6"
            onSubmit={(event) => {
              event.preventDefault()
              void save()
            }}
            noValidate
          >
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-base font-bold text-nexoraText">
                {t('marketingSuite.campaignDraft')}
              </h3>
              <span className="rounded-full bg-nexoraBrandSoft px-2.5 py-1 text-xs font-bold text-nexoraBrand">
                {t('marketingSuite.demo')}
              </span>
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
                <label htmlFor="campaign-name" className="text-sm font-semibold text-nexoraText">
                  {t('marketingSuite.campaignName')} *
                </label>
                <input
                  id="campaign-name"
                  className={fieldClass}
                  value={form.name}
                  onChange={(event) => update('name', event.target.value)}
                  placeholder={t('marketingSuite.campaignNamePlaceholder')}
                  maxLength={80}
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="campaign-landing" className="text-sm font-semibold text-nexoraText">
                  {t('marketingSuite.landingPage')} *
                </label>
                <select
                  id="campaign-landing"
                  className={fieldClass}
                  value={form.landingPageId}
                  onChange={(event) => {
                    const page = pages.find((item) => item.id === event.target.value)
                    setForm((current) =>
                      current
                        ? {
                            ...current,
                            landingPageId: event.target.value,
                            imageUrl:
                              (page?.published ?? page?.draft)?.imageUrl ?? current.imageUrl,
                          }
                        : current,
                    )
                    setDirty(true)
                    setError(null)
                  }}
                >
                  <option value="">{t('marketingSuite.chooseLanding')}</option>
                  {pages.map((page) => (
                    <option key={page.id} value={page.id}>
                      {page.published.name} ·{' '}
                      {t(page.published ? 'marketingSuite.publishedDemo' : 'marketingSuite.draft')}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={onCreateLanding}
                  className="min-h-11 text-sm font-semibold text-nexoraBrand hover:underline"
                >
                  {t('marketingSuite.manageLanding')}
                </button>
              </div>
              <fieldset>
                <legend className="mb-2 text-sm font-semibold text-nexoraText">
                  {t('marketingSuite.campaignCreative')}
                </legend>
                <div className="grid grid-cols-3 gap-3">
                  {Array.from(new Set([form.imageUrl, ...MARKETING_DEMO_IMAGES])).map(
                    (url, index) => (
                      <button
                        key={url}
                        type="button"
                        aria-label={t('marketingSuite.selectBanner', { number: index + 1 })}
                        aria-pressed={form.imageUrl === url}
                        onClick={() => update('imageUrl', url)}
                        className={`relative min-h-11 overflow-hidden rounded-xl border-2 ${form.imageUrl === url ? 'border-nexoraBrand' : 'border-transparent hover:border-nexoraBorder'}`}
                      >
                        <img
                          src={url}
                          alt=""
                          width={160}
                          height={120}
                          loading="lazy"
                          className="aspect-[4/3] w-full object-cover"
                        />
                        {form.imageUrl === url && (
                          <span className="absolute bottom-1 right-1 rounded-full bg-nexoraBrand p-1 text-white">
                            <Check className="h-3 w-3" aria-hidden="true" />
                          </span>
                        )}
                      </button>
                    ),
                  )}
                </div>
              </fieldset>
              <div className="space-y-1.5">
                <label htmlFor="campaign-message" className="text-sm font-semibold text-nexoraText">
                  {t('marketingSuite.message')} *
                </label>
                <textarea
                  id="campaign-message"
                  className={fieldClass}
                  rows={6}
                  value={form.message}
                  onChange={(event) => update('message', event.target.value)}
                  placeholder={t('marketingSuite.messagePlaceholder')}
                  maxLength={1000}
                />
                <p className="text-xs text-nexoraMuted">{t('marketingSuite.messageHint')}</p>
              </div>
            </fieldset>
            <button
              type="submit"
              disabled={saveMutation.isPending}
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-nexoraBrand px-4 py-3 text-sm font-bold text-white transition hover:bg-nexoraBrandDark disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Save className="h-4 w-4" aria-hidden="true" />
              {t(
                saveMutation.isPending
                  ? 'marketingSuite.saving'
                  : 'marketingSuite.saveCampaignDraft',
              )}
            </button>
          </form>
          <div className="min-w-0 space-y-4 xl:sticky xl:top-5">
            <h3 className="text-sm font-semibold text-nexoraText">
              {t('marketingSuite.campaignPreview')}
            </h3>
            <article className="overflow-hidden rounded-2xl border border-nexoraBorder bg-nexoraSurface">
              <img
                src={form.imageUrl}
                alt={form.name}
                width={800}
                height={450}
                className="aspect-[16/9] w-full object-cover"
              />
              <div className="space-y-4 p-5">
                <p className="text-xs font-bold uppercase tracking-wide text-nexoraBrand">
                  {t('marketingSuite.sampleAudience')}
                </p>
                <h4 className="break-words text-lg font-bold text-nexoraText">{form.name}</h4>
                <p className="whitespace-pre-line break-words text-sm leading-relaxed text-nexoraMuted">
                  {form.message}
                </p>
                {landing && (
                  <button
                    type="button"
                    className={`${buttonClass} w-full`}
                    onClick={() => setShowLanding((value) => !value)}
                  >
                    <FileText className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span className="min-w-0 truncate">
                      {t('marketingSuite.attachedLanding', { name: landing.published.name })}
                    </span>
                  </button>
                )}
                <p className="text-xs leading-relaxed text-nexoraMuted">
                  {t('marketingSuite.campaignPreviewHint')}
                </p>
              </div>
            </article>
            {showLanding && linkedContent && (
              <>
                <p className="text-xs text-nexoraMuted">
                  {t(
                    landing?.published
                      ? 'marketingSuite.linkedPublished'
                      : 'marketingSuite.linkedDraft',
                  )}
                </p>
                <LandingPagePreview content={linkedContent} />
              </>
            )}
          </div>
        </div>
      )}
      <div className="nexora-card p-5 sm:p-6">
        <h3 className="mb-4 text-base font-bold text-nexoraText">
          {t('marketingSuite.savedCampaigns')}
        </h3>
        {!campaignsQuery.data?.length ? (
          <p className="py-5 text-center text-sm text-nexoraMuted">
            {t('marketingSuite.noCampaigns')}
          </p>
        ) : (
          <div className="divide-y divide-nexoraRule">
            {campaignsQuery.data.map((campaign) => {
              const linkedPage = (pagesQuery.data ?? []).find(
                (page) => page.id === campaign.landingPageId,
              )
              const thumbUrl =
                campaign.imageUrl ||
                linkedPage?.published?.imageUrl ||
                linkedPage?.draft?.imageUrl ||
                MARKETING_DEMO_IMAGES[0]

              return (
                <div
                  key={campaign.id}
                  className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <img
                      src={thumbUrl}
                      alt=""
                      width={80}
                      height={56}
                      loading="lazy"
                      className="h-14 w-20 shrink-0 rounded-lg border border-nexoraBorder bg-nexoraSurfaceMuted object-cover"
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-nexoraText">{campaign.name}</p>
                      <p className="mt-1 text-xs text-nexoraMuted">
                        {t('marketingSuite.draft')} ·{' '}
                        {linkedPage?.published?.name ??
                          linkedPage?.draft?.name ??
                          t('marketingSuite.draft')}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={dirty || saveMutation.isPending}
                    className={`${buttonClass} shrink-0`}
                    onClick={() => {
                      setForm({ ...campaign })
                      setDirty(false)
                      setError(null)
                      setShowLanding(false)
                      window.requestAnimationFrame(() =>
                        editorRef.current?.scrollIntoView({ block: 'start', behavior: 'smooth' }),
                      )
                    }}
                  >
                    {t('marketingSuite.editDraft')}
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}
