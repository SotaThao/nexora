import { AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { NotificationContextValue, ToastType } from "../types/contexts";
import { useTranslation } from "./LanguageContext";

interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

interface SnackItem extends ToastItem {
  duration: number;
}

interface ConfirmState {
  message: string;
  title: string;
  resolve: (val: boolean) => void;
}

const NOTIFICATION_I18N = {
  close: "common.close",
  cancel: "common.cancel",
  confirm: "common.confirm",
} as const;

const TOAST_ICONS = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
} as const;

const SNACK_TYPE_CLASS: Record<ToastType, string> = {
  success: "border-emerald-100 bg-emerald-50 text-emerald-800",
  error: "border-rose-100 bg-rose-50 text-rose-800",
  warning: "border-amber-100 bg-amber-50 text-amber-800",
  info: "border-indigo-100 bg-indigo-50 text-indigo-800",
};

const SNACK_ICON_CLASS: Record<ToastType, string> = {
  success: "text-emerald-600",
  error: "text-rose-600",
  warning: "text-amber-600",
  info: "text-indigo-600",
};

const SNACK_LAYOUT_CLASS = {
  stack:
    "pointer-events-none fixed right-3 top-3 z-[99999] flex w-[min(22rem,calc(100%-1.5rem))] flex-col gap-2 sm:right-5 sm:top-5",
  card: "pointer-events-auto flex items-start gap-2.5 rounded-xl border px-3.5 py-3 shadow-lg",
  icon: "mt-0.5 h-4 w-4 shrink-0",
  message: "min-w-0 flex-1 text-xs font-semibold leading-relaxed",
  close:
    "shrink-0 rounded-md px-1 text-[10px] font-extrabold uppercase tracking-wide opacity-70 hover:opacity-100",
} as const;

const TOAST_BADGE_CLASS: Record<ToastType, string> = {
  success: "bg-emerald-50 border-emerald-100 text-emerald-600",
  error: "bg-rose-50 border-rose-100 text-rose-600",
  warning: "bg-amber-50 border-amber-100 text-amber-600",
  info: "bg-indigo-50 border-indigo-100 text-indigo-600",
};

const NotificationContext = createContext<NotificationContextValue | null>(
  null,
);

