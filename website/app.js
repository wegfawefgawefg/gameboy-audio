const SAMPLE_RATE = 44100;
const PREVIEW_SAMPLES = 160;
const AUDIO_OUTPUT_GAIN = 0.2;

const frequencyInput = document.querySelector("#frequency");
const volumeInput = document.querySelector("#volume");
const sampleIndexInput = document.querySelector("#sampleIndex");
const frequencyValue = document.querySelector("#frequencyValue");
const volumeValue = document.querySelector("#volumeValue");
const sampleValue = document.querySelector("#sampleValue");
const playButton = document.querySelector("#playButton");
const playCodeButton = document.querySelector("#playCodeButton");
const speakerMotion = document.querySelector("#speakerMotion");
const diaphragmReadout = document.querySelector("#diaphragmReadout");
const waveCanvas = document.querySelector("#waveCanvas");
const languageCycleLabel = document.querySelector("#languageCycleLabel");
const languageCycleButton = document.querySelector("#languageCycleButton");
const playbackExamples = Array.from(document.querySelectorAll("[data-playback-example]"));

sampleIndexInput.max = String(PREVIEW_SAMPLES - 1);

let playingSource = null;
let playingAudio = null;
let playingAudioUrl = null;
let liveAudioContext = null;
let liveOscillator = null;
let liveGain = null;
let liveStartTime = 0;
let animationFrame = null;
let playFrequency = 0;
let playVolume = 0;
let playSampleCount = 0;
let activePlayButton = null;
let languageCycleIndex = 0;
let languageCycleTimer = null;

function sampleAt(index, frequency, volume) {
  const time = index / SAMPLE_RATE;
  const cyclePosition = (frequency * time) % 1;
  const raw = cyclePosition < 0.5 ? 1 : -1;

  return {
    time,
    raw,
    value: raw * volume,
  };
}

function currentState() {
  return {
    frequency: Number(frequencyInput.value),
    volume: Number(volumeInput.value),
    selectedIndex: Number(sampleIndexInput.value),
  };
}

function drawSpeaker(sample) {
  speakerMotion.style.setProperty("--sample-offset", sample.value.toFixed(4));
  speakerMotion.classList.toggle("is-forward", sample.value > 0);
  speakerMotion.classList.toggle("is-back", sample.value < 0);
  diaphragmReadout.textContent = `diaphragm offset: ${sample.value.toFixed(3)}`;
}

function drawWave(frequency, volume, selectedIndex) {
  const { ctx, width, height } = prepareCanvas(waveCanvas);
  const compact = width < 520;
  const top = compact ? 78 : 72;
  const bottom = height - 42;
  const centerY = (top + bottom) / 2;
  const scaleY = (bottom - top) * 0.42;

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);

  drawGrid(ctx, width, top, bottom, centerY);
  drawLine(ctx, frequency, 1, "#2563eb", width, centerY, scaleY);
  drawLine(ctx, frequency, volume, "#f97316", width, centerY, scaleY);
  drawDots(ctx, frequency, volume, selectedIndex, width, centerY, scaleY);
  drawCursor(ctx, selectedIndex, width, top, bottom);

  ctx.fillStyle = "#202124";
  ctx.font = `${compact ? 12 : 18}px ui-monospace, SFMono-Regular, Consolas, monospace`;
  ctx.fillText(compact ? "playback scans across samples" : "samples tell the diaphragm where to move over time", 18, 28);

  ctx.fillStyle = "#5c6470";
  ctx.font = `${compact ? 11 : 14}px ui-monospace, SFMono-Regular, Consolas, monospace`;
  ctx.fillText("+1 forward", 18, top - 10);
  ctx.fillText("0 center", 18, centerY - 8);
  ctx.fillText("-1 back", 18, bottom + 24);

  if (compact) {
    ctx.fillText("blue raw", 18, 50);
    ctx.fillText("orange volume", 96, 50);
  } else {
    ctx.fillText("blue: raw wave", width - 245, 30);
    ctx.fillText("orange: after volume", width - 245, 52);
  }
}

function drawGrid(ctx, width, top, bottom, centerY) {
  ctx.strokeStyle = "#edf0f5";
  ctx.lineWidth = 1;
  for (let i = 0; i <= 8; i += 1) {
    const x = (i / 8) * width;
    ctx.beginPath();
    ctx.moveTo(x, top);
    ctx.lineTo(x, bottom);
    ctx.stroke();
  }

  ctx.strokeStyle = "#d8dde5";
  ctx.beginPath();
  ctx.moveTo(0, centerY);
  ctx.lineTo(width, centerY);
  ctx.stroke();
}

