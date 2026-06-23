import type { CSSProperties } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useTheme } from './ThemeProvider'
import type { ResolvedTheme } from '../lib/theme'

const GIRLY_FLOATERS = ['✨', '💖', '🌸', '🎀', '♡', '⭐', '✨', '💖'] as const
const GIRLY2_FLOATERS = ['✨', '💜', '⭐', '🦋', '✦', '💟', '🌙', '✨'] as const

const BURST_ICONS: Record<'girly' | 'girly2', string[]> = {
  girly: ['✨', '💖', '⭐', '🎀', '♡', '✦'],
  girly2: ['✨', '💜', '⭐', '🦋', '✦', '💟'],
}

function randomBetween(min: number, max: number) {
  return min + Math.random() * (max - min)
}

function getAmbienceConfig(resolved: ResolvedTheme) {
  if (resolved === 'girly2') {
    return {
      floaters: GIRLY2_FLOATERS,
      gridClass: 'girly2-pixel-grid',
      floaterClass: 'girly2-floater',
    }
  }

  return {
    floaters: GIRLY_FLOATERS,
    gridClass: 'girly-pixel-grid',
    floaterClass: 'girly-floater',
  }
}

export function GirlyAmbience() {
  const { resolved } = useTheme()

  const sparkles = useMemo(
    () =>
      Array.from({ length: 8 }, (_, index) => ({
        id: index,
        left: `${randomBetween(4, 92)}%`,
        top: `${randomBetween(6, 88)}%`,
        delay: `${randomBetween(0, 6).toFixed(1)}s`,
        duration: `${randomBetween(5, 9).toFixed(1)}s`,
        size: randomBetween(0.75, 1.35).toFixed(2),
      })),
    [],
  )

  if (resolved !== 'girly' && resolved !== 'girly2') {
    return null
  }

  const config = getAmbienceConfig(resolved)

  return (
    <div className="girly-ambience pointer-events-none fixed inset-0 z-[5] overflow-hidden" aria-hidden>
      <div className={`${config.gridClass} absolute inset-0`} />
      {sparkles.map((sparkle, index) => (
        <span
          key={sparkle.id}
          className={`${config.floaterClass} absolute select-none`}
          style={{
            left: sparkle.left,
            top: sparkle.top,
            animationDelay: sparkle.delay,
            animationDuration: sparkle.duration,
            fontSize: `${sparkle.size}rem`,
          }}
        >
          {config.floaters[index % config.floaters.length]}
        </span>
      ))}
    </div>
  )
}

interface BurstParticle {
  id: number
  x: number
  y: number
  icon: string
  dx: number
  dy: number
}

export function ThemeSparkleBurst() {
  const { theme } = useTheme()
  const prevTheme = useRef(theme)
  const [particles, setParticles] = useState<BurstParticle[]>([])

  useEffect(() => {
    const isDecorative = theme === 'girly' || theme === 'girly2'
    const wasDecorative = prevTheme.current === 'girly' || prevTheme.current === 'girly2'

    if (isDecorative && !wasDecorative) {
      const icons = BURST_ICONS[theme as 'girly' | 'girly2']
      const originX = window.innerWidth - 36
      const originY = 36

      const next = Array.from({ length: 12 }, (_, index) => {
        const angle = (Math.PI * 2 * index) / 12 + randomBetween(-0.2, 0.2)
        const distance = randomBetween(36, 88)
        return {
          id: Date.now() + index,
          x: originX,
          y: originY,
          icon: icons[index % icons.length],
          dx: Math.cos(angle) * distance,
          dy: Math.sin(angle) * distance,
        }
      })

      setParticles(next)
      const timer = window.setTimeout(() => setParticles([]), 900)
      prevTheme.current = theme
      return () => window.clearTimeout(timer)
    }

    if (isDecorative && wasDecorative && theme !== prevTheme.current) {
      const icons = BURST_ICONS[theme as 'girly' | 'girly2']
      const originX = window.innerWidth - 36
      const originY = 36

      const next = Array.from({ length: 12 }, (_, index) => {
        const angle = (Math.PI * 2 * index) / 12 + randomBetween(-0.2, 0.2)
        const distance = randomBetween(36, 88)
        return {
          id: Date.now() + index,
          x: originX,
          y: originY,
          icon: icons[index % icons.length],
          dx: Math.cos(angle) * distance,
          dy: Math.sin(angle) * distance,
        }
      })

      setParticles(next)
      const timer = window.setTimeout(() => setParticles([]), 900)
      prevTheme.current = theme
      return () => window.clearTimeout(timer)
    }

    prevTheme.current = theme
  }, [theme])

  if (particles.length === 0) {
    return null
  }

  return (
    <div className="pointer-events-none fixed inset-0 z-[60]" aria-hidden>
      {particles.map((particle) => (
        <span
          key={particle.id}
          className="girly-burst-particle absolute text-lg"
          style={
            {
              left: particle.x,
              top: particle.y,
              '--dx': `${particle.dx}px`,
              '--dy': `${particle.dy}px`,
            } as CSSProperties
          }
        >
          {particle.icon}
        </span>
      ))}
    </div>
  )
}
