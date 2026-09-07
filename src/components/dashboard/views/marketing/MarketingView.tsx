import { useRef, useState } from 'react'
import { Globe, Megaphone, Plus, Share2, Sparkles } from 'lucide-react'
import { useTranslation } from '../../../../contexts/LanguageContext'
import { useNotification } from '../../../../contexts/NotificationContext'
import AiDesignView from './AiDesignView'
import MarketingLandingPageView, {
  type MarketingBannerSelection,
  type MarketingLandingPageViewHandle,
} from './MarketingLandingPageView'
import MarketingCampaignView, { type CampaignLandingSelection } from './MarketingCampaignView'

const tabs = [
  { id: 'aiDesign', icon: Sparkles },
  { id: 'landingPage', icon: Globe },
  { id: 'campaign', icon: Megaphone },
  { id: 'socialMedia', icon: Share2 },
] as const
type MarketingTab = (typeof tabs)[number]['id']

export default function MarketingView() {
  const { t } = useTranslation()
  const { showToast } = useNotification()
  const [tab, setTab] = useState<MarketingTab>('aiDesign')
  const [banner, setBanner] = useState<MarketingBannerSelection | null>(null)
  const [landingSelection, setLandingSelection] = useState<CampaignLandingSelection | null>(null)
  const [landingDirty, setLandingDirty] = useState(false)
  const [landingSaving, setLandingSaving] = useState(false)
  const [campaignDirty, setCampaignDirty] = useState(false)
  const sequence = useRef(0)
  const sectionRef = useRef<HTMLDivElement>(null)
  const landingPageRef = useRef<MarketingLandingPageViewHandle>(null)
  const openTab = (next: MarketingTab) => {
    setTab(next)
    sectionRef.current?.scrollIntoView({ block: 'start' })
  }

  return (
    <div ref={sectionRef} className="min-w-0 space-y-6 pb-24 text-nexoraText lg:pb-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          {t('marketingSuite.heading')}
        </h1>
      </header>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div
          role="tablist"
          aria-label={t('marketingSuite.heading')}
          className="grid grid-cols-2 gap-2 rounded-xl border border-nexoraBorder bg-nexoraSurface p-1.5 sm:flex sm:w-fit"
        >
          {tabs.map(({ id, icon: Icon }, index) => (
            <button
              key={id}
              type="button"
              role="tab"
              id={`marketing-tab-${id}`}
              aria-selected={tab === id}
              aria-controls={`marketing-panel-${id}`}
              tabIndex={tab === id ? 0 : -1}
              onKeyDown={(event) => {
                let next = index
                if (event.key === 'ArrowRight') next = (index + 1) % tabs.length
                else if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length
                else if (event.key === 'Home') next = 0
                else if (event.key === 'End') next = tabs.length - 1
                else return
                event.preventDefault()
                setTab(tabs[next].id)
                document.getElementById(`marketing-tab-${tabs[next].id}`)?.focus()
              }}
              onClick={() => setTab(id)}
              className={`flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition ${tab === id ? 'bg-nexoraBrand text-white shadow-sm' : 'text-nexoraMuted hover:bg-nexoraSurfaceMuted hover:text-nexoraText'}`}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              {t(`marketingSuite.${id}`)}
            </button>
          ))}
        </div>
        {tab === 'landingPage' && (
          <button
            type="button"
            onClick={() => landingPageRef.current?.createNew()}
            disabled={landingSaving || landingDirty}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-nexoraBorder px-4 py-2.5 text-sm font-semibold text-nexoraText transition hover:bg-nexoraSurfaceMuted disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            {t('marketingSuite.newLanding')}
          </button>
        )}
      </div>
      <div
        role="tabpanel"
        id="marketing-panel-aiDesign"
        aria-labelledby="marketing-tab-aiDesign"
        hidden={tab !== 'aiDesign'}
      >
        <AiDesignView
          onCreateLandingPage={(imageUrl, name) => {
            if (landingDirty) {
              showToast(t('marketingSuite.finishLanding'), 'error')
              openTab('landingPage')
              return
            }
            setBanner({ imageUrl, name, selectionId: ++sequence.current })
            openTab('landingPage')
          }}
        />
      </div>
      <div
        role="tabpanel"
        id="marketing-panel-landingPage"
        aria-labelledby="marketing-tab-landingPage"
        hidden={tab !== 'landingPage'}
      >
        <MarketingLandingPageView
          ref={landingPageRef}
          banner={banner}
          onDirtyChange={setLandingDirty}
          onPendingChange={setLandingSaving}
          onUseInCampaign={(id) => {
            if (campaignDirty) {
              showToast(t('marketingSuite.finishCampaign'), 'error')
              openTab('campaign')
              return
            }
            setLandingSelection({ id, selectionId: ++sequence.current })
            openTab('campaign')
          }}
        />
      </div>
      <div
        role="tabpanel"
        id="marketing-panel-campaign"
        aria-labelledby="marketing-tab-campaign"
        hidden={tab !== 'campaign'}
      >
        <MarketingCampaignView
          landingSelection={landingSelection}
          onDirtyChange={setCampaignDirty}
          onCreateLanding={() => openTab('landingPage')}
        />
      </div>
      <div
        role="tabpanel"
        id="marketing-panel-socialMedia"
        aria-labelledby="marketing-tab-socialMedia"
        hidden={tab !== 'socialMedia'}
      >
        <div className="nexora-card mx-auto max-w-2xl space-y-4 p-8 text-center sm:p-12">
          <Share2 className="mx-auto h-10 w-10 text-nexoraBrand" aria-hidden="true" />
          <span className="inline-flex rounded-full bg-nexoraBrandSoft px-3 py-1 text-xs font-bold text-nexoraBrand">
            {t('marketingSuite.comingSoon')}
          </span>
          <h2 className="text-xl font-bold">{t('marketingSuite.socialHeading')}</h2>
          <p className="text-sm leading-relaxed text-nexoraMuted">
            {t('marketingSuite.socialDescription')}
          </p>
          <button
            type="button"
            onClick={() => openTab('campaign')}
            className="min-h-11 rounded-xl bg-nexoraBrand px-5 py-3 text-sm font-bold text-white transition hover:bg-nexoraBrandDark"
          >
            {t('marketingSuite.exploreCampaigns')}
          </button>
        </div>
      </div>
    </div>
  )
}
