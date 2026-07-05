const SAMPLE_RATE = 44100;
const PREVIEW_SAMPLES = 160;
const PLAY_SECONDS = 2.0;

const frequencyInput = document.querySelector("#frequency");
const volumeInput = document.querySelector("#volume");
const sampleIndexInput = document.querySelector("#sampleIndex");
const frequencyValue = document.querySelector("#frequencyValue");
const volumeValue = document.querySelector("#volumeValue");
const sampleValue = document.querySelector("#sampleValue");
const playButton = document.querySelector("#playButton");
const playStatus = document.querySelector("#playStatus");
const playCodeButton = document.querySelector("#playCodeButton");
const codePlayStatus = document.querySelector("#codePlayStatus");
const speakerCanvas = document.querySelector("#speakerCanvas");
const waveCanvas = document.querySelector("#waveCanvas");

sampleIndexInput.max = String(PREVIEW_SAMPLES - 1);

let playingSource = null;
let playingAudio = null;
let playingAudioUrl = null;
let animationFrame = null;
let playFrequency = 0;
let playVolume = 0;
let playSampleCount = 0;
let activePlayButton = null;
let activePlayStatus = null;

function sampleAt(index, frequency, volume) {
  const time = index / SAMPLE_RATE;
  const raw = Math.sin(2 * Math.PI * frequency * time);

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
  const { ctx, width, height } = prepareCanvas(speakerCanvas);
  const compact = width < 520;
  const centerX = width / 2;
  const centerY = height / 2;
  const travel = Math.min(width * 0.22, compact ? 80 : 130);
  const coneX = centerX + sample.value * travel;
  const backX = compact ? 70 : 120;
  const coneHalfHeight = compact ? 42 : 64;
  const coneTop = centerY - coneHalfHeight * 0.36;
  const coneBottom = centerY + coneHalfHeight * 0.36;

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = "#d8dde5";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(centerX, 58);
  ctx.lineTo(centerX, height - 58);
  ctx.stroke();

  ctx.fillStyle = "#5c6470";
  ctx.font = `${compact ? 12 : 16}px ui-monospace, SFMono-Regular, Consolas, monospace`;
  ctx.fillText("rest position", centerX + 10, compact ? 62 : 70);

  ctx.fillStyle = "#f7f8fb";
  ctx.fillRect(backX - 18, centerY - coneHalfHeight - 16, 18, coneHalfHeight * 2 + 32);
  ctx.strokeStyle = "#202124";
  ctx.lineWidth = compact ? 4 : 6;
  ctx.strokeRect(backX - 18, centerY - coneHalfHeight - 16, 18, coneHalfHeight * 2 + 32);

  ctx.fillStyle = "#f7f8fb";
  ctx.strokeStyle = "#202124";
  ctx.lineWidth = compact ? 5 : 8;
  ctx.beginPath();
  ctx.moveTo(backX, centerY - coneHalfHeight);
  ctx.lineTo(coneX, coneTop);
  ctx.lineTo(coneX, coneBottom);
  ctx.lineTo(backX, centerY + coneHalfHeight);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.strokeStyle = "#202124";
  ctx.lineWidth = compact ? 5 : 7;
  ctx.beginPath();
  ctx.moveTo(coneX, coneTop - 8);
  ctx.lineTo(coneX, coneBottom + 8);
  ctx.stroke();

  ctx.fillStyle = "#f97316";
  ctx.beginPath();
  ctx.arc(coneX, centerY, compact ? 14 : 18, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#f97316";
  ctx.lineWidth = compact ? 3 : 4;
  ctx.beginPath();
  ctx.moveTo(centerX, centerY);
  ctx.lineTo(coneX, centerY);
  ctx.stroke();

  drawArrowHead(ctx, coneX, centerY, coneX >= centerX ? 1 : -1);

  ctx.fillStyle = "#202124";
  ctx.font = `${compact ? 14 : 18}px ui-monospace, SFMono-Regular, Consolas, monospace`;
  ctx.fillText(`speaker offset: ${sample.value.toFixed(3)}`, 24, 34);

  ctx.fillStyle = "#5c6470";
  ctx.font = `${compact ? 11 : 15}px ui-monospace, SFMono-Regular, Consolas, monospace`;
  ctx.fillText("fixed speaker frame", Math.max(18, backX - 32), centerY + coneHalfHeight + 22);
  ctx.fillText("moving cone edge", Math.min(width - 160, coneX + 14), coneTop - 14);
  ctx.fillText("offset from rest", Math.min(width - 160, centerX + 12), centerY - 10);
  ctx.fillText("negative", 24, height - 30);
  ctx.fillText("positive", width - (compact ? 76 : 104), height - 30);
}

function drawArrowHead(ctx, x, y, direction) {
  ctx.fillStyle = "#f97316";
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x - direction * 12, y - 7);
  ctx.lineTo(x - direction * 12, y + 7);
  ctx.closePath();
  ctx.fill();
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
  ctx.fillText(compact ? "playback scans across samples" : "the player scans left to right through these samples", 18, 28);

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
    else ctx.lineTo(x, y);
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
  await startSamplePlayback({
    frequency,
    volume,
    seconds: PLAY_SECONDS,
    button: playButton,
    status: playStatus,
    message: "Playing the same samples the cursor is scanning.",
  });
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
    status: codePlayStatus,
    message: "Playing the one-second waveform from the code above.",
  });
}

async function startSamplePlayback({ frequency, volume, seconds, button, status, message }) {
  activePlayButton = button;
  activePlayStatus = status;
  status.textContent = "Building samples...";

  try {
    const samples = buildSamples(frequency, volume, seconds);
    playingAudioUrl = samplesToWavUrl(samples);
    playingAudio = new Audio(playingAudioUrl);
    playingAudio.onended = stopPlayback;
    await playingAudio.play();

    playingSource = playingAudio;
    playFrequency = frequency;
    playVolume = volume;
    playSampleCount = samples.length;
    button.textContent = "Stop";
    status.textContent = message;
    animatePlayback();
  } catch (error) {
    status.textContent = `Could not start audio: ${error.message}`;
  }
}

function animatePlayback() {
  if (!playingSource) return;

  const elapsed = playingAudio ? playingAudio.currentTime : 0;
  const absoluteSample = Math.floor(elapsed * SAMPLE_RATE);
  const previewIndex = absoluteSample % PREVIEW_SAMPLES;

  if (absoluteSample >= playSampleCount) {
    stopPlayback();
    return;
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

  if (playingAudioUrl) {
    URL.revokeObjectURL(playingAudioUrl);
    playingAudioUrl = null;
  }

  playButton.textContent = "Play Tone";
  playCodeButton.textContent = "Play This Code";
  playStatus.textContent = "";
  codePlayStatus.textContent = "";
  activePlayButton = null;
  activePlayStatus = null;
  if (redraw) render();
}

function handleControlInput() {
  if (playingSource) stopPlayback();
  render();
}

frequencyInput.addEventListener("input", handleControlInput);
volumeInput.addEventListener("input", handleControlInput);
sampleIndexInput.addEventListener("input", handleControlInput);
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
