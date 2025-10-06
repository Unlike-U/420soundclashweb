import { ui } from './setup/ui.js';
import { setupEventListeners } from './setup/events.js';
import './styles/main.scss';
import { AudioEngine } from './components/AudioEngine.js';
import { FileLoader } from './components/FileLoader.js';
import { Tracklist } from './components/Tracklist.js';
import { Recorder } from './components/Recorder.js';
import { SkinLoader } from './utils/skinLoader.js';
import { RotaryKnob } from './utils/rotaryKnob.js';
import { Sampler } from './components/Sampler.js';
import { hasHeadphones, isMobile } from './utils/deviceUtils.js';
import { getRandomArt } from './utils/asciiArt.js';
import { AsciiAnimator } from './utils/asciiAnimator.js';
import { DonationModal } from './components/DonationModal.js';

document.addEventListener('DOMContentLoaded', () => {
  console.log("Application starting...");
  const audioEngine = new AudioEngine();
  const recorder = new Recorder(audioEngine.audioContext, audioEngine.getRecordingDestination());
  const donationModal = new DonationModal();

  if (isMobile()) {
    document.querySelector('.mixer-container').classList.add('mobile-layout');
  }


  const state = {
    channelA: {
      files: [],
      selectedTrack: { file: null, index: -1, duration: 0 },
    },
    channelB: {
      files: [],
      selectedTrack: { file: null, index: -1, duration: 0 },
    },
    cueA: false,
    cueB: false,
  };

  // --- Header Art ---
  ui.headerArt.textContent = getRandomArt();
  const animator = new AsciiAnimator(ui.headerArt);
  animator.start();

  // --- Skin Toggler Setup ---
  new SkinLoader(ui.skinToggler);

  // --- Utility Functions ---
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  // --- Setup ---
  setupEventListeners(audioEngine, recorder, state, formatTime, donationModal);

  // --- Master Effects Knobs & Sampler ---
  new RotaryKnob(ui.fxChorus, { min: 0, max: 100, defaultValue: 0, onChange: (v) => audioEngine.setChorus(v) });
  new RotaryKnob(ui.fxReverb, { min: 0, max: 100, defaultValue: 0, onChange: (v) => audioEngine.setReverb(v) });
  new RotaryKnob(ui.fxDelay, { min: 0, max: 100, defaultValue: 0, onChange: (v) => audioEngine.setDelay(v) });
  new Sampler(ui.samplerPads, audioEngine);

  // --- Channel A Setup ---
  const tracklistA = new Tracklist(ui.channelA.tracklist, (file, index) => { state.channelA.selectedTrack = { file, index, duration: 0 }; });
  new FileLoader(ui.channelA.selectDirectory, ui.channelA.selectedPath, (files) => { state.channelA.files = files; tracklistA.render(files); });
  const eqLowKnobA = new RotaryKnob(ui.channelA.eqLow, { min: 0, max: 255, defaultValue: 127 });
  const eqMidKnobA = new RotaryKnob(ui.channelA.eqMid, { min: 0, max: 255, defaultValue: 127 });
  const eqHighKnobA = new RotaryKnob(ui.channelA.eqHigh, { min: 0, max: 255, defaultValue: 127 });
  eqLowKnobA.onChange = (v) => audioEngine.setChannelEQ('a', v, eqMidKnobA.getNormalizedValue(), eqHighKnobA.getNormalizedValue());
  eqMidKnobA.onChange = (v) => audioEngine.setChannelEQ('a', eqLowKnobA.getNormalizedValue(), v, eqHighKnobA.getNormalizedValue());
  eqHighKnobA.onChange = (v) => audioEngine.setChannelEQ('a', eqLowKnobA.getNormalizedValue(), eqMidKnobA.getNormalizedValue(), v);

  // --- Channel B Setup ---
  const tracklistB = new Tracklist(ui.channelB.tracklist, (file, index) => { state.channelB.selectedTrack = { file, index, duration: 0 }; });
  new FileLoader(ui.channelB.selectDirectory, ui.channelB.selectedPath, (files) => { state.channelB.files = files; tracklistB.render(files); });
  const eqLowKnobB = new RotaryKnob(ui.channelB.eqLow, { min: 0, max: 255, defaultValue: 127 });
  const eqMidKnobB = new RotaryKnob(ui.channelB.eqMid, { min: 0, max: 255, defaultValue: 127 });
  const eqHighKnobB = new RotaryKnob(ui.channelB.eqHigh, { min: 0, max: 255, defaultValue: 127 });
  eqLowKnobB.onChange = (v) => audioEngine.setChannelEQ('b', v, eqMidKnobB.getNormalizedValue(), eqHighKnobB.getNormalizedValue());
  eqMidKnobB.onChange = (v) => audioEngine.setChannelEQ('b', eqLowKnobB.getNormalizedValue(), v, eqHighKnobB.getNormalizedValue());
  eqHighKnobB.onChange = (v) => audioEngine.setChannelEQ('b', eqLowKnobB.getNormalizedValue(), eqMidKnobB.getNormalizedValue(), v);

  // --- Headphone Cue Logic ---
  const updateCueButtonsState = async () => {
    const headphonesConnected = await hasHeadphones();
    ui.channelA.cueBtn.disabled = !headphonesConnected;
    ui.channelB.cueBtn.disabled = !headphonesConnected;
    const title = headphonesConnected ? 'Cue' : 'Connect headphones to enable cue';
    ui.channelA.cueBtn.title = title;
    ui.channelB.cueBtn.title = title;

    if (!headphonesConnected && (state.cueA || state.cueB)) {
      state.cueA = false;
      state.cueB = false;
      ui.channelA.cueBtn.classList.remove('active');
      ui.channelB.cueBtn.classList.remove('active');
      handleCueChange();
    }
  };

  if (navigator.mediaDevices) {
    navigator.mediaDevices.addEventListener('devicechange', updateCueButtonsState);
  }
  updateCueButtonsState();

  // --- UI Update & Visualizer Loops ---
  function updateUI() {
    const timeA = audioEngine.getPlaybackTime('a');
    ui.channelA.timeCurrent.textContent = formatTime(timeA.currentTime);
    ui.channelA.timeRemaining.textContent = `-${formatTime(timeA.remainingTime)}`;
    if (timeA.duration > 0) ui.channelA.timeSlider.value = (timeA.currentTime / timeA.duration) * 100;
    const timeB = audioEngine.getPlaybackTime('b');
    ui.channelB.timeCurrent.textContent = formatTime(timeB.currentTime);
    ui.channelB.timeRemaining.textContent = `-${formatTime(timeB.remainingTime)}`;
    if (timeB.duration > 0) ui.channelB.timeSlider.value = (timeB.currentTime / timeB.duration) * 100;
    requestAnimationFrame(updateUI);
  }
  const canvasCtx = ui.visualizer.getContext('2d');
  const bufferLength = audioEngine.analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);
  function draw() {
    requestAnimationFrame(draw);
    audioEngine.analyser.getByteFrequencyData(dataArray);
    canvasCtx.fillStyle = getComputedStyle(document.body).getPropertyValue('--primary-color') || '#282c34';
    canvasCtx.fillRect(0, 0, ui.visualizer.width, ui.visualizer.height);
    const barWidth = (ui.visualizer.width / bufferLength) * 2.5;
    let x = 0;
    for (let i = 0; i < bufferLength; i++) {
      const barHeight = dataArray[i] / 2;
      canvasCtx.fillStyle = getComputedStyle(document.body).getPropertyValue('--accent-color') || '#61dafb';
      canvasCtx.fillRect(x, ui.visualizer.height - barHeight, barWidth, barHeight);
      x += barWidth + 1;
    }
  }
  updateUI();
  draw();
  console.log('UI Initialized. Click anywhere on the mixer to enable audio.');
});
