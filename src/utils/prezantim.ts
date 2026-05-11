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

export const PREZ_SLIDES = {
  home: 0,
  digitalCard: 1,
  offers: 2,
  businessProfile: 3,
  recommendation: 4,
  businessReport: 5,
  googleReview: 6,
  mapDirections: 7,
  nearbyOffers: 8,
  appPromotions: 9,
  rewards: 10,
  loyalty: 11,
  raffle: 12,
  courses: 13,
  opportunities: 14,
  startup: 15,
  act4: 16,
  kvr: 17,
  notifications: 18,
  profile: 19,
  support: 20,
  settings: 21,
  bizDashboard: 22,
  bizScanner: 23,
  bizScanSuccess: 24,
  bizCampaign: 25,
  bizProfile: 26,
} as const;

export type PrezSlideKey = keyof typeof PREZ_SLIDES;

export function prezStep(key: PrezSlideKey, toast?: string): void {
  if (isInsideIframe()) {
    window.parent.postMessage({ type: 'karta-action', action: key, slide: PREZ_SLIDES[key] }, '*');
  }
  if (toast) prezToast(toast);
}

/** Shfaq nje toast-mesazh ne prezantim. */
export function prezToast(message: string): void {
  if (!isInsideIframe()) return;
  window.parent.postMessage({ type: 'karta-toast', message }, '*');
}
