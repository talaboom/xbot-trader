import { useState, useRef, useEffect } from 'react'
import client from '../api/client'

interface Message {
  role: 'user' | 'assistant'
  text: string
  suggestions?: string[]
}

const avatarOptions = {
  faces: ['🤖', '🧠', '👾', '🦊', '🐺', '🦉', '🐙', '🤯'],
  colors: ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#ef4444', '#06b6d4', '#6366f1'],
  names: ['Atlas', 'Nova', 'Sage', 'Bolt', 'Luna', 'Rex', 'Echo', 'Pixel'],
}

export default function AIAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', text: "Hey! I'm your AI trading assistant. I can help you pick strategies, explain how crypto trading works, or answer any questions. What would you like to know?", suggestions: ["What strategy should I use?", "Explain DCA trading", "I'm new to crypto", "Show current prices"] }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [avatar, setAvatar] = useState({ face: '🤖', color: '#3b82f6', name: 'Atlas' })
  const [showAvatarEditor, setShowAvatarEditor] = useState(false)
  const messagesEnd = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = async (text: string) => {
    if (!text.trim()) return
    setInput('')
    setMessages(prev => [...prev, { role: 'user', text }])
    setLoading(true)

    try {
      const res = await client.post('/ai/chat', { message: text })
      setMessages(prev => [...prev, {
        role: 'assistant',
        text: res.data.response,
        suggestions: res.data.suggestions,
      }])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', text: "Sorry, I had trouble processing that. Try asking about DCA, Grid trading, or crypto prices!" }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-8rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl" style={{ backgroundColor: avatar.color + '20', border: `2px solid ${avatar.color}40` }}>
            {avatar.face}
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">{avatar.name}</h1>
            <p className="text-xs text-gray-400">Your AI Trading Assistant</p>
          </div>
          <span className="flex items-center gap-1 text-xs text-green-400 ml-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> Online
          </span>
        </div>
        <button onClick={() => setShowAvatarEditor(!showAvatarEditor)}
          className="text-sm text-gray-400 hover:text-white border border-white/10 px-3 py-1.5 rounded-lg hover:bg-white/5 transition">
          Customize Avatar
        </button>
      </div>

      {/* Avatar editor */}
      {showAvatarEditor && (
        <div className="bg-[#0d0d20] border border-white/10 rounded-2xl p-5 mb-4 animate-in">
          <h3 className="text-sm font-bold text-white mb-3">Customize Your AI Assistant</h3>
          <div className="space-y-4">
            <div>
              <p className="text-xs text-gray-400 mb-2">Face</p>
              <div className="flex gap-2">
                {avatarOptions.faces.map(f => (
                  <button key={f} onClick={() => setAvatar(a => ({ ...a, face: f }))}
                    className={`w-10 h-10 rounded-lg text-xl flex items-center justify-center transition ${avatar.face === f ? 'bg-white/20 ring-2 ring-blue-500' : 'bg-white/5 hover:bg-white/10'}`}>
                    {f}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-2">Color</p>
              <div className="flex gap-2">
                {avatarOptions.colors.map(c => (
                  <button key={c} onClick={() => setAvatar(a => ({ ...a, color: c }))}
                    className={`w-8 h-8 rounded-full transition ${avatar.color === c ? 'ring-2 ring-white scale-110' : 'hover:scale-110'}`}
                    style={{ backgroundColor: c }} />
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-2">Name</p>
              <div className="flex gap-2 flex-wrap">
                {avatarOptions.names.map(n => (
                  <button key={n} onClick={() => setAvatar(a => ({ ...a, name: n }))}
                    className={`px-3 py-1 rounded-lg text-sm transition ${avatar.name === n ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-white/5 text-gray-400 hover:text-white'}`}>
                    {n}
                  </button>
                ))}
                <input placeholder="Custom name..." value={avatarOptions.names.includes(avatar.name) ? '' : avatar.name}
                  onChange={e => setAvatar(a => ({ ...a, name: e.target.value || 'Atlas' }))}
                  className="px-3 py-1 rounded-lg text-sm bg-white/5 text-white border border-white/10 focus:border-blue-500/50 focus:outline-none w-32 placeholder-gray-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-2 scrollbar-thin">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] ${msg.role === 'user' ? 'order-1' : 'order-2'}`}>
              {msg.role === 'assistant' && (
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg" style={{ color: avatar.color }}>{avatar.face}</span>
                  <span className="text-xs text-gray-500">{avatar.name}</span>
                </div>
              )}
              <div className={`rounded-2xl px-4 py-3 ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white rounded-br-md'
                  : 'bg-[#111127] border border-white/10 text-gray-200 rounded-bl-md'
              }`}>
                {msg.text.split('\n').map((line, j) => (
                  <p key={j} className={`${j > 0 ? 'mt-2' : ''} ${line.startsWith('**') ? 'font-bold text-white' : ''}`}>
                    {line.replace(/\*\*/g, '')}
                  </p>
                ))}
              </div>
              {msg.suggestions && msg.suggestions.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {msg.suggestions.map((s, j) => (
                    <button key={j} onClick={() => send(s)}
                      className="text-xs bg-white/5 border border-white/10 text-gray-300 px-3 py-1.5 rounded-full hover:bg-blue-500/10 hover:border-blue-500/30 hover:text-blue-400 transition">
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-[#111127] border border-white/10 rounded-2xl rounded-bl-md px-4 py-3">
              <div className="flex gap-1">
                <span className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEnd} />
      </div>

      {/* Input */}
      <div className="mt-4 flex gap-3">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send(input)}
          placeholder={`Ask ${avatar.name} anything about trading...`}
          className="flex-1 bg-[#0d0d20] border border-white/10 rounded-xl px-5 py-3.5 text-white focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 focus:outline-none placeholder-gray-600 transition"
        />
        <button onClick={() => send(input)} disabled={loading || !input.trim()}
          className="bg-gradient-to-r from-blue-600 to-cyan-500 px-6 rounded-xl font-semibold disabled:opacity-40 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition">
          Send
        </button>
      </div>
    </div>
  )
}
