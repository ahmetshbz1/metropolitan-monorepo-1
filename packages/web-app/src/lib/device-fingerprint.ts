// Device Fingerprinting for Web App
// Browser-based device identification
// Based on mobile-app's device fingerprinting but adapted for web

import { DEVICE_ID_KEY, isServerGeneratedDeviceId } from './device-id';

/**
 * Get browser and device information for fingerprinting
 */
export async function getDeviceHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {};

  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return headers;
  }

  try {
    // Browser information
    headers['X-Platform'] = 'web';
    headers['X-User-Agent'] = navigator.userAgent;
    const platform = (navigator as any).userAgentData?.platform || navigator.platform;
    if (platform) {
      headers['X-Device-Model'] = platform;
    }
    if (navigator.appVersion) {
      headers['X-App-Version'] = navigator.appVersion;
    }

    // Screen information
    if (window.screen?.width && window.screen?.height) {
      headers['X-Screen-Resolution'] = `${window.screen.width}x${window.screen.height}`;
    }
    headers['X-Viewport-Width'] = window.innerWidth.toString();
    headers['X-Viewport-Height'] = window.innerHeight.toString();

    // Browser features
    headers['X-Language'] = navigator.language;
    if (navigator.languages?.length) {
      headers['X-Languages'] = navigator.languages.join(',');
    }
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (timezone) {
      headers['X-Timezone'] = timezone;
    }
    headers['X-Cookie-Enabled'] = navigator.cookieEnabled.toString();

    // Hardware information (if available)
    if ('hardwareConcurrency' in navigator) {
      headers['X-CPU-Cores'] = navigator.hardwareConcurrency.toString();
    }

    if ('deviceMemory' in navigator) {
      headers['X-Device-Memory'] = (navigator as any).deviceMemory?.toString();
    }

    // Connection information (if available)
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      if (connection) {
        if (connection.effectiveType) {
          headers['X-Connection-Type'] = connection.effectiveType;
        }
        if (typeof connection.downlink === 'number') {
          headers['X-Connection-Downlink'] = connection.downlink.toString();
        }
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
    } catch {
      // WebGL not available or blocked
    }

    // Session ID (generated per session)
    try {
      let sessionId = sessionStorage.getItem('metropolitan_session_id');
      if (!sessionId) {
        sessionId = generateSessionId();
        sessionStorage.setItem('metropolitan_session_id', sessionId);
      }
      headers['X-Session-ID'] = sessionId;
    } catch {
      // Session storage might be blocked
    }

    // Device ID from storage (set after successful auth)
    try {
      const deviceId = localStorage.getItem(DEVICE_ID_KEY);
      if (deviceId) {
        if (isServerGeneratedDeviceId(deviceId)) {
          headers['X-Device-ID'] = deviceId;
        } else {
          // Remove legacy client-side IDs to avoid mismatches
          localStorage.removeItem(DEVICE_ID_KEY);
        }
      }
    } catch {
      // Local storage might be blocked
    }

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
