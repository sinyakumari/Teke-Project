'use client'

import { formatDateRange } from '@/lib/utils'

interface Training {
  id: string
  title: string
  instructor: string
  location_type: string
  location_name?: string
  start_date?: string
  end_date?: string
  category: string
  is_archived: boolean
}

interface TrainingTableProps {
  trainings: Training[]
  taskCounts: { training_id: string; total: number; completed: number }[]
  onTrainingClick: (id: string) => void
  onEditClick: (id: string) => void
}

export default function TrainingTable({ trainings, taskCounts, onTrainingClick, onEditClick }: TrainingTableProps) {
  function getProgress(training_id: string) {
    const counts = taskCounts.find((t) => t.training_id === training_id) || { total: 0, completed: 0 }
    const percentage = counts.total > 0 ? (counts.completed / counts.total) * 100 : 0
    return { ...counts, percentage }
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="overflow-x-auto -webkit-overflow-scrolling-touch">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Training Name</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest hidden md:table-cell">Category</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest lg:table-cell hidden">Instructor</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Dates</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Progress</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right w-16">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {trainings.map((training) => {
              const progress = getProgress(training.id)
              return (
                <tr 
                  key={training.id}
                  onClick={() => onTrainingClick(training.id)}
                  className="hover:bg-slate-50/50 cursor-pointer transition-colors group"
                >
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                        <span className="text-[14px] font-bold text-[#1a1f2e] group-hover:text-indigo-600 transition-colors">
                            {training.title}
                        </span>
                        <span className="text-[11px] font-medium text-slate-400 md:hidden">
                            {training.category}
                        </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 hidden md:table-cell">
                    <span className="text-[10px] font-bold bg-indigo-50 text-indigo-600 px-2 py-1 rounded-lg uppercase tracking-tight">
                        {training.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 lg:table-cell hidden">
                    <span className="text-[12px] font-medium text-[#1a1f2e]">
                        {training.instructor}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-[11px] font-medium text-slate-500 whitespace-nowrap">
                        {formatDateRange(training.start_date, training.end_date)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex flex-col items-end gap-1.5">
                        <div className="flex items-center gap-2">
                             <span className="text-[10px] font-bold text-slate-400">{progress.completed}/{progress.total}</span>
                             <span className="text-[11px] font-bold text-[#1a1f2e]">{Math.round(progress.percentage)}%</span>
                        </div>
                        <div className="w-24 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div 
                                className="bg-[#1a1f2e] h-full rounded-full transition-all duration-1000" 
                                style={{ width: `${progress.percentage}%` }}
                            />
                        </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditClick(training.id);
                      }}
                      className="p-1.5 hover:bg-gray-100 rounded-lg text-slate-400 hover:text-[#1a1f2e] transition-colors"
                      title="Edit Training"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
