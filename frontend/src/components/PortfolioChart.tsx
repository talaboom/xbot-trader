import { useEffect, useRef } from 'react'
import { createChart, ColorType, type Time } from 'lightweight-charts'
import { getPortfolioHistory } from '../api/dashboard'

interface Props {
  height?: number
}

export default function PortfolioChart({ height = 200 }: Props) {
  const chartRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!chartRef.current) return

    // Guard against late async callbacks touching a disposed chart.
    let disposed = false

    const chart = createChart(chartRef.current, {
      width: chartRef.current.clientWidth,
      height,
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#6b7280',
        fontSize: 11,
      },
      grid: {
        vertLines: { visible: false },
        horzLines: { color: 'rgba(255,255,255,0.03)' },
      },
      rightPriceScale: { borderVisible: false },
      timeScale: { borderVisible: false, visible: false },
      handleScroll: false,
      handleScale: false,
    })

    const series = chart.addAreaSeries({
      topColor: 'rgba(16,185,129,0.25)',
      bottomColor: 'rgba(16,185,129,0.01)',
      lineColor: '#10b981',
      lineWidth: 2,
    })

    const safeSetData = (data: { time: Time; value: number }[]) => {
      if (disposed) return
      try {
        series.setData(data)
        chart.timeScale().fitContent()
      } catch {
        // chart/series already disposed — ignore
      }
    }

    getPortfolioHistory()
      .then(res => {
        const data = res.data
        if (data && data.length > 0) safeSetData(data)
      })
      .catch(() => {
        // Fallback: animated demo data
        const now = Math.floor(Date.now() / 1000)
        const data: { time: Time; value: number }[] = []
        let value = 100000
        for (let i = 30; i >= 0; i--) {
          value += (Math.random() - 0.45) * 800
          data.push({ time: (now - i * 86400) as Time, value: Math.max(value, 95000) })
        }
        safeSetData(data)
      })

    const handleResize = () => {
      if (!disposed && chartRef.current) {
        try { chart.applyOptions({ width: chartRef.current.clientWidth }) } catch { /* disposed */ }
      }
    }
    window.addEventListener('resize', handleResize)
    return () => {
      disposed = true
      window.removeEventListener('resize', handleResize)
      try { chart.remove() } catch { /* already disposed */ }
    }
  }, [height])

  return <div ref={chartRef} />
}
