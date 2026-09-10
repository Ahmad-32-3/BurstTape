// Aftershock intensity versus a flat Poisson rate. Hand SVG. ADR: Bklit editorial chart.

import { TRACE } from '../../data'

const W = 340
const H = 220
const PAD = { l: 40, r: 12, t: 16, b: 36 }

export function IntensityViz() {
  const tMax = Math.max(...TRACE.t, 1)
  const yMax = Math.max(...TRACE.hawkes, ...TRACE.poisson, 1) * 1.08
  const plotW = W - PAD.l - PAD.r
  const plotH = H - PAD.t - PAD.b
  const x = (v: number) => PAD.l + (v / tMax) * plotW
  const y = (v: number) => PAD.t + plotH - (v / yMax) * plotH
  const line = (ys: readonly number[]) =>
    TRACE.t.map((ti, i) => `${i === 0 ? 'M' : 'L'}${x(ti).toFixed(1)},${y(ys[i] ?? 0).toFixed(1)}`).join(' ')

  return (
    <div className="chart-wrap">
      <svg
        className="chart-svg"
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label="Rate jumps after each arrival then fades. The flat line stays put."
      >
        {[0, 0.5, 1].map((frac) => {
          const v = yMax * frac
          return (
            <g key={frac}>
              <line
                x1={PAD.l}
                x2={W - PAD.r}
                y1={y(v)}
                y2={y(v)}
                stroke="var(--chart-grid)"
                strokeWidth="1"
              />
              <text
                x={PAD.l - 6}
                y={y(v) + 3}
                textAnchor="end"
                fontSize="10"
                fill="var(--chart-label)"
                fontFamily="var(--font-mono)"
              >
                {v.toFixed(1)}
              </text>
            </g>
          )
        })}
        <path
          className="draw-line"
          d={line(TRACE.poisson)}
          fill="none"
          stroke="var(--chart-baseline)"
          strokeWidth="1.6"
          strokeDasharray="4 3"
          pathLength={1}
        />
        <path
          className="draw-line"
          d={line(TRACE.hawkes)}
          fill="none"
          stroke="var(--chart-method)"
          strokeWidth="2.2"
          strokeLinejoin="round"
          pathLength={1}
        />
        {TRACE.events.map((t, i) => (
          <line
            key={`${t}-${i}`}
            x1={x(t)}
            x2={x(t)}
            y1={H - PAD.b}
            y2={H - PAD.b + 8}
            stroke="var(--chart-method)"
            strokeWidth="1.2"
          />
        ))}
        <text x={PAD.l} y={12} fontSize="11" fill="var(--chart-method)" fontFamily="var(--font-mono)">
          aftershock rate
        </text>
        <text x={W - PAD.r} y={12} textAnchor="end" fontSize="11" fill="var(--chart-baseline)" fontFamily="var(--font-mono)">
          flat rate
        </text>
        <text x={(PAD.l + W - PAD.r) / 2} y={H - 6} textAnchor="middle" fontSize="11" fill="var(--chart-label)" fontFamily="var(--font-mono)">
          time
        </text>
      </svg>
    </div>
  )
}
