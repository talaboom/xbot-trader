import { useState } from 'react'
import { Link } from 'react-router-dom'

// CoinGecko coin ids for the supported pairs
const COINS = {
  'BTC/CAD': { id: 'bitcoin', label: 'Bitcoin', icon: 'BTC' },
  'ETH/CAD': { id: 'ethereum', label: 'Ethereum', icon: 'ETH' },
} as const

type PairKey = keyof typeof COINS
type DurationKey = 90 | 180 | 365

interface SimResult {
  invested: number
  finalValue: number
  pnl: number
  pnlPct: number
  fees: number
  trades: number
  series: { ts: number; value: number }[]
}

const COINBASE_TAKER = 0.006 // approx 0.6% taker on small Coinbase trades

async function fetchPrices(coinId: string, days: DurationKey): Promise<[number, number][]> {
  const url = `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=cad&days=${days}&interval=daily`
  const r = await fetch(url)
  if (!r.ok) throw new Error(`CoinGecko ${r.status}`)
  const j = await r.json()
  return j.prices as [number, number][] // [[ts_ms, price], ...]
}

function simulateDCA(prices: [number, number][], monthlyAmount: number): SimResult {
  // Weekly DCA: every 7 days, invest monthlyAmount/4 at that day's price
  const weeklyAmount = monthlyAmount / 4
  let invested = 0
  let holdings = 0
  let totalFees = 0
  let trades = 0
  const series: { ts: number; value: number }[] = []

  for (let i = 0; i < prices.length; i++) {
    const [ts, price] = prices[i]
    if (i % 7 === 0) {
      const fee = weeklyAmount * COINBASE_TAKER
      const net = weeklyAmount - fee
      const qty = net / price
      invested += weeklyAmount
      holdings += qty
      totalFees += fee
      trades += 1
    }
    series.push({ ts, value: holdings * price })
  }

  const finalPrice = prices[prices.length - 1][1]
  const finalValue = holdings * finalPrice
  const pnl = finalValue - invested
  const pnlPct = invested > 0 ? (pnl / invested) * 100 : 0

  return { invested, finalValue, pnl, pnlPct, fees: totalFees, trades, series }
}

