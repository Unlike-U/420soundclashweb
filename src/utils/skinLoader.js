export class SkinLoader {
  constructor(containerElement) {
    this.container = containerElement;
    this.toggleBtn = this.container.querySelector('#skin-toggle-btn');
    this.buttonsContainer = this.container.querySelector('.skin-buttons-container');
    this.skinButtons = this.container.querySelectorAll('.skin-btn');
    this.init();
  }

  init() {
    // Handle clicking the main palette icon
    this.toggleBtn.addEventListener('click', () => {
      this.buttonsContainer.classList.toggle('visible');
    });

    // Handle clicking an individual skin button
    this.skinButtons.forEach(button => {
      button.addEventListener('click', () => {
        const skinName = button.dataset.skin;
        this.setSkin(skinName);
        this.buttonsContainer.classList.remove('visible'); // Hide menu after selection
      });
    });

    // Set initial skin
    this.setSkin('light');
  }

  setSkin(skinName) {
    document.body.className = '';
    document.body.classList.add(`skin-${skinName}`);

    // Update active button state
    this.skinButtons.forEach(button => {
      button.classList.toggle('active', button.dataset.skin === skinName);
    });
  }
}
