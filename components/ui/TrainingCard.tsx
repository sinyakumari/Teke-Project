'use client'

import { formatDateRange } from '@/lib/utils'

interface Training {
    _id: string
    title: string
    instructor: string
    locationType: string
    locationName?: string
    startDate?: string
    endDate?: string
    category: string
    status: string
}

interface TrainingCardProps {
    training: Training
    taskCount: number
    completedCount: number
    onClick: () => void
    onMenuClick: (e: React.MouseEvent) => void
}

export default function TrainingCard({
    training,
    taskCount,
    completedCount,
    onClick,
    onMenuClick,
}: TrainingCardProps) {
    const progress = taskCount > 0 ? (completedCount / taskCount) * 100 : 0

    return (
        <div
            onClick={onClick}
            className="bg-white rounded-2xl p-4 shadow-sm cursor-pointer active:scale-95 transition-transform"
        >
            <div className="flex items-start justify-between mb-2">
                <h3 className="font-bold text-[#1a1f2e] text-base flex-1 pr-2">
                    {training.title}
                </h3>
                <div className="flex items-center gap-2">
                    <span className="bg-[#1a1f2e] text-white text-xs font-bold px-3 py-1 rounded-full">
                        {training.category.toUpperCase()}
                    </span>
                    <button
                        onClick={onMenuClick}
                        className="p-1 hover:bg-gray-100 rounded-full"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                            <circle cx="12" cy="5" r="1.5" fill="#6b7280" />
                            <circle cx="12" cy="12" r="1.5" fill="#6b7280" />
                            <circle cx="12" cy="19" r="1.5" fill="#6b7280" />
                        </svg>
                    </button>
                </div>
            </div>

            <div className="flex items-center gap-1 text-gray-500 text-sm mb-1">
                {training.locationType === 'Online' ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <path d="M5 12.5C5 12.5 7 8 12 8C17 8 19 12.5 19 12.5C19 12.5 17 17 12 17C7 17 5 12.5 5 12.5Z" stroke="#6b7280" strokeWidth="2" />
                        <circle cx="12" cy="12.5" r="2.5" stroke="#6b7280" strokeWidth="2" />
                    </svg>
                ) : (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <path d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22C12 22 19 14.25 19 9C19 5.13 15.87 2 12 2Z" stroke="#6b7280" strokeWidth="2" />
                        <circle cx="12" cy="9" r="2.5" stroke="#6b7280" strokeWidth="2" />
                    </svg>
                )}
                <span>
                    {training.instructor || 'No instructor'} · {training.locationType}
                </span>
            </div>

            <div className="flex items-center gap-1 text-gray-500 text-sm mb-3">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <rect x="3" y="4" width="18" height="18" rx="2" stroke="#6b7280" strokeWidth="2" />
                    <path d="M3 9H21M8 2V6M16 2V6" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" />
                </svg>
                <span>{formatDateRange(training.startDate, training.endDate)}</span>
            </div>

            <div className="flex items-center gap-2">
                <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                    <div
                        className="bg-[#1a1f2e] h-1.5 rounded-full transition-all"
                        style={{ width: `${progress}%` }}
                    />
                </div>
                <span className="text-xs text-gray-500">
                    {completedCount}/{taskCount} tasks
                </span>
            </div>
        </div>
    )
}