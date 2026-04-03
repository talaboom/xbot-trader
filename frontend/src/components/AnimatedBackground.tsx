import { useEffect, useRef } from 'react'

interface CryptoLogo {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  maxSize: number
  opacity: number
  maxOpacity: number
  phase: 'growing' | 'visible' | 'shrinking' | 'dead'
  color: string
  symbol: string
  path: Path2D | null
  rotation: number
  rotSpeed: number
  life: number
  maxLife: number
}

interface Props {
  variant?: 'default' | 'trading' | 'strategy' | 'history' | 'settings'
}

const presets = {
  default: { orbColors: ['rgba(59,130,246,0.08)', 'rgba(6,182,212,0.06)', 'rgba(139,92,246,0.05)'] },
  trading: { orbColors: ['rgba(16,185,129,0.1)', 'rgba(6,182,212,0.07)', 'rgba(59,130,246,0.05)'] },
  strategy: { orbColors: ['rgba(139,92,246,0.1)', 'rgba(236,72,153,0.07)', 'rgba(245,158,11,0.05)'] },
  history: { orbColors: ['rgba(6,182,212,0.08)', 'rgba(59,130,246,0.06)', 'rgba(16,185,129,0.05)'] },
  settings: { orbColors: ['rgba(99,102,241,0.08)', 'rgba(139,92,246,0.06)', 'rgba(168,85,247,0.05)'] },
}

// Crypto symbols with their brand colors and simplified SVG-like drawing functions
const cryptos = [
  { symbol: 'BTC', color: '#f7931a', name: 'Bitcoin' },
  { symbol: 'ETH', color: '#627eea', name: 'Ethereum' },
  { symbol: 'SOL', color: '#9945ff', name: 'Solana' },
  { symbol: 'ADA', color: '#0033ad', name: 'Cardano' },
  { symbol: 'DOGE', color: '#c2a633', name: 'Doge' },
  { symbol: 'XRP', color: '#00aae4', name: 'XRP' },
  { symbol: 'AVAX', color: '#e84142', name: 'Avalanche' },
  { symbol: 'LINK', color: '#2a5ada', name: 'Chainlink' },
  { symbol: 'DOT', color: '#e6007a', name: 'Polkadot' },
  { symbol: 'MATIC', color: '#8247e5', name: 'Polygon' },
  { symbol: 'UNI', color: '#ff007a', name: 'Uniswap' },
  { symbol: 'ATOM', color: '#2e3148', name: 'Cosmos' },
  { symbol: 'LTC', color: '#bfbbbb', name: 'Litecoin' },
  { symbol: 'BNB', color: '#f3ba2f', name: 'BNB' },
  { symbol: 'USDT', color: '#26a17b', name: 'Tether' },
  { symbol: 'USDC', color: '#2775ca', name: 'USDC' },
]

