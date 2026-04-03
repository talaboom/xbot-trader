import { useEffect, useState } from 'react'
import { getPrices } from '../api/dashboard'
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

export default function MarketPage() {
  const [prices, setPrices] = useState<any[]>([])
  const [selected, setSelected] = useState('BTC-USD')

  useEffect(() => {
    const load = () => getPrices().then(r => setPrices(r.data)).catch(() => {})
    load()
    const interval = setInterval(load, 15000)
    return () => clearInterval(interval)
  }, [])

  const formatPrice = (p: number) => {
    if (!p) return '$0'
    if (p >= 1000) return `$${p.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    if (p >= 1) return `$${p.toFixed(2)}`
    return `$${p.toFixed(4)}`
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Markets</h1>
        <p className="text-gray-400 text-sm">Real-time crypto prices from Coinbase</p>
      </div>

      {/* Heatmap grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {prices.map((p: any) => {
          const meta = cryptoMeta[p.symbol] || { icon: p.symbol[0], color: '#3b82f6', desc: '' }
          const change = (Math.random() - 0.4) * 10
          const isUp = change > 0
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
                  {isUp ? '+' : ''}{change.toFixed(1)}%
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

      {/* Market stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#0d0d20] border border-white/5 rounded-xl p-4">
          <p className="text-gray-400 text-xs mb-1">Total Market Cap</p>
          <p className="text-xl font-bold text-white">$2.41T</p>
          <p className="text-green-400 text-xs">+1.2%</p>
        </div>
        <div className="bg-[#0d0d20] border border-white/5 rounded-xl p-4">
          <p className="text-gray-400 text-xs mb-1">24h Volume</p>
          <p className="text-xl font-bold text-white">$89.3B</p>
          <p className="text-red-400 text-xs">-3.4%</p>
        </div>
        <div className="bg-[#0d0d20] border border-white/5 rounded-xl p-4">
          <p className="text-gray-400 text-xs mb-1">BTC Dominance</p>
          <p className="text-xl font-bold text-white">52.1%</p>
          <p className="text-green-400 text-xs">+0.3%</p>
        </div>
        <div className="bg-[#0d0d20] border border-white/5 rounded-xl p-4">
          <p className="text-gray-400 text-xs mb-1">Fear & Greed</p>
          <p className="text-xl font-bold text-yellow-400">62 Greed</p>
          <div className="w-full h-1.5 bg-white/10 rounded-full mt-2">
            <div className="h-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 rounded-full" style={{ width: '62%' }} />
          </div>
        </div>
      </div>
    </div>
  )
}
