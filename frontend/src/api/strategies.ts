import client from './client'

export const getStrategies = () => client.get('/strategies')
export const createStrategy = (data: any) => client.post('/strategies', data)
export const startStrategy = (id: string) => client.post(`/strategies/${id}/start`)
export const stopStrategy = (id: string) => client.post(`/strategies/${id}/stop`)
export const deleteStrategy = (id: string) => client.delete(`/strategies/${id}`)
