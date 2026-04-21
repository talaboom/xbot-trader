import client from './client'

export interface BacktestCreate {
  name: string
  product_id: string
  strategy_type: 'dca' | 'grid'
  personality?: 'conservative' | 'moderate' | 'aggressive' | 'degen'
  config: Record<string, any>
  period_days: number
  starting_capital: number
}

export interface BacktestRun {
  id: string
  name: string
  product_id: string
  strategy_type: string
  personality: string | null
  config: Record<string, any>
  period_days: number
  start_date: string
  end_date: string
  starting_capital: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  error_message: string | null
  ending_capital: string | null
  pnl: string | null
  pnl_pct: string | null
  max_drawdown_pct: string | null
  win_rate_pct: string | null
  sharpe_ratio: string | null
  total_trades: number | null
  created_at: string
  completed_at: string | null
  equity_curve?: { ts: number; equity: number; price: number }[]
  trades_log?: Array<Record<string, any>>
}

export interface BacktestQuota {
  tier: string
  max_period_days: number
  monthly_limit: number | null
  used_this_month: number
  remaining: number | null
}

export interface BacktestCatalog {
  products: string[]
  periods: number[]
  tiers: Record<string, { max_period_days: number; monthly_limit: number | null }>
}

export const getCatalog = () => client.get<BacktestCatalog>('/backtest/catalog')
export const getQuota = () => client.get<BacktestQuota>('/backtest/quota')
export const listBacktests = () => client.get<BacktestRun[]>('/backtest')
export const getBacktest = (id: string) => client.get<BacktestRun>(`/backtest/${id}`)
export const createBacktest = (data: BacktestCreate) =>
  client.post<BacktestRun>('/backtest', data)
export const deleteBacktest = (id: string) => client.delete(`/backtest/${id}`)
