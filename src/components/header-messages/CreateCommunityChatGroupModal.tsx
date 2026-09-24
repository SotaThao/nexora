import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { Search, X } from 'lucide-react'
import { useTranslation } from '../../contexts/LanguageContext'
import { useNotification } from '../../contexts/NotificationContext'
import { useMerchantStaff, StatusFilter } from '../../data/hooks/useMerchantStaff'
import { useCreateCommunityChatSession } from '../../data/hooks/useCommunityChat'
import { getErrorMessage } from '../../data/errorCodes'
import type { CommunityChatSession } from '../../types/communityChat'
import {
  canStaffMemberUseCommunityChat,
  getStaffChatDisplayName,
  trimStaffChatId,
  type StaffChatMemberLike,
} from '../staff/staffCommunityChatUtils'
import {
  HEADER_MESSAGE_CHAT_ROOT_ATTR,
  HEADER_MESSAGE_CREATE_GROUP_MODAL_Z_INDEX,
  HEADER_MESSAGES_I18N,
} from './headerMessagesConstants'

/** US-111 — merchant "Create group" staff picker; source list is capped to 1 page (a salon roster is small). */
const CREATE_GROUP_STAFF_PAGE_SIZE = 100
/** Selecting only 1 staff would make the backend dedupe/create a OneOnOne session, not a Group — block earlier. */
const CREATE_GROUP_MIN_MEMBERS = 2
/** Matches `title` limits on `POST /sessions` and `PUT /sessions/{id}` (see US-102/US-103). */
const CREATE_GROUP_NAME_MAX_LENGTH = 200
const CREATE_GROUP_I18N = `${HEADER_MESSAGES_I18N}.createGroupModal` as const

interface CreateCommunityChatGroupModalProps {
  open: boolean
  businessId: string
  onClose: () => void
  onCreated: (session: CommunityChatSession) => void
}

function getStaffPickerInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    return `${parts[0][0] ?? ''}${parts[parts.length - 1][0] ?? ''}`.toUpperCase()
  }
  return name.slice(0, 2).toUpperCase()
}

