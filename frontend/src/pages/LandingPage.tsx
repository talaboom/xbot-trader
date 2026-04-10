import { Link } from 'react-router-dom'

const bots = [
  {
    name: 'Alpha DCA Bot',
    desc: 'Dollar-cost averages into stocks and cryptos on schedule. Set it and forget it.',
    icon: '🤖',
    gradient: 'from-blue-500 to-cyan-400',
    shadow: 'shadow-blue-500/30',
    stats: { winRate: '89%', avgReturn: '+12.4%', trades: '2,341' },
    tag: 'Most Popular',
    tagColor: 'bg-green-500/20 text-green-400',
  },
  {
    name: 'Grid Master',
    desc: 'Profits from sideways markets by buying low and selling high in a range.',
    icon: '📊',
    gradient: 'from-purple-500 to-pink-400',
    shadow: 'shadow-purple-500/30',
    stats: { winRate: '76%', avgReturn: '+8.7%', trades: '5,892' },
    tag: 'High Frequency',
    tagColor: 'bg-purple-500/20 text-purple-400',
  },
  {
    name: 'Momentum Rider',
    desc: 'Rides trends using MACD and RSI signals. Catches big moves early.',
    icon: '🚀',
    gradient: 'from-orange-500 to-red-400',
    shadow: 'shadow-orange-500/30',
    stats: { winRate: '68%', avgReturn: '+22.1%', trades: '891' },
    tag: 'High Reward',
    tagColor: 'bg-orange-500/20 text-orange-400',
  },
  {
    name: 'Mean Reverter',
    desc: 'Buys when price dips below average, sells when it spikes above.',
    icon: '🎯',
    gradient: 'from-emerald-500 to-teal-400',
    shadow: 'shadow-emerald-500/30',
    stats: { winRate: '82%', avgReturn: '+9.3%', trades: '1,567' },
    tag: 'Low Risk',
    tagColor: 'bg-emerald-500/20 text-emerald-400',
  },
]

const advisors = [
  { name: 'IndexMaster', avatar: '📈', specialty: 'S&P 500 & Tech Stocks', followers: '4.2K', pnl: '+18.2%', rank: 1 },
  { name: 'CryptoSage', avatar: '🧙', specialty: 'BTC & ETH Long-term', followers: '3.8K', pnl: '+34.2%', rank: 2 },
  { name: 'AlpacaWhale', avatar: '🦙', specialty: 'Stock Market Momentum', followers: '2.9K', pnl: '+21.5%', rank: 3 },
]

