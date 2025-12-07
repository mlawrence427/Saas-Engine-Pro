// ============================================================
// frontend/components/ui/Toaster.tsx - SaaS Engine Pro
// Toast Notification System
// ============================================================

"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";

// ============================================================
// TYPES
// ============================================================

type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextValue {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
}

// ============================================================
// CONTEXT
// ============================================================

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

// ============================================================
// PROVIDER
// ============================================================

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const addToast = useCallback(
    (toast: Omit<Toast, "id">) => {
      const id = Math.random().toString(36).substring(2, 9);
      const duration = toast.duration ?? 5000;

      setToasts((prev) => [...prev, { ...toast, id }]);

      // Auto-remove after duration
      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  // Convenience methods
  const success = useCallback(
    (title: string, message?: string) => {
      addToast({ type: "success", title, message });
    },
    [addToast]
  );

  const error = useCallback(
    (title: string, message?: string) => {
      addToast({ type: "error", title, message, duration: 7000 });
    },
    [addToast]
  );

  const warning = useCallback(
    (title: string, message?: string) => {
      addToast({ type: "warning", title, message });
    },
    [addToast]
  );

  const info = useCallback(
    (title: string, message?: string) => {
      addToast({ type: "info", title, message });
    },
    [addToast]
  );

  const value: ToastContextValue = {
    toasts,
    addToast,
    removeToast,
    success,
    error,
    warning,
    info,
  };

  return (
    <ToastContext.Provider value={value}>{children}</ToastContext.Provider>
  );
}

// ============================================================
// HOOK
// ============================================================

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

// ============================================================
// TOASTER COMPONENT (renders the toasts)
// ============================================================

export function Toaster() {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
      ))}
    </div>
  );
}

// ============================================================
// TOAST ITEM COMPONENT
// ============================================================

function ToastItem({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  const styles: Record<ToastType, { bg: string; icon: string; border: string }> = {
    success: {
      bg: "bg-green-500/10",
      border: "border-green-500/20",
      icon: "✓",
    },
    error: {
      bg: "bg-red-500/10",
      border: "border-red-500/20",
      icon: "✕",
    },
    warning: {
      bg: "bg-yellow-500/10",
      border: "border-yellow-500/20",
      icon: "⚠",
    },
    info: {
      bg: "bg-blue-500/10",
      border: "border-blue-500/20",
      icon: "ℹ",
    },
  };

  const iconColors: Record<ToastType, string> = {
    success: "text-green-400 bg-green-500/20",
    error: "text-red-400 bg-red-500/20",
    warning: "text-yellow-400 bg-yellow-500/20",
    info: "text-blue-400 bg-blue-500/20",
  };

  const style = styles[toast.type];

  return (
    <div
      className={`${style.bg} ${style.border} border rounded-xl p-4 shadow-lg backdrop-blur-sm animate-slide-in`}
      role="alert"
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div
          className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-sm ${iconColors[toast.type]}`}
        >
          {style.icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-white text-sm">{toast.title}</p>
          {toast.message && (
            <p className="text-gray-400 text-sm mt-0.5">{toast.message}</p>
          )}
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-white transition-colors flex-shrink-0"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}

// ============================================================
// STANDALONE TOASTER (includes provider)
// Use this in layout.tsx if you want a self-contained solution
// ============================================================

export function ToasterWithProvider({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      {children}
      <ToasterConsumer />
    </ToastProvider>
  );
}

function ToasterConsumer() {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
      ))}
    </div>
  );
}

// ============================================================
// CSS (add to globals.css)
// ============================================================

/*
@keyframes slide-in {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.animate-slide-in {
  animation: slide-in 0.2s ease-out;
}
*/