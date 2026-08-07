import { ArrowRight, X } from 'lucide-react'
import IconButton from '../../../../ui/IconButton'
import { useTranslation } from '../../../../../contexts/LanguageContext'
import DeductionStatusBadge from '../shared/DeductionStatusBadge'

const STATUS_ORDER = ['Draft', 'MissingReceipt', 'MissingInfo', 'Ready', 'CPAReview', 'Locked'] as const

const TRIGGER_KEYS: Record<(typeof STATUS_ORDER)[number], string> = {
  Draft: 'taxiq.deductionCenter.statusGuide.triggers.draft',
  MissingReceipt: 'taxiq.deductionCenter.statusGuide.triggers.missingReceipt',
  MissingInfo: 'taxiq.deductionCenter.statusGuide.triggers.missingInfo',
  Ready: 'taxiq.deductionCenter.statusGuide.triggers.ready',
  CPAReview: 'taxiq.deductionCenter.statusGuide.triggers.cpaReview',
  Locked: 'taxiq.deductionCenter.statusGuide.triggers.locked',
}

export default function DeductionStatusGuideModal({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const { t } = useTranslation()

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-nexoraText/70 p-4 backdrop-blur-sm">
      <div className="nexora-modal-card max-w-lg">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-extrabold text-nexoraText">{t('taxiq.deductionCenter.statusGuide.title')}</h2>
          <IconButton label={t('common.cancel')} onClick={onClose}>
            <X className="h-4 w-4" />
          </IconButton>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto">
          <p className="text-xs text-nexoraMuted">{t('taxiq.deductionCenter.statusGuide.subtitle')}</p>

          <ol className="space-y-3">
            {STATUS_ORDER.map((status) => (
              <li key={status} className="rounded-lg border border-nexoraBorder bg-nexoraCanvas p-3">
                <DeductionStatusBadge status={status} />
                <div className="mt-2 flex items-start gap-1.5 text-[11px] text-nexoraMuted">
                  <ArrowRight className="mt-0.5 h-3 w-3 shrink-0" />
                  <span>{t(TRIGGER_KEYS[status])}</span>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  )
}
