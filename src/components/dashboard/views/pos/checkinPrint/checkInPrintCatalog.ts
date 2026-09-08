import type { CheckInPrintConfig, DesignSizeId, PrintLanguage, TemplateId } from './checkInPrintTypes'
import { getCheckInPrintCopy } from './checkInPrintCopy'
export const CHECK_IN_DESIGN_SIZES: Record<DesignSizeId, { widthPt: number; heightPt: number }> = {
  'card-4x6': { widthPt: 288, heightPt: 432 },
  'letter-portrait': { widthPt: 612, heightPt: 792 },
  'letter-landscape': { widthPt: 792, heightPt: 612 },
}
export interface CheckInPalette { id: string; background: string; foreground: string; accent: string }
export interface CheckInTemplate { id: TemplateId; sizeIds: DesignSizeId[]; palettes: CheckInPalette[] }
const ink = { id: 'ink', background: '#ffffff', foreground: '#152238', accent: '#526477' }
const gold = { id: 'gold', background: '#fffdf7', foreground: '#292621', accent: '#987238' }
const navy = { id: 'navy', background: '#12233e', foreground: '#ffffff', accent: '#e1bf78' }
export const CHECK_IN_TEMPLATES: CheckInTemplate[] = [
  { id: 'simple', sizeIds: ['card-4x6'], palettes: [ink, gold] },
  { id: 'classic-gold', sizeIds: ['card-4x6', 'letter-portrait'], palettes: [gold, ink] },
  { id: 'modern-navy', sizeIds: ['card-4x6', 'letter-portrait'], palettes: [navy, { id: 'forest', background: '#16382e', foreground: '#ffffff', accent: '#dfcb98' }] },
  { id: 'minimal-clean', sizeIds: ['card-4x6', 'letter-portrait'], palettes: [ink, gold] },
  { id: 'wide-counter', sizeIds: ['letter-landscape'], palettes: [navy, ink] },
  { id: 'soft-sage', sizeIds: ['card-4x6', 'letter-portrait'], palettes: [{ id: 'sage', background: '#fafbf6', foreground: '#263e32', accent: '#6c8872' }, gold] },
]
export function getCompatibleSize(templateId: TemplateId, sizeId: DesignSizeId): DesignSizeId {
  const template = CHECK_IN_TEMPLATES.find(item => item.id === templateId)!
  return template.sizeIds.includes(sizeId) ? sizeId : template.sizeIds[0]
}
export function createDefaultCheckInPrintConfig(language: PrintLanguage = 'en'): CheckInPrintConfig {
  const copy = getCheckInPrintCopy(language)
  return { templateId: 'simple', sizeId: 'card-4x6', language, paletteId: 'ink', headline: copy.headline, closingText: copy.closingText, headlineEdited: false, closingEdited: false, showHours: true, showUrl: true, showInstructions: true }
}
