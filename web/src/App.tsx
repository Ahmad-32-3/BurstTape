import { AblationBars } from './components/story/AblationBars'
import { AftershockRaster } from './components/story/AftershockRaster'
import { IntensityViz } from './components/story/IntensityViz'
import { ResultBento } from './components/story/ResultBento'
import { StackGrid } from './components/story/StackGrid'
import { StoryBeat } from './components/story/StoryBeat'
import { ABLATION, DECISIONS, ILLUSTRATIVE, METRICS, NEXT, PROTOCOL, SECTORS } from './data'

const TOC = [
  { href: '#problem', label: 'The problem' },
  { href: '#answer', label: 'The answer' },
  { href: '#result', label: 'The result' },
  { href: '#stack', label: 'Tech stack' },
  { href: '#decisions', label: 'Design decisions' },
  { href: '#next', label: 'Next and real world' },
  { href: '#close', label: 'Close' },
]

const NOTE = ILLUSTRATIVE
  ? ' These numbers are illustrative until a measured run overwrites data.ts.'
  : ''

export function App() {
  return (
    <>
      <a className="skip-link" href="#problem">
        Skip to the walkthrough
      </a>

      {ILLUSTRATIVE ? (
        <div className="banner" role="status">
          Illustrative numbers. Do not read these as a measured Hawkes result.
        </div>
      ) : null}

      <div className="masthead">
        <div className="masthead__inner">
          <div className="masthead__mark">
            <b>BurstTape</b> · aftershocks versus a flat rate
          </div>
          <nav aria-label="Site sections">
            <ul className="masthead__nav">
              <li>
                <a href="#problem">problem</a>
              </li>
              <li>
                <a href="#result">result</a>
              </li>
              <li>
                <a href="#decisions">decisions</a>
              </li>
              <li>
                <a href="#next">next</a>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      <main className="page">
        <header className="page-hero">
          <p className="meta">Walkthrough · self-exciting arrivals versus Poisson</p>
          <h1>BurstTape</h1>
          <p className="lead">
            Trades do not arrive one by one at a steady beat. One fill often sparks a short run of more
            fills, then the tape goes quiet again. A flat rate pretends each arrival is independent and
            misses that aftershock. I fit a model that lets the rate jump after each event and fade, and
            I compare it to a flat Poisson rate on later events it did not train on. The number I trust
            is how often the aftershock model scores that held-out stretch better than the flat rate.
          </p>
          <p className="intro-detail">
            I plant the aftershocks myself ({METRICS.nStreams} streams, {METRICS.nEvents} events each)
            so the comparison is fair. Training is the first {PROTOCOL.trainFrac * 100}% of time on each
            stream. The later stretch is the test. Poisson is the debug column, not a hidden footnote.
            {ILLUSTRATIVE
              ? ' Numbers below are labeled illustrative.'
              : ` Measured win rate is ${METRICS.successPct}%.`}
          </p>
          <nav aria-label="On this page">
            <ul className="toc">
              {TOC.map((item) => (
                <li key={item.href}>
                  <a href={item.href}>{item.label}</a>
                </li>
              ))}
            </ul>
          </nav>
        </header>

        <StoryBeat
          id="problem"
          kicker="The problem"
          title="A clump of prints is not the same as a higher average"
          caption="Each tick is an arrival. They bunch, then sit still. A flat rate only sees the average."
          visual={<AftershockRaster />}
        >
          <p>
            On a busy tape, one trade often pulls more trades in behind it. The next few seconds are
            hot. Then the burst dies and the market waits. If I only quote a single average rate, those
            quiet gaps and those tight clumps look the same.
          </p>
          <p>
            That is the miss. Risk, spoofing forensics, and microstructure work all care whether the
            next print is more likely because something just happened, not because the day is busy in
            general.
          </p>
        </StoryBeat>

        <StoryBeat
          id="answer"
          kicker="The answer"
          title="Let the rate jump, then fade. Score the later stretch."
          caption="The solid line is the aftershock rate. The dashed line is a flat Poisson rate on the same arrivals."
          visual={<IntensityViz />}
        >
          <p>
            I generate a univariate point process with planted self-excitation: each event adds a bump
            to the rate that decays exponentially. That bump is the aftershock. The usual name for the
            model is a Hawkes process. I fit the background rate and the bump on the early part of each
            stream.
          </p>
          <p>
            Then I freeze those numbers and score log-likelihood on the later part. A homogeneous
            Poisson fit, just n over T from training, gets the same holdout. If the aftershock is real,
            Hawkes should explain the held-out arrivals better. Using a future print to fit the past is
            a failed leak check.
          </p>
        </StoryBeat>

        <StoryBeat
          id="result"
          kicker="The result"
          title={`${METRICS.successPct}% of held-out streams prefer the aftershock model`}
          caption={`Win rate against Poisson on the same chronological cut. The dashed grid line is the 85% floor.${NOTE}`}
          visual={
            <>
              <ResultBento />
              <AblationBars />
              <div className="compare-table-wrap" style={{ marginTop: '1rem' }}>
                <table className="compare-table">
                  <caption className="sr-only">Ablation holdout loglik and win rate versus Poisson</caption>
                  <thead>
                    <tr>
                      <th scope="col">Model</th>
                      <th scope="col">Kernel</th>
                      <th scope="col">Background μ</th>
                      <th scope="col">Holdout loglik</th>
                      <th scope="col">Win %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ABLATION.map((row) => (
                      <tr key={row.model}>
                        <td>{row.label}</td>
                        <td>{row.kernel}</td>
                        <td>{row.mu}</td>
                        <td>{row.llHoldout.toFixed(1)}</td>
                        <td>{row.successPct}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          }
        >
          <p>
            On {METRICS.nStreams} synthetic streams, Hawkes beat Poisson on the held-out stretch{' '}
            {METRICS.successPct}% of the time. Mean holdout log-likelihood is {METRICS.llHawkes.toFixed(1)}{' '}
            against {METRICS.llPoisson.toFixed(1)} for Poisson. The floor is {PROTOCOL.floorPct}%. The
            aim is 90 to 95. This run sits above both.
          </p>
          <p>
            Turning the kernel off (plain Poisson) wins 0% against itself. Freezing μ at the training
            rate and still fitting the aftershock still wins most streams. Locking μ at twice that rate
            wrecks the score. The bump in the rate is the headline. Getting μ wrong still hurts.
          </p>
        </StoryBeat>

        <StoryBeat
          id="stack"
          kicker="Tech stack"
          title="What simulates the bursts and what draws the page"
          caption="Each tool in one plain sentence, then a short technical line."
          visual={<StackGrid />}
        >
          <p>
            Python draws the arrivals and fits the two rates. Vite builds the page. React draws it.
            Tailwind styles it. Motion rolls the bento numbers and respects reduced motion.
          </p>
        </StoryBeat>

        <StoryBeat
          id="decisions"
          kicker="Design decisions"
          title="Why a planted aftershock before a live order book"
          caption="Each row is a path I could have taken, and the one I took instead."
        >
          <ul className="decision-list">
            {DECISIONS.map((d) => (
              <li key={d.built}>
                <span className="decision-first">{d.first}</span>
                <span className="decision-built">{d.built}</span>
              </li>
            ))}
          </ul>
        </StoryBeat>

        <StoryBeat
          id="next"
          kicker="Improve · run · real world"
          title="What is weak, how to run it, who can use it today"
          caption="Exact commands below. Sectors are jobs, not a pitch deck."
        >
          <h3>What I would improve</h3>
          <ul>
            {NEXT.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
          <h3>Run on your machine</h3>
          <pre className="code-block">
            <code>{`python -m pip install numpy scipy pytest
python -m pytest tests/test_eval.py -q
python scripts/run.py
npm --prefix web install
npm --prefix web run dev`}</code>
          </pre>
          <h3>How this applies today</h3>
          <ul>
            {SECTORS.map((s) => (
              <li key={s.name}>
                <strong>{s.name}.</strong> {s.job}
              </li>
            ))}
          </ul>
        </StoryBeat>

        <section className="story-beat" id="close">
          <div className="story-beat__grid">
            <div className="story-beat__copy">
              <p className="story-kicker">Close</p>
              <h2>I wanted the aftershock in the rate, measured against a flat Poisson</h2>
              <div className="story-prose">
                <p>
                  On these planted streams, the model that jumps after each event explains held-out
                  arrivals better than a constant rate. The Poisson column stays on the page so that
                  percentage cannot stand alone.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  )
}
