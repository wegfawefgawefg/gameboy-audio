const CHAPTER_SAMPLE_RATE = 44100;

let chapterAudio = null;
let chapterAudioUrl = null;

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

function lfsrNoise(seconds, volume) {
  const sampleCount = Math.floor(CHAPTER_SAMPLE_RATE * seconds);
  const samples = new Float32Array(sampleCount);
  let lfsr = 0x7fff;
  let current = 1;
  let timer = 0;
  const clockHz = 5000;

  for (let i = 0; i < samples.length; i += 1) {
    timer += 1 / CHAPTER_SAMPLE_RATE;
    if (timer >= 1 / clockHz) {
      timer -= 1 / clockHz;
      const bit = (lfsr ^ (lfsr >> 1)) & 1;
      lfsr = (lfsr >> 1) | (bit << 14);
      current = lfsr & 1 ? -1 : 1;
    }
    const fade = Math.max(0, 1 - i / (CHAPTER_SAMPLE_RATE * 0.45));
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

function playSamples(samples, button, status) {
  stopChapterAudio();
  status.textContent = "Building WAV from samples...";
  chapterAudioUrl = samplesToWavUrl(samples);
  chapterAudio = new Audio(chapterAudioUrl);
  chapterAudio.onended = () => {
    button.textContent = button.dataset.label;
    status.textContent = "";
  };
  chapterAudio.play()
    .then(() => {
      button.textContent = "Stop";
      status.textContent = "Playing generated samples.";
    })
    .catch((error) => {
      status.textContent = `Could not start audio: ${error.message}`;
    });
}

function stopChapterAudio() {
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
    const status = document.querySelector(button.dataset.status);
    if (chapterAudio && button.textContent === "Stop") {
      stopChapterAudio();
      status.textContent = "";
      return;
    }

    const kind = button.dataset.play;
    if (kind === "noise") playSamples(lfsrNoise(0.8, 0.35), button, status);
    else if (kind === "two-voices") playSamples(buildTwoVoices(), button, status);
    else playSamples(buildTone({ type: kind, frequency: Number(button.dataset.frequency || 220) }), button, status);
  });
});
