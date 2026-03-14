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
      <div className="bg-white rounded-3xl p-4 flex-1 shadow-sm border border-slate-50 relative overflow-hidden flex flex-col justify-between h-[110px]">
        <div>
            <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Pending</span>
                <span className="text-2xl font-black text-orange-500 leading-none">{pending ?? 0}</span>
            </div>
            <div className="w-full bg-slate-100 h-1 rounded-full">
                <div 
                    className="bg-orange-500 h-full rounded-full transition-all duration-1000" 
                    style={{ width: `${Math.min(((pending ?? 0) / (weekCount || 1)) * 100, 100)}%` }}
                />
            </div>
        </div>
        <div className="flex justify-between items-center mt-2">
          <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">This Week</span>
          <span className="text-2xl font-black text-purple-600 leading-none">{weekCount ?? 0}</span>
        </div>
      </div>
    )
  }

  if (variant === 'progress') {
    return (
      <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl p-4 flex-1 shadow-xl shadow-indigo-100 relative overflow-hidden flex flex-col justify-between h-[110px]">
        <div className="flex justify-between items-start">
            <p className="text-[10px] font-black text-white/60 uppercase tracking-widest">Weekly Progress</p>
            <div className="bg-white/20 backdrop-blur-sm px-2 py-0.5 rounded-full">
                <span className="text-[9px] font-black text-white">{fraction ?? '0/0'}</span>
            </div>
        </div>
        <div className="flex items-center justify-between mb-1">
            <h3 className="text-3xl font-black text-white leading-none">{percentage ?? 0}%</h3>
            <div className="w-10 h-10 rounded-full border-[3px] border-white/20 flex items-center justify-center relative">
                <svg className="absolute inset-0 w-full h-full -rotate-90">
                    <circle 
                        cx="20" cy="20" r="17" fill="transparent" 
                        stroke="white" strokeWidth="3" 
                        strokeDasharray={107}
                        strokeDashoffset={107 - (107 * (percentage ?? 0)) / 100}
                        className="transition-all duration-1000 ease-out"
                        style={{ transformOrigin: 'center', transform: 'scale(1)' }}
                    />
                </svg>
            </div>
        </div>
        <div className="w-full bg-white/20 h-1 rounded-full">
          <div 
            className="bg-white h-full rounded-full shadow-[0_0_8px_rgba(255,255,255,0.7)] transition-all duration-1000" 
            style={{ width: `${percentage ?? 0}%` }}
          />
        </div>
      </div>
    )
  }

  const bgColors: Record<string, string> = {
    'bg-blue-500': 'shadow-blue-100',
    'bg-green-500': 'shadow-green-100',
  }

  const isColored = iconBg.includes('blue') || iconBg.includes('green')

  return (
    <div className={`${isColored ? iconBg : 'bg-white'} rounded-3xl p-4 flex-1 shadow-lg ${isColored ? bgColors[iconBg] : 'shadow-slate-50'} border border-transparent h-[110px] flex flex-col justify-between`}>
      <div className="flex justify-between items-start">
        <div className={`${isColored ? 'bg-white/20' : iconBg} w-9 h-9 rounded-xl flex items-center justify-center`}>
          {icon}
        </div>
        <div className={`text-4xl font-black ${isColored ? 'text-white' : countColor} leading-none`}>
          {count}
        </div>
      </div>
      <div className={`text-[10px] font-black uppercase tracking-widest ${isColored ? 'text-white/80' : 'text-slate-300'}`}>
        {label}
      </div>
    </div>
  )
}