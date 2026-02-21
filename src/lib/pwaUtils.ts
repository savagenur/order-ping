export const ACTIVE_CART_KEY = 'active_cart_id';
export const PWA_BANNER_DISMISSED_KEY = 'orderping_pwa_banner_dismissed';
export const USER_ID_KEY = 'orderping_user_id';

export const isStandalone = (): boolean =>
  window.matchMedia('(display-mode: standalone)').matches ||
  (navigator as Navigator & { standalone?: boolean }).standalone === true;

export const isIOSDevice = (): boolean =>
  /iPad|iPhone|iPod/.test(navigator.userAgent);

export const isAndroidDevice = (): boolean =>
  /Android/.test(navigator.userAgent);

/**
 * Returns the persistent anonymous userId for this device.
 * Priority: URL ?user= param → localStorage → newly generated UUID.
 * Always persists the resolved value to localStorage.
 */
export function getOrCreateUserId(): string {
  // 1. Check URL param first (PWA start_url or shared link)
  const urlParams = new URLSearchParams(window.location.search);
  const urlUserId = urlParams.get('user');
  if (urlUserId) {
    localStorage.setItem(USER_ID_KEY, urlUserId);
    return urlUserId;
  }

  // 2. Check localStorage
  const stored = localStorage.getItem(USER_ID_KEY);
  if (stored) return stored;

  // 3. Generate new UUID
  const newId = crypto.randomUUID();
  localStorage.setItem(USER_ID_KEY, newId);
  return newId;
}

/**
 * Injects ?user=<userId> into the current URL via replaceState so that
 * if the user adds the page to their home screen, the start_url captures it.
 * Safe to call multiple times — no-ops if param already matches.
 */
export function injectUserIdIntoUrl(userId: string): void {
  const url = new URL(window.location.href);
  if (url.searchParams.get('user') === userId) return;
  url.searchParams.set('user', userId);
  window.history.replaceState(null, '', url.toString());
}
