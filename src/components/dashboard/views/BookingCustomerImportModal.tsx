import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Upload } from 'lucide-react'
import { useTranslation } from '../../../contexts/LanguageContext'
import { getErrorMessage } from '../../../data/errorCodes'
import {
  usePosCustomerImport,
  usePosCustomerImportPreview,
} from '../../../data/hooks/usePosCustomers'
import type {
  PosCustomerImportColumnDto,
  PosCustomerImportPreviewDto,
  PosCustomerImportResultDto,
  PosCustomerImportSkipCode,
  PosCustomerImportSuggestedMappingDto,
} from '../../../types/repositories'
import Skeleton from '../../ui/skeleton/Skeleton'
import { CheckLgIcon, SpinnerIcon, XLgIcon } from './BookingHubIcons'
import {
  CUSTOMER_IMPORT_MAX_BYTES,
  formatImportRowCount,
  headerLooksLikeCreated,
  headerLooksLikeDob,
  headerLooksLikeEmail,
  headerLooksLikeLastVisit,
  headerLooksLikePhone,
  suggestCustomerImportMappingFromHeaders,
} from './customerImportFile'
import './booking-hub.css'

const TK = 'components.dashboard.views.BookingHubView.customers.import'

type ImportStep = 1 | 2 | 3
type MappingTarget = 'name' | 'phone' | 'email' | 'dob' | 'created' | 'lastVisit'

type SelectedFileInfo = {
  file: File
  name: string
  format: 'xlsx' | 'csv'
  sizeLabel: string
}

const MAPPING_TARGETS: ReadonlyArray<{ target: MappingTarget; labelKey: string; required?: boolean }> = [
  { target: 'name', labelKey: 'fields.name' },
  { target: 'phone', labelKey: 'fields.phone', required: true },
  { target: 'email', labelKey: 'fields.email' },
  { target: 'dob', labelKey: 'fields.dob' },
  { target: 'created', labelKey: 'fields.created' },
  { target: 'lastVisit', labelKey: 'fields.lastVisit' },
]

const EMPTY_MAPPING: Record<MappingTarget, string> = {
  name: '',
  phone: '',
  email: '',
  dob: '',
  created: '',
  lastVisit: '',
}

function detectFormat(fileName: string): 'xlsx' | 'csv' | null {
  const lower = fileName.toLowerCase()
  if (lower.endsWith('.csv')) return 'csv'
  if (lower.endsWith('.xlsx')) return 'xlsx'
  return null
}

function formatFileSize(bytes: number, language: string): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) {
    return `${formatImportRowCount(Math.round(bytes / 1024), language)} KB`
  }
  const mb = bytes / (1024 * 1024)
  const formatted = language === 'vi'
    ? mb.toFixed(1).replace('.', ',')
    : mb.toFixed(1)
  return `${formatted} MB`
}

function indexToSelectValue(index?: number | null): string {
  return index != null && index > 0 ? String(index) : ''
}

function selectValueToIndex(value: string): number | null {
  if (!value) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null
}

function mappingFromSuggested(
  suggested: PosCustomerImportSuggestedMappingDto | undefined,
  columns: PosCustomerImportColumnDto[] = [],
): Record<MappingTarget, string> {
  const fromBackend: Record<MappingTarget, string> = {
    name: indexToSelectValue(suggested?.customerNameColumnIndex),
    phone: indexToSelectValue(suggested?.phoneNumberColumnIndex),
    email: indexToSelectValue(suggested?.emailColumnIndex),
    dob: indexToSelectValue(suggested?.dateOfBirthColumnIndex),
    created: indexToSelectValue(suggested?.regisDateColumnIndex),
    lastVisit: indexToSelectValue(suggested?.lastVisitColumnIndex),
  }

  const reserved = new Set(
    Object.values(fromBackend)
      .map((value) => selectValueToIndex(value))
      .filter((index): index is number => index != null),
  )
  const fromFrontend = suggestCustomerImportMappingFromHeaders(columns, reserved)

  return {
    name: fromBackend.name || indexToSelectValue(fromFrontend.name),
    phone: fromBackend.phone || indexToSelectValue(fromFrontend.phone),
    email: fromBackend.email || indexToSelectValue(fromFrontend.email),
    dob: fromBackend.dob || indexToSelectValue(fromFrontend.dob),
    created: fromBackend.created || indexToSelectValue(fromFrontend.created),
    lastVisit: fromBackend.lastVisit || indexToSelectValue(fromFrontend.lastVisit),
  }
}

