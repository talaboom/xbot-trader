import client from './client'

export const getTrades = (params?: any) => client.get('/trades', { params })
