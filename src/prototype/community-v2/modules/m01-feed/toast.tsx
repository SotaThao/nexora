import { useEffect, useState, type ComponentType } from "react";
import { useToast as useSharedToast } from "../../components";

// Fallback toast layer. The shared ToastProvider (components/index.tsx) is not mounted by the L0 shell yet, so
// the shared `useToast()` is a no-op. We always call the shared API too, and only render this layer while the
// shared container is absent from the DOM — once L0 mounts ToastProvider this layer stays silent (no duplicates).
type Tone = "success" | "danger" | "info";
type Item = { id: number; text: string; tone: Tone };
let items: Item[] = [];
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((listener) => listener());
const sharedMounted = () => Boolean(document.querySelector("div.fixed.z-\\[70\\]"));

function push(text: string, tone: Tone) {
  if (sharedMounted()) return;
  const id = Date.now() + Math.random();
  items = [...items, { id, text, tone }];
  emit();
  window.setTimeout(() => {
    items = items.filter((item) => item.id !== id);
    emit();
  }, 3400);
}

export function useToast() {
  const shared = useSharedToast();
  return (text: string, tone: Tone = "info") => {
    shared(text, tone);
    push(text, tone);
  };
}

const TONES: Record<Tone, string> = {
  success: "border-nexoraSuccess/50",
  danger: "border-nexoraDanger",
  info: "border-nexoraBorder",
};

function ToastLayer() {
  const [, force] = useState(0);
  useEffect(() => {
    const listener = () => force((n) => n + 1);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);
  if (!items.length) return null;
  return (
    <div
      role="status"
      className="fixed inset-x-4 bottom-24 z-[69] space-y-2 lg:inset-x-auto lg:bottom-auto lg:right-5 lg:top-20
        lg:w-96"
    >
      {items.map((item) => (
        <div
          key={item.id}
          className={`rounded-xl border bg-white p-3 text-sm font-medium text-nexoraText shadow-premium
            ${TONES[item.tone]}`}
        >
          {item.text}
        </div>
      ))}
    </div>
  );
}

/** Wraps an M01 screen so the fallback toast layer is always mounted with it. */
export function withToasts<P extends object>(Screen: ComponentType<P>) {
  return function ScreenWithToasts(props: P) {
    return (
      <>
        <Screen {...props} />
        <ToastLayer />
      </>
    );
  };
}
