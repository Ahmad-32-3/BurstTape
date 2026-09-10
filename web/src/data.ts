// Copy and counters. Measured numbers live in metrics.gen.ts.

export {
  ABLATION,
  ILLUSTRATIVE,
  METRICS,
  PROTOCOL,
  TRACE,
} from './metrics.gen'

import { METRICS, PROTOCOL } from './metrics.gen'

export type Counter = { key: string; label: string; value: number; unit: string; note: string }

export const COUNTERS: Counter[] = [
  {
    key: 'success',
    label: 'Hawkes win rate',
    value: METRICS.successPct,
    unit: '%',
    note: 'held-out streams where aftershock loglik beats Poisson',
  },
  {
    key: 'poisson',
    label: 'Poisson win rate',
    value: METRICS.poissonPct,
    unit: '%',
    note: 'same split, flat rate as the baseline',
  },
  {
    key: 'streams',
    label: 'Streams scored',
    value: METRICS.nStreams,
    unit: '',
    note: `${METRICS.nEvents} events each, first ${PROTOCOL.trainFrac * 100}% of time for training`,
  },
  {
    key: 'events',
    label: 'Events per stream',
    value: METRICS.nEvents,
    unit: '',
    note: `cap ${PROTOCOL.maxEvents} events, ${PROTOCOL.maxStreams} streams`,
  },
]

export const DECISIONS = [
  {
    first: 'Replay a full limit-order book and fit a multivariate zoo',
    built: 'Plant univariate aftershocks and score a thin exponential kernel against Poisson',
  },
  {
    first: 'Shuffle events at random for a train/test split',
    built: 'Cut by time so later arrivals never help fit the earlier stretch',
  },
  {
    first: 'Report a single log-likelihood and stop',
    built: 'Report how often Hawkes beats Poisson on held-out streams, next to the Poisson column',
  },
  {
    first: 'Pull in tick or hawkeslib for the fit',
    built: 'Keep the MLE in numpy plus one scipy call',
  },
] as const

export type Tool = { name: string; tag: string; plain: string; tech: string }

export const STACK: Tool[] = [
  {
    name: 'numpy',
    tag: 'sim',
    plain: 'Draws the arrival times and does the array math for the rate.',
    tech: 'Ogata thinning for an exponential Hawkes process. Recursive intensity for the log-likelihood.',
  },
  {
    name: 'scipy L-BFGS-B',
    tag: 'fit',
    plain: 'Finds the background rate and the aftershock size and decay.',
    tech: 'Thin MLE of (μ, α, β) with α < β. Poisson MLE is n/T, closed form.',
  },
  {
    name: 'Chronological holdout',
    tag: 'eval',
    plain: 'Trains on the early stretch and scores the later one.',
    tech: `Cut at ${PROTOCOL.trainFrac} of the last event time. Leak injection in tests/test_eval.py must raise.`,
  },
  {
    name: 'pytest',
    tag: 'test',
    plain: 'Fails if a future arrival sneaks into training.',
    tech: 'Concatenates holdout times into train and expects ValueError matching leak.',
  },
  {
    name: 'Vite + React + Tailwind',
    tag: 'page',
    plain: 'Builds this walkthrough from a static metrics file.',
    tech: 'No live API. Charts are SVG that read metrics.gen.ts.',
  },
  {
    name: 'motion',
    tag: 'motion',
    plain: 'Rolls the result numbers when they enter view.',
    tech: 'Counter tween via motion/react animate(); no travel when prefers-reduced-motion is set.',
  },
]

export const NEXT = [
  'Try a public tick file if one is free and capped, and keep the same chronological split.',
  'Add a power-law kernel column next to the exponential one.',
  'Score next-interval hit rate beside loglik win rate on the same streams.',
]

export const SECTORS = [
  {
    name: 'Market microstructure research',
    job: 'Check whether a burst of prints is self-exciting or just a higher flat rate.',
  },
  {
    name: 'Burst risk',
    job: 'Flag stretches where one trade makes more trades likely, instead of treating the tape as independent.',
  },
  {
    name: 'Spoofing forensics (offline)',
    job: 'Compare aftershock shapes around a quoted burst without turning this into a live detector.',
  },
]
