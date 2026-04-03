import { useEffect, useRef, useState } from 'react'
import { createChart, ColorType, CrosshairMode, LineStyle } from 'lightweight-charts'

interface Props {
  productId?: string
  height?: number
}

const timeframes = [
  { label: '1H', value: '60', seconds: 60, count: 200 },
  { label: '4H', value: '900', seconds: 900, count: 200 },
  { label: '1D', value: '3600', seconds: 3600, count: 200 },
  { label: '1W', value: '86400', seconds: 86400, count: 200 },
]

export default function PriceChart({ productId = 'BTC-USD', height = 420 }: Props) {
  const chartRef = useRef<HTMLDivElement>(null)
  const chartInstance = useRef<any>(null)
  const [selectedTf, setSelectedTf] = useState('3600')
  const [selectedProduct, setSelectedProduct] = useState(productId)
  const [currentPrice, setCurrentPrice] = useState<number | null>(null)
  const [priceChange, setPriceChange] = useState<number>(0)
  const [chartType, setChartType] = useState<'candle' | 'line' | 'area'>('candle')

  const products = ['BTC-USD', 'ETH-USD', 'SOL-USD', 'DOGE-USD', 'ADA-USD', 'XRP-USD', 'AVAX-USD', 'LINK-USD']

  useEffect(() => {
    setSelectedProduct(productId)
  }, [productId])

  useEffect(() => {
    if (!chartRef.current) return

    if (chartInstance.current) {
      chartInstance.current.remove()
    }

    const chart = createChart(chartRef.current, {
      width: chartRef.current.clientWidth,
      height: height,
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#9ca3af',
        fontSize: 12,
      },
      grid: {
        vertLines: { color: 'rgba(255,255,255,0.03)' },
        horzLines: { color: 'rgba(255,255,255,0.03)' },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: 'rgba(59,130,246,0.3)', width: 1, style: LineStyle.Dashed, labelBackgroundColor: '#1e3a5f' },
        horzLine: { color: 'rgba(59,130,246,0.3)', width: 1, style: LineStyle.Dashed, labelBackgroundColor: '#1e3a5f' },
      },
      rightPriceScale: {
        borderColor: 'rgba(255,255,255,0.05)',
        scaleMargins: { top: 0.1, bottom: 0.1 },
      },
      timeScale: {
        borderColor: 'rgba(255,255,255,0.05)',
        timeVisible: true,
        secondsVisible: false,
      },
      handleScroll: { vertTouchDrag: false },
    })

    chartInstance.current = chart

    let series: any

    if (chartType === 'candle') {
      series = chart.addCandlestickSeries({
        upColor: '#22c55e',
        downColor: '#ef4444',
        borderDownColor: '#ef4444',
        borderUpColor: '#22c55e',
        wickDownColor: '#ef4444',
        wickUpColor: '#22c55e',
      })
    } else if (chartType === 'line') {
      series = chart.addLineSeries({
        color: '#3b82f6',
        lineWidth: 2,
        crosshairMarkerVisible: true,
        crosshairMarkerRadius: 4,
        crosshairMarkerBorderColor: '#3b82f6',
        crosshairMarkerBackgroundColor: '#1e3a5f',
      })
    } else {
      series = chart.addAreaSeries({
        topColor: 'rgba(59,130,246,0.3)',
        bottomColor: 'rgba(59,130,246,0.02)',
        lineColor: '#3b82f6',
        lineWidth: 2,
      })
    }

    const fetchData = async () => {
      try {
        const tf = timeframes.find(t => t.value === selectedTf) || timeframes[2]
        const granularity = tf.seconds
        const now = new Date()
        const start = new Date(now.getTime() - granularity * tf.count * 1000)

        // Coinbase Exchange API — public, no auth required
        // Returns: [[time, low, high, open, close, volume], ...]
        const resp = await fetch(
          `https://api.exchange.coinbase.com/products/${selectedProduct}/candles?granularity=${granularity}&start=${start.toISOString()}&end=${now.toISOString()}`
        )

        if (resp.ok) {
          const raw = await resp.json()
          // Sort by time ascending (API returns newest first)
          const sorted = raw.sort((a: number[], b: number[]) => a[0] - b[0])

          const data: any[] = sorted.map((c: number[]) => {
            const [time, low, high, open, close] = c
            if (chartType === 'candle') {
              return { time, open, high, low, close }
            } else {
              return { time, value: close }
            }
          })

          if (data.length > 0) {
            series.setData(data)
            chart.timeScale().fitContent()

            // Set current price and change
            const lastCandle = sorted[sorted.length - 1]
            const firstCandle = sorted[0]
            setCurrentPrice(lastCandle[4]) // close
            if (firstCandle[4] > 0) {
              setPriceChange(((lastCandle[4] - firstCandle[4]) / firstCandle[4]) * 100)
            }
            return
          }
        }

        // Fallback: fetch spot price if exchange API fails
        const spotResp = await fetch(`https://api.coinbase.com/v2/prices/${selectedProduct}/spot`)
        if (spotResp.ok) {
          const spotData = await spotResp.json()
          const price = parseFloat(spotData?.data?.amount || '0')
          setCurrentPrice(price)
          setPriceChange(0)
        }
      } catch (e) {
        console.error('Chart data error:', e)
      }
    }

    fetchData()

    const handleResize = () => {
      if (chartRef.current) {
        chart.applyOptions({ width: chartRef.current.clientWidth })
      }
    }
    window.addEventListener('resize', handleResize)

    const interval = setInterval(fetchData, 30000)

    return () => {
      window.removeEventListener('resize', handleResize)
      clearInterval(interval)
      chart.remove()
    }
  }, [selectedProduct, selectedTf, chartType, height])

  const formatPrice = (p: number) => {
    if (p >= 1000) return `$${p.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    if (p >= 1) return `$${p.toFixed(2)}`
    return `$${p.toFixed(4)}`
  }

  return (
    <div className="bg-[#0d0d20] border border-white/5 rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-4">
          <select value={selectedProduct} onChange={e => setSelectedProduct(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm font-bold focus:outline-none focus:border-blue-500/50">
            {products.map(p => <option key={p} value={p}>{p}</option>)}
          </select>

          {currentPrice && (
            <div>
              <span className="text-2xl font-bold text-white">{formatPrice(currentPrice)}</span>
              <span className={`ml-2 text-sm font-medium ${priceChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-white/5 rounded-lg p-0.5">
            {(['candle', 'line', 'area'] as const).map(type => (
              <button key={type} onClick={() => setChartType(type)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${chartType === type ? 'bg-blue-500/20 text-blue-400' : 'text-gray-500 hover:text-white'}`}>
                {type === 'candle' ? 'Candle' : type === 'line' ? 'Line' : 'Area'}
              </button>
            ))}
          </div>

          <div className="flex bg-white/5 rounded-lg p-0.5">
            {timeframes.map(tf => (
              <button key={tf.value} onClick={() => setSelectedTf(tf.value)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${selectedTf === tf.value ? 'bg-blue-500/20 text-blue-400' : 'text-gray-500 hover:text-white'}`}>
                {tf.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div ref={chartRef} />
    </div>
  )
}
