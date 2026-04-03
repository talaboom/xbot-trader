import { useState, useEffect, createContext, useContext, ReactNode, useCallback } from 'react'

interface ToastItem {
  id: string
  type: 'success' | 'error' | 'info' | 'trade'
  title: string
  message?: string
}

interface ToastCtx {
  toast: (item: Omit<ToastItem, 'id'>) => void
}

const ToastContext = createContext<ToastCtx>({ toast: () => {} })

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const toast = useCallback((item: Omit<ToastItem, 'id'>) => {
    const id = Math.random().toString(36).slice(2)
    setToasts(prev => [...prev, { ...item, id }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 5000)
  }, [])

  const icons = { success: '✅', error: '❌', info: 'ℹ️', trade: '💰' }
  const borders = { success: 'border-green-500/30', error: 'border-red-500/30', info: 'border-blue-500/30', trade: 'border-yellow-500/30' }

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed top-4 right-4 z-[100] space-y-2 w-80">
        {toasts.map(t => (
          <div key={t.id}
            className={`bg-[#111127] border ${borders[t.type]} rounded-xl px-4 py-3 shadow-2xl animate-slide-in flex items-start gap-3`}>
            <span className="text-lg mt-0.5">{icons[t.type]}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white">{t.title}</p>
              {t.message && <p className="text-xs text-gray-400 mt-0.5">{t.message}</p>}
            </div>
            <button onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))}
              className="text-gray-500 hover:text-white text-sm">✕</button>
          </div>
        ))}
      </div>
      <style>{`
        @keyframes slide-in {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .animate-slide-in { animation: slide-in 0.3s ease-out; }
      `}</style>
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)
