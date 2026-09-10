# Holdout loglik win rate: Hawkes vs homogeneous Poisson. Locked DESIGN metric.

import numpy as np

from . import const
from .fit import fit_hawkes, hawkes_loglik, poisson_loglik, poisson_rate
from .simulate import simulate_exp_hawkes
from .split import chronological_split


def score_stream(times, train_frac=const.TRAIN_FRAC):
    train, test, t_cut, t_end = chronological_split(times, train_frac)
    lam_p = poisson_rate(train, t_cut)
    ll_p = poisson_loglik(len(test), t_end - t_cut, lam_p)
    fit = fit_hawkes(train, t_cut)
    ll_h = hawkes_loglik(test, t_cut, t_end, fit["mu"], fit["alpha"], fit["beta"], train)
    return {
        "ll_hawkes": ll_h,
        "ll_poisson": ll_p,
        "win": ll_h > ll_p,
        "n_train": int(len(train)),
        "n_test": int(len(test)),
        "t_cut": t_cut,
        "t_end": t_end,
        "poisson_rate": lam_p,
        **fit,
    }


def evaluate(
    n_streams=const.N_STREAMS,
    n_events=const.N_EVENTS,
    seed=const.SEED,
    mu=const.MU,
    alpha=const.ALPHA,
    beta=const.BETA,
    train_frac=const.TRAIN_FRAC,
):
    if n_events > const.MAX_EVENTS:
        raise ValueError(f"HARD FAIL: {n_events} events over cap {const.MAX_EVENTS}")
    if n_streams > const.MAX_STREAMS:
        raise ValueError(f"HARD FAIL: {n_streams} streams over cap {const.MAX_STREAMS}")
    rng = np.random.default_rng(seed)
    rows = []
    for i in range(n_streams):
        times = simulate_exp_hawkes(mu, alpha, beta, n_events, rng)
        rows.append(score_stream(times, train_frac))
    wins = sum(1 for r in rows if r["win"])
    success_pct = 100.0 * wins / n_streams
    ok_rows = [r for r in rows if r.get("ok")]
    hats = ok_rows or rows
    ll_h = [r["ll_hawkes"] for r in rows if np.isfinite(r["ll_hawkes"])]
    ll_p = [r["ll_poisson"] for r in rows if np.isfinite(r["ll_poisson"])]
    return {
        "success_pct": success_pct,
        "wins": wins,
        "n_streams": n_streams,
        "n_events": n_events,
        "n_train": int(np.mean([r["n_train"] for r in rows])),
        "n_test": int(np.mean([r["n_test"] for r in rows])),
        "n_fit_ok": len(ok_rows),
        "ll_hawkes": float(np.mean(ll_h)) if ll_h else float("nan"),
        "ll_poisson": float(np.mean(ll_p)) if ll_p else float("nan"),
        "poisson_rate": float(np.mean([r["poisson_rate"] for r in rows])),
        "mu_hat": float(np.mean([r["mu"] for r in hats])),
        "alpha_hat": float(np.mean([r["alpha"] for r in hats])),
        "beta_hat": float(np.mean([r["beta"] for r in hats])),
        "planted_mu": mu,
        "planted_alpha": alpha,
        "planted_beta": beta,
        "train_frac": train_frac,
        "seed": seed,
        "rows": rows,
    }


def print_report(m):
    print(
        f"Hawkes holdout loglik {m['ll_hawkes']:.1f}  |  "
        f"Poisson holdout loglik {m['ll_poisson']:.1f}"
    )
    print(
        f"success_pct {m['success_pct']:.1f}  ({m['wins']}/{m['n_streams']} streams)  "
        f"floor {const.FLOOR_PCT:.0f}"
    )
    print(
        f"n_events {m['n_events']} n_streams {m['n_streams']} "
        f"n_train {m['n_train']} n_test {m['n_test']} train_frac {m['train_frac']}"
    )
