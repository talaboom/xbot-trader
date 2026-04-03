import { useEffect, useState } from 'react'
import { getStrategies, createStrategy, startStrategy, stopStrategy, deleteStrategy } from '../api/strategies'

const strategyTemplates = [
  { type: 'dca', name: 'DCA Bot', icon: '🤖', desc: 'Dollar-cost average into crypto on a schedule', gradient: 'from-blue-500 to-cyan-400' },
  { type: 'grid', name: 'Grid Bot', icon: '📊', desc: 'Buy low, sell high in a price range', gradient: 'from-purple-500 to-pink-400' },
]

const products = ['BTC-USD', 'ETH-USD', 'SOL-USD', 'DOGE-USD', 'ADA-USD', 'XRP-USD', 'AVAX-USD', 'LINK-USD']

export default function StrategiesPage() {
  const [strategies, setStrategies] = useState<any[]>([])
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ type: 'dca', name: '', product: 'BTC-USD', amount: '50', interval: '4', lowerPrice: '50000', upperPrice: '70000', grids: '10', totalInvestment: '1000', stopLoss: '15', takeProfit: '50' })
  const [loading, setLoading] = useState(false)

  const load = () => getStrategies().then(r => setStrategies(r.data)).catch(() => {})
  useEffect(() => { load() }, [])

  const handleCreate = async () => {
    setLoading(true)
    const config = form.type === 'dca'
      ? { investment_amount: parseFloat(form.amount), interval_hours: parseInt(form.interval), stop_loss_pct: parseFloat(form.stopLoss), take_profit_pct: parseFloat(form.takeProfit), max_total_investment: 5000 }
      : { lower_price: parseFloat(form.lowerPrice), upper_price: parseFloat(form.upperPrice), num_grids: parseInt(form.grids), total_investment: parseFloat(form.totalInvestment), stop_loss_pct: parseFloat(form.stopLoss) }
    await createStrategy({ name: form.name || `${form.type.toUpperCase()} ${form.product}`, strategy_type: form.type, product_id: form.product, config, is_paper_mode: true })
    setShowCreate(false)
    setLoading(false)
    load()
  }

  const handleStart = async (id: string) => { await startStrategy(id); load() }
  const handleStop = async (id: string) => { await stopStrategy(id); load() }
  const handleDelete = async (id: string) => { if (confirm('Delete this strategy?')) { await deleteStrategy(id); load() } }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Trading Bots</h1>
        <button onClick={() => setShowCreate(true)} className="bg-gradient-to-r from-blue-600 to-cyan-500 px-5 py-2.5 rounded-xl font-semibold shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition text-sm">
          + Create Bot
        </button>
      </div>

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowCreate(false)}>
          <div className="bg-[#111127] border border-white/10 rounded-2xl p-8 w-full max-w-lg shadow-2xl" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-white mb-6">Create Trading Bot</h2>

            {/* Strategy type */}
            <div className="grid grid-cols-2 gap-3 mb-5">
              {strategyTemplates.map(t => (
                <button key={t.type} onClick={() => setForm(f => ({ ...f, type: t.type }))}
                  className={`p-4 rounded-xl border text-left transition ${form.type === t.type ? 'border-blue-500/50 bg-blue-500/10' : 'border-white/10 hover:border-white/20'}`}>
                  <span className="text-2xl">{t.icon}</span>
                  <p className="font-bold text-white mt-2">{t.name}</p>
                  <p className="text-xs text-gray-400">{t.desc}</p>
                </button>
              ))}
            </div>

            {/* Product */}
            <div className="mb-4">
              <label className="text-sm text-gray-400 mb-1 block">Trading Pair</label>
              <select value={form.product} onChange={e => setForm(f => ({ ...f, product: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500/50 focus:outline-none">
                {products.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>

            {/* Name */}
            <div className="mb-4">
              <label className="text-sm text-gray-400 mb-1 block">Bot Name</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder={`My ${form.type.toUpperCase()} Bot`}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500/50 focus:outline-none placeholder-gray-600" />
            </div>

            {/* DCA config */}
            {form.type === 'dca' && (
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">Buy Amount ($)</label>
                  <input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500/50 focus:outline-none" />
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">Every X Hours</label>
                  <input type="number" value={form.interval} onChange={e => setForm(f => ({ ...f, interval: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500/50 focus:outline-none" />
                </div>
              </div>
            )}

            {/* Grid config */}
            {form.type === 'grid' && (
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">Lower Price ($)</label>
                  <input type="number" value={form.lowerPrice} onChange={e => setForm(f => ({ ...f, lowerPrice: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500/50 focus:outline-none" />
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">Upper Price ($)</label>
                  <input type="number" value={form.upperPrice} onChange={e => setForm(f => ({ ...f, upperPrice: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500/50 focus:outline-none" />
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">Grid Lines</label>
                  <input type="number" value={form.grids} onChange={e => setForm(f => ({ ...f, grids: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500/50 focus:outline-none" />
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">Total Investment ($)</label>
                  <input type="number" value={form.totalInvestment} onChange={e => setForm(f => ({ ...f, totalInvestment: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500/50 focus:outline-none" />
                </div>
              </div>
            )}

            {/* Risk */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Stop Loss (%)</label>
                <input type="number" value={form.stopLoss} onChange={e => setForm(f => ({ ...f, stopLoss: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500/50 focus:outline-none" />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Take Profit (%)</label>
                <input type="number" value={form.takeProfit} onChange={e => setForm(f => ({ ...f, takeProfit: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500/50 focus:outline-none" />
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setShowCreate(false)} className="flex-1 py-3 rounded-xl border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 transition">Cancel</button>
              <button onClick={handleCreate} disabled={loading}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 font-semibold shadow-lg shadow-blue-500/25 transition">
                {loading ? 'Creating...' : 'Create Bot'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Strategy list */}
      {strategies.length === 0 ? (
        <div className="bg-[#111127] border border-dashed border-white/10 rounded-2xl p-16 text-center">
          <span className="text-6xl mb-4 block">🤖</span>
          <h3 className="text-2xl font-bold text-white mb-2">No bots yet</h3>
          <p className="text-gray-400 mb-6">Create your first trading bot and start earning.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {strategies.map((s: any) => (
            <div key={s.id} className="bg-[#111127] border border-white/5 rounded-2xl p-6 hover:border-white/10 transition">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${s.strategy_type === 'dca' ? 'from-blue-500 to-cyan-400' : 'from-purple-500 to-pink-400'} flex items-center justify-center text-xl`}>
                    {s.strategy_type === 'dca' ? '🤖' : '📊'}
                  </div>
                  <div>
                    <h3 className="font-bold text-white">{s.name}</h3>
                    <p className="text-xs text-gray-500">{s.product_id} &middot; {s.strategy_type.toUpperCase()} &middot; {s.is_paper_mode ? 'Paper' : 'Live'}</p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  s.status === 'running' ? 'bg-green-500/20 text-green-400' :
                  s.status === 'error' ? 'bg-red-500/20 text-red-400' :
                  'bg-gray-500/20 text-gray-400'
                }`}>
                  {s.status === 'running' && <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-400 mr-1 animate-pulse" />}
                  {s.status.toUpperCase()}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="bg-white/5 rounded-lg p-3 text-center">
                  <p className="text-lg font-bold text-white">${Number(s.total_invested).toFixed(2)}</p>
                  <p className="text-xs text-gray-500">Invested</p>
                </div>
                <div className="bg-white/5 rounded-lg p-3 text-center">
                  <p className="text-lg font-bold text-white">${Number(s.total_value).toFixed(2)}</p>
                  <p className="text-xs text-gray-500">Value</p>
                </div>
                <div className="bg-white/5 rounded-lg p-3 text-center">
                  <p className={`text-lg font-bold ${Number(s.pnl) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    ${Number(s.pnl).toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-500">P&L</p>
                </div>
              </div>

              <div className="flex gap-2">
                {s.status === 'running' ? (
                  <button onClick={() => handleStop(s.id)} className="flex-1 py-2 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 text-sm font-medium transition">Stop</button>
                ) : (
                  <button onClick={() => handleStart(s.id)} className="flex-1 py-2 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 hover:bg-green-500/20 text-sm font-medium transition">Start</button>
                )}
                <button onClick={() => handleDelete(s.id)} className="px-4 py-2 rounded-lg border border-white/10 text-gray-400 hover:text-red-400 hover:border-red-500/30 text-sm transition">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
