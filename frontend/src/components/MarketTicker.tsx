import { useEffect, useState } from 'react'
import { getPrices } from '../api/dashboard'

const sparkData = () => Array.from({ length: 20 }, () => Math.random())

export default function MarketTicker() {
  const [prices, setPrices] = useState<any[]>([])

  useEffect(() => {
    const load = () => getPrices().then(r => setPrices(r.data)).catch(() => {})
    load()
    const interval = setInterval(load, 15000)
    return () => clearInterval(interval)
  }, [])

  const icons: Record<string, string> = {
    BTC: '₿', ETH: 'Ξ', SOL: 'S', DOGE: 'Ð', ADA: '₳', XRP: '✕', AVAX: 'A', LINK: '⬡'
  }
  const colors: Record<string, string> = {
    BTC: '#f7931a', ETH: '#627eea', SOL: '#9945ff', DOGE: '#c2a633', ADA: '#0033ad', XRP: '#00aae4', AVAX: '#e84142', LINK: '#2a5ada'
  }

  const formatPrice = (p: number) => {
    if (!p) return '$0'
    if (p >= 1000) return `$${(p / 1000).toFixed(1)}K`
    if (p >= 1) return `$${p.toFixed(2)}`
    return `$${p.toFixed(4)}`
  }

  return (
    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
      {prices.map((p: any) => {
        const spark = sparkData()
        const max = Math.max(...spark)
        const min = Math.min(...spark)
        const isUp = spark[spark.length - 1] > spark[0]

        return (
          <div key={p.product_id} className="flex-shrink-0 bg-[#0d0d20] border border-white/5 rounded-xl p-3 w-44 hover:border-white/10 transition group cursor-pointer">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-lg" style={{ color: colors[p.symbol] }}>{icons[p.symbol] || p.symbol[0]}</span>
                <span className="text-sm font-bold text-white">{p.symbol}</span>
              </div>
              <span className={`text-xs font-medium ${isUp ? 'text-green-400' : 'text-red-400'}`}>
                {isUp ? '+' : '-'}{(Math.random() * 5).toFixed(1)}%
              </span>
            </div>
            <p className="text-lg font-bold text-white mb-2">{formatPrice(p.price)}</p>
            {/* Mini sparkline */}
            <svg viewBox="0 0 100 30" className="w-full h-6">
              <polyline
                fill="none"
                stroke={isUp ? '#22c55e' : '#ef4444'}
                strokeWidth="1.5"
                points={spark.map((v, i) => `${(i / (spark.length - 1)) * 100},${30 - ((v - min) / (max - min || 1)) * 25}`).join(' ')}
              />
              <linearGradient id={`grad-${p.symbol}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={isUp ? '#22c55e' : '#ef4444'} stopOpacity="0.2" />
                <stop offset="100%" stopColor={isUp ? '#22c55e' : '#ef4444'} stopOpacity="0" />
              </linearGradient>
              <polygon
                fill={`url(#grad-${p.symbol})`}
                points={`0,30 ${spark.map((v, i) => `${(i / (spark.length - 1)) * 100},${30 - ((v - min) / (max - min || 1)) * 25}`).join(' ')} 100,30`}
              />
            </svg>
          </div>
        )
      })}
    </div>
  )
}
