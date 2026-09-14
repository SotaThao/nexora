export type TemplateId = 'simple' | 'classic-gold' | 'modern-navy' | 'minimal-clean' | 'wide-counter' | 'soft-sage'
export type DesignSizeId = 'card-4x6' | 'letter-portrait' | 'letter-landscape'
export type PrintLanguage = 'en' | 'vi' | 'bilingual'
export interface CheckInPrintConfig {
  templateId: TemplateId; sizeId: DesignSizeId; language: PrintLanguage; paletteId: string
  headline: string; closingText: string; headlineEdited: boolean; closingEdited: boolean
  showHours: boolean; showUrl: boolean; showInstructions: boolean
}
export interface CheckInPrintBusiness {
  name: string; slug: string; logoUrl: string | null
  hoursByLanguage: { en: string; vi: string }; checkInUrl: string
}
export interface TextRun {
  text: string; x: number; baselineY: number; fontId: 'body' | 'bodyBold' | 'heading' | 'inter'; fontSize: number; color: string
}
export type PrintNode =
  | { kind: 'rect'; x: number; y: number; width: number; height: number; fill: string }
  | { kind: 'path'; d: string; x: number; y: number; fill: string }
  | { kind: 'text'; runs: TextRun[] }
  | { kind: 'image'; assetId: string; x: number; y: number; width: number; height: number }
export interface CheckInPrintDocument { widthPt: number; heightPt: number; nodes: PrintNode[]; qrUrl: string; assetIds: string[] }
export interface PrintAssets {
  images: Record<string, { bytes: Uint8Array; mimeType: 'image/png' | 'image/jpeg'; objectUrl: string }>
  fonts: Record<string, Uint8Array>
  measureText: (fontId: TextRun['fontId'], text: string, size: number) => number
}
export interface PrintIssue { code: 'textOverflow' | 'assetFailed' | 'invalidUrl' | 'unsupportedSize'; field?: string }
export type DocumentResult = { ok: true; document: CheckInPrintDocument } | { ok: false; issues: PrintIssue[] }
