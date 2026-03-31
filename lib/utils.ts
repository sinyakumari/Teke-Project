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

export function formatDateCustom(date: Date | string | undefined): string {
    if (!date) return 'Not Set'
    const d = new Date(date)
    if (isNaN(d.getTime())) return String(date)
    
    const day = String(d.getDate()).padStart(2, '0')
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    const month = months[d.getMonth()]
    const year = d.getFullYear()
    
    return `${day}-${month}-${year}`
}