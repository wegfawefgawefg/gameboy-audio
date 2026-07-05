from __future__ import annotations

import csv
import struct
import wave
from pathlib import Path


SAMPLE_RATE = 44_100
CPU_CLOCK = 4_194_304


def midi_to_hz(note: int) -> float:
    return 440.0 * 2 ** ((note - 69) / 12)


def hz_to_gameboy_period(hz: float) -> int:
    """The 11-bit period value used by Game Boy pulse and wave channels."""
    return max(0, min(2047, round(2048 - CPU_CLOCK / (32 * hz))))


def gameboy_period_to_hz(period: int) -> float:
    return CPU_CLOCK / (32 * (2048 - period))


def seconds_to_samples(seconds: float) -> int:
    return int(seconds * SAMPLE_RATE)


def clamp(sample: float) -> float:
    return max(-1.0, min(1.0, sample))


def write_wav(path: Path, samples: list[float]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(path), "wb") as wav:
        wav.setnchannels(1)
        wav.setsampwidth(2)
        wav.setframerate(SAMPLE_RATE)

        frames = bytearray()
        for sample in samples:
            frames.extend(struct.pack("<h", int(clamp(sample) * 32767)))
        wav.writeframes(frames)


def write_plot_csv(path: Path, samples: list[float], milliseconds: int = 40) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    count = min(len(samples), seconds_to_samples(milliseconds / 1000))

    with path.open("w", newline="") as file:
        writer = csv.writer(file)
        writer.writerow(("time_seconds", "amplitude"))
        for i in range(count):
            writer.writerow((f"{i / SAMPLE_RATE:.6f}", f"{samples[i]:.6f}"))