function drawLine(ctx, frequency, volume, color, width, centerY, scaleY) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.beginPath();

  for (let i = 0; i < PREVIEW_SAMPLES; i += 1) {
    const sample = sampleAt(i, frequency, volume);
    const x = sampleX(i, width);
    const y = centerY - sample.value * scaleY;

    if (i === 0) ctx.moveTo(x, y);
    else {
      const previousSample = sampleAt(i - 1, frequency, volume);
      const previousY = centerY - previousSample.value * scaleY;
      ctx.lineTo(x, previousY);
      ctx.lineTo(x, y);
    }
  }

  ctx.stroke();
}

function drawDots(ctx, frequency, volume, selectedIndex, width, centerY, scaleY) {
  for (let i = 0; i < PREVIEW_SAMPLES; i += 1) {
    const sample = sampleAt(i, frequency, volume);
    const x = sampleX(i, width);
    const y = centerY - sample.value * scaleY;
    const selected = i === selectedIndex;

    ctx.fillStyle = selected ? "#202124" : "#f97316";
    ctx.beginPath();
    ctx.arc(x, y, selected ? 6 : 2.4, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawCursor(ctx, selectedIndex, width, top, bottom) {
  const x = sampleX(selectedIndex, width);

  ctx.strokeStyle = "#202124";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, top - 12);
  ctx.lineTo(x, bottom + 12);
  ctx.stroke();
}

function sampleX(index, width) {
  return (index / (PREVIEW_SAMPLES - 1)) * width;
}

function prepareCanvas(canvas) {
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  const width = Math.round(rect.width);
  const height = Math.round(rect.height);
  const pixelWidth = Math.round(width * dpr);
  const pixelHeight = Math.round(height * dpr);

  if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
    canvas.width = pixelWidth;
    canvas.height = pixelHeight;
  }

  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  return { ctx, width, height };
}

function render() {
  const { frequency, volume, selectedIndex } = currentState();
  const selected = sampleAt(selectedIndex, frequency, volume);

  frequencyValue.textContent = `${frequency} Hz`;
  volumeValue.textContent = volume.toFixed(2);
  sampleValue.textContent = `sample ${selectedIndex}: ${selected.value.toFixed(3)}`;

  drawSpeaker(selected);
  drawWave(frequency, volume, selectedIndex);
}

async function playTone() {
  stopPlayback({ redraw: false });

  const { frequency, volume } = currentState();
  await startLiveTone(frequency, volume);
}

async function playCodeExample() {
  stopPlayback({ redraw: false });

  frequencyInput.value = "220";
  volumeInput.value = "0.4";
  sampleIndexInput.value = "0";

  await startSamplePlayback({
    frequency: 220,
    volume: 0.4,
    seconds: 1,
    button: playCodeButton,
  });
}

async function startLiveTone(frequency, volume) {
  activePlayButton = playButton;

  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    liveAudioContext = new AudioContextClass();
    liveOscillator = liveAudioContext.createOscillator();
    liveGain = liveAudioContext.createGain();

    liveOscillator.type = "square";
    liveOscillator.frequency.value = frequency;
    liveGain.gain.value = volume * AUDIO_OUTPUT_GAIN;
    liveOscillator.connect(liveGain);
    liveGain.connect(liveAudioContext.destination);

    await liveAudioContext.resume();
    liveStartTime = liveAudioContext.currentTime;
    liveOscillator.start();

    playingSource = liveOscillator;
    playFrequency = frequency;
    playVolume = volume;
    playSampleCount = Infinity;
    playButton.textContent = "Stop";
    speakerMotion.classList.add("is-playing");
    animatePlayback();
  } catch (error) {
    console.error("Could not start audio:", error);
  }
}

function updateLiveTone() {
  if (!liveAudioContext || !liveOscillator || !liveGain) return;

  const { frequency, volume } = currentState();
  const now = liveAudioContext.currentTime;

  liveOscillator.frequency.setTargetAtTime(frequency, now, 0.01);
  liveGain.gain.setTargetAtTime(volume * AUDIO_OUTPUT_GAIN, now, 0.01);
  playFrequency = frequency;
  playVolume = volume;
}

async function startSamplePlayback({ frequency, volume, seconds, button }) {
  activePlayButton = button;

  try {
    const samples = buildSamples(frequency, volume * AUDIO_OUTPUT_GAIN, seconds);
    playingAudioUrl = samplesToWavUrl(samples);
    playingAudio = new Audio(playingAudioUrl);
    playingAudio.onended = stopPlayback;
    await playingAudio.play();

    playingSource = playingAudio;
    playFrequency = frequency;
    playVolume = volume;
    playSampleCount = samples.length;
    button.textContent = "Stop";
    speakerMotion.classList.add("is-playing");
    animatePlayback();
  } catch (error) {
    console.error("Could not start audio:", error);
  }
}

