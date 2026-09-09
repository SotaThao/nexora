// PosStaffLevelsView — POS > Staff Levels. Owner reviews the business's own list of
// staff proficiency levels (e.g. Basic/Advanced/Senior), renames them inline, deletes
// them (deleting does not block even if assigned — the backend nulls out the affected
// staff profiles), and creates custom levels. No permission matrix here, unlike
// PosRolesView — a level is just a named, ordered lookup value.
import { useState } from 'react'
import { Edit2, Loader2, Plus, Trash2, X } from 'lucide-react'
import { useTranslation } from '../../../../contexts/LanguageContext'
import { useNotification } from '../../../../contexts/NotificationContext'
import { getApiErrorCode } from '../../../../types/domain'
import { getErrorI18nKey } from '../../../../data/errorCodes'
import {
  useCreatePosStaffLevel,
  useDeletePosStaffLevel,
  usePosStaffLevels,
  useUpdatePosStaffLevel,
} from '../../../../data/hooks/usePosStaffLevels'
import type { PosStaffLevelApiDto } from '../../../../types/repositories'
import { SkeletonList } from '../../../ui/skeleton'
import CreatePosStaffLevelModal from './modals/CreatePosStaffLevelModal'

export default function PosStaffLevelsView({ embedded = false }: { embedded?: boolean }) {
  const { t } = useTranslation()
  const { showToast } = useNotification()
  const { data: levels, isLoading } = usePosStaffLevels()
  const createLevel = useCreatePosStaffLevel()
  const [isAddOpen, setIsAddOpen] = useState(false)

  const sortedLevels = [...(levels ?? [])].sort(
    (a, b) => a.displayOrder - b.displayOrder || a.name.localeCompare(b.name),
  )

  const handleCreate = async (name: string) => {
    try {
      await createLevel.mutateAsync(name)
      showToast(t('components.dashboard.views.pos.PosStaffLevelsView.createdSuccess'), 'success')
      setIsAddOpen(false)
    } catch (err) {
      showToast(t(getErrorI18nKey(getApiErrorCode(err))), 'error')
    }
  }

  return (
    <div className="space-y-6">
      <section className="flex items-start justify-between gap-3 px-0.5">
        <div className="space-y-1">
          {!embedded ? <h1 className="text-2xl font-bold leading-tight text-nexoraText">
            {t('dashboard.menu.pos_staff_levels')}
          </h1> : null}
          <p className={`${embedded ? 'text-xs' : 'text-sm'} font-medium text-nexoraMuted`}>
            {t('components.dashboard.views.pos.PosStaffLevelsView.description')}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsAddOpen(true)}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-nexoraBrand px-3.5 py-2 text-xs font-bold text-white hover:bg-nexoraBrandDark"
        >
          <Plus className="h-3.5 w-3.5" />
          {t('components.dashboard.views.pos.PosStaffLevelsView.addLevel')}
        </button>
      </section>

      {isLoading ? (
        <div className="nexora-card p-6">
          <SkeletonList count={3} lines={1} />
        </div>
      ) : sortedLevels.length === 0 ? (
        <div className="nexora-card p-6 text-xs text-nexoraMuted">
          {t('components.dashboard.views.pos.PosStaffLevelsView.noLevels')}
        </div>
      ) : (
        <div className="space-y-2">
          {sortedLevels.map((level) => (
            <PosStaffLevelRow key={level.id} level={level} />
          ))}
        </div>
      )}

      <CreatePosStaffLevelModal
        open={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSubmit={handleCreate}
        isSubmitting={createLevel.isPending}
      />
    </div>
  )
}

function PosStaffLevelRow({ level }: { level: PosStaffLevelApiDto }) {
  const { t } = useTranslation()
  const { showToast, showConfirm } = useNotification()
  const updateLevel = useUpdatePosStaffLevel()
  const deleteLevel = useDeletePosStaffLevel()

  const [isEditing, setIsEditing] = useState(false)
  const [draftName, setDraftName] = useState(level.name)

  const startEdit = () => {
    setDraftName(level.name)
    setIsEditing(true)
  }

  const handleSave = async () => {
    const trimmed = draftName.trim()
    if (!trimmed || trimmed === level.name) {
      setIsEditing(false)
      return
    }
    try {
      await updateLevel.mutateAsync({ staffLevelId: level.id, name: trimmed })
      showToast(t('components.dashboard.views.pos.PosStaffLevelsView.updatedSuccess'), 'success')
      setIsEditing(false)
    } catch (err) {
      showToast(t(getErrorI18nKey(getApiErrorCode(err))), 'error')
    }
  }

  const handleDelete = async () => {
    const confirmed = await showConfirm(
      t('components.dashboard.views.pos.PosStaffLevelsView.deleteConfirmBody'),
      t('components.dashboard.views.pos.PosStaffLevelsView.deleteConfirmTitle'),
    )
    if (!confirmed) return
    try {
      await deleteLevel.mutateAsync(level.id)
      showToast(t('components.dashboard.views.pos.PosStaffLevelsView.deletedSuccess'), 'success')
    } catch (err) {
      showToast(t(getErrorI18nKey(getApiErrorCode(err))), 'error')
    }
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-nexoraBorder bg-white px-4 py-3 shadow-sm">
      {isEditing ? (
        <input
          type="text"
          autoFocus
          value={draftName}
          onChange={(e) => setDraftName(e.target.value)}
          maxLength={100}
          className="h-9 flex-1 rounded-lg border border-nexoraBorder bg-nexoraCanvas px-3 text-xs font-semibold text-nexoraText outline-none focus:border-nexoraBrand focus:bg-white"
        />
      ) : (
        <h4 className="text-xs font-black uppercase tracking-wider text-nexoraText">{level.name}</h4>
      )}

      {isEditing ? (
        <div className="flex shrink-0 gap-1">
          <button
            type="button"
            onClick={() => setIsEditing(false)}
            aria-label={t('components.dashboard.views.pos.PosStaffLevelsView.cancel')}
            className="p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-nexoraText rounded"
          >
            <X className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={updateLevel.isPending || !draftName.trim()}
            className="inline-flex items-center gap-1.5 rounded bg-nexoraBrand px-3 py-1.5 text-[10px] font-bold text-white disabled:opacity-60"
          >
            {updateLevel.isPending && <Loader2 className="h-3 w-3 animate-spin" />}
            {t('components.dashboard.views.pos.PosStaffLevelsView.save')}
          </button>
        </div>
      ) : (
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={startEdit}
            aria-label={t('components.dashboard.views.pos.PosStaffLevelsView.edit')}
            className="p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-nexoraBrand rounded"
          >
            <Edit2 className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleteLevel.isPending}
            aria-label={t('components.dashboard.views.pos.PosStaffLevelsView.delete')}
            className="p-1.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 rounded disabled:opacity-60"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  )
}
