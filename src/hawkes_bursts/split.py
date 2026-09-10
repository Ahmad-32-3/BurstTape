# Chronological cut. Train is strictly before test. Leak injection must raise.


def check_no_leak(train, test):
    if len(train) == 0 or len(test) == 0:
        raise ValueError("leak: empty train or test after chronological cut")
    if train.max() >= test.min():
        raise ValueError("leak: future event present in train")


def chronological_split(times, train_frac):
    t_cut = times[-1] * train_frac
    train = times[times < t_cut]
    test = times[times >= t_cut]
    check_no_leak(train, test)
    return train, test, float(t_cut), float(times[-1])
