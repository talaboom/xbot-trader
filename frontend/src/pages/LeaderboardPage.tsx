import { useEffect, useState } from 'react'
import { getLeaderboard } from '../api/dashboard'
import { useToast } from '../components/Toast'

const timeframes = [
  { label: '7 Days', value: '7d' },
  { label: '30 Days', value: '30d' },
  { label: '90 Days', value: '90d' },
  { label: 'All Time', value: 'all' },
]
const riskFilters = ['All', 'Low', 'Medium', 'High']

interface Trader {
  rank: number
  username: string
  avatar: string
  badge: string
  pnl: number
  pnl_pct: number
  win_rate: number
  trade_count: number
  strategy: string
  risk_level: string
  verified: boolean
}

export default function LeaderboardPage() {
  const [selectedTf, setSelectedTf] = useState('30d')
  const [riskFilter, setRiskFilter] = useState('All')
  const [traders, setTraders] = useState<Trader[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  const handleCopy = (username: string) => {
    toast({
      type: 'info',
      title: 'Copy trading — coming soon',
      message: `We'll notify you when you can copy ${username}'s strategy.`,
    })
  }

  useEffect(() => {
    setLoading(true)
    getLeaderboard(selectedTf, riskFilter.toLowerCase())
      .then(r => setTraders(r.data))
      .catch(() => setTraders([]))
      .finally(() => setLoading(false))
  }, [selectedTf, riskFilter])

  const formatPnl = (pnl: number | null | undefined) => {
    const n = pnl ?? 0
    const prefix = n >= 0 ? '+' : ''
    if (Math.abs(n) >= 1000) return `${prefix}$${(n / 1000).toFixed(1)}K`
    return `${prefix}$${n.toFixed(0)}`
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto flex items-center justify-center h-96">
        <div className="text-gray-400 text-lg">Loading leaderboard...</div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Copy Trading Leaderboard</h1>
          <p className="text-gray-400 text-sm">Follow top traders. Mirror their strategies automatically.</p>
        </div>
        <div className="flex gap-2">
          {/* Timeframe */}
          <div className="flex bg-white/5 rounded-lg p-0.5">
            {timeframes.map(tf => (
              <button key={tf.value} onClick={() => setSelectedTf(tf.value)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${selectedTf === tf.value ? 'bg-blue-500/20 text-blue-400' : 'text-gray-500 hover:text-white'}`}>
                {tf.label}
              </button>
            ))}
          </div>
          {/* Risk filter */}
          <div className="flex bg-white/5 rounded-lg p-0.5">
            {riskFilters.map(rf => (
              <button key={rf} onClick={() => setRiskFilter(rf)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${riskFilter === rf ? 'bg-purple-500/20 text-purple-400' : 'text-gray-500 hover:text-white'}`}>
                {rf}
              </button>
            ))}
          </div>
        </div>
      </div>

      {traders.length === 0 ? (
        <div className="bg-[#0d0d20] border border-white/5 rounded-2xl p-12 text-center">
          <div className="text-5xl mb-4">🏆</div>
          <h3 className="text-xl font-bold text-white mb-2">No traders yet</h3>
          <p className="text-gray-400">Be the first to start a bot and climb the leaderboard!</p>
        </div>
      ) : (
        <>
          {/* Top 3 podium */}
          <div className="grid grid-cols-3 gap-4">
            {traders.slice(0, 3).map((t, i) => {
              const gradients = ['from-yellow-500/20 to-amber-600/10', 'from-gray-300/20 to-gray-400/10', 'from-orange-600/20 to-amber-700/10']
              const borders = ['border-yellow-500/30', 'border-gray-400/20', 'border-orange-600/20']
              const medals = ['🥇', '🥈', '🥉']
              return (
                <div key={t.username} className={`bg-gradient-to-br ${gradients[i]} border ${borders[i]} rounded-2xl p-6 text-center relative overflow-hidden group hover:scale-[1.02] transition-all`}>
                  <div className="absolute top-3 left-3 text-2xl">{medals[i]}</div>
                  {t.badge && <div className="absolute top-3 right-3 text-xl">{t.badge}</div>}
                  <div className="text-5xl mb-3 mt-2">{t.avatar}</div>
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <h3 className="text-lg font-bold text-white">{t.username}</h3>
                    {t.verified && <span className="text-blue-400 text-sm" title="Verified">✓</span>}
                  </div>
                  <p className="text-xs text-gray-400 mb-3">{t.strategy}</p>
                  <div className={`text-3xl font-bold mb-1 ${t.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {t.pnl_pct >= 0 ? '+' : ''}{t.pnl_pct}%
                  </div>
                  <p className="text-sm text-gray-400 mb-4">{formatPnl(t.pnl)}</p>
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="bg-black/20 rounded-lg py-2">
                      <p className="text-sm font-bold text-white">{t.win_rate}%</p>
                      <p className="text-[10px] text-gray-500">Win Rate</p>
                    </div>
                    <div className="bg-black/20 rounded-lg py-2">
                      <p className="text-sm font-bold text-white">--</p>
                      <p className="text-[10px] text-gray-500">Followers</p>
                    </div>
                    <div className="bg-black/20 rounded-lg py-2">
                      <p className="text-sm font-bold text-white">{t.trade_count}</p>
                      <p className="text-[10px] text-gray-500">Trades</p>
                    </div>
                  </div>
                  <button onClick={() => handleCopy(t.username)} className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 py-2.5 rounded-xl font-semibold text-sm shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition">
                    Copy Trader
                  </button>
                </div>
              )
            })}
          </div>

          {/* Full list */}
          <div className="bg-[#0d0d20] border border-white/5 rounded-2xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left text-gray-400 text-xs font-medium px-5 py-3">Rank</th>
                  <th className="text-left text-gray-400 text-xs font-medium px-5 py-3">Trader</th>
                  <th className="text-left text-gray-400 text-xs font-medium px-5 py-3">Strategy</th>
                  <th className="text-right text-gray-400 text-xs font-medium px-5 py-3">P&L</th>
                  <th className="text-right text-gray-400 text-xs font-medium px-5 py-3">Win Rate</th>
                  <th className="text-right text-gray-400 text-xs font-medium px-5 py-3">Trades</th>
                  <th className="text-center text-gray-400 text-xs font-medium px-5 py-3">Risk</th>
                  <th className="text-center text-gray-400 text-xs font-medium px-5 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {traders.map(t => (
                  <tr key={t.username} className="border-b border-white/5 hover:bg-white/5 transition group">
                    <td className="px-5 py-4">
                      <span className={`text-sm font-bold ${t.rank <= 3 ? 'text-yellow-400' : 'text-gray-400'}`}>#{t.rank}</span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{t.avatar}</span>
                        <div>
                          <div className="flex items-center gap-1">
                            <span className="font-bold text-white">{t.username}</span>
                            {t.verified && <span className="text-blue-400 text-xs">✓</span>}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-300">{t.strategy}</td>
                    <td className="px-5 py-4 text-right">
                      <span className={`font-bold ${t.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {t.pnl_pct >= 0 ? '+' : ''}{t.pnl_pct}%
                      </span>
                      <br /><span className="text-xs text-gray-500">{formatPnl(t.pnl)}</span>
                    </td>
                    <td className="px-5 py-4 text-right text-white font-medium">{t.win_rate ?? 0}%</td>
                    <td className="px-5 py-4 text-right text-gray-300">{(t.trade_count ?? 0).toLocaleString()}</td>
                    <td className="px-5 py-4 text-center">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        t.risk_level === 'Low' ? 'bg-green-500/20 text-green-400' :
                        t.risk_level === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>{t.risk_level}</span>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <button onClick={() => handleCopy(t.username)} className="bg-blue-500/10 border border-blue-500/30 text-blue-400 px-4 py-1.5 rounded-lg text-xs font-medium hover:bg-blue-500/20 transition opacity-0 group-hover:opacity-100">
                        Copy
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
