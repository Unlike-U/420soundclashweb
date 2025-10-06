export class DonationModal {
  constructor() {
    this.modal = null;
    this.onDownload = null;
    this.createModal();
  }

  createModal() {
    const modalHTML = `
      <div id="donation-modal" class="modal" style="display: none;">
        <div class="modal-content">
          <span class="close-btn">&times;</span>
          <h2>Glad you are enjoying the 420% Sounbender</h2>
          <p>In order to download your artwork you must support its development and my cannabis & green tea addiction . Always keep it 420% !</p>
          <div class="donation-options">
            <a href="https://paypal.me/stereoiii6" target="_blank" class="donation-btn paypal">PayPal</a>
            <div class="crypto-donations">
              <p><strong>Crypto:</strong></p>
              <p>BTC<br/> <code>1JqQeeUP6mkGfcBhzu9BdoiF467fqPP94Y</code></p>
              <p>ETH/POL/AVAX/BASE<br/> <code>0x8b8f021721ddfad63e1821480669ca84c67720b3</code></p>
              <p>XMR<br/> <code>4Ae8TH2JmWFU2nTQK16FEqT4if84xAKxn5BiGqoJa8ELW4FExEgVVQyamqzTsxfgRab3s4vM5d5aZfLkdyupwubTTG7NZu5</code></p>
              <p>TON<br/> <code>UQB7PGENGRJZHosZ5B36_GikGl11BIV80rQmi4DAlFEMJmLL</code></p>
              <p>Every donation will be rewarded all you gotta do is share your proof of donation in our with our <a href=#>telegram bot</a></p> 
           </div>
          </div>
          <button id="download-now-btn" class="download-now-btn">Download Now</button>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    this.modal = document.getElementById('donation-modal');
    this.modal.querySelector('.close-btn').addEventListener('click', () => this.hide());
    this.modal.querySelector('#download-now-btn').addEventListener('click', () => {
      if (this.onDownload) {
        this.onDownload();
      }
      this.hide();
    });
  }

  show(onDownload) {
    this.onDownload = onDownload;
    this.modal.style.display = 'block';
  }

  hide() {
    this.modal.style.display = 'none';
  }
}
