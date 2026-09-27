import { useSyncExternalStore } from "react";

/**
 * M04-local toasts. The shared shell does not mount the components `ToastProvider` yet, and M04 toasts often
 * fire right before a navigation (publish → list, claim → wallet), so the queue lives at module level and every
 * M04 screen renders <ToastLayer />. Same look/position as the shared toast. Swap back to the shared
 * `useToast` once L0 mounts the provider in the shell.
 */
type Tone = "success" | "danger" | "info";
type Item = { id: number; text: string; tone: Tone };

let items: Item[] = [];
let seq = 0;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export function showToast(text: string, tone: Tone = "info") {
  seq += 1;
  const id = seq;
  items = [...items, { id, text, tone }];
  emit();
  window.setTimeout(() => {
    items = items.filter((i) => i.id !== id);
    emit();
  }, 3400);
}

export function useToast() {
  return showToast;
}

export function ToastLayer() {
  const list = useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => items,
  );
  return (
    <div
      aria-live="polite"
      data-testid="m04-toasts"
      className="fixed inset-x-4 bottom-20 z-[70] space-y-2 lg:inset-x-auto lg:bottom-auto lg:right-5 lg:top-20 lg:w-96"
    >
      {list.map((item) => (
        <div
          key={item.id}
          role={item.tone === "danger" ? "alert" : "status"}
          className={`rounded-xl border bg-white p-3 text-sm font-medium shadow-premium ${
            item.tone === "danger" ? "border-nexoraDanger text-nexoraDanger" : item.tone === "success"
              ? "border-nexoraSuccess/40" : "border-nexoraBorder"
          }`}
      >
          {item.text}
        </div>
      ))}
    </div>
  );
}
