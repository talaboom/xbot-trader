import { useEffect, useState } from 'react'
import { getHoldings } from '../api/dashboard'

interface Asset {
  name: string
  symbol: string
  percentage: number
  color: string
  value: number
}

export default function AssetAllocation() {
  const [assets, setAssets] = useState<Asset[]>([])
  const [totalValue, setTotalValue] = useState(0)

  useEffect(() => {
    getHoldings()
      .then(res => {
        setAssets(res.data.holdings || [])
        setTotalValue(res.data.total_value || 0)
      })
      .catch(() => {
        // Fallback
        setAssets([{ name: 'US Dollar', symbol: 'USD', percentage: 100, color: '#22c55e', value: 100000 }])
        setTotalValue(100000)
      })
  }, [])

  const formatValue = (v: number) => {
    if (v >= 1000) return `$${(v / 1000).toFixed(1)}K`
    return `$${v.toFixed(0)}`
  }

  const formatTotal = (v: number) => {
    if (v >= 1000000) return `$${(v / 1000000).toFixed(2)}M`
    if (v >= 1000) return `$${(v / 1000).toFixed(1)}K`
    return `$${v.toFixed(0)}`
  }

  // Calculate donut segments
  let cumulative = 0
  const segments = assets.map(a => {
    const start = cumulative
    cumulative += a.percentage
    return { ...a, start, end: cumulative }
  })

  return (
    <div className="flex items-center gap-6">
      {/* Donut */}
      <div className="relative w-32 h-32 flex-shrink-0">
        <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
          {segments.map((seg, i) => {
            const circumference = 100
            const dashArray = `${seg.percentage} ${circumference - seg.percentage}`
            const dashOffset = -seg.start
            return (
              <circle key={i} cx="18" cy="18" r="15.9"
                fill="none" stroke={seg.color} strokeWidth="3"
                strokeDasharray={dashArray} strokeDashoffset={dashOffset}
                strokeLinecap="round" className="transition-all duration-500" />
            )
          })}
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <p className="text-lg font-bold text-white">{formatTotal(totalValue)}</p>
            <p className="text-[10px] text-gray-500">Total</p>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex-1 space-y-2">
        {assets.map(a => (
          <div key={a.symbol} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: a.color }} />
              <span className="text-sm text-gray-300">{a.symbol}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-white font-medium">{formatValue(a.value)}</span>
              <span className="text-xs text-gray-500 w-8 text-right">{a.percentage}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
