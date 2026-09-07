/**
 * Marketing demo — no backend calls, no real public publishing or customer delivery.
 * Data is persisted to `localStorage` so a published page's public preview link
 * survives a reload and works in a new tab, as long as it's the same browser on
 * the same device. It is NOT shared across devices/browsers — there is no server.
 */
export interface LandingPageContent {
  name: string
  title: string
  subtitle: string
  offer: string
  imageUrl: string
  bookingEnabled: boolean
  bookingUrl: string
  callEnabled: boolean
  phone: string
  expiresOn: string
  countdownEnabled: boolean
}

export interface MarketingLandingPage {
  id: string
  draft: LandingPageContent
  published: LandingPageContent | null
  updatedAt: string
  publishedAt: string | null
}

export type MarketingCampaignTemplate = 'winBack' | 'birthday' | 'quietSlots'

export interface MarketingCampaignDraft {
  id: string
  name: string
  template: MarketingCampaignTemplate
  landingPageId: string
  imageUrl: string
  message: string
  updatedAt: string
}

export const MARKETING_DEMO_IMAGES = [
  '/assets/images/marketing/nail/nail_summer_pop.jpg',
  '/assets/images/marketing/nail/nail_glam_french.jpg',
  '/assets/images/marketing/nail/nail_spa_treatment.jpg',
] as const

export function isMarketingHttpUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return (url.protocol === 'https:' || url.protocol === 'http:') && !url.username && !url.password
  } catch {
    return false
  }
}

/** Date-only offers expire at the end of that date in the product's default Central time. */
export function getLandingExpiryTime(date: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null
  const noon = new Date(`${date}T12:00:00Z`)
  if (!Number.isFinite(noon.getTime()) || noon.toISOString().slice(0, 10) !== date) return null
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Chicago',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(noon)
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value
  const centralAsUtc = Date.parse(
    `${part('year')}-${part('month')}-${part('day')}T${part('hour')}:${part('minute')}:${part('second')}Z`,
  )
  return Date.parse(`${date}T23:59:59Z`) - (centralAsUtc - noon.getTime())
}

export type LandingValidationError =
  | 'nameRequired'
  | 'titleRequired'
  | 'imageRequired'
  | 'invalidUrl'
  | 'invalidPhone'
  | 'invalidExpiry'

export function validateLandingContent(content: LandingPageContent): LandingValidationError | null {
  if (!content.name.trim()) return 'nameRequired'
  if (!content.title.trim()) return 'titleRequired'
  if (!content.imageUrl.trim()) return 'imageRequired'
  if (content.bookingEnabled && !isMarketingHttpUrl(content.bookingUrl)) return 'invalidUrl'
  if (content.callEnabled && !/^\d{10}$/.test(content.phone.replace(/\D/g, '')))
    return 'invalidPhone'
  if (
    (content.countdownEnabled && !content.expiresOn) ||
    (content.expiresOn && getLandingExpiryTime(content.expiresOn) === null)
  )
    return 'invalidExpiry'
  return null
}

const seedContent: LandingPageContent = {
  name: 'Welcome back offer',
  title: 'A little time for you',
  subtitle: 'Refresh your look with a manicure made for you.',
  offer:
    'Enjoy 20% off your next manicure.\nMention WELCOME20 when booking.\nOne offer per visit. Cannot be combined with other offers.',
  imageUrl: MARKETING_DEMO_IMAGES[0],
  bookingEnabled: true,
  bookingUrl: 'https://example.com/book',
  callEnabled: false,
  phone: '',
  expiresOn: '',
  countdownEnabled: false,
}

const cloneContent = (content: LandingPageContent): LandingPageContent => ({ ...content })
const clonePage = (page: MarketingLandingPage): MarketingLandingPage => ({
  ...page,
  draft: cloneContent(page.draft),
  published: page.published ? cloneContent(page.published) : null,
})