function drawCryptoLogo(ctx: CanvasRenderingContext2D, logo: CryptoLogo) {
  ctx.save()
  ctx.translate(logo.x, logo.y)
  ctx.rotate(logo.rotation * Math.PI / 180)
  ctx.globalAlpha = logo.opacity

  const s = logo.size

  // Outer glow
  const glow = ctx.createRadialGradient(0, 0, s * 0.3, 0, 0, s * 1.5)
  glow.addColorStop(0, logo.color + '30')
  glow.addColorStop(1, logo.color + '00')
  ctx.beginPath()
  ctx.fillStyle = glow
  ctx.arc(0, 0, s * 1.5, 0, Math.PI * 2)
  ctx.fill()

  // Circle background
  ctx.beginPath()
  ctx.arc(0, 0, s, 0, Math.PI * 2)
  ctx.fillStyle = logo.color + '15'
  ctx.fill()
  ctx.strokeStyle = logo.color + '40'
  ctx.lineWidth = s * 0.06
  ctx.stroke()

  // Inner symbol
  ctx.fillStyle = logo.color
  ctx.font = `bold ${s * 0.9}px -apple-system, sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  // Draw the symbol character
  const symbolMap: Record<string, string> = {
    'BTC': '₿',
    'ETH': 'Ξ',
    'SOL': 'S',
    'ADA': '₳',
    'DOGE': 'Ð',
    'XRP': '✕',
    'AVAX': 'A',
    'LINK': '⬡',
    'DOT': '●',
    'MATIC': 'M',
    'UNI': '🦄',
    'ATOM': '⚛',
    'LTC': 'Ł',
    'BNB': 'B',
    'USDT': '₮',
    'USDC': '$',
  }

  const char = symbolMap[logo.symbol] || logo.symbol[0]
  // Use emoji for uni/atom, text for rest
  if (['UNI', 'ATOM'].includes(logo.symbol)) {
    ctx.font = `${s * 0.7}px serif`
  }
  ctx.fillText(char, 0, 0)

  // Small label below
  ctx.font = `bold ${s * 0.3}px -apple-system, sans-serif`
  ctx.fillStyle = logo.color + '80'
  ctx.fillText(logo.symbol, 0, s * 0.65)

  ctx.restore()
}

function spawnLogo(w: number, h: number): CryptoLogo {
  const crypto = cryptos[Math.floor(Math.random() * cryptos.length)]
  const maxSize = 12 + Math.random() * 25
  return {
    x: Math.random() * w,
    y: Math.random() * h,
    vx: (Math.random() - 0.5) * 0.4,
    vy: (Math.random() - 0.5) * 0.4 - 0.15, // slight upward drift
    size: 0,
    maxSize,
    opacity: 0,
    maxOpacity: 0.15 + Math.random() * 0.25,
    phase: 'growing',
    color: crypto.color,
    symbol: crypto.symbol,
    path: null,
    rotation: (Math.random() - 0.5) * 20,
    rotSpeed: (Math.random() - 0.5) * 0.15,
    life: 0,
    maxLife: 300 + Math.random() * 500, // frames before starting to fade
  }
}

export default function AnimatedBackground({ variant = 'default' }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>(0)
  const preset = presets[variant]

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let w = canvas.width = canvas.parentElement?.clientWidth || window.innerWidth
    let h = canvas.height = canvas.parentElement?.clientHeight || window.innerHeight

    const handleResize = () => {
      w = canvas.width = canvas.parentElement?.clientWidth || window.innerWidth
      h = canvas.height = canvas.parentElement?.clientHeight || window.innerHeight
    }
    window.addEventListener('resize', handleResize)

    // Initialize logos
    const logos: CryptoLogo[] = Array.from({ length: 35 }, () => {
      const logo = spawnLogo(w, h)
      // Start some already visible
      if (Math.random() > 0.5) {
        logo.phase = 'visible'
        logo.size = logo.maxSize
        logo.opacity = logo.maxOpacity * (0.3 + Math.random() * 0.7)
        logo.life = Math.random() * logo.maxLife
      }
      return logo
    })

    // Connection lines between same-type logos
    const drawConnections = () => {
      for (let i = 0; i < logos.length; i++) {
        if (logos[i].opacity < 0.05) continue
        for (let j = i + 1; j < logos.length; j++) {
          if (logos[j].opacity < 0.05) continue
          const dx = logos[i].x - logos[j].x
          const dy = logos[i].y - logos[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 200) {
            const alpha = 0.04 * (1 - dist / 200) * Math.min(logos[i].opacity, logos[j].opacity) / 0.3
            ctx.beginPath()
            ctx.strokeStyle = `rgba(150, 180, 255, ${alpha})`
            ctx.lineWidth = 0.5
            ctx.moveTo(logos[i].x, logos[i].y)
            ctx.lineTo(logos[j].x, logos[j].y)
            ctx.stroke()
          }
        }
      }
    }

    const animate = () => {
      ctx.clearRect(0, 0, w, h)

      drawConnections()

      logos.forEach((logo, idx) => {
        // Update position
        logo.x += logo.vx
        logo.y += logo.vy
        logo.rotation += logo.rotSpeed
        logo.life++

        // Phase transitions
        switch (logo.phase) {
          case 'growing':
            logo.size += logo.maxSize / 60 // grow over ~1 second
            logo.opacity += logo.maxOpacity / 60
            if (logo.size >= logo.maxSize) {
              logo.size = logo.maxSize
              logo.opacity = logo.maxOpacity
              logo.phase = 'visible'
            }
            break
          case 'visible':
            // Gentle opacity pulse
            logo.opacity = logo.maxOpacity * (0.7 + 0.3 * Math.sin(logo.life * 0.02))
            if (logo.life > logo.maxLife) {
              logo.phase = 'shrinking'
            }
            break
          case 'shrinking':
            logo.size -= logo.maxSize / 90 // shrink over ~1.5 seconds
            logo.opacity -= logo.maxOpacity / 90
            if (logo.size <= 0 || logo.opacity <= 0) {
              logo.phase = 'dead'
            }
            break
          case 'dead':
            // Respawn
            const newLogo = spawnLogo(w, h)
            // Spawn from edges sometimes
            if (Math.random() > 0.5) {
              const edge = Math.floor(Math.random() * 4)
              if (edge === 0) newLogo.y = -20
              else if (edge === 1) newLogo.y = h + 20
              else if (edge === 2) newLogo.x = -20
              else newLogo.x = w + 20
            }
            logos[idx] = newLogo
            return
        }

        // Wrap around
        if (logo.x < -50) logo.x = w + 50
        if (logo.x > w + 50) logo.x = -50
        if (logo.y < -50) logo.y = h + 50
        if (logo.y > h + 50) logo.y = -50

        // Draw
        if (logo.opacity > 0 && logo.size > 0) {
          drawCryptoLogo(ctx, logo)
        }
      })

      animRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      cancelAnimationFrame(animRef.current)
      window.removeEventListener('resize', handleResize)
    }
  }, [variant])

  return (
    <>
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" style={{ zIndex: 0 }} />
      <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
        <div className="absolute w-[500px] h-[500px] rounded-full blur-[150px] animate-pulse"
          style={{ background: preset.orbColors[0], top: '-10%', left: '-5%', animationDuration: '8s' }} />
        <div className="absolute w-[400px] h-[400px] rounded-full blur-[130px] animate-pulse"
          style={{ background: preset.orbColors[1], bottom: '-10%', right: '-5%', animationDuration: '10s', animationDelay: '2s' }} />
        <div className="absolute w-[300px] h-[300px] rounded-full blur-[100px] animate-pulse"
          style={{ background: preset.orbColors[2], top: '40%', right: '20%', animationDuration: '12s', animationDelay: '4s' }} />
      </div>
    </>
  )
}