interface NotificationProviderProps {
  children: ReactNode;
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const [toastQueue, setToastQueue] = useState<ToastItem[]>([]);
  const [activeToast, setActiveToast] = useState<ToastItem | null>(null);
  const [snacks, setSnacks] = useState<SnackItem[]>([]);
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);
  const snackTimersRef = useRef<Map<number, number>>(new Map());
  const { t } = useTranslation();

  // Toast messages are shown one at a time as a blocking popup; queue holds the rest.
  useEffect(() => {
    if (activeToast || toastQueue.length === 0) return;
    setActiveToast(toastQueue[0]);
    setToastQueue((prev) => prev.slice(1));
  }, [activeToast, toastQueue]);

  useEffect(() => {
    const timers = snackTimersRef.current;
    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
      timers.clear();
    };
  }, []);

  const dismissSnack = useCallback((id: number) => {
    const timer = snackTimersRef.current.get(id);
    if (timer != null) {
      window.clearTimeout(timer);
      snackTimersRef.current.delete(id);
    }
    setSnacks((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const showToast = useCallback<NotificationContextValue["showToast"]>(
    (message, type = "success", duration) => {
      const id = Date.now() + Math.random();
      if (typeof duration === "number" && duration > 0) {
        setSnacks((prev) => [...prev, { id, message, type, duration }]);
        const timer = window.setTimeout(() => dismissSnack(id), duration);
        snackTimersRef.current.set(id, timer);
        return;
      }
      setToastQueue((prev) => [...prev, { id, message, type }]);
    },
    [dismissSnack],
  );

  const dismissToast = useCallback(() => {
    setActiveToast(null);
  }, []);

  const toastCardRef = useRef<HTMLDivElement>(null);
  const toastCloseButtonRef = useRef<HTMLButtonElement>(null);
  const toastPreviousFocusRef = useRef<HTMLElement | null>(null);

  // Focus management: move focus into the popup on open, trap Tab within it
  // (the backdrop otherwise leaves focus on the trigger, letting keyboard/SR
  // users reach controls behind the overlay), and restore focus on close.
  useEffect(() => {
    if (!activeToast) return;
    toastPreviousFocusRef.current = document.activeElement as HTMLElement | null;
    toastCloseButtonRef.current?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        dismissToast();
        return;
      }
      if (e.key !== "Tab" || !toastCardRef.current) return;
      const focusable = toastCardRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      toastPreviousFocusRef.current?.focus();
    };
  }, [activeToast, dismissToast]);

  const showConfirm = useCallback<NotificationContextValue["showConfirm"]>(
    (message, title = "") => {
      return new Promise<boolean>((resolve) => {
        setConfirmState({
          message,
          title,
          resolve: (val) => {
            setConfirmState(null);
            resolve(val);
          },
        });
      });
    },
    [],
  );

  const ToastIcon = TOAST_ICONS[activeToast?.type ?? "info"];
  const toastBadgeColor = TOAST_BADGE_CLASS[activeToast?.type ?? "info"];

  return (
    <NotificationContext.Provider value={{ showToast, showConfirm }}>
      {children}

      {snacks.length > 0 ? (
        <div className={SNACK_LAYOUT_CLASS.stack}>
          {snacks.map((snack) => {
            const SnackIcon = TOAST_ICONS[snack.type];
            return (
              <div
                key={snack.id}
                role="status"
                className={`${SNACK_LAYOUT_CLASS.card} ${SNACK_TYPE_CLASS[snack.type]}`}
              >
                <SnackIcon
                  className={`${SNACK_LAYOUT_CLASS.icon} ${SNACK_ICON_CLASS[snack.type]}`}
                  aria-hidden="true"
                />
                <p className={SNACK_LAYOUT_CLASS.message}>
                  {snack.message}
                </p>
                <button
                  type="button"
                  className={SNACK_LAYOUT_CLASS.close}
                  onClick={() => dismissSnack(snack.id)}
                >
                  {t(NOTIFICATION_I18N.close)}
                </button>
              </div>
            );
          })}
        </div>
      ) : null}

      {/* Notification popup — blocks interaction until dismissed, one at a time via toastQueue */}
      {activeToast && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[99999] flex items-center justify-center p-4"
          onClick={dismissToast}
        >
          <div
            ref={toastCardRef}
            role="alertdialog"
            aria-modal="true"
            aria-label={activeToast.message}
            className="nexora-toast-card bg-white border border-nexoraBorder shadow-2xl rounded-2xl max-w-sm w-full overflow-hidden p-6 flex flex-col items-center text-center transform transition-all duration-300"
            style={{
              animation:
                "confirmScaleIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full border mb-4 ${toastBadgeColor}`}
            >
              <ToastIcon className="h-6 w-6" />
            </div>
            <p className="text-xs font-semibold text-nexoraMuted leading-relaxed mb-6 overflow-y-auto">
              {activeToast.message}
            </p>
            <button
              type="button"
              ref={toastCloseButtonRef}
              onClick={dismissToast}
              className="px-4.5 py-2.5 rounded-xl bg-nexoraBrand text-white text-[10px] font-extrabold uppercase tracking-wider hover:bg-nexoraBrand/90 transition-colors shadow-sm"
            >
              {t(NOTIFICATION_I18N.close)}
            </button>
          </div>
        </div>
      )}

      {/* Sleek Premium Confirm Dialog Overlay */}
      {confirmState && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[99998] flex items-center justify-center p-4">
          <div
            className="bg-white border border-slate-100 shadow-2xl rounded-2xl max-w-sm w-full overflow-hidden p-6 transform transition-all duration-300 animate-scale-in"
            style={{
              animation:
                "confirmScaleIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards",
            }}
          >
            {confirmState.title && (
              <h4 className="text-sm font-black text-slate-900 mb-2 uppercase tracking-wide">
                {confirmState.title}
              </h4>
            )}
            <p className="text-xs font-semibold text-slate-600 leading-relaxed mb-6">
              {confirmState.message}
            </p>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => confirmState.resolve(false)}
                className="px-4.5 py-2.5 rounded-xl border border-slate-200 text-[10px] font-extrabold uppercase tracking-wider text-slate-600 hover:bg-slate-50 transition-colors"
              >
                {t(NOTIFICATION_I18N.cancel)}
              </button>
              <button
                type="button"
                onClick={() => confirmState.resolve(true)}
                className="px-4.5 py-2.5 rounded-xl bg-nexoraBrand text-white text-[10px] font-extrabold uppercase tracking-wider hover:bg-nexoraBrand/90 transition-colors shadow-sm"
              >
                {t(NOTIFICATION_I18N.confirm)}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CSS Keyframes injected directly for compatibility */}
      <style>{`
        .nexora-toast-card {
          max-height: 90vh;
          max-height: 90dvh;
        }
        @keyframes confirmScaleIn {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(10px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
      `}</style>
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotification must be used within a NotificationProvider",
    );
  }
  return context;
}
