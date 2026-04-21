import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { storeKeys, getKeys, deleteKey, verifyKeys } from '../api/exchange'
import { createPortalSession } from '../api/payments'
import { useAuth } from '../contexts/AuthContext'
import client from '../api/client'

export default function SettingsPage() {
  const { user } = useAuth()
  const [keys, setKeys] = useState<any[]>([])
  const [apiKey, setApiKey] = useState('')
  const [apiSecret, setApiSecret] = useState('')
  const [label, setLabel] = useState('')
  const [saving, setSaving] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [message, setMessage] = useState<{ type: string; text: string } | null>(null)
  const [referral, setReferral] = useState<any>(null)
  const [refCopied, setRefCopied] = useState(false)
  const [telegramStatus, setTelegramStatus] = useState<any>(null)
  const [telegramLoading, setTelegramLoading] = useState(false)

  const load = () => getKeys().then(r => setKeys(r.data)).catch(() => {})
  useEffect(() => {
    load()
    client.get('/referrals').then(r => setReferral(r.data)).catch(() => {})
    client.get('/telegram/status').then(r => setTelegramStatus(r.data)).catch(() => {})
  }, [])

  const handleSave = async () => {
    setSaving(true)
    setMessage(null)
    try {
      await storeKeys(apiKey, apiSecret, label || undefined)
      setMessage({ type: 'success', text: 'API keys saved and encrypted' })
      setApiKey('')
      setApiSecret('')
      setLabel('')
      load()
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.detail || 'Failed to save keys' })
    } finally {
      setSaving(false)
    }
  }

  const handleVerify = async () => {
    setVerifying(true)
    setMessage(null)
    try {
      const res = await verifyKeys()
      if (res.data.is_valid) {
        setMessage({ type: 'success', text: `Connected! ${res.data.balances?.length || 0} assets found.` })
      } else {
        setMessage({ type: 'error', text: res.data.message })
      }
      load()
    } catch (err: any) {
      setMessage({ type: 'error', text: 'Verification failed' })
    } finally {
      setVerifying(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('Delete this API key?')) {
      await deleteKey(id)
      load()
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-white">Settings</h1>

      {/* Account info */}
      <div className="bg-[#111127] border border-white/5 rounded-2xl p-6">
        <h2 className="text-lg font-bold text-white mb-4">Account</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-400">Username</p>
            <p className="text-white font-medium">{user?.username}</p>
          </div>
          <div>
            <p className="text-sm text-gray-400">Email</p>
            <p className="text-white font-medium">{user?.email}</p>
          </div>
          <div>
            <p className="text-sm text-gray-400">Trading Mode</p>
            <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${user?.is_paper_mode ? 'bg-yellow-500/20 text-yellow-400' : 'bg-green-500/20 text-green-400'}`}>
              {user?.is_paper_mode ? 'Paper Trading' : 'Live Trading'}
            </span>
          </div>
        </div>
      </div>

      {/* Subscription */}
      <div className="bg-[#111127] border border-white/5 rounded-2xl p-6">
        <h2 className="text-lg font-bold text-white mb-4">Subscription</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white font-medium capitalize">{user?.subscription_tier || 'free'} Plan</p>
            <p className="text-sm text-gray-400">
              {user?.subscription_status === 'active'
                ? 'Active subscription'
                : user?.subscription_status === 'past_due'
                ? 'Payment past due'
                : 'No active subscription'}
            </p>
          </div>
          <div className="flex gap-2">
            {user?.subscription_status === 'active' && (
              <button
                onClick={async () => {
                  try {
                    const res = await createPortalSession()
                    window.location.href = res.data.portal_url
                  } catch (e: any) {
                    alert(e?.response?.data?.detail || 'Could not open billing portal. Contact support at ivan@sync-security.com')
                  }
                }}
                className="px-4 py-2 rounded-xl border border-white/10 text-white text-sm hover:bg-white/5 transition"
              >
                Manage Subscription
              </button>
            )}
            <Link
              to="/pricing"
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-sm font-semibold shadow-lg shadow-blue-500/25"
            >
              {user?.subscription_status === 'active' ? 'Change Plan' : 'Upgrade'}
            </Link>
          </div>
        </div>
      </div>

      {/* API Keys */}
      <div className="bg-[#111127] border border-white/5 rounded-2xl p-6">
        <h2 className="text-lg font-bold text-white mb-2">Coinbase API Keys</h2>
        <p className="text-sm text-gray-400 mb-6">Connect your Coinbase account. Your keys are encrypted with AES-256.</p>

        {message && (
          <div className={`mb-4 px-4 py-3 rounded-lg text-sm ${message.type === 'success' ? 'bg-green-500/10 border border-green-500/20 text-green-400' : 'bg-red-500/10 border border-red-500/20 text-red-400'}`}>
            {message.text}
          </div>
        )}

        {/* Existing keys */}
        {keys.length > 0 && (
          <div className="mb-6 space-y-3">
            {keys.map((k: any) => (
              <div key={k.id} className="flex items-center justify-between bg-white/5 rounded-xl px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className={`w-2 h-2 rounded-full ${k.is_valid ? 'bg-green-500' : 'bg-red-500'}`} />
                  <div>
                    <p className="text-sm text-white font-medium">{k.label || k.exchange}</p>
                    <p className="text-xs text-gray-500">{k.api_key_masked}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={handleVerify} disabled={verifying}
                    className="text-xs px-3 py-1.5 rounded-lg border border-blue-500/30 text-blue-400 hover:bg-blue-500/10 transition">
                    {verifying ? 'Testing...' : 'Verify'}
                  </button>
                  <button onClick={() => handleDelete(k.id)}
                    className="text-xs px-3 py-1.5 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition">
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add new keys */}
        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-400 mb-1 block">Label (optional)</label>
            <input value={label} onChange={e => setLabel(e.target.value)} placeholder="My Coinbase Keys"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500/50 focus:outline-none placeholder-gray-600" />
          </div>
          <div>
            <label className="text-sm text-gray-400 mb-1 block">API Key</label>
            <input value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="organizations/xxx/apiKeys/xxx"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-mono text-sm focus:border-blue-500/50 focus:outline-none placeholder-gray-600" />
          </div>
          <div>
            <label className="text-sm text-gray-400 mb-1 block">API Secret (EC Private Key)</label>
            <textarea value={apiSecret} onChange={e => setApiSecret(e.target.value)} rows={4}
              placeholder="-----BEGIN EC PRIVATE KEY-----&#10;..."
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-mono text-sm focus:border-blue-500/50 focus:outline-none placeholder-gray-600 resize-none" />
          </div>
          <button onClick={handleSave} disabled={saving || !apiKey || !apiSecret}
            className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 disabled:from-gray-700 disabled:to-gray-700 py-3 rounded-xl font-semibold transition shadow-lg shadow-blue-500/25">
            {saving ? 'Encrypting & Saving...' : 'Save API Keys'}
          </button>
        </div>

        <div className="mt-4 p-4 bg-blue-500/5 border border-blue-500/10 rounded-xl">
          <p className="text-xs text-blue-400 font-medium mb-2">How to get your API keys:</p>
          <ol className="text-xs text-gray-400 space-y-1 list-decimal list-inside">
            <li>Go to Coinbase &rarr; Developer Platform &rarr; API Keys</li>
            <li>Create a new key with "Advanced Trade" permissions</li>
            <li>Enable "Trade" permission, disable "Withdraw"</li>
            <li>Select ECDSA key type</li>
            <li>Copy both the API Key ID and Private Key here</li>
          </ol>
        </div>
      </div>

      {/* Telegram Integration */}
      <div className="bg-[#111127] border border-white/5 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-[#229ED9]/20 flex items-center justify-center">
            <svg className="w-6 h-6 text-[#229ED9]" viewBox="0 0 24 24" fill="currentColor">
              <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Telegram</h2>
            <p className="text-sm text-gray-400">Get trade alerts and updates on Telegram</p>
          </div>
        </div>

        {telegramStatus?.connected ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-green-400 text-sm font-medium">Telegram Connected</span>
            </div>
            <p className="text-xs text-gray-400">You'll receive trade alerts, price notifications, and bot status updates.</p>
            <button
              onClick={async () => {
                await client.delete('/telegram/disconnect')
                setTelegramStatus({ connected: false, channel_url: telegramStatus.channel_url })
              }}
              className="text-xs px-3 py-1.5 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition"
            >
              Disconnect
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-gray-400">Connect your Telegram to receive real-time notifications:</p>
            <ul className="text-sm text-gray-400 space-y-1">
              <li className="flex items-center gap-2"><span className="text-green-400">&#10003;</span> Trade execution alerts</li>
              <li className="flex items-center gap-2"><span className="text-green-400">&#10003;</span> Price movement notifications</li>
              <li className="flex items-center gap-2"><span className="text-green-400">&#10003;</span> Bot status updates</li>
              <li className="flex items-center gap-2"><span className="text-green-400">&#10003;</span> Daily P&L summaries</li>
            </ul>
            <button
              disabled={telegramLoading}
              onClick={async () => {
                setTelegramLoading(true)
                try {
                  const res = await client.post('/telegram/generate-link-code')
                  const code = res.data.code
                  // Get bot info
                  const botRes = await client.get('/telegram/bot-info')
                  const botUsername = botRes.data.bot_username
                  if (botUsername) {
                    window.open(`https://t.me/${botUsername}?start=${code}`, '_blank')
                    // Poll for connection
                    const poll = setInterval(async () => {
                      const status = await client.get('/telegram/status')
                      if (status.data.connected) {
                        clearInterval(poll)
                        setTelegramStatus(status.data)
                      }
                    }, 3000)
                    setTimeout(() => clearInterval(poll), 60000)
                  } else {
                    setMessage({ type: 'error', text: 'Telegram bot not configured yet' })
                  }
                } catch {
                  setMessage({ type: 'error', text: 'Failed to generate Telegram link' })
                } finally {
                  setTelegramLoading(false)
                }
              }}
              className="w-full bg-[#229ED9] hover:bg-[#1E8DC5] disabled:bg-gray-700 text-white font-semibold py-3 rounded-xl transition flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
              </svg>
              {telegramLoading ? 'Opening Telegram...' : 'Connect Telegram'}
            </button>
          </div>
        )}

        {/* Channel link */}
        {telegramStatus?.channel_url && (
          <div className="mt-4 pt-4 border-t border-white/5">
            <a
              href={telegramStatus.channel_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-[#229ED9] hover:text-[#1E8DC5] transition"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
              </svg>
              Join our Telegram Channel
            </a>
          </div>
        )}
      </div>

      {/* Referral Program */}
      {referral && (
        <div className="bg-[#111127] border border-white/5 rounded-2xl p-6">
          <h2 className="text-lg font-bold text-white mb-2">Refer & Earn</h2>
          <p className="text-sm text-gray-400 mb-4">Share your link. Get 1 week free for every friend who signs up.</p>

          <div className="bg-white/5 rounded-xl p-4 mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-400">Your referral link</span>
              <button onClick={() => { navigator.clipboard.writeText(referral.referral_link); setRefCopied(true); setTimeout(() => setRefCopied(false), 2000) }}
                className={`text-xs px-3 py-1 rounded-lg transition ${refCopied ? 'bg-green-500/20 text-green-400' : 'bg-white/10 text-white hover:bg-white/20'}`}>
                {refCopied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <code className="text-sm text-blue-400 break-all">{referral.referral_link}</code>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/5 rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-white">{referral.total_referred}</p>
              <p className="text-xs text-gray-400 mt-1">Friends Referred</p>
            </div>
            <div className="bg-white/5 rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-green-400">{referral.total_referred * 7}d</p>
              <p className="text-xs text-gray-400 mt-1">Free Days Earned</p>
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            <button onClick={() => { const text = `Check out X Bot Trader — AI crypto trading that works 24/7! Use my link: ${referral.referral_link}`; navigator.clipboard.writeText(text); setRefCopied(true); setTimeout(() => setRefCopied(false), 2000) }}
              className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-500 py-2.5 rounded-xl font-semibold text-sm shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition text-center">
              Share with Friends
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
