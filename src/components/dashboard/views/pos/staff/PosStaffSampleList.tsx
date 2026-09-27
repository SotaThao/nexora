// POS Admin demo (#589 follow-up) — read-only sample staff list for the public
// /pos/staff "Nhân viên" sub-tab. The real Community staff table
// (CommunityScreens.tsx CommunityStaffPage) is wrapped in CommunityFrame, which needs
// CommunityAuthProvider + the community chat dock — neither is mounted on the public
// /pos* routes — so it can't be reused standalone here. This is a static stand-in, not
// a port of the real dashboard's StaffView/PosStaffProfileView.
import { Phone } from 'lucide-react'
import { useTranslation } from '../../../../../contexts/LanguageContext'
import { DEMO_STAFF_ACCOUNTS } from '../../../../community/jobs/communityJobsDemoData'

const RECRUITMENT_TK = 'components.dashboard.views.pos.recruitment'

function staffInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}

export default function PosStaffSampleList() {
  const { t } = useTranslation()
  const jessica = DEMO_STAFF_ACCOUNTS.jessica
  const fullName = typeof jessica.fullName === 'string' && jessica.fullName.trim() ? jessica.fullName.trim() : 'Jessica Nguyen'
  const phone = typeof jessica.phone === 'string' && jessica.phone.trim() ? jessica.phone.trim() : null

  return (
    <div className="space-y-3">
      <p className="text-xs font-medium text-nexoraMuted">{t('community_jobs_demo.posStaff.staffReadOnlyHint')}</p>
      <ul className="divide-y divide-nexoraBorder overflow-hidden rounded-xl border border-nexoraBorder bg-white shadow-sm">
        <li className="flex items-center gap-3 p-4">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-nexoraElectric to-nexoraViolet text-xs font-extrabold text-white">
            {staffInitials(fullName)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-nexoraText">{fullName}</p>
            <p className="truncate text-xs text-nexoraMuted">{t(`${RECRUITMENT_TK}.enums.position.NailTechnician`)}</p>
          </div>
          {phone ? (
            <span className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-nexoraMuted">
              <Phone className="h-3.5 w-3.5" aria-hidden />
              {phone}
            </span>
          ) : null}
        </li>
      </ul>
    </div>
  )
}
