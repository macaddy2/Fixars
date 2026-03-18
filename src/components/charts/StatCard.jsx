import { cn } from '@/lib/utils'

export default function StatCard({ label, value, trend, trendLabel, icon: Icon, color = 'primary', sparkData = [] }) {
    const isPositive = trend > 0
    const trendColor = isPositive ? 'text-success' : 'text-destructive'

    // Generate sparkline SVG path
    const sparkline = sparkData.length > 1 ? (() => {
        const max = Math.max(...sparkData)
        const min = Math.min(...sparkData)
        const range = max - min || 1
        const width = 80
        const height = 32
        const stepX = width / (sparkData.length - 1)

        const points = sparkData.map((v, i) => ({
            x: i * stepX,
            y: height - ((v - min) / range) * height
        }))

        const line = points.map((p, i) =>
            i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`
        ).join(' ')

        const area = line + ` L ${width} ${height} L 0 ${height} Z`

        return { line, area, width, height }
    })() : null

    return (
        <div className="relative overflow-hidden rounded-xl bg-card border p-5 hover:-translate-y-0.5 transition-all duration-300 group">
            <div className="flex items-start justify-between mb-3">
                <div>
                    <p className="text-sm text-muted mb-1">{label}</p>
                    <p className="text-3xl font-bold text-foreground">{value}</p>
                </div>
                {Icon && (
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", `bg-${color}/10`)}>
                        <Icon className={cn("w-5 h-5", `text-${color}`)} />
                    </div>
                )}
            </div>

            <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                    {trend !== undefined && (
                        <span className={cn("text-sm font-medium", trendColor)}>
                            {isPositive ? '↑' : '↓'} {Math.abs(trend)}%
                        </span>
                    )}
                    {trendLabel && (
                        <span className="text-xs text-muted">{trendLabel}</span>
                    )}
                </div>

                {sparkline && (
                    <svg
                        width={sparkline.width}
                        height={sparkline.height}
                        className="opacity-60 group-hover:opacity-100 transition-opacity"
                    >
                        <defs>
                            <linearGradient id={`spark-${label}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor={`var(--color-${color})`} stopOpacity="0.3" />
                                <stop offset="100%" stopColor={`var(--color-${color})`} stopOpacity="0" />
                            </linearGradient>
                        </defs>
                        <path
                            d={sparkline.area}
                            fill={`url(#spark-${label})`}
                            className="animate-chart-area"
                        />
                        <path
                            d={sparkline.line}
                            fill="none"
                            stroke={`var(--color-${color})`}
                            strokeWidth="2"
                            strokeLinecap="round"
                            className="animate-chart-line"
                        />
                    </svg>
                )}
            </div>
        </div>
    )
}
