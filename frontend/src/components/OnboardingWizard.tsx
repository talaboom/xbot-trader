import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createStrategy } from '../api/strategies'

interface Props {
  onComplete: () => void
}

export default function OnboardingWizard({ onComplete }: Props) {
  const [step, setStep] = useState(0)
  const [experience, setExperience] = useState('')
  const [goal, setGoal] = useState('')
  const [risk, setRisk] = useState('')
  const [budget, setBudget] = useState('')
  const [coin, setCoin] = useState('BTC-USD')
  const [creating, setCreating] = useState(false)
  const navigate = useNavigate()

  const steps = [
    { title: 'Welcome', subtitle: 'Let\'s set up your first trading bot in under 60 seconds' },
    { title: 'Experience', subtitle: 'How much do you know about crypto?' },
    { title: 'Your Goal', subtitle: 'What are you looking to do?' },
    { title: 'Risk Level', subtitle: 'How much risk are you comfortable with?' },
    { title: 'Budget', subtitle: 'How much do you want to start with?' },
    { title: 'Pick a Coin', subtitle: 'Which crypto do you want to trade?' },
    { title: 'All Set!', subtitle: 'Your bot is ready to go' },
  ]

  const experienceOptions = [
    { value: 'beginner', emoji: '🌱', label: 'Brand New', desc: 'Never traded crypto before' },
    { value: 'some', emoji: '📈', label: 'Some Experience', desc: 'Bought crypto a few times' },
    { value: 'experienced', emoji: '🧠', label: 'Experienced', desc: 'I trade regularly' },
    { value: 'pro', emoji: '🐺', label: 'Pro Trader', desc: 'I know what I\'m doing' },
  ]

  const goalOptions = [
    { value: 'passive', emoji: '😴', label: 'Passive Income', desc: 'Set it and forget it' },
    { value: 'grow', emoji: '🌳', label: 'Grow My Portfolio', desc: 'Steady long-term growth' },
    { value: 'active', emoji: '⚡', label: 'Active Trading', desc: 'Maximize short-term gains' },
    { value: 'learn', emoji: '🎓', label: 'Learn Trading', desc: 'Practice with paper money' },
  ]

  const riskOptions = [
    { value: 'conservative', emoji: '🛡️', label: 'Conservative', desc: 'Protect my capital first', color: 'green', personality: 'Safe Guardian' },
    { value: 'moderate', emoji: '🧠', label: 'Moderate', desc: 'Balanced risk and reward', color: 'blue', personality: 'Smart Analyst' },
    { value: 'aggressive', emoji: '🐺', label: 'Aggressive', desc: 'I can handle big swings', color: 'red', personality: 'Alpha Wolf' },
    { value: 'degen', emoji: '🚀', label: 'YOLO', desc: 'Moon or bust', color: 'yellow', personality: 'Moon Shot' },
  ]

  const budgetOptions = [
    { value: '100', label: '$100', desc: 'Just testing' },
    { value: '500', label: '$500', desc: 'Getting started' },
    { value: '1000', label: '$1,000', desc: 'Serious about it' },
    { value: '5000', label: '$5,000+', desc: 'All in' },
  ]

  const coinOptions = [
    { value: 'BTC-USD', emoji: '₿', label: 'Bitcoin', desc: 'The OG — most stable', color: '#f7931a' },
    { value: 'ETH-USD', emoji: 'Ξ', label: 'Ethereum', desc: 'Smart contracts king', color: '#627eea' },
    { value: 'SOL-USD', emoji: 'S', label: 'Solana', desc: 'Fast & growing', color: '#9945ff' },
    { value: 'DOGE-USD', emoji: 'Ð', label: 'Dogecoin', desc: 'Meme power', color: '#c2a633' },
  ]

  const handleFinish = async () => {
    setCreating(true)

    const personalityMap: Record<string, string> = {
      conservative: 'conservative',
      moderate: 'moderate',
      aggressive: 'aggressive',
      degen: 'degen',
    }

    const personality = personalityMap[risk] || 'moderate'
    const budgetNum = parseInt(budget) || 500
    const investmentAmount = risk === 'conservative' ? budgetNum * 0.02 : risk === 'moderate' ? budgetNum * 0.05 : risk === 'aggressive' ? budgetNum * 0.1 : budgetNum * 0.2
    const intervalHours = risk === 'conservative' ? 24 : risk === 'moderate' ? 8 : risk === 'aggressive' ? 2 : 1

    try {
      await createStrategy({
        name: `My ${coinOptions.find(c => c.value === coin)?.label || 'Crypto'} Bot`,
        strategy_type: 'dca',
        product_id: coin,
        config: {
          investment_amount: Math.round(investmentAmount * 100) / 100,
          interval_hours: intervalHours,
          stop_loss_pct: risk === 'conservative' ? 25 : risk === 'moderate' ? 15 : risk === 'aggressive' ? 8 : 5,
          take_profit_pct: risk === 'conservative' ? 40 : risk === 'moderate' ? 30 : risk === 'aggressive' ? 20 : 15,
          max_total_investment: budgetNum,
          personality,
        },
        is_paper_mode: true,
      })
    } catch (e) {
      console.error(e)
    }
    setCreating(false)
    onComplete()
    navigate('/dashboard')
  }

  return (
    <div className="fixed inset-0 z-50 bg-[#0a0a1a]/95 backdrop-blur-xl flex items-center justify-center px-4">
      <div className="w-full max-w-lg">
        {/* Progress bar */}
        <div className="flex gap-1.5 mb-8">
          {steps.map((_, i) => (
            <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-500 ${
              i <= step ? 'bg-gradient-to-r from-blue-500 to-cyan-400' : 'bg-white/10'
            }`} />
          ))}
        </div>

        <div className="bg-[#111127] border border-white/10 rounded-2xl p-8 shadow-2xl">
          <h2 className="text-2xl font-bold text-white mb-1">{steps[step].title}</h2>
          <p className="text-gray-400 mb-8">{steps[step].subtitle}</p>

          {/* Step 0: Welcome */}
          {step === 0 && (
            <div className="text-center space-y-6">
              <div className="text-6xl mb-4">🤖</div>
              <p className="text-gray-300">I'll ask you a few quick questions to build the perfect trading bot for you.</p>
              <p className="text-gray-500 text-sm">You'll start in paper trading mode — no real money at risk.</p>
              <button onClick={() => setStep(1)}
                className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 py-4 rounded-xl font-bold text-lg shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition">
                Let's Go! 🚀
              </button>
            </div>
          )}

          {/* Step 1: Experience */}
          {step === 1 && (
            <div className="space-y-3">
              {experienceOptions.map(o => (
                <button key={o.value} onClick={() => { setExperience(o.value); setStep(2) }}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all text-left hover:scale-[1.02] ${
                    experience === o.value ? 'border-blue-500/50 bg-blue-500/10' : 'border-white/10 hover:border-white/20 hover:bg-white/5'
                  }`}>
                  <span className="text-3xl">{o.emoji}</span>
                  <div>
                    <p className="font-bold text-white">{o.label}</p>
                    <p className="text-sm text-gray-400">{o.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Step 2: Goal */}
          {step === 2 && (
            <div className="space-y-3">
              {goalOptions.map(o => (
                <button key={o.value} onClick={() => { setGoal(o.value); setStep(3) }}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all text-left hover:scale-[1.02] ${
                    goal === o.value ? 'border-blue-500/50 bg-blue-500/10' : 'border-white/10 hover:border-white/20 hover:bg-white/5'
                  }`}>
                  <span className="text-3xl">{o.emoji}</span>
                  <div>
                    <p className="font-bold text-white">{o.label}</p>
                    <p className="text-sm text-gray-400">{o.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Step 3: Risk */}
          {step === 3 && (
            <div className="space-y-3">
              {riskOptions.map(o => (
                <button key={o.value} onClick={() => { setRisk(o.value); setStep(4) }}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all text-left hover:scale-[1.02] ${
                    risk === o.value ? 'border-blue-500/50 bg-blue-500/10' : 'border-white/10 hover:border-white/20 hover:bg-white/5'
                  }`}>
                  <span className="text-3xl">{o.emoji}</span>
                  <div>
                    <p className="font-bold text-white">{o.label}</p>
                    <p className="text-sm text-gray-400">{o.desc} — {o.personality}</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Step 4: Budget */}
          {step === 4 && (
            <div className="grid grid-cols-2 gap-3">
              {budgetOptions.map(o => (
                <button key={o.value} onClick={() => { setBudget(o.value); setStep(5) }}
                  className={`p-5 rounded-xl border transition-all text-center hover:scale-[1.03] ${
                    budget === o.value ? 'border-blue-500/50 bg-blue-500/10' : 'border-white/10 hover:border-white/20 hover:bg-white/5'
                  }`}>
                  <p className="text-2xl font-bold text-white">{o.label}</p>
                  <p className="text-xs text-gray-400 mt-1">{o.desc}</p>
                </button>
              ))}
            </div>
          )}

          {/* Step 5: Coin */}
          {step === 5 && (
            <div className="space-y-3">
              {coinOptions.map(o => (
                <button key={o.value} onClick={() => { setCoin(o.value); setStep(6) }}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all text-left hover:scale-[1.02] ${
                    coin === o.value ? 'border-blue-500/50 bg-blue-500/10' : 'border-white/10 hover:border-white/20 hover:bg-white/5'
                  }`}>
                  <span className="text-3xl" style={{ color: o.color }}>{o.emoji}</span>
                  <div>
                    <p className="font-bold text-white">{o.label}</p>
                    <p className="text-sm text-gray-400">{o.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Step 6: Summary */}
          {step === 6 && (
            <div className="space-y-6">
              <div className="bg-white/5 rounded-xl p-5 space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">Strategy</span>
                  <span className="text-white font-medium">DCA (Dollar Cost Average)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Coin</span>
                  <span className="text-white font-medium">{coinOptions.find(c => c.value === coin)?.label}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Personality</span>
                  <span className="text-white font-medium">{riskOptions.find(r => r.value === risk)?.emoji} {riskOptions.find(r => r.value === risk)?.personality}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Budget</span>
                  <span className="text-white font-medium">${budget}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Mode</span>
                  <span className="text-yellow-400 font-medium">📝 Paper Trading</span>
                </div>
              </div>

              <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 text-center">
                <p className="text-green-400 font-medium">No real money at risk!</p>
                <p className="text-gray-400 text-sm">Your bot will trade with virtual $100K using real market prices.</p>
              </div>

              <button onClick={handleFinish} disabled={creating}
                className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 py-4 rounded-xl font-bold text-lg shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition">
                {creating ? 'Creating your bot...' : 'Launch My Bot! 🚀'}
              </button>
            </div>
          )}

          {/* Back button */}
          {step > 0 && step < 6 && (
            <button onClick={() => setStep(s => s - 1)} className="mt-4 text-gray-500 hover:text-white text-sm transition">
              ← Back
            </button>
          )}
        </div>

        {/* Skip */}
        <div className="text-center mt-4">
          <button onClick={onComplete} className="text-gray-600 hover:text-gray-400 text-sm transition">
            Skip setup — I'll configure it myself
          </button>
        </div>
      </div>
    </div>
  )
}
