import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Check, Copy, FileDown, Image as ImageIcon, Printer, QrCode } from 'lucide-react'
import { useTranslation } from '../../../contexts/LanguageContext'
import { useNotification } from '../../../contexts/NotificationContext'
import { useOneQr } from '../../../data/hooks/useMerchantOneQr'
import { useBusinessHours, useMerchantSetup } from '../../../data/hooks/useMerchantSetup'
import type { BusinessHourEntry } from '../../../types/domain'
import { ONEQR_AUDIENCE_ORDER, OneQrAudience, toOneQrViewAs } from '../../../constants/oneQr'
import { formatCheckInPosterHours } from '../../dashboard/views/pos/formatCheckInPosterHours'
import { withOneQrArtworkHours } from './oneQrArtworkHours'
import { buildShareUrl, slugFromUrl } from './oneQrShare'
import { copyTextToClipboard } from '../../../utils/clipboard'
import { downloadQrCode, QR_IMAGE_SIZES } from '../../../utils/qrUtils'
import { buildPublicQrImageUrl } from '../../../data/repositories/publicQr'
import { logger } from '../../../utils/logger'
import { ONEQR_CONCEPTS, ONEQR_INDUSTRIES, getOneQrArtworkBackgrounds } from './oneQrArtworkCatalog'
import type { OneQrIndustryId } from './oneQrArtworkCatalog'
import { CheckInBackgroundGallery } from '../../dashboard/views/pos/checkinPrint/CheckInBackgroundGallery'
import { useCheckInBackgroundPrint } from '../../dashboard/views/pos/checkinPrint/useCheckInBackgroundPrint'
import { useCheckInPrintAssets } from '../../dashboard/views/pos/checkinPrint/useCheckInPrintAssets'
import { CheckInPrintPreview } from '../../dashboard/views/pos/checkinPrint/CheckInPrintPreview'
import { CheckInPrintSurface } from '../../dashboard/views/pos/checkinPrint/CheckInPrintSurface'
import { useCheckInTemplatePrint } from '../../dashboard/views/pos/checkinPrint/useCheckInTemplatePrint'
import '../../dashboard/views/pos/publicCheckInQrPrint.css'

const actionControl = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'

const control = 'min-h-11 rounded-lg border border-nexoraBorder bg-nexoraSurface px-3 text-sm text-nexoraText disabled:opacity-50'
export default function OneQrArtworkPage() {
  const { t } = useTranslation()
  const query = useOneQr()
  const { data: setup } = useMerchantSetup()
  const [params] = useSearchParams()
  const audience = ONEQR_AUDIENCE_ORDER.find(value => toOneQrViewAs(value) === params.get('as')) ?? OneQrAudience.Customer
  const oneQr = query.data
  const url = oneQr ? `${buildShareUrl(oneQr)}?as=${toOneQrViewAs(audience)}` : ''

  return <div className="min-w-0 space-y-5">
    <Link to="/dashboard/touchpoints?tab=stations&section=one-qr" className="inline-flex min-h-11 items-center gap-2 text-sm font-bold text-nexoraBrand"><ArrowLeft className="h-4 w-4" aria-hidden />{t('oneqr.artwork.back')}</Link>
    <div><h1 className="text-xl font-black text-nexoraText">{t('oneqr.artwork.title')}</h1><p className="mt-1 text-sm text-nexoraMuted">{t('oneqr.artwork.description')}</p></div>
    {query.isLoading ? <p role="status">{t('oneqr.artwork.loading')}</p> : query.isError || !oneQr ? <div role="alert"><p>{t('oneqr.artwork.error')}</p><button type="button" className={control + ' mt-3'} onClick={() => void query.refetch()}>{t('checkInPrint.retry')}</button></div> : <>
      {!oneQr.isActive && <p role="status" className="text-sm text-nexoraWarning">{t('oneqr.status.paused')}</p>}
      {audience !== OneQrAudience.Customer && <p className="text-xs text-nexoraMuted">{t('oneqr.card.role_code_note', { audience: t(`oneqr.audience.${toOneQrViewAs(audience)}`) })}</p>}
      <AuthenticatedArtworkEditor key={`${oneQr.id}:${url}`} url={url} fileSlug={`oneqr-${slugFromUrl(oneQr.url)}-${toOneQrViewAs(audience)}`} businessName={setup?.businessInfo?.name || oneQr.name} businessLogo={setup?.businessInfo?.logo} />
    </>}
  </div>
}

