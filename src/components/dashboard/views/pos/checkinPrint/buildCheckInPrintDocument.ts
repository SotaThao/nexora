import QRCode from 'qrcode'
import { createCheckInPrintDecoration } from './checkInPrintDecoration'
import { CHECK_IN_DESIGN_SIZES, CHECK_IN_TEMPLATES } from './checkInPrintCatalog'
import { getCheckInPrintCopy } from './checkInPrintCopy'
import type { CheckInPrintBusiness, CheckInPrintConfig, DocumentResult, PrintAssets, PrintIssue, PrintNode, TextRun } from './checkInPrintTypes'

export function buildCheckInPrintDocument(config: CheckInPrintConfig, business: CheckInPrintBusiness, assets: PrintAssets): DocumentResult {
  const template = CHECK_IN_TEMPLATES.find(item => item.id === config.templateId)
  if (!template?.sizeIds.includes(config.sizeId)) return { ok: false, issues: [{ code: 'unsupportedSize' }] }
  try { const url = new URL(business.checkInUrl); if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password || !business.slug.trim()) throw new Error() }
  catch { return { ok: false, issues: [{ code: 'invalidUrl' }] } }
  if (!['body', 'bodyBold', 'heading'].every(id => assets.fonts[id]?.length)) return { ok: false, issues: [{ code: 'assetFailed', field: 'font' }] }
  const issues: PrintIssue[] = []
  if (config.headlineEdited && Array.from(config.headline).length > 60) issues.push({ code: 'textOverflow', field: 'headline' })
  if (config.closingEdited && Array.from(config.closingText).length > 100) issues.push({ code: 'textOverflow', field: 'closingText' })
  const { widthPt: w, heightPt: h } = CHECK_IN_DESIGN_SIZES[config.sizeId]
  const wide = config.templateId === 'wide-counter'
  const small = config.sizeId === 'card-4x6'
  const scale = small ? 1 : 1.7
  const margin = small ? 18 : 36
  const palette = template.palettes.find(item => item.id === config.paletteId) ?? template.palettes[0]
  const nodes: PrintNode[] = [{ kind: 'rect', x: 0, y: 0, width: w, height: h, fill: palette.background }]
  const rect = (x: number, y: number, width: number, height: number, fill: string) => nodes.push({ kind: 'rect', x, y, width, height, fill })
  nodes.push(...createCheckInPrintDecoration(config.templateId, w, h, palette))
  const contentStart = nodes.length
  const copy = getCheckInPrintCopy(config.language)
  const textWidth = wide ? w * .43 : w - margin * 2
  const textX = wide ? margin : (w - textWidth) / 2
  function lines(text: string, font: TextRun['fontId'], size: number, width: number): string[] {
    return text.trim().split('\n').flatMap(paragraph => {
      if (!paragraph) return []
      const result: string[] = []; let line = ''
      for (const word of paragraph.split(/\s+/)) {
        const candidate = line ? `${line} ${word}` : word
        if (assets.measureText(font, candidate, size) <= width) { line = candidate; continue }
        if (line) { result.push(line); line = '' }
        if (assets.measureText(font, word, size) <= width) { line = word; continue }
        for (const character of Array.from(word)) {
          if (line && assets.measureText(font, line + character, size) > width) { result.push(line); line = '' }
          line += character
        }
      }
      if (line) result.push(line)
      return result
    })
  }
  function block(text: string, font: TextRun['fontId'], size: number, maxLines: number, field: string, color = palette.foreground) {
    const wrapped = lines(text.normalize('NFC'), font, size, textWidth)
    if (wrapped.length > maxLines) issues.push({ code: 'textOverflow', field })
    return { height: wrapped.length * size * 1.32, draw(y: number) {
      nodes.push({ kind: 'text', runs: wrapped.map((text, i) => ({ text, x: wide ? textX : (w - assets.measureText(font, text, size)) / 2, baselineY: y + size + i * size * 1.32, fontId: font, fontSize: size, color })) })
    } }
  }
  const name = block(business.name.normalize('NFC').toUpperCase(), 'bodyBold', 13 * scale, 3, 'businessName')
  const displayHeadline = config.templateId !== 'simple' && !wide && config.language === 'en' && !config.headlineEdited && config.headline === copy.headline ? config.headline.replace(/ HERE$/, '\nHERE') : config.headline
  const headline = block(displayHeadline, ['classic-gold', 'modern-navy', 'wide-counter', 'soft-sage'].includes(config.templateId) ? 'heading' : 'bodyBold', (displayHeadline.includes('\nHERE') ? 25 : 21) * scale, config.language === 'bilingual' ? 4 : 2, 'headline', config.templateId === 'modern-navy' || wide ? palette.accent : palette.foreground)
  function instructionPanel() {
    if (!config.showInstructions) return null
    if (config.templateId === 'simple' || config.language === 'bilingual') {
      return block(copy.instructions.map((text, i) => `${i + 1}. ${text}`).join('\n'), 'body', 8 * scale, config.language === 'bilingual' ? 6 : 4, 'instructions')
    }
    const fontSize = 7 * scale
    const diameter = 22 * scale
    const columnWidth = textWidth / 3
    const wrapped = copy.instructions.map((text, i) => lines(`${i + 1}. ${text}`, 'body', fontSize, wide ? textWidth - diameter - 9 * scale : columnWidth - 5 * scale))
    const rowHeight = Math.max(diameter, ...wrapped.map(value => value.length * fontSize * 1.32)) + 7 * scale
    const height = wide ? rowHeight * 3 : diameter + 5 * scale + Math.max(...wrapped.map(value => value.length)) * fontSize * 1.32
    const circle = (x: number, y: number, radius: number, fill: string) => {
      const c = radius * .552285
      nodes.push({ kind: 'path', x, y, fill, d: `M ${radius} 0 C ${radius} ${c} ${c} ${radius} 0 ${radius} C ${-c} ${radius} ${-radius} ${c} ${-radius} 0 C ${-radius} ${-c} ${-c} ${-radius} 0 ${-radius} C ${c} ${-radius} ${radius} ${-c} ${radius} 0 Z` })
    }
    return { height, draw(y: number) {
      wrapped.forEach((textLines, index) => {
        const centerX = wide ? textX + diameter / 2 : textX + columnWidth * (index + .5)
        const centerY = y + diameter / 2 + (wide ? index * rowHeight : 0)
        const unit = diameter / 26
        const iconColor = palette.foreground
        // A subtle tinted medallion and fine accent rim, shared by SVG and PDF.
        const badgeFill = '#' + [1, 3, 5].map(offset => {
          const base = parseInt(palette.background.slice(offset, offset + 2), 16)
          const accent = parseInt(palette.accent.slice(offset, offset + 2), 16)
          return Math.round(base * .9 + accent * .1).toString(16).padStart(2, '0')
        }).join('')
        circle(centerX, centerY, diameter / 2, palette.accent)
        circle(centerX, centerY, diameter / 2 - .5 * scale, badgeFill)
        if (index === 0) {
          rect(centerX - 6 * unit, centerY - 4 * unit, 12 * unit, 8 * unit, iconColor)
          rect(centerX - 3 * unit, centerY - 6 * unit, 5 * unit, 3 * unit, iconColor)
          circle(centerX, centerY, 3 * unit, badgeFill)
          circle(centerX, centerY, 1.8 * unit, iconColor)
        } else if (index === 1) {
          rect(centerX - 4 * unit, centerY - 6 * unit, 8 * unit, 12 * unit, iconColor)
          rect(centerX - 2.7 * unit, centerY - 4.5 * unit, 5.4 * unit, 7 * unit, badgeFill)
          circle(centerX, centerY + 4.2 * unit, .8 * unit, badgeFill)
        } else {
          for (let row = 0; row < 3; row++) {
            rect(centerX - 5 * unit, centerY + (row * 3.5 - 4.5) * unit, 2 * unit, 2 * unit, iconColor)
            rect(centerX - 1.5 * unit, centerY + (row * 3.5 - 4) * unit, 6.5 * unit, 1 * unit, iconColor)
          }
        }
        nodes.push({kind:'text', runs: textLines.map((text, line) => ({text, fontId:'body', fontSize, color:palette.foreground,
          x: wide ? textX + diameter + 9 * scale : centerX - assets.measureText('body', text, fontSize) / 2,
          baselineY: wide ? centerY - textLines.length * fontSize * .66 + fontSize + line * fontSize * 1.32 : y + diameter + 5 * scale + fontSize + line * fontSize * 1.32 }))})
      })
    } }
  }
  const instruction = instructionPanel()
  const hoursText = config.language === 'bilingual' ? `${business.hoursByLanguage.en}\n${business.hoursByLanguage.vi}` : business.hoursByLanguage[config.language]
  const hours = config.showHours && hoursText.trim() ? block(hoursText, 'body', 7.5 * scale, 8, 'hours') : null
  const closing = block(config.closingText, 'body', 9 * scale, config.language === 'bilingual' ? 4 : 3, 'closingText', palette.accent)
  const url = config.showUrl ? block(business.checkInUrl, 'body', 7 * scale, 3, 'url') : null
  const gap = 7 * scale
  let y = margin + (config.templateId === 'minimal-clean' ? 8 * scale : 0)
  if (assets.images.logo) {
    const side = 29 * scale
    nodes.push({kind:'image',assetId:'logo',x:wide?textX:(w-side)/2,y,width:side,height:side})
    y += side + gap
  }
  name.draw(y); y += name.height + gap
  headline.draw(y); y += headline.height + gap
  const footer = [instruction,hours,closing,url].filter((item): item is NonNullable<typeof item> => !!item && item.height > 0)
  const footerHeight = footer.reduce((sum,item)=>sum+item.height+gap,0)
  const qrFooterGap = gap + (instruction ? 6 * scale : 0)
  const qrSize = wide ? 290 : Math.min(small?154:300, h - margin - y - footerHeight - qrFooterGap)
  if (qrSize < (small ? 108 : 180) || (wide && y + footerHeight > h - margin)) issues.push({code:'textOverflow',field:'layout'})
  let qr
  try { qr = QRCode.create(business.checkInUrl,{errorCorrectionLevel:'M'}) }
  catch { return {ok:false,issues:[{code:'invalidUrl'}]} }
  if (issues.length) return {ok:false,issues}
  const qrX = wide ? w*.55+(w*.45-margin-qrSize)/2 : (w-qrSize)/2
  const qrY = wide ? (h-qrSize)/2 : y
  if (config.templateId !== 'simple' && config.templateId !== 'minimal-clean') {
    rect(qrX-3,qrY-3,qrSize+6,qrSize+6,palette.accent)
    rect(qrX-2.5,qrY-2.5,qrSize+5,qrSize+5,'#ffffff')
  }
  rect(qrX,qrY,qrSize,qrSize,'#ffffff')
  const moduleSize = qrSize / (qr.modules.size+8)
  // Each module stays on the same point grid in SVG and PDF; four untouched white modules surround it.
  let d = ''
  for(let row=0;row<qr.modules.size;row++) for(let col=0;col<qr.modules.size;col++) if(qr.modules.get(row,col)) {
    const x=(col+4)*moduleSize; const yy=(row+4)*moduleSize
    d+=`M${x} ${yy}h${moduleSize}v${moduleSize}h${-moduleSize}z `
  }
  nodes.push({kind:'path',d,x:qrX,y:qrY,fill:'#000000'})
  if (!wide) y+=qrSize+qrFooterGap
  else y+=12*scale
  for(const item of footer){item.draw(y);y+=item.height+gap}
  // Center the composition in the available safe area, including the left column of the counter sign.
  const offset = config.templateId === 'simple' ? 0 : Math.max(0, (h - margin - y) / 2)
  for (const node of nodes.slice(contentStart)) {
    if (node.kind === 'text') for (const run of node.runs) run.baselineY += offset
    else if (!wide || node.x < w * .5) node.y += offset
  }
  return {ok:true,document:{widthPt:w,heightPt:h,nodes,qrUrl:business.checkInUrl,assetIds:assets.images.logo?['logo']:[]}}
}
