from __future__ import annotations

from pathlib import Path

import _lesson_path  # noqa: F401
from gameboy_audio.apu import DUTY_PATTERNS
from gameboy_audio.audio import SAMPLE_RATE, write_plot_csv, write_wav


def pulse_sample(phase: float, duty: int) -> float:
    pattern = DUTY_PATTERNS[duty]
    step = int(phase * len(pattern)) % len(pattern)
    return 0.35 if pattern[step] else -0.35


def main() -> None:
    samples: list[float] = []
    frequency = 220
    duty = 2  # Try 0, 1, 2, or 3.
    phase = 0.0

    for _ in range(int(1.0 * SAMPLE_RATE)):
        samples.append(pulse_sample(phase, duty))
        phase = (phase + frequency / SAMPLE_RATE) % 1.0

    write_wav(Path("out/lesson_02_pulse_duty.wav"), samples)
    write_plot_csv(Path("out/lesson_02_pulse_duty.csv"), samples)


if __name__ == "__main__":
    main()
