// Device Fingerprinting for Web App
// Browser-based device identification
// Based on mobile-app's device fingerprinting but adapted for web

/**
 * Get browser and device information for fingerprinting
 */
export async function getDeviceHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {};

  try {
    // Browser information
    headers['X-User-Agent'] = navigator.userAgent;
    headers['X-Platform'] = 'web';

    // Screen information
    headers['X-Screen-Width'] = window.screen.width.toString();
    headers['X-Screen-Height'] = window.screen.height.toString();
    headers['X-Viewport-Width'] = window.innerWidth.toString();
    headers['X-Viewport-Height'] = window.innerHeight.toString();

    // Browser features
    headers['X-Language'] = navigator.language;
    headers['X-Languages'] = navigator.languages.join(',');
    headers['X-Timezone'] = Intl.DateTimeFormat().resolvedOptions().timeZone;
    headers['X-Cookie-Enabled'] = navigator.cookieEnabled.toString();

    // Hardware information (if available)
    if ('hardwareConcurrency' in navigator) {
      headers['X-CPU-Cores'] = navigator.hardwareConcurrency.toString();
    }

    if ('deviceMemory' in navigator) {
      headers['X-Device-Memory'] = (navigator as any).deviceMemory.toString();
    }

    // Connection information (if available)
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      if (connection) {
        headers['X-Connection-Type'] = connection.effectiveType || 'unknown';
        headers['X-Connection-Downlink'] = connection.downlink?.toString() || 'unknown';
      }
    }

    // WebGL fingerprinting (basic)
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (gl) {
        const renderer = gl.getParameter(gl.RENDERER);
        const vendor = gl.getParameter(gl.VENDOR);
        if (renderer) headers['X-WebGL-Renderer'] = renderer;
        if (vendor) headers['X-WebGL-Vendor'] = vendor;
      }
    } catch (e) {
      // WebGL not available or blocked
    }

    // Session ID (generated per session)
    let sessionId = sessionStorage.getItem('metropolitan_session_id');
    if (!sessionId) {
      sessionId = generateSessionId();
      sessionStorage.setItem('metropolitan_session_id', sessionId);
    }
    headers['X-Session-ID'] = sessionId;

    // Device ID (persistent across sessions)
    let deviceId = localStorage.getItem('metropolitan_device_id');
    if (!deviceId) {
      deviceId = generateDeviceId();
      localStorage.setItem('metropolitan_device_id', deviceId);
    }
    headers['X-Device-ID'] = deviceId;

  } catch (error) {
    console.warn('Failed to generate device headers:', error);
  }

  return headers;
}

/**
 * Generate a unique session ID
 */
function generateSessionId(): string {
  return `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Generate a unique device ID
 */
function generateDeviceId(): string {
  // Use a combination of stable browser features to create a consistent device ID
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  let fingerprint = navigator.userAgent;
  fingerprint += navigator.language;
  fingerprint += screen.width + 'x' + screen.height;
  fingerprint += new Date().getTimezoneOffset();

  if (ctx) {
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillText('Device fingerprint', 2, 2);
    fingerprint += canvas.toDataURL();
  }

  // Simple hash function
  let hash = 0;
  for (let i = 0; i < fingerprint.length; i++) {
    const char = fingerprint.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  return `web_${Math.abs(hash).toString(36)}_${Date.now().toString(36)}`;
}