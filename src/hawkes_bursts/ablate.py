# Kernel on/off and μ fitted vs frozen vs misspecified. Same streams as eval.

import numpy as np

from . import const
from .fit import fit_hawkes, hawkes_loglik, poisson_loglik, poisson_rate
from .simulate import simulate_exp_hawkes
from .split import chronological_split


def ablation(
    n_streams=8,
    n_events=400,
    seed=const.SEED,
    mu=const.MU,
    alpha=const.ALPHA,
    beta=const.BETA,
    train_frac=const.TRAIN_FRAC,
):
    rng = np.random.default_rng(seed)
    streams = [simulate_exp_hawkes(mu, alpha, beta, n_events, rng) for _ in range(n_streams)]
    specs = [
        ("poisson", "none", "rate"),
        ("exp_mu_frozen", "exp", "frozen"),
        ("exp_mu_misspec", "exp", "2x rate"),
        ("exp_full", "exp", "fitted"),
    ]
    rows = []
    for name, kernel, mu_mode in specs:
        wins = 0
        lls = []
        for times in streams:
            train, test, t_cut, t_end = chronological_split(times, train_frac)
            rate = poisson_rate(train, t_cut)
            ll_p = poisson_loglik(len(test), t_end - t_cut, rate)
            if name == "poisson":
                ll = ll_p
            elif name == "exp_mu_frozen":
                fit = fit_hawkes(train, t_cut, freeze_mu=rate)
                ll = hawkes_loglik(test, t_cut, t_end, fit["mu"], fit["alpha"], fit["beta"], train)
            elif name == "exp_mu_misspec":
                fit = fit_hawkes(train, t_cut, freeze_mu=2.0 * rate)
                ll = hawkes_loglik(test, t_cut, t_end, fit["mu"], fit["alpha"], fit["beta"], train)
            else:
                fit = fit_hawkes(train, t_cut)
                ll = hawkes_loglik(test, t_cut, t_end, fit["mu"], fit["alpha"], fit["beta"], train)
            lls.append(ll)
            if name != "poisson" and ll > ll_p:
                wins += 1
        rows.append(
            {
                "model": name,
                "kernel": kernel,
                "mu": mu_mode,
                "ll_holdout": float(np.mean(lls)),
                "success_pct": 0.0 if name == "poisson" else 100.0 * wins / n_streams,
                "n_streams": n_streams,
                "n_events": n_events,
            }
        )
    return rows


def print_table(rows):
    print(f"{'model':<18}{'kernel':<8}{'mu':<10}{'ll':>10}{'win%':>8}")
    for r in rows:
        print(
            f"{r['model']:<18}{r['kernel']:<8}{r['mu']:<10}"
            f"{r['ll_holdout']:>10.1f}{r['success_pct']:>8.1f}"
        )
