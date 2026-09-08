// ServiceAddOnPickerModal — the "+ Add-On" picker for one ticket line.
//
// Scoped to the line it was opened from, never to the service catalog at large: an add-on rung up
// against the wrong line pays the wrong technician, so the options come from the line's own
// endpoint rather than being filtered on the client.
//
// Stays open after each tap. Two taps on the same extra is two lines (not a quantity of two), and
// a customer who says yes to paraffin usually says yes to something else in the same breath.
import { X } from 'lucide-react'
import { useTranslation } from '../../../../../contexts/LanguageContext'
import IconButton from '../../../../ui/IconButton'
import type { ServiceLineAddOnOptionApiDto } from '../../../../../types/repositories'

const K = 'components.dashboard.views.pos.PosOrderWorkspace'

export default function ServiceAddOnPickerModal({
  open,
  serviceName,
  options,
  isLoading,
  onAdd,
  onClose,
}: {
  open: boolean
  serviceName: string
  options: ServiceLineAddOnOptionApiDto[]
  isLoading: boolean
  onAdd: (option: ServiceLineAddOnOptionApiDto) => void
  onClose: () => void
}) {
  const { t } = useTranslation()

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-nexoraText/70 p-4 backdrop-blur-sm">
      <div className="nexora-modal-card max-w-lg">
        <div className="mb-4 flex shrink-0 items-center justify-between gap-3">
          <h2 className="min-w-0 truncate text-sm font-extrabold text-nexoraText">
            {t(`${K}.addOnModalTitle`, { serviceName })}
          </h2>
          <IconButton label={t(`${K}.addOnModalClose`)} onClick={onClose}>
            <X className="h-4 w-4" />
          </IconButton>
        </div>

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <p className="py-8 text-center text-xs text-nexoraMuted">{t('common.loading')}</p>
          ) : options.length === 0 ? (
            <p className="py-8 text-center text-xs text-nexoraMuted">{t(`${K}.noAddOnsForService`)}</p>
          ) : (
            <ul className="space-y-2">
              {options.map((option) => (
                <li key={option.id}>
                  <button
                    type="button"
                    data-testid={`add-on-option-${option.id}`}
                    onClick={() => onAdd(option)}
                    className="flex w-full items-center justify-between gap-3 rounded-2xl border border-nexoraBorder bg-white px-4 py-3 text-left transition-colors hover:border-nexoraBrand hover:bg-nexoraCanvas"
                  >
                    <span className="min-w-0 truncate text-[13px] font-bold text-nexoraText">
                      {option.name}
                    </span>
                    <span className="shrink-0 text-sm font-bold text-nexoraText">
                      ${option.price.toFixed(2)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mt-4 flex shrink-0 justify-end">
          <button
            type="button"
            onClick={onClose}
            className="h-10 rounded-2xl bg-nexoraBrand px-5 text-xs font-bold text-white transition-colors hover:bg-nexoraBrandDark"
          >
            {t(`${K}.addOnModalDone`)}
          </button>
        </div>
      </div>
    </div>
  )
}
