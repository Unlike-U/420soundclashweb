/**
 * Checks if the user is on a mobile device based on the user agent string.
 * @returns {boolean} True if a mobile device is detected, false otherwise.
 */
export const isMobile = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

/**
 * Checks for the presence of headphones or any audio output device
 * that is not the built-in speakers.
 * @returns {Promise<boolean>} True if headphones are detected, false otherwise.
 */
export const hasHeadphones = async () => {
  if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
    console.warn("enumerateDevices() not supported.");
    return false; // Assume no headphones if API is not supported
  }

  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const audioOutputDevices = devices.filter(device => device.kind === 'audiooutput');
    
    // A more reliable check for headphones is to see if there is more than one audio output device.
    // The default is usually 'speaker', so any additional device is likely headphones.
    // We also check for specific labels, but this is less reliable.
    const hasDedicatedHeadphone = audioOutputDevices.some(device => 
      device.label.toLowerCase().includes('headphone') || 
      device.label.toLowerCase().includes('casque') ||
      device.deviceId !== 'default' && device.deviceId !== 'communications'
    );
    
    return audioOutputDevices.length > 1 || hasDedicatedHeadphone;
  } catch (err) {
    console.error("Error enumerating devices:", err);
    return false;
  }
};