function buildPreviewRows(columns: PosCustomerImportColumnDto[], headerRow: number) {
  const sampleCount = Math.max(0, ...columns.map((column) => column.sampleValues?.length ?? 0))
  return Array.from({ length: sampleCount }, (_, sampleIndex) => ({
    index: headerRow + 1 + sampleIndex,
    cells: columns.map((column) => column.sampleValues?.[sampleIndex] ?? ''),
    warnings: columns.map((column) => {
      const value = (column.sampleValues?.[sampleIndex] ?? '').trim()
      if (!value) return false
      return previewCellLooksRisky(column.header, value)
    }),
  }))
}

/** Lightweight FE hint only — backend still re-validates the full file. */
function previewCellLooksRisky(header: string, value: string): boolean {
  const headerLower = header.toLowerCase()

  if (
    headerLooksLikeEmail(header)
    || headerLower.includes('email')
    || /(^|[^a-z])mail([^a-z]|$)/i.test(header)
  ) {
    if (!value.includes('@')) return true
    if (value.includes('@') && !value.includes('.')) return true
  }

  if (
    headerLooksLikeDob(header)
    || headerLooksLikeCreated(header)
    || headerLooksLikeLastVisit(header)
    || /birth|birthday|dob|created|registered|visit|seen|date/.test(headerLower)
  ) {
    if (/\d{1,2}\/\d{1,2}\/\d{2,4}/.test(value)) return true
  }

  if (
    headerLooksLikePhone(header)
    || /phone|mobile|contact|sdt|tel/.test(headerLower)
  ) {
    const digits = value.replace(/\D/g, '')
    if (digits.length < 7) return true
    if (/[a-z]/i.test(value)) return true
  }

  return false
}

function skipStatusTone(code: PosCustomerImportSkipCode): 'warning' | 'danger' {
  if (code === 'ROW_DUPLICATE_IN_FILE' || code === 'ROW_DUPLICATE_IN_BUSINESS') return 'warning'
  return 'danger'
}

function ImportPreviewSkeleton() {
  return (
    <div className="cust-import-mapping-layout" aria-busy="true">
      <div className="cust-import-mapping-panel">
        <Skeleton height={18} width="55%" style={{ marginBottom: 10 }} />
        <Skeleton height={12} width="80%" style={{ marginBottom: 16 }} />
        {Array.from({ length: 6 }, (_, index) => (
          <Skeleton key={index} height={36} style={{ marginBottom: 9, borderRadius: 10 }} />
        ))}
      </div>
      <div className="cust-import-preview-panel" style={{ padding: 16 }}>
        <Skeleton height={18} width="40%" style={{ marginBottom: 10 }} />
        <Skeleton height={12} width="70%" style={{ marginBottom: 16 }} />
        <Skeleton height={180} style={{ borderRadius: 12 }} />
      </div>
    </div>
  )
}

function ImportResultSkeleton() {
  return (
    <div style={{ padding: 24 }} aria-busy="true">
      <Skeleton height={60} width={60} circle style={{ margin: '0 auto 16px' }} />
      <Skeleton height={20} width="40%" style={{ margin: '0 auto 10px' }} />
      <Skeleton height={14} width="60%" style={{ margin: '0 auto 24px' }} />
      <div className="cust-import-stats">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} height={72} style={{ borderRadius: 13 }} />
        ))}
      </div>
    </div>
  )
}

