import { useEffect, useState, useCallback } from 'react'
import {
  listWatchlist,
  listSignals,
  listPositions,
  addToWatchlist,
  removeFromWatchlist,
  getSignal,
  WatchlistItem,
  RiskSignalSummary,
  RiskSignalDetail,
  PaperPosition,
  Severity,
} from '../api/secRadar'
import { useToast } from '../components/Toast'

const severityColor: Record<Severity, string> = {
  critical: 'text-red-400 border-red-500/40 bg-red-500/10',
  high: 'text-orange-400 border-orange-500/40 bg-orange-500/10',
  medium: 'text-yellow-400 border-yellow-500/40 bg-yellow-500/10',
  low: 'text-gray-400 border-white/10 bg-white/5',
}

const severityLabel: Record<Severity, string> = {
  critical: '🔴 CRITICAL',
  high: '🟠 HIGH',
  medium: '🟡 MEDIUM',
  low: '⚪ LOW',
}

export default function SECRadarPage() {
  const { toast } = useToast()
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([])
  const [signals, setSignals] = useState<RiskSignalSummary[]>([])
  const [positions, setPositions] = useState<PaperPosition[]>([])
  const [loading, setLoading] = useState(true)
  const [newTicker, setNewTicker] = useState('')
  const [adding, setAdding] = useState(false)
  const [selected, setSelected] = useState<RiskSignalDetail | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [w, s, p] = await Promise.all([listWatchlist(), listSignals({ limit: 50 }), listPositions()])
      setWatchlist(w.data)
      setSignals(s.data)
      setPositions(p.data)
    } catch (e: any) {
      toast({ type: 'error', title: 'Failed to load SEC Radar', message: e?.response?.data?.detail ?? String(e) })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => { load() }, [load])

  const handleAdd = async () => {
    const t = newTicker.trim().toUpperCase()
    if (!t) return
    setAdding(true)
    try {
      await addToWatchlist(t)
      setNewTicker('')
      toast({ type: 'success', title: `${t} added`, message: 'We’ll scan new filings every 30 minutes.' })
      load()
    } catch (e: any) {
      toast({ type: 'error', title: 'Could not add ticker', message: e?.response?.data?.detail ?? String(e) })
    } finally {
      setAdding(false)
    }
  }

  const handleRemove = async (id: string, ticker: string) => {
    try {
      await removeFromWatchlist(id)
      toast({ type: 'info', title: `${ticker} removed` })
      load()
    } catch (e: any) {
      toast({ type: 'error', title: 'Could not remove', message: e?.response?.data?.detail ?? String(e) })
    }
  }

  const handleOpenSignal = async (id: string) => {
    setLoadingDetail(true)
    try {
      const res = await getSignal(id)
      setSelected(res.data)
    } catch (e: any) {
      toast({ type: 'error', title: 'Could not load signal', message: e?.response?.data?.detail ?? String(e) })
    } finally {
      setLoadingDetail(false)
    }
  }

  const openPnl = positions.filter(p => p.status === 'closed').reduce((acc, p) => acc + Number(p.pnl ?? 0), 0)
  const closedCount = positions.filter(p => p.status === 'closed').length
  const winCount = positions.filter(p => p.status === 'closed' && Number(p.pnl ?? 0) > 0).length

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto flex items-center justify-center h-96">
        <div className="text-gray-400 text-lg">Loading SEC Radar...</div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">🛰️ SEC Radar</h1>
        <p className="text-gray-400 text-sm">
          AI reads every new 10-K/10-Q Risk Factors section and flags material language changes. Quiet signals retail never sees.
        </p>
      </div>

      <div className="grid md:grid-cols-[1fr,1.5fr] gap-6">
        {/* Left: watchlist + P&L */}
        <div className="space-y-4">
          <div className="bg-[#0d0d20] border border-white/5 rounded-2xl p-5">
            <h2 className="text-lg font-bold text-white mb-3">Watchlist</h2>
            <div className="flex gap-2 mb-3">
              <input
                value={newTicker}
                onChange={e => setNewTicker(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleAdd() }}
                placeholder="Add ticker (e.g. NVDA)"
                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:border-blue-500/50 focus:outline-none placeholder-gray-600"
              />
              <button
                onClick={handleAdd}
                disabled={adding || !newTicker.trim()}
                className="bg-blue-500/20 border border-blue-500/40 text-blue-300 px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-500/30 disabled:opacity-50 transition"
              >
                {adding ? 'Adding...' : 'Add'}
              </button>
            </div>
            {watchlist.length === 0 ? (
              <p className="text-gray-500 text-sm">No tickers yet. Add one above.</p>
            ) : (
              <ul className="space-y-2">
                {watchlist.map(w => (
                  <li key={w.id} className="flex items-center justify-between bg-white/5 rounded-lg px-3 py-2">
                    <div>
                      <p className="text-white font-medium">{w.ticker}</p>
                      {w.company_name && <p className="text-xs text-gray-500 truncate max-w-[200px]">{w.company_name}</p>}
                    </div>
                    <button
                      onClick={() => handleRemove(w.id, w.ticker)}
                      className="text-gray-500 hover:text-red-400 text-xs transition"
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="bg-[#0d0d20] border border-white/5 rounded-2xl p-5">
            <h2 className="text-lg font-bold text-white mb-2">Paper P&L</h2>
            <p className={`text-3xl font-bold ${openPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {openPnl >= 0 ? '+' : ''}${openPnl.toFixed(2)}
            </p>
            <p className="text-gray-500 text-sm mt-1">
              {closedCount === 0 ? 'No closed positions yet' : `${winCount} win${winCount === 1 ? '' : 's'} / ${closedCount - winCount} loss${closedCount - winCount === 1 ? '' : 'es'}`}
            </p>
            {positions.length > 0 && (
              <ul className="mt-3 space-y-1 text-xs">
                {positions.slice(0, 5).map(p => (
                  <li key={p.id} className="flex justify-between text-gray-400">
                    <span>{p.ticker} {p.side} × {p.qty}</span>
                    <span className={Number(p.pnl ?? 0) >= 0 ? 'text-green-400' : 'text-red-400'}>
                      {p.status === 'open' ? 'open' : `$${Number(p.pnl ?? 0).toFixed(2)}`}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Right: signals feed */}
        <div className="bg-[#0d0d20] border border-white/5 rounded-2xl p-5">
          <h2 className="text-lg font-bold text-white mb-3">Recent signals</h2>
          {signals.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-3">🛰️</div>
              <p className="text-gray-400">No signals yet.</p>
              <p className="text-gray-500 text-xs mt-1">
                {watchlist.length === 0
                  ? 'Add a ticker to start watching for filing deltas.'
                  : 'We’ll show material Risk Factors changes as new filings arrive.'}
              </p>
            </div>
          ) : (
            <ul className="space-y-2">
              {signals.map(sig => (
                <li key={sig.id}>
                  <button
                    onClick={() => handleOpenSignal(sig.id)}
                    className={`w-full text-left rounded-lg px-4 py-3 border transition hover:brightness-110 ${severityColor[sig.severity]}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold tracking-wider">{severityLabel[sig.severity]}</span>
                      <span className="text-xs text-gray-500">
                        {new Date(sig.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-white font-medium mt-1">
                      <span className="text-blue-300">{sig.ticker}</span> — {sig.summary}
                    </p>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider mt-1">
                      {sig.signal_type}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Signal detail modal */}
      {selected && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="bg-[#0d0d20] border border-white/10 rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <span className={`text-xs font-bold px-2 py-0.5 rounded ${severityColor[selected.severity]}`}>
                  {severityLabel[selected.severity]}
                </span>
                <h3 className="text-xl font-bold text-white mt-2">
                  <span className="text-blue-300">{selected.ticker}</span> — {selected.summary}
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  {selected.filing_form_type ?? ''}{selected.filing_filed_at ? ` filed ${new Date(selected.filing_filed_at).toLocaleDateString()}` : ''}
                </p>
              </div>
              <button onClick={() => setSelected(null)} className="text-gray-500 hover:text-white text-xl">✕</button>
            </div>
            <div className="space-y-4">
              <p className="text-sm text-gray-300 whitespace-pre-line">{selected.detail}</p>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Excerpt</p>
                <blockquote className="text-sm text-gray-300 italic border-l-2 border-blue-500/40 pl-3 bg-white/5 rounded-r-lg py-2 pr-3">
                  {selected.diff_excerpt}
                </blockquote>
              </div>
              {selected.filing_primary_doc_url && (
                <a
                  href={selected.filing_primary_doc_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block text-sm text-blue-400 hover:text-blue-300"
                >
                  View full filing on SEC.gov ↗
                </a>
              )}
            </div>
          </div>
        </div>
      )}
      {loadingDetail && !selected && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <div className="text-gray-400 text-sm">Loading...</div>
        </div>
      )}
    </div>
  )
}
