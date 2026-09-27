// Community Jobs demo (#589) — pure, static demo fixtures. No React, no repositories:
// this data seeds the owner (Kayla/Bitcoin Nail Bar) and staff (Jessica) personas so the
// Jobs tab of the Community demo works without a live merchant/staff backend.
import { JOB_CHAT_ACCOUNT_NAMES } from '../jobChatTarget'
import { POS_ACTIVE_SERVICE_STATUS } from '../../../constants/posRecruitment'
import { DEMO_CATEGORIES, DEMO_SERVICES } from '../../public/booking/upsellMenu/demoMenu'
import type { StaffAccountLike } from '../../staff-dashboard/community/jobs/staffJobsModel'
import type { MerchantBusinessInfo } from '../../../types/domain'
import type { PosCategoryApiDto, PosServiceApiDto } from '../../../types/repositories'

/** Owner mock-store key for the Bitcoin Nail Bar posting (Q3 chat wiring uses this to link staff). */
export const BNB_BUSINESS_ID = 'demo-business-bitcoin-nail-bar'

export const BNB_BUSINESS_INFO: MerchantBusinessInfo = {
  name: 'Bitcoin Nail Bar',
  address: '1201 Bitcoin Blvd',
  city: 'Houston',
  state: 'TX',
  zipCode: '77002',
  phone: '(713) 555-01xx',
  logo: null,
}

/** Fixed to the Kayla demo persona (jobChatTarget.ts) — the only account that owns Bitcoin Nail Bar. */
export const BNB_OWNER_NAME = JOB_CHAT_ACCOUNT_NAMES.kayla

export const DEMO_STAFF_ACCOUNTS: Record<'jessica', StaffAccountLike> = {
  jessica: {
    fullName: JOB_CHAT_ACCOUNT_NAMES.jessica,
    phone: '(713) 555-02xx',
  },
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export const DEMO_POS_CATEGORIES: PosCategoryApiDto[] = DEMO_CATEGORIES.map((category, index) => ({
  id: `demo-category-${slugify(category.name)}`,
  name: category.name,
  description: null,
  displayOrder: index,
}))

const categoryIdByName = new Map(DEMO_POS_CATEGORIES.map((category) => [category.name, category.id]))

export const DEMO_POS_SERVICES: PosServiceApiDto[] = DEMO_SERVICES.map((service, index) => ({
  id: `demo-service-${slugify(service.name)}`,
  name: service.name,
  price: service.price,
  durationMinutes: service.durationMinutes,
  description: service.description ?? null,
  icon: null,
  photoUrl: null,
  status: POS_ACTIVE_SERVICE_STATUS,
  displayOrder: index,
  categoryIds: service.categoryNames
    .map((name) => categoryIdByName.get(name))
    .filter((id): id is string => Boolean(id)),
  tags: service.tags,
}))
