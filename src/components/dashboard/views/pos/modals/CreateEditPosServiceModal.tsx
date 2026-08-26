// CreateEditPosServiceModal — 100% NEXORA Design Tokens with Custom UI Dropdowns & Inline Quick Add-on Creator.
// Features:
// 1. Service Name, Rich Text Description Toolbar, Image Upload Box.
// 2. Custom Category & Service Type Dropdowns.
// 3. 2-Column Pricing (Regular Price & Member Price).
// 4. Service Add-ons with INLINE QUICK ADD-ON CREATOR (+ Add New button expands inline mini-form).
// 5. Service Status toggle card.
// 6. ⭐ Owner Recommended highlight card.
// 7. Cancel & Save Changes action buttons.

import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Check,
  ChevronDown,
  ImagePlus,
  Italic,
  List,
  ListOrdered,
  Loader2,
  Package,
  Palette,
  Plus,
  Redo,
  Scissors,
  Search,
  Sparkles,
  Star,
  Type,
  Underline,
  Undo,
  UploadCloud,
  X,
} from 'lucide-react'
import { useTranslation } from '../../../../../contexts/LanguageContext'
import type {
  PosCategoryApiDto,
  PosServiceApiDto,
  PosServiceStatus,
  PosTagApiDto,
} from '../../../../../types/repositories'
import type { PosServiceInput } from '../../../../../data/repositories/posServices'

export interface ServiceTypeOption {
  value: 'regular' | 'addon' | 'combo'
  title: string
  subtitle: string
}

const SERVICE_TYPE_OPTIONS: ServiceTypeOption[] = [
  {
    value: 'regular',
    title: 'Regular Service',
    subtitle: 'Standalone service (default)',
  },
  {
    value: 'addon',
    title: 'Add-on Service',
    subtitle: 'Must be booked with another service',
  },
  {
    value: 'combo',
    title: 'Package / Combo',
    subtitle: 'Bundle of multiple services',
  },
]

