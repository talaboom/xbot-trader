import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { register, verifyEmail, resendCode } from '../api/auth'
import { useAuth } from '../contexts/AuthContext'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<'register' | 'verify'>('register')
  const { setTokens } = useAuth()
  const navigate = useNavigate()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await register(email, username, password)
      setStep('verify')
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await verifyEmail(email, code)
      setTokens(res.data.access_token, res.data.refresh_token)
      navigate('/dashboard')
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Verification failed')
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    setError('')
    try {
      await resendCode(email)
      setError('')
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to resend code')
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-[#0a0a1a]">
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-purple-600/20 blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-blue-600/20 blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-[30%] left-[20%] w-[300px] h-[300px] rounded-full bg-emerald-500/15 blur-[100px] animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute bottom-[40%] right-[15%] w-[250px] h-[250px] rounded-full bg-cyan-500/10 blur-[80px] animate-pulse" style={{ animationDelay: '0.5s' }} />
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '50px 50px'
        }} />
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

        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-8 shadow-2xl shadow-purple-500/5">
          {step === 'register' ? (
            <>
              <h2 className="text-xl font-semibold text-white mb-6">Create Account</h2>
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-sm mb-5">
                  {error}
                </div>
              )}
              <form onSubmit={handleRegister} className="space-y-5">
                <div>
                  <label className="block text-gray-400 text-sm mb-2 font-medium">Email</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white/5 text-white rounded-xl px-4 py-3.5 border border-white/10 focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 focus:outline-none transition-all placeholder-gray-600"
                    placeholder="trader@example.com" required />
                </div>
                <div>
                  <label className="block text-gray-400 text-sm mb-2 font-medium">Username</label>
                  <input type="text" value={username} onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-white/5 text-white rounded-xl px-4 py-3.5 border border-white/10 focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 focus:outline-none transition-all placeholder-gray-600"
                    placeholder="Choose a username" required />
                </div>
                <div>
                  <label className="block text-gray-400 text-sm mb-2 font-medium">Password</label>
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-white/5 text-white rounded-xl px-4 py-3.5 border border-white/10 focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 focus:outline-none transition-all placeholder-gray-600"
                    placeholder="Min 6 characters" required minLength={6} />
                </div>
                <button type="submit" disabled={loading}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-500 hover:to-pink-400 disabled:from-purple-800 disabled:to-pink-800 text-white font-semibold py-3.5 rounded-xl transition-all shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40">
                  {loading ? 'Creating account...' : 'Create Account'}
                </button>
              </form>
            </>
          ) : (
            <>
              <h2 className="text-xl font-semibold text-white mb-2">Verify Your Email</h2>
              <p className="text-gray-400 text-sm mb-6">We sent a 6-digit code to <span className="text-white">{email}</span></p>
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-sm mb-5">
                  {error}
                </div>
              )}
              <form onSubmit={handleVerify} className="space-y-5">
                <div>
                  <label className="block text-gray-400 text-sm mb-2 font-medium">Verification Code</label>
                  <input type="text" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="w-full bg-white/5 text-white rounded-xl px-4 py-4 border border-white/10 focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 focus:outline-none transition-all text-center text-2xl tracking-[0.5em] font-mono placeholder-gray-600"
                    placeholder="000000" required maxLength={6} autoFocus />
                </div>
                <button type="submit" disabled={loading || code.length !== 6}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-500 hover:to-emerald-400 disabled:from-gray-700 disabled:to-gray-700 text-white font-semibold py-3.5 rounded-xl transition-all shadow-lg shadow-green-500/25">
                  {loading ? 'Verifying...' : 'Verify Email'}
                </button>
              </form>
              <div className="mt-4 text-center">
                <button onClick={handleResend} className="text-purple-400 hover:text-purple-300 text-sm transition">
                  Didn't receive the code? Resend
                </button>
              </div>
            </>
          )}
          <div className="mt-6 text-center">
            <p className="text-gray-500 text-sm">
              Already have an account?{' '}
              <Link to="/login" className="text-purple-400 hover:text-purple-300 font-medium transition">Sign In</Link>
            </p>
          </div>
        </div>

        {step === 'register' && (
          <div className="mt-8 space-y-3">
            {[
              { icon: '🤖', text: 'AI strategies trade 24/7 while you sleep' },
              { icon: '📊', text: 'Copy top traders with one click' },
              { icon: '🔒', text: 'Your funds stay in your own Coinbase account' },
            ].map((f, i) => (
              <div key={i} className="backdrop-blur-lg bg-white/5 border border-white/5 rounded-xl px-4 py-3 flex items-center gap-3">
                <span className="text-xl">{f.icon}</span>
                <span className="text-gray-400 text-sm">{f.text}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
