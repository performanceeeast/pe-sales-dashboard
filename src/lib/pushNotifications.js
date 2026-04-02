/**
 * Push Notification helpers
 * Handles browser push subscription, permission requests, and iOS detection.
 */

export function isPushSupported() {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

export function isIOSSafari() {
  const ua = navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
}

export function isInstalledPWA() {
  return window.matchMedia('(display-mode: standalone)').matches
    || window.navigator.standalone === true;
}

export function getPermissionState() {
  if (!('Notification' in window)) return 'unsupported';
  return Notification.permission; // 'default', 'granted', 'denied'
}

export async function requestPermission() {
  if (!('Notification' in window)) return 'unsupported';
  const result = await Notification.requestPermission();
  return result; // 'granted', 'denied', 'default'
}

/**
 * Show a local notification (no server needed).
 * Used for in-app alerts when the service worker is registered.
 */
export async function showLocalNotification(title, body, options = {}) {
  if (Notification.permission !== 'granted') return;

  const reg = await navigator.serviceWorker?.ready;
  if (reg) {
    reg.showNotification(title, {
      body,
      icon: '/logo.png',
      badge: '/logo.png',
      tag: options.tag || 'peg-' + Date.now(),
      data: options.data || {},
      ...options,
    });
  } else {
    // Fallback: plain Notification API
    new Notification(title, { body, icon: '/logo.png' });
  }
}
