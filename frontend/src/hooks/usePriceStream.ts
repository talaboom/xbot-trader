import { useEffect, useRef, useState, useCallback } from 'react'

/**
 * WebSocket hook for live price streaming.
 * Connects to /ws/prices and receives price updates every 5 seconds.
 * Auto-reconnects on disconnect.
 */
export function usePriceStream() {
  const [prices, setPrices] = useState<Record<string, number>>({})
  const ws = useRef<WebSocket | null>(null)
  const reconnectTimer = useRef<ReturnType<typeof setTimeout>>()

  const connect = useCallback(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws'
    const wsUrl = import.meta.env.VITE_WS_URL || `${protocol}://${window.location.host}/ws/prices`

    const socket = new WebSocket(wsUrl)
    ws.current = socket

    socket.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data)
        if (msg.type === 'prices') {
          setPrices(msg.data)
        }
      } catch { /* ignore parse errors */ }
    }

    socket.onclose = () => {
      // Reconnect after 3 seconds
      reconnectTimer.current = setTimeout(connect, 3000)
    }

    socket.onerror = () => {
      socket.close()
    }
  }, [])

  useEffect(() => {
    connect()
    return () => {
      clearTimeout(reconnectTimer.current)
      ws.current?.close()
    }
  }, [connect])

  return prices
}
