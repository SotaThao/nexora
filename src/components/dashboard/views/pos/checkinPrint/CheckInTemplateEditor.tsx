import { useTranslation } from '../../../../../contexts/LanguageContext'
import { CHECK_IN_TEMPLATES } from './checkInPrintCatalog'
import { getCheckInPrintCopy } from './checkInPrintCopy'
import type { CheckInPrintConfig, PrintLanguage, DesignSizeId } from './checkInPrintTypes'

export function CheckInTemplateEditor({ config, onChange }: { config: CheckInPrintConfig; onChange: (config: CheckInPrintConfig) => void }) {
  const { t } = useTranslation()
  const label = (key: string) => t('checkInPrint.' + key)
  const template = CHECK_IN_TEMPLATES.find(item => item.id === config.templateId)!
  const fieldClass = 'w-full rounded-lg border border-nexoraBorder bg-white p-2 text-sm text-nexoraText'
  const languageChanged = (language: PrintLanguage) => {
    const copy = getCheckInPrintCopy(language)
    onChange({ ...config, language, headline: config.headlineEdited ? config.headline : copy.headline, closingText: config.closingEdited ? config.closingText : copy.closingText })
  }
  return <div className="space-y-4">
    <div className="grid grid-cols-2 gap-3">
      <label className="space-y-1 text-xs font-bold">{label('size')}<select className={fieldClass} value={config.sizeId} onChange={event => onChange({ ...config, sizeId: event.target.value as DesignSizeId })}>{template.sizeIds.map(id => <option key={id} value={id}>{label('sizes.' + id)}</option>)}</select></label>
      <label className="space-y-1 text-xs font-bold">{label('language')}<select className={fieldClass} value={config.language} onChange={event => languageChanged(event.target.value as PrintLanguage)}>{(['en', 'vi', 'bilingual'] as const).map(id => <option key={id} value={id}>{label('languages.' + id)}</option>)}</select></label>
    </div>
    <label className="block space-y-1 text-xs font-bold">{label('headline')}<input className={fieldClass} value={config.headline} maxLength={60} placeholder={getCheckInPrintCopy(config.language).headline} onChange={event => onChange({ ...config, headline: event.target.value, headlineEdited: true })} /><span className="block text-right font-normal text-nexoraMuted">{config.headline.length}/60</span></label>
    <label className="block space-y-1 text-xs font-bold">{label('closing')}<textarea className={fieldClass} value={config.closingText} maxLength={100} rows={2} placeholder={getCheckInPrintCopy(config.language).closingText} onChange={event => onChange({ ...config, closingText: event.target.value, closingEdited: true })} /><span className="block text-right font-normal text-nexoraMuted">{config.closingText.length}/100</span></label>
    {(config.headlineEdited || config.closingEdited) && <div className="text-xs text-nexoraMuted">{label('customCopy')} <button type="button" className="underline" onClick={() => { const copy = getCheckInPrintCopy(config.language); onChange({ ...config, headline: copy.headline, closingText: copy.closingText, headlineEdited: false, closingEdited: false }) }}>{label('resetCopy')}</button></div>}
    <label className="block space-y-1 text-xs font-bold">{label('palette')}<select className={fieldClass} value={config.paletteId} onChange={event => onChange({ ...config, paletteId: event.target.value })}>{template.palettes.map(palette => <option key={palette.id} value={palette.id}>{label('palettes.' + palette.id)}</option>)}</select></label>
    <div className="flex flex-wrap gap-4">{(['showHours', 'showUrl', 'showInstructions'] as const).map(key => <label key={key} className="flex items-center gap-2 text-xs"><input type="checkbox" checked={config[key]} onChange={event => onChange({ ...config, [key]: event.target.checked })} />{label(key)}</label>)}</div>
  </div>
}
