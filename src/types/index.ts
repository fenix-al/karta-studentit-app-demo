// ─────────────────────────────────────────────────────────────────────────────
// TYPES — Karta e Studentit App
// All shared TypeScript interfaces and types for the entire app.
// ─────────────────────────────────────────────────────────────────────────────

// ── Card item (used for SmartModal + all horizontal/grid cards) ──────────────
export interface CardItem {
  id:           string;
  type:         string;          // 'biznes' | 'punë' | 'startup' | 'kurs' | 'vullnetarizëm' | 'kvr lajm'
  title:        string;
  discount:     string;          // badge label: '-20%', 'Internship', 'Fonde' etc.
  badgeColor:   string;          // hex color for the solid badge
  img:          string;          // image URL
  meta:         string;          // subtitle line under title
  fullDesc:     string;          // full description shown in SmartModal
  actionText:   string;          // CTA button label in SmartModal
  actionIconName: string;        // lucide icon name: 'QrCode' | 'Briefcase' | 'Rocket' etc.
  btnGradient:  [string, string];// [startColor, endColor] for LinearGradient CTA button
  rating?:      string;          // optional — only businesses have ratings
}

// ── Category pill (horizontal scroll at top of home) ─────────────────────────
export interface Category {
  name:     string;
  icon:     string;          // emoji or text symbol
  bgColor:  string;          // hex background
  isText?:  boolean;         // true when icon is a text symbol (%) not emoji
}

// ── Student card (from API /sk/v1/me) ─────────────────────────────────────────
export interface StudentCard {
  id:          number;
  emeri:       string;
  mbiemeri:    string;
  nr_karte:    string;
  nim:         string;
  foto_url:    string;
  valid_until: string;
  statusi:     'active' | 'inactive' | 'pending' | 'expired';
  qr_token:    string;
  student_hash?: string;
  fakulteti:   string;
  programi:    string;
  cikli?:      string;
  datelindja?: string;
  telefoni?:   string;
  email?:      string;
  points:                 number;
  loyal_businesses_count: number;
}

// ── Points log entry (from API /sk/v1/points) ─────────────────────────────────
export interface PointsEntry {
  id:            number;
  business_name: string;
  points_earned: number;
  created_at:    string;
}

// ── Loyalty reward (from API /sk/v1/loyalty) ──────────────────────────────────
export interface LoyaltyReward {
  uid:         string;
  title:       string;
  threshold:   number;
  one_time:    boolean;
  scan_count:  number;
  redeemed:    boolean;
}

export interface LoyaltyBusiness {
  post_id:     number;
  name:        string;
  logo:        string;
  rewards:     LoyaltyReward[];
}

// ── Auth store (Zustand) ───────────────────────────────────────────────────────
export interface AuthState {
  token:      string | null;
  card:       StudentCard | null;
  isLoggedIn: boolean;
  setToken:   (token: string) => void;
  setCard:    (card: StudentCard) => void;
  logout:     () => void;
}

// ── Navigation param list ──────────────────────────────────────────────────────
export type RootTabParamList = {
  Home:     undefined;
  Rewards:  undefined;
  QRCard:   undefined;   // center FAB — opens modal, not a screen
  Actions:  undefined;
  Profile:  undefined;
};

// ── Rewards module ────────────────────────────────────────────────────────────
export interface Raffle {
  id:          string;
  title:       string;
  image:       string;
  cost:        number;
  timeLeft:    string;
  participants:number;
  badgeColor:  string;
  desc:        string;
}

export interface DirectReward {
  id:       string;
  title:    string;
  business: string;
  cost:     number;
  icon:     string;
  bgColor:  string;
  desc:     string;
}

export interface VipRewardItem {
  title:    string;
  required: number;
  current:  number;
  unlocked: boolean;
}

export interface VipStatus {
  id:         string;
  business:   string;
  totalScans: number;
  logo:       string;
  rewards:    VipRewardItem[];
}

// ── Profile / Activity module ─────────────────────────────────────────────────
export interface ProfileApplication {
  id:      number;
  title:   string;
  company: string;
  date:    string;
  status:  string;
  type:    'accepted' | 'pending' | 'rejected';
}

