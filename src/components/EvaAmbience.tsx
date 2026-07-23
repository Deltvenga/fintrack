import { useMemo } from 'react'
import { useTheme } from './ThemeProvider'

const EVA_ASSETS = {
  atField: '/themes/eva/at-field.svg',
  unit01: '/themes/eva/unit01.svg',
  nervPanel: '/themes/eva/nerv-panel.svg',
  lcl: '/themes/eva/lcl-bg.svg',
  warningStripe: '/themes/eva/warning-stripe.svg',
} as const

function randomBetween(min: number, max: number) {
  return min + Math.random() * (max - min)
}

export function EvaAmbience() {
  const { resolved } = useTheme()

  const hexFloaters = useMemo(
    () =>
      Array.from({ length: 6 }, (_, index) => ({
        id: index,
        left: `${randomBetween(8, 88)}%`,
        top: `${randomBetween(12, 82)}%`,
        delay: `${randomBetween(0, 5).toFixed(1)}s`,
        duration: `${randomBetween(6, 11).toFixed(1)}s`,
        scale: randomBetween(0.35, 0.75).toFixed(2),
        rotate: `${randomBetween(-20, 20).toFixed(0)}deg`,
      })),
    [],
  )

  if (resolved !== 'eva') {
    return null
  }

  return (
    <div className="eva-ambience pointer-events-none fixed inset-0 z-[5] overflow-hidden" aria-hidden>
      <img
        src={EVA_ASSETS.lcl}
        alt=""
        className="eva-lcl-layer absolute inset-0 h-full w-full object-cover"
      />
      <img
        src={EVA_ASSETS.atField}
        alt=""
        className="eva-at-field-bg absolute left-1/2 top-1/2 h-[min(90vw,420px)] w-[min(90vw,420px)] -translate-x-1/2 -translate-y-1/2 opacity-40"
      />
      <img
        src={EVA_ASSETS.unit01}
        alt=""
        className="eva-unit-watermark absolute -right-8 bottom-8 h-[min(70vh,480px)] w-auto opacity-[0.18]"
      />
      <div className="eva-horizon-grid absolute inset-0" />
      <div className="eva-scanlines absolute inset-0" />
      <div className="eva-hud-grid absolute inset-0" />

      <img
        src={EVA_ASSETS.nervPanel}
        alt=""
        className="eva-nerv-panel absolute left-0 right-0 top-14 mx-auto hidden h-12 w-[min(92vw,360px)] opacity-90 sm:block"
      />

      <div
        className="eva-warning-edge absolute bottom-0 left-0 top-0 w-3 bg-repeat-y opacity-80"
        style={{ backgroundImage: `url(${EVA_ASSETS.warningStripe})`, backgroundSize: '12px 60px' }}
      />
      <div
        className="eva-warning-edge absolute bottom-0 right-0 top-0 w-3 bg-repeat-y opacity-80"
        style={{ backgroundImage: `url(${EVA_ASSETS.warningStripe})`, backgroundSize: '12px 60px' }}
      />

      {hexFloaters.map((item) => (
        <img
          key={item.id}
          src={EVA_ASSETS.atField}
          alt=""
          className="eva-hex-floater absolute"
          style={{
            left: item.left,
            top: item.top,
            animationDelay: item.delay,
            animationDuration: item.duration,
            transform: `scale(${item.scale}) rotate(${item.rotate})`,
            width: '72px',
            height: '72px',
            opacity: 0.22,
          }}
        />
      ))}

      <div className="eva-terminal-marquee absolute bottom-24 left-0 right-0 overflow-hidden opacity-50">
        <p className="eva-marquee-text whitespace-nowrap text-[10px] tracking-[0.35em] text-[#ff6600]">
          ▌WARNING▐ PATTERN BLUE ▌AT FIELD DEPLOYED ▌SYNC RATIO 400% ▌LCL DENSITY NORMAL ▌MAGI
          APPROVED ▌
        </p>
      </div>
    </div>
  )
}
