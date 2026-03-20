'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
    {
        label: 'Home',
        href: '/home',
        icon: (active: boolean) => (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path
                    d="M3 9.5L12 3L21 9.5V20C21 20.5523 20.5523 21 20 21H15V15H9V21H4C3.44772 21 3 20.5523 3 20V9.5Z"
                    fill={active ? '#1a1f2e' : 'none'}
                    stroke={active ? '#1a1f2e' : '#9ca3af'}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </svg>
        ),
    },
    {
        label: 'Trainings',
        href: '/trainings',
        icon: (active: boolean) => (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path
                    d="M12 3L22 8.5V10H2V8.5L12 3Z"
                    fill={active ? '#1a1f2e' : 'none'}
                    stroke={active ? '#1a1f2e' : '#9ca3af'}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                <path
                    d="M6 10V17M10 10V17M14 10V17M18 10V17"
                    stroke={active ? '#1a1f2e' : '#9ca3af'}
                    strokeWidth="2"
                    strokeLinecap="round"
                />
                <path
                    d="M3 17H21"
                    stroke={active ? '#1a1f2e' : '#9ca3af'}
                    strokeWidth="2"
                    strokeLinecap="round"
                />
            </svg>
        ),
    },
    {
        label: 'Tasks',
        href: '/tasks',
        icon: (active: boolean) => (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <rect
                    x="5"
                    y="3"
                    width="14"
                    height="18"
                    rx="2"
                    fill={active ? '#1a1f2e' : 'none'}
                    stroke={active ? '#1a1f2e' : '#9ca3af'}
                    strokeWidth="2"
                />
                <path
                    d="M9 7H15M9 11H15M9 15H12"
                    stroke={active ? 'white' : '#9ca3af'}
                    strokeWidth="2"
                    strokeLinecap="round"
                />
                <path
                    d="M15 13L17 15L21 11"
                    stroke={active ? 'white' : 'none'}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </svg>
        ),
    },
    {
        label: 'Profile',
        href: '/profile',
        icon: (active: boolean) => (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <circle
                    cx="12"
                    cy="8"
                    r="4"
                    fill={active ? '#1a1f2e' : 'none'}
                    stroke={active ? '#1a1f2e' : '#9ca3af'}
                    strokeWidth="2"
                />
                <path
                    d="M4 20C4 17 7.58172 15 12 15C16.4183 15 20 17 20 20"
                    stroke={active ? '#1a1f2e' : '#9ca3af'}
                    strokeWidth="2"
                    strokeLinecap="round"
                />
            </svg>
        ),
    },
]

export default function BottomNav() {
    const pathname = usePathname()

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
            <div className="max-w-lg mx-auto flex items-center justify-around py-2">
                {navItems.map((item) => {
                    const active = pathname.startsWith(item.href)
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="flex flex-col items-center gap-1 px-4 py-2 min-h-[48px] justify-center"
                        >
                            {active && (
                                <div className="w-1 h-1 rounded-full bg-[#1a1f2e] mb-1" />
                            )}
                            {item.icon(active)}
                            <span
                                className={`text-xs ${active ? 'text-[#1a1f2e] font-semibold' : 'text-gray-400'
                                    }`}
                            >
                                {item.label}
                            </span>
                        </Link>
                    )
                })}
            </div>
        </nav>
    )
}