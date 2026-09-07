import { useParams } from 'react-router-dom'
import { AlertCircle, Sparkles } from 'lucide-react'
import { useTranslation } from '../../contexts/LanguageContext'
import { useMarketingLandingPages } from '../../data/hooks/useMarketingLandingPages'
import LandingPagePreview from '../dashboard/views/marketing/LandingPagePreview'
import LoadingScreen from '../../app/LoadingScreen'

/**
 * Public preview of a mock Landing Page — deliberately does not call useAuth() or render the
 * dashboard shell. Registered outside RequireAuth in AppRouter.tsx, same pattern as
 * ShareLinkViewerPage.tsx / ReceiptPage.tsx.
 *
 * The underlying repository (marketingLandingPages.ts) is a mock backed by localStorage, not a
 * real backend — this link resolves in a reload or a new tab on the SAME browser/device that
 * published it, but never on a different browser or device (no server, nothing to sync). That
 * limitation is surfaced to the merchant in the editor when the link is copied.
 */
export default function PublicMarketingLandingPreviewPage() {
  const { t } = useTranslation()
  const { pageId } = useParams<{ pageId: string }>()
  const pagesQuery = useMarketingLandingPages()

  if (pagesQuery.isLoading) return <LoadingScreen />

  const page = pagesQuery.data?.find((candidate) => candidate.id === pageId)

  if (!page?.published) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-nexoraCanvas px-4 py-10">
        <div className="w-full max-w-md space-y-4 rounded-2xl border border-nexoraBorder bg-white p-6 text-center shadow-xl dark:bg-luxuryCoal">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-500/10 text-rose-600">
            <AlertCircle className="h-6 w-6" />
          </div>
          <h1 className="text-lg font-extrabold text-nexoraText">
            {t('marketingSuite.publicPreviewNotAvailable')}
          </h1>
          <p className="text-sm leading-relaxed text-nexoraMuted">
            {t('marketingSuite.publicPreviewNotAvailableHint')}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-nexoraCanvas px-4 py-8">
      <div className="mx-auto max-w-md space-y-4">
        <div className="flex items-center gap-2 rounded-lg border border-nexoraBrand/20 bg-nexoraBrandSoft px-3 py-2 text-xs font-bold text-nexoraBrand">
          <Sparkles className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          {t('marketingSuite.publicPreviewBanner')}
        </div>
        <LandingPagePreview content={page.published} />
      </div>
    </div>
  )
}
