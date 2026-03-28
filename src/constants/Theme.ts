// ─────────────────────────────────────────────────────────────────────────────
// THEME — Karta e Studentit App
// Single source of truth for all colors, typography, spacing, and radii.
// Every component imports from here — never hardcode values elsewhere.
// ─────────────────────────────────────────────────────────────────────────────

export const Colors = {
  // ── Backgrounds ────────────────────────────────────────────────────────────
  appBg:       '#EEF2F7', // outer screen bg (slate-200 equivalent)
  surfaceBg:   '#F7F9FC', // main card/screen surface (off-white)
  white:       '#FFFFFF',
  cardBg:      '#FFFFFF',
  inputBg:     '#FFFFFF',

  // ── Text ───────────────────────────────────────────────────────────────────
  textPrimary:   '#1E293B', // slate-800
  textSecondary: '#64748B', // slate-500
  textMuted:     '#94A3B8', // slate-400

  // ── Brand / Action (Green) ─────────────────────────────────────────────────
  brandGreen:      '#a3e635', // lime-400 — FAB button, SCoins
  brandGreenDark:  '#65a30d', // lime-700 — gradient end
  brandGreenDeep:  '#3f6212', // lime-900 — text on green cards
  brandGreenText:  '#4d7c0f', // lime-800 — secondary text on green
  brandGreenBg:    '#E4F5D4', // green card background
  brandGreenBorder:'#d9f99d', // lime-200 — green card border

  // ── Semantic / UI ──────────────────────────────────────────────────────────
  border:      '#E2E8F0', // slate-200
  borderLight: '#F1F5F9', // slate-100
  shadow:      'rgba(0, 0, 0, 0.06)',
  shadowMd:    'rgba(0, 0, 0, 0.12)',

  // ── Category badge backgrounds (pastel) ────────────────────────────────────
  badgeBgRed:     '#FEF2F2', // red-50
  badgeBgBlue:    '#EFF6FF', // blue-50
  badgeBgPurple:  '#FAF5FF', // purple-50
  badgeBgEmerald: '#ECFDF5', // emerald-50
  badgeBgOrange:  '#FFF7ED', // orange-50
  badgeBgSlate:   '#F1F5F9', // slate-100

  // ── Notification / Status ──────────────────────────────────────────────────
  danger: '#EF4444', // red-500

  // ── Modal overlay ──────────────────────────────────────────────────────────
  modalBg:      '#0B0F19',
  modalOverlay: 'rgba(15, 19, 29, 0.90)',

  // ── Tab bar ────────────────────────────────────────────────────────────────
  tabActive:   '#1E293B', // slate-800
  tabInactive: '#94A3B8', // slate-400
} as const;

// ── Badge hex colors (mapped from Tailwind class names in mock data) ──────────
export const BadgeColors: Record<string, string> = {
  'rose':    '#f43f5e',
  'blue':    '#3b82f6',
  'purple':  '#a855f7',
  'emerald': '#10b981',
  'sky':     '#0ea5e9',
  'orange':  '#f97316',
  'indigo':  '#6366f1',
  'slate':   '#334155',
  'amber':   '#f59e0b',
  'green':   '#22c55e',
  'red':     '#ef4444',
};

export const Typography = {
  // Font family names — loaded via expo-font / @expo-google-fonts/poppins
  fontRegular:    'Poppins_400Regular',
  fontMedium:     'Poppins_500Medium',
  fontSemiBold:   'Poppins_600SemiBold',
  fontBold:       'Poppins_700Bold',
  fontExtraBold:  'Poppins_800ExtraBold',

  // Font sizes (px)
  xs:   10,
  sm:   11,
  base: 13,
  md:   14,
  lg:   16,
  xl:   17,
  xxl:  19,
  h2:   24,
  h1:   28,
} as const;

export const Spacing = {
  xs:  4,
  sm:  8,
  md:  12,
  lg:  16,
  xl:  20,
  xxl: 24,
  xxxl:32,
} as const;

export const Radius = {
  sm:   8,
  md:   12,
  lg:   16,
  xl:   20,
  xxl:  24,
  full: 999,
} as const;

// ── Gradient presets (start, end) for LinearGradient ─────────────────────────
export const Gradients = {
  green:   ['#a3e635', '#65a30d'] as [string, string],
  purple:  ['#a855f7', '#7e22ce'] as [string, string],
  emerald: ['#10b981', '#047857'] as [string, string],
  sky:     ['#0ea5e9', '#2563eb'] as [string, string],
  orange:  ['#fb923c', '#ea580c'] as [string, string],
  indigo:  ['#6366f1', '#4338ca'] as [string, string],
  rose:    ['#f43f5e', '#be123c'] as [string, string],
  slate:   ['#334155', '#0f172a'] as [string, string],
  gold:    ['#facc15', '#f59e0b'] as [string, string],
} as const;
