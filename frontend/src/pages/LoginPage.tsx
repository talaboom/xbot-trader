import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { login } from '../api/auth'
import { useAuth } from '../contexts/AuthContext'
import OAuthButtons from '../components/OAuthButtons'

export default function LoginPage() {
  const [email, setEmail] = useState('')
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
      const res = await login(email, password)
      setTokens(res.data.access_token, res.data.refresh_token)
      navigate('/dashboard')
    } catch (err: any) {
      const detail = err.response?.data?.detail || 'Login failed'
      if (err.response?.status === 403 && detail.includes('not verified')) {
        navigate(`/register?verify=${encodeURIComponent(email)}`)
        return
      }
      setError(detail)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center px-4">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-[#0a0a1a]">
        {/* Gradient orbs */}
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-blue-600/20 blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-purple-600/20 blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-[40%] right-[20%] w-[300px] h-[300px] rounded-full bg-cyan-500/15 blur-[100px] animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute bottom-[30%] left-[15%] w-[250px] h-[250px] rounded-full bg-emerald-500/10 blur-[80px] animate-pulse" style={{ animationDelay: '0.5s' }} />
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '50px 50px'
        }} />
        {/* Floating particles */}
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-blue-400/40"
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
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center">
              <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-blue-100 to-blue-300 bg-clip-text text-transparent">
              X Bot Trader
            </h1>
          </div>
          <p className="text-blue-400/80 text-lg">AI-Powered Crypto Trading</p>
          <div className="flex items-center justify-center gap-6 mt-4 text-xs text-gray-500">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> Live Markets</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" /> AI Strategies</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" /> Copy Trading</span>
          </div>
        </div>

        {/* Login card */}
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-8 shadow-2xl shadow-blue-500/5">
          <h2 className="text-xl font-semibold text-white mb-6">Sign In</h2>
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-sm mb-5">
              {error}
            </div>
          )}
          <OAuthButtons />

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-gray-500 text-xs uppercase tracking-wider">or</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-gray-400 text-sm mb-2 font-medium">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/5 text-white rounded-xl px-4 py-3.5 border border-white/10 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all placeholder-gray-600"
                placeholder="trader@example.com"
                required
              />
            </div>
            <div>
              <label className="block text-gray-400 text-sm mb-2 font-medium">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/5 text-white rounded-xl px-4 py-3.5 border border-white/10 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all placeholder-gray-600"
                placeholder="Enter your password"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 disabled:from-blue-800 disabled:to-cyan-800 text-white font-semibold py-3.5 rounded-xl transition-all shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  Signing in...
                </span>
              ) : 'Sign In'}
            </button>
            <p className="text-center text-xs text-gray-500 mt-3">
              By signing in, you agree to our{' '}
              <Link to="/terms" className="text-blue-400 hover:underline">Terms of Service</Link>
              {' '}and{' '}
              <Link to="/privacy" className="text-blue-400 hover:underline">Privacy Policy</Link>
            </p>
          </form>
          <div className="mt-6 text-center">
            <p className="text-gray-500 text-sm">
              No account?{' '}
              <Link to="/register" className="text-blue-400 hover:text-blue-300 font-medium transition">
                Create one
              </Link>
            </p>
          </div>
        </div>

        {/* Bottom stats */}
        <div className="mt-8 grid grid-cols-3 gap-4">
          <div className="backdrop-blur-lg bg-white/5 border border-white/5 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold bg-gradient-to-r from-green-400 to-emerald-300 bg-clip-text text-transparent">24/7</p>
            <p className="text-gray-500 text-xs mt-1">Auto Trading</p>
          </div>
          <div className="backdrop-blur-lg bg-white/5 border border-white/5 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">5+</p>
            <p className="text-gray-500 text-xs mt-1">AI Strategies</p>
          </div>
          <div className="backdrop-blur-lg bg-white/5 border border-white/5 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-300 bg-clip-text text-transparent">$20</p>
            <p className="text-gray-500 text-xs mt-1">/ Month</p>
          </div>
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
