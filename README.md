# Game Boy audio sketch

This repo is a small Python sketch for understanding the Game Boy audio chip before turning it into an interactive web tutorial.

The original Game Boy APU has four sound channels:

1. **CH1 pulse**: square/pulse wave with 4 duty cycles, volume envelope, and frequency sweep.
2. **CH2 pulse**: another square/pulse wave with 4 duty cycles and volume envelope, but no sweep.
3. **CH3 wave**: a custom 32-sample wavetable. Each sample is only 4 bits.
4. **CH4 noise**: pseudo-random noise from a linear-feedback shift register, usually used for drums, hats, explosions, and texture.

So it is not exactly "three voices and a noise one." It is two pulse voices, one tiny wavetable voice, and one noise voice.

## Run

```bash
python main.py
```

This writes:

- `out/gameboy_demo.wav`: a tiny mixed demo
- `out/first_40ms.csv`: the first 40 ms of samples for plotting

No external dependencies are needed.

## The useful mental model

Every audio channel is a simple oscillator:

- A pulse channel advances a phase from `0..1`, looks up one of 8 duty-pattern steps, and outputs `-1` or `+1`.
- The wave channel advances a phase from `0..1`, reads one of 32 4-bit samples, and scales it to `-1..+1`.
- The noise channel does not use a smooth phase. It clocks an LFSR and turns its low bit into `-1` or `+1`.
- Envelopes change volume over time.
- Sweep changes pitch over time.

The real hardware is register-driven and has exact timers. This sketch is intentionally less exact so the important ideas stay visible.

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
