export class AsciiAnimator {
  constructor(element) {
    this.element = element;
    this.originalText = element.textContent;
    this.characters = '!<>-_\\/[]{}—=+*|?#';
    this.animationInterval = null;
  }

  start(scrambleRate = 0.05, interval = 100) {
    if (this.animationInterval) {
      this.stop();
    }

    this.animationInterval = setInterval(() => {
      let newText = '';
      for (let i = 0; i < this.originalText.length; i++) {
        const originalChar = this.originalText[i];
        // Don't scramble whitespace
        if (originalChar.trim() === '') {
          newText += originalChar;
          continue;
        }

        if (Math.random() < scrambleRate) {
          const randomChar = this.characters.charAt(Math.floor(Math.random() * this.characters.length));
          newText += randomChar;
        } else {
          newText += originalChar;
        }
      }
      this.element.textContent = newText;
    }, interval);
  }

  stop() {
    clearInterval(this.animationInterval);
    this.element.textContent = this.originalText; // Restore original text
  }
}