export default function BookingCustomerImportModal({
  businessId,
  onClose,
  onComplete,
}: {
  businessId: string
  onClose: () => void
  onComplete?: () => void
}) {
  const { t, currentLanguage } = useTranslation()
  const titleId = useId()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const modalBodyRef = useRef<HTMLDivElement>(null)
  const previewRequestRef = useRef(0)
  const [step, setStep] = useState<ImportStep>(1)
  const [selectedFile, setSelectedFile] = useState<SelectedFileInfo | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [preview, setPreview] = useState<PosCustomerImportPreviewDto | null>(null)
  const [importResult, setImportResult] = useState<PosCustomerImportResultDto | null>(null)
  const [mapping, setMapping] = useState<Record<MappingTarget, string>>(EMPTY_MAPPING)
  const [sheet, setSheet] = useState('')
  const [headerRow, setHeaderRow] = useState('1')
  const [reloadVisible, setReloadVisible] = useState(false)
  const [toastVisible, setToastVisible] = useState(false)
  const reloadTimerRef = useRef<number | null>(null)
  const toastTimerRef = useRef<number | null>(null)

  const previewMutation = usePosCustomerImportPreview(businessId)
  const importMutation = usePosCustomerImport(businessId)

  const phoneMapped = Boolean(mapping.phone)
  const mappedSourceValues = useMemo(
    () => Object.values(mapping).filter(Boolean),
    [mapping],
  )
  const usedColumns = useMemo(() => new Set(mappedSourceValues), [mappedSourceValues])
  const hasDuplicateMapping = useMemo(() => {
    const seen = new Set<string>()
    for (const value of mappedSourceValues) {
      if (seen.has(value)) return true
      seen.add(value)
    }
    return false
  }, [mappedSourceValues])
  const mappingReady = phoneMapped && !hasDuplicateMapping

  const columns = preview?.columns ?? []
  const headerRowNumber = Number(headerRow) || preview?.headerRow || 1
  const previewRows = useMemo(
    () => buildPreviewRows(columns, headerRowNumber),
    [columns, headerRowNumber],
  )
  const sheets = preview?.sheetNames?.length
    ? preview.sheetNames
    : selectedFile?.format === 'csv'
      ? ['Sheet1']
      : []

  const suggestedCount = Object.values(mapping).filter(Boolean).length
  const isPreviewLoading = previewMutation.isPending
  const isImporting = importMutation.isPending

  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null
    return () => previousFocus?.focus()
  }, [])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isImporting) {
        event.stopPropagation()
        onClose()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onClose, isImporting])

  useEffect(() => () => {
    if (reloadTimerRef.current) window.clearTimeout(reloadTimerRef.current)
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current)
  }, [])

  const goToStep = (next: ImportStep) => {
    setStep(next)
    modalBodyRef.current?.scrollTo({ top: 0 })
  }

  const clearFile = () => {
    previewRequestRef.current += 1
    setSelectedFile(null)
    setUploadError(null)
    setPreview(null)
    setImportResult(null)
    setMapping(EMPTY_MAPPING)
    setSheet('')
    setHeaderRow('1')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const flashReload = () => {
    setReloadVisible(true)
    if (reloadTimerRef.current) window.clearTimeout(reloadTimerRef.current)
    reloadTimerRef.current = window.setTimeout(() => setReloadVisible(false), 1600)
  }

  const applyPreview = (nextPreview: PosCustomerImportPreviewDto, options?: { flash?: boolean }) => {
    setPreview(nextPreview)
    setSheet(nextPreview.selectedSheetName)
    setHeaderRow(String(nextPreview.headerRow || 1))
    setMapping(mappingFromSuggested(nextPreview.suggestedMapping, nextPreview.columns))
    setUploadError(null)
    if (options?.flash) flashReload()
  }

  const runPreview = async (
    fileInfo: SelectedFileInfo,
    options?: { sheetName?: string; headerRow?: number; flash?: boolean; advanceToMapping?: boolean },
  ) => {
    const requestId = previewRequestRef.current + 1
    previewRequestRef.current = requestId
    setUploadError(null)

    try {
      const nextPreview = await previewMutation.mutateAsync({
        file: fileInfo.file,
        sheetName: options?.sheetName,
        headerRow: options?.headerRow,
      })
      if (previewRequestRef.current !== requestId) return
      applyPreview(nextPreview, { flash: options?.flash })
      if (options?.advanceToMapping) goToStep(2)
    } catch (error) {
      if (previewRequestRef.current !== requestId) return
      setSelectedFile(null)
      setPreview(null)
      setMapping(EMPTY_MAPPING)
      setSheet('')
      setHeaderRow('1')
      if (fileInputRef.current) fileInputRef.current.value = ''
      setUploadError(getErrorMessage(
        error,
        t,
        'ERROR',
        t(`${TK}.errors.readFailed`, { name: fileInfo.name }),
      ))
    }
  }

  const validateAndPreviewFile = async (file: File) => {
    const format = detectFormat(file.name)
    if (!format) {
      clearFile()
      setUploadError(t(`${TK}.errors.unsupportedType`, { name: file.name }))
      return
    }
    if (file.size > CUSTOMER_IMPORT_MAX_BYTES) {
      clearFile()
      setUploadError(t(`${TK}.errors.tooLarge`, { name: file.name }))
      return
    }

    const nextFile: SelectedFileInfo = {
      file,
      name: file.name,
      format,
      sizeLabel: formatFileSize(file.size, currentLanguage),
    }
    setSelectedFile(nextFile)
    setImportResult(null)
    setPreview(null)
    await runPreview(nextFile)
  }

  const resetFlow = () => {
    clearFile()
    goToStep(1)
  }

  const updateMapping = (target: MappingTarget, value: string) => {
    setMapping((prev) => {
      const next: Record<MappingTarget, string> = { ...prev, [target]: value }
      if (value) {
        for (const key of Object.keys(next) as MappingTarget[]) {
          if (key !== target && next[key] === value) next[key] = ''
        }
      }
      return next
    })
  }

  const handleSheetChange = async (nextSheet: string) => {
    if (!selectedFile || nextSheet === sheet) return
    setSheet(nextSheet)
    await runPreview(selectedFile, {
      sheetName: nextSheet,
      headerRow: Number(headerRow) || undefined,
      flash: true,
    })
  }

  const handleHeaderRowChange = async (nextHeaderRow: string) => {
    if (!selectedFile || nextHeaderRow === headerRow) return
    setHeaderRow(nextHeaderRow)
    await runPreview(selectedFile, {
      sheetName: sheet || undefined,
      headerRow: Number(nextHeaderRow) || 1,
      flash: true,
    })
  }

  const handlePrimary = async () => {
    if (step === 1 && selectedFile && preview && !isPreviewLoading) {
      goToStep(2)
      return
    }
    if (step === 2 && selectedFile && mappingReady && !isImporting) {
      const phoneNumberColumnIndex = selectValueToIndex(mapping.phone)
      if (!phoneNumberColumnIndex) return
      setImportResult(null)
      goToStep(3)
      try {
        const result = await importMutation.mutateAsync({
          file: selectedFile.file,
          sheetName: sheet || preview?.selectedSheetName || 'Sheet1',
          headerRow: Number(headerRow) || preview?.headerRow || 1,
          phoneNumberColumnIndex,
          customerNameColumnIndex: selectValueToIndex(mapping.name),
          emailColumnIndex: selectValueToIndex(mapping.email),
          dateOfBirthColumnIndex: selectValueToIndex(mapping.dob),
          regisDateColumnIndex: selectValueToIndex(mapping.created),
          lastVisitColumnIndex: selectValueToIndex(mapping.lastVisit),
        })
        setImportResult(result)
      } catch (error) {
        setUploadError(getErrorMessage(
          error,
          t,
          'ERROR',
          t(`${TK}.errors.importFailed`),
        ))
        goToStep(1)
      }
      return
    }
    if (step === 3) {
      onComplete?.()
      onClose()
    }
  }

  const downloadSkippedCsv = () => {
    if (!importResult?.skippedRows.length) return
    const rows = [
      ['Row', 'Phone', 'Code', 'Message'],
      ...importResult.skippedRows.map((row) => [
        String(row.rowNumber),
        row.phone ?? '',
        row.code,
        row.message,
      ]),
    ]
    const csv = rows
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n')
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'customer-import-skipped-rows.csv'
    document.body.append(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
    setToastVisible(true)
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current)
    toastTimerRef.current = window.setTimeout(() => setToastVisible(false), 2200)
  }

  const primaryDisabled = (
    (step === 1 && (!selectedFile || !preview || isPreviewLoading))
    || (step === 2 && (!mappingReady || isImporting))
    || (step === 3 && (isImporting || !importResult))
  )
  const primaryLabel = step === 1
    ? t(`${TK}.actions.continue`)
    : step === 2
      ? t(`${TK}.actions.import`)
      : (isImporting ? t(`${TK}.actions.importing`) : t(`${TK}.actions.done`))

  const footerHint = step === 1
    ? t(`${TK}.footer.step1`)
    : step === 2
      ? (mappingReady ? t(`${TK}.footer.step2Ready`) : t(`${TK}.footer.step2`))
      : (isImporting || !importResult
        ? t(`${TK}.actions.importing`)
        : importResult.importedCount > 0
          ? t(`${TK}.footer.step3`, {
            count: formatImportRowCount(importResult.importedCount, currentLanguage),
          })
          : t(`${TK}.footer.step3None`))

  const stepDescription = step === 1
    ? t(`${TK}.steps.upload.note`)
    : step === 2
      ? t(`${TK}.steps.mapping.note`)
      : t(`${TK}.steps.result.note`)

  const fileMeta = selectedFile
    ? selectedFile.format === 'csv'
      ? t(`${TK}.fileMeta.csvReady`, { size: selectedFile.sizeLabel })
      : t(`${TK}.fileMeta.xlsxReady`, { size: selectedFile.sizeLabel })
    : ''

  const mappingFileMeta = selectedFile
    ? selectedFile.format === 'csv'
      ? t(`${TK}.mapping.fileMetaCsvSimple`)
      : t(`${TK}.mapping.fileMetaXlsxSimple`, { sheets: sheets.length || 1 })
    : ''

  const skippedCount = (importResult?.skippedDuplicateCount ?? 0) + (importResult?.skippedInvalidCount ?? 0)

  const skipCodeLabel = (code: PosCustomerImportSkipCode) => {
    const key = `${TK}.skipped.codes.${code}`
    const translated = t(key)
    return translated === key ? code : translated
  }

  return createPortal(
    <div className="booking-hub-view customer-modal-scope">
      <div className="cust-import-overlay" role="presentation">
        <section
          className="cust-import-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
        >
          <header className="cust-import-header">
            <div className="cust-import-title-row">
              <div>
                <p className="cust-import-kicker">
                  {t(`${TK}.kicker`)}
                </p>
                <h2 id={titleId} className="cust-import-title">{t(`${TK}.title`)}</h2>
                <p className="cust-import-note">{stepDescription}</p>
              </div>
              <button
                className="booking-mini-button cust-import-close"
                type="button"
                aria-label={t(`${TK}.actions.close`)}
                onClick={onClose}
                disabled={isImporting}
              >
                <XLgIcon />
              </button>
            </div>

            <div className="cust-import-stepper" aria-label={t(`${TK}.stepperAria`)}>
              {([1, 2, 3] as const).map((indicator) => {
                const label = indicator === 1
                  ? t(`${TK}.steps.upload.label`)
                  : indicator === 2
                    ? t(`${TK}.steps.mapping.label`)
                    : t(`${TK}.steps.result.label`)
                return (
                  <div
                    key={indicator}
                    className={`cust-import-step ${indicator === step ? 'is-active' : ''} ${indicator < step ? 'is-complete' : ''}`}
                  >
                    <span className="cust-import-step-dot">
                      {indicator < step ? <CheckLgIcon /> : indicator}
                    </span>
                    <span className="cust-import-step-label">{label}</span>
                  </div>
                )
              })}
            </div>
          </header>

          <div className="cust-import-body" ref={modalBodyRef} aria-live="polite">
            {step === 1 ? (
              <div className="cust-import-upload-grid">
                <div
                  className="cust-import-dropzone"
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => {
                    event.preventDefault()
                    const file = event.dataTransfer.files?.[0]
                    if (file) void validateAndPreviewFile(file)
                  }}
                >
                  <div className="cust-import-upload-symbol" aria-hidden="true">
                    <Upload />
                  </div>
                  <h3>{t(`${TK}.upload.heading`)}</h3>
                  <p>{t(`${TK}.upload.description`)}</p>
                  <div className="cust-import-upload-actions">
                    <button
                      className="booking-primary-button"
                      type="button"
                      disabled={isPreviewLoading}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {isPreviewLoading ? (
                        <>
                          <SpinnerIcon className="booking-inline-spinner" />
                          <span>{t(`${TK}.upload.inspecting`)}</span>
                        </>
                      ) : (
                        t(`${TK}.upload.chooseFile`)
                      )}
                    </button>
                  </div>
                  <input
                    ref={fileInputRef}
                    className="cust-import-hidden-input"
                    type="file"
                    accept=".xlsx,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
                    onChange={(event) => {
                      const file = event.target.files?.[0]
                      if (file) void validateAndPreviewFile(file)
                    }}
                  />
                  {selectedFile && !uploadError ? (
                    <div className="cust-import-selected-file">
                      <span className="cust-import-file-symbol">
                        {selectedFile.format === 'csv' ? 'CSV' : 'X'}
                      </span>
                      <div className="cust-import-file-info">
                        <strong>{selectedFile.name}</strong>
                        <span>
                          {isPreviewLoading
                            ? t(`${TK}.upload.inspecting`)
                            : preview
                              ? fileMeta
                              : selectedFile.sizeLabel}
                        </span>
                      </div>
                      <button
                        className="cust-import-remove-file"
                        type="button"
                        aria-label={t(`${TK}.upload.removeFile`)}
                        onClick={clearFile}
                        disabled={isPreviewLoading}
                      >
                        ×
                      </button>
                    </div>
                  ) : null}
                  {isPreviewLoading ? (
                    <div style={{ width: '100%', marginTop: 16 }}>
                      <Skeleton height={14} width="70%" style={{ margin: '0 auto 8px' }} />
                      <Skeleton height={14} width="55%" style={{ margin: '0 auto' }} />
                    </div>
                  ) : null}
                  {uploadError && !isPreviewLoading ? (
                    <div className="cust-import-error" role="alert">
                      <span>!</span>
                      <span>{uploadError}</span>
                    </div>
                  ) : null}
                </div>

                <aside className="cust-import-requirements">
                  <h3>{t(`${TK}.requirements.title`)}</h3>
                  <ul>
                    <li><span className="cust-import-check">✓</span><span>{t(`${TK}.requirements.format`)}</span></li>
                    <li><span className="cust-import-check">✓</span><span>{t(`${TK}.requirements.size`)}</span></li>
                    <li><span className="cust-import-check">✓</span><span>{t(`${TK}.requirements.phone`)}</span></li>
                    <li><span className="cust-import-check">✓</span><span>{t(`${TK}.requirements.sheet`)}</span></li>
                    <li><span className="cust-import-check">✓</span><span>{t(`${TK}.requirements.unmapped`)}</span></li>
                  </ul>
                  <div className="cust-import-privacy">
                    <strong>{t(`${TK}.privacy.title`)}</strong>
                    <br />
                    {t(`${TK}.privacy.body`)}
                  </div>
                </aside>
              </div>
            ) : null}

            {step === 2 && selectedFile ? (
              isPreviewLoading || !preview ? (
                <ImportPreviewSkeleton />
              ) : (
                <>
                  <div className="cust-import-mapping-topbar">
                    <div className="cust-import-file-context">
                      <span className="cust-import-file-symbol">
                        {selectedFile.format === 'csv' ? 'CSV' : 'X'}
                      </span>
                      <div>
                        <strong>{selectedFile.name}</strong>
                        <span>{mappingFileMeta}</span>
                      </div>
                    </div>
                    <label className="cust-import-field">
                      <span>{t(`${TK}.mapping.sheet`)}</span>
                      <select
                        className="cust-import-select"
                        value={sheet}
                        disabled={selectedFile.format === 'csv' || sheets.length <= 1 || isPreviewLoading}
                        onChange={(event) => {
                          void handleSheetChange(event.target.value)
                        }}
                      >
                        {sheets.map((name) => (
                          <option key={name} value={name}>{name}</option>
                        ))}
                      </select>
                    </label>
                    <label className="cust-import-field">
                      <span>{t(`${TK}.mapping.headerRow`)}</span>
                      <select
                        className="cust-import-select"
                        value={headerRow}
                        disabled={isPreviewLoading}
                        onChange={(event) => {
                          void handleHeaderRowChange(event.target.value)
                        }}
                      >
                        {[1, 2, 3, 4].map((row) => (
                          <option key={row} value={String(row)}>
                            {t(`${TK}.mapping.headerRowOption`, { row })}
                          </option>
                        ))}
                      </select>
                    </label>
                    <span className={`cust-import-reload ${reloadVisible ? 'is-visible' : ''}`}>
                      {t(`${TK}.mapping.reloaded`)}
                    </span>
                  </div>

                  <div className="cust-import-mapping-layout">
                    <div className="cust-import-mapping-panel">
                      <div className="cust-import-section-heading">
                        <div>
                          <h3>{t(`${TK}.mapping.heading`)}</h3>
                          <p>
                            {selectedFile.format === 'csv'
                              ? t(`${TK}.mapping.subCsv`)
                              : t(`${TK}.mapping.subXlsx`)}
                          </p>
                        </div>
                        <span className="cust-import-badge is-success">
                          {t(`${TK}.mapping.suggested`, { count: suggestedCount, total: 6 })}
                        </span>
                      </div>

                      <div className="cust-import-mapping-list">
                        {MAPPING_TARGETS.map(({ target, labelKey, required }) => (
                          <div className="cust-import-mapping-row" key={target}>
                            <span className="cust-import-target-name">
                              {t(`${TK}.${labelKey}`)}
                              {required ? <span className="cust-import-required"> *</span> : null}
                            </span>
                            <span className="cust-import-map-arrow" aria-hidden="true">→</span>
                            <select
                              className="cust-import-select"
                              aria-label={t(`${TK}.${labelKey}`)}
                              value={mapping[target]}
                              disabled={isImporting}
                              onChange={(event) => updateMapping(target, event.target.value)}
                            >
                              <option value="">{t(`${TK}.skipColumn`)}</option>
                              {columns.map((column) => (
                                <option
                                  key={`${target}-${column.index}`}
                                  value={String(column.index)}
                                  disabled={Boolean(
                                    column.index
                                    && String(column.index) !== mapping[target]
                                    && usedColumns.has(String(column.index)),
                                  )}
                                >
                                  {column.header || t(`${TK}.mapping.unnamedColumn`, { index: column.index })}
                                </option>
                              ))}
                            </select>
                          </div>
                        ))}
                      </div>

                      <div className="cust-import-hint">
                        <span>✦</span>
                        <span>{t(`${TK}.mapping.hint`)}</span>
                      </div>
                      {!phoneMapped ? (
                        <div className="cust-import-validation" role="alert">
                          <span>!</span>
                          <span>{t(`${TK}.mapping.phoneRequired`)}</span>
                        </div>
                      ) : null}
                      {hasDuplicateMapping ? (
                        <div className="cust-import-validation" role="alert">
                          <span>!</span>
                          <span>{t(`${TK}.mapping.duplicateColumn`)}</span>
                        </div>
                      ) : null}
                    </div>

                    <div className="cust-import-preview-panel">
                      <div className="cust-import-preview-head">
                        <div>
                          <h3>{t(`${TK}.preview.heading`)}</h3>
                          <p>
                            {selectedFile.format === 'csv'
                              ? t(`${TK}.preview.subCsv`, { headerRow })
                              : t(`${TK}.preview.subXlsx`, { sheet, headerRow })}
                          </p>
                        </div>
                        <span className="cust-import-badge is-neutral">
                          {t(`${TK}.preview.count`, {
                            shown: previewRows.length,
                            total: previewRows.length,
                          })}
                        </span>
                      </div>
                      <div className="cust-import-preview-scroll">
                        <table className="cust-import-preview-table">
                          <thead>
                            <tr>
                              <th>#</th>
                              {columns.map((column) => (
                                <th key={column.index}>{column.header || `Col ${column.index}`}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {previewRows.length === 0 ? (
                              <tr>
                                <td colSpan={Math.max(columns.length + 1, 2)}>
                                  {t(`${TK}.preview.empty`)}
                                </td>
                              </tr>
                            ) : (
                              previewRows.map((row) => (
                                <tr key={row.index}>
                                  <td className="cust-import-row-index">{row.index}</td>
                                  {row.cells.map((cell, cellIndex) => {
                                    const tone = !cell
                                      ? 'is-empty'
                                      : row.warnings[cellIndex]
                                        ? 'is-warning'
                                        : 'is-ok'
                                    return (
                                      <td
                                        key={`${row.index}-${cellIndex}`}
                                        className={tone}
                                      >
                                        {cell || '—'}
                                      </td>
                                    )
                                  })}
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                      <div className="cust-import-preview-legend">
                        <span className="cust-import-legend-item is-ok">
                          <span className="cust-import-legend-dot" />
                          {t(`${TK}.preview.readable`)}
                        </span>
                        <span className="cust-import-legend-item is-warning">
                          <span className="cust-import-legend-dot is-warning" />
                          {t(`${TK}.preview.maybeSkipped`)}
                        </span>
                      </div>
                    </div>
                  </div>
                </>
              )
            ) : null}

            {step === 3 ? (
              isImporting || !importResult ? (
                <ImportResultSkeleton />
              ) : (
                <>
                  {(() => {
                    const noneImported = importResult.importedCount <= 0
                    const mostlyDuplicates = noneImported
                      && importResult.skippedDuplicateCount > 0
                      && importResult.skippedInvalidCount === 0
                    const heroTone = noneImported ? 'is-warning' : 'is-success'
                    const headingKey = noneImported
                      ? `${TK}.result.headingNone`
                      : `${TK}.result.heading`
                    const subKey = noneImported
                      ? (mostlyDuplicates
                        ? `${TK}.result.subAllDuplicates`
                        : `${TK}.result.subNone`)
                      : `${TK}.result.sub`
                    return (
                      <div className={`cust-import-result-hero ${heroTone}`}>
                        <span
                          className={`cust-import-success-symbol ${heroTone}`}
                          aria-hidden="true"
                        >
                          {noneImported ? '!' : '✓'}
                        </span>
                        <h3>{t(headingKey)}</h3>
                        <p>{t(subKey)}</p>
                      </div>
                    )
                  })()}
                  <div className="cust-import-stats">
                    <div className="cust-import-stat">
                      <span className="cust-import-stat-label">{t(`${TK}.result.total`)}</span>
                      <strong className="cust-import-stat-value">
                        {formatImportRowCount(importResult.totalRows, currentLanguage)}
                      </strong>
                    </div>
                    <div className="cust-import-stat is-success">
                      <span className="cust-import-stat-label">{t(`${TK}.result.imported`)}</span>
                      <strong className="cust-import-stat-value">
                        {formatImportRowCount(importResult.importedCount, currentLanguage)}
                      </strong>
                    </div>
                    <div className="cust-import-stat is-warning">
                      <span className="cust-import-stat-label">{t(`${TK}.result.duplicates`)}</span>
                      <strong className="cust-import-stat-value">
                        {formatImportRowCount(importResult.skippedDuplicateCount, currentLanguage)}
                      </strong>
                    </div>
                    <div className="cust-import-stat is-danger">
                      <span className="cust-import-stat-label">{t(`${TK}.result.invalid`)}</span>
                      <strong className="cust-import-stat-value">
                        {formatImportRowCount(importResult.skippedInvalidCount, currentLanguage)}
                      </strong>
                    </div>
                  </div>
                  {importResult.totalRows > 0 ? (
                    <div className="cust-import-result-bar" aria-hidden="true">
                      <span
                        className="is-success"
                        style={{ width: `${(importResult.importedCount / importResult.totalRows) * 100}%` }}
                      />
                      <span
                        className="is-warning"
                        style={{ width: `${(importResult.skippedDuplicateCount / importResult.totalRows) * 100}%` }}
                      />
                      <span
                        className="is-danger"
                        style={{ width: `${(importResult.skippedInvalidCount / importResult.totalRows) * 100}%` }}
                      />
                    </div>
                  ) : null}

                  {skippedCount > 0 ? (
                    <div className="cust-import-skipped-panel">
                      <div className="cust-import-skipped-head">
                        <div>
                          <h3>
                            {t(`${TK}.skipped.heading`, {
                              count: formatImportRowCount(skippedCount, currentLanguage),
                            })}
                          </h3>
                          <p>{t(`${TK}.skipped.sub`)}</p>
                        </div>
                        <button className="booking-secondary-button" type="button" onClick={downloadSkippedCsv}>
                          ↓ {t(`${TK}.skipped.download`)}
                        </button>
                      </div>
                      <div className="cust-import-skipped-scroll">
                        <table className="cust-import-skipped-table">
                          <thead>
                            <tr>
                              <th>{t(`${TK}.skipped.colRow`)}</th>
                              <th>{t(`${TK}.skipped.colPhone`)}</th>
                              <th>{t(`${TK}.skipped.colStatus`)}</th>
                              <th>{t(`${TK}.skipped.colReason`)}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {importResult.skippedRows.slice(0, 5).map((row) => (
                              <tr key={`${row.rowNumber}-${row.code}`}>
                                <td>{row.rowNumber}</td>
                                <td>{row.phone || '—'}</td>
                                <td>
                                  <span className={`cust-import-badge is-${skipStatusTone(row.code)}`}>
                                    {skipCodeLabel(row.code)}
                                  </span>
                                </td>
                                <td>{row.message}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : null}
                </>
              )
            ) : null}
          </div>

          <footer className="cust-import-footer">
            <span className="cust-import-footer-hint">{footerHint}</span>
            <div className="cust-import-footer-actions">
              {step === 2 ? (
                <button
                  className="booking-secondary-button"
                  type="button"
                  onClick={() => goToStep(1)}
                  disabled={isImporting || isPreviewLoading}
                >
                  {t(`${TK}.actions.back`)}
                </button>
              ) : null}
              {step === 3 && importResult && !isImporting ? (
                <button className="booking-secondary-button" type="button" onClick={resetFlow}>
                  {t(`${TK}.actions.importAnother`)}
                </button>
              ) : null}
              <button
                className="booking-primary-button"
                type="button"
                disabled={primaryDisabled}
                onClick={() => {
                  void handlePrimary()
                }}
              >
                {isImporting ? (
                  <>
                    <SpinnerIcon className="booking-inline-spinner" />
                    <span>{primaryLabel}</span>
                  </>
                ) : primaryLabel}
              </button>
            </div>
          </footer>
        </section>
      </div>

      <div className={`cust-import-toast ${toastVisible ? 'is-visible' : ''}`} role="status">
        ✓ {t(`${TK}.skipped.toast`)}
      </div>
    </div>,
    document.body,
  )
}
