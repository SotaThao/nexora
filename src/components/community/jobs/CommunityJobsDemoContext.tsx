// Community Jobs demo (#589) — resolves the signed-in demo persona (Kayla/Jessica/Linh/guest)
// into the Jobs tab's owner/staff/read-only mode, seeds the owner mock store once, and wires
// "Nhắn tin" actions into the EXISTING chat system (dock on desktop, full-page route on mobile).
import { createContext, useCallback, useContext, useMemo, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'

import { COMMUNITY_DEMO_PERSONAS, useCommunityAuth } from '../CommunityAuth'
import { useCommunityChatDock } from '../CommunityChatDock'
import { useTranslation } from '../../../contexts/LanguageContext'
import { useNotification } from '../../../contexts/NotificationContext'
import { useFindOrCreateDirectChannel, useProfileSearch } from '../../../data/hooks/useDirectMessages'
import { useMediaQuery } from '../../../hooks/useMediaQuery'
import { toRecruitmentSalon } from '../../../data/repositories/posRecruitment'
import { primePosRecruitmentMockSalon } from '../../../data/repositories/posRecruitmentMockClient'
import type { StaffAccountLike } from '../../staff-dashboard/community/jobs/staffJobsModel'
import type { MerchantBusinessInfo } from '../../../types/domain'
import type { PosCategoryApiDto, PosServiceApiDto } from '../../../types/repositories'
import {
  BNB_BUSINESS_ID,
  BNB_BUSINESS_INFO,
  BNB_OWNER_NAME,
  DEMO_POS_CATEGORIES,
  DEMO_POS_SERVICES,
  DEMO_STAFF_ACCOUNTS,
} from './communityJobsDemoData'

export type CommunityJobsDemoPersonaId = 'kayla' | 'jessica' | 'linh'
export type CommunityJobsDemoMode = 'owner' | 'staff' | 'readOnly'

interface CommunityJobsDemoValue {
  mode: CommunityJobsDemoMode
  personaId: CommunityJobsDemoPersonaId | null
  businessId: string
  businessInfo: MerchantBusinessInfo
  currentUserName: string
  services: PosServiceApiDto[]
  categories: PosCategoryApiDto[]
  staffKey: string | undefined
  staffAccount: StaffAccountLike
  linkedBusinessIds: Set<string>
  openInbox: () => void
  openBusinessChat: (businessId: string, displayName: string) => Promise<void>
}

const CommunityJobsDemoContext = createContext<CommunityJobsDemoValue | null>(null)

/** Resolves the signed-in Supabase user back to one of the three demo personas by email —
 *  anonymous/guest and any other account (e.g. not yet signed in) fall back to `null`
 *  (read-only browse). */
export function useCommunityDemoPersonaId(): CommunityJobsDemoPersonaId | null {
  const { user, isAnonymous } = useCommunityAuth()
  const email = user?.email?.toLowerCase()
  if (isAnonymous || !email) return null
  const persona = COMMUNITY_DEMO_PERSONAS.find((candidate) => candidate.email.toLowerCase() === email)
  return persona?.id ?? null
}

// Seed the owner (Kayla/Bitcoin Nail Bar) mock store exactly once per page load, synchronously
// during the first Provider render — before any child's usePosJobPostings can run its queryFn.
// A module-level flag (not per-persona-switch) so switching Jessica ↔ Linh ↔ guest never
// re-seeds/wipes postings Kayla already created or edited this session.
let hasPrimedOwnerStore = false

export function CommunityJobsDemoProvider({ children }: { children: ReactNode }) {
  if (!hasPrimedOwnerStore) {
    hasPrimedOwnerStore = true
    primePosRecruitmentMockSalon(toRecruitmentSalon(BNB_BUSINESS_INFO), BNB_BUSINESS_ID)
  }

  const personaId = useCommunityDemoPersonaId()
  const mode: CommunityJobsDemoMode = personaId === 'kayla' ? 'owner' : personaId === 'jessica' ? 'staff' : 'readOnly'
  const { t } = useTranslation()
  const { showToast } = useNotification()
  const navigate = useNavigate()
  const dock = useCommunityChatDock()
  const isDesktopLayout = useMediaQuery('(min-width: 1024px)')
  const profileSearch = useProfileSearch(BNB_OWNER_NAME, { enabled: mode === 'staff' })
  const findOrCreateChannel = useFindOrCreateDirectChannel()

  const staffKey = mode === 'staff' ? 'jessica' : undefined
  const staffAccount = DEMO_STAFF_ACCOUNTS.jessica

  const linkedBusinessIds = useMemo(
    () => (mode === 'staff' ? new Set([BNB_BUSINESS_ID]) : new Set<string>()),
    [mode],
  )

  const openInbox = useCallback(() => {
    if (isDesktopLayout) {
      if (!dock.isInboxOpen) dock.toggleInbox()
    } else {
      navigate('/community/chat')
    }
  }, [dock, isDesktopLayout, navigate])

  const openBusinessChat = useCallback(async (_businessId: string, displayName: string) => {
    try {
      const list = profileSearch.data ?? (await profileSearch.refetch()).data
      const profile = list?.find((candidate) => candidate.displayName.toLowerCase() === 'kayla le')
      if (!profile) {
        showToast(t('community_jobs_demo.chat.dmFailed'), 'error', 4000)
        return
      }
      const channel = await findOrCreateChannel.mutateAsync(profile.id)
      if (isDesktopLayout) {
        dock.openDirectChat({ id: channel.id, title: channel.otherParticipant?.displayName ?? displayName })
      } else {
        navigate(`/community/chat/dm/${channel.id}`)
      }
    } catch {
      showToast(t('community_jobs_demo.chat.dmFailed'), 'error', 4000)
    }
  }, [dock, findOrCreateChannel, isDesktopLayout, navigate, profileSearch, showToast, t])

  const value = useMemo<CommunityJobsDemoValue>(() => ({
    mode,
    personaId,
    businessId: BNB_BUSINESS_ID,
    businessInfo: BNB_BUSINESS_INFO,
    currentUserName: BNB_OWNER_NAME,
    services: DEMO_POS_SERVICES,
    categories: DEMO_POS_CATEGORIES,
    staffKey,
    staffAccount,
    linkedBusinessIds,
    openInbox,
    openBusinessChat,
  }), [mode, personaId, staffKey, staffAccount, linkedBusinessIds, openInbox, openBusinessChat])

  return <CommunityJobsDemoContext.Provider value={value}>{children}</CommunityJobsDemoContext.Provider>
}

export function useCommunityJobsDemo(): CommunityJobsDemoValue {
  const context = useContext(CommunityJobsDemoContext)
  if (!context) throw new Error('useCommunityJobsDemo must be used inside CommunityJobsDemoProvider')
  return context
}
