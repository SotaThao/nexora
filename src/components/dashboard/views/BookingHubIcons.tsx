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

export function TagsTabIcon({ className }: IconProps) {
  return (
    <HubIcon className={className}>
      <path
        d="M20.59 13.41 11 3.83a2 2 0 0 0-2.83 0L3.83 8.17a2 2 0 0 0 0 2.83l9.59 9.58a2 2 0 0 0 2.83 0l4.34-4.34a2 2 0 0 0 0-2.83Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <circle cx="7.5" cy="7.5" r="1.5" fill="currentColor" />
    </HubIcon>
  )
}

export function SlidersTabIcon({ className }: IconProps) {
  return (
    <HubIcon className={className}>
      <path d="M4 21v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M4 10V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M12 21v-9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M12 8V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M20 21v-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M20 12V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M2 14h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M10 8h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M18 16h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </HubIcon>
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

export function ClockHistoryIcon({ className }: IconProps) {
  return (
    <HubIcon className={className}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
      <path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3 12a9 9 0 0 1 16-5.3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M19 5v4h-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </HubIcon>
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

export function StarsIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M7.657 1.07a.5.5 0 0 1 .686 0l1.64 1.64 2.32-.33a.5.5 0 0 1 .564.564l-.33 2.32 1.64 1.64a.5.5 0 0 1 0 .686l-1.64 1.64.33 2.32a.5.5 0 0 1-.564.564l-2.32-.33-1.64 1.64a.5.5 0 0 1-.686 0l-1.64-1.64-2.32.33a.5.5 0 0 1-.564-.564l.33-2.32-1.64-1.64a.5.5 0 0 1 0-.686l1.64-1.64-.33-2.32a.5.5 0 0 1 .564-.564l2.32.33 1.64-1.64Z" />
    </svg>
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

export function SpinnerIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" opacity="0.25" />
      <path d="M12 3a9 9 0 0 1 9 9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  )
}
