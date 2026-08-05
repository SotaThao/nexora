import React from 'react'

type IconProps = {
  className?: string
}

function HubIcon({ className, children }: IconProps & { children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      {children}
    </svg>
  )
}

/** Solid Bootstrap Icons — opt out of booking-hub stroke defaults via `.hub-icon-fill`. */
function FillIcon({ className, children }: IconProps & { children: React.ReactNode }) {
  const classes = ['hub-icon-fill', className].filter(Boolean).join(' ')
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true" className={classes}>
      {children}
    </svg>
  )
}

/** Lucide calendar — matches HTML Booking Book tab SVG. */
export function CalendarTabIcon({ className }: IconProps) {
  return (
    <HubIcon className={className}>
      <path d="M8 2v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M16 2v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <rect width="18" height="18" x="3" y="4" rx="2" stroke="currentColor" strokeWidth="2" />
      <path d="M3 10h18" stroke="currentColor" strokeWidth="2" />
      <path d="M8 14h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M12 14h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M16 14h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M8 18h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M12 18h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M16 18h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </HubIcon>
  )
}

/** Bootstrap Icons `bi-tags`. */
export function TagsTabIcon({ className }: IconProps) {
  return (
    <FillIcon className={className}>
      <path d="M3 2v4.586l7 7L14.586 9l-7-7zM2 2a1 1 0 0 1 1-1h4.586a1 1 0 0 1 .707.293l7 7a1 1 0 0 1 0 1.414l-4.586 4.586a1 1 0 0 1-1.414 0l-7-7A1 1 0 0 1 2 6.586z" />
      <path d="M5.5 5a.5.5 0 1 1 0-1 .5.5 0 0 1 0 1m0 1a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3M1 7.086a1 1 0 0 0 .293.707L8.75 15.25l-.043.043a1 1 0 0 1-1.414 0l-7-7A1 1 0 0 1 0 7.586V3a1 1 0 0 1 1-1z" />
    </FillIcon>
  )
}

/** Bootstrap Icons `bi-sliders2-vertical`. */
export function SlidersTabIcon({ className }: IconProps) {
  return (
    <FillIcon className={className}>
      <path
        fillRule="evenodd"
        d="M0 10.5a.5.5 0 0 0 .5.5h4a.5.5 0 0 0 0-1H3V1.5a.5.5 0 0 0-1 0V10H.5a.5.5 0 0 0-.5.5M2.5 12a.5.5 0 0 0-.5.5v2a.5.5 0 0 0 1 0v-2a.5.5 0 0 0-.5-.5m3-6.5A.5.5 0 0 0 6 6h1.5v8.5a.5.5 0 0 0 1 0V6H10a.5.5 0 0 0 0-1H6a.5.5 0 0 0-.5.5M8 1a.5.5 0 0 0-.5.5v2a.5.5 0 0 0 1 0v-2A.5.5 0 0 0 8 1m3 9.5a.5.5 0 0 0 .5.5h4a.5.5 0 0 0 0-1H14V1.5a.5.5 0 0 0-1 0V10h-1.5a.5.5 0 0 0-.5.5m2.5 1.5a.5.5 0 0 0-.5.5v2a.5.5 0 0 0 1 0v-2a.5.5 0 0 0-.5-.5"
      />
    </FillIcon>
  )
}

export function ShopIcon({ className }: IconProps) {
  return (
    <HubIcon className={className}>
      <path d="M3 9 5 3h14l2 6" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M4 9h16v11a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V9Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M10 13h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </HubIcon>
  )
}

