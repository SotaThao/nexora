import React, { createContext, useContext, useState, useCallback } from 'react'
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react'
import { useTranslation } from './LanguageContext'

const NotificationContext = createContext()

export function NotificationProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const [confirmState, setConfirmState] = useState(null) // { message, title, resolve }
  const { t } = useTranslation()

  const showToast = useCallback((message, type = 'success', duration = 3000) => {
    const id = Date.now() + Math.random()
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, duration)
  }, [])

  const showConfirm = useCallback((message, title = '') => {
    return new Promise((resolve) => {
      setConfirmState({
        message,
        title,
        resolve: (val) => {
          setConfirmState(null)
          resolve(val)
        }
      })
    })
  }, [])

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <NotificationContext.Provider value={{ showToast, showConfirm }}>
      {children}
      
      {/* Sleek Premium Toast Overlay */}
      <div className="fixed top-5 right-5 z-[99999] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => {
          const Icon = {
            success: CheckCircle2,
            error: XCircle,
            warning: AlertTriangle,
            info: Info
          }[toast.type] || Info

          const colors = {
            success: 'border-emerald-100 bg-emerald-50/95 text-emerald-950 shadow-emerald-100/20',
            error: 'border-rose-100 bg-rose-50/95 text-rose-950 shadow-rose-100/20',
            warning: 'border-amber-100 bg-amber-50/95 text-amber-950 shadow-amber-100/20',
            info: 'border-indigo-100 bg-indigo-50/95 text-indigo-950 shadow-indigo-100/20'
          }[toast.type] || 'border-slate-100 bg-white/95 text-slate-900 shadow-slate-100/20'

          const iconColor = {
            success: 'text-emerald-500',
            error: 'text-rose-500',
            warning: 'text-amber-500',
            info: 'text-indigo-500'
          }[toast.type] || 'text-slate-500'

          return (
            <div
              key={toast.id}
              className={`flex gap-3 items-start p-4 rounded-xl border shadow-xl backdrop-blur-md pointer-events-auto transform transition-all duration-300 animate-slide-in-right ${colors}`}
              style={{
                animation: 'toastSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards'
              }}
            >
              <Icon className={`h-5 w-5 shrink-0 ${iconColor}`} />
              <p className="text-xs font-bold leading-normal flex-grow">{toast.message}</p>
              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                className="text-slate-400 hover:text-slate-600 transition-colors shrink-0"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )
        })}
      </div>

      {/* Sleek Premium Confirm Dialog Overlay */}
      {confirmState && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[99998] flex items-center justify-center p-4">
          <div 
            className="bg-white border border-slate-100 shadow-2xl rounded-2xl max-w-sm w-full overflow-hidden p-6 transform transition-all duration-300 animate-scale-in"
            style={{
              animation: 'confirmScaleIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards'
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
                {t('common.cancel') || 'Hủy'}
              </button>
              <button
                type="button"
                onClick={() => confirmState.resolve(true)}
                className="px-4.5 py-2.5 rounded-xl bg-nexoraBrand text-white text-[10px] font-extrabold uppercase tracking-wider hover:bg-nexoraBrand/90 transition-colors shadow-sm"
              >
                {t('common.confirm') || 'Xác nhận'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* CSS Keyframes injected directly for compatibility */}
      <style>{`
        @keyframes toastSlideIn {
          from {
            opacity: 0;
            transform: translateX(100px) scale(0.9);
          }
          to {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
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
  )
}

export function useNotification() {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider')
  }
  return context
}
