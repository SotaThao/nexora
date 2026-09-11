// PosRolesView — POS > Roles & Permissions (US-015). Owner reviews the 4
// default roles, toggles permissions per role (grouped by PosPermissionArea),
// and creates custom roles. Rule 1 (BA doc): the Owner role's own permission
// set is read-only, and "Manage Roles & Permissions" never appears as an
// editable checkbox on any non-Owner role — enforced here in the UI as the
// first line of defense, with the backend enforcing it as the final one.
import { useMemo, useState } from 'react'
import { Crown, Edit2, Loader2, Plus, ShieldCheck, Trash2 } from 'lucide-react'
import { useTranslation } from '../../../../contexts/LanguageContext'
import { useNotification } from '../../../../contexts/NotificationContext'
import { getApiErrorCode } from '../../../../types/domain'
import { getErrorI18nKey } from '../../../../data/errorCodes'
import {
  useCreatePosRole,
  useDeletePosRole,
  usePosRoles,
  useUpdateRolePermissions,
} from '../../../../data/hooks/usePosRoles'
import type { PosRoleApiDto } from '../../../../types/repositories'
import { SkeletonList } from '../../../ui/skeleton'
import CreatePosRoleModal from './modals/CreatePosRoleModal'

export default function PosRolesView({ embedded = false }: { embedded?: boolean }) {
  const { t } = useTranslation()
  const { showToast } = useNotification()
  const { data: roles, isLoading } = usePosRoles()
  const createRole = useCreatePosRole()
  const [isAddOpen, setIsAddOpen] = useState(false)

  const handleCreate = async (name: string) => {
    try {
      await createRole.mutateAsync(name)
      showToast(t('components.dashboard.views.pos.PosRolesView.createdSuccess'), 'success')
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
            {t('dashboard.menu.pos_roles')}
          </h1> : null}
          <p className={`${embedded ? 'text-xs' : 'text-sm'} font-medium text-nexoraMuted`}>
            {t('components.dashboard.views.pos.PosRolesView.description')}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsAddOpen(true)}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-nexoraBrand px-3.5 py-2 text-xs font-bold text-white hover:bg-nexoraBrandDark"
        >
          <Plus className="h-3.5 w-3.5" />
          {t('components.dashboard.views.pos.PosRolesView.addRole')}
        </button>
      </section>

      {isLoading ? (
        <div className="nexora-card p-6">
          <SkeletonList count={3} lines={3} />
        </div>
      ) : !roles || roles.length === 0 ? (
        <div className="nexora-card p-6 text-xs text-nexoraMuted">
          {t('components.dashboard.views.pos.PosRolesView.noRoles')}
        </div>
      ) : (
        <div className="space-y-4">
          {roles.map((role) => (
            <PosRoleCard key={role.id} role={role} />
          ))}
        </div>
      )}

      <CreatePosRoleModal
        open={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSubmit={handleCreate}
        isSubmitting={createRole.isPending}
      />
    </div>
  )
}