/** Bootstrap Icons `bi-clock-history`. */
export function ClockHistoryIcon({ className }: IconProps) {
  return (
    <FillIcon className={className}>
      <path d="M8.515 1.019A7 7 0 0 0 8 1V0a8 8 0 0 1 .589.022zm2.004.45a7 7 0 0 0-.985-.299l.219-.976q.576.129 1.126.342zm1.37.71a7 7 0 0 0-.439-.27l.493-.87a8 8 0 0 1 .979.654l-.615.789a7 7 0 0 0-.418-.302zm1.834 1.79a7 7 0 0 0-.653-.796l.724-.69q.406.429.747.91zm.744 1.352a7 7 0 0 0-.214-.468l.893-.45a8 8 0 0 1 .45 1.088l-.95.313a7 7 0 0 0-.179-.483m.53 2.507a7 7 0 0 0-.1-1.025l.985-.17q.1.58.116 1.17zm-.131 1.538q.05-.254.081-.51l.993.123a8 8 0 0 1-.23 1.155l-.964-.267q.069-.247.12-.501m-.952 2.379q.276-.436.486-.908l.914.405q-.24.54-.555 1.038zm-.964 1.205q.183-.183.35-.378l.758.653a8 8 0 0 1-.401.432z" />
      <path d="M8 1a7 7 0 1 0 4.95 11.95l.707.707A8.001 8.001 0 1 1 8 0z" />
      <path d="M7.5 3a.5.5 0 0 1 .5.5v5.21l3.248 1.856a.5.5 0 0 1-.496.868l-3.5-2A.5.5 0 0 1 7 9V3.5a.5.5 0 0 1 .5-.5" />
    </FillIcon>
  )
}

export function CurrencyDollarIcon({ className }: IconProps) {
  return (
    <HubIcon className={className}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
      <path d="M12 7v10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M9.5 9.5c0-1.1 1.12-2 2.5-2s2.5.9 2.5 2-.9 2-2.5 2.2-2.5 2.2-2.5 1.1-2.5 2.3 1.12 2 2.5 2 2.5-.9 2.5-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </HubIcon>
  )
}

/** Lucide `folder-tree` — Manage Categories / category modal. */
export function FolderTreeIcon({ className }: IconProps) {
  return (
    <HubIcon className={className}>
      <path
        d="M20 10a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1h-2.5a1 1 0 0 1-.8-.4l-.9-1.2A1 1 0 0 0 15 3h-2a1 1 0 0 0-.8.4l-.9 1.2a1 1 0 0 1-.8.4H9a1 1 0 0 0-1 1v3a1 1 0 0 0 1 1Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M20 21a1 1 0 0 0 1-1v-3a1 1 0 0 0-1-1h-2.9a1 1 0 0 1-.88-.55l-.42-.85a1 1 0 0 0-.92-.6H13a1 1 0 0 0-.92.6l-.42.85a1 1 0 0 1-.88.55H10a1 1 0 0 0-1 1v3a1 1 0 0 0 1 1Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M3 5a2 2 0 0 0 2 2h3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M3 3v13a2 2 0 0 0 2 2h3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </HubIcon>
  )
}

/** Bootstrap Icons `bi-plus-lg`. */
export function PlusLgIcon({ className }: IconProps) {
  return (
    <FillIcon className={className}>
      <path
        fillRule="evenodd"
        d="M8 2a.5.5 0 0 1 .5.5v5h5a.5.5 0 0 1 0 1h-5v5a.5.5 0 0 1-1 0v-5h-5a.5.5 0 0 1 0-1h5v-5A.5.5 0 0 1 8 2"
      />
    </FillIcon>
  )
}

export function CameraIcon({ className }: IconProps) {
  return (
    <HubIcon className={className}>
      <path d="M4 8h3l2-2h6l2 2h3v11H4V8Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <circle cx="12" cy="13" r="3.5" stroke="currentColor" strokeWidth="2" />
    </HubIcon>
  )
}

export function LightningIcon({ className }: IconProps) {
  return (
    <HubIcon className={className}>
      <path d="m13 2-8 12h7l-1 8 8-12h-7l1-8Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    </HubIcon>
  )
}

export function PlusIcon({ className }: IconProps) {
  return (
    <HubIcon className={className}>
      <path d="M12 5v14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </HubIcon>
  )
}



