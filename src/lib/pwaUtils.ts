export const ACTIVE_CART_KEY = 'active_cart_id';
export const PWA_BANNER_DISMISSED_KEY = 'orderping_pwa_banner_dismissed';

export const isStandalone = (): boolean =>
  window.matchMedia('(display-mode: standalone)').matches ||
  (navigator as Navigator & { standalone?: boolean }).standalone === true;

export const isIOSDevice = (): boolean =>
  /iPad|iPhone|iPod/.test(navigator.userAgent);

export const isAndroidDevice = (): boolean =>
  /Android/.test(navigator.userAgent);
