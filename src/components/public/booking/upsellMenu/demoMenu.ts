/**
 * Menu demo cho màn Upsell Menu.
 *
 * Port dữ liệu từ `src/data/seedPosDemoMenu.ts` của vlink-nexora-fe
 * (branch `feature/800_pos-menu-upsell`). Phần gọi repository để seed lên
 * API đã bỏ — repo này chưa có repository POS, và màn preview chỉ cần dữ
 * liệu tĩnh.
 */

export interface DemoCategorySeed {
  name: string
}

export interface DemoServiceSeed {
  name: string
  categoryNames: string[]
  price: number
  memberPrice?: number
  durationMinutes: number
  tags: string[]
  description: string
  isAddon?: boolean
}

export const DEMO_CATEGORIES: DemoCategorySeed[] = [
  { name: 'Pedicure' },
  { name: 'Manicure' },
  { name: 'Acrylic Nail Service' },
  { name: 'Dipping Nail' },
  { name: 'Builder Gel Service' },
  { name: 'Shellac' },
  { name: 'Waxing Service' },
  { name: "Kid's Menu (under 12 years old)" },
  { name: 'Additional Service' },
  { name: 'Additional' },
  { name: 'Complimentary Drinks' },
  { name: 'Add-ons' },
]

export const DEMO_SERVICES: DemoServiceSeed[] = [
  // Pedicure Main & Addons
  {
    name: 'Bitcoin 24K Gold',
    categoryNames: ['Pedicure'],
    price: 99.0,
    memberPrice: 85.0,
    durationMinutes: 75,
    tags: ['VIP', 'Bestseller'],
    description: 'Ultra-luxurious pedicure with 24K gold serum, 20-min hot stone massage & botanical foot mask.',
  },
  {
    name: 'Paris Pearl',
    categoryNames: ['Pedicure'],
    price: 75.0,
    memberPrice: 65.0,
    durationMinutes: 60,
    tags: ['Best Value'],
    description: 'Parisian pearl foot spa, sea salt exfoliation & calming herbal massage.',
  },
  {
    name: 'Milk and Honey',
    categoryNames: ['Pedicure'],
    price: 55.0,
    memberPrice: 48.0,
    durationMinutes: 45,
    tags: ['Organic'],
    description: 'Fresh milk & organic honey foot soak, smoothing dry cracked heels.',
  },
  {
    name: 'Essential Pedicure',
    categoryNames: ['Pedicure'],
    price: 42.0,
    memberPrice: 38.0,
    durationMinutes: 35,
    tags: ['Classic'],
    description: 'Cuticle grooming, precision nail shaping, heel buffing & salon regular polish.',
  },
  {
    name: 'Express Pedicure',
    categoryNames: ['Pedicure'],
    price: 35.0,
    memberPrice: 30.0,
    durationMinutes: 30,
    tags: ['Classic'],
    description: 'Quick refresh pedicure, cuticle clean, shaping & moisturizing lotion.',
  },
  {
    name: 'Callus Removal',
    categoryNames: ['Pedicure', 'Add-ons'],
    price: 10.0,
    durationMinutes: 10,
    tags: ['Add-on', 'Callus'],
    description: 'Intensive callus treatment serum with deep heel smoothing therapy.',
    isAddon: true,
  },
  {
    name: 'Sugar Scrub Exfoliation',
    categoryNames: ['Pedicure', 'Add-ons'],
    price: 8.0,
    durationMinutes: 10,
    tags: ['Add-on', 'Scrub'],
    description: 'Organic brown sugar scrub exfoliation with natural coconut essential oils.',
    isAddon: true,
  },
  {
    name: 'Smooth Feet Combo',
    categoryNames: ['Pedicure', 'Add-ons'],
    price: 15.0,
    durationMinutes: 15,
    tags: ['Add-on', 'Combo'],
    description: 'Exfoliation scrub paired with warm paraffin moisture wax treatment.',
    isAddon: true,
  },
  {
    name: 'Add Shellac With Pedicure Service',
    categoryNames: ['Pedicure', 'Shellac'],
    price: 20.0,
    durationMinutes: 15,
    tags: ['Shellac', 'Add-on'],
    description: 'Shellac long-lasting high-gloss upgrade for any pedicure service.',
    isAddon: true,
  },

  // Manicure
  {
    name: 'Russian Manicure',
    categoryNames: ['Manicure'],
    price: 55.0,
    memberPrice: 48.0,
    durationMinutes: 50,
    tags: ['VIP', 'Russian Technique'],
    description: 'Dry Russian e-file cuticle detailing with immaculate nail shaping.',
  },
  {
    name: 'Deluxe Collagen Manicure',
    categoryNames: ['Manicure'],
    price: 45.0,
    memberPrice: 39.0,
    durationMinutes: 45,
    tags: ['Collagen', 'Best Value'],
    description: 'Anti-aging collagen gloves, meticulous cuticle care & luxury gel polish.',
  },
  {
    name: 'Gel Manicure',
    categoryNames: ['Manicure', 'Shellac'],
    price: 38.0,
    memberPrice: 32.0,
    durationMinutes: 40,
    tags: ['Gel', 'Bestseller'],
    description: 'Long-lasting gel lacquer staying flawless 3-4 weeks with 500+ trending shades.',
  },
  {
    name: 'Classic Manicure',
    categoryNames: ['Manicure'],
    price: 25.0,
    memberPrice: 22.0,
    durationMinutes: 25,
    tags: ['Classic'],
    description: 'Natural nail trimming, gentle cuticle tidy & organic rose oil hydration.',
  },

  // Acrylic Nail Service
  {
    name: 'Full Set Acrylic with Gel',
    categoryNames: ['Acrylic Nail Service'],
    price: 55.0,
    memberPrice: 48.0,
    durationMinutes: 60,
    tags: ['Acrylic', 'Gel', 'Bestseller'],
    description: 'Full set acrylic extensions with durable high-shine gel finish.',
  },
  {
    name: 'Full Set Acrylic Regular',
    categoryNames: ['Acrylic Nail Service'],
    price: 45.0,
    memberPrice: 40.0,
    durationMinutes: 50,
    tags: ['Acrylic'],
    description: 'Standard full set acrylic extensions with classic salon polish.',
  },
  {
    name: 'Acrylic Refill',
    categoryNames: ['Acrylic Nail Service'],
    price: 35.0,
    memberPrice: 30.0,
    durationMinutes: 40,
    tags: ['Acrylic'],
    description: 'Acrylic refill maintenance for outgrowth with reshaping & fresh color.',
  },

  // Dipping Nail
  {
    name: 'Dipping Ombre',
    categoryNames: ['Dipping Nail'],
    price: 65.0,
    memberPrice: 58.0,
    durationMinutes: 60,
    tags: ['Dipping', 'Ombre', 'Save $15'],
    description: 'Organic dipping powder with soft seamless ombre color transition.',
  },
  {
    name: 'Dipping Powder Color',
    categoryNames: ['Dipping Nail'],
    price: 50.0,
    memberPrice: 44.0,
    durationMinutes: 45,
    tags: ['Dipping', 'Organic'],
    description: 'Nutrient-rich organic dipping powder free of harsh chemicals and odor.',
  },

  // Builder Gel Service
  {
    name: 'Builder Gel Full Set with Tips',
    categoryNames: ['Builder Gel Service'],
    price: 70.0,
    memberPrice: 62.0,
    durationMinutes: 65,
    tags: ['Builder Gel', 'VIP'],
    description: 'Structured builder gel extensions shaped to elegant bespoke forms.',
  },
  {
    name: 'Builder Gel Overlay',
    categoryNames: ['Builder Gel Service'],
    price: 55.0,
    memberPrice: 49.0,
    durationMinutes: 50,
    tags: ['Builder Gel'],
    description: 'Reinforcing BIAB builder gel overlay to shield natural nails from chipping.',
  },

  // Waxing & Others
  {
    name: 'Eyebrow Waxing',
    categoryNames: ['Waxing Service'],
    price: 15.0,
    durationMinutes: 15,
    tags: ['Waxing'],
    description: 'Precision eyebrow mapping, sculpting & gentle botanical wax.',
  },
  {
    name: 'Upper Lip Waxing',
    categoryNames: ['Waxing Service'],
    price: 10.0,
    durationMinutes: 10,
    tags: ['Waxing'],
    description: 'Gentle and soothing upper lip facial waxing.',
  },
]
