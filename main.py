from __future__ import annotations

import argparse
import csv
import math
import struct
import wave
from dataclasses import dataclass, field
from pathlib import Path


SAMPLE_RATE = 44_100
CPU_CLOCK = 4_194_304

DUTY_PATTERNS = {
    # The hardware sequencer has 8 steps. These are the four Game Boy pulse duties.
    0: (0, 0, 0, 0, 0, 0, 0, 1),  # 12.5%
    1: (1, 0, 0, 0, 0, 0, 0, 1),  # 25%
    2: (1, 0, 0, 0, 0, 1, 1, 1),  # 50%
    3: (0, 1, 1, 1, 1, 1, 1, 0),  # 75%
}


def midi_to_hz(note: int) -> float:
    return 440.0 * 2 ** ((note - 69) / 12)


def hz_to_gameboy_period(hz: float) -> int:
    """Convert frequency to the 11-bit period value used by pulse/wave channels."""
    return max(0, min(2047, round(2048 - CPU_CLOCK / (32 * hz))))


def gameboy_period_to_hz(period: int) -> float:
    return CPU_CLOCK / (32 * (2048 - period))


@dataclass
class Envelope:
    start_volume: float = 1.0
    end_volume: float = 1.0
    seconds: float = 0.0

    def volume_at(self, t: float) -> float:
        if self.seconds <= 0:
            return self.start_volume
        amount = min(1.0, t / self.seconds)
        return self.start_volume + (self.end_volume - self.start_volume) * amount


@dataclass
class PulseChannel:
    """Game Boy channels 1 and 2: square/pulse wave, 4 duty settings, envelope.

    Channel 1 also has hardware frequency sweep. This model keeps sweep simple:
    it linearly bends from start_hz to end_hz over sweep_seconds.
    """

    start_hz: float
    duty: int = 2
    gain: float = 0.25
    envelope: Envelope = field(default_factory=Envelope)
    end_hz: float | None = None
    sweep_seconds: float = 0.0

    def frequency_at(self, t: float) -> float:
        if self.end_hz is None or self.sweep_seconds <= 0:
            return self.start_hz
        amount = min(1.0, t / self.sweep_seconds)
        return self.start_hz + (self.end_hz - self.start_hz) * amount

    def sample(self, phase: float, t: float) -> float:
        pattern = DUTY_PATTERNS[self.duty]
        step = int(phase * len(pattern)) % len(pattern)
        raw = 1.0 if pattern[step] else -1.0
        return raw * self.gain * self.envelope.volume_at(t)


@dataclass
class WaveChannel:
    """Game Boy channel 3: repeatedly plays 32 tiny 4-bit samples."""

    hz: float
    wave_ram: tuple[int, ...]
    gain: float = 0.2

    def sample(self, phase: float, _t: float) -> float:
        index = int(phase * len(self.wave_ram)) % len(self.wave_ram)
        nibble = self.wave_ram[index] & 0xF
        return ((nibble / 15.0) * 2.0 - 1.0) * self.gain


@dataclass
class NoiseChannel:
    """Game Boy channel 4: pseudo-random bits from an LFSR, shaped by envelope."""

    clock_hz: float
    gain: float = 0.25
    envelope: Envelope = field(default_factory=lambda: Envelope(1.0, 0.0, 0.35))
    width_bits: int = 15


class NoiseVoice:
    def __init__(self, channel: NoiseChannel):
        self.channel = channel
        self.lfsr = (1 << channel.width_bits) - 1
        self.timer = 0.0
        self.current = 1.0

    def sample(self, dt: float, t: float) -> float:
        self.timer += dt
        period = 1.0 / self.channel.clock_hz
        while self.timer >= period:
            self.timer -= period
            # Hardware uses xor of bit 0 and bit 1, then feeds that bit back.
            bit = (self.lfsr ^ (self.lfsr >> 1)) & 1
            self.lfsr = (self.lfsr >> 1) | (bit << (self.channel.width_bits - 1))
            self.current = -1.0 if self.lfsr & 1 else 1.0
        return self.current * self.channel.gain * self.channel.envelope.volume_at(t)


@dataclass
class NoteEvent:
    start: float
    duration: float
    channel: PulseChannel | WaveChannel | NoiseChannel


