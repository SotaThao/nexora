import { useEffect, useMemo, useState, type KeyboardEvent, type ReactNode } from 'react'
import DOMPurify from 'dompurify'
import {
  CalendarDays,
  ExternalLink,
  FileText,
  HandCoins,
  Inbox,
  Info,
  Loader2,
  Newspaper,
  Play,
  Video,
  X,
  type LucideIcon,
} from 'lucide-react'

import { useTranslation } from '../../../contexts/LanguageContext'
import IconButton from '../../ui/IconButton'
import type { ReceiptVaultItem } from '../../../data/repositories/taxiqReceipts'

type TabId = 'news' | 'event-zoom-schedule' | 'compensation-plan'
type LoadStatus = 'loading' | 'ready' | 'error'

interface NewsLibraryItem {
  title?: string
  description?: string
  url?: string
  link?: string
  image?: string
  alt?: string
  badge?: string
  duration?: string
  timeAgo?: string
  views?: string
  meta?: string
  day?: string
  date?: string
  time?: string
  type?: string
  primaryAction?: string
  secondaryAction?: string
  htmlContent?: string
}

interface NewsLibraryContent {
  featuredVideos: NewsLibraryItem[]
  channelVideos: NewsLibraryItem[]
  planTopics: NewsLibraryItem[]
  morePlanVideos: NewsLibraryItem[]
  featuredContent: NewsLibraryItem | null
  solutionPresentations: NewsLibraryItem[]
  trainingVideos: NewsLibraryItem[]
  upcomingSessions: NewsLibraryItem[]
  upcomingEvents: NewsLibraryItem[]
  recentSessions: NewsLibraryItem[]
  videoZoomHistory: NewsLibraryItem[]
}

type SweetAlertGlobal = {
  fire: (options: Record<string, unknown>) => unknown
}

type OpenPdfPreview = (item: NewsLibraryItem, url: string) => void
type OpenVideoPreview = (item: NewsLibraryItem, url: string) => void
type PdfPreviewState = {
  receipt: ReceiptVaultItem
  title: string
}

declare global {
  interface Window {
    Swal?: SweetAlertGlobal
  }
}

const NEWS_LIBRARY_FILE = {
  vi: 'https://raw.githubusercontent.com/vlink-group/VlinkPay/main/news-library/nexora-news-library-data-vi.json',
  en: 'https://raw.githubusercontent.com/vlink-group/VlinkPay/main/news-library/nexora-news-library-data.json',
}

const SWEETALERT_SCRIPT_URL = 'https://cdn.jsdelivr.net/npm/sweetalert2@11'

const EMPTY_CONTENT: NewsLibraryContent = {
  featuredVideos: [],
  channelVideos: [],
  planTopics: [],
  morePlanVideos: [],
  featuredContent: null,
  solutionPresentations: [],
  trainingVideos: [],
  upcomingSessions: [],
  upcomingEvents: [],
  recentSessions: [],
  videoZoomHistory: [],
}

const TABS: Array<{ id: TabId; label: string; Icon: LucideIcon }> = [
  { id: 'news', label: 'News', Icon: Newspaper },
  { id: 'event-zoom-schedule', label: 'Event & Zoom Schedule', Icon: CalendarDays },
  { id: 'compensation-plan', label: 'Compensation Plan', Icon: HandCoins },
]

function isTabId(value: string | null): value is TabId {
  return TABS.some((tab) => tab.id === value)
}

function initialTab(): TabId {
  if (typeof window === 'undefined') return 'news'
  const queryTab = new URLSearchParams(window.location.search).get('tab')
  return isTabId(queryTab) ? queryTab : 'news'
}

function normalizeItems(value: unknown): NewsLibraryItem[] {
  return Array.isArray(value) ? value.filter((item) => item && typeof item === 'object') : []
}

