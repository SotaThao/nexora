import { useEffect, useMemo, useRef, useState } from 'react'
import { AlertTriangle, Check, Copy, Download, Printer, QrCode } from 'lucide-react'
import { useTranslation } from '../../../../contexts/LanguageContext'
import { useNotification } from '../../../../contexts/NotificationContext'
import { useBusinessHours } from '../../../../data/hooks/useMerchantSetup'
import { useCheckInSettings } from '../../../../data/hooks/usePosCheckIn'
import { copyTextToClipboard } from '../../../../utils/clipboard'
import { buildPublicQrImageUrl, downloadQrCode, QR_IMAGE_SIZES } from '../../../../utils/qrUtils'
import { getWebUrlOrigin } from '../../../../utils/webUrlBase'
import { resolveTranslation } from '../../../../utils/translate'
import en from '../../../../locales/en.json'
import vi from '../../../../locales/vi.json'
import { formatCheckInPosterHours } from './formatCheckInPosterHours'
import { CHECK_IN_TEMPLATES, createDefaultCheckInPrintConfig, getCompatibleSize } from './checkinPrint/checkInPrintCatalog'
import { buildCheckInPrintDocument } from './checkinPrint/buildCheckInPrintDocument'
import { CheckInTemplateGallery } from './checkinPrint/CheckInTemplateGallery'
import { CheckInTemplateEditor } from './checkinPrint/CheckInTemplateEditor'
import { CheckInPrintPreview } from './checkinPrint/CheckInPrintPreview'
import { CheckInPrintSurface } from './checkinPrint/CheckInPrintSurface'
import { useCheckInPrintAssets } from './checkinPrint/useCheckInPrintAssets'
import { useCheckInTemplatePrint } from './checkinPrint/useCheckInTemplatePrint'
import type { CheckInPrintBusiness } from './checkinPrint/checkInPrintTypes'
import './publicCheckInQrPrint.css'