/** Bootstrap Icons `bi-stars`. */
export function StarsIcon({ className }: IconProps) {
  return (
    <FillIcon className={className}>
      <path d="M7.657 6.247c.11-.33.576-.33.686 0l.645 1.937a2.89 2.89 0 0 0 1.829 1.828l1.936.645c.33.11.33.576 0 .686l-1.937.645a2.89 2.89 0 0 0-1.828 1.829l-.645 1.936a.361.361 0 0 1-.686 0l-.645-1.937a2.89 2.89 0 0 0-1.828-1.828l-1.937-.645a.361.361 0 0 1 0-.686l1.937-.645a2.89 2.89 0 0 0 1.828-1.828zM3.794 1.148a.217.217 0 0 1 .412 0l.387 1.162c.173.518.579.924 1.097 1.097l1.162.387a.217.217 0 0 1 0 .412l-1.162.387A1.73 1.73 0 0 0 4.593 5.69l-.387 1.162a.217.217 0 0 1-.412 0L3.407 5.69A1.73 1.73 0 0 0 2.31 4.593l-1.162-.387a.217.217 0 0 1 0-.412l1.162-.387A1.73 1.73 0 0 0 3.407 2.31zM10.863.099a.145.145 0 0 1 .274 0l.258.774c.115.346.386.617.732.732l.774.258a.145.145 0 0 1 0 .274l-.774.258a1.16 1.16 0 0 0-.732.732l-.258.774a.145.145 0 0 1-.274 0l-.258-.774a1.16 1.16 0 0 0-.732-.732L9.1 2.137a.145.145 0 0 1 0-.274l.774-.258c.346-.115.617-.386.732-.732z" />
    </FillIcon>
  )
}

export function EyeIcon({ className }: IconProps) {
  return (
    <HubIcon className={className}>
      <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="2.5" stroke="currentColor" strokeWidth="2" />
    </HubIcon>
  )
}

export function CheckLgIcon({ className }: IconProps) {
  return (
    <HubIcon className={className}>
      <path d="M20 6 9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </HubIcon>
  )
}

/** Filled check-in-circle — clearer confirm affordance than a bare check stroke. */
export function CheckCircleFillIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true" className={['hub-icon-fill', className].filter(Boolean).join(' ')}>
      <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0m-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z" />
    </svg>
  )
}

export function XLgIcon({ className }: IconProps) {
  return (
    <HubIcon className={className}>
      <path d="M18 6 6 18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="m6 6 12 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </HubIcon>
  )
}

export function SendIcon({ className }: IconProps) {
  return (
    <HubIcon className={className}>
      <path d="m22 2-7 20-4-9-9-4Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M22 2 11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </HubIcon>
  )
}

export function TableIcon({ className }: IconProps) {
  return (
    <HubIcon className={className}>
      <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="2" />
      <path d="M3 10h18" stroke="currentColor" strokeWidth="2" />
      <path d="M10 4v16" stroke="currentColor" strokeWidth="2" />
    </HubIcon>
  )
}

export function GridIcon({ className }: IconProps) {
  return (
    <HubIcon className={className}>
      <rect x="3" y="3" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="2" />
      <rect x="13" y="3" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="2" />
      <rect x="3" y="13" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="2" />
      <rect x="13" y="13" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="2" />
    </HubIcon>
  )
}

/** Bootstrap funnel — booking filter toggle. */
export function FunnelIcon({ className }: IconProps) {
  return (
    <HubIcon className={className}>
      <path
        d="M4 4h16l-6 7.5V18l-4 2v-8.5L4 4Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </HubIcon>
  )
}

export function ChevronLeftIcon({ className }: IconProps) {
  return (
    <HubIcon className={className}>
      <path d="m15 18-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </HubIcon>
  )
}

export function ChevronRightIcon({ className }: IconProps) {
  return (
    <HubIcon className={className}>
      <path d="m9 18 6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </HubIcon>
  )
}

