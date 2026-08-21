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
    description: 'Dịch vụ Pedicure cao cấp với tinh chất vàng 24K, massage đá nóng 20p và đắp mặt nạ chân.',
  },
  {
    name: 'Paris Pearl',
    categoryNames: ['Pedicure'],
    price: 75.0,
    memberPrice: 65.0,
    durationMinutes: 60,
    tags: ['Best Value'],
    description: 'Chăm sóc móng chân ngọc trai Paris, tẩy tế bào chết muối biển và massage thảo mộc.',
  },
  {
    name: 'Milk and Honey',
    categoryNames: ['Pedicure'],
    price: 55.0,
    memberPrice: 48.0,
    durationMinutes: 45,
    tags: ['Organic'],
    description: 'Ngâm chân sữa tươi & mật ong thiên nhiên, làm mềm gót chân.',
  },
  {
    name: 'Essential Pedicure',
    categoryNames: ['Pedicure'],
    price: 42.0,
    memberPrice: 38.0,
    durationMinutes: 35,
    tags: ['Classic'],
    description: 'Cắt da, tạo form móng, chà gót và sơn màu chuẩn salon.',
  },
  {
    name: 'Express Pedicure',
    categoryNames: ['Pedicure'],
    price: 35.0,
    memberPrice: 30.0,
    durationMinutes: 30,
    tags: ['Classic'],
    description: 'Chăm sóc móng chân nhanh gọn, cắt da, tạo form và thoa kem dưỡng.',
  },
  {
    name: 'Callus Removal',
    categoryNames: ['Pedicure', 'Add-ons'],
    price: 10.0,
    durationMinutes: 10,
    tags: ['Add-on', 'Callus'],
    description: 'Xử lý vết chai sần gót chân bằng serum đặc trị và chà nhám chuyên sâu.',
    isAddon: true,
  },
  {
    name: 'Sugar Scrub Exfoliation',
    categoryNames: ['Pedicure', 'Add-ons'],
    price: 8.0,
    durationMinutes: 10,
    tags: ['Add-on', 'Scrub'],
    description: 'Tẩy tế bào chết bằng đường nâu hữu cơ và tinh dầu dừa thiên nhiên.',
    isAddon: true,
  },
  {
    name: 'Smooth Feet Combo',
    categoryNames: ['Pedicure', 'Add-ons'],
    price: 15.0,
    durationMinutes: 15,
    tags: ['Add-on', 'Combo'],
    description: 'Gói kết hợp tẩy tế bào chết và ủ sáp dưỡng ẩm làm mềm gót chân.',
    isAddon: true,
  },
  {
    name: 'Add Shellac With Pedicure Service',
    categoryNames: ['Pedicure', 'Shellac'],
    price: 20.0,
    durationMinutes: 15,
    tags: ['Shellac', 'Add-on'],
    description: 'Nâng cấp sơn Shellac bền màu bóng đẹp cho dịch vụ Pedicure.',
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
    description: 'Kỹ thuật nhặt da khô chuẩn Nga, phom móng chuẩn xác.',
  },
  {
    name: 'Deluxe Collagen Manicure',
    categoryNames: ['Manicure'],
    price: 45.0,
    memberPrice: 39.0,
    durationMinutes: 45,
    tags: ['Collagen', 'Best Value'],
    description: 'Găng tay collagen chống lão hóa, chăm sóc khóe móng và sơn gel cao cấp.',
  },
  {
    name: 'Gel Manicure',
    categoryNames: ['Manicure', 'Shellac'],
    price: 38.0,
    memberPrice: 32.0,
    durationMinutes: 40,
    tags: ['Gel', 'Bestseller'],
    description: 'Sơn gel giữ màu 3-4 tuần với hơn 500 màu thịnh hành.',
  },
  {
    name: 'Classic Manicure',
    categoryNames: ['Manicure'],
    price: 25.0,
    memberPrice: 22.0,
    durationMinutes: 25,
    tags: ['Classic'],
    description: 'Cắt tỉa móng, dưỡng ẩm tinh dầu hoa hồng tự nhiên.',
  },

  // Acrylic Nail Service
  {
    name: 'Full Set Acrylic with Gel',
    categoryNames: ['Acrylic Nail Service'],
    price: 55.0,
    memberPrice: 48.0,
    durationMinutes: 60,
    tags: ['Acrylic', 'Gel', 'Bestseller'],
    description: 'Đắp móng bột Acrylic hoàn thiện sơn gel cao cấp.',
  },
  {
    name: 'Full Set Acrylic Regular',
    categoryNames: ['Acrylic Nail Service'],
    price: 45.0,
    memberPrice: 40.0,
    durationMinutes: 50,
    tags: ['Acrylic'],
    description: 'Đắp móng bột Acrylic tiêu chuẩn kèm sơn thường.',
  },
  {
    name: 'Acrylic Refill',
    categoryNames: ['Acrylic Nail Service'],
    price: 35.0,
    memberPrice: 30.0,
    durationMinutes: 40,
    tags: ['Acrylic'],
    description: 'Châm bột móng nối Acrylic.',
  },

  // Dipping Nail
  {
    name: 'Dipping Ombre',
    categoryNames: ['Dipping Nail'],
    price: 65.0,
    memberPrice: 58.0,
    durationMinutes: 60,
    tags: ['Dipping', 'Ombre', 'Save $15'],
    description: 'Nhúng bột hiệu ứng ombre chuyển màu tự nhiên.',
  },
  {
    name: 'Dipping Powder Color',
    categoryNames: ['Dipping Nail'],
    price: 50.0,
    memberPrice: 44.0,
    durationMinutes: 45,
    tags: ['Dipping', 'Organic'],
    description: 'Nhúng bột màu dinh dưỡng hữu cơ không lưu huỳnh.',
  },

  // Builder Gel Service
  {
    name: 'Builder Gel Full Set with Tips',
    categoryNames: ['Builder Gel Service'],
    price: 70.0,
    memberPrice: 62.0,
    durationMinutes: 65,
    tags: ['Builder Gel', 'VIP'],
    description: 'Nối móng gel định hình chuẩn form sang trọng.',
  },
  {
    name: 'Builder Gel Overlay',
    categoryNames: ['Builder Gel Service'],
    price: 55.0,
    memberPrice: 49.0,
    durationMinutes: 50,
    tags: ['Builder Gel'],
    description: 'Tráng gel cứng bảo vệ móng tự nhiên không gãy.',
  },

  // Waxing & Others
  {
    name: 'Eyebrow Waxing',
    categoryNames: ['Waxing Service'],
    price: 15.0,
    durationMinutes: 15,
    tags: ['Waxing'],
    description: 'Tỉa và wax định hình chân mày.',
  },
  {
    name: 'Upper Lip Waxing',
    categoryNames: ['Waxing Service'],
    price: 10.0,
    durationMinutes: 10,
    tags: ['Waxing'],
    description: 'Wax ria mép nhẹ nhàng.',
  },
]
