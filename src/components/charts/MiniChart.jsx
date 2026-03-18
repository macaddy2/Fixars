import { useMemo } from 'react'
import { cn } from '@/lib/utils'

/**
 * Lightweight SVG chart component.
 * Supports 'line', 'bar', and 'area' chart types.
 */
export default function MiniChart({
    data = [],
    type = 'line',
    color = 'primary',
    width = 200,
    height = 80,
    labels = [],
    className
}) {
    const chart = useMemo(() => {
        if (data.length < 2) return null

        const max = Math.max(...data)
        const min = Math.min(...data)
        const range = max - min || 1
        const padding = 4

        const innerW = width - padding * 2
        const innerH = height - padding * 2
        const stepX = innerW / (data.length - 1)
        const barWidth = innerW / data.length * 0.7
        const barGap = innerW / data.length * 0.3

        const points = data.map((v, i) => ({
            x: padding + i * stepX,
            y: padding + innerH - ((v - min) / range) * innerH,
            value: v
        }))

        // Line path
        const linePath = points.map((p, i) =>
            i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`
        ).join(' ')

        // Area path
        const areaPath = linePath + ` L ${padding + innerW} ${padding + innerH} L ${padding} ${padding + innerH} Z`

        // Bar rects
        const bars = data.map((v, i) => {
            const barH = ((v - min) / range) * innerH
            return {
                x: padding + (innerW / data.length) * i + barGap / 2,
                y: padding + innerH - barH,
                width: barWidth,
                height: barH,
                value: v
            }
        })

        return { linePath, areaPath, bars, points }
    }, [data, width, height])

    if (!chart) return null

    return (
        <svg width={width} height={height} className={cn("overflow-visible", className)}>
            <defs>
                <linearGradient id={`chart-grad-${color}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={`var(--color-${color})`} stopOpacity="0.3" />
                    <stop offset="100%" stopColor={`var(--color-${color})`} stopOpacity="0.02" />
                </linearGradient>
            </defs>

            {type === 'bar' ? (
                chart.bars.map((bar, i) => (
                    <rect
                        key={i}
                        x={bar.x}
                        y={bar.y}
                        width={bar.width}
                        height={bar.height}
                        rx={3}
                        fill={`var(--color-${color})`}
                        opacity={0.8}
                        className="animate-chart-bar"
                        style={{ animationDelay: `${i * 50}ms` }}
                    />
                ))
            ) : (
                <>
                    {type === 'area' && (
                        <path
                            d={chart.areaPath}
                            fill={`url(#chart-grad-${color})`}
                            className="animate-chart-area"
                        />
                    )}
                    <path
                        d={chart.linePath}
                        fill="none"
                        stroke={`var(--color-${color})`}
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="animate-chart-line"
                    />
                    {/* Data points */}
                    {chart.points.map((p, i) => (
                        <circle
                            key={i}
                            cx={p.x}
                            cy={p.y}
                            r="3"
                            fill="var(--color-card)"
                            stroke={`var(--color-${color})`}
                            strokeWidth="2"
                            className="opacity-0 hover:opacity-100 transition-opacity"
                        />
                    ))}
                </>
            )}

            {/* X-axis labels */}
            {labels.length > 0 && labels.map((label, i) => (
                <text
                    key={i}
                    x={4 + (width - 8) / (labels.length - 1) * i}
                    y={height - 1}
                    textAnchor="middle"
                    className="text-[9px] fill-muted"
                >
                    {label}
                </text>
            ))}
        </svg>
    )
}
