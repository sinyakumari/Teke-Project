'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
    {
        label: 'Home',
        href: '/home',
        icon: (active: boolean) => (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
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
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
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
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
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
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
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
    {
        label: 'Settings',
        href: '/settings',
        icon: (active: boolean) => (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <circle
                    cx="12"
                    cy="12"
                    r="3"
                    fill={active ? '#1a1f2e' : 'none'}
                    stroke={active ? '#1a1f2e' : '#9ca3af'}
                    strokeWidth="2"
                />
                <path
                    d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"
                    stroke={active ? '#1a1f2e' : '#9ca3af'}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </svg>
        ),
    },
]

export default function BottomNav() {
    const pathname = usePathname()

    return (
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
            <div className="max-w-lg mx-auto flex items-center justify-around py-1">
                {navItems.map((item) => {
                    const active = pathname.startsWith(item.href)
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="flex flex-col items-center gap-0.5 px-1 py-1 min-h-[42px] justify-center flex-1"
                        >
                            {active && (
                                <div className="w-1 h-1 rounded-full bg-[#1a1f2e] mb-1" />
                            )}
                            {item.icon(active)}
                            <span
                                className={`text-[10px] sm:text-xs ${active ? 'text-[#1a1f2e] font-medium' : 'text-gray-400'
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