/**
 * Màn menu dịch vụ + tuỳ chỉnh add-on + gợi ý nâng gói theo delta price.
 *
 * Port từ `src/components/public/booking/PosMenuUpsellPreviewPage.tsx` của
 * vlink-nexora-fe (branch `feature/800_pos-menu-upsell`, commit d446df17,
 * issue vlink-group#800).
 *
 * Repo này chưa có module POS — không có `views/pos/`, `usePosCategories`,
 * `usePosServices`, `posServices` repository, cũng không có `PosServiceApiDto`
 * trong `src/types/repositories.ts`. Nên bản port khác bản gốc đúng 2 điểm,
 * không đổi giao diện hay công thức tính giá:
 *
 * - Nguồn dữ liệu là menu demo tĩnh (`upsellMenu/demoMenu`) thay cho TanStack
 *   Query hooks của POS. Bản gốc cũng chỉ hiển thị demo vì hook luôn rỗng ở
 *   route public.
 * - Type và 2 helper đọc metadata được khai tại chỗ trong `upsellMenu/` thay
 *   vì import từ POS.
 *
 * Nút "Quay lại Quản Lý POS" trỏ `/dashboard/pos/services` — route đó chưa tồn
 * tại ở repo này, để nguyên cho khớp bản gốc khi module POS về sau.
 *
 * Bản gốc dựng dữ liệu demo bằng tên field sai (`businessId`/`sortOrder` thay
 * vì `displayOrder`) nên `tsc` báo 2 lỗi TS2322/TS2352; ở đây dùng đúng tên
 * field nên file sạch lỗi. Bản gốc cũng bỏ rơi `memberPrice` của seed khiến
 * nút VIP không đổi giá nào với dữ liệu demo — ở đây giữ lại.
 */

import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowUpRight,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Crown,
  Edit2,
  Gift,
  MapPin,
  Plus,
  Scissors,
  Search,
  ShoppingBag,
  Sparkles,
  Star,
  Trash2,
  X,
} from 'lucide-react'
import { DEMO_CATEGORIES, DEMO_SERVICES } from './upsellMenu/demoMenu'
import type { PosCategory, PosService } from './upsellMenu/types'
import { extractMemberPriceFromService, parseLinkedAddons } from './upsellMenu/menuHelpers'

export interface IncludedAddonItem {
  id: string
  name: string
  price: number
  description: string
  durationMinutes: number
  badge?: string
}

export interface CustomizerAddonOption {
  id: string
  name: string
  price: number
  durationMinutes: number
  description: string
}

export interface SmartUpgradeBreakdown {
  targetService: PosService
  targetBasePrice: number
  currentCustomTotal: number
  absorbedAddons: CustomizerAddonOption[]
  absorbedValue: number
  unabsorbedAddons: CustomizerAddonOption[]
  unabsorbedTotal: number
  upgradedTotal: number
  diff: number
  isFreeOrCheaper: boolean
  targetDuration: number
  upgradedDuration: number
}

export interface SelectedServiceItem {
  id: string
  serviceId: string
  categoryId: string
  name: string
  price: number
  memberPrice?: number
  durationMinutes: number
  selectedAddonIds: string[]
  includedAddons: IncludedAddonItem[]
}

export const ALL_STANDARD_CUSTOMIZER_ADDONS: CustomizerAddonOption[] = [
  { id: 'a_milk', name: 'Milk & Honey Soak', price: 12, durationMinutes: 10, description: 'Ngâm sữa tươi & mật ong làm mềm da' },
  { id: 'a_pearl', name: 'Pearl Powder Treatment', price: 18, durationMinutes: 15, description: 'Ủ bột ngọc trai Paris sáng mịn' },
  { id: 'a_gold', name: '24K Gold Treatment', price: 25, durationMinutes: 20, description: 'Tinh chất vàng 24K trẻ hóa da' },
  { id: 'a_scrub', name: 'Sugar Scrub Exfoliation', price: 8, durationMinutes: 10, description: 'Tẩy tế bào chết hạt đường nâu tự nhiên' },
  { id: 'a_callus', name: 'Callus Removal', price: 10, durationMinutes: 10, description: 'Chà gót xử lý chai sần chuyên sâu' },
  { id: 'a_stone', name: 'Hot Stone Massage', price: 10, durationMinutes: 10, description: 'Massage đá nóng thảo dược thư giãn cơ bắp' },
  { id: 'a_paraffin', name: 'Paraffin Wax', price: 15, durationMinutes: 10, description: 'Ủ sáp paraffin giữ ẩm và phục hồi da' },
  { id: 'a_collagen', name: 'Collagen Gloves / Socks', price: 15, durationMinutes: 10, description: 'Ủ dưỡng chất collagen chống lão hóa' },
  { id: 'a_massage', name: '10-Min Extra Massage', price: 20, durationMinutes: 10, description: 'Massage bấm huyệt tăng cường 10 phút' },
  { id: 'a_shellac', name: 'Shellac Polish', price: 20, durationMinutes: 15, description: 'Sơn Shellac bóng đẹp bền màu 3-4 tuần' },
  { id: 'm_french', name: 'French Tip Style', price: 12, durationMinutes: 10, description: 'Đầu móng phong cách French thanh lịch' },
  { id: 'sa_art', name: 'Art per nail', price: 5, durationMinutes: 5, description: 'Vẽ nghệ thuật theo từng móng' },
  { id: 'sa_fullart', name: 'Full Set Art', price: 25, durationMinutes: 20, description: 'Thiết kế vẽ toàn bộ 10 móng' },
  { id: 'sa_chrome', name: 'Chrome / Mirror Finish', price: 15, durationMinutes: 10, description: 'Hiệu ứng tráng gương thời thượng' },
  { id: 'sa_ombre', name: 'Ombre / Gradient Color', price: 18, durationMinutes: 15, description: 'Hiệu ứng chuyển màu Ombre mượt mà' },
  { id: 'sa_3d', name: '3D Nail Art', price: 30, durationMinutes: 25, description: 'Đắp nổi hoa & họa tiết 3D' },
]

export function findAddonById(aId: string, addonServices: PosService[] = []): CustomizerAddonOption | null {
  const custom = ALL_STANDARD_CUSTOMIZER_ADDONS.find((a) => a.id === aId)
  if (custom) return custom
  const db = addonServices.find((a) => a.id === aId)
  if (db) {
    return {
      id: db.id,
      name: db.name,
      price: db.price,
      durationMinutes: db.durationMinutes || 10,
      description: db.description || '',
    }
  }
  return null
}

/**
 * Phase 1: Dynamic Resolution of includedAddons for each service/combo tier
 * Resolves packages/combos features & included add-ons from metadata, keywords, and tier rules.
 */
