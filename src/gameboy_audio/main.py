from __future__ import annotations

import argparse
from pathlib import Path

from gameboy_audio.apu import Envelope, NoiseChannel, PulseChannel, WaveChannel, mix, triangle_wave_ram
from gameboy_audio.audio import (
    SAMPLE_RATE,
    gameboy_period_to_hz,
    hz_to_gameboy_period,
    midi_to_hz,
    write_plot_csv,
    write_wav,
)


def place(samples: list[float], start_seconds: float, total_seconds: float) -> list[float]:
    """Put one rendered sound into a longer buffer.

    This is software sequencing for the tutorial. The Game Boy APU itself does
    not know about events or songs; games write new values to APU registers over
    time from CPU code.
    """
    output = [0.0] * int(total_seconds * SAMPLE_RATE)
    start = int(start_seconds * SAMPLE_RATE)

    for i, sample in enumerate(samples):
        if start + i < len(output):
            output[start + i] += sample

    return output


def render_demo_song() -> list[float]:
    total_seconds = 1.9
    tracks: list[list[float]] = []

    melody = [72, 76, 79, 84, 79, 76, 72, 67]
    for index, note in enumerate(melody):
        channel = PulseChannel(
            start_hz=midi_to_hz(note),
            duty=index % 4,
            gain=0.20,
            envelope=Envelope(0.9, 0.35, 0.20),
        )
        tracks.append(place(render_note(channel, 0.20), index * 0.22, total_seconds))

    sweep = PulseChannel(
        start_hz=880,
        end_hz=220,
        sweep_seconds=0.45,
        duty=1,
        gain=0.13,
        envelope=Envelope(0.8, 0.1, 0.45),
    )
    tracks.append(place(render_note(sweep, 0.45), 0.05, total_seconds))

    for start, note in [(0.0, 48), (0.44, 55), (0.88, 52), (1.32, 43)]:
        channel = WaveChannel(hz=midi_to_hz(note), wave_ram=triangle_wave_ram(), gain=0.16)
        tracks.append(place(render_note(channel, 0.42), start, total_seconds))

    for start in [0.0, 0.44, 0.88, 1.32]:
        drum = NoiseChannel(clock_hz=900, gain=0.26, envelope=Envelope(1.0, 0.0, 0.08))
        tracks.append(place(render_note(drum, 0.08), start, total_seconds))

    for start in [0.22, 0.66, 1.10, 1.54]:
        hat = NoiseChannel(clock_hz=6_000, gain=0.12, envelope=Envelope(0.8, 0.0, 0.04))
        tracks.append(place(render_note(hat, 0.04), start, total_seconds))

    return mix(tracks)


def render_note(channel: PulseChannel | WaveChannel | NoiseChannel, seconds: float) -> list[float]:
    samples: list[float] = []
    dt = 1.0 / SAMPLE_RATE

    for i in range(int(seconds * SAMPLE_RATE)):
        t = i * dt
        samples.append(channel.sample(dt, t))

    return samples


def print_register_examples() -> None:
    note_hz = midi_to_hz(72)
    period = hz_to_gameboy_period(note_hz)

    print("Game Boy APU has 4 channels:")
    print("  CH1 pulse + frequency sweep")
    print("  CH2 pulse")
    print("  CH3 32-sample 4-bit wavetable")
    print("  CH4 noise from an LFSR")
    print()
    print("Important correction:")
    print("  The APU does not play NoteEvent objects.")
    print("  A game writes numbers into sound registers over time.")
    print("  Our Python demo uses simple scheduling only to arrange sounds in a WAV.")
    print()
    print("Register-ish example for a C5 pulse note:")
    print(f"  desired_hz = {note_hz:.2f}")
    print(f"  period = 2048 - CPU_CLOCK / (32 * desired_hz) = {period}")
    print(f"  actual_hz = CPU_CLOCK / (32 * (2048 - period)) = {gameboy_period_to_hz(period):.2f}")
    print("  NR21 duty/length: duty = 50%")
    print("  NR22 envelope: start volume = 15, direction = down, step time = small")
    print(f"  NR23 low frequency bits = {period & 0xFF}")
    print(f"  NR24 high frequency bits + trigger = {period >> 8}, trigger = 1")


def main() -> None:
    parser = argparse.ArgumentParser(description="Compose the small Game Boy APU lessons.")
    parser.add_argument("--wav", type=Path, default=Path("out/gameboy_demo.wav"))
    parser.add_argument("--csv", type=Path, default=Path("out/first_40ms.csv"))
    args = parser.parse_args()

    print_register_examples()
    samples = render_demo_song()
    write_wav(args.wav, samples)
    write_plot_csv(args.csv, samples)
    print()
    print(f"wrote {args.wav}")
    print(f"wrote {args.csv}")


if __name__ == "__main__":
    main()
