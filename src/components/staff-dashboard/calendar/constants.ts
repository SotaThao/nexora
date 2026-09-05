import { PosOrderStatus } from "../../../constants/posOrderStatus";
import type { StaffBookingCalendarItem } from "../../../data/repositories/staffWorkOrders";

export const STAFF_CALENDAR_SKELETON_COUNT = 4;

export const STAFF_CALENDAR_WEEK_LENGTH = 7;

export const STAFF_CALENDAR_I18N = {
  kicker: "staff_dashboard.calendar.kicker",
  title: "staff_dashboard.titles.calendar",
  today: "staff_dashboard.calendar.today",
  previousDay: "staff_dashboard.calendar.previous_day",
  nextDay: "staff_dashboard.calendar.next_day",
  weekLabel: "staff_dashboard.calendar.week_label",
  heading: "staff_dashboard.calendar.heading",
  headingOne: "staff_dashboard.calendar.heading_one",
  emptyTitle: "staff_dashboard.calendar.empty_title",
  emptyBody: "staff_dashboard.calendar.empty_body",
  loading: "staff_dashboard.calendar.loading",
  back: "staff_dashboard.calendar.back",
  appointmentTitle: "staff_dashboard.calendar.appointment_title",
  appointmentMeta: "staff_dashboard.calendar.appointment_meta",
  durationHours: "staff_dashboard.calendar.duration_hours",
  durationMinutes: "staff_dashboard.calendar.duration_minutes",
  durationHoursMinutes: "staff_dashboard.calendar.duration_hours_minutes",
  salonLabel: "staff_dashboard.calendar.salon_label",
  noSalonTitle: "staff_dashboard.calendar.no_salon_title",
  noSalonBody: "staff_dashboard.calendar.no_salon_body",
  statusAssigned: "staff_dashboard.work_orders.status_assigned",
  statusInService: "staff_dashboard.work_orders.status_in_service",
  statusCompleted: "staff_dashboard.work_orders.status_completed",
} as const;

/** The screen renders exactly what the API returns — see GetMyBookingCalendarQuery. */
export type StaffCalendarAppointment = StaffBookingCalendarItem;

export const STAFF_CALENDAR_STATUS_I18N: Partial<
  Record<PosOrderStatus, string>
> = {
  [PosOrderStatus.Waiting]: STAFF_CALENDAR_I18N.statusAssigned,
  [PosOrderStatus.Pending]: STAFF_CALENDAR_I18N.statusAssigned,
  [PosOrderStatus.Confirmed]: STAFF_CALENDAR_I18N.statusAssigned,
  [PosOrderStatus.InService]: STAFF_CALENDAR_I18N.statusInService,
  [PosOrderStatus.Completed]: STAFF_CALENDAR_I18N.statusCompleted,
};