export function resolveIncludedAddons(
  service: PosService | null | undefined,
  allAddons: PosService[] = [],
): IncludedAddonItem[] {
  if (!service) return []
  const included: IncludedAddonItem[] = []
  const seenNames = new Set<string>()

  const addIncluded = (item: {
    id: string
    name: string
    price: number
    description: string
    durationMinutes?: number
    badge?: string
  }) => {
    const key = item.name.trim().toLowerCase()
    if (!seenNames.has(key)) {
      seenNames.add(key)
      included.push({
        id: item.id,
        name: item.name,
        price: item.price,
        description: item.description,
        durationMinutes: item.durationMinutes || 10,
        badge: item.badge || 'Đã bao gồm',
      })
    }
  }

  const desc = (service.description || '').toLowerCase()
  const name = service.name.toLowerCase()
  const tags = (service.tags || []).map((t) => t.toLowerCase())

  // 1. Explicit tags or metadata: Included:<Name>
  const tagIncludes = (service.tags || [])
    .filter((t) => t.toLowerCase().startsWith('included:') || t.toLowerCase().startsWith('includes:'))
    .map((t) => t.split(':')[1]?.trim())
    .filter(Boolean)

  tagIncludes.forEach((tagItem) => {
    const matched = allAddons.find(
      (a) => a.name.toLowerCase() === tagItem.toLowerCase() || a.id.toLowerCase() === tagItem.toLowerCase(),
    )
    if (matched) {
      addIncluded({
        id: matched.id,
        name: matched.name,
        price: matched.price,
        description: matched.description || 'Dịch vụ đi kèm trọn gói trong dịch vụ',
        durationMinutes: matched.durationMinutes,
      })
    } else {
      addIncluded({
        id: `inc-${tagItem.toLowerCase().replace(/\s+/g, '-')}`,
        name: tagItem,
        price: 10,
        description: 'Dịch vụ đi kèm trọn gói trong dịch vụ',
      })
    }
  })

  // 2. Explicit description matches: [INCLUDED: ...] or [INCLUDES: ...]
  const descMatch = service.description?.match(/\[(?:INCLUDED|INCLUDES):\s*(.*?)\]/i)
  if (descMatch && descMatch[1]) {
    const entries = descMatch[1].split(',').map((s) => s.trim()).filter(Boolean)
    entries.forEach((entry) => {
      const matched = allAddons.find(
        (a) => a.name.toLowerCase() === entry.toLowerCase() || a.id.toLowerCase() === entry.toLowerCase(),
      )
      if (matched) {
        addIncluded({
          id: matched.id,
          name: matched.name,
          price: matched.price,
          description: matched.description || 'Dịch vụ đi kèm trọn gói trong dịch vụ',
          durationMinutes: matched.durationMinutes,
        })
      } else {
        addIncluded({
          id: `inc-${entry.toLowerCase().replace(/\s+/g, '-')}`,
          name: entry,
          price: 10,
          description: 'Dịch vụ đi kèm trọn gói trong dịch vụ',
        })
      }
    })
  }

  // 3. Keyword / semantic scanning against available add-ons
  allAddons.forEach((addon) => {
    const aName = addon.name.toLowerCase()
    if (addon.id === service.id) return

    if (desc.includes(aName) || tags.includes(aName)) {
      addIncluded({
        id: addon.id,
        name: addon.name,
        price: addon.price,
        description: addon.description || 'Dịch vụ đi kèm trọn gói',
        durationMinutes: addon.durationMinutes,
      })
      return
    }

    if (
      (aName.includes('callus') || aName.includes('chà gót')) &&
      (desc.includes('callus') || desc.includes('chà gót') || desc.includes('chai sần') || desc.includes('gót chân'))
    ) {
      addIncluded({
        id: addon.id,
        name: addon.name,
        price: addon.price,
        description: addon.description || 'Xử lý vết chai sần gót chân chuyên sâu',
        durationMinutes: addon.durationMinutes,
      })
    } else if (
      (aName.includes('scrub') || aName.includes('exfoliat') || aName.includes('tẩy tế bào')) &&
      (desc.includes('scrub') || desc.includes('exfoliat') || desc.includes('tẩy tế bào') || desc.includes('muối biển') || desc.includes('đường nâu'))
    ) {
      addIncluded({
        id: addon.id,
        name: addon.name,
        price: addon.price,
        description: addon.description || 'Tẩy tế bào chết hữu cơ làm sáng mịn da',
        durationMinutes: addon.durationMinutes,
      })
    } else if (
      (aName.includes('hot stone') || aName.includes('đá nóng')) &&
      (desc.includes('đá nóng') || desc.includes('hot stone'))
    ) {
      addIncluded({
        id: addon.id,
        name: addon.name,
        price: addon.price,
        description: addon.description || 'Massage đá nóng thảo dược đả thông kinh lạc',
        durationMinutes: addon.durationMinutes,
      })
    } else if (
      (aName.includes('shellac') || aName.includes('gel')) &&
      (desc.includes('shellac') || desc.includes('sơn gel') || name.includes('with gel'))
    ) {
      addIncluded({
        id: addon.id,
        name: addon.name,
        price: addon.price,
        description: addon.description || 'Sơn Gel / Shellac bóng đẹp bền màu',
        durationMinutes: addon.durationMinutes,
      })
    }
  })

  // 4. Tier-based Luxury Inclusions for High-end Packages & Combos
  if (service.price >= 90 || name.includes('24k gold') || tags.includes('24k gold')) {
    addIncluded({
      id: 'inc-gold-mask',
      name: '24K Gold Foot Mask & Herbal Soak',
      price: 25,
      description: 'Tinh chất vàng 24K & đắp mặt nạ ủ dưỡng trẻ hóa da chân',
      durationMinutes: 15,
    })
    addIncluded({
      id: 'inc-hot-stone',
      name: 'Hot Stone Foot Massage (20 min)',
      price: 18,
      description: 'Massage đá nóng 20 phút chuyên sâu thư giãn cơ bắp',
      durationMinutes: 20,
    })
    addIncluded({
      id: 'inc-callus-treatment',
      name: 'Callus Removal Treatment',
      price: 10,
      description: 'Chà gót xử lý triệt để vùng da chai sần gót chân',
      durationMinutes: 10,
    })
    addIncluded({
      id: 'inc-sugar-scrub',
      name: 'Sugar Scrub Exfoliation',
      price: 8,
      description: 'Tẩy tế bào chết đường nâu hữu cơ và tinh dầu dừa',
      durationMinutes: 10,
    })
  } else if (service.price >= 70 || name.includes('paris pearl')) {
    addIncluded({
      id: 'inc-pearl-scrub',
      name: 'Paris Pearl Mineral Sea Salt Soak',
      price: 12,
      description: 'Ngâm muối khoáng & tẩy tế bào chết ngọc trai Paris',
      durationMinutes: 12,
    })
    addIncluded({
      id: 'inc-sugar-scrub',
      name: 'Sugar Scrub Exfoliation',
      price: 8,
      description: 'Tẩy tế bào chết đường nâu hữu cơ thiên nhiên',
      durationMinutes: 10,
    })
    addIncluded({
      id: 'inc-herbal-massage',
      name: 'Herbal Massage Therapy (15 min)',
      price: 10,
      description: 'Massage bấm huyệt thảo mộc thư giãn bàn chân',
      durationMinutes: 15,
    })
  } else if (service.price >= 50 || name.includes('milk and honey')) {
    addIncluded({
      id: 'inc-milk-honey-soak',
      name: 'Organic Milk & Honey Soak',
      price: 10,
      description: 'Ngâm chân sữa tươi tiệt trùng và mật ong thiên nhiên',
      durationMinutes: 10,
    })
    addIncluded({
      id: 'inc-heel-soften',
      name: 'Deep Heel Softening Treatment',
      price: 8,
      description: 'Ủ dưỡng chất làm mềm và phục hồi gót chân',
      durationMinutes: 8,
    })
  } else if (name.includes('essential pedicure') || service.price === 42) {
    addIncluded({
      id: 'inc-callus-treatment',
      name: 'Callus Removal',
      price: 10,
      description: 'Chà gót xử lý chai sần gót chân',
      durationMinutes: 10,
    })
    addIncluded({
      id: 'inc-sugar-scrub',
      name: 'Sugar Scrub Exfoliation',
      price: 8,
      description: 'Tẩy tế bào chết đường nâu hữu cơ',
      durationMinutes: 10,
    })
  } else if (name.includes('smooth feet combo')) {
    addIncluded({
      id: 'inc-callus-treatment',
      name: 'Callus Removal Treatment',
      price: 10,
      description: 'Chà gót xử lý chai sần chuyên sâu',
      durationMinutes: 10,
    })
    addIncluded({
      id: 'inc-sugar-scrub',
      name: 'Sugar Scrub Exfoliation',
      price: 8,
      description: 'Tẩy tế bào chết hạt đường nâu',
      durationMinutes: 10,
    })
  } else if (name.includes('russian manicure')) {
    addIncluded({
      id: 'inc-russian-cuticle',
      name: 'Russian Dry Cuticle Precision Care',
      price: 15,
      description: 'Kỹ thuật nhặt da khô vi phẫu chuẩn salon Nga',
      durationMinutes: 20,
    })
    addIncluded({
      id: 'inc-gel-finish',
      name: 'High-Gloss Gel Finish',
      price: 15,
      description: 'Sơn gel cao cấp chuẩn form móng',
      durationMinutes: 15,
    })
    addIncluded({
      id: 'inc-paraffin',
      name: 'Paraffin Wax Hydration Treatment',
      price: 15,
      description: 'Ủ sáp paraffin dưỡng ẩm sâu và làm mềm mịn bàn tay',
      durationMinutes: 10,
    })
    addIncluded({
      id: 'inc-hotstone-hand',
      name: 'Hot Stone Hand Massage',
      price: 10,
      description: 'Massage đá nóng thư giãn khớp ngón tay',
      durationMinutes: 10,
    })
  } else if (name.includes('deluxe collagen manicure')) {
    addIncluded({
      id: 'inc-collagen-gloves',
      name: 'Collagen Anti-Aging Gloves',
      price: 12,
      description: 'Găng tay ủ collagen cấp ẩm sâu và chống lão hóa',
      durationMinutes: 15,
    })
    addIncluded({
      id: 'inc-cuticle-care',
      name: 'Precision Cuticle & Nail Shaping',
      price: 8,
      description: 'Tạo form móng & chăm sóc khóe móng hoàn hảo',
      durationMinutes: 10,
    })
  } else if (name.includes('with gel') || (tags.includes('gel') && tags.includes('acrylic'))) {
    addIncluded({
      id: 'inc-gel-polish',
      name: 'High-Gloss Gel Polish Finish',
      price: 15,
      description: 'Sơn gel bền màu bóng đẹp chuẩn salon',
      durationMinutes: 15,
    })
  } else if (name.includes('ombre')) {
    addIncluded({
      id: 'inc-ombre-art',
      name: 'Ombre Color Blending Art',
      price: 15,
      description: 'Kỹ thuật chuyển màu Ombre tự nhiên',
      durationMinutes: 15,
    })
  }

  return included
}

/**
 * Helper to test if an add-on is absorbed (included) by an included items list
 */
export function isAddonAbsorbedBy(
  addon: { id: string; name: string },
  includedList: IncludedAddonItem[],
): boolean {
  const aId = addon.id.toLowerCase()
  const aName = addon.name.toLowerCase()

  return includedList.some((inc) => {
    const incId = inc.id.toLowerCase()
    const incName = inc.name.toLowerCase()
    if (aId === incId || aName === incName) return true
    if (aName.includes('callus') && (incName.includes('callus') || incId.includes('callus'))) return true
    if ((aName.includes('scrub') || aName.includes('exfoliat')) && (incName.includes('scrub') || incId.includes('scrub'))) return true
    if ((aName.includes('stone') || aName.includes('đá nóng')) && (incName.includes('stone') || incId.includes('stone'))) return true
    if ((aName.includes('paraffin') || aName.includes('sáp')) && (incName.includes('paraffin') || incId.includes('paraffin'))) return true
    if ((aName.includes('collagen') || aName.includes('găng tay')) && (incName.includes('collagen') || incId.includes('collagen'))) return true
    if (
      (aName.includes('shellac') || aName.includes('gel')) &&
      (incName.includes('shellac') || incName.includes('gel') || incId.includes('gel'))
    ) {
      return true
    }
    if ((aName.includes('milk') || aName.includes('honey') || aName.includes('soak')) && (incName.includes('milk') || incName.includes('soak') || incId.includes('milk') || incId.includes('soak'))) return true
    if ((aName.includes('pearl') || aName.includes('ngọc trai')) && (incName.includes('pearl') || incId.includes('pearl'))) return true
    if ((aName.includes('gold') || aName.includes('24k')) && (incName.includes('gold') || incId.includes('gold'))) return true
    if (aName.includes('smooth feet') && (incName.includes('callus') || incName.includes('scrub') || incName.includes('paraffin'))) return true
    return false
  })
}

