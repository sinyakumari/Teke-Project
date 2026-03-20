interface AvatarProps {
    name: string
    src?: string
    size?: 'sm' | 'md' | 'lg'
}

export default function Avatar({ name, src, size = 'md' }: AvatarProps) {
    const letter = name?.charAt(0).toUpperCase() || '?'

    const sizes = {
        sm: 'w-8 h-8 text-sm',
        md: 'w-10 h-10 text-base',
        lg: 'w-16 h-16 text-2xl',
    }

    return (
        <div
            className={`${sizes[size]} bg-[#1a1f2e] rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0 overflow-hidden border border-slate-200`}
        >
            {src ? (
                <img src={src} alt={name} className="w-full h-full object-cover" />
            ) : (
                letter
            )}
        </div>
    )
}