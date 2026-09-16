import { CalendarDays, FileText, ListChecks, UserRound, Wallet, type LucideIcon } from 'lucide-react'
import { TWELVE_HOUR_INPUT_LANG } from '../../../constants/timeFormat'
import { ClockIcon } from './BookingHubIcons'
import { openNativeDateTimePicker } from './bookingHubFormatters'

export function PlusIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      width="12"
      height="12"
    >
      <path
        d="M8 3v10M3 8h10"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function SearchIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      width="13"
      height="13"
    >
      <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M10.5 10.5 14 14"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function ChevronDownIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      width="12"
      height="12"
    >
      <path
        d="m4 6 4 4 4-4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function PersonPlusIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      width="16"
      height="16"
    >
      <circle cx="6.5" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.4" />
      <path
        d="M2.5 13c0-2.2 1.8-4 4-4s4 1.8 4 4"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <path
        d="M12 4v4M10 6h4"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function PeopleIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      width="13"
      height="13"
    >
      <circle cx="5.5" cy="5" r="2.2" stroke="currentColor" strokeWidth="1.3" />
      <path
        d="M1.5 13c0-2 1.8-3.6 4-3.6"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
      <circle cx="11" cy="6" r="1.8" stroke="currentColor" strokeWidth="1.3" />
      <path
        d="M8.5 13c.2-1.8 1.6-3.2 3.5-3.2 1 0 1.9.4 2.5 1"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  );
}

function TechnicianSectionIcon({ icon: Icon }: { icon: LucideIcon }) {
  return (
    <span aria-hidden="true" className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-nexoraBrand/10 text-nexoraBrand">
      <Icon className="h-4 w-4" strokeWidth={1.75} />
    </span>
  )
}

export function PersonCardIcon() {
  return <TechnicianSectionIcon icon={UserRound} />
}

export function ServicesListIcon() {
  return <TechnicianSectionIcon icon={ListChecks} />
}

export function RolePayIcon() {
  return <TechnicianSectionIcon icon={Wallet} />
}

export function TaxFilingIcon() {
  return <TechnicianSectionIcon icon={FileText} />
}

export function CalendarWeekIcon() {
  return <TechnicianSectionIcon icon={CalendarDays} />
}

export function TechScheduleTimeBox({
  value,
  disabled,
  invalid,
  ariaLabel,
  onChange,
}: {
  value: string;
  disabled: boolean;
  invalid: boolean;
  ariaLabel: string;
  onChange: (next: string) => void;
}) {
  return (
    <div
      className="settings-time-box"
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-label={ariaLabel}
      onClick={(event) => {
        event.stopPropagation();
        if (disabled) return;
        const input = event.currentTarget.querySelector("input");
        if (input instanceof HTMLInputElement) {
          openNativeDateTimePicker(input);
        }
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          event.stopPropagation();
          if (disabled) return;
          openNativeDateTimePicker(
            event.currentTarget.querySelector("input"),
          );
        }
      }}
    >
      <input
        className="settings-hour-input"
        type="time"
        value={value}
        lang={TWELVE_HOUR_INPUT_LANG}
        step={60}
        disabled={disabled}
        aria-invalid={invalid}
        aria-label={ariaLabel}
        onClick={(event) => event.stopPropagation()}
        onChange={(event) => onChange(event.target.value)}
      />
      <ClockIcon />
    </div>
  );
}

export function CloseIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      width="14"
      height="14"
    >
      <path
        d="m4 4 8 8M12 4 4 12"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function CheckIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      width="13"
      height="13"
    >
      <path
        d="m3.5 8.5 3 3 6-6"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