export default function PosMenuUpsellPreviewPage() {
  const navigate = useNavigate()

  // View lifecycle: 'menu' (Step 1 Catalog) vs 'customize' (Step 2 Service Customizer)
  const [currentView, setCurrentView] = useState<'menu' | 'customize'>('menu')
  const [activeServiceId, setActiveServiceId] = useState<string | null>(null)

  // Selected Category & Search state
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [isVipMember, setIsVipMember] = useState(false)

  // Cart / Selected items state & Mobile Bottom Sheet Drawer state
  const [selectedItems, setSelectedItems] = useState<SelectedServiceItem[]>([])
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false)
  const [isRecapExpanded, setIsRecapExpanded] = useState(false)

  // Menu demo tĩnh. Bản gốc gọi TanStack Query trước rồi mới rơi về demo,
  // nhưng ở route public hook luôn rỗng nên nhánh demo là nhánh chạy thật —
  // và repo này chưa có hook POS để gọi.
  const categories: PosCategory[] = useMemo(
    () =>
      DEMO_CATEGORIES.map((c, i) => ({
        id: `demo-cat-${i + 1}`,
        name: c.name,
        displayOrder: i,
      })),
    [],
  )

  const allServices: PosService[] = useMemo(
    () =>
      DEMO_SERVICES.map((s, i) => {
        const matchedCat = categories.find((c) => s.categoryNames.includes(c.name))
        return {
          id: `demo-svc-${i + 1}`,
          name: s.name,
          price: s.price,
          // Bản gốc bỏ rơi memberPrice của seed nên nút VIP không đổi giá nào
          // với dữ liệu demo; giữ lại để toggle VIP có tác dụng thật.
          memberPrice: s.memberPrice,
          durationMinutes: s.durationMinutes,
          description: s.description,
          categoryIds: matchedCat ? [matchedCat.id] : [categories[0]?.id || 'cat-1'],
          tags: s.tags,
          status: 'Active',
          displayOrder: i,
        }
      }),
    [categories],
  )

  // Separate Add-on services from Main services
  const addonServices = useMemo(() => {
    return allServices.filter(
      (s) =>
        s.tags?.some((t) => t.toLowerCase().includes('add-on') || t.toLowerCase().includes('addon')) ||
        s.categoryIds?.some((cId) => {
          const cat = categories.find((c) => c.id === cId)
          return cat && (cat.name.toLowerCase().includes('add-on') || cat.name.toLowerCase().includes('addon'))
        }),
    )
  }, [allServices, categories])

  const mainServices = useMemo(() => {
    return allServices.filter((s) => !addonServices.includes(s) && s.status === 'Active')
  }, [allServices, addonServices])

  // Filter main services by Category and Search
  const filteredMainServices = useMemo(() => {
    let list = mainServices
    if (selectedCategoryId !== 'all') {
      list = list.filter((s) => s.categoryIds.includes(selectedCategoryId))
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          (s.description && s.description.toLowerCase().includes(q)) ||
          s.tags?.some((t) => t.toLowerCase().includes(q)),
      )
    }
    return list
  }, [mainServices, selectedCategoryId, searchQuery])

  // Category image map helper
  const getCategoryPhoto = (catName: string) => {
    const lower = catName.toLowerCase()
    if (lower.includes('pedi')) return '/prototype/assets/cat-pedicure.jpg'
    if (lower.includes('mani')) return '/prototype/assets/cat-manicure.jpg'
    if (
      lower.includes('combo') ||
      lower.includes('package') ||
      lower.includes('art') ||
      lower.includes('gel') ||
      lower.includes('dip') ||
      lower.includes('enhanc')
    )
      return '/prototype/assets/cat-enhancements.jpg'
    if (lower.includes('wax')) return '/prototype/assets/cat-waxing.jpg'
    if (lower.includes('kid')) return '/prototype/assets/cat-kids.jpg'
    return '/prototype/assets/cat-pedicure.jpg'
  }

  // Service image map helper with fallback to system photoUrl or theme photo
  const getServicePhoto = (service: PosService | null | undefined): string => {
    if (!service) return '/prototype/assets/cat-pedicure.jpg'
    if (service.photoUrl && service.photoUrl.trim() !== '') {
      return service.photoUrl
    }

    const name = service.name.toLowerCase()
    const desc = (service.description || '').toLowerCase()
    const tags = (service.tags || []).map((t) => t.toLowerCase())

    if (name.includes('gold') || name.includes('24k')) {
      return 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&q=80&w=600'
    }
    if (name.includes('pearl')) {
      return 'https://images.unsplash.com/photo-1519415510236-718bdfcd89c8?auto=format&fit=crop&q=80&w=600'
    }
    if (name.includes('milk') || name.includes('honey')) {
      return 'https://images.unsplash.com/photo-1560750588-73207b1ef5b8?auto=format&fit=crop&q=80&w=600'
    }
    if (name.includes('russian')) {
      return 'https://images.unsplash.com/photo-1632345031435-8727f6897d53?auto=format&fit=crop&q=80&w=600'
    }
    if (name.includes('collagen') || name.includes('deluxe mani')) {
      return 'https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&q=80&w=600'
    }
    if (name.includes('acrylic') || name.includes('full set') || name.includes('art') || tags.includes('acrylic')) {
      return 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&q=80&w=600'
    }
    if (name.includes('dip') || name.includes('dipping') || name.includes('builder') || name.includes('shellac') || name.includes('gel')) {
      return 'https://images.unsplash.com/photo-1607779097040-26e80aa78e66?auto=format&fit=crop&q=80&w=600'
    }
    if (name.includes('wax') || tags.includes('waxing')) {
      return 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&q=80&w=600'
    }
    if (name.includes('kid')) {
      return 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&q=80&w=600'
    }
    if (name.includes('pedi') || desc.includes('pedicure')) {
      return '/prototype/assets/cat-pedicure.jpg'
    }
    if (name.includes('mani') || desc.includes('manicure')) {
      return '/prototype/assets/cat-manicure.jpg'
    }

    return '/prototype/assets/cat-pedicure.jpg'
  }

  // Active service being customized
  const activeService = useMemo(() => {
    if (!activeServiceId) return null
    return allServices.find((s) => s.id === activeServiceId) || null
  }, [allServices, activeServiceId])

  const activeItem = useMemo(() => {
    if (!activeServiceId) return null
    return selectedItems.find((i) => i.serviceId === activeServiceId) || null
  }, [selectedItems, activeServiceId])

  // Phase 1: Dynamically resolve included add-ons for the active service
  const currentIncludedAddons = useMemo(() => {
    return resolveIncludedAddons(activeService, addonServices)
  }, [activeService, addonServices])

  // Smart Upsell Math Engine for any service + add-ons
  const getServiceUpgradeSuggestion = (
    service: PosService,
    selectedAddonIds: string[] = [],
  ): SmartUpgradeBreakdown | null => {
    const rawMember = extractMemberPriceFromService(service)
    const memberPriceNum = Number(rawMember)
    const hasMember = isVipMember && Number.isFinite(memberPriceNum) && memberPriceNum > 0
    const currentBasePrice = hasMember ? memberPriceNum : service.price

    let currentAddonTotal = 0
    const selectedAddonObjects: CustomizerAddonOption[] = []

    selectedAddonIds.forEach((id) => {
      const addon = findAddonById(id, addonServices)
      if (addon) {
        currentAddonTotal += addon.price
        selectedAddonObjects.push(addon)
      }
    })

    const currentCustomTotal = currentBasePrice + currentAddonTotal

    // Find candidate services:
    // 1. First priority: Higher-tier services in the same category
    // 2. Second priority: If no higher tier in same category, higher tier in related categories
    let candidateServices = mainServices
      .filter(
        (s) =>
          s.id !== service.id &&
          s.categoryIds.some((c) => service.categoryIds.includes(c)) &&
          s.price > service.price,
      )
      .sort((a, b) => a.price - b.price)

    if (candidateServices.length === 0) {
      candidateServices = mainServices
        .filter((s) => s.id !== service.id && s.price > service.price)
        .sort((a, b) => a.price - b.price)
    }

    if (candidateServices.length === 0) return null

    // Evaluate each candidate to find the best upgrade option
    let bestCandidateData: {
      targetService: PosService
      targetBasePrice: number
      absorbedAddons: CustomizerAddonOption[]
      absorbedValue: number
      unabsorbedAddons: CustomizerAddonOption[]
      unabsorbedTotal: number
      upgradedTotal: number
      diff: number
      isFreeOrCheaper: boolean
      targetDuration: number
      upgradedDuration: number
      score: number
    } | null = null

    for (const candidate of candidateServices) {
      const targetIncluded = resolveIncludedAddons(candidate, addonServices)
      const rawTargetMember = extractMemberPriceFromService(candidate)
      const targetMemberNum = Number(rawTargetMember)
      const hasTargetMember = isVipMember && Number.isFinite(targetMemberNum) && targetMemberNum > 0
      const targetBasePrice = hasTargetMember ? targetMemberNum : candidate.price

      const absorbedAddons: CustomizerAddonOption[] = []
      const unabsorbedAddons: CustomizerAddonOption[] = []
      let absorbedValue = 0
      let unabsorbedTotal = 0

      selectedAddonObjects.forEach((addon) => {
        if (isAddonAbsorbedBy(addon, targetIncluded)) {
          absorbedAddons.push(addon)
          absorbedValue += addon.price
        } else {
          unabsorbedAddons.push(addon)
          unabsorbedTotal += addon.price
        }
      })

      const upgradedTotal = targetBasePrice + unabsorbedTotal
      const diff = Math.round((upgradedTotal - currentCustomTotal) * 100) / 100
      const isFreeOrCheaper = diff <= 0

      const unabsorbedDuration = unabsorbedAddons.reduce((acc, a) => acc + (a.durationMinutes || 10), 0)
      const upgradedDuration = candidate.durationMinutes + unabsorbedDuration

      // Score candidate: Free/cheaper gets top priority, then absorbed savings, then lowest diff
      let score = 0
      if (isFreeOrCheaper) {
        score += 1000 + Math.abs(diff)
      } else if (absorbedValue > 0) {
        score += 500 + absorbedValue * 10 - diff
      } else {
        score += 100 - diff
      }

      if (!bestCandidateData || score > bestCandidateData.score) {
        bestCandidateData = {
          targetService: candidate,
          targetBasePrice,
          absorbedAddons,
          absorbedValue: Math.round(absorbedValue * 100) / 100,
          unabsorbedAddons,
          unabsorbedTotal: Math.round(unabsorbedTotal * 100) / 100,
          upgradedTotal: Math.round(upgradedTotal * 100) / 100,
          diff: diff > 0 ? diff : 0,
          isFreeOrCheaper,
          targetDuration: candidate.durationMinutes,
          upgradedDuration,
          score,
        }
      }
    }

    if (!bestCandidateData) return null

    return {
      targetService: bestCandidateData.targetService,
      targetBasePrice: bestCandidateData.targetBasePrice,
      currentCustomTotal: Math.round(currentCustomTotal * 100) / 100,
      absorbedAddons: bestCandidateData.absorbedAddons,
      absorbedValue: bestCandidateData.absorbedValue,
      unabsorbedAddons: bestCandidateData.unabsorbedAddons,
      unabsorbedTotal: bestCandidateData.unabsorbedTotal,
      upgradedTotal: bestCandidateData.upgradedTotal,
      diff: bestCandidateData.diff,
      isFreeOrCheaper: bestCandidateData.isFreeOrCheaper,
      targetDuration: bestCandidateData.targetDuration,
      upgradedDuration: bestCandidateData.upgradedDuration,
    }
  }

  // Active service's smart upgrade suggestion
  const activeUpgradeSuggestion = useMemo<SmartUpgradeBreakdown | null>(() => {
    if (!activeService || !activeItem) return null
    return getServiceUpgradeSuggestion(activeService, activeItem.selectedAddonIds)
  }, [activeService, activeItem, addonServices, mainServices, isVipMember])

  // Categorized Add-on Groups for Customize View
  const customizeAddonGroups = useMemo(() => {
    if (!activeService) return []

    const currentIncluded = currentIncludedAddons

    const signatureItems = [
      { id: 'a_milk', name: 'Milk & Honey Soak', desc: 'Ngâm sữa tươi & mật ong làm mềm da', price: 12, durationMinutes: 10 },
      { id: 'a_pearl', name: 'Pearl Powder Treatment', desc: 'Ủ bột ngọc trai Paris sáng mịn', price: 18, durationMinutes: 15 },
      { id: 'a_gold', name: '24K Gold Treatment', desc: 'Tinh chất vàng 24K trẻ hóa da', price: 25, durationMinutes: 20 },
    ]

    const careItems = [
      { id: 'a_scrub', name: 'Sugar Scrub Exfoliation', desc: 'Tẩy tế bào chết hạt đường nâu tự nhiên', price: 8, durationMinutes: 10 },
      { id: 'a_callus', name: 'Callus Removal', desc: 'Chà gót xử lý chai sần chuyên sâu', price: 10, durationMinutes: 10 },
    ]

    const relaxItems = [
      { id: 'a_stone', name: 'Hot Stone Massage', desc: 'Massage đá nóng thảo dược thư giãn cơ bắp', price: 10, durationMinutes: 10 },
      { id: 'a_paraffin', name: 'Paraffin Wax', desc: 'Ủ sáp paraffin giữ ẩm và phục hồi da', price: 15, durationMinutes: 10 },
      { id: 'a_collagen', name: 'Collagen Gloves / Socks', desc: 'Ủ dưỡng chất collagen chống lão hóa', price: 15, durationMinutes: 10 },
      { id: 'a_massage', name: '10-Min Extra Massage', desc: 'Massage bấm huyệt tăng cường 10 phút', price: 20, durationMinutes: 10 },
    ]

    const polishItems = [
      { id: 'a_shellac', name: 'Shellac Polish', desc: 'Sơn Shellac bóng đẹp bền màu 3-4 tuần', price: 20, durationMinutes: 15 },
      { id: 'm_french', name: 'French Tip Style', desc: 'Đầu móng phong cách French thanh lịch', price: 12, durationMinutes: 10 },
    ]

    const artItems = [
      { id: 'sa_art', name: 'Art per nail', desc: 'Vẽ nghệ thuật theo từng móng', price: 5, durationMinutes: 5 },
      { id: 'sa_fullart', name: 'Full Set Art', desc: 'Thiết kế vẽ toàn bộ 10 móng', price: 25, durationMinutes: 20 },
      { id: 'sa_chrome', name: 'Chrome / Mirror Finish', desc: 'Hiệu ứng tráng gương thời thượng', price: 15, durationMinutes: 10 },
      { id: 'sa_ombre', name: 'Ombre / Gradient Color', desc: 'Hiệu ứng chuyển màu Ombre mượt mà', price: 18, durationMinutes: 15 },
      { id: 'sa_3d', name: '3D Nail Art', desc: 'Đắp nổi hoa & họa tiết 3D', price: 30, durationMinutes: 25 },
    ]

    const existingIds = new Set([
      ...signatureItems.map((i) => i.id),
      ...careItems.map((i) => i.id),
      ...relaxItems.map((i) => i.id),
      ...polishItems.map((i) => i.id),
      ...artItems.map((i) => i.id),
    ])

    const extraItems = addonServices
      .filter((a) => !existingIds.has(a.id))
      .map((a) => ({
        id: a.id,
        name: a.name,
        desc: (a.description || 'Dịch vụ cộng thêm nâng cao trải nghiệm').replace(/\[.*?\]/g, '').trim(),
        price: a.price,
        durationMinutes: a.durationMinutes || 10,
      }))

    const buildGroup = (
      category: string,
      desc: string,
      rawItems: Array<{ id: string; name: string; desc: string; price: number; durationMinutes: number }>,
    ) => {
      const items = rawItems.map((item) => ({
        ...item,
        isIncluded: isAddonAbsorbedBy(item, currentIncluded),
      }))
      return { category, desc, items }
    }

    const groups = [
      buildGroup('Signature Materials', 'Nguyên liệu đặc trưng chuẩn salon cao cấp.', signatureItems),
      buildGroup('Foot & Hand Care', 'Làm sạch, làm mềm và phục hồi vùng da chai sần.', careItems),
      buildGroup('Relaxation & Spa', 'Thêm thời gian thư giãn cơ thể và giảm căng thẳng.', relaxItems),
      buildGroup('Polish & Color', 'Hoàn thiện với màu sơn và độ bóng bền bỉ.', polishItems),
      buildGroup('Nail Art & Design', 'Thiết kế tạo hình móng nghệ thuật phong cách.', artItems),
    ]

    if (extraItems.length > 0) {
      groups.push(buildGroup('Additional Add-ons', 'Các dịch vụ bổ sung khác.', extraItems))
    }

    return groups
  }, [activeService, currentIncludedAddons, addonServices])

  // --- VIEW LIFECYCLE ACTION HANDLERS ---

  // 1. Click Service Card in Menu View -> Automatically adds/selects and transitions to Customize View
  const goCustomize = (service: PosService) => {
    setSelectedItems((prev) => {
      const existing = prev.find((i) => i.serviceId === service.id)
      if (existing) {
        return prev
      }
      const rawMember = extractMemberPriceFromService(service)
      const memberPriceNum = Number(rawMember)
      const newItem: SelectedServiceItem = {
        id: `svc-${service.id}-${Date.now()}`,
        serviceId: service.id,
        categoryId: service.categoryIds[0] || 'all',
        name: service.name,
        price: service.price,
        memberPrice: Number.isFinite(memberPriceNum) && memberPriceNum > 0 ? memberPriceNum : undefined,
        durationMinutes: service.durationMinutes,
        selectedAddonIds: [],
        includedAddons: resolveIncludedAddons(service, addonServices),
      }
      return [...prev, newItem]
    })
    setActiveServiceId(service.id)
    setCurrentView('customize')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // 2. Return to Main Menu View (Bottom CTA & Back Button)
  const goMenu = () => {
    setCurrentView('menu')
    setActiveServiceId(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // 3. Remove Current Active Service in Customize View
  const removeCurrentService = () => {
    if (activeServiceId) {
      setSelectedItems((prev) => prev.filter((i) => i.serviceId !== activeServiceId))
    }
    goMenu()
  }

  // 4. Toggle Add-on checkbox for the active service
  const toggleActiveAddon = (addonId: string, isIncluded: boolean) => {
    if (isIncluded || !activeServiceId) return
    setSelectedItems((prev) =>
      prev.map((item) => {
        if (item.serviceId !== activeServiceId) return item
        const exists = item.selectedAddonIds.includes(addonId)
        const nextAddonIds = exists
          ? item.selectedAddonIds.filter((id) => id !== addonId)
          : [...item.selectedAddonIds, addonId]
        return {
          ...item,
          selectedAddonIds: nextAddonIds,
        }
      }),
    )
  }

  // 5. Execute Smart Upsell / Package Upgrade for Active Service
  const handleUpgradeActiveService = (suggestion: SmartUpgradeBreakdown) => {
    const target = suggestion.targetService
    const rawMember = extractMemberPriceFromService(target)
    const memberPriceNum = Number(rawMember)
    const unabsorbedIds = suggestion.unabsorbedAddons.map((a) => a.id)
    const targetIncluded = resolveIncludedAddons(target, addonServices)

    setSelectedItems((prev) =>
      prev.map((item) => {
        if (item.serviceId !== activeServiceId) return item
        return {
          ...item,
          id: `svc-${target.id}-${Date.now()}`,
          serviceId: target.id,
          categoryId: target.categoryIds[0] || 'all',
          name: target.name,
          price: target.price,
          memberPrice: Number.isFinite(memberPriceNum) && memberPriceNum > 0 ? memberPriceNum : undefined,
          durationMinutes: target.durationMinutes,
          selectedAddonIds: unabsorbedIds,
          includedAddons: targetIncluded,
        }
      }),
    )
    setActiveServiceId(target.id)
  }

  // 6. Upgrade an item directly from Cart sidebar or Bottom Sheet
  const handleUpgradeCartItem = (item: SelectedServiceItem, suggestion: SmartUpgradeBreakdown) => {
    const target = suggestion.targetService
    const rawMember = extractMemberPriceFromService(target)
    const memberPriceNum = Number(rawMember)

    const newItem: SelectedServiceItem = {
      id: `cart-${target.id}-${Date.now()}`,
      serviceId: target.id,
      categoryId: target.categoryIds[0] || 'all',
      name: target.name,
      price: target.price,
      memberPrice: Number.isFinite(memberPriceNum) && memberPriceNum > 0 ? memberPriceNum : undefined,
      durationMinutes: target.durationMinutes,
      selectedAddonIds: suggestion.unabsorbedAddons.map((a) => a.id),
      includedAddons: resolveIncludedAddons(target, addonServices),
    }

    setSelectedItems((prev) => {
      const filtered = prev.filter((i) => i.serviceId !== item.serviceId)
      return [...filtered, newItem]
    })

    if (activeServiceId === item.serviceId) {
      setActiveServiceId(target.id)
    }
  }

  // 7. Edit item from Cart / Bottom Sheet -> opens customize view for that item
  const handleEditCartItem = (item: SelectedServiceItem) => {
    const service = allServices.find((s) => s.id === item.serviceId)
    if (service) {
      setActiveServiceId(service.id)
      setCurrentView('customize')
      setIsMobileCartOpen(false)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  // 8. Remove item from Cart / Bottom Sheet
  const handleRemoveFromCart = (serviceId: string) => {
    setSelectedItems((prev) => prev.filter((i) => i.serviceId !== serviceId))
    if (activeServiceId === serviceId && currentView === 'customize') {
      goMenu()
    }
  }

  // Find first eligible upsell among cart items for sticky bar banner
  const firstCartUpsell = useMemo(() => {
    for (const item of selectedItems) {
      const service = allServices.find((s) => s.id === item.serviceId)
      if (service) {
        const suggestion = getServiceUpgradeSuggestion(service, item.selectedAddonIds)
        if (suggestion) {
          return { item, suggestion }
        }
      }
    }
    return null
  }, [selectedItems, allServices, mainServices, addonServices, isVipMember])

  // Live Cart Summary calculations
  const cartSummary = useMemo(() => {
    let subtotal = 0
    let totalMinutes = 0
    let totalSavings = 0

    selectedItems.forEach((item) => {
      const basePrice = isVipMember && item.memberPrice ? item.memberPrice : item.price
      if (isVipMember && item.memberPrice) {
        totalSavings += item.price - item.memberPrice
      }
      subtotal += basePrice
      totalMinutes += item.durationMinutes

      item.selectedAddonIds.forEach((aId) => {
        const addon = findAddonById(aId, addonServices)
        if (addon) {
          subtotal += addon.price
          totalMinutes += addon.durationMinutes || 10
        }
      })
    })

    return {
      itemCount: selectedItems.length,
      subtotal: Math.round(subtotal * 100) / 100,
      totalMinutes,
      totalSavings: Math.round(totalSavings * 100) / 100,
    }
  }, [selectedItems, isVipMember, addonServices])

  // Active Service Price & Duration meta
  const activeServicePrice = useMemo(() => {
    if (!activeService) return 0
    const rawMember = extractMemberPriceFromService(activeService)
    const memberPriceNum = Number(rawMember)
    const hasMember = isVipMember && Number.isFinite(memberPriceNum) && memberPriceNum > 0
    return hasMember ? memberPriceNum : activeService.price
  }, [activeService, isVipMember])

  const activeServiceTotalWithAddons = useMemo(() => {
    if (!activeService) return 0
    let total = activeServicePrice
    if (activeItem) {
      activeItem.selectedAddonIds.forEach((aId) => {
        const addon = findAddonById(aId, addonServices)
        if (addon) total += addon.price
      })
    }
    return Math.round(total * 100) / 100
  }, [activeService, activeServicePrice, activeItem, addonServices])

  const activeServiceTotalMinutes = useMemo(() => {
    if (!activeService) return 0
    let minutes = activeService.durationMinutes
    if (activeItem) {
      activeItem.selectedAddonIds.forEach((aId) => {
        const addon = findAddonById(aId, addonServices)
        if (addon) minutes += addon.durationMinutes || 10
      })
    }
    return minutes
  }, [activeService, activeItem, addonServices])

  return (
    <div className="min-h-screen bg-[#FAF9F5] text-slate-900 font-sans antialiased selection:bg-amber-200">
      {/* 1. Dark Luxury Hero Header (Visible in Menu View) */}
      {currentView === 'menu' && (
        <header className="relative bg-[#1A1F2B] text-white pt-4 pb-12 sm:pb-16 px-4 sm:px-8 border-b border-amber-500/20 shadow-md">
          <div className="mx-auto max-w-7xl">
            {/* Top Header Row: Admin Back & Compact VIP Member Toggle */}
            <div className="flex items-center justify-between gap-3 pb-3.5 mb-4 border-b border-white/10">
              <button
                type="button"
                onClick={() => navigate('/dashboard/pos/services')}
                className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/10 backdrop-blur-xs px-3 py-1.5 text-xs font-semibold text-white/90 hover:bg-white/20 transition shadow-2xs"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Quay lại Quản Lý POS</span>
              </button>

              {/* Compact VIP Member Rate Toggle */}
              <button
                type="button"
                onClick={() => setIsVipMember(!isVipMember)}
                className={`inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-bold transition shadow-2xs ${
                  isVipMember
                    ? 'border-amber-400 bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-amber-500/20'
                    : 'border-white/15 bg-white/10 text-white/90 hover:bg-white/20'
                }`}
              >
                <Crown className={`h-4 w-4 ${isVipMember ? 'text-amber-200 fill-amber-200' : 'text-amber-400'}`} />
                <span>{isVipMember ? 'VIP Member: BẬT' : 'Bật Giá VIP'}</span>
              </button>
            </div>

            {/* Hero Content */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-[11px] sm:text-xs font-bold tracking-widest text-[#D4B26C] uppercase">
                <MapPin className="h-3.5 w-3.5 text-[#D4B26C] shrink-0" />
                <span>BITCOIN NAIL BAR — WESTHEIMER</span>
              </div>

              <h1 className="text-2xl sm:text-4xl md:text-5xl font-serif font-normal sm:font-medium text-white tracking-tight">
                Book Your Visit
              </h1>

              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/15 px-3 py-1 text-xs text-slate-200 backdrop-blur-xs">
                <span className="h-2 w-2 rounded-full bg-[#298F65] animate-pulse" />
                <span>
                  Next available: <strong className="text-white font-semibold">Today 3:30 PM</strong>
                </span>
              </div>

              <p className="text-xs sm:text-sm text-slate-300 max-w-2xl hidden sm:block pt-1">
                Nails, waxing and spa treatments. Add what you need — the price and how long you'll be with us update as you go.
              </p>
            </div>
          </div>
        </header>
      )}

      {/* 2. Main Content Layout */}
      <main
        className={`relative z-10 mx-auto max-w-7xl px-4 sm:px-8 ${
          currentView === 'menu' ? '-mt-6 sm:-mt-10' : 'pt-4 sm:pt-6'
        } ${selectedItems.length > 0 ? 'pb-28 lg:pb-8' : 'pb-8'}`}
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: View Switcher (Menu vs Customize View) */}
          <div className="lg:col-span-8 space-y-5">
            {/* ===================== VIEW 1: MENU VIEW ===================== */}
            {currentView === 'menu' && (
              <div className="space-y-5" data-testid="menu-view">
                {/* Step 1 Title Box & Search */}
                <div className="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-xs flex items-start justify-between flex-wrap gap-3">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-amber-700">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-600 text-[10px] font-black text-white">
                        1
                      </span>
                      <span>Select Treatments</span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-serif font-bold text-slate-900 mt-1">
                      Choose your services
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                      Select your treatments to create your perfect visit.
                    </p>
                  </div>

                  {/* Search input */}
                  <div className="relative w-full sm:w-64">
                    <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search services — gel, wax, kids…"
                      className="h-9 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-8 text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10 shadow-2xs transition"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Category Navigation - Mobile Chips */}
                <div className="flex lg:hidden items-center gap-2 overflow-x-auto nexora-no-scrollbar py-2 -mx-4 px-4 sm:-mx-8 sm:px-8">
                  <button
                    type="button"
                    onClick={() => setSelectedCategoryId('all')}
                    className={`shrink-0 inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs sm:text-sm font-semibold transition whitespace-nowrap ${
                      selectedCategoryId === 'all'
                        ? 'bg-[#1A1F2B] text-[#D4B26C] border border-[#D4B26C]/40 shadow-xs'
                        : 'bg-white text-slate-700 border border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <span>All</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                        selectedCategoryId === 'all'
                          ? 'bg-[#D4B26C]/20 text-[#D4B26C]'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {mainServices.length}
                    </span>
                  </button>
                  {categories.map((cat) => {
                    const count = mainServices.filter((s) => s.categoryIds.includes(cat.id)).length
                    if (count === 0 && cat.name.toLowerCase().includes('add-on')) return null
                    const isSelected = selectedCategoryId === cat.id
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setSelectedCategoryId(cat.id)}
                        className={`shrink-0 inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs sm:text-sm font-semibold transition whitespace-nowrap ${
                          isSelected
                            ? 'bg-[#1A1F2B] text-[#D4B26C] border border-[#D4B26C]/40 shadow-xs'
                            : 'bg-white text-slate-700 border border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <span>{cat.name}</span>
                        {count > 0 && (
                          <span
                            className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                              isSelected ? 'bg-[#D4B26C]/20 text-[#D4B26C]' : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            {count}
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>

                {/* Category Navigation - Desktop Visual Category Deck */}
                <div className="hidden lg:grid grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedCategoryId('all')}
                    className={`group flex flex-col rounded-2xl border text-left overflow-hidden transition shadow-2xs hover:shadow-md ${
                      selectedCategoryId === 'all'
                        ? 'border-amber-600 ring-2 ring-amber-600/20 bg-white'
                        : 'border-slate-200/90 bg-white hover:border-amber-300'
                    }`}
                  >
                    <div className="relative h-20 w-full bg-slate-900 overflow-hidden">
                      <img
                        src="/prototype/assets/cat-pedicure.jpg"
                        alt="All Services"
                        className="h-full w-full object-cover opacity-80 group-hover:scale-105 transition duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />
                      <span className="absolute top-2 right-2 rounded-md bg-amber-500/90 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-white">
                        ALL
                      </span>
                    </div>
                    <div className="p-2.5">
                      <span className="block text-xs font-bold text-slate-900 line-clamp-2 min-h-[32px] leading-snug">All Services</span>
                      <span className="block text-[10px] text-slate-500 mt-0.5">
                        {mainServices.length} Services
                      </span>
                    </div>
                  </button>

                  {categories.map((cat) => {
                    const count = mainServices.filter((s) => s.categoryIds.includes(cat.id)).length
                    if (count === 0 && cat.name.toLowerCase().includes('add-on')) return null
                    const isSelected = selectedCategoryId === cat.id
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setSelectedCategoryId(cat.id)}
                        className={`group flex flex-col rounded-2xl border text-left overflow-hidden transition shadow-2xs hover:shadow-md ${
                          isSelected
                            ? 'border-amber-600 ring-2 ring-amber-600/20 bg-white'
                            : 'border-slate-200/90 bg-white hover:border-amber-300'
                        }`}
                      >
                        <div className="relative h-20 w-full bg-slate-900 overflow-hidden">
                          <img
                            src={getCategoryPhoto(cat.name)}
                            alt={cat.name}
                            className="h-full w-full object-cover opacity-80 group-hover:scale-105 transition duration-300"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />
                          {cat.name.toLowerCase().includes('pedicure') && (
                            <span className="absolute top-2 right-2 rounded-md bg-amber-500 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-white">
                              SIGNATURE
                            </span>
                          )}
                        </div>
                        <div className="p-2.5">
                          <span className="block text-xs font-bold text-slate-900 line-clamp-2 min-h-[32px] leading-snug">{cat.name}</span>
                          <span className="block text-[10px] text-slate-500 mt-0.5">
                            {count} Services
                          </span>
                        </div>
                      </button>
                    )
                  })}
                </div>

                {/* Service Cards Section */}
                <div className="space-y-4">
                  {filteredMainServices.length === 0 ? (
                    <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-xs">
                      <Sparkles className="mx-auto h-8 w-8 text-amber-500 mb-2 opacity-60" />
                      <p className="text-sm font-bold text-slate-700">Không tìm thấy dịch vụ nào phù hợp</p>
                      <p className="text-xs text-slate-400 mt-1">Thử chọn danh mục khác hoặc xóa bộ lọc tìm kiếm.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 min-[920px]:grid-cols-2 gap-3 sm:gap-4">
                      {filteredMainServices.map((service) => {
                        const isSelectedInCart = selectedItems.some((i) => i.serviceId === service.id)
                        const isOwnerRec = service.tags?.some((t) => t.toLowerCase() === 'owner recommended')
                        const isBestseller = service.tags?.some((t) => t.toLowerCase() === 'bestseller')
                        const isCombo = service.tags?.some((t) => t.toLowerCase() === 'combo')

                        const rawMemberPrice = extractMemberPriceFromService(service)
                        const memberPriceNum = Number(rawMemberPrice)
                        const hasMember = Number.isFinite(memberPriceNum) && memberPriceNum > 0

                        const effectivePrice = isVipMember && hasMember ? memberPriceNum : service.price
                        const cartItemForService = selectedItems.find((i) => i.serviceId === service.id)
                        const cartItemAddonsTotal = cartItemForService
                          ? cartItemForService.selectedAddonIds.reduce((sum, aId) => {
                              const addon = findAddonById(aId, addonServices)
                              return sum + (addon ? addon.price : 0)
                            }, 0)
                          : 0
                        const displayedCardPrice = isSelectedInCart ? effectivePrice + cartItemAddonsTotal : effectivePrice
                        const includedItems = resolveIncludedAddons(service, addonServices)

                        return (
                          <div
                            key={service.id}
                            data-testid={`service-card-${service.id}`}
                            onClick={() => goCustomize(service)}
                            className={`group relative flex items-center justify-between gap-3 rounded-xl border p-2.5 sm:p-3 transition-all duration-200 cursor-pointer shadow-2xs hover:shadow-md ${
                              isSelectedInCart
                                ? 'border-[#1A1F2B] bg-[#1A1F2B] text-white shadow-md'
                                : 'border-slate-200 bg-white hover:border-[#D4B26C]'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                              {/* Service Thumbnail Image */}
                              <img
                                src={getServicePhoto(service)}
                                alt={service.name}
                                className={`w-14 h-14 min-w-14 min-h-14 rounded-lg object-cover shrink-0 border transition ${
                                  isSelectedInCart ? 'border-[#D4B26C]/60' : 'border-slate-100 group-hover:border-amber-200'
                                }`}
                                loading="lazy"
                              />

                              <div className="min-w-0 flex-1">
                                {/* Line 1: Name + Badges */}
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <h3
                                    className={`font-bold text-sm sm:text-base leading-tight truncate ${
                                      isSelectedInCart ? 'text-white' : 'text-slate-900 group-hover:text-amber-800'
                                    }`}
                                  >
                                    {service.name}
                                  </h3>
                                {isOwnerRec && (
                                  <span
                                    className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.2 text-[9px] font-bold uppercase tracking-wider ${
                                      isSelectedInCart
                                        ? 'bg-[#D4B26C] text-slate-950'
                                        : 'bg-amber-100 text-amber-900 border border-amber-300'
                                    }`}
                                  >
                                    <Star className="h-2.5 w-2.5 fill-current" />
                                    <span>CHOICE</span>
                                  </span>
                                )}
                                {isBestseller && (
                                  <span
                                    className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.2 text-[9px] font-bold uppercase tracking-wider ${
                                      isSelectedInCart
                                        ? 'bg-red-400 text-slate-950'
                                        : 'bg-red-50 text-red-700 border border-red-200'
                                    }`}
                                  >
                                    <Sparkles className="h-2.5 w-2.5" />
                                    <span>POPULAR</span>
                                  </span>
                                )}
                                {isCombo && (
                                  <span
                                    className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.2 text-[9px] font-bold uppercase tracking-wider ${
                                      isSelectedInCart
                                        ? 'bg-indigo-300 text-slate-950'
                                        : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                    }`}
                                  >
                                    <Gift className="h-2.5 w-2.5" />
                                    <span>COMBO</span>
                                  </span>
                                )}
                              </div>

                              {/* Line 2: Duration + Micro-pill */}
                              <div className="flex items-center gap-1.5 sm:gap-2 mt-0.5 text-xs flex-wrap sm:flex-nowrap">
                                <span
                                  className={`flex items-center gap-1 font-medium whitespace-nowrap shrink-0 ${
                                    isSelectedInCart ? 'text-slate-300' : 'text-slate-500'
                                  }`}
                                >
                                  <Clock className="h-3 w-3 opacity-70 shrink-0" />
                                  <span>{service.durationMinutes} min</span>
                                </span>

                                {includedItems.length > 0 && (
                                  <>
                                    <span className={`shrink-0 ${isSelectedInCart ? 'text-slate-600' : 'text-slate-300'}`}>•</span>
                                    <span
                                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold whitespace-nowrap shrink-0 ${
                                        isSelectedInCart
                                          ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/30'
                                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                      }`}
                                    >
                                      <CheckCircle2 className="h-2.5 w-2.5 shrink-0" />
                                      <span>{includedItems.length} bước có sẵn</span>
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Right Side: Price + Check circle / Label */}
                          <div className="shrink-0 flex items-center gap-2.5 sm:gap-3 text-right">
                              {isSelectedInCart && (
                                <span className="hidden sm:inline-block text-[11px] font-semibold text-[#D4B26C]">
                                  ✓ Đã chọn
                                </span>
                              )}
                              <div>
                                <div className="flex items-baseline gap-1 justify-end">
                                  {isVipMember && hasMember ? (
                                    <>
                                      <span className="text-[11px] line-through text-slate-400">
                                        ${service.price}
                                      </span>
                                      <span
                                        className={`text-base sm:text-lg font-black font-serif italic ${
                                          isSelectedInCart ? 'text-[#D4B26C]' : 'text-amber-700'
                                        }`}
                                      >
                                        ${displayedCardPrice}
                                      </span>
                                    </>
                                  ) : (
                                    <span
                                      className={`text-base sm:text-lg font-black font-serif italic ${
                                        isSelectedInCart ? 'text-[#D4B26C]' : 'text-slate-900'
                                      }`}
                                    >
                                      ${displayedCardPrice}
                                    </span>
                                  )}
                                </div>
                                {hasMember && !isVipMember && !isSelectedInCart && (
                                  <span className="block text-[9px] font-semibold text-amber-700">
                                    VIP: ${memberPriceNum}
                                  </span>
                                )}
                              </div>

                              <div
                                className={`flex h-6 w-6 sm:h-7 sm:w-7 shrink-0 items-center justify-center rounded-full border transition ${
                                  isSelectedInCart
                                    ? 'border-[#D4B26C] bg-[#D4B26C] text-[#1A1D20]'
                                    : 'border-slate-300 bg-white group-hover:border-amber-400 text-transparent'
                                }`}
                              >
                                <Check
                                  className={`h-3.5 w-3.5 stroke-[3] ${
                                    isSelectedInCart ? 'text-[#1A1D20]' : 'opacity-0'
                                  }`}
                                />
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ===================== VIEW 2: CUSTOMIZE VIEW ===================== */}
            {currentView === 'customize' && activeService && (
              <div
                className="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-6 shadow-xs space-y-4 sm:space-y-5 animate-fadeIn"
                data-testid="customize-view"
              >
                {/* 1. Multi-Service Switcher (When selectedItems.length > 1) */}
                {selectedItems.length > 1 && (
                  <div className="flex items-center gap-2 overflow-x-auto nexora-no-scrollbar pb-1 -mx-1 px-1">
                    {selectedItems.map((item, idx) => {
                      const isCurrent = item.serviceId === activeServiceId
                      const itemBasePrice = isVipMember && item.memberPrice ? item.memberPrice : item.price
                      const itemAddonsTotal = item.selectedAddonIds.reduce((sum, aId) => {
                        const addon = findAddonById(aId, addonServices)
                        return sum + (addon ? addon.price : 0)
                      }, 0)
                      const itemTotalPrice = itemBasePrice + itemAddonsTotal
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            setActiveServiceId(item.serviceId)
                            setIsRecapExpanded(false)
                          }}
                          className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                            isCurrent
                              ? 'bg-[#1A1F2B] text-[#D4B26C] border border-[#D4B26C]/40 shadow-xs'
                              : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
                          }`}
                        >
                          <span className="opacity-70">{idx + 1}.</span>
                          <span className="truncate max-w-[120px] sm:max-w-[180px]">{item.name}</span>
                          <span className={isCurrent ? 'text-[#D4B26C] font-bold' : 'text-slate-500'}>
                            (${itemTotalPrice})
                          </span>
                        </button>
                      )
                    })}
                    <button
                      type="button"
                      onClick={goMenu}
                      className="shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold border border-dashed border-amber-400 text-amber-800 hover:bg-amber-50 transition cursor-pointer"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Thêm dịch vụ</span>
                    </button>
                  </div>
                )}

                {/* 2. Header Bar: Compact single-row: (←) [Tên dịch vụ] and 🗑️ Xóa món */}
                <div className="cz-bar flex items-center justify-between gap-3 pb-3 border-b border-slate-200">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <button
                      type="button"
                      data-testid="cz-back-btn"
                      onClick={goMenu}
                      className="cz-back flex-shrink-0 w-8 h-8 rounded-full border border-slate-200 bg-white hover:border-[#D4B26C] hover:text-[#D4B26C] flex items-center justify-center transition shadow-2xs cursor-pointer"
                      aria-label="Quay lại Menu"
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </button>
                    <h2 className="cz-title text-base sm:text-xl font-serif font-bold text-slate-900 leading-tight truncate">
                      {activeService.name}
                    </h2>
                  </div>

                  <button
                    type="button"
                    data-testid="cz-remove-btn"
                    onClick={removeCurrentService}
                    className="cz-remove flex-shrink-0 inline-flex items-center gap-1 text-xs font-semibold text-red-600 hover:text-red-800 px-2 py-1 rounded-lg hover:bg-red-50 transition cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Xóa món</span>
                  </button>
                </div>

                {/* 3. Recap Box: Clean minimal bar with service image preview & details toggle */}
                <div
                  data-testid="cz-recap-box"
                  className="cz-recap rounded-xl bg-[#FDFBF5] border border-[#EBE4D5] p-3 shadow-2xs space-y-2"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={getServicePhoto(activeService)}
                      alt={activeService.name}
                      className="w-16 h-16 min-w-16 min-h-16 rounded-xl object-cover shrink-0 border border-[#EBE4D5] shadow-xs"
                      loading="lazy"
                    />

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-bold text-slate-900 flex-wrap">
                          <span>{activeService.name}</span>
                          <span className="text-slate-400">·</span>
                          <span className="text-[#8D7B50] font-black">${activeServiceTotalWithAddons}</span>
                          <span className="text-slate-400">·</span>
                          <span className="text-slate-600 font-medium">{activeServiceTotalMinutes} min</span>
                        </div>
                      </div>

                      {currentIncludedAddons.length > 0 && (
                        <div className="mt-1 flex items-center justify-between gap-2">
                          <span className="inline-flex items-center gap-1 text-[#298F65] font-semibold text-xs whitespace-nowrap shrink-0">
                            <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                            <span>{currentIncludedAddons.length} bước có sẵn</span>
                          </span>

                          <button
                            type="button"
                            onClick={() => setIsRecapExpanded(!isRecapExpanded)}
                            className="text-[11px] font-semibold text-[#8D7B50] hover:text-[#5E5131] flex items-center gap-0.5 cursor-pointer ml-auto shrink-0"
                          >
                            <span>{isRecapExpanded ? 'Thu gọn' : 'Chi tiết'}</span>
                            <ChevronDown
                              className={`h-3.5 w-3.5 transition-transform duration-200 ${
                                isRecapExpanded ? 'rotate-180' : ''
                              }`}
                            />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {isRecapExpanded && currentIncludedAddons.length > 0 && (
                    <div className="pt-2 border-t border-[#EBE4D5]/80 flex flex-wrap gap-1.5 animate-fadeIn">
                      {currentIncludedAddons.map((item) => (
                        <span
                          key={item.id}
                          className="inline-flex items-center gap-1 bg-[#EEF8F3] text-[#298F65] border border-[#298F65]/20 px-2 py-0.5 rounded-md text-[11px] font-semibold"
                        >
                          <span>✓</span>
                          <span>{item.name}</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* 4. Smart Upgrade Banner (Render when addons are selected and an upgrade target exists) */}
                {activeItem &&
                  activeItem.selectedAddonIds.length > 0 &&
                  activeUpgradeSuggestion && (
                    <div
                      data-testid="smart-upgrade-banner"
                      className="rounded-2xl border-2 border-[#D4B26C] bg-gradient-to-r from-amber-50 via-[#FDFBF5] to-amber-50 p-4 sm:p-5 shadow-sm space-y-3 animate-fadeIn"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs font-black text-amber-950 uppercase tracking-wider">
                          <Sparkles className="h-4 w-4 text-amber-600 animate-pulse" />
                          <span>GỢI Ý NÂNG CẤP TỐI ƯU</span>
                        </div>
                        {activeUpgradeSuggestion.absorbedValue > 0 ? (
                          <span className="rounded-full bg-amber-200/80 px-2.5 py-0.5 text-[10px] font-black text-amber-900">
                            TIẾT KIỆM ${activeUpgradeSuggestion.absorbedValue}
                          </span>
                        ) : (
                          <span className="rounded-full bg-amber-200/80 px-2.5 py-0.5 text-[10px] font-black text-amber-900">
                            GÓI CAO CẤP
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-amber-900 leading-relaxed space-y-1.5">
                        {activeUpgradeSuggestion.isFreeOrCheaper ? (
                          <p>
                            🎉 Nâng cấp lên gói{' '}
                            <strong className="font-bold text-slate-900">
                              {activeUpgradeSuggestion.targetService.name} (${activeUpgradeSuggestion.targetService.price})
                            </strong>{' '}
                            hoàn toàn đồng giá / không tốn thêm chi phí!
                          </p>
                        ) : (
                          <p>
                            Chỉ thêm{' '}
                            <strong className="font-bold text-amber-800">
                              +${activeUpgradeSuggestion.diff}
                            </strong>{' '}
                            để nâng cấp trọn gói lên{' '}
                            <strong className="font-bold text-slate-900">
                              {activeUpgradeSuggestion.targetService.name} (${activeUpgradeSuggestion.targetService.price})
                            </strong>
                            !
                          </p>
                        )}

                        {activeUpgradeSuggestion.absorbedAddons.length > 0 && (
                          <div className="rounded-xl bg-white/80 border border-amber-200 p-2.5 text-[11px] text-amber-950 space-y-1">
                            <div className="font-bold flex items-center gap-1 text-emerald-800">
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                              <span>
                                Tiết kiệm ngay ${activeUpgradeSuggestion.absorbedValue} vì gói đã bao gồm sẵn:
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {activeUpgradeSuggestion.absorbedAddons.map((a) => (
                                <span
                                  key={a.id}
                                  className="inline-flex items-center gap-1 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-900"
                                >
                                  <span>{a.name}</span>
                                  <span className="text-amber-700 font-bold">(${a.price})</span>
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <button
                        type="button"
                        data-testid="smart-upgrade-btn"
                        onClick={() => handleUpgradeActiveService(activeUpgradeSuggestion)}
                        className="w-full rounded-xl bg-gradient-to-r from-amber-700 to-amber-800 hover:from-amber-800 hover:to-amber-900 text-white px-4 py-3 text-xs font-black shadow-sm hover:shadow-md transition flex items-center justify-center gap-1.5 uppercase tracking-wider cursor-pointer"
                      >
                        <span>
                          NÂNG CẤP LÊN {activeUpgradeSuggestion.targetService.name.toUpperCase()} ·{' '}
                          {activeUpgradeSuggestion.diff > 0 ? `+$${activeUpgradeSuggestion.diff}` : 'MIỄN PHÍ'}
                        </span>
                        <ArrowUpRight className="h-4 w-4" />
                      </button>
                    </div>
                  )}

                {/* 5. Add-on List by Category (Minimal luxury rows) */}
                <div className="space-y-5" data-testid="addons-container">
                  {customizeAddonGroups.map((group) => (
                    <div key={group.category} className="space-y-2">
                      <h3 className="category-title text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wider">
                        {group.category}
                      </h3>

                      <div className="grid grid-cols-1 gap-2">
                        {group.items.map((item) => {
                          const isChecked = activeItem?.selectedAddonIds.includes(item.id) || false
                          const isIncluded = item.isIncluded

                          return (
                            <div
                              key={item.id}
                              data-testid={`addon-card-${item.id}`}
                              onClick={() => toggleActiveAddon(item.id, isIncluded)}
                              className={`addon-card flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl border transition ${
                                isIncluded
                                  ? 'bg-[#F9FAFB] border-slate-200 cursor-default opacity-90'
                                  : isChecked
                                  ? 'bg-[#FDFBF5] border-[#D4B26C] ring-1 ring-[#D4B26C] cursor-pointer shadow-xs'
                                  : 'bg-white border-slate-200 hover:border-[#D4B26C] cursor-pointer shadow-2xs'
                              }`}
                            >
                              <div className="flex-1 min-w-0">
                                <span className="font-semibold text-xs sm:text-sm text-slate-900 truncate block">
                                  {item.name}
                                </span>
                              </div>

                              <div className="shrink-0 flex items-center gap-2.5">
                                {isIncluded ? (
                                  <span className="text-xs font-bold text-[#298F65] flex items-center gap-1">
                                    ✓ ĐÃ CÓ
                                  </span>
                                ) : (
                                  <div className="text-right">
                                    <span
                                      className={`text-xs sm:text-sm font-bold ${
                                        isChecked ? 'text-amber-800' : 'text-slate-800'
                                      }`}
                                    >
                                      +${item.price}
                                    </span>
                                    <span className="text-[10px] text-slate-400 ml-1">
                                      (+{item.durationMinutes}m)
                                    </span>
                                  </div>
                                )}

                                <div
                                  className={`w-5 h-5 rounded-full flex items-center justify-center border transition ${
                                    isIncluded
                                      ? 'bg-emerald-600 border-emerald-600 text-white'
                                      : isChecked
                                      ? 'bg-[#D4B26C] border-[#D4B26C] text-slate-950'
                                      : 'border-slate-300 bg-white'
                                  }`}
                                >
                                  {(isIncluded || isChecked) && <Check className="h-3 w-3 stroke-[3]" />}
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                {/* 6. Bottom CTA Button: "Hoàn tất dịch vụ này" */}
                <div className="pt-3 border-t border-slate-200">
                  <button
                    type="button"
                    data-testid="cz-done-btn"
                    onClick={goMenu}
                    className="cz-done w-full py-3.5 px-6 rounded-xl border-2 border-[#D4B26C] bg-white hover:bg-[#FDFBF5] text-[#8D7B50] font-bold text-xs sm:text-sm uppercase tracking-wider transition text-center shadow-xs cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Check className="h-4 w-4 stroke-[3]" />
                    <span>Hoàn tất dịch vụ này</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Live Order Summary & Cart Sidebar (Desktop only lg:block) */}
          <div className="hidden lg:block lg:col-span-4 sticky top-20 space-y-4">
            <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="h-5 w-5 text-amber-600" />
                  <h2 className="font-serif font-black text-lg text-slate-900">Your Selections</h2>
                </div>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-600">
                  {cartSummary.itemCount} items
                </span>
              </div>

              {selectedItems.length === 0 ? (
                <div className="py-8 text-center space-y-2">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 text-amber-600">
                    <Scissors className="h-6 w-6 opacity-60" />
                  </div>
                  <p className="text-xs font-bold text-slate-700">Ready when you are</p>
                  <p className="text-[11px] text-slate-400">
                    Your selections, estimated time, and total will appear here.
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1 divide-y divide-slate-100">
                  {selectedItems.map((item) => {
                    const basePrice = isVipMember && item.memberPrice ? item.memberPrice : item.price
                    const itemAddonsTotal = item.selectedAddonIds.reduce((sum, aId) => {
                      const addon = findAddonById(aId, addonServices)
                      return sum + (addon ? addon.price : 0)
                    }, 0)
                    const itemAddonsMinutes = item.selectedAddonIds.reduce((sum, aId) => {
                      const addon = findAddonById(aId, addonServices)
                      return sum + (addon ? addon.durationMinutes || 10 : 0)
                    }, 0)
                    const itemTotal = basePrice + itemAddonsTotal
                    const itemTotalMinutes = item.durationMinutes + itemAddonsMinutes
                    const itemService = allServices.find((s) => s.id === item.serviceId)
                    const itemUpsell = itemService
                      ? getServiceUpgradeSuggestion(itemService, item.selectedAddonIds)
                      : null

                    return (
                      <div key={item.id} data-testid={`cart-item-${item.serviceId}`} className="pt-3 first:pt-0 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <img
                              src={getServicePhoto(itemService)}
                              alt={item.name}
                              className="w-9 h-9 rounded-lg object-cover shrink-0 border border-slate-200"
                              loading="lazy"
                            />
                            <div className="min-w-0">
                              <span className="font-bold text-xs text-slate-900 block truncate">{item.name}</span>
                              <span className="text-[10px] text-slate-400 block">{itemTotalMinutes} min</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-black text-xs text-slate-900">${itemTotal}</span>
                            <button
                              type="button"
                              onClick={() => handleEditCartItem(item)}
                              className="text-slate-400 hover:text-amber-600 transition cursor-pointer"
                              title="Tùy chỉnh lại"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveFromCart(item.serviceId)}
                              className="text-slate-400 hover:text-red-500 transition cursor-pointer"
                              title="Xóa khỏi đơn"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>

                        {item.includedAddons && item.includedAddons.length > 0 && (
                          <div className="flex items-center gap-1 flex-wrap">
                            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-800">
                              <CheckCircle2 className="h-2.5 w-2.5 text-emerald-600" />
                              <span>Bao gồm {item.includedAddons.length} liệu trình cao cấp</span>
                            </span>
                          </div>
                        )}

                        {item.selectedAddonIds.length > 0 && (
                          <div className="pl-2 border-l-2 border-amber-200 space-y-1">
                            {item.selectedAddonIds.map((aId) => {
                              const addon = findAddonById(aId, addonServices)
                              if (!addon) return null
                              return (
                                <div key={aId} className="flex items-center justify-between text-[11px] text-slate-600">
                                  <span className="flex items-center gap-1">
                                    <Sparkles className="h-2.5 w-2.5 text-amber-500" />
                                    <span>└ {addon.name}</span>
                                  </span>
                                  <span className="font-bold text-slate-800">+${addon.price}</span>
                                </div>
                              )
                            })}
                          </div>
                        )}

                        {itemUpsell && (
                          <div className="mt-2 rounded-xl border border-amber-200 bg-gradient-to-b from-amber-50 to-amber-100/30 p-2.5 space-y-1.5">
                            <div className="flex items-center justify-between text-[10px] font-black uppercase text-amber-900">
                              <span className="flex items-center gap-1">
                                <Sparkles className="h-3 w-3 text-amber-600" />
                                <span>Gợi ý nâng cấp</span>
                              </span>
                              <span className="text-emerald-700 font-bold">Tiết kiệm ${itemUpsell.absorbedValue}</span>
                            </div>
                            <p className="text-[11px] text-amber-950">
                              {itemUpsell.isFreeOrCheaper ? (
                                <>Nâng cấp lên <strong>{itemUpsell.targetService.name}</strong> đồng giá!</>
                              ) : (
                                <>Thêm <strong>+${itemUpsell.diff}</strong> để lên <strong>{itemUpsell.targetService.name}</strong></>
                              )}
                            </p>
                            <button
                              type="button"
                              onClick={() => handleUpgradeCartItem(item, itemUpsell)}
                              className="w-full rounded-lg bg-amber-700 hover:bg-amber-800 text-white font-bold text-[11px] py-1.5 transition text-center uppercase tracking-wider cursor-pointer"
                            >
                              Nâng cấp · {itemUpsell.diff > 0 ? `+$${itemUpsell.diff}` : 'Miễn phí'}
                            </button>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}

              {cartSummary.totalSavings > 0 && (
                <div className="rounded-xl bg-amber-50 border border-amber-200 p-2.5 flex items-center justify-between text-xs text-amber-900 font-bold">
                  <span className="flex items-center gap-1.5">
                    <Crown className="h-4 w-4 text-amber-600 fill-amber-600" />
                    <span>VIP Member Savings</span>
                  </span>
                  <span>-${cartSummary.totalSavings}</span>
                </div>
              )}

              <div className="space-y-3 pt-3 border-t border-slate-100">
                <div className="flex items-baseline justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Est.</span>
                    <span className="text-[11px] text-slate-400 block">{cartSummary.totalMinutes} min total</span>
                  </div>
                  <span className="text-2xl font-black font-serif text-slate-900">${cartSummary.subtotal}</span>
                </div>

                <button
                  type="button"
                  disabled={selectedItems.length === 0}
                  onClick={() => alert(`Đơn hàng mẫu trị giá $${cartSummary.subtotal} đã được xác nhận!`)}
                  className="w-full h-12 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-bold text-xs uppercase tracking-widest shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition duration-200 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>CONTINUE TO BOOK · ${cartSummary.subtotal}</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
                <p className="text-center text-[10px] text-slate-400">
                  No deposit required · We'll confirm your appointment instantly
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* 3. Mobile Sticky Cart Bar (Synchronized across both Menu and Customize views) */}
      {selectedItems.length > 0 && (
        <div
          data-testid="mobile-sticky-cart"
          className="fixed bottom-0 left-0 right-0 z-40 lg:hidden border-t border-[#D4B26C]/30 bg-[#1A1F2B] text-white shadow-[0_-8px_30px_rgba(0,0,0,0.35)] pb-safe"
        >
          {firstCartUpsell && (
            <div
              onClick={() => setIsMobileCartOpen(true)}
              className="flex items-center justify-between gap-3 bg-gradient-to-r from-[#D4B26C]/20 via-[#D4B26C]/10 to-[#D4B26C]/20 border-b border-[#D4B26C]/30 px-4 py-2.5 cursor-pointer transition hover:bg-[#D4B26C]/25"
            >
              <span className="flex items-center gap-1.5 text-xs font-semibold text-[#D4B26C] truncate">
                <Sparkles className="h-3.5 w-3.5 text-[#D4B26C] shrink-0 animate-pulse" />
                <span className="truncate">
                  {firstCartUpsell.suggestion.isFreeOrCheaper
                    ? `✨ Nâng cấp ${firstCartUpsell.suggestion.targetService.name} (Đồng giá!)`
                    : `✨ Thêm +$${firstCartUpsell.suggestion.diff} lên ${firstCartUpsell.suggestion.targetService.name}`}
                </span>
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  handleUpgradeCartItem(firstCartUpsell.item, firstCartUpsell.suggestion)
                }}
                className="shrink-0 rounded-md bg-[#D4B26C] hover:brightness-110 text-slate-950 px-3 py-1 text-[11px] font-black uppercase tracking-wider shadow-sm transition active:scale-95 cursor-pointer"
              >
                UPGRADE
              </button>
            </div>
          )}

          <div
            data-testid="mobile-cart-toggle-btn"
            onClick={() => setIsMobileCartOpen(true)}
            className="flex items-center justify-between gap-3 px-4 py-3 cursor-pointer"
          >
            <div className="flex flex-col min-w-0">
              <span className="text-[11px] text-slate-400 font-medium truncate">
                {cartSummary.itemCount} {cartSummary.itemCount === 1 ? 'dịch vụ' : 'dịch vụ'} · {cartSummary.totalMinutes} min
              </span>
              <span className="font-serif font-black text-2xl text-[#D4B26C] italic leading-none mt-0.5">
                ${cartSummary.subtotal}
              </span>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setIsMobileCartOpen(true)
              }}
              className="shrink-0 h-12 px-5 rounded-xl bg-gradient-to-r from-[#DFB971] to-[#C49A45] hover:brightness-105 active:scale-95 text-slate-950 font-bold text-xs sm:text-sm uppercase tracking-wider shadow-lg flex items-center gap-1.5 transition duration-150 cursor-pointer"
            >
              <span>VIEW VISIT & BOOK ({cartSummary.itemCount})</span>
              <ChevronRight className="h-4 w-4 stroke-[3]" />
            </button>
          </div>
        </div>
      )}

      {/* 4. Luxury Dark Mobile Bottom Sheet Cart Drawer */}
      {isMobileCartOpen && (
        <div
          data-testid="bottom-sheet-drawer"
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-xs lg:hidden animate-fadeIn"
          onClick={() => setIsMobileCartOpen(false)}
        >
          <div
            className="relative flex flex-col w-full max-h-[85vh] rounded-t-[20px] border-t border-[#D4B26C]/30 bg-[#13171F] text-white shadow-2xl overflow-hidden animate-slideUp"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drag handle */}
            <div className="w-10 h-1 bg-white/30 rounded-full mx-auto my-3 shrink-0" />

            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 px-5 pb-3 shrink-0">
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-[#D4B26C]" />
                <h3 className="font-serif font-medium text-xl text-white">Your Selections</h3>
                <span className="rounded-full bg-[#D4B26C]/20 border border-[#D4B26C]/30 px-2 py-0.5 text-[10px] font-black text-[#D4B26C]">
                  {cartSummary.itemCount} items
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileCartOpen(false)}
                className="h-8 w-8 rounded-full bg-white/10 text-white hover:bg-white/20 flex items-center justify-center transition cursor-pointer"
                aria-label="Đóng"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Body: Itemized breakdown */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {selectedItems.length === 0 ? (
                <div className="py-12 text-center space-y-3">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white/5 text-[#D4B26C]">
                    <Scissors className="h-7 w-7 opacity-60" />
                  </div>
                  <p className="text-sm font-bold text-slate-200">Ready when you are</p>
                  <p className="text-xs text-slate-400 max-w-xs mx-auto">
                    Your selections, estimated time, and total will appear here.
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsMobileCartOpen(false)}
                    className="mt-2 inline-flex items-center gap-1.5 rounded-xl bg-[#D4B26C] hover:brightness-110 text-slate-950 px-4 py-2 text-xs font-bold shadow-xs transition cursor-pointer"
                  >
                    <span>Browse services</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-4 divide-y divide-white/10">
                  {selectedItems.map((item) => {
                    const basePrice = isVipMember && item.memberPrice ? item.memberPrice : item.price
                    const itemAddonsTotal = item.selectedAddonIds.reduce((sum, aId) => {
                      const addon = findAddonById(aId, addonServices)
                      return sum + (addon ? addon.price : 0)
                    }, 0)
                    const itemAddonsMinutes = item.selectedAddonIds.reduce((sum, aId) => {
                      const addon = findAddonById(aId, addonServices)
                      return sum + (addon ? addon.durationMinutes || 10 : 0)
                    }, 0)
                    const itemTotal = basePrice + itemAddonsTotal
                    const itemTotalMinutes = item.durationMinutes + itemAddonsMinutes
                    const itemService = allServices.find((s) => s.id === item.serviceId)
                    const itemUpsell = itemService
                      ? getServiceUpgradeSuggestion(itemService, item.selectedAddonIds)
                      : null

                    return (
                      <div key={item.id} className="pt-4 first:pt-0 space-y-2.5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <img
                              src={getServicePhoto(itemService)}
                              alt={item.name}
                              className="w-11 h-11 rounded-lg object-cover shrink-0 border border-white/15"
                              loading="lazy"
                            />
                            <div className="min-w-0 flex-1">
                              <span className="font-bold text-sm text-white block truncate">{item.name}</span>
                              <span className="text-xs text-slate-400 block">{itemTotalMinutes} min</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="font-serif font-black text-base text-[#D4B26C]">${itemTotal}</span>
                            <button
                              type="button"
                              data-testid={`bs-edit-btn-${item.serviceId}`}
                              onClick={() => handleEditCartItem(item)}
                              className="p-1 rounded-lg text-slate-400 hover:text-[#D4B26C] hover:bg-white/10 transition cursor-pointer"
                              title="Tùy chỉnh lại"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              data-testid={`bs-delete-btn-${item.serviceId}`}
                              onClick={() => handleRemoveFromCart(item.serviceId)}
                              className="p-1 rounded-lg text-slate-400 hover:text-red-400 hover:bg-white/10 transition cursor-pointer"
                              title="Xóa khỏi đơn"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>

                        {item.includedAddons && item.includedAddons.length > 0 && (
                          <div className="flex items-center gap-1 flex-wrap">
                            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
                              <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                              <span>Bao gồm {item.includedAddons.length} liệu trình cao cấp</span>
                            </span>
                          </div>
                        )}

                        {item.selectedAddonIds.length > 0 && (
                          <div className="pl-3 border-l-2 border-[#D4B26C]/40 space-y-1">
                            {item.selectedAddonIds.map((aId) => {
                              const addon = findAddonById(aId, addonServices)
                              if (!addon) return null
                              return (
                                <div key={aId} className="flex items-center justify-between text-xs text-slate-300">
                                  <span className="flex items-center gap-1.5 truncate">
                                    <Sparkles className="h-3 w-3 text-[#D4B26C] shrink-0" />
                                    <span className="truncate">└ {addon.name}</span>
                                    <span className="text-[10px] text-slate-400">(+{addon.durationMinutes || 10}m)</span>
                                  </span>
                                  <span className="font-bold text-[#D4B26C] shrink-0">+${addon.price}</span>
                                </div>
                              )
                            })}
                          </div>
                        )}

                        {itemUpsell && (
                          <div className="mt-2.5 rounded-xl border border-[#D4B26C]/40 bg-gradient-to-b from-[#D4B26C]/15 to-[#D4B26C]/5 p-3 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-black uppercase tracking-wider text-[#D4B26C] flex items-center gap-1">
                                <Sparkles className="h-3 w-3 text-[#D4B26C]" />
                                <span>GỢI Ý NÂNG CẤP GÓI</span>
                              </span>
                              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 rounded px-1.5 py-0.2">
                                Tiết kiệm ${itemUpsell.absorbedValue}
                              </span>
                            </div>
                            <p className="text-xs text-slate-200 leading-relaxed">
                              {itemUpsell.isFreeOrCheaper ? (
                                <>
                                  Nâng cấp lên gói <strong className="text-white font-bold">{itemUpsell.targetService.name}</strong> hoàn toàn đồng giá!
                                </>
                              ) : (
                                <>
                                  Thêm <strong className="text-[#D4B26C] font-bold">+${itemUpsell.diff}</strong> để nâng cấp trọn gói lên{' '}
                                  <strong className="text-white font-bold">{itemUpsell.targetService.name}</strong>.
                                </>
                              )}
                            </p>
                            <button
                              type="button"
                              onClick={() => {
                                handleUpgradeCartItem(item, itemUpsell)
                              }}
                              className="w-full rounded-lg border border-[#D4B26C] text-[#D4B26C] hover:bg-[#D4B26C] hover:text-slate-950 font-bold text-xs py-2 px-3 transition text-center uppercase tracking-wider active:scale-98 cursor-pointer"
                            >
                              NÂNG CẤP LÊN {itemUpsell.targetService.name.toUpperCase()} · {itemUpsell.diff > 0 ? `+$${itemUpsell.diff}` : 'MIỄN PHÍ'}
                            </button>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            {selectedItems.length > 0 && (
              <div className="shrink-0 border-t border-white/10 bg-[#1A1F2B] p-5 space-y-3 pb-safe">
                {cartSummary.totalSavings > 0 && (
                  <div className="rounded-xl bg-amber-950/40 border border-amber-500/30 p-2.5 flex items-center justify-between text-xs text-amber-300 font-bold">
                    <span className="flex items-center gap-1.5">
                      <Crown className="h-4 w-4 text-amber-400 fill-amber-400" />
                      <span>VIP Member Savings</span>
                    </span>
                    <span>-${cartSummary.totalSavings}</span>
                  </div>
                )}

                <div className="flex items-baseline justify-between">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Total <span className="text-slate-500">· {cartSummary.totalMinutes} min</span>
                  </span>
                  <span className="font-serif font-black text-3xl text-[#D4B26C] italic">${cartSummary.subtotal}</span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setIsMobileCartOpen(false)
                    alert(`Đơn hàng mẫu trị giá $${cartSummary.subtotal} đã được xác nhận!`)
                  }}
                  className="w-full h-12 rounded-xl bg-gradient-to-r from-[#DFB971] to-[#C49A45] hover:brightness-105 active:scale-95 text-slate-950 font-black text-xs sm:text-sm uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 transition duration-200 cursor-pointer"
                >
                  <span>CONTINUE TO BOOK · ${cartSummary.subtotal}</span>
                  <ChevronRight className="h-4 w-4 stroke-[3]" />
                </button>

                <p className="text-center text-[10px] text-slate-400">
                  No deposit required · We'll confirm by text
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
