'use client'

import { useAppStore } from '@/store/useAppStore'

export default function ToastContainer() {
  const toasts = useAppStore((state) => state.toasts)
  const removeToast = useAppStore((state) => state.removeToast)

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[200] flex flex-col gap-3 w-full max-w-sm px-4 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`
            pointer-events-auto
            flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl border
            animate-in fade-in slide-in-from-top-4 duration-300
            ${
              toast.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-800' :
              toast.type === 'error' ? 'bg-red-50 border-red-100 text-red-800' :
              toast.type === 'warning' ? 'bg-amber-50 border-amber-100 text-amber-800' :
              'bg-white border-slate-200 text-slate-800'
            }
          `}
        >
          <span className="material-symbols-outlined text-[20px] shrink-0">
            {toast.type === 'success' ? 'check_circle' :
             toast.type === 'error' ? 'error' :
             toast.type === 'warning' ? 'warning' :
             'info'}
          </span>
          <p className="text-sm font-bold truncate">{toast.message}</p>
          <button 
            onClick={() => removeToast(toast.id)}
            className="ml-auto p-1 hover:bg-black/5 rounded-lg transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
      ))}
    </div>
  )
}
