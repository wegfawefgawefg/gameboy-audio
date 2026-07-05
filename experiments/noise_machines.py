import math
import struct
import wave
from pathlib import Path


SAMPLE_RATE = 44100
OUT_DIR = Path("out/noise_machines")


def write_wav(path, samples):
    path.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(path), "wb") as wav:
        wav.setnchannels(1)
        wav.setsampwidth(2)
        wav.setframerate(SAMPLE_RATE)
        for sample in samples:
            sample = max(-1, min(1, sample))
            wav.writeframes(struct.pack("<h", int(sample * 32767)))


def fade_out(sample_index, total_samples, fade_seconds):
    fade_samples = int(fade_seconds * SAMPLE_RATE)
    if fade_samples <= 0:
        return 1
    return max(0, 1 - sample_index / fade_samples)


def bit_feedback(mode, a, b, c):
    if mode == "xor":
        return a ^ b
    if mode == "xnor":
        return 1 - (a ^ b)
    if mode == "and":
        return a & b
    if mode == "nand":
        return 1 - (a & b)
    if mode == "or":
        return a | b
    if mode == "xor_or":
        return (a ^ b) | c
    if mode == "xor_and":
        return (a ^ b) & (1 - c)
    if mode == "majority":
        return 1 if a + b + c >= 2 else 0
    if mode == "parity3":
        return a ^ b ^ c
    raise ValueError(mode)


def bit_shift_noise(mode, length=15, tap_a=1, tap_b=6, clock_hz=5000, seconds=0.8, volume=0.35):
    total_samples = int(seconds * SAMPLE_RATE)
    samples = []
    register = (1 << length) - 1
    current = 1
    timer = 0
    mask = (1 << length) - 1

    for sample_index in range(total_samples):
        timer += 1 / SAMPLE_RATE

        if timer >= 1 / clock_hz:
            timer -= 1 / clock_hz

            a = register & 1
            b = (register >> tap_a) & 1
            c = (register >> tap_b) & 1
            new_bit = bit_feedback(mode, a, b, c)

            register = ((register >> 1) | (new_bit << (length - 1))) & mask
            current = -1 if register & 1 else 1

        samples.append(current * volume * fade_out(sample_index, total_samples, 0.45))

    return samples


def continuous_feedback(mode, a, b, c, drive):
    if mode == "soft_xor":
        return math.tanh((a - b) * drive)
    if mode == "soft_and":
        return math.tanh((a * b) * drive)
    if mode == "soft_or":
        return math.tanh((a + b + a * b) * drive * 0.5)
    if mode == "sine_mix":
        return math.sin(a * drive + b * drive * 0.7 + c * drive * 0.35)
    if mode == "fold":
        x = (a - b + c * 0.5) * drive
        return math.sin(x) * (1 - abs(math.sin(x * 0.5)) * 0.35)
    if mode == "logistic":
        x = 1 / (1 + math.exp(-(a - b + c) * drive))
        return x * 2 - 1
    raise ValueError(mode)


def continuous_shift_noise(mode, length=32, tap_a=5, tap_b=17, drive=2.5, clock_hz=9000, seconds=1.0, volume=0.30):
    total_samples = int(seconds * SAMPLE_RATE)
    samples = []
    state = [math.sin(i * 12.9898) for i in range(length)]
    current = state[-1]
    timer = 0

    for sample_index in range(total_samples):
        timer += 1 / SAMPLE_RATE

        if timer >= 1 / clock_hz:
            timer -= 1 / clock_hz
            a = state[-1]
            b = state[-1 - (tap_a % length)]
            c = state[-1 - (tap_b % length)]
            new_value = continuous_feedback(mode, a, b, c, drive)
            state = [new_value] + state[:-1]
            current = state[-1]

        samples.append(current * volume * fade_out(sample_index, total_samples, 0.75))

    return samples


BIT_PATCHES = [
    ("bit_xor_classic", "xor", 15, 1, 6, 5000),
    ("bit_xnor_inverted", "xnor", 15, 1, 6, 5000),
    ("bit_and_dies", "and", 15, 1, 6, 5000),
    ("bit_nand_buzzy", "nand", 15, 1, 6, 5000),
    ("bit_or_sticks", "or", 15, 1, 6, 5000),
    ("bit_xor_or_combo", "xor_or", 15, 2, 9, 6500),
    ("bit_majority", "majority", 15, 3, 8, 4500),
    ("bit_parity3", "parity3", 23, 5, 17, 9000),
]

CONTINUOUS_PATCHES = [
    ("cont_soft_xor", "soft_xor", 32, 5, 17, 2.8, 9000),
    ("cont_soft_and", "soft_and", 32, 4, 11, 3.2, 8000),
    ("cont_soft_or", "soft_or", 32, 3, 13, 2.4, 7000),
    ("cont_sine_mix", "sine_mix", 48, 7, 23, 3.8, 10000),
    ("cont_fold", "fold", 48, 6, 19, 4.6, 12000),
    ("cont_logistic", "logistic", 32, 5, 21, 3.4, 8500),
]


def main():
    for name, mode, length, tap_a, tap_b, clock_hz in BIT_PATCHES:
        samples = bit_shift_noise(mode, length, tap_a, tap_b, clock_hz)
        write_wav(OUT_DIR / f"{name}.wav", samples)

    for name, mode, length, tap_a, tap_b, drive, clock_hz in CONTINUOUS_PATCHES:
        samples = continuous_shift_noise(mode, length, tap_a, tap_b, drive, clock_hz)
        write_wav(OUT_DIR / f"{name}.wav", samples)

    print(f"Wrote {len(BIT_PATCHES) + len(CONTINUOUS_PATCHES)} WAVs to {OUT_DIR}")


if __name__ == "__main__":
    main()
