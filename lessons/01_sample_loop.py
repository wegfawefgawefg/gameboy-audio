from math import pi, sin
from pathlib import Path
import struct
import wave


SAMPLE_RATE = 44_100


def write_wav(path: Path, samples: list[float]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)

    with wave.open(str(path), "wb") as wav:
        wav.setnchannels(1)  # Mono: one speaker-position number at a time.
        wav.setsampwidth(2)  # 16-bit audio: each sample is stored in 2 bytes.
        wav.setframerate(SAMPLE_RATE)  # The player reads 44,100 samples per second.

        frames = bytearray()
        for sample in samples:
            # In this program, -1.0 means "speaker all the way back",
            # 0.0 means "speaker at rest",
            # and +1.0 means "speaker all the way forward".
            sample = max(-1.0, min(1.0, sample))

            # WAV files do not store -1.0..+1.0 floats.
            # A 16-bit WAV stores whole numbers, roughly -32767..+32767.
            sample_as_integer = int(sample * 32767)
            frames.extend(struct.pack("<h", sample_as_integer))

        wav.writeframes(frames)


def svg_polyline(samples: list[float], color: str, width: int, height: int) -> str:
    points: list[str] = []

    for index, sample in enumerate(samples):
        x = index * width / (len(samples) - 1)
        y = height / 2 - sample * (height * 0.40)
        points.append(f"{x:.2f},{y:.2f}")

    return f'<polyline points="{" ".join(points)}" fill="none" stroke="{color}" stroke-width="3" />'


def svg_dots(samples: list[float], total_points: int, color: str, width: int, height: int) -> str:
    dots: list[str] = []

    for index, sample in enumerate(samples):
        x = index * width / (total_points - 1)
        y = height / 2 - sample * (height * 0.40)
        dots.append(f'<circle cx="{x:.2f}" cy="{y:.2f}" r="3" fill="{color}" />')

    return "\n".join(dots)


def write_wave_picture(path: Path, raw_samples: list[float], quiet_samples: list[float]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)

    width = 900
    height = 320
    center_y = height / 2
    raw_preview = raw_samples[:100]
    quiet_preview = quiet_samples[:100]

    svg = f"""<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="0 0 {width} {height}">
  <rect width="100%" height="100%" fill="white" />
  <line x1="0" y1="{center_y}" x2="{width}" y2="{center_y}" stroke="#999" stroke-width="1" />
  <text x="8" y="{height * 0.10:.0f}" font-family="monospace" font-size="14" fill="#555">+1 forward</text>
  <text x="8" y="{center_y - 8:.0f}" font-family="monospace" font-size="14" fill="#555">0 rest</text>
  <text x="8" y="{height * 0.91:.0f}" font-family="monospace" font-size="14" fill="#555">-1 back</text>
  <text x="20" y="30" font-family="monospace" font-size="18">Each dot is one sample: one speaker position.</text>
  <text x="20" y="58" font-family="monospace" font-size="15" fill="#555">Blue is full height. Orange is the same wave multiplied by volume = 0.4.</text>
  {svg_polyline(raw_preview, "#2563eb", width, height)}
  {svg_polyline(quiet_preview, "#f97316", width, height)}
  {svg_dots(quiet_preview[:24], len(quiet_preview), "#f97316", width, height)}
</svg>
"""
    path.write_text(svg)


def main() -> None:
    frequency = 440
    seconds = 1.0
    volume = 0.4

    raw_samples: list[float] = []
    quiet_samples: list[float] = []

    # A sample is one number that says where the speaker should be right now.
    #
    # If we make 44,100 samples and play them in one second, that is 44,100
    # tiny speaker positions per second. This is the sample rate.
    total_samples = int(seconds * SAMPLE_RATE)

    for sample_index in range(total_samples):
        # sample_index starts at 0 and counts upward:
        # 0, 1, 2, 3, 4...
        #
        # Dividing by SAMPLE_RATE turns that count into seconds:
        # sample 0 is time 0.0
        # sample 441 is time 0.01
        # sample 44100 is time 1.0
        time = sample_index / SAMPLE_RATE

        # A sine wave is a smooth back-and-forth motion.
        #
        # sin() wants an angle.
        # One full circle is 2 * pi.
        # Multiplying by frequency means "do this many circles per second".
        raw_sample = sin(2 * pi * frequency * time)
        raw_samples.append(raw_sample)

        # Volume means "how far from zero can the speaker move?"
        #
        # Multiplying by 0.4 shrinks every sample toward 0:
        # +1.0 becomes +0.4
        # -1.0 becomes -0.4
        # +0.5 becomes +0.2
        #
        # The shape is the same, but the speaker moves a shorter distance.
        quiet_sample = raw_sample * volume
        quiet_samples.append(quiet_sample)

    write_wav(Path("out/lesson_01_sine.wav"), quiet_samples)
    write_wave_picture(Path("out/lesson_01_waveform.svg"), raw_samples, quiet_samples)


if __name__ == "__main__":
    main()