function PosRoleCard({ role }: { role: PosRoleApiDto }) {
  const { t } = useTranslation()
  const { showToast, showConfirm } = useNotification()
  const updatePermissions = useUpdateRolePermissions()
  const deleteRole = useDeletePosRole()

  const [isEditing, setIsEditing] = useState(false)
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set())

  const grantedIds = useMemo(
    () =>
      new Set(
        role.permissionAreas.flatMap((area) => area.permissions.filter((p) => p.isGranted).map((p) => p.id)),
      ),
    [role],
  )

  // "Manage Roles & Permissions" is never editable/selectable for a non-Owner
  // role (Rule 1) — dropped from the checklist entirely rather than shown
  // disabled, per the ticket's "disable/hide" requirement.
  const visibleAreas = useMemo(
    () =>
      role.permissionAreas
        .map((area) => ({
          ...area,
          permissions: area.permissions.filter((p) => role.isOwnerRole || !p.isOwnerOnly),
        }))
        .filter((area) => area.permissions.length > 0),
    [role],
  )

  const startEdit = () => {
    setCheckedIds(new Set(grantedIds))
    setIsEditing(true)
  }

  const togglePermission = (permissionId: string) => {
    setCheckedIds((prev) => {
      const next = new Set(prev)
      if (next.has(permissionId)) next.delete(permissionId)
      else next.add(permissionId)
      return next
    })
  }

  const handleSave = async () => {
    try {
      await updatePermissions.mutateAsync({
        roleId: role.id,
        permissionDefinitionIds: Array.from(checkedIds),
      })
      showToast(t('components.dashboard.views.pos.PosRolesView.savedSuccess'), 'success')
      setIsEditing(false)
    } catch (err) {
      showToast(t(getErrorI18nKey(getApiErrorCode(err))), 'error')
    }
  }

  const handleDelete = async () => {
    const confirmed = await showConfirm(
      t('components.dashboard.views.pos.PosRolesView.deleteConfirmBody'),
      t('components.dashboard.views.pos.PosRolesView.deleteConfirmTitle'),
    )
    if (!confirmed) return
    try {
      await deleteRole.mutateAsync(role.id)
      showToast(t('components.dashboard.views.pos.PosRolesView.deletedSuccess'), 'success')
    } catch (err) {
      showToast(t(getErrorI18nKey(getApiErrorCode(err))), 'error')
    }
  }

  return (
    <div className="rounded-xl border border-nexoraBorder bg-white p-6 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-nexoraBorder pb-3">
        <div className="flex items-center gap-2">
          <h4 className="text-xs font-black uppercase tracking-wider text-nexoraText">{role.name}</h4>
          {role.isOwnerRole && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">
              <Crown className="h-3 w-3" />
              {t('components.dashboard.views.pos.PosRolesView.ownerBadge')}
            </span>
          )}
          {!role.isOwnerRole && role.isSystemDefault && (
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">
              {t('components.dashboard.views.pos.PosRolesView.systemDefaultBadge')}
            </span>
          )}
        </div>

        {role.isOwnerRole ? null : isEditing ? (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="rounded px-3 py-1.5 text-[10px] font-bold text-slate-500 hover:bg-slate-50"
            >
              {t('components.dashboard.views.pos.PosRolesView.cancel')}
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={updatePermissions.isPending}
              className="inline-flex items-center gap-1.5 rounded bg-nexoraBrand px-4 py-1.5 text-[10px] font-bold text-white disabled:opacity-60"
            >
              {updatePermissions.isPending && <Loader2 className="h-3 w-3 animate-spin" />}
              {t('components.dashboard.views.pos.PosRolesView.save')}
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={startEdit}
              aria-label="Edit permissions"
              className="p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-nexoraBrand rounded"
            >
              <Edit2 className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleteRole.isPending}
              aria-label="Delete role"
              className="p-1.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 rounded disabled:opacity-60"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

      {role.isOwnerRole && (
        <p className="mb-3 flex items-center gap-1.5 text-[11px] font-medium italic text-nexoraMuted">
          <ShieldCheck className="h-3.5 w-3.5" />
          {t('components.dashboard.views.pos.PosRolesView.ownerRoleNote')}
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {visibleAreas.map((area) => {
          const labelKey = `components.dashboard.views.pos.PosRolesView.areas.${area.area}`
          const translatedLabel = t(labelKey)
          const areaLabel = translatedLabel === labelKey
            ? area.area.replace(/([a-z0-9])([A-Z])/g, '$1 $2')
            : translatedLabel
          return <div key={area.area} className="space-y-1.5">
            <h5 className="text-[10px] font-bold uppercase tracking-wide text-nexoraMuted">
              {areaLabel}
            </h5>
            {area.permissions.map((permission) => {
              const isChecked = role.isOwnerRole
                ? true
                : isEditing
                  ? checkedIds.has(permission.id)
                  : grantedIds.has(permission.id)
              return (
                <label
                  key={permission.id}
                  className="flex items-center gap-2 text-xs font-semibold text-nexoraText"
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    disabled={role.isOwnerRole || !isEditing}
                    onChange={() => togglePermission(permission.id)}
                    className="h-4 w-4 rounded border-nexoraBorder disabled:opacity-60"
                  />
                  {permission.displayName}
                </label>
              )
            })}
          </div>
        })}
      </div>
    </div>
  )
}
