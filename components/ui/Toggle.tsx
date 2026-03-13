'use client'

interface ToggleProps {
    enabled: boolean
    onChange: (value: boolean) => void
}

export default function Toggle({ enabled, onChange }: ToggleProps) {
    return (
        <button
            onClick={() => onChange(!enabled)}
            className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${enabled ? 'bg-gray-700' : 'bg-gray-300'
                }`}
        >
            <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform shadow ${enabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
            />
        </button>
    )
}