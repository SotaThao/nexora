import { AlertCircle, ChevronDown, Loader2, MessageSquare, ShieldCheck, Trash2, Users, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { MemberRole } from '../../data/community/enums'
import { useChangeCommunityMemberRole, useRemoveCommunityMember } from '../../data/hooks/useCommunity'
import { useFindOrCreateDirectChannel } from '../../data/hooks/useDirectMessages'
import type { CommunityMemberDto } from '../../data/repositories/community'

type CommunityChatMemberActionsSheetProps = {
  open: boolean
  onClose: () => void
  communityId: string
  members: CommunityMemberDto[]
  currentUserId?: string
}

const roleLabels: Record<MemberRole, string> = {
  owner: 'Chủ nhóm',
  admin: 'Quản lý',
  moderator: 'Điều hành',
  member: 'Thành viên',
}

const roleClassNames: Record<MemberRole, string> = {
  owner: 'bg-nexoraBrandSoft text-nexoraBrand',
  admin: 'bg-nexoraSuccess/10 text-nexoraSuccess',
  moderator: 'bg-nexoraWarning/10 text-nexoraWarning',
  member: 'bg-nexoraSurfaceMuted text-nexoraMuted',
}

function initials(name?: string | null) {
  return (name || 'N').split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase()
}

function MemberAvatar({ name }: { name?: string | null }) {
  return <span aria-hidden="true" className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-nexoraElectric to-nexoraViolet text-xs font-extrabold text-white">{initials(name)}</span>
}

export function CommunityChatMemberActionsSheet({
  open,
  onClose,
  communityId,
  members,
  currentUserId,
}: CommunityChatMemberActionsSheetProps) {
  const navigate = useNavigate()
  const changeRole = useChangeCommunityMemberRole()
  const removeMember = useRemoveCommunityMember()
  const findOrCreateChannel = useFindOrCreateDirectChannel()
  const [expandedMemberId, setExpandedMemberId] = useState<string | null>(null)
  const [selectedRoles, setSelectedRoles] = useState<Record<string, MemberRole>>({})
  const [removeConfirmationId, setRemoveConfirmationId] = useState<string | null>(null)
  const ownMembership = useMemo(() => members.find((member) => member.userId === currentUserId), [currentUserId, members])
  const canModerate = ownMembership?.role === 'owner' || ownMembership?.role === 'admin'
  const actionError = changeRole.error || removeMember.error || findOrCreateChannel.error
  const isMutating = changeRole.isPending || removeMember.isPending || findOrCreateChannel.isPending

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isMutating) onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isMutating, onClose, open])

  useEffect(() => {
    if (!open) {
      setExpandedMemberId(null)
      setRemoveConfirmationId(null)
    }
  }, [open])

  if (!open) return null

  const handleStartDm = (targetUserId: string) => {
    findOrCreateChannel.mutate(targetUserId, {
      onSuccess: (channel) => {
        onClose()
        navigate(`/community/chat/dm/${channel.id}`)
      },
    })
  }

  const applyRole = (member: CommunityMemberDto) => {
    const newRole = selectedRoles[member.id] ?? member.role
    if (newRole === member.role) {
      setExpandedMemberId(null)
      return
    }
    changeRole.mutate({ communityId, userId: member.userId, newRole }, { onSuccess: () => setExpandedMemberId(null) })
  }

  const confirmRemove = (member: CommunityMemberDto) => {
    removeMember.mutate({ communityId, userId: member.userId }, { onSuccess: () => setRemoveConfirmationId(null) })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-nexoraText/35" role="presentation" onMouseDown={() => { if (!isMutating) onClose() }}>
      <section role="dialog" aria-modal="true" aria-labelledby="chat-members-heading" className="max-h-[82vh] w-full rounded-t-3xl bg-nexoraSurface shadow-2xl" onMouseDown={(event) => event.stopPropagation()}>
        <div className="mx-auto mt-3 h-1.5 w-11 rounded-full bg-nexoraBorder" aria-hidden="true" />
        <header className="flex items-center gap-3 border-b border-nexoraRule px-5 py-4">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-nexoraBrandSoft text-nexoraBrand"><Users className="h-5 w-5" aria-hidden="true" /></span>
          <div className="min-w-0 flex-1"><h2 id="chat-members-heading" className="text-base font-extrabold text-nexoraText">Thành viên nhóm</h2><p className="text-xs text-nexoraSubtle">{members.length} thành viên</p></div>
          <button type="button" onClick={onClose} disabled={isMutating} className="grid h-10 w-10 place-items-center rounded-full text-nexoraMuted hover:bg-nexoraSurfaceMuted disabled:opacity-50" aria-label="Đóng danh sách thành viên"><X className="h-5 w-5" aria-hidden="true" /></button>
        </header>

        {actionError ? <div className="mx-4 mt-3 flex items-start gap-2 rounded-xl border border-nexoraDanger/30 bg-red-50 px-3 py-2 text-xs leading-relaxed text-nexoraDanger" role="alert"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" /><p>{actionError.message}</p></div> : null}
        {!canModerate ? <p className="mx-4 mt-3 rounded-xl bg-nexoraSurfaceMuted px-3 py-2 text-xs leading-relaxed text-nexoraMuted">Chỉ chủ nhóm và quản lý mới có thể thay đổi vai trò hoặc xóa thành viên.</p> : null}

        <div className="max-h-[calc(82vh-112px)] overflow-y-auto px-4 pb-7 pt-3">
          {members.map((member) => {
            const name = member.profile?.displayName || 'Thành viên Nexora'
            const isExpanded = expandedMemberId === member.id
            const isRemoving = removeConfirmationId === member.id
            const selectedRole = selectedRoles[member.id] ?? member.role
            return <article key={member.id} className="border-b border-nexoraRule py-3 last:border-b-0">
              <div className="flex items-center gap-3">
                <MemberAvatar name={name} />
                <div className="min-w-0 flex-1"><p className="truncate text-sm font-extrabold text-nexoraText">{name}{member.userId === currentUserId ? <span className="ml-1.5 text-xs font-semibold text-nexoraSubtle">(Bạn)</span> : null}</p><span className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${roleClassNames[member.role]}`}>{roleLabels[member.role]}</span></div>
                {member.userId !== currentUserId ? (
                  <button
                    type="button"
                    onClick={() => handleStartDm(member.userId)}
                    disabled={isMutating}
                    className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-nexoraBorder px-2.5 text-xs font-extrabold text-nexoraBrand hover:bg-nexoraBrandSoft disabled:opacity-50"
                  >
                    <MessageSquare className="h-3.5 w-3.5" aria-hidden="true" />
                    Nhắn tin
                  </button>
                ) : null}
                {canModerate ? <button type="button" onClick={() => { setExpandedMemberId(isExpanded ? null : member.id); setRemoveConfirmationId(null) }} disabled={isMutating} className="inline-flex min-h-10 items-center gap-1 rounded-lg px-2 text-xs font-extrabold text-nexoraBrand hover:bg-nexoraBrandSoft disabled:opacity-50" aria-expanded={isExpanded} aria-controls={`member-actions-${member.id}`}><ShieldCheck className="h-4 w-4" aria-hidden="true" />Quản lý<ChevronDown className={`h-3.5 w-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} aria-hidden="true" /></button> : null}
              </div>

              {canModerate && isExpanded ? <div id={`member-actions-${member.id}`} className="mt-3 rounded-xl bg-nexoraSurfaceMuted p-3">
                <label className="block text-xs font-bold text-nexoraText">Vai trò<select value={selectedRole} onChange={(event) => setSelectedRoles((current) => ({ ...current, [member.id]: event.target.value as MemberRole }))} disabled={isMutating} className="mt-1.5 min-h-10 w-full rounded-lg border border-nexoraBorder bg-nexoraSurface px-3 text-sm font-semibold text-nexoraText outline-none focus:border-nexoraBrand disabled:opacity-50"><option value="owner">Chủ nhóm</option><option value="admin">Quản lý</option><option value="moderator">Điều hành</option><option value="member">Thành viên</option></select></label>
                <div className="mt-3 flex items-center justify-between gap-2"><button type="button" onClick={() => applyRole(member)} disabled={isMutating} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-nexoraBrand px-3 text-xs font-extrabold text-white disabled:opacity-50">{changeRole.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> : null}Cập nhật vai trò</button><button type="button" onClick={() => setRemoveConfirmationId(member.id)} disabled={isMutating} className="inline-flex min-h-10 items-center gap-1.5 rounded-lg px-2 text-xs font-extrabold text-nexoraDanger hover:bg-nexoraDanger/10 disabled:opacity-50"><Trash2 className="h-4 w-4" aria-hidden="true" />Xóa khỏi nhóm</button></div>
                {isRemoving ? <div className="mt-3 rounded-lg border border-nexoraDanger/30 bg-red-50 p-3"><p className="text-xs leading-relaxed text-nexoraDanger">Xóa {name} khỏi nhóm? Hành động này không thể hoàn tác tại đây.</p><div className="mt-2 flex justify-end gap-2"><button type="button" onClick={() => setRemoveConfirmationId(null)} disabled={isMutating} className="min-h-9 rounded-lg px-2 text-xs font-bold text-nexoraMuted disabled:opacity-50">Hủy</button><button type="button" onClick={() => confirmRemove(member)} disabled={isMutating} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-nexoraDanger px-3 text-xs font-extrabold text-white disabled:opacity-50">{removeMember.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> : null}Xóa thành viên</button></div></div> : null}
              </div> : null}
            </article>
          })}
        </div>
      </section>
    </div>
  )
}
