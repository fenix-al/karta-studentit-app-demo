// ─────────────────────────────────────────────────────────────────────────────
// CONFIG — Karta e Studentit App
// ─────────────────────────────────────────────────────────────────────────────

// Ne web dev (expo start --web) perdorim proxy lokal per te anashkaluar CORS.
// Ne native (iOS/Android) dhe ne prodhim perdorim URL-n direkte.
const useProxy = typeof document !== 'undefined' && typeof __DEV__ !== 'undefined' && __DEV__;

export const API_BASE = useProxy
  ? 'http://localhost:8090/wp-json'
  : 'https://kartaestudentitshkoder.al/wp-json';
export const SK_API   = `${API_BASE}/sk/v1`;
export const JWT_ENDPOINT = `${API_BASE}/jwt-auth/v1/token`;
export const WEB_BASE = API_BASE.replace(/\/wp-json$/, '');
export const PASSWORD_RESET_URL = `${WEB_BASE}/rikupero-fjalekalimin/`;
export const PRIVACY_POLICY_URL = `${WEB_BASE}/politika-e-privatesise/`;
export const ACCOUNT_DELETION_URL = `${WEB_BASE}/fshirje-llogarie/`;
