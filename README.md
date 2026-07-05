# Game Boy audio sketches

**Status: unfinished / work in progress.** This is an early teaching prototype, not a complete Game Boy APU emulator and not yet a finished tutorial site.

This repo is a set of small Python sketches for understanding the Game Boy audio chip before turning it into an interactive web tutorial.

The original Game Boy APU has four sound channels:

1. **CH1 pulse**: square/pulse wave with 4 duty cycles, volume envelope, and frequency sweep.
2. **CH2 pulse**: another square/pulse wave with 4 duty cycles and volume envelope, but no sweep.
3. **CH3 wave**: a custom 32-sample wavetable. Each sample is only 4 bits.
4. **CH4 noise**: pseudo-random noise from a linear-feedback shift register, usually used for drums, hats, explosions, and texture.

So it is not exactly "three voices and a noise one." It is two pulse voices, one tiny wavetable voice, and one noise voice.

## Run the lessons

```bash
python3 lessons/01_sample_loop.py
python3 lessons/02_pulse_duty.py
python3 lessons/03_wave_channel.py
python3 lessons/04_noise_lfsr.py
python3 lessons/05_tiny_player.py
```

Each lesson writes a WAV file into `out/`. Lesson one also writes an SVG waveform picture. Later lessons may also write a short CSV plot slice for tutorial drafting.

To run the composed demo:

```bash
PYTHONPATH=src python3 -m gameboy_audio.main
```

No external dependencies are needed.

## Website

The static tutorial site lives in `website/`.

Current site chapters:

1. Samples and speaker offsets
2. Wave shapes
3. Noise
4. Two pulse voices
5. Wavetable / CH3
6. Game Boy-style channel interface

For local development with live reload:

```bash
npx live-server website --host=127.0.0.1 --port=8080 --watch=website --no-browser
```

GitHub Pages is configured through `.github/workflows/pages.yml`; pushes to `main` deploy the `website/` folder.

## Teaching order

The right way to teach this is not to throw the whole player at the reader first. The useful build-up is:

1. `01_sample_loop.py`: a WAV is just a list of numbers over time.
2. `02_pulse_duty.py`: a pulse channel is a phase counter plus an 8-step duty pattern.
3. `03_wave_channel.py`: channel 3 loops through 32 tiny 4-bit samples.
4. `04_noise_lfsr.py`: channel 4 clocks an LFSR to make pseudo-random bits.
5. `05_tiny_player.py`: our software arranges these sounds over time.

The last point matters: **the Game Boy APU did not use note events.** The hardware exposes registers. A game or music driver writes new register values over time. The Python "player" uses scheduling only because we are generating a WAV offline.

## The useful mental model

Every audio channel is a simple oscillator:

- A pulse channel advances a phase from `0..1`, looks up one of 8 duty-pattern steps, and outputs `-1` or `+1`.
- The wave channel advances a phase from `0..1`, reads one of 32 4-bit samples, and scales it to `-1..+1`.
- The noise channel does not use a smooth phase. It clocks an LFSR and turns its low bit into `-1` or `+1`.
- Envelopes change volume over time.
- Sweep changes pitch over time.

The real hardware is register-driven and has exact timers. These sketches are intentionally less exact so the important ideas stay visible.

## Pulse frequency formula

Pulse and wave channels use an 11-bit period value, often called `x`:

```text
frequency = 4194304 / (32 * (2048 - x))
x = 2048 - 4194304 / (32 * frequency)
```

For tutorial UI, this is a good place to show both:

- the musician-facing value: "C5", "523.25 Hz"
- the hardware-facing value: "period 1797"

## Register-ish pulse note

To trigger channel 2 on hardware, the shape is roughly:

```text
NR21 = duty + length
NR22 = starting volume + envelope direction + envelope pace
NR23 = low 8 bits of frequency period
NR24 = high 3 bits of frequency period + trigger bit
```

Channel 1 has similar registers, plus `NR10` for sweep. Channel 3 uses wave RAM and output level controls. Channel 4 replaces pitch period with noise clock/divisor/width settings.
