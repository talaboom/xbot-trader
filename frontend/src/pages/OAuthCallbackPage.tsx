import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import client from '../api/client'

export default function OAuthCallbackPage() {
  const [searchParams] = useSearchParams()
  const [error, setError] = useState('')
  const { setTokens } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    const code = searchParams.get('code')
    const provider = searchParams.get('provider')
    const oauthError = searchParams.get('error')

    if (oauthError) {
      setError('Authentication was cancelled or failed. Please try again.')
      return
    }

    if (!code || !provider) {
      setError('Invalid callback. Missing authorization code.')
      return
    }

    const exchangeCode = async () => {
      try {
        const res = await client.post(`/auth/oauth/${provider}/callback?code=${encodeURIComponent(code)}`)
        await setTokens(res.data.access_token, res.data.refresh_token)
        navigate('/dashboard')
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Authentication failed. Please try again.')
      }
    }

    exchangeCode()
  }, [searchParams, navigate, setTokens])

  return (
    <div className="min-h-screen bg-[#0a0a1a] flex items-center justify-center px-4">
      <div className="text-center">
        {error ? (
          <div className="space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-red-500/20 flex items-center justify-center">
              <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <p className="text-red-400 text-lg">{error}</p>
            <button
              onClick={() => navigate('/login')}
              className="text-blue-400 hover:text-blue-300 underline transition"
            >
              Back to Login
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-blue-500/20 flex items-center justify-center">
              <svg className="animate-spin h-8 w-8 text-blue-400" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
            <p className="text-white text-lg">Signing you in...</p>
            <p className="text-gray-500 text-sm">Please wait while we verify your account</p>
          </div>
        )}
      </div>
    </div>
  )
}
