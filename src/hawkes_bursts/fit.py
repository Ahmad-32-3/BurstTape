# Thin exponential-kernel Hawkes MLE and a homogeneous Poisson MLE.
# ponytail: scipy L-BFGS-B; tick/hawkeslib skipped.

import numpy as np
from scipy.optimize import minimize


def poisson_rate(train, t_cut):
    return len(train) / t_cut


def poisson_loglik(n_events, duration, rate):
    if rate <= 0:
        return -np.inf
    return n_events * np.log(rate) - rate * duration


def hawkes_loglik(times, t0, t1, mu, alpha, beta, history):
    """Log-likelihood of events in (t0, t1] with past history at or before t0."""
    if mu <= 0 or alpha < 0 or beta <= 0:
        return -np.inf
    events = times[(times >= t0) & (times <= t1)]
    past = history[history < t0]
    t_prev = t0
    r = np.exp(-beta * (t0 - past)).sum() if len(past) else 0.0
    ll = 0.0
    for t in events:
        r *= np.exp(-beta * (t - t_prev))
        lam = mu + alpha * r
        if lam <= 0:
            return -np.inf
        ll += np.log(lam)
        r += 1.0
        t_prev = t
    all_past = np.concatenate([past, events]) if len(events) else past
    ll -= _compensator(t0, t1, all_past, mu, alpha, beta)
    return float(ll)


def _compensator(t0, t1, times, mu, alpha, beta):
    dt = t1 - t0
    if dt <= 0:
        return 0.0
    contrib = 0.0
    if len(times):
        early = times[times < t0]
        if len(early):
            contrib += np.exp(-beta * (t0 - early)).sum() - np.exp(-beta * (t1 - early)).sum()
        mid = times[(times >= t0) & (times < t1)]
        if len(mid):
            contrib += len(mid) - np.exp(-beta * (t1 - mid)).sum()
    return mu * dt + (alpha / beta) * contrib


def fit_hawkes(train, t_cut, x0=None, freeze_mu=None):
    """MLE of (μ, α, β) on [0, t_cut]. freeze_mu locks the background rate."""
    n = len(train)
    rate = n / t_cut
    empty = np.empty(0)

    if freeze_mu is not None:
        mu0 = float(freeze_mu)

        def nll_ab(x):
            alpha, beta = x
            if alpha >= beta:
                return 1e12  # ponytail: hard wall; reparam β=α+exp(g) if L-BFGS hugs α≈β
            return -hawkes_loglik(train, 0.0, t_cut, mu0, alpha, beta, empty)

        res = minimize(
            nll_ab,
            np.array([max(rate * 0.4, 1e-4), 1.0]),
            method="L-BFGS-B",
            bounds=[(1e-8, 20.0), (1e-3, 50.0)],
        )
        alpha, beta = res.x
        if not res.success or alpha >= beta or not np.isfinite(res.fun):
            return {"mu": mu0, "alpha": 0.0, "beta": 1.0, "ok": False}
        return {"mu": mu0, "alpha": float(alpha), "beta": float(beta), "ok": True}

    if x0 is None:
        x0 = np.array([rate * 0.4, rate * 0.4, 1.0], dtype=float)

    def nll(x):
        mu, alpha, beta = x
        if alpha >= beta:
            return 1e12  # ponytail: hard wall; reparam β=α+exp(g) if L-BFGS hugs α≈β
        return -hawkes_loglik(train, 0.0, t_cut, mu, alpha, beta, empty)

    bounds = [(1e-6, 20.0), (1e-8, 20.0), (1e-3, 50.0)]
    res = minimize(nll, x0, method="L-BFGS-B", bounds=bounds)
    mu, alpha, beta = res.x
    if not res.success or alpha >= beta or not np.isfinite(res.fun):
        return {"mu": rate, "alpha": 0.0, "beta": 1.0, "ok": False}
    return {"mu": float(mu), "alpha": float(alpha), "beta": float(beta), "ok": True}
