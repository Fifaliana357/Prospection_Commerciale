import React, { createContext, useContext, useState, useCallback } from "react"
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from "lucide-react"

export type ToastType = "success" | "error" | "info" | "warning"

export interface ToastItem {
  id: string
  type: ToastType
  message: string
  title?: string
}

interface ToastContextType {
  toast: {
    success: (message: string, title?: string) => void
    error: (message: string, title?: string) => void
    info: (message: string, title?: string) => void
    warning: (message: string, title?: string) => void
  }
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider")
  }
  return context.toast
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const addToast = useCallback((type: ToastType, message: string, title?: string) => {
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    setToasts((prev) => [...prev, { id, type, message, title }])

    setTimeout(() => {
      removeToast(id)
    }, 3800)
  }, [removeToast])

  const toast = {
    success: (message: string, title?: string) => addToast("success", message, title),
    error: (message: string, title?: string) => addToast("error", message, title),
    info: (message: string, title?: string) => addToast("info", message, title),
    warning: (message: string, title?: string) => addToast("warning", message, title),
  }

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {/* Toast Container */}
      <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
        {toasts.map((t) => {
          const typeConfig = {
            success: {
              icon: CheckCircle2,
              border: "border-emerald-500/30 dark:border-emerald-500/40",
              bg: "bg-emerald-50/95 dark:bg-emerald-950/90 text-emerald-900 dark:text-emerald-100",
              iconColor: "text-emerald-600 dark:text-emerald-400",
            },
            error: {
              icon: AlertCircle,
              border: "border-red-500/30 dark:border-red-500/40",
              bg: "bg-red-50/95 dark:bg-red-950/90 text-red-900 dark:text-red-100",
              iconColor: "text-red-600 dark:text-red-400",
            },
            warning: {
              icon: AlertTriangle,
              border: "border-amber-500/30 dark:border-amber-500/40",
              bg: "bg-amber-50/95 dark:bg-amber-950/90 text-amber-900 dark:text-amber-100",
              iconColor: "text-amber-600 dark:text-amber-400",
            },
            info: {
              icon: Info,
              border: "border-blue-500/30 dark:border-blue-500/40",
              bg: "bg-blue-50/95 dark:bg-blue-950/90 text-blue-900 dark:text-blue-100",
              iconColor: "text-blue-600 dark:text-blue-400",
            },
          }[t.type]

          const IconComponent = typeConfig.icon

          return (
            <div
              key={t.id}
              className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-xl backdrop-blur-md transition-all duration-300 animate-in slide-in-from-top-3 fade-in ${typeConfig.bg} ${typeConfig.border}`}
            >
              <IconComponent size={20} className={`shrink-0 mt-0.5 ${typeConfig.iconColor}`} />
              <div className="flex-1 min-w-0">
                {t.title && <h5 className="font-semibold text-sm leading-tight mb-0.5">{t.title}</h5>}
                <p className="text-sm leading-snug break-words">{t.message}</p>
              </div>
              <button
                onClick={() => removeToast(t.id)}
                className="shrink-0 p-1 rounded-lg opacity-60 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                aria-label="Fermer"
              >
                <X size={16} />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}
