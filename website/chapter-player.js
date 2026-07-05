const CHAPTER_SAMPLE_RATE = 44100;

let chapterAudio = null;
let chapterAudioUrl = null;
let cursorFrame = null;
let activeVisualName = null;
let waveAudioContext = null;
let activeWave = null;

const waveRenderState = {
  square: { frequency: 220, volume: 0.42, phase: 0 },
  triangle: { frequency: 220, volume: 0.42, phase: 0 },
};

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
  let timer = 0;
  const clockHz = options.clockHz || 5000;
  const fadeSeconds = options.fadeSeconds || 0.45;
  const tap = options.tap || (options.shortMode ? 6 : 1);

  for (let i = 0; i < samples.length; i += 1) {
    timer += 1 / CHAPTER_SAMPLE_RATE;
    if (timer >= 1 / clockHz) {
      timer -= 1 / clockHz;
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

function feedbackShiftNoise({ mode, length, tapA, tapB, clockHz, seconds = 0.85, volume = 0.34 }) {
  const sampleCount = Math.floor(CHAPTER_SAMPLE_RATE * seconds);
  const samples = new Float32Array(sampleCount);
  let register = (1 << Math.min(length, 30)) - 1;
  let current = 1;
  let timer = 0;
  const mask = (1 << Math.min(length, 30)) - 1;

  for (let i = 0; i < samples.length; i += 1) {
    timer += 1 / CHAPTER_SAMPLE_RATE;
    if (timer >= 1 / clockHz) {
      timer -= 1 / clockHz;
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

function continuousShiftNoise({ mode, length, tapA, tapB, drive, clockHz, seconds = 1.0, volume = 0.30 }) {
  const sampleCount = Math.floor(CHAPTER_SAMPLE_RATE * seconds);
  const samples = new Float32Array(sampleCount);
  const state = Array.from({ length }, (_, i) => Math.sin(i * 12.9898));
  let current = state[state.length - 1];
  let timer = 0;

  for (let i = 0; i < samples.length; i += 1) {
    timer += 1 / CHAPTER_SAMPLE_RATE;
    if (timer >= 1 / clockHz) {
      timer -= 1 / clockHz;
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

function waveTableSample(index, frequency, volume, table) {
  const time = index / CHAPTER_SAMPLE_RATE;
  const phase = (frequency * time) % 1;
  const tableIndex = Math.floor(phase * table.length) % table.length;
  return table[tableIndex] * volume;
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
  return notes[note];
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

function addNoiseHit(samples, startSeconds, durationSeconds, volume) {
  const hit = lfsrNoise(durationSeconds, volume);
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
    button.textContent = button.dataset.label;
    if (status) status.textContent = "";
    stopCursor();
  };
  chapterAudio.play()
    .then(() => {
      button.textContent = "Stop";
      if (status) status.textContent = "Playing generated samples.";
      startCursor(visualName);
    })
    .catch((error) => {
      if (status) status.textContent = `Could not start audio: ${error.message}`;
      else console.error("Could not start audio:", error);
    });
}

function stopChapterAudio() {
  stopCursor();
  stopWaveAudio();
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
  document.querySelectorAll("[data-lfsr-play]").forEach((button) => {
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

  try {
    activeWave.oscillator.stop();
  } catch (error) {
    // The oscillator may already be stopped by the browser.
  }
  activeWave.oscillator.disconnect();
  activeWave.gain.disconnect();
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
    else if (kind === "noise-low") playSamples(lfsrNoise(0.8, 0.35, { clockHz: 900, fadeSeconds: 0.65 }), button, status, visualName);
    else if (kind === "noise-bright") playSamples(lfsrNoise(0.6, 0.30, { clockHz: 12000, fadeSeconds: 0.35 }), button, status, visualName);
    else if (kind === "noise-short") playSamples(lfsrNoise(0.7, 0.32, { clockHz: 6500, fadeSeconds: 0.45, tap: 6 }), button, status, visualName);
    else if (kind === "noise-click") playSamples(lfsrNoise(0.25, 0.45, { clockHz: 9000, fadeSeconds: 0.08 }), button, status, visualName);
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
    else if (kind === "filtered-square") playSamples(buildFilteredSquare(), button, status, visualName);
    else playSamples(buildTone({ type: kind, frequency: Number(button.dataset.frequency || 220) }), button, status, visualName);
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

  context.font = "12px SFMono-Regular, Consolas, monospace";
  context.lineWidth = 2;

  data.lanes.forEach(([label, samples, color], laneIndex) => {
    const centerY = 22 + laneHeight * laneIndex + laneHeight * 0.5;
    const amplitude = laneHeight * 0.32;

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
    for (let i = 0; i < samples.length; i += 1) {
      const x = left + (i / (samples.length - 1)) * (right - left);
      const y = centerY - samples[i] * amplitude;
      if (i === 0) context.moveTo(x, y);
      else context.lineTo(x, y);
    }
    context.stroke();

    context.fillStyle = color;
    const dotEvery = Math.max(1, Math.floor(samples.length / 42));
    for (let i = 0; i < samples.length; i += dotEvery) {
      const x = left + (i / (samples.length - 1)) * (right - left);
      const y = centerY - samples[i] * amplitude;
      context.beginPath();
      context.arc(x, y, 2.4, 0, 2 * Math.PI);
      context.fill();
    }
  });

  if (data.markers) {
    context.fillStyle = "#202124";
    context.strokeStyle = "#b9c0cc";
    context.lineWidth = 1;

    for (const [time, label] of data.markers) {
      if (time > data.duration) continue;
      const x = left + (time / data.duration) * (right - left);
      context.beginPath();
      context.moveTo(x, 12);
      context.lineTo(x, height - 24);
      context.stroke();
      context.fillText(label, Math.min(x + 5, width - 34), 22);
    }
  }

  const cursorX = left + progress * (right - left);
  context.strokeStyle = "#202124";
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(cursorX, 10);
  context.lineTo(cursorX, height - 22);
  context.stroke();

  context.fillStyle = "#202124";
  context.fillText(`${(progress * data.duration).toFixed(2)}s`, Math.min(cursorX + 6, width - 52), height - 8);
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

function updateWaveOutputs(kind) {
  const controls = document.querySelector(`[data-wave-controls="${kind}"]`);
  if (!controls) return;
  const state = waveRenderState[kind];
  controls.querySelector('[data-wave-output="frequency"]').textContent = `${Math.round(state.frequency)} Hz`;
  controls.querySelector('[data-wave-output="volume"]').textContent = state.volume.toFixed(2);
  controls.querySelector('[data-wave-output="phase"]').textContent = `${state.phase.toFixed(2)} cycle`;
}

function updateActiveWaveAudio() {
  if (!activeWave) return;
  const state = waveRenderState[activeWave.kind];
  const now = waveAudioContext.currentTime;
  activeWave.oscillator.frequency.setTargetAtTime(state.frequency, now, 0.01);
  activeWave.gain.gain.setTargetAtTime(state.volume * 0.25, now, 0.01);
}

function startWaveAudio(kind, button, status, visualName) {
  stopChapterAudio();
  waveAudioContext = waveAudioContext || new AudioContext();
  const state = waveRenderState[kind];
  const oscillator = waveAudioContext.createOscillator();
  const gain = waveAudioContext.createGain();

  oscillator.type = kind === "triangle" ? "triangle" : "square";
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
      waveRenderState[kind][input.dataset.waveControl] = Number(input.value);
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
  normal: { title: "normal / 5000 Hz / tap 1", tap: 1, interval: 360 },
  low: { title: "lower clock / chunkier", tap: 1, interval: 720 },
  bright: { title: "higher clock / brighter", tap: 1, interval: 170 },
  short: { title: "different tap / shorter pattern", tap: 6, interval: 310 },
};

const lfsrToyState = {
  clock: 5000,
  tap: 1,
  volume: 0.30,
  fade: 0.45,
};

const continuousToyState = {
  mode: "soft_xor",
  length: 32,
  tapA: 5,
  tapB: 17,
  drive: 2.8,
  clock: 9000,
  volume: 0.30,
};

const lfsrVisualState = new WeakMap();
const continuousVisualState = new WeakMap();

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
  controls.querySelector('[data-lfsr-output="clock"]').textContent = `${Math.round(lfsrToyState.clock)} Hz`;
  controls.querySelector('[data-lfsr-output="tap"]').textContent = String(lfsrToyState.tap);
  controls.querySelector('[data-lfsr-output="volume"]').textContent = lfsrToyState.volume.toFixed(2);
  controls.querySelector('[data-lfsr-output="fade"]').textContent = `${lfsrToyState.fade.toFixed(2)}s`;
}

function drawAllLfsrVisuals(timestamp) {
  document.querySelectorAll("[data-lfsr-visual]").forEach((canvas) => {
    drawLfsrCanvas(canvas, lfsrVisualConfigs[canvas.dataset.lfsrVisual], timestamp);
  });

  document.querySelectorAll("[data-lfsr-toy]").forEach((canvas) => {
    drawLfsrCanvas(canvas, {
      title: `toy / ${Math.round(lfsrToyState.clock)} Hz / tap ${lfsrToyState.tap}`,
      tap: lfsrToyState.tap,
      interval: Math.max(90, 9000 / lfsrToyState.clock * 500),
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
    clock: continuousToyState.clock,
  });

  if (!state || state.signature !== signature) {
    state = {
      values: Array.from({ length: continuousToyState.length }, (_, i) => Math.sin(i * 12.9898)),
      samples: [],
      lastStep: elapsed,
      signature,
    };
  }

  const interval = Math.max(60, 9000 / continuousToyState.clock * 420);
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
  controls.querySelector('[data-continuous-output="clock"]').textContent = `${Math.round(continuousToyState.clock)} Hz`;
  controls.querySelector('[data-continuous-output="volume"]').textContent = continuousToyState.volume.toFixed(2);
}

document.querySelectorAll("[data-lfsr-controls]").forEach((controls) => {
  updateLfsrOutputs();
  controls.querySelectorAll("[data-lfsr-control]").forEach((input) => {
    input.addEventListener("input", () => {
      const value = Number(input.value);
      if (input.dataset.lfsrControl === "clock") lfsrToyState.clock = value;
      if (input.dataset.lfsrControl === "tap") lfsrToyState.tap = value;
      if (input.dataset.lfsrControl === "volume") lfsrToyState.volume = value;
      if (input.dataset.lfsrControl === "fade") lfsrToyState.fade = value;
      updateLfsrOutputs();
    });
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
      clockHz: lfsrToyState.clock,
      tap: lfsrToyState.tap,
      fadeSeconds: lfsrToyState.fade,
    }), button, null, null);
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
      clockHz: Number(button.dataset.clock),
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
      clockHz: continuousToyState.clock,
      volume: continuousToyState.volume,
    }), button, null, null);
  });
});

if (document.querySelector("[data-lfsr-visual], [data-lfsr-toy], [data-continuous-toy]")) {
  requestAnimationFrame(drawAllLfsrVisuals);
}

document.querySelectorAll("[data-composition-visual]").forEach((canvas) => {
  drawCompositionVisual(canvas.dataset.compositionVisual, 0);
});

window.addEventListener("resize", () => {
  document.querySelectorAll("[data-composition-visual]").forEach((canvas) => {
    drawCompositionVisual(canvas.dataset.compositionVisual, 0);
  });
});
