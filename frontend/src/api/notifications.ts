import client from './client';

export async function getNotifications(limit = 20) {
  const resp = await client.get(`/notifications?limit=${limit}`);
  return resp.data;
}

export async function markRead(id: string) {
  const resp = await client.post(`/notifications/${id}/read`);
  return resp.data;
}

export async function markAllRead() {
  const resp = await client.post('/notifications/read-all');
  return resp.data;
}
