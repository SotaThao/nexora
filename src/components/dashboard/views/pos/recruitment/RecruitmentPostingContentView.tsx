import { useMemo } from 'react'
import { Video } from 'lucide-react'
import { useTranslation } from '../../../../../contexts/LanguageContext'
import type { RecruitmentPostingContent } from '../../../../../types/posRecruitment'
import { normalizePostingContent, sanitizePostingHtml } from './recruitmentPostingContent'

const TK = 'components.dashboard.views.pos.recruitment.composer.richContent'

interface RecruitmentPostingContentViewProps {
  body: string
  postingContent?: RecruitmentPostingContent
  showCover?: boolean
}

export default function RecruitmentPostingContentView({ body, postingContent, showCover = true }: RecruitmentPostingContentViewProps) {
  const { t } = useTranslation()
  const html = useMemo(() => postingContent ? sanitizePostingHtml(postingContent.html) : '', [postingContent?.html])
  // Formatting edits keep the same media arrays; avoid revalidating raster strings on each keystroke.
  const media = useMemo(() => postingContent ? normalizePostingContent({ html: '', coverImage: postingContent.coverImage, images: postingContent.images, videoUrls: postingContent.videoUrls }) : undefined, [postingContent?.coverImage, postingContent?.images, postingContent?.videoUrls])
  return (
    <div className="min-w-0 space-y-4">
      {showCover && media?.coverImage ? <img src={media.coverImage.url} alt={t(`${TK}.coverPreview`)} className="max-h-80 w-full rounded-xl object-cover" /> : null}
      {html ? <div className="break-words text-sm font-medium leading-7 text-nexoraText [&_a]:break-all [&_a]:text-nexoraBrand [&_a]:underline [&_h1]:text-2xl [&_h1]:font-bold [&_h2]:text-xl [&_h2]:font-bold [&_h3]:text-lg [&_h3]:font-bold [&_ol]:list-decimal [&_ol]:pl-6 [&_ul]:list-disc [&_ul]:pl-6" dangerouslySetInnerHTML={{ __html: html }} /> : <p className="whitespace-pre-wrap break-words text-sm font-medium leading-7 text-nexoraMuted">{body}</p>}
      {media?.images.length ? <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{media.images.map((image, index) => <img key={`${index}-${image.name}`} src={image.url} alt={t(`${TK}.imagePreview`, { index: index + 1 })} loading="lazy" className="max-h-80 w-full rounded-lg object-contain" />)}</div> : null}
      {media?.videoUrls.length ? <div className="space-y-2">{media.videoUrls.map((url, index) => <a key={url} href={url} target="_blank" rel="noopener noreferrer" className="flex min-h-11 items-center gap-2 rounded-lg border border-nexoraBorder bg-nexoraSurfaceMuted px-3 py-2 text-sm font-bold text-nexoraBrand underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nexoraBrand"><Video className="h-5 w-5 shrink-0" aria-hidden />{t(`${TK}.viewVideo`, { index: index + 1 })}</a>)}</div> : null}
    </div>
  )
}
