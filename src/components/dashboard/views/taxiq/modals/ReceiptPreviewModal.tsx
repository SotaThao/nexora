import { useEffect, useState } from 'react'
import { ExternalLink, Loader2, X } from 'lucide-react'
import IconButton from '../../../../ui/IconButton'
import { useTranslation } from '../../../../../contexts/LanguageContext'
import type { ReceiptVaultItem } from '../../../../../data/repositories/taxiqReceipts'

function isPdf(fileName: string): boolean {
  return fileName.toLowerCase().endsWith('.pdf')
}

export default function ReceiptPreviewModal({
  open,
  onClose,
  receipt,
  title,
}: {
  open: boolean
  onClose: () => void
  receipt: ReceiptVaultItem
  title?: string
}) {
  const { t } = useTranslation()
  const isPdfReceipt = isPdf(receipt.fileName)
  const previewTitle = title?.trim() || receipt.fileName
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState('')

  useEffect(() => {
    if (!open || !isPdfReceipt) {
      setPdfPreviewUrl('')
      return
    }

    let objectUrl = ''
    const controller = new AbortController()

    setPdfPreviewUrl('')

    async function loadPdfPreview() {
      try {
        if (typeof fetch !== 'function' || typeof URL.createObjectURL !== 'function') {
          throw new Error('PDF blob preview is not available.')
        }

        const response = await fetch(receipt.url, { signal: controller.signal })
        if (!response.ok) throw new Error('Unable to load PDF preview.')

        const blob = await response.blob()
        if (controller.signal.aborted) return

        const pdfBlob = blob.type === 'application/pdf'
          ? blob
          : new Blob([blob], { type: 'application/pdf' })
        objectUrl = URL.createObjectURL(pdfBlob)
        setPdfPreviewUrl(objectUrl)
      } catch {
        if (!controller.signal.aborted) {
          setPdfPreviewUrl(receipt.url)
        }
      }
    }

    void loadPdfPreview()

    return () => {
      controller.abort()
      if (objectUrl && typeof URL.revokeObjectURL === 'function') {
        URL.revokeObjectURL(objectUrl)
      }
    }
  }, [isPdfReceipt, open, receipt.url])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-nexoraText/70 p-4 backdrop-blur-sm">
      <div className={`nexora-modal-card ${isPdfReceipt ? 'h-[90vh] max-w-5xl' : 'max-w-2xl'}`}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="truncate text-sm font-extrabold text-nexoraText">{previewTitle}</h2>
          <IconButton label={t('common.cancel')} onClick={onClose}>
            <X className="h-4 w-4" />
          </IconButton>
        </div>

        <div className="flex-1 overflow-y-auto">
          {isPdfReceipt ? (
            <div className="flex min-h-0 h-full flex-col gap-3">
              {pdfPreviewUrl ? (
                <iframe
                  src={pdfPreviewUrl}
                  title={receipt.fileName}
                  className="min-h-[60vh] flex-1 rounded-xl border border-nexoraBorder bg-white"
                />
              ) : (
                <div className="grid min-h-[60vh] flex-1 place-items-center rounded-xl border border-nexoraBorder bg-nexoraCanvas text-nexoraMuted">
                  <Loader2 className="h-6 w-6 animate-spin" aria-hidden />
                </div>
              )}
              <a
                href={receipt.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 self-start rounded-lg bg-nexoraBrand px-4 py-2 text-xs font-bold text-white"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                {t('taxiq.receiptVault.previewModal.openPdf')}
              </a>
            </div>
          ) : (
            <img
              src={receipt.url}
              alt={receipt.fileName}
              className="mx-auto max-h-[70vh] w-auto rounded-xl border border-nexoraBorder object-contain"
            />
          )}
        </div>
      </div>
    </div>
  )
}
