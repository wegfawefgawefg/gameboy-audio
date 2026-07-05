from __future__ import annotations

import math
from dataclasses import dataclass, field

from gameboy_audio.audio import SAMPLE_RATE


DUTY_PATTERNS = {
    # The hardware pulse sequencer has 8 steps. These are the 4 duty settings.
    0: (0, 0, 0, 0, 0, 0, 0, 1),  # 12.5%
    1: (1, 0, 0, 0, 0, 0, 0, 1),  # 25%
    2: (1, 0, 0, 0, 0, 1, 1, 1),  # 50%
    3: (0, 1, 1, 1, 1, 1, 1, 0),  # 75%
}


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
    start_hz: float
    duty: int = 2
    gain: float = 0.25
    envelope: Envelope = field(default_factory=Envelope)
    end_hz: float | None = None
    sweep_seconds: float = 0.0
    phase: float = 0.0

    def frequency_at(self, t: float) -> float:
        if self.end_hz is None or self.sweep_seconds <= 0:
            return self.start_hz
        amount = min(1.0, t / self.sweep_seconds)
        return self.start_hz + (self.end_hz - self.start_hz) * amount

    def sample(self, dt: float, t: float) -> float:
        pattern = DUTY_PATTERNS[self.duty]
        step = int(self.phase * len(pattern)) % len(pattern)
        raw = 1.0 if pattern[step] else -1.0

        self.phase = (self.phase + self.frequency_at(t) * dt) % 1.0
        return raw * self.gain * self.envelope.volume_at(t)


@dataclass
class WaveChannel:
    hz: float
    wave_ram: tuple[int, ...]
    gain: float = 0.2
    phase: float = 0.0

    def sample(self, dt: float, _t: float) -> float:
        index = int(self.phase * len(self.wave_ram)) % len(self.wave_ram)
        nibble = self.wave_ram[index] & 0xF
        raw = (nibble / 15.0) * 2.0 - 1.0

        self.phase = (self.phase + self.hz * dt) % 1.0
        return raw * self.gain


@dataclass
class NoiseChannel:
    clock_hz: float
    gain: float = 0.25
    envelope: Envelope = field(default_factory=lambda: Envelope(1.0, 0.0, 0.35))
    width_bits: int = 15
    lfsr: int = 0
    timer: float = 0.0
    current: float = 1.0

    def __post_init__(self) -> None:
        self.lfsr = (1 << self.width_bits) - 1

    def sample(self, dt: float, t: float) -> float:
        self.timer += dt
        period = 1.0 / self.clock_hz

        while self.timer >= period:
            self.timer -= period
            bit = (self.lfsr ^ (self.lfsr >> 1)) & 1
            self.lfsr = (self.lfsr >> 1) | (bit << (self.width_bits - 1))
            self.current = -1.0 if self.lfsr & 1 else 1.0

        return self.current * self.gain * self.envelope.volume_at(t)


def triangle_wave_ram() -> tuple[int, ...]:
    return tuple(list(range(16)) + list(range(15, -1, -1)))


def render_channel(channel: PulseChannel | WaveChannel | NoiseChannel, seconds: float) -> list[float]:
    samples: list[float] = []
    dt = 1.0 / SAMPLE_RATE

    for i in range(int(seconds * SAMPLE_RATE)):
        t = i * dt
        samples.append(channel.sample(dt, t))

    return samples


def mix(sample_lists: list[list[float]]) -> list[float]:
    length = max(len(samples) for samples in sample_lists)
    output: list[float] = []

    for i in range(length):
        total = 0.0
        for samples in sample_lists:
            if i < len(samples):
                total += samples[i]
        output.append(math.tanh(total * 0.9))

    return output
