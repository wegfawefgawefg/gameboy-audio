const CHAPTER_SAMPLE_RATE = 44100;

let chapterAudio = null;
let chapterAudioUrl = null;
let cursorFrame = null;
let activeVisualName = null;
let waveAudioContext = null;
let activeWave = null;
let liveRandomNoise = null;
let variedNoiseLoop = null;

const waveRenderState = {
  square: { frequency: 220, volume: 0.42, phase: 0 },
  triangle: { frequency: 220, volume: 0.42, phase: 0 },
  sine: { frequency: 220, volume: 0.42, phase: 0 },
  pulse: { frequency: 220, volume: 0.42, phase: 0, duty: 0.25 },
};

const GAMEBOY_DUTIES = [0.125, 0.25, 0.5, 0.75];

const wavetableToyState = {
  frequency: 220,
  volume: 0.22,
  table: [
    1, 1, 1, 1, 1, 1, 1, 1,
    -1, -1, -1, -1, -1, -1, -1, -1,
    1, 1, 1, 1, 1, 1, 1, 1,
    -1, -1, -1, -1, -1, -1, -1, -1,
  ],
};

const WAVE_STREAM_CLIPS = {
  fight: {
    source: "assets/audio/wavetable/fight-source.wav",
    raced: "assets/audio/wavetable/fight-raced.wav",
    dmg: "assets/audio/wavetable/fight-dmg.wav",
  },
  scream: {
    source: "assets/audio/wavetable/scream-source.wav",
    raced: "assets/audio/wavetable/scream-raced.wav",
    dmg: "assets/audio/wavetable/scream-dmg.wav",
  },
  roar: {
    source: "assets/audio/wavetable/roar-source.wav",
    raced: "assets/audio/wavetable/roar-raced.wav",
    dmg: "assets/audio/wavetable/roar-dmg.wav",
  },
  crash: {
    source: "assets/audio/wavetable/crash-source.wav",
    raced: "assets/audio/wavetable/crash-raced.wav",
    dmg: "assets/audio/wavetable/crash-dmg.wav",
  },
  cat: {
    source: "assets/audio/wavetable/cat-source.wav",
    raced: "assets/audio/wavetable/cat-raced.wav",
    dmg: "assets/audio/wavetable/cat-dmg.wav",
  },
  laser: {
    source: "assets/audio/wavetable/laser-source.wav",
    raced: "assets/audio/wavetable/laser-raced.wav",
    dmg: "assets/audio/wavetable/laser-dmg.wav",
  },
  glass: {
    source: "assets/audio/wavetable/glass-source.wav",
    raced: "assets/audio/wavetable/glass-raced.wav",
    dmg: "assets/audio/wavetable/glass-dmg.wav",
  },
  step: {
    source: "assets/audio/wavetable/step-source.wav",
    raced: "assets/audio/wavetable/step-raced.wav",
    dmg: "assets/audio/wavetable/step-dmg.wav",
  },
};

const WAV_FILE_VISUALS = {
  "pikachu-yellow-target": [
    ["yellow_target", "assets/audio/wavetable/pikachu-yellow-target.wav", "#6d4bd4"],
  ],
  "pikachu-user-crush": [
    ["pikachu.wav", "assets/audio/wavetable/pikachu-user-source.wav", "#ff9f1c"],
    ["yellow_1bit", "assets/audio/wavetable/pikachu-user-yellow-1bit.wav", "#0c9b58"],
  ],
};

const wavFileCache = new Map();
const wavVisualLoading = new Set();

const PALLET_BEAT_SECONDS = 0.5;
const PALLET_LEAD = [
  [0, 0.489583, "D6"],
  [0.5, 0.489583, "C6"],
  [1, 0.489583, "B5"],
  [1.5, 0.489583, "A5"],
  [2, 0.489583, "G6"],
  [2.5, 0.489583, "E6"],
  [3, 0.489583, "F#6"],
  [3.5, 0.489583, "E6"],
  [4, 1.48958, "D6"],
  [5.5, 0.489583, "B5"],
  [6, 0.489583, "G5"],
  [6.5, 0.489583, "G5"],
  [7, 0.489583, "A5"],
  [7.5, 0.489583, "B5"],
  [8, 1.98958, "C6"],
  [10.5, 0.489583, "F#5"],
  [11, 0.489583, "G5"],
  [11.5, 0.489583, "A5"],
  [12, 1.48958, "B5"],
  [13.5, 0.239583, "C6"],
  [13.75, 0.239583, "B5"],
  [14, 1.98958, "A5"],
  [16, 0.489583, "D6"],
  [16.5, 0.489583, "C6"],
  [17, 0.489583, "B5"],
  [17.5, 0.489583, "D6"],
  [18, 0.489583, "G6"],
  [18.5, 0.489583, "F#6"],
  [19, 0.489583, "F#6"],
  [19.5, 0.489583, "G6"],
  [20, 1.48958, "E6"],
  [21.5, 2.48958, "D6"],
  [24, 0.489583, "C6"],
  [24.5, 0.489583, "B5"],
  [25, 0.489583, "A5"],
  [25.5, 0.489583, "G5"],
  [26, 0.489583, "D6"],
  [26.5, 0.489583, "C6"],
  [27, 0.489583, "B5"],
  [27.5, 0.489583, "A5"],
  [28, 1.98958, "G5"],
  [30.5, 0.489583, "G5"],
  [31, 0.489583, "A5"],
  [31.5, 0.489583, "B5"],
  [32, 1.98958, "C6"],
  [34, 1.48958, "D6"],
  [35.5, 0.489583, "C6"],
  [36, 1.98958, "B5"],
  [38.5, 0.489583, "G5"],
  [39, 0.489583, "A5"],
  [39.5, 0.489583, "B5"],
  [40, 0.989583, "C6"],
  [41, 0.989583, "C6"],
  [42, 1.48958, "D6"],
  [43.5, 0.239583, "C6"],
  [43.75, 0.239583, "D6"],
  [44, 1.98958, "B5"],
  [46.5, 0.489583, "B5"],
  [47, 0.489583, "A5"],
  [47.5, 0.489583, "G5"],
  [48, 1.98958, "A5"],
  [50, 0.989583, "E5"],
  [51, 0.989583, "B5"],
  [52, 1.98958, "A5"],
  [54, 0.989583, "G5"],
  [55, 0.989583, "E5"],
  [56, 1.98958, "F#5"],
  [58, 0.989583, "G5"],
  [59, 0.989583, "B5"],
  [60, 1.98958, "B5"],
  [62, 1.98958, "A5"],
];
const PALLET_BACKING = [
  [0, 1.48958, "G4"],
  [1.5, 1.48958, "E4"],
  [3, 0.989583, "F#4"],
  [4, 1.48958, "G4"],
  [5.5, 1.48958, "A4"],
  [7, 0.989583, "G4"],
  [8, 1.48958, "E4"],
  [9.5, 1.48958, "F#4"],
  [11, 0.989583, "E4"],
  [12, 1.48958, "G4"],
  [13.5, 1.48958, "E4"],
  [15, 0.989583, "D4"],
  [16, 1.48958, "G4"],
  [17.5, 1.48958, "E4"],
  [19, 0.989583, "F#4"],
  [20, 1.48958, "G4"],
  [21.5, 1.48958, "A4"],
  [23, 0.989583, "G4"],
  [24, 1.48958, "E4"],
  [25.5, 1.48958, "F#4"],
  [27, 0.989583, "A4"],
  [28, 1.48958, "G4"],
  [29.5, 1.48958, "E4"],
  [31, 0.989583, "D4"],
  [32, 1.98958, "C4"],
  [34, 1.98958, "D4"],
  [36, 1.48958, "G4"],
  [37.5, 1.48958, "E4"],
  [39, 0.989583, "D4"],
  [40, 1.98958, "C4"],
  [42, 1.98958, "D4"],
  [44, 1.98958, "G4"],
  [46, 0.989583, "A4"],
  [47, 0.989583, "G4"],
  [48, 1.98958, "E4"],
  [50, 1.98958, "A4"],
  [52, 1.98958, "E4"],
  [54, 1.98958, "G4"],
  [56, 1.98958, "F#4"],
  [58, 1.98958, "E4"],
  [60, 1.98958, "E4"],
  [62, 1.98958, "F#4"],
];

const ROUTE3_UNIT_SECONDS = 60 / 148 / 4;
const ROUTE3_TOTAL_STEPS = 104;
const ROUTE3_PULSE_1 = [
  ["E3", 0, 6], ["D3", 6, 1], ["E3", 7, 1], ["C3", 8, 4],
  ["E3", 12, 4], ["C3", 16, 6], ["D3", 22, 1], ["E3", 23, 1],
  ["F3", 24, 2], ["G3", 26, 2], ["G3", 28, 2], ["A3", 30, 2],
  ["A#3", 32, 8], ["F3", 40, 8], ["D3", 48, 8], ["F3", 56, 8],
];
const ROUTE3_PULSE_2 = [
  ["C4", 0, 6], ["G3", 6, 1], ["C4", 7, 1], ["E4", 8, 10],
  ["G3", 18, 2], ["C4", 20, 2], ["G4", 22, 2], ["F4", 24, 2],
  ["E4", 26, 2], ["D4", 28, 2], ["C4", 30, 2], ["D4", 32, 8],
  ["F4", 40, 8], ["A#3", 48, 8], ["A3", 56, 8],
];
const ROUTE3_DRUMS = [
  [0, 17, 12], [12, 17, 2], [14, 18, 2], [16, 17, 4], [20, 17, 4],
  [24, 19, 1], [25, 19, 1], [26, 19, 1], [27, 19, 1],
  [28, 18, 1], [29, 18, 1], [30, 18, 1], [31, 18, 1],
];
const ROUTE3_WAVE = [
  ["E4", 0, 1], ["REST", 1, 1], ["G4", 2, 4],
  ["E4", 6, 1], ["E4", 7, 1], ["E4", 8, 1], ["REST", 9, 1],
  ["E4", 10, 1], ["REST", 11, 1], ["G4", 12, 4],
  ["E4", 16, 1], ["REST", 17, 1], ["G4", 18, 4],
  ["E4", 22, 1], ["E4", 23, 1], ["E4", 24, 1], ["REST", 25, 1],
  ["E4", 26, 1], ["REST", 27, 1], ["G4", 28, 2], ["A4", 30, 2],
  ["F4", 32, 1], ["REST", 33, 1], ["A#4", 34, 4],
  ["F4", 38, 1], ["F4", 39, 1], ["F4", 40, 1], ["REST", 41, 1],
  ["F4", 42, 1], ["REST", 43, 1], ["A#4", 44, 4],
  ["F4", 48, 1], ["REST", 49, 1], ["A#4", 50, 4],
  ["F4", 54, 1], ["F4", 55, 1], ["F4", 56, 1], ["REST", 57, 1],
  ["F4", 58, 1], ["REST", 59, 1], ["A#4", 60, 2], ["F4", 62, 2],
];
const GAMEBOYISH_PULSE_WAVETABLE = [
  15, 15, 15, 15, 15, 15, 15, 15,
  0, 0, 0, 0, 0, 0, 0, 0,
  15, 15, 15, 15, 15, 15, 15, 15,
  0, 0, 0, 0, 0, 0, 0, 0,
];
let route3HoverId = null;
let route3HoverTime = null;
const route3CanvasHitboxes = new WeakMap();
let route3VisualCache = null;
const route3VariantVisualCache = new Map();

function sineSample(index, frequency, volume) {
  const time = index / CHAPTER_SAMPLE_RATE;
  return Math.sin(2 * Math.PI * frequency * time) * volume;
}

function squareSample(index, frequency, volume, duty = 0.5) {
  const time = index / CHAPTER_SAMPLE_RATE;
  const phase = (frequency * time) % 1;
  return (phase < duty ? 1 : -1) * volume;
}

function triangleSample(index, frequency, volume) {
  const time = index / CHAPTER_SAMPLE_RATE;
  const phase = (frequency * time) % 1;
  const raw = 1 - 4 * Math.abs(phase - 0.5);
  return raw * volume;
}

function pulseLeadSample(index, frequency, volume) {
  return squareSample(index, frequency, volume, 0.25);
}

function brightLeadSample(index, frequency, volume) {
  return (
    sineSample(index, frequency, volume)
    + sineSample(index, frequency * 2, volume * 0.35)
    + squareSample(index, frequency * 3, volume * 0.18)
  );
}

function lfsrNoise(seconds, volume, options = {}) {
  const sampleCount = Math.floor(CHAPTER_SAMPLE_RATE * seconds);
  const samples = new Float32Array(sampleCount);
  let lfsr = 0x7fff;
  let current = 1;
  const holdSamples = Math.max(1, Math.round(options.holdSamples || 9));
  const fadeSeconds = options.fadeSeconds || 0.45;
  const tap = options.tap || (options.shortMode ? 6 : 1);

  for (let i = 0; i < samples.length; i += 1) {
    if (i % holdSamples === 0) {
      const bit = (lfsr ^ (lfsr >> tap)) & 1;
      lfsr = (lfsr >> 1) | (bit << 14);
      current = lfsr & 1 ? -1 : 1;
    }
    const fade = Math.max(0, 1 - i / (CHAPTER_SAMPLE_RATE * fadeSeconds));
    samples[i] = current * volume * fade;
  }

  return samples;
}

function randomNoise(seconds, volume) {
  const sampleCount = Math.floor(CHAPTER_SAMPLE_RATE * seconds);
  const samples = new Float32Array(sampleCount);

  for (let i = 0; i < samples.length; i += 1) {
    samples[i] = (Math.random() * 2 - 1) * volume;
  }

  return samples;
}

function seededRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function heldRandomNoise({ seconds = 0.8, volume = 0.22, holdSamples = 9, fadeSeconds = 0, random = Math.random }) {
  const sampleCount = Math.floor(CHAPTER_SAMPLE_RATE * seconds);
  const samples = new Float32Array(sampleCount);
  const hold = Math.max(1, Math.round(holdSamples));
  let current = random() * 2 - 1;

  for (let i = 0; i < samples.length; i += 1) {
    if (i % hold === 0) {
      current = random() * 2 - 1;
    }

    const fade = fadeSeconds > 0
      ? Math.max(0, 1 - i / (CHAPTER_SAMPLE_RATE * fadeSeconds))
      : 1;
    samples[i] = current * volume * fade;
  }

  return samples;
}

function bitFeedback(mode, a, b, c) {
  if (mode === "xor") return a ^ b;
  if (mode === "xnor") return 1 - (a ^ b);
  if (mode === "and") return a & b;
  if (mode === "nand") return 1 - (a & b);
  if (mode === "or") return a | b;
  if (mode === "xor_or") return (a ^ b) | c;
  if (mode === "xor_and") return (a ^ b) & (1 - c);
  if (mode === "majority") return a + b + c >= 2 ? 1 : 0;
  if (mode === "parity3") return a ^ b ^ c;
  return a ^ b;
}

function feedbackShiftNoise({ mode, length, tapA, tapB, holdSamples, seconds = 0.85, volume = 0.34 }) {
  const sampleCount = Math.floor(CHAPTER_SAMPLE_RATE * seconds);
  const samples = new Float32Array(sampleCount);
  let register = (1 << Math.min(length, 30)) - 1;
  let current = 1;
  const hold = Math.max(1, Math.round(holdSamples || 9));
  const mask = (1 << Math.min(length, 30)) - 1;

  for (let i = 0; i < samples.length; i += 1) {
    if (i % hold === 0) {
      const a = register & 1;
      const b = (register >> tapA) & 1;
      const c = (register >> tapB) & 1;
      const bit = bitFeedback(mode, a, b, c);
      register = ((register >> 1) | (bit << (Math.min(length, 30) - 1))) & mask;
      current = register & 1 ? -1 : 1;
    }
    const fade = Math.max(0, 1 - i / (CHAPTER_SAMPLE_RATE * 0.55));
    samples[i] = current * volume * fade;
  }

  return samples;
}

function continuousFeedback(mode, a, b, c, drive) {
  if (mode === "soft_xor") return Math.tanh((a - b) * drive);
  if (mode === "soft_and") return Math.tanh((a * b) * drive);
  if (mode === "soft_or") return Math.tanh((a + b + a * b) * drive * 0.5);
  if (mode === "sine_mix") return Math.sin(a * drive + b * drive * 0.7 + c * drive * 0.35);
  if (mode === "fold") {
    const x = (a - b + c * 0.5) * drive;
    return Math.sin(x) * (1 - Math.abs(Math.sin(x * 0.5)) * 0.35);
  }
  if (mode === "logistic") return (1 / (1 + Math.exp(-(a - b + c) * drive))) * 2 - 1;
  return Math.tanh((a - b) * drive);
}

function continuousShiftNoise({ mode, length, tapA, tapB, drive, holdSamples, seconds = 1.0, volume = 0.30 }) {
  const sampleCount = Math.floor(CHAPTER_SAMPLE_RATE * seconds);
  const samples = new Float32Array(sampleCount);
  const state = Array.from({ length }, (_, i) => Math.sin(i * 12.9898));
  let current = state[state.length - 1];
  const hold = Math.max(1, Math.round(holdSamples || 5));

  for (let i = 0; i < samples.length; i += 1) {
    if (i % hold === 0) {
      const a = state[state.length - 1];
      const b = state[state.length - 1 - (tapA % state.length)];
      const c = state[state.length - 1 - (tapB % state.length)];
      const next = continuousFeedback(mode, a, b, c, drive);
      state.pop();
      state.unshift(next);
      current = state[state.length - 1];
    }
    const fade = Math.max(0, 1 - i / (CHAPTER_SAMPLE_RATE * 0.8));
    samples[i] = current * volume * fade;
  }

  return samples;
}

