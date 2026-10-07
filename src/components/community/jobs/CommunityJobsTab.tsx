// Community Jobs demo: browse for every persona; owner recruitment remains under My Posts.
import StaffCommunityJobsView from '../../staff-dashboard/community/jobs/StaffCommunityJobsView'
import { CommunityJobsDemoProvider, useCommunityDemoPersonaId } from './CommunityJobsDemoContext'

export default function CommunityJobsTab() {
  const personaId = useCommunityDemoPersonaId()
  return (
    // `key` forces a fresh Provider (and DemoStaffShell) per persona so switching
    // Jessica ↔ Linh ↔ guest doesn't leak the previous persona's mode/context state.
    <CommunityJobsDemoProvider key={personaId ?? 'guest'}>
      <StaffCommunityJobsView />
    </CommunityJobsDemoProvider>
  )
}