function normalizeContent(value: unknown): NewsLibraryContent {
  const source = value && typeof value === 'object' ? (value as Record<string, unknown>) : {}
  return {
    featuredVideos: normalizeItems(source.featuredVideos),
    channelVideos: normalizeItems(source.channelVideos),
    planTopics: normalizeItems(source.planTopics),
    morePlanVideos: normalizeItems(source.morePlanVideos),
    featuredContent:
      source.featuredContent && typeof source.featuredContent === 'object'
        ? (source.featuredContent as NewsLibraryItem)
        : null,
    solutionPresentations: normalizeItems(source.solutionPresentations),
    trainingVideos: normalizeItems(source.trainingVideos),
    upcomingSessions: normalizeItems(source.upcomingSessions),
    upcomingEvents: normalizeItems(source.upcomingEvents),
    recentSessions: normalizeItems(source.recentSessions),
    videoZoomHistory: normalizeItems(source.videoZoomHistory),
  }
}

function textValue(value: unknown): string {
  if (typeof value === 'string' || typeof value === 'number') return String(value)
  return ''
}

function safeExternalUrl(value: unknown): string {
  if (typeof value !== 'string' || !value.trim()) return ''
  try {
    const parsed = new URL(value, typeof window === 'undefined' ? 'https://example.com' : window.location.href)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:' ? parsed.toString() : ''
  } catch {
    return ''
  }
}

function isPdfUrl(url: string): boolean {
  try {
    return new URL(url).pathname.toLowerCase().endsWith('.pdf')
  } catch {
    return /\.pdf(?:$|\?)/i.test(url)
  }
}

function toYoutubeEmbedUrl(url: string): string {
  try {
    const parsed = new URL(url)
    const host = parsed.hostname.replace(/^www\./i, '').toLowerCase()
    let videoId = ''

    if (host === 'youtu.be') {
      videoId = parsed.pathname.split('/').filter(Boolean)[0] || ''
    } else if (host === 'youtube.com' || host === 'm.youtube.com') {
      if (parsed.pathname === '/watch') {
        videoId = parsed.searchParams.get('v') || ''
      } else if (parsed.pathname.startsWith('/embed/')) {
        videoId = parsed.pathname.split('/embed/')[1]?.split('/')[0] || ''
      } else if (parsed.pathname.startsWith('/shorts/')) {
        videoId = parsed.pathname.split('/shorts/')[1]?.split('/')[0] || ''
      }
    }

    return videoId ? `https://www.youtube.com/embed/${encodeURIComponent(videoId)}?autoplay=1&rel=0` : ''
  } catch {
    return ''
  }
}

function escapeHtml(value: unknown): string {
  return String(value == null ? '' : value).replace(/[&<>"']/g, (char) => {
    const replacements: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    }
    return replacements[char] || char
  })
}

function fileNameFromPdfUrl(url: string, fallbackTitle?: string): string {
  try {
    const pathname = new URL(url).pathname
    const fileName = decodeURIComponent(pathname.split('/').filter(Boolean).pop() || '')
    if (fileName.toLowerCase().endsWith('.pdf')) return fileName
  } catch {
    // Fall through to title fallback.
  }

  const title = textValue(fallbackTitle).trim()
  return title.toLowerCase().endsWith('.pdf')
    ? title
    : `${title || 'news-library-document'}.pdf`
}

function buildPdfPreviewReceipt(item: NewsLibraryItem, url: string): ReceiptVaultItem {
  return {
    id: `news-library-${url}`,
    fileName: fileNameFromPdfUrl(url, item.title),
    url,
    qualityStatus: 'Valid',
    isDuplicate: false,
    duplicateResolution: null,
    aiExtractedVendor: null,
    aiExtractedDate: null,
    aiExtractedAmount: null,
    aiExtractedCategory: null,
    linkedEntityType: 'Standalone',
    deductionRecordId: null,
    payoutRecordId: null,
    selfReportedIncomeId: null,
    createdAt: '',
  }
}

function isVideoUrl(url: string): boolean {
  return !!toYoutubeEmbedUrl(url)
}

function actionLabel(url: string): string {
  if (isPdfUrl(url)) return 'Open PDF'
  if (isVideoUrl(url)) return 'Watch'
  return 'Open'
}