function midiReadString(view, offset, length) {
  let text = "";
  for (let i = 0; i < length; i += 1) text += String.fromCharCode(view.getUint8(offset + i));
  return text;
}

function midiReadVar(view, cursor) {
  let value = 0;
  while (true) {
    const byte = view.getUint8(cursor.offset);
    cursor.offset += 1;
    value = (value << 7) | (byte & 0x7f);
    if ((byte & 0x80) === 0) return value;
  }
}

function midiTickToSeconds(tick, tempos, ticksPerBeat) {
  let seconds = 0;
  let previousTick = 0;
  let mpq = 500000;

  for (const tempo of tempos) {
    if (tempo.tick > tick) break;
    seconds += ((tempo.tick - previousTick) / ticksPerBeat) * (mpq / 1000000);
    previousTick = tempo.tick;
    mpq = tempo.mpq;
  }

  seconds += ((tick - previousTick) / ticksPerBeat) * (mpq / 1000000);
  return seconds;
}

function parseMidi(arrayBuffer) {
  const view = new DataView(arrayBuffer);
  let offset = 0;

  if (midiReadString(view, offset, 4) !== "MThd") throw new Error("Missing MIDI header");
  offset += 4;
  const headerLength = view.getUint32(offset); offset += 4;
  const format = view.getUint16(offset); offset += 2;
  const trackCount = view.getUint16(offset); offset += 2;
  const ticksPerBeat = view.getUint16(offset); offset += 2;
  offset = 8 + headerLength;

  const events = [];
  const tempos = [{ tick: 0, mpq: 500000 }];
  const trackNames = [];

  for (let trackIndex = 0; trackIndex < trackCount; trackIndex += 1) {
    if (midiReadString(view, offset, 4) !== "MTrk") throw new Error("Missing MIDI track");
    offset += 4;
    const trackLength = view.getUint32(offset); offset += 4;
    const end = offset + trackLength;
    const cursor = { offset };
    let tick = 0;
    let runningStatus = 0;
    let trackName = "";

    while (cursor.offset < end) {
      tick += midiReadVar(view, cursor);
      let status = view.getUint8(cursor.offset);

      if (status < 0x80) {
        status = runningStatus;
      } else {
        cursor.offset += 1;
        if (status < 0xf0) runningStatus = status;
      }

      if (status === 0xff) {
        const metaType = view.getUint8(cursor.offset); cursor.offset += 1;
        const length = midiReadVar(view, cursor);
        if (metaType === 0x51 && length === 3) {
          const mpq = (view.getUint8(cursor.offset) << 16) | (view.getUint8(cursor.offset + 1) << 8) | view.getUint8(cursor.offset + 2);
          tempos.push({ tick, mpq });
        } else if (metaType === 0x03) {
          trackName = midiReadString(view, cursor.offset, length);
        }
        cursor.offset += length;
        continue;
      }

      if (status === 0xf0 || status === 0xf7) {
        const length = midiReadVar(view, cursor);
        cursor.offset += length;
        continue;
      }

      const type = status & 0xf0;
      const channel = status & 0x0f;
      const data1 = view.getUint8(cursor.offset); cursor.offset += 1;
      let data2 = 0;
      if (type !== 0xc0 && type !== 0xd0) {
        data2 = view.getUint8(cursor.offset); cursor.offset += 1;
      }

      if (type === 0x90 || type === 0x80) {
        events.push({
          tick,
          trackIndex,
          channel,
          note: data1,
          velocity: type === 0x90 ? data2 : 0,
        });
      }
    }

    trackNames[trackIndex] = trackName;
    offset = end;
  }

  tempos.sort((a, b) => a.tick - b.tick);
  events.sort((a, b) => a.tick - b.tick);

  const active = new Map();
  const notes = [];

  for (const event of events) {
    const key = `${event.trackIndex}:${event.channel}:${event.note}`;
    if (event.velocity > 0) {
      if (!active.has(key)) active.set(key, []);
      active.get(key).push(event);
    } else if (active.has(key) && active.get(key).length) {
      const start = active.get(key).shift();
      notes.push({
        trackIndex: start.trackIndex,
        channel: start.channel,
        note: start.note,
        velocity: start.velocity,
        start: midiTickToSeconds(start.tick, tempos, ticksPerBeat),
        end: midiTickToSeconds(event.tick, tempos, ticksPerBeat),
      });
    }
  }

  return { format, trackCount, ticksPerBeat, trackNames, notes };
}

function midiNoteFrequency(note) {
  return 440 * (2 ** ((note - 69) / 12));
}

function midiGroupId(note) {
  return `${note.trackIndex}:${note.channel}`;
}

function midiGroupLabel(group, trackNames) {
  const trackName = trackNames[group.trackIndex] ? ` ${trackNames[group.trackIndex]}` : "";
  const channelName = group.channel === 9 ? "percussion" : `channel ${group.channel + 1}`;
  return `track ${group.trackIndex + 1}${trackName} / ${channelName} / ${group.count} notes`;
}

function renderMidiPreview(midi, enabledGroups) {
  const maxSeconds = 32;
  const lastEnd = midi.notes.reduce((latest, note) => Math.max(latest, note.end), 0);
  const seconds = Math.min(maxSeconds, Math.max(1, lastEnd));
  const samples = new Float32Array(Math.floor(seconds * CHAPTER_SAMPLE_RATE));
  const groupOrder = Array.from(new Set(midi.notes.map(midiGroupId)));

  for (const note of midi.notes) {
    if (note.start >= seconds || !enabledGroups.has(midiGroupId(note))) continue;
    const duration = Math.max(0.03, Math.min(note.end - note.start, seconds - note.start));
    const volume = Math.min(0.16, 0.05 + note.velocity / 127 * 0.10);

    if (note.channel === 9) {
      addNoiseHit(samples, note.start, Math.min(0.10, duration), volume * 2.2);
      continue;
    }

    const voiceIndex = groupOrder.indexOf(midiGroupId(note)) % 3;
    const frequency = midiNoteFrequency(note.note);
    if (voiceIndex === 0) addWaveNote(samples, squareSample, frequency, note.start, duration, volume);
    else if (voiceIndex === 1) addPulseNote(samples, frequency, note.start, duration, volume, 0.25);
    else addWaveNote(samples, triangleSample, frequency, note.start, duration, volume * 0.8);
  }

  return samples;
}

function waveTableSample(index, frequency, volume, table) {
  const time = index / CHAPTER_SAMPLE_RATE;
  const phase = (frequency * time) % 1;
  const tableIndex = Math.floor(phase * table.length) % table.length;
  return table[tableIndex] * volume;
}

function gameBoyWaveSample(index, frequency, volume, table = GAMEBOYISH_PULSE_WAVETABLE) {
  const time = index / CHAPTER_SAMPLE_RATE;
  const phase = (frequency * time) % 1;
  const tableIndex = Math.floor(phase * table.length) % table.length;
  return ((table[tableIndex] / 15) * 2 - 1) * volume;
}

function wavetableVisualSample(i, frequency, table, visualRate) {
  const time = i / visualRate;
  const phase = (frequency * time) % 1;
  const tableIndex = Math.floor(phase * table.length) % table.length;
  return table[tableIndex];
}

function wavetableFromPreset(preset) {
  if (preset === "triangle") {
    return Array.from({ length: 32 }, (_, i) => {
      const phase = i / 32;
      return 1 - 4 * Math.abs(phase - 0.5);
    });
  }

  if (preset === "saw") {
    return Array.from({ length: 32 }, (_, i) => (i / 31) * 2 - 1);
  }

  if (preset === "stair") {
    return Array.from({ length: 32 }, (_, i) => {
      if (i < 8) return -0.75;
      if (i < 16) return -0.15;
      if (i < 24) return 0.35;
      return 0.85;
    });
  }

  if (preset === "soft") {
    return Array.from({ length: 32 }, (_, i) => (
      Math.sin(2 * Math.PI * i / 32) * 0.72
      + Math.sin(4 * Math.PI * i / 32) * 0.18
    ));
  }

  return Array.from({ length: 32 }, (_, i) => (i % 16 < 8 ? 1 : -1));
}

function buildWavetableToySamples(seconds = 1.2) {
  const sampleCount = Math.floor(CHAPTER_SAMPLE_RATE * seconds);
  const samples = new Float32Array(sampleCount);

  for (let i = 0; i < samples.length; i += 1) {
    const fade = Math.min(1, i / 600, (samples.length - i) / 600);
    samples[i] = waveTableSample(
      i,
      wavetableToyState.frequency,
      wavetableToyState.volume,
      wavetableToyState.table,
    ) * fade;
  }

  return samples;
}

function buildTone({ seconds = 1, frequency = 220, volume = 0.35, type = "sine" }) {
  const sampleCount = Math.floor(CHAPTER_SAMPLE_RATE * seconds);
  const samples = new Float32Array(sampleCount);
  const table = [
    -1, -0.75, -0.5, -0.25, 0, 0.25, 0.5, 0.75,
    1, 0.75, 0.5, 0.25, 0, -0.25, -0.5, -0.75,
  ];

  for (let i = 0; i < samples.length; i += 1) {
    const fade = Math.min(1, i / 400, (samples.length - i) / 400);
    if (type === "square") samples[i] = squareSample(i, frequency, volume) * fade;
    else if (type === "triangle") samples[i] = triangleSample(i, frequency, volume) * fade;
    else if (type === "wavetable") samples[i] = waveTableSample(i, frequency, volume, table) * fade;
    else samples[i] = sineSample(i, frequency, volume) * fade;
  }

  return samples;
}

function buildFilteredSquare() {
  const seconds = 1.6;
  const sampleCount = Math.floor(CHAPTER_SAMPLE_RATE * seconds);
  let samples = new Float32Array(sampleCount);

  for (let i = 0; i < samples.length; i += 1) {
    samples[i] = squareSample(i, 220, 0.42);
  }

  for (let pass = 0; pass < 5; pass += 1) {
    const next = new Float32Array(sampleCount);

    for (let i = 0; i < samples.length; i += 1) {
      const previous = samples[Math.max(0, i - 1)];
      const current = samples[i];
      const following = samples[Math.min(samples.length - 1, i + 1)];
      next[i] = (previous + current + following) / 3;
    }

    samples = next;
  }

  for (let i = 0; i < samples.length; i += 1) {
    const fade = Math.min(1, i / 2400, (samples.length - i) / 2400);
    samples[i] *= fade;
  }

  return samples;
}

function renderVoice(sampleFunction, seconds, frequency, volume) {
  const sampleCount = Math.floor(CHAPTER_SAMPLE_RATE * seconds);
  const samples = new Float32Array(sampleCount);

  for (let i = 0; i < samples.length; i += 1) {
    const fade = Math.min(1, i / 400, (samples.length - i) / 400);
    samples[i] = sampleFunction(i, frequency, volume) * fade;
  }

  return samples;
}

function buildCompositingSequence() {
  const firstNote = renderVoice(squareSample, 0.5, 220, 0.28);
  const secondNote = renderVoice(squareSample, 0.5, 330, 0.28);
  const samples = new Float32Array(firstNote.length + secondNote.length);

  for (let i = 0; i < firstNote.length; i += 1) {
    samples[i] = firstNote[i];
  }
  for (let i = 0; i < secondNote.length; i += 1) {
    samples[firstNote.length + i] = secondNote[i];
  }

  return samples;
}

function buildCompositingOverlap() {
  const firstNote = renderVoice(squareSample, 0.8, 220, 0.22);
  const secondNote = renderVoice(squareSample, 0.8, 330, 0.22);
  const samples = new Float32Array(firstNote.length);

  for (let i = 0; i < samples.length; i += 1) {
    samples[i] = firstNote[i] + secondNote[i];
  }

  return samples;
}

function buildCompositingStaggered() {
  const firstNote = renderVoice(squareSample, 0.65, 220, 0.22);
  const secondNote = renderVoice(squareSample, 0.65, 330, 0.22);
  const samples = new Float32Array(Math.floor(CHAPTER_SAMPLE_RATE * 1.25));
  const secondStart = Math.floor(0.35 * CHAPTER_SAMPLE_RATE);

  for (let i = 0; i < firstNote.length; i += 1) {
    samples[i] += firstNote[i];
  }
  for (let i = 0; i < secondNote.length; i += 1) {
    const sampleIndex = secondStart + i;
    if (sampleIndex >= samples.length) break;
    samples[sampleIndex] += secondNote[i];
  }

  return samples;
}

function layeredVoiceNotes() {
  return [
    [squareSample, 392.00, 0.00, 0.42, 0.12],
    [sineSample, 493.88, 0.12, 0.42, 0.12],
    [triangleSample, 587.33, 0.24, 0.42, 0.12],
    [pulseLeadSample, 783.99, 0.36, 0.48, 0.10],
    [brightLeadSample, 987.77, 0.48, 0.58, 0.08],
    [triangleSample, 329.63, 0.00, 1.10, 0.10],
    [squareSample, 392.00, 0.55, 0.55, 0.08],
    [brightLeadSample, 659.25, 0.95, 0.42, 0.08],
    [pulseLeadSample, 739.99, 1.10, 0.42, 0.08],
    [sineSample, 587.33, 1.25, 0.55, 0.10],
  ];
}

function buildLayeredVoices() {
  const notes = layeredVoiceNotes();
  let endTime = 0;

  for (const [, , startTime, duration] of notes) {
    endTime = Math.max(endTime, startTime + duration);
  }

  const samples = new Float32Array(Math.floor(endTime * CHAPTER_SAMPLE_RATE));

  for (const [voice, frequency, startTime, duration, volume] of notes) {
    addWaveNote(samples, voice, frequency, startTime, duration, volume);
  }

  return samples;
}

function buildLookupSequence() {
  const notes = [
    ["C4", 0.00, 0.34, 0.18],
    ["E4", 0.18, 0.34, 0.18],
    ["G4", 0.36, 0.34, 0.18],
    ["A4", 0.54, 0.34, 0.18],
    ["C5", 0.72, 0.50, 0.18],
  ];
  let endTime = 0;

  for (const [, startTime, duration] of notes) {
    endTime = Math.max(endTime, startTime + duration);
  }

  const samples = new Float32Array(Math.floor(endTime * CHAPTER_SAMPLE_RATE));

  for (const [note, startTime, duration, volume] of notes) {
    addWaveNote(samples, squareSample, noteFrequency(note), startTime, duration, volume);
  }

  return samples;
}

function buildTwoVoices() {
  const seconds = 1.2;
  const sampleCount = Math.floor(CHAPTER_SAMPLE_RATE * seconds);
  const samples = new Float32Array(sampleCount);

  for (let i = 0; i < samples.length; i += 1) {
    const fade = Math.min(1, i / 400, (samples.length - i) / 400);
    const voice_a = squareSample(i, 220, 0.22, 0.5);
    const voice_b = squareSample(i, 330, 0.18, 0.25);
    samples[i] = (voice_a + voice_b) * fade;
  }

  return samples;
}