export function CalendarKpiIcon({ className }: IconProps) {
  return (
    <HubIcon className={className}>
      <path d="M8 2v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M16 2v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <rect width="18" height="18" x="3" y="4" rx="2" stroke="currentColor" strokeWidth="2" />
      <path d="M3 10h18" stroke="currentColor" strokeWidth="2" />
    </HubIcon>
  )
}

export function CheckKpiIcon({ className }: IconProps) {
  return (
    <HubIcon className={className}>
      <path d="M20 6 9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </HubIcon>
  )
}

export function XKpiIcon({ className }: IconProps) {
  return (
    <HubIcon className={className}>
      <path d="M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="m6 6 12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </HubIcon>
  )
}

export function JournalIcon({ className }: IconProps) {
  return (
    <HubIcon className={className}>
      <path d="M6 4h9a2 2 0 0 1 2 2v14H8a2 2 0 0 1-2-2V4Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M6 18h11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M10 8h6M10 12h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </HubIcon>
  )
}

export function BroadcastIcon({ className }: IconProps) {
  return (
    <HubIcon className={className}>
      <path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="12" cy="12" r="2" stroke="currentColor" strokeWidth="2" />
      <path d="M16.2 16.2c2.3-2.3 6.1-2.3 8.5 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M19.1 19.1C23 15.2 23 8.8 19.1 4.9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </HubIcon>
  )
}

export function PersonWorkspaceIcon({ className }: IconProps) {
  return (
    <HubIcon className={className}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="9" cy="7" r="3" stroke="currentColor" strokeWidth="2" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </HubIcon>
  )
}

export function ClockIcon({ className }: IconProps) {
  return (
    <HubIcon className={className}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
      <path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </HubIcon>
  )
}

/** Bootstrap Icons `bi-stopwatch` (stroke variant for booking hub). */
export function StopwatchIcon({ className }: IconProps) {
  return (
    <HubIcon className={className}>
      <path d="M10 2h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M12 2v2.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="12" cy="14" r="7" stroke="currentColor" strokeWidth="2" />
      <path d="M12 14V11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M12 14l2.5 1.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </HubIcon>
  )
}

/** Bootstrap Icons `bi-people`. */
export function PeopleTabIcon({ className }: IconProps) {
  return (
    <FillIcon className={className}>
      <path d="M15 14s1 0 1-1-1-4-5-4-5 3-5 4 1 1 1 1zm-7.978-1L7 12.996c.001-.264.167-1.03.76-1.72C8.312 10.629 9.282 10 11 10c1.717 0 2.687.63 3.24 1.276.593.69.758 1.457.76 1.72l-.008.002-.014.002zM11 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4m3-2a3 3 0 1 1-6 0 3 3 0 0 1 6 0M6.936 9.28a6 6 0 0 0-1.23-.247A7 7 0 0 0 5 9c-4 0-5 3-5 4q0 1 1 1h4.216A2.24 2.24 0 0 1 5 13c0-1.01.377-2.042 1.09-2.904.243-.294.526-.569.846-.816M4.92 10A5.5 5.5 0 0 0 4 13H1c0-.26.164-1.03.76-1.724.545-.636 1.492-1.256 3.16-1.275ZM1.5 5.5a3 3 0 1 1 6 0 3 3 0 0 1-6 0m3-2a2 2 0 1 0 0 4 2 2 0 0 0 0-4" />
    </FillIcon>
  )
}

/** Bootstrap Icons `bi-telephone`. */
export function PhoneTabIcon({ className }: IconProps) {
  return (
    <FillIcon className={className}>
      <path d="M3.654 1.328a.678.678 0 0 0-1.015-.063L1.605 2.3c-.483.484-.661 1.169-.45 1.77a17.6 17.6 0 0 0 4.168 6.608 17.6 17.6 0 0 0 6.608 4.168c.601.211 1.286.033 1.77-.45l1.034-1.034a.678.678 0 0 0-.063-1.015l-2.307-1.794a.68.68 0 0 0-.58-.122l-2.19.547a1.75 1.75 0 0 1-1.657-.459L5.482 8.062a1.75 1.75 0 0 1-.46-1.657l.548-2.19a.68.68 0 0 0-.122-.58zM1.884.511a1.745 1.745 0 0 1 2.612.163L6.29 2.98c.329.423.445.974.315 1.494l-.547 2.19a.68.68 0 0 0 .178.643l2.457 2.457a.68.68 0 0 0 .644.178l2.189-.547a1.75 1.75 0 0 1 1.494.315l2.306 1.794c.829.645.905 1.87.163 2.611l-1.034 1.034c-.74.74-1.846 1.065-2.877.702a18.6 18.6 0 0 1-7.01-4.42 18.6 18.6 0 0 1-4.42-7.009c-.362-1.03-.037-2.137.703-2.877z" />
    </FillIcon>
  )
}

