import type { KeyboardEvent } from 'react'
import {
  CreditCard,
  HandCoins,
  Share2,
  UserPlus,
  type LucideIcon,
} from 'lucide-react'
import { useTranslation } from '../../contexts/LanguageContext'
import {
  TOUCHPOINT_SECTION,
  type TouchpointSection,
} from './touchpointSections'

type SectionDefinition = {
  id: TouchpointSection
  labelKey: string
  Icon: LucideIcon
}

const SECTIONS: SectionDefinition[] = [
  {
    id: TOUCHPOINT_SECTION.tip,
    labelKey: 'tip',
    Icon: HandCoins,
  },
  {
    id: TOUCHPOINT_SECTION.payment,
    labelKey: 'payment',
    Icon: CreditCard,
  },
  {
    id: TOUCHPOINT_SECTION.referral,
    labelKey: 'referral',
    Icon: Share2,
  },
  {
    id: TOUCHPOINT_SECTION.staffInvite,
    labelKey: 'staff_invite',
    Icon: UserPlus,
  },
]

type TouchpointSectionTabsProps = {
  activeSection: TouchpointSection
  onSectionChange: (section: TouchpointSection) => void
}

const tabDomId = (section: TouchpointSection) =>
  `touchpoint-section-tab-${section}`

const panelDomId = (section: TouchpointSection) =>
  `touchpoint-section-panel-${section}`

export default function TouchpointSectionTabs({
  activeSection,
  onSectionChange,
}: TouchpointSectionTabsProps) {
  const { t } = useTranslation()

  const handleKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) => {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return

    event.preventDefault()
    const direction = event.key === 'ArrowRight' ? 1 : -1
    const nextIndex = (index + direction + SECTIONS.length) % SECTIONS.length
    const nextSection = SECTIONS[nextIndex].id
    onSectionChange(nextSection)
    document.getElementById(tabDomId(nextSection))?.focus()
  }

  return (
    <div
      className="grid grid-cols-2 gap-1 sm:flex sm:flex-wrap"
      role="tablist"
      aria-label={t('dashboard.menu.touchpoints')}
    >
      {SECTIONS.map(({ id, labelKey, Icon }, index) => {
        const isActive = id === activeSection
        const label = t(`dashboard.touchpoints.stations_sections.${labelKey}`)

        return (
          <button
            key={id}
            type="button"
            role="tab"
            id={tabDomId(id)}
            aria-controls={panelDomId(id)}
            aria-selected={isActive}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onSectionChange(id)}
            onKeyDown={(event) => handleKeyDown(event, index)}
            className={[
              'inline-flex min-h-12 min-w-0 flex-col items-center justify-center gap-1 rounded-lg border px-1 py-1.5 text-center text-xs font-bold leading-tight transition sm:min-h-11 sm:flex-row sm:px-3 sm:py-2',
              isActive
                ? 'border-transparent bg-nexoraBrand text-white shadow-nexora-soft'
                : 'border-nexoraBorder bg-nexoraSurface text-nexoraMuted hover:border-nexoraLavender hover:bg-nexoraSurfaceMuted hover:text-nexoraText',
            ].join(' ')}
          >
            <span
              className={[
                'grid h-6 w-6 shrink-0 place-items-center rounded-lg sm:h-7 sm:w-7',
                isActive
                  ? 'bg-white/15 text-white'
                  : 'bg-nexoraSurfaceMuted text-nexoraBrand',
              ].join(' ')}
            >
              <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden />
            </span>
            <span className="min-w-0 break-words">{label}</span>
          </button>
        )
      })}
    </div>
  )
}
