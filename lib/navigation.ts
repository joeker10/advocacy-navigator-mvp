import { Browser } from '@capacitor/browser';

/**
 * Safely opens a link in the system browser (Chrome Custom Tabs on Android / Safari on iOS, or new tab on web).
 * Automatically resolves relative paths (e.g. "/home", "/posts", "/downloads", "/tutorials", "/videos", "/help")
 * to the production web domain to prevent reloading the native mobile single-page application.
 */
export async function openExternalUrl(href: string): Promise<void> {
  if (!href) return;

  const fullUrl = href.startsWith('http://') || href.startsWith('https://')
    ? href
    : `https://www.thespecialeducationnavigator.app${href.startsWith('/') ? href : `/${href}`}`;

  const isNative = typeof window !== 'undefined' && (window as any).Capacitor?.isNativePlatform?.();

  if (isNative) {
    try {
      await Browser.open({ url: fullUrl, windowName: '_system' });
      return;
    } catch (err) {
      console.warn('Capacitor Browser.open error, falling back to window.open:', err);
    }
  }

  // Fallback for Web / Desktop browsers
  window.open(fullUrl, '_blank', 'noopener,noreferrer');
}
