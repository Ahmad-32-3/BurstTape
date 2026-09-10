// Ablation win rates on the same chronological holdout. Hand SVG.

import { ABLATION } from '../../data'

const W = 340
const H = 220
const PAD = { l: 118, r: 36, t: 12, b: 28 }

export function AblationBars() {
  const rows = ABLATION
  const n = rows.length
  const plotW = W - PAD.l - PAD.r
  const plotH = H - PAD.t - PAD.b
  const rowH = plotH / n
  const x = (v: number) => PAD.l + (v / 100) * plotW

  return (
    <div className="chart-wrap">
      <svg
        className="chart-svg"
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label="Win rate against Poisson for each ablation column."
      >
        {[0, 50, 85, 100].map((t) => (
          <g key={t}>
            <line
              x1={x(t)}
              x2={x(t)}
              y1={PAD.t}
              y2={H - PAD.b}
              stroke="var(--chart-grid)"
              strokeWidth="1"
              strokeDasharray={t === 85 ? '4 3' : undefined}
            />
            <text
              x={x(t)}
              y={H - 8}
              textAnchor="middle"
              fontSize="10"
              fill="var(--chart-label)"
              fontFamily="var(--font-mono)"
            >
              {t}
            </text>
          </g>
        ))}
        {rows.map((r, i) => {
          const cy = PAD.t + rowH * i + rowH / 2
          const fill = r.model === 'exp_full' ? 'var(--chart-method)' : 'var(--chart-raw)'
          return (
            <g key={r.model}>
              <text
                x={PAD.l - 8}
                y={cy + 3}
                textAnchor="end"
                fontSize="10"
                fill="var(--chart-label)"
                fontFamily="var(--font-mono)"
              >
                {r.label}
              </text>
              <rect
                x={PAD.l}
                y={cy - 8}
                width={Math.max((r.successPct / 100) * plotW, 1)}
                height={16}
                fill={fill}
              />
              <text
                x={x(r.successPct) + 6}
                y={cy + 3}
                fontSize="10"
                fill="var(--fg-hi)"
                fontFamily="var(--font-mono)"
              >
                {r.successPct.toFixed(r.successPct % 1 === 0 ? 0 : 1)}%
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}
