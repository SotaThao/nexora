import { useSyncExternalStore } from "react";

/**
 * Module-level toast queue for M03 + admin screens. The shared `ToastProvider` is not mounted by the shell in
 * this base revision (so `useToast()` is a no-op), and a per-screen provider would drop a toast when the screen
 * navigates away right after showing it. This queue survives route changes; every M03 screen renders the host.
 * Same look as the shared toast (bottom on mobile above the nav, top-right on desktop).
 */
type Tone = "success" | "danger" | "info";
type Item = { id: number; text: string; tone: Tone };

const BORDER: Record<Tone, string> = {
  success: "border-nexoraSuccess",
  danger: "border-nexoraDanger",
  info: "border-nexoraBorder",
};

let items: Item[] = [];
let seq = 0;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((listener) => listener());

export function showShiftToast(text: string, tone: Tone = "info") {
  seq += 1;
  const id = seq;
  items = [...items.slice(-2), { id, text, tone }];
  notify();
  window.setTimeout(() => {
    items = items.filter((item) => item.id !== id);
    notify();
  }, 3600);
}

export function useShiftToast() {
  return showShiftToast;
}

export function ShiftToastHost() {
  const list = useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => items,
  );
  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-4 bottom-20 z-[70] space-y-2 lg:inset-x-auto lg:bottom-auto
        lg:right-5 lg:top-20 lg:w-96"
    >
      {list.map((item) => (
        <div
          key={item.id}
          role="status"
          className={`rounded-xl border bg-white p-3 text-sm font-medium text-nexoraText shadow-premium ${
            BORDER[item.tone]
          }`}
        >
          {item.text}
        </div>
      ))}
    </div>
  );
}
