import client from './client'

export const getPortfolio = () => client.get('/dashboard')
export const getPrices = () => client.get('/dashboard/prices')
export const getProducts = () => client.get('/dashboard/products')
export const getMarketStats = () => client.get('/dashboard/market-stats')
export const getPortfolioHistory = () => client.get('/dashboard/portfolio-history')
export const getHoldings = () => client.get('/dashboard/holdings')
export const getLeaderboard = (timeframe = '30d', risk = 'all') =>
  client.get(`/leaderboard?timeframe=${timeframe}&risk=${risk}`)
