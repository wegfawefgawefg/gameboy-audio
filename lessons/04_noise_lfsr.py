from __future__ import annotations

from pathlib import Path

import _lesson_path  # noqa: F401
from gameboy_audio.audio import SAMPLE_RATE, write_plot_csv, write_wav


def main() -> None:
    samples: list[float] = []
    lfsr = 0b111_1111_1111_1111
    noise_clock_hz = 3_000
    timer = 0.0
    current = 1.0

    for sample_index in range(int(1.0 * SAMPLE_RATE)):
        timer += 1.0 / SAMPLE_RATE

        if timer >= 1.0 / noise_clock_hz:
            timer -= 1.0 / noise_clock_hz
            bit = (lfsr ^ (lfsr >> 1)) & 1
            lfsr = (lfsr >> 1) | (bit << 14)
            current = -0.35 if lfsr & 1 else 0.35

        t = sample_index / SAMPLE_RATE
        fade_out = max(0.0, 1.0 - t / 0.30)
        samples.append(current * fade_out)

    write_wav(Path("out/lesson_04_noise_lfsr.wav"), samples)
    write_plot_csv(Path("out/lesson_04_noise_lfsr.csv"), samples)


if __name__ == "__main__":
    main()
