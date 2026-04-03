import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function PaymentSuccessPage() {
  const { refreshUser, user } = useAuth()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    // Poll for subscription update (webhook may take a few seconds)
    let attempts = 0
    const interval = setInterval(async () => {
      await refreshUser()
      attempts++
      if (attempts >= 10) {
        clearInterval(interval)
        setChecking(false)
      }
    }, 2000)

    return () => clearInterval(interval)
  }, [refreshUser])

  useEffect(() => {
    if (user?.subscription_status === 'active') {
      setChecking(false)
    }
  }, [user])

  return (
    <div className="min-h-screen bg-[#0a0a1a] relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[20%] w-[600px] h-[600px] rounded-full bg-green-600/10 blur-[150px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[10%] w-[500px] h-[500px] rounded-full bg-blue-600/10 blur-[150px] animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative z-10 max-w-lg mx-auto px-6 py-24 text-center">
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-10">
          <div className="text-7xl mb-6">
            {user?.subscription_status === 'active' ? '🎉' : checking ? '⏳' : '✅'}
          </div>

          <h1 className="text-3xl font-bold text-white mb-3">
            {user?.subscription_status === 'active'
              ? 'Subscription Active!'
              : checking
              ? 'Activating Your Plan...'
              : 'Payment Received!'}
          </h1>

          <p className="text-gray-400 mb-8">
            {user?.subscription_status === 'active'
              ? `You're now on the ${user.subscription_tier.charAt(0).toUpperCase() + user.subscription_tier.slice(1)} plan. All premium features are unlocked.`
              : checking
              ? 'We\'re processing your payment. This usually takes a few seconds...'
              : 'Your subscription will be activated shortly. You can start using premium features now.'}
          </p>

          <Link
            to="/dashboard"
            className="inline-block bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-500 hover:to-emerald-400 px-8 py-3.5 rounded-xl font-semibold shadow-lg shadow-green-500/25 transition"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