function Sparkline({ series, positive }: { series: { ts: number; value: number }[]; positive: boolean }) {
  if (series.length < 2) return null
  const w = 320
  const h = 80
  const values = series.map((p) => p.value)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  const points = series
    .map((p, i) => {
      const x = (i / (series.length - 1)) * w
      const y = h - ((p.value - min) / range) * h
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')
  const stroke = positive ? '#34d399' : '#f87171'
  const fill = positive ? 'url(#gradGreen)' : 'url(#gradRed)'
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-20">
      <defs>
        <linearGradient id="gradGreen" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#34d399" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#34d399" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="gradRed" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#f87171" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#f87171" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline points={`0,${h} ${points} ${w},${h}`} fill={fill} stroke="none" />
      <polyline points={points} fill="none" stroke={stroke} strokeWidth="2" />
    </svg>
  )
}

export default function BacktestWizard() {
  const [pair, setPair] = useState<PairKey>('BTC/CAD')
  const [monthly, setMonthly] = useState(500)
  const [days, setDays] = useState<DurationKey>(180)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<SimResult | null>(null)

  const run = async () => {
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const prices = await fetchPrices(COINS[pair].id, days)
      if (prices.length < 14) throw new Error('Not enough price history')
      const sim = simulateDCA(prices, monthly)
      setResult(sim)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Simulation failed'
      setError(`Couldn't fetch live prices (${msg}). Try again in a moment.`)
    } finally {
      setLoading(false)
    }
  }

  const positive = (result?.pnl ?? 0) >= 0
  const monthsLabel = days === 90 ? '3 months' : days === 180 ? '6 months' : '12 months'

  return (
    <section id="try-it" className="relative z-10 max-w-4xl mx-auto px-6 mb-20">
      <div className="text-center mb-8">
        <h2 className="text-3xl md:text-4xl font-bold mb-3">
          <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            What would your DCA have made?
          </span>
        </h2>
        <p className="text-gray-400 text-lg">Real prices. Real fees. Real result. Backtested in your browser, no signup needed.</p>
      </div>

      <div className="backdrop-blur-lg bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8 shadow-xl shadow-purple-500/10">
        {/* Inputs */}
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-xs uppercase tracking-wider text-gray-400 mb-2">Pair</label>
            <div className="flex gap-2">
              {(Object.keys(COINS) as PairKey[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setPair(p)}
                  className={`flex-1 px-3 py-2.5 rounded-lg font-semibold text-sm transition ${
                    pair === p
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30'
                      : 'bg-white/5 text-gray-400 hover:bg-white/10'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-gray-400 mb-2">Monthly amount (CAD)</label>
            <div className="flex items-center gap-3">
              <span className="text-gray-400 text-lg">$</span>
              <input
                type="range"
                min={50}
                max={5000}
                step={50}
                value={monthly}
                onChange={(e) => setMonthly(Number(e.target.value))}
                className="flex-1 accent-purple-500"
              />
              <span className="text-white font-semibold text-lg w-20 text-right">${monthly}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-gray-400 mb-2">Duration</label>
            <div className="flex gap-2">
              {([90, 180, 365] as DurationKey[]).map((d) => (
                <button
                  key={d}
                  onClick={() => setDays(d)}
                  className={`flex-1 px-3 py-2.5 rounded-lg font-semibold text-sm transition ${
                    days === d
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30'
                      : 'bg-white/5 text-gray-400 hover:bg-white/10'
                  }`}
                >
                  {d === 90 ? '3mo' : d === 180 ? '6mo' : '1yr'}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button
          onClick={run}
          disabled={loading}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-500 hover:to-pink-400 disabled:from-purple-800 disabled:to-pink-800 text-white font-bold py-4 rounded-xl transition-all shadow-xl shadow-purple-500/30 hover:shadow-purple-500/50 mb-4"
        >
          {loading ? 'Running simulation...' : `Show my ${monthsLabel} backtest →`}
        </button>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {result && (
          <div className="mt-6 space-y-5">
            {/* Headline number */}
            <div className="text-center">
              <p className="text-xs uppercase tracking-wider text-gray-400 mb-1">Final portfolio value</p>
              <p className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                ${result.finalValue.toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <div className={`inline-block mt-2 px-4 py-1.5 rounded-full font-semibold ${
                positive ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' : 'bg-red-500/15 text-red-300 border border-red-500/30'
              }`}>
                {positive ? '+' : ''}${result.pnl.toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ({positive ? '+' : ''}{result.pnlPct.toFixed(1)}%)
              </div>
            </div>

            {/* Sparkline */}
            <div className="bg-black/30 rounded-xl p-4">
              <Sparkline series={result.series} positive={positive} />
            </div>

            {/* Breakdown */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-white/5 rounded-lg p-3">
                <p className="text-gray-400 text-xs">Invested</p>
                <p className="text-white font-semibold">${result.invested.toLocaleString('en-CA', { maximumFractionDigits: 0 })}</p>
              </div>
              <div className="bg-white/5 rounded-lg p-3">
                <p className="text-gray-400 text-xs">Trades</p>
                <p className="text-white font-semibold">{result.trades}</p>
              </div>
              <div className="bg-white/5 rounded-lg p-3">
                <p className="text-gray-400 text-xs">Fees paid</p>
                <p className="text-white font-semibold">${result.fees.toLocaleString('en-CA', { maximumFractionDigits: 2 })}</p>
              </div>
            </div>

            {/* CTA */}
            <Link
              to="/register"
              className="block text-center bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white font-bold py-4 rounded-xl transition shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50"
            >
              Run this strategy with $10K paper money →
            </Link>

            <p className="text-xs text-gray-500 text-center">
              Past performance, real fees included (~0.6% Coinbase taker). Not financial advice. Live trading involves risk.
            </p>
          </div>
        )}
      </div>
    </section>
  )
}