function ActionIcon({ url, className = 'h-4 w-4' }: { url: string; className?: string }) {
  if (isPdfUrl(url)) return <FileText className={className} aria-hidden />
  if (isVideoUrl(url)) return <Play className={className} aria-hidden />
  return <ExternalLink className={className} aria-hidden />
}

function updateTabInUrl(tabId: TabId) {
  if (typeof window === 'undefined' || !window.history?.replaceState) return
  const url = new URL(window.location.href)
  url.searchParams.set('tab', tabId)
  window.history.replaceState(null, '', url.toString())
}

function loadSweetAlert(): Promise<SweetAlertGlobal | null> {
  if (typeof window === 'undefined') return Promise.resolve(null)
  if (window.Swal?.fire) return Promise.resolve(window.Swal)

  const existingScript = document.querySelector<HTMLScriptElement>(
    `script[src="${SWEETALERT_SCRIPT_URL}"]`,
  )

  if (existingScript) {
    return new Promise((resolve) => {
      existingScript.addEventListener('load', () => resolve(window.Swal || null), { once: true })
      existingScript.addEventListener('error', () => resolve(null), { once: true })
    })
  }

  return new Promise((resolve) => {
    const script = document.createElement('script')
    script.src = SWEETALERT_SCRIPT_URL
    script.async = true
    script.onload = () => resolve(window.Swal || null)
    script.onerror = () => resolve(null)
    document.head.appendChild(script)
  })
}

async function openSweetAlertDetails(title: string, htmlContent: string) {
  if (!htmlContent) return

  const swal = await loadSweetAlert()
  if (!swal?.fire) return

  swal.fire({
    title: title || 'Details',
    html: `<div class="news-library-swal-content">${DOMPurify.sanitize(htmlContent)}</div>`,
    width: 860,
    showConfirmButton: false,
    showCloseButton: true,
    padding: '1rem',
    customClass: {
      popup: 'news-library-swal-popup news-library-swal-popup-content',
      closeButton: 'news-library-swal-close',
      title: 'news-library-swal-title',
      htmlContainer: 'news-library-swal-html news-library-swal-html-content',
      confirmButton: 'news-library-swal-confirm',
    },
  })
}

async function openSweetAlertFrame(title: string, src: string, frameClass: string) {
  if (!src) return false

  const swal = await loadSweetAlert()
  if (!swal?.fire) return false

  const isDocument = frameClass === 'is-document'
  const modalTitle = title || 'Preview'

  swal.fire({
    title: modalTitle,
    html: `<div class="news-library-swal-frame ${escapeHtml(frameClass)}"><iframe src="${escapeHtml(src)}" title="${escapeHtml(modalTitle)}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe></div>`,
    width: 960,
    showConfirmButton: false,
    showCloseButton: true,
    padding: '1rem',
    customClass: {
      popup: `news-library-swal-popup ${isDocument ? 'news-library-swal-popup-document' : 'news-library-swal-popup-video'}`,
      closeButton: 'news-library-swal-close',
      title: 'news-library-swal-title',
      htmlContainer: 'news-library-swal-html',
      confirmButton: 'news-library-swal-confirm',
    },
  })

  return true
}

