import { useMemo } from 'react'
import { useTranslation } from '../../../../../contexts/LanguageContext'
import { CHECK_IN_TEMPLATES, getCompatibleSize } from './checkInPrintCatalog'
import { buildCheckInPrintDocument } from './buildCheckInPrintDocument'
import { CheckInPrintPreview } from './CheckInPrintPreview'
import type { CheckInPrintConfig, CheckInPrintBusiness, PrintAssets, TemplateId } from './checkInPrintTypes'

export function CheckInTemplateGallery({ config, business, assets, onSelect }: { config: CheckInPrintConfig; business: CheckInPrintBusiness; assets: PrintAssets | null; onSelect: (id: TemplateId) => void }) {
  const { t } = useTranslation()
  const previews = useMemo(() => CHECK_IN_TEMPLATES.map(template => assets ? buildCheckInPrintDocument({ ...config, templateId: template.id, sizeId: getCompatibleSize(template.id, config.sizeId), paletteId: template.id === config.templateId ? config.paletteId : template.palettes[0].id }, business, assets) : null), [config, business, assets])
  return <div role="radiogroup" aria-label={t('checkInPrint.templatesLabel')} className="grid grid-cols-3 gap-2">{CHECK_IN_TEMPLATES.map((template, index) => {
    const preview = previews[index]
    return <button type="button" role="radio" aria-checked={config.templateId === template.id} aria-label={t('checkInPrint.templates.' + template.id)} key={template.id} onClick={() => onSelect(template.id)} onKeyDown={event => {
      if (['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp'].includes(event.key)) {
        event.preventDefault()
        const next = (index + (event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1 : -1) + CHECK_IN_TEMPLATES.length) % CHECK_IN_TEMPLATES.length
        onSelect(CHECK_IN_TEMPLATES[next].id)
        ;(event.currentTarget.parentElement?.children[next] as HTMLButtonElement)?.focus()
      }
    }} className={`min-w-0 rounded-xl border-2 p-2 text-xs ${config.templateId === template.id ? 'border-nexoraBrand bg-nexoraCanvas' : 'border-nexoraBorder bg-white'}`}>
      <span className="flex h-28 items-center justify-center overflow-hidden rounded bg-nexoraCanvas" aria-hidden="true">{preview?.ok && assets ? <CheckInPrintPreview document={preview.document} assets={assets} className="h-full w-full" /> : <span>{t('checkInPrint.previewUnavailable')}</span>}</span>
      <span className="mt-2 block font-bold">{t('checkInPrint.templates.' + template.id)}</span>{config.templateId === template.id && <span className="block text-nexoraBrand">{t('checkInPrint.selected')}</span>}
    </button>
  })}</div>
}
