import { analyze } from 'web-audio-beat-detector';

export class AudioEngine {
  constructor() {
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    const createChannel = () => ({
      sources: [],
      gainNode: this.audioContext.createGain(),
      eq: this.createEQ(),
      cueSplitter: this.audioContext.createGain(),
      crossfadeGain: this.audioContext.createGain(),
      track: null,
      playing: false,
      isCued: false,
      currentTrackIndex: -1,
      startTime: 0,
      startOffset: 0,
    });

    this.channelA = createChannel();
    this.channelB = createChannel();
    
    this.masterGain = this.audioContext.createGain();
    this.headphoneGain = this.audioContext.createGain();
    this.masterCueGain = this.audioContext.createGain();
    
    this.effects = {
      delay: this.createDelay(),
      chorus: this.createChorus(),
      reverb: this.createReverb()
    };

    this.dryGain = this.audioContext.createGain();
    this.chorusWetGain = this.audioContext.createGain();
    this.reverbWetGain = this.audioContext.createGain();
    this.delayWetGain = this.audioContext.createGain();
    
    this.recordingNode = this.audioContext.createGain();
    
    this.channelA.gainNode.connect(this.channelA.eq.low);
    this.channelA.eq.high.connect(this.channelA.cueSplitter);
    this.channelB.gainNode.connect(this.channelB.eq.low);
    this.channelB.eq.high.connect(this.channelB.cueSplitter);

    this.channelA.cueSplitter.connect(this.channelA.crossfadeGain);
    this.channelB.cueSplitter.connect(this.channelB.crossfadeGain);

    this.channelA.crossfadeGain.connect(this.dryGain);
    this.channelB.crossfadeGain.connect(this.dryGain);
    this.channelA.crossfadeGain.connect(this.effects.chorus);
    this.channelB.crossfadeGain.connect(this.effects.chorus);
    this.channelA.crossfadeGain.connect(this.effects.reverb);
    this.channelB.crossfadeGain.connect(this.effects.reverb);
    this.channelA.crossfadeGain.connect(this.effects.delay);
    this.channelB.crossfadeGain.connect(this.effects.delay);

    this.dryGain.connect(this.masterGain);
    this.effects.chorus.connect(this.chorusWetGain);
    this.chorusWetGain.connect(this.masterGain);
    this.effects.reverb.connect(this.reverbWetGain);
    this.reverbWetGain.connect(this.masterGain);
    this.effects.delay.connect(this.delayWetGain);
    this.delayWetGain.connect(this.masterGain);
    
    this.masterGain.connect(this.audioContext.destination);
    this.masterGain.connect(this.recordingNode);
    this.masterGain.connect(this.masterCueGain);
    this.masterCueGain.connect(this.headphoneGain);
    this.headphoneGain.connect(this.audioContext.destination);

    this.analyser = this.audioContext.createAnalyser();
    this.masterGain.connect(this.analyser);
    
    this.masterGain.gain.value = 0.8;
    this.headphoneGain.gain.value = 0.8;
    this.setCrossfader(50);
    this.dryGain.gain.value = 1;
    this.chorusWetGain.gain.value = 0;
    this.reverbWetGain.gain.value = 0;
    this.delayWetGain.gain.value = 0;
  }
  
  createEQ() {
    const low = this.audioContext.createBiquadFilter(); low.type = 'lowshelf'; low.frequency.value = 320; low.gain.value = 0;
    const mid = this.audioContext.createBiquadFilter(); mid.type = 'peaking'; mid.frequency.value = 1000; mid.Q.value = 1; mid.gain.value = 0;
    const high = this.audioContext.createBiquadFilter(); high.type = 'highshelf'; high.frequency.value = 3200; high.gain.value = 0;
    low.connect(mid); mid.connect(high);
    return { low, mid, high };
  }
  
  createDelay() { const d = this.audioContext.createDelay(5.0); d.delayTime.value = 0.5; return d; }
  createChorus() { const c = this.audioContext.createDelay(); c.delayTime.value = 0.03; return c; }
  createReverb() {
    const convolver = this.audioContext.createConvolver();
    const sampleRate = this.audioContext.sampleRate;
    const duration = 2;
    const decay = 5;
    const impulse = this.audioContext.createBuffer(2, duration * sampleRate, sampleRate);
    const impulseL = impulse.getChannelData(0);
    const impulseR = impulse.getChannelData(1);

    for (let i = 0; i < impulse.length; i++) {
      impulseL[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / impulse.length, decay);
      impulseR[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / impulse.length, decay);
    }

    convolver.buffer = impulse;
    return convolver;
  }
  
  async analyzeBPM(audioBuffer) {
    try {
      const bpm = await analyze(audioBuffer);
      return Math.round(bpm);
    } catch (err) {
      console.error('BPM analysis failed:', err);
      return null;
    }
  }

