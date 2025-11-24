export const getDeviceFingerprint = () => {
  // Retrieve or generate a persistent Device ID
  let deviceId = localStorage.getItem('device_id');
  if (!deviceId) {
    deviceId = crypto.randomUUID();
    localStorage.setItem('device_id', deviceId);
  }

  return {
    deviceId,
    platform: navigator.platform || 'unknown',
    osVersion: navigator.userAgent || 'unknown',
    appVersion: navigator.appVersion || 'unknown',
    screenResolution: typeof window !== 'undefined' ? `${window.screen.width}x${window.screen.height}` : 'unknown',
    language: navigator.language || 'en-US',
    referralSource: document.referrer || 'direct',
  };
};