function animatePlayback() {
  if (!playingSource) return;

  const elapsed = playingAudio
    ? playingAudio.currentTime
    : liveAudioContext.currentTime - liveStartTime;
  const absoluteSample = Math.floor(elapsed * SAMPLE_RATE);
  const previewIndex = absoluteSample % PREVIEW_SAMPLES;

  if (Number.isFinite(playSampleCount) && absoluteSample >= playSampleCount) {
    stopPlayback();
    return;
  }

  if (activePlayButton === playButton) {
    const { frequency, volume } = currentState();
    playFrequency = frequency;
    playVolume = volume;
  }

  sampleIndexInput.value = String(previewIndex);
  frequencyValue.textContent = `${playFrequency} Hz`;
  volumeValue.textContent = playVolume.toFixed(2);
  sampleValue.textContent = `sample ${previewIndex}: ${sampleAt(absoluteSample, playFrequency, playVolume).value.toFixed(3)}`;

  drawSpeaker(sampleAt(absoluteSample, playFrequency, playVolume));
  drawWave(playFrequency, playVolume, previewIndex);

  animationFrame = requestAnimationFrame(animatePlayback);
}

function buildSamples(frequency, volume, seconds) {
  const sampleCount = Math.floor(SAMPLE_RATE * seconds);
  const samples = new Float32Array(sampleCount);

  for (let i = 0; i < samples.length; i += 1) {
    const fade = Math.min(1, i / 400, (samples.length - i) / 400);
    samples[i] = sampleAt(i, frequency, volume).value * fade;
  }

  return samples;
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
  view.setUint32(24, SAMPLE_RATE, true);
  view.setUint32(28, SAMPLE_RATE * bytesPerSample, true);
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

function stopPlayback(options = {}) {
  const { redraw = true } = options;

  if (animationFrame !== null) {
    cancelAnimationFrame(animationFrame);
    animationFrame = null;
  }

  if (playingSource) {
    const source = playingSource;
    playingSource = null;
    if (playingAudio) {
      playingAudio.onended = null;
      playingAudio.pause();
      playingAudio.currentTime = 0;
      playingAudio = null;
    } else if (source.stop) {
      try {
        source.stop();
      } catch {
        // It may already have ended naturally.
      }
    }
  }

  if (liveAudioContext) {
    liveAudioContext.close();
    liveAudioContext = null;
    liveOscillator = null;
    liveGain = null;
    liveStartTime = 0;
  }

  if (playingAudioUrl) {
    URL.revokeObjectURL(playingAudioUrl);
    playingAudioUrl = null;
  }

  playButton.textContent = "Play Tone";
  playCodeButton.textContent = "Play This Code";
  speakerMotion.classList.remove("is-playing");
  activePlayButton = null;
  if (redraw) render();
}

function handleControlInput() {
  if (playingSource && activePlayButton === playButton) updateLiveTone();
  else if (playingSource) stopPlayback();
  render();
}

function updatePlaybackExample() {
  if (playbackExamples.length === 0) return;

  const activeExample = playbackExamples[languageCycleIndex % playbackExamples.length];

  for (const example of playbackExamples) {
    example.classList.toggle("is-visible", example === activeExample);
  }

  if (languageCycleLabel) languageCycleLabel.textContent = formatLanguageName(activeExample.dataset.playbackExample);
}

function formatLanguageName(name) {
  const labels = {
    cpp: "C++",
    csharp: "C#",
    javascript: "JavaScript",
    typescript: "TypeScript",
  };

  return labels[name] || name.charAt(0).toUpperCase() + name.slice(1);
}

function startLanguageCycle() {
  if (playbackExamples.length === 0 || languageCycleTimer) return;

  languageCycleTimer = window.setInterval(() => {
    languageCycleIndex = (languageCycleIndex + 1) % playbackExamples.length;
    updatePlaybackExample();
  }, 500);

  if (languageCycleButton) languageCycleButton.textContent = "woah there motherfucker";
}

function stopLanguageCycle() {
  if (!languageCycleTimer) return;

  window.clearInterval(languageCycleTimer);
  languageCycleTimer = null;
  if (languageCycleButton) languageCycleButton.textContent = "spin me right round";
}

function toggleLanguageCycle() {
  if (languageCycleTimer) stopLanguageCycle();
  else startLanguageCycle();
}

frequencyInput.addEventListener("input", handleControlInput);
volumeInput.addEventListener("input", handleControlInput);
sampleIndexInput.addEventListener("input", handleControlInput);
if (languageCycleButton) languageCycleButton.addEventListener("click", toggleLanguageCycle);
playButton.addEventListener("click", () => {
  if (playingSource) stopPlayback();
  else playTone();
});
playCodeButton.addEventListener("click", () => {
  if (playingSource && activePlayButton === playCodeButton) stopPlayback();
  else playCodeExample();
});
window.addEventListener("resize", render);

render();
updatePlaybackExample();
startLanguageCycle();
