// CreatePosRoleModal — POS > Roles & Permissions (US-015). Small single-field
// modal so a custom role can be added without a full page navigation.
import { useEffect, useState, type FormEvent } from 'react'
import { Loader2, X } from 'lucide-react'
import { useTranslation } from '../../../../../contexts/LanguageContext'
import IconButton from '../../../../ui/IconButton'

export default function CreatePosRoleModal({
  open,
  onClose,
  onSubmit,
  isSubmitting,
}: {
  open: boolean
  onClose: () => void
  onSubmit: (name: string) => void
  isSubmitting: boolean
}) {
  const { t } = useTranslation()
  const [name, setName] = useState('')

  useEffect(() => {
    if (open) setName('')
  }, [open])

  if (!open) return null

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    onSubmit(trimmed)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-nexoraText/70 p-4 backdrop-blur-sm">
      <div className="nexora-modal-card max-w-sm">
        <div className="mb-4 flex shrink-0 items-center justify-between">
          <h2 className="text-sm font-extrabold text-nexoraText">
            {t('components.dashboard.views.pos.PosRolesView.addRoleModalTitle')}
          </h2>
          <IconButton label={t('components.dashboard.views.pos.PosRolesView.cancel')} onClick={onClose}>
            <X className="h-4 w-4" />
          </IconButton>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 space-y-4 overflow-y-auto">
          <input
            type="text"
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={100}
            placeholder={t('components.dashboard.views.pos.PosRolesView.roleNamePlaceholder')}
            className="h-10 w-full rounded-lg border border-nexoraBorder bg-nexoraCanvas px-3.5 text-xs text-nexoraText outline-none focus:border-nexoraBrand focus:bg-white"
          />

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded px-3 py-1.5 text-[10px] font-bold text-slate-500 hover:bg-slate-50"
            >
              {t('components.dashboard.views.pos.PosRolesView.cancel')}
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="inline-flex items-center gap-1.5 rounded bg-nexoraBrand px-4 py-1.5 text-[10px] font-bold text-white hover:bg-nexoraBrandDark disabled:opacity-60"
            >
              {isSubmitting && <Loader2 className="h-3 w-3 animate-spin" />}
              {t('components.dashboard.views.pos.PosRolesView.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