export function PhoneXIcon({ className }: IconProps) {
  return (
    <HubIcon className={className}>
      <path
        d="M5 4h3.5l1.5 4-2 1.5a11 11 0 0 0 5.5 5.5l1.5-2 4 1.5V18a2 2 0 0 1-2 2C10.5 20 4 13.5 4 6a2 2 0 0 1 1-2Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M15 3.5 19 7.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M19 3.5 15 7.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </HubIcon>
  )
}

export function PhoneIncomingIcon({ className }: IconProps) {
  return (
    <HubIcon className={className}>
      <path
        d="M5 4h3.5l1.5 4-2 1.5a11 11 0 0 0 5.5 5.5l1.5-2 4 1.5V18a2 2 0 0 1-2 2C10.5 20 4 13.5 4 6a2 2 0 0 1 1-2Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M15 3v4h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M19 3 15 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </HubIcon>
  )
}

export function CalendarCheckIcon({ className }: IconProps) {
  return (
    <HubIcon className={className}>
      <path d="M8 2v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M16 2v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <rect width="18" height="18" x="3" y="4" rx="2" stroke="currentColor" strokeWidth="2" />
      <path d="M3 10h18" stroke="currentColor" strokeWidth="2" />
      <path d="m8.5 15 2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </HubIcon>
  )
}

/** Bootstrap Icons `bi-calendar-event`. */
export function CalendarEventIcon({ className }: IconProps) {
  return (
    <FillIcon className={className}>
      <path d="M11 6.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5z" />
      <path d="M3.5 0a.5.5 0 0 1 .5.5V1h8V.5a.5.5 0 0 1 1 0V1h1a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h1V.5a.5.5 0 0 1 .5-.5M1 4v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4z" />
    </FillIcon>
  )
}

/** Bootstrap Icons `bi-calendar-plus`. */
export function CalendarPlusIcon({ className }: IconProps) {
  return (
    <FillIcon className={className}>
      <path d="M8 7a.5.5 0 0 1 .5.5V9H10a.5.5 0 0 1 0 1H8.5v1.5a.5.5 0 0 1-1 0V10H6a.5.5 0 0 1 0-1h1.5V7.5A.5.5 0 0 1 8 7" />
      <path d="M3.5 0a.5.5 0 0 1 .5.5V1h8V.5a.5.5 0 0 1 1 0V1h1a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h1V.5a.5.5 0 0 1 .5-.5M1 4v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4z" />
    </FillIcon>
  )
}

export function GraphUpIcon({ className }: IconProps) {
  return (
    <HubIcon className={className}>
      <path d="M4 19V5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M4 19h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="m6 15 4-4 3 3 6-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M15 7h4v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </HubIcon>
  )
}

/** Bootstrap Icons `bi-fire`. */
export function FireIcon({ className }: IconProps) {
  return (
    <FillIcon className={className}>
      <path d="M8 16c3.314 0 6-2 6-5.5 0-1.5-.5-4-2.5-6 .25 1.5-1.25 2-1.25 2C11 4 9 .5 6 0c.357 2 .5 4-2 6-1.25 1-2 2.729-2 4.5C2 14 4.686 16 8 16m0-1c-1.657 0-3-1-3-2.75 0-.75.25-2 1.25-3C6.125 10 7 10.5 7 10.5c-.375-1.25.5-3.25 2-3.5-.179 1-.25 2 1 3 .625.5 1 1.364 1 2.25C11 14 9.657 15 8 15" />
    </FillIcon>
  )
}

