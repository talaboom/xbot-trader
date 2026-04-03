import { useEffect, useState } from 'react'
import { getPrices } from '../api/dashboard'
import { usePriceStream } from '../hooks/usePriceStream'

export default function MarketTicker() {
  const [prices, setPrices] = useState<any[]>([])
  const streamPrices = usePriceStream()

  useEffect(() => {
    const load = () => getPrices().then(r => setPrices(r.data)).catch(() => {})
    load()
    const interval = setInterval(load, 30000)
    return () => clearInterval(interval)
  }, [])

  const livePrices = prices.map(p => ({
    ...p,
    price: streamPrices[p.product_id] ?? p.price,
  }))

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
      {livePrices.map((p: any) => {
        const change = p.change_24h ?? 0
        const isUp = change >= 0

        return (
          <div key={p.product_id} className="flex-shrink-0 bg-[#0d0d20] border border-white/5 rounded-xl p-3 w-44 hover:border-white/10 transition group cursor-pointer">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-lg" style={{ color: colors[p.symbol] }}>{icons[p.symbol] || p.symbol[0]}</span>
                <span className="text-sm font-bold text-white">{p.symbol}</span>
              </div>
              <span className={`text-xs font-medium ${isUp ? 'text-green-400' : 'text-red-400'}`}>
                {isUp ? '+' : ''}{change.toFixed(1)}%
              </span>
            </div>
            <p className="text-lg font-bold text-white">{formatPrice(p.price)}</p>
          </div>
        )
      })}
    </div>
  )
}
