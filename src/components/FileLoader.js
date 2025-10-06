export class FileLoader {
  constructor(buttonElement, pathElement, onFilesLoaded) {
    this.buttonElement = buttonElement;
    this.pathElement = pathElement;
    this.onFilesLoaded = onFilesLoaded;

    this.buttonElement.addEventListener('click', () => this.openFilePicker());
  }

  openFilePicker() {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = 'audio/*';

    input.addEventListener('change', (event) => {
      const files = event.target.files;
      if (files.length > 0) {
        const fileArray = Array.from(files);
        const fileNames = fileArray.map(file => this.sanitize(file.name)).join(', ');
        this.pathElement.textContent = fileNames;
        this.onFilesLoaded(fileArray);
      }
    });

    input.click();
  }

  sanitize(str) {
    const temp = document.createElement('div');
    temp.textContent = str;
    return temp.innerHTML;
  }
}
