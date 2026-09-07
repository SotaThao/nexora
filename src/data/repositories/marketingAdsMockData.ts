/**
 * marketingAdsMockData — Mock data and types ported 1:1 from merchant-ai-ads
 * (`ai-ads-embed/data/mock-data.ts` and `ai-ads-embed/types/index.ts`).
 *
 * Used for Marketing Ads Presentation Layer (US-110 Đợt 0).
 * No httpClient, no external dependencies (clsx, lodash, etc.).
 */

export type BannerStatus =
  | 'draft'
  | 'pending_review'
  | 'active'
  | 'paused'
  | 'expired'
  | 'rejected'
  | 'deleted'

export type BannerSource = 'uploaded' | 'ai_generated'

export type ScreenId =
  | 'hub'
  | 'create-ad'
  | 'manage'
  | 'buy-package'
  | 'notifications'
  | 'transactions'
  | 'upload'
  | 'create-ai'
  | 'support'

export type AIQuality = 'low' | 'medium' | 'high'

export type UploadRedesignPhase = 'form' | 'loading' | 'result'

export interface UploadRedesignDialogState {
  isOpen: boolean
  phase: UploadRedesignPhase
  prompt: string
  quality: AIQuality
  referencePreviewUrl: string
  resultUrl: string
  loadingProgress: number
  creditError: string | null
  lastCreditCost: number
}

export type NotificationType = 'approved' | 'rejected' | 'expired' | 'upgrade'

export interface Banner {
  id: string
  name: string
  imageUrl: string
  source: BannerSource
  targetUrl?: string
  startDate?: string
  endDate?: string
  status: BannerStatus
  reviewNote?: string
  createdAt: string
}

export interface Notification {
  id: string
  type: NotificationType
  title: string
  body: string
  bannerId: string | null
  timestamp: string
  read: boolean
}

export interface SuggestedPrompt {
  label: string
  prompt: string
}

export interface AIHistoryItem {
  id: string
  url: string
}

export interface PaymentMethod {
  id: string
  label: string
  available: string
  image: string
}

export interface SupportAutoReply {
  q: string
  a: string
}

// ---------------------------------------------------------------------------
// Mock Data Exports
// ---------------------------------------------------------------------------

export const INITIAL_BANNERS: Banner[] = [
  {
    id: 'banner-1',
    name: 'Summer Luxury Nail Promo 2026',
    imageUrl: '/assets/images/marketing/nail/nail_summer_pop.jpg',
    source: 'uploaded',
    targetUrl: 'https://vlinkpay.com/summer-promo',
    startDate: '2026-06-01',
    endDate: '2026-06-30',
    status: 'active',
    createdAt: '2026-05-20',
  },
  {
    id: 'banner-2',
    name: 'Modern French Manicure Offer',
    imageUrl: '/assets/images/marketing/nail/nail_glam_french.jpg',
    source: 'ai_generated',
    targetUrl: 'https://cryptomap360.com/gift-card',
    startDate: '2026-06-10',
    endDate: '2026-06-25',
    status: 'pending_review',
    createdAt: '2026-05-28',
  },
  {
    id: 'banner-3',
    name: 'Zen Sakura Nails Grand Opening',
    imageUrl: '/assets/images/marketing/nail/nail_zen_minimalist.jpg',
    source: 'uploaded',
    targetUrl: 'https://bitcoinnailbar.xyz/opening',
    startDate: '2026-05-15',
    endDate: '2026-06-15',
    status: 'draft',
    createdAt: '2026-05-27',
  },
  {
    id: 'banner-4',
    name: 'Rose Quartz Marble Nails Special',
    imageUrl: '/assets/images/marketing/nail/nail_rose_quartz.jpg',
    source: 'ai_generated',
    targetUrl: 'https://nailhub.ai/crypto-pay',
    startDate: '2026-05-01',
    endDate: '2026-05-20',
    status: 'rejected',
    reviewNote:
      'The image contains text at too low a resolution to meet mobile display standards. Please regenerate or replace with a sharper image.',
    createdAt: '2026-05-01',
  },
  {
    id: 'banner-5',
    name: 'Nail Spa & Cuticle Care Treatment',
    imageUrl: '/assets/images/marketing/nail/nail_spa_treatment.jpg',
    source: 'uploaded',
    targetUrl: 'https://vlinkpay.com/loyalty',
    startDate: '2026-04-01',
    endDate: '2026-04-30',
    status: 'expired',
    createdAt: '2026-03-25',
  },
  {
    id: 'banner-6',
    name: 'Luxury Elegance Nail Art Studio',
    imageUrl: '/assets/images/marketing/nail/nail_art_luxury.jpg',
    source: 'ai_generated',
    targetUrl: 'https://nailhub.ai/art-festival',
    startDate: '2026-05-05',
    endDate: '2026-06-05',
    status: 'paused',
    createdAt: '2026-05-02',
  },
]

