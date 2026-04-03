import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const plans = [
  {
    name: 'Free Trial',
    price: '$0',
    period: '7 days',
    description: 'Test everything with paper trading',
    gradient: 'from-gray-600 to-gray-500',
    shadow: '',
    features: [
      { text: 'Paper trading (virtual $100K)', included: true },
      { text: '2 AI bot strategies', included: true },
      { text: 'AI Assistant', included: true },
      { text: 'Live market data', included: true },
      { text: 'Live trading', included: false },
      { text: 'Copy trading', included: false },
      { text: 'All bot personalities', included: false },
      { text: 'Priority support', included: false },
    ],
    cta: 'Start Free Trial',
    popular: false,
  },
  {
    name: 'Trader',
    price: '$20',
    period: '/month',
    description: 'Everything you need to trade with AI',
    gradient: 'from-blue-600 to-cyan-500',
    shadow: 'shadow-blue-500/30',
    features: [
      { text: 'Paper trading (virtual $100K)', included: true },
      { text: 'All 4 AI bot strategies', included: true },
      { text: 'AI Assistant with custom avatar', included: true },
      { text: 'Live market data', included: true },
      { text: 'Live trading on Coinbase', included: true },
      { text: 'Copy top traders', included: true },
      { text: 'All bot personalities', included: true },
      { text: 'Email support', included: true },
    ],
    cta: 'Start Trading',
    popular: true,
  },
  {
    name: 'Pro',
    price: '$50',
    period: '/month',
    description: 'For serious traders who want the edge',
    gradient: 'from-purple-600 to-pink-500',
    shadow: 'shadow-purple-500/30',
    features: [
      { text: 'Everything in Trader, plus:', included: true },
      { text: 'Unlimited bots running at once', included: true },
      { text: 'Advanced AI strategies (Momentum, Mean Reversion)', included: true },
      { text: 'Multi-exchange support (Binance, Kraken)', included: true },
      { text: 'Backtesting engine', included: true },
      { text: 'Custom strategy builder', included: true },
      { text: 'API access', included: true },
      { text: 'Priority 24/7 support', included: true },
    ],
    cta: 'Go Pro',
    popular: false,
  },
]

export default function PricingPage() {
  const { user } = useAuth()

  return (
    <div className="min-h-screen bg-[#0a0a1a] relative overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[20%] w-[600px] h-[600px] rounded-full bg-blue-600/10 blur-[150px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[10%] w-[500px] h-[500px] rounded-full bg-purple-600/10 blur-[150px] animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-block mb-4 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium">
            💰 Money-back guarantee on all paid plans
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent">
              Choose Your Trading Plan
            </span>
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Start with a free trial. Upgrade when you're ready to trade with real money.
            If our AI doesn't cover your subscription in 30 days, full refund.
          </p>
        </div>

        {/* Plans */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div key={plan.name} className={`relative backdrop-blur-lg rounded-2xl p-8 transition-all hover:scale-[1.02] ${
              plan.popular
                ? 'bg-white/10 border-2 border-blue-500/50 shadow-2xl ' + plan.shadow
                : 'bg-white/5 border border-white/10'
            }`}>
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-600 to-cyan-500 px-4 py-1 rounded-full text-xs font-bold text-white shadow-lg">
                  MOST POPULAR
                </div>
              )}

              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
                <div className="flex items-baseline justify-center gap-1">
                  <span className={`text-5xl font-bold bg-gradient-to-r ${plan.gradient} bg-clip-text text-transparent`}>
                    {plan.price}
                  </span>
                  <span className="text-gray-400">{plan.period}</span>
                </div>
                <p className="text-gray-400 text-sm mt-2">{plan.description}</p>
              </div>

              <div className="space-y-3 mb-8">
                {plan.features.map((f, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                      f.included ? 'bg-green-500/20 text-green-400' : 'bg-white/5 text-gray-600'
                    }`}>
                      {f.included ? '✓' : '—'}
                    </span>
                    <span className={f.included ? 'text-gray-300 text-sm' : 'text-gray-600 text-sm'}>
                      {f.text}
                    </span>
                  </div>
                ))}
              </div>

              <Link to={plan.name === 'Free Trial' ? (user ? '/dashboard' : '/register') : (user ? '/payment' : '/register')}
                className={`block text-center py-3.5 rounded-xl font-semibold transition ${
                  plan.popular
                    ? `bg-gradient-to-r ${plan.gradient} shadow-lg ${plan.shadow} hover:shadow-xl text-white`
                    : 'border border-white/20 text-white hover:bg-white/5'
                }`}>
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div className="mt-20 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-white text-center mb-10">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {[
              { q: "Do you hold my money?", a: "Never. Your funds stay in your own Coinbase account. We only execute trades through API access — no withdrawal permissions." },
              { q: "What's the money-back guarantee?", a: "If our AI bots don't make back your $20 subscription fee within the first 30 days of live trading, we'll refund your subscription. No questions asked." },
              { q: "Can I cancel anytime?", a: "Yes. Cancel your subscription anytime from Settings. Your bots will stop, and your funds remain in your Coinbase account." },
              { q: "Is paper trading really free?", a: "Yes. 7-day free trial includes paper trading with $100K virtual money and real market prices. No credit card required." },
              { q: "How do I connect my Coinbase?", a: "Go to Settings → API Keys. Generate an API key on Coinbase (with trade permissions, no withdrawal), paste it in our app. Takes 2 minutes." },
              { q: "What if I lose money trading?", a: "Trading involves risk. Our money-back guarantee covers the subscription fee only, not trading losses. We recommend starting with paper trading and the Conservative bot personality." },
            ].map((faq, i) => (
              <details key={i} className="group bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                <summary className="flex items-center justify-between px-6 py-4 cursor-pointer text-white font-medium hover:bg-white/5 transition">
                  {faq.q}
                  <span className="text-gray-500 group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <div className="px-6 pb-4 text-gray-400 text-sm">{faq.a}</div>
              </details>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 text-center">
          <p className="text-gray-500 text-sm">
            Cryptocurrency trading involves risk. Past performance does not guarantee future results.
          </p>
        </div>
      </div>
    </div>
  )
}