export const STAFF_CALENDAR_LAYOUT_CLASS = {
  page: "mx-auto w-full max-w-[640px] pb-8",
  calendar: "flex flex-col gap-5",
  header: "flex items-end justify-between gap-4",
  kicker:
    "mb-1.5 text-[11px] font-extrabold uppercase tracking-[0.12em] text-nexoraSubtle",
  title: "m-0 text-[27px] font-black tracking-tight text-nexoraText",
  todayButton:
    "inline-flex min-h-10 shrink-0 items-center justify-center rounded-[13px] border border-nexoraBorder bg-white px-[15px] text-xs font-extrabold text-nexoraText shadow-[0_5px_14px_rgba(15,23,42,0.04)] transition hover:border-nexoraBrand hover:text-nexoraBrand",
  weekShell:
    "rounded-[20px] border border-nexoraBorder bg-white/75 p-[9px] shadow-[0_10px_28px_rgba(15,23,42,0.045)] max-[420px]:-mx-1 max-[420px]:p-[7px]",
  weekNavigation: "flex items-center gap-2",
  week: "flex items-stretch gap-1",
  day: "flex min-h-[66px] min-w-0 flex-1 flex-col items-center justify-center gap-[7px] rounded-[14px] border-0 bg-transparent text-nexoraMuted max-[420px]:min-h-[62px]",
  dayIdle: "hover:bg-nexoraBrandSoft hover:text-nexoraBrand",
  daySelected:
    "bg-gradient-to-br from-[#3f58df] to-[#5841e7] text-white shadow-[0_9px_18px_rgba(70,72,216,0.23)]",
  weekday: "text-[10px] font-bold uppercase",
  date: "text-sm font-black",
  dateToday: "text-nexoraBrand",
  scheduleHead: "flex items-end justify-between gap-3",
  scheduleTitle: "m-0 text-[15px] font-black text-nexoraText",
  duration: "whitespace-nowrap text-xs font-bold text-nexoraMuted",
  list: "mt-3 flex flex-col gap-2.5",
  row: "flex items-stretch gap-2.5 text-inherit no-underline",
  time: "w-[54px] shrink-0 pt-4 text-[11px] font-bold leading-tight text-nexoraMuted max-[420px]:w-12",
  card: "relative flex min-h-[72px] min-w-0 flex-1 items-center justify-between gap-2.5 overflow-hidden rounded-[15px] border border-nexoraBorder bg-white px-3.5 py-[13px] shadow-[0_7px_18px_rgba(15,23,42,0.045)] transition hover:-translate-y-px hover:border-nexoraLavender hover:shadow-[0_10px_22px_rgba(70,72,216,0.09)]",
  cardInService: "bg-[#f8fffc]",
  cardBar: "absolute inset-y-0 left-0 w-1",
  cardBarAssigned: "bg-[#7255f7]",
  cardBarInService: "bg-nexoraSuccess",
  cardBarCompleted: "bg-nexoraSubtle",
  copy: "min-w-0",
  cardTitle:
    "block overflow-hidden text-ellipsis whitespace-nowrap text-[13px] font-extrabold text-nexoraText",
  meta: "mt-1.5 block text-[11px] font-semibold text-nexoraMuted",
  status:
    "inline-flex min-h-6 shrink-0 items-center rounded-full px-2 text-[10px] font-extrabold max-[420px]:hidden",
  statusAssigned: "bg-[#efedff] text-[#5648cd]",
  statusInService: "bg-[#dff8ed] text-[#087b55]",
  statusCompleted: "bg-nexoraSurfaceMuted text-nexoraMuted",
  empty:
    "rounded-[18px] border border-dashed border-nexoraBorder bg-white/60 px-[18px] py-[38px] text-center text-nexoraMuted",
  emptyIcon: "mx-auto mb-2 h-[25px] w-[25px] text-nexoraSubtle",
  emptyTitle: "block text-[13px] font-extrabold text-nexoraText",
  emptyBody: "mt-1 block text-[11px]",
  salonSelect:
    "min-h-10 shrink-0 rounded-[13px] border border-nexoraBorder bg-white px-3 text-xs font-extrabold text-nexoraText shadow-[0_5px_14px_rgba(15,23,42,0.04)] outline-none transition hover:border-nexoraBrand focus:border-nexoraBrand",
  headerActions: "flex shrink-0 items-center gap-2",
  dateNavigation: "flex items-center gap-1",
  dateNavigationButton:
    "grid h-10 w-10 shrink-0 place-items-center rounded-[13px] border border-nexoraBorder bg-white text-nexoraBrand shadow-[0_5px_14px_rgba(15,23,42,0.04)] transition hover:border-nexoraBrand hover:bg-nexoraBrandSoft",
  dateNavigationIcon: "h-4 w-4",
  back: "inline-flex items-center gap-1.5 self-start text-xs font-extrabold text-nexoraBrand",
  backIcon: "h-[15px] w-[15px]",
  navCount:
    "ml-auto inline-flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 text-[11px] font-black",
  navCountIdle: "bg-nexoraElectric/90 text-white",
  navCountActive: "bg-white text-nexoraBrand",
} as const;

export function calendarDayClass(isSelected: boolean) {
  return `${STAFF_CALENDAR_LAYOUT_CLASS.day} ${
    isSelected
      ? STAFF_CALENDAR_LAYOUT_CLASS.daySelected
      : STAFF_CALENDAR_LAYOUT_CLASS.dayIdle
  }`;
}

export function calendarAppointmentCardClass(status: PosOrderStatus) {
  const inService =
    status === PosOrderStatus.InService
      ? ` ${STAFF_CALENDAR_LAYOUT_CLASS.cardInService}`
      : "";
  return `${STAFF_CALENDAR_LAYOUT_CLASS.card}${inService}`;
}

export function calendarAppointmentBarClass(status: PosOrderStatus) {
  if (status === PosOrderStatus.InService)
    return STAFF_CALENDAR_LAYOUT_CLASS.cardBarInService;
  if (status === PosOrderStatus.Completed)
    return STAFF_CALENDAR_LAYOUT_CLASS.cardBarCompleted;
  return STAFF_CALENDAR_LAYOUT_CLASS.cardBarAssigned;
}

export function calendarAppointmentStatusClass(status: PosOrderStatus) {
  if (status === PosOrderStatus.InService)
    return STAFF_CALENDAR_LAYOUT_CLASS.statusInService;
  if (status === PosOrderStatus.Completed)
    return STAFF_CALENDAR_LAYOUT_CLASS.statusCompleted;
  return STAFF_CALENDAR_LAYOUT_CLASS.statusAssigned;
}
