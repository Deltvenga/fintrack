import type { CSSProperties } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useTheme } from './ThemeProvider'
import { isDecorativeTheme, type DecorativeTheme, type ResolvedTheme } from '../lib/theme'

const GIRLY_FLOATERS = ['✨', '💖', '🌸', '🎀', '♡', '⭐', '✨', '💖'] as const
const GIRLY2_FLOATERS = ['✨', '💜', '⭐', '🦋', '✦', '💟', '🌙', '✨'] as const
const SYNTH_FLOATERS = ['⚡', '🌆', '💿', '🎹', '✦', '🔮', '🌃', '⚡'] as const
const ACID_FLOATERS = ['🌀', '🤡', '💀', '🌈', '⚠️', '🔥', '👁️', '💊'] as const

const BURST_ICONS: Record<DecorativeTheme, string[]> = {
  girly: ['✨', '💖', '⭐', '🎀', '♡', '✦'],
  girly2: ['✨', '💜', '⭐', '🦋', '✦', '💟'],
  synth: ['⚡', '🌆', '💿', '✦', '🔮', '🎹'],
  acid: ['🌀', '🤡', '💀', '🌈', '⚠️', '🔥'],
  eva: ['🤖', '⚡', '🔺', '👁️', '🟢', '💜'],
}

function randomBetween(min: number, max: number) {
  return min + Math.random() * (max - min)
}

function getAmbienceConfig(resolved: DecorativeTheme) {
  if (resolved === 'girly2') {
    return {
      floaters: GIRLY2_FLOATERS,
      gridClass: 'girly2-pixel-grid',
      floaterClass: 'girly2-floater',
      extraLayers: null,
    }
  }

  if (resolved === 'synth') {
    return {
      floaters: SYNTH_FLOATERS,
      gridClass: 'synth-horizon-grid',
      floaterClass: 'synth-floater',
      extraLayers: 'synth-scanlines',
    }
  }

  if (resolved === 'acid') {
    return {
      floaters: ACID_FLOATERS,
      gridClass: 'acid-vortex-grid',
      floaterClass: 'acid-floater',
      extraLayers: 'acid-rgb-split acid-scanlines',
    }
  }

  return {
    floaters: GIRLY_FLOATERS,
    gridClass: 'girly-pixel-grid',
    floaterClass: 'girly-floater',
    extraLayers: null,
  }
}

function isDecorativeResolved(resolved: ResolvedTheme): resolved is DecorativeTheme {
  return isDecorativeTheme(resolved)
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

  if (!isDecorativeResolved(resolved) || resolved === 'eva') {
    return null
  }

  const config = getAmbienceConfig(resolved)

  return (
    <div className="girly-ambience pointer-events-none fixed inset-0 z-[5] overflow-hidden" aria-hidden>
      <div className={`${config.gridClass} absolute inset-0`} />
      {config.extraLayers ? <div className={`${config.extraLayers} absolute inset-0`} /> : null}
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

function isDecorativeThemeValue(theme: string): theme is DecorativeTheme {
  return theme === 'girly' || theme === 'girly2' || theme === 'synth' || theme === 'acid' || theme === 'eva'
}

export function ThemeSparkleBurst() {
  const { theme } = useTheme()
  const prevTheme = useRef(theme)
  const [particles, setParticles] = useState<BurstParticle[]>([])

  useEffect(() => {
    const isDecorative = isDecorativeThemeValue(theme)
    const wasDecorative = isDecorativeThemeValue(prevTheme.current)

    if (isDecorative && !wasDecorative) {
      const icons = BURST_ICONS[theme]
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
      const icons = BURST_ICONS[theme]
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