const TK = 'components.dashboard.views.pos.PublicCheckInQrPanel.'
interface Props { businessId?: string; businessSlug?: string; businessName?: string; businessLogo?: string | null }
export default function PublicCheckInQrPanel(props: Props) {
  return <PublicCheckInQrEditor key={`${props.businessId ?? ''}:${props.businessSlug ?? ''}`} {...props} />
}
function PublicCheckInQrEditor({ businessId, businessSlug, businessName, businessLogo }: Props) {
  const { t } = useTranslation()
  const text = (key: string) => t('checkInPrint.' + key)
  const { showToast } = useNotification()
  const { data: checkInSettings } = useCheckInSettings(businessId)
  const hoursQuery = useBusinessHours()
  const [config, setConfig] = useState(() => createDefaultCheckInPrintConfig())
  const [withoutLogo, setWithoutLogo] = useState(false)
  const [isCopied, setIsCopied] = useState(false)
  const [busy, setBusy] = useState<'pdf' | 'qr' | null>(null)
  const busyRef = useRef(false)
  const mounted = useRef(true)
  const copyTimer = useRef<number | undefined>(undefined)
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; window.clearTimeout(copyTimer.current) } }, [])
  const assetState = useCheckInPrintAssets(withoutLogo ? null : businessLogo ?? null)
  const printing = useCheckInTemplatePrint()
  const url = businessSlug ? `${getWebUrlOrigin()}/checkin/${businessSlug}` : ''
  const business = useMemo<CheckInPrintBusiness>(() => {
    const hours = (dictionary: typeof en | typeof vi) => hoursQuery.isPending || hoursQuery.isError ? '' : formatCheckInPosterHours(hoursQuery.data, day => resolveTranslation(dictionary, TK + 'daysShort.' + day.toLowerCase())) ?? resolveTranslation(dictionary, TK + 'hoursClosed')
    return { name: businessName?.trim() || t(TK + 'fallbackBusinessName'), slug: businessSlug ?? '', logoUrl: withoutLogo ? null : businessLogo ?? null, checkInUrl: url, hoursByLanguage: { en: hours(en), vi: hours(vi) } }
  }, [businessName, businessSlug, businessLogo, withoutLogo, url, hoursQuery.data, hoursQuery.isPending, hoursQuery.isError, t])
  const result = useMemo(() => assetState.assets ? buildCheckInPrintDocument(config, business, assetState.assets) : null, [config, business, assetState.assets])
  const design = result?.ok ? result.document : null
  const hoursBlocked = config.showHours && (hoursQuery.isPending || hoursQuery.isError)
  const ready = assetState.status === 'ready' && design !== null && !hoursBlocked
  const disabled = !ready || busy !== null || printing.job !== null
  const copy = async () => {
    try { await copyTextToClipboard(url); if (!mounted.current) return; setIsCopied(true); showToast(t(TK + 'copied')); window.clearTimeout(copyTimer.current); copyTimer.current = window.setTimeout(() => setIsCopied(false), 2000) } catch { showToast(t('common.error'), 'error') }
  }
  const download = async (kind: 'pdf' | 'qr') => {
    if (busyRef.current) return
    if (kind === 'pdf' && (!ready || !design || !assetState.assets)) return
    busyRef.current = true; setBusy(kind)
    const safeSlug = (businessSlug ?? 'business').replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 80)
    try {
      if (kind === 'qr') await downloadQrCode(buildPublicQrImageUrl(url, QR_IMAGE_SIZES.print), `checkin-qr-${safeSlug}.png`)
      else if (design && assetState.assets) {
        const documentSnapshot = design
        const assetsSnapshot = assetState.assets
        const fileName = `${safeSlug}-${config.templateId}-${config.sizeId}-${config.language}.pdf`
        const { createCheckInPrintPdf } = await import('./checkinPrint/exportCheckInPrintPdf')
        const bytes = await createCheckInPrintPdf(documentSnapshot, assetsSnapshot)
        if (!mounted.current) return
        const objectUrl = URL.createObjectURL(new Blob([new Uint8Array(bytes)], { type: 'application/pdf' }))
        const link = document.createElement('a'); link.href = objectUrl; link.download = fileName; document.body.appendChild(link); link.click(); link.remove()
        window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000)
      }
    } catch { if (mounted.current) showToast(text('exportError'), 'error') }
    finally { busyRef.current = false; if (mounted.current) setBusy(null) }
  }
  if (!businessSlug) return null
  const control = 'min-h-11 rounded-lg border border-nexoraBorder bg-white px-3 text-sm text-nexoraText disabled:opacity-50'
  return <>
    <div className="nexora-card min-w-0 p-4 lg:p-6">
      <div className="mb-4 flex items-start gap-3"><QrCode className="h-6 w-6 shrink-0 text-nexoraBrand" /><div><h3 className="font-extrabold text-nexoraText">{t(TK + 'title')}</h3><p className="text-xs text-nexoraMuted">{t(TK + 'description')}</p></div></div>
      {checkInSettings && checkInSettings.publicCheckInEnabled !== true && <div className="mb-4 flex gap-2 rounded-lg border border-nexoraWarning p-3 text-xs"><AlertTriangle className="h-4 w-4 shrink-0" />{t(TK + 'enableNotice')}</div>}
      <div className="grid min-w-0 gap-6 xl:grid-cols-2">
        <div className="min-w-0 space-y-5">
          <CheckInTemplateGallery config={config} business={business} assets={assetState.assets} onSelect={id => { const template = CHECK_IN_TEMPLATES.find(item => item.id === id)!; setConfig(current => ({ ...current, templateId: id, sizeId: getCompatibleSize(id, current.sizeId), paletteId: template.palettes[0].id })) }} />
          <CheckInTemplateEditor config={config} onChange={setConfig} />
          {(!businessLogo || withoutLogo) && <p className="text-xs text-nexoraMuted">{text('noLogo')}</p>}
          <div className="flex min-w-0 items-center gap-2 rounded-lg border border-nexoraBorder p-2"><a className="min-w-0 flex-1 truncate text-xs text-nexoraMuted" href={url} target="_blank" rel="noreferrer">{url.replace(/^https?:\/\//, '')}</a><button type="button" className="flex min-h-10 items-center gap-1 text-xs text-nexoraBrand" onClick={() => void copy()}>{isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}{t('common.copy')}</button></div>
        </div>
        <div className="min-w-0 space-y-4">
          <h4 className="text-sm font-bold">{text('preview')}</h4>
          <div className="flex min-h-64 items-center justify-center rounded-xl border border-nexoraBorder bg-nexoraCanvas p-4">
            {design && assetState.assets ? <div className="w-full max-w-md"><CheckInPrintPreview document={design} assets={assetState.assets} /></div> : <p className="p-6 text-center text-sm text-nexoraMuted" role="status">{assetState.status === 'loading' ? text('loading') : text('previewUnavailable')}</p>}
          </div>
          {assetState.status === 'error' && <div role="alert" className="space-y-2 text-sm text-nexoraText"><p>{text(assetState.error === 'logo' ? 'logoError' : 'fontError')}</p><button className={control} onClick={assetState.retry}>{text('retry')}</button>{assetState.error === 'logo' && <button className={control + ' ml-2'} onClick={() => setWithoutLogo(true)}>{text('withoutLogo')}</button>}</div>}
          {config.showHours && hoursQuery.isPending && hoursQuery.isFetching && <p role="status" className="text-sm text-nexoraMuted">{text('hoursLoading')}</p>}
          {config.showHours && hoursQuery.isPending && !hoursQuery.isFetching && <div role="alert" className="space-y-2 text-sm text-nexoraText"><p>{text('hoursUnavailable')}</p><button type="button" className={control} onClick={() => setConfig(current => ({ ...current, showHours: false }))}>{text('withoutHours')}</button></div>}
          {config.showHours && hoursQuery.isError && <div role="alert" className="space-y-2 text-sm text-nexoraText"><p>{text('hoursError')}</p><button type="button" className={control} onClick={() => void hoursQuery.refetch()}>{text('retry')}</button><button type="button" className={control + ' ml-2'} onClick={() => setConfig(current => ({ ...current, showHours: false }))}>{text('withoutHours')}</button></div>}
          {result?.ok === false && <div role="alert" className="text-sm text-nexoraText">{result.issues.map((issue, index) => <p key={index}>{text('issues.' + issue.code)}</p>)}</div>}
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3"><button type="button" disabled={disabled} className={control + ' flex items-center justify-center gap-2'} onClick={() => { if (ready && design && assetState.assets) printing.print(design, assetState.assets) }}><Printer className="h-4 w-4" />{text('print')}</button><button type="button" disabled={disabled} className={control + ' flex items-center justify-center gap-2'} onClick={() => void download('pdf')}><Download className="h-4 w-4" />{text(busy === 'pdf' ? 'working' : 'pdf')}</button><button type="button" disabled={busy !== null || printing.job !== null} className={control} onClick={() => void download('qr')}>{text(busy === 'qr' ? 'working' : 'qr')}</button></div>
          {printing.job && <button type="button" className={control} onClick={printing.cancel}>{text('cancelPrint')}</button>}
          <p className="text-xs text-nexoraMuted">{text('printHint')}</p>
        </div>
      </div>
    </div>
    <CheckInPrintSurface job={printing.job} />
  </>
}
