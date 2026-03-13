interface StatCardProps {
    icon: React.ReactNode
    count: number
    label: string
    iconBg?: string
    countColor?: string
}

export default function StatCard({
    icon,
    count,
    label,
    iconBg = 'bg-gray-100',
    countColor = 'text-black',
}: StatCardProps) {
    return (
        <div className="bg-white rounded-2xl p-4 flex-1 shadow-sm">
            <div className={`${iconBg} w-10 h-10 rounded-xl flex items-center justify-center mb-3`}>
                {icon}
            </div>
            <div className={`text-3xl font-bold ${countColor}`}>{count}</div>
            <div className="text-sm text-gray-500 mt-1">{label}</div>
        </div>
    )
}