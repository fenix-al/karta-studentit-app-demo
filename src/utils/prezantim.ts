/**
 * Dergon nje komand tek prezantimi live (karta-studentit-prezantim-live-3)
 * kur app-i po ecën brenda iframe-it te prezantimit.
 * Ne iOS / Android nuk bën asgjë.
 */

function isInsideIframe(): boolean {
  return (
    typeof window !== 'undefined' &&
    !!window.parent &&
    window.parent !== (window as Window)
  );
}

/** Ndryshon slidin aktiv ne prezantim (0-based index). */
export function prezSlide(index: number): void {
  if (!isInsideIframe()) return;
  window.parent.postMessage({ type: 'karta-slide', slide: index }, '*');
}

/** Shfaq nje toast-mesazh ne prezantim. */
export function prezToast(message: string): void {
  if (!isInsideIframe()) return;
  window.parent.postMessage({ type: 'karta-toast', message }, '*');
}
