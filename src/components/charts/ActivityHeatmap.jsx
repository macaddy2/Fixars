import { useMemo } from 'react'

/**
 * GitHub-style activity heatmap showing platform activity by day.
 */
export default function ActivityHeatmap({ activities = [], weeks = 12 }) {
    const heatmapData = useMemo(() => {
        const today = new Date()
        const totalDays = weeks * 7
        const days = []

        // Build day grid
        for (let i = totalDays - 1; i >= 0; i--) {
            const date = new Date(today)
            date.setDate(date.getDate() - i)
            days.push({
                date: date.toISOString().split('T')[0],
                dayOfWeek: date.getDay(),
                count: 0
            })
        }

        // Count activities per day
        for (const act of activities) {
            const actDate = new Date(act.timestamp || act.createdAt).toISOString().split('T')[0]
            const day = days.find(d => d.date === actDate)
            if (day) day.count++
        }

        // If no real activities, generate mock data
        if (activities.length === 0) {
            days.forEach(d => {
                d.count = Math.random() < 0.3 ? 0 :
                    Math.random() < 0.5 ? Math.ceil(Math.random() * 3) :
                        Math.random() < 0.8 ? Math.ceil(Math.random() * 6) :
                            Math.ceil(Math.random() * 10)
            })
        }

        // Group by week
        const weekGroups = []
        for (let w = 0; w < weeks; w++) {
            weekGroups.push(days.slice(w * 7, (w + 1) * 7))
        }

        const maxCount = Math.max(...days.map(d => d.count), 1)

        return { weekGroups, maxCount, days }
    }, [activities, weeks])

    const getColor = (count) => {
        if (count === 0) return 'var(--color-muted-foreground)'
        const intensity = count / heatmapData.maxCount
        if (intensity > 0.75) return 'var(--color-primary)'
        if (intensity > 0.5) return 'rgba(104, 81, 255, 0.7)'
        if (intensity > 0.25) return 'rgba(104, 81, 255, 0.45)'
        return 'rgba(104, 81, 255, 0.2)'
    }

    const dayLabels = ['', 'Mon', '', 'Wed', '', 'Fri', '']

    return (
        <div className="space-y-2">
            <div className="flex gap-1">
                {/* Day labels */}
                <div className="flex flex-col gap-[3px] mr-1 pt-5">
                    {dayLabels.map((label, i) => (
                        <div key={i} className="h-[13px] text-[9px] text-muted leading-[13px]">
                            {label}
                        </div>
                    ))}
                </div>

                {/* Heatmap grid */}
                <div className="flex gap-[3px] flex-1 overflow-x-auto">
                    {heatmapData.weekGroups.map((week, wi) => (
                        <div key={wi} className="flex flex-col gap-[3px]">
                            {/* Month label on first day of visible month */}
                            <div className="h-4 text-[9px] text-muted">
                                {wi % 4 === 0 && week[0] ? new Date(week[0].date).toLocaleDateString('en', { month: 'short' }) : ''}
                            </div>
                            {week.map((day, di) => (
                                <div
                                    key={di}
                                    className="w-[13px] h-[13px] rounded-sm transition-colors duration-200 hover:ring-1 hover:ring-foreground/20"
                                    style={{
                                        backgroundColor: getColor(day.count),
                                        opacity: day.count === 0 ? 0.15 : 1
                                    }}
                                    title={`${day.date}: ${day.count} actions`}
                                />
                            ))}
                        </div>
                    ))}
                </div>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-1 justify-end text-[10px] text-muted">
                <span>Less</span>
                {[0, 0.25, 0.5, 0.75, 1].map((level, i) => (
                    <div
                        key={i}
                        className="w-[11px] h-[11px] rounded-sm"
                        style={{
                            backgroundColor: level === 0 ? 'var(--color-muted-foreground)' :
                                `rgba(104, 81, 255, ${0.2 + level * 0.6})`,
                            opacity: level === 0 ? 0.15 : 1
                        }}
                    />
                ))}
                <span>More</span>
            </div>
        </div>
    )
}
