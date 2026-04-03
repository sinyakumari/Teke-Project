'use client'

import { useState } from 'react'
import { formatDateRange, formatDateCustom } from '@/lib/utils'

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

interface TrainingCardProps {
    training: Training
    taskCount: number
    completedCount: number
    onClick: () => void
    onEditClick?: (e: React.MouseEvent) => void
    onMenuClick: (e: React.MouseEvent) => void
    onTrainingUpdate?: () => void
}

export default function TrainingCard({
    training,
    taskCount,
    completedCount,
    onClick,
    onEditClick,
    onMenuClick,
    onTrainingUpdate
}: TrainingCardProps) {
    const [isEditing, setIsEditing] = useState(false)
    const [editTitle, setEditTitle] = useState(training.title)
    const [isSaving, setIsSaving] = useState(false)

    const progress = taskCount > 0 ? (completedCount / taskCount) * 100 : 0

    async function saveTitle() {
        if (!editTitle.trim() || editTitle.trim() === training.title) {
            setIsEditing(false)
            return
        }

        setIsSaving(true)
        try {
            const res = await fetch(`/api/trainings/${training.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: editTitle.trim() }),
            })
            
            if (res.ok && onTrainingUpdate) {
                onTrainingUpdate()
            }
        } catch (error) {
            console.error('Error updating training title:', error)
        } finally {
            setIsSaving(false)
            setIsEditing(false)
        }
    }

    function handleKeyDown(e: React.KeyboardEvent) {
        if (e.key === 'Enter') {
            saveTitle()
        } else if (e.key === 'Escape') {
            setIsEditing(false)
            setEditTitle(training.title)
        }
    }

    return (
        <div
            onClick={isEditing ? undefined : onClick}
            className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 cursor-pointer hover:shadow-md active:scale-[0.98] transition-all"
        >
            <div className="flex items-start justify-between mb-2">
                {isEditing ? (
                    <input
                        type="text"
                        autoFocus
                        value={editTitle}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onBlur={() => saveTitle()}
                        onKeyDown={handleKeyDown}
                        className="bg-white border-2 border-[#1a1f2e] rounded-lg px-2 py-1 font-semibold outline-none w-full mr-2 text-base"
                    />
                ) : (
                    <h3 
                        onClick={(e) => {
                            e.stopPropagation()
                            setIsEditing(true)
                        }}
                        className="font-semibold text-[#1a1f2e] text-base flex-1 pr-2"
                    >
                        {training.title}
                    </h3>
                )}
                <div className="flex items-center gap-1">
                    <span className="text-[12px] font-medium text-[#1a1f2e] capitalize mr-1">
                        {training.category || 'general'}
                    </span>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onEditClick?.(e);
                        }}
                        className="p-1.5 hover:bg-gray-100 rounded-lg text-slate-400 hover:text-[#1a1f2e] transition-colors"
                        title="Edit Training"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                    </button>
                </div>
            </div>

            <div className="flex items-center gap-1 text-gray-500 text-sm mb-1">
                {training.location_type === 'online' ? (
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
                    {training.instructor || 'No instructor'} · {training.location_type}
                </span>
            </div>

            <div className="flex items-center gap-1 text-gray-500 text-[11px] mb-3 font-medium uppercase tracking-wider">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <rect x="3" y="4" width="18" height="18" rx="2" stroke="#6b7280" strokeWidth="2" />
                    <path d="M3 9H21M8 2V6M16 2V6" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" />
                </svg>
                <span>{formatDateCustom(training.end_date)}</span>
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