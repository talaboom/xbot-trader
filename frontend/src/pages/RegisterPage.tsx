import { useState } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import { register, verifyEmail, resendCode, loginWithFacebook } from '../api/auth'
import { useAuth } from '../contexts/AuthContext'
import OAuthButtons from '../components/OAuthButtons'

declare const FB: {
  login: (cb: (res: { authResponse?: { accessToken: string }; status: string }) => void, opts: { scope: string }) => void
}

export default function RegisterPage() {
  const [searchParams] = useSearchParams()
  const refCode = searchParams.get('ref') || ''
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [fbLoading, setFbLoading] = useState(false)
  const [step, setStep] = useState<'register' | 'verify'>('register')
  const { setTokens } = useAuth()
  const navigate = useNavigate()

  const handleFacebookLogin = () => {
    setError('')
    setFbLoading(true)
    FB.login(async (response) => {
      if (response.authResponse?.accessToken) {
        try {
          const res = await loginWithFacebook(response.authResponse.accessToken)
          setTokens(res.data.access_token, res.data.refresh_token)
          navigate('/dashboard')
        } catch (err: any) {
          setError(err.response?.data?.detail || 'Facebook login failed')
          setFbLoading(false)
        }
      } else {
        setFbLoading(false)
      }
    }, { scope: 'email' })
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await register(email, username, password, refCode || undefined)
      if (res.data.access_token) {
        // Email service down — auto-verified, log in directly
        setTokens(res.data.access_token, res.data.refresh_token)
        navigate('/dashboard')
      } else {
        setStep('verify')
      }
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

        {refCode && (
          <div className="mb-4 bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3 text-center">
            <p className="text-green-400 text-sm font-medium">You were referred by a friend! Both of you get rewards.</p>
          </div>
        )}

        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-8 shadow-2xl shadow-purple-500/5">
          {step === 'register' ? (
            <>
              <h2 className="text-xl font-semibold text-white mb-6">Create Account</h2>
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
                <label className="flex items-start gap-2 cursor-pointer">
                  <input type="checkbox" required className="mt-1 w-4 h-4 rounded border-white/20 bg-white/5 text-purple-500 focus:ring-purple-500/30" />
                  <span className="text-xs text-gray-400">
                    I agree to the{' '}
                    <Link to="/terms" className="text-purple-400 hover:underline">Terms of Service</Link>,{' '}
                    <Link to="/privacy" className="text-purple-400 hover:underline">Privacy Policy</Link>, and{' '}
                    <Link to="/risk" className="text-purple-400 hover:underline">Risk Disclaimer</Link>.
                    I understand that cryptocurrency trading involves significant risk of loss.
                  </span>
                </label>
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
          {step === 'register' && (
            <div className="mt-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 h-px bg-white/10" />
                <span className="text-gray-500 text-xs">or</span>
                <div className="flex-1 h-px bg-white/10" />
              </div>
              <button
                onClick={handleFacebookLogin}
                disabled={fbLoading || loading}
                className="w-full flex items-center justify-center gap-3 bg-[#1877F2] hover:bg-[#166fe5] disabled:bg-[#1877F2]/50 text-white font-semibold py-3.5 rounded-xl transition-all shadow-lg shadow-blue-900/30"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                {fbLoading ? 'Connecting...' : 'Continue with Facebook'}
              </button>
            </div>
          )}
          <div className="mt-5 text-center">
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
