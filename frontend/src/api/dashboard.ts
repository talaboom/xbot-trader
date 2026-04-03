import client from './client'

export const getPortfolio = () => client.get('/dashboard')
export const getPrices = () => client.get('/dashboard/prices')
export const getProducts = () => client.get('/dashboard/products')
