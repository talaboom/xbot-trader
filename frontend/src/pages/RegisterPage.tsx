import { useState } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import { register } from '../api/auth'
import { useAuth } from '../contexts/AuthContext'

export default function RegisterPage() {
  const [searchParams] = useSearchParams()
  const refCode = searchParams.get('ref') || ''
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { setTokens } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await register(email, username, password, refCode || undefined)
      setTokens(res.data.access_token, res.data.refresh_token)
      navigate('/dashboard')
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center px-4">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-[#0a0a1a]">
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-purple-600/20 blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-blue-600/20 blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-[30%] left-[20%] w-[300px] h-[300px] rounded-full bg-emerald-500/15 blur-[100px] animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute bottom-[40%] right-[15%] w-[250px] h-[250px] rounded-full bg-cyan-500/10 blur-[80px] animate-pulse" style={{ animationDelay: '0.5s' }} />
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '50px 50px'
        }} />
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-purple-400/40"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animation: `float ${5 + Math.random() * 10}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 5}s`,
            }}
          />
        ))}
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-400 flex items-center justify-center">
              <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-purple-100 to-purple-300 bg-clip-text text-transparent">
              X Bot Trader
            </h1>
          </div>
          <p className="text-purple-400/80 text-lg">Start Trading with AI Today</p>
        </div>

        {refCode && (
          <div className="mb-4 bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3 text-center">
            <p className="text-green-400 text-sm font-medium">You were referred by a friend! Both of you get rewards.</p>
          </div>
        )}

        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-8 shadow-2xl shadow-purple-500/5">
          <h2 className="text-xl font-semibold text-white mb-6">Create Account</h2>
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-sm mb-5">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-gray-400 text-sm mb-2 font-medium">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/5 text-white rounded-xl px-4 py-3.5 border border-white/10 focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 focus:outline-none transition-all placeholder-gray-600"
                placeholder="trader@example.com"
                required
              />
            </div>
            <div>
              <label className="block text-gray-400 text-sm mb-2 font-medium">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-white/5 text-white rounded-xl px-4 py-3.5 border border-white/10 focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 focus:outline-none transition-all placeholder-gray-600"
                placeholder="Choose a username"
                required
              />
            </div>
            <div>
              <label className="block text-gray-400 text-sm mb-2 font-medium">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/5 text-white rounded-xl px-4 py-3.5 border border-white/10 focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 focus:outline-none transition-all placeholder-gray-600"
                placeholder="Min 6 characters"
                required
                minLength={6}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-500 hover:to-pink-400 disabled:from-purple-800 disabled:to-pink-800 text-white font-semibold py-3.5 rounded-xl transition-all shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  Creating account...
                </span>
              ) : 'Create Account'}
            </button>
          </form>
          <div className="mt-6 text-center">
            <p className="text-gray-500 text-sm">
              Already have an account?{' '}
              <Link to="/login" className="text-purple-400 hover:text-purple-300 font-medium transition">
                Sign In
              </Link>
            </p>
          </div>
        </div>

        {/* Features */}
        <div className="mt-8 space-y-3">
          {[
            { icon: '🤖', text: 'AI strategies trade 24/7 while you sleep', color: 'blue' },
            { icon: '📊', text: 'Copy top traders with one click', color: 'purple' },
            { icon: '🔒', text: 'Your funds stay in your own Coinbase account', color: 'green' },
          ].map((f, i) => (
            <div key={i} className="backdrop-blur-lg bg-white/5 border border-white/5 rounded-xl px-4 py-3 flex items-center gap-3">
              <span className="text-xl">{f.icon}</span>
              <span className="text-gray-400 text-sm">{f.text}</span>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) translateX(0px); opacity: 0.4; }
          25% { transform: translateY(-20px) translateX(10px); opacity: 0.8; }
          50% { transform: translateY(-10px) translateX(-10px); opacity: 0.3; }
          75% { transform: translateY(-30px) translateX(5px); opacity: 0.7; }
        }
      `}</style>
    </div>
  )
}