export interface ProfileCourse {
  id:       number;
  title:    string;
  location: string;
  date:     string;
  session:  number;
  status:   string;
  type:     'done' | 'active';
}

export interface ScanHistoryEntry {
  id:     number;
  action: string;
  place:  string;
  date:   string;
  icon:   string;
}

// ── Offers module ─────────────────────────────────────────────────────────────
export interface Business {
  id:              string;
  title:           string;
  category:        string;
  discount:        string;
  badgeColor:      string;   // hex
  rating:          string;
  scans:           number;
  time:            string;
  img:             string;
  desc:            string;
  rules:           string;
  address:         string;
  phone:           string;
  recommendations: number;
  votes:           number;
  distance?:       number | null;  // km from user — present only in location mode
  map_url?:        string;         // sk_google_maps post meta
  review_url?:     string;         // sk_review_link on linked user, falls back to map_url
  has_recommended?:boolean;        // whether current student has already voted
}

export interface CategoryPill {
  id:   string;
  name: string;
  icon: string;
}

// ── KVR module ────────────────────────────────────────────────────────────────
export interface KvrGroup {
  id:       string;
  name:     string;
  iconName: string;   // 'Trophy' | 'Lightbulb' | 'Leaf' | 'Users'
  color:    string;   // icon hex color
  bg:       string;   // background hex
  border:   string;   // border hex
  desc:     string;
}

export interface KvrActivity {
  id:       string;
  title:    string;
  category: string;
  catId:    string;
  date:     string;
  img:      string;
  desc:     string;
  fullDesc: string;
  location: string;
}

// ── ACT4Shkodra / Volunteer module ───────────────────────────────────────────
export interface ActCategory {
  id:   string;
  name: string;
  icon: string;
}

export interface ActActivity {
  id:       string;
  title:    string;
  category: string;
  catId:    string;
  badgeColor: string;   // hex
  dateStr:  string;     // e.g. "20 MAR"
  fullDate: string;
  time:     string;
  location: string;
  img:      string;
  desc:     string;
  fullDesc: string;
}

// ── Startup module ────────────────────────────────────────────────────────────
export interface StartupCategory {
  id:   string;
  name: string;
  icon: string;
}

export interface StartupStep {
  id:    number;
  num:   string;
  title: string;
  desc:  string;
}

export interface StartupItem {
  id:         string;
  title:      string;
  type:       string;
  category:   'thirrje' | 'udhezues';
  badgeBg:    string;
  badgeText:  string;
  badgeBorder:string;
  date:       string;
  img:        string;
  desc:       string;
  fullDesc:   string;
  criteria:   string[];
  actionText: string;
}

// ── Opportunities / Jobs module ───────────────────────────────────────────────
export interface JobCategory {
  id:   string;
  name: string;
  icon: string;
}

export interface JobItem {
  id:         string;
  title:      string;
  company:    string;
  type:       string;
  badgeBg:    string;
  badgeText:  string;
  badgeBorder:string;
  date:       string;
  location:   string;
  salary:     string;
  duration:   string;
  img:        string;
  desc:       string;
}

// ── Courses module ────────────────────────────────────────────────────────────
export interface CourseCategory {
  id:   string;
  name: string;
  icon: string;
}

export interface HowItWorksStep {
  id:    number;
  num:   string;
  title: string;
  desc:  string;
}

export interface CourseItem {
  id:         string;
  title:      string;
  category:   string;
  badgeColor: string;
  date:       string;
  location:   string;
  duration:   string;
  cert:       string;
  seats:      string;
  img:        string;
  desc:       string;
}

// ── Notification ─────────────────────────────────────────────────────────────
export interface AppNotification {
  id:         string;
  type:       'points' | 'job' | 'course' | 'offer' | 'act4';
  title:      string;
  message:    string;
  time:       string;
  isRead:     boolean;
  iconName:   string;   // lucide icon name
  iconColor:  string;   // hex
  iconBg:     string;   // hex background for icon box
  iconBorder: string;   // hex border for icon box
}
