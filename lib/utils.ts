export function getGreeting(): string {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
}

export function formatDate(date: Date | string): string {
    if (!date) return 'No dates set'
    const d = new Date(date)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function formatDateRange(start?: Date | string, end?: Date | string): string {
    if (!start && !end) return 'No dates set'
    if (start && end) return `${formatDate(start)} – ${formatDate(end)}`
    if (start) return `From ${formatDate(start)}`
    return 'No dates set'
}