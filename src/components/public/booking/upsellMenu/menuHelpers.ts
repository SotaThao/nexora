/**
 * Helper đọc metadata nhúng trong `description` của service.
 *
 * Port từ `PosServicesView.tsx` (parseLinkedAddons) và
 * `CreateEditPosServiceModal.tsx` (extractMemberPriceFromService) của
 * vlink-nexora-fe, branch `feature/800_pos-menu-upsell`. POS gốc chưa có
 * entity add-on riêng nên add-on và giá member được nhúng vào chuỗi
 * description dạng `[ADDONS:...]` / `[MEMBER:$xx]`.
 */

import type { PosService } from './types'

export function parseLinkedAddons(
  service: PosService,
  allServices: PosService[] = []
): Array<{ id: string; name: string; price: number }> {
  if (!service.description) return []
  const match = service.description.match(/\[ADDONS:(.*?)\]/i)
  if (!match || !match[1]) return []

  const rawEntries = match[1].split(',').map((s) => s.trim()).filter(Boolean)
  return rawEntries.map((entry) => {
    if (entry.includes('|')) {
      const parts = entry.split('|')
      return { id: parts[0], name: parts[1] || parts[0], price: Number(parts[2]) || 0 }
    }
    const matched = allServices.find((s) => s.id === entry || s.name.toLowerCase() === entry.toLowerCase())
    if (matched) return { id: matched.id, name: matched.name, price: matched.price }
    const defaultAddonMap: Record<string, { name: string; price: number }> = {
      'addon-1': { name: 'Callus Removal', price: 10 },
      'addon-2': { name: 'Sugar Scrub Exfoliation', price: 8 },
      'addon-3': { name: 'Smooth Feet Combo', price: 15 },
      'addon-4': { name: 'Refill (2 weeks)', price: 0 },
      'addon-5': { name: 'Hot Stone Foot Massage (15m)', price: 18 },
      'addon-6': { name: 'Paraffin Wax Treatment', price: 15 },
    }
    if (defaultAddonMap[entry]) {
      return { id: entry, name: defaultAddonMap[entry].name, price: defaultAddonMap[entry].price }
    }
    return { id: entry, name: entry, price: 0 }
  })
}

export function extractMemberPriceFromService(service: PosService | null | undefined): string {
  if (!service) return ''
  if (typeof (service as any).memberPrice === 'number') {
    return String((service as any).memberPrice)
  }
  const memberTag = service.tags?.find((t) => t.toLowerCase().startsWith('member:'))
  if (memberTag) {
    return memberTag.replace(/member:\s*\$?/i, '').trim()
  }
  if (service.description) {
    const match = service.description.match(/\[MEMBER:\s*\$?(\d+(?:\.\d+)?)\]/i)
    if (match && match[1]) return match[1]
  }
  return ''
}

export function cleanDescriptionFromMetadata(desc: string | null | undefined): string {
  if (!desc) return ''
  return desc
    .replace(/\[MEMBER:\s*\$?(\d+(?:\.\d+)?)\]/gi, '')
    .replace(/\[ADDONS:.*?\]/gi, '')
    .trim()
}
