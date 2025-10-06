export class Sampler {
  constructor(container, audioEngine) {
    this.container = container;
    this.audioEngine = audioEngine;
    this.pads = this.container.querySelectorAll('.sampler-pad');
    this.samples = new Array(this.pads.length).fill(null);
    this.hoverTimeout = null;

    this.init();
  }

  init() {
    this.pads.forEach(pad => {
      pad.addEventListener('click', this.onPadClick.bind(this));
      pad.addEventListener('mouseenter', this.onPadMouseEnter.bind(this));
      pad.addEventListener('mouseleave', this.onPadMouseLeave.bind(this));
      
      const trashIcon = pad.querySelector('.trash-icon');
      trashIcon.addEventListener('click', this.onTrashClick.bind(this));
    });
  }

  onPadClick(event) {
    const pad = event.currentTarget;
    const id = parseInt(pad.dataset.id, 10);

    if (this.samples[id]) {
      this.audioEngine.playSample(this.samples[id]);
    } else {
      this.loadSample(id);
    }
  }

  onPadMouseEnter(event) {
    const pad = event.currentTarget;
    const id = parseInt(pad.dataset.id, 10);

    if (this.samples[id]) {
      this.hoverTimeout = setTimeout(() => {
        pad.classList.add('delete-active');
      }, 2000);
    }
  }

  onPadMouseLeave(event) {
    clearTimeout(this.hoverTimeout);
    event.currentTarget.classList.remove('delete-active');
  }

  onTrashClick(event) {
    event.stopPropagation();
    const pad = event.currentTarget.closest('.sampler-pad');
    const id = parseInt(pad.dataset.id, 10);
    
    this.deleteSample(id);
  }

  async loadSample(id) {
    try {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'audio/*';
      input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const arrayBuffer = await file.arrayBuffer();
        const audioBuffer = await this.audioEngine.audioContext.decodeAudioData(arrayBuffer);
        
        if (audioBuffer.duration > 10) {
          alert("Sample is too long! Please select a file that is 10 seconds or shorter.");
          return;
        }

        this.samples[id] = audioBuffer;
        this.pads[id].classList.add('loaded');
      };
      input.click();
    } catch (err) {
      console.error("Error loading sample:", err);
    }
  }

  deleteSample(id) {
    this.samples[id] = null;
    const pad = this.pads[id];
    pad.classList.remove('loaded');
    pad.classList.remove('delete-active');
  }
}