/** Bootstrap Icons `bi-gem`. */
export function GemIcon({ className }: IconProps) {
  return (
    <FillIcon className={className}>
      <path d="M3.1.7a.5.5 0 0 1 .4-.2h9a.5.5 0 0 1 .4.2l2.976 3.974c.149.185.156.45.01.644L8.4 15.3a.5.5 0 0 1-.8 0L.1 5.3a.5.5 0 0 1 0-.6zm11.386 3.785-1.806-2.41-.776 2.413zm-3.633.004.961-2.989H4.186l.963 2.995zM5.47 5.495 8 13.366l2.532-7.876zm-1.371-.999-.78-2.422-1.818 2.425zM1.499 5.5l5.113 6.817-2.192-6.82zm7.889 6.817 5.123-6.83-2.928.002z" />
    </FillIcon>
  )
}

export function QrCodeIcon({ className }: IconProps) {
  return (
    <HubIcon className={className}>
      <rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" />
      <rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" />
      <rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" />
      <path d="M14 14h3v3h-3zM19 14h2v2h-2zM14 19h2v2h-2zM19 19h2v2h-2z" fill="currentColor" />
    </HubIcon>
  )
}

export function ReceiptIcon({ className }: IconProps) {
  return (
    <HubIcon className={className}>
      <path d="M6 2h12v20l-2.5-1.5L13 22l-2.5-1.5L8 22l-2-1.5Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M9 7h6M9 11h6M9 15h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </HubIcon>
  )
}

export function ImportTrayIcon({ className }: IconProps) {
  return (
    <HubIcon className={className}>
      <path d="M4 4v10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="m1 11 3 3 3-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 4h11a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </HubIcon>
  )
}

export function PencilIcon({ className }: IconProps) {
  return (
    <HubIcon className={className}>
      <path
        d="M4 20h16"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="m16.5 3.5 4 4L8 20H4v-4Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </HubIcon>
  )
}

/** Lucide `trash-2`. */
export function Trash2Icon({ className }: IconProps) {
  return (
    <HubIcon className={className}>
      <path d="M3 6h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M8 6V4h8v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path
        d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M10 11v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M14 11v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </HubIcon>
  )
}

export function SpinnerIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" opacity="0.25" />
      <path d="M12 3a9 9 0 0 1 9 9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  )
}

/** Lucide `message-square` — SMS Campaigns tab. */
export function MessageSquareTabIcon({ className }: IconProps) {
  return (
    <HubIcon className={className}>
      <path
        d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </HubIcon>
  )
}

/** Lucide `message-square` (marketing panel). */
export function MessageSquareIcon({ className }: IconProps) {
  return <MessageSquareTabIcon className={className} />
}

/** Lucide `sparkles`. */
export function SparklesIcon({ className }: IconProps) {
  return (
    <HubIcon className={className}>
      <path
        d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M20 3v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M22 5h-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M4 17v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M5 18H3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </HubIcon>
  )
}

/** Lucide `wallet-cards`. */
export function WalletCardsIcon({ className }: IconProps) {
  return (
    <HubIcon className={className}>
      <rect
        width="18"
        height="18"
        x="3"
        y="3"
        rx="2"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path d="M3 9a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2" stroke="currentColor" strokeWidth="2" />
      <path
        d="M3 11h3c.8 0 1.6.3 2.1.9l1.1.9c1.6 1.6 4.1 1.6 5.7 0l1.1-.9c.5-.5 1.3-.9 2.1-.9H21"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </HubIcon>
  )
}

/** Lucide `credit-card`. */
export function CreditCardIcon({ className }: IconProps) {
  return (
    <HubIcon className={className}>
      <rect
        width="20"
        height="14"
        x="2"
        y="5"
        rx="2"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path d="M2 10h20" stroke="currentColor" strokeWidth="2" />
    </HubIcon>
  )
}