function NewsLibraryPdfPreviewModal({
  receipt,
  title,
  onClose,
}: {
  receipt: ReceiptVaultItem
  title: string
  onClose: () => void
}) {
  const { t } = useTranslation()
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState('')
  const previewTitle = title.trim() || receipt.fileName

  useEffect(() => {
    let objectUrl = ''
    const controller = new AbortController()

    setPdfPreviewUrl('')

    async function loadPdfPreview() {
      try {
        if (typeof fetch !== 'function' || typeof URL.createObjectURL !== 'function') {
          throw new Error('PDF blob preview is not available.')
        }

        const response = await fetch(receipt.url, { signal: controller.signal })
        if (!response.ok) throw new Error('Unable to load PDF preview.')

        const blob = await response.blob()
        if (controller.signal.aborted) return

        const pdfBlob = blob.type === 'application/pdf'
          ? blob
          : new Blob([blob], { type: 'application/pdf' })
        objectUrl = URL.createObjectURL(pdfBlob)
        setPdfPreviewUrl(objectUrl)
      } catch {
        if (!controller.signal.aborted) {
          setPdfPreviewUrl(receipt.url)
        }
      }
    }

    void loadPdfPreview()

    return () => {
      controller.abort()
      if (objectUrl && typeof URL.revokeObjectURL === 'function') {
        URL.revokeObjectURL(objectUrl)
      }
    }
  }, [receipt.url])

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-nexoraText/70 p-4 backdrop-blur-sm">
      <div className="nexora-modal-card h-[90vh] max-w-5xl">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="truncate text-sm font-extrabold text-nexoraText">{previewTitle}</h2>
          <IconButton label={t('common.cancel')} onClick={onClose}>
            <X className="h-4 w-4" />
          </IconButton>
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-3">
          {pdfPreviewUrl ? (
            <iframe
              src={pdfPreviewUrl}
              title={receipt.fileName}
              className="min-h-[60vh] flex-1 rounded-xl border border-nexoraBorder bg-white"
            />
          ) : (
            <div className="grid min-h-[60vh] flex-1 place-items-center rounded-xl border border-nexoraBorder bg-nexoraCanvas text-nexoraMuted">
              <Loader2 className="h-6 w-6 animate-spin" aria-hidden />
            </div>
          )}
          <a
            href={receipt.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-1.5 self-start rounded-lg bg-nexoraBrand px-4 py-2 text-xs font-bold text-white"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            {t('taxiq.receiptVault.previewModal.openPdf')}
          </a>
        </div>
      </div>
    </div>
  )
}

function LibraryShell({ children }: { children: ReactNode }) {
  return (
    <article className="overflow-hidden rounded-lg border border-nexoraBorder bg-nexoraSurface shadow-nexora-card">
      <div className="p-4 sm:p-5">{children}</div>
    </article>
  )
}

function LibraryState({ status, label }: { status: LoadStatus; label: string }) {
  if (status === 'loading') {
    return (
      <div className="grid min-h-44 place-items-center rounded-lg border border-dashed border-nexoraBorder bg-nexoraCanvas p-6 text-center text-sm font-bold text-nexoraMuted">
        Loading News Library...
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="grid min-h-44 place-items-center rounded-lg border border-dashed border-nexoraDanger bg-nexoraSurfaceMuted p-6 text-center text-sm font-bold text-nexoraDanger">
        Unable to load News Library content. Please check the network connection and refresh.
      </div>
    )
  }

  return <EmptyState label={label} />
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="grid min-h-72 place-items-center rounded-lg border border-dashed border-nexoraBorder bg-nexoraCanvas p-7 text-center">
      <div>
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-lg bg-nexoraBrandSoft text-nexoraBrand">
          <Inbox className="h-5 w-5" aria-hidden />
        </span>
        <p className="mt-3 text-base font-black leading-snug text-nexoraText">
          No {label} yet
        </p>
      </div>
    </div>
  )
}

function LibraryBlock({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-base font-black leading-snug text-nexoraText">{title}</h2>
      {children}
    </section>
  )
}

function ImageFrame({
  item,
  className,
  Icon = Video,
}: {
  item: NewsLibraryItem
  className: string
  Icon?: LucideIcon
}) {
  const src = safeExternalUrl(item.image)

  return (
    <div className={className}>
      {src ? (
        <img
          src={src}
          alt={textValue(item.alt || item.title)}
          className="h-full w-full object-cover"
          loading="lazy"
        />
      ) : (
        <div className="grid h-full w-full place-items-center bg-nexoraSurfaceMuted text-nexoraBrand">
          <Icon className="h-6 w-6" aria-hidden />
        </div>
      )}
    </div>
  )
}

function MetaLine({ parts }: { parts: Array<string | undefined> }) {
  const items = parts.filter(Boolean)
  if (!items.length) return null

  return (
    <div className="mb-1 flex flex-wrap items-center gap-1.5 text-xs font-extrabold leading-4 text-nexoraBrand">
      {items.map((part) => (
        <span key={part}>{part}</span>
      ))}
    </div>
  )
}

