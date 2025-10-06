export class RotaryKnob {
  constructor(element, options = {}) {
    this.element = element;
    this.knob = element.querySelector('.knob');
    this.onChange = options.onChange || (() => {});

    // Configuration
    this.min = options.min !== undefined ? options.min : 0;
    this.max = options.max !== undefined ? options.max : 100;
    this.defaultValue = options.defaultValue !== undefined ? options.defaultValue : (this.min + this.max) / 2;
    this.minAngle = -135;
    this.maxAngle = 135;

    // State
    this.value = this.defaultValue;
    this.isDragging = false;
    this.startY = 0;
    this.startValue = 0;

    // Create and append the value display
    this.valueDisplay = document.createElement('span');
    this.valueDisplay.className = 'knob-value';
    this.knob.appendChild(this.valueDisplay);

    // Bind events
    this.element.addEventListener('mousedown', this.onMouseDown.bind(this));
    document.addEventListener('mousemove', this.onMouseMove.bind(this));
    document.addEventListener('mouseup', this.onMouseUp.bind(this));

    // Set initial state
    this.setValue(this.defaultValue);
  }

  onMouseDown(event) {
    event.preventDefault();
    this.isDragging = true;
    this.startY = event.clientY;
    this.startValue = this.value;
    document.body.style.cursor = 'ns-resize';
  }

  onMouseMove(event) {
    if (!this.isDragging) return;
    const deltaY = this.startY - event.clientY;
    const sensitivity = (this.max - this.min) / 150; // Adjust sensitivity
    const newValue = this.startValue + deltaY * sensitivity;
    this.setValue(newValue);
  }

  onMouseUp() {
    this.isDragging = false;
    document.body.style.cursor = 'default';
  }

  setValue(value) {
    // Clamp value to min/max
    this.value = Math.max(this.min, Math.min(this.max, value));

    // Update UI
    this.valueDisplay.textContent = Math.round(this.value);
    const percentage = (this.value - this.min) / (this.max - this.min);
    const angle = this.minAngle + percentage * (this.maxAngle - this.minAngle);
    this.knob.style.transform = `rotate(${angle}deg)`;

    // Notify listener with a normalized 0-100 value for the audio engine
    if (this.onChange) {
      this.onChange(percentage * 100);
    }
  }

  getNormalizedValue() {
    return (this.value - this.min) / (this.max - this.min) * 100;
  }
}