  async loadTrack(channel, file) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      const ch = channel === 'a' ? this.channelA : this.channelB;
      ch.track = audioBuffer;
      const bpm = await this.analyzeBPM(audioBuffer);
      return { duration: audioBuffer.duration, bpm };
    } catch (error) {
      console.error('Error loading track:', error);
      return { duration: 0, bpm: null };
    }
  }
  
  playTrack(channel, trackIndex = null, offset = 0) {
    const ch = channel === 'a' ? this.channelA : this.channelB;
    if (trackIndex !== null) ch.currentTrackIndex = trackIndex;
    this.stopTrack(channel);
    if (!ch.track) return false;
    
    const source = this.audioContext.createBufferSource();
    source.buffer = ch.track;
    source.connect(ch.gainNode);
    
    ch.startOffset = offset;
    ch.startTime = this.audioContext.currentTime;
    source.start(0, offset);
    ch.playing = true;
    ch.sources.push(source);
    
    source.onended = () => {
      ch.sources = ch.sources.filter(s => s !== source);
      if (ch.sources.length === 0) {
        ch.playing = false;
        const event = new CustomEvent('track-ended', { detail: { channel, trackIndex: ch.currentTrackIndex } });
        document.dispatchEvent(event);
      }
    };
    return true;
  }
  
  stopTrack(channel) {
    const ch = channel === 'a' ? this.channelA : this.channelB;
    if (ch.sources.length > 0) {
      ch.sources.forEach(source => {
        source.stop();
        source.disconnect();
      });
      ch.sources = [];
      ch.playing = false;
      ch.startOffset = 0;
      ch.startTime = 0;
      return true;
    }
    return false;
  }

  seekTrack(channel, percentage) {
    const ch = channel === 'a' ? this.channelA : this.channelB;
    if (!ch.track) return;
    const offset = ch.track.duration * (percentage / 100);
    this.playTrack(channel, ch.currentTrackIndex, offset);
  }

  getPlaybackTime(channel) {
    const ch = channel === 'a' ? this.channelA : this.channelB;
    if (!ch.track) return { currentTime: 0, duration: 0, remainingTime: 0 };
    const duration = ch.track.duration;
    let currentTime = ch.startOffset;
    if (ch.playing) {
      currentTime = ch.startOffset + (this.audioContext.currentTime - ch.startTime);
    }
    currentTime = Math.min(currentTime, duration);
    const remainingTime = duration - currentTime;
    return { currentTime, duration, remainingTime };
  }
  
  setCrossfader(value) {
    const normalizedValue = value / 100;
    this.channelA.crossfadeGain.gain.value = Math.cos(normalizedValue * 0.5 * Math.PI);
    this.channelB.crossfadeGain.gain.value = Math.cos((1.0 - normalizedValue) * 0.5 * Math.PI);
  }
  
  setTempo(channel, value) {
    const ch = channel === 'a' ? this.channelA : this.channelB;
    ch.sources.forEach(source => {
      source.playbackRate.value = value / 100;
    });
  }
  
  setChannelVolume(channel, value) {
    const ch = channel === 'a' ? this.channelA : this.channelB;
    ch.gainNode.gain.setValueAtTime(value / 100, this.audioContext.currentTime);
  }

  setChannelEQ(channel, low, mid, high) {
    const ch = channel === 'a' ? this.channelA : this.channelB;
    const scale = val => (val - 50) * 0.8;
    ch.eq.low.gain.setValueAtTime(scale(low), this.audioContext.currentTime);
    ch.eq.mid.gain.setValueAtTime(scale(mid), this.audioContext.currentTime);
    ch.eq.high.gain.setValueAtTime(scale(high), this.audioContext.currentTime);
  }

  setMasterVolume(value) { this.masterGain.gain.value = value / 100; }
  setHeadphoneVolume(value) { this.headphoneGain.gain.value = value / 100; }
  
  getRecordingDestination() { return this.recordingNode; }

  playSample(buffer) {
    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(this.masterGain);
    source.start(0);
  }

  setDelay(wetnessValue) { this.delayWetGain.gain.setValueAtTime(wetnessValue / 100, this.audioContext.currentTime); }
  setChorus(wetnessValue) { this.chorusWetGain.gain.setValueAtTime(wetnessValue / 100, this.audioContext.currentTime); }
  setReverb(wetnessValue) { this.reverbWetGain.gain.setValueAtTime(wetnessValue / 100, this.audioContext.currentTime); }

  setCueState(channel, isCued) {
    const ch = channel === 'a' ? this.channelA : this.channelB;
    ch.isCued = isCued;
    try { ch.cueSplitter.disconnect(ch.crossfadeGain); } catch(e) {}
    try { ch.cueSplitter.disconnect(this.headphoneGain); } catch(e) {}
    if (isCued) {
      ch.cueSplitter.connect(this.headphoneGain);
    } else {
      ch.cueSplitter.connect(ch.crossfadeGain);
    }
  }

  setMasterCue(monitorMaster) {
    this.masterCueGain.gain.setValueAtTime(monitorMaster ? 1.0 : 0.0, this.audioContext.currentTime);
  }
}
