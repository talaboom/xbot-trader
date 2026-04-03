import { useEffect, useState } from 'react'
import { getPortfolio } from '../api/dashboard'
import { getStrategies } from '../api/strategies'
import { Link } from 'react-router-dom'
import PriceChart from '../components/PriceChart'
import PortfolioChart from '../components/PortfolioChart'
import AssetAllocation from '../components/AssetAllocation'
import MarketTicker from '../components/MarketTicker'
import OnboardingWizard from '../components/OnboardingWizard'

export default function DashboardPage() {
  const [portfolio, setPortfolio] = useState<any>(null)
  const [strategies, setStrategies] = useState<any[]>([])
  const [showOnboarding, setShowOnboarding] = useState(false)

  useEffect(() => {
    const load = async () => {
      const [p, s] = await Promise.all([
        getPortfolio().catch(() => ({ data: null })),
        getStrategies().catch(() => ({ data: [] })),
      ])
      setPortfolio(p.data)
      setStrategies(s.data || [])

      // Show onboarding if no strategies yet and hasn't been dismissed
      if ((s.data || []).length === 0 && !localStorage.getItem('onboarding_done')) {
        setShowOnboarding(true)
      }
    }
    load()
  }, [])

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Onboarding wizard for new users */}
      {showOnboarding && (
        <OnboardingWizard onComplete={() => {
          setShowOnboarding(false)
          localStorage.setItem('onboarding_done', 'true')
          // Refresh strategies
          getStrategies().then(r => setStrategies(r.data || [])).catch(() => {})
        }} />
      )}

      {/* Market ticker strip */}
      <MarketTicker />

      {/* Portfolio cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-600/20 to-cyan-600/10 border border-blue-500/20 rounded-2xl p-5 relative overflow-hidden">
          <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full bg-blue-500/10 blur-2xl" />
          <p className="text-gray-400 text-sm mb-1">Portfolio Value</p>
          <p className="text-3xl font-bold text-white">${Number(portfolio?.total_value || 100000).toLocaleString()}</p>
          <div className="mt-3 h-12"><PortfolioChart height={48} /></div>
        </div>
        <div className="bg-[#0d0d20] border border-white/5 rounded-2xl p-5">
          <p className="text-gray-400 text-sm mb-1">Total P&L</p>
          <p className={`text-3xl font-bold ${Number(portfolio?.total_pnl || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {Number(portfolio?.total_pnl || 0) >= 0 ? '+' : ''}${Number(portfolio?.total_pnl || 0).toFixed(2)}
          </p>
          <p className="text-gray-500 text-sm mt-1">All strategies combined</p>
        </div>
        <div className="bg-[#0d0d20] border border-white/5 rounded-2xl p-5">
          <p className="text-gray-400 text-sm mb-1">Active Bots</p>
          <p className="text-3xl font-bold text-white">{portfolio?.active_strategies || 0}</p>
          <Link to="/strategies" className="text-blue-400 text-sm mt-1 hover:underline inline-block">
            {strategies.length === 0 ? '+ Create first bot' : 'Manage bots →'}
          </Link>
        </div>
        <div className="bg-[#0d0d20] border border-white/5 rounded-2xl p-5">
          <p className="text-gray-400 text-sm mb-1">Total Trades</p>
          <p className="text-3xl font-bold text-white">{portfolio?.total_trades || 0}</p>
          <Link to="/trades" className="text-blue-400 text-sm mt-1 hover:underline inline-block">View history →</Link>
        </div>
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart — takes 2 columns */}
        <div className="lg:col-span-2">
          <PriceChart productId="BTC-USD" height={400} />
        </div>

        {/* Asset allocation */}
        <div className="bg-[#0d0d20] border border-white/5 rounded-2xl p-5">
          <h3 className="text-lg font-bold text-white mb-4">Asset Allocation</h3>
          <AssetAllocation />
        </div>
      </div>

      {/* Active strategies */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white">Your Bots</h2>
          <Link to="/strategies" className="text-blue-400 hover:text-blue-300 text-sm font-medium">
            {strategies.length === 0 ? '+ Create Bot' : 'View All →'}
          </Link>
        </div>
        {strategies.length === 0 ? (
          <div className="bg-[#0d0d20] border border-dashed border-white/10 rounded-2xl p-12 text-center">
            <span className="text-5xl mb-4 block">🤖</span>
            <h3 className="text-xl font-bold text-white mb-2">No bots yet</h3>
            <p className="text-gray-400 mb-6">Create your first AI trading bot to start earning 24/7.</p>
            <Link to="/strategies" className="inline-block bg-gradient-to-r from-blue-600 to-cyan-500 px-6 py-3 rounded-xl font-semibold shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition">
              Create Your First Bot
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {strategies.slice(0, 4).map((s: any) => (
              <div key={s.id} className="bg-[#0d0d20] border border-white/5 rounded-xl p-5 hover:border-white/10 transition">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${s.strategy_type === 'dca' ? 'from-blue-500 to-cyan-400' : 'from-purple-500 to-pink-400'} flex items-center justify-center text-lg`}>
                      {s.strategy_type === 'dca' ? '🤖' : '📊'}
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-sm">{s.name}</h3>
                      <p className="text-xs text-gray-500">{s.product_id} · {s.strategy_type.toUpperCase()}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                    s.status === 'running' ? 'bg-green-500/20 text-green-400' :
                    s.status === 'error' ? 'bg-red-500/20 text-red-400' :
                    'bg-gray-500/20 text-gray-400'
                  }`}>
                    {s.status === 'running' && <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-400 mr-1 animate-pulse" />}
                    {s.status}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-white/5 rounded-lg p-2 text-center">
                    <p className="text-sm font-bold text-white">${Number(s.total_invested).toFixed(0)}</p>
                    <p className="text-[10px] text-gray-500">Invested</p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-2 text-center">
                    <p className={`text-sm font-bold ${Number(s.pnl) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      ${Number(s.pnl).toFixed(2)}
                    </p>
                    <p className="text-[10px] text-gray-500">P&L</p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-2 text-center">
                    <p className="text-sm font-bold text-white">{s.is_paper_mode ? '📝' : '💰'}</p>
                    <p className="text-[10px] text-gray-500">{s.is_paper_mode ? 'Paper' : 'Live'}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Link to="/strategies" className="bg-[#0d0d20] border border-white/5 rounded-xl p-4 text-center hover:border-blue-500/30 hover:bg-blue-500/5 transition group">
          <span className="text-2xl block mb-2 group-hover:scale-110 transition">🤖</span>
          <p className="text-sm font-medium text-white">New Bot</p>
        </Link>
        <Link to="/leaderboard" className="bg-[#0d0d20] border border-white/5 rounded-xl p-4 text-center hover:border-purple-500/30 hover:bg-purple-500/5 transition group">
          <span className="text-2xl block mb-2 group-hover:scale-110 transition">🏆</span>
          <p className="text-sm font-medium text-white">Leaderboard</p>
        </Link>
        <Link to="/markets" className="bg-[#0d0d20] border border-white/5 rounded-xl p-4 text-center hover:border-green-500/30 hover:bg-green-500/5 transition group">
          <span className="text-2xl block mb-2 group-hover:scale-110 transition">📈</span>
          <p className="text-sm font-medium text-white">Markets</p>
        </Link>
        <Link to="/settings" className="bg-[#0d0d20] border border-white/5 rounded-xl p-4 text-center hover:border-cyan-500/30 hover:bg-cyan-500/5 transition group">
          <span className="text-2xl block mb-2 group-hover:scale-110 transition">🔗</span>
          <p className="text-sm font-medium text-white">Connect Exchange</p>
        </Link>
      </div>
    </div>
  )
}