export function extractMemberPriceFromService(service: PosServiceApiDto | null | undefined): string {
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

export function extractLinkedAddons(service: PosServiceApiDto | null | undefined): string[] {
  if (!service || !service.description) return []
  const match = service.description.match(/\[ADDONS:(.*?)\]/i)
  if (match && match[1]) {
    return match[1].split(',').map((s) => s.trim()).filter(Boolean)
  }
  return []
}

export function parseAddonId(entry: string): string {
  if (entry.includes('|')) {
    return entry.split('|')[0]
  }
  return entry
}


const DEFAULT_LEGACY_ADDON_NAME_MAP: Record<string, string> = {
  'addon-1': 'callus removal',
  'addon-2': 'sugar scrub',
  'addon-3': 'smooth feet',
  'addon-4': 'refill',
  'addon-5': 'hot stone',
  'addon-6': 'paraffin wax',
}

export function isAddonSelected(addon: { id: string; name: string }, selectedSet: Set<string>): boolean {
  if (!selectedSet || selectedSet.size === 0) return false
  const addonId = addon.id.toLowerCase()
  const addonName = addon.name.toLowerCase()

  for (const sel of selectedSet) {
    const s = sel.toLowerCase().trim()
    if (!s) continue
    // 1. Direct ID match
    if (s === addonId) return true
    // 2. Direct Name match
    if (s === addonName) return true
    // 3. Substring / Token match (e.g. "callus removal" in "callus removal treatment")
    if (addonName.includes(s) || s.includes(addonName)) return true
    // 4. Legacy ID mapping
    const legacyName = DEFAULT_LEGACY_ADDON_NAME_MAP[s]
    if (legacyName && (addonName.includes(legacyName) || addonId.includes(legacyName))) return true
  }
  return false
}

export function parseAddonName(entry: string): string {
  if (entry.includes('|')) {
    return entry.split('|')[1] || entry.split('|')[0]
  }
  return entry
}


export default function CreateEditPosServiceModal({
  open,
  onClose,
  onSubmit,
  isSubmitting,
  categories,
  tagSuggestions,
  service,
  allServices = [],
}: {
  open: boolean
  onClose: () => void
  onSubmit: (input: PosServiceInput) => void
  isSubmitting: boolean
  categories: PosCategoryApiDto[]
  tagSuggestions: PosTagApiDto[]
  service?: PosServiceApiDto | null
  allServices?: PosServiceApiDto[]
}) {
  const { t } = useTranslation()
  const isEditMode = Boolean(service)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Form states
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('')

  const [price, setPrice] = useState('')
  const [memberPrice, setMemberPrice] = useState('')
  const [durationMinutes, setDurationMinutes] = useState('30')
  const [serviceType, setServiceType] = useState<'regular' | 'addon' | 'combo'>('regular')
  const [selectedAddonIds, setSelectedAddonIds] = useState<Set<string>>(new Set())
  const [addonSearch, setAddonSearch] = useState('')
  const [status, setStatus] = useState<PosServiceStatus>('Active')
  const [isOwnerRecommended, setIsOwnerRecommended] = useState(false)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null)

  // Dropdown open states
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false)
  const [isServiceTypeDropdownOpen, setIsServiceTypeDropdownOpen] = useState(false)

  // Inline Quick Add-on Creator States
  const [isQuickAddonOpen, setIsQuickAddonOpen] = useState(false)
  const [quickAddonName, setQuickAddonName] = useState('')
  const [quickAddonPrice, setQuickAddonPrice] = useState('')
  const [customCreatedAddons, setCustomCreatedAddons] = useState<Array<{ id: string; name: string; price: number }>>([])

  // Available add-ons from catalog + dynamically added ones
  const availableAddons = useMemo(() => {
    const list = allServices.filter(
      (s) =>
        s.id !== service?.id &&
        (s.tags?.some((tg) => tg.toLowerCase().includes('add-on') || tg.toLowerCase().includes('addon')) ||
          s.categoryIds?.some((cId) => {
            const cat = categories.find((c) => c.id === cId)
            return cat && (cat.name.toLowerCase().includes('add-on') || cat.name.toLowerCase().includes('addon'))
          })),
    )

    const baseList =
      list.length > 0
        ? list.map((s) => ({ id: s.id, name: s.name, price: s.price }))
        : [
            { id: 'addon-1', name: 'Callus Removal', price: 10 },
            { id: 'addon-2', name: 'Sugar Scrub Exfoliation', price: 8 },
            { id: 'addon-3', name: 'Smooth Feet Combo', price: 15 },
            { id: 'addon-4', name: 'Refill (2 weeks)', price: 0 },
            { id: 'addon-5', name: 'Hot Stone Foot Massage (15 min)', price: 18 },
            { id: 'addon-6', name: 'Paraffin Wax Treatment', price: 15 },
          ]

    // Append newly created quick add-ons
    return [...customCreatedAddons, ...baseList]
  }, [allServices, service, categories, customCreatedAddons])

  // Filtered add-ons by search
  const filteredAddons = useMemo(() => {
    const q = addonSearch.trim().toLowerCase()
    if (!q) return availableAddons
    return availableAddons.filter((a) => a.name.toLowerCase().includes(q))
  }, [availableAddons, addonSearch])

  useEffect(() => {
    if (!open) return
    setName(service?.name ?? '')
    setDescription(cleanDescriptionFromMetadata(service?.description))
    setPrice(service ? String(service.price) : '')
    setMemberPrice(extractMemberPriceFromService(service))
    setDurationMinutes(service ? String(service.durationMinutes) : '25')

    // Category
    const firstCat = service?.categoryIds?.[0] || categories?.[0]?.id || ''
    setSelectedCategoryId(firstCat)

    // Tags & Type
    const tags = service?.tags ?? []
    const isAddon = tags.some((t) => t.toLowerCase() === 'add-on' || t.toLowerCase() === 'addon')
    const isCombo = tags.some((t) => t.toLowerCase() === 'combo' || t.toLowerCase().includes('package'))
    if (isAddon) setServiceType('addon')
    else if (isCombo) setServiceType('combo')
    else setServiceType('regular')



    // Owner Recommended
    setIsOwnerRecommended(
      tags.some(
        (t) =>
          t.toLowerCase() === 'owner recommended' ||
          t.toLowerCase() === 'vip' ||
          t.toLowerCase() === 'bestseller',
      ),
    )

    // Linked Addons (Match by ID or Name from metadata)
    const linked = extractLinkedAddons(service)
    if (linked.length > 0) {
      const normalizedIds = new Set<string>()
      linked.forEach((entry) => {
        const idPart = parseAddonId(entry)
        const namePart = parseAddonName(entry).toLowerCase()
        normalizedIds.add(idPart)
        normalizedIds.add(namePart)
      })
      setSelectedAddonIds(normalizedIds)
    } else {
      setSelectedAddonIds(new Set())
    }

    setStatus(service?.status ?? 'Active')
    setPhotoFile(null)
    setPhotoPreviewUrl(service?.photoUrl ?? null)
    setAddonSearch('')
    setIsCategoryDropdownOpen(false)
    setIsServiceTypeDropdownOpen(false)
    setIsQuickAddonOpen(false)
    setQuickAddonName('')
    setQuickAddonPrice('')
  }, [open, service, categories])

  useEffect(() => {
    if (!photoFile) return
    const url = URL.createObjectURL(photoFile)
    setPhotoPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [photoFile])

  if (!open) return null

  const toggleAddon = (addon: { id: string; name: string }) => {
    setSelectedAddonIds((prev) => {
      const next = new Set(prev)
      const hasItem = isAddonSelected(addon, next)

      if (hasItem) {
        // Remove matching entries
        const toDelete: string[] = []
        const addonName = addon.name.toLowerCase()
        const addonId = addon.id.toLowerCase()
        next.forEach((item) => {
          const it = item.toLowerCase()
          if (
            it === addonId ||
            it === addonName ||
            addonName.includes(it) ||
            it.includes(addonName) ||
            (DEFAULT_LEGACY_ADDON_NAME_MAP[it] && addonName.includes(DEFAULT_LEGACY_ADDON_NAME_MAP[it]))
          ) {
            toDelete.push(item)
          }
        })
        toDelete.forEach((d) => next.delete(d))
      } else {
        next.add(addon.id)
        next.add(addon.name.toLowerCase())
      }
      return next
    })
  }

  const handleCreateQuickAddon = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const trimmed = quickAddonName.trim()
    const numPrice = Number(quickAddonPrice)
    if (!trimmed || !Number.isFinite(numPrice) || numPrice < 0) return

    const newId = `quick-addon-${Date.now()}`
    const newAddon = {
      id: newId,
      name: trimmed,
      price: numPrice,
    }

    // Add to list and auto-check
    setCustomCreatedAddons((prev) => [newAddon, ...prev])
    setSelectedAddonIds((prev) => new Set(prev).add(newId))

    // Reset quick form
    setQuickAddonName('')
    setQuickAddonPrice('')
    setIsQuickAddonOpen(false)
  }

  const selectedCategoryObj = categories.find((c) => c.id === selectedCategoryId)
  const currentServiceTypeObj =
    SERVICE_TYPE_OPTIONS.find((opt) => opt.value === serviceType) || SERVICE_TYPE_OPTIONS[0]

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const trimmedName = name.trim()
    const priceValue = Number(price)
    const durationValue = Number(durationMinutes)
    if (!trimmedName || !Number.isFinite(priceValue) || priceValue < 0 || !(durationValue > 0)) return

    // Finalize tags
    const finalTags: string[] = []
    if (serviceType === 'addon') finalTags.push('Add-on')
    if (serviceType === 'combo') finalTags.push('Combo')
    if (isOwnerRecommended) finalTags.push('Owner Recommended')

    // Member Price
    const memberNum = Number(memberPrice)
    let finalDesc = description.trim()
    if (Number.isFinite(memberNum) && memberNum > 0) {
      finalTags.push(`Member:$${memberNum}`)
      finalDesc = `[MEMBER:$${memberNum}] ${finalDesc}`.trim()
    }

    // Embed Linked Addons in Description metadata with id|name|price
    const uniqueLinkedAddons: Array<{ id: string; name: string; price: number }> = []
    availableAddons.forEach((addon) => {
      if (isAddonSelected(addon, selectedAddonIds)) {
        if (!uniqueLinkedAddons.some((u) => u.id === addon.id || u.name.toLowerCase() === addon.name.toLowerCase())) {
          uniqueLinkedAddons.push({ id: addon.id, name: addon.name, price: addon.price })
        }
      }
    })

    if (uniqueLinkedAddons.length > 0) {
      const addonListStr = uniqueLinkedAddons.map((a) => `${a.id}|${a.name}|${a.price}`).join(',')
      finalDesc = `${finalDesc} [ADDONS:${addonListStr}]`.trim()
    }

    onSubmit({
      name: trimmedName,
      price: priceValue,
      durationMinutes: durationValue,
      description: finalDesc || undefined,
      categoryIds: selectedCategoryId ? [selectedCategoryId] : (service?.categoryIds ?? []),
      tags: finalTags,
      status,
      photo: photoFile,
    })
  }

  const isValid =
    name.trim().length > 0 &&
    price.trim().length > 0 &&
    Number(price) >= 0 &&
    Number(durationMinutes) > 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-nexoraText/70 p-4 backdrop-blur-sm">
      <div className="relative flex flex-col w-full max-w-[560px] max-h-[92vh] rounded-2xl border border-nexoraBorder bg-white shadow-2xl overflow-hidden animate-fadeIn">
        {/* Header */}
        <div className="flex shrink-0 items-start justify-between px-6 pt-5 pb-3">
          <div>
            <h2 className="text-xl font-bold font-serif text-nexoraText">
              {isEditMode ? 'Edit Service' : 'Add Service'}
            </h2>
            <p className="text-xs text-nexoraMuted mt-0.5">Make changes to the service details below.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-nexoraSubtle hover:text-nexoraText hover:bg-nexoraSurfaceMuted transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-2 space-y-4">
          {/* 1. Service Name & Image (Inline Side-by-Side) */}
          <div className="flex items-start gap-3.5">
            {/* Image Upload Thumbnail Box */}
            <div className="relative group shrink-0">
              <label className="block text-xs font-bold text-nexoraText mb-1">Image</label>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="group relative flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-nexoraBorder hover:border-nexoraBrand bg-nexoraSurfaceMuted/60 hover:bg-nexoraBrandSoft/20 cursor-pointer transition shadow-2xs"
                title="Tải ảnh dịch vụ (PNG, JPG up to 5MB)"
              >
                {photoPreviewUrl ? (
                  <img src={photoPreviewUrl} alt="Preview" className="h-full w-full object-cover" />
                ) : (
                  <UploadCloud className="h-5 w-5 text-nexoraSubtle group-hover:text-nexoraBrand transition" />
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)}
              />
            </div>

            {/* Service Name Input */}
            <div className="flex-1 min-w-0">
              <label className="block text-xs font-bold text-nexoraText mb-1">
                Service Name <span className="text-nexoraDanger">*</span>
              </label>
              <input
                type="text"
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Bitcoin Gold Pedicure"
                className="h-10 sm:h-11 w-full rounded-xl border border-nexoraBorder bg-white px-3.5 text-xs font-semibold text-nexoraText placeholder-nexoraSubtle outline-none transition focus:border-nexoraBrand focus:ring-2 focus:ring-nexoraBrand/10"
              />
            </div>
          </div>

          {/* 2. Service Description with Rich Text Toolbar */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-nexoraText">Service Description</label>
              <span className="text-[11px] text-nexoraSubtle">
                (Shown on /services page — supports rich formatting)
              </span>
            </div>

            <div className="rounded-xl border border-nexoraBorder overflow-hidden focus-within:border-nexoraBrand focus-within:ring-2 focus-within:ring-nexoraBrand/10 transition">
              {/* Rich Text Toolbar */}
              <div className="flex items-center gap-1 border-b border-nexoraBorder bg-nexoraSurfaceMuted/80 px-2.5 py-1.5 text-nexoraMuted text-xs flex-wrap">
                <button type="button" className="p-1 hover:bg-slate-200 rounded font-bold" title="Bold">
                  <Bold className="h-3.5 w-3.5" />
                </button>
                <button type="button" className="p-1 hover:bg-slate-200 rounded italic" title="Italic">
                  <Italic className="h-3.5 w-3.5" />
                </button>
                <button type="button" className="p-1 hover:bg-slate-200 rounded underline" title="Underline">
                  <Underline className="h-3.5 w-3.5" />
                </button>
                <div className="h-3.5 w-px bg-nexoraBorder mx-1" />
                <button type="button" className="p-1 hover:bg-slate-200 rounded" title="Font size">
                  <span className="text-[11px] font-bold">Aa</span>
                </button>
                <button type="button" className="p-1 hover:bg-slate-200 rounded" title="Text format">
                  <Type className="h-3.5 w-3.5" />
                </button>
                <button type="button" className="p-1 hover:bg-slate-200 rounded" title="Color">
                  <Palette className="h-3.5 w-3.5" />
                </button>
                <div className="h-3.5 w-px bg-nexoraBorder mx-1" />
                <button type="button" className="p-1 hover:bg-slate-200 rounded" title="Align Left">
                  <AlignLeft className="h-3.5 w-3.5" />
                </button>
                <button type="button" className="p-1 hover:bg-slate-200 rounded" title="Align Center">
                  <AlignCenter className="h-3.5 w-3.5" />
                </button>
                <button type="button" className="p-1 hover:bg-slate-200 rounded" title="Align Right">
                  <AlignRight className="h-3.5 w-3.5" />
                </button>
                <div className="h-3.5 w-px bg-nexoraBorder mx-1" />
                <button type="button" className="p-1 hover:bg-slate-200 rounded" title="Bullet list">
                  <List className="h-3.5 w-3.5" />
                </button>
                <button type="button" className="p-1 hover:bg-slate-200 rounded" title="Numbered list">
                  <ListOrdered className="h-3.5 w-3.5" />
                </button>
                <div className="h-3.5 w-px bg-nexoraBorder mx-1" />
                <button type="button" className="p-1 hover:bg-slate-200 rounded" title="Undo">
                  <Undo className="h-3.5 w-3.5" />
                </button>
                <button type="button" className="p-1 hover:bg-slate-200 rounded" title="Redo">
                  <Redo className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Textarea */}
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Transform your skin's radiance with a luxurious treatment featuring bath bomb, scrub, and hot stone massage..."
                className="w-full p-3 text-xs text-nexoraText placeholder-nexoraSubtle outline-none resize-y bg-white"
              />
            </div>
          </div>

          {/* 4. Category & Duration (2 columns) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Custom Category Dropdown */}
            <div className="relative">
              <label className="block text-xs font-bold text-nexoraText mb-1">Category</label>
              <button
                type="button"
                onClick={() => {
                  setIsCategoryDropdownOpen(!isCategoryDropdownOpen)
                  setIsServiceTypeDropdownOpen(false)
                }}
                className={`h-10 w-full flex items-center justify-between rounded-xl border px-3.5 text-xs font-semibold text-nexoraText transition ${
                  isCategoryDropdownOpen
                    ? 'border-nexoraBrand ring-2 ring-nexoraBrand/10 bg-white'
                    : 'border-nexoraBorder bg-white hover:border-slate-300'
                }`}
              >
                <span className="truncate">{selectedCategoryObj?.name || 'Chọn danh mục...'}</span>
                <ChevronDown className={`h-4 w-4 text-nexoraSubtle transition-transform ${isCategoryDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isCategoryDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setIsCategoryDropdownOpen(false)} />
                  <div className="absolute left-0 right-0 top-full mt-1 z-40 max-h-52 overflow-y-auto rounded-xl border border-nexoraBorder bg-white py-1 shadow-lg animate-fadeIn text-xs">
                    {categories.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          setSelectedCategoryId(c.id)
                          setIsCategoryDropdownOpen(false)
                        }}
                        className={`flex w-full items-center justify-between px-3.5 py-2.5 text-left font-medium transition ${
                          selectedCategoryId === c.id
                            ? 'bg-nexoraBrandSoft text-nexoraBrand font-bold'
                            : 'text-nexoraText hover:bg-nexoraSurfaceMuted'
                        }`}
                      >
                        <span>{c.name}</span>
                        {selectedCategoryId === c.id && <Check className="h-3.5 w-3.5 text-nexoraBrand" />}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Duration (Minutes) */}
            <div>
              <label className="block text-xs font-bold text-nexoraText mb-1">Duration (Minutes)</label>
              <input
                type="number"
                min={1}
                step="1"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
                placeholder="25"
                className="h-10 w-full rounded-xl border border-nexoraBorder bg-white px-3.5 text-xs font-semibold text-nexoraText outline-none focus:border-nexoraBrand focus:ring-2 focus:ring-nexoraBrand/10"
              />
            </div>
          </div>

          {/* 5. Regular Price ($) & Member Price ($) (2 columns) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-nexoraText mb-1">
                Regular Price ($) <span className="text-nexoraDanger">*</span>
              </label>
              <input
                type="number"
                min={0}
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="35"
                className="h-10 w-full rounded-xl border border-nexoraBorder bg-white px-3.5 text-xs font-bold text-nexoraText outline-none focus:border-nexoraBrand focus:ring-2 focus:ring-nexoraBrand/10"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-nexoraText mb-1">
                Member Price ($) - Optional
              </label>
              <input
                type="number"
                min={0}
                step="0.01"
                value={memberPrice}
                onChange={(e) => setMemberPrice(e.target.value)}
                placeholder="Leave blank if no member price"
                className="h-10 w-full rounded-xl border border-nexoraBorder bg-white px-3.5 text-xs font-bold text-nexoraBrand placeholder-nexoraSubtle outline-none focus:border-nexoraBrand focus:ring-2 focus:ring-nexoraBrand/10"
              />
            </div>
          </div>

          {/* 7. Service Type (Custom Component Dropdown) */}
          <div className="relative">
            <label className="block text-xs font-bold text-nexoraText mb-1">Service Type</label>
            <button
              type="button"
              onClick={() => {
                setIsServiceTypeDropdownOpen(!isServiceTypeDropdownOpen)
                setIsCategoryDropdownOpen(false)
              }}
              className={`h-14 w-full flex items-center justify-between rounded-xl border px-3.5 text-left transition ${
                isServiceTypeDropdownOpen
                  ? 'border-nexoraBrand ring-2 ring-nexoraBrand/10 bg-white'
                  : 'border-nexoraBorder bg-white hover:border-slate-300'
              }`}
            >
              <div>
                <span className="text-xs font-bold text-nexoraText block">{currentServiceTypeObj.title}</span>
                <span className="text-[11px] text-nexoraMuted block">{currentServiceTypeObj.subtitle}</span>
              </div>
              <ChevronDown
                className={`h-4 w-4 text-nexoraSubtle transition-transform shrink-0 ml-2 ${
                  isServiceTypeDropdownOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {isServiceTypeDropdownOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setIsServiceTypeDropdownOpen(false)} />
                <div className="absolute left-0 right-0 top-full mt-1 z-40 rounded-xl border border-nexoraBorder bg-white p-1.5 shadow-xl animate-fadeIn space-y-1">
                  {SERVICE_TYPE_OPTIONS.map((opt) => {
                    const isSelected = serviceType === opt.value
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                          setServiceType(opt.value)
                          setIsServiceTypeDropdownOpen(false)
                        }}
                        className={`flex w-full items-center justify-between rounded-lg p-2.5 text-left transition ${
                          isSelected
                            ? 'bg-nexoraBrandSoft/70 text-nexoraBrand'
                            : 'hover:bg-nexoraSurfaceMuted text-nexoraText'
                        }`}
                      >
                        <div>
                          <span className={`text-xs block ${isSelected ? 'font-bold text-nexoraBrand' : 'font-semibold text-nexoraText'}`}>
                            {opt.title}
                          </span>
                          <span className="text-[11px] text-nexoraMuted block">{opt.subtitle}</span>
                        </div>
                        {isSelected && <Check className="h-4 w-4 text-nexoraBrand shrink-0 ml-2" />}
                      </button>
                    )
                  })}
                </div>
              </>
            )}
          </div>

          {/* 8. Service Add-ons (Visible for Regular Service & Package / Combo, Hidden for Add-on Service) */}
          {serviceType === 'addon' ? (
            <div className="rounded-xl border border-indigo-100 bg-indigo-50/70 p-3.5 flex items-start gap-2.5 text-xs text-indigo-900 shadow-2xs">
              <Sparkles className="h-4 w-4 text-indigo-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block text-indigo-950">Add-on Service Note</span>
                <span className="text-[11px] text-indigo-700 block mt-0.5 leading-relaxed">
                  Dịch vụ này là <strong>Món bán thêm (Add-on)</strong>. Món này sẽ tự động xuất hiện trong danh sách gợi ý Upsell của các dịch vụ chính (Regular Services) và các gói Combo.
                </span>
              </div>
            </div>
          ) : (
            <div className="space-y-2.5 pt-1 border-t border-nexoraRule">
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-xs font-bold text-nexoraText">Service Add-ons</label>
                  <p className="text-[11px] text-nexoraMuted">Select add-ons that can be added to this {serviceType === 'combo' ? 'combo' : 'service'}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsQuickAddonOpen(!isQuickAddonOpen)}
                  className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-bold transition shadow-2xs ${
                    isQuickAddonOpen
                      ? 'border-nexoraBrand bg-nexoraBrand text-white'
                      : 'border-nexoraBrand/40 bg-nexoraBrandSoft/40 text-nexoraBrand hover:bg-nexoraBrandSoft'
                  }`}
                >
                  <Plus className={`h-3 w-3 transition-transform ${isQuickAddonOpen ? 'rotate-45' : ''}`} />
                  <span>{isQuickAddonOpen ? 'Đóng' : 'Add New'}</span>
                </button>
              </div>

              {/* Inline Quick Add-on Creator Expansion */}
              {isQuickAddonOpen && (
                <div className="rounded-xl border border-nexoraBrand/30 bg-nexoraBrandSoft/20 p-3 space-y-2.5 animate-fadeIn shadow-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-nexoraBrand">
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>Tạo nhanh món Add-on bán kèm mới</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsQuickAddonOpen(false)}
                      className="text-nexoraSubtle hover:text-nexoraText"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div className="sm:col-span-2">
                      <input
                        type="text"
                        autoFocus
                        value={quickAddonName}
                        onChange={(e) => setQuickAddonName(e.target.value)}
                        placeholder="Tên món Add-on (vd: Tinh chất Collagen...)"
                        className="h-8 w-full rounded-lg border border-nexoraBorder bg-white px-2.5 text-xs font-medium text-nexoraText placeholder-nexoraSubtle outline-none focus:border-nexoraBrand"
                      />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="relative flex-1">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs font-bold text-nexoraSubtle">
                          $
                        </span>
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          value={quickAddonPrice}
                          onChange={(e) => setQuickAddonPrice(e.target.value)}
                          placeholder="12.00"
                          className="h-8 w-full rounded-lg border border-nexoraBorder bg-white pl-5 pr-2 text-xs font-bold text-nexoraText outline-none focus:border-nexoraBrand"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCreateQuickAddon()}
                        disabled={!quickAddonName.trim() || !quickAddonPrice.trim()}
                        className="h-8 shrink-0 rounded-lg bg-nexoraBrand px-3 text-xs font-bold text-white shadow-xs hover:bg-nexoraBrandDark disabled:opacity-40 transition"
                      >
                        Thêm
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Search add-ons input */}
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-nexoraSubtle" />
                <input
                  type="text"
                  value={addonSearch}
                  onChange={(e) => setAddonSearch(e.target.value)}
                  placeholder="Search add-ons..."
                  className="h-9 w-full rounded-xl border border-nexoraBorder bg-nexoraSurfaceMuted/60 pl-8 pr-3 text-xs text-nexoraText placeholder-nexoraSubtle outline-none focus:border-nexoraBrand focus:bg-white transition"
                />
              </div>

              {/* Addons Checklist Box */}
              <div className="rounded-xl border border-nexoraBorder divide-y divide-nexoraRule bg-white max-h-48 overflow-y-auto shadow-2xs">
                {filteredAddons.map((addon) => {
                  const isChecked = isAddonSelected(addon, selectedAddonIds) ||
                    Array.from(selectedAddonIds).some(
                      (id) => id.toLowerCase() === addon.id.toLowerCase() || id.toLowerCase() === addon.name.toLowerCase()
                    )
                  return (
                    <label
                      key={addon.id}
                      className="flex items-center gap-3 px-3.5 py-2.5 hover:bg-nexoraSurfaceMuted/60 cursor-pointer transition select-none"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleAddon(addon)}
                        className="h-4 w-4 rounded border-nexoraBorder text-nexoraBrand focus:ring-nexoraBrand cursor-pointer"
                      />
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-bold text-nexoraText block truncate">{addon.name}</span>
                        <div className="flex items-center gap-1.5 text-[10px] text-nexoraMuted mt-0.5">
                          <span className="inline-block rounded bg-nexoraBrandSoft text-nexoraBrand border border-nexoraBrand/20 px-1 py-0.2 font-black">
                            ADD-ON
                          </span>
                          <span>•</span>
                          <span className="font-bold text-nexoraText">${addon.price}</span>
                        </div>
                      </div>
                    </label>
                  )
                })}
              </div>
            </div>
          )}

          {/* 9. Service Status Card */}
          <div className="flex items-center justify-between rounded-xl border border-nexoraBorder bg-nexoraSurfaceMuted/50 p-3.5">
            <div>
              <span className="text-xs font-bold text-nexoraText block">Service Status</span>
              <span className="text-[11px] text-nexoraMuted">
                {status === 'Active' ? 'Active and visible' : 'Inactive (Hidden from POS & Booking)'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setStatus((prev) => (prev === 'Active' ? 'Inactive' : 'Active'))}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                status === 'Active' ? 'bg-nexoraSuccess' : 'bg-slate-300'
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                  status === 'Active' ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* 10. Owner Recommended Highlight Card */}
          <div className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50/60 p-3.5">
            <div className="pr-2">
              <div className="flex items-center gap-1.5">
                <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                <span className="text-xs font-bold text-amber-950">Owner Recommended</span>
              </div>
              <span className="text-[11px] text-amber-900/80 mt-0.5 block">
                Featured as priority in chatbot recommendations & POS Upsell bar
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsOwnerRecommended(!isOwnerRecommended)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                isOwnerRecommended ? 'bg-amber-500' : 'bg-slate-300'
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                  isOwnerRecommended ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </form>

        {/* Footer Actions */}
        <div className="flex shrink-0 items-center justify-end gap-2.5 border-t border-nexoraBorder bg-nexoraSurfaceMuted/40 px-6 py-3.5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-nexoraBorder bg-white px-4 py-2 text-xs font-bold text-nexoraText hover:bg-nexoraSurfaceMuted transition min-h-[40px]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!isValid || isSubmitting}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-nexoraBrand hover:bg-nexoraBrandDark px-5 py-2 text-xs font-bold text-white shadow-md shadow-nexoraBrand/20 transition active:scale-95 disabled:opacity-50 min-h-[40px]"
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            <span>{isEditMode ? 'Save Changes' : 'Add Service'}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