function noteFrequency(note) {
  const notes = {
    C3: 130.81,
    C4: 261.63,
    D4: 293.66,
    E4: 329.63,
    F4: 349.23,
    "F#4": 369.99,
    G4: 392.00,
    A4: 440.00,
    B4: 493.88,
    C5: 523.25,
    D5: 587.33,
    E5: 659.25,
    F5: 698.46,
    "F#5": 739.99,
    G5: 783.99,
    A5: 880.00,
    B5: 987.77,
    C6: 1046.50,
    D6: 1174.66,
    E6: 1318.51,
    F6: 1396.91,
    "F#6": 1479.98,
    G6: 1567.98,
    A6: 1760.00,
    B6: 1975.53,
  };
  if (notes[note]) return notes[note];

  const match = note.match(/^([A-G]#?)(-?\d+)$/);
  if (!match) return 440;

  const noteOffsets = {
    C: 0,
    "C#": 1,
    D: 2,
    "D#": 3,
    E: 4,
    F: 5,
    "F#": 6,
    G: 7,
    "G#": 8,
    A: 9,
    "A#": 10,
    B: 11,
  };
  const octave = Number(match[2]);
  const midiNote = (octave + 1) * 12 + noteOffsets[match[1]];
  return midiNoteFrequency(midiNote);
}

function buildSequence() {
  const sampleCount = Math.floor(CHAPTER_SAMPLE_RATE * 1.6);
  const samples = new Float32Array(sampleCount);
  const notes = [
    ["C4", 0.00, 0.20],
    ["E4", 0.22, 0.20],
    ["G4", 0.44, 0.20],
    ["C5", 0.66, 0.30],
  ];

  for (const [note, start, duration] of notes) {
    addPulseNote(samples, noteFrequency(note), start, duration, 0.22, 0.5);
  }

  return samples;
}

function buildTwoSequences() {
  const sampleCount = Math.floor(CHAPTER_SAMPLE_RATE * 1.6);
  const samples = new Float32Array(sampleCount);
  const melody = [
    ["C5", 0.00, 0.18],
    ["B4", 0.20, 0.18],
    ["G4", 0.40, 0.18],
    ["E4", 0.60, 0.28],
  ];
  const bass = [
    ["C4", 0.00, 0.38],
    ["G4", 0.40, 0.38],
  ];

  for (const [note, start, duration] of melody) {
    addPulseNote(samples, noteFrequency(note), start, duration, 0.18, 0.5);
  }
  for (const [note, start, duration] of bass) {
    addPulseNote(samples, noteFrequency(note), start, duration, 0.16, 0.25);
  }

  return samples;
}

function buildComposition() {
  const sampleCount = Math.floor(CHAPTER_SAMPLE_RATE * 1.8);
  const samples = new Float32Array(sampleCount);
  const melody = [
    ["C5", 0.00, 0.16],
    ["E5", 0.20, 0.16],
    ["G4", 0.40, 0.16],
    ["C5", 0.60, 0.28],
  ];
  const bass = [
    ["C4", 0.00, 0.38],
    ["G4", 0.40, 0.38],
    ["C4", 0.80, 0.38],
  ];

  for (const [note, start, duration] of melody) {
    addPulseNote(samples, noteFrequency(note), start, duration, 0.17, 0.5);
  }
  for (const [note, start, duration] of bass) {
    addPulseNote(samples, noteFrequency(note), start, duration, 0.14, 0.25);
  }
  addNoiseHit(samples, 0.00, 0.08, 0.26);
  addNoiseHit(samples, 0.40, 0.08, 0.22);
  addNoiseHit(samples, 0.80, 0.08, 0.26);

  return samples;
}

function buildRoute3Sketch() {
  const songLength = ROUTE3_TOTAL_STEPS * ROUTE3_UNIT_SECONDS;
  const samples = new Float32Array(Math.floor(CHAPTER_SAMPLE_RATE * songLength));

  for (const [note, start, length] of ROUTE3_PULSE_1) {
    addPulseNote(samples, noteFrequency(note), start * ROUTE3_UNIT_SECONDS, length * ROUTE3_UNIT_SECONDS, 0.10, 0.50);
  }

  for (const [note, start, length] of ROUTE3_PULSE_2) {
    addPulseNote(samples, noteFrequency(note), start * ROUTE3_UNIT_SECONDS, length * ROUTE3_UNIT_SECONDS, 0.12, 0.25);
  }

  for (let bar = 0; bar < 3; bar += 1) {
    const barStart = bar * 32 * ROUTE3_UNIT_SECONDS;
    for (let index = 0; index < ROUTE3_DRUMS.length; index += 1) {
      const [offset, drum, length] = ROUTE3_DRUMS[index];
      const hold = drum === 19 ? 8 : drum === 18 ? 18 : 42;
      const volume = drum === 19 ? 0.18 : drum === 18 ? 0.16 : 0.22;
      addSeededRandomNoiseHit(samples, barStart + offset * ROUTE3_UNIT_SECONDS, length * ROUTE3_UNIT_SECONDS, volume, hold, 3200 + bar * 100 + index);
    }
  }

  return samples;
}

function route3FullChannels() {
  const songLength = ROUTE3_TOTAL_STEPS * ROUTE3_UNIT_SECONDS;
  const sampleCount = Math.floor(CHAPTER_SAMPLE_RATE * songLength);
  const pulse1 = new Float32Array(sampleCount);
  const pulse2 = new Float32Array(sampleCount);
  const wave = new Float32Array(sampleCount);
  const noise = new Float32Array(sampleCount);

  for (const [note, start, length] of ROUTE3_PULSE_1) {
    addPulseNote(pulse1, noteFrequency(note), start * ROUTE3_UNIT_SECONDS, length * ROUTE3_UNIT_SECONDS, 0.10, 0.50);
  }

  for (const [note, start, length] of ROUTE3_PULSE_2) {
    addPulseNote(pulse2, noteFrequency(note), start * ROUTE3_UNIT_SECONDS, length * ROUTE3_UNIT_SECONDS, 0.11, 0.25);
  }

  for (const [note, start, length] of ROUTE3_WAVE) {
    if (note === "REST") continue;
    addWaveTableNote(wave, noteFrequency(note), start * ROUTE3_UNIT_SECONDS, length * ROUTE3_UNIT_SECONDS, 0.09, GAMEBOYISH_PULSE_WAVETABLE);
  }

  for (let bar = 0; bar < 3; bar += 1) {
    const barStart = bar * 32 * ROUTE3_UNIT_SECONDS;
    for (let index = 0; index < ROUTE3_DRUMS.length; index += 1) {
      const [offset, drum, length] = ROUTE3_DRUMS[index];
      const hold = drum === 19 ? 8 : drum === 18 ? 18 : 42;
      const volume = drum === 19 ? 0.16 : drum === 18 ? 0.14 : 0.19;
      addSeededRandomNoiseHit(noise, barStart + offset * ROUTE3_UNIT_SECONDS, length * ROUTE3_UNIT_SECONDS, volume, hold, 5200 + bar * 100 + index);
    }
  }

  const mixed = addVisualVoices(addVisualVoices(addVisualVoices(pulse1, pulse2), wave), noise);
  return { pulse1, pulse2, wave, noise, mixed, songLength };
}

function buildRoute3FullSketch() {
  return route3FullChannels().mixed;
}

function buildRoute3IsolatedChannel(channelName) {
  const channels = route3FullChannels();
  if (channelName === "pulse1") return channels.pulse1;
  if (channelName === "pulse2") return channels.pulse2;
  if (channelName === "wave") return channels.wave;
  if (channelName === "noise") return channels.noise;
  return channels.mixed;
}

function buildRoute3Event(id) {
  if (id.startsWith("route3-p1-")) {
    const index = Number(id.replace("route3-p1-", ""));
    const [note, , length] = ROUTE3_PULSE_1[index] || [];
    if (!note) return null;
    const duration = length * ROUTE3_UNIT_SECONDS;
    const samples = new Float32Array(Math.floor(CHAPTER_SAMPLE_RATE * (duration + 0.04)));
    addPulseNote(samples, noteFrequency(note), 0, duration, 0.18, 0.50);
    return samples;
  }

  if (id.startsWith("route3-p2-")) {
    const index = Number(id.replace("route3-p2-", ""));
    const [note, , length] = ROUTE3_PULSE_2[index] || [];
    if (!note) return null;
    const duration = length * ROUTE3_UNIT_SECONDS;
    const samples = new Float32Array(Math.floor(CHAPTER_SAMPLE_RATE * (duration + 0.04)));
    addPulseNote(samples, noteFrequency(note), 0, duration, 0.18, 0.25);
    return samples;
  }

  if (id.startsWith("route3-w-")) {
    const index = Number(id.replace("route3-w-", ""));
    const [note, , length] = ROUTE3_WAVE[index] || [];
    if (!note || note === "REST") return null;
    const duration = length * ROUTE3_UNIT_SECONDS;
    const samples = new Float32Array(Math.floor(CHAPTER_SAMPLE_RATE * (duration + 0.04)));
    addWaveTableNote(samples, noteFrequency(note), 0, duration, 0.18, GAMEBOYISH_PULSE_WAVETABLE);
    return samples;
  }

  if (id.startsWith("route3-n-0-")) {
    const index = Number(id.replace("route3-n-0-", ""));
    const [, drum, length] = ROUTE3_DRUMS[index] || [];
    if (!drum) return null;
    const hold = drum === 19 ? 8 : drum === 18 ? 18 : 42;
    const volume = drum === 19 ? 0.26 : drum === 18 ? 0.24 : 0.30;
    const duration = length * ROUTE3_UNIT_SECONDS;
    const samples = new Float32Array(Math.floor(CHAPTER_SAMPLE_RATE * (duration + 0.04)));
    addSeededRandomNoiseHit(samples, 0, duration, volume, hold, 4400 + index);
    return samples;
  }

  return null;
}

function playRoute3Event(id) {
  const samples = buildRoute3Event(id);
  if (!samples) return;
  playSamples(samples, null, null, null);
}

function route3OverviewFrequency(note) {
  return Math.max(2.2, Math.min(7.5, noteFrequency(note) / 95));
}

function addRoute3OverviewNoise(output, startSeconds, durationSeconds, volume, holdSamples, seed, visualRate) {
  const start = Math.floor(startSeconds * visualRate);
  const length = Math.floor(durationSeconds * visualRate);
  const hold = Math.max(1, Math.round(holdSamples / 10));
  const random = seededRandom(seed);
  let current = random() * 2 - 1;

  for (let i = 0; i < length; i += 1) {
    const outputIndex = start + i;
    if (outputIndex >= output.length) break;
    if (i % hold === 0) current = random() * 2 - 1;
    const fade = Math.max(0, 1 - i / Math.max(1, length));
    output[outputIndex] += current * volume * fade;
  }
}

function route3SketchVisualData() {
  if (route3VisualCache) return route3VisualCache;

  const duration = ROUTE3_TOTAL_STEPS * ROUTE3_UNIT_SECONDS;
  const sampleCount = Math.floor(CHAPTER_SAMPLE_RATE * duration);
  const overviewRate = 180;
  const overviewSampleCount = Math.floor(overviewRate * duration);
  const pulse1 = new Float32Array(sampleCount);
  const pulse2 = new Float32Array(sampleCount);
  const noise = new Float32Array(sampleCount);
  const overviewPulse1 = new Float32Array(overviewSampleCount);
  const overviewPulse2 = new Float32Array(overviewSampleCount);
  const overviewNoise = new Float32Array(overviewSampleCount);
  const events = [];

  ROUTE3_PULSE_1.forEach(([note, start, length], index) => {
    const startSeconds = start * ROUTE3_UNIT_SECONDS;
    const durationSeconds = length * ROUTE3_UNIT_SECONDS;
    addPulseNote(pulse1, noteFrequency(note), startSeconds, durationSeconds, 0.10, 0.50);
    addVisualNote(overviewPulse1, "square", route3OverviewFrequency(note), startSeconds, durationSeconds, 0.72, overviewRate);
    events.push({ id: `route3-p1-${index}`, lane: 0, start: startSeconds, duration: durationSeconds, label: note });
  });

  ROUTE3_PULSE_2.forEach(([note, start, length], index) => {
    const startSeconds = start * ROUTE3_UNIT_SECONDS;
    const durationSeconds = length * ROUTE3_UNIT_SECONDS;
    addPulseNote(pulse2, noteFrequency(note), startSeconds, durationSeconds, 0.12, 0.25);
    addVisualNote(overviewPulse2, "pulse", route3OverviewFrequency(note), startSeconds, durationSeconds, 0.72, overviewRate);
    events.push({ id: `route3-p2-${index}`, lane: 1, start: startSeconds, duration: durationSeconds, label: note });
  });

  for (let bar = 0; bar < 3; bar += 1) {
    const barStart = bar * 32 * ROUTE3_UNIT_SECONDS;
    ROUTE3_DRUMS.forEach(([offset, drum, length], index) => {
      const startSeconds = barStart + offset * ROUTE3_UNIT_SECONDS;
      const durationSeconds = length * ROUTE3_UNIT_SECONDS;
      const hold = drum === 19 ? 8 : drum === 18 ? 18 : 42;
      const volume = drum === 19 ? 0.18 : drum === 18 ? 0.16 : 0.22;
      addSeededRandomNoiseHit(noise, startSeconds, durationSeconds, volume, hold, 3200 + bar * 100 + index);
      addRoute3OverviewNoise(overviewNoise, startSeconds, durationSeconds, 0.72, hold, 3200 + bar * 100 + index, overviewRate);
      events.push({ id: `route3-n-0-${index}`, lane: 2, start: startSeconds, duration: durationSeconds, label: `drum ${drum}` });
    });
  }

  const output = addVisualVoices(addVisualVoices(pulse1, pulse2), noise);
  const channelLanes = [
    ["voice_1", pulse1, "#f97316"],
    ["voice_2", pulse2, "#2563eb"],
    ["noise", noise, "#e6468a"],
  ];
  const overviewLanes = [
    ["voice_1", overviewPulse1, "#f97316"],
    ["voice_2", overviewPulse2, "#2563eb"],
    ["noise", overviewNoise, "#e6468a"],
  ];
  const lanes = [
    ...channelLanes,
    ["mixed", output, "#10845b"],
  ];
  route3VisualCache = {
    duration,
    events,
    channelLanes,
    overviewLanes,
    mixedLanes: [
      ["mixed", output, "#10845b"],
    ],
    normalizeLanes: true,
    lanePeaks: lanes.map(([, samples]) => {
      let peak = 0;
      for (let i = 0; i < samples.length; i += 1) {
        peak = Math.max(peak, Math.abs(samples[i]));
      }
      return peak;
    }),
    lanes,
  };
  return route3VisualCache;
}

function route3FullVisualData() {
  const cacheName = "route3-full";
  if (route3VariantVisualCache.has(cacheName)) return route3VariantVisualCache.get(cacheName);

  const duration = ROUTE3_TOTAL_STEPS * ROUTE3_UNIT_SECONDS;
  const visualRate = 260;
  const visualSampleCount = Math.floor(visualRate * duration);
  const pulse1 = new Float32Array(visualSampleCount);
  const pulse2 = new Float32Array(visualSampleCount);
  const wave = new Float32Array(visualSampleCount);
  const noise = new Float32Array(visualSampleCount);
  const events = [];

  ROUTE3_PULSE_1.forEach(([note, start, length], index) => {
    const startSeconds = start * ROUTE3_UNIT_SECONDS;
    const durationSeconds = length * ROUTE3_UNIT_SECONDS;
    addVisualNote(pulse1, "square", route3OverviewFrequency(note), startSeconds, durationSeconds, 0.72, visualRate);
    events.push({ id: `route3-p1-${index}`, lane: 0, start: startSeconds, duration: durationSeconds, label: note });
  });

  ROUTE3_PULSE_2.forEach(([note, start, length], index) => {
    const startSeconds = start * ROUTE3_UNIT_SECONDS;
    const durationSeconds = length * ROUTE3_UNIT_SECONDS;
    addVisualNote(pulse2, "pulse", route3OverviewFrequency(note), startSeconds, durationSeconds, 0.72, visualRate);
    events.push({ id: `route3-p2-${index}`, lane: 1, start: startSeconds, duration: durationSeconds, label: note });
  });

  ROUTE3_WAVE.forEach(([note, start, length], index) => {
    if (note === "REST") return;
    const startSeconds = start * ROUTE3_UNIT_SECONDS;
    const durationSeconds = length * ROUTE3_UNIT_SECONDS;
    const frequency = route3OverviewFrequency(note);
    const startIndex = Math.floor(startSeconds * visualRate);
    const noteLength = Math.floor(durationSeconds * visualRate);
    for (let i = 0; i < noteLength; i += 1) {
      const outputIndex = startIndex + i;
      if (outputIndex >= wave.length) break;
      const fade = Math.min(1, i / 3, (noteLength - i) / 5);
      wave[outputIndex] += wavetableVisualSample(i, frequency, wavetableFromPreset("square"), visualRate) * 0.72 * fade;
    }
    events.push({ id: `route3-w-${index}`, lane: 2, start: startSeconds, duration: durationSeconds, label: note });
  });

  for (let bar = 0; bar < 3; bar += 1) {
    const barStart = bar * 32 * ROUTE3_UNIT_SECONDS;
    ROUTE3_DRUMS.forEach(([offset, drum, length], index) => {
      const startSeconds = barStart + offset * ROUTE3_UNIT_SECONDS;
      const durationSeconds = length * ROUTE3_UNIT_SECONDS;
      const hold = drum === 19 ? 8 : drum === 18 ? 18 : 42;
      addRoute3OverviewNoise(noise, startSeconds, durationSeconds, 0.72, hold, 5200 + bar * 100 + index, visualRate);
      events.push({ id: `route3-n-0-${index}`, lane: 3, start: startSeconds, duration: durationSeconds, label: `drum ${drum}` });
    });
  }

  const mixed = addVisualVoices(addVisualVoices(addVisualVoices(pulse1, pulse2), wave), noise);
  const channelLanes = [
    ["pulse_1", pulse1, "#f97316"],
    ["pulse_2", pulse2, "#2563eb"],
    ["wave", wave, "#6d4bd4"],
    ["noise", noise, "#e6468a"],
  ];
  const lanes = [
    ...channelLanes,
    ["mixed", mixed, "#10845b"],
  ];
  const data = {
    duration,
    events,
    channelLanes,
    mixedLanes: [
      ["mixed", mixed, "#10845b"],
    ],
    lanes,
  };
  route3VariantVisualCache.set(cacheName, data);
  return data;
}

function buildTownSong() {
  const songLength = Math.max(
    eventEnd(PALLET_LEAD.at(-1)),
    eventEnd(PALLET_BACKING.at(-1)),
  ) * PALLET_BEAT_SECONDS;
  const samples = new Float32Array(Math.floor(CHAPTER_SAMPLE_RATE * songLength));

  for (const [start, duration, note] of PALLET_LEAD) {
    addWaveNote(samples, squareSample, noteFrequency(note), start * PALLET_BEAT_SECONDS, duration * PALLET_BEAT_SECONDS, 0.10);
  }
  for (const [start, duration, note] of PALLET_BACKING) {
    addWaveNote(samples, triangleSample, noteFrequency(note), start * PALLET_BEAT_SECONDS, duration * PALLET_BEAT_SECONDS, 0.06);
  }

  return samples;
}

function eventEnd(event) {
  return event[0] + event[1];
}

function addWaveNote(samples, sampleFunction, frequency, startSeconds, durationSeconds, volume) {
  const start = Math.floor(startSeconds * CHAPTER_SAMPLE_RATE);
  const length = Math.floor(durationSeconds * CHAPTER_SAMPLE_RATE);

  for (let i = 0; i < length; i += 1) {
    const sampleIndex = start + i;
    if (sampleIndex >= samples.length) break;
    const fade = Math.min(1, i / 300, (length - i) / 700);
    samples[sampleIndex] += sampleFunction(i, frequency, volume) * fade;
  }
}

function addPulseNote(samples, frequency, startSeconds, durationSeconds, volume, duty) {
  const start = Math.floor(startSeconds * CHAPTER_SAMPLE_RATE);
  const length = Math.floor(durationSeconds * CHAPTER_SAMPLE_RATE);

  for (let i = 0; i < length; i += 1) {
    const sampleIndex = start + i;
    if (sampleIndex >= samples.length) break;
    const fade = Math.min(1, i / 200, (length - i) / 600);
    samples[sampleIndex] += squareSample(i, frequency, volume, duty) * fade;
  }
}

function addWaveTableNote(samples, frequency, startSeconds, durationSeconds, volume, table) {
  const start = Math.floor(startSeconds * CHAPTER_SAMPLE_RATE);
  const length = Math.floor(durationSeconds * CHAPTER_SAMPLE_RATE);

  for (let i = 0; i < length; i += 1) {
    const sampleIndex = start + i;
    if (sampleIndex >= samples.length) break;
    const fade = Math.min(1, i / 200, (length - i) / 600);
    samples[sampleIndex] += gameBoyWaveSample(i, frequency, volume, table) * fade;
  }
}

function addNoiseHit(samples, startSeconds, durationSeconds, volume) {
  const hit = lfsrNoise(durationSeconds, volume);
  const start = Math.floor(startSeconds * CHAPTER_SAMPLE_RATE);

  for (let i = 0; i < hit.length; i += 1) {
    const sampleIndex = start + i;
    if (sampleIndex >= samples.length) break;
    samples[sampleIndex] += hit[i];
  }
}

function addRandomNoiseHit(samples, startSeconds, durationSeconds, volume, holdSamples) {
  const hit = heldRandomNoise({
    seconds: durationSeconds,
    volume,
    holdSamples,
    fadeSeconds: durationSeconds,
  });
  const start = Math.floor(startSeconds * CHAPTER_SAMPLE_RATE);

  for (let i = 0; i < hit.length; i += 1) {
    const sampleIndex = start + i;
    if (sampleIndex >= samples.length) break;
    samples[sampleIndex] += hit[i];
  }
}

function addSeededRandomNoiseHit(samples, startSeconds, durationSeconds, volume, holdSamples, seed) {
  const hit = heldRandomNoise({
    seconds: durationSeconds,
    volume,
    holdSamples,
    fadeSeconds: durationSeconds,
    random: seededRandom(seed),
  });
  const start = Math.floor(startSeconds * CHAPTER_SAMPLE_RATE);

  for (let i = 0; i < hit.length; i += 1) {
    const sampleIndex = start + i;
    if (sampleIndex >= samples.length) break;
    samples[sampleIndex] += hit[i];
  }
}

function playSamples(samples, button, status, visualName = null) {
  stopChapterAudio();
  if (status) status.textContent = "Building WAV from samples...";
  chapterAudioUrl = samplesToWavUrl(samples);
  chapterAudio = new Audio(chapterAudioUrl);
  chapterAudio.onended = () => {
    if (button) button.textContent = button.dataset.label;
    if (status) status.textContent = "";
    stopCursor();
  };
  chapterAudio.play()
    .then(() => {
      if (button) button.textContent = "Stop";
      if (status) status.textContent = "Playing generated samples.";
      startCursor(visualName);
    })
    .catch((error) => {
      if (status) status.textContent = `Could not start audio: ${error.message}`;
      else console.error("Could not start audio:", error);
    });
}

function playAudioFile(src, button, status, visualName = null) {
  stopChapterAudio();
  if (status) status.textContent = "Loading audio...";
  chapterAudio = new Audio(src);
  chapterAudio.onended = () => {
    if (button) button.textContent = button.dataset.label;
    if (status) status.textContent = "";
    stopCursor();
  };
  chapterAudio.play()
    .then(() => {
      if (button) button.textContent = "Stop";
      if (status) status.textContent = "";
      startCursor(visualName);
    })
    .catch((error) => {
      if (status) status.textContent = `Could not start audio: ${error.message}`;
      else console.error("Could not start audio:", error);
    });
}

function decodePcm16Wav(buffer) {
  const view = new DataView(buffer);
  if (readAscii(view, 0, 4) !== "RIFF" || readAscii(view, 8, 4) !== "WAVE") {
    throw new Error("Expected a WAV file");
  }

  let offset = 12;
  let channels = 1;
  let sampleRate = CHAPTER_SAMPLE_RATE;
  let bitsPerSample = 16;
  let dataOffset = 0;
  let dataLength = 0;

  while (offset + 8 <= view.byteLength) {
    const chunkName = readAscii(view, offset, 4);
    const chunkSize = view.getUint32(offset + 4, true);
    const chunkData = offset + 8;

    if (chunkName === "fmt ") {
      channels = view.getUint16(chunkData + 2, true);
      sampleRate = view.getUint32(chunkData + 4, true);
      bitsPerSample = view.getUint16(chunkData + 14, true);
    } else if (chunkName === "data") {
      dataOffset = chunkData;
      dataLength = chunkSize;
      break;
    }

    offset = chunkData + chunkSize + (chunkSize % 2);
  }

  if (!dataOffset || bitsPerSample !== 16) {
    throw new Error("Expected 16-bit PCM sample data");
  }

  const frameCount = Math.floor(dataLength / (channels * 2));
  const samples = new Float32Array(frameCount);

  for (let frame = 0; frame < frameCount; frame += 1) {
    let sum = 0;
    for (let channel = 0; channel < channels; channel += 1) {
      const sampleOffset = dataOffset + (frame * channels + channel) * 2;
      sum += view.getInt16(sampleOffset, true) / 32768;
    }
    samples[frame] = sum / channels;
  }

  return { sampleRate, samples, duration: samples.length / sampleRate };
}

function readAscii(view, offset, length) {
  let text = "";
  for (let i = 0; i < length; i += 1) {
    text += String.fromCharCode(view.getUint8(offset + i));
  }
  return text;
}

function loadWavSamples(src) {
  if (!wavFileCache.has(src)) {
    const loading = fetch(src)
      .then((response) => {
        if (!response.ok) throw new Error(`Could not load ${src}`);
        return response.arrayBuffer();
      })
      .then(decodePcm16Wav)
      .then((data) => {
        wavFileCache.set(src, data);
        return data;
      });
    wavFileCache.set(src, loading);
  }

  return wavFileCache.get(src);
}

function requestWaveStreamVisual(kind) {
  const clip = WAVE_STREAM_CLIPS[kind];
  if (!clip || wavVisualLoading.has(kind)) return;
  wavVisualLoading.add(kind);

  Promise.all([loadWavSamples(clip.source), loadWavSamples(clip.raced), loadWavSamples(clip.dmg)])
    .then(() => {
      drawCompositionVisual(`real-wave-stream-${kind}`, 0);
    })
    .catch((error) => console.error("Could not load wavetable sample visual:", error));
}

function waveStreamVisualData(kind) {
  const clip = WAVE_STREAM_CLIPS[kind];
  const fallback = new Float32Array(256);
  if (!clip) {
    return { duration: 1, lanes: [["source", fallback, "#ff9f1c"]] };
  }

  const source = wavFileCache.get(clip.source);
  const raced = wavFileCache.get(clip.raced);
  const dmg = wavFileCache.get(clip.dmg);
  requestWaveStreamVisual(kind);

  if (!source
    || !raced
    || !dmg
    || typeof source.then === "function"
    || typeof raced.then === "function"
    || typeof dmg.then === "function") {
    return {
      duration: 1,
      lanes: [
        ["source", fallback, "#ff9f1c"],
        ["wave_ram", fallback, "#6d4bd4"],
        ["dmg-ish", fallback, "#0c9b58"],
      ],
    };
  }

  const duration = Math.max(source.duration, raced.duration, dmg.duration);
  return {
    duration,
    normalizeLanes: true,
    markers: [
      [0, "load 32"],
      [32 / raced.sampleRate, "load"],
      [64 / raced.sampleRate, "load"],
    ],
    lanes: [
      ["source", source.samples, "#ff9f1c"],
      ["wave_ram", raced.samples, "#6d4bd4"],
      ["dmg-ish", dmg.samples, "#0c9b58"],
    ],
  };
}

function requestWavFileVisual(name) {
  const lanes = WAV_FILE_VISUALS[name];
  if (!lanes || wavVisualLoading.has(name)) return;
  wavVisualLoading.add(name);

  Promise.all(lanes.map(([, src]) => loadWavSamples(src)))
    .then(() => drawCompositionVisual(name, 0))
    .catch((error) => console.error("Could not load WAV visual:", error));
}

function wavFileVisualData(name) {
  const visual = WAV_FILE_VISUALS[name];
  const fallback = new Float32Array(256);
  if (!visual) {
    return { duration: 1, lanes: [["audio", fallback, "#6d4bd4"]] };
  }

  requestWavFileVisual(name);
  const loaded = [];

  for (const [label, src, color] of visual) {
    const data = wavFileCache.get(src);
    if (!data || typeof data.then === "function") {
      return {
        duration: 1,
        lanes: visual.map(([fallbackLabel,, fallbackColor]) => [fallbackLabel, fallback, fallbackColor]),
      };
    }
    loaded.push([label, data, color]);
  }

  return {
    duration: Math.max(...loaded.map(([, data]) => data.duration)),
    normalizeLanes: true,
    lanes: loaded.map(([label, data, color]) => [label, data.samples, color]),
  };
}

function stopLiveRandomNoise() {
  if (!liveRandomNoise) return;
  liveRandomNoise.processor.disconnect();
  liveRandomNoise.gain.disconnect();
  liveRandomNoise = null;
}

function toggleLiveRandomNoise(button) {
  if (liveRandomNoise) {
    stopLiveRandomNoise();
    button.textContent = button.dataset.label;
    return;
  }

  stopChapterAudio();
  waveAudioContext = waveAudioContext || new AudioContext();
  if (waveAudioContext.state === "suspended") waveAudioContext.resume();

  const processor = waveAudioContext.createScriptProcessor(1024, 0, 1);
  const gain = waveAudioContext.createGain();
  let current = Math.random() * 2 - 1;
  let remaining = 0;

  processor.onaudioprocess = (event) => {
    const output = event.outputBuffer.getChannelData(0);
    const hold = Math.max(1, Math.round(randomNoiseToyState.hold));

    for (let i = 0; i < output.length; i += 1) {
      if (remaining <= 0) {
        current = Math.random() * 2 - 1;
        remaining = hold;
      }

      output[i] = current * randomNoiseToyState.volume;
      remaining -= 1;
    }
  };

  processor.connect(gain);
  gain.connect(waveAudioContext.destination);
  liveRandomNoise = { processor, gain };
  button.textContent = "Stop";
}

function playRawSamples(samples) {
  waveAudioContext = waveAudioContext || new AudioContext();
  if (waveAudioContext.state === "suspended") waveAudioContext.resume();

  const buffer = waveAudioContext.createBuffer(1, samples.length, CHAPTER_SAMPLE_RATE);
  buffer.copyToChannel(samples, 0);

  const source = waveAudioContext.createBufferSource();
  source.buffer = buffer;
  source.connect(waveAudioContext.destination);
  source.start();
}

function randomizedVariedNoiseHit() {
  const holdDelta = Math.round(variedNoiseToyState.holdDelta);
  const holdOffset = Math.round((Math.random() * 2 - 1) * holdDelta);
  const hold = Math.max(1, Math.round(variedNoiseToyState.hold + holdOffset));
  const fadeOffset = (Math.random() * 2 - 1) * variedNoiseToyState.fadeDelta;
  const fade = Math.max(0.04, variedNoiseToyState.fade + fadeOffset);

  return heldRandomNoise({
    seconds: fade,
    volume: variedNoiseToyState.volume,
    holdSamples: hold,
    fadeSeconds: fade,
  });
}

function stopVariedNoiseLoop() {
  if (!variedNoiseLoop) return;
  clearInterval(variedNoiseLoop);
  variedNoiseLoop = null;
  document.querySelectorAll("[data-varied-noise-play]").forEach((button) => {
    button.textContent = button.dataset.label || "Repeat Varied Hits";
  });
}

function startVariedNoiseLoop(button) {
  if (variedNoiseLoop) {
    stopVariedNoiseLoop();
    return;
  }

  stopChapterAudio();
  button.textContent = "Stop";
  playRawSamples(randomizedVariedNoiseHit());
  variedNoiseLoop = setInterval(() => {
    playRawSamples(randomizedVariedNoiseHit());
  }, Math.max(40, variedNoiseToyState.repeat * 1000));
}

function stopChapterAudio() {
  stopCursor();
  stopWaveAudio();
  stopLiveRandomNoise();
  stopVariedNoiseLoop();
  if (chapterAudio) {
    chapterAudio.pause();
    chapterAudio.currentTime = 0;
    chapterAudio = null;
  }
  if (chapterAudioUrl) {
    URL.revokeObjectURL(chapterAudioUrl);
    chapterAudioUrl = null;
  }
  document.querySelectorAll("[data-play]").forEach((button) => {
    button.textContent = button.dataset.label;
  });
  document.querySelectorAll("[data-play-file]").forEach((button) => {
    button.textContent = button.dataset.label;
  });
  document.querySelectorAll("[data-lfsr-play]").forEach((button) => {
    button.textContent = button.dataset.label;
  });
  document.querySelectorAll("[data-random-noise-play]").forEach((button) => {
    button.textContent = button.dataset.label;
  });
  document.querySelectorAll("[data-faded-noise-play]").forEach((button) => {
    button.textContent = button.dataset.label;
  });
  document.querySelectorAll("[data-midi-play]").forEach((button) => {
    button.textContent = button.dataset.label;
  });
  document.querySelectorAll("[data-feedback-play]").forEach((button) => {
    button.textContent = button.dataset.label;
  });
  document.querySelectorAll("[data-continuous-play]").forEach((button) => {
    button.textContent = button.dataset.label;
  });
}

function stopWaveAudio() {
  if (!activeWave) return;

  if (activeWave.oscillator) {
    try {
      activeWave.oscillator.stop();
    } catch (error) {
      // The oscillator may already be stopped by the browser.
    }
    activeWave.oscillator.disconnect();
  }

  if (activeWave.processor) {
    activeWave.processor.disconnect();
  }

  if (activeWave.gain) activeWave.gain.disconnect();
  activeWave.button.textContent = activeWave.button.dataset.label;
  if (activeWave.status) activeWave.status.textContent = "";
  activeWave = null;
}

function stopCursor() {
  if (cursorFrame) {
    cancelAnimationFrame(cursorFrame);
    cursorFrame = null;
  }
  if (activeVisualName) {
    drawCompositionVisual(activeVisualName, 0);
    activeVisualName = null;
  }
}

function samplesToWavUrl(samples) {
  const bytesPerSample = 2;
  const dataBytes = samples.length * bytesPerSample;
  const buffer = new ArrayBuffer(44 + dataBytes);
  const view = new DataView(buffer);

  writeAscii(view, 0, "RIFF");
  view.setUint32(4, 36 + dataBytes, true);
  writeAscii(view, 8, "WAVE");
  writeAscii(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, CHAPTER_SAMPLE_RATE, true);
  view.setUint32(28, CHAPTER_SAMPLE_RATE * bytesPerSample, true);
  view.setUint16(32, bytesPerSample, true);
  view.setUint16(34, 16, true);
  writeAscii(view, 36, "data");
  view.setUint32(40, dataBytes, true);

  let offset = 44;
  for (const sample of samples) {
    const clamped = Math.max(-1, Math.min(1, sample));
    view.setInt16(offset, Math.round(clamped * 32767), true);
    offset += bytesPerSample;
  }

  return URL.createObjectURL(new Blob([buffer], { type: "audio/wav" }));
}

function downloadSamplesAsWav(samples, filename) {
  const url = samplesToWavUrl(samples);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function writeAscii(view, offset, text) {
  for (let i = 0; i < text.length; i += 1) {
    view.setUint8(offset + i, text.charCodeAt(i));
  }
}

document.querySelectorAll("[data-play]").forEach((button) => {
  button.dataset.label = button.textContent;
  button.addEventListener("click", () => {
    const status = button.dataset.status ? document.querySelector(button.dataset.status) : null;
    if (chapterAudio && button.textContent === "Stop") {
      stopChapterAudio();
      if (status) status.textContent = "";
      return;
    }

    const kind = button.dataset.play;
    const visualName = button.dataset.visual || null;
    if (kind === "noise") playSamples(lfsrNoise(0.8, 0.35), button, status, visualName);
    else if (kind === "noise-low") playSamples(lfsrNoise(0.8, 0.35, { holdSamples: 49, fadeSeconds: 0.65 }), button, status, visualName);
    else if (kind === "noise-bright") playSamples(lfsrNoise(0.6, 0.30, { holdSamples: 4, fadeSeconds: 0.35 }), button, status, visualName);
    else if (kind === "noise-short") playSamples(lfsrNoise(0.7, 0.32, { holdSamples: 7, fadeSeconds: 0.45, tap: 6 }), button, status, visualName);
    else if (kind === "noise-click") playSamples(lfsrNoise(0.25, 0.45, { holdSamples: 5, fadeSeconds: 0.08 }), button, status, visualName);
    else if (kind === "random-noise") playSamples(randomNoise(0.7, 0.18), button, status, visualName);
    else if (kind === "compose-sequence") playSamples(buildCompositingSequence(), button, status, visualName);
    else if (kind === "compose-overlap") playSamples(buildCompositingOverlap(), button, status, visualName);
    else if (kind === "compose-staggered") playSamples(buildCompositingStaggered(), button, status, visualName);
    else if (kind === "town-song") playSamples(buildTownSong(), button, status, visualName);
    else if (kind === "two-voices") playSamples(buildTwoVoices(), button, status, visualName);
    else if (kind === "sequence") playSamples(buildSequence(), button, status, visualName);
    else if (kind === "layered-voices") playSamples(buildLayeredVoices(), button, status, visualName);
    else if (kind === "lookup-sequence") playSamples(buildLookupSequence(), button, status, visualName);
    else if (kind === "two-sequences") playSamples(buildTwoSequences(), button, status, visualName);
    else if (kind === "composition") playSamples(buildComposition(), button, status, visualName);
    else if (kind === "route3-sketch") playSamples(buildRoute3Sketch(), button, status, visualName);
    else if (kind === "route3-full") playSamples(buildRoute3FullSketch(), button, status, visualName);
    else if (kind === "route3-pulse-1") playSamples(buildRoute3IsolatedChannel("pulse1"), button, status, visualName);
    else if (kind === "route3-pulse-2") playSamples(buildRoute3IsolatedChannel("pulse2"), button, status, visualName);
    else if (kind === "route3-wave") playSamples(buildRoute3IsolatedChannel("wave"), button, status, visualName);
    else if (kind === "route3-noise") playSamples(buildRoute3IsolatedChannel("noise"), button, status, visualName);
    else if (kind === "filtered-square") playSamples(buildFilteredSquare(), button, status, visualName);
    else if (kind === "wavetable-toy") playSamples(buildWavetableToySamples(), button, status, visualName);
    else playSamples(buildTone({ type: kind, frequency: Number(button.dataset.frequency || 220) }), button, status, visualName);
  });
});

document.querySelectorAll("[data-play-file]").forEach((button) => {
  button.dataset.label = button.textContent;
  button.addEventListener("click", () => {
    const status = button.dataset.status ? document.querySelector(button.dataset.status) : null;
    if (chapterAudio && button.textContent === "Stop") {
      stopChapterAudio();
      if (status) status.textContent = "";
      return;
    }

    playAudioFile(button.dataset.playFile, button, status, button.dataset.visual || null);
  });
});

document.querySelectorAll("[data-download-route3]").forEach((button) => {
  button.addEventListener("click", () => {
    downloadSamplesAsWav(buildRoute3Sketch(), "route-3-sketch.wav");
  });
});

function makeVisualVoice(sampleFunction, seconds, frequency, volume) {
  const visualRate = 240;
  const samples = new Float32Array(Math.floor(seconds * visualRate));

  for (let i = 0; i < samples.length; i += 1) {
    const time = i / visualRate;
    const phase = (frequency * time) % 1;
    if (sampleFunction === "square") {
      samples[i] = phase < 0.5 ? volume : -volume;
    } else {
      samples[i] = (1 - 4 * Math.abs(phase - 0.5)) * volume;
    }
  }

  return samples;
}

function placeVisualVoice(outputLength, voice, startIndex = 0) {
  const placed = new Float32Array(outputLength);

  for (let i = 0; i < voice.length; i += 1) {
    const outputIndex = startIndex + i;
    if (outputIndex >= placed.length) break;
    placed[outputIndex] = voice[i];
  }

  return placed;
}

function addVisualVoices(a, b) {
  const output = new Float32Array(Math.max(a.length, b.length));

  for (let i = 0; i < output.length; i += 1) {
    output[i] = (a[i] || 0) + (b[i] || 0);
  }

  return output;
}

function compositionVisualData(name) {
  if (name === "route3-sketch") {
    return route3SketchVisualData();
  }

  if (name === "route3-full") {
    return route3FullVisualData();
  }

  if (name === "route3-sketch-channels") {
    if (route3VariantVisualCache.has(name)) return route3VariantVisualCache.get(name);
    const data = route3SketchVisualData();
    const channelData = {
      ...data,
      lanes: data.channelLanes,
      lanePeaks: data.lanePeaks.slice(0, data.channelLanes.length),
      eventOverview: false,
    };
    route3VariantVisualCache.set(name, channelData);
    return channelData;
  }

  if (name === "route3-sketch-mixed") {
    if (route3VariantVisualCache.has(name)) return route3VariantVisualCache.get(name);
    const data = route3SketchVisualData();
    const mixedData = {
      ...data,
      events: null,
      lanes: data.mixedLanes,
      lanePeaks: data.lanePeaks.slice(data.channelLanes.length),
    };
    route3VariantVisualCache.set(name, mixedData);
    return mixedData;
  }

  if (name === "route3-full-channels") {
    if (route3VariantVisualCache.has(name)) return route3VariantVisualCache.get(name);
    const data = route3FullVisualData();
    const channelData = {
      ...data,
      lanes: data.channelLanes,
    };
    route3VariantVisualCache.set(name, channelData);
    return channelData;
  }

  if (name === "route3-full-mixed") {
    if (route3VariantVisualCache.has(name)) return route3VariantVisualCache.get(name);
    const data = route3FullVisualData();
    const mixedData = {
      ...data,
      events: null,
      lanes: data.mixedLanes,
    };
    route3VariantVisualCache.set(name, mixedData);
    return mixedData;
  }

  if (name === "wavetable-cycle") {
    return {
      duration: 0.10,
      markers: [
        [0.000, "sample 0"],
        [0.025, "sample 8"],
        [0.050, "sample 16"],
        [0.075, "sample 24"],
      ],
      lanes: [
        ["one_cycle_table", Float32Array.from(wavetableFromPreset("triangle")), "#6d4bd4"],
      ],
    };
  }

  if (name === "wavetable-loop") {
    const visualRate = 640;
    const duration = 0.70;
    const frequency = 8;
    const table = wavetableFromPreset("triangle");
    const samples = new Float32Array(Math.floor(duration * visualRate));
    for (let i = 0; i < samples.length; i += 1) {
      samples[i] = wavetableVisualSample(i, frequency, table, visualRate) * 0.74;
    }
    return {
      duration,
      markers: [
        [0.000, "cycle 1"],
        [1 / frequency, "cycle 2"],
        [2 / frequency, "cycle 3"],
        [3 / frequency, "cycle 4"],
      ],
      lanes: [
        ["samples", samples, "#6d4bd4"],
      ],
    };
  }

  if (name === "wavetable-pulse") {
    const visualRate = 900;
    const duration = 0.52;
    const table = wavetableFromPreset("square");
    const samples = new Float32Array(Math.floor(duration * visualRate));
    for (let i = 0; i < samples.length; i += 1) {
      samples[i] = wavetableVisualSample(i, 9, table, visualRate) * 0.74;
    }
    return {
      duration,
      lanes: [
        ["pseudo_pulse", samples, "#6d4bd4"],
      ],
    };
  }

  if (name === "wavetable-toy-rendered") {
    const visualRate = 900;
    const duration = 0.42;
    const frequency = Math.max(3, wavetableToyState.frequency / 32);
    const samples = new Float32Array(Math.floor(duration * visualRate));
    for (let i = 0; i < samples.length; i += 1) {
      samples[i] = wavetableVisualSample(i, frequency, wavetableToyState.table, visualRate) * wavetableToyState.volume * 2.6;
    }
    return {
      duration,
      lanes: [
        ["toy_output", samples, "#6d4bd4"],
      ],
    };
  }

  if (name.startsWith("real-wave-stream-")) {
    return waveStreamVisualData(name.replace("real-wave-stream-", ""));
  }

  if (WAV_FILE_VISUALS[name]) {
    return wavFileVisualData(name);
  }

  const halfSecond = 120;
  const square = makeVisualVoice("square", 0.5, 4, 0.42);
  const triangle = makeVisualVoice("triangle", 0.5, 6, 0.42);

  if (name === "square-rendered") {
    const state = waveRenderState.square;
    const visualFrequency = state.frequency / 20;
    const visualRate = 1200;
    const duration = 0.36;
    const samples = new Float32Array(Math.floor(duration * visualRate));

    for (let i = 0; i < samples.length; i += 1) {
      const time = i / visualRate;
      const phase = (visualFrequency * time + state.phase) % 1;
      samples[i] = phase < 0.5 ? state.volume : -state.volume;
    }

    return {
      duration,
      markers: [
        [0.00, "cycle 1"],
        [1 / visualFrequency, "cycle 2"],
        [2 / visualFrequency, "cycle 3"],
        [3 / visualFrequency, "cycle 4"],
      ],
      lanes: [
        ["samples", samples, "#f97316"],
      ],
    };
  }

  if (name === "triangle-rendered") {
    const state = waveRenderState.triangle;
    const visualFrequency = state.frequency / 20;
    const visualRate = 1200;
    const duration = 0.36;
    const samples = new Float32Array(Math.floor(duration * visualRate));

    for (let i = 0; i < samples.length; i += 1) {
      const time = i / visualRate;
      const phase = (visualFrequency * time + state.phase) % 1;
      samples[i] = (1 - 4 * Math.abs(phase - 0.5)) * state.volume;
    }

    return {
      duration,
      markers: [
        [0.00, "cycle 1"],
        [1 / visualFrequency, "cycle 2"],
        [2 / visualFrequency, "cycle 3"],
        [3 / visualFrequency, "cycle 4"],
      ],
      lanes: [
        ["samples", samples, "#2563eb"],
      ],
    };
  }

  if (name === "sine-rendered") {
    const state = waveRenderState.sine;
    const visualFrequency = state.frequency / 20;
    const visualRate = 1200;
    const duration = 0.36;
    const samples = new Float32Array(Math.floor(duration * visualRate));

    for (let i = 0; i < samples.length; i += 1) {
      const time = i / visualRate;
      const phase = (visualFrequency * time + state.phase) % 1;
      samples[i] = Math.sin(2 * Math.PI * phase) * state.volume;
    }

    return {
      duration,
      markers: [
        [0.00, "cycle 1"],
        [1 / visualFrequency, "cycle 2"],
        [2 / visualFrequency, "cycle 3"],
        [3 / visualFrequency, "cycle 4"],
      ],
      lanes: [
        ["samples", samples, "#0c9b58"],
      ],
    };
  }

  if (name === "pulse-rendered") {
    const state = waveRenderState.pulse;
    const visualFrequency = state.frequency / 20;
    const visualRate = 1200;
    const duration = 0.36;
    const samples = new Float32Array(Math.floor(duration * visualRate));

    for (let i = 0; i < samples.length; i += 1) {
      const time = i / visualRate;
      const phase = (visualFrequency * time + state.phase) % 1;
      samples[i] = phase < state.duty ? state.volume : -state.volume;
    }

    return {
      duration,
      markers: [
        [0.00, "cycle 1"],
        [1 / visualFrequency, "cycle 2"],
        [2 / visualFrequency, "cycle 3"],
        [3 / visualFrequency, "cycle 4"],
      ],
      lanes: [
        ["samples", samples, "#e94b8a"],
      ],
    };
  }

  if (name === "town-song") {
    const visualRate = 240;
    const duration = Math.max(
      eventEnd(PALLET_LEAD.at(-1)),
      eventEnd(PALLET_BACKING.at(-1)),
    ) * PALLET_BEAT_SECONDS;
    const outputLength = Math.floor(duration * visualRate);
    const melodyLane = new Float32Array(outputLength);
    const backingLane = new Float32Array(outputLength);

    for (const [start, noteDuration, note] of PALLET_LEAD) {
      addVisualNote(melodyLane, "square", visualNoteFrequency(note), start * PALLET_BEAT_SECONDS, noteDuration * PALLET_BEAT_SECONDS, 0.34);
    }
    for (const [start, noteDuration, note] of PALLET_BACKING) {
      addVisualNote(backingLane, "triangle", visualNoteFrequency(note), start * PALLET_BEAT_SECONDS, noteDuration * PALLET_BEAT_SECONDS, 0.30);
    }

    return {
      duration,
      lanes: [
        ["lead_square", melodyLane, "#f97316"],
        ["backing_triangle", backingLane, "#2563eb"],
        ["output", addVisualVoices(melodyLane, backingLane), "#10845b"],
      ],
    };
  }

  if (name === "sequence") {
    const firstSquare = makeVisualVoice("square", 0.5, 4, 0.38);
    const secondSquare = makeVisualVoice("square", 0.5, 6, 0.38);
    const outputLength = firstSquare.length + secondSquare.length;
    const firstLane = placeVisualVoice(outputLength, firstSquare, 0);
    const secondLane = placeVisualVoice(outputLength, secondSquare, firstSquare.length);
    return {
      duration: 1,
      lanes: [
        ["first_square", firstLane, "#f97316"],
        ["second_square", secondLane, "#2563eb"],
        ["output", addVisualVoices(firstLane, secondLane), "#10845b"],
      ],
    };
  }

  if (name === "notes-sequence") {
    const firstSquare = makeVisualVoice("square", 0.5, 4, 0.38);
    const secondSquare = makeVisualVoice("square", 0.5, 6, 0.38);
    const outputLength = firstSquare.length + secondSquare.length;
    const firstNote = placeVisualVoice(outputLength, firstSquare, 0);
    const secondNote = placeVisualVoice(outputLength, secondSquare, firstSquare.length);
    return {
      duration: 1,
      lanes: [
        ["first_square", firstNote, "#f97316"],
        ["second_square", secondNote, "#2563eb"],
        ["output", addVisualVoices(firstNote, secondNote), "#10845b"],
      ],
    };
  }

  if (name === "single-sequence") {
    const visualRate = 2000;
    const duration = 1.2;
    const output = new Float32Array(Math.floor(duration * visualRate));
    const notes = [
      [0.00, 0.20, 20],
      [0.22, 0.20, 25],
      [0.44, 0.20, 30],
      [0.66, 0.30, 40],
    ];

    for (const [start, noteDuration, frequency] of notes) {
      addVisualNote(output, "square", frequency, start, noteDuration, 0.38, visualRate);
    }

    return {
      duration,
      markers: [
        [0.00, "C4"],
        [0.22, "E4"],
        [0.44, "G4"],
        [0.66, "C5"],
      ],
      lanes: [
        ["samples", output, "#f97316"],
      ],
    };
  }

  if (name === "staggered") {
    const outputLength = 300;
    const firstLane = placeVisualVoice(outputLength, makeVisualVoice("square", 0.65, 4, 0.38), 0);
    const secondLane = placeVisualVoice(outputLength, makeVisualVoice("square", 0.65, 6, 0.38), Math.floor(0.35 * 240));
    return {
      duration: 1.25,
      lanes: [
        ["first_square", firstLane, "#f97316"],
        ["second_square", secondLane, "#2563eb"],
        ["output", addVisualVoices(firstLane, secondLane), "#10845b"],
      ],
    };
  }

  if (name === "notes-placement") {
    const outputLength = 300;
    const firstNote = placeVisualVoice(outputLength, makeVisualVoice("square", 0.65, 4, 0.38), 0);
    const secondNote = placeVisualVoice(outputLength, makeVisualVoice("square", 0.65, 6, 0.38), Math.floor(0.35 * 240));
    return {
      duration: 1.25,
      lanes: [
        ["first_square", firstNote, "#f97316"],
        ["second_square", secondNote, "#2563eb"],
        ["output", addVisualVoices(firstNote, secondNote), "#10845b"],
      ],
    };
  }

  if (name === "voice-notes") {
    const visualRate = 900;
    const duration = 1.8;
    const outputLength = Math.floor(duration * visualRate);
    const lanes = [
      ["square", new Float32Array(outputLength), "#f97316"],
      ["sin", new Float32Array(outputLength), "#2d6cdf"],
      ["triangle", new Float32Array(outputLength), "#0c9b58"],
      ["pulse", new Float32Array(outputLength), "#6d4bd4"],
      ["bright", new Float32Array(outputLength), "#e6468a"],
    ];
    const notes = [
      [0, "square", 392.00, 0.00, 0.42, 0.42],
      [1, "sine", 493.88, 0.12, 0.42, 0.42],
      [2, "triangle", 587.33, 0.24, 0.42, 0.42],
      [3, "pulse", 783.99, 0.36, 0.48, 0.38],
      [4, "bright", 987.77, 0.48, 0.58, 0.32],
      [2, "triangle", 329.63, 0.00, 1.10, 0.34],
      [0, "square", 392.00, 0.55, 0.55, 0.30],
      [4, "bright", 659.25, 0.95, 0.42, 0.30],
      [3, "pulse", 739.99, 1.10, 0.42, 0.30],
      [1, "sine", 587.33, 1.25, 0.55, 0.34],
    ];

    for (const [laneIndex, shape, frequency, start, noteDuration, volume] of notes) {
      addVisualNote(lanes[laneIndex][1], shape, frequency / 120, start, noteDuration, volume, visualRate);
    }

    const output = lanes.reduce((mixed, [, samples]) => addVisualVoices(mixed, samples), new Float32Array(outputLength));

    return {
      duration,
      markers: [
        [0.00, "G4"],
        [0.12, "B4"],
        [0.24, "D5"],
        [0.36, "G5"],
        [0.95, "E5"],
        [1.25, "D5"],
      ],
      lanes: [
        ...lanes,
        ["output", output, "#202124"],
      ],
    };
  }

  if (name === "lookup-sequence") {
    const visualRate = 1200;
    const duration = 1.22;
    const output = new Float32Array(Math.floor(duration * visualRate));
    const notes = [
      ["C4", 0.00, 0.34],
      ["E4", 0.18, 0.34],
      ["G4", 0.36, 0.34],
      ["A4", 0.54, 0.34],
      ["C5", 0.72, 0.50],
    ];

    for (const [note, start, noteDuration] of notes) {
      addVisualNote(output, "square", visualNoteFrequency(note), start, noteDuration, 0.38, visualRate);
    }

    return {
      duration,
      markers: [
        [0.00, "C4"],
        [0.18, "E4"],
        [0.36, "G4"],
        [0.54, "A4"],
        [0.72, "C5"],
      ],
      lanes: [
        ["samples", output, "#f97316"],
      ],
    };
  }

  const squareLane = placeVisualVoice(halfSecond + 72, makeVisualVoice("square", 0.8, 4, 0.36), 0);
  const triangleLane = placeVisualVoice(squareLane.length, makeVisualVoice("triangle", 0.8, 6, 0.36), 0);
  return {
    duration: 0.8,
    lanes: [
      ["square_note", squareLane, "#f97316"],
      ["triangle_note", triangleLane, "#2563eb"],
      ["output", addVisualVoices(squareLane, triangleLane), "#10845b"],
    ],
  };
}

function visualNoteFrequency(note) {
  return Math.max(1.1, Math.min(7.5, noteFrequency(note) / 150));
}

function addVisualNote(output, shape, frequency, startSeconds, durationSeconds, volume, visualRate = 240) {
  const start = Math.floor(startSeconds * visualRate);
  const length = Math.floor(durationSeconds * visualRate);

  for (let i = 0; i < length; i += 1) {
    const outputIndex = start + i;
    if (outputIndex >= output.length) break;
    const time = i / visualRate;
    const phase = (frequency * time) % 1;
    let raw = 1 - 4 * Math.abs(phase - 0.5);
    if (shape === "square") raw = phase < 0.5 ? 1 : -1;
    else if (shape === "sine") raw = Math.sin(2 * Math.PI * frequency * time);
    else if (shape === "pulse") raw = phase < 0.25 ? 1 : -1;
    else if (shape === "bright") {
      raw = (
        Math.sin(2 * Math.PI * frequency * time)
        + Math.sin(2 * Math.PI * frequency * 2 * time) * 0.35
        + (phase < 0.33 ? 1 : -1) * 0.18
      );
    }
    output[outputIndex] += raw * volume;
  }
}

function drawCompositionVisual(name, progress = 0) {
  if (name === "route3-sketch") {
    drawCompositionVisual("route3-sketch-channels", progress);
    drawCompositionVisual("route3-sketch-mixed", progress);
    drawRoute3Zoom(progress);
    return;
  }

  if (name === "route3-full") {
    drawCompositionVisual("route3-full-channels", progress);
    drawCompositionVisual("route3-full-mixed", progress);
    return;
  }

  const canvas = document.querySelector(`[data-composition-visual="${name}"]`);
  if (!canvas) return;

  const pixelRatio = window.devicePixelRatio || 1;
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  canvas.width = Math.floor(width * pixelRatio);
  canvas.height = Math.floor(height * pixelRatio);

  const context = canvas.getContext("2d");
  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  context.clearRect(0, 0, width, height);

  const data = compositionVisualData(name);
  const left = 98;
  const right = width - 18;
  const laneHeight = (height - 34) / data.lanes.length;
  const graphTop = 22;
  const graphBottom = 22 + laneHeight * data.lanes.length;
  const hitboxes = [];

  context.font = "12px SFMono-Regular, Consolas, monospace";
  context.lineWidth = 2;

  data.lanes.forEach(([label, samples, color], laneIndex) => {
    const centerY = 22 + laneHeight * laneIndex + laneHeight * 0.5;
    const amplitude = laneHeight * 0.32;
    const laneTop = 22 + laneHeight * laneIndex;
    const laneBottom = laneTop + laneHeight;
    let laneScale = 1;

    if (data.normalizeLanes) {
      let peak = data.lanePeaks?.[laneIndex] ?? 0;
      if (!peak) {
        for (let i = 0; i < samples.length; i += 1) {
          peak = Math.max(peak, Math.abs(samples[i]));
        }
      }
      laneScale = peak > 0 ? 1 / peak : 1;
    }

    context.fillStyle = "#5c6470";
    context.fillText(label, 12, centerY + 4);

    context.strokeStyle = "#d8dde5";
    context.lineWidth = 1;
    context.beginPath();
    context.moveTo(left, centerY);
    context.lineTo(right, centerY);
    context.stroke();

    if (data.events) {
      for (const event of data.events) {
        if (event.lane !== laneIndex) continue;
        const eventLeft = left + (event.start / data.duration) * (right - left);
        const eventRight = left + ((event.start + event.duration) / data.duration) * (right - left);
        const active = event.id === route3HoverId;
        context.fillStyle = active ? "rgba(200, 233, 90, 0.62)" : (data.eventOverview ? color : "rgba(32, 33, 36, 0.018)");
        context.globalAlpha = active || !data.eventOverview ? 1 : 0.72;
        const eventWidth = Math.max(2, eventRight - eventLeft);
        context.fillRect(eventLeft, laneTop + 4, eventWidth, laneHeight - 8);
        context.globalAlpha = 1;
        if (data.eventOverview) {
          context.strokeStyle = active ? "#202124" : "rgba(255, 255, 255, 0.92)";
          context.lineWidth = active ? 2 : 1;
          context.strokeRect(eventLeft, laneTop + 4, eventWidth, laneHeight - 8);
        }
        hitboxes.push({
          id: event.id,
          start: event.start,
          duration: event.duration,
          x1: eventLeft,
          x2: eventRight,
          y1: laneTop,
          y2: laneBottom,
        });
      }
    }

    if (data.eventOverview) return;

    context.strokeStyle = color;
    context.lineWidth = 2;
    if (samples.length > 5000) {
      const firstX = Math.floor(left);
      const lastX = Math.floor(right);
      const bucketCount = Math.max(1, lastX - firstX + 1);
      const cacheKey = `${laneIndex}:${bucketCount}`;
      data.bucketCache = data.bucketCache || new Map();
      let buckets = data.bucketCache.get(cacheKey);

      if (!buckets) {
        buckets = [];
        for (let bucketIndex = 0; bucketIndex < bucketCount; bucketIndex += 1) {
          const t1 = bucketIndex / bucketCount;
          const t2 = (bucketIndex + 1) / bucketCount;
          const start = Math.max(0, Math.floor(t1 * samples.length));
          const end = Math.min(samples.length, Math.max(start + 1, Math.ceil(t2 * samples.length)));
          let min = 0;
          let max = 0;
          for (let i = start; i < end; i += 1) {
            if (samples[i] < min) min = samples[i];
            if (samples[i] > max) max = samples[i];
          }
          buckets.push([min, max]);
        }
        data.bucketCache.set(cacheKey, buckets);
      }

      for (let bucketIndex = 0; bucketIndex < buckets.length; bucketIndex += 1) {
        const x = firstX + bucketIndex;
        const [min, max] = buckets[bucketIndex];
        context.beginPath();
        context.moveTo(x, centerY - min * laneScale * amplitude);
        context.lineTo(x, centerY - max * laneScale * amplitude);
        context.stroke();
      }
    } else {
      context.beginPath();
      for (let i = 0; i < samples.length; i += 1) {
        const x = left + (i / (samples.length - 1)) * (right - left);
        const y = centerY - samples[i] * laneScale * amplitude;
        if (i === 0) context.moveTo(x, y);
        else context.lineTo(x, y);
      }
      context.stroke();
    }

    if (samples.length <= 5000) {
      context.fillStyle = color;
      const dotEvery = Math.max(1, Math.floor(samples.length / 42));
      for (let i = 0; i < samples.length; i += dotEvery) {
        const x = left + (i / (samples.length - 1)) * (right - left);
        const y = centerY - samples[i] * laneScale * amplitude;
        context.beginPath();
        context.arc(x, y, 2.4, 0, 2 * Math.PI);
        context.fill();
      }
    }
  });
  route3CanvasHitboxes.set(canvas, hitboxes);

  if (data.markers) {
    context.fillStyle = "#202124";
    context.strokeStyle = "#b9c0cc";
    context.lineWidth = 1;

    for (const [time, label] of data.markers) {
      if (time > data.duration) continue;
      const x = left + (time / data.duration) * (right - left);
      context.beginPath();
      context.moveTo(x, graphTop);
      context.lineTo(x, graphBottom);
      context.stroke();
      context.fillText(label, Math.min(x + 5, width - 34), 22);
    }
  }

  const cursorX = left + progress * (right - left);
  context.strokeStyle = "#202124";
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(cursorX, graphTop);
  context.lineTo(cursorX, graphBottom);
  context.stroke();

  context.fillStyle = "#202124";
  context.fillText(`${(progress * data.duration).toFixed(2)}s`, Math.min(cursorX + 6, width - 52), Math.min(height - 6, graphBottom + 12));

  if (name === "route3-sketch-channels") {
    drawRoute3Zoom(progress);
  }
}

function drawRoute3Zoom(progress = 0) {
  const canvas = document.querySelector("[data-route3-zoom]");
  if (!canvas) return;

  const pixelRatio = window.devicePixelRatio || 1;
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  canvas.width = Math.floor(width * pixelRatio);
  canvas.height = Math.floor(height * pixelRatio);

  const context = canvas.getContext("2d");
  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  context.clearRect(0, 0, width, height);

  const data = route3SketchVisualData();
  const sampleRate = data.lanes[0][1].length / data.duration;
  const hovered = route3HoverId
    ? data.events.find((event) => event.id === route3HoverId)
    : null;
  const center = route3HoverTime
    ?? (hovered ? hovered.start + Math.min(hovered.duration * 0.5, 0.04) : progress * data.duration);
  const windowSeconds = 0.06;
  const startTime = Math.max(0, Math.min(data.duration - windowSeconds, center - windowSeconds * 0.5));
  const endTime = startTime + windowSeconds;
  const startIndex = Math.max(0, Math.floor(startTime * sampleRate));
  const endIndex = Math.min(data.lanes[0][1].length, Math.ceil(endTime * sampleRate));
  const left = 98;
  const right = width - 18;
  const laneHeight = (height - 34) / data.lanes.length;
  const count = Math.max(1, endIndex - startIndex);

  context.font = "12px SFMono-Regular, Consolas, monospace";
  context.fillStyle = "#202124";
  context.fillText(`zoom ${startTime.toFixed(3)}s - ${endTime.toFixed(3)}s`, left, 16);

  data.lanes.forEach(([label, samples, color], laneIndex) => {
    const centerY = 24 + laneHeight * laneIndex + laneHeight * 0.5;
    const amplitude = laneHeight * 0.30;
    let peak = 0;

    for (let i = startIndex; i < endIndex; i += 1) {
      peak = Math.max(peak, Math.abs(samples[i]));
    }
    const laneScale = peak > 0 ? 1 / peak : 1;

    context.fillStyle = "#5c6470";
    context.fillText(label, 12, centerY + 4);

    context.strokeStyle = "#d8dde5";
    context.lineWidth = 1;
    context.beginPath();
    context.moveTo(left, centerY);
    context.lineTo(right, centerY);
    context.stroke();

    context.strokeStyle = color;
    context.lineWidth = 2;
    context.beginPath();
    for (let i = startIndex; i < endIndex; i += 1) {
      const x = left + ((i - startIndex) / Math.max(1, count - 1)) * (right - left);
      const y = centerY - samples[i] * laneScale * amplitude;
      if (i === startIndex) context.moveTo(x, y);
      else context.lineTo(x, y);
    }
    context.stroke();
  });
}

function currentCompositionProgress(name) {
  if (
    chapterAudio
    && activeVisualName === name
    && Number.isFinite(chapterAudio.duration)
    && chapterAudio.duration > 0
  ) {
    return Math.min(1, chapterAudio.currentTime / chapterAudio.duration);
  }
  return 0;
}

function setRoute3Hover(id, time = null) {
  if (route3HoverId === id && route3HoverTime === time) return;
  route3HoverId = id;
  route3HoverTime = time;

  document.querySelectorAll("[data-route3-event]").forEach((element) => {
    element.classList.toggle("is-active", element.dataset.route3Event === id);
  });

  drawCompositionVisual("route3-sketch", currentCompositionProgress("route3-sketch"));
  drawCompositionVisual("route3-full", currentCompositionProgress("route3-full"));
}

function route3HitboxAt(canvas, clientX, clientY) {
  const hitboxes = route3CanvasHitboxes.get(canvas) || [];
  const rect = canvas.getBoundingClientRect();
  const x = clientX - rect.left;
  const y = clientY - rect.top;

  return hitboxes.find((hitbox) => (
    x >= hitbox.x1
    && x <= hitbox.x2
    && y >= hitbox.y1
    && y <= hitbox.y2
  ));
}

function startCursor(name) {
  if (!name || !chapterAudio) return;
  activeVisualName = name;

  function draw() {
    if (!chapterAudio || activeVisualName !== name) return;
    const progress = Math.min(1, chapterAudio.currentTime / chapterAudio.duration || 0);
    drawCompositionVisual(name, progress);
    cursorFrame = requestAnimationFrame(draw);
  }

  draw();
}

function startLoopingCursor(name) {
  if (!name) return;
  activeVisualName = name;
  const startedAt = performance.now();
  const duration = compositionVisualData(name).duration;

  function draw() {
    if (!activeWave || activeVisualName !== name) return;
    const elapsed = (performance.now() - startedAt) / 1000;
    drawCompositionVisual(name, (elapsed % duration) / duration);
    cursorFrame = requestAnimationFrame(draw);
  }

  draw();
}

function nearestGameboyDutyIndex(duty) {
  let bestIndex = 0;
  let bestDistance = Infinity;

  GAMEBOY_DUTIES.forEach((gameboyDuty, index) => {
    const distance = Math.abs(gameboyDuty - duty);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestIndex = index;
    }
  });

  return bestIndex;
}

function formatDutyPercent(duty) {
  const percent = Math.round(duty * 1000) / 10;
  return Number.isInteger(percent) ? `${percent}%` : `${percent.toFixed(1)}%`;
}

function updateWaveOutputs(kind) {
  const controls = document.querySelector(`[data-wave-controls="${kind}"]`);
  if (!controls) return;
  const state = waveRenderState[kind];
  controls.querySelector('[data-wave-output="frequency"]').textContent = `${Math.round(state.frequency)} Hz`;
  controls.querySelector('[data-wave-output="volume"]').textContent = state.volume.toFixed(2);
  controls.querySelector('[data-wave-output="phase"]').textContent = `${state.phase.toFixed(2)} cycle`;
  const dutyOutput = controls.querySelector('[data-wave-output="duty"]');
  const dutyFineOutput = controls.querySelector('[data-wave-output="dutyFine"]');
  const gameboyDutyOutput = controls.querySelector('[data-wave-output="gameboyDuty"]');

  if (dutyOutput) dutyOutput.textContent = formatDutyPercent(state.duty);
  if (dutyFineOutput) dutyFineOutput.textContent = formatDutyPercent(state.duty);

  if (gameboyDutyOutput) {
    const gameboyIndex = nearestGameboyDutyIndex(state.duty);
    gameboyDutyOutput.textContent = `${gameboyIndex}: ${formatDutyPercent(GAMEBOY_DUTIES[gameboyIndex])}`;
  }

  const dutyInput = controls.querySelector('[data-wave-control="duty"]');
  const dutyFineInput = controls.querySelector('[data-wave-control="dutyFine"]');
  const gameboyDutyInput = controls.querySelector('[data-wave-control="gameboyDuty"]');
  if (dutyInput) dutyInput.value = state.duty;
  if (dutyFineInput) dutyFineInput.value = state.duty;
  if (gameboyDutyInput) gameboyDutyInput.value = nearestGameboyDutyIndex(state.duty);
}

function updateActiveWaveAudio() {
  if (!activeWave) return;
  const state = waveRenderState[activeWave.kind];
  if (activeWave.processor) {
    activeWave.phase = state.phase;
    return;
  }
  const now = waveAudioContext.currentTime;
  activeWave.oscillator.frequency.setTargetAtTime(state.frequency, now, 0.01);
  activeWave.gain.gain.setTargetAtTime(state.volume * 0.25, now, 0.01);
}

function startWaveAudio(kind, button, status, visualName) {
  stopChapterAudio();
  waveAudioContext = waveAudioContext || new AudioContext();
  const state = waveRenderState[kind];

  if (kind === "pulse") {
    const processor = waveAudioContext.createScriptProcessor(1024, 0, 1);
    processor.onaudioprocess = (event) => {
      const output = event.outputBuffer.getChannelData(0);
      let phase = activeWave ? activeWave.phase : state.phase;

      for (let i = 0; i < output.length; i += 1) {
        output[i] = (phase < state.duty ? state.volume : -state.volume) * 0.25;
        phase = (phase + state.frequency / waveAudioContext.sampleRate) % 1;
      }

      if (activeWave) activeWave.phase = phase;
    };
    processor.connect(waveAudioContext.destination);

    activeWave = { kind, processor, phase: state.phase, button, status };
    button.textContent = "Stop";
    if (status) status.textContent = "Playing live pulse. Move the sliders while it plays.";
    startLoopingCursor(visualName);
    return;
  }

  const oscillator = waveAudioContext.createOscillator();
  const gain = waveAudioContext.createGain();

  oscillator.type = kind === "triangle" ? "triangle" : kind === "sine" ? "sine" : "square";
  oscillator.frequency.value = state.frequency;
  gain.gain.value = state.volume * 0.25;
  oscillator.connect(gain);
  gain.connect(waveAudioContext.destination);
  oscillator.start();

  activeWave = { kind, oscillator, gain, button, status };
  button.textContent = "Stop";
  if (status) status.textContent = "Playing live oscillator. Move the sliders while it plays.";
  startLoopingCursor(visualName);
}

document.querySelectorAll("[data-wave-controls]").forEach((controls) => {
  const kind = controls.dataset.waveControls;
  updateWaveOutputs(kind);

  controls.querySelectorAll("[data-wave-control]").forEach((input) => {
    input.addEventListener("input", () => {
      const controlName = input.dataset.waveControl;

      if (kind === "pulse" && controlName === "gameboyDuty") {
        waveRenderState[kind].duty = GAMEBOY_DUTIES[Number(input.value)];
      } else if (kind === "pulse" && controlName === "dutyFine") {
        waveRenderState[kind].duty = Number(input.value);
      } else {
        waveRenderState[kind][controlName] = Number(input.value);
      }

      updateWaveOutputs(kind);
      drawCompositionVisual(`${kind}-rendered`, 0);
      if (activeWave && activeWave.kind === kind) updateActiveWaveAudio();
    });
  });
});

document.querySelectorAll("[data-wave-play]").forEach((button) => {
  button.dataset.label = button.textContent;
  button.addEventListener("click", () => {
    const status = button.dataset.status ? document.querySelector(button.dataset.status) : null;
    if (activeWave && activeWave.button === button) {
      stopWaveAudio();
      stopCursor();
      return;
    }
    startWaveAudio(button.dataset.wavePlay, button, status, button.dataset.visual);
  });
});

const lfsrVisualConfigs = {
  normal: { title: "normal / hold 9 / tap 1", tap: 1, interval: 360 },
  low: { title: "longer hold / chunkier", tap: 1, interval: 720 },
  bright: { title: "shorter hold / brighter", tap: 1, interval: 170 },
  short: { title: "different tap / shorter pattern", tap: 6, interval: 310 },
};

const lfsrToyState = {
  hold: 9,
  tap: 1,
  volume: 0.30,
  fade: 0.45,
};

const randomNoiseToyState = {
  hold: 9,
  volume: 0.22,
};

const fadedNoiseToyState = {
  hold: 28,
  volume: 0.24,
  fade: 0.28,
};

const variedNoiseToyState = {
  hold: 28,
  volume: 0.24,
  fade: 0.22,
  holdDelta: 18,
  fadeDelta: 0.10,
  repeat: 0.24,
};

const continuousToyState = {
  mode: "soft_xor",
  length: 32,
  tapA: 5,
  tapB: 17,
  drive: 2.8,
  hold: 5,
  volume: 0.30,
};

const lfsrVisualState = new WeakMap();
const randomNoiseVisualState = new WeakMap();
const continuousVisualState = new WeakMap();
let loadedMidi = null;

function resetRandomNoiseVisuals() {
  document.querySelectorAll("[data-random-noise-toy]").forEach((canvas) => {
    randomNoiseVisualState.delete(canvas);
  });
}

function lfsrStep(register, tap) {
  const feedback = (register ^ (register >> tap)) & 1;
  const nextRegister = (register >> 1) | (feedback << 14);
  const output = nextRegister & 1 ? -1 : 1;
  return { feedback, nextRegister, output };
}

function drawLfsrCanvas(canvas, config, elapsed) {
  const pixelRatio = window.devicePixelRatio || 1;
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  canvas.width = Math.floor(width * pixelRatio);
  canvas.height = Math.floor(height * pixelRatio);

  const context = canvas.getContext("2d");
  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  context.clearRect(0, 0, width, height);

  let state = lfsrVisualState.get(canvas);
  if (!state || state.tap !== config.tap || state.interval !== config.interval) {
    state = {
      register: 0x7fff,
      samples: [],
      lastStep: elapsed,
      feedback: 0,
      output: 1,
      tap: config.tap,
      interval: config.interval,
    };
  }

  while (elapsed - state.lastStep >= config.interval) {
    const next = lfsrStep(state.register, config.tap);
    state.register = next.nextRegister;
    state.feedback = next.feedback;
    state.output = next.output;
    state.samples.push(next.output);
    if (state.samples.length > 48) state.samples.shift();
    state.lastStep += config.interval;
  }
  lfsrVisualState.set(canvas, state);

  const bits = [];
  for (let bit = 14; bit >= 0; bit -= 1) bits.push((state.register >> bit) & 1);

  context.fillStyle = "#202124";
  context.font = "13px SFMono-Regular, Consolas, monospace";
  context.fillText(config.title, 12, 22);
  context.fillText(`feedback bit: ${state.feedback}`, 12, 42);
  context.fillText(`output sample: ${state.output > 0 ? "+1" : "-1"}`, width - 150, 42);

  const startX = 14;
  const boxY = 72;
  const gap = 4;
  const boxW = Math.max(22, Math.min(34, (width - 32 - gap * 14) / 15));
  const boxH = 32;
  const tapIndex = 14 - config.tap;

  bits.forEach((bit, index) => {
    const x = startX + index * (boxW + gap);
    const active = index === 14 || index === tapIndex;
    context.fillStyle = active ? "#c8e95a" : "#fffdf3";
    context.strokeStyle = active ? "#202124" : "#9aa6bf";
    context.lineWidth = active ? 2 : 1;
    context.fillRect(x, boxY, boxW, boxH);
    context.strokeRect(x, boxY, boxW, boxH);
    context.fillStyle = "#202124";
    context.font = "16px SFMono-Regular, Consolas, monospace";
    context.fillText(String(bit), x + boxW * 0.36, boxY + 21);
  });

  const outX = startX + 14 * (boxW + gap) + boxW * 0.5;
  const tapX = startX + tapIndex * (boxW + gap) + boxW * 0.5;
  context.strokeStyle = "#e6468a";
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(outX, boxY - 8);
  context.lineTo(outX, boxY - 28);
  context.lineTo(tapX, boxY - 28);
  context.lineTo(tapX, boxY - 8);
  context.stroke();
  context.fillStyle = "#e6468a";
  context.fillText("xor", Math.min(outX, tapX) + Math.abs(outX - tapX) * 0.45, boxY - 34);

  context.strokeStyle = "#202124";
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(startX + boxW, boxY + boxH + 18);
  context.lineTo(startX + 14 * (boxW + gap), boxY + boxH + 18);
  context.stroke();
  context.fillText("shift right", startX + 8, boxY + boxH + 38);

  const laneY = height - 48;
  context.strokeStyle = "#d8dde5";
  context.lineWidth = 1;
  context.beginPath();
  context.moveTo(12, laneY);
  context.lineTo(width - 12, laneY);
  context.stroke();

  context.strokeStyle = "#0c9b58";
  context.lineWidth = 2;
  context.beginPath();
  state.samples.forEach((sample, index) => {
    const x = 12 + (index / 47) * (width - 24);
    const y = laneY - sample * 24;
    if (index === 0) context.moveTo(x, y);
    else context.lineTo(x, y);
  });
  context.stroke();
  context.fillStyle = "#202124";
  context.fillText("emitted samples", 12, height - 12);
}

function updateLfsrOutputs() {
  const controls = document.querySelector("[data-lfsr-controls]");
  if (!controls) return;
  controls.querySelector('[data-lfsr-output="hold"]').textContent = `${Math.round(lfsrToyState.hold)} samples`;
  controls.querySelector('[data-lfsr-output="tap"]').textContent = String(lfsrToyState.tap);
  controls.querySelector('[data-lfsr-output="volume"]').textContent = lfsrToyState.volume.toFixed(2);
  controls.querySelector('[data-lfsr-output="fade"]').textContent = `${lfsrToyState.fade.toFixed(2)}s`;
}

function updateRandomNoiseOutputs() {
  const controls = document.querySelector("[data-random-noise-controls]");
  if (!controls) return;
  controls.querySelector('[data-random-noise-output="hold"]').textContent = `${Math.round(randomNoiseToyState.hold)} samples`;
  controls.querySelector('[data-random-noise-output="volume"]').textContent = randomNoiseToyState.volume.toFixed(2);
}

function updateFadedNoiseOutputs() {
  const controls = document.querySelector("[data-faded-noise-controls]");
  if (!controls) return;
  controls.querySelector('[data-faded-noise-output="hold"]').textContent = `${Math.round(fadedNoiseToyState.hold)} samples`;
  controls.querySelector('[data-faded-noise-output="volume"]').textContent = fadedNoiseToyState.volume.toFixed(2);
  controls.querySelector('[data-faded-noise-output="fade"]').textContent = `${fadedNoiseToyState.fade.toFixed(2)}s`;
}

function updateVariedNoiseOutputs() {
  const controls = document.querySelector("[data-varied-noise-controls]");
  if (!controls) return;
  controls.querySelector('[data-varied-noise-output="hold"]').textContent = `${Math.round(variedNoiseToyState.hold)} samples`;
  controls.querySelector('[data-varied-noise-output="volume"]').textContent = variedNoiseToyState.volume.toFixed(2);
  controls.querySelector('[data-varied-noise-output="fade"]').textContent = `${variedNoiseToyState.fade.toFixed(2)}s`;
  controls.querySelector('[data-varied-noise-output="holdDelta"]').textContent = `+/-${Math.round(variedNoiseToyState.holdDelta)}`;
  controls.querySelector('[data-varied-noise-output="fadeDelta"]').textContent = `+/-${variedNoiseToyState.fadeDelta.toFixed(2)}s`;
  controls.querySelector('[data-varied-noise-output="repeat"]').textContent = `${variedNoiseToyState.repeat.toFixed(2)}s`;
}

function syncVariedNoiseInputs() {
  const controls = document.querySelector("[data-varied-noise-controls]");
  if (!controls) return;
  controls.querySelector('[data-varied-noise-control="hold"]').value = variedNoiseToyState.hold;
  controls.querySelector('[data-varied-noise-control="volume"]').value = variedNoiseToyState.volume;
  controls.querySelector('[data-varied-noise-control="fade"]').value = variedNoiseToyState.fade;
  controls.querySelector('[data-varied-noise-control="holdDelta"]').value = variedNoiseToyState.holdDelta;
  controls.querySelector('[data-varied-noise-control="fadeDelta"]').value = variedNoiseToyState.fadeDelta;
  controls.querySelector('[data-varied-noise-control="repeat"]').value = variedNoiseToyState.repeat;
  updateVariedNoiseOutputs();
}

function drawRandomNoiseToy(canvas, elapsed) {
  const pixelRatio = window.devicePixelRatio || 1;
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  canvas.width = Math.floor(width * pixelRatio);
  canvas.height = Math.floor(height * pixelRatio);

  const context = canvas.getContext("2d");
  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  context.clearRect(0, 0, width, height);

  const hold = Math.max(1, Math.round(randomNoiseToyState.hold));
  let state = randomNoiseVisualState.get(canvas);
  if (!state) {
    state = { samples: [], current: Math.random() * 2 - 1, remaining: 0, lastStep: elapsed };
  }

  while (state.samples.length < 180) {
    if (state.remaining <= 0) {
      state.current = Math.random() * 2 - 1;
      state.remaining = hold;
    }
    state.samples.push(state.current);
    state.remaining -= 1;
  }

  while (elapsed - state.lastStep >= 32) {
    if (state.remaining <= 0) {
      state.current = Math.random() * 2 - 1;
      state.remaining = hold;
    }
    state.samples.push(state.current);
    if (state.samples.length > 180) state.samples.shift();
    state.remaining -= 1;
    state.lastStep += 32;
  }
  randomNoiseVisualState.set(canvas, state);

  context.fillStyle = "#202124";
  context.font = "13px SFMono-Regular, Consolas, monospace";
  context.fillText(`random / hold ${hold} samples`, 12, 22);
  context.fillText(`held value: ${state.current.toFixed(2)}`, 12, 42);

  const left = 12;
  const right = width - 12;
  const laneY = height * 0.55;
  context.strokeStyle = "#d8dde5";
  context.lineWidth = 1;
  context.beginPath();
  context.moveTo(left, laneY);
  context.lineTo(right, laneY);
  context.stroke();

  context.strokeStyle = "#f97316";
  context.lineWidth = 2;
  context.beginPath();
  state.samples.forEach((sample, index) => {
    const x = left + (index / 179) * (right - left);
    const y = laneY - sample * randomNoiseToyState.volume * 140;
    if (index === 0) context.moveTo(x, y);
    else context.lineTo(x, y);
  });
  context.stroke();

  context.fillStyle = "#202124";
  context.fillText("each horizontal run is the exact same sample value reused", 12, height - 14);
}

function drawFadedNoiseToy(canvas) {
  const pixelRatio = window.devicePixelRatio || 1;
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  canvas.width = Math.floor(width * pixelRatio);
  canvas.height = Math.floor(height * pixelRatio);

  const context = canvas.getContext("2d");
  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  context.clearRect(0, 0, width, height);

  const hold = Math.max(1, Math.round(fadedNoiseToyState.hold));
  const previewCount = 180;
  let current = 0.74;
  let remaining = 0;
  const samples = [];

  for (let i = 0; i < previewCount; i += 1) {
    if (remaining <= 0) {
      current = Math.sin((i + hold) * 12.9898) * 0.8;
      remaining = hold;
    }
    const fade = Math.max(0, 1 - i / previewCount);
    samples.push(current * fadedNoiseToyState.volume * fade);
    remaining -= 1;
  }

  context.fillStyle = "#202124";
  context.font = "13px SFMono-Regular, Consolas, monospace";
  context.fillText(`hold ${hold} samples / fade ${fadedNoiseToyState.fade.toFixed(2)}s`, 12, 22);

  const left = 12;
  const right = width - 12;
  const laneY = height * 0.55;
  context.strokeStyle = "#d8dde5";
  context.lineWidth = 1;
  context.beginPath();
  context.moveTo(left, laneY);
  context.lineTo(right, laneY);
  context.stroke();

  context.strokeStyle = "#e6468a";
  context.lineWidth = 2;
  context.beginPath();
  samples.forEach((sample, index) => {
    const x = left + (index / (previewCount - 1)) * (right - left);
    const y = laneY - sample * 260;
    if (index === 0) context.moveTo(x, y);
    else context.lineTo(x, y);
  });
  context.stroke();

  context.fillStyle = "#202124";
  context.fillText("same held noise, multiplied by a volume that falls over time", 12, height - 14);
}

function updateWavetableToyOutputs() {
  const controls = document.querySelector("[data-wavetable-controls]");
  if (!controls) return;
  controls.querySelector('[data-wavetable-output="frequency"]').textContent = `${Math.round(wavetableToyState.frequency)} Hz`;
  controls.querySelector('[data-wavetable-output="volume"]').textContent = wavetableToyState.volume.toFixed(2);
}

function drawWavetableToy(canvas) {
  const pixelRatio = window.devicePixelRatio || 1;
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  canvas.width = Math.floor(width * pixelRatio);
  canvas.height = Math.floor(height * pixelRatio);

  const context = canvas.getContext("2d");
  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  context.clearRect(0, 0, width, height);
  context.font = "13px SFMono-Regular, Consolas, monospace";

  const left = 22;
  const right = width - 22;
  const tableTop = 42;
  const tableHeight = Math.max(120, height * 0.42);
  const tableCenter = tableTop + tableHeight * 0.5;
  const barWidth = (right - left) / wavetableToyState.table.length;

  context.fillStyle = "#202124";
  context.fillText("32 offsets stored in the table", left, 22);

  context.strokeStyle = "#d8dde5";
  context.lineWidth = 1;
  context.beginPath();
  context.moveTo(left, tableCenter);
  context.lineTo(right, tableCenter);
  context.stroke();

  wavetableToyState.table.forEach((value, index) => {
    const x = left + index * barWidth;
    const y = tableCenter - value * tableHeight * 0.46;
    context.fillStyle = value >= 0 ? "#c8e95a" : "#f8b9d2";
    context.fillRect(x + 1, Math.min(tableCenter, y), Math.max(2, barWidth - 2), Math.abs(tableCenter - y));
    context.strokeStyle = "#202124";
    context.strokeRect(x + 1, Math.min(tableCenter, y), Math.max(2, barWidth - 2), Math.abs(tableCenter - y) || 2);
  });

  const waveTop = tableTop + tableHeight + 54;
  const waveCenter = waveTop + 72;
  const visualRate = 900;
  const frequency = Math.max(3, wavetableToyState.frequency / 32);
  const count = Math.floor((width - 44) * 1.2);

  context.fillStyle = "#202124";
  context.fillText("then we scan around that table over and over", left, waveTop - 18);
  context.strokeStyle = "#d8dde5";
  context.beginPath();
  context.moveTo(left, waveCenter);
  context.lineTo(right, waveCenter);
  context.stroke();

  context.strokeStyle = "#6d4bd4";
  context.lineWidth = 2;
  context.beginPath();
  for (let i = 0; i < count; i += 1) {
    const x = left + (i / (count - 1)) * (right - left);
    const value = wavetableVisualSample(i, frequency, wavetableToyState.table, visualRate);
    const y = waveCenter - value * 62 * wavetableToyState.volume * 3.2;
    if (i === 0) context.moveTo(x, y);
    else context.lineTo(x, y);
  }
  context.stroke();
}

function redrawWavetableToy() {
  updateWavetableToyOutputs();
  document.querySelectorAll("[data-wavetable-toy]").forEach((canvas) => drawWavetableToy(canvas));
  drawCompositionVisual("wavetable-toy-rendered", currentCompositionProgress("wavetable-toy-rendered"));
}

function setWavetableBarFromPointer(canvas, event) {
  const rect = canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  const left = 22;
  const right = rect.width - 22;
  const tableTop = 42;
  const tableHeight = Math.max(120, rect.height * 0.42);
  const index = Math.max(0, Math.min(31, Math.floor(((x - left) / Math.max(1, right - left)) * 32)));
  const value = Math.max(-1, Math.min(1, 1 - ((y - tableTop) / tableHeight) * 2));
  wavetableToyState.table[index] = value;
  redrawWavetableToy();
}

function setupWavetableToy() {
  document.querySelectorAll("[data-wavetable-controls]").forEach((controls) => {
    controls.querySelectorAll("[data-wavetable-control]").forEach((input) => {
      input.addEventListener("input", () => {
        wavetableToyState[input.dataset.wavetableControl] = Number(input.value);
        redrawWavetableToy();
      });
    });
  });

  document.querySelectorAll("[data-wavetable-preset]").forEach((button) => {
    button.addEventListener("click", () => {
      wavetableToyState.table = wavetableFromPreset(button.dataset.wavetablePreset);
      redrawWavetableToy();
    });
  });

  document.querySelectorAll("[data-wavetable-toy]").forEach((canvas) => {
    let dragging = false;
    canvas.addEventListener("pointerdown", (event) => {
      dragging = true;
      canvas.setPointerCapture(event.pointerId);
      setWavetableBarFromPointer(canvas, event);
    });
    canvas.addEventListener("pointermove", (event) => {
      if (dragging) setWavetableBarFromPointer(canvas, event);
    });
    canvas.addEventListener("pointerup", () => {
      dragging = false;
    });
    canvas.addEventListener("pointercancel", () => {
      dragging = false;
    });
  });

  redrawWavetableToy();
}

function drawAllLfsrVisuals(timestamp) {
  document.querySelectorAll("[data-random-noise-toy]").forEach((canvas) => {
    drawRandomNoiseToy(canvas, timestamp);
  });

  document.querySelectorAll("[data-faded-noise-toy]").forEach((canvas) => {
    drawFadedNoiseToy(canvas);
  });

  document.querySelectorAll("[data-lfsr-visual]").forEach((canvas) => {
    drawLfsrCanvas(canvas, lfsrVisualConfigs[canvas.dataset.lfsrVisual], timestamp);
  });

  document.querySelectorAll("[data-lfsr-toy]").forEach((canvas) => {
    drawLfsrCanvas(canvas, {
      title: `toy / hold ${Math.round(lfsrToyState.hold)} / tap ${lfsrToyState.tap}`,
      tap: lfsrToyState.tap,
      interval: Math.max(90, lfsrToyState.hold * 55),
    }, timestamp);
  });

  document.querySelectorAll("[data-continuous-toy]").forEach((canvas) => {
    drawContinuousCanvas(canvas, timestamp);
  });

  requestAnimationFrame(drawAllLfsrVisuals);
}

function drawContinuousCanvas(canvas, elapsed) {
  const pixelRatio = window.devicePixelRatio || 1;
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  canvas.width = Math.floor(width * pixelRatio);
  canvas.height = Math.floor(height * pixelRatio);

  const context = canvas.getContext("2d");
  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  context.clearRect(0, 0, width, height);

  let state = continuousVisualState.get(canvas);
  const signature = JSON.stringify({
    mode: continuousToyState.mode,
    length: continuousToyState.length,
    tapA: continuousToyState.tapA,
    tapB: continuousToyState.tapB,
    drive: continuousToyState.drive,
    hold: continuousToyState.hold,
  });

  if (!state || state.signature !== signature) {
    state = {
      values: Array.from({ length: continuousToyState.length }, (_, i) => Math.sin(i * 12.9898)),
      samples: [],
      lastStep: elapsed,
      signature,
    };
  }

  const interval = Math.max(60, continuousToyState.hold * 45);
  while (elapsed - state.lastStep >= interval) {
    const values = state.values;
    const a = values[values.length - 1];
    const b = values[values.length - 1 - (continuousToyState.tapA % values.length)];
    const c = values[values.length - 1 - (continuousToyState.tapB % values.length)];
    const next = continuousFeedback(continuousToyState.mode, a, b, c, continuousToyState.drive);
    values.pop();
    values.unshift(next);
    state.samples.push(values[values.length - 1]);
    if (state.samples.length > 80) state.samples.shift();
    state.lastStep += interval;
  }
  continuousVisualState.set(canvas, state);

  context.fillStyle = "#202124";
  context.font = "13px SFMono-Regular, Consolas, monospace";
  context.fillText(`${continuousToyState.mode} / length ${continuousToyState.length}`, 12, 22);
  context.fillText(`tap A ${continuousToyState.tapA} / tap B ${continuousToyState.tapB} / drive ${continuousToyState.drive.toFixed(2)}`, 12, 42);

  const laneTop = 72;
  const laneHeight = 70;
  const left = 12;
  const right = width - 12;
  const centerY = laneTop + laneHeight * 0.5;
  context.strokeStyle = "#d8dde5";
  context.beginPath();
  context.moveTo(left, centerY);
  context.lineTo(right, centerY);
  context.stroke();

  context.strokeStyle = "#6d4bd4";
  context.lineWidth = 2;
  context.beginPath();
  state.values.forEach((value, index) => {
    const x = left + (index / Math.max(1, state.values.length - 1)) * (right - left);
    const y = centerY - value * 28;
    if (index === 0) context.moveTo(x, y);
    else context.lineTo(x, y);
  });
  context.stroke();
  context.fillStyle = "#202124";
  context.fillText("smooth register values", 12, laneTop + laneHeight + 22);

  const sampleY = height - 48;
  context.strokeStyle = "#d8dde5";
  context.beginPath();
  context.moveTo(left, sampleY);
  context.lineTo(right, sampleY);
  context.stroke();

  context.strokeStyle = "#0c9b58";
  context.beginPath();
  state.samples.forEach((sample, index) => {
    const x = left + (index / 79) * (right - left);
    const y = sampleY - sample * 25;
    if (index === 0) context.moveTo(x, y);
    else context.lineTo(x, y);
  });
  context.stroke();
  context.fillText("output over time", 12, height - 12);
}

function updateContinuousOutputs() {
  const controls = document.querySelector("[data-continuous-controls]");
  if (!controls) return;
  controls.querySelector('[data-continuous-output="mode"]').textContent = continuousToyState.mode;
  controls.querySelector('[data-continuous-output="length"]').textContent = String(continuousToyState.length);
  controls.querySelector('[data-continuous-output="tapA"]').textContent = String(continuousToyState.tapA);
  controls.querySelector('[data-continuous-output="tapB"]').textContent = String(continuousToyState.tapB);
  controls.querySelector('[data-continuous-output="drive"]').textContent = continuousToyState.drive.toFixed(2);
  controls.querySelector('[data-continuous-output="hold"]').textContent = `${Math.round(continuousToyState.hold)} samples`;
  controls.querySelector('[data-continuous-output="volume"]').textContent = continuousToyState.volume.toFixed(2);
}

document.querySelectorAll("[data-lfsr-controls]").forEach((controls) => {
  updateLfsrOutputs();
  controls.querySelectorAll("[data-lfsr-control]").forEach((input) => {
    input.addEventListener("input", () => {
      const value = Number(input.value);
      if (input.dataset.lfsrControl === "hold") lfsrToyState.hold = value;
      if (input.dataset.lfsrControl === "tap") lfsrToyState.tap = value;
      if (input.dataset.lfsrControl === "volume") lfsrToyState.volume = value;
      if (input.dataset.lfsrControl === "fade") lfsrToyState.fade = value;
      updateLfsrOutputs();
    });
  });
});

document.querySelectorAll("[data-random-noise-controls]").forEach((controls) => {
  updateRandomNoiseOutputs();
  controls.querySelectorAll("[data-random-noise-control]").forEach((input) => {
    input.addEventListener("input", () => {
      const value = Number(input.value);
      if (input.dataset.randomNoiseControl === "hold") {
        randomNoiseToyState.hold = value;
        resetRandomNoiseVisuals();
      }
      if (input.dataset.randomNoiseControl === "volume") randomNoiseToyState.volume = value;
      updateRandomNoiseOutputs();
    });
  });
});

document.querySelectorAll("[data-faded-noise-controls]").forEach((controls) => {
  updateFadedNoiseOutputs();
  controls.querySelectorAll("[data-faded-noise-control]").forEach((input) => {
    input.addEventListener("input", () => {
      const value = Number(input.value);
      if (input.dataset.fadedNoiseControl === "hold") fadedNoiseToyState.hold = value;
      if (input.dataset.fadedNoiseControl === "volume") fadedNoiseToyState.volume = value;
      if (input.dataset.fadedNoiseControl === "fade") fadedNoiseToyState.fade = value;
      updateFadedNoiseOutputs();
    });
  });
});

document.querySelectorAll("[data-varied-noise-controls]").forEach((controls) => {
  updateVariedNoiseOutputs();
  controls.querySelectorAll("[data-varied-noise-control]").forEach((input) => {
    input.addEventListener("input", () => {
      const value = Number(input.value);
      if (input.dataset.variedNoiseControl === "hold") variedNoiseToyState.hold = value;
      if (input.dataset.variedNoiseControl === "volume") variedNoiseToyState.volume = value;
      if (input.dataset.variedNoiseControl === "fade") variedNoiseToyState.fade = value;
      if (input.dataset.variedNoiseControl === "holdDelta") variedNoiseToyState.holdDelta = value;
      if (input.dataset.variedNoiseControl === "fadeDelta") variedNoiseToyState.fadeDelta = value;
      if (input.dataset.variedNoiseControl === "repeat") {
        variedNoiseToyState.repeat = value;
        if (variedNoiseLoop) {
          const button = document.querySelector("[data-varied-noise-play]");
          stopVariedNoiseLoop();
          if (button) startVariedNoiseLoop(button);
        }
      }
      updateVariedNoiseOutputs();
    });
  });
});

document.querySelectorAll("[data-varied-noise-preset]").forEach((button) => {
  button.addEventListener("click", () => {
    variedNoiseToyState.hold = Number(button.dataset.hold);
    variedNoiseToyState.volume = Number(button.dataset.volume);
    variedNoiseToyState.fade = Number(button.dataset.fade);
    variedNoiseToyState.holdDelta = Number(button.dataset.holdDelta);
    variedNoiseToyState.fadeDelta = Number(button.dataset.fadeDelta);
    variedNoiseToyState.repeat = Number(button.dataset.repeat);
    syncVariedNoiseInputs();

    const playButton = document.querySelector("[data-varied-noise-play]");
    if (variedNoiseLoop) {
      stopVariedNoiseLoop();
    }
    if (playButton) startVariedNoiseLoop(playButton);
  });
});

document.querySelectorAll("[data-midi-file]").forEach((input) => {
  input.addEventListener("change", async () => {
    const file = input.files && input.files[0];
    const summary = document.querySelector("[data-midi-summary]");
    const channelList = document.querySelector("[data-midi-channels]");
    const playButton = document.querySelector("[data-midi-play]");
    if (!file || !summary || !channelList || !playButton) return;

    try {
      loadedMidi = parseMidi(await file.arrayBuffer());
      const groups = new Map();
      for (const note of loadedMidi.notes) {
        const id = midiGroupId(note);
        if (!groups.has(id)) groups.set(id, {
          id,
          trackIndex: note.trackIndex,
          channel: note.channel,
          count: 0,
        });
        groups.get(id).count += 1;
      }

      summary.textContent = `${file.name}: ${loadedMidi.notes.length} notes, ${groups.size} track/channel groups. Preview is capped at 32 seconds.`;
      channelList.innerHTML = "";
      for (const group of groups.values()) {
        const label = document.createElement("label");
        const text = document.createElement("span");
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = true;
        checkbox.dataset.midiGroup = group.id;
        text.textContent = midiGroupLabel(group, loadedMidi.trackNames);
        label.append(text, checkbox);
        channelList.append(label);
      }
      playButton.disabled = loadedMidi.notes.length === 0;
    } catch (error) {
      loadedMidi = null;
      summary.textContent = `Could not read MIDI: ${error.message}`;
      channelList.innerHTML = "";
      playButton.disabled = true;
    }
  });
});

document.querySelectorAll("[data-midi-play]").forEach((button) => {
  button.dataset.label = button.textContent;
  button.addEventListener("click", () => {
    if (chapterAudio && button.textContent === "Stop") {
      stopChapterAudio();
      return;
    }
    if (!loadedMidi) return;
    const enabledGroups = new Set(
      Array.from(document.querySelectorAll("[data-midi-group]"))
        .filter((checkbox) => checkbox.checked)
        .map((checkbox) => checkbox.dataset.midiGroup),
    );
    playSamples(renderMidiPreview(loadedMidi, enabledGroups), button, null, null);
  });
});

document.querySelectorAll("[data-lfsr-play]").forEach((button) => {
  button.dataset.label = button.textContent;
  button.addEventListener("click", () => {
    if (chapterAudio && button.textContent === "Stop") {
      stopChapterAudio();
      return;
    }
    playSamples(lfsrNoise(0.9, lfsrToyState.volume, {
      holdSamples: lfsrToyState.hold,
      tap: lfsrToyState.tap,
      fadeSeconds: lfsrToyState.fade,
    }), button, null, null);
  });
});

document.querySelectorAll("[data-random-noise-play]").forEach((button) => {
  button.dataset.label = button.textContent;
  button.addEventListener("click", () => {
    toggleLiveRandomNoise(button);
  });
});

document.querySelectorAll("[data-noise-piano-note]").forEach((button) => {
  button.dataset.label = button.textContent;
  button.addEventListener("click", () => {
    const frequency = noteFrequency(button.dataset.noisePianoNote);
    const holdSamples = Math.max(1, Math.round(CHAPTER_SAMPLE_RATE / frequency));
    playSamples(heldRandomNoise({
      seconds: 0.55,
      volume: 0.20,
      holdSamples,
    }), null, null, null);
  });
});

document.querySelectorAll("[data-faded-noise-play]").forEach((button) => {
  button.dataset.label = button.textContent;
  button.addEventListener("click", () => {
    if (chapterAudio && button.textContent === "Stop") {
      stopChapterAudio();
      return;
    }
    playSamples(heldRandomNoise({
      seconds: Math.max(0.12, fadedNoiseToyState.fade),
      volume: fadedNoiseToyState.volume,
      holdSamples: fadedNoiseToyState.hold,
      fadeSeconds: fadedNoiseToyState.fade,
    }), button, null, null);
  });
});

document.querySelectorAll("[data-varied-noise-play]").forEach((button) => {
  button.dataset.label = button.textContent;
  button.addEventListener("click", () => {
    startVariedNoiseLoop(button);
  });
});

document.querySelectorAll("[data-feedback-play]").forEach((button) => {
  button.dataset.label = button.textContent;
  button.addEventListener("click", () => {
    if (chapterAudio && button.textContent === "Stop") {
      stopChapterAudio();
      return;
    }
    playSamples(feedbackShiftNoise({
      mode: button.dataset.mode,
      length: Number(button.dataset.length),
      tapA: Number(button.dataset.tapA),
      tapB: Number(button.dataset.tapB),
      holdSamples: Number(button.dataset.hold),
    }), button, null, null);
  });
});

document.querySelectorAll("[data-continuous-controls]").forEach((controls) => {
  updateContinuousOutputs();
  controls.querySelectorAll("[data-continuous-control]").forEach((input) => {
    input.addEventListener("input", () => {
      if (input.dataset.continuousControl === "mode") continuousToyState.mode = input.value;
      else continuousToyState[input.dataset.continuousControl] = Number(input.value);

      continuousToyState.tapA = Math.min(continuousToyState.tapA, continuousToyState.length - 1);
      continuousToyState.tapB = Math.min(continuousToyState.tapB, continuousToyState.length - 1);
      updateContinuousOutputs();
    });
  });
});

document.querySelectorAll("[data-continuous-play]").forEach((button) => {
  button.dataset.label = button.textContent;
  button.addEventListener("click", () => {
    if (chapterAudio && button.textContent === "Stop") {
      stopChapterAudio();
      return;
    }
    playSamples(continuousShiftNoise({
      mode: continuousToyState.mode,
      length: continuousToyState.length,
      tapA: continuousToyState.tapA,
      tapB: continuousToyState.tapB,
      drive: continuousToyState.drive,
      holdSamples: continuousToyState.hold,
      volume: continuousToyState.volume,
    }), button, null, null);
  });
});

if (document.querySelector("[data-wavetable-toy]")) {
  setupWavetableToy();
}

if (document.querySelector("[data-random-noise-toy], [data-faded-noise-toy], [data-lfsr-visual], [data-lfsr-toy], [data-continuous-toy]")) {
  requestAnimationFrame(drawAllLfsrVisuals);
}

document.querySelectorAll("[data-composition-visual]").forEach((canvas) => {
  drawCompositionVisual(canvas.dataset.compositionVisual, 0);
});

document.querySelectorAll("[data-route3-event]").forEach((element) => {
  element.addEventListener("mouseenter", () => setRoute3Hover(element.dataset.route3Event));
  element.addEventListener("focus", () => setRoute3Hover(element.dataset.route3Event));
  element.addEventListener("click", (event) => {
    event.preventDefault();
    setRoute3Hover(element.dataset.route3Event);
    playRoute3Event(element.dataset.route3Event);
  });
  element.addEventListener("mouseleave", () => setRoute3Hover(null));
  element.addEventListener("blur", () => setRoute3Hover(null));
});

document.querySelectorAll('[data-composition-visual="route3-sketch-channels"], [data-composition-visual="route3-full-channels"]').forEach((canvas) => {
  canvas.addEventListener("mousemove", (event) => {
    const hitbox = route3HitboxAt(canvas, event.clientX, event.clientY);
    setRoute3Hover(hitbox ? hitbox.id : null, hitbox ? hitbox.start + Math.min(hitbox.duration * 0.5, 0.04) : null);
  });
  canvas.addEventListener("click", (event) => {
    const hitbox = route3HitboxAt(canvas, event.clientX, event.clientY);
    if (!hitbox) return;
    setRoute3Hover(hitbox.id, hitbox.start + Math.min(hitbox.duration * 0.5, 0.04));
    playRoute3Event(hitbox.id);
  });
  canvas.addEventListener("mouseleave", () => setRoute3Hover(null));
});

window.addEventListener("resize", () => {
  document.querySelectorAll("[data-composition-visual]").forEach((canvas) => {
    drawCompositionVisual(canvas.dataset.compositionVisual, 0);
  });
});