const seedPages = (): MarketingLandingPage[] => [
  {
    id: 'demo-welcome',
    draft: cloneContent(seedContent),
    published: cloneContent(seedContent),
    updatedAt: new Date().toISOString(),
    publishedAt: new Date().toISOString(),
  },
  {
    id: 'demo-birthday',
    draft: {
      ...seedContent,
      name: 'Birthday treat',
      title: 'Your birthday. Your moment.',
      subtitle: 'Celebrate with a fresh set and a little extra care.',
      offer: 'Complimentary nail art with a full manicure.\nAvailable during your birthday month.',
      imageUrl: MARKETING_DEMO_IMAGES[1],
    },
    published: null,
    updatedAt: new Date().toISOString(),
    publishedAt: null,
  },
]

/**
 * localStorage is what makes a copied public preview link survive a reload or
 * a new tab (same browser, same device only — there is no server behind this).
 * Reads/writes are wrapped in try/catch so private browsing or a disabled
 * storage API just falls back to in-memory-only behavior instead of crashing.
 */
const STORAGE_KEY = 'nexora.marketing.landingPages.v1'

interface PersistedMarketingState {
  pages: MarketingLandingPage[]
  campaigns: MarketingCampaignDraft[]
}

function loadPersistedState(): PersistedMarketingState | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<PersistedMarketingState>
    if (!Array.isArray(parsed.pages) || !Array.isArray(parsed.campaigns)) return null
    return { pages: parsed.pages, campaigns: parsed.campaigns }
  } catch {
    return null
  }
}

function persistState(): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ pages, campaigns }))
  } catch {
    // Storage unavailable (private browsing, quota exceeded) — stay in-memory only.
  }
}

const persisted = loadPersistedState()
let pages: MarketingLandingPage[] = persisted?.pages ?? seedPages()
let campaigns: MarketingCampaignDraft[] = persisted?.campaigns ?? []

const marketingLandingPagesRepository = {
  async list(): Promise<MarketingLandingPage[]> {
    return pages.map(clonePage)
  },
  async save({
    id,
    content,
    publish = false,
  }: {
    id?: string
    content: LandingPageContent
    publish?: boolean
  }): Promise<MarketingLandingPage> {
    const validation = publish
      ? validateLandingContent(content)
      : !content.name.trim()
        ? 'nameRequired'
        : null
    if (validation) throw new Error(validation)
    const existing = id ? pages.find((page) => page.id === id) : undefined
    if (id && !existing) throw new Error('notFound')
    const now = new Date().toISOString()
    const draft = cloneContent(content)
    const page: MarketingLandingPage = {
      id: existing?.id ?? crypto.randomUUID(),
      draft,
      published: publish
        ? cloneContent(draft)
        : existing?.published
          ? cloneContent(existing.published)
          : null,
      updatedAt: now,
      publishedAt: publish ? now : (existing?.publishedAt ?? null),
    }
    pages = [page, ...pages.filter((item) => item.id !== page.id)]
    persistState()
    return clonePage(page)
  },
  async listCampaigns(): Promise<MarketingCampaignDraft[]> {
    return campaigns.map((campaign) => ({ ...campaign }))
  },
  async saveCampaign(
    input: Omit<MarketingCampaignDraft, 'id' | 'updatedAt'> & { id?: string },
  ): Promise<MarketingCampaignDraft> {
    if (!input.name.trim() || !input.message.trim() || !input.imageUrl.trim())
      throw new Error('campaignRequired')
    if (!pages.some((page) => page.id === input.landingPageId && page.published))
      throw new Error('landingRequired')
    if (input.id && !campaigns.some((campaign) => campaign.id === input.id))
      throw new Error('notFound')
    const campaign = {
      ...input,
      id: input.id ?? crypto.randomUUID(),
      updatedAt: new Date().toISOString(),
    }
    campaigns = [campaign, ...campaigns.filter((item) => item.id !== campaign.id)]
    persistState()
    return { ...campaign }
  },
}

export default marketingLandingPagesRepository
