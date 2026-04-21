import { Link, useLocation, Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import AnimatedBackground from './AnimatedBackground'
import GlobalFooter from './GlobalFooter'

const variantMap: Record<string, 'default' | 'trading' | 'strategy' | 'history' | 'settings'> = {
  '/dashboard': 'trading',
  '/strategies': 'strategy',
  '/trades': 'history',
  '/settings': 'settings',
}

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: '📊' },
  { path: '/markets', label: 'Markets', icon: '💹' },
  { path: '/strategies', label: 'My Bots', icon: '🤖' },
  { path: '/backtest', label: 'Backtest Lab', icon: '🧪' },
  { path: '/assistant', label: 'AI Assistant', icon: '🧠' },
  { path: '/leaderboard', label: 'Leaderboard', icon: '🏆' },
  { path: '/trades', label: 'Trade History', icon: '📈' },
  { path: '/settings', label: 'Settings', icon: '⚙️' },
]

export default function Layout() {
  const { user, logout } = useAuth()
  const location = useLocation()

  return (
    <div className="min-h-screen bg-[#0a0a1a] flex">
      {/* Sidebar */}
      <aside className="w-64 bg-[#0d0d20] border-r border-white/5 flex flex-col">
        <div className="p-5 border-b border-white/5">
          <Link to="/dashboard" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <span className="font-bold text-lg text-white">X Bot Trader</span>
          </Link>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => {
            const active = location.pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  active
                    ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </Link>
            )
          })}
        </nav>
        <div className="p-4 border-t border-white/5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-400 flex items-center justify-center text-sm font-bold">
              {user?.username?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.username}</p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full text-gray-500 hover:text-red-400 text-sm py-2 rounded-lg hover:bg-red-500/5 transition"
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="h-16 border-b border-white/5 flex items-center justify-between px-6">
          <div />
          <div className="flex items-center gap-4">
            {user?.is_paper_mode && (
              <span className="bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 px-3 py-1 rounded-full text-xs font-bold animate-pulse">
                PAPER MODE
              </span>
            )}
          </div>
        </header>
        <div className="flex-1 p-6 overflow-auto relative">
          <AnimatedBackground variant={variantMap[location.pathname] || 'default'} />
          <div className="relative" style={{ zIndex: 1 }}>
            <Outlet />
          </div>
        </div>
        <GlobalFooter />
      </main>
    </div>
  )
}
