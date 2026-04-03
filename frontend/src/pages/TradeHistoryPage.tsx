import { useEffect, useState } from 'react'
import { getTrades } from '../api/trades'

export default function TradeHistoryPage() {
  const [trades, setTrades] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)

  useEffect(() => {
    getTrades({ page, limit: 20 }).then(r => {
      setTrades(r.data.trades)
      setTotal(r.data.total)
    }).catch(() => {})
  }, [page])

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-white">Trade History</h1>

      {trades.length === 0 ? (
        <div className="bg-[#111127] border border-dashed border-white/10 rounded-2xl p-16 text-center">
          <span className="text-6xl mb-4 block">📈</span>
          <h3 className="text-2xl font-bold text-white mb-2">No trades yet</h3>
          <p className="text-gray-400">Start a bot to see your trades here.</p>
        </div>
      ) : (
        <>
          <div className="bg-[#111127] border border-white/5 rounded-2xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left text-gray-400 text-xs font-medium px-5 py-3">Date</th>
                  <th className="text-left text-gray-400 text-xs font-medium px-5 py-3">Pair</th>
                  <th className="text-left text-gray-400 text-xs font-medium px-5 py-3">Side</th>
                  <th className="text-left text-gray-400 text-xs font-medium px-5 py-3">Type</th>
                  <th className="text-right text-gray-400 text-xs font-medium px-5 py-3">Price</th>
                  <th className="text-right text-gray-400 text-xs font-medium px-5 py-3">Qty</th>
                  <th className="text-right text-gray-400 text-xs font-medium px-5 py-3">Total</th>
                  <th className="text-center text-gray-400 text-xs font-medium px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {trades.map((t: any) => (
                  <tr key={t.id} className="border-b border-white/5 hover:bg-white/5 transition">
                    <td className="px-5 py-4 text-sm text-gray-300">{new Date(t.created_at).toLocaleString()}</td>
                    <td className="px-5 py-4 text-sm font-medium text-white">{t.product_id}</td>
                    <td className="px-5 py-4">
                      <span className={`text-xs font-bold px-2 py-1 rounded ${t.side === 'buy' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                        {t.side.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-400">{t.order_type}</td>
                    <td className="px-5 py-4 text-sm text-white text-right">${Number(t.price || 0).toFixed(2)}</td>
                    <td className="px-5 py-4 text-sm text-white text-right">{Number(t.quantity || 0).toFixed(6)}</td>
                    <td className="px-5 py-4 text-sm text-white text-right">${Number(t.total_value || 0).toFixed(2)}</td>
                    <td className="px-5 py-4 text-center">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        t.status === 'filled' ? 'bg-green-500/20 text-green-400' :
                        t.status === 'failed' ? 'bg-red-500/20 text-red-400' :
                        'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {t.status}
                      </span>
                      {t.is_paper && <span className="ml-1 text-xs text-yellow-500">📝</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {total > 20 && (
            <div className="flex items-center justify-center gap-4">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-4 py-2 rounded-lg border border-white/10 text-gray-400 disabled:opacity-30 hover:text-white transition">
                Previous
              </button>
              <span className="text-gray-400 text-sm">Page {page}</span>
              <button onClick={() => setPage(p => p + 1)} disabled={trades.length < 20}
                className="px-4 py-2 rounded-lg border border-white/10 text-gray-400 disabled:opacity-30 hover:text-white transition">
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
