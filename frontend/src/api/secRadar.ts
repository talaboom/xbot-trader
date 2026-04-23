import client from './client'

export interface WatchlistItem {
  id: string
  ticker: string
  cik: string
  company_name: string | null
  created_at: string
}

export type Severity = 'low' | 'medium' | 'high' | 'critical'

export interface RiskSignalSummary {
  id: string
  ticker: string
  signal_type: 'added' | 'expanded' | 'removed'
  severity: Severity
  novelty: string | null
  summary: string
  filing_id: string
  created_at: string
}

export interface RiskSignalDetail extends RiskSignalSummary {
  detail: string
  diff_excerpt: string
  prior_filing_id: string | null
  filing_form_type: string | null
  filing_filed_at: string | null
  filing_primary_doc_url: string | null
}

export interface PaperPosition {
  id: string
  ticker: string
  side: 'short' | 'long'
  qty: number
  opened_at: string
  entry_price: string
  close_at: string | null
  exit_price: string | null
  pnl: string | null
  pnl_pct: string | null
  status: 'open' | 'closed'
  signal_id: string | null
}

export const listWatchlist = () => client.get<WatchlistItem[]>('/sec-radar/watchlist')
export const addToWatchlist = (ticker: string) =>
  client.post<WatchlistItem>('/sec-radar/watchlist', { ticker })
export const removeFromWatchlist = (id: string) =>
  client.delete(`/sec-radar/watchlist/${id}`)

export const listSignals = (params?: { since?: string; severity?: Severity; limit?: number }) =>
  client.get<RiskSignalSummary[]>('/sec-radar/signals', { params })
export const getSignal = (id: string) =>
  client.get<RiskSignalDetail>(`/sec-radar/signals/${id}`)

export const listPositions = (status?: 'open' | 'closed') =>
  client.get<PaperPosition[]>('/sec-radar/positions', { params: status ? { status } : undefined })
