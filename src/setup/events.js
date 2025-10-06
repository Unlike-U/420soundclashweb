import { ui } from './ui.js';

export function setupEventListeners(audioEngine, recorder, state, formatTime, donationModal) {
  ui.appContainer.addEventListener('click', () => {
    if (audioEngine.audioContext.state === 'suspended') {
      audioEngine.audioContext.resume();
    }
  }, { once: true });

  ui.recordBtn.addEventListener('click', () => {
    recorder.start();
    ui.recordBtn.classList.add('active');
    ui.recordBtn.disabled = true;
    ui.stopRecordBtn.disabled = false;
    ui.downloadBtn.disabled = true;
  });

  ui.stopRecordBtn.addEventListener('click', () => {
    recorder.stop();
    ui.recordBtn.classList.remove('active');
    ui.recordBtn.disabled = false;
    ui.stopRecordBtn.disabled = true;
    ui.downloadBtn.disabled = false;
  });

  ui.downloadBtn.addEventListener('click', () => {
    donationModal.show(() => {
      recorder.download(`MyMixtape_${new Date().toISOString()}.mp3`);
    });
  });

  ui.masterVolume.addEventListener('input', (e) => {
    audioEngine.setMasterVolume(e.target.value);
  });

  ui.headphoneVolume.addEventListener('input', (e) => {
    audioEngine.setHeadphoneVolume(e.target.value);
  });

  ui.crossfader.addEventListener('input', (e) => {
    audioEngine.setCrossfader(e.target.value);
  });

  ui.channelA.playBtn.addEventListener('click', async () => {
    if (state.channelA.selectedTrack.file) {
      try {
        const { duration, bpm } = await audioEngine.loadTrack('a', state.channelA.selectedTrack.file);
        state.channelA.selectedTrack.duration = duration;
        state.channelA.selectedTrack.bpm = bpm;
        if (bpm) {
          ui.channelA.tempoLabel.textContent = `Tempo: ${bpm} BPM`;
        } else {
          ui.channelA.tempoLabel.textContent = 'Tempo';
        }
        audioEngine.playTrack('a', state.channelA.selectedTrack.index);
      } catch (error) {
        console.error('Error playing track A:', error);
        ui.channelA.tempoLabel.textContent = 'Tempo';
      }
    }
  });

  ui.channelA.stopBtn.addEventListener('click', () => {
    audioEngine.stopTrack('a');
    ui.channelA.timeCurrent.textContent = '0:00';
    ui.channelA.timeRemaining.textContent = `-${formatTime(state.channelA.selectedTrack.duration)}`;
    ui.channelA.timeSlider.value = 0;
  });

  ui.channelA.volumeSlider.addEventListener('input', (e) => {
    audioEngine.setChannelVolume('a', e.target.value);
  });

  ui.channelA.tempoSlider.addEventListener('input', (e) => {
    audioEngine.setTempo('a', e.target.value);
    if (state.channelA.selectedTrack.bpm) {
      const newBpm = Math.round(state.channelA.selectedTrack.bpm * (e.target.value / 100));
      ui.channelA.tempoLabel.textContent = `Tempo: ${newBpm} BPM`;
    }
  });

  ui.channelA.timeSlider.addEventListener('input', (e) => {
    audioEngine.seekTrack('a', e.target.value);
  });

  ui.channelB.playBtn.addEventListener('click', async () => {
    if (state.channelB.selectedTrack.file) {
      try {
        const { duration, bpm } = await audioEngine.loadTrack('b', state.channelB.selectedTrack.file);
        state.channelB.selectedTrack.duration = duration;
        state.channelB.selectedTrack.bpm = bpm;
        if (bpm) {
          ui.channelB.tempoLabel.textContent = `Tempo: ${bpm} BPM`;
        } else {
          ui.channelB.tempoLabel.textContent = 'Tempo';
        }
        audioEngine.playTrack('b', state.channelB.selectedTrack.index);
      } catch (error) {
        console.error('Error playing track B:', error);
        ui.channelB.tempoLabel.textContent = 'Tempo';
      }
    }
  });

  ui.channelB.stopBtn.addEventListener('click', () => {
    audioEngine.stopTrack('b');
    ui.channelB.timeCurrent.textContent = '0:00';
    ui.channelB.timeRemaining.textContent = `-${formatTime(state.channelB.selectedTrack.duration)}`;
    ui.channelB.timeSlider.value = 0;
  });

  ui.channelB.volumeSlider.addEventListener('input', (e) => {
    audioEngine.setChannelVolume('b', e.target.value);
  });

  ui.channelB.tempoSlider.addEventListener('input', (e) => {
    audioEngine.setTempo('b', e.target.value);
    if (state.channelB.selectedTrack.bpm) {
      const newBpm = Math.round(state.channelB.selectedTrack.bpm * (e.target.value / 100));
      ui.channelB.tempoLabel.textContent = `Tempo: ${newBpm} BPM`;
    }
  });

  ui.channelB.timeSlider.addEventListener('input', (e) => {
    audioEngine.seekTrack('b', e.target.value);
  });

  function handleCueChange() {
    audioEngine.setCueState('a', state.cueA);
    audioEngine.setCueState('b', state.cueB);
    audioEngine.setMasterCue(!state.cueA && !state.cueB);
  }

  ui.channelA.cueBtn.addEventListener('click', () => {
    if (!ui.channelA.cueBtn.disabled) {
      state.cueA = !state.cueA;
      ui.channelA.cueBtn.classList.toggle('active', state.cueA);
      handleCueChange();
    }
  });

  ui.channelB.cueBtn.addEventListener('click', () => {
    if (!ui.channelB.cueBtn.disabled) {
      state.cueB = !state.cueB;
      ui.channelB.cueBtn.classList.toggle('active', state.cueB);
      handleCueChange();
    }
  });
}