function AuthenticatedArtworkEditor(props: { url: string; fileSlug: string; businessName?: string; businessLogo?: string | null }) {
  const hoursQuery = useBusinessHours()
  return <OneQrArtworkEditor {...props} hours={{ entries: hoursQuery.data, isPending: hoursQuery.isPending, isFetching: hoursQuery.isFetching, isError: hoursQuery.isError, retry: () => void hoursQuery.refetch() }} />
}

export type OneQrArtworkHours = {
  entries?: BusinessHourEntry[]
  isPending: boolean
  isFetching: boolean
  isError: boolean
  retry?: () => void
}

export function OneQrArtworkEditor({ url, fileSlug, businessName, businessLogo, hours, isDemo = false }: { url: string; fileSlug: string; businessName?: string; businessLogo?: string | null; hours: OneQrArtworkHours; isDemo?: boolean }) {
  const { t, currentLanguage } = useTranslation()
  const text = (key: string) => t('checkInPrint.' + key)
  const { showToast } = useNotification()
  const [backgroundId, setBackgroundId] = useState(ONEQR_CONCEPTS[0].id)
  const [industryId, setIndustryId] = useState<OneQrIndustryId | 'all'>('all')
  const backgrounds = useMemo(() => getOneQrArtworkBackgrounds(currentLanguage), [currentLanguage])
  const gallery = useMemo(() => industryId === 'all' ? backgrounds : backgrounds.filter(item => item.industryId === industryId), [backgrounds, industryId])
  const [showLogo, setShowLogo] = useState(false)
  const [showName, setShowName] = useState(false)
  const [showHours, setShowHours] = useState(false)
  const hoursText = formatCheckInPosterHours(hours.entries, day => t('components.dashboard.views.pos.PublicCheckInQrPanel.daysShort.' + day.toLowerCase()))
  const hoursBlocked = showHours && (hours.isPending || hours.isError || !hours.entries?.length)
  const hoursValue = hoursText || t('components.dashboard.views.pos.PublicCheckInQrPanel.hoursClosed')
  const [copied, setCopied] = useState(false)
  const [busy, setBusy] = useState<'pdf' | 'png' | 'qr' | null>(null)
  const busyRef = useRef(false)
  const mounted = useRef(true)
  const copyTimer = useRef<number | undefined>(undefined)
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; window.clearTimeout(copyTimer.current) } }, [])
  const brandingSelected = (showLogo && !!businessLogo) || (showName && !!businessName?.trim())
  const branding = useCheckInPrintAssets(showLogo ? businessLogo : null, brandingSelected || showHours, true)
  const background = backgrounds.find(item => item.id === backgroundId)!
  const artwork = useCheckInBackgroundPrint(background, url, 'letter-portrait', {
    name: showName ? businessName?.trim() ?? '' : '',
    logoUrl: showLogo ? businessLogo : null,
    assets: brandingSelected ? branding.assets : null,
    ready: !brandingSelected || branding.status === 'ready',
  })
  const design = useMemo(() => {
    if (!artwork.document || !showHours) return artwork.document
    if (hoursBlocked || branding.status !== 'ready' || !branding.assets) return null
    return withOneQrArtworkHours(artwork.document, branding.assets, hoursValue, background.hoursColor)
  }, [artwork.document, showHours, hoursBlocked, branding.status, branding.assets, t, hoursValue, background.hoursColor])
  const activeAssets = useMemo(() => showHours && artwork.assets && branding.assets ? { ...artwork.assets, fonts: branding.assets.fonts, measureText: branding.assets.measureText } : artwork.assets, [showHours, artwork.assets, branding.assets])
  const printing = useCheckInTemplatePrint()
  const ready = artwork.status === 'ready' && !!design && !!activeAssets && !hoursBlocked
  const disabled = !ready || busy !== null || printing.job !== null
  const selectIndustry = (id: OneQrIndustryId | 'all') => {
    setIndustryId(id)
    if (id !== 'all' && background.industryId !== id) {
      setBackgroundId(ONEQR_CONCEPTS.find(item => item.industryId === id)!.id)
    }
  }
  const copy = async () => {
    try {
      await copyTextToClipboard(url)
      if (!mounted.current) return
      setCopied(true)
      window.clearTimeout(copyTimer.current)
      copyTimer.current = window.setTimeout(() => setCopied(false), 2000)
    } catch (error) { logger.error('OneQR artwork copy failed', error); showToast(t('oneqr.card.copy_failed'), 'error') }
  }
  const download = async (kind: 'pdf' | 'png' | 'qr') => {
    if (busyRef.current || printing.job || (kind !== 'qr' && !ready)) return
    busyRef.current = true
    setBusy(kind)
    const filename = fileSlug.replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 100)
    // Keep the filename paired with the immutable artwork even if app language changes mid-export.
    const assetIdSnapshot = background.assetId
    try {
      if (kind === 'qr') await downloadQrCode(buildPublicQrImageUrl(url, QR_IMAGE_SIZES.print), `${filename}.png`)
      else if (design && activeAssets) {
        const documentSnapshot = design
        const assetsSnapshot = activeAssets
        let blob: Blob
        if (kind === 'png') {
          const { createCheckInPrintPng } = await import('../../dashboard/views/pos/checkinPrint/exportCheckInPrintPng')
          blob = await createCheckInPrintPng(documentSnapshot, assetsSnapshot)
        } else {
          const { createCheckInPrintPdf } = await import('../../dashboard/views/pos/checkinPrint/exportCheckInPrintPdf')
          const bytes = await createCheckInPrintPdf(documentSnapshot, assetsSnapshot)
          blob = new Blob([new Uint8Array(bytes)], { type: 'application/pdf' })
        }
        if (!mounted.current) return
        const objectUrl = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = objectUrl
        link.download = `${filename}-${assetIdSnapshot}.${kind}`
        document.body.appendChild(link)
        link.click()
        link.remove()
        window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000)
      }
    } catch (error) { logger.error('OneQR artwork export failed', error); if (mounted.current) showToast(text('exportError'), 'error') }
    finally { busyRef.current = false; if (mounted.current) setBusy(null) }
  }
  return <>
    <div className="nexora-card grid min-w-0 gap-6 p-4 md:grid-cols-2 lg:p-6">
      <div className="min-w-0 space-y-5">
        <div className="space-y-2">
          <label htmlFor="oneqr-artwork-industry" className="block text-sm font-bold text-nexoraText">{t('oneqr.artwork.industryLabel')}</label>
          <select id="oneqr-artwork-industry" value={industryId} onChange={event => selectIndustry(event.target.value as OneQrIndustryId | 'all')} className="h-11 w-full rounded-lg border border-nexoraBorder bg-nexoraSurface px-3 text-sm font-medium text-nexoraText focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nexoraBrand focus-visible:ring-offset-2 sm:max-w-xs">
            {(['all', ...ONEQR_INDUSTRIES] as const).map(id => <option key={id} value={id}>{t(`oneqr.artwork.industries.${id}`)}</option>)}
          </select>
        </div>
        <CheckInBackgroundGallery templates={gallery} labelPrefix="oneqr.artwork.templates." selectedId={backgroundId} onSelect={setBackgroundId} />
        <div className="flex flex-wrap gap-4">
          <label className="flex min-h-11 items-center gap-2 text-xs"><input type="checkbox" checked={showLogo} onChange={event => setShowLogo(event.target.checked)} />{text('showSalonLogo')}</label>
          <label className="flex min-h-11 items-center gap-2 text-xs"><input type="checkbox" checked={showName} onChange={event => setShowName(event.target.checked)} />{text('showSalonName')}</label>
          <label className="flex min-h-11 items-center gap-2 text-xs"><input type="checkbox" checked={showHours} onChange={event => setShowHours(event.target.checked)} />{t('oneqr.artwork.showHours')}</label>
        </div>
        {showLogo && !businessLogo && <p role="status" className="text-xs text-nexoraMuted">{text('artworkMissingLogo')}</p>}
        {showName && !businessName?.trim() && <p role="status" className="text-xs text-nexoraMuted">{text('artworkMissingName')}</p>}
        <p className="text-xs text-nexoraMuted">{t(background.industryId === 'nail' ? (isDemo ? 'oneqr.artwork.demoLegacyFixed' : 'oneqr.artwork.legacyFixed') : (isDemo ? 'oneqr.artwork.demoFixed' : 'oneqr.artwork.fixed'))}</p>
        <div className="min-w-0 space-y-1">
          <p className="text-xs font-bold text-nexoraText">{t(isDemo ? 'oneqr.artwork.demoLinkLabel' : 'oneqr.artwork.linkLabel')}</p>
          <div className="flex min-w-0 items-center gap-2 rounded-lg border border-nexoraBorder p-2">
            <a href={url} target="_blank" rel="noopener noreferrer" className="min-w-0 flex-1 truncate text-xs text-nexoraMuted">{url}</a>
            <button type="button" onClick={() => void copy()} className="inline-flex min-h-11 items-center gap-1 text-xs text-nexoraBrand">{copied ? <Check className="h-4 w-4" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />}{t(copied ? 'common.copied' : 'common.copy')}</button>
          </div>
        </div>
      </div>
      <div className="min-w-0 space-y-4">
        <h2 className="text-sm font-bold text-nexoraText">{text('preview')} · {t(`oneqr.artwork.templates.${backgroundId}`)}</h2>
        <div className="flex min-h-64 items-center justify-center rounded-xl border border-nexoraBorder bg-nexoraCanvas p-4">
          {design && activeAssets ? <div className="w-full max-w-md"><CheckInPrintPreview document={design} assets={activeAssets} /></div> : <p role="status" className="p-6 text-center text-sm text-nexoraMuted">{text(artwork.status === 'loading' ? 'artworkLoading' : 'previewUnavailable')}</p>}
        </div>
        {(brandingSelected || showHours) && branding.status === 'error' && <div role="alert" className="space-y-2 text-sm"><p>{text(branding.error === 'logo' ? 'artworkLogoError' : 'artworkFontError')}</p><button type="button" className={control} onClick={branding.retry}>{text('retry')}</button></div>}
        {artwork.status === 'error' && <div role="alert" className="space-y-2 text-sm"><p>{text(artwork.error === 'brandingOverflow' ? 'artworkNameTooLong' : 'artworkError')}</p>{artwork.error === 'brandingOverflow' ? <button type="button" className={control} onClick={() => setShowName(false)}>{text('hideSalonName')}</button> : <button type="button" className={control} onClick={artwork.retry}>{text('retry')}</button>}</div>}
        {showHours && hours.isPending && hours.isFetching && <p role="status" className="text-sm text-nexoraMuted">{text('hoursLoading')}</p>}
        {hoursBlocked && !(hours.isPending && hours.isFetching) && <div role="alert" className="space-y-2 text-sm"><p>{text(hours.isError ? 'hoursError' : 'hoursUnavailable')}</p>{hours.isError && hours.retry && <button type="button" className={control} onClick={hours.retry}>{text('retry')}</button>}<button type="button" className={control + ' ml-2'} onClick={() => setShowHours(false)}>{text('withoutHours')}</button></div>}
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <button type="button" className={actionControl + ' border-nexoraBrand/20 bg-nexoraBrand/5 text-nexoraBrand enabled:hover:bg-nexoraBrand/10'} disabled={disabled} onClick={() => { if (ready && design && activeAssets) printing.print(design, activeAssets) }}><Printer className="h-4 w-4" aria-hidden />{text('print')}</button>
          <button type="button" className={actionControl + ' border-amber-200 bg-amber-50/70 text-amber-800 enabled:hover:bg-amber-100'} disabled={disabled} onClick={() => void download('pdf')}><FileDown className="h-4 w-4" aria-hidden />{text(busy === 'pdf' ? 'working' : 'pdf')}</button>
          <button type="button" className={actionControl + ' border-sky-200 bg-sky-50/70 text-sky-700 enabled:hover:bg-sky-100'} disabled={disabled} onClick={() => void download('png')}><ImageIcon className="h-4 w-4" aria-hidden />{busy === 'png' ? text('working') : t('oneqr.artwork.png')}</button>
          <button type="button" className={actionControl + ' border-emerald-200 bg-emerald-50/70 text-emerald-700 enabled:hover:bg-emerald-100'} disabled={busy !== null || printing.job !== null} onClick={() => void download('qr')}><QrCode className="h-4 w-4" aria-hidden />{text(busy === 'qr' ? 'working' : 'qr')}</button>
        </div>
        {printing.job && <button type="button" className={control} onClick={printing.cancel}>{text('cancelPrint')}</button>}
        <p className="text-xs text-nexoraMuted">{text('printHint')}</p>
      </div>
    </div>
    <CheckInPrintSurface job={printing.job} />
  </>
}
