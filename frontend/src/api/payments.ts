import client from './client'

export async function createCheckoutSession(plan: string) {
  return client.post('/payments/stripe/checkout', { plan })
}

export async function createPortalSession() {
  return client.post('/payments/stripe/portal')
}

export async function getPaymentStatus() {
  return client.get('/payments/status')
}
