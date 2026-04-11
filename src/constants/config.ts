// ─────────────────────────────────────────────────────────────────────────────
// CONFIG — Karta e Studentit App
// ─────────────────────────────────────────────────────────────────────────────

export const API_BASE = 'https://kartaestudentitshkoder.al/wp-json';
export const SK_API   = `${API_BASE}/sk/v1`;
export const JWT_ENDPOINT = `${API_BASE}/jwt-auth/v1/token`;
export const WEB_BASE = API_BASE.replace(/\/wp-json$/, '');
export const PASSWORD_RESET_URL = `${WEB_BASE}/rikupero-fjalekalimin/`;
