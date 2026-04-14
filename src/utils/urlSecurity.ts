import { WEB_BASE } from '../constants/config';

const APP_ALLOWED_HOSTS = new Set(['kartaestudentitshkoder.al', 'www.kartaestudentitshkoder.al']);

try {
  const webHost = new URL(WEB_BASE).hostname.toLowerCase();
  if (webHost) APP_ALLOWED_HOSTS.add(webHost);
} catch (_) {}

export function isAllowedAppUrl(url: string | null | undefined): url is string {
  if (!url) return false;

  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' && APP_ALLOWED_HOSTS.has(parsed.hostname.toLowerCase());
  } catch (_) {
    return false;
  }
}

export function sanitizeAllowedAppUrl(url: string | null | undefined): string | null {
  return isAllowedAppUrl(url) ? url : null;
}

export function escapeHtmlAttribute(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function allowedAppOriginWhitelist(): string[] {
  return Array.from(APP_ALLOWED_HOSTS).map((host) => `https://${host}`);
}
