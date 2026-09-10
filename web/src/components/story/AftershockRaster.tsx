// Event ticks on a short stretch. Clumps are the aftershocks a flat rate misses.

import { TRACE } from '../../data'

const W = 340
const H = 120
const PAD = { l: 12, r: 12, t: 28, b: 28 }

export function AftershockRaster() {
  const tMax = Math.max(...TRACE.t, 1)
  const plotW = W - PAD.l - PAD.r
  const x = (v: number) => PAD.l + (v / tMax) * plotW
  const y = H / 2

  return (
    <div className="chart-wrap">
      <svg
        className="chart-svg"
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label="Arrival times clump after some events, then go quiet."
      >
        <line
          x1={PAD.l}
          x2={W - PAD.r}
          y1={y}
          y2={y}
          stroke="var(--chart-grid)"
          strokeWidth="1"
        />
        {TRACE.events.map((t, i) => (
          <line
            key={`${t}-${i}`}
            x1={x(t)}
            x2={x(t)}
            y1={y - 22}
            y2={y + 22}
            stroke="var(--chart-method)"
            strokeWidth="1.4"
            opacity="0.85"
          />
        ))}
        <text x={PAD.l} y={16} fontSize="11" fill="var(--chart-label)" fontFamily="var(--font-mono)">
          arrivals
        </text>
        <text x={(PAD.l + W - PAD.r) / 2} y={H - 8} textAnchor="middle" fontSize="11" fill="var(--chart-label)" fontFamily="var(--font-mono)">
          time
        </text>
      </svg>
    </div>
  )
}
