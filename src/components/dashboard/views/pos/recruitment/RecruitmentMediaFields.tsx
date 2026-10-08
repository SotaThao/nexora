import { useEffect, useRef, useState } from 'react'
import { Camera, FolderOpen, Loader2, Plus, Trash2, Video } from 'lucide-react'
import { useTranslation } from '../../../../../contexts/LanguageContext'
import type { RecruitmentPostingContent } from '../../../../../types/posRecruitment'
import { normalizePostingVideoUrl, POSTING_INLINE_IMAGE_MAX, POSTING_VIDEO_MAX, readPostingImage } from './recruitmentPostingContent'

const TK = 'components.dashboard.views.pos.recruitment.composer.richContent'
const actionClass = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-nexoraBrandSoft px-3 text-xs font-bold text-nexoraBrand hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nexoraBrand disabled:opacity-40'
const removeClass = 'inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg text-rose-600 hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nexoraBrand disabled:opacity-40'

interface RecruitmentMediaFieldsProps {
  content: RecruitmentPostingContent
  disabled: boolean
  validationError?: string
  onChange: (content: RecruitmentPostingContent) => void
  onBusyChange: (busy: boolean) => void
}

export default function RecruitmentMediaFields({ content, disabled, validationError, onChange, onBusyChange }: RecruitmentMediaFieldsProps) {
  const { t } = useTranslation()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const contentRef = useRef(content)
  const disabledRef = useRef(disabled)
  const mounted = useRef(true)
  const busyRef = useRef(false)
  const coverCamera = useRef<HTMLInputElement>(null)
  const coverGallery = useRef<HTMLInputElement>(null)
  const imagesCamera = useRef<HTMLInputElement>(null)
  const imagesGallery = useRef<HTMLInputElement>(null)
  contentRef.current = content
  disabledRef.current = disabled
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; onBusyChange(false) } }, [onBusyChange])

  const selectImages = async (input: HTMLInputElement, cover: boolean) => {
    const files = Array.from(input.files ?? [])
    input.value = ''
    if (disabledRef.current || busyRef.current || files.length === 0) return
    if ((cover && files.length > 1) || (!cover && files.length + contentRef.current.images.length > POSTING_INLINE_IMAGE_MAX)) { setError(t(`${TK}.imageLimit`)); return }
    busyRef.current = true; setBusy(true); onBusyChange(true); setError('')
    try {
      // Validate the entire selection before replacing or appending any attachment.
      const images = await Promise.all(files.map(readPostingImage))
      if (!mounted.current || disabledRef.current) return
      const latest = contentRef.current
      if (!cover && latest.images.length + images.length > POSTING_INLINE_IMAGE_MAX) { setError(t(`${TK}.imageLimit`)); return }
      onChange(cover ? { ...latest, coverImage: images[0] } : { ...latest, images: [...latest.images, ...images] })
    } catch { if (mounted.current) setError(t(`${TK}.invalidImage`)) }
    finally { busyRef.current = false; if (mounted.current) { setBusy(false); onBusyChange(false) } }
  }

  const locked = disabled || busy
  const videoRows = content.videoUrls.length ? content.videoUrls : ['']
  const inputClass = 'min-h-11 min-w-0 flex-1 rounded-lg border border-nexoraBorder bg-white px-3 text-sm text-nexoraText outline-none focus:ring-2 focus:ring-nexoraBrandSoft disabled:bg-slate-100'
  return (
    <div id="recruitment-field-postingContent" tabIndex={-1} className="mt-6 space-y-5 outline-none focus-visible:ring-2 focus-visible:ring-nexoraBrand">
      <div className="space-y-5">
        {[{ cover: true, label: 'coverImage', camera: coverCamera, gallery: coverGallery }, { cover: false, label: 'inlineImages', camera: imagesCamera, gallery: imagesGallery }].map(({ cover, label, camera, gallery }) => (
          <fieldset key={label} className="min-w-0">
            <legend className="mb-2 text-xs font-bold text-nexoraText">{t(`${TK}.${label}`)}</legend>
            <div className="grid grid-cols-2 gap-3">
              <button type="button" disabled={locked || (!cover && content.images.length >= POSTING_INLINE_IMAGE_MAX)} onClick={() => camera.current?.click()} className={`${actionClass} min-h-28 flex-col border border-dashed border-nexoraLavender`}><Camera className="h-6 w-6" aria-hidden />{t(`${TK}.camera`)}</button>
              <button type="button" disabled={locked || (!cover && content.images.length >= POSTING_INLINE_IMAGE_MAX)} onClick={() => gallery.current?.click()} className={`${actionClass} min-h-28 flex-col border border-dashed border-nexoraLavender`}><FolderOpen className="h-6 w-6" aria-hidden />{t(`${TK}.gallery`)}</button>
            </div>
            <p className="mt-2 text-xs leading-5 text-nexoraMuted">{t(`${TK}.${cover ? 'coverHint' : 'imagesHint'}`)}</p>
            <input ref={camera} type="file" accept="image/jpeg,image/png,image/webp" capture="environment" disabled={locked} aria-label={t(`${TK}.${cover ? 'coverCamera' : 'imagesCamera'}`)} onChange={(event) => { void selectImages(event.currentTarget, cover) }} className="hidden" />
            <input ref={gallery} type="file" accept="image/jpeg,image/png,image/webp" multiple={!cover} disabled={locked} aria-label={t(`${TK}.${cover ? 'coverGallery' : 'imagesGallery'}`)} onChange={(event) => { void selectImages(event.currentTarget, cover) }} className="hidden" />
            {cover && content.coverImage ? <div className="mt-3"><img src={content.coverImage.url} alt={t(`${TK}.coverPreview`)} className="aspect-video w-full rounded-lg object-cover" /><div className="flex items-center justify-between gap-2"><p className="min-w-0 break-all text-xs text-nexoraMuted">{content.coverImage.name}</p><button type="button" disabled={locked} aria-label={t(`${TK}.removeCover`)} onClick={() => onChange({ ...content, coverImage: undefined })} className={removeClass}><Trash2 className="h-4 w-4" aria-hidden /></button></div></div> : null}
            {!cover && content.images.length > 0 ? <div className="mt-3 grid grid-cols-2 gap-2">{content.images.map((image, index) => <div key={`${index}-${image.name}`} className="min-w-0"><img src={image.url} alt={t(`${TK}.imagePreview`, { index: index + 1 })} className="aspect-square w-full rounded-lg object-cover" /><div className="flex items-center justify-between gap-1"><p className="min-w-0 break-all text-[10px] text-nexoraMuted">{image.name}</p><button type="button" disabled={locked} aria-label={t(`${TK}.removeImage`, { index: index + 1 })} onClick={() => onChange({ ...content, images: content.images.filter((_, item) => item !== index) })} className={removeClass}><Trash2 className="h-4 w-4" aria-hidden /></button></div></div>)}</div> : null}
          </fieldset>
        ))}
      </div>
      <fieldset className="min-w-0">
        <legend className="sr-only">{t(`${TK}.videos`)}</legend>
        <div className="mb-2 flex items-center justify-between gap-3"><p className="text-xs font-bold text-nexoraText">{t(`${TK}.videos`)}</p><button type="button" disabled={locked || videoRows.length >= POSTING_VIDEO_MAX} onClick={() => onChange({ ...content, videoUrls: [...videoRows, ''] })} className={actionClass}><Plus className="h-4 w-4" aria-hidden />{t(`${TK}.addVideo`)}</button></div>
        <div className="space-y-2">{videoRows.map((url, index) => {
          const previewUrl = normalizePostingVideoUrl(url)
          return <div key={index}><div className="flex items-center gap-2"><input type="url" disabled={locked} value={url} aria-label={t(`${TK}.videoUrl`, { index: index + 1 })} aria-invalid={Boolean(url.trim() && !previewUrl)} placeholder={t(`${TK}.videoPlaceholder`)} onChange={(event) => onChange({ ...content, videoUrls: videoRows.map((value, item) => item === index ? event.target.value : value) })} className={inputClass} /><button type="button" disabled={locked} aria-label={t(`${TK}.removeVideo`, { index: index + 1 })} onClick={() => onChange({ ...content, videoUrls: videoRows.filter((_, item) => item !== index) })} className={removeClass}><Trash2 className="h-4 w-4" aria-hidden /></button></div>{previewUrl ? <a href={previewUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 break-all text-xs font-bold text-nexoraBrand underline"><Video className="h-4 w-4 shrink-0" aria-hidden />{t(`${TK}.viewVideo`, { index: index + 1 })}</a> : null}</div>
        })}</div>
        <p className="mt-2 text-xs text-nexoraMuted">{t(`${TK}.videosHint`)}</p>
      </fieldset>
      {busy ? <p role="status" className="flex items-center gap-2 text-xs text-nexoraMuted"><Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden />{t(`${TK}.readingImages`)}</p> : null}
      {error || validationError ? <p role="alert" className="text-xs font-semibold text-rose-600">{error || validationError}</p> : null}
    </div>
  )
}
