import client from './client'

export const register = (email: string, username: string, password: string, referral_code?: string) =>
  client.post('/auth/register', { email, username, password, referral_code })

export const verifyEmail = (email: string, code: string) =>
  client.post('/auth/verify-email', { email, code })

export const resendCode = (email: string) =>
  client.post('/auth/resend-code', { email })

export const login = (email: string, password: string) =>
  client.post('/auth/login', { email, password })

export const getMe = () => client.get('/auth/me')

export const loginWithFacebook = (accessToken: string) =>
  client.post('/auth/facebook', { access_token: accessToken })