export const SUGGESTED_PROMPTS: SuggestedPrompt[] = [
  {
    label: 'Luxury Nail',
    prompt:
      'Create a luxury banner for a nail salon promotion with elegant gold accents, soft pink background, premium beauty style, and a clear “Book Now” call-to-action.',
  },
  {
    label: 'Crypto Payment',
    prompt:
      'Create a modern banner announcing that this merchant accepts crypto payments, using a clean fintech style, blue and purple colors, and a “Pay with Crypto” call-to-action.',
  },
  {
    label: 'Gift Card Discount',
    prompt:
      'Create a promotional banner for a gift card discount campaign, highlighting a special offer, bright modern colors, and a clear “Buy Gift Card” call-to-action.',
  },
  {
    label: 'Featured Merchant',
    prompt:
      'Create a professional featured merchant banner that highlights the business name, trust, service quality, and a “View Merchant” call-to-action.',
  },
  {
    label: 'Grand Opening',
    prompt:
      'Create a grand opening banner for a new business, using a festive modern style, bold headline, limited-time offer, and a “Learn More” call-to-action.',
  },
  {
    label: 'Limited Offer',
    prompt:
      'Create a high-converting banner for a limited-time special offer, with bold typography, urgency, promotional colors, and a clear “Claim Offer” call-to-action.',
  },
  {
    label: 'Minimalist',
    prompt:
      'Create a minimalist banner with generous white space, clean sans-serif typography, a single accent color, and a subtle “Discover More” call-to-action. Style: Swiss/International design.',
  },
  {
    label: 'Retro Vintage',
    prompt:
      'Create a retro vintage banner with warm sepia tones, distressed textures, classic serif fonts, retro badge elements, and a nostalgic “Shop Classic” call-to-action.',
  },
  {
    label: 'Neon Dark',
    prompt:
      'Create a neon-lit dark mode banner with a near-black background, vivid neon pink and cyan glow effects, bold futuristic typography, and an electrifying “Get Started” call-to-action.',
  },
  {
    label: 'Art Deco',
    prompt:
      'Create an Art Deco banner with geometric symmetry, gold and black palette, ornate line patterns, elegant serif typography, and a luxurious “Experience Elegance” call-to-action.',
  },
  {
    label: 'Glassmorphism',
    prompt:
      'Create a glassmorphism banner with a vibrant blurred gradient background, frosted-glass card overlay, soft shadows, clean white text, and a modern “Explore Now” call-to-action.',
  },
  {
    label: 'Pastel Kawaii',
    prompt:
      'Create a cute pastel kawaii banner with soft pink and lavender tones, rounded bubbly fonts, charming illustrated icons, and a playful “Shop Cute” call-to-action.',
  },
  {
    label: 'Bauhaus Bold',
    prompt:
      'Create a Bauhaus-inspired banner with primary colors (red, blue, yellow), strong geometric shapes, grid-based layout, bold sans-serif type, and a striking “Join Us” call-to-action.',
  },
  {
    label: 'Japanese Zen',
    prompt:
      'Create a Japanese zen minimalist banner with soft ink-wash textures, natural muted tones, subtle sakura motifs, clean spacing, and a serene “Find Your Balance” call-to-action.',
  },
]

export const UPLOAD_REDESIGN_SUGGESTED_PROMPTS: SuggestedPrompt[] = [
  {
    label: 'Luxury gold',
    prompt:
      'Redesign with elegant gold accents, soft pink background, premium beauty style, and clearer promotional text.',
  },
  {
    label: 'Summer promo',
    prompt:
      'Refresh with a bright summer theme, warm colors, bold headline, and a limited-time offer feel.',
  },
  {
    label: 'Dark neon',
    prompt:
      'Transform into a dark neon style with vivid pink and cyan glow, futuristic typography, and high contrast.',
  },
  {
    label: 'Minimal clean',
    prompt:
      'Simplify to a minimalist look with more white space, clean sans-serif text, and one strong accent color.',
  },
  {
    label: 'Urgent offer',
    prompt:
      'Make it feel like a limited-time offer with bold typography, urgency cues, and brighter promotional colors.',
  },
  {
    label: 'Glass modern',
    prompt:
      'Apply a glassmorphism style with a vibrant gradient background, frosted overlay, and modern white text.',
  },
  {
    label: 'Retro vintage',
    prompt:
      'Restyle with warm sepia tones, distressed textures, classic serif fonts, and a nostalgic badge look.',
  },
  {
    label: 'Pastel soft',
    prompt:
      'Soften the design with pastel pink and lavender tones, rounded friendly typography, and a playful mood.',
  },
]

