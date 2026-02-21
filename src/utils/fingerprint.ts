/**
 * getDeviceFingerprint — generates a stable SHA-256 hash that identifies
 * the same physical device across Safari (browser) and the installed PWA.
 *
 * Inputs (all stable across browser ↔ PWA on the same device):
 *   • Public IP  (via ipify)
 *   • navigator.userAgent
 *   • screen dimensions
 *   • hardware concurrency (CPU cores)
 *   • timezone
 *   • system language
 */
export async function getDeviceFingerprint(): Promise<string> {
  console.log('🔍 Fingerprint: Starting generation...');
  let ip = 'unknown';
  
  // Error resilience: try multiple IP fetch methods with fallbacks
  try {
    console.log('🔍 Fingerprint: Fetching IP from ipify...');
    const res = await fetch('https://api.ipify.org?format=json', {
      signal: AbortSignal.timeout(3000), // Reduced timeout for faster fallback
    });
    const json = await res.json();
    ip = json.ip ?? 'unknown';
    console.log('🔍 Fingerprint: Got IP =', ip);
  } catch (error) {
    console.log('🔍 Fingerprint: IP fetch failed, using fallback (error resilience)');
    // Try alternative IP service as backup
    try {
      console.log('🔍 Fingerprint: Trying backup IP service...');
      const backupRes = await fetch('https://ipapi.co/json/', {
        signal: AbortSignal.timeout(2000),
      });
      const backupJson = await backupRes.json();
      ip = backupJson.ip ?? 'unknown';
      console.log('🔍 Fingerprint: Backup IP =', ip);
    } catch (backupError) {
      console.log('🔍 Fingerprint: Backup IP service also failed, using "unknown"');
      ip = 'unknown';
    }
  }

  const components = [
    ip,
    navigator.userAgent,
    String(window.screen.width),
    String(window.screen.height),
    String(navigator.hardwareConcurrency ?? 0),
    Intl.DateTimeFormat().resolvedOptions().timeZone,
    navigator.language,
  ];
  
  console.log('🔍 Fingerprint: Components =', components);
  const raw = components.join('|');
  console.log('🔍 Fingerprint: Raw string length =', raw.length);

  try {
    const encoded = new TextEncoder().encode(raw);
    const hashBuffer = await crypto.subtle.digest('SHA-256', encoded);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const fingerprint = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    console.log('🔍 Fingerprint: Generated fingerprint =', fingerprint);
    return fingerprint;
  } catch (hashError) {
    console.error('🔍 Fingerprint: Hash generation failed:', hashError);
    // Ultimate fallback: create a simple hash from components
    const simpleHash = components.join('|').split('').reduce((acc, char) => {
      return acc + char.charCodeAt(0);
    }, 0).toString(16);
    console.log('🔍 Fingerprint: Using fallback hash =', simpleHash);
    return simpleHash;
  }
}