function ActionPill({ url, primary = false, children }: { url: string; primary?: boolean; children?: ReactNode }) {
  return (
    <span
      className={[
        'inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg px-3 text-xs font-black no-underline',
        primary
          ? 'bg-nexoraBrand text-white'
          : 'border border-nexoraBrandSoft bg-nexoraCanvas text-nexoraBrand',
      ].join(' ')}
    >
      <ActionIcon url={url} />
      {children || actionLabel(url)}
    </span>
  )
}

function CardLink({
  item,
  className,
  children,
  onPdfPreview,
  onVideoPreview,
}: {
  item: NewsLibraryItem
  className: string
  children: ReactNode
  onPdfPreview?: OpenPdfPreview
  onVideoPreview?: OpenVideoPreview
}) {
  const url = safeExternalUrl(item.url || item.link)
  const youtubeEmbedUrl = url ? toYoutubeEmbedUrl(url) : ''
  const baseClass =
    'min-w-0 rounded-lg border border-nexoraRule bg-nexoraSurface text-inherit no-underline transition hover:border-nexoraLavender hover:bg-nexoraCanvas hover:shadow-nexora-soft'

  if (!url) {
    return <div className={`${baseClass} ${className}`}>{children}</div>
  }

  if (isPdfUrl(url) && onPdfPreview) {
    return (
      <button
        type="button"
        onClick={() => onPdfPreview(item, url)}
        className={`${baseClass} ${className} text-left`}
      >
        {children}
      </button>
    )
  }

  if (youtubeEmbedUrl && onVideoPreview) {
    return (
      <button
        type="button"
        onClick={() => onVideoPreview(item, url)}
        className={`${baseClass} ${className} text-left`}
      >
        {children}
      </button>
    )
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`${baseClass} ${className}`}
    >
      {children}
    </a>
  )
}

function VideoCard({
  item,
  onPdfPreview,
  onVideoPreview,
}: {
  item: NewsLibraryItem
  onPdfPreview: OpenPdfPreview
  onVideoPreview: OpenVideoPreview
}) {
  const url = safeExternalUrl(item.url)
  return (
    <CardLink
      item={item}
      className="block overflow-hidden"
      onPdfPreview={onPdfPreview}
      onVideoPreview={onVideoPreview}
    >
      <ImageFrame item={item} className="aspect-video overflow-hidden bg-nexoraSurfaceMuted" />
      <div className="space-y-2 p-3.5">
        <MetaLine parts={[item.badge, item.duration, item.timeAgo, item.views]} />
        <h3 className="text-sm font-black leading-snug text-nexoraText">{textValue(item.title)}</h3>
        {item.description && (
          <p className="text-xs font-medium leading-relaxed text-nexoraMuted">
            {item.description}
          </p>
        )}
        {url && <ActionPill url={url} />}
      </div>
    </CardLink>
  )
}

function InlineMediaCard({
  item,
  onPdfPreview,
  onVideoPreview,
}: {
  item: NewsLibraryItem
  onPdfPreview: OpenPdfPreview
  onVideoPreview: OpenVideoPreview
}) {
  const url = safeExternalUrl(item.url)
  return (
    <CardLink
      item={item}
      className="grid gap-3 p-3 sm:grid-cols-[7rem_minmax(0,1fr)_auto] sm:items-center"
      onPdfPreview={onPdfPreview}
      onVideoPreview={onVideoPreview}
    >
      <ImageFrame
        item={item}
        className="aspect-video overflow-hidden rounded-lg bg-nexoraSurfaceMuted sm:h-18 sm:w-28"
      />
      <div>
        <MetaLine parts={[item.duration, item.timeAgo, item.views]} />
        <h3 className="text-sm font-black leading-snug text-nexoraText">{textValue(item.title)}</h3>
        {item.description && (
          <p className="mt-1 text-xs font-medium leading-relaxed text-nexoraMuted">
            {item.description}
          </p>
        )}
      </div>
      {url && <ActionPill url={url} />}
    </CardLink>
  )
}

