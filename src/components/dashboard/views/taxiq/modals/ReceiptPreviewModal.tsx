import { ExternalLink, FileText, X } from 'lucide-react'
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
}: {
  open: boolean
  onClose: () => void
  receipt: ReceiptVaultItem
}) {
  const { t } = useTranslation()

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-nexoraText/70 p-4 backdrop-blur-sm">
      <div className="nexora-modal-card max-w-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="truncate text-sm font-extrabold text-nexoraText">{receipt.fileName}</h2>
          <IconButton label={t('common.cancel')} onClick={onClose}>
            <X className="h-4 w-4" />
          </IconButton>
        </div>

        <div className="flex-1 overflow-y-auto">
          {isPdf(receipt.fileName) ? (
            <div className="flex flex-col items-center gap-3 rounded-xl border border-nexoraBorder bg-nexoraCanvas px-4 py-10 text-center">
              <FileText className="h-10 w-10 text-nexoraMuted" />
              <p className="text-xs font-semibold text-nexoraMuted">{t('taxiq.receiptVault.previewModal.pdfNotice')}</p>
              <a
                href={receipt.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg bg-nexoraBrand px-4 py-2 text-xs font-bold text-white"
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
