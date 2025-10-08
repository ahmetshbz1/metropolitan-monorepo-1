import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";

type ToastType = "info" | "success" | "error" | "warning";

export interface ToastOptions {
  title: string;
  description?: string;
  type?: ToastType;
  duration?: number;
}

interface ToastItem extends ToastOptions {
  id: number;
  type: ToastType;
  duration: number;
}

interface ToastContextValue {
  showToast: (options: ToastOptions) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

const TYPE_STYLES: Record<ToastType, string> = {
  success: "border-green-200 bg-green-50 text-green-700 dark:border-green-700/60 dark:bg-green-950/40 dark:text-green-300",
  error: "border-red-200 bg-red-50 text-red-700 dark:border-red-800/60 dark:bg-red-950/40 dark:text-red-300",
  info: "border-slate-200 bg-white text-slate-700 dark:border-slate-700/60 dark:bg-[#0f172a] dark:text-slate-200",
  warning: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-700/60 dark:bg-amber-950/40 dark:text-amber-300",
};

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const counterRef = useRef(0);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    ({ title, description, type = "info", duration = 4000 }: ToastOptions) => {
      counterRef.current += 1;
      const id = counterRef.current;

      setToasts((prev) => [
        ...prev,
        {
          id,
          title,
          description,
          type,
          duration,
        },
      ]);

      setTimeout(() => {
        removeToast(id);
      }, duration);
    },
    [removeToast]
  );

  const contextValue = useMemo<ToastContextValue>(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <div className="pointer-events-none fixed top-4 right-4 z-[2000] flex w-full max-w-sm flex-col gap-3">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex flex-col gap-1 rounded-xl border px-4 py-3 shadow-lg shadow-slate-900/10 backdrop-blur ${TYPE_STYLES[toast.type]}`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <p className="text-sm font-medium leading-5">{toast.title}</p>
                {toast.description ? (
                  <p className="mt-1 text-xs leading-5 opacity-90">{toast.description}</p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                className="mt-0.5 text-xs font-medium uppercase tracking-wide text-current/70 transition hover:text-current"
              >
                Kapat
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToastContext = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToastContext yalnızca ToastProvider içinde kullanılabilir");
  }
  return context;
};