function TopicCard({
  item,
  onPdfPreview,
  onVideoPreview,
}: {
  item: NewsLibraryItem
  onPdfPreview: OpenPdfPreview
  onVideoPreview: OpenVideoPreview
}) {
  const url = safeExternalUrl(item.url)
  return (
    <CardLink
      item={item}
      className="grid grid-cols-[2.375rem_minmax(0,1fr)] gap-3 p-3.5"
      onPdfPreview={onPdfPreview}
      onVideoPreview={onVideoPreview}
    >
      <span className="grid h-9 w-9 place-items-center rounded-lg bg-nexoraBrandSoft text-nexoraBrand">
        <ActionIcon url={url} />
      </span>
      <div>
        <h3 className="text-sm font-black leading-snug text-nexoraText">{textValue(item.title)}</h3>
        {item.description && (
          <p className="mt-1 text-xs font-medium leading-relaxed text-nexoraMuted">
            {item.description}
          </p>
        )}
      </div>
    </CardLink>
  )
}

function EventCard({
  item,
  onDetails,
}: {
  item: NewsLibraryItem
  onDetails: (title: string, html: string) => void
}) {
  const url = safeExternalUrl(item.link || item.url)
  const hasDetails = !!item.htmlContent

  return (
    <div className="grid gap-3 rounded-lg border border-nexoraRule bg-nexoraSurface p-3 transition hover:border-nexoraLavender hover:bg-nexoraCanvas hover:shadow-nexora-soft sm:grid-cols-[4.75rem_minmax(0,1fr)_auto] sm:items-center">
      <span className="grid h-14 w-20 place-items-center rounded-lg bg-nexoraBrandSoft text-center">
        <span>
          <span className="block text-xs font-black uppercase leading-none text-nexoraBrand">
            {textValue(item.day)}
          </span>
          <strong className="mt-1 block text-sm font-black leading-none text-nexoraText">
            {textValue(item.date)}
          </strong>
        </span>
      </span>
      <div>
        <MetaLine parts={[item.time, item.type]} />
        <h3 className="text-sm font-black leading-snug text-nexoraText">{textValue(item.title)}</h3>
        {item.description && (
          <p className="mt-1 text-xs font-medium leading-relaxed text-nexoraMuted">
            {item.description}
          </p>
        )}
      </div>
      {(url || hasDetails) && (
        <div className="flex flex-wrap gap-2 sm:justify-end">
          {url && (
            <a href={url} target="_blank" rel="noopener noreferrer" className="no-underline">
              <ActionPill url={url} primary>
                {item.primaryAction || 'Join'}
              </ActionPill>
            </a>
          )}
          {hasDetails && (
            <button
              type="button"
              onClick={() => onDetails(textValue(item.title) || 'Details', item.htmlContent || '')}
              className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg border border-nexoraBrandSoft bg-nexoraCanvas px-3 text-xs font-black text-nexoraBrand"
            >
              <Info className="h-4 w-4" aria-hidden />
              {item.secondaryAction || 'Details'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function NewsPanel({
  status,
  content,
  onPdfPreview,
  onVideoPreview,
}: {
  status: LoadStatus
  content: NewsLibraryContent
  onPdfPreview: OpenPdfPreview
  onVideoPreview: OpenVideoPreview
}) {
  if (status !== 'ready') return <LibraryState status={status} label="news content" />

  const hasContent = content.featuredVideos.length > 0 || content.channelVideos.length > 0
  if (!hasContent) return <EmptyState label="news content" />

  return (
    <div className="space-y-6">
      {content.featuredVideos.length > 0 && (
        <LibraryBlock title="Featured videos">
          <div className="grid gap-3 md:grid-cols-2">
            {content.featuredVideos.map((item, index) => (
              <VideoCard
                key={`${item.title}-${index}`}
                item={item}
                onPdfPreview={onPdfPreview}
                onVideoPreview={onVideoPreview}
              />
            ))}
          </div>
        </LibraryBlock>
      )}
      {content.channelVideos.length > 0 && (
        <LibraryBlock title="More from channel">
          <div className="grid gap-2.5">
            {content.channelVideos.map((item, index) => (
              <InlineMediaCard
                key={`${item.title}-${index}`}
                item={item}
                onPdfPreview={onPdfPreview}
                onVideoPreview={onVideoPreview}
              />
            ))}
          </div>
        </LibraryBlock>
      )}
    </div>
  )
}

function CompensationPanel({
  status,
  content,
  onPdfPreview,
  onVideoPreview,
}: {
  status: LoadStatus
  content: NewsLibraryContent
  onPdfPreview: OpenPdfPreview
  onVideoPreview: OpenVideoPreview
}) {
  if (status !== 'ready') return <LibraryState status={status} label="compensation plan content" />
  if (!content.planTopics.length) return <EmptyState label="compensation plan content" />

  return (
    <LibraryBlock title="Core topics">
      <div className="grid gap-3 md:grid-cols-2">
        {content.planTopics.map((item, index) => (
          <TopicCard
            key={`${item.title}-${index}`}
            item={item}
            onPdfPreview={onPdfPreview}
            onVideoPreview={onVideoPreview}
          />
        ))}
      </div>
    </LibraryBlock>
  )
}

function EventZoomPanel({
  status,
  content,
  onDetails,
}: {
  status: LoadStatus
  content: NewsLibraryContent
  onDetails: (title: string, html: string) => void
}) {
  if (status !== 'ready') return <LibraryState status={status} label="event content" />

  const events = [...content.upcomingSessions, ...content.upcomingEvents]
  if (!events.length) return <EmptyState label="event content" />

  return (
    <LibraryBlock title="Upcoming Zoom sessions">
      <div className="grid gap-2.5">
        {events.map((item, index) => (
          <EventCard
            key={`${item.title}-${item.date}-${index}`}
            item={item}
            onDetails={onDetails}
          />
        ))}
      </div>
    </LibraryBlock>
  )
}

export default function NewsLibraryView() {
  const { currentLanguage } = useTranslation()
  const [activeTab, setActiveTab] = useState<TabId>(() => initialTab())
  const [status, setStatus] = useState<LoadStatus>('loading')
  const [content, setContent] = useState<NewsLibraryContent>(EMPTY_CONTENT)
  const [previewingPdf, setPreviewingPdf] = useState<PdfPreviewState | null>(null)

  useEffect(() => {
    const previousTitle = document.title
    document.title = 'NEXORA TOUCH - News & Library'
    return () => {
      document.title = previousTitle
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    const controller = new AbortController()

    async function fetchContent(url: string) {
      const response = await fetch(url, { cache: 'no-store', signal: controller.signal })
      if (!response.ok) throw new Error(`Failed to fetch news library content: ${response.status}`)
      return response.json()
    }

    async function loadContent() {
      if (typeof fetch !== 'function') {
        setStatus('error')
        return
      }

      setStatus('loading')
      const primaryUrl = currentLanguage === 'vi' ? NEWS_LIBRARY_FILE.vi : NEWS_LIBRARY_FILE.en

      try {
        let nextContent: unknown
        try {
          nextContent = await fetchContent(primaryUrl)
        } catch (error) {
          if (primaryUrl === NEWS_LIBRARY_FILE.en) throw error
          nextContent = await fetchContent(NEWS_LIBRARY_FILE.en)
        }

        if (!cancelled) {
          setContent(normalizeContent(nextContent))
          setStatus('ready')
        }
      } catch {
        if (!cancelled) {
          setContent(EMPTY_CONTENT)
          setStatus('error')
        }
      }
    }

    void loadContent()

    return () => {
      cancelled = true
      controller.abort()
    }
  }, [currentLanguage])

  const activeIndex = useMemo(
    () => TABS.findIndex((tab) => tab.id === activeTab),
    [activeTab],
  )

  const activateTab = (tabId: TabId) => {
    setActiveTab(tabId)
    updateTabInUrl(tabId)
  }

  const handleTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return
    event.preventDefault()
    const direction = event.key === 'ArrowRight' ? 1 : -1
    const nextIndex = (index + direction + TABS.length) % TABS.length
    activateTab(TABS[nextIndex].id)
    document.getElementById(`tab-${TABS[nextIndex].id}`)?.focus()
  }

  const openPdfPreview: OpenPdfPreview = (item, url) => {
    const receipt = buildPdfPreviewReceipt(item, url)
    setPreviewingPdf({
      receipt,
      title: textValue(item.title) || receipt.fileName,
    })
  }

  const openVideoPreview: OpenVideoPreview = (item, url) => {
    const youtubeEmbedUrl = toYoutubeEmbedUrl(url)
    if (!youtubeEmbedUrl) return

    void openSweetAlertFrame(textValue(item.title) || 'Preview', youtubeEmbedUrl, 'is-video')
  }

  return (
    <main className="space-y-5 px-1 py-2" aria-label="News & Library content">
      <div className="mx-auto flex max-w-6xl items-start justify-between gap-4">
        <header className="max-w-2xl">
          <h1
            id="news-library-title"
            className="text-2xl font-black leading-tight text-nexoraText"
          >
            News & Library
          </h1>
          <p className="mt-2 text-sm font-medium leading-relaxed text-nexoraMuted">
            Keep NEXORA TOUCH news and Zoom schedules in one owner workspace.
          </p>
        </header>
      </div>

      <section
        aria-labelledby="news-library-title"
        className="mx-auto max-w-6xl space-y-4"
      >
        <div
          className="grid grid-cols-3 gap-1 sm:flex sm:flex-wrap"
          role="tablist"
          aria-label="News and library sections"
        >
          {TABS.map(({ id, label, Icon }, index) => {
            const isActive = id === activeTab
            return (
              <button
                key={id}
                type="button"
                role="tab"
                id={`tab-${id}`}
                aria-controls={`panel-${id}`}
                aria-selected={isActive}
                tabIndex={isActive ? 0 : -1}
                onClick={() => activateTab(id)}
                onKeyDown={(event) => handleTabKeyDown(event, index)}
                className={[
                  'inline-flex min-h-12 min-w-0 flex-col items-center justify-center gap-1 rounded-lg border px-1 py-1.5 text-center text-xs font-bold leading-tight transition sm:min-h-11 sm:flex-row sm:px-3 sm:py-2',
                  isActive
                    ? 'border-transparent bg-nexoraBrand text-white shadow-nexora-soft'
                    : 'border-nexoraBorder bg-nexoraSurface text-nexoraMuted hover:border-nexoraLavender hover:text-nexoraText',
                ].join(' ')}
              >
                <span
                  className={[
                    'grid h-6 w-6 shrink-0 place-items-center rounded-lg sm:h-7 sm:w-7',
                    isActive ? 'bg-white/15 text-white' : 'bg-nexoraSurfaceMuted text-nexoraBrand',
                  ].join(' ')}
                >
                  <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden />
                </span>
                <span className="min-w-0 break-words">{label}</span>
              </button>
            )
          })}
        </div>

        {TABS.map((tab, index) => (
          <section
            key={tab.id}
            id={`panel-${tab.id}`}
            role="tabpanel"
            aria-labelledby={`tab-${tab.id}`}
            hidden={tab.id !== activeTab}
            tabIndex={activeIndex === index ? 0 : -1}
          >
            <LibraryShell>
              {tab.id === 'news' && (
                <NewsPanel
                  status={status}
                  content={content}
                  onPdfPreview={openPdfPreview}
                  onVideoPreview={openVideoPreview}
                />
              )}
              {tab.id === 'compensation-plan' && (
                <CompensationPanel
                  status={status}
                  content={content}
                  onPdfPreview={openPdfPreview}
                  onVideoPreview={openVideoPreview}
                />
              )}
              {tab.id === 'event-zoom-schedule' && (
                <EventZoomPanel
                  status={status}
                  content={content}
                  onDetails={(title, html) => {
                    void openSweetAlertDetails(title, html)
                  }}
                />
              )}
            </LibraryShell>
          </section>
        ))}
      </section>

      {previewingPdf && (
        <NewsLibraryPdfPreviewModal
          onClose={() => setPreviewingPdf(null)}
          receipt={previewingPdf.receipt}
          title={previewingPdf.title}
        />
      )}
    </main>
  )
}
