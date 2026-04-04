import { CardItem, Business } from '../types';

const PLACEHOLDER = 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=400';

// ── Business (Perfitimet) ─────────────────────────────────────────────────────

// Pick a badge colour based on the discount text
function discountColor(discount: string): string {
  if (!discount) return '#0284c7';
  const d = discount.toLowerCase();
  if (d.includes('falas'))                   return '#16a34a';
  if (d.startsWith('-') && d.includes('%'))  return '#f59e0b';
  if (d.includes('menu') || d.includes('l')) return '#ef4444';
  return '#0284c7';
}

export function apiBizToBusiness(b: any): Business {
  const votes      = Number(b.votes      ?? 0);
  const scan_count = Number(b.scan_count ?? 0);
  return {
    id:              String(b.id ?? ''),
    title:           b.title      ?? '',
    category:        b.categories?.[0] ?? 'Shërbime',
    discount:        b.discount   || 'Zbritje Speciale',
    badgeColor:      discountColor(b.discount ?? ''),
    // Star rating derived from votes (0 votes → default 4.5, caps at 5.0 for 50+ votes)
    rating:          votes > 0 ? (4.0 + Math.min(votes, 50) * 0.02).toFixed(1) : '4.5',
    scans:           scan_count,
    time:            b.loyalty?.min_threshold > 0
                       ? `${b.loyalty.min_threshold} skan → çmim`
                       : 'Hapur',
    // logo is the primary image field in the API; image is the WP featured image fallback
    img:             b.logo || b.image || PLACEHOLDER,
    desc:            b.description ?? '',
    rules:           b.description ?? '',
    address:         b.address  ?? '',
    phone:           b.phone    ?? '',
    recommendations: scan_count,
    votes:           votes,
    distance:        b.distance        ?? null,
    map_url:         b.map_url         ?? '',
    review_url:      b.review_url      ?? '',
    has_recommended: b.has_recommended ?? false,
  };
}

export function businessToCard(b: any): CardItem {
  return {
    id:            String(b.id),
    type:          b.categories?.[0] ?? 'biznes',
    title:         b.title,
    discount:      b.discount || '-10%',
    badgeColor:    '#0284c7',
    img:           b.image || b.logo || PLACEHOLDER,
    meta:          b.address || b.sk_adresa || '',
    fullDesc:      b.description || '',
    actionText:    'Shiko Zbritjen',
    actionIconName:'QrCode',
    btnGradient:   ['#0284c7', '#0369a1'] as [string, string],
    rating:        b.votes ? `${b.votes} vota` : undefined,
  };
}

export function kursToCard(k: any): CardItem {
  return {
    id:            String(k.id),
    type:          'kurs',
    title:         k.title,
    discount:      k.categories?.[0] ?? 'Kurs',
    badgeColor:    '#0891b2',
    img:           k.image || PLACEHOLDER,
    meta:          [k.start_date, k.location, k.total_spots ? `${k.total_spots} vende` : ''].filter(Boolean).join(' · '),
    fullDesc:      k.excerpt || '',
    actionText:    k.is_enrolled ? 'Jeni regjistruar tashme' : 'Regjistrohu',
    actionIconName:'GraduationCap',
    btnGradient:   ['#0891b2', '#0e7490'] as [string, string],
  };
}

export function opportunityToCard(o: any): CardItem {
  const metaParts = [o.company, o.location, o.deadline].filter(Boolean);
  return {
    id:            String(o.id),
    type:          o.types?.[0] ?? 'punë',
    title:         o.title,
    discount:      o.salary || o.types?.[0] || 'Punë',
    badgeColor:    '#0d9488',
    img:           o.image || PLACEHOLDER,
    meta:          metaParts.length ? metaParts.join(' · ') : (o.date || ''),
    fullDesc:      o.excerpt || '',
    actionText:    o.is_applied ? 'Keni aplikuar tashme' : 'Apliko Tani',
    actionIconName:'Briefcase',
    btnGradient:   ['#0d9488', '#0f766e'] as [string, string],
  };
}

export function startupToCard(s: any): CardItem {
  return {
    id:            String(s.id),
    type:          s.type_label ?? 'Startup',
    title:         s.title,
    discount:      s.is_call ? 'Thirrje' : 'Material',
    badgeColor:    '#7c3aed',
    img:           s.image || PLACEHOLDER,
    meta:          s.deadline || s.date || '',
    fullDesc:      s.excerpt || '',
    actionText:    s.is_call ? 'Apliko' : 'Shiko',
    actionIconName:'Rocket',
    btnGradient:   ['#7c3aed', '#6d28d9'] as [string, string],
  };
}

export function act4ToCard(a: any): CardItem {
  return {
    id:            String(a.id),
    type:          'vullnetarizëm',
    title:         a.title,
    discount:      a.category || 'ACT4',
    badgeColor:    '#e11d48',
    img:           a.image || PLACEHOLDER,
    meta:          [a.date, a.location].filter(Boolean).join(' · '),
    fullDesc:      a.excerpt || '',
    actionText:    'Regjistrohu',
    actionIconName:'HandHeart',
    btnGradient:   ['#e11d48', '#be123c'] as [string, string],
  };
}

export function kvrToCard(k: any): CardItem {
  return {
    id:            String(k.id),
    type:          'kvr lajm',
    title:         k.title,
    discount:      k.category || 'KVR',
    badgeColor:    '#1d4ed8',
    img:           k.image || PLACEHOLDER,
    meta:          [k.date, k.location].filter(Boolean).join(' · '),
    fullDesc:      k.excerpt || '',
    actionText:    'Lexo Më Shumë',
    actionIconName:'FileText',
    btnGradient:   ['#1d4ed8', '#1e40af'] as [string, string],
  };
}
