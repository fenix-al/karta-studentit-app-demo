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
  total_scans?:           number;
  act4_activities_count?: number;
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

export interface ProfileApplicationApiItem {
  job_id:   number;
  title:    string;
  company:  string;
  date:     string;
  status:   string;
}

export interface ProfileHistoryApiItem {
  business: string;
  logo:     string | null;
  date:     string;
}

export interface ProfileCourseApiItem {
  course_id:   number;
  title:       string;
  location:    string;
  date:        string;
  session:     number;
  status:      string;
  start_date?: string;
}

export interface ProfileStartupIdeaApiItem {
  idea_id:      number;
  title:        string;
  description:  string;
  help_needed:  string;
  status:       string;
  created_at:   string;
}

export interface ProfileAct4HistoryApiItem {
  id:          string;
  activity_id: number;
  title:       string;
  status:      'registered' | 'attended' | string;
  date:        string;
}

export interface ProfileRaffleEntryApiItem {
  entry_id:    number;
  raffle_id:   number;
  title:       string;
  points_cost: number;
  status:      'active' | 'closed' | string;
  entry_date:  string;
  end_date?:   string | null;
}

export interface LiveRaffleSessionApiItem {
  id:                  number;
  raffle_id:           number;
  raffle_title:        string;
  raffle_excerpt:      string;
  raffle_image:        string | null;
  status:              'scheduled' | 'countdown' | 'live' | 'reveal' | 'finished' | 'cancelled' | string;
  starts_at:           string | null;
  countdown_starts_at: string | null;
  reveal_at:           string | null;
  finished_at:         string | null;
  current_round:       number;
  boxes_count:         number;
  winning_box:         number;
  created_at:          string;
  updated_at:          string;
}

export interface LiveRaffleCurrentApiResponse {
  session: LiveRaffleSessionApiItem | null;
}

export interface LiveRaffleLaunchUrlResponse {
  ok:         boolean;
  can_join:   boolean;
  session_id: number;
  stage:      string;
  launch_url?: string;
  message?:   string;
}


export interface ProfileLoyaltyRedemptionApiItem {
  redemption_id:    number;
  business_post_id: number;
  business_name:    string;
  reward_uid:       string;
  reward_title:     string;
  redeemed_at:      string;
}

export interface SupportTicketApiItem {
  id:             number;
  category:       string;
  category_label: string;
  subject:        string;
  message:        string;
  attachment_url: string | null;
  status:         'open' | 'in_progress' | 'closed' | string;
  status_label:   string;
  admin_reply:    string | null;
  admin_reply_at: string | null;
  created_at:     string;
  updated_at:     string;
  unread_count:   number;
  has_unread:     boolean;
  messages:       SupportTicketMessageApiItem[];
}

export interface SupportTicketMessageApiItem {
  id:             number;
  ticket_id:      number;
  sender_type:    'student' | 'staff' | string;
  sender_name:    string;
  message:        string | null;
  attachment_url: string | null;
  created_at:     string;
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
  content?: string;
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
  content?:   string;
  isCall?:    boolean;
  applyLink?: string | null;
  materials?: Array<{ id: string; title: string; desc: string }>;
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
  typeSlug?:  string;
  typeSlugs?: string[];
  applied?:   boolean;
  applyStatus?: string | null;
  canApply?:  boolean;
  content?:   string;
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
  categories?: string[];
  categorySlugs?: string[];
  totalSpots?: number;
  freeSpots?: number | null;
  isEnrolled?: boolean;
  enrollStatus?: string | null;
  canEnroll?: boolean;
  content?: string;
}

// ── Notification ─────────────────────────────────────────────────────────────
export interface AppNotification {
  id:         string;
  type:       'points' | 'job' | 'course' | 'offer' | 'act4' | 'startup' | 'kvr' | 'raffle' | 'support_ticket' | 'system';
  postId:     number;
  title:      string;
  message:    string;
  time:       string;
  isRead:     boolean;
  iconName:   string;   // lucide icon name
  iconColor:  string;   // hex
  iconBg:     string;   // hex background for icon box
  iconBorder: string;   // hex border for icon box
}

export interface NotificationApiItem {
  id:         number;
  type:       AppNotification['type'];
  title:      string;
  message:    string;
  post_id:    number;
  is_read:    boolean;
  created_at: string;
}

// ── Business Panel ────────────────────────────────────────────────────────────
// Mirrors the exact response shapes returned by /sk/v1/biz/* REST endpoints.

export interface BizProfile {
  user_id:    number;
  name:       string;
  initials:   string;           // e.g. "KR" — max 2 chars
  logo:       string | null;
  adresa:     string;
  telefon:    string;
  zbritja:    string;           // active offer text, e.g. "50% Zbritje"
  post_id:    number | null;    // linked sk_biznese CPT post ID
  is_partner: boolean;          // true when a published sk_biznese post is linked
  stats: {
    sot:   number;   // scans today
    muaj:  number;   // scans this month
    total: number;   // all-time scans
    unik:  number;   // distinct students scanned
  };
}

export interface BizTopStudent {
  card_id:    number;
  name:       string;
  nim:        string;
  scan_count: number;
}

export interface BizCampaign {
  id:          number;
  titulli:     string;
  lloji:       string;
  statusi:     'pending' | 'approved' | 'rejected';
  admin_notes: string | null;
  created_at:  string;
}

export interface BizScanResponse {
  student: string;
  emri: string;
  mbiemeri: string;
  nim: string;
  nr_karte: string;
  foto: string | null;
  msg: string;
  valid?: boolean;
  scan_count?: number;
  last_scan_at?: string;
  next_allowed_at?: string;
  cooldown_seconds?: number;
  retry_after_seconds?: number;
  cooldown_active?: boolean;
}
