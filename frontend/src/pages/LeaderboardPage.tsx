import { useState } from 'react'

const traders = [
  { rank: 1, name: 'CryptoSage', avatar: '🧙', badge: '👑', pnl: '+34.2%', pnlUsd: '+$171,000', winRate: '89%', trades: 2341, followers: '4.2K', strategy: 'BTC/ETH Long-term DCA', streak: '12 wins', riskLevel: 'Low', verified: true },
  { rank: 2, name: 'DeFi Queen', avatar: '👑', badge: '💎', pnl: '+28.7%', pnlUsd: '+$143,500', winRate: '82%', trades: 1876, followers: '3.8K', strategy: 'Multi-asset Grid Trading', streak: '8 wins', riskLevel: 'Medium', verified: true },
  { rank: 3, name: 'ScalpKing', avatar: '⚡', badge: '🔥', pnl: '+19.5%', pnlUsd: '+$97,500', winRate: '76%', trades: 5892, followers: '2.9K', strategy: 'High-frequency Momentum', streak: '5 wins', riskLevel: 'High', verified: true },
  { rank: 4, name: 'AlgoMaster', avatar: '🤖', badge: '', pnl: '+17.3%', pnlUsd: '+$86,500', winRate: '74%', trades: 3201, followers: '2.1K', strategy: 'Mean Reversion BTC', streak: '7 wins', riskLevel: 'Low', verified: false },
  { rank: 5, name: 'HODLer Pro', avatar: '💪', badge: '', pnl: '+15.8%', pnlUsd: '+$79,000', winRate: '91%', trades: 156, followers: '1.8K', strategy: 'Weekly BTC/ETH DCA', streak: '20 wins', riskLevel: 'Low', verified: true },
  { rank: 6, name: 'MoonShot', avatar: '🌙', badge: '', pnl: '+14.2%', pnlUsd: '+$71,000', winRate: '62%', trades: 4523, followers: '1.5K', strategy: 'Altcoin Momentum', streak: '3 wins', riskLevel: 'High', verified: false },
  { rank: 7, name: 'SteadyEddie', avatar: '🐢', badge: '', pnl: '+12.1%', pnlUsd: '+$60,500', winRate: '88%', trades: 890, followers: '1.2K', strategy: 'Conservative Grid', streak: '15 wins', riskLevel: 'Low', verified: true },
  { rank: 8, name: 'WhaleWatcher', avatar: '🐋', badge: '', pnl: '+11.5%', pnlUsd: '+$57,500', winRate: '71%', trades: 2134, followers: '980', strategy: 'On-chain Signal Bot', streak: '4 wins', riskLevel: 'Medium', verified: false },
]

const timeframes = ['7 Days', '30 Days', '90 Days', 'All Time']
const riskFilters = ['All', 'Low', 'Medium', 'High']

export default function LeaderboardPage() {
  const [selectedTf, setSelectedTf] = useState('30 Days')
  const [riskFilter, setRiskFilter] = useState('All')

  const filtered = riskFilter === 'All' ? traders : traders.filter(t => t.riskLevel === riskFilter)

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
              <button key={tf} onClick={() => setSelectedTf(tf)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${selectedTf === tf ? 'bg-blue-500/20 text-blue-400' : 'text-gray-500 hover:text-white'}`}>
                {tf}
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

      {/* Top 3 podium */}
      <div className="grid grid-cols-3 gap-4">
        {filtered.slice(0, 3).map((t, i) => {
          const gradients = ['from-yellow-500/20 to-amber-600/10', 'from-gray-300/20 to-gray-400/10', 'from-orange-600/20 to-amber-700/10']
          const borders = ['border-yellow-500/30', 'border-gray-400/20', 'border-orange-600/20']
          const medals = ['🥇', '🥈', '🥉']
          return (
            <div key={t.name} className={`bg-gradient-to-br ${gradients[i]} border ${borders[i]} rounded-2xl p-6 text-center relative overflow-hidden group hover:scale-[1.02] transition-all`}>
              <div className="absolute top-3 left-3 text-2xl">{medals[i]}</div>
              {t.badge && <div className="absolute top-3 right-3 text-xl">{t.badge}</div>}
              <div className="text-5xl mb-3 mt-2">{t.avatar}</div>
              <div className="flex items-center justify-center gap-1 mb-1">
                <h3 className="text-lg font-bold text-white">{t.name}</h3>
                {t.verified && <span className="text-blue-400 text-sm" title="Verified">✓</span>}
              </div>
              <p className="text-xs text-gray-400 mb-3">{t.strategy}</p>
              <div className="text-3xl font-bold text-green-400 mb-1">{t.pnl}</div>
              <p className="text-sm text-gray-400 mb-4">{t.pnlUsd}</p>
              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="bg-black/20 rounded-lg py-2">
                  <p className="text-sm font-bold text-white">{t.winRate}</p>
                  <p className="text-[10px] text-gray-500">Win Rate</p>
                </div>
                <div className="bg-black/20 rounded-lg py-2">
                  <p className="text-sm font-bold text-white">{t.followers}</p>
                  <p className="text-[10px] text-gray-500">Followers</p>
                </div>
                <div className="bg-black/20 rounded-lg py-2">
                  <p className="text-sm font-bold text-white">{t.trades}</p>
                  <p className="text-[10px] text-gray-500">Trades</p>
                </div>
              </div>
              <button className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 py-2.5 rounded-xl font-semibold text-sm shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition">
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
              <th className="text-right text-gray-400 text-xs font-medium px-5 py-3">Followers</th>
              <th className="text-center text-gray-400 text-xs font-medium px-5 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(t => (
              <tr key={t.name} className="border-b border-white/5 hover:bg-white/5 transition group">
                <td className="px-5 py-4">
                  <span className={`text-sm font-bold ${t.rank <= 3 ? 'text-yellow-400' : 'text-gray-400'}`}>#{t.rank}</span>
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{t.avatar}</span>
                    <div>
                      <div className="flex items-center gap-1">
                        <span className="font-bold text-white">{t.name}</span>
                        {t.verified && <span className="text-blue-400 text-xs">✓</span>}
                      </div>
                      <span className="text-xs text-gray-500">{t.streak}</span>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4 text-sm text-gray-300">{t.strategy}</td>
                <td className="px-5 py-4 text-right">
                  <span className="text-green-400 font-bold">{t.pnl}</span>
                  <br /><span className="text-xs text-gray-500">{t.pnlUsd}</span>
                </td>
                <td className="px-5 py-4 text-right text-white font-medium">{t.winRate}</td>
                <td className="px-5 py-4 text-right text-gray-300">{t.trades.toLocaleString()}</td>
                <td className="px-5 py-4 text-center">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    t.riskLevel === 'Low' ? 'bg-green-500/20 text-green-400' :
                    t.riskLevel === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-red-500/20 text-red-400'
                  }`}>{t.riskLevel}</span>
                </td>
                <td className="px-5 py-4 text-right text-gray-300">{t.followers}</td>
                <td className="px-5 py-4 text-center">
                  <button className="bg-blue-500/10 border border-blue-500/30 text-blue-400 px-4 py-1.5 rounded-lg text-xs font-medium hover:bg-blue-500/20 transition opacity-0 group-hover:opacity-100">
                    Copy
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
