/** Lightweight CSV / XLSX inspection for customer import (row count, sheets, headers). No SheetJS. */

export type CustomerImportFormat = 'xlsx' | 'csv'

export type CustomerImportFileInfo = {
  format: CustomerImportFormat
  rowCount: number
  sheetCount: number
  sheetNames: string[]
  /** Header labels detected from the first sheet / CSV table (row 1). */
  headers: string[]
  hasPhoneColumn: boolean
}

export const CUSTOMER_IMPORT_MAX_ROWS = 5000
export const CUSTOMER_IMPORT_MAX_BYTES = 5 * 1024 * 1024

const ZIP_LOCAL_SIGNATURE = 0x04034b50

/** Normalized header tokens that indicate a phone column. */
const PHONE_HEADER_PATTERN = /(?:^|[^a-z0-9])(?:phone|mobile|cellphone|cell|telephone|tel|phonenumber|mobilenumber|sdt|sodienthoai|so_dien_thoai|dien_thoai|dienthoai)(?:[^a-z0-9]|$)/i

async function inflateRaw(bytes: Uint8Array): Promise<Uint8Array> {
  if (typeof DecompressionStream === 'undefined') {
    throw new Error('deflate_unsupported')
  }
  const copy = new Uint8Array(bytes.byteLength)
  copy.set(bytes)
  const stream = new Blob([copy]).stream().pipeThrough(new DecompressionStream('deflate-raw'))
  return new Uint8Array(await new Response(stream).arrayBuffer())
}

function readUint16LE(view: DataView, offset: number): number {
  return view.getUint16(offset, true)
}

function readUint32LE(view: DataView, offset: number): number {
  return view.getUint32(offset, true)
}

function decodeUtf8(bytes: Uint8Array): string {
  return new TextDecoder('utf-8').decode(bytes)
}

/** Read named entries from a ZIP ArrayBuffer (stored or deflate). */
async function readZipEntries(
  buffer: ArrayBuffer,
  wanted: ReadonlySet<string>,
): Promise<Map<string, Uint8Array>> {
  const view = new DataView(buffer)
  const bytes = new Uint8Array(buffer)
  const found = new Map<string, Uint8Array>()
  let offset = 0

  while (offset + 30 <= buffer.byteLength && found.size < wanted.size) {
    if (readUint32LE(view, offset) !== ZIP_LOCAL_SIGNATURE) break

    const compression = readUint16LE(view, offset + 8)
    const compressedSize = readUint32LE(view, offset + 18)
    const nameLength = readUint16LE(view, offset + 26)
    const extraLength = readUint16LE(view, offset + 28)
    const nameStart = offset + 30
    const nameEnd = nameStart + nameLength
    const dataStart = nameEnd + extraLength
    const dataEnd = dataStart + compressedSize
    if (dataEnd > buffer.byteLength) break

    const name = decodeUtf8(bytes.subarray(nameStart, nameEnd))
    if (wanted.has(name)) {
      const payload = bytes.subarray(dataStart, dataEnd)
      if (compression === 0) {
        found.set(name, payload.slice())
      } else if (compression === 8) {
        found.set(name, await inflateRaw(payload))
      } else {
        throw new Error('zip_compression_unsupported')
      }
    }

    offset = dataEnd
  }

  return found
}

function parseSheetNames(workbookXml: string): string[] {
  const names: string[] = []
  const sheetTag = /<sheet\b[^>]*>/gi
  let match: RegExpExecArray | null
  while ((match = sheetTag.exec(workbookXml))) {
    const nameMatch = /\bname="([^"]+)"/i.exec(match[0])
    if (nameMatch?.[1]) names.push(nameMatch[1])
  }
  return names
}

function parseWorksheetRowCount(sheetXml: string): number {
  const dimension = /<dimension\b[^>]*\bref="[^"]*:([A-Z]+)(\d+)"/i.exec(sheetXml)
  if (dimension?.[2]) {
    const fromDimension = Number(dimension[2])
    if (Number.isFinite(fromDimension) && fromDimension > 0) return fromDimension
  }

  let maxRow = 0
  const rowAttr = /<row\b[^>]*\br="(\d+)"/gi
  let rowMatch: RegExpExecArray | null
  while ((rowMatch = rowAttr.exec(sheetXml))) {
    const row = Number(rowMatch[1])
    if (row > maxRow) maxRow = row
  }
  if (maxRow > 0) return maxRow

  const openRows = sheetXml.match(/<row\b/gi)
  return openRows?.length ?? 0
}

