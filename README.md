# BurstTape

Trades do not arrive one by one at a steady beat. One fill often sparks a short run of more fills, then the tape goes quiet. A flat rate pretends each arrival is independent and misses that aftershock.

I fit a univariate Hawkes process (exponential kernel) that lets the rate jump after each event and fade, and I score it against a flat Poisson rate on later events it did not train on. The number I trust is how often the aftershock model wins that held-out stretch.

Synthetic Hawkes with planted self-excitation so likelihood / intensity scores are fair. Chronological split. Optional public ticks only if free and capped.

## Run

```bash
python -m pytest tests/ -q
python scripts/run.py
npm --prefix web install
npm --prefix web run dev
```

`scripts/run.py` prints Hawkes vs Poisson. Future-event leak must fail in pytest.

## Layout

- `src/` generator, MLE, eval
- `scripts/run.py`
- `tests/` leak checks
- `web/` case-study page
