// CreateEditPosServiceModal — POS > Services (US-017). Single modal reused for
// both create and edit: pass `service` to prefill fields in edit mode, omit it
// for create. Handles name/price/duration, multi-category checklist, a tag
// input with autocomplete sourced from the Business's PosTag catalog, an
// optional photo upload, and an Active/Inactive toggle.
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { ImagePlus, Loader2, X } from 'lucide-react'
import { useTranslation } from '../../../../../contexts/LanguageContext'
import IconButton from '../../../../ui/IconButton'
import type { PosCategoryApiDto, PosServiceApiDto, PosServiceStatus, PosTagApiDto } from '../../../../../types/repositories'
import type { PosServiceInput } from '../../../../../data/repositories/posServices'
import ServiceAddOnsSection from '../ServiceAddOnsSection'

export default function CreateEditPosServiceModal({
  open,
  onClose,
  onSubmit,
  isSubmitting,
  categories,
  tagSuggestions,
  service,
  services,
}: {
  open: boolean
  onClose: () => void
  onSubmit: (input: PosServiceInput) => void
  isSubmitting: boolean
  categories: PosCategoryApiDto[]
  tagSuggestions: PosTagApiDto[]
  service?: PosServiceApiDto | null
  // Every service of this business — the "copy add-ons from" source list.
  services: PosServiceApiDto[]
}) {
  const { t } = useTranslation()
  const isEditMode = Boolean(service)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [durationMinutes, setDurationMinutes] = useState('')
  const [description, setDescription] = useState('')
  const [categoryIds, setCategoryIds] = useState<Set<string>>(new Set())
  const [tags, setTags] = useState<string[]>([])
  const [tagDraft, setTagDraft] = useState('')
  const [status, setStatus] = useState<PosServiceStatus>('Active')
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setName(service?.name ?? '')
    setPrice(service ? String(service.price) : '')
    setDurationMinutes(service ? String(service.durationMinutes) : '')
    setDescription(service?.description ?? '')
    setCategoryIds(new Set(service?.categoryIds ?? []))
    setTags(service?.tags ?? [])
    setTagDraft('')
    setStatus(service?.status ?? 'Active')
    setPhotoFile(null)
    setPhotoPreviewUrl(service?.photoUrl ?? null)
  }, [open, service])

  useEffect(() => {
    if (!photoFile) return
    const url = URL.createObjectURL(photoFile)
    setPhotoPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [photoFile])

  if (!open) return null

  const toggleCategory = (categoryId: string) => {
    setCategoryIds((prev) => {
      const next = new Set(prev)
      if (next.has(categoryId)) next.delete(categoryId)
      else next.add(categoryId)
      return next
    })
  }

  const addTag = (rawValue: string) => {
    const trimmed = rawValue.trim()
    if (!trimmed) return
    if (tags.some((existing) => existing.toLowerCase() === trimmed.toLowerCase())) {
      setTagDraft('')
      return
    }
    setTags((prev) => [...prev, trimmed])
    setTagDraft('')
  }

  const removeTag = (tag: string) => {
    setTags((prev) => prev.filter((t) => t !== tag))
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const trimmedName = name.trim()
    const priceValue = Number(price)
    const durationValue = Number(durationMinutes)
    if (!trimmedName || !Number.isFinite(priceValue) || priceValue < 0 || !(durationValue > 0)) return

    onSubmit({
      name: trimmedName,
      price: priceValue,
      durationMinutes: durationValue,
      description: description.trim() || undefined,
      categoryIds: Array.from(categoryIds),
      tags,
      status,
      photo: photoFile,
    })
  }

  const isValid =
    name.trim().length > 0 &&
    price.trim().length > 0 &&
    Number(price) >= 0 &&
    Number(durationMinutes) > 0

  const availableSuggestions = tagSuggestions.filter(
    (suggestion) => !tags.some((t) => t.toLowerCase() === suggestion.name.toLowerCase()),
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-nexoraText/70 p-4 backdrop-blur-sm">
      <div className="nexora-modal-card max-w-lg">
        <div className="mb-4 flex shrink-0 items-center justify-between">
          <h2 className="text-sm font-extrabold text-nexoraText">
            {isEditMode
              ? t('components.dashboard.views.pos.PosServicesView.editServiceModalTitle')
              : t('components.dashboard.views.pos.PosServicesView.addServiceModalTitle')}
          </h2>
          <IconButton label={t('components.dashboard.views.pos.PosServicesView.cancel')} onClick={onClose}>
            <X className="h-4 w-4" />
          </IconButton>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 space-y-4 overflow-y-auto">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-dashed border-nexoraBorder bg-nexoraCanvas text-slate-400 hover:border-nexoraBrand hover:text-nexoraBrand"
            >
              {photoPreviewUrl ? (
                <img src={photoPreviewUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <ImagePlus className="h-5 w-5" />
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)}
            />
            <span className="text-[11px] text-nexoraMuted">
              {t('components.dashboard.views.pos.PosServicesView.photoHint')}
            </span>
          </div>

          <div>
            <input
              type="text"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={200}
              placeholder={t('components.dashboard.views.pos.PosServicesView.namePlaceholder')}
              className="h-10 w-full rounded-lg border border-nexoraBorder bg-nexoraCanvas px-3.5 text-xs text-nexoraText outline-none focus:border-nexoraBrand focus:bg-white"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-nexoraMuted">
                {t('components.dashboard.views.pos.PosServicesView.priceLabel')}
              </label>
              <input
                type="number"
                min={0}
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
                className="h-10 w-full rounded-lg border border-nexoraBorder bg-nexoraCanvas px-3.5 text-xs text-nexoraText outline-none focus:border-nexoraBrand focus:bg-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-nexoraMuted">
                {t('components.dashboard.views.pos.PosServicesView.durationLabel')}
              </label>
              <input
                type="number"
                min={1}
                step="1"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
                placeholder="30"
                className="h-10 w-full rounded-lg border border-nexoraBorder bg-nexoraCanvas px-3.5 text-xs text-nexoraText outline-none focus:border-nexoraBrand focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-nexoraMuted">
              {t('components.dashboard.views.pos.PosServicesView.descriptionLabel')}
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={1000}
              rows={2}
              placeholder={t('components.dashboard.views.pos.PosServicesView.descriptionPlaceholder')}
              className="w-full rounded-lg border border-nexoraBorder bg-nexoraCanvas px-3.5 py-2 text-xs text-nexoraText outline-none focus:border-nexoraBrand focus:bg-white"
            />
          </div>

          {categories.length > 0 && (
            <div>
              <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wide text-nexoraMuted">
                {t('components.dashboard.views.pos.PosServicesView.categoriesLabel')}
              </label>
              <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                {categories.map((category) => (
                  <label
                    key={category.id}
                    className="flex items-center gap-2 text-xs font-semibold text-nexoraText"
                  >
                    <input
                      type="checkbox"
                      checked={categoryIds.has(category.id)}
                      onChange={() => toggleCategory(category.id)}
                      className="h-4 w-4 rounded border-nexoraBorder"
                    />
                    {category.name}
                  </label>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wide text-nexoraMuted">
              {t('components.dashboard.views.pos.PosServicesView.tagsLabel')}
            </label>
            {tags.length > 0 && (
              <div className="mb-1.5 flex flex-wrap gap-1.5">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 rounded-full bg-nexoraCanvas px-2.5 py-1 text-[10px] font-bold text-nexoraText"
                  >
                    {tag}
                    <button type="button" onClick={() => removeTag(tag)} className="text-slate-400 hover:text-rose-600">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <input
              type="text"
              list="pos-service-tag-suggestions"
              value={tagDraft}
              onChange={(e) => setTagDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addTag(tagDraft)
                }
              }}
              maxLength={50}
              placeholder={t('components.dashboard.views.pos.PosServicesView.tagsPlaceholder')}
              className="h-9 w-full rounded-lg border border-nexoraBorder bg-nexoraCanvas px-3 text-xs text-nexoraText outline-none focus:border-nexoraBrand focus:bg-white"
            />
            <datalist id="pos-service-tag-suggestions">
              {availableSuggestions.map((suggestion) => (
                <option key={suggestion.id} value={suggestion.name} />
              ))}
            </datalist>
          </div>

          <label className="flex items-center gap-2 text-xs font-semibold text-nexoraText">
            <input
              type="checkbox"
              checked={status === 'Active'}
              onChange={(e) => setStatus(e.target.checked ? 'Active' : 'Inactive')}
              className="h-4 w-4 rounded border-nexoraBorder"
            />
            {t('components.dashboard.views.pos.PosServicesView.activeLabel')}
          </label>

          {/* Edit mode only: an add-on needs a saved service to hang off, and each row here persists
              on its own endpoint rather than through this form's Save. */}
          {isEditMode && service ? (
            <ServiceAddOnsSection serviceId={service.id} services={services} />
          ) : null}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded px-3 py-1.5 text-[10px] font-bold text-slate-500 hover:bg-slate-50"
            >
              {t('components.dashboard.views.pos.PosServicesView.cancel')}
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !isValid}
              className="inline-flex items-center gap-1.5 rounded bg-nexoraBrand px-4 py-1.5 text-[10px] font-bold text-white hover:bg-nexoraBrandDark disabled:opacity-60"
            >
              {isSubmitting && <Loader2 className="h-3 w-3 animate-spin" />}
              {t('components.dashboard.views.pos.PosServicesView.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
