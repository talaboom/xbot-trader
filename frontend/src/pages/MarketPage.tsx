import { useEffect, useState } from 'react'
import { getPrices, getMarketStats } from '../api/dashboard'
import { usePriceStream } from '../hooks/usePriceStream'
import PriceChart from '../components/PriceChart'

const cryptoMeta: Record<string, { icon: string; color: string; desc: string }> = {
  BTC: { icon: '₿', color: '#f7931a', desc: 'Digital Gold' },
  ETH: { icon: 'Ξ', color: '#627eea', desc: 'Smart Contracts' },
  SOL: { icon: 'S', color: '#9945ff', desc: 'High Speed' },
  DOGE: { icon: 'Ð', color: '#c2a633', desc: 'Meme Coin' },
  ADA: { icon: '₳', color: '#0033ad', desc: 'Peer Reviewed' },
  XRP: { icon: '✕', color: '#00aae4', desc: 'Cross-border' },
  AVAX: { icon: 'A', color: '#e84142', desc: 'Subnets' },
  LINK: { icon: '⬡', color: '#2a5ada', desc: 'Oracles' },
}

interface MarketStats {
  total_market_cap: number
  total_volume_24h: number
  btc_dominance: number
  market_cap_change_24h: number
  fear_greed_value: number
  fear_greed_label: string
}

export default function MarketPage() {
  const [prices, setPrices] = useState<any[]>([])
  const [selected, setSelected] = useState('BTC-USD')
  const [stats, setStats] = useState<MarketStats | null>(null)
  const streamPrices = usePriceStream()

  useEffect(() => {
    const load = () => {
      getPrices().then(r => setPrices(r.data)).catch(() => {})
      getMarketStats().then(r => setStats(r.data)).catch(() => {})
    }
    load()
    const interval = setInterval(load, 30000)
    return () => clearInterval(interval)
  }, [])

  // Overlay WebSocket live prices onto the HTTP-fetched data
  const livePrices = prices.map(p => ({
    ...p,
    price: streamPrices[p.product_id] ?? p.price,
  }))

  const formatPrice = (p: number) => {
    if (!p) return '$0'
    if (p >= 1000) return `$${p.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    if (p >= 1) return `$${p.toFixed(2)}`
    return `$${p.toFixed(4)}`
  }

  const formatLargeNum = (n: number) => {
    if (!n) return '$0'
    if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`
    if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`
    if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`
    return `$${n.toLocaleString()}`
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Markets</h1>
        <p className="text-gray-400 text-sm">Real-time crypto prices from Coinbase</p>
      </div>

      {/* Heatmap grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {livePrices.map((p: any) => {
          const meta = cryptoMeta[p.symbol] || { icon: p.symbol?.[0] ?? '?', color: '#3b82f6', desc: '' }
          const change = p.change_24h ?? 0
          const isUp = change >= 0
          const intensity = Math.min(Math.abs(change) / 10, 1)
          const bg = isUp
            ? `rgba(34,197,94,${0.05 + intensity * 0.15})`
            : `rgba(239,68,68,${0.05 + intensity * 0.15})`

          return (
            <div key={p.product_id}
              onClick={() => setSelected(p.product_id)}
              className={`rounded-xl p-4 cursor-pointer transition-all hover:scale-[1.03] border ${
                selected === p.product_id ? 'border-blue-500/50 shadow-lg shadow-blue-500/10' : 'border-white/5 hover:border-white/10'
              }`}
              style={{ backgroundColor: bg }}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl" style={{ color: meta.color }}>{meta.icon}</span>
                  <div>
                    <p className="font-bold text-white text-sm">{p.symbol}</p>
                    <p className="text-[10px] text-gray-500">{p.name}</p>
                  </div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${isUp ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                  {change !== null ? `${isUp ? '+' : ''}${change.toFixed(2)}%` : '--'}
                </span>
              </div>
              <p className="text-xl font-bold text-white">{formatPrice(p.price)}</p>
              <p className="text-[10px] text-gray-500 mt-1">{meta.desc}</p>
            </div>
          )
        })}
      </div>

      {/* Full chart */}
      <PriceChart productId={selected} height={500} />

      {/* Market stats — real data from CoinGecko */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#0d0d20] border border-white/5 rounded-xl p-4">
          <p className="text-gray-400 text-xs mb-1">Total Market Cap</p>
          <p className="text-xl font-bold text-white">{stats ? formatLargeNum(stats.total_market_cap) : '--'}</p>
          {stats && (
            <p className={`text-xs ${stats.market_cap_change_24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {stats.market_cap_change_24h >= 0 ? '+' : ''}{stats.market_cap_change_24h}%
            </p>
          )}
        </div>
        <div className="bg-[#0d0d20] border border-white/5 rounded-xl p-4">
          <p className="text-gray-400 text-xs mb-1">24h Volume</p>
          <p className="text-xl font-bold text-white">{stats ? formatLargeNum(stats.total_volume_24h) : '--'}</p>
        </div>
        <div className="bg-[#0d0d20] border border-white/5 rounded-xl p-4">
          <p className="text-gray-400 text-xs mb-1">BTC Dominance</p>
          <p className="text-xl font-bold text-white">{stats ? `${stats.btc_dominance}%` : '--'}</p>
        </div>
        <div className="bg-[#0d0d20] border border-white/5 rounded-xl p-4">
          <p className="text-gray-400 text-xs mb-1">Fear & Greed</p>
          <p className={`text-xl font-bold ${
            stats && stats.fear_greed_value >= 60 ? 'text-green-400' :
            stats && stats.fear_greed_value >= 40 ? 'text-yellow-400' :
            'text-red-400'
          }`}>
            {stats && stats.fear_greed_value ? `${stats.fear_greed_value} ${stats.fear_greed_label}` : '--'}
          </p>
          <div className="w-full h-1.5 bg-white/10 rounded-full mt-2">
            <div className="h-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 rounded-full" style={{ width: `${stats?.fear_greed_value || 50}%` }} />
          </div>
        </div>
      </div>
    </div>
  )
}
