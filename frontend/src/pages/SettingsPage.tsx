import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { storeKeys, getKeys, deleteKey, verifyKeys } from '../api/exchange'
import { getSubscriptionStatus } from '../api/subscriptions'
import { useAuth } from '../contexts/AuthContext'

export default function SettingsPage() {
  const { user } = useAuth()
  const [keys, setKeys] = useState<any[]>([])
  const [apiKey, setApiKey] = useState('')
  const [apiSecret, setApiSecret] = useState('')
  const [label, setLabel] = useState('')
  const [saving, setSaving] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [message, setMessage] = useState<{ type: string; text: string } | null>(null)
  const [sub, setSub] = useState<any>(null)

  const load = () => getKeys().then(r => setKeys(r.data)).catch(() => {})
  useEffect(() => {
    load()
    getSubscriptionStatus().then(setSub).catch(() => {})
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
      {sub && (
        <div className="bg-[#111127] border border-white/5 rounded-2xl p-6">
          <h2 className="text-lg font-bold text-white mb-4">Subscription</h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-sm text-gray-400">Plan</p>
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                sub.plan === 'pro' ? 'bg-purple-500/20 text-purple-400' :
                sub.plan === 'trader' ? 'bg-blue-500/20 text-blue-400' :
                'bg-gray-500/20 text-gray-400'
              }`}>
                {sub.plan === 'free_trial' ? 'Free Trial' : sub.plan === 'trader' ? 'Trader ($20/mo)' : 'Pro ($50/mo)'}
              </span>
            </div>
            <div>
              <p className="text-sm text-gray-400">Status</p>
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                sub.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
              }`}>
                {sub.status}
              </span>
            </div>
            <div>
              <p className="text-sm text-gray-400">Days Remaining</p>
              <p className="text-white font-medium">{sub.days_remaining} days</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Max Bots</p>
              <p className="text-white font-medium">{sub.max_bots === 999 ? 'Unlimited' : sub.max_bots}</p>
            </div>
          </div>
          {(sub.plan === 'free_trial' || sub.status === 'expired') && (
            <Link to="/payment"
              className="inline-block bg-gradient-to-r from-blue-600 to-cyan-500 px-6 py-2.5 rounded-xl font-semibold text-sm shadow-lg shadow-blue-500/25 transition hover:from-blue-500 hover:to-cyan-400">
              Upgrade Plan
            </Link>
          )}
        </div>
      )}

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
    </div>
  )
}