export const INITIAL_NOTIFICATIONS: Notification[] = [
  {
    id: 'n1',
    type: 'approved',
    title: 'Banner approved',
    body: '"Summer Promo 2026" has been approved and is now live.',
    bannerId: 'banner-1',
    timestamp: '2026-06-04T10:30:00',
    read: false,
  },
  {
    id: 'n2',
    type: 'rejected',
    title: 'Banner rejected',
    body: '"Crypto Payment Banner V2" was rejected: content does not meet policy guidelines.',
    bannerId: 'banner-4',
    timestamp: '2026-06-03T15:00:00',
    read: false,
  },
  {
    id: 'n3',
    type: 'expired',
    title: 'Banner expired',
    body: '"Bitcoin Nails Grand Opening" expired on Jun 15.',
    bannerId: 'banner-3',
    timestamp: '2026-06-02T00:00:00',
    read: true,
  },
]

export const AI_HISTORY_LIST: AIHistoryItem[] = [
  {
    id: 'r01',
    url: '/assets/images/marketing/nail/nail_art_luxury.jpg',
  },
  {
    id: 'r02',
    url: '/assets/images/marketing/nail/nail_zen_minimalist.jpg',
  },
]

export const PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: 'USDV',
    label: 'USDV',
    available: '79,000.00',
    image:
      'https://raw.githubusercontent.com/vlink-group/VlinkPay/refs/heads/main/icon/assets/new-icon/USDV.png',
  },
  {
    id: 'USDT',
    label: 'USDT',
    available: '79,000.00',
    image:
      'https://raw.githubusercontent.com/vlink-group/VlinkPay/refs/heads/main/icon/assets/new-icon/USDT.png',
  },
  {
    id: 'USD',
    label: 'USD',
    available: '79,000.00',
    image:
      'https://raw.githubusercontent.com/vlink-group/VlinkPay/refs/heads/main/icon/assets/new-icon/Usd.png',
  },
  {
    id: 'BTC',
    label: 'BTC',
    available: '100,000.25',
    image: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1.png',
  },
  {
    id: 'VND',
    label: 'VND',
    available: '50,000,000',
    image:
      'https://raw.githubusercontent.com/vlink-group/VlinkPay/refs/heads/main/icon/assets/new-icon/Dong.png',
  },
]

export const ADV_BANNER_POOL = [
  '/assets/images/marketing/nail/nail_art_luxury.jpg',
  '/assets/images/marketing/nail/nail_zen_minimalist.jpg',
  '/assets/images/marketing/nail/nail_glam_french.jpg',
  '/assets/images/marketing/nail/nail_summer_pop.jpg',
  '/assets/images/marketing/nail/nail_spa_treatment.jpg',
  '/assets/images/marketing/nail/nail_rose_quartz.jpg',
]

export const AI_QUALITY_COST = { low: 10, medium: 30, high: 60 } as const

export const PLAN_LIMITS: Record<string, number> = {
  Basic: 1,
  Premium: 3,
  Platinum: 10,
}

export const TAB_ORDER = [
  'hub',
  'create-ad',
  'manage',
  'buy-package',
  'notifications',
  'transactions',
] as const

export const SUPPORT_AUTO_REPLIES: SupportAutoReply[] = [
  {
    q: 'create banner',
    a: 'You can create a banner in two ways: (1) Upload a pre-designed file at <strong>Create Ad → Upload Banner</strong>, or (2) Use AI at <strong>Create Ad → Create with AI</strong>. Banners are reviewed and activated within 24 hours.',
  },
  {
    q: 'add credit',
    a: 'You can add more credits by upgrading your plan or purchasing credits separately under <strong>Buy Package</strong>. Premium includes 500 credits; Platinum includes 2000 credits.',
  },
  {
    q: 'banner rejected',
    a: 'If your banner was rejected, view the reason under <strong>Manage Banner → View details</strong>. After making the requested changes, upload again and resubmit for review.',
  },
  {
    q: 'upgrade package',
    a: 'To upgrade, go to <strong>Buy Package</strong> and choose a plan. Premium ($79/month) allows 3 concurrent banners. Platinum ($199/month) allows up to 10 banners with VIP review priority.',
  },
]
