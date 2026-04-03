import client from './client'

export const storeKeys = (api_key: string, api_secret: string, label?: string) =>
  client.post('/exchange/keys', { api_key, api_secret, label })

export const getKeys = () => client.get('/exchange/keys')
export const deleteKey = (id: string) => client.delete(`/exchange/keys/${id}`)
export const verifyKeys = () => client.post('/exchange/keys/verify')
