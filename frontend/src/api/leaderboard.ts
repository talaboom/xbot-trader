import client from './client';

export async function getLeaderboard(timeframe = '30d', limit = 20) {
  const resp = await client.get(`/leaderboard?timeframe=${timeframe}&limit=${limit}`);
  return resp.data;
}

export async function copyStrategy(strategyId: string) {
  const resp = await client.post(`/copy/${strategyId}`);
  return resp.data;
}
