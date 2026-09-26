// Community Jobs demo (#589) — Jobs tab content, split by signed-in persona:
// Kayla (owner) sees the POS recruitment shell (trimmed), Jessica (staff) sees the staff
// hiring feed / seeking posts / applications, Linh and guests get a read-only browse view.
import PosStaffRecruitmentView from '../../dashboard/views/pos/recruitment/PosStaffRecruitmentView'
import StaffCommunityJobsView from '../../staff-dashboard/community/jobs/StaffCommunityJobsView'
import { CommunityJobsDemoProvider, useCommunityDemoPersonaId, useCommunityJobsDemo } from './CommunityJobsDemoContext'

function CommunityJobsTabContent() {
  const { mode, businessId } = useCommunityJobsDemo()
  return mode === 'owner' ? <PosStaffRecruitmentView businessId={businessId} /> : <StaffCommunityJobsView />
}

export default function CommunityJobsTab() {
  const personaId = useCommunityDemoPersonaId()
  return (
    // `key` forces a fresh Provider (and DemoStaffShell) per persona so switching
    // Jessica ↔ Linh ↔ guest doesn't leak the previous persona's mode/context state.
    <CommunityJobsDemoProvider key={personaId ?? 'guest'}>
      <CommunityJobsTabContent />
    </CommunityJobsDemoProvider>
  )
}
