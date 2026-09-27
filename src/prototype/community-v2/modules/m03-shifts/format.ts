import type { Shift } from "../../store/types";
import { HOUR, MINUTE, ms } from "./rules";

const WEEKDAYS = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
const pad = (value: number) => String(value).padStart(2, "0");

const startOfDay = (time: number) => {
  const date = new Date(time);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
};

export function timeLabel(iso: string) {
  const date = new Date(iso);
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function dateLabel(iso: string) {
  const date = new Date(iso);
  return `${WEEKDAYS[date.getDay()]} ${pad(date.getDate())}/${pad(date.getMonth() + 1)}`;
}

/** "Hôm nay" / "Ngày mai" / "Hôm qua" relative to the demo clock, otherwise "T7 03/10". */
export function dayLabel(iso: string, clock: string) {
  const diff = Math.round((startOfDay(ms(iso)) - startOfDay(ms(clock))) / (24 * HOUR));
  if (diff === 0) return "Hôm nay";
  if (diff === 1) return "Ngày mai";
  if (diff === -1) return "Hôm qua";
  return dateLabel(iso);
}

export const shiftWhen = (shift: Shift, clock: string) =>
  `${dayLabel(shift.startsAt, clock)} · ${timeLabel(shift.startsAt)}–${timeLabel(shift.endsAt)}`;

export const clockLabel = (clock: string) => `${dateLabel(clock)} · ${timeLabel(clock)}`;

/** "còn 5 giờ 10 phút" / "đã bắt đầu 20 phút". */
export function untilLabel(iso: string, clock: string) {
  const diff = ms(iso) - ms(clock);
  const abs = Math.abs(diff);
  const hours = Math.floor(abs / HOUR);
  const minutes = Math.round((abs % HOUR) / MINUTE);
  let text = `${minutes} phút`;
  if (hours >= 48) text = `${Math.floor(hours / 24)} ngày`;
  else if (hours) text = `${hours} giờ ${minutes} phút`;
  return diff >= 0 ? `còn ${text}` : `đã bắt đầu ${text}`;
}

export const money = (value: number) => `$${value.toLocaleString("en-US")}`;
