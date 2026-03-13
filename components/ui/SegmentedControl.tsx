'use client'

interface Option {
    label: string
    value: string
}

interface SegmentedControlProps {
    options: Option[]
    value: string
    onChange: (value: string) => void
}

export default function SegmentedControl({
    options,
    value,
    onChange,
}: SegmentedControlProps) {
    return (
        <div className="flex bg-gray-100 rounded-full p-1 w-fit">
            {options.map((option) => (
                <button
                    key={option.value}
                    onClick={() => onChange(option.value)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${value === option.value
                            ? 'bg-[#1a1f2e] text-white'
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    {option.label}
                </button>
            ))}
        </div>
    )
}