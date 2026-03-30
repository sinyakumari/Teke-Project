'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '@/store/useAppStore'

interface SummaryDrawerProps {
  lessonName: string
  summary: string[]
  onClose: () => void
  onUpdate: (updated: string[]) => Promise<void>
  loading?: boolean
  onRegenerate?: () => Promise<void>
}

export default function SummaryDrawer({
  lessonName,
  summary: initialSummary,
  onClose,
  onUpdate,
  onRegenerate,
  loading
}: SummaryDrawerProps) {
  const [bullets, setBullets] = useState<string[]>(initialSummary)
  const [editingIdx, setEditingIdx] = useState<number | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const addToast = useAppStore((state) => state.addToast)

  // Sync internal state
  useEffect(() => {
    setBullets(initialSummary)
  }, [initialSummary])

  // Click outside to close - This is enough to allow interactions elsewhere
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    // Small delay to prevent closing when clicking expand button
    setTimeout(() => {
      document.addEventListener('mousedown', handleOutsideClick)
    }, 100)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [onClose])

  const handleUpdateBullet = (idx: number, val: string) => {
    const newBullets = [...bullets]
    newBullets[idx] = val
    setBullets(newBullets)
  }

  const handleAddBullet = () => {
    const newBullets = [...bullets, 'New summary point...']
    setBullets(newBullets); setEditingIdx(newBullets.length - 1)
  }

  const handleDeleteBullet = (idx: number) => {
    setBullets(bullets.filter((_, i) => i !== idx))
    setEditingIdx(null)
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await onUpdate(bullets.filter(b => b.trim() !== ''))
      addToast('Summary updated', 'success')
      setEditingIdx(null)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    // FLOAT SIDE-BY-SIDE DESIGN: We position it to the left of the main TrainingDrawer (500px width)
    <div className="fixed top-0 bottom-0 md:right-[500px] right-0 z-[120] pointer-events-none h-full">
      
      {/* Drawer Panel - Matches TrainingDrawer height exactly */}
      <motion.div
        ref={containerRef}
        initial={{ x: 200, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 200, opacity: 0 }}
        className="relative w-screen max-w-sm sm:max-w-md bg-[#f9fafb] shadow-2xl flex flex-col border-l border-slate-100 rounded-none pointer-events-auto h-full overflow-hidden"
      >
        {/* Header content... everything remains the same */}
        <div className="p-3 bg-white border-b border-slate-100 flex items-center justify-between sticky top-0 z-10">
          <div className="overflow-hidden pr-4">
            <h2 className="text-[12px] font-bold text-[#1a1f2e] truncate">{lessonName}</h2>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 bg-slate-50 flex items-center justify-center text-slate-400 hover:text-[#1a1f2e] transition-all"
          >
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-20 scrollbar-hide">
          <h3 className="text-[8px] font-extrabold text-slate-400 uppercase tracking-widest leading-none">{lessonName} Outline</h3>
          <div className="space-y-1">
             {bullets.map((bullet, idx) => (
               <div
                 key={idx}
                 className={`group bg-white border-b border-slate-50 p-2 transition-all ${
                   editingIdx === idx ? 'bg-blue-50/30' : 'hover:bg-slate-50/50'
                 }`}
               >
                 {editingIdx === idx ? (
                   <textarea
                     autoFocus
                     value={bullet}
                     onChange={(e) => handleUpdateBullet(idx, e.target.value)}
                     onBlur={() => setEditingIdx(null)}
                     className="w-full bg-transparent border-none text-[10px] font-semibold text-slate-800 focus:ring-0 resize-none p-0 min-h-[40px]"
                   />
                 ) : (
                   <div className="flex gap-2 relative">
                     <span className="w-1 h-1 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                     <p className="flex-1 text-[10px] text-slate-800 font-semibold leading-normal pr-6" onClick={() => setEditingIdx(idx)}>
                       {bullet}
                     </p>
                     
                     <div className="absolute top-0 right-0 flex items-center gap-1 opacity-0 group-hover:opacity-100">
                        <button onClick={() => setEditingIdx(idx)} className="text-slate-300 hover:text-blue-500">
                          <span className="material-symbols-outlined text-[12px]">edit</span>
                        </button>
                        <button onClick={() => handleDeleteBullet(idx)} className="text-slate-200 hover:text-red-500">
                           <span className="material-symbols-outlined text-[12px]">delete</span>
                        </button>
                     </div>
                   </div>
                 )}
               </div>
             ))}

             <button
               onClick={handleAddBullet}
               className="w-full py-2 flex items-center justify-center gap-1 text-slate-400 hover:text-blue-500 transition-all border border-dashed border-slate-100 mt-2"
             >
                <span className="material-symbols-outlined text-[14px]">add_circle</span>
                <span className="text-[8px] font-bold uppercase tracking-widest">Add Point</span>
             </button>
          </div>
        </div>

        <div className="p-3 bg-white border-t border-slate-100 flex items-center justify-between gap-2 absolute bottom-0 left-0 right-0 shadow-sm">
          <button
            onClick={onClose}
            className="w-[110px] h-[34px] flex items-center justify-center border border-slate-200 text-[#1a1f2e] text-[8px] font-bold uppercase tracking-widest hover:bg-slate-50 transition-all"
          >
            Cancel
          </button>
          
          {onRegenerate && (
            <button
              onClick={async () => {
                await onRegenerate()
              }}
              disabled={loading}
              className="w-[110px] h-[34px] flex items-center justify-center gap-1 border border-slate-200 text-[#1a1f2e] text-[8px] font-bold uppercase tracking-widest hover:bg-slate-50 transition-all disabled:opacity-50"
            >
              <span className={`material-symbols-outlined text-[10px] ${loading ? 'animate-spin' : ''}`}>refresh</span>
              {loading ? 'Wait...' : 'Regenerate'}
            </button>
          )}

          <button
            onClick={handleSave}
            disabled={isSaving || loading}
            className="flex-1 h-[34px] bg-[#1a1f2e] text-white text-[8px] font-bold uppercase tracking-widest shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSaving ? <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <>Save Changes ✓</>}
          </button>
        </div>
      </motion.div>
    </div>
  )
}
