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