def render(events: list[NoteEvent], seconds: float) -> list[float]:
    sample_count = int(seconds * SAMPLE_RATE)
    output = [0.0] * sample_count
    phases: dict[int, float] = {}
    noise_voices: dict[int, NoiseVoice] = {}
    dt = 1.0 / SAMPLE_RATE

    for i in range(sample_count):
        now = i * dt
        total = 0.0

        for event_index, event in enumerate(events):
            local_t = now - event.start
            if local_t < 0 or local_t >= event.duration:
                continue

            channel = event.channel
            if isinstance(channel, NoiseChannel):
                voice = noise_voices.setdefault(event_index, NoiseVoice(channel))
                total += voice.sample(dt, local_t)
                continue

            phase = phases.get(event_index, 0.0)
            total += channel.sample(phase, local_t)

            hz = channel.frequency_at(local_t) if isinstance(channel, PulseChannel) else channel.hz
            phases[event_index] = (phase + hz * dt) % 1.0

        # Gentle clipping keeps a mixed demo from wrapping when written as int16.
        output[i] = math.tanh(total * 0.9)

    return output


def write_wav(path: Path, samples: list[float]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(path), "wb") as wav:
        wav.setnchannels(1)
        wav.setsampwidth(2)
        wav.setframerate(SAMPLE_RATE)
        frames = bytearray()
        for sample in samples:
            frames.extend(struct.pack("<h", int(max(-1.0, min(1.0, sample)) * 32767)))
        wav.writeframes(frames)


def write_plot_csv(path: Path, samples: list[float], milliseconds: int = 40) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    count = min(len(samples), int(SAMPLE_RATE * milliseconds / 1000))
    with path.open("w", newline="") as file:
        writer = csv.writer(file)
        writer.writerow(("time_seconds", "amplitude"))
        for i in range(count):
            writer.writerow((f"{i / SAMPLE_RATE:.6f}", f"{samples[i]:.6f}"))


def triangle_wave_ram() -> tuple[int, ...]:
    up = list(range(16))
    down = list(range(15, -1, -1))
    return tuple(up + down)


def demo_song() -> list[NoteEvent]:
    melody = [72, 76, 79, 84, 79, 76, 72, 67]
    events: list[NoteEvent] = []

    for index, note in enumerate(melody):
        start = index * 0.22
        hz = midi_to_hz(note)
        events.append(
            NoteEvent(
                start=start,
                duration=0.20,
                channel=PulseChannel(
                    start_hz=hz,
                    duty=index % 4,
                    gain=0.20,
                    envelope=Envelope(0.9, 0.35, 0.20),
                ),
            )
        )

    # Channel 1-style sweep: the classic "pew" shape is just a square wave pitch bend.
    events.append(
        NoteEvent(
            start=0.05,
            duration=0.45,
            channel=PulseChannel(
                start_hz=880,
                end_hz=220,
                sweep_seconds=0.45,
                duty=1,
                gain=0.13,
                envelope=Envelope(0.8, 0.1, 0.45),
            ),
        )
    )

    # Channel 3 wavetable can be a bass, a fake vowel, a tiny custom waveform, etc.
    for start, note in [(0.0, 48), (0.44, 55), (0.88, 52), (1.32, 43)]:
        events.append(
            NoteEvent(
                start=start,
                duration=0.42,
                channel=WaveChannel(
                    hz=midi_to_hz(note),
                    wave_ram=triangle_wave_ram(),
                    gain=0.16,
                ),
            )
        )

    # Noise is the drum machine: short bursts become hats/snares/kicks.
    for start in [0.0, 0.44, 0.88, 1.32]:
        events.append(
            NoteEvent(
                start=start,
                duration=0.08,
                channel=NoiseChannel(clock_hz=900, gain=0.26, envelope=Envelope(1.0, 0.0, 0.08)),
            )
        )
    for start in [0.22, 0.66, 1.10, 1.54]:
        events.append(
            NoteEvent(
                start=start,
                duration=0.04,
                channel=NoiseChannel(clock_hz=6_000, gain=0.12, envelope=Envelope(0.8, 0.0, 0.04)),
            )
        )

    return events


def print_register_examples() -> None:
    note_hz = midi_to_hz(72)
    period = hz_to_gameboy_period(note_hz)
    print("Game Boy APU has 4 channels:")
    print("  CH1 pulse + frequency sweep")
    print("  CH2 pulse")
    print("  CH3 32-sample 4-bit wavetable")
    print("  CH4 noise from an LFSR")
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
    parser = argparse.ArgumentParser(description="Tiny educational Game Boy APU-ish renderer.")
    parser.add_argument("--wav", type=Path, default=Path("out/gameboy_demo.wav"))
    parser.add_argument("--csv", type=Path, default=Path("out/first_40ms.csv"))
    args = parser.parse_args()

    print_register_examples()
    samples = render(demo_song(), seconds=1.9)
    write_wav(args.wav, samples)
    write_plot_csv(args.csv, samples)
    print()
    print(f"wrote {args.wav}")
    print(f"wrote {args.csv}")


if __name__ == "__main__":
    main()
