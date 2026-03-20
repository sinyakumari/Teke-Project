'use client'

interface StatCardProps {
  variant?: 'simple' | 'dual' | 'progress'
  icon?: React.ReactNode
  count?: number
  label?: string
  iconBg?: string
  countColor?: string
  // For 'dual' variant
  pending?: number
  weekCount?: number
  // For 'progress' variant
  percentage?: number
  fraction?: string
}

export default function StatCard({
  variant = 'simple',
  icon,
  count,
  label,
  iconBg = 'bg-gray-100',
  countColor = 'text-black',
  pending,
  weekCount,
  percentage,
  fraction,
}: StatCardProps) {
  if (variant === 'dual') {
    return (
      <div className="bg-black rounded-3xl p-4 flex-1 shadow-md border border-gray-800 relative overflow-hidden flex flex-col justify-between h-[90px]">
        <div>
            <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Pending</span>
                <span className="text-xl font-black text-white leading-none">{pending ?? 0}</span>
            </div>
            <div className="w-full bg-gray-800 h-1 rounded-full">
                <div 
                    className="bg-white h-full rounded-full transition-all duration-1000" 
                    style={{ width: `${Math.min(((pending ?? 0) / (weekCount || 1)) * 100, 100)}%` }}
                />
            </div>
        </div>
        <div className="flex justify-between items-center mt-2">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">This Week</span>
          <span className="text-xl font-black text-white leading-none">{weekCount ?? 0}</span>
        </div>
      </div>
    )
  }

  if (variant === 'progress') {
    return (
      <div className="bg-black rounded-3xl p-4 flex-1 shadow-md border border-gray-800 relative overflow-hidden flex flex-col justify-between h-[90px]">
        <div className="flex justify-between items-start">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Weekly Progress</p>
            <div className="bg-gray-800 px-2 py-0.5 rounded-full">
                <span className="text-[9px] font-black text-white">{fraction ?? '0/0'}</span>
            </div>
        </div>
        <div className="flex items-center justify-between mb-1">
            <h3 className="text-2xl font-black text-white leading-none">{percentage ?? 0}%</h3>
            <div className="w-8 h-8 rounded-full border-[2px] border-gray-800 flex items-center justify-center relative">
                <svg className="absolute inset-0 w-full h-full -rotate-90">
                    <circle 
                        cx="16" cy="16" r="14" fill="transparent" 
                        stroke="white" strokeWidth="2" 
                        strokeDasharray={88}
                        strokeDashoffset={88 - (88 * (percentage ?? 0)) / 100}
                        className="transition-all duration-1000 ease-out"
                        style={{ transformOrigin: 'center', transform: 'scale(1)' }}
                    />
                </svg>
            </div>
        </div>
        <div className="w-full bg-gray-800 h-1 rounded-full">
          <div 
            className="bg-white h-full rounded-full transition-all duration-1000" 
            style={{ width: `${percentage ?? 0}%` }}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="bg-black rounded-3xl p-4 flex-1 shadow-md border border-gray-800 h-[90px] flex flex-col justify-between">
      <div className="flex justify-between items-start">
        <div className="bg-gray-800 w-8 h-8 rounded-xl flex items-center justify-center">
          {icon}
        </div>
        <div className="text-3xl font-black text-white leading-none">
          {count}
        </div>
      </div>
      <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 mt-1">
        {label}
      </div>
    </div>
  )
}