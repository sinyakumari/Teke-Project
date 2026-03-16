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
}

export default function TrainingTable({ trainings, taskCounts, onTrainingClick }: TrainingTableProps) {
  function getProgress(training_id: string) {
    const counts = taskCounts.find((t) => t.training_id === training_id) || { total: 0, completed: 0 }
    const percentage = counts.total > 0 ? (counts.completed / counts.total) * 100 : 0
    return { ...counts, percentage }
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Training Name</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest hidden md:table-cell">Category</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest lg:table-cell hidden">Instructor</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Dates</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Progress</th>
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
                        <span className="text-[14px] font-black text-[#1a1f2e] group-hover:text-indigo-600 transition-colors">
                            {training.title}
                        </span>
                        <span className="text-[11px] font-bold text-slate-400 md:hidden">
                            {training.category}
                        </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 hidden md:table-cell">
                    <span className="text-[10px] font-black bg-indigo-50 text-indigo-600 px-2 py-1 rounded-lg uppercase tracking-tight">
                        {training.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 lg:table-cell hidden">
                    <span className="text-[12px] font-bold text-[#1a1f2e]">
                        {training.instructor}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-[11px] font-bold text-slate-500 whitespace-nowrap">
                        {formatDateRange(training.start_date, training.end_date)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex flex-col items-end gap-1.5">
                        <div className="flex items-center gap-2">
                             <span className="text-[10px] font-black text-slate-400">{progress.completed}/{progress.total}</span>
                             <span className="text-[11px] font-black text-[#1a1f2e]">{Math.round(progress.percentage)}%</span>
                        </div>
                        <div className="w-24 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div 
                                className="bg-[#1a1f2e] h-full rounded-full transition-all duration-1000" 
                                style={{ width: `${progress.percentage}%` }}
                            />
                        </div>
                    </div>
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
