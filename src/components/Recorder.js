import * as lamejs from '@breezystack/lamejs';
import { saveAs } from 'file-saver';

/**
 * Handles recording the audio output and encoding it to MP3.
 */
export class Recorder {
  constructor(audioContext, sourceNode) {
    this.audioContext = audioContext;
    this.sourceNode = sourceNode;

    this.isRecording = false;
    this.scriptProcessor = null;
    this.mp3Encoder = null;
    this.mp3Data = [];

    // LAMEjs configuration
    this.sampleRate = this.audioContext.sampleRate;
    this.channels = 2; // Stereo
    this.bitRate = 128; // 128 kbps
  }

  /**
   * Starts the recording process.
   */
  start() {
    if (this.isRecording) return;

    console.log('Recording started...');
    this.isRecording = true;
    this.mp3Data = [];

    // Initialize the MP3 encoder
    this.mp3Encoder = new lamejs.Mp3Encoder(this.channels, this.sampleRate, this.bitRate);

    // Create a ScriptProcessorNode to capture raw audio data
    // Buffer size of 4096 is a good balance between performance and latency
    this.scriptProcessor = this.audioContext.createScriptProcessor(4096, this.channels, this.channels);

    // Connect the source to the processor
    this.sourceNode.connect(this.scriptProcessor);
    // This is necessary for the processor to receive audio
    this.scriptProcessor.connect(this.audioContext.destination);

    // The onaudioprocess event is the core of the recording logic
    this.scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
      if (!this.isRecording) return;

      const inputBuffer = audioProcessingEvent.inputBuffer;
      const leftChannelFloat = inputBuffer.getChannelData(0);
      const rightChannelFloat = inputBuffer.numberOfChannels > 1 ? inputBuffer.getChannelData(1) : leftChannelFloat;

      const leftChannelInt = new Int16Array(leftChannelFloat.length);
      const rightChannelInt = new Int16Array(rightChannelFloat.length);

      for (let i = 0; i < leftChannelFloat.length; i++) {
        leftChannelInt[i] = Math.max(-1, Math.min(1, leftChannelFloat[i])) * 32767;
        rightChannelInt[i] = Math.max(-1, Math.min(1, rightChannelFloat[i])) * 32767;
      }

      const mp3buf = this.mp3Encoder.encodeBuffer(leftChannelInt, rightChannelInt);
      if (mp3buf.length > 0) {
        this.mp3Data.push(mp3buf);
      }
    };
  }

  /**
   * Stops the recording process.
   */
  stop() {
    if (!this.isRecording) return;

    console.log('Recording stopped.');
    this.isRecording = false;

    // Disconnect the processor to stop the onaudioprocess event
    this.sourceNode.disconnect(this.scriptProcessor);
    this.scriptProcessor.disconnect(this.audioContext.destination);
    this.scriptProcessor.onaudioprocess = null;

    // Finalize the MP3
    const finalMp3buf = this.mp3Encoder.flush();
    if (finalMp3buf.length > 0) {
      this.mp3Data.push(finalMp3buf);
    }
  }

  /**
   * Triggers a download of the recorded MP3 file.
   * @param {string} filename - The desired name for the file.
   */
  download(filename = 'mixtape.mp3') {
    if (this.mp3Data.length === 0) {
      console.warn('No recording data to download.');
      return;
    }

    console.log('Preparing MP3 for download...');
    const blob = new Blob(this.mp3Data, { type: 'audio/mp3' });
    saveAs(blob, filename);
  }
}