function parseSharedStrings(sharedXml: string): string[] {
  const values: string[] = []
  const siBlocks = sharedXml.match(/<si\b[^>]*>[\s\S]*?<\/si>/gi) ?? []
  for (const block of siBlocks) {
    const parts = [...block.matchAll(/<t\b[^>]*>([^<]*)<\/t>/gi)].map((m) => m[1] ?? '')
    values.push(parts.join(''))
  }
  return values
}

function columnIndexFromRef(cellRef: string): number {
  const letters = /^([A-Z]+)/i.exec(cellRef)?.[1]?.toUpperCase()
  if (!letters) return Number.MAX_SAFE_INTEGER
  let index = 0
  for (let i = 0; i < letters.length; i += 1) {
    index = index * 26 + (letters.charCodeAt(i) - 64)
  }
  return index - 1
}

function parseWorksheetHeaderRow(
  sheetXml: string,
  sharedStrings: string[],
  rowNumber = 1,
): string[] {
  const rowPattern = new RegExp(`<row\\b[^>]*\\br="${rowNumber}"[^>]*>([\\s\\S]*?)<\\/row>`, 'i')
  const rowMatch = rowPattern.exec(sheetXml)
    ?? (rowNumber === 1 ? /<row\b[^>]*>([\s\S]*?)<\/row>/i.exec(sheetXml) : null)
  if (!rowMatch?.[1]) return []

  const cells: Array<{ index: number; value: string }> = []
  const cellTag = /<c\b([^>]*)>([\s\S]*?)<\/c>|<c\b([^>]*)\/>/gi
  let cellMatch: RegExpExecArray | null
  while ((cellMatch = cellTag.exec(rowMatch[1]))) {
    const attrs = cellMatch[1] ?? cellMatch[3] ?? ''
    const body = cellMatch[2] ?? ''
    const ref = /\br="([A-Z]+\d+)"/i.exec(attrs)?.[1] ?? ''
    const type = /\bt="([^"]+)"/i.exec(attrs)?.[1] ?? ''
    let value = ''

    if (type === 'inlineStr') {
      const parts = [...body.matchAll(/<t\b[^>]*>([^<]*)<\/t>/gi)].map((m) => m[1] ?? '')
      value = parts.join('')
    } else if (type === 's') {
      const idx = Number(/<v\b[^>]*>([^<]*)<\/v>/i.exec(body)?.[1] ?? '')
      value = Number.isFinite(idx) ? (sharedStrings[idx] ?? '') : ''
    } else {
      const inline = [...body.matchAll(/<t\b[^>]*>([^<]*)<\/t>/gi)].map((m) => m[1] ?? '')
      if (inline.length) value = inline.join('')
      else value = /<v\b[^>]*>([^<]*)<\/v>/i.exec(body)?.[1] ?? ''
    }

    cells.push({ index: columnIndexFromRef(ref), value: value.trim() })
  }

  cells.sort((a, b) => a.index - b.index)
  return cells.map((cell) => cell.value).filter(Boolean)
}

/** Scan the first few rows because header may not be on row 1. */
function parseWorksheetCandidateHeaders(sheetXml: string, sharedStrings: string[]): string[] {
  const headers: string[] = []
  for (let row = 1; row <= 4; row += 1) {
    headers.push(...parseWorksheetHeaderRow(sheetXml, sharedStrings, row))
  }
  return headers
}

function normalizeHeader(value: string): string {
  return value
    .replace(/đ/gi, 'd')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
}

export function headerLooksLikePhone(header: string): boolean {
  const raw = header.trim()
  if (!raw) return false
  if (PHONE_HEADER_PATTERN.test(raw)) return true
  const normalized = normalizeHeader(raw)
  return (
    normalized === 'phone'
    || normalized === 'mobile'
    || normalized === 'cellphone'
    || normalized === 'cell'
    || normalized === 'tel'
    || normalized === 'telephone'
    || normalized === 'phonenumber'
    || normalized === 'mobilenumber'
    || normalized === 'sdt'
    || normalized === 'sodienthoai'
    || normalized === 'dienthoai'
  )
}

