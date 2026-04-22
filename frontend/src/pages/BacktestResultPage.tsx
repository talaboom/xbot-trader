import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getBacktest, BacktestRun } from '../api/backtest'

export default function BacktestResultPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [run, setRun] = useState<BacktestRun | null>(null)

  useEffect(() => {
    if (!id) return
    const fetchRun = () => getBacktest(id).then(r => setRun(r.data)).catch(() => {})
    fetchRun()
    const interval = setInterval(() => {
      if (run && (run.status === 'completed' || run.status === 'failed')) return
      fetchRun()
    }, 3000)
    return () => clearInterval(interval)
  }, [id, run?.status])

  if (!run) {
    return <div className="max-w-5xl mx-auto text-white/60 text-sm">Loading...</div>
  }

  const pnlPct = run.pnl_pct !== null ? Number(run.pnl_pct) : null
  const isProfit = pnlPct !== null && pnlPct >= 0

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <button onClick={() => navigate('/backtest')} className="text-blue-400 hover:text-blue-300 text-sm">← Back to Backtest Lab</button>

      <div className="bg-[#111127] border border-white/10 rounded-2xl p-6 shadow-xl">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">{run.name}</h1>
            <p className="text-sm text-white/50 mt-1">
              {run.strategy_type.toUpperCase()} · {run.product_id} · {run.period_days}d · {run.personality || '—'}
            </p>
          </div>
          <StatusBadge status={run.status} />
        </div>

        {run.status === 'running' || run.status === 'pending' ? (
          <div className="mt-8 text-center py-12 text-white/60">
            <div className="animate-pulse text-lg mb-2">⚙️ Running simulation...</div>
            <p className="text-xs">Fetching {run.period_days} days of history and replaying the strategy.</p>
          </div>
        ) : run.status === 'failed' ? (
          <div className="mt-6 bg-red-500/10 border border-red-500/30 text-red-300 rounded-lg px-4 py-3 text-sm">
            <strong>Failed:</strong> {run.error_message || 'Unknown error'}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <Stat label="P&L" value={run.pnl !== null ? `$${Number(run.pnl).toFixed(2)}` : '—'} tone={isProfit ? 'green' : 'red'} />
              <Stat label="Return" value={pnlPct !== null ? `${pnlPct >= 0 ? '+' : ''}${pnlPct.toFixed(2)}%` : '—'} tone={isProfit ? 'green' : 'red'} big />
              <Stat label="Max Drawdown" value={run.max_drawdown_pct !== null ? `${Number(run.max_drawdown_pct).toFixed(2)}%` : '—'} tone="red" />
              <Stat label="Win Rate" value={run.win_rate_pct !== null ? `${Number(run.win_rate_pct).toFixed(1)}%` : '—'} />
              <Stat label="Sharpe" value={run.sharpe_ratio !== null ? Number(run.sharpe_ratio).toFixed(2) : '—'} />
              <Stat label="Total Trades" value={run.total_trades?.toString() ?? '—'} />
              <Stat label="Starting" value={`$${Number(run.starting_capital).toFixed(2)}`} />
              <Stat label="Ending" value={run.ending_capital !== null ? `$${Number(run.ending_capital).toFixed(2)}` : '—'} />
            </div>

            {run.equity_curve && run.equity_curve.length > 0 && (
              <div className="mt-8">
                <h3 className="text-sm font-semibold text-white/80 mb-3">Equity Curve</h3>
                <EquityChart points={run.equity_curve} startingCapital={Number(run.starting_capital)} />
              </div>
            )}

            {run.trades_log && run.trades_log.length > 0 && (
              <div className="mt-8">
                <h3 className="text-sm font-semibold text-white/80 mb-3">Trades ({run.trades_log.length})</h3>
                <div className="max-h-72 overflow-y-auto border border-white/10 rounded-lg">
                  <table className="w-full text-xs">
                    <thead className="bg-white/5 text-white/60 sticky top-0">
                      <tr>
                        <th className="text-left p-2">Time</th>
                        <th className="text-left p-2">Side</th>
                        <th className="text-right p-2">Price</th>
                        <th className="text-right p-2">Qty</th>
                        <th className="text-right p-2">Value</th>
                        <th className="text-left p-2">Reason</th>
                        <th className="text-right p-2">P&L</th>
                      </tr>
                    </thead>
                    <tbody>
                      {run.trades_log.slice(0, 200).map((t, i) => (
                        <tr key={i} className="border-t border-white/5">
                          <td className="p-2 text-white/70">{new Date(t.ts).toLocaleDateString()}</td>
                          <td className={`p-2 font-medium ${t.side === 'buy' ? 'text-green-400' : 'text-red-400'}`}>{t.side}</td>
                          <td className="p-2 text-right text-white/80">${Number(t.price).toFixed(2)}</td>
                          <td className="p-2 text-right text-white/80">{Number(t.qty).toFixed(6)}</td>
                          <td className="p-2 text-right text-white/80">${Number(t.value).toFixed(2)}</td>
                          <td className="p-2 text-white/50">{t.reason}</td>
                          <td className={`p-2 text-right ${t.pnl !== undefined ? (t.pnl >= 0 ? 'text-green-400' : 'text-red-400') : 'text-white/40'}`}>
                            {t.pnl !== undefined ? `$${Number(t.pnl).toFixed(2)}` : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function Stat({ label, value, tone, big }: { label: string; value: string; tone?: 'green' | 'red'; big?: boolean }) {
  const color = tone === 'green' ? 'text-green-400' : tone === 'red' ? 'text-red-400' : 'text-white'
  return (
    <div className="bg-white/5 border border-white/10 rounded-lg p-4">
      <div className="text-xs text-white/50 mb-1">{label}</div>
      <div className={`${big ? 'text-2xl' : 'text-lg'} font-bold ${color}`}>{value}</div>
    </div>
  )
}

function EquityChart({ points, startingCapital }: { points: { ts: number; equity: number; price: number }[]; startingCapital: number }) {
  if (points.length === 0) return null
  const width = 800
  const height = 200
  const pad = 20

  const equities = points.map(p => p.equity)
  const min = Math.min(...equities, startingCapital)
  const max = Math.max(...equities, startingCapital)
  const range = max - min || 1

  const xStep = (width - 2 * pad) / Math.max(points.length - 1, 1)
  const y = (v: number) => pad + (height - 2 * pad) * (1 - (v - min) / range)

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${pad + i * xStep} ${y(p.equity)}`).join(' ')
  const baselineY = y(startingCapital)

  return (
    <div className="bg-white/5 border border-white/10 rounded-lg p-4">
      <svg width="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
        <line x1={pad} x2={width - pad} y1={baselineY} y2={baselineY} stroke="rgba(255,255,255,0.2)" strokeDasharray="4 4" />
        <path d={pathD} fill="none" stroke="#10b981" strokeWidth="2" />
      </svg>
      <div className="flex justify-between text-xs text-white/50 mt-2">
        <span>{new Date(points[0].ts).toLocaleDateString()}</span>
        <span>Starting: ${startingCapital.toFixed(0)}</span>
        <span>{new Date(points[points.length - 1].ts).toLocaleDateString()}</span>
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: 'bg-yellow-500/15 text-yellow-400',
    running: 'bg-blue-500/15 text-blue-400',
    completed: 'bg-green-500/15 text-green-400',
    failed: 'bg-red-500/15 text-red-400',
  }
  return <span className={`px-3 py-1 rounded-full text-xs font-medium ${map[status] || 'bg-white/10 text-white/60'}`}>{status}</span>
}
