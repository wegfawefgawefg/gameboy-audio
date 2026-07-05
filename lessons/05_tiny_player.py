from __future__ import annotations

from pathlib import Path

import _lesson_path  # noqa: F401
from gameboy_audio.apu import Envelope, NoiseChannel, PulseChannel, WaveChannel, mix, render_channel, triangle_wave_ram
from gameboy_audio.audio import SAMPLE_RATE, midi_to_hz, write_plot_csv, write_wav


def put_sound(sound: list[float], start_seconds: float, total_seconds: float) -> list[float]:
    track = [0.0] * int(total_seconds * SAMPLE_RATE)
    start = int(start_seconds * SAMPLE_RATE)

    for i, sample in enumerate(sound):
        if start + i < len(track):
            track[start + i] = sample

    return track


def main() -> None:
    # This file introduces sequencing. The Game Boy APU did not store notes.
    # Game code changed APU registers frame-by-frame or tick-by-tick.
    total_seconds = 1.4
    tracks: list[list[float]] = []

    for step, note in enumerate([72, 76, 79, 84]):
        pulse = PulseChannel(
            start_hz=midi_to_hz(note),
            duty=step % 4,
            gain=0.22,
            envelope=Envelope(1.0, 0.25, 0.20),
        )
        tracks.append(put_sound(render_channel(pulse, 0.20), step * 0.24, total_seconds))

    bass = WaveChannel(hz=midi_to_hz(48), wave_ram=triangle_wave_ram(), gain=0.18)
    tracks.append(put_sound(render_channel(bass, 1.2), 0.0, total_seconds))

    for start in [0.0, 0.48, 0.96]:
        noise = NoiseChannel(clock_hz=900, gain=0.25, envelope=Envelope(1.0, 0.0, 0.09))
        tracks.append(put_sound(render_channel(noise, 0.09), start, total_seconds))

    samples = mix(tracks)
    write_wav(Path("out/lesson_05_tiny_player.wav"), samples)
    write_plot_csv(Path("out/lesson_05_tiny_player.csv"), samples)


if __name__ == "__main__":
    main()
