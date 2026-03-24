'use client'

import { useAppStore } from '@/store/useAppStore'

export default function ToastContainer() {
  const toasts = useAppStore((state) => state.toasts)
  const removeToast = useAppStore((state) => state.removeToast)

  return (
    <div className="fixed top-1 left-1/2 -translate-x-1/2 z-[200] flex flex-col items-center gap-1.5 w-full max-w-sm px-4 pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={() => removeToast(toast.id)} />
      ))}
    </div>
  )
}

function ToastItem({ toast, onRemove }: { toast: any, onRemove: () => void }) {
  const colors = {
    success: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    error: 'bg-red-50 text-red-600 border-red-100',
    warning: 'bg-amber-50 text-amber-600 border-amber-100',
    info: 'bg-slate-50 text-slate-600 border-slate-100',
  }

  const icons = {
    success: 'check_circle',
    error: 'error',
    warning: 'warning',
    info: 'info',
  }

  const type = (toast.type as keyof typeof colors) || 'info'

  return (
    <div
      className={`
        pointer-events-auto
        flex items-center gap-2.5 min-w-[240px] max-w-full px-3 py-1.5 
        rounded-xl border shadow-[0_4px_24px_rgba(0,0,0,0.08)]
        animate-in fade-in slide-in-from-top-6 duration-300 ease-out
        ${colors[type]}
      `}
    >
      <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 bg-white shadow-sm">
        <span className="material-symbols-outlined text-[16px]">
          {icons[type]}
        </span>
      </div>
      
      <div className="flex-1 min-w-0">
        <p className="text-[12px] font-black tracking-tight leading-tight text-slate-800 truncate">
          {toast.message}
        </p>
      </div>

      <button 
        onClick={onRemove}
        className="shrink-0 w-6 h-6 flex items-center justify-center rounded-md hover:bg-black/5 transition-colors group"
      >
        <span className="material-symbols-outlined text-[16px] text-slate-300 group-hover:text-slate-500">close</span>
      </button>
    </div>
  )
}
