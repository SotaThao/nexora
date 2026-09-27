import { useEffect, useState } from "react";
import { useStore } from "../../../store";

/** Re-render every `intervalMs` so countdowns, QR windows and "còn N ngày" stay live. */
export function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => window.clearInterval(timer);
  }, [intervalMs]);
  return now;
}

export function useSalonName() {
  const salons = useStore((s) => s.salons);
  return (id: string) => salons.find((salon) => salon.id === id)?.name ?? "Đối tác NEXORA";
}

export function useMe() {
  const role = useStore((s) => s.role);
  const personId = useStore((s) => s.currentPersonId);
  const person = useStore((s) => s.people.find((p) => p.id === s.currentPersonId));
  return { role, personId, person, isGuest: role === "guest" || !personId };
}

export const dealPath = (suffix: string) => `/community-v2/deals${suffix}`;
export const posPath = (suffix: string) => `/community-v2/pos${suffix}`;