export function headersIncludePhoneColumn(headers: readonly string[]): boolean {
  return headers.some(headerLooksLikePhone)
}

function parseCsvHeaders(text: string): string[] {
  const normalized = text.replace(/^\uFEFF/, '')
  if (!normalized.trim()) return []

  let line = ''
  let inQuotes = false
  for (let i = 0; i < normalized.length; i += 1) {
    const ch = normalized[i]
    if (ch === '"') {
      if (inQuotes && normalized[i + 1] === '"') {
        line += '"'
        i += 1
      } else {
        inQuotes = !inQuotes
      }
      continue
    }
    if (!inQuotes && (ch === '\n' || ch === '\r')) break
    line += ch
  }

  const headers: string[] = []
  let current = ''
  inQuotes = false
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i += 1
      } else {
        inQuotes = !inQuotes
      }
      continue
    }
    if (!inQuotes && ch === ',') {
      headers.push(current.trim())
      current = ''
      continue
    }
    current += ch
  }
  headers.push(current.trim())
  return headers.filter(Boolean)
}

function countCsvRows(text: string): number {
  if (!text) return 0
  const normalized = text.replace(/^\uFEFF/, '')
  if (!normalized.trim()) return 0

  let rows = 0
  let inQuotes = false
  for (let i = 0; i < normalized.length; i += 1) {
    const ch = normalized[i]
    if (ch === '"') {
      if (inQuotes && normalized[i + 1] === '"') {
        i += 1
      } else {
        inQuotes = !inQuotes
      }
      continue
    }
    if (!inQuotes && (ch === '\n' || ch === '\r')) {
      rows += 1
      if (ch === '\r' && normalized[i + 1] === '\n') i += 1
    }
  }
  const endsWithBreak = /[\r\n]$/.test(normalized)
  if (!endsWithBreak) rows += 1
  return rows
}

async function inspectXlsx(file: File): Promise<CustomerImportFileInfo> {
  const buffer = await file.arrayBuffer()
  const entries = await readZipEntries(
    buffer,
    new Set([
      'xl/workbook.xml',
      'xl/worksheets/sheet1.xml',
      'xl/sharedStrings.xml',
    ]),
  )

  const workbookBytes = entries.get('xl/workbook.xml')
  if (!workbookBytes) throw new Error('xlsx_workbook_missing')

  const sheetNames = parseSheetNames(decodeUtf8(workbookBytes))
  const sheetCount = Math.max(sheetNames.length, 1)

  const sheet1 = entries.get('xl/worksheets/sheet1.xml')
  if (!sheet1) throw new Error('xlsx_sheet_missing')

  const sheetXml = decodeUtf8(sheet1)
  const sharedBytes = entries.get('xl/sharedStrings.xml')
  const sharedStrings = sharedBytes ? parseSharedStrings(decodeUtf8(sharedBytes)) : []
  const headers = parseWorksheetCandidateHeaders(sheetXml, sharedStrings)
  const rowCount = parseWorksheetRowCount(sheetXml)

  return {
    format: 'xlsx',
    rowCount,
    sheetCount,
    sheetNames: sheetNames.length > 0 ? sheetNames : ['Sheet1'],
    headers,
    hasPhoneColumn: headersIncludePhoneColumn(headers),
  }
}

async function inspectCsv(file: File): Promise<CustomerImportFileInfo> {
  const text = await file.text()
  const headers = parseCsvHeaders(text)
  return {
    format: 'csv',
    rowCount: countCsvRows(text),
    sheetCount: 1,
    sheetNames: ['CSV Data'],
    headers,
    hasPhoneColumn: headersIncludePhoneColumn(headers),
  }
}

export async function inspectCustomerImportFile(
  file: File,
  format: CustomerImportFormat,
): Promise<CustomerImportFileInfo> {
  return format === 'csv' ? inspectCsv(file) : inspectXlsx(file)
}

export function formatImportRowCount(count: number, language: string): string {
  try {
    return new Intl.NumberFormat(language === 'vi' ? 'vi-VN' : 'en-US').format(count)
  } catch {
    return String(count)
  }
}
