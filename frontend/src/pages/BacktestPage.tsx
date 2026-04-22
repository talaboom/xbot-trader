import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  createBacktest,
  getCatalog,
  getQuota,
  listBacktests,
  deleteBacktest,
  BacktestCatalog,
  BacktestQuota,
  BacktestRun,
} from '../api/backtest'

const PERIOD_LABELS: Record<number, string> = {
  30: '30 days',
  90: '90 days',
  180: '6 months',
  365: '1 year',
  730: '2 years',
  1825: '5 years',
}

const PERSONALITIES = [
  { id: 'conservative', label: '🛡️ Conservative' },
  { id: 'moderate', label: '🧠 Moderate' },
  { id: 'aggressive', label: '🐺 Aggressive' },
  { id: 'degen', label: '🚀 Degen' },
] as const

export default function BacktestPage() {
  const navigate = useNavigate()
  const [catalog, setCatalog] = useState<BacktestCatalog | null>(null)
  const [quota, setQuota] = useState<BacktestQuota | null>(null)
  const [runs, setRuns] = useState<BacktestRun[]>([])
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const [form, setForm] = useState({
    name: '',
    product_id: 'BTC-USD',
    strategy_type: 'dca' as 'dca' | 'grid',
    personality: 'moderate' as 'conservative' | 'moderate' | 'aggressive' | 'degen',
    period_days: 90,
    starting_capital: 10000,
    reference_price: 60000,
    lower_price: 50000,
    upper_price: 70000,
    num_grids: 10,
  })

  const load = async () => {
    const [c, q, r] = await Promise.all([getCatalog(), getQuota(), listBacktests()])
    setCatalog(c.data)
    setQuota(q.data)
    setRuns(r.data)
  }

  useEffect(() => {
    load().catch(() => {})
    const interval = setInterval(() => {
      listBacktests().then(r => setRuns(r.data)).catch(() => {})
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  const handleRun = async () => {
    setErr(null)
    setBusy(true)
    try {
      const config: Record<string, any> =
        form.strategy_type === 'dca'
          ? { reference_price: form.reference_price }
          : {
              reference_price: form.reference_price,
              lower_price: form.lower_price,
              upper_price: form.upper_price,
              num_grids: form.num_grids,
            }

      const res = await createBacktest({
        name: form.name || `${form.strategy_type.toUpperCase()} ${form.product_id} ${form.period_days}d`,
        product_id: form.product_id,
        strategy_type: form.strategy_type,
        personality: form.personality,
        config,
        period_days: form.period_days,
        starting_capital: form.starting_capital,
      })
      navigate(`/backtest/${res.data.id}`)
    } catch (e: any) {
      setErr(e?.response?.data?.detail || 'Failed to start backtest')
    } finally {
      setBusy(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this backtest?')) return
    await deleteBacktest(id)
    load()
  }

  const periods = catalog?.periods ?? [30, 90, 365]
  const products = catalog?.products ?? ['BTC-USD', 'ETH-USD']

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Backtest Lab</h1>
          <p className="text-sm text-white/60 mt-1">Replay your bot against real historical data before risking a dollar.</p>
        </div>
        {quota && (
          <div className="text-right text-sm">
            <div className="text-white/60">Plan: <span className="text-white font-semibold capitalize">{quota.tier}</span></div>
            <div className="text-white/60">
              {quota.monthly_limit === null
                ? 'Unlimited runs'
                : `${quota.used_this_month}/${quota.monthly_limit} this month`}
            </div>
            <div className="text-white/40 text-xs">Max history: {PERIOD_LABELS[quota.max_period_days] || `${quota.max_period_days}d`}</div>
          </div>
        )}
      </div>

      <div className="bg-[#111127] border border-white/10 rounded-2xl p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-white mb-4">New Backtest</h2>

        {err && <div className="bg-red-500/10 border border-red-500/30 text-red-300 rounded-lg px-4 py-2 mb-4 text-sm">{err}</div>}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Name">
            <input
              className="input"
              placeholder="My DCA backtest"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
            />
          </Field>

          <Field label="Strategy">
            <select className="input" value={form.strategy_type} onChange={e => setForm({ ...form, strategy_type: e.target.value as any })}>
              <option value="dca">DCA</option>
              <option value="grid">Grid</option>
            </select>
          </Field>

          <Field label="Coin">
            <select className="input" value={form.product_id} onChange={e => setForm({ ...form, product_id: e.target.value })}>
              {products.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </Field>

          <Field label="Personality">
            <select className="input" value={form.personality} onChange={e => setForm({ ...form, personality: e.target.value as any })}>
              {PERSONALITIES.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
            </select>
          </Field>

          <Field label="Period">
            <select
              className="input"
              value={form.period_days}
              onChange={e => setForm({ ...form, period_days: parseInt(e.target.value) })}
            >
              {periods.map(p => {
                const disabled = quota ? p > quota.max_period_days : false
                return <option key={p} value={p} disabled={disabled}>{PERIOD_LABELS[p] || `${p}d`}{disabled ? ' (upgrade)' : ''}</option>
              })}
            </select>
          </Field>

          <Field label="Starting capital (USD)">
            <input
              type="number"
              className="input"
              value={form.starting_capital}
              onChange={e => setForm({ ...form, starting_capital: parseFloat(e.target.value) })}
            />
          </Field>

          {form.strategy_type === 'grid' && (
            <>
              <Field label="Lower price">
                <input type="number" className="input" value={form.lower_price} onChange={e => setForm({ ...form, lower_price: parseFloat(e.target.value) })} />
              </Field>
              <Field label="Upper price">
                <input type="number" className="input" value={form.upper_price} onChange={e => setForm({ ...form, upper_price: parseFloat(e.target.value) })} />
              </Field>
              <Field label="Grid levels">
                <input type="number" className="input" value={form.num_grids} onChange={e => setForm({ ...form, num_grids: parseInt(e.target.value) })} />
              </Field>
            </>
          )}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={handleRun}
            disabled={busy}
            className="bg-gradient-to-r from-green-600 to-emerald-500 px-6 py-2.5 rounded-xl font-semibold shadow-lg shadow-green-500/25 hover:shadow-green-500/40 transition text-sm disabled:opacity-60"
          >
            {busy ? 'Starting...' : 'Run Backtest'}
          </button>
        </div>
      </div>

      <div className="bg-[#111127] border border-white/10 rounded-2xl p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-white mb-4">Recent Runs</h2>
        {runs.length === 0 ? (
          <p className="text-sm text-white/50">No backtests yet. Run one above.</p>
        ) : (
          <div className="divide-y divide-white/10">
            {runs.map(r => (
              <div key={r.id} className="py-3 flex items-center justify-between text-sm">
                <div className="flex-1 min-w-0">
                  <div className="text-white font-medium truncate">{r.name}</div>
                  <div className="text-white/50 text-xs">
                    {r.strategy_type.toUpperCase()} · {r.product_id} · {r.period_days}d · {r.personality || '—'}
                  </div>
                </div>
                <div className="w-28 text-right">
                  <StatusBadge status={r.status} />
                </div>
                <div className="w-28 text-right">
                  {r.pnl_pct !== null ? (
                    <span className={Number(r.pnl_pct) >= 0 ? 'text-green-400 font-semibold' : 'text-red-400 font-semibold'}>
                      {Number(r.pnl_pct) >= 0 ? '+' : ''}{Number(r.pnl_pct).toFixed(2)}%
                    </span>
                  ) : (
                    <span className="text-white/40">—</span>
                  )}
                </div>
                <div className="w-40 flex justify-end gap-2">
                  <button onClick={() => navigate(`/backtest/${r.id}`)} className="text-blue-400 hover:text-blue-300 text-xs">View</button>
                  <button onClick={() => handleDelete(r.id)} className="text-red-400 hover:text-red-300 text-xs">Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        .input {
          width: 100%;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          color: white;
          padding: 0.55rem 0.75rem;
          border-radius: 0.5rem;
          font-size: 0.875rem;
        }
        .input:focus { outline: none; border-color: rgba(59,130,246,0.6); }
      `}</style>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs text-white/60 mb-1.5">{label}</span>
      {children}
    </label>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: 'bg-yellow-500/15 text-yellow-400',
    running: 'bg-blue-500/15 text-blue-400',
    completed: 'bg-green-500/15 text-green-400',
    failed: 'bg-red-500/15 text-red-400',
  }
  return <span className={`px-2 py-0.5 rounded text-xs font-medium ${map[status] || 'bg-white/10 text-white/60'}`}>{status}</span>
}
