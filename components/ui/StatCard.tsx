'use client'

interface StatCardProps {
  label: string
  value: string | number
  icon: React.ReactNode
  iconBg?: string
}

export default function StatCard({
  label,
  value,
  icon,
  iconBg = 'bg-gray-50'
}: StatCardProps) {
  return (
    <div className="bg-white rounded-md p-4 flex-1 shadow-sm border border-gray-100 flex flex-col justify-between h-[90px]">
      <div className="flex justify-between items-center mb-1">
        <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">{label}</span>
        <div className={`${iconBg} w-8 h-8 rounded flex items-center justify-center shrink-0`}>
          {icon}
        </div>
      </div>
      <div>
        <h3 className="text-2xl font-bold text-[#000000] leading-none mb-1">
          {value}
        </h3>
      </div>
    </div>
  )
}