import { AlertCircle, ImagePlus, Loader2, RotateCcw, UploadCloud, X } from 'lucide-react'
import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { useCommunityMediaUrl, useCreateCommunityPost, useUploadCommunityPostMedia } from '../../data/hooks/useCommunity'
import type { CommunityDto, MediaAsset } from '../../data/repositories/community'
import { mapSupabaseError, type SupabaseDisplayError } from '../../lib/supabaseError'
import { useCommunityAuth } from './CommunityAuth'

const gradientClass = 'bg-gradient-to-br from-nexoraElectric to-nexoraViolet'
const MAX_IMAGE_DIMENSION = 2_048

async function compressImage(file: File): Promise<File> {
  if (file.type === 'image/gif' || typeof globalThis.createImageBitmap !== 'function') return file

  const source = await globalThis.createImageBitmap(file)
  const scale = Math.min(1, MAX_IMAGE_DIMENSION / Math.max(source.width, source.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(source.width * scale))
  canvas.height = Math.max(1, Math.round(source.height * scale))
  canvas.getContext('2d')?.drawImage(source, 0, 0, canvas.width, canvas.height)
  source.close()

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/webp', 0.84))
  if (!blob || blob.size >= file.size) return file
  const filename = `${file.name.replace(/\.[^.]*$/, '') || 'nail-photo'}.webp`
  return new File([blob], filename, { type: 'image/webp', lastModified: Date.now() })
}

export function CommunityPostMedia({ media, authorName }: { media: MediaAsset[]; authorName?: string | null }) {
  if (!media.length) return null
  return <div className="mt-1 space-y-1">{media.map((asset) => <CommunityPostImage key={`${asset.deliveryType}:${asset.path}`} asset={asset} alt={`Ảnh bài viết của ${authorName || 'thành viên Nexora'}`} />)}</div>
}

function CommunityPostImage({ asset, alt }: { asset: MediaAsset; alt: string }) {
  const media = useCommunityMediaUrl(asset)
  if (media.isLoading) return <div className="h-56 animate-pulse bg-nexoraSurfaceMuted" aria-label="Đang tải ảnh" />
  if (media.error) return <div className="flex min-h-24 items-center justify-center gap-2 bg-nexoraSurfaceMuted px-4 text-center text-xs font-semibold text-nexoraDanger" role="alert"><AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />Không tải được ảnh bài viết.</div>
  if (!media.data) return null
  return <img src={media.data} alt={alt} className="max-h-[560px] w-full bg-nexoraSurfaceMuted object-cover" onError={() => void media.refetch()} />
}

export function CommunityPostComposer({ community, onClose }: { community: CommunityDto; onClose: () => void }) {
  const { isAnonymous } = useCommunityAuth()
  const createPost = useCreateCommunityPost()
  const uploadMedia = useUploadCommunityPostMedia()
  const inputRef = useRef<HTMLInputElement>(null)
  const [body, setBody] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [postId, setPostId] = useState<string | null>(null)
  const [uploadedMedia, setUploadedMedia] = useState<MediaAsset | null>(null)
  const [phase, setPhase] = useState<'idle' | 'compressing' | 'uploading' | 'failed'>('idle')
  const [progress, setProgress] = useState(0)
  const [mediaError, setMediaError] = useState<SupabaseDisplayError | null>(null)

  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
  }, [previewUrl])

  const resetMedia = () => {
    setSelectedFile(null)
    setPreviewUrl(null)
    setPostId(null)
    setUploadedMedia(null)
    setPhase('idle')
    setProgress(0)
    setMediaError(null)
    uploadMedia.reset()
    if (inputRef.current) inputRef.current.value = ''
  }

  const selectFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    setSelectedFile(file)
    setPreviewUrl(URL.createObjectURL(file))
    setPostId(null)
    setUploadedMedia(null)
    setPhase('idle')
    setProgress(0)
    setMediaError(null)
    uploadMedia.reset()
  }

  const publish = async () => {
    if ((!body.trim() && !selectedFile) || createPost.isPending) return
    const nextPostId = selectedFile ? postId || globalThis.crypto.randomUUID() : undefined
    if (nextPostId) setPostId(nextPostId)

    let media = uploadedMedia ? [uploadedMedia] : []
    if (selectedFile && !uploadedMedia && nextPostId) {
      try {
        setMediaError(null)
        setPhase('compressing')
        setProgress(10)
        const compressedFile = await compressImage(selectedFile)
        setPhase('uploading')
        setProgress(30)
        uploadMedia.reset()
        const progressTimer = window.setInterval(() => setProgress((current) => Math.min(current + 5, 90)), 250)
        let asset: MediaAsset
        try {
          asset = await uploadMedia.mutateAsync({
            communityId: community.id,
            postId: nextPostId,
            visibility: community.visibility,
            file: compressedFile,
            onProgress: (nextProgress) => setProgress((current) => Math.max(current, Math.round(nextProgress * 100))),
          })
        } finally {
          window.clearInterval(progressTimer)
        }
        setUploadedMedia(asset)
        media = [asset]
        setProgress(100)
        setPhase('idle')
      } catch (error) {
        setMediaError(mapSupabaseError(error))
        setPhase('failed')
        return
      }
    }

    try {
      await createPost.mutateAsync({ id: nextPostId, communityId: community.id, body, media })
      setBody('')
      resetMedia()
      onClose()
    } catch {
      // The mapped mutation error is rendered below; keep uploaded media for retry.
    }
  }

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    void publish()
  }

  if (isAnonymous) return null
  const isUploading = phase === 'compressing' || phase === 'uploading'
  const disabled = (!body.trim() && !selectedFile) || isUploading || createPost.isPending
  const uploadError = mediaError || uploadMedia.error

  return (
    <form onSubmit={submit} className="overflow-hidden rounded-xl border border-nexoraBorder bg-nexoraSurface p-3 shadow-nexora-card">
      <label className="sr-only" htmlFor={`post-body-${community.id}`}>Nội dung bài viết</label>
      <textarea id={`post-body-${community.id}`} value={body} onChange={(event) => setBody(event.target.value)} maxLength={10_000} placeholder="Chia sẻ mẫu nail hoặc thông báo mới…" className="min-h-24 w-full resize-none rounded-xl border border-nexoraBorder bg-nexoraSurfaceMuted p-3 text-sm outline-none placeholder:text-nexoraSubtle focus:border-nexoraBrand" />

      {previewUrl ? <div className={`relative mt-3 overflow-hidden rounded-xl ${phase === 'failed' ? 'border-l-[3px] border-nexoraDanger' : ''}`}><img src={previewUrl} alt="Ảnh sẽ đăng" className="h-48 w-full object-cover" />{isUploading ? <><div className="absolute inset-0 bg-nexoraText/25" /><div className="absolute inset-x-3 bottom-3 h-2 overflow-hidden rounded-full border border-white/80 bg-white"><span className={`block h-full transition-[width] duration-200 ${gradientClass}`} style={{ width: `${progress}%` }} /></div></> : null}<button type="button" onClick={resetMedia} disabled={isUploading || createPost.isPending} className="absolute right-2 top-2 grid h-10 w-10 place-items-center rounded-full border border-nexoraBorder bg-white/95 text-nexoraMuted shadow-sm disabled:opacity-50" aria-label="Xóa ảnh đã chọn"><X className="h-4 w-4" aria-hidden="true" /></button></div> : <label className="mt-3 flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-nexoraBrand/50 bg-nexoraBrandSoft/45 px-3 text-sm font-bold text-nexoraBrand hover:bg-nexoraBrandSoft"><ImagePlus className="h-5 w-5" aria-hidden="true" />Thêm ảnh<input ref={inputRef} type="file" accept="image/*" onChange={selectFile} className="sr-only" /></label>}

      {isUploading ? <div className="mt-2 flex items-center justify-between text-xs text-nexoraMuted"><span className="inline-flex items-center gap-1.5"><UploadCloud className="h-4 w-4 text-nexoraBrand" aria-hidden="true" />{phase === 'compressing' ? 'Đang nén ảnh…' : 'Đang tải ảnh…'}</span><b>{progress}%</b></div> : null}
      {phase === 'failed' && uploadError ? <div className="mt-2 flex items-center justify-between gap-3 rounded-xl border-l-[3px] border-nexoraDanger bg-red-50 px-3 py-2 text-xs text-nexoraDanger" role="alert"><span className="inline-flex min-w-0 items-center gap-1.5"><AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />{uploadError.message}</span><button type="button" onClick={() => void publish()} className="inline-flex min-h-9 shrink-0 items-center gap-1 rounded-lg border border-nexoraDanger px-2 font-extrabold"><RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />Thử lại</button></div> : null}
      {createPost.error ? <p className="mt-2 text-xs font-semibold text-nexoraDanger" role="alert">{createPost.error.message}</p> : null}

      <div className="mt-3 flex justify-end gap-2"><button type="button" onClick={onClose} disabled={isUploading || createPost.isPending} className="min-h-11 rounded-xl px-3 text-sm font-bold text-nexoraMuted disabled:opacity-50">Hủy</button><button type="submit" disabled={disabled} className={`inline-flex min-h-11 items-center gap-2 rounded-xl px-4 text-sm font-extrabold text-white ${gradientClass} disabled:opacity-50`}>{isUploading || createPost.isPending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}{isUploading ? 'Đang tải…' : createPost.isPending ? 'Đang đăng…' : 'Đăng bài'}</button></div>
    </form>
  )
}
