from __future__ import annotations

from pathlib import Path

import _lesson_path  # noqa: F401
from gameboy_audio.audio import SAMPLE_RATE, write_plot_csv, write_wav


def triangle_wave_ram() -> tuple[int, ...]:
    # Channel 3 has 32 tiny samples, each stored as a 4-bit number from 0..15.
    return tuple(list(range(16)) + list(range(15, -1, -1)))


def main() -> None:
    wave_ram = triangle_wave_ram()
    samples: list[float] = []
    frequency = 110
    phase = 0.0

    for _ in range(int(1.0 * SAMPLE_RATE)):
        index = int(phase * len(wave_ram)) % len(wave_ram)
        nibble = wave_ram[index]
        sample = (nibble / 15.0) * 2.0 - 1.0
        samples.append(sample * 0.35)
        phase = (phase + frequency / SAMPLE_RATE) % 1.0

    write_wav(Path("out/lesson_03_wave_channel.wav"), samples)
    write_plot_csv(Path("out/lesson_03_wave_channel.csv"), samples)


if __name__ == "__main__":
    main()
