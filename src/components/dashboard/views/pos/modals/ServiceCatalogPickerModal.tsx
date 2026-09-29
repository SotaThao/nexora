// ServiceCatalogPickerModal — the "Add services" entry point on the checkout screen.
//
// Wraps the same PosServiceCatalogPanel the left column shows inline in edit mode, so both entry
// points stay visually and behaviorally identical instead of maintaining two separate configs of
// the underlying catalog picker. Adding a service does not close the modal — checkout typically
// adds several services in a row, matching how the inline picker behaved before it moved here.
import { X } from 'lucide-react'
import { useTranslation } from '../../../../../contexts/LanguageContext'
import IconButton from '../../../../ui/IconButton'
import PosServiceCatalogPanel from '../PosServiceCatalogPanel'
import type { CheckoutServiceCatalogItemApiDto } from '../../../../../types/repositories'

const K = 'components.dashboard.views.pos.PosOrderWorkspace'

export default function ServiceCatalogPickerModal({
  open,
  services,
  isPending = false,
  onAdd,
  onClose,
}: {
  open: boolean
  services: CheckoutServiceCatalogItemApiDto[]
  isPending?: boolean
  onAdd: (posServiceId: string) => void
  onClose: () => void
}) {
  const { t } = useTranslation()

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-nexoraText/70 p-4 backdrop-blur-sm">
      <div className="nexora-modal-card max-w-2xl">
        <div className="mb-4 flex shrink-0 items-center justify-between gap-3">
          <h2 className="min-w-0 truncate text-sm font-extrabold text-nexoraText">
            {t(`${K}.addServicesModalTitle`)}
          </h2>
          <IconButton label={t(`${K}.addServicesModalClose`)} onClick={onClose} disabled={isPending}>
            <X className="h-4 w-4" />
          </IconButton>
        </div>

        <div className="flex-1 overflow-y-auto">
          <PosServiceCatalogPanel
            items={services}
            isPending={isPending}
            onAdd={onAdd}
            showCard={false}
            scrollInParent
          />
        </div>
      </div>
    </div>
  )
}
