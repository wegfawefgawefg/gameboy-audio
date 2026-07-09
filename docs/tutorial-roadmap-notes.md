# Tutorial Roadmap Notes

## Current Quality Read

The core arc is good:

1. Start with samples as speaker offset numbers.
2. Shape those samples into waves.
3. Turn waves into notes.
4. Turn notes into sequences.
5. Add noise.
6. Bottle the pieces into a small renderer/player.

That path makes Game Boy-ish sound feel like normal audio programming with constraints, not magic hardware lore.

## Strong Parts

- The "samples are membrane offsets" framing works.
- The toys are useful because the reader can see and hear the same idea.
- Code-first is the right style for this.
- Route 3 / recognizable-song demos are the money shot.
- Bonus chapters are the right place for rabbit holes like speakers, LFSR, and wavetable sampling.

## Weak Spots

- Tone consistency still needs a pass. Some pages sound like the intended voice, some sound more generic tutorial.
- Chapter 2 has a lot in it: square, triangle, sine, pulse, duty, and Game Boy context. It needs clean transitions.
- The Game Boy channel model needs one concise diagram somewhere:

```text
2 pulse channels + 1 wavetable channel + 1 noise channel -> mixer -> speaker
```

- Volume envelopes are under-taught.
- Timing/ticks/frame updates need a clean explanation eventually.
- Mixing/clipping needs a small honest section: adding waves can exceed the output range.

## Missing Mainline Topics

These probably belong in the main tutorial or very near it:

- Envelope / ADSR-ish volume over time.
- Frequency slide / pitch sweep.
- Arpeggios.
- Vibrato.
- Clipping and output range.
- Quantization / bit depth.
- Panning / stereo.
- Tracker-style song data.

## Followup Tutorial Paths

Good directions after the main tutorial:

- Tiny synth from scratch: oscillators, envelopes, filters, LFOs, modulation, clipping.
- Filters and delay lines: low-pass, high-pass, moving average, comb filters, feedback delay, reverb-ish things.
- Make a tracker: pattern grid, channels, note/effect columns, playback cursor.
- Game Boy hardware deeper dive: registers, length counters, envelope unit, sweep unit, frame sequencer, DAC, mixer.
- Chiptune composition tricks: arps, duty changes, fake echo, bass/melody sharing, drum noise recipes.
- Sampling / wavetable weirdness: crushing real sounds, 1-bit playback, wave RAM tricks, Yellow Pikachu sound.

## Recommended Scope

Keep the main tutorial focused:

1. What are samples?
2. Shape samples.
3. Sequence notes.
4. Noise.
5. Bottle it up into a tiny player.

Keep tangents quarantined as bonus chapters:

- Speakers are lying to you.
- More Game Boy-ish noise: LFSR.
- Sampling real sounds: wavetable.
- Hardware interface/registers.
- Synth/filter rabbit hole.

Main path goal:

```text
Get the reader to "I can code a tiny Game Boy-ish song" as fast as possible.
```
