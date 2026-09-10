# Ogata thinning for a univariate exponential Hawkes process.

import numpy as np


def simulate_exp_hawkes(mu, alpha, beta, n_events, rng):
    """Return n_events increasing times. Stationarity: alpha < beta."""
    times = np.empty(n_events, dtype=float)
    t = 0.0
    lam_star = mu
    filled = 0
    while filled < n_events:
        t += rng.exponential(1.0 / lam_star)
        if filled == 0:
            lam = mu
        else:
            lam = mu + alpha * np.exp(-beta * (t - times[:filled])).sum()
        if rng.random() * lam_star <= lam:
            times[filled] = t
            filled += 1
            lam_star = lam + alpha
        else:
            lam_star = max(lam, mu)
    return times