const assets = [
  { name: 'Bitcoin', symbol: 'BTC', icon: '₿', price: '$67,842', change: '+2.4%', color: 'text-orange-400' },
  { name: 'Ethereum', symbol: 'ETH', icon: 'Ξ', price: '$3,421', change: '+1.8%', color: 'text-blue-400' },
  { name: 'Apple Inc.', symbol: 'AAPL', icon: '', price: '$189.45', change: '+1.2%', color: 'text-gray-300' },
  { name: 'Tesla', symbol: 'TSLA', icon: 'T', price: '$175.22', change: '-2.4%', color: 'text-red-500' },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0a0a1a] text-white overflow-hidden">
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] rounded-full bg-blue-600/10 blur-[150px] animate-pulse" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[700px] h-[700px] rounded-full bg-purple-600/10 blur-[150px] animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-[50%] left-[50%] w-[500px] h-[500px] rounded-full bg-cyan-500/5 blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute inset-0 opacity-[0.02]" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '60px 60px'
        }} />
        {[...Array(30)].map((_, i) => (
          <div key={i} className="absolute w-1 h-1 rounded-full bg-blue-400/30"
            style={{ top: `${Math.random() * 100}%`, left: `${Math.random() * 100}%`,
              animation: `float ${5 + Math.random() * 10}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 5}s` }} />
        ))}
      </div>

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <span className="text-xl font-bold">X Bot Trader</span>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/pricing" className="text-gray-400 hover:text-white transition px-4 py-2">Pricing</Link>
          <Link to="/login" className="text-gray-400 hover:text-white transition px-4 py-2">Sign In</Link>
          <Link to="/register" className="bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 px-5 py-2.5 rounded-xl font-semibold transition shadow-lg shadow-blue-500/25">
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 text-center px-6 pt-16 pb-20 max-w-5xl mx-auto">
        <div className="inline-block mb-6 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium">
          <span className="w-2 h-2 rounded-full bg-green-500 inline-block animate-pulse mr-2" />
          Live Trading Active — 1,247 bots running now
        </div>
        <h1 className="text-5xl md:text-7xl font-bold leading-tight mb-6">
          <span className="bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent">Let AI Trade</span>
          <br />
          <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent">Everything For You</span>
        </h1>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10">
          Pick a bot. Connect your exchange. Watch it trade 24/7.
          Crypto & Stocks. Your money stays in your account — we just run the strategy.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link to="/register" className="bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 px-8 py-4 rounded-xl font-bold text-lg transition shadow-xl shadow-blue-500/30 hover:shadow-blue-500/50">
            Start Trading — $20/mo
          </Link>
          <a href="#bots" className="px-8 py-4 rounded-xl font-semibold text-lg border border-white/10 hover:bg-white/5 transition">
            View Bots
          </a>
        </div>
      </section>

      {/* Live ticker */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 mb-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {assets.map((asset) => (
            <div key={asset.symbol} className="backdrop-blur-lg bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition">
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-2xl ${asset.color}`}>{asset.icon}</span>
                <div>
                  <p className="font-semibold text-sm">{asset.name}</p>
                  <p className="text-gray-500 text-xs">{asset.symbol}</p>
                </div>
              </div>
              <p className="text-lg font-bold">{asset.price}</p>
              <p className={`text-sm ${asset.change.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}>{asset.change}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Bots Section */}
      <section id="bots" className="relative z-10 max-w-7xl mx-auto px-6 mb-20">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">
            <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">AI Trading Bots</span>
          </h2>
          <p className="text-gray-400 text-lg">Pick a strategy. Each bot has been backtested and optimized.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {bots.map((bot) => (
            <div key={bot.name} className={`group backdrop-blur-lg bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all hover:scale-[1.02] shadow-xl ${bot.shadow}`}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${bot.gradient} flex items-center justify-center text-2xl shadow-lg ${bot.shadow}`}>
                    {bot.icon}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">{bot.name}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${bot.tagColor}`}>{bot.tag}</span>
                  </div>
                </div>
              </div>
              <p className="text-gray-400 mb-5">{bot.desc}</p>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white/5 rounded-lg p-3 text-center">
                  <p className="text-green-400 font-bold text-lg">{bot.stats.winRate}</p>
                  <p className="text-gray-500 text-xs">Win Rate</p>
                </div>
                <div className="bg-white/5 rounded-lg p-3 text-center">
                  <p className="text-blue-400 font-bold text-lg">{bot.stats.avgReturn}</p>
                  <p className="text-gray-500 text-xs">Avg Return</p>
                </div>
                <div className="bg-white/5 rounded-lg p-3 text-center">
                  <p className="text-purple-400 font-bold text-lg">{bot.stats.trades}</p>
                  <p className="text-gray-500 text-xs">Trades</p>
                </div>
              </div>
              <Link to="/register" className={`mt-5 block text-center bg-gradient-to-r ${bot.gradient} px-6 py-3 rounded-xl font-semibold transition opacity-80 hover:opacity-100 shadow-lg ${bot.shadow}`}>
                Start This Bot
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Top Traders / Advisors */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 mb-20">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Top Traders to Copy</span>
          </h2>
          <p className="text-gray-400 text-lg">Follow the best. Mirror their trades automatically.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {advisors.map((a) => (
            <div key={a.name} className="backdrop-blur-lg bg-white/5 border border-white/10 rounded-2xl p-6 text-center hover:bg-white/10 transition-all hover:scale-[1.02]">
              <div className="text-5xl mb-3">{a.avatar}</div>
              <div className="inline-block px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 text-xs font-bold mb-2">
                #{a.rank} Trader
              </div>
              <h3 className="text-xl font-bold mb-1">{a.name}</h3>
              <p className="text-gray-500 text-sm mb-4">{a.specialty}</p>
              <div className="flex justify-center gap-6 mb-4">
                <div>
                  <p className="text-green-400 font-bold text-xl">{a.pnl}</p>
                  <p className="text-gray-500 text-xs">30d P&L</p>
                </div>
                <div>
                  <p className="text-blue-400 font-bold text-xl">{a.followers}</p>
                  <p className="text-gray-500 text-xs">Followers</p>
                </div>
              </div>
              <Link to="/register" className="block bg-gradient-to-r from-purple-600 to-pink-500 px-6 py-2.5 rounded-xl font-semibold transition opacity-80 hover:opacity-100 shadow-lg shadow-purple-500/25">
                Copy Trader
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 mb-20">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">
            <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">How It Works</span>
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { step: '1', title: 'Connect Coinbase', desc: 'Link your exchange with API keys. Your funds stay in YOUR account.', icon: '🔗', gradient: 'from-blue-500 to-cyan-400' },
            { step: '2', title: 'Pick a Bot', desc: 'Choose from AI strategies or copy a top trader. Start with paper trading.', icon: '🤖', gradient: 'from-purple-500 to-pink-400' },
            { step: '3', title: 'Watch It Trade', desc: 'Your bot trades 24/7. Monitor performance, adjust settings, cash out anytime.', icon: '💰', gradient: 'from-emerald-500 to-teal-400' },
          ].map((s) => (
            <div key={s.step} className="text-center">
              <div className={`w-20 h-20 mx-auto mb-5 rounded-2xl bg-gradient-to-br ${s.gradient} flex items-center justify-center text-3xl shadow-xl`}>
                {s.icon}
              </div>
              <div className="text-sm font-bold text-gray-500 mb-2">STEP {s.step}</div>
              <h3 className="text-xl font-bold mb-2">{s.title}</h3>
              <p className="text-gray-400">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Security */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 mb-20">
        <div className="backdrop-blur-lg bg-white/5 border border-white/10 rounded-2xl p-8 md:p-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-4">Your Money. Your Control.</h2>
              <p className="text-gray-400 mb-6">We never hold your funds. Your assets stay in your own account (Coinbase or Alpaca). We only execute trades through read/trade API access — no withdrawal permissions needed.</p>
              <div className="space-y-3">
                {[
                  'AES-256 encrypted API keys',
                  'No withdrawal access required',
                  'Paper trading mode to test risk-free',
                  'Stop-loss & take-profit on every trade',
                  'Cancel anytime — your funds are always yours',
                ].map((f, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 text-sm">✓</span>
                    <span className="text-gray-300">{f}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-center">
              <div className="w-64 h-64 rounded-full bg-gradient-to-br from-green-500/20 to-emerald-500/5 border border-green-500/20 flex items-center justify-center">
                <div className="w-44 h-44 rounded-full bg-gradient-to-br from-green-500/20 to-emerald-500/10 border border-green-500/10 flex items-center justify-center">
                  <span className="text-6xl">🔒</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 text-center px-6 pb-20">
        <h2 className="text-4xl md:text-5xl font-bold mb-6">
          <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Ready to Let AI Trade For You?
          </span>
        </h2>
        <p className="text-gray-400 text-lg mb-8">Start with paper trading. Go live when you're confident.</p>
        <Link to="/register" className="inline-block bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500 hover:from-blue-500 hover:via-purple-500 hover:to-pink-400 px-10 py-4 rounded-xl font-bold text-lg transition shadow-xl shadow-purple-500/30 hover:shadow-purple-500/50">
          Create Free Account
        </Link>
        <p className="text-gray-600 text-sm mt-4">$20/month after paper trading. Cancel anytime.</p>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 py-8 px-6">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-gray-500">
            <div className="w-6 h-6 rounded bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            X Bot Trader &copy; 2026
          </div>
          <div className="flex gap-6 text-gray-500 text-sm">
            <Link to="/terms" className="hover:text-white transition">Terms</Link>
            <Link to="/privacy" className="hover:text-white transition">Privacy</Link>
            <Link to="/pricing" className="hover:text-white transition">Pricing</Link>
            <a href="mailto:support@xbottrader.ca" className="hover:text-white transition">Support</a>
          </div>
          <div className="flex items-center gap-4">
            <a href="https://facebook.com/xbottrader" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-[#1877F2] transition" aria-label="Facebook">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </a>
            <a href="https://t.me/xbottrader" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-[#2AABEE] transition" aria-label="Telegram">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
              </svg>
            </a>
          </div>
          <p className="text-gray-600 text-xs mt-4 md:mt-0 text-center">
            Investment trading involves risk. Past performance does not guarantee future results.
          </p>
        </div>
      </footer>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) translateX(0px); opacity: 0.3; }
          25% { transform: translateY(-20px) translateX(10px); opacity: 0.6; }
          50% { transform: translateY(-10px) translateX(-10px); opacity: 0.2; }
          75% { transform: translateY(-30px) translateX(5px); opacity: 0.5; }
        }
      `}</style>
    </div>
  )
}
