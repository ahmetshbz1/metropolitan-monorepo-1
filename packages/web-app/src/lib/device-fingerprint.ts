// Device Fingerprinting for Web App
// Browser-based device identification

import { DEVICE_ID_KEY, isServerGeneratedDeviceId } from "./device-id";

/**
 * Get browser and device information for fingerprinting
 */
export async function getDeviceHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {};

  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return headers;
  }

  try {
    // Browser information
    headers["X-Platform"] = "web";
    headers["X-User-Agent"] = navigator.userAgent;
    const platform =
      (navigator as any).userAgentData?.platform || navigator.platform;
    if (platform) {
      headers["X-Device-Model"] = platform;
    }
    if (navigator.appVersion) {
      headers["X-App-Version"] = navigator.appVersion;
    }

    // Screen information
    if (window.screen?.width && window.screen?.height) {
      headers["X-Screen-Resolution"] =
        `${window.screen.width}x${window.screen.height}`;
    }
    headers["X-Viewport-Width"] = window.innerWidth.toString();
    headers["X-Viewport-Height"] = window.innerHeight.toString();

    // Browser features
    headers["X-Language"] = navigator.language;
    if (navigator.languages?.length) {
      headers["X-Languages"] = navigator.languages.join(",");
    }
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (timezone) {
      headers["X-Timezone"] = timezone;
    }
    headers["X-Cookie-Enabled"] = navigator.cookieEnabled.toString();

    // Hardware information (if available)
    if ("hardwareConcurrency" in navigator) {
      headers["X-CPU-Cores"] = navigator.hardwareConcurrency.toString();
    }

    if ("deviceMemory" in navigator) {
      headers["X-Device-Memory"] = (navigator as any).deviceMemory?.toString();
    }

    // Connection information (if available)
    if ("connection" in navigator) {
      const connection = (navigator as any).connection;
      if (connection) {
        if (connection.effectiveType) {
          headers["X-Connection-Type"] = connection.effectiveType;
        }
        if (typeof connection.downlink === "number") {
          headers["X-Connection-Downlink"] = connection.downlink.toString();
        }
      }
    }

    // WebGL fingerprinting (basic)
    try {
      const canvas = document.createElement("canvas");
      const gl =
        canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
      if (gl) {
        const renderer = gl.getParameter(gl.RENDERER);
        const vendor = gl.getParameter(gl.VENDOR);
        if (renderer) headers["X-WebGL-Renderer"] = renderer;
        if (vendor) headers["X-WebGL-Vendor"] = vendor;
      }
    } catch {
      // WebGL not available or blocked
    }

    // Session ID from sessionStorage
    try {
      const sessionId = sessionStorage.getItem("metropolitan_session_id");
      if (sessionId) {
        headers["X-Session-ID"] = sessionId;
      }
    } catch {
      // Session storage might be blocked
    }

    // Device ID from localStorage
    try {
      const deviceId = localStorage.getItem(DEVICE_ID_KEY);
      if (deviceId && isServerGeneratedDeviceId(deviceId)) {
        headers["X-Device-ID"] = deviceId;
      } else if (deviceId) {
        // Remove invalid/legacy device IDs
        localStorage.removeItem(DEVICE_ID_KEY);
      }
    } catch {
      // Local storage might be blocked
    }
  } catch (error) {
    console.warn("Failed to generate device headers:", error);
  }

  return headers;
}

/**
 * Extract session ID from JWT token
 */
export function extractSessionIdFromToken(token: string | null | undefined): string | null {
  if (!token) return null;

  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;

    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padLength = (4 - (base64.length % 4)) % 4;
    const padded = base64 + '='.repeat(padLength);

    const payload = window.atob(padded);
    const data = JSON.parse(payload);

    const sessionId = data?.sessionId;
    return typeof sessionId === 'string' ? sessionId : null;
  } catch (error) {
    console.error('Failed to extract session ID from token:', error);
    return null;
  }
}

/**
 * Save session ID to sessionStorage
 */
export function saveSessionId(sessionId: string): void {
  try {
    sessionStorage.setItem('metropolitan_session_id', sessionId);
  } catch (error) {
    console.error('Failed to save session ID:', error);
  }
}

/**
 * Clear session ID from sessionStorage
 */
export function clearSessionId(): void {
  try {
    sessionStorage.removeItem('metropolitan_session_id');
  } catch (error) {
    console.error('Failed to clear session ID:', error);
  }
}
