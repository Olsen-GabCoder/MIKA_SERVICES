import { useEffect, useRef } from 'react'

export const LoginCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let W = 0
    let H = 0
    let lines: { x1: number; y1: number; x2: number; y2: number; type: 'r' | 'l' }[] = []
    let particles: { x: number; y: number; r: number; vx: number; vy: number; life: number }[] = []
    let animationId = 0
    let t = 0
    let isVisible = true
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const resize = () => {
      W = canvas.width = window.innerWidth
      H = canvas.height = window.innerHeight
      buildScene()
    }

    const buildScene = () => {
      lines = []
      const step = 60
      const angle = Math.PI / 6
      const cos = Math.cos(angle)
      const sin = Math.sin(angle)
      const cols = Math.ceil(W / step) + 20
      const rows = Math.ceil(H / step) + 20
      for (let i = -10; i < cols; i++) {
        const x = i * step
        lines.push({
          x1: x - rows * step * cos,
          y1: -rows * step * sin,
          x2: x + rows * step * cos,
          y2: rows * step * sin,
          type: 'r',
        })
      }
      for (let i = -10; i < cols; i++) {
        const x = i * step
        lines.push({
          x1: x - rows * step * cos,
          y1: rows * step * sin,
          x2: x + rows * step * cos,
          y2: -rows * step * sin,
          type: 'l',
        })
      }
      particles = Array.from({ length: prefersReducedMotion ? 15 : 40 }, () => ({
        x: Math.random() * W,
        y: Math.random() * H,
        r: Math.random() * 1.5 + 0.3,
        vx: (Math.random() - 0.5) * 0.2,
        vy: -(Math.random() * 0.4 + 0.1),
        life: Math.random(),
      }))
    }

    const isDark = () => document.documentElement.getAttribute('data-theme') === 'dark'

    const draw = () => {
      if (!isVisible) {
        animationId = requestAnimationFrame(draw)
        return
      }
      ctx.clearRect(0, 0, W, H)

      const dark = isDark()
      const grd = ctx.createLinearGradient(0, 0, W, H)
      if (dark) {
        grd.addColorStop(0, '#080e17')
        grd.addColorStop(0.5, '#0d1624')
        grd.addColorStop(1, '#060c14')
      } else {
        grd.addColorStop(0, '#e8eef4')
        grd.addColorStop(0.5, '#dce4ec')
        grd.addColorStop(1, '#e2e8f0')
      }
      ctx.fillStyle = grd
      ctx.fillRect(0, 0, W, H)

      const gridAlpha = dark ? 0.055 : 0.04
      lines.forEach((l) => {
        ctx.beginPath()
        ctx.moveTo(l.x1, l.y1)
        ctx.lineTo(l.x2, l.y2)
        ctx.strokeStyle = l.type === 'r' ? `rgba(244,124,32,${gridAlpha})` : `rgba(30,77,140,${gridAlpha})`
        ctx.lineWidth = dark ? 0.7 : 0.5
        ctx.stroke()
      })

      const ox = W * 0.28
      const oy = H * 0.5
      const orb = ctx.createRadialGradient(ox, oy, 0, ox, oy, W * 0.35)
      orb.addColorStop(0, dark ? 'rgba(244,124,32,0.07)' : 'rgba(244,124,32,0.05)')
      orb.addColorStop(1, 'transparent')
      ctx.fillStyle = orb
      ctx.fillRect(0, 0, W, H)

      particles.forEach((p) => {
        p.x += p.vx
        p.y += p.vy
        p.life -= 0.003
        if (p.life <= 0) {
          p.x = Math.random() * W
          p.y = H + 10
          p.life = Math.random() + 0.3
        }
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = dark ? `rgba(244,124,32,${p.life * 0.25})` : `rgba(244,124,32,${p.life * 0.18})`
        ctx.fill()
      })

      const beams = [
        { x: W * 0.05, y1: 0, y2: H, speed: 0.4 },
        { x: W * 0.62, y1: 0, y2: H, speed: 0.25 },
      ]
      t += 0.004
      const beamAlpha = dark ? 0.06 : 0.04
      beams.forEach((b, i) => {
        const prog = (t * b.speed + i * 0.4) % 1
        const yc = b.y1 + (b.y2 - b.y1) * prog
        const g = ctx.createLinearGradient(0, yc - 120, 0, yc + 120)
        g.addColorStop(0, 'transparent')
        g.addColorStop(0.5, `rgba(244,124,32,${beamAlpha})`)
        g.addColorStop(1, 'transparent')
        ctx.fillStyle = g
        ctx.fillRect(b.x - 1, yc - 120, 2, 240)
      })

      if (!prefersReducedMotion) {
        animationId = requestAnimationFrame(draw)
      }
    }

    const onVisibilityChange = () => {
      isVisible = document.visibilityState === 'visible'
    }

    resize()
    draw()
    document.addEventListener('visibilitychange', onVisibilityChange)
    window.addEventListener('resize', resize)
    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange)
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(animationId)
    }
  }, [])

  return <canvas id="login-bg-canvas" ref={canvasRef} className="login-canvas" aria-hidden="true" />
}