export default function CreateCommunityChatGroupModal({
  open,
  businessId,
  onClose,
  onCreated,
}: CreateCommunityChatGroupModalProps) {
  const { t } = useTranslation()
  const { showToast } = useNotification()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [groupName, setGroupName] = useState('')

  const {
    data: staffPage,
    isLoading: isStaffLoading,
    isError: isStaffError,
  } = useMerchantStaff({
    statusFilter: StatusFilter.Active,
    pageSize: CREATE_GROUP_STAFF_PAGE_SIZE,
    enabled: open,
  })

  const createSessionMutation = useCreateCommunityChatSession()

  // Reset picker state each time the modal is (re)opened — avoid leaking a previous selection.
  useEffect(() => {
    if (!open) return
    setSearchQuery('')
    setSelectedIds(new Set())
    setGroupName('')
  }, [open])

  const eligibleStaff = useMemo(() => {
    const items = staffPage?.items ?? []
    return items.filter((member) => (
      canStaffMemberUseCommunityChat(member as unknown as StaffChatMemberLike)
    ))
  }, [staffPage])

  const filteredStaff = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return eligibleStaff
    return eligibleStaff.filter((member) => (
      getStaffChatDisplayName(member as unknown as StaffChatMemberLike).toLowerCase().includes(query)
    ))
  }, [eligibleStaff, searchQuery])

  const toggleStaff = (userProfileId: string) => {
    setSelectedIds((current) => {
      const next = new Set(current)
      if (next.has(userProfileId)) next.delete(userProfileId)
      else next.add(userProfileId)
      return next
    })
  }

  const canSubmit = Boolean(businessId)
    && selectedIds.size >= CREATE_GROUP_MIN_MEMBERS
    && !createSessionMutation.isPending

  const handleCreate = async () => {
    if (!canSubmit) return
    try {
      const session = await createSessionMutation.mutateAsync({
        businessId,
        participantUserProfileIds: Array.from(selectedIds),
        title: groupName.trim() || null,
      })
      onCreated(session)
    } catch (err) {
      showToast(
        getErrorMessage(err, t, 'CHAT_PARTICIPANT_MUST_HAVE_ACCOUNT', t(`${CREATE_GROUP_I18N}.createError`)),
        'error',
      )
    }
  }

  if (!open || typeof document === 'undefined') return null

  return createPortal(
    <div
      className="fixed inset-0 flex items-center justify-center bg-slate-900/60 p-4"
      style={{ zIndex: HEADER_MESSAGE_CREATE_GROUP_MODAL_Z_INDEX }}
      {...{ [HEADER_MESSAGE_CHAT_ROOT_ATTR]: '' }}
    >
      <div
        className="flex w-full max-w-sm flex-col overflow-hidden rounded-2xl border border-nexoraBorder bg-white shadow-2xl"
        style={{ maxHeight: 'min(560px, calc(100dvh - 2rem))' }}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-nexoraBorder px-4 py-3">
          <h3 className="text-sm font-black text-nexoraText">{t(`${CREATE_GROUP_I18N}.title`)}</h3>
          <button
            type="button"
            aria-label={t(`${CREATE_GROUP_I18N}.close`)}
            onClick={onClose}
            className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-nexoraSubtle transition hover:bg-nexoraSurfaceMuted hover:text-nexoraText"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="shrink-0 border-b border-nexoraBorder px-4 py-3">
          <label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-nexoraSubtle">
            {t(`${CREATE_GROUP_I18N}.groupNameLabel`)}
          </label>
          <input
            type="text"
            value={groupName}
            maxLength={CREATE_GROUP_NAME_MAX_LENGTH}
            onChange={(event) => setGroupName(event.target.value)}
            placeholder={t(`${CREATE_GROUP_I18N}.groupNamePlaceholder`)}
            className="w-full rounded-lg border border-nexoraBorder px-3 py-2 text-sm text-nexoraText outline-none focus:border-nexoraBrand"
          />
        </div>

        <div className="shrink-0 border-b border-nexoraBorder px-4 py-2.5">
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-nexoraSubtle"
              aria-hidden="true"
            />
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder={t(`${CREATE_GROUP_I18N}.searchPlaceholder`)}
              aria-label={t(`${CREATE_GROUP_I18N}.searchPlaceholder`)}
              className="w-full rounded-lg border border-nexoraBorder py-2 pl-8 pr-3 text-sm text-nexoraText outline-none focus:border-nexoraBrand"
            />
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
          {isStaffLoading ? (
            <div className="px-2 py-6 text-center text-xs font-semibold text-nexoraMuted">
              {t(`${CREATE_GROUP_I18N}.loading`)}
            </div>
          ) : isStaffError ? (
            <div className="px-2 py-6 text-center text-xs font-semibold text-nexoraDanger">
              {t(`${CREATE_GROUP_I18N}.loadError`)}
            </div>
          ) : filteredStaff.length === 0 ? (
            <div className="px-2 py-6 text-center text-xs font-semibold text-nexoraMuted">
              {t(`${CREATE_GROUP_I18N}.noEligibleStaff`)}
            </div>
          ) : (
            filteredStaff.map((member) => {
              const userProfileId = trimStaffChatId(member.userProfileId as string | null | undefined)
              if (!userProfileId) return null
              const displayName = getStaffChatDisplayName(member as unknown as StaffChatMemberLike)
              const isSelected = selectedIds.has(userProfileId)
              return (
                <label
                  key={userProfileId}
                  className="flex w-full cursor-pointer items-center gap-3 rounded-xl px-2 py-2 text-left transition hover:bg-nexoraCanvas"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-nexoraElectric to-nexoraViolet text-[11px] font-bold uppercase text-white">
                    {getStaffPickerInitials(displayName)}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold text-nexoraText">
                    {displayName}
                  </span>
                  <input
                    type="checkbox"
                    className="h-4 w-4 shrink-0 accent-nexoraBrand"
                    checked={isSelected}
                    onChange={() => toggleStaff(userProfileId)}
                  />
                </label>
              )
            })
          )}
        </div>

        <div className="shrink-0 border-t border-nexoraBorder px-4 py-2.5">
          <p className="text-[11px] font-semibold text-nexoraSubtle">
            {selectedIds.size > 0
              ? t(`${CREATE_GROUP_I18N}.selectedCount`, { count: selectedIds.size })
              : t(`${CREATE_GROUP_I18N}.minMembersHint`)}
          </p>
        </div>

        <div className="flex shrink-0 gap-2.5 border-t border-nexoraBorder p-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-nexoraBorder px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-nexoraMuted transition hover:bg-nexoraSurfaceMuted"
          >
            {t('common.cancel')}
          </button>
          <button
            type="button"
            onClick={handleCreate}
            disabled={!canSubmit}
            className="flex-1 rounded-xl bg-nexoraBrand px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-nexoraBrandDark disabled:cursor-not-allowed disabled:opacity-50"
          >
            {createSessionMutation.isPending
              ? t(`${CREATE_GROUP_I18N}.creating`)
              : t(`${CREATE_GROUP_I18N}.create`)}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
