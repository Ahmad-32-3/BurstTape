import numpy as np
import pytest

from hawkes_bursts import const
from hawkes_bursts.ablate import ablation
from hawkes_bursts.eval import evaluate, score_stream
from hawkes_bursts.simulate import simulate_exp_hawkes
from hawkes_bursts.split import check_no_leak, chronological_split


def _stream(n=200, seed=1):
    rng = np.random.default_rng(seed)
    return simulate_exp_hawkes(const.MU, const.ALPHA, const.BETA, n, rng)


def test_chronological_split_is_disjoint():
    times = _stream()
    train, test, t_cut, _ = chronological_split(times, 0.7)
    assert train.max() < t_cut <= test.min()
    assert set(train).isdisjoint(set(test))


def test_leak_injection_fails():
    times = _stream()
    train, test, _, _ = chronological_split(times, 0.7)
    leaked = np.concatenate([train, test[:8]])
    with pytest.raises(ValueError, match="leak"):
        check_no_leak(leaked, test)


def test_score_stream_hawkes_beats_poisson_on_planted():
    times = _stream(n=400, seed=3)
    row = score_stream(times)
    assert row["ll_hawkes"] > row["ll_poisson"]
    assert row["n_train"] > 0 and row["n_test"] > 0


def test_evaluate_success_pct_is_percentage():
    m = evaluate(n_streams=6, n_events=280, seed=11)
    assert 0 <= m["success_pct"] <= 100
    assert m["wins"] == sum(1 for r in m["rows"] if r["win"])
    assert m["n_events"] <= const.MAX_EVENTS
    assert m["n_streams"] <= const.MAX_STREAMS


def test_ablation_kernel_and_mu_columns():
    rows = ablation(n_streams=4, n_events=220, seed=4)
    assert [r["model"] for r in rows] == [
        "poisson",
        "exp_mu_frozen",
        "exp_mu_misspec",
        "exp_full",
    ]
    by = {r["model"]: r["success_pct"] for r in rows}
    assert by["poisson"] == 0.0
    assert by["exp_full"] > by["poisson"]
