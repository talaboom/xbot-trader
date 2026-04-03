import { useEffect, useRef } from 'react'
import { createChart, ColorType } from 'lightweight-charts'
import { getPortfolioHistory } from '../api/dashboard'

interface Props {
  height?: number
}

export default function PortfolioChart({ height = 200 }: Props) {
  const chartRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!chartRef.current) return

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

    getPortfolioHistory()
      .then(res => {
        const data = res.data
        if (data && data.length > 0) {
          series.setData(data)
          chart.timeScale().fitContent()
        }
      })
      .catch(() => {
        // Fallback: flat line at $100K
        const now = Math.floor(Date.now() / 1000)
        const data = Array.from({ length: 30 }, (_, i) => ({
          time: now - (29 - i) * 86400,
          value: 100000,
        }))
        series.setData(data)
        chart.timeScale().fitContent()
      })

    const handleResize = () => {
      if (chartRef.current) chart.applyOptions({ width: chartRef.current.clientWidth })
    }
    window.addEventListener('resize', handleResize)
    return () => { window.removeEventListener('resize', handleResize); chart.remove() }
  }, [height])

  return <div ref={chartRef} />
}