/** Lucide `trending-up`. */
export function TrendingUpIcon({ className }: IconProps) {
  return (
    <HubIcon className={className}>
      <path d="M16 7h6v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="m22 7-8.5 8.5-5-5L2 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </HubIcon>
  )
}

/** Lucide `user-plus`. */
export function UserPlusIcon({ className }: IconProps) {
  return (
    <HubIcon className={className}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2" />
      <path d="M19 8v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M22 11h-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </HubIcon>
  )
}

/** Lucide `refresh-cw`. */
export function RefreshCwIcon({ className }: IconProps) {
  return (
    <HubIcon className={className}>
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M21 3v5h-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 16H3v5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </HubIcon>
  )
}

/** Lucide `star`. */
export function StarIcon({ className }: IconProps) {
  return (
    <HubIcon className={className}>
      <path
        d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </HubIcon>
  )
}

/** Lucide `gift`. */
export function GiftIcon({ className }: IconProps) {
  return (
    <HubIcon className={className}>
      <rect x="3" y="8" width="18" height="4" rx="1" stroke="currentColor" strokeWidth="2" />
      <path d="M12 8v13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path
        d="M7.5 8a2.5 2.5 0 0 1 0-5C11 3 12 8 12 8s1-5 4.5-5a2.5 2.5 0 0 1 0 5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </HubIcon>
  )
}

/** Lucide `megaphone`. */
export function MegaphoneIcon({ className }: IconProps) {
  return (
    <HubIcon className={className}>
      <path d="m3 11 18-5v12L3 14v-3z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </HubIcon>
  )
}

/** Lucide `x`. */
export function CloseIcon({ className }: IconProps) {
  return (
    <HubIcon className={className}>
      <path d="M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="m6 6 12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </HubIcon>
  )
}

/** Lucide `zap`. */
export function ZapIcon({ className }: IconProps) {
  return (
    <HubIcon className={className}>
      <path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    </HubIcon>
  )
}

/** Lucide `link`. */
export function LinkIcon({ className }: IconProps) {
  return (
    <HubIcon className={className}>
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </HubIcon>
  )
}

/** Lucide `store`. */
export function StoreIcon({ className }: IconProps) {
  return (
    <HubIcon className={className}>
      <path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M10 22V12h4v10" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M15 7v0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M2 7h20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </HubIcon>
  )
}

/** Lucide `user`. */
export function UserIcon({ className }: IconProps) {
  return (
    <HubIcon className={className}>
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2" />
    </HubIcon>
  )
}

/** Lucide `phone`. */
export function PhoneIcon({ className }: IconProps) {
  return (
    <HubIcon className={className}>
      <path
        d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </HubIcon>
  )
}

/** Lucide `smartphone`. */
export function SmartphoneIcon({ className }: IconProps) {
  return (
    <HubIcon className={className}>
      <rect width="14" height="20" x="5" y="2" rx="2" stroke="currentColor" strokeWidth="2" />
      <path d="M12 18h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </HubIcon>
  )
}

/** Lucide `alert-triangle`. */
export function AlertTriangleIcon({ className }: IconProps) {
  return (
    <HubIcon className={className}>
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M12 9v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M12 17h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </HubIcon>
  )
}

/** Lucide `shield-check`. */
export function ShieldCheckIcon({ className }: IconProps) {
  return (
    <HubIcon className={className}>
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="m9 12 2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </HubIcon>
  )
}

/** Lucide `info` (circle). */
export function InfoCircleIcon({ className }: IconProps) {
  return (
    <HubIcon className={className}>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
      <path d="M12 16v-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M12 8h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </HubIcon>
  )
}

/** Lucide `check-circle`. */
export function CheckCircleIcon({ className }: IconProps) {
  return (
    <HubIcon className={className}>
      <path d="M21.801 10A10 10 0 1 1 17 3.335" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="m9 11 3 3L22 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </HubIcon>
  )
}
