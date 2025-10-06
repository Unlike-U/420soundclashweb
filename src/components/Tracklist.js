import { Grid, h } from 'gridjs';
import 'gridjs/dist/theme/mermaid.css';

/**
 * Manages the tracklist UI using Grid.js.
 */
export class Tracklist {
  /**
   * @param {HTMLElement} container The element to render the grid into.
   * @param {function(FileHandle)} onTrackSelect Callback when a track is selected.
   */
  constructor(container, onTrackSelect) {
    this.container = container;
    this.onTrackSelect = onTrackSelect;
    this.grid = null;
    this.files = [];
  }

  /**
   * Renders the tracklist with the given files.
   * @param {Array<FileHandle>} files Array of file handles.
   */
  render(files) {
    this.container.innerHTML = '';
    files.forEach((file, index) => {
      const item = document.createElement('li');
      item.className = 'track-item';
      item.innerHTML = `<span class="track-name">${file.name}</span>`;
      item.addEventListener('click', () => this.selectTrack(index, file));
      this.container.appendChild(item);
    });
  }

  selectTrack(index, file) {
    // Remove 'selected' class from all items
    this.container.querySelectorAll('.track-item').forEach(item => {
      item.classList.remove('selected');
    });

    // Add 'selected' class to the clicked item
    const selectedItem = this.container.children[index];
    if (selectedItem) {
      selectedItem.classList.add('selected');
    }

    // Trigger the callback
    this.onTrackSelect(file, index);
  }
}
