import client from './client';

export async function getSubscriptionStatus() {
  const resp = await client.get('/subscriptions/status');
  return resp.data;
}

export async function createSubscription(data: {
  plan: string;
  payment_method: string;
  tx_hash?: string;
  crypto_currency?: string;
}) {
  const resp = await client.post('/subscriptions', data);
  return resp.data;
}

export async function getPlans() {
  const resp = await client.get('/subscriptions/plans');
  return resp.data;
}
