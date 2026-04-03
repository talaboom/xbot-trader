interface Asset {
  name: string
  symbol: string
  percentage: number
  color: string
  value: string
}

const assets: Asset[] = [
  { name: 'US Dollar', symbol: 'USD', percentage: 65, color: '#22c55e', value: '$65,000' },
  { name: 'Bitcoin', symbol: 'BTC', percentage: 20, color: '#f7931a', value: '$20,000' },
  { name: 'Ethereum', symbol: 'ETH', percentage: 10, color: '#627eea', value: '$10,000' },
  { name: 'Solana', symbol: 'SOL', percentage: 3, color: '#9945ff', value: '$3,000' },
  { name: 'Others', symbol: 'ALT', percentage: 2, color: '#6b7280', value: '$2,000' },
]

export default function AssetAllocation() {
  // Calculate donut chart
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
            <p className="text-lg font-bold text-white">$100K</p>
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
              <span className="text-sm text-white font-medium">{a.value}</span>
              <span className="text-xs text-gray-500 w-8 text-right">{a.percentage}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
