'use client'

import { formatDate } from '@/lib/utils'

interface Task {
    _id: string
    name: string
    status: string
    deadline?: string
    blockedBy?: { _id: string; name: string }[]
    trainingId?: { _id: string; title: string }
}

interface TaskCardProps {
    task: Task
    onClick: () => void
}

const statusColors: Record<string, string> = {
    Pending: 'text-gray-500 border-gray-300',
    'In Progress': 'text-blue-500 border-blue-300',
    Complete: 'text-green-500 border-green-300',
    Delayed: 'text-orange-500 border-orange-300',
    Canceled: 'text-red-500 border-red-300',
}

export default function TaskCard({ task, onClick }: TaskCardProps) {
    const isBlocked = task.blockedBy && task.blockedBy.length > 0
    const blockerName = isBlocked ? task.blockedBy![0].name : null

    return (
        <div
            onClick={onClick}
            className={`bg-white rounded-2xl p-4 shadow-sm cursor-pointer active:scale-95 transition-transform ${isBlocked ? 'opacity-70' : ''
                }`}
        >
            <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        {isBlocked && (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                <rect x="3" y="11" width="18" height="11" rx="2" stroke="#9ca3af" strokeWidth="2" />
                                <path d="M7 11V7C7 4.79086 9.23858 3 12 3C14.7614 3 17 4.79086 17 7V11" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                        )}
                        <p className={`font-semibold text-sm ${isBlocked ? 'text-gray-400' : 'text-[#1a1f2e]'}`}>
                            {task.name}
                        </p>
                    </div>

                    {task.trainingId && (
                        <div className="flex items-center gap-1 mb-1">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                                <path d="M12 3L22 8.5V10H2V8.5L12 3Z" stroke="#9ca3af" strokeWidth="2" />
                            </svg>
                            <span className="text-xs text-gray-400 border border-gray-200 rounded-full px-2 py-0.5">
                                {task.trainingId.title}
                            </span>
                        </div>
                    )}

                    {isBlocked && blockerName && (
                        <div className="flex items-center gap-1 mt-1">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                                <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" stroke="#f97316" strokeWidth="2" strokeLinecap="round" />
                                <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" stroke="#f97316" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                            <span className="text-xs text-orange-500">
                                Blocked by &quot;{blockerName}&quot;
                            </span>
                        </div>
                    )}

                    {task.deadline && (
                        <div className="flex items-center gap-1 mt-1">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                                <rect x="3" y="4" width="18" height="18" rx="2" stroke="#9ca3af" strokeWidth="2" />
                                <path d="M3 9H21M8 2V6M16 2V6" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                            <span className="text-xs text-gray-400">
                                {formatDate(task.deadline)}
                            </span>
                        </div>
                    )}

                    {!task.deadline && (
                        <div className="flex items-center gap-1 mt-1">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                                <rect x="3" y="4" width="18" height="18" rx="2" stroke="#9ca3af" strokeWidth="2" />
                                <path d="M3 9H21M8 2V6M16 2V6" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                            <span className="text-xs text-gray-400">No deadline</span>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    <span
                        className={`text-xs border rounded-full px-2 py-0.5 flex items-center gap-1 ${statusColors[task.status] || 'text-gray-500 border-gray-300'
                            }`}
                    >
                        <span className="w-1.5 h-1.5 rounded-full bg-current inline-block" />
                        {task.status}
                    </span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M9 18L15 12L9 6" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </div>
            </div>
        </div>
    